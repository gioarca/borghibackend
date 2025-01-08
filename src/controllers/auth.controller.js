const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");
const Model = require("mongoose");
const error = require("console");
const bcryptjs = require("bcryptjs");
const errorHandler = require("../utils/error.js");
const { validationResult } = require("express-validator");
const generateResetToken = require("../utils/passwordReset/generateResetToken.js");
const sendResetPasswordEmail = require("../utils/passwordReset/sendResetPasswordEmail.js");
const verifyOTP = require("../utils/auth/verifyOTP.js");
const generateTokenPayload = require("../utils/auth/generateTokenPayload.js");
const speakeasy = require("speakeasy");
const sendUserAuthEmail = require("../utils/auth/sendUserAuthEmail.js");

//handle errors
// const handleErrors = (err) => {
//   console.log(err.message, err.code);
//   let errors = { email: "", password: "" };

//   //incorrect email
//   if (err.message === "incorrect email") {
//     errors.email = "that email is not registered";
//   }
//   //incorrect password
//   if (err.message === "incorrect password") {
//     errors.password = "that password is incorrect";
//   }

//   // duplicate error code
//   if (err.code === 11000) {
//     errors.email = "that email is already registered";
//     return errors;
//   }

//   //validation errors
//   if (err.message.includes("user validation failed")) {
//     Object.values(err.errors).forEach(({ properties }) => {
//       console.log(properties);
//       errors[properties.path] = properties.message;
//     });
//   }

//   return errors;
// };

// module.exports.signup_get = (req, res) => {
//   res.json({ message: "Signup page data or redirect instruction" });
// };

// module.exports.login_get = (req, res) => {
//   // Invia una risposta JSON invece di renderizzare una pagina
//   res.json({ message: "Login page data or redirect instruction" });
// };

// module.exports.signup_post = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = new User({ email, password });
//     await user.save();
//     res.status(201).json(user);
//   } catch (err) {
//     console.log(err);
//     res.status(400).send("error, user not created");
//   }
// };

// module.exports.login_post = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email: email });
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
//     // const token = createToken(user._id);
//     // res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
//     // res.status(200).json({ user: user._id });
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });
//     res.status(200).json({ token });
//     console.log("you did it!");
//   } catch (err) {
//     const errors = handleErrors(err);
//     res.status(400).json({ error: err.message });
//   }
// };

// module.exports.logout_get = (req, res) => {
//   res.cookie("jwt", "", { maxAge: 1 });
//   res.redirect("/signout");
// };

const signUp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      firstName,
      lastName,
      email,
      // taxId,
      password,
      confirmPassword,
      phoneNumber,
      profilePicture,
      isAdmin,
    } = req.body;

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

    // const existingTaxId = await User.findOne({ taxId });
    const existingUser = await User.findOne({ email });

    // if (existingUser || existingTaxId) {
    if (existingUser) {
      return (
        res
          .status(409)
          // .json({ message: "User with the same TaxID or email already exists" });
          .json({ message: "User with the same email already exists" })
      );
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      // taxId,
      password: hashedPassword,
      phoneNumber,
      profilePicture,
      isAdmin,
    });

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await sendUserAuthEmail(newUser.email, token);

    res
      .status(201)
      .json({ message: "Check your email for verification", user: newUser });
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const signIn = async (req, res, next, Model) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, twoFactorCode } = req.body;
    const validUser = await User.findOne({ email });
    // const userPassword = validUser ? validUser.password : null;

    if (!validUser) {
      return res.status(404).json({ message: `${Model.modelName} not found` });
    }
    // const hashedPassword = bcryptjs.hashSync(password, 10);
    const validPassword = bcryptjs.compare(password, validUser.password); // validUser.password;
    if (!validPassword) {
      return res.status(401).json({
        message: "Wrong credentials. Please check your email and password.",
      });
    }

    if (!validUser.isVerified) {
      return res.status(401).json({
        message:
          "Email not verified. Please check your email for verification instructions.",
      });
    }

    if (validUser.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ codeRequested: true });
      }

      const isValidOTP = verifyOTP(validUser, twoFactorCode);

      if (!isValidOTP) {
        return res
          .status(401)
          .json({ message: "Invalid two-factor authentication code." });
      }
    } else if (twoFactorCode) {
      return res.status(400).json({
        message: "Two-factor authentication is not enabled for this user.",
      });
    }

    // Generate JWT token for authentication
    const tokenPayload = generateTokenPayload(
      validUser,
      validUser.isAdmin ? "admin" : undefined
    );

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
    const { password: hashedPassword, ...rest } = validUser._doc;
    const expiryDate = new Date(
      Date.now() + (validUser.isAdmin ? 43200000 : 3600000)
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

const userSignIn = async (req, res, next) => {
  await signIn(req, res, next, User);
};

const adminSignIn = async (req, res, next) => {
  await signIn(req, res, next, Admin);
};

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

const requestNewVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user =
      (await User.findOne({ email })) || (await Doctor.findOne({ email }));

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

const verifyPassword = async (req, res, next, Model) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const validUser = await Model.findById(req.user.id);

    if (!validUser) {
      return res.status(404).json({ message: "not found" });
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ message: "Wrong credentials. Please check your password." });
    }

    return res.status(200).json({ message: "Correct Password" });
  } catch (error) {
    console.error(error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const signOut = async (req, res) => {
  try {
    // Extract the access token cookie from the request
    const accessTokenCookie = req.cookies["access_token"];

    // If the cookie is not present, return unauthorized status
    if (!accessTokenCookie) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Decode the token to get the user ID
    const decodedToken = jwt.verify(accessTokenCookie, process.env.JWT_SECRET);

    // If the user ID is not present, return unauthorized status
    if (!decodedToken.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res
      .clearCookie("access_token")
      .status(200)
      .json({ message: "Signout success for user ID: " + decodedToken.id });
  } catch (error) {
    console.log(error);
    errorHandler(500, "Internal Server Error");
  }
};

const passwordResetRequest = async (req, res, next, Model) => {
  try {
    const { email } = req.body;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: `${Model.modelName} not found` });
    }

    // Generate a reset token and send the reset password email
    const resetToken = generateResetToken(user);
    console.log(`Reset token: ${resetToken}`);

    await sendResetPasswordEmail(user.email, resetToken, Model);

    res
      .status(200)
      .json({ message: "Password reset email sent successfully", resetToken });
  } catch (err) {
    console.log(err);
    // next(errorHandler(500, "Internal Server Error"));
    res.status(500).send({ error: error.message });
  }
};

