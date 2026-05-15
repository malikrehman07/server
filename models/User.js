const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["Admin", "Ngo"],
      default: "Ngo",
    },

    // NGO ONLY FIELDS (VALIDATION HANDLED IN CONTROLLER)
    organizationName: String,
    registrationNumber: String,
    phone: String,
    address: String,
    website: { type: String, default: "" },
    description: { type: String, default: "" },

    documents: [documentSchema],

    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "suspended"],
      default: "pending",
    },
    
    walletAddress: {
      type: String,
      default: ""
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);