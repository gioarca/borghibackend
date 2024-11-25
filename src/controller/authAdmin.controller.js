const Admin = require("../models/admin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { model } = require("mongoose");
const { error } = require("console");
// const { sendVerificationEmail } = require("../config/emailConfig");
// const validateVAT = require("../utils/vatValidator");

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: "", password: "" };

  //incorrect email
  if (err.message === "incorrect email") {
    errors.email = "that email is not registered";
  }
  //incorrect password
  if (err.message === "incorrect password") {
    errors.password = "that password is incorrect";
  }

  // duplicate error code
  if (err.code === 11000) {
    errors.email = "that email is already registered";
    return errors;
  }

  //validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// Register a new user, with VAT check for admins
module.exports.signup = async (req, res) => {
  try {
    // const { email, password, role, vatNumber } = req.body; // successivamente
    const { email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // check if the role is valid
    if (!role === "admin") {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Create user with hashed password
    // const user = new Admin({ email, password, role, vatNumber }); // da aggiungere successivamente
    const user = new Admin({ email, password, role });
    // const token = user.generateVerificationToken();

    // user.verificationToken = token;
    await user.save();

    // Send verification email
    // await sendVerificationEmail(user, token);
    res.status(201).json({
      message: "User registered correctly!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await Admin.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!role === "admin") {
      return res.status(400).json({ message: "Invalid role" });
    }
    // // Verify VAT number if the user is an admin
    // if (user.role === "admin" && user.vatNumber !== vatNumber) {
    //   return res.status(401).json({ message: "Invalid VAT number" });
    // }

    // if (!user.isVerified) {
    //   return res.status(403).json({ message: "Email not verified" });
    // }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
    console.log("you did it!");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/signout");
};
