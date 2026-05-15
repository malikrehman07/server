const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const VerificationLog = require("../models/verificationLog");
const User = require("../models/User");


// GET ALL NGOS (FILTER + SEARCH)
// exports.searchNgos = async (req, res) => {
//   try {
//     const { status, search } = req.query;

//     const query = {};

//     if (status) query.status = status;

//     if (search) {
//       query["organization.name"] = {
//         $regex: search,
//         $options: "i",
//       };
//     }

//     const ngos = await Ngo.find(query).sort({ createdAt: -1 });

//     res.json({ ngos });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
exports.approveNgo = async (req, res) => {
  try {
    const ngo = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    await VerificationLog.create({
      ngoId: ngo._id,
      adminId: req.user._id,
      action: "APPROVED",
      note: "Approved by admin",
    });

    res.json({ message: "NGO approved", ngo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.rejectNgo = async (req, res) => {
  try {
    const { note } = req.body;

    const ngo = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        verificationNote: note,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    await VerificationLog.create({
      ngoId: ngo._id,
      adminId: req.user._id,
      action: "REJECTED",
      note,
    });

    res.json({ message: "NGO rejected", ngo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getNgoById = async (req, res) => {
  try {
    const ngo = await User.findById(req.params.id).select("-password");

    const logs = await VerificationLog.find({ ngoId: req.params.id });

    res.json({ ngo, logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET ALL NGOS (ADMIN)
exports.getAllNgos = async (req, res) => {
  try {
    const ngos = await User.find({ role: "Ngo" }).select("-password");
    res.status(200).json({ success: true, total: ngos.length, ngos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE NGO STATUS
// =========================
exports.updateNgoStatus = async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

    // =========================
    // ALLOWED STATUS
    // =========================
    const allowedStatus = [
      "under_review",
      "approved",
      "rejected",
      "suspended"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    // =========================
    // FIND NGO
    // =========================
    const ngo = await User.findById(id);

    if (!ngo) {
      return res.status(404).json({
        message: "NGO not found"
      });
    }

    // =========================
    // UPDATE STATUS
    // =========================
    ngo.status = status;

    await ngo.save();

    res.status(200).json({
      success: true,
      message: "NGO status updated",
      ngo
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};