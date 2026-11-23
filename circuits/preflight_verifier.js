const { getPoseidon, getEddsa } = require("./zk_helpers");

/**
 * Pre-flight Verifier: Evaluates the exact mathematical constraints of ClaimEligibility.circom
 * Used by hospital billing pre-flight and red-team unit testing.
 */
async function verifyClaimPreflight(witnessInput) {
    const poseidon = await getPoseidon();
    const eddsa = await getEddsa();
    const F = poseidon.F;

    const errors = [];

    // 1. Check Hospital Signature
    const msgHash = poseidon([
        BigInt(witnessInput.recordId),
        BigInt(witnessInput.patientIdHash),
        BigInt(witnessInput.procedureCode),
        BigInt(witnessInput.claimAmount),
        BigInt(witnessInput.claimDay)
    ]);

    const pubKey = [
        F.e(witnessInput.hospitalAx),
        F.e(witnessInput.hospitalAy)
    ];

    const sig = {
        R8: [F.e(witnessInput.sigR8x), F.e(witnessInput.sigR8y)],
        S: BigInt(witnessInput.sigS)
    };

    const isSigValid = eddsa.verifyPoseidon(msgHash, sig, pubKey);
    if (!isSigValid) {
        errors.push("RULE_1_FAILED: Invalid hospital EdDSA signature over claim message");
    }

    // 2. Check Hospital in Approved Merkle Tree
    const hospitalLeaf = poseidon([
        BigInt(witnessInput.hospitalAx),
        BigInt(witnessInput.hospitalAy)
    ]);

    let currHospital = hospitalLeaf;
    for (let i = 0; i < witnessInput.hospitalPathElements.length; i++) {
        const sibling = BigInt(witnessInput.hospitalPathElements[i]);
        const isRight = witnessInput.hospitalPathIndices[i];
        if (isRight === 0) {
            currHospital = poseidon([currHospital, sibling]);
        } else {
            currHospital = poseidon([sibling, currHospital]);
        }
    }
    const computedHospitalRoot = F.toObject(currHospital).toString();
    if (computedHospitalRoot !== witnessInput.hospitalRoot.toString()) {
        errors.push(`RULE_2_FAILED: Hospital is not in approved registry root (expected ${witnessInput.hospitalRoot}, got ${computedHospitalRoot})`);
    }

    // 3 & 4. Check Procedure in Covered Set & Policy Commitment
    const procedureLeaf = poseidon([BigInt(witnessInput.procedureCode)]);
    let currProc = procedureLeaf;
    for (let j = 0; j < witnessInput.procedurePathElements.length; j++) {
        const sibling = BigInt(witnessInput.procedurePathElements[j]);
        const isRight = witnessInput.procedurePathIndices[j];
        if (isRight === 0) {
            currProc = poseidon([currProc, sibling]);
        } else {
            currProc = poseidon([sibling, currProc]);
        }
    }
    const computedCoveredSetRoot = F.toObject(currProc).toString();

    const computedPolicyCommitment = F.toObject(poseidon([
        BigInt(witnessInput.patientIdHash),
        BigInt(computedCoveredSetRoot),
        BigInt(witnessInput.policyLimit),
        BigInt(witnessInput.policyExpiryDay),
        BigInt(witnessInput.policySalt)
    ])).toString();

    if (computedPolicyCommitment !== witnessInput.policyCommitment.toString()) {
        errors.push(`RULE_3_4_FAILED: Procedure code is uncovered or policy commitment mismatch`);
    }

    // 5. Amount & Expiry Limits
    if (BigInt(witnessInput.claimAmount) > BigInt(witnessInput.policyLimit)) {
        errors.push(`RULE_5_FAILED: Claim amount (${witnessInput.claimAmount}) exceeds policy limit (${witnessInput.policyLimit})`);
    }

    if (BigInt(witnessInput.claimDay) >= BigInt(witnessInput.policyExpiryDay)) {
        errors.push(`RULE_5_FAILED: Policy expired on day ${witnessInput.policyExpiryDay}, claim submitted on day ${witnessInput.claimDay}`);
    }

    // 6. Nullifier Integrity
    const expectedNullifier = F.toObject(poseidon([
        BigInt(witnessInput.policySalt),
        BigInt(witnessInput.recordId)
    ])).toString();

    if (witnessInput.nullifier && witnessInput.nullifier.toString() !== expectedNullifier) {
        errors.push(`RULE_6_FAILED: Invalid claim nullifier`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        nullifier: expectedNullifier,
        hospitalRoot: computedHospitalRoot,
        policyCommitment: computedPolicyCommitment
    };
}

module.exports = { verifyClaimPreflight };
