// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AccessLog
 * @notice Emits immutable on-chain audit trail events for access grants, revocations,
 * and emergency break-glass requests using ONLY hashed identifiers.
 * Zero plaintext patient names, record CIDs, or diagnoses ever land on-chain.
 */
contract AccessLog is Ownable {
    // Break-glass emergency permissions (patientHash => expiryTimestamp)
    mapping(bytes32 => uint256) public activeBreakGlass;
    mapping(bytes32 => address) public breakGlassResponder;

    // Authorized emergency responders (e.g., registered EMTs, ER departments)
    mapping(address => bool) public authorizedResponders;

    // Ownership binding: patientHash => patientAddress
    mapping(bytes32 => address) public patientOwners;

    event AccessGranted(
        bytes32 indexed patientHash,
        bytes32 indexed doctorHash,
        bytes32 indexed recordHash,
        uint256 expiryTimestamp
    );

    event AccessRevoked(
        bytes32 indexed patientHash,
        bytes32 indexed doctorHash,
        bytes32 indexed recordHash,
        uint256 timestamp
    );

    event BreakGlassTriggered(
        bytes32 indexed patientHash,
        bytes32 indexed responderHash,
        bytes32 reasonHash,
        uint256 expiryTimestamp
    );

    event ResponderAuthorized(address indexed responder, bool status);
    event PatientRegistered(bytes32 indexed patientHash, address indexed patient);

    error NotAuthorizedResponder();
    error NotPatient();

    constructor() Ownable(msg.sender) {}

    function setAuthorizedResponder(address responder, bool status) external onlyOwner {
        authorizedResponders[responder] = status;
        emit ResponderAuthorized(responder, status);
    }

    function registerPatient(bytes32 patientHash) external {
        if (patientOwners[patientHash] == address(0)) {
            patientOwners[patientHash] = msg.sender;
            emit PatientRegistered(patientHash, msg.sender);
        } else if (patientOwners[patientHash] != msg.sender) {
            revert NotPatient();
        }
    }

    /**
     * @notice Log a patient granting time-bound access to a doctor.
     */
    function logAccessGranted(
        bytes32 patientHash,
        bytes32 doctorHash,
        bytes32 recordHash,
        uint256 expiryTimestamp
    ) external {
        if (patientOwners[patientHash] == address(0)) {
            patientOwners[patientHash] = msg.sender;
        } else if (patientOwners[patientHash] != msg.sender) {
            revert NotPatient();
        }
        emit AccessGranted(patientHash, doctorHash, recordHash, expiryTimestamp);
    }

    /**
     * @notice Log an access revocation.
     */
    function logAccessRevoked(
        bytes32 patientHash,
        bytes32 doctorHash,
        bytes32 recordHash
    ) external {
        if (patientOwners[patientHash] == address(0)) {
            patientOwners[patientHash] = msg.sender;
        } else if (patientOwners[patientHash] != msg.sender) {
            revert NotPatient();
        }
        emit AccessRevoked(patientHash, doctorHash, recordHash, block.timestamp);
    }

    /**
     * @notice Emergency Break-Glass access for unconscious or acute trauma patients.
     * Grants a 24-hour temporary access window and permanently records the incident.
     */
    function triggerBreakGlass(
        bytes32 patientHash,
        bytes32 responderHash,
        bytes32 reasonHash
    ) external {
        if (!authorizedResponders[msg.sender]) {
            revert NotAuthorizedResponder();
        }
        uint256 expiry = block.timestamp + 24 hours;
        activeBreakGlass[patientHash] = expiry;
        breakGlassResponder[patientHash] = msg.sender;
        emit BreakGlassTriggered(patientHash, responderHash, reasonHash, expiry);
    }

    function isBreakGlassActive(bytes32 patientHash) external view returns (bool) {
        return activeBreakGlass[patientHash] > block.timestamp;
    }
}
