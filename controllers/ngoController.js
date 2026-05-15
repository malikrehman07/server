const contract = require("../config/blockchain");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const { ethers } = require("ethers");

// UPDATE NGO SETTINGS (USER-BASED SYSTEM)
exports.updateNgoSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const documents = req.files
      ? req.files.map(file => ({
        url: file.path,
        public_id: file.filename,
      }))
      : [];

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.organizationName = req.body.organizationName;
    user.registrationNumber = req.body.registrationNumber;
    user.phone = req.body.phone;
    user.address = req.body.address;
    user.website = req.body.website;
    user.description = req.body.description;

    if (documents.length > 0) {
      user.documents = documents;
    }

    user.status = "under_review";
    await user.save();

    return res.json({ success: true, user });
  } catch (err) {
    console.error("NGO SETTINGS ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Connecting wallet for user:", user._id, "New Address:", walletAddress, "Current Status:", user.status);

    // Allow NGOs that are approved OR under review to connect/update wallet
    if (user.status !== "approved" && user.status !== "under_review") {
      return res.status(403).json({ message: "NGO status must be approved or under review to connect a wallet. Current: " + user.status });
    }

    // 1. Update Database
    user.walletAddress = walletAddress;
    await user.save();

    // 2. Update Blockchain
    try {
      const tx = await contract.addNGO(walletAddress, {
        maxPriorityFeePerGas: ethers.parseUnits("40", "gwei"),
        maxFeePerGas: ethers.parseUnits("60", "gwei")
      });
      await tx.wait();
      console.log("Blockchain verification success for wallet:", walletAddress);
    } catch (bcErr) {
      console.warn("Blockchain addNGO notice (Might already be added):", bcErr.message);
      // We don't crash here if the NGO is already registered on chain
    }

    res.json({ success: true, message: "Wallet connected & NGO verified", user });
  } catch (err) {
    console.error("CONNECT WALLET ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// =========================
// WITHDRAWAL HISTORY
// =========================
exports.recordWithdrawal = async (req, res) => {
  try {
    const { amount, walletAddress, transactionHash } = req.body;
    const withdrawal = await Withdrawal.create({
      ngo: req.user._id,
      amount,
      walletAddress,
      transactionHash
    });

    res.status(201).json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWithdrawalHistory = async (req, res) => {
  try {
    const history = await Withdrawal.find({ ngo: req.params.ngoId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};