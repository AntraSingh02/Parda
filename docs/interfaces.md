# Frozen System Interfaces (docs/interfaces.md)

This document freezes cross-module interfaces for **Phase 0**. All modules (`zk/`, `contracts/`, `packages/crypto/`, `backend/`, and `frontend/`) adhere to these shapes.

---

## 1. Role-Permission Matrix (RBAC)

| Resource / Endpoint | `patient` | `provider:doctor` | `provider:billing` | `insurer` | `regulator` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `POST /records` (upload ciphertext) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /records/:id/versions` (append diagnosis) | ❌ | ✅ (with active grant) | ❌ | ❌ | ❌ |
| `GET /records/:id` (fetch ciphertext + wrapped key) | ✅ | ✅ (if active grant) | ✅ (if claim_prep grant) | ❌ | ❌ |
| `POST /records/:id/grants` (grant access) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /records/:id/grants` (revoke access) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `POST /claims/preflight` (run 4 rules) | ❌ | ❌ | ✅ | ❌ | ❌ |
| `POST /claims/prove` (generate proof) | ❌ | ❌ | ✅ | ❌ | ❌ |
| `POST /claims/submit` (send to chain) | ❌ | ❌ | ✅ | ❌ | ❌ |
| `GET /insurer/claims` (view public ledger) | ❌ | ❌ | ❌ | ✅ | ❌ |
| `POST /registry/propose` / `approve` | ❌ | ❌ | ❌ | ❌ | ✅ (2-of-3) |

---

## 2. Cryptographic Object Schemas

### 2.1 Policy Credential (Issued to Patient)
```json
{
  "patientIdHash": "0x1a2b...",
  "coveredSetRoot": "0x3c4d...",
  "policyLimit": 500000,
  "policyExpiryDay": 22280,
  "policySalt": "0x987654321..."
}
```
**On-Chain Policy Commitment:**
$$\text{policyCommitment} = \text{Poseidon}(\text{patientIdHash}, \text{coveredSetRoot}, \text{policyLimit}, \text{policyExpiryDay}, \text{policySalt})$$

### 2.2 In-Circuit Signed Claim Message
The licensed hospital's Baby Jubjub EdDSA key signs:
$$\text{msg} = \text{Poseidon}(\text{recordId}, \text{patientIdHash}, \text{procedureCode}, \text{claimAmount}, \text{claimDay}, \text{recipient})$$

### 2.3 On-Chain Record Anchoring & Revocation Key Rotation
- **Ciphertext Anchoring**: Contracts and `AuditAnchor` strictly anchor the SHA-256 digest of the encrypted ciphertext payload (matching both `packages/crypto` and `offchain/crypto_utils.py`). Plaintext records are never hashed directly on-chain to prevent dictionary / low-entropy guessing attacks.
- **Key Rotation on Revocation**: When access is revoked in `AccessRegistry`, the record is re-encrypted with a fresh Data Encryption Key (DEK), bumping the version bound to the AES-GCM Associated Authenticated Data (AAD), and re-wrapping the new DEK only for remaining authorized grantees. Past decrypted copies cannot be taken back, but revoked accessors are cryptographically barred from subsequent updates.

---

## 3. ZK Circuit Input & Public Signals Schema

### 3.1 Private Inputs
- `hospitalAx`, `hospitalAy`: Hospital Baby Jubjub public key coordinates
- `sigR8x`, `sigR8y`, `sigS`: EdDSA signature on `msg`
- `hospitalPathElements[8]`: Sibling hashes in hospital Merkle tree (depth 8)
- `hospitalPathIndices[8]`: Path directions (strictly 0 or 1, constrained in-circuit)
- `recordId`: Unique identifier of the medical record
- `patientIdHash`: Blinded hash of patient identity
- `procedureCode`: Integer medical procedure code (e.g. `99213`)
- `procedurePathElements[6]`: Sibling hashes in policy's covered set Merkle tree (depth 6)
- `procedurePathIndices[6]`: Path directions (strictly 0 or 1, constrained in-circuit)
- `policyLimit`: Maximum allowed payout (integer rupees)
- `policyExpiryDay`: Expiry date in Unix day number
- `policySalt`: Secret salt blinding the policy commitment

### 3.2 Public Signals (Confirmed Order)
1. `nullifier` ($\text{Poseidon}(\text{policySalt}, \text{recordId})$)
2. `hospitalRoot` (Root of licensed hospital Merkle tree)
3. `policyCommitment` (Registered on-chain commitment)
4. `claimAmount` (Integer rupees requested for settlement)
5. `claimDay` (Unix day number of procedure)
6. `recipient` (uint160 address of hospital payout account)

---

## 4. Smart Contract Interface Drafts

### 4.1 `ClaimManager.sol`
```solidity
function registerPolicy(bytes32 commitment, uint256 limit) external;
function submitClaim(
    uint256[2] calldata a,
    uint256[2][2] calldata b,
    uint256[2] calldata c,
    uint256[6] calldata pubSignals
) external returns (bytes32 nullifier);
function reconcileEscrow() external;

event ClaimVerified(
    bytes32 indexed nullifier,
    bytes32 indexed policyCommitment,
    uint256 claimAmount,
    address indexed recipient,
    uint256 payoutWei,
    uint256 remainingPolicyBalance
);
```

### 4.2 `HospitalRegistry.sol`
```solidity
function proposeRoot(bytes32 newRoot) external returns (uint256 proposalId);
function approveRoot(uint256 proposalId) external;
function invalidateRoot(bytes32 root) external;
function isValidRoot(bytes32 root) external view returns (bool);
event RootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot, uint256 proposalId);
event RootInvalidated(bytes32 indexed root, address indexed regulator);
```

### 4.3 `AuditAnchor.sol`
```solidity
function anchor(bytes32 batchRoot, uint256 fromId, uint256 toId) external;
event AuditBatchAnchored(bytes32 indexed batchRoot, uint256 fromId, uint256 toId, uint256 timestamp);
```
