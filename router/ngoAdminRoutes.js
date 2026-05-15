const router = require("express").Router();

const controller = require("../controllers/ngoAdminController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");


// admin only routes
router.get("/ngos", protect, adminOnly, controller.getAllNgos);

// router.get("/ngos/search", protect, adminOnly, controller.searchNgos);

router.put("/ngos/:id/status", protect, adminOnly, controller.updateNgoStatus);

router.put("/ngos/approve/:id", protect, adminOnly, controller.approveNgo);

router.put("/ngos/reject/:id", protect, adminOnly, controller.rejectNgo);

router.get("/ngos/:id", protect, adminOnly, controller.getNgoById);

module.exports = router;