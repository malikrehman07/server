const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    donorName: {
      type: String,
      required: true,
    },

    donorEmail: {
      type: String,
      default: "",
    },

    phoneNo: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    postalCode: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    paymentMethod: {
      type: String,
      enum: ["card", "crypto"],
      default: "card",
    },

    transactionHash: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);