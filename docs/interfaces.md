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
$$\text{msg} = \text{Poseidon}(\text{recordId}, \text{patientIdHash}, \text{procedureCode}, \text{claimAmount}, \text{claimDay})$$

---

## 3. ZK Circuit Input & Public Signals Schema

### 3.1 Private Inputs
- `hospitalAx`, `hospitalAy`: Hospital Baby Jubjub public key coordinates
- `sigR8x`, `sigR8y`, `sigS`: EdDSA signature on `msg`
- `hospitalPathElements[8]`: Sibling hashes in hospital Merkle tree (depth 8)
- `hospitalPathIndices[8]`: Path directions (0 or 1)
- `recordId`: Unique identifier of the medical record
- `patientIdHash`: Blinded hash of patient identity
- `procedureCode`: Integer medical procedure code (e.g. `99213`)
- `procedurePathElements[6]`: Sibling hashes in policy's covered set Merkle tree (depth 6)
- `procedurePathIndices[6]`: Path directions (0 or 1)
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
function submitClaim(
    uint256[2] calldata a,
    uint256[2][2] calldata b,
    uint256[2] calldata c,
    uint256[6] calldata pubSignals
) external returns (bytes32 nullifier);

event ClaimVerified(
    bytes32 indexed nullifier,
    bytes32 indexed policyCommitment,
    uint256 claimAmount,
    address indexed recipient
);
```

### 4.2 `HospitalRegistry.sol`
```solidity
function proposeRoot(bytes32 newRoot) external returns (uint256 proposalId);
function approveRoot(uint256 proposalId) external;
event RootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
```

### 4.3 `AuditAnchor.sol`
```solidity
function anchor(bytes32 batchRoot, uint256 fromId, uint256 toId) external;
event AuditBatchAnchored(bytes32 indexed batchRoot, uint256 fromId, uint256 toId, uint256 timestamp);
```
