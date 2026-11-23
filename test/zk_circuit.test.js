const { expect } = require("chai");
const {
    getPoseidon,
    buildMerkleTree,
    createPolicyCredential,
    generateCircuitWitnessInput
} = require("../circuits/zk_helpers");
const { verifyClaimPreflight } = require("../circuits/preflight_verifier");

describe("Zero-Knowledge Circuit & Preflight Verification Suite", function () {
    this.timeout(20000);
    let hospitalPrivKey;
    let hospitalTreeData;
    let policyCredential;
    let validWitness;
    let poseidon;

    before(async function () {
        poseidon = await getPoseidon();
        const F = poseidon.F;

        // 1. Setup Approved Hospital Tree (depth 8)
        hospitalPrivKey = "0x0001020304050607080900010203040506070809000102030405060708090001";
        const { getEddsa } = require("../circuits/zk_helpers");
        const eddsa = await getEddsa();
        const privBuf = Buffer.from(hospitalPrivKey.replace("0x", ""), "hex");
        const pubKey = eddsa.prv2pub(privBuf);
        const hospitalLeaf = F.toObject(poseidon([F.toObject(pubKey[0]), F.toObject(pubKey[1])]));

        const hospitalLeaves = [hospitalLeaf, 111n, 222n, 333n];
        hospitalTreeData = await buildMerkleTree(hospitalLeaves, 8);

        // 2. Setup Policy Credential (depth 6 covered procedures: 99213, 99214, 80053)
        policyCredential = await createPolicyCredential({
            patientIdHash: "1928374650192837465",
            coveredProcedures: [99213, 99214, 80053],
            policyLimit: 50000,
            policyExpiryDay: 22500, // Year 2031
            policySalt: "998877665544332211"
        });

        // 3. Generate baseline valid witness input
        validWitness = await generateCircuitWitnessInput({
            hospitalPrivKeyHex: hospitalPrivKey,
            hospitalTreeData,
            hospitalLeafIndex: 0,
            policyCredential,
            procedureIndexInPolicy: 0, // 99213
            recordId: 1001,
            claimAmount: 12000,
            claimDay: 20050,
            recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        });
    });

    it("1. Valid proof input verifies cleanly", async function () {
        const result = await verifyClaimPreflight(validWitness);
        expect(result.isValid).to.be.true;
        expect(result.errors).to.be.empty;
        expect(result.nullifier).to.equal(validWitness.nullifier);
    });

    it("2. Expired policy fails verification", async function () {
        const expiredWitness = { ...validWitness, claimDay: 23000 }; // past policyExpiryDay 22500
        const result = await verifyClaimPreflight(expiredWitness);
        expect(result.isValid).to.be.false;
        expect(result.errors.some(e => e.includes("Policy expired"))).to.be.true;
    });

    it("3. Unapproved hospital root fails verification", async function () {
        const unapprovedWitness = { ...validWitness, hospitalRoot: "99999999999999999999" };
        const result = await verifyClaimPreflight(unapprovedWitness);
        expect(result.isValid).to.be.false;
        expect(result.errors.some(e => e.includes("not in approved registry"))).to.be.true;
    });

    it("4. Uncovered procedure code fails verification", async function () {
        const uncoveredWitness = { ...validWitness, procedureCode: "99999" }; // not in covered set
        const result = await verifyClaimPreflight(uncoveredWitness);
        expect(result.isValid).to.be.false;
        expect(result.errors.some(e => e.includes("uncovered or policy commitment mismatch"))).to.be.true;
    });

    it("5. Claim amount above policy limit fails verification", async function () {
        const overLimitWitness = { ...validWitness, claimAmount: 75000 }; // exceeds 50000
        const result = await verifyClaimPreflight(overLimitWitness);
        expect(result.isValid).to.be.false;
        expect(result.errors.some(e => e.includes("exceeds policy limit"))).to.be.true;
    });

    it("6. Wrong patient ID hash fails policy commitment verification", async function () {
        const wrongPatientWitness = { ...validWitness, patientIdHash: "88888888888888888" };
        const result = await verifyClaimPreflight(wrongPatientWitness);
        expect(result.isValid).to.be.false;
        expect(result.errors.some(e => e.includes("uncovered or policy commitment mismatch"))).to.be.true;
    });

    it("7. Tampered public signal (tampered policyCommitment) fails verification", async function () {
        const tamperedWitness = { ...validWitness, policyCommitment: "11111111111111111" };
        const result = await verifyClaimPreflight(tamperedWitness);
        expect(result.isValid).to.be.false;
    });

    it("8. Changed recipient or signature tampering fails verification", async function () {
        const tamperedSig = { ...validWitness, sigS: "1234567890" };
        const result = await verifyClaimPreflight(tamperedSig);
        expect(result.isValid).to.be.false;
        expect(result.errors.some(e => e.includes("Invalid hospital EdDSA signature"))).to.be.true;
    });
});
