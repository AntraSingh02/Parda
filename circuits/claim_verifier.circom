pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * @title ClaimVerifier
 * @notice Proves that an insurance claim is valid without revealing:
 * - Diagnosis code
 * - Procedure code
 * - Prescriptions
 * - Treatment history
 * - Policy secret & Hospital internal ID
 */
template ClaimVerifier(merkleDepth) {
    // ==========================================
    // 1. PUBLIC SIGNALS (Visible On-Chain & to Insurer)
    // ==========================================
    signal input claimAmount;
    signal input maxPolicyCoverage;
    signal input policyExpiryTimestamp;
    signal input currentTimestamp;
    signal input approvedHospitalRoot;
    signal input claimNullifier;

    // ==========================================
    // 2. PRIVATE SIGNALS (Hidden in Zero-Knowledge)
    // ==========================================
    signal input hospitalId;
    signal input hospitalPathElements[merkleDepth];
    signal input hospitalPathIndices[merkleDepth];
    signal input procedureCode;
    signal input diagnosisCode;
    signal input policySecret;
    signal input claimId;

    // ==========================================
    // 3. CONSTRAINT: Claim Amount <= Policy Coverage
    // ==========================================
    component amountCheck = LessEqThan(64);
    amountCheck.in[0] <== claimAmount;
    amountCheck.in[1] <== maxPolicyCoverage;
    amountCheck.out === 1;

    // ==========================================
    // 4. CONSTRAINT: Current Date <= Policy Expiration
    // ==========================================
    component expiryCheck = LessEqThan(64);
    expiryCheck.in[0] <== currentTimestamp;
    expiryCheck.in[1] <== policyExpiryTimestamp;
    expiryCheck.out === 1;

    // ==========================================
    // 5. CONSTRAINT: Nullifier Integrity
    // Nullifier = Poseidon(policySecret, claimId)
    // Prevents replay/double claims on-chain
    // ==========================================
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== policySecret;
    nullifierHasher.inputs[1] <== claimId;
    nullifierHasher.out === claimNullifier;

    // ==========================================
    // 6. CONSTRAINT: Hospital Membership Merkle Proof
    // Proves hospital is on the approved licensed list
    // ==========================================
    signal currentHash[merkleDepth + 1];
    component leafHasher = Poseidon(1);
    leafHasher.inputs[0] <== hospitalId;
    currentHash[0] <== leafHasher.out;

    component hashers[merkleDepth];
    for (var i = 0; i < merkleDepth; i++) {
        hashers[i] = Poseidon(2);
        // If hospitalPathIndices[i] == 0: hash(currentHash, pathElement)
        // If hospitalPathIndices[i] == 1: hash(pathElement, currentHash)
        hashers[i].inputs[0] <== currentHash[i] + hospitalPathIndices[i] * (hospitalPathElements[i] - currentHash[i]);
        hashers[i].inputs[1] <== hospitalPathElements[i] + hospitalPathIndices[i] * (currentHash[i] - hospitalPathElements[i]);
        currentHash[i + 1] <== hashers[i].out;
    }

    // Merkle root must match the public approved root
    currentHash[merkleDepth] === approvedHospitalRoot;

    // ==========================================
    // 7. CONSTRAINT: Valid Procedure & Diagnosis Present
    // Proves valid non-zero medical codes were entered without exposing them
    // ==========================================
    component procedureCheck = GreaterThan(32);
    procedureCheck.in[0] <== procedureCode;
    procedureCheck.in[1] <== 0;
    procedureCheck.out === 1;

    component diagnosisCheck = GreaterThan(32);
    diagnosisCheck.in[0] <== diagnosisCode;
    diagnosisCheck.in[1] <== 0;
    diagnosisCheck.out === 1;
}

// Instantiate with depth 4 (up to 16 hospitals for fast hackathon proving)
component main {public [claimAmount, maxPolicyCoverage, policyExpiryTimestamp, currentTimestamp, approvedHospitalRoot, claimNullifier]} = ClaimVerifier(4);
