// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HospitalRegistry
 * @notice Multi-signature approved licensed hospital Merkle root registry.
 * Managed by simulated regulator accounts requiring 2-of-3 consensus to propose and activate roots.
 */
contract HospitalRegistry {
    // Regulators list (3 simulated regulators)
    address[3] public regulators;
    uint256 public constant REQUIRED_APPROVALS = 2;

    // Active approved hospital Merkle root
    bytes32 public currentRoot;

    // Short history of recent roots (root => isValid)
    mapping(bytes32 => bool) public isRecentRoot;
    bytes32[] public rootHistory;

    struct Proposal {
        bytes32 proposedRoot;
        address proposer;
        uint256 approvalCount;
        bool executed;
    }

    Proposal[] public proposals;
    // proposalId => regulatorAddress => hasApproved
    mapping(uint256 => mapping(address => bool)) public approvals;

    // Events
    event RootProposed(uint256 indexed proposalId, bytes32 indexed proposedRoot, address indexed proposer);
    event ProposalApproved(uint256 indexed proposalId, address indexed regulator, uint256 currentApprovals);
    event RootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot, uint256 proposalId);

    // Errors
    error NotRegulator();
    error AlreadyApproved();
    error ProposalAlreadyExecuted();
    error InvalidProposalId();

    modifier onlyRegulator() {
        if (!isRegulator(msg.sender)) {
            revert NotRegulator();
        }
        _;
    }

    constructor(address[3] memory _regulators, bytes32 _initialRoot) {
        regulators = _regulators;
        currentRoot = _initialRoot;
        isRecentRoot[_initialRoot] = true;
        rootHistory.push(_initialRoot);
    }

    function isRegulator(address account) public view returns (bool) {
        return (account == regulators[0] || account == regulators[1] || account == regulators[2]);
    }

    /**
     * @notice Propose a new approved hospital Merkle root. Automatically registers proposer's vote.
     */
    function proposeRoot(bytes32 newRoot) external onlyRegulator returns (uint256 proposalId) {
        proposalId = proposals.length;
        proposals.push(Proposal({
            proposedRoot: newRoot,
            proposer: msg.sender,
            approvalCount: 1,
            executed: false
        }));

        approvals[proposalId][msg.sender] = true;
        emit RootProposed(proposalId, newRoot, msg.sender);
    }

    /**
     * @notice Approve a proposed root. If 2-of-3 threshold is reached, updates the active root.
     */
    function approveRoot(uint256 proposalId) external onlyRegulator {
        if (proposalId >= proposals.length) {
            revert InvalidProposalId();
        }
        Proposal storage prop = proposals[proposalId];
        if (prop.executed) {
            revert ProposalAlreadyExecuted();
        }
        if (approvals[proposalId][msg.sender]) {
            revert AlreadyApproved();
        }

        approvals[proposalId][msg.sender] = true;
        prop.approvalCount++;

        emit ProposalApproved(proposalId, msg.sender, prop.approvalCount);

        if (prop.approvalCount >= REQUIRED_APPROVALS) {
            bytes32 oldRoot = currentRoot;
            currentRoot = prop.proposedRoot;
            isRecentRoot[currentRoot] = true;
            rootHistory.push(currentRoot);
            prop.executed = true;

            emit RootUpdated(oldRoot, currentRoot, proposalId);
        }
    }

    /**
     * @notice Checks if a given root is currently active or among recent historical roots.
     */
    function isValidRoot(bytes32 root) external view returns (bool) {
        return (root == currentRoot || isRecentRoot[root]);
    }
}
