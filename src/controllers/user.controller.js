const { model } = require("mongoose");
const { error } = require("console");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/user.model.js"); // Import your User model
const sendUserAuthEmail = require("../utils/auth/sendUserAuthEmail.js");
const generateTokenPayload = require("../utils/auth/generateTokenPayload.js");
const errorHandler = require("../utils/error.js");
const { validationResult } = require("express-validator");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// ---------- Create user ----------
const createUser = async (req, res, next) => {
  try {
    // Validazione dei campi in ingresso
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
      phoneNumber,
      profilePicture,
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Verifica complessità password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      });
    }

    // Verifica se l'email esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with the same email already exists" });
    }

    // Crea l'utente con password crittografata
    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      profilePicture,
    });

    // Genera un token per la verifica dell'email e invia la mail
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await sendUserAuthEmail(newUser.email, token);

    res.status(201).json({
      message: "Check your email for verification",
      user: newUser,
      password: hashedPassword,
    });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// ---------- Login user profile ----------

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Trova l'utente
    const validUser = await User.findOne({ email });

    if (!validUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Usa il metodo del modello per confrontare la password
    // const validPassword = await user.comparePassword({ password });
    const validPassword = bcryptjs.compare(password, validUser.password);
    if (!validPassword) {
      return res.status(401).json({
        message: "Wrong credentials. Please check your email and password.",
      });
    }

    // Opzionale: aggiungi la verifica dell'email
    if (!validUser.isVerified) {
      return res.status(401).json({
        message:
          "Email not verified. Please check your email for verification instructions.",
      });
    }

    // Generate JWT token for authentication
    const tokenPayload = generateTokenPayload(validUser);

    const token = jwt.sign(tokenPayload, JWT_SECRET);
    console.log("Token: ", token);
    const { password: hashedPassword, ...rest } = validUser._doc;
    // Calcola la scadenza del token per il client
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

    // res
    //   .cookie("access_token", token, {
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: "None",
    //     expires: expiryDate,
    //   })
    //   .status(200)
    //   .json({ user: rest, token, expiration: expiryDate.getTime() });

    // Generate JWT
    // const token = jwt.sign(
    //   { id: user._id, email: user.email },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1h" }
    // );

    // Opzionale: puoi includere più informazioni utente nella risposta
    const { password: removed, ...userData } = validUser._doc;

    //     return res.status(200).json({
    //       message: "Login successful",
    //       token,
    //       user: userData,
    //       expiration: expiryDate.getTime(),
    //     });
    //   } catch (err) {
    //     next(errorHandler(500, "Internal Server Error"));
    //     console.log(err);
    //   }
    // };

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

const getUserProfile = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can see only your account"));
  }

  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "user not found." });
    }

    const { password, ...rest } = user._doc;

    res.status(200).json({ ...rest });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

const updateUser = async (req, res, next) => {
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
      // password,
      // confirmPassword,
      phoneNumber,
      profilePicture,
    } = req.body;
    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    const updateFields = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;

    if (email) {
      const existingEmail = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingEmail)
        return res.status(409).json({ message: "Email already exists" });
      updateFields.email = email;
    }

    // if (password) {
    //   if (password !== confirmPassword) {
    //     console.log("Password and Confirm Password do not match");
    //     return res
    //       .status(400)
    //       .json({ message: "Password and Confirm Password do not match" });
    //   } else if (!passwordRegex.test(password)) {
    //     return res.status(400).json({
    //       message:
    //         "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    //     });
    //   } else {
    //     updateFields.password = bcryptjs.hashSync(password, 10);
    //   }
    // }

    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (profilePicture) updateFields.profilePicture = profilePicture;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: userPassword, ...rest } = updatedUser._doc;
    res.status(200).json({ user: rest });
  } catch (err) {
    console.log(err);
    next(errorHandler(500, "Internal Server Error"));
  }
};

