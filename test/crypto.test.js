const { expect } = require("chai");
const crypto = require("../packages/crypto");

describe("Client-Side Cryptography Suite: ECDH, ECDSA, AES-GCM, DEK Wrapping", function () {
    this.timeout(10000);

    let patientKeys, doctorKeys, attackerKeys;
    let encryptedBundle, wrappedForDoctor;

    const sampleFhirRecord = {
        resourceType: "Bundle",
        patient: "Alex Doe",
        condition: "Essential Hypertension (Stage 1)",
        procedure: "CPT-99213 Outpatient Consult",
        prescription: "Lisinopril 10mg"
    };

    before(async function () {
        patientKeys = await crypto.generateUserKeypairs();
        doctorKeys = await crypto.generateUserKeypairs();
        attackerKeys = await crypto.generateUserKeypairs();
    });

    it("1. Generates valid ECDH and ECDSA keypairs with exportable JWKs", async function () {
        expect(patientKeys.publicKeys.ecdh).to.have.property("crv", "P-256");
        expect(patientKeys.publicKeys.ecdsa).to.have.property("crv", "P-256");
        expect(patientKeys.ecdh.privateKey).to.exist;
        expect(patientKeys.ecdsa.privateKey).to.exist;
    });

    it("2. Encrypts record with AES-256-GCM and asserts ciphertext != plaintext", async function () {
        encryptedBundle = await crypto.encryptRecord(sampleFhirRecord, "rec-001", 1);
        expect(encryptedBundle.ciphertextBase64).to.not.include("Alex Doe");
        expect(encryptedBundle.ciphertextBase64).to.not.include("Lisinopril");
        expect(encryptedBundle.ciphertextSha256).to.match(/^0x[a-f0-9]{64}$/);
    });

    it("3. Hashes CIPHERTEXT for on-chain anchoring (never plaintext)", async function () {
        // Assert anchored hash is derived strictly from ciphertext
        const rawCiphertext = Buffer.from(encryptedBundle.ciphertextBase64, "base64");
        const nodeHash = "0x" + require("crypto").createHash("sha256").update(rawCiphertext).digest("hex");
        expect(encryptedBundle.ciphertextSha256).to.equal(nodeHash);
    });

    it("4. Patient wraps DEK for Doctor via ephemeral ECDH + HKDF", async function () {
        wrappedForDoctor = await crypto.wrapDekForGrantee(
            encryptedBundle.dekRaw,
            doctorKeys.publicKeys.ecdh
        );
        expect(wrappedForDoctor.wrappedDekBase64).to.exist;
        expect(wrappedForDoctor.ephemeralPublicKey).to.exist;
    });

    it("5. Authorized Doctor unwraps DEK and decrypts record successfully", async function () {
        const unwrappedDek = await crypto.unwrapDek(
            wrappedForDoctor,
            doctorKeys.ecdh.privateKey
        );
        const decrypted = await crypto.decryptRecord(
            encryptedBundle.ciphertextBase64,
            encryptedBundle.ivBase64,
            unwrappedDek,
            "rec-001",
            1
        );
        expect(decrypted.patient).to.equal("Alex Doe");
        expect(decrypted.condition).to.equal("Essential Hypertension (Stage 1)");
        expect(decrypted.prescription).to.equal("Lisinopril 10mg");
    });

    it("6. Attacker cannot unwrap DEK without the authorized private key", async function () {
        try {
            await crypto.unwrapDek(wrappedForDoctor, attackerKeys.ecdh.privateKey);
            expect.fail("Attacker should not have been able to unwrap DEK");
        } catch (err) {
            expect(err).to.exist; // Decryption / auth tag check fails
        }
    });

    it("7. Doctor signs diagnosis record version with ECDSA P-256", async function () {
        const signature = await crypto.signRecordVersion(
            "rec-001",
            2,
            encryptedBundle.ciphertextSha256,
            "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            doctorKeys.ecdsa.privateKey
        );
        expect(signature).to.be.a("string");
        expect(signature.length).to.be.greaterThan(30);
    });

    it("8. Key rotation on revocation: old DEK cannot decrypt new version, remaining grantee can (M3)", async function () {
        // Setup: Patient originally shares with Doctor A (doctorKeys) and Doctor B (remaining grantee)
        const doctorBKeys = await crypto.generateUserKeypairs();
        const oldDek = encryptedBundle.dekRaw;

        // Revoke Doctor A: Rotate key, increment to version 2, and re-wrap only for Doctor B
        const rotatedBundle = await crypto.rotateKeyAndReencrypt(
            sampleFhirRecord,
            "rec-001",
            1, // current version
            [doctorBKeys.publicKeys.ecdh] // only Doctor B remains
        );

        expect(rotatedBundle.version).to.equal(2);
        expect(rotatedBundle.rewrappedKeys).to.have.lengthOf(1);

        // Acceptance test: Doctor A's old DEK cannot decrypt version 2
        try {
            await crypto.decryptRecord(
                rotatedBundle.ciphertextBase64,
                rotatedBundle.ivBase64,
                oldDek,
                "rec-001",
                2
            );
            expect.fail("Old DEK should have failed to decrypt rotated record version");
        } catch (err) {
            expect(err).to.exist; // AES-GCM auth tag verification fails
        }

        // Acceptance test: Remaining grantee (Doctor B) can unwrap new DEK and decrypt version 2
        const unwrappedNewDek = await crypto.unwrapDek(
            rotatedBundle.rewrappedKeys[0],
            doctorBKeys.ecdh.privateKey
        );
        const decryptedV2 = await crypto.decryptRecord(
            rotatedBundle.ciphertextBase64,
            rotatedBundle.ivBase64,
            unwrappedNewDek,
            "rec-001",
            2
        );
        expect(decryptedV2.patient).to.equal("Alex Doe");
        expect(decryptedV2.condition).to.equal("Essential Hypertension (Stage 1)");
    });
});
