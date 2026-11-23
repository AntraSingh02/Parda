#!/usr/bin/env bash
set -e

echo "=== Compiling Circom Circuit ==="
mkdir -p circuits/build
circom circuits/claim_eligibility.circom --r1cs --wasm --sym -o circuits/build

echo "=== Groth16 Trusted Setup (Powers of Tau 14) ==="
npx snarkjs powersoftau new bn128 14 circuits/build/pot14_0000.ptau -v
npx snarkjs powersoftau contribute circuits/build/pot14_0000.ptau circuits/build/pot14_0001.ptau --name="Parda Ceremony" -v -e="parda_hackasol_random_seed"
npx snarkjs powersoftau prepare phase2 circuits/build/pot14_0001.ptau circuits/build/pot14_final.ptau -v

echo "=== Generating Groth16 Proving Key (zkey) ==="
npx snarkjs groth16 setup circuits/build/claim_eligibility.r1cs circuits/build/pot14_final.ptau circuits/build/claim_eligibility_0000.zkey
npx snarkjs zkey contribute circuits/build/claim_eligibility_0000.zkey circuits/build/claim_eligibility_final.zkey --name="Parda Contribution" -v -e="another_random_seed_parda"

echo "=== Exporting Verification Key ==="
npx snarkjs zkey export verificationkey circuits/build/claim_eligibility_final.zkey circuits/build/verification_key.json

echo "=== Exporting Solidity Verifier ==="
npx snarkjs zkey export solidityverifier circuits/build/claim_eligibility_final.zkey contracts/Verifier.sol

echo "=== ZK Setup Complete ==="
