const express = require("express");
const Admin = require("../models/admin.model.js");
const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const Model = require("mongoose");
const error = require("console");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const errorHandler = require("../utils/error.js");
const { validationResult } = require("express-validator");
const sendWelcomeEmail = require("../utils/admins/adminWelcomeEmail.js");
const generateTokenPayload = require("../utils/auth/generateTokenPayload.js");

// Register a new user, with VAT number check for admins
// const createAdmin = async (req, res, next) => {
//   dotenv.config();
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
//     const {
//       firstName,
//       lastName,
//       taxId,
//       email,
//       specialization,
//       city,
//       profilePicture,
//       about,
//       phoneNumber,
//       password,
//       confirmPassword,
//     } = req.body;

//     const existingTaxId = await Admin.findOne({ taxId });
//     const existingAdmin = await Admin.findOne({ email });

//     if (existingAdmin || existingTaxId) {
//       return res.status(409).json({
//         message: "An Admin with the same TaxId or email already exists",
//       });
//     }

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

//     const hashedPassword = bcryptjs.hashSync(password, 10);

//     const newAdmin = await Admin.create({
//       firstName,
//       lastName,
//       email,
//       taxId,
//       password: hashedPassword,
//       specialization,
//       city,
//       profilePicture,
//       about,
//       phoneNumber,
//     });
//     const token = jwt.sign({ userId: newAdmin._id }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });
//     await sendWelcomeEmail(newAdmin.email, token);

//     res.status(201).json({
//       message: "Admin created successfully and email sent",
//       admin: newAdmin,
//     });
//   } catch (err) {
//     console.error(err);
//     next(errorHandler(500, "Internal Server Error"));
//   }
// };

// // ---------- Admin Login ----------
// // const loginAdmin = async (req, res, next) => {
// //   const JWT_SECRET = process.env.JWT_SECRET;
// //   try {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) {
// //       return res.status(400).json({ errors: errors.array() });
// //     }

// //     const { email, password } = req.body;

// //     const validAdmin = await Admin.findOne({ email });

// //     if (!validAdmin) {
// //       return res.status(404).json({ message: `Admin not found` });
// //     }

// //     const validPassword = await bcryptjs.compare(password, validAdmin.password); // validAdmin.password;
// //     if (!validPassword) {
// //       return res.status(401).json({
// //         message: "Wrong credentials. Please check your email and password.",
// //       });
// //     }

// //     if (!validAdmin.isVerified) {
// //       return res.status(401).json({
// //         message:
// //           "Email not verified. Please check your email for verification instructions.",
// //       });
// //     }

// //     // Generate JWT token for authentication
// //     const tokenPayload = generateTokenPayload(validAdmin);

// //     const token = jwt.sign(tokenPayload, JWT_SECRET);
// //     console.log("Token: ", token);
// //     const { password: hashedPassword, ...rest } = validAdmin._doc;
// //     const expiryDate = new Date(
// //       Date.now() + (validAdmin.isAdmin ? 43200000 : 3600000)
// //     );

// //     res
// //       .cookie("access_token", token, {
// //         httpOnly: true,
// //         secure: true,
// //         sameSite: "None",
// //         expires: expiryDate,
// //       })
// //       .status(200)
// //       .json({
// //         message: "Login effettuato con successo",
// //         user: rest,
// //         token,
// //         expiration: expiryDate.getTime(),
// //       });
// //   } catch (err) {
// //     next(errorHandler(500, "Internal Server Error"));
// //     console.log(err);
// //   }
// // };

// const generateTokenPayload = (user) => ({
//   id: user._id,
//   role: user.role || (user.isAdmin ? "admin" : "user"),
// });

// // const loginAdmin = async (req, res, next) => {
// //   const JWT_SECRET = process.env.JWT_SECRET;

// //   try {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) {
// //       return next(errorHandler(400, "Dati non validi", errors.array()));
// //     }

// //     const { email, password } = req.body;
// //     const validAdmin = await Admin.findOne({ email });

// //     if (!validAdmin) {
// //       return next(errorHandler(404, "Admin non trovato"));
// //     }

