const Campaign = require("../models/Compaign");

// =========================
// CREATE CAMPAIGN
// =========================
exports.createCampaign = async (req, res) => {
  try {
    const {
      blockchainCampaignId,
      contractAddress,
      ngoWallet,
      title,
      description,
      category,
      targetAmount,
    } = req.body;

    const imageUrls = req.files ? req.files.map((file) => file.path) : [];
    
    if (imageUrls.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    if (!req.user.walletAddress) {
      return res.status(403).json({ message: "Please link your wallet in the payout section before creating a campaign." });
    }

    const campaign = await Campaign.create({
      blockchainCampaignId: Number(blockchainCampaignId),
      contractAddress,
      ngoWallet,
      title,
      description,
      category,
      targetAmount: Number(targetAmount),
      coverImage: imageUrls[0],
      images: imageUrls,
      createdBy: req.user._id,
      status: "active"
    });

    res.status(201).json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// UPDATE CAMPAIGN
// =========================
exports.updateCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { title, description, category, existingImages, targetAmount } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let updatedImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
    if (req.files && req.files.length > 0) {
      updatedImages = [...updatedImages, ...req.files.map(f => f.path)];
    }

    campaign.title = title || campaign.title;
    campaign.description = description || campaign.description;
    campaign.category = category || campaign.category;
    campaign.images = updatedImages;
    campaign.coverImage = updatedImages[0] || campaign.coverImage;
    
    if (targetAmount) {
      campaign.targetAmount = Number(targetAmount);
      // Re-check status if target changed
      if (campaign.raisedAmount >= campaign.targetAmount) {
        campaign.status = "completed";
      } else {
        campaign.status = "active";
      }
    }

    await campaign.save();
    res.status(200).json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to sync status
const syncCampaignStatus = async (campaigns) => {
  for (let campaign of campaigns) {
    if (campaign.status === "active" && campaign.raisedAmount >= campaign.targetAmount) {
      campaign.status = "completed";
      await campaign.save();
    }
  }
  return campaigns;
};

// =========================
// GET NGO'S CAMPAIGNS
// =========================
exports.getMyCampaigns = async (req, res) => {
  try {
    let campaigns = await Campaign.find({ createdBy: req.params.uid }).sort({ createdAt: -1 });
    campaigns = await syncCampaignStatus(campaigns);
    res.status(200).json({ success: true, compaigns: campaigns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET ALL CAMPAIGNS (PUBLIC)
// =========================
exports.getAllCampaigns = async (req, res) => {
  try {
    // Proactively sync statuses for all active campaigns
    const activeOnes = await Campaign.find({ status: "active" });
    await syncCampaignStatus(activeOnes);

    // Now return only those that are still active
    const campaigns = await Campaign.find({ status: "active" })
      .populate("createdBy", "organizationName address")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, compaigns: campaigns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET CAMPAIGN BY ID
// =========================
exports.getCampaignById = async (req, res) => {
  try {
    let campaign;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        campaign = await Campaign.findById(req.params.id).populate("createdBy", "organizationName address phone");
    } else {
        campaign = await Campaign.findOne({ blockchainCampaignId: Number(req.params.id) }).populate("createdBy", "organizationName address phone");
    }

    if (!campaign) return res.status(404).json({ message: "Not found" });

    // Sync status before returning
    if (campaign.status === "active" && campaign.raisedAmount >= campaign.targetAmount) {
      campaign.status = "completed";
      await campaign.save();
    }

    res.status(200).json({ success: true, compaign: campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// SEARCH CAMPAIGNS (Filterable by NGO)
// =========================
exports.searchCampaigns = async (req, res) => {
  try {
    const { query, ngoId } = req.query;
    if (!query) return res.status(200).json({ success: true, compaigns: [] });

    let filter = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } }
      ]
    };

    if (ngoId) {
        filter.createdBy = ngoId;
    }

    const campaigns = await Campaign.find(filter).populate("createdBy", "organizationName address");

    res.status(200).json({ success: true, compaigns: campaigns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};