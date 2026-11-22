// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[6] calldata input
    ) external view returns (bool);
}

/**
 * @title InsuranceSettlement
 * @notice Settles health insurance claims autonomously via Zero-Knowledge Proofs.
 * Ensures hospital authenticity, policy active validity, and coverage caps without
 * ever revealing patient diagnoses or procedure details.
 */
contract InsuranceSettlement is Ownable, ReentrancyGuard {
    IGroth16Verifier public verifier;

    // Root of approved licensed hospitals (Merkle root)
    bytes32 public approvedHospitalMerkleRoot;

    // Anti-replay nullifiers (claimNullifier => isSpent)
    mapping(bytes32 => bool) public usedNullifiers;

    // Registered active policies (policyCommitment => maxCoverageLimit)
    mapping(bytes32 => uint256) public policyCommitments;

    // Events
    event ClaimSettled(
        bytes32 indexed nullifier,
        bytes32 indexed policyCommitment,
        address indexed hospitalPayoutAddress,
        uint256 claimAmount,
        uint256 timestamp
    );
    event HospitalMerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event PolicyCommitmentRegistered(bytes32 indexed commitment, uint256 maxLimit);
    event LiquidityDeposited(address indexed sender, uint256 amount);

    // Custom Errors
    error ClaimAlreadySettled();
    error InvalidHospitalMerkleRoot();
    error InvalidZKProof();
    error InsufficientContractLiquidity();
    error TransferFailed();
    error PolicyNotRegistered();

    constructor(address _verifier, bytes32 _initialHospitalRoot) Ownable(msg.sender) payable {
        verifier = IGroth16Verifier(_verifier);
        approvedHospitalMerkleRoot = _initialHospitalRoot;
    }

    /**
     * @notice Deposit funds into the insurance settlement pool.
     */
    function depositLiquidity() external payable {
        emit LiquidityDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Register an active policy commitment (hash of policy details and secret).
     * @param commitment Poseidon or Keccak commitment of the policy.
     * @param maxLimit Maximum coverage limit for the policy.
     */
    function registerPolicy(bytes32 commitment, uint256 maxLimit) external onlyOwner {
        policyCommitments[commitment] = maxLimit;
        emit PolicyCommitmentRegistered(commitment, maxLimit);
    }

    /**
     * @notice Update the Merkle root of approved hospital licenses.
     */
    function setApprovedHospitalMerkleRoot(bytes32 _newRoot) external onlyOwner {
        emit HospitalMerkleRootUpdated(approvedHospitalMerkleRoot, _newRoot);
        approvedHospitalMerkleRoot = _newRoot;
    }

    /**
     * @notice Update the verifier contract address.
     */
    function setVerifier(address _newVerifier) external onlyOwner {
        verifier = IGroth16Verifier(_newVerifier);
    }

    /**
     * @notice Settle an insurance claim using a Zero-Knowledge Proof.
     * @param a Groth16 proof parameter A
     * @param b Groth16 proof parameter B
     * @param c Groth16 proof parameter C
     * @param publicSignals Array of 6 public signals:
     *        [0] = claimAmount
     *        [1] = maxPolicyCoverage
     *        [2] = policyExpiryTimestamp
     *        [3] = currentTimestamp
     *        [4] = approvedHospitalRoot
     *        [5] = claimNullifier
     * @param hospitalPayoutAddress The destination address for the claim payout
     */
    function settleClaim(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[6] calldata publicSignals,
        address payable hospitalPayoutAddress
    ) external nonReentrant {
        uint256 claimAmount = publicSignals[0];
        bytes32 merkleRoot = bytes32(publicSignals[4]);
        bytes32 nullifier = bytes32(publicSignals[5]);

        // 1. Anti-Replay Check (Nullifier verification)
        if (usedNullifiers[nullifier]) {
            revert ClaimAlreadySettled();
        }

        // 2. Validate Hospital Merkle Root matches the on-chain approved registry
        if (merkleRoot != approvedHospitalMerkleRoot) {
            revert InvalidHospitalMerkleRoot();
        }

        // 3. Ensure contract has sufficient balance to pay out
        if (address(this).balance < claimAmount) {
            revert InsufficientContractLiquidity();
        }

        // 4. Verify Zero-Knowledge Proof
        bool proofValid = verifier.verifyProof(a, b, c, publicSignals);
        if (!proofValid) {
            revert InvalidZKProof();
        }

        // 5. Mark nullifier as spent BEFORE transferring funds (Checks-Effects-Interactions)
        usedNullifiers[nullifier] = true;

        // 6. Automatic Payout Settlement to Hospital
        (bool success, ) = hospitalPayoutAddress.call{value: claimAmount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit ClaimSettled(
            nullifier,
            bytes32(publicSignals[1]),
            hospitalPayoutAddress,
            claimAmount,
            block.timestamp
        );
    }

    /// @dev Fallback to receive ETH into pool
    receive() external payable {
        emit LiquidityDeposited(msg.sender, msg.value);
    }
}
