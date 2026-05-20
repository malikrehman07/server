const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../config/cloudinary");
const sendEmail = require("../utils/sendEmail");

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
        uploadedDocs.push({
          url: file.path,
          public_id: file.filename,
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


// =========================
// FORGOT PASSWORD
// =========================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send email via Resend
    const mailOptions = {
      email: user.email,
      subject: "GiveHope - Password Reset OTP",
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #07887f; text-align: center;">GiveHope Password Reset</h2>
          <p>Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>You requested a password reset for your GiveHope account. Please use the following 6-digit One-Time Password (OTP) to update your password:</p>
          <div style="background-color: #f4f6f6; border: 1px dashed #07887f; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #07887f; margin: 20px 0; border-radius: 4px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} GiveHope. All rights reserved.</p>
        </div>
      `,
    };

    await sendEmail(mailOptions);
    res.status(200).json({ success: true, message: "OTP sent to your email address" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: err.message || "Server error occurred" });
  }
};


// =========================
// RESET PASSWORD
// =========================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields (email, otp, newPassword) are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or OTP has expired" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOTP = "";
    user.resetPasswordOTPExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: "Password has been reset successfully" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: err.message || "Server error occurred" });
  }
};


// =========================
// UPDATE PROFILE (ADMIN/NGO)
// =========================
exports.updateProfile = async (req, res) => {
  try {
    const { email, password, oldPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      // Check if another user already has this email
      const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: "Email is already in use by another account" });
      }
      user.email = cleanEmail;
    }

    if (password) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Previous password is required to change password" });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect previous password" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    // Return updated user (excluding password)
    const updatedUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
      token: jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      )
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: err.message || "Server error occurred" });
  }
};