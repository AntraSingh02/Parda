# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Patients**: Individuals seeking sovereign ownership and privacy over sensitive medical records. They encrypt HL7 FHIR bundles client-side in the browser, retain exclusive custody of decryption keys, and selectively grant access to licensed healthcare providers via ephemeral key wrapping.
- **Treating Doctors / Hospitals**: Healthcare providers who receive patient-granted decryption keys, view patient history, verify policy coverage, and generate Groth16 zero-knowledge proofs certifying medical claim eligibility without leaking diagnoses or procedures.
- **Insurers / Underwriters / Regulators**: Insurance underwriters and healthcare regulators verifying claims on-chain against escrow solvency, multi-sig approved hospital registries (2-of-3 multi-sig), and cryptographic anti-replay nullifiers without inspecting underlying medical records.

## Product Purpose
PARDA eliminates the fundamental privacy tradeoff in health insurance workflows. Traditional health insurance requires patients and hospitals to transmit unencrypted diagnostic codes (ICD-10), CPT procedures, and pharmacy histories to third-party underwriters, leading to mass data exposure, centralized leaks, and prolonged settlement delays. PARDA enables autonomous, instant claim payouts from on-chain escrow via zero-knowledge proofs (Circom Groth16 SNARKs) that mathematically prove claim eligibility, policy limits, licensed hospital status, and EdDSA in-circuit authorization while preserving zero-knowledge medical privacy. Success means instant claim settlement with zero plaintext exposure to insurers, servers, or the blockchain.

## Positioning
Unlike hardware-enclave solutions (e.g. Chainlink CRE / ClaimShield) that trust third-party cloud hardware to process plaintext health records, or simple off-chain decryption portals (e.g. MedZK), PARDA executes pure zero-knowledge cryptographic proofs (`circomlib` Groth16) with in-circuit EdDSA Baby Jubjub signatures and Poseidon nullifiers $\text{Poseidon}(\text{policySalt}, \text{recordId})$, guaranteeing mathematically that no third party, cloud host, insurer, or blockchain ever sees unencrypted health records.

## Operating Context
- **Hackathon Presentation & Production-Ready Prototype**: High-assurance demonstration environment requiring seamless interaction between the three key personas (Patient, Hospital, Insurer) alongside dedicated verification panels:
  - **Privacy X-Ray**: A real-time 3-column transparency inspector comparing Patient View (Plaintext), Network Transmit (AES-256-GCM + Proof), and Insurer/Chain View (Field Elements Only).
  - **Red-Team Attack Simulator**: 7 live adversarial vectors (tampered amount, expired policy, unlicensed hospital, fake doctor signature, unapproved procedure, replay attack, front-running recipient hijacking) demonstrating immediate in-circuit or on-chain revert.
- **Technical Runtime**: Client-side browser cryptographic operations (WebCrypto API, SubtleCrypto AES-GCM + ECDH P-256 key wrapping, snarkjs Groth16 proof generation) coupled with Ethereum smart contracts (`ClaimManager.sol`, `HospitalRegistry.sol`, `AuditAnchor.sol`, `AccessLog.sol`).

## Capabilities and Constraints
- **Client-Side Cryptography**: AES-256-GCM record encryption in browser; ECDH ephemeral key exchange with HKDF key derivation for doctor DEK wrapping.
- **Zero-Knowledge Circuit**: Circom 2.1 Groth16 circuit enforcing 7 constraints: licensed hospital Merkle membership (depth 8), in-circuit EdDSA signature verification, approved procedure Merkle membership (depth 6), coverage cap check (64-bit), expiration date check, recipient address binding, and Poseidon nullifier derivation.
- **Autonomous Settlement**: On-chain `ClaimManager.sol` verifying 6 public signals, checking anti-replay `usedNullifiers`, and transferring payouts via Checks-Effects-Interactions pattern.
- **Regulatory Multi-Sig**: `HospitalRegistry.sol` managed by 2-of-3 regulator multi-sig consensus for updating licensed hospital Merkle roots.
- **Development Constraints**: Dev-only Groth16 trusted setup (requires Powers-of-Tau ceremony for production); patient private key stored in browser IndexedDB (loss of key means loss of data); simulated escrow pool using configurable wei-per-rupee exchange rate.

## Brand Commitments
- **Name**: PARDA (Hindi for veil/screen, symbolizing privacy and zero-knowledge protection).
- **Tone & Voice**: Cryptographically rigorous, sovereign, clinical yet modern, high-assurance. Transparent about data flows; zero tolerance for security-theater or unverified claims.
- **Identity & Aesthetics**: Dark forest palette (`#0B1713`), warm ivory typography (`#F3EFE5`), muted sage lines (`#9DAF9D`), and antique brass accents (`#B99561`). Typography: Plus Jakarta Sans / JetBrains Mono / Fraunces.

## Evidence on Hand
- **Smart Contracts**: `contracts/ClaimManager.sol`, `contracts/HospitalRegistry.sol`, `contracts/AuditAnchor.sol`, `contracts/AccessLog.sol`.
- **Circuits**: `circuits/claim_eligibility.circom` with compiled artifacts (`circuits/build/`).
- **Comprehensive Automated Tests**:
  - `npm run test:crypto` (WebCrypto, DEK wrapping, AES-GCM)
  - `npm run test:zk` (8/8 Groth16 test vectors passed)
  - `npm run test:contracts` (Autonomous settlement, reentrancy guard, multi-sig)
  - `npm run demo` (`scripts/demo.js` automated end-to-end execution)
- **Frontend**: Vite + React single-page app in `frontend/` featuring `PatientPortal.jsx`, `HospitalPortal.jsx`, `InsurerPortal.jsx`, `PrivacyXRay.jsx`, `RedTeamPanel.jsx`.

## Product Principles
1. **Zero Plaintext Leakage**: Plaintext diagnoses, procedures, and prescriptions must never touch an API server, insurer database, or blockchain state.
2. **Mathematical Verification Over Trust**: Enforce rules (eligibility, licenses, limits, signatures) inside the zero-knowledge circuit, not through trusted enclaves or off-chain promises.
3. **Sovereign Patient Custody**: Patients generate, hold, and selectively wrap keys client-side; no custodial backdoors or master keys.
4. **Transparent Auditability**: Provide immediate visual and cryptographic proof of what is exposed vs. what is shielded (Privacy X-Ray) and verify resilience under attack (Red-Team simulator).
5. **Deterministic Settlement**: Once a valid proof and unused nullifier are presented, smart contracts execute payouts automatically without manual claim adjuster friction.

## Accessibility & Inclusion
- Desktop & wide-screen primary workflow for clinical and insurer portals with high-contrast text ratios conforming to WCAG AA on dark backgrounds.
- Screen-readable status indicators for cryptographic verification stages and clear state feedback on asynchronous proving.
