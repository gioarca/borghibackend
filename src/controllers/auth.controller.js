const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");
const errorHandler = require("../utils/error.js");
const generateResetToken = require("../utils/passwordReset/generateResetToken.js");
const sendResetPasswordEmail = require("../utils/passwordReset/sendResetPasswordEmail.js");
const sendUserAuthEmail = require("../utils/auth/sendUserAuthEmail.js");
require("dotenv").config();

// ---------- Verify Email ----------
const verifyEmail = async (req, res, next, Model) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ message: "Token is missing" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || !decodedToken.userId) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = await Model.findById(decodedToken.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.status(200).json({ message: "Email verification successful" });
  } catch (err) {
    console.error("Error verifying email:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "Token expired. Please request a new verification email.",
      });
    }
    next(errorHandler(500, "Internal Server Error"));
  }
};

// ---------- Request New Verification Email ----------
const requestNewVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    const newVerificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    user.emailVerificationToken = newVerificationToken;
    await user.save();

    await sendUserAuthEmail(user.email, newVerificationToken);

    res
      .status(200)
      .json({ message: "New verification email requested successfully" });
  } catch (error) {
    console.error(error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// ---------- Verify Password ----------
const verifyPassword = async (req, res, next, Model) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const validUser = await Model.findById(req.user.id);
    if (!validUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ message: "Wrong credentials. Please check your password." });
    }

    res.status(200).json({ message: "Correct Password" });
  } catch (error) {
    console.error(error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// ---------- Sign Out ----------
const signOut = async (req, res, next) => {
  try {
    const accessTokenCookie = req.cookies["access_token"];
    if (!accessTokenCookie) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(accessTokenCookie, process.env.JWT_SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.clearCookie("access_token");
    res
      .status(200)
      .json({ message: "Signout success for user ID: " + decodedToken.id });
  } catch (error) {
    console.error(error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// ---------- Password Reset Request ----------
const passwordResetRequest = async (req, res, next, Model) => {
  try {
    const { email } = req.body;
    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: `${Model.modelName} not found` });
    }

    const resetToken = generateResetToken(user);
    console.log(`Reset token: ${resetToken}`);

    await sendResetPasswordEmail(user.email, resetToken, Model);

    res
      .status(200)
      .json({ message: "Password reset email sent successfully", resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- Password Reset ----------
const passwordReset = async (req, res, next, Model) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      });
    }

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    const decodedToken = jwt.verify(token, process.env.RESET_SECRET);
    const user = await Model.findById(decodedToken.userId);
    if (!user) {
      return res.status(404).json({ message: `${Model.modelName} not found` });
    }

    user.password = bcryptjs.hashSync(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token expired" });
    }
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

module.exports = {
  verifyEmail,
  requestNewVerificationEmail,
  verifyPassword,
  signOut,
  passwordResetRequest,
  passwordReset,
};
