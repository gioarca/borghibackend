const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  vatNumber: {
    type: String,
    required: function () {
      return this.role === "admin";
    },
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: "" },
});

// Hash password before saving
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate JWT token
AdminSchema.methods.generateVerificationToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
