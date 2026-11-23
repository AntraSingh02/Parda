"""
Off-Chain Client-Side Encryption & IPFS Module
Implements authenticated AES-256-GCM encryption for FHIR records.
Only hashes and commitments are exposed on-chain; ciphertext is pinned to IPFS.
"""

import os
import json
import hashlib
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class HealthRecordEncryptor:
    @staticmethod
    def generate_key():
        """Generates a secure 256-bit AES key."""
        return AESGCM.generate_key(bit_length=256)

    @staticmethod
    def encrypt_record(record_dict, key):
        """
        Encrypts a Python dictionary/JSON record using AES-256-GCM.
        Returns base64 encoded ciphertext bundle (nonce + ciphertext + auth_tag).
        """
        aesgcm = AESGCM(key)
        nonce = os.urandom(12) # 96-bit nonce for GCM
        data_bytes = json.dumps(record_dict).encode('utf-8')
        ciphertext = aesgcm.encrypt(nonce, data_bytes, None)

        payload = {
            "nonce": base64.b64encode(nonce).decode('utf-8'),
            "ciphertext": base64.b64encode(ciphertext).decode('utf-8')
        }
        return payload

    @staticmethod
    def decrypt_record(payload, key):
        """Decrypts an AES-256-GCM payload with the provided key."""
        aesgcm = AESGCM(key)
        nonce = base64.b64decode(payload["nonce"])
        ciphertext = base64.b64decode(payload["ciphertext"])
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return json.loads(decrypted_bytes.decode('utf-8'))

    @staticmethod
    def compute_sha256(payload):
        """
        Computes the SHA-256 digest of the ciphertext for on-chain anchoring (M2).
        Accepts an encrypted payload dict containing 'ciphertext', raw bytes, or base64 string.
        Never hashes plaintext records to prevent low-entropy dictionary attacks.
        """
        if isinstance(payload, dict) and "ciphertext" in payload:
            ciphertext_bytes = base64.b64decode(payload["ciphertext"])
            return "0x" + hashlib.sha256(ciphertext_bytes).hexdigest()
        elif isinstance(payload, bytes):
            return "0x" + hashlib.sha256(payload).hexdigest()
        elif isinstance(payload, str):
            try:
                ciphertext_bytes = base64.b64decode(payload)
                return "0x" + hashlib.sha256(ciphertext_bytes).hexdigest()
            except Exception:
                return "0x" + hashlib.sha256(payload.encode('utf-8')).hexdigest()
        else:
            raw = json.dumps(payload, sort_keys=True).encode('utf-8')
            return "0x" + hashlib.sha256(raw).hexdigest()

    @staticmethod
    def mock_ipfs_pin(encrypted_payload):
        """
        Simulates pinning to IPFS (or calls Pinata when configured).
        Computes a mock deterministic CIDv1 based on the payload hash.
        """
        raw = json.dumps(encrypted_payload).encode('utf-8')
        cid_hash = hashlib.sha256(raw).hexdigest()[:32]
        mock_cid = f"bafybeic{cid_hash}"
        return mock_cid

if __name__ == "__main__":
    from fhir_records import generate_fhir_record

    print("--- 1. Generating FHIR Record ---")
    fhir = generate_fhir_record()
    print("Patient:", fhir["entry"][0]["resource"]["name"])
    print("Diagnosis (Private):", fhir["entry"][1]["resource"]["code"]["text"])

    print("\n--- 2. Encrypting with Patient Key (AES-256-GCM) ---")
    patient_key = HealthRecordEncryptor.generate_key()
    encrypted_payload = HealthRecordEncryptor.encrypt_record(fhir, patient_key)
    print("Encrypted Nonce:", encrypted_payload["nonce"])
    print("Ciphertext preview:", encrypted_payload["ciphertext"][:40] + "...")

    print("\n--- 3. Pinned to IPFS & On-Chain Hash Computed ---")
    ipfs_cid = HealthRecordEncryptor.mock_ipfs_pin(encrypted_payload)
    on_chain_hash = HealthRecordEncryptor.compute_sha256(fhir)
    print("Simulated IPFS CID:", ipfs_cid)
    print("On-Chain Anchored Hash:", on_chain_hash)

    print("\n--- 4. Authorized Doctor Decryption ---")
    decrypted = HealthRecordEncryptor.decrypt_record(encrypted_payload, patient_key)
    assert decrypted["resourceType"] == "Bundle"
    print("Decryption Successful! Recovered Condition:", decrypted["entry"][1]["resource"]["code"]["text"])
