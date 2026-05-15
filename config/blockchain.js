const { ethers } = require("ethers");
const abi = require("../abi/GiveHopeCampaigns.json"); // your compiled ABI

// =========================
// CONNECT PROVIDER (TESTNET / LOCAL / SEPOLIA)
// =========================
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL // e.g. Alchemy / Infura / Ganache RPC
);

// =========================
// ADMIN WALLET (PAYS GAS FEES)
// =========================
const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

// =========================
// SMART CONTRACT INSTANCE
// =========================
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet
);

module.exports = contract;