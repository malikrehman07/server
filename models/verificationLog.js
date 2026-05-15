const mongoose = require("mongoose");

const verificationLogSchema = new mongoose.Schema(
  {
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ngo",
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      enum: ["UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"],
    },

    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerificationLog", verificationLogSchema);