const Admin = require("../models/admin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const { sendVerificationEmail } = require("../config/emailConfig");
const validateVAT = require("../utils/vatValidator");

// Register a new user, with VAT check for admins
module.exports.register = async (req, res) => {
  try {
    const { email, password, role, vatNumber } = req.body;

    // Check if email already exists
    const existingUser = await adminUser.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Validate VAT for admin users
    if (role === "admin") {
      const isValidVAT = await validateVAT(vatNumber);
      if (!isValidVAT) {
        return res
          .status(400)
          .json({ message: "Invalid VAT number for admin registration" });
      }
    }

    // Create user with hashed password
    const user = new adminUser({ email, password, role, vatNumber });
    const token = user.generateVerificationToken();

    user.verificationToken = token;
    await user.save();

    // Send verification email
    // await sendVerificationEmail(user, token);
    res.status(201).json({
      message: "User registered. Check email to verify your account.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password, vatNumber } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify VAT number if the user is an admin
    if (user.role === "admin" && user.vatNumber !== vatNumber) {
      return res.status(401).json({ message: "Invalid VAT number" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
