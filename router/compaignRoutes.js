const express = require("express");
const router = express.Router();
const compaignController = require("../controllers/compaignController");
const upload = require("../middlewares/upload");
const { protect, approvedNGOOnly } = require("../middlewares/authMiddleware");

// NGO routes
router.post(
  "/add",
  protect,
  approvedNGOOnly,
  upload.array("images", 5),
  compaignController.createCampaign
);

router.put(
  "/update/:id",
  protect,
  approvedNGOOnly,
  upload.array("images", 5),
  compaignController.updateCampaign
);

router.get("/my/:uid", protect, compaignController.getMyCampaigns);
router.get("/search", compaignController.searchCampaigns);

// Public routes
router.get("/read", compaignController.getAllCampaigns);
router.get("/read/:id", compaignController.getCampaignById);

module.exports = router;