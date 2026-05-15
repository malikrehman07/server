const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../config/cloudinary");

// =========================
// REGISTER
// =========================
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      registrationNumber,
      phone,
      address,
      website,
      description
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================
    // UPLOAD FILES (ONLY NGO)
    // =========================
    let uploadedDocs = [];

    if (role === "Ngo" && req.files?.length > 0) {
      for (const file of req.files) {

        // IMPORTANT: if using multer memoryStorage, use buffer
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: "ngo_documents",
          }
        );

        uploadedDocs.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      organizationName: role === "Ngo" ? req.body.organizationName : undefined,
      registrationNumber: role === "Ngo" ? registrationNumber : undefined,
      phone: role === "Ngo" ? phone : undefined,
      address: role === "Ngo" ? address : undefined,
      website: role === "Ngo" ? website : "",
      description: role === "Ngo" ? description : "",
      documents: uploadedDocs,
      status: role === "Ngo" ? "under_review" : "approved",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registered successfully",
      user,
      token
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


// =========================
// LOGIN
// =========================
exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    // =========================
    // FIND USER
    // =========================
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // =========================
    // CHECK PASSWORD
    // =========================
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    // =========================
    // RESPONSE
    // =========================
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token: jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      )
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
};