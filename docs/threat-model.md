# Privacy & Security Threat Model (docs/threat-model.md)

## 1. System Boundaries: On-Chain vs. Off-Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OFF-CHAIN (PATIENT HELD)                         │
│  - Plaintext FHIR Medical Record (Condition, CPT Procedure, Prescriptions)   │
│  - Patient Private Key (ECDH P-256 Encryption & ECDSA P-256 Signing)       │
│  - Random 256-bit Record DEK (Data Encryption Key)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
            Client-Side AES-256-GCM   │  Encrypted in Browser
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OFF-CHAIN (SHARED & PINNED)                      │
│  - Ciphertext Bundle (Nonce + AES-256-GCM Ciphertext + Auth Tag)            │
│  - Wrapped DEKs (Ephemeral ECDH + HKDF wrapped per authorized doctor)       │
│  - Hospital Baby Jubjub EdDSA Signature on Poseidon Claim Message           │
│  - ZK Prover Private Witness (Blinded diagnosis, policy limit, secret salt) │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              snarkjs Groth16 Proof   │  Only Proof & 6 Public Signals
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ON-CHAIN (PUBLIC ETHEREUM)                       │
│  - ClaimManager Contract Escrow Pool (ETH / Stablecoins)                    │
│  - Public Signals: [nullifier, hospitalRoot, policyCommitment,              │
│                     claimAmount, claimDay, recipient]                       │
│  - Anti-Replay Spent Nullifier Mapping                                      │
│  - HospitalRegistry Merkle Root (2-of-3 Regulator Multi-Sig)                │
│  - AuditAnchor Batch Merkle Roots                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Threat Analysis & Mitigations

### 2.1 Threat: Insurer or Eavesdropper Snoops Medical Records
- **Attack Vector:** Insurer queries RPC node or decodes `submitClaim` transaction calldata to extract patient's diagnosis or prescriptions.
- **Defense:** The smart contract only receives 6 field elements: `[nullifier, hospitalRoot, policyCommitment, claimAmount, claimDay, recipient]`. Diagnosis, procedure codes, and prescriptions never enter transaction calldata or smart contract storage.

### 2.2 Threat: Double-Claim / Replay Attack
- **Attack Vector:** Malicious hospital submits the same claim repeatedly to drain insurer escrow.
- **Defense:** `ClaimManager.sol` checks `usedNullifiers[nullifier]`. Nullifier is derived as $\text{Poseidon}(\text{policySalt}, \text{recordId})$. After verification, the nullifier is permanently marked as spent before transferring funds (Checks-Effects-Interactions).

### 2.3 Threat: Front-Running Payout Redirection
- **Attack Vector:** An attacker observes a valid claim transaction in the mempool and attempts to resubmit it with their own wallet address as the payout recipient.
- **Defense:** `recipient` is constrained inside the ZK circuit (`recipient * recipient`) and is bound to the hospital's EdDSA signature. Any change to `recipient` invalidates the proof and signature checks.

### 2.4 Threat: Stolen Server / Database Breach
- **Attack Vector:** Server or database holding patient records is compromised.
- **Defense:** The server only stores ciphertext. Plaintext is encrypted client-side in the browser using AES-256-GCM. Decryption keys are wrapped strictly for the patient and explicitly authorized doctors. Server administrators have zero access to keys.

### 2.5 Threat: Low-Entropy Text Brute-Force via Hashes
- **Attack Vector:** Attacker attempts to rainbow-table or brute-force patient conditions from on-chain hashes.
- **Defense:** Plaintext is **NEVER** hashed on-chain. On-chain anchors strictly hash **high-entropy AES-GCM ciphertext**.
