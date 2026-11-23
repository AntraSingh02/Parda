pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";

/*
 * @title MerkleInclusionProof
 * @notice Verifies membership of a leaf in a Merkle tree of arbitrary depth
 */
template MerkleInclusionProof(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal output root;

    signal currentHash[depth + 1];
    currentHash[0] <== leaf;

    component hashers[depth];
    for (var i = 0; i < depth; i++) {
        // Enforce pathIndices[i] is boolean (0 or 1)
        pathIndices[i] * (pathIndices[i] - 1) === 0;

        hashers[i] = Poseidon(2);
        // pathIndices[i] == 0 => hash(currentHash, pathElement)
        // pathIndices[i] == 1 => hash(pathElement, currentHash)
        hashers[i].inputs[0] <== currentHash[i] + pathIndices[i] * (pathElements[i] - currentHash[i]);
        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (currentHash[i] - pathElements[i]);
        currentHash[i + 1] <== hashers[i].out;
    }

    root <== currentHash[depth];
}

/*
 * @title ClaimEligibility
 * @notice 7-Constraint Zero-Knowledge Proof for Privacy-Preserving Health Insurance Claim
 * Proves:
 * 1. Hospital EdDSA signature over claim message is valid under (Ax, Ay).
 * 2. Hospital public key leaf Poseidon(Ax, Ay) exists under approved hospitalRoot.
 * 3. Policy commitment == Poseidon(patientIdHash, coveredSetRoot, policyLimit, policyExpiryDay, policySalt).
 * 4. Procedure code exists in policy's coveredSetRoot.
 * 5. claimAmount <= policyLimit AND claimDay < policyExpiryDay (with 64-bit range checks).
 * 6. nullifier == Poseidon(policySalt, recordId).
 * 7. recipient address is bound to the proof.
 */
template ClaimEligibility(hospitalDepth, procedureDepth) {
    // ==========================================
    // 1. PUBLIC INPUTS
    // ==========================================
    signal input hospitalRoot;
    signal input policyCommitment;
    signal input claimAmount;
    signal input claimDay;
    signal input recipient;

    // ==========================================
    // 2. PRIVATE INPUTS
    // ==========================================
    signal input hospitalAx;
    signal input hospitalAy;
    signal input sigR8x;
    signal input sigR8y;
    signal input sigS;
    signal input hospitalPathElements[hospitalDepth];
    signal input hospitalPathIndices[hospitalDepth];

    signal input recordId;
    signal input patientIdHash;
    signal input procedureCode;
    signal input procedurePathElements[procedureDepth];
    signal input procedurePathIndices[procedureDepth];

    signal input policyLimit;
    signal input policyExpiryDay;
    signal input policySalt;

    // ==========================================
    // 3. OUTPUT
    // ==========================================
    signal output nullifier;

    // ----------------------------------------------------
    // CONSTRAINT 1: EdDSA-Poseidon Hospital Signature
    // msg = Poseidon(recordId, patientIdHash, procedureCode, claimAmount, claimDay, recipient)
    // ----------------------------------------------------
    component msgHasher = Poseidon(6);
    msgHasher.inputs[0] <== recordId;
    msgHasher.inputs[1] <== patientIdHash;
    msgHasher.inputs[2] <== procedureCode;
    msgHasher.inputs[3] <== claimAmount;
    msgHasher.inputs[4] <== claimDay;
    msgHasher.inputs[5] <== recipient;

    component sigVerifier = EdDSAPoseidonVerifier();
    sigVerifier.enabled <== 1;
    sigVerifier.Ax <== hospitalAx;
    sigVerifier.Ay <== hospitalAy;
    sigVerifier.R8x <== sigR8x;
    sigVerifier.R8y <== sigR8y;
    sigVerifier.S <== sigS;
    sigVerifier.M <== msgHasher.out;

    // ----------------------------------------------------
    // CONSTRAINT 2: Hospital Public Key in Approved Hospital Tree
    // leaf = Poseidon(hospitalAx, hospitalAy)
    // ----------------------------------------------------
    component hospitalLeafHasher = Poseidon(2);
    hospitalLeafHasher.inputs[0] <== hospitalAx;
    hospitalLeafHasher.inputs[1] <== hospitalAy;

    component hospitalTree = MerkleInclusionProof(hospitalDepth);
    hospitalTree.leaf <== hospitalLeafHasher.out;
    for (var i = 0; i < hospitalDepth; i++) {
        hospitalTree.pathElements[i] <== hospitalPathElements[i];
        hospitalTree.pathIndices[i] <== hospitalPathIndices[i];
    }
    hospitalTree.root === hospitalRoot;

    // ----------------------------------------------------
    // CONSTRAINT 3 & 4: Procedure in Covered Set & Policy Commitment Check
    // ----------------------------------------------------
    component procedureLeafHasher = Poseidon(1);
    procedureLeafHasher.inputs[0] <== procedureCode;

    component procedureTree = MerkleInclusionProof(procedureDepth);
    procedureTree.leaf <== procedureLeafHasher.out;
    for (var j = 0; j < procedureDepth; j++) {
        procedureTree.pathElements[j] <== procedurePathElements[j];
        procedureTree.pathIndices[j] <== procedurePathIndices[j];
    }
    signal coveredSetRoot;
    coveredSetRoot <== procedureTree.root;

    component policyHasher = Poseidon(5);
    policyHasher.inputs[0] <== patientIdHash;
    policyHasher.inputs[1] <== coveredSetRoot;
    policyHasher.inputs[2] <== policyLimit;
    policyHasher.inputs[3] <== policyExpiryDay;
    policyHasher.inputs[4] <== policySalt;
    policyHasher.out === policyCommitment;

    // ----------------------------------------------------
    // CONSTRAINT 5: 64-bit Range Checks & Rule Verifications
    // claimAmount <= policyLimit AND claimDay < policyExpiryDay
    // ----------------------------------------------------
    component amountBits = Num2Bits(64);
    amountBits.in <== claimAmount;

    component limitBits = Num2Bits(64);
    limitBits.in <== policyLimit;

    component dayBits = Num2Bits(64);
    dayBits.in <== claimDay;

    component expiryBits = Num2Bits(64);
    expiryBits.in <== policyExpiryDay;

    component amountCheck = LessEqThan(64);
    amountCheck.in[0] <== claimAmount;
    amountCheck.in[1] <== policyLimit;
    amountCheck.out === 1;

    component expiryCheck = LessThan(64);
    expiryCheck.in[0] <== claimDay;
    expiryCheck.in[1] <== policyExpiryDay;
    expiryCheck.out === 1;

    // ----------------------------------------------------
    // CONSTRAINT 6: Nullifier Integrity
    // nullifier = Poseidon(policySalt, recordId)
    // ----------------------------------------------------
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== policySalt;
    nullifierHasher.inputs[1] <== recordId;
    nullifier <== nullifierHasher.out;

    // ----------------------------------------------------
    // CONSTRAINT 7: Recipient Address Binding
    // Recipient is signed by the hospital in Constraint 1.
    // The dummy squaring constraint below ensures recipient is retained in the circuit.
    // ----------------------------------------------------
    signal recipientCheck;
    recipientCheck <== recipient * recipient;
}

// Depth 8 for hospitals (up to 256 licensed hospitals)
// Depth 6 for covered procedures (up to 64 covered procedures per policy)
component main {public [hospitalRoot, policyCommitment, claimAmount, claimDay, recipient]} = ClaimEligibility(8, 6);
