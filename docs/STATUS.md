# Project Implementation Status (docs/STATUS.md)

| Category | Component / Requirement | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Governance** | Phase 0 Interface Freeze | ✅ PASSED | `docs/interfaces.md`, `docs/decisions.md` |
| **ZK Circuit** | 7-Constraint Circom 2.1 Circuit | ✅ PASSED | `circuits/claim_eligibility.circom` (EdDSA inside circuit with recipient binding, depth 8 hospital Merkle tree with boolean index constraints, depth 6 covered set Merkle tree, 64-bit comparisons) |
| **ZK Circuit** | Preflight Verification & Rule Check | ✅ PASSED | `test/zk_circuit.test.js` (Preflight 10/10 tests passed; real SnarkJS fullProve and witness rejection 3/3 passed) |
| **ZK Circuit** | On-Chain Groth16 Verifier | ✅ PASSED | Real pairing verifier exported from trusted setup via `scripts/setup_zk.js` to `contracts/Verifier.sol` (no mockMode) |
| **ZK Circuit** | Public-Signal Order Documentation | ✅ PASSED | `docs/zk-public-inputs.md` ([nullifier, hospitalRoot, policyCommitment, claimAmount, claimDay, recipient]) |
| **Contracts** | `ClaimManager.sol` | ✅ PASSED | `test/contracts.test.js` (Real Groth16 proof pairing verification, aggregate policySpent limit tracking, escrow balance isolation & reconciliation, nullifier anti-replay) |
| **Contracts** | `HospitalRegistry.sol` (2-of-3 Multi-Sig) | ✅ PASSED | `test/contracts.test.js` (Multi-regulator consensus, 1-day grace period on replaced roots, immediate regulator invalidation, stale proposal rejection, non-zero regulator validation) |
| **Contracts** | `AuditAnchor.sol` | ✅ PASSED | `test/contracts.test.js` (Batch Merkle root anchoring) |
| **Contracts** | `AccessLog.sol` | ✅ PASSED | `test/contracts.test.js` (Role-based access control: only authorized emergency responders and registered patient owners) |
| **Contracts** | `AccessRegistry.sol` | ✅ PASSED | `test/contracts.test.js` (Authorized emergency break-glass with time-limited grant, immutable audit logging with msg.sender accessor) |
| **Crypto** | Browser WebCrypto Keypairs (ECDH/ECDSA) | ✅ PASSED | `test/crypto.test.js` (P-256 keypairs, exportable JWKs) |
| **Crypto** | AES-256-GCM + Ephemeral DEK Wrapping | ✅ PASSED | `test/crypto.test.js` (ECDH + HKDF DEK wrap/unwrap verified) |
| **Crypto** | Ciphertext Anchoring & Revocation Key Rotation | ✅ PASSED | `test/crypto.test.js` (Asserted ciphertext SHA-256 anchoring; key rotation on revocation prevents old DEK decryption) |
| **Testing** | Automated End-to-End Demo Script | ✅ PASSED | `npm run demo` (`scripts/demo.js` generates real Groth16 snarkjs proof, settles on-chain, passes red-team vector checks, exits 0) |
| **UI** | Three-Role Portal (Patient, Hospital, Insurer) | ✅ PASSED | `frontend/src/components/` (React + Tailwind) |
| **UI** | Privacy X-Ray Panel | ✅ PASSED | `frontend/src/components/PrivacyXRay.jsx` (3-column transparency view) |
| **UI** | Red-Team Attack Simulator Panel | ✅ PASSED | `frontend/src/components/RedTeamPanel.jsx` (7 interactive attack buttons) |
| **Testing** | Automated End-to-End Demo Script | ✅ PASSED | `npm run demo` (`scripts/demo.js` exited code 0 with 100% assertions green) |
