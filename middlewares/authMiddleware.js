const jwt = require("jsonwebtoken");
const User = require("../models/User");


// =========================
// PROTECT ROUTES
// =========================
exports.protect = async (req, res, next) => {

  try {

    let token;

    // =========================
    // GET TOKEN
    // =========================
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // =========================
    // NO TOKEN
    // =========================
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token"
      });
    }

    // =========================
    // VERIFY TOKEN
    // =========================
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =========================
    // GET USER
    // =========================
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    next();

  } catch (err) {

    console.error(err);

    return res.status(401).json({
      message: "Invalid token"
    });
  }
};


// =========================
// ADMIN ONLY
// =========================
exports.adminOnly = (req, res, next) => {

  if (req.user.role !== "Admin") {
    return res.status(403).json({
      message: "Admin access only"
    });
  }

  next();
};


// =========================
// APPROVED NGO ONLY
// =========================
// exports.approvedNGOOnly = (req, res, next) => {

//   if (req.user.role !== "Ngo") {
//     return res.status(403).json({
//       message: "NGO access only"
//     });
//   }

//   if (req.user.status !== "approved") {
//     return res.status(403).json({
//       message: "NGO account not approved yet"
//     });
//   }

//   next();
// };

exports.approvedNGOOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.role !== "Ngo") {
      return res.status(403).json({
        message: "NGO access only"
      });
    }

    if (user.status !== "approved") {
      return res.status(403).json({
        message: "NGO not approved yet"
      });
    }

    req.user = user;
    next();

  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};