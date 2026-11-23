const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Smart Contract Suite: ClaimManager, HospitalRegistry, AccessLog, AuditAnchor", function () {
    this.timeout(20000);

    let deployer, insurer, hospital, patient, reg1, reg2, reg3, attacker;
    let verifier, registry, claimManager, accessLog, auditAnchor;

    const initialHospitalRoot = ethers.keccak256(ethers.toUtf8Bytes("HOSPITAL_ROOT_V1"));
    const policyCommitment = ethers.keccak256(ethers.toUtf8Bytes("POLICY_COMMITMENT_ALEX_DOE"));
    const payoutWeiPerRupee = ethers.parseEther("0.0001"); // 1 rupee = 0.0001 ETH for testing

    beforeEach(async function () {
        [deployer, insurer, hospital, patient, reg1, reg2, reg3, attacker] = await ethers.getSigners();

        // 1. Deploy Verifier
        const Verifier = await ethers.getContractFactory("Groth16Verifier");
        verifier = await Verifier.deploy();

        // 2. Deploy HospitalRegistry with 3 regulators
        const Registry = await ethers.getContractFactory("HospitalRegistry");
        registry = await Registry.deploy([reg1.address, reg2.address, reg3.address], initialHospitalRoot);

        // 3. Deploy ClaimManager with 10 ETH initial escrow
        const ClaimManager = await ethers.getContractFactory("ClaimManager");
        claimManager = await ClaimManager.connect(insurer).deploy(
            await verifier.getAddress(),
            await registry.getAddress(),
            payoutWeiPerRupee,
            { value: ethers.parseEther("10.0") }
        );

        // 4. Deploy AccessLog
        const AccessLog = await ethers.getContractFactory("AccessLog");
        accessLog = await AccessLog.deploy();

        // 5. Deploy AuditAnchor
        const AuditAnchor = await ethers.getContractFactory("AuditAnchor");
        auditAnchor = await AuditAnchor.deploy(deployer.address);

        // Insurer registers policy
        await claimManager.connect(insurer).registerPolicy(policyCommitment);
    });

    it("1. Successfully submits valid claim and pays hospital directly from escrow", async function () {
        const nullifier = ethers.keccak256(ethers.toUtf8Bytes("NULLIFIER_CLAIM_1"));
        const claimAmount = 1000n; // 1000 rupees => 0.1 ETH payout
        const currentBlock = await ethers.provider.getBlock("latest");
        const claimDay = BigInt(Math.floor(currentBlock.timestamp / 86400));
        const hospitalInitialBalance = await ethers.provider.getBalance(hospital.address);

        const a = [1n, 2n];
        const b = [[1n, 2n], [3n, 4n]];
        const c = [5n, 6n];
        const pubSignals = [
            BigInt(nullifier),
            BigInt(initialHospitalRoot),
            BigInt(policyCommitment),
            claimAmount,
            claimDay,
            BigInt(hospital.address)
        ];

        const tx = await claimManager.connect(hospital).submitClaim(a, b, c, pubSignals);
        await tx.wait();

        // Verify nullifier is marked used
        expect(await claimManager.usedNullifiers(nullifier)).to.be.true;

        // Verify hospital received payout (claimAmount * payoutWeiPerRupee = 1000 * 0.0001 = 0.1 ETH)
        const hospitalNewBalance = await ethers.provider.getBalance(hospital.address);
        expect(hospitalNewBalance - hospitalInitialBalance).to.be.gte(ethers.parseEther("0.099"));
    });

    it("2. Rejects duplicate / replayed claim with NullifierAlreadyUsed", async function () {
        const nullifier = ethers.keccak256(ethers.toUtf8Bytes("REPLAY_NULLIFIER"));
        const currentBlock = await ethers.provider.getBlock("latest");
        const claimDay = BigInt(Math.floor(currentBlock.timestamp / 86400));

        const a = [1n, 2n];
        const b = [[1n, 2n], [3n, 4n]];
        const c = [5n, 6n];
        const pubSignals = [
            BigInt(nullifier),
            BigInt(initialHospitalRoot),
            BigInt(policyCommitment),
            500n,
            claimDay,
            BigInt(hospital.address)
        ];

        // First submission succeeds
        await claimManager.connect(hospital).submitClaim(a, b, c, pubSignals);

        // Second submission with same nullifier must revert
        await expect(
            claimManager.connect(hospital).submitClaim(a, b, c, pubSignals)
        ).to.be.revertedWithCustomError(claimManager, "NullifierAlreadyUsed");
    });

    it("3. Rejects claim with unregistered policy commitment", async function () {
        const unregisteredPolicy = ethers.keccak256(ethers.toUtf8Bytes("UNREGISTERED_POLICY"));
        const currentBlock = await ethers.provider.getBlock("latest");
        const claimDay = BigInt(Math.floor(currentBlock.timestamp / 86400));

        const pubSignals = [
            BigInt(ethers.keccak256(ethers.toUtf8Bytes("NULLIFIER_2"))),
            BigInt(initialHospitalRoot),
            BigInt(unregisteredPolicy),
            500n,
            claimDay,
            BigInt(hospital.address)
        ];

        await expect(
            claimManager.connect(hospital).submitClaim([1n, 2n], [[1n, 2n], [3n, 4n]], [5n, 6n], pubSignals)
        ).to.be.revertedWithCustomError(claimManager, "PolicyNotRegistered");
    });

    it("4. Rejects claim from unapproved hospital Merkle root", async function () {
        const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("FAKE_HOSPITAL_ROOT"));
        const currentBlock = await ethers.provider.getBlock("latest");
        const claimDay = BigInt(Math.floor(currentBlock.timestamp / 86400));

        const pubSignals = [
            BigInt(ethers.keccak256(ethers.toUtf8Bytes("NULLIFIER_3"))),
            BigInt(fakeRoot),
            BigInt(policyCommitment),
            500n,
            claimDay,
            BigInt(hospital.address)
        ];

        await expect(
            claimManager.connect(hospital).submitClaim([1n, 2n], [[1n, 2n], [3n, 4n]], [5n, 6n], pubSignals)
        ).to.be.revertedWithCustomError(claimManager, "StaleOrInvalidHospitalRoot");
    });

    it("5. HospitalRegistry requires 2-of-3 regulators to update approved root", async function () {
        const newRoot = ethers.keccak256(ethers.toUtf8Bytes("HOSPITAL_ROOT_V2"));

        // Regulator 1 proposes
        const tx1 = await registry.connect(reg1).proposeRoot(newRoot);
        await tx1.wait();
        expect(await registry.currentRoot()).to.equal(initialHospitalRoot); // Still old root

        // Regulator 2 approves (reaches 2/3 threshold)
        const tx2 = await registry.connect(reg2).approveRoot(0);
        await tx2.wait();
        expect(await registry.currentRoot()).to.equal(newRoot); // Updated!
        expect(await registry.isValidRoot(initialHospitalRoot)).to.be.true; // Retains historical validity
    });

    it("6. AccessLog records break-glass emergency events with hashed identifiers", async function () {
        const patientHash = ethers.keccak256(ethers.toUtf8Bytes("PATIENT_ALEX"));
        const responderHash = ethers.keccak256(ethers.toUtf8Bytes("EMT_RESPONDER_99"));
        const reasonHash = ethers.keccak256(ethers.toUtf8Bytes("ACUTE_TRAUMA_UNCONSCIOUS"));

        await expect(accessLog.triggerBreakGlass(patientHash, responderHash, reasonHash))
            .to.emit(accessLog, "BreakGlassTriggered");

        expect(await accessLog.isBreakGlassActive(patientHash)).to.be.true;
    });

    it("7. AuditAnchor records batch Merkle roots", async function () {
        const batchRoot = ethers.keccak256(ethers.toUtf8Bytes("AUDIT_BATCH_001"));
        await expect(auditAnchor.anchor(batchRoot, 1, 50))
            .to.emit(auditAnchor, "AuditBatchAnchored");
        expect(await auditAnchor.batchRoots(0)).to.equal(batchRoot);
    });
});
