const express = require("express");
const router = express.Router();

const { register, login, forgotPassword, resetPassword, updateProfile } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const upload = require("../middlewares/upload");

// =========================
// REGISTER ROUTE
// =========================
router.post(
  "/register",
  upload.array("documents"),
  register
);

// LOGIN
router.post("/login", login);

// FORGOT & RESET PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// UPDATE PROFILE
router.put("/update-profile", protect, updateProfile);

// PROFILE
router.get("/user", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;