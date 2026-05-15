const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({

  // =========================
  // BLOCKCHAIN
  // =========================
  blockchainCampaignId: {
    type: Number,
    required: true
  },

  contractAddress: {
    type: String,
    required: true
  },

  ngoWallet: {
    type: String,
    required: true
  },

  // =========================
  // UI DATA
  // =========================
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  targetAmount: {
    type: Number,
    required: true
  },

  raisedAmount: {
    type: Number,
    default: 0
  },

  coverImage: {
    type: String,
    required: true
  },

  images: [String],

  // =========================
  // REFERENCES
  // =========================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // =========================
  // STATUS
  // =========================
  status: {
    type: String,
    enum: [
      "active",
      "completed",
      "cancelled"
    ],
    default: "active"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Campaign",
  campaignSchema
);