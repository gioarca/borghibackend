const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const type = require("os");

const AdminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    taxId: {
      type: String,
      required: [true, "Your TaxID is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "An email address is required"],
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    profilePicture: {
      type: String,
      default:
        "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);

// Hash password prima di salvarla
AdminSchema.pre("save", async function (next) {
  // Controlla se la password è stata modificata
  if (!this.isModified("password")) return next();

  try {
    // Genera un salt con un costo di 10
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error); // Passa tutti gli errori al prossimo middleware
  }
});

// Compare Passwords
AdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
