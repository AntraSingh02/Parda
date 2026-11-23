// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./HospitalRegistry.sol";

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[6] calldata input
    ) external view returns (bool);
}

/**
 * @title ClaimManager
 * @notice Owned by the Insurer. Manages policy registrations, escrow funds,
 * and autonomous zero-knowledge claim settlements.
 */
contract ClaimManager is Ownable, ReentrancyGuard {
    IGroth16Verifier public verifier;
    HospitalRegistry public hospitalRegistry;

    // Conversion rate: Wei per integer rupee (configurable for demo/production)
    uint256 public payoutWeiPerRupee;

    // Configurable maximum claim date age window in days (e.g. 90 days)
    uint256 public maxClaimAgeDays;

    // Registered active policies (policyCommitment => isRegistered)
    mapping(bytes32 => bool) public registeredPolicies;
    mapping(bytes32 => uint256) public policyLimit;
    mapping(bytes32 => uint256) public policySpent;

    // Anti-replay nullifiers (claimNullifier => isSpent)
    mapping(bytes32 => bool) public usedNullifiers;

    // Escrow balance tracking
    uint256 public escrowBalance;

    // Events
    event PolicyRegistered(bytes32 indexed commitment, uint256 registeredAt);
    event EscrowFunded(address indexed insurer, uint256 amount, uint256 newBalance);
    event ClaimVerified(
        bytes32 indexed nullifier,
        bytes32 indexed policyCommitment,
        uint256 claimAmount,
        address indexed recipient,
        uint256 payoutWei,
        uint256 remainingPolicyBalance
    );
    event ConversionRateUpdated(uint256 oldRate, uint256 newRate);

    // Custom Errors
    error StaleOrInvalidHospitalRoot();
    error PolicyNotRegistered();
    error PolicyLimitExceeded();
    error ClaimDateOutOfWindow();
    error NullifierAlreadyUsed();
    error InvalidZKProof();
    error InsufficientEscrowBalance();
    error PayoutTransferFailed();

    constructor(
        address _verifier,
        address _hospitalRegistry,
        uint256 _payoutWeiPerRupee
    ) Ownable(msg.sender) payable {
        verifier = IGroth16Verifier(_verifier);
        hospitalRegistry = HospitalRegistry(_hospitalRegistry);
        payoutWeiPerRupee = _payoutWeiPerRupee;
        maxClaimAgeDays = 90; // Default 90 day window
        if (msg.value > 0) {
            escrowBalance = msg.value;
            emit EscrowFunded(msg.sender, msg.value, escrowBalance);
        }
    }

    /**
     * @notice Deposit funds into the insurer's escrow pool.
     */
    function fund() external payable onlyOwner {
        escrowBalance += msg.value;
        emit EscrowFunded(msg.sender, msg.value, escrowBalance);
    }

    /**
    /**
     * @notice Deposit funds into the escrow pool (callable via MetaMask by insurer).
     */
    function depositPool() external payable {
        escrowBalance += msg.value;
        emit EscrowFunded(msg.sender, msg.value, escrowBalance);
    }

    /**
     * @notice Register an approved policy commitment with total policy limit. Insurer-only.
     */
     */
    function registerPolicy(bytes32 commitment, uint256 limit) external onlyOwner {
        registeredPolicies[commitment] = true;
        policyLimit[commitment] = limit;
        emit PolicyRegistered(commitment, block.timestamp);
    }

    /**
     * @notice Update conversion rate (wei per rupee).
     */
    function setPayoutWeiPerRupee(uint256 _newRate) external onlyOwner {
        emit ConversionRateUpdated(payoutWeiPerRupee, _newRate);
        payoutWeiPerRupee = _newRate;
    }

    /**
     * @notice Autonomous Claim Settlement via Groth16 Zero-Knowledge Proof.
     * @param a Groth16 proof parameter A
     * @param b Groth16 proof parameter B
     * @param c Groth16 proof parameter C
     * @param pubSignals Real signal order:
     *        [0] = nullifier
     *        [1] = hospitalRoot
     *        [2] = policyCommitment
     *        [3] = claimAmount
     *        [4] = claimDay
     *        [5] = recipient
     */
    function submitClaim(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[6] calldata pubSignals
    ) external nonReentrant returns (bytes32) {
        bytes32 nullifier = bytes32(pubSignals[0]);
        bytes32 hospitalRoot = bytes32(pubSignals[1]);
        bytes32 policyCommitment = bytes32(pubSignals[2]);
        uint256 claimAmount = pubSignals[3];
        uint256 claimDay = pubSignals[4];
        address payable recipient = payable(address(uint160(pubSignals[5])));

        // CHECK 1: Hospital root must be active or recent
        if (!hospitalRegistry.isValidRoot(hospitalRoot)) {
            revert StaleOrInvalidHospitalRoot();
        }

        // CHECK 2: Policy commitment must be registered by the insurer
        if (!registeredPolicies[policyCommitment]) {
            revert PolicyNotRegistered();
        }

        // CHECK 2b: Total policy coverage check
        if (policySpent[policyCommitment] + claimAmount > policyLimit[policyCommitment]) {
            revert PolicyLimitExceeded();
        }

        // CHECK 3: Claim day must be within valid date window
        uint256 currentDay = block.timestamp / 1 days;
        if (claimDay > currentDay || (currentDay - claimDay) > maxClaimAgeDays) {
            revert ClaimDateOutOfWindow();
        }

        // CHECK 4: Anti-replay nullifier check
        if (usedNullifiers[nullifier]) {
            revert NullifierAlreadyUsed();
        }

        // CHECK 5: Verify Groth16 pairing proof
        bool proofValid = verifier.verifyProof(a, b, c, pubSignals);
        if (!proofValid) {
            revert InvalidZKProof();
        }

        // CHECK 6: Escrow solvency check using escrowBalance (M4 fix)
        uint256 payoutWei = claimAmount * payoutWeiPerRupee;
        if (escrowBalance < payoutWei) {
            revert InsufficientEscrowBalance();
        }

        // EFFECT: Consume nullifier & track policy spent BEFORE making payout call
        usedNullifiers[nullifier] = true;
        policySpent[policyCommitment] += claimAmount;
        escrowBalance -= payoutWei;

        // INTERACTION: Automatic escrow payout to verified recipient
        (bool success, ) = recipient.call{value: payoutWei}("");
        if (!success) {
            revert PayoutTransferFailed();
        }

        uint256 remainingPolicyBalance = policyLimit[policyCommitment] - policySpent[policyCommitment];
        emit ClaimVerified(nullifier, policyCommitment, claimAmount, recipient, payoutWei, remainingPolicyBalance);
        return nullifier;
    }

    /**
     * @notice Reconcile unaccounted ETH forced into the contract into the escrow balance (M4).
     */
    function reconcileEscrow() external onlyOwner {
        if (address(this).balance > escrowBalance) {
            uint256 diff = address(this).balance - escrowBalance;
            escrowBalance = address(this).balance;
            emit EscrowFunded(msg.sender, diff, escrowBalance);
        }
    }

    receive() external payable {
        escrowBalance += msg.value;
        emit EscrowFunded(msg.sender, msg.value, escrowBalance);
    }
}
