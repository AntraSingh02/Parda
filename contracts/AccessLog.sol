// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AccessLog
 * @notice Emits immutable on-chain audit trail events for access grants, revocations,
 * and emergency break-glass requests using ONLY hashed identifiers.
 * Zero plaintext patient names, record CIDs, or diagnoses ever land on-chain.
 */
contract AccessLog {
    // Break-glass emergency permissions (patientHash => expiryTimestamp)
    mapping(bytes32 => uint256) public activeBreakGlass;

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

    /**
     * @notice Log a patient granting time-bound access to a doctor.
     */
    function logAccessGranted(
        bytes32 patientHash,
        bytes32 doctorHash,
        bytes32 recordHash,
        uint256 expiryTimestamp
    ) external {
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
        uint256 expiry = block.timestamp + 24 hours;
        activeBreakGlass[patientHash] = expiry;
        emit BreakGlassTriggered(patientHash, responderHash, reasonHash, expiry);
    }

    function isBreakGlassActive(bytes32 patientHash) external view returns (bool) {
        return activeBreakGlass[patientHash] > block.timestamp;
    }
}
