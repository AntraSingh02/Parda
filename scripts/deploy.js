const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("🚀 Deploying ZKP Health Insurance Settlement System");
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy Verifier
  console.log("\n[1/3] Deploying Groth16 Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ Groth16Verifier deployed to:", verifierAddress);

  // 2. Deploy Insurance Settlement Contract
  console.log("\n[2/3] Deploying InsuranceSettlement Contract...");
  // Initial Approved Hospitals Root (Calculated from circuits/generate_sample_input.js)
  const initialHospitalRoot = ethers.keccak256(ethers.toUtf8Bytes("APPROVED_HOSPITALS_ROOT"));
  const initialLiquidity = ethers.parseEther("5.0"); // Seed contract with 5 ETH liquidity for payouts

  const Settlement = await ethers.getContractFactory("InsuranceSettlement");
  const settlement = await Settlement.deploy(verifierAddress, initialHospitalRoot, {
    value: initialLiquidity,
  });
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log("✅ InsuranceSettlement deployed to:", settlementAddress);
  console.log("💰 Seeded Liquidity Pool with 5.0 ETH");

  // 3. Deploy AccessRegistry
  console.log("\n[3/3] Deploying AccessRegistry Contract...");
  const Access = await ethers.getContractFactory("AccessRegistry");
  const accessRegistry = await Access.deploy();
  await accessRegistry.waitForDeployment();
  const accessAddress = await accessRegistry.getAddress();
  console.log("✅ AccessRegistry deployed to:", accessAddress);

  // Export addresses to frontend-ready config
  const deployedConfig = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    verifier: verifierAddress,
    insuranceSettlement: settlementAddress,
    accessRegistry: accessAddress,
    hospitalMerkleRoot: initialHospitalRoot,
  };

  const outputPath = path.join(__dirname, "..", "deployed_addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedConfig, null, 2));
  console.log("\n💾 Deployed addresses saved to:", outputPath);
  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
