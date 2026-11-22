const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");
const path = require("path");

async function generateSampleInput() {
    console.log("Generating sample witness input for ClaimVerifier circuit...");
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // 1. Hospital Setup (Merkle tree of depth 4 = 16 leaves)
    const hospitalId = 101n; // Secret ID of the licensed hospital
    const leafHash = poseidon([hospitalId]);

    // Build mock 4-level Merkle path
    let current = leafHash;
    const pathElements = [];
    const pathIndices = [0, 1, 0, 0]; // Leaf is at index in tree

    for (let i = 0; i < 4; i++) {
        const sibling = BigInt(1000 + i * 77);
        pathElements.push(sibling);
        if (pathIndices[i] === 0) {
            current = poseidon([current, sibling]);
        } else {
            current = poseidon([sibling, current]);
        }
    }
    const approvedHospitalRoot = F.toObject(current);

    // 2. Policy & Claim Details
    const policySecret = 987654321n;
    const claimId = 1n;
    const nullifierHash = poseidon([policySecret, claimId]);
    const claimNullifier = F.toObject(nullifierHash);

    const claimAmount = 1500n; // $1,500
    const maxPolicyCoverage = 5000n; // $5,000 policy limit
    const policyExpiryTimestamp = 1893456000n; // Year 2030
    const currentTimestamp = 1732320000n; // Nov 2024

    // 3. Private Medical Details (Hidden from Insurer)
    const procedureCode = 99213n; // E&M Office Visit
    const diagnosisCode = 4019n; // Essential Hypertension

    const circuitInput = {
        claimAmount: claimAmount.toString(),
        maxPolicyCoverage: maxPolicyCoverage.toString(),
        policyExpiryTimestamp: policyExpiryTimestamp.toString(),
        currentTimestamp: currentTimestamp.toString(),
        approvedHospitalRoot: approvedHospitalRoot.toString(),
        claimNullifier: claimNullifier.toString(),
        hospitalId: hospitalId.toString(),
        hospitalPathElements: pathElements.map(x => x.toString()),
        hospitalPathIndices: pathIndices,
        procedureCode: procedureCode.toString(),
        diagnosisCode: diagnosisCode.toString(),
        policySecret: policySecret.toString(),
        claimId: claimId.toString()
    };

    const outputPath = path.join(__dirname, "input.json");
    fs.writeFileSync(outputPath, JSON.stringify(circuitInput, null, 2));
    console.log(`Saved sample input to: ${outputPath}`);
    console.log("Root:", approvedHospitalRoot.toString());
    console.log("Nullifier:", claimNullifier.toString());
    return circuitInput;
}

if (require.main === module) {
    generateSampleInput();
}

module.exports = { generateSampleInput };
