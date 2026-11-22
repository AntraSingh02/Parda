// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AccessRegistry
 * @notice Manages off-chain health record access permissions, time-bound grants,
 * and emergency "break-glass" responder events with an immutable on-chain audit trail.
 */
contract AccessRegistry is Ownable {
    struct AccessPermission {
        bool isGranted;
        uint256 expiryTimestamp; // 0 = permanent until revoked, > 0 = time-bound
        uint256 grantedAt;
    }

    // Mapping: patientAddress => doctorAddress => recordCID => AccessPermission
    mapping(address => mapping(address => mapping(string => AccessPermission))) public permissions;

    // Authorized emergency responders (e.g., registered EMTs, ER departments)
    mapping(address => bool) public authorizedResponders;

    // Audit Trail Events
    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        string recordCid,
        uint256 expiryTimestamp
    );

    event AccessRevoked(
        address indexed patient,
        address indexed doctor,
        string recordCid
    );

    event RecordAccessChecked(
        address indexed patient,
        address indexed accessor,
        string recordCid,
        bool accessAllowed,
        uint256 timestamp
    );

    event EmergencyBreakGlass(
        address indexed patient,
        address indexed responder,
        string reason,
        uint256 timestamp
    );

    event ResponderAuthorized(address indexed responder, bool status);

    error Unauthorized();
    error AccessExpired();
    error AccessNotGranted();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set authorized status for emergency responders (EMTs/ERs).
     */
    function setResponderAuthorization(address responder, bool status) external onlyOwner {
        authorizedResponders[responder] = status;
        emit ResponderAuthorized(responder, status);
    }

    /**
     * @notice Patient grants access to a specific doctor for an encrypted health record.
     * @param doctor Address of the doctor/hospital.
     * @param recordCid IPFS CID of the encrypted record.
     * @param durationSeconds Validity duration (pass 0 for indefinite until revoked).
     */
    function grantAccess(
        address doctor,
        string calldata recordCid,
        uint256 durationSeconds
    ) external {
        uint256 expiry = durationSeconds == 0 ? 0 : block.timestamp + durationSeconds;
        permissions[msg.sender][doctor][recordCid] = AccessPermission({
            isGranted: true,
            expiryTimestamp: expiry,
            grantedAt: block.timestamp
        });

        emit AccessGranted(msg.sender, doctor, recordCid, expiry);
    }

    /**
     * @notice Patient revokes access from a doctor.
     */
    function revokeAccess(address doctor, string calldata recordCid) external {
        delete permissions[msg.sender][doctor][recordCid];
        emit AccessRevoked(msg.sender, doctor, recordCid);
    }

    /**
     * @notice Check if a doctor has active access to a patient's record.
     * Emits an on-chain audit trail event.
     */
    function verifyAndLogAccess(
        address patient,
        address doctor,
        string calldata recordCid
    ) external returns (bool) {
        AccessPermission memory p = permissions[patient][doctor][recordCid];

        bool valid = false;
        if (p.isGranted) {
            if (p.expiryTimestamp == 0 || block.timestamp <= p.expiryTimestamp) {
                valid = true;
            }
        }

        emit RecordAccessChecked(patient, doctor, recordCid, valid, block.timestamp);
        return valid;
    }

    /**
     * @notice Emergency "Break-Glass" access for responders when a patient is incapacitated.
     * Fully logged on-chain for post-incident medical audits.
     */
    function emergencyBreakGlass(
        address patient,
        string calldata reason
    ) external {
        // Must be authorized responder or emit high-severity audit log
        emit EmergencyBreakGlass(patient, msg.sender, reason, block.timestamp);
    }
}
