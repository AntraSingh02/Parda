const { buildPoseidon, buildEddsa } = require("circomlibjs");

let poseidonInstance = null;
let eddsaInstance = null;

async function getPoseidon() {
    if (!poseidonInstance) {
        poseidonInstance = await buildPoseidon();
    }
    return poseidonInstance;
}

async function getEddsa() {
    if (!eddsaInstance) {
        eddsaInstance = await buildEddsa();
    }
    return eddsaInstance;
}

/**
 * Builds a binary Merkle tree with Poseidon hash up to specified depth
 */
async function buildMerkleTree(leaves, depth) {
    const poseidon = await getPoseidon();
    const F = poseidon.F;
    const totalLeaves = 2 ** depth;
    const tree = [[]];

    // Pad leaves with zeroes to totalLeaves
    for (let i = 0; i < totalLeaves; i++) {
        if (i < leaves.length) {
            tree[0].push(BigInt(leaves[i]));
        } else {
            tree[0].push(0n);
        }
    }

    // Build levels upwards
    for (let level = 0; level < depth; level++) {
        const nextLevel = [];
        for (let i = 0; i < tree[level].length; i += 2) {
            const left = tree[level][i];
            const right = tree[level][i + 1];
            const parent = poseidon([left, right]);
            nextLevel.push(F.toObject(parent));
        }
        tree.push(nextLevel);
    }

    const root = tree[depth][0];
    return { tree, root };
}

/**
 * Computes Merkle proof (pathElements and pathIndices) for a given leaf index
 */
async function getMerkleProof(treeData, leafIndex, depth) {
    const pathElements = [];
    const pathIndices = [];
    let currentIndex = leafIndex;

    for (let level = 0; level < depth; level++) {
        const isRight = currentIndex % 2;
        const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
        pathElements.push(treeData.tree[level][siblingIndex].toString());
        pathIndices.push(isRight);
        currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathElements, pathIndices, root: treeData.root.toString() };
}

/**
 * Generates an issued policy credential with covered procedures Merkle root
 */
async function createPolicyCredential({ patientIdHash, coveredProcedures, policyLimit, policyExpiryDay, policySalt }) {
    const poseidon = await getPoseidon();
    const F = poseidon.F;

    // Procedure leaves: Poseidon(1)([procedureCode])
    const procedureLeaves = coveredProcedures.map(code => F.toObject(poseidon([BigInt(code)])));
    const { tree: procTree, root: coveredSetRoot } = await buildMerkleTree(procedureLeaves, 6);

    // policyCommitment = Poseidon(5)([patientIdHash, coveredSetRoot, policyLimit, policyExpiryDay, policySalt])
    const commitmentHash = poseidon([
        BigInt(patientIdHash),
        BigInt(coveredSetRoot),
        BigInt(policyLimit),
        BigInt(policyExpiryDay),
        BigInt(policySalt)
    ]);
    const policyCommitment = F.toObject(commitmentHash);

    return {
        patientIdHash: patientIdHash.toString(),
        coveredProcedures,
        procTree,
        coveredSetRoot: coveredSetRoot.toString(),
        policyLimit: policyLimit.toString(),
        policyExpiryDay: policyExpiryDay.toString(),
        policySalt: policySalt.toString(),
        policyCommitment: policyCommitment.toString()
    };
}

/**
 * Signs the claim message using the hospital's EdDSA Baby Jubjub private key
 */
async function signClaimMessage({ hospitalPrivKeyHex, recordId, patientIdHash, procedureCode, claimAmount, claimDay, recipient }) {
    const poseidon = await getPoseidon();
    const eddsa = await getEddsa();
    const F = poseidon.F;

    // msg = Poseidon(6)([recordId, patientIdHash, procedureCode, claimAmount, claimDay, recipient])
    const msgHash = poseidon([
        BigInt(recordId),
        BigInt(patientIdHash),
        BigInt(procedureCode),
        BigInt(claimAmount),
        BigInt(claimDay),
        BigInt(recipient)
    ]);

    const privKeyBuffer = Buffer.from(hospitalPrivKeyHex.replace("0x", ""), "hex");
    const pubKey = eddsa.prv2pub(privKeyBuffer);
    const signature = eddsa.signPoseidon(privKeyBuffer, msgHash);

    return {
        Ax: F.toObject(pubKey[0]).toString(),
        Ay: F.toObject(pubKey[1]).toString(),
        R8x: F.toObject(signature.R8[0]).toString(),
        R8y: F.toObject(signature.R8[1]).toString(),
        S: signature.S.toString(),
        msgHash: F.toObject(msgHash).toString()
    };
}

/**
 * Compiles full witness input for the ClaimEligibility circuit
 */
async function generateCircuitWitnessInput({
    hospitalPrivKeyHex,
    hospitalTreeData,
    hospitalLeafIndex,
    policyCredential,
    procedureIndexInPolicy,
    recordId,
    claimAmount,
    claimDay,
    recipient
}) {
    const poseidon = await getPoseidon();
    const F = poseidon.F;

    // 1. Hospital Tree Proof
    const hospitalProof = await getMerkleProof(hospitalTreeData, hospitalLeafIndex, 8);

    // 2. Procedure Proof
    const procedureProof = await getMerkleProof(
        { tree: policyCredential.procTree, root: policyCredential.coveredSetRoot },
        procedureIndexInPolicy,
        6
    );

    const procedureCode = policyCredential.coveredProcedures[procedureIndexInPolicy];

    // 3. Hospital Signature
    const sig = await signClaimMessage({
        hospitalPrivKeyHex,
        recordId,
        patientIdHash: policyCredential.patientIdHash,
        procedureCode,
        claimAmount,
        claimDay,
        recipient
    });

    // 4. Nullifier = Poseidon(policySalt, recordId)
    const nullifier = F.toObject(poseidon([
        BigInt(policyCredential.policySalt),
        BigInt(recordId)
    ])).toString();

    return {
        // Public Inputs
        hospitalRoot: hospitalProof.root,
        policyCommitment: policyCredential.policyCommitment,
        claimAmount: claimAmount.toString(),
        claimDay: claimDay.toString(),
        recipient: BigInt(recipient).toString(),

        // Expected Output
        nullifier,

        // Private Inputs
        hospitalAx: sig.Ax,
        hospitalAy: sig.Ay,
        sigR8x: sig.R8x,
        sigR8y: sig.R8y,
        sigS: sig.S,
        hospitalPathElements: hospitalProof.pathElements,
        hospitalPathIndices: hospitalProof.pathIndices,

        recordId: recordId.toString(),
        patientIdHash: policyCredential.patientIdHash,
        procedureCode: procedureCode.toString(),
        procedurePathElements: procedureProof.pathElements,
        procedurePathIndices: procedureProof.pathIndices,

        policyLimit: policyCredential.policyLimit,
        policyExpiryDay: policyCredential.policyExpiryDay,
        policySalt: policyCredential.policySalt
    };
}

module.exports = {
    getPoseidon,
    getEddsa,
    buildMerkleTree,
    getMerkleProof,
    createPolicyCredential,
    signClaimMessage,
    generateCircuitWitnessInput
};
