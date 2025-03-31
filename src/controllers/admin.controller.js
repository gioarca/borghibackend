const Admin = require("../models/admin.model.js");
const jwt = require("jsonwebtoken");
const Model = require("mongoose");
const error = require("console");
const bcryptjs = require("bcryptjs");
const dotenv = require("dotenv");
const errorHandler = require("../utils/error.js");
const generateTokenPayload = require("../utils/auth/generateTokenPayload.js");
const { validationResult } = require("express-validator");
const sendWelcomeEmail = require("../utils/admins/adminWelcomeEmail.js");

// Register a new user, with VAT number check for admins
const createAdmin = async (req, res, next) => {
  dotenv.config();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      firstName,
      lastName,
      taxId,
      email,
      specialization,
      city,
      profilePicture,
      about,
      phoneNumber,
      password,
      confirmPassword,
    } = req.body;

    const existingTaxId = await Admin.findOne({ taxId });
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin || existingTaxId) {
      return res.status(409).json({
        message: "An Admin with the same TaxId or email already exists",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      taxId,
      password: hashedPassword,
      specialization,
      city,
      profilePicture,
      about,
      phoneNumber,
    });
    const token = jwt.sign({ userId: newAdmin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await sendWelcomeEmail(newAdmin.email, token);

    res.status(201).json({
      message: "Admin created successfully and email sent",
      admin: newAdmin,
    });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// ---------- Admin Login ----------
const loginAdmin = async (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const validAdmin = await Admin.findOne({ email });

    if (!validAdmin) {
      return res.status(404).json({ message: `Admin not found` });
    }

    const validPassword = bcryptjs.compare(password, validAdmin.password); // validAdmin.password;
    if (!validPassword) {
      return res.status(401).json({
        message: "Wrong credentials. Please check your email and password.",
      });
    }

    if (!validAdmin.isVerified) {
      return res.status(401).json({
        message:
          "Email not verified. Please check your email for verification instructions.",
      });
    }

    // Generate JWT token for authentication
    const tokenPayload = generateTokenPayload(validAdmin);

    const token = jwt.sign(tokenPayload, JWT_SECRET);
    console.log("Token: ", token);
    const { password: hashedPassword, ...rest } = validAdmin._doc;
    const expiryDate = new Date(
      Date.now() + (validAdmin.isAdmin ? 43200000 : 3600000)
    );

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: expiryDate,
      })
      .status(200)
      .json({ user: rest, token, expiration: expiryDate.getTime() });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
    console.log(err);
  }
};

const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getAdminProfile = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can see only your account"));
  }

  const userId = req.user.id;

  try {
    const admin = await Admin.findById(userId);

    if (!admin) {
      return res.status(404).json({ message: "admin not found" });
    }

    const { password, ...rest } = admin._doc;

    res.status(200).json({ ...rest });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getAdminById = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const updateAdmin = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can update only your account"));
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      taxId,
      specialization,
      about,
      city,
      phoneNumber,
      profilePicture,
    } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    const updateFields = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;

    if (taxId) {
      const existingTaxId = await Admin.findOne({
        taxId,
        _id: { $ne: req.params.id },
      });
      if (existingTaxId)
        return res.status(409).json({ message: "TaxId already exists" });
      updateFields.taxId = taxId;
    }

    if (email) {
      const existingEmail = await Admin.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingEmail)
        return res.status(409).json({ message: "Email already exists" });
      updateFields.email = email;
    }

    if (password) {
      if (password !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "Password and Confirm Password do not match" });
      } else if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must contain at least one lowercase letter, one uppercase letter, and one number",
        });
      } else {
        updateFields.password = bcryptjs.hashSync(password, 10);
      }
    }

    if (specialization) updateFields.specialization = specialization;
    if (about) updateFields.about = about;
    if (city) updateFields.city = city;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (profilePicture) updateFields.profilePicture = profilePicture;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedAdmin) {
      return next(errorHandler(404, "Doctor not found"));
    }

    const { password: userPassword, ...rest } = updatedAdmin._doc;

    res.status(200).json({ user: rest });
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const { id: adminId } = req.params;
    const { id: authUserId, role } = req.user;

    const adminToDelete = await Admin.findById(adminId);

    if (!adminToDelete) {
      return next(errorHandler(404, "Doctor not found"));
    }

    if (authUserId !== adminToDelete.id && role !== "admin") {
      return next(
        errorHandler(
          403,
          "Permission denied. You can only delete your own profile, an admin can delete any profile."
        )
      );
    }

    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

module.exports = {
  createAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  getAdminProfile,
  updateAdmin,
  deleteAdmin,
};
