const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
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

// PROFILE
router.get("/user", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;