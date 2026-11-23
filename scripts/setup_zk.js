const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: "inherit", shell: true });
}

async function main() {
    const buildDir = path.join(__dirname, "..", "circuits", "build");
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    console.log("=== Step 1: Compiling Circom Circuit ===");
    run("npm run circuits:compile");

    console.log("=== Step 2: Groth16 Trusted Setup (Powers of Tau 14) ===");
    const pot0 = path.join(buildDir, "pot14_0000.ptau");
    const pot1 = path.join(buildDir, "pot14_0001.ptau");
    const potFinal = path.join(buildDir, "pot14_final.ptau");

    if (!fs.existsSync(potFinal)) {
        run(`npx snarkjs powersoftau new bn128 14 "${pot0}" -v`);
        run(`npx snarkjs powersoftau contribute "${pot0}" "${pot1}" --name="Parda Ceremony" -v -e="parda_hackasol_random_seed"`);
        run(`npx snarkjs powersoftau prepare phase2 "${pot1}" "${potFinal}" -v`);
    }

    console.log("=== Step 3: Groth16 Circuit Setup & Proving Key ===");
    const r1cs = path.join(buildDir, "claim_eligibility.r1cs");
    const zkey0 = path.join(buildDir, "claim_eligibility_0000.zkey");
    const zkeyFinal = path.join(buildDir, "claim_eligibility_final.zkey");

    run(`npx snarkjs groth16 setup "${r1cs}" "${potFinal}" "${zkey0}"`);
    run(`npx snarkjs zkey contribute "${zkey0}" "${zkeyFinal}" --name="Parda Contribution" -v -e="another_random_seed_parda"`);

    console.log("=== Step 4: Export Verification Key & Solidity Verifier ===");
    const vkPath = path.join(buildDir, "verification_key.json");
    const verifierSol = path.join(__dirname, "..", "contracts", "Verifier.sol");

    run(`npx snarkjs zkey export verificationkey "${zkeyFinal}" "${vkPath}"`);
    run(`npx snarkjs zkey export solidityverifier "${zkeyFinal}" "${verifierSol}"`);

    console.log("=== ZK Setup Complete ===");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
