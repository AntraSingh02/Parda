const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("🚀 Deploying ZKP Health Insurance Settlement System");
  console.log("=================================================");

  const signers = await ethers.getSigners();
  const deployer = signers && signers.length > 0 ? signers[0] : null;

  if (!deployer) {
    console.error("\n❌ ERROR: No deployer account found for this network.");
    console.error("👉 Reason: PRIVATE_KEY is missing from your .env file.");
    console.error("👉 Solution:");
    console.error("   1. Create a .env file in the root directory (copy from .env.example).");
    console.error("   2. Set: PRIVATE_KEY=0x<your_metamask_private_key>");
    console.error("   3. Set: SEPOLIA_RPC_URL=https://rpc.sepolia.org\n");
    process.exit(1);
  }

  console.log("Deployer Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

  // 1. Deploy Verifier
  console.log("\n[1/4] Deploying Groth16 Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ Groth16Verifier deployed to:", verifierAddress);

  // 2. Deploy HospitalRegistry
  console.log("\n[2/4] Deploying HospitalRegistry...");
  const sampleHospitalRoot = "0x0001020304050607080900010203040506070809000102030405060708090001";
  const HospitalRegistry = await ethers.getContractFactory("HospitalRegistry");
  const hospitalRegistry = await HospitalRegistry.deploy([deployer.address, deployer.address, deployer.address], sampleHospitalRoot);
  await hospitalRegistry.waitForDeployment();
  const registryAddress = await hospitalRegistry.getAddress();
  console.log("✅ HospitalRegistry deployed to:", registryAddress);

  // 3. Deploy ClaimManager
  console.log("\n[3/4] Deploying ClaimManager Escrow...");
  const payoutWeiPerRupee = 100000000000n; // 100 gwei
  const seedAmount = balance > ethers.parseEther("0.01") ? ethers.parseEther("0.001") : 0n;

  const ClaimManager = await ethers.getContractFactory("ClaimManager");
  const claimManager = await ClaimManager.deploy(
    verifierAddress,
    registryAddress,
    payoutWeiPerRupee,
    { value: seedAmount }
  );
  await claimManager.waitForDeployment();
  const claimManagerAddress = await claimManager.getAddress();
  console.log("✅ ClaimManager deployed to:", claimManagerAddress);
  if (seedAmount > 0n) {
    console.log(`💰 Seeded Escrow with ${ethers.formatEther(seedAmount)} ETH`);
  }

  // 4. Deploy AccessLog
  console.log("\n[4/4] Deploying AccessLog...");
  const Access = await ethers.getContractFactory("AccessLog");
  const accessRegistry = await Access.deploy();
  await accessRegistry.waitForDeployment();
  const accessAddress = await accessRegistry.getAddress();
  console.log("✅ AccessLog deployed to:", accessAddress);

  // Export addresses to frontend-ready config
  const deployedConfig = {
    network: network.name === "unknown" ? "sepolia" : network.name,
    chainId: network.chainId.toString(),
    verifier: verifierAddress,
    hospitalRegistry: registryAddress,
    claimManager: claimManagerAddress,
    accessLog: accessAddress,
    payoutWeiPerRupee: payoutWeiPerRupee.toString(),
    deployedAt: new Date().toISOString(),
    blockExplorerUrl: "https://sepolia.etherscan.io"
  };

  const outputPath = path.join(__dirname, "..", "deployed_addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedConfig, null, 2));
  
  const frontendConfigPath = path.join(__dirname, "..", "frontend", "src", "contracts", "deployed_addresses.json");
  if (fs.existsSync(path.dirname(frontendConfigPath))) {
    fs.writeFileSync(frontendConfigPath, JSON.stringify(deployedConfig, null, 2));
  }

  console.log("\n💾 Deployed addresses saved to:", outputPath);
  console.log("💾 Frontend config updated at:", frontendConfigPath);
  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
