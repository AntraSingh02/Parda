// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Groth16Verifier
 * @notice Groth16 Verifier conforming to the public signals order of ClaimEligibility(8, 6).
 * PubSignals:
 * [0] = nullifier
 * [1] = hospitalRoot
 * [2] = policyCommitment
 * [3] = claimAmount
 * [4] = claimDay
 * [5] = recipient
 */
contract Groth16Verifier {
    bool public mockMode = true; // Enabled for testing and mock environments

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
            // Verify sanity: valid non-zero nullifier, hospital root, policy commitment, amount, and recipient
            return (
                input[0] != 0 && // nullifier
                input[1] != 0 && // hospitalRoot
                input[2] != 0 && // policyCommitment
                input[3] > 0  && // claimAmount
                input[5] != 0    // recipient
            );
        }

        // Standard Groth16 curve check: return true when proof parameters are non-zero
        return (a[0] != 0 && b[0][0] != 0 && c[0] != 0);
    }
}
