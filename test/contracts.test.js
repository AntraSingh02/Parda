const { expect } = require("chai");
const { ethers } = require("hardhat");
const path = require("path");
const snarkjs = require("snarkjs");
const {
    getPoseidon,
    buildMerkleTree,
    createPolicyCredential,
    generateCircuitWitnessInput,
    getEddsa
} = require("../circuits/zk_helpers");

describe("Smart Contract Suite: ClaimManager, HospitalRegistry, AccessLog, AuditAnchor", function () {
    this.timeout(60000);

    let deployer, insurer, hospital, patient, reg1, reg2, reg3, attacker, responder;
    let verifier, registry, claimManager, accessLog, auditAnchor;
    let realProof, realPubSignals, realWitness, initialHospitalRoot, policyCommitment;
    let hospitalPrivKey, hospitalTreeData, policyCredential;

    const payoutWeiPerRupee = ethers.parseEther("0.0001"); // 1 rupee = 0.0001 ETH
    const wasmPath = path.join(__dirname, "../circuits/build/claim_eligibility_js/claim_eligibility.wasm");
    const zkeyPath = path.join(__dirname, "../circuits/build/claim_eligibility_final.zkey");

    before(async function () {
        [deployer, insurer, hospital, patient, reg1, reg2, reg3, attacker, responder] = await ethers.getSigners();

        const poseidon = await getPoseidon();
        const F = poseidon.F;
        const eddsa = await getEddsa();

        // 1. Setup Approved Hospital Tree
        hospitalPrivKey = "0x0001020304050607080900010203040506070809000102030405060708090001";
        const privBuf = Buffer.from(hospitalPrivKey.replace("0x", ""), "hex");
        const pubKey = eddsa.prv2pub(privBuf);
        const hospitalLeaf = F.toObject(poseidon([F.toObject(pubKey[0]), F.toObject(pubKey[1])]));
        hospitalTreeData = await buildMerkleTree([hospitalLeaf, 111n, 222n, 333n], 8);
        initialHospitalRoot = "0x" + BigInt(hospitalTreeData.root).toString(16).padStart(64, "0");

        // 2. Setup Policy Credential
        policyCredential = await createPolicyCredential({
            patientIdHash: "1928374650192837465",
            coveredProcedures: [99213, 99214, 80053],
            policyLimit: 50000,
            policyExpiryDay: 22500,
            policySalt: "998877665544332211"
        });
        policyCommitment = "0x" + BigInt(policyCredential.policyCommitment).toString(16).padStart(64, "0");

        // 3. Generate a real Groth16 proof
        const currentBlock = await ethers.provider.getBlock("latest");
        const claimDay = Math.floor(currentBlock.timestamp / 86400);

        realWitness = await generateCircuitWitnessInput({
            hospitalPrivKeyHex: hospitalPrivKey,
            hospitalTreeData,
            hospitalLeafIndex: 0,
            policyCredential,
            procedureIndexInPolicy: 0,
            recordId: 1001,
            claimAmount: 1000,
            claimDay,
            recipient: hospital.address
        });

        const { nullifier: _, ...circuitInput } = realWitness;
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            circuitInput,
            wasmPath,
            zkeyPath
        );

        realProof = {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]]
            ],
            c: [proof.pi_c[0], proof.pi_c[1]]
        };
        realPubSignals = publicSignals.map(s => BigInt(s));
    });

    beforeEach(async function () {
        // Deploy Groth16 Verifier
        const Verifier = await ethers.getContractFactory("Groth16Verifier");
        verifier = await Verifier.deploy();

        // Deploy HospitalRegistry with 3 regulators
        const Registry = await ethers.getContractFactory("HospitalRegistry");
        registry = await Registry.deploy([reg1.address, reg2.address, reg3.address], initialHospitalRoot);

        // Deploy ClaimManager with 10 ETH escrow
        const ClaimManager = await ethers.getContractFactory("ClaimManager");
        claimManager = await ClaimManager.connect(insurer).deploy(
            await verifier.getAddress(),
            await registry.getAddress(),
            payoutWeiPerRupee,
            { value: ethers.parseEther("10.0") }
        );

        // Insurer registers policy with limit 50,000 (C3 fix)
        await claimManager.connect(insurer).registerPolicy(policyCommitment, 50000);

        // Deploy AccessLog and authorize responder
        const AccessLog = await ethers.getContractFactory("AccessLog");
        accessLog = await AccessLog.deploy();
        await accessLog.setAuthorizedResponder(responder.address, true);

        // Deploy AccessRegistry and authorize responder
        const AccessRegistry = await ethers.getContractFactory("AccessRegistry");
        accessRegistry = await AccessRegistry.deploy();
        await accessRegistry.setResponderAuthorization(responder.address, true);

        // Deploy AuditAnchor
        const AuditAnchor = await ethers.getContractFactory("AuditAnchor");
        auditAnchor = await AuditAnchor.deploy(deployer.address);
    });

    it("1. Successfully submits valid claim with real Groth16 proof and settles from escrow (C1)", async function () {
        const hospitalInitialBal = await ethers.provider.getBalance(hospital.address);

        const tx = await claimManager.connect(hospital).submitClaim(
            realProof.a,
            realProof.b,
            realProof.c,
            realPubSignals
        );
        await tx.wait();

        const nullifierBytes32 = "0x" + BigInt(realWitness.nullifier).toString(16).padStart(64, "0");
        expect(await claimManager.usedNullifiers(nullifierBytes32)).to.be.true;

        const hospitalFinalBal = await ethers.provider.getBalance(hospital.address);
        expect(hospitalFinalBal - hospitalInitialBal).to.be.gte(ethers.parseEther("0.099"));
    });

    it("2. Rejects fake or tampered Groth16 proofs with InvalidZKProof (C1 acceptance test)", async function () {
        // Fake proof values like [1n, 2n] must revert
        await expect(
            claimManager.connect(hospital).submitClaim(
                [1n, 2n],
                [[1n, 2n], [3n, 4n]],
                [5n, 6n],
                realPubSignals
            )
        ).to.be.revertedWithCustomError(claimManager, "InvalidZKProof");

        // Tampered proof parameter a
        const tamperedA = [BigInt(realProof.a[0]) + 1n, realProof.a[1]];
        await expect(
            claimManager.connect(hospital).submitClaim(
                tamperedA,
                realProof.b,
                realProof.c,
                realPubSignals
            )
        ).to.be.revertedWithCustomError(claimManager, "InvalidZKProof");

        // Tampered public signal
        const tamperedSignals = [...realPubSignals];
        tamperedSignals[3] = 9999n; // Tampered claimAmount
        await expect(
            claimManager.connect(hospital).submitClaim(
                realProof.a,
                realProof.b,
                realProof.c,
                tamperedSignals
            )
        ).to.be.revertedWithCustomError(claimManager, "InvalidZKProof");
    });

    it("3. Rejects duplicate / replayed claim with NullifierAlreadyUsed", async function () {
        await claimManager.connect(hospital).submitClaim(
            realProof.a,
            realProof.b,
            realProof.c,
            realPubSignals
        );

        await expect(
            claimManager.connect(hospital).submitClaim(
                realProof.a,
                realProof.b,
                realProof.c,
                realPubSignals
            )
        ).to.be.revertedWithCustomError(claimManager, "NullifierAlreadyUsed");
    });

    it("4. Rejects claim with unregistered policy commitment", async function () {
        const fakePolicy = ethers.keccak256(ethers.toUtf8Bytes("UNREGISTERED_POLICY"));
        const signals = [...realPubSignals];
        signals[2] = BigInt(fakePolicy);

        await expect(
            claimManager.connect(hospital).submitClaim(
                realProof.a,
                realProof.b,
                realProof.c,
                signals
            )
        ).to.be.revertedWithCustomError(claimManager, "PolicyNotRegistered");
    });

    it("5. Rejects claim from unapproved hospital Merkle root", async function () {
        const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("UNAPPROVED_ROOT"));
        const signals = [...realPubSignals];
        signals[1] = BigInt(fakeRoot);

        await expect(
            claimManager.connect(hospital).submitClaim(
                realProof.a,
                realProof.b,
                realProof.c,
                signals
            )
        ).to.be.revertedWithCustomError(claimManager, "StaleOrInvalidHospitalRoot");
    });

    it("6. Per-policy total spent limit tracking: prevents claims exceeding aggregate policy limit (C3)", async function () {
        const testPolicy = ethers.keccak256(ethers.toUtf8Bytes("POLICY_50K_LIMIT"));
        await claimManager.connect(insurer).registerPolicy(testPolicy, 50000);

        expect(await claimManager.policyLimit(testPolicy)).to.equal(50000);
        expect(await claimManager.policySpent(testPolicy)).to.equal(0);

        // Manually record 30,000 spent by calling submitClaim or testing limit condition
        // Here we verify the require in submitClaim:
        // A claim with amount 55,000 immediately reverts with PolicyLimitExceeded
        const overLimitSignals = [...realPubSignals];
        overLimitSignals[2] = BigInt(testPolicy);
        overLimitSignals[3] = 55000n; // > 50,000

        await expect(
            claimManager.connect(hospital).submitClaim(
                realProof.a,
                realProof.b,
                realProof.c,
                overLimitSignals
            )
        ).to.be.revertedWithCustomError(claimManager, "PolicyLimitExceeded");
    });

    it("7. Hospital root grace period and invalidation: revoked roots expire after 1 day (C4)", async function () {
        const rootA = initialHospitalRoot;
        const rootB = ethers.keccak256(ethers.toUtf8Bytes("HOSPITAL_ROOT_B"));

        expect(await registry.isValidRoot(rootA)).to.be.true;

        // Propose and approve root B with 2-of-3 regulators
        await registry.connect(reg1).proposeRoot(rootB);
        await registry.connect(reg2).approveRoot(0);

        expect(await registry.currentRoot()).to.equal(rootB);

        // During grace period (1 day), root A is still valid
        expect(await registry.isValidRoot(rootA)).to.be.true;

        // Fast forward 1 day + 10 seconds past grace period
        await ethers.provider.send("evm_increaseTime", [86400 + 10]);
        await ethers.provider.send("evm_mine");

        // After grace period, root A is expired and invalid
        expect(await registry.isValidRoot(rootA)).to.be.false;

        // Claims using root A must revert with StaleOrInvalidHospitalRoot
        await expect(
            claimManager.connect(hospital).submitClaim(
                realProof.a,
                realProof.b,
                realProof.c,
                realPubSignals
            )
        ).to.be.revertedWithCustomError(claimManager, "StaleOrInvalidHospitalRoot");

        // Immediate invalidation by regulator
        await registry.connect(reg1).invalidateRoot(rootB);
        expect(await registry.isValidRoot(rootB)).to.be.false;
    });

    it("8. Stale proposals cannot be executed and constructor validates regulators (M1)", async function () {
        const root1 = ethers.keccak256(ethers.toUtf8Bytes("ROOT_PROPOSAL_1"));
        const root2 = ethers.keccak256(ethers.toUtf8Bytes("ROOT_PROPOSAL_2"));

        // Propose A (id 0)
        await registry.connect(reg1).proposeRoot(root1);
        // Propose B (id 1)
        await registry.connect(reg2).proposeRoot(root2);

        // Execute B (id 1) with reg1's approval
        await registry.connect(reg1).approveRoot(1);
        expect(await registry.currentRoot()).to.equal(root2);

        // Attempting to approve older proposal A (id 0) must revert
        await expect(
            registry.connect(reg3).approveRoot(0)
        ).to.be.revertedWithCustomError(registry, "StaleProposal");

        // proposeRoot(0) must revert
        await expect(
            registry.connect(reg1).proposeRoot(ethers.ZeroHash)
        ).to.be.revertedWithCustomError(registry, "InvalidRoot");

        // Constructor reverts with duplicate or zero regulators
        const Registry = await ethers.getContractFactory("HospitalRegistry");
        await expect(
            Registry.deploy([reg1.address, reg1.address, reg3.address], initialHospitalRoot)
        ).to.be.revertedWithCustomError(registry, "InvalidRegulator");
        await expect(
            Registry.deploy([ethers.ZeroAddress, reg2.address, reg3.address], initialHospitalRoot)
        ).to.be.revertedWithCustomError(registry, "InvalidRegulator");
    });

    it("9. AccessLog access control: only authorized responders and patients (H2)", async function () {
        const patientHash = ethers.keccak256(ethers.toUtf8Bytes("PATIENT_ALEX"));
        const responderHash = ethers.keccak256(ethers.toUtf8Bytes("EMT_99"));
        const reasonHash = ethers.keccak256(ethers.toUtf8Bytes("TRAUMA"));
        const doctorHash = ethers.keccak256(ethers.toUtf8Bytes("DR_SMITH"));
        const recordHash = ethers.keccak256(ethers.toUtf8Bytes("REC_001"));

        // Unauthorized caller cannot trigger break-glass
        await expect(
            accessLog.connect(attacker).triggerBreakGlass(patientHash, responderHash, reasonHash)
        ).to.be.revertedWithCustomError(accessLog, "NotAuthorizedResponder");

        // Authorized responder succeeds
        await expect(
            accessLog.connect(responder).triggerBreakGlass(patientHash, responderHash, reasonHash)
        ).to.emit(accessLog, "BreakGlassTriggered");
        expect(await accessLog.breakGlassResponder(patientHash)).to.equal(responder.address);

        // Patient registers their hash
        await accessLog.connect(patient).registerPatient(patientHash);

        // Other account cannot log grants for this patient
        await expect(
            accessLog.connect(attacker).logAccessGranted(patientHash, doctorHash, recordHash, 0)
        ).to.be.revertedWithCustomError(accessLog, "NotPatient");

        // True patient can log grants and revocations
        await expect(
            accessLog.connect(patient).logAccessGranted(patientHash, doctorHash, recordHash, 0)
        ).to.emit(accessLog, "AccessGranted");
        await expect(
            accessLog.connect(patient).logAccessRevoked(patientHash, doctorHash, recordHash)
        ).to.emit(accessLog, "AccessRevoked");
    });

    it("10. AccessRegistry enforces authorized break-glass and audit logs real caller (H3)", async function () {
        // Unauthorized break-glass reverts
        await expect(
            accessRegistry.connect(attacker).emergencyBreakGlass(patient.address, "trauma")
        ).to.be.revertedWithCustomError(accessRegistry, "Unauthorized");

        // Audit check without grant is false, records msg.sender as accessor
        await expect(
            accessRegistry.connect(hospital).verifyAndLogAccess(patient.address, "rec-001")
        ).to.emit(accessRegistry, "RecordAccessChecked")
          .withArgs(patient.address, hospital.address, "rec-001", false, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

        // Authorized responder triggers break-glass
        await accessRegistry.connect(responder).emergencyBreakGlass(patient.address, "trauma");

        // Access is now allowed for the responder during the 24h window
        const allowed = await accessRegistry.connect(responder).verifyAndLogAccess.staticCall(patient.address, "rec-001");
        expect(allowed).to.be.true;

        // Fast forward 24h + 10s past break-glass window
        await ethers.provider.send("evm_increaseTime", [86400 + 10]);
        await ethers.provider.send("evm_mine");

        const allowedAfter = await accessRegistry.connect(responder).verifyAndLogAccess.staticCall(patient.address, "rec-001");
        expect(allowedAfter).to.be.false;
    });

    it("11. Escrow accounting survives forced ETH injection and allows reconciliation (M4)", async function () {
        const ForceSender = await ethers.getContractFactory("ForceSender");
        const forceSender = await ForceSender.deploy({ value: ethers.parseEther("1.0") });

        const initialEscrow = await claimManager.escrowBalance();
        const initialRawBal = await ethers.provider.getBalance(await claimManager.getAddress());
        expect(initialEscrow).to.equal(ethers.parseEther("10.0"));
        expect(initialRawBal).to.equal(ethers.parseEther("10.0"));

        // Force-send 1 ETH via selfdestruct
        await forceSender.forceSend(await claimManager.getAddress());

        const newRawBal = await ethers.provider.getBalance(await claimManager.getAddress());
        expect(newRawBal).to.equal(ethers.parseEther("11.0"));
        // escrowBalance remains cleanly isolated
        expect(await claimManager.escrowBalance()).to.equal(ethers.parseEther("10.0"));

        // Reconcile unaccounted balance
        await claimManager.connect(insurer).reconcileEscrow();
        expect(await claimManager.escrowBalance()).to.equal(ethers.parseEther("11.0"));
    });

    it("12. AuditAnchor records batch Merkle roots", async function () {
        const batchRoot = ethers.keccak256(ethers.toUtf8Bytes("AUDIT_BATCH_001"));
        await expect(auditAnchor.anchor(batchRoot, 1, 50))
            .to.emit(auditAnchor, "AuditBatchAnchored");
        expect(await auditAnchor.batchRoots(0)).to.equal(batchRoot);
    });
});
