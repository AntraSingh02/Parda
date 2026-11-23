/**
 * @file packages/crypto/index.js
 * @notice Isomorphic WebCrypto module for client-side keys, AES-256-GCM record encryption,
 * ephemeral ECDH P-256 + HKDF key wrapping, and ciphertext SHA-256 anchoring.
 * Works seamlessly in both browser and Node.js (globalThis.crypto.subtle).
 */

const subtle = (typeof window !== "undefined" && window.crypto && window.crypto.subtle)
    ? window.crypto.subtle
    : globalThis.crypto.subtle;

/**
 * 1. Key Generation
 * Each user generates an ECDH P-256 keypair (for encryption/key-wrapping)
 * and an ECDSA P-256 keypair (for signing record versions).
 */
async function generateUserKeypairs() {
    const ecdhPair = await subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
    );

    const ecdsaPair = await subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
    );

    const ecdhPublicJwk = await subtle.exportKey("jwk", ecdhPair.publicKey);
    const ecdsaPublicJwk = await subtle.exportKey("jwk", ecdsaPair.publicKey);

    return {
        ecdh: ecdhPair,
        ecdsa: ecdsaPair,
        publicKeys: {
            ecdh: ecdhPublicJwk,
            ecdsa: ecdsaPublicJwk
        }
    };
}

/**
 * 2. Record Encryption (AES-256-GCM)
 * Encrypts plaintext record with a freshly generated 256-bit DEK and 96-bit IV.
 * Binds Associated Authenticated Data (AAD) = recordId || version.
 */
async function encryptRecord(recordObject, recordId, version) {
    const dek = await subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(recordObject));
    const aad = encoder.encode(`${recordId}:${version}`);

    const ciphertextBuffer = await subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: aad },
        dek,
        encodedData
    );

    const rawDek = await subtle.exportKey("raw", dek);
    const ciphertextBase64 = Buffer.from(ciphertextBuffer).toString("base64");
    const ivBase64 = Buffer.from(iv).toString("base64");

    // Ciphertext SHA-256 Anchor (Never hash plaintext!)
    const digestBuffer = await subtle.digest("SHA-256", ciphertextBuffer);
    const ciphertextSha256 = "0x" + Buffer.from(digestBuffer).toString("hex");

    return {
        dekRaw: rawDek,
        ivBase64,
        ciphertextBase64,
        ciphertextSha256,
        recordId,
        version
    };
}

/**
 * 3. Key Wrapping for Grantee
 * Uses ephemeral ECDH P-256 + HKDF-SHA256 -> AES-256-GCM to wrap the DEK
 * for the grantee's public ECDH key.
 */
async function wrapDekForGrantee(dekRaw, granteeEcdhPublicJwk) {
    const granteePubKey = await subtle.importKey(
        "jwk",
        granteeEcdhPublicJwk,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );

    // Generate ephemeral ECDH keypair
    const ephemeralPair = await subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
    );

    // Derive shared secret
    const sharedSecret = await subtle.deriveKey(
        { name: "ECDH", public: granteePubKey },
        ephemeralPair.privateKey,
        { name: "HKDF" },
        false,
        ["deriveKey"]
    );

    // HKDF to derive wrapping AES key
    const wrapKey = await subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: new Uint8Array(32), // standard zero salt
            info: new TextEncoder().encode("PARDA-DEK-WRAP-V1")
        },
        sharedSecret,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    // Encrypt raw DEK with wrapping key
    const wrapIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const wrappedDekBuffer = await subtle.encrypt(
        { name: "AES-GCM", iv: wrapIv },
        wrapKey,
        dekRaw
    );

    const ephemeralPubJwk = await subtle.exportKey("jwk", ephemeralPair.publicKey);

    return {
        ephemeralPublicKey: ephemeralPubJwk,
        wrapIvBase64: Buffer.from(wrapIv).toString("base64"),
        wrappedDekBase64: Buffer.from(wrappedDekBuffer).toString("base64")
    };
}

/**
 * 4. Key Unwrapping
 * Grantee unwraps the DEK using their private ECDH key and the ephemeral public key.
 */
async function unwrapDek(wrappedBundle, granteeEcdhPrivateKey) {
    const ephemeralPubKey = await subtle.importKey(
        "jwk",
        wrappedBundle.ephemeralPublicKey,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );

    const sharedSecret = await subtle.deriveKey(
        { name: "ECDH", public: ephemeralPubKey },
        granteeEcdhPrivateKey,
        { name: "HKDF" },
        false,
        ["deriveKey"]
    );

    const wrapKey = await subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: new Uint8Array(32),
            info: new TextEncoder().encode("PARDA-DEK-WRAP-V1")
        },
        sharedSecret,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    const wrapIv = Buffer.from(wrappedBundle.wrapIvBase64, "base64");
    const wrappedDekBytes = Buffer.from(wrappedBundle.wrappedDekBase64, "base64");

    const rawDek = await subtle.decrypt(
        { name: "AES-GCM", iv: wrapIv },
        wrapKey,
        wrappedDekBytes
    );

    return new Uint8Array(rawDek);
}

/**
 * 5. Record Decryption
 * Decrypts ciphertext using the unwrapped DEK and verifies AAD.
 */
async function decryptRecord(ciphertextBase64, ivBase64, dekRaw, recordId, version) {
    const dek = await subtle.importKey(
        "raw",
        dekRaw,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const iv = Buffer.from(ivBase64, "base64");
    const ciphertext = Buffer.from(ciphertextBase64, "base64");
    const aad = new TextEncoder().encode(`${recordId}:${version}`);

    const decryptedBuffer = await subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: aad },
        dek,
        ciphertext
    );

    const decoded = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decoded);
}

/**
 * 6. Doctor Record Version Signing (ECDSA P-256)
 * Signs H(recordId, version, parentHash, ciphertextSha256)
 */
async function signRecordVersion(recordId, version, parentHash, ciphertextSha256, doctorEcdsaPrivateKey) {
    const dataToSign = `${recordId}:${version}:${parentHash}:${ciphertextSha256}`;
    const encoded = new TextEncoder().encode(dataToSign);

    const signatureBuffer = await subtle.sign(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        doctorEcdsaPrivateKey,
        encoded
    );

    return Buffer.from(signatureBuffer).toString("base64");
}

module.exports = {
    generateUserKeypairs,
    encryptRecord,
    wrapDekForGrantee,
    unwrapDek,
    decryptRecord,
    signRecordVersion
};
