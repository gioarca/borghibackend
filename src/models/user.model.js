const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs"); // Use bcryptjs, not bcrypt
const bcryptjs = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Your name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Your last name is required"],
    },
    email: {
      type: String,
      required: [true, "Your email address is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Your password is required"],
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default:
        "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
    },
    createdAt: {
      type: Date,
      default: new Date(),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: "",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  // Check if the password has been modified
  if (!this.isModified("password")) return next();

  try {
    // Genera un salt con un costo di 10
    const salt = await bcryptjs.genSalt(10);
    // Hasha la password utilizzando il salt generato
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass any errors to the next middleware
  }
});

// // Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
