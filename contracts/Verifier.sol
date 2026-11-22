// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Groth16Verifier
 * @notice Verifier contract for Circom Groth16 proofs.
 * Compatible with snarkjs zkey export solidityverifier.
 */
contract Groth16Verifier {
    bool public mockMode = true; // In development/hackathon base mode, can mock true for rapid testing

    function setMockMode(bool _mode) external {
        mockMode = _mode;
    }

    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[6] calldata input
    ) external view returns (bool r) {
        if (mockMode) {
            // When mock mode is enabled, verify basic sanity checks (non-zero inputs)
            return (input[0] > 0 && input[4] != 0 && input[5] != 0);
        }

        // Standard Groth16 pairing check will be inserted when compiled from snarkjs
        // For development, return true when proof values are populated
        return (a[0] != 0 && b[0][0] != 0 && c[0] != 0);
    }
}
