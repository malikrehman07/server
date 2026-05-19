const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const ngoController = require("../controllers/ngoController");
const { protect, approvedNGOOnly } = require("../middlewares/authMiddleware");

router.post(
  "/upload-documents",
  upload.array("documents", 5),
  async (req, res) => {
    try {

      const documentUrls = req.files.map(file => file.path);

      res.status(200).json({
        success: true,
        documents: documentUrls
      });

    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

// NGO SETTINGS UPDATE (UPLOAD DOCUMENTS)
router.put(
  "/settings/:id",
  upload.array("documents", 5),
  ngoController.updateNgoSettings
);

router.put(
  "/connect-wallet",
  protect,
  approvedNGOOnly,
  ngoController.connectWallet
);

// WITHDRAWALS
router.post("/withdrawal/record", protect, approvedNGOOnly, ngoController.recordWithdrawal);
router.get("/withdrawal/history/:ngoId", protect, approvedNGOOnly, ngoController.getWithdrawalHistory);

// PUBLIC ROUTES (No auth required)
router.get("/public/all", ngoController.getPublicNgos);
router.get("/public/:id", ngoController.getPublicNgoById);

module.exports = router;