// //     const validPassword = await bcryptjs.compare(password, validAdmin.password);
// //     if (!validPassword) {
// //       return next(errorHandler(401, "Credenziali errate"));
// //     }

// //     if (!validAdmin.isVerified) {
// //       return next(
// //         errorHandler(
// //           401,
// //           "Email non verificata. Controlla la tua casella di posta."
// //         )
// //       );
// //     }

// //     const tokenPayload = generateTokenPayload(validAdmin);
// //     const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "12h" });

// //     const { password: _, ...rest } = validAdmin._doc;
// //     const expiryDate = new Date(
// //       Date.now() + (validAdmin.isAdmin ? 43200000 : 3600000)
// //     );

// //     res
// //       .cookie("access_token", token, {
// //         httpOnly: true,
// //         secure: process.env.NODE_ENV === "production",
// //         sameSite: "None",
// //         expires: expiryDate,
// //       })
// //       .status(200)
// //       .json({
// //         message: "Login effettuato con successo",
// //         user: rest,
// //         token,
// //         expiration: expiryDate.getTime(),
// //       });
// //   } catch (err) {
// //     console.error(err);
// //     next(errorHandler(500, "Errore interno del server"));
// //   }
// // };

// const loginAdmin = async (req, res, next) => {
//   const JWT_SECRET = process.env.JWT_SECRET;

//   if (!JWT_SECRET) {
//     console.error("JWT_SECRET non impostato!");
//     return next(errorHandler(500, "Errore di configurazione server"));
//   }

//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(errorHandler(400, "Dati non validi", errors.array()));
//     }

//     const { email, password } = req.body;

//     if (!email || !password) {
//       return next(errorHandler(400, "Email e password sono richiesti"));
//     }

//     console.log(`Tentativo di login con email: ${email}`);

//     const validAdmin = await Admin.findOne({ email });

//     if (!validAdmin) {
//       console.log(`Admin non trovato con email: ${email}`);
//       return next(errorHandler(404, "Admin non trovato"));
//     }

//     console.log(`Admin trovato: ${validAdmin._id}`);

//     if (!validAdmin.password) {
//       console.error(`Admin ${validAdmin._id} non ha una password salvata!`);
//       return next(errorHandler(500, "Errore nei dati dell'account"));
//     }

//     try {
//       const validPassword = await bcryptjs.compare(
//         password,
//         validAdmin.password
//       );
//       console.log(`Risultato verifica password: ${validPassword}`);

//       if (!validPassword) {
//         return next(errorHandler(401, "Credenziali errate"));
//       }
//     } catch (err) {
//       console.error(`Errore durante il confronto password:`, err);
//       return next(errorHandler(500, "Errore nella verifica delle credenziali"));
//     }

//     if (!validAdmin.isVerified) {
//       return next(
//         errorHandler(
//           401,
//           "Email non verificata. Controlla la tua casella di posta."
//         )
//       );
//     }

//     const tokenPayload = generateTokenPayload(validAdmin);
//     const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "12h" });

//     const { password: _, ...rest } = validAdmin._doc;
//     const expiryDate = new Date(Date.now() + 43200000); // 12 ore

//     res
//       .cookie("access_token", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "None",
//         expires: expiryDate,
//       })
//       .status(200)
//       .json({
//         message: "Login effettuato con successo",
//         user: rest,
//         token,
//         expiration: expiryDate.getTime(),
//       });
//   } catch (err) {
//     console.error("Errore nel login:", err);
//     next(errorHandler(500, "Errore interno del server"));
//   }
// };

