const { model } = require("mongoose");
const { error } = require("console");
// const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const User = require("../models/user.model.js"); // Import your User model

// app.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     if (!req.body.email || typeof req.body.email !== "string") {
//       return res.status(400).json({ error: "Invalid email address" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ userId: user._id }, "your_jwt_secret", {
//       expiresIn: "1h",
//     });

//     res.status(200).json({ token });
//   } catch (error) {
//     res.status(500).json({ message: "Error logging in" });
//   }

const login = async (req, res) => {
  try {
    // Validate email and password
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = login;
