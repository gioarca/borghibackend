const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin"], required: true },
  // vatNumber: { type: String, required: true },
  // isVerified: { type: Boolean, default: false },
  // verificationToken: { type: String, default: "" },
});

// Hash password before saving
AdminSchema.pre("save", async function (next) {
  // Check if the password has been modified
  if (!this.isModified("password")) return next();

  try {
    // Hash the password with a salt of 10 rounds
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error); // Pass any errors to the next middleware
  }
});

// Compare Passwords
AdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