const createAdmin = async (req, res, next) => {
  dotenv.config();
  try {
    // Validazione richiesta
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
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

    // Verifica campi obbligatori
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !taxId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "I campi nome, cognome, email, partita IVA e password sono obbligatori",
      });
    }

    // Verifica se email o taxId esistono già
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { taxId }] });
    if (existingAdmin) {
      let message = "Un amministratore con lo stesso ";
      message +=
        existingAdmin.email === email
          ? "indirizzo email"
          : "codice fiscale/partita IVA";
      message += " esiste già";
      return res.status(409).json({ success: false, message });
    }

    // Verifica corrispondenza password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Le password non corrispondono",
      });
    }

    // Verifica requisiti password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "La password deve contenere almeno una lettera minuscola, una maiuscola e un numero",
      });
    }

    // Crea l'admin
    // const hashedPassword = bcrypt.hashSync(password, 10);
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      taxId,
      password,
      specialization,
      city,
      profilePicture,
      about,
      phoneNumber,
      isVerified: false, // Assicuriamoci che sia false per richiedere verifica
    });

    // Invia email di verifica
    try {
      const token = jwt.sign(
        { userId: newAdmin._id },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "1d" }
      );
      await sendWelcomeEmail(newAdmin.email, token);
    } catch (emailError) {
      console.error("Errore invio email:", emailError);
      // Continuiamo comunque con la registrazione
    }

    // Risposta al client
    res.status(201).json({
      success: true,
      message:
        "Amministratore creato con successo. Controlla la tua email per la verifica.",
      admin: {
        id: newAdmin._id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
      },
    });
  } catch (err) {
    console.error("Errore nella creazione admin:", err);
    return res.status(500).json({
      success: false,
      message: "Errore interno del server",
    });
  }
};

// Login admin semplificato
const loginAdmin = async (req, res) => {
  dotenv.config();
  try {
    const { email, password } = req.body;

    // Log per debugging
    console.log(`Tentativo di login con email: ${email}`);

    // Verifica campi obbligatori
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e password sono richiesti",
      });
    }

    // Verifica esistenza admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`Admin non trovato con email: ${email}`);
      return res.status(404).json({
        success: false,
        message: "Admin non trovato",
      });
    }

    console.log(`Admin trovato: ${admin._id}`);

    // Verifica password esistente
    if (!admin.password) {
      console.error(`Admin ${admin._id} non ha una password salvata!`);
      return res.status(500).json({
        success: false,
        message: "Errore nei dati dell'account",
      });
    }

    // Mostra i primi caratteri della password hashata per debug
    console.log(
      `Password hash nel DB (primi 10 caratteri): ${admin.password.substring(
        0,
        10
      )}...`
    );

    // Confronto password
    let validPassword = false;
    try {
      // Più log per diagnostica
      console.log(`Lunghezza password fornita: ${password.length}`);
      validPassword = await bcrypt.compare(password, admin.password);
      console.log(`Risultato verifica password: ${validPassword}`);
    } catch (bcryptError) {
      console.error("Errore bcrypt dettagliato:", bcryptError);
      return res.status(500).json({
        success: false,
        message: "Errore nella verifica delle credenziali",
        error: bcryptError.message,
      });
    }

    if (!validPassword) {
      // In sviluppo, potresti voler aggiungere più dettagli
      console.log(`Verifica password fallita per admin ${admin._id}`);
      return res.status(401).json({
        success: false,
        message: "Credenziali errate",
      });
    }

    // Verifica email verificata
    if (!admin.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Email non verificata. Controlla la tua casella di posta.",
      });
    }

    // Generazione token
    const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
    const tokenPayload = generateTokenPayload(admin);
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "12h" });

    // Prepara dati utente (escludi password)
    const { password: _, ...userData } = admin._doc;
    const expiryDate = new Date(Date.now() + 43200000); // 12 ore

    // Imposta cookie e invia risposta
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        expires: expiryDate,
      })
      .status(200)
      .json({
        success: true,
        message: "Login effettuato con successo",
        user: userData,
        token,
        expiration: expiryDate.getTime(),
      });
  } catch (err) {
    console.error("Errore nel login:", err);
    return res.status(500).json({
      success: false,
      message: "Errore interno del server",
    });
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

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
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
        updateFields.password = bcrypt.hashSync(password, 10);
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
      return next(errorHandler(404, "Admin not found"));
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
      return next(errorHandler(404, "Admin not found"));
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
  getAllUsers,
  getAdminProfile,
  updateAdmin,
  deleteAdmin,
};
