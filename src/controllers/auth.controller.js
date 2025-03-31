// const User = require("../models/user.model");
// const Admin = require("../models/admin.model");
// const jwt = require("jsonwebtoken");
// const Model = require("mongoose");
// const error = require("console");
// const bcryptjs = require("bcryptjs");
// // const dotenv = require("dotenv");
// const errorHandler = require("../utils/error.js");
// const { validationResult } = require("express-validator");
// const generateResetToken = require("../utils/passwordReset/generateResetToken.js");
// const sendResetPasswordEmail = require("../utils/passwordReset/sendResetPasswordEmail.js");
// const verifyOTP = require("../utils/auth/verifyOTP.js");
// const generateTokenPayload = require("../utils/auth/generateTokenPayload.js");
// const speakeasy = require("speakeasy");
// const sendUserAuthEmail = require("../utils/auth/sendUserAuthEmail.js");
// require("dotenv").config();

// const signUp = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
//     const {
//       firstName,
//       lastName,
//       email,
//       password,
//       confirmPassword,
//       phoneNumber,
//       profilePicture,
//       isAdmin,
//     } = req.body;

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
//     if (!passwordRegex.test(password)) {
//       return res.status(400).json({
//         message:
//           "Password must contain at least one lowercase letter, one uppercase letter, and one number",
//       });
//     }

//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       return res
//         .status(409)
//         .json({ message: "User with the same email already exists" });
//     }

//     const hashedPassword = bcryptjs.hashSync(password, 10);
//     const newUser = await User.create({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//       phoneNumber,
//       profilePicture,
//       isAdmin,
//     });

//     const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });
//     await sendUserAuthEmail(newUser.email, token);

//     res
//       .status(201)
//       .json({ message: "Check your email for verification", user: newUser });
//   } catch (err) {
//     console.log(err);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// const login = async (req, res, next, Model) => {
//   const JWT_SECRET = process.env.JWT_SECRET;
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     // const { email, password, twoFactorCode } = req.body;
//     const { email, password } = req.body;
//     const validUser = await User.findOne({ email });
//     const validAdmin = await Admin.findOne({ email });
//     // const userPassword = validUser ? validUser.password : null;

//     if (!validUser) {
//       return res.status(404).json({ message: `${Model.modelName} not found` });
//     }
//     // const hashedPassword = bcryptjs.hashSync(password, 10);
//     const validPassword = bcryptjs.compare(password, validUser.password); // validUser.password;
//     if (!validPassword) {
//       return res.status(401).json({
//         message: "Wrong credentials. Please check your email and password.",
//       });
//     }

//     if (!validUser.isVerified) {
//       return res.status(401).json({
//         message:
//           "Email not verified. Please check your email for verification instructions.",
//       });
//     }
//     // Generate JWT token for authentication
//     const tokenPayload = generateTokenPayload(
//       validUser
//       // validUser.isAdmin ? "admin" : undefined
//     );

//     const token = jwt.sign(tokenPayload, JWT_SECRET);
//     console.log("Token: ", token);
//     // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
//     const { password: hashedPassword, ...rest } = validUser._doc;
//     const expiryDate = new Date(
//       Date.now() + (validUser.isAdmin ? 43200000 : 3600000)
//     );

//     res
//       .cookie("access_token", token, {
//         httpOnly: true,
//         secure: true,
//         sameSite: "None",
//         expires: expiryDate,
//       })
//       .status(200)
//       .json({ user: rest, token, expiration: expiryDate.getTime() });
//   } catch (err) {
//     next(errorHandler(500, "Internal Server Error"));
//     console.log(err);
//   }
// };

// const adminSignIn = async (req, res, next) => {
//   const JWT_SECRET = process.env.JWT_SECRET;
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { email, password } = req.body;
//     const validAdmin = await Admin.findOne({ email });

//     if (!validAdmin) {
//       return res.status(404).json({ message: `Admin not found` });
//     }

//     const validPassword = bcryptjs.compare(password, validAdmin.password); // validAdmin.password;
//     if (!validPassword) {
//       return res.status(401).json({
//         message: "Wrong credentials. Please check your email and password.",
//       });
//     }

//     if (!validAdmin.isVerified) {
//       return res.status(401).json({
//         message:
//           "Email not verified. Please check your email for verification instructions.",
//       });
//     }

//     // Generate JWT token for authentication
//     const tokenPayload = generateTokenPayload(validAdmin);

//     const token = jwt.sign(tokenPayload, JWT_SECRET);
//     console.log("Token: ", token);
//     const { password: hashedPassword, ...rest } = validUser._doc;
//     const expiryDate = new Date(
//       Date.now() + (validAdmin.isAdmin ? 43200000 : 3600000)
//     );

//     res
//       .cookie("access_token", token, {
//         httpOnly: true,
//         secure: true,
//         sameSite: "None",
//         expires: expiryDate,
//       })
//       .status(200)
//       .json({ user: rest, token, expiration: expiryDate.getTime() });
//   } catch (err) {
//     next(errorHandler(500, "Internal Server Error"));
//     console.log(err);
//   }
// };

