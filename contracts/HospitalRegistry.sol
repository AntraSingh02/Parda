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

    // Grace period for replaced roots (1 day window)
    uint256 public constant ROOT_GRACE_PERIOD = 1 days;
    mapping(bytes32 => uint256) public rootReplacedAt;
    mapping(bytes32 => bool) public isInvalidated;

    // Proposal tracking
    uint256 public lastExecutedProposalId;
    bool public hasExecutedAnyProposal;

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
    event RootInvalidated(bytes32 indexed root, address indexed regulator);

    // Errors
    error NotRegulator();
    error AlreadyApproved();
    error ProposalAlreadyExecuted();
    error InvalidProposalId();
    error InvalidRegulator();
    error InvalidRoot();
    error StaleProposal();

    modifier onlyRegulator() {
        if (!isRegulator(msg.sender)) {
            revert NotRegulator();
        }
        _;
    }

    constructor(address[3] memory _regulators, bytes32 _initialRoot) {
        if (
            _regulators[0] == address(0) ||
            _regulators[1] == address(0) ||
            _regulators[2] == address(0) ||
            _regulators[0] == _regulators[1] ||
            _regulators[0] == _regulators[2] ||
            _regulators[1] == _regulators[2]
        ) {
            revert InvalidRegulator();
        }
        if (_initialRoot == bytes32(0)) {
            revert InvalidRoot();
        }
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
        if (newRoot == bytes32(0)) {
            revert InvalidRoot();
        }
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
        if (hasExecutedAnyProposal && proposalId < lastExecutedProposalId) {
            revert StaleProposal();
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
            rootReplacedAt[oldRoot] = block.timestamp;
            prop.executed = true;
            lastExecutedProposalId = proposalId;
            hasExecutedAnyProposal = true;

            emit RootUpdated(oldRoot, currentRoot, proposalId);
        }
    }

    /**
     * @notice Emergency immediate invalidation of a compromised root by any regulator (C4).
     */
    function invalidateRoot(bytes32 root) external onlyRegulator {
        isInvalidated[root] = true;
        emit RootInvalidated(root, msg.sender);
    }

    /**
     * @notice Checks if a given root is currently active or within the 1-day grace period.
     */
    function isValidRoot(bytes32 root) external view returns (bool) {
        if (root == bytes32(0) || isInvalidated[root]) {
            return false;
        }
        if (root == currentRoot) {
            return true;
        }
        if (isRecentRoot[root]) {
            uint256 replacedTime = rootReplacedAt[root];
            if (replacedTime > 0 && block.timestamp <= replacedTime + ROOT_GRACE_PERIOD) {
                return true;
            }
        }
        return false;
    }
}