const passwordReset = async (req, res, next, Model) => {
  try {
    // Extract token and new password from request parameters and body
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

    // Verify the reset token
    const decodedToken = jwt.verify(token, process.env.RESET_SECRET);

    // Find the user from the token
    const user = await Model.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ message: `${Model.modelName} not found` });
    }

    // Hash the new password and save it to the user
    user.password = bcryptjs.hashSync(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token expired" });
    }
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const generate2FA = async (req, res, next, Model) => {
  if (req.user.id !== req.params.id) {
    return next(
      errorHandler(401, "You can generate 2FA only for your own account")
    );
  }
  try {
    const user = await Model.findById(req.params.id);

    if (!user) {
      return next(errorHandler(404, `${Model.modelName} not found`));
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        message: "Two-factor authentication is already enabled for this user.",
      });
    }

    const tempSecret = speakeasy.generateSecret({
      length: 20,
      name: "MyClinic",
    });

    await Model.findByIdAndUpdate(req.params.id, {
      twoFactorSecret: tempSecret.base32,
    });

    res.status(200).json({ tempSecret: tempSecret.base32 });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const verify2FA = async (req, res, next, Model) => {
  if (req.user.id !== req.params.id) {
    return next(
      errorHandler(401, "You can verify 2FA only for your own account")
    );
  }
  try {
    const { tempSecretCode } = req.body;

    if (!tempSecretCode) {
      return res
        .status(400)
        .json({ message: "Temporary secret code is required." });
    }

    const user = await Model.findById(req.params.id);

    if (!user) {
      return next(errorHandler(404, `${Model.modelName} not found`));
    }

    const isValidTempCode = verifyOTP(user, tempSecretCode);

    if (!isValidTempCode) {
      return res
        .status(401)
        .json({ message: "Invalid temporary secret code." });
    }

    await Model.findByIdAndUpdate(req.params.id, { twoFactorEnabled: true });

    res
      .status(200)
      .json({ message: "Two-factor authentication verified successfully." });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const disable2FA = async (req, res, next, Model) => {
  if (req.user.id !== req.params.id) {
    return next(
      errorHandler(401, "You can disable 2FA only for your own account")
    );
  }

  try {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const user = await Model.findById(req.params.id);

    if (!user) {
      return next(errorHandler(404, `${Model.modelName} not found`));
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        message: "Two-factor authentication is not enabled for this user.",
      });
    }

    const validPassword = bcryptjs.compareSync(password, user.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ message: "Invalid password for 2FA disable verification." });
    }

    await Model.findByIdAndUpdate(req.params.id, {
      twoFactorEnabled: false,
      twoFactorSecret: "",
    });

    res
      .status(200)
      .json({ message: "Two-factor authentication disabled successfully." });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

module.exports = {
  signUp,
  userSignIn,
  adminSignIn,
  verifyEmail,
  requestNewVerificationEmail,
  verifyPassword,
  signOut,
  passwordResetRequest,
  passwordReset,
  generate2FA,
  verify2FA,
  disable2FA,
};
