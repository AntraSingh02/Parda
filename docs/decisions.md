# Architecture Decisions & Defaults (docs/decisions.md)

This document records the default decisions for all items marked OPEN in Section 3 of the project specification.

## 1. Project Naming & Scope
- **Working Title:** `PARDA` (Privacy-Preserving Health Records & ZKP Insurance Claims).
- **Track:** Hack-a-Sol 5.0, Track 4 (Web3 · W3-01).

## 2. Blockchain Target
- **Primary / Dev / Demo Target:** Hardhat Local EVM (ChainID `31337`). Ensures 100% reproducible, instantaneous, zero-cost, faucet-independent end-to-end demonstrations.
- **Public Testnet Target:** Ethereum Sepolia (RPC: `https://rpc.sepolia.org`), with chain-agnostic contracts.

## 3. Cryptography & ZK Scheme
- **Zero-Knowledge System:** Circom 2.1 + snarkjs + Groth16 over BN254 scalar field.
- **Hashing Algorithm:** Poseidon (arithmetic hash friendly for SNARKs).
- **In-Circuit Signature:** EdDSA over Baby Jubjub curve (Poseidon variant) from `circomlib`.
- **Nullifier Definition:** `Poseidon(policySalt, recordId)`. Binds the claim strictly to the specific policy and medical record, preventing double claims.
- **Encoding Standards:**
  - Date: Unix day number (`floor(timestamp / 86400)`).
  - Amount: Integer rupees.
  - Conversion: `PAYOUT_WEI_PER_RUPEE` constant in smart contract.
  - Range checks: `Num2Bits(64)` before comparison.

## 4. Off-Chain Storage & Data Layer
- **Blob Store Interface:** Local encrypted file storage implementing `BlobStore` interface with simulated IPFS CIDv1 mapping.
- **Client Encryption:** Browser WebCrypto AES-256-GCM + random 256-bit DEK per record.
- **Key Wrapping:** Ephemeral ECDH P-256 -> HKDF-SHA256 -> AES-256-GCM key wrapping for authorized doctors/billing users.
- **Integrity Anchoring:** SHA-256 hash of **ciphertext** (never plaintext) is anchored on-chain.

## 5. Multi-Signature Governance
- **Hospital Registry Merkle Root:** 2-of-3 simulated regulator approval for proposing and approving new hospital roots.