// const userSignIn = async (req, res, next) => {
//   await login(req, res, next, User);
// };

// const adminSign = async (req, res, next) => {
//   await adminSignIn(req, res, next, Admin);
// };

// const verifyEmail = async (req, res, next, Model) => {
//   try {
//     const token = req.params.token;

//     if (!token) {
//       return res.status(400).json({ message: "Token is missing" });
//     }

//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//     if (!decodedToken || !decodedToken.userId) {
//       return res.status(400).json({ message: "Invalid token" });
//     }

//     const user = await Model.findById(decodedToken.userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.isVerified = true;
//     user.emailVerificationToken = null;
//     await user.save();

//     res.status(200).json({ message: "Email verification successful" });
//   } catch (err) {
//     console.error("Error verifying email:", err);
//     if (err.name === "TokenExpiredError") {
//       return res.status(400).json({
//         message: "Token expired. Please request a new verification email.",
//       });
//     }
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// const requestNewVerificationEmail = async (req, res, next) => {
//   try {
//     const { email } = req.body;

//     const user =
//       (await User.findOne({ email })) || (await Doctor.findOne({ email }));

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({ message: "User already verified" });
//     }

//     const newVerificationToken = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     user.emailVerificationToken = newVerificationToken;
//     await user.save();

//     await sendUserAuthEmail(user.email, newVerificationToken);

//     res
//       .status(200)
//       .json({ message: "New verification email requested successfully" });
//   } catch (error) {
//     console.error(error);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// const verifyPassword = async (req, res, next, Model) => {
//   try {
//     const { password } = req.body;

//     if (!password) {
//       return res.status(400).json({ message: "Password is required" });
//     }

//     const validUser = await Model.findById(req.user.id);

//     if (!validUser) {
//       return res.status(404).json({ message: "not found" });
//     }

//     const validPassword = bcryptjs.compareSync(password, validUser.password);
//     if (!validPassword) {
//       return res
//         .status(401)
//         .json({ message: "Wrong credentials. Please check your password." });
//     }

//     return res.status(200).json({ message: "Correct Password" });
//   } catch (error) {
//     console.error(error);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// const signOut = async (req, res) => {
//   try {
//     // Extract the access token cookie from the request
//     const accessTokenCookie = req.cookies["access_token"];

//     // If the cookie is not present, return unauthorized status
//     if (!accessTokenCookie) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // Decode the token to get the user ID
//     const decodedToken = jwt.verify(accessTokenCookie, process.env.JWT_SECRET);

//     // If the user ID is not present, return unauthorized status
//     if (!decodedToken.id) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     res
//       .clearCookie("access_token")
//       .status(200)
//       .json({ message: "Signout success for user ID: " + decodedToken.id });
//   } catch (error) {
//     console.log(error);
//     errorHandler(500, "Internal Server Error");
//   }
// };

// const passwordResetRequest = async (req, res, next, Model) => {
//   try {
//     const { email } = req.body;
//     const user = await Model.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: `${Model.modelName} not found` });
//     }

//     // Generate a reset token and send the reset password email
//     const resetToken = generateResetToken(user);
//     console.log(`Reset token: ${resetToken}`);

//     await sendResetPasswordEmail(user.email, resetToken, Model);

//     res
//       .status(200)
//       .json({ message: "Password reset email sent successfully", resetToken });
//   } catch (err) {
//     console.log(err);
//     // next(errorHandler(500, "Internal Server Error"));
//     res.status(500).send({ error: error.message });
//   }
// };

// const passwordReset = async (req, res, next, Model) => {
//   try {
//     // Extract token and new password from request parameters and body
//     const { token } = req.params;
//     const { newPassword, confirmNewPassword } = req.body;

//     if (newPassword !== confirmNewPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
//     if (!passwordRegex.test(newPassword)) {
//       return res.status(400).json({
//         message:
//           "Password must contain at least one lowercase letter, one uppercase letter, and one number",
//       });
//     }

//     if (!token || !newPassword) {
//       return res
//         .status(400)
//         .json({ message: "Token and new password are required" });
//     }

//     // Verify the reset token
//     const decodedToken = jwt.verify(token, process.env.RESET_SECRET);

//     // Find the user from the token
//     const user = await Model.findById(decodedToken.userId);

//     if (!user) {
//       return res.status(404).json({ message: `${Model.modelName} not found` });
//     }

//     // Hash the new password and save it to the user
//     user.password = bcryptjs.hashSync(newPassword, 10);
//     await user.save();

//     res.status(200).json({ message: "Password reset successfully" });
//   } catch (err) {
//     if (err.name === "TokenExpiredError") {
//       return res.status(400).json({ message: "Token expired" });
//     }
//     console.log(err);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// module.exports = {
//   signUp,
//   userSignIn,
//   adminSign,
//   verifyEmail,
//   requestNewVerificationEmail,
//   verifyPassword,
//   signOut,
//   passwordResetRequest,
//   passwordReset,
// };

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
