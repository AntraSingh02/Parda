require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const sepoliaRpc = (!process.env.SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL.trim() === "https://rpc.sepolia.org")
  ? "https://ethereum-sepolia-rpc.publicnode.com"
  : process.env.SEPOLIA_RPC_URL.trim();

const rawKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : "";
const formattedKey = rawKey ? (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) : null;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: sepoliaRpc,
      accounts: formattedKey ? [formattedKey] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
