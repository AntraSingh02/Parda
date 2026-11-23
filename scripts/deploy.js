const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { getPoseidon, buildMerkleTree, getEddsa } = require("../circuits/zk_helpers");

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

  const reg1 = signers.length > 1 ? signers[1].address : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const reg2 = signers.length > 2 ? signers[2].address : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const reg3 = signers.length > 3 ? signers[3].address : "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

  console.log("Deployer Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

  // 1. Deploy Verifier
  console.log("\n[1/5] Deploying Groth16 Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ Groth16Verifier deployed to:", verifierAddress);

  // 2. Build real Poseidon Merkle root & Deploy HospitalRegistry
  console.log("\n[2/5] Building Poseidon Merkle root & Deploying HospitalRegistry...");
  const poseidon = await getPoseidon();
  const F = poseidon.F;
  const eddsa = await getEddsa();

  const hospitalPrivKey = "0x0001020304050607080900010203040506070809000102030405060708090001";
  const privBuf = Buffer.from(hospitalPrivKey.replace("0x", ""), "hex");
  const pubKey = eddsa.prv2pub(privBuf);
  const hospitalLeaf = F.toObject(poseidon([F.toObject(pubKey[0]), F.toObject(pubKey[1])]));

  const hospitalTree = await buildMerkleTree([hospitalLeaf, 111n, 222n, 333n], 8);
  const initialHospitalRoot = "0x" + BigInt(hospitalTree.root).toString(16).padStart(64, "0");

  const Registry = await ethers.getContractFactory("HospitalRegistry");
  const registry = await Registry.deploy([reg1, reg2, reg3], initialHospitalRoot);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ HospitalRegistry deployed to:", registryAddress);
  console.log("🏥 Initial Approved Hospital Root:", initialHospitalRoot);

  // 3. Deploy ClaimManager with escrow liquidity
  console.log("\n[3/5] Deploying ClaimManager Contract...");
  const payoutWeiPerRupee = ethers.parseEther("0.0001");
  const isLocal = network.chainId === 31337n;

  let initialEscrow = ethers.parseEther("5.0");
  if (!isLocal) {
    if (process.env.INITIAL_ESCROW_ETH) {
      initialEscrow = ethers.parseEther(process.env.INITIAL_ESCROW_ETH);
    } else if (balance < ethers.parseEther("0.1")) {
      initialEscrow = ethers.parseEther("0.005");
    } else {
      initialEscrow = ethers.parseEther("0.05");
    }
  }

  const ClaimManager = await ethers.getContractFactory("ClaimManager");
  const claimManager = await ClaimManager.deploy(verifierAddress, registryAddress, payoutWeiPerRupee, {
    value: initialEscrow
  });
  await claimManager.waitForDeployment();
  const claimManagerAddress = await claimManager.getAddress();
  console.log("✅ ClaimManager deployed to:", claimManagerAddress);
  console.log(`💰 Seeded Escrow Liquidity Pool with ${ethers.formatEther(initialEscrow)} ETH`);

  // 4. Deploy AccessRegistry
  console.log("\n[4/5] Deploying AccessRegistry Contract...");
  const Access = await ethers.getContractFactory("AccessRegistry");
  const accessRegistry = await Access.deploy();
  await accessRegistry.waitForDeployment();
  const accessAddress = await accessRegistry.getAddress();
  console.log("✅ AccessRegistry deployed to:", accessAddress);

  // 5. Deploy AuditAnchor
  console.log("\n[5/5] Deploying AuditAnchor Contract...");
  const Audit = await ethers.getContractFactory("AuditAnchor");
  const auditAnchor = await Audit.deploy(deployer.address);
  await auditAnchor.waitForDeployment();
  const auditAddress = await auditAnchor.getAddress();
  console.log("✅ AuditAnchor deployed to:", auditAddress);

  // Export addresses to frontend & client config
  const deployedConfig = {
    network: network.name === "unknown" ? "sepolia" : network.name,
    chainId: network.chainId.toString(),
    verifier: verifierAddress,
    hospitalRegistry: registryAddress,
    claimManager: claimManagerAddress,
    accessRegistry: accessAddress,
    auditAnchor: auditAddress,
    hospitalMerkleRoot: initialHospitalRoot
  };

  const outputPath = path.join(__dirname, "..", "deployed_addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedConfig, null, 2));

  const frontendConfigPath = path.join(__dirname, "..", "frontend", "src", "contracts", "deployed_addresses.json");
  if (fs.existsSync(path.dirname(frontendConfigPath))) {
    fs.writeFileSync(frontendConfigPath, JSON.stringify(deployedConfig, null, 2));
  }

  console.log("\n💾 Deployed addresses saved to:", outputPath);
  console.log("💾 Frontend config updated at:", frontendConfigPath);

  // Auto-sync frontend ABIs and contract address definitions
  try {
    require("./export_abis");
  } catch (err) {
    console.warn("⚠️ Could not auto-sync frontend ABIs:", err.message);
  }

  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
