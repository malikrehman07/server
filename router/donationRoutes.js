const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const { protect, adminOnly, approvedNGOOnly } = require("../middlewares/authMiddleware");

// Public
router.post("/create", donationController.createDonation);
router.post("/card-payment", donationController.processCardDonation);

// NGO - Specific
router.get("/ngo/:ngoId", protect, approvedNGOOnly, donationController.getNgoDonations);
router.get("/ngo-donors/:ngoId", protect, approvedNGOOnly, donationController.getNgoDonors);

// Admin - All
router.get("/all", protect, adminOnly, donationController.getAllDonations);
router.get("/donors", protect, adminOnly, donationController.getDonors);

// Stats (General)
router.get("/stats", protect, donationController.getStats);

// Campaign Specific
router.get("/campaign/:campaignId", donationController.getCampaignDonations);

module.exports = router;
