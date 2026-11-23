# ZK Public Signal Order Specification (docs/zk-public-inputs.md)

In Circom 2 + snarkjs Groth16, public signals are serialized in Solidity calldata in a strictly deterministic sequence: **all circuit outputs first, followed by the declared `public [...]` inputs in order**.

For `ClaimEligibility(8, 6)`:

| Index | Signal Identifier | Direction | Field | Description |
| :---: | :--- | :---: | :---: | :--- |
| `pubSignals[0]` | `nullifier` | Output | BN254 Scalar | `Poseidon(policySalt, recordId)` anti-replay nullifier |
| `pubSignals[1]` | `hospitalRoot` | Public Input | BN254 Scalar | Approved licensed hospitals Merkle root |
| `pubSignals[2]` | `policyCommitment` | Public Input | BN254 Scalar | Hash commitment of patient + coverage set + limits |
| `pubSignals[3]` | `claimAmount` | Public Input | 64-bit uint | Claim reimbursement amount in integer rupees |
| `pubSignals[4]` | `claimDay` | Public Input | 64-bit uint | Date of medical procedure in Unix day number |
| `pubSignals[5]` | `recipient` | Public Input | uint160 | Destination payout address of the licensed hospital |

Total public signals count: **6**.
Any reordering or count mismatch causes the smart contract verifier pairing check to revert immediately.
