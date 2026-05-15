const Donation = require("../models/Donation");
const Campaign = require("../models/Compaign");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");
const { ethers } = require("ethers");
const ABI = require("../abi/GiveHopeCampaigns.json");

// =========================
// PROCESS CARD DONATION (FIAT SIMULATION)
// =========================
exports.processCardDonation = async (req, res) => {
  try {
    const {
      campaignId,
      ngoId,
      donorName,
      donorEmail,
      phoneNo,
      address,
      city,
      postalCode,
      amount, // In MATIC
      isAnonymous,
      // Card details are simulated and not stored
    } = req.body;

    // 1. Fetch Campaign from DB to get the REAL Blockchain ID
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.blockchainCampaignId === undefined) {
      return res.status(404).json({ message: "Campaign not found or not synced with blockchain" });
    }

    // 2. Initialize Blockchain Provider & Wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI.abi || ABI, wallet);

    console.log(`Processing card donation: ${amount} MATIC for blockchain campaign ${campaign.blockchainCampaignId}`);

    // 3. Execute REAL Blockchain Transaction from Platform Wallet
    const tx = await contract.donate(campaign.blockchainCampaignId, {
      value: ethers.parseEther(amount.toString()),
      maxPriorityFeePerGas: ethers.parseUnits("40", "gwei"),
      maxFeePerGas: ethers.parseUnits("60", "gwei")
    });

    console.log("Transaction sent:", tx.hash);

    // 3. Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // 4. Create the donation record in MongoDB
    const donation = await Donation.create({
      campaign: campaignId,
      ngo: ngoId,
      donorName: isAnonymous ? "Anonymous" : donorName,
      donorEmail,
      phoneNo,
      address: isAnonymous ? "N/A" : address,
      city: isAnonymous ? "N/A" : city,
      postalCode: isAnonymous ? "N/A" : postalCode,
      amount,
      isAnonymous,
      paymentMethod: "card",
      transactionHash: tx.hash,
      status: "Completed",
    });

    // 5. Update the Campaign raisedAmount in MongoDB (locally)
    campaign.raisedAmount += Number(amount);
    if (campaign.raisedAmount >= campaign.targetAmount) {
      campaign.status = "completed";
    }
    await campaign.save();

    // 6. Send Confirmation Email
    try {
      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: #108ee9; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>Donation Successful (Card Payment)</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
            <p>Dear ${isAnonymous ? "Supporter" : donorName},</p>
            <p>Your simulated card payment was successful, and we have processed a real blockchain donation of <strong>${amount} MATIC</strong> on your behalf.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Blockchain Receipt:</h3>
              <p><strong>Transaction Hash:</strong> <br/> <code style="word-break: break-all; color: #108ee9;">${tx.hash}</code></p>
              <p><strong>Payment Method:</strong> Secure Card Gateway (Simulated)</p>
              <p><strong>Status:</strong> Publicly Traceable on Polygon Amoy</p>
            </div>

            <p>You can track your transaction publicly on the blockchain explorer here: <br/> 
              <a href="https://amoy.polygonscan.com/tx/${tx.hash}" style="color: #108ee9; font-weight: bold;">View on Polygon Amoy Explorer</a>
            </p>

            <p>Thank you for testing our platform's fiat-to-crypto bridge!</p>
            <p>Best Regards,<br/><strong>GiveHope Team</strong></p>
          </div>
        </div>
      `;

      await sendEmail({
        email: donorEmail,
        subject: "Your Donation Receipt - GiveHope",
        message: emailTemplate,
      });
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
    }

    res.status(201).json({
      success: true,
      transactionHash: tx.hash,
      donation,
    });

  } catch (err) {
    console.error("Card donation error:", err);
    res.status(500).json({ message: "Payment processing failed. Please check backend logs." });
  }
};

// =========================
// CREATE DONATION
// =========================
exports.createDonation = async (req, res) => {
  try {
    const {
      campaignId,
      ngoId,
      donorName,
      donorEmail,
      phoneNo,
      address,
      city,
      postalCode,
      amount, // In MATIC
      isAnonymous,
      paymentMethod,
      transactionHash,
    } = req.body;

    // 1. Create the donation record
    const donation = await Donation.create({
      campaign: campaignId,
      ngo: ngoId,
      donorName: isAnonymous ? "Anonymous" : donorName,
      donorEmail,
      phoneNo,
      address: isAnonymous ? "N/A" : address,
      city: isAnonymous ? "N/A" : city,
      postalCode: isAnonymous ? "N/A" : postalCode,
      amount,
      isAnonymous,
      paymentMethod,
      transactionHash,
      status: "Completed",
    });

    // 2. Update the Campaign raisedAmount and status in MongoDB
    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      campaign.raisedAmount += Number(amount);
      
      // Automatic completion logic
      if (campaign.raisedAmount >= campaign.targetAmount) {
        campaign.status = "completed";
      }
      
      await campaign.save();
    }

    // 3. Send Confirmation Email
    try {
      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: #108ee9; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>Thank You for Your Donation!</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
            <p>Dear ${isAnonymous ? "Supporter" : donorName},</p>
            <p>Your generous donation of <strong>${amount} MATIC</strong> has been successfully received.</p>
            <p>Your contribution directly supports our mission to bring hope to those in need. We truly appreciate your kindness.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Transaction Details:</h3>
              <p><strong>Transaction Hash:</strong> <br/> <code style="word-break: break-all; color: #108ee9;">${transactionHash}</code></p>
              <p><strong>Payment Method:</strong> ${paymentMethod === 'crypto' ? 'MetaMask' : 'Card (Secure Gateway)'}</p>
              <p><strong>Status:</strong> Completed</p>
            </div>

            <p>You can track your transaction on the blockchain here: <br/> 
              <a href="https://amoy.polygonscan.com/tx/${transactionHash}" style="color: #108ee9;">View on PolygonScan</a>
            </p>

            <p>Best Regards,<br/><strong>GiveHope Team</strong></p>
          </div>
        </div>
      `;

      await sendEmail({
        email: donorEmail,
        subject: "Donation Confirmation - GiveHope",
        message: emailTemplate,
      });
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
    }

    res.status(201).json({
      success: true,
      donation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET NGO DONATIONS
// =========================
exports.getNgoDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ ngo: req.params.ngoId })
      .populate("campaign", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      donations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET ALL DONATIONS (ADMIN)
// =========================
exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("campaign", "title")
      .populate("ngo", "organizationName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      donations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET ALL DONORS (ADMIN)
// =========================
exports.getDonors = async (req, res) => {
  try {
    const donors = await Donation.aggregate([
      {
        $group: {
          _id: "$donorEmail",
          name: { $first: "$donorName" },
          email: { $first: "$donorEmail" },
          phone: { $first: "$phoneNo" },
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
          lastDonation: { $max: "$createdAt" },
        },
      },
      { $sort: { lastDonation: -1 } },
    ]);

    res.status(200).json({ success: true, donors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET NGO DONORS
// =========================
exports.getNgoDonors = async (req, res) => {
  try {
    const { ngoId } = req.params;
    const donors = await Donation.aggregate([
      { $match: { ngo: new mongoose.Types.ObjectId(ngoId) } },
      {
        $group: {
          _id: "$donorEmail",
          name: { $first: "$donorName" },
          email: { $first: "$donorEmail" },
          phone: { $first: "$phoneNo" },
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
          lastDonation: { $max: "$createdAt" },
        },
      },
      { $sort: { lastDonation: -1 } },
    ]);

    res.status(200).json({ success: true, donors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET CAMPAIGN DONATIONS (PUBLIC LIST)
// =========================
exports.getCampaignDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ campaign: req.params.campaignId })
      .select("donorName amount createdAt isAnonymous")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      donations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET STATS (ADMIN & NGO)
// =========================
exports.getStats = async (req, res) => {
  try {
    const { ngoId } = req.query;
    let filter = {};
    if (ngoId) filter.ngo = new mongoose.Types.ObjectId(ngoId);

    const donations = await Donation.find(filter);
    const totalDonations = donations.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDonors = new Set(donations.map(d => d.donorEmail)).size;
    
    let activeCampaignsFilter = { status: "active" };
    if (ngoId) activeCampaignsFilter.createdBy = ngoId;
    const activeCampaigns = await Campaign.countDocuments(activeCampaignsFilter);

    res.status(200).json({
      success: true,
      stats: {
        totalDonations,
        totalDonors,
        activeCampaigns,
        totalDonationCount: donations.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