const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can delete only your account"));
  }
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User has been deleted" });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

// const loginUser = async (req, res) => {
//   try {
//     // Validate email and password
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     // Find user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

// Compare password
// const validPassword = await bcryptjs.compare(password, user.password);
// if (validPassword) {
//   // La password è corretta: validPassword sarà true
//   console.log("Password corretta!");
//   console.log(password);
//   // Procedi con la generazione del token, ecc.
// } else {
//   // La password non corrisponde: validPassword sarà false
//   console.log("Password sbagliata!");
//   return res.status(401).json({
//     message: "Wrong credentials. Please check your email and password.",
//   });
// }

// // const validPassword = await bcryptjs.compare(password, user.password);
// const validPassword = await bcryptjs.compare(password, user.password);
// console.log(validPassword);
// if (validPassword) {
//   // La password è corretta: validPassword sarà true
//   console.log("Password corretta!");
//   // Procedi con la generazione del token, ecc.
// } else {
//   // La password non corrisponde: validPassword sarà false
//   console.log("Password sbagliata!");
//   return res.status(401).json({
//     message: "Wrong credentials. Please check your email and password.",
//   });
// }

//     const storedHashedPassword = user.password; // Password hash stored in the database
//     const userInputPassword = req.body.password; // Password input from the user

//     const validPassword = bcryptjs.compare(
//       userInputPassword,
//       storedHashedPassword
//     );
//     if (validPassword === undefined) {
//       // Handle error
//       console.error("Error comparing passwords:", err);
//       return;
//     }

//     if (validPassword === true) {
//       // Passwords match, authentication successful
//       console.log("Passwords match! User authenticated.");
//     } else {
//       // Passwords don't match, authentication failed
//       console.log("Passwords do not match! Authentication failed.");
//       return res.status(401).json({
//         message: "Wrong credentials. Please check your email and password.",
//       });
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     return res.status(200).json({ message: "Login successful", token });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ---------- User Login ----------
// const userLogin = async (req, res, next) => {
//   const JWT_SECRET = process.env.JWT_SECRET;
//   try {
//     // Validazione dei campi
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const password = req.body.password;
//     const email = req.body.email;

//     const validUser = await User.findOne({ email });
//     if (!validUser) {
//       return res.status(404).json({ message: `User not found` });
//     }

//     // Verifica della password: confronta la password in input con l'hash salvato in user.password
//     const validPassword = await bcrypt.compare(password, validUser.password);
//     if (!validPassword) {
//       console.log("Riprova");
//       return res.status(401).json({
//         message: "Wrong credentials. Please check your email and password.",
//       });
//     }

//     // Controlla se l'email è stata verificata
//     if (!validUser.isVerified) {
//       return res.status(401).json({
//         message:
//           "Email not verified. Please check your email for verification instructions.",
//       });
//     }

//     // Genera il payload e il token JWT
//     const tokenPayload = generateTokenPayload(validUser);
//     const token = jwt.sign(tokenPayload, JWT_SECRET);
//     console.log("Token: ", token);

//     // Rimuove la password dalla risposta
//     const { password: removed, ...userData } = validUser._doc;

//     // Imposta la scadenza del token: 12 ore per admin, 1 ora per user
//     const expiryDuration = validUser.isAdmin
//       ? 12 * 60 * 60 * 1000
//       : 1 * 60 * 60 * 1000;
//     const expiryDate = new Date(Date.now() + expiryDuration);

//     // Imposta il cookie di autenticazione
//     res
//       .cookie("access_token", token, {
//         httpOnly: true,
//         secure: true,
//         sameSite: "None",
//         expires: expiryDate,
//       })
//       .status(200)
//       .json({ user: userData, token, expiration: expiryDate.getTime() });
//   } catch (err) {
//     next(errorHandler(500, "Internal Server Error"));
//     console.log(err);
//   }
// };

module.exports = {
  createUser,
  getUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
  loginUser,
};
