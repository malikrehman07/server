const mongoose = require("mongoose");
const Campaign = require("../models/Compaign");
require("dotenv").config();

async function checkCampaign() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/givehope");
  const c = await Campaign.findById("6a04ce3923fe3d896fe12a73");
  console.log("Campaign Data:", JSON.stringify(c, null, 2));
  process.exit(0);
}

checkCampaign();
