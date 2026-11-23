// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuditAnchor
 * @notice Anchors batch Merkle roots of the off-chain tamper-evident audit log onto Ethereum.
 */
contract AuditAnchor is Ownable {
    // Mapping: batchId => batchRoot
    mapping(uint256 => bytes32) public batchRoots;
    uint256 public nextBatchId;

    event AuditBatchAnchored(
        uint256 indexed batchId,
        bytes32 indexed batchRoot,
        uint256 fromId,
        uint256 toId,
        uint256 timestamp
    );

    constructor(address _operator) Ownable(_operator) {}

    /**
     * @notice Anchor an audit log batch on-chain. Restricted to backend operator.
     */
    function anchor(bytes32 batchRoot, uint256 fromId, uint256 toId) external onlyOwner returns (uint256 batchId) {
        batchId = nextBatchId++;
        batchRoots[batchId] = batchRoot;
        emit AuditBatchAnchored(batchId, batchRoot, fromId, toId, block.timestamp);
    }
}
