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

// ---------- Create admin ----------
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
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      taxId,
      specialization,
      city,
      profilePicture,
      about,
      phoneNumber,
      password,
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

    // Verifica esistenza dell'admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`Admin non trovato con email: ${email}`);
      return res.status(404).json({
        success: false,
        message: "Admin non trovato",
      });
    }

    // log per il debugging
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

    // aggiunta la verifica dell'email
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

// Ottieni tutti gli amministratori registrati
const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({ admins });
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

// Ottieni tutti gli utenti registrati
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password"); // esclude password
    res.status(200).json({ users });
  } catch (err) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

// Funzione per aggiornare i dati dell'amministratore
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
      taxId,
      specialization,
      about,
      city,
      phoneNumber,
      profilePicture,
    } = req.body;

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

    // Rimosso completamente il blocco relativo alla password

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

/* Gestisce il cambio password dell'admin */
const changePassword = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "Puoi modificare solo la tua password"));
  }

  try {
    const { currentPassword, password, confirmPassword } = req.body;

    // Verifica campi obbligatori
    if (!currentPassword || !password || !confirmPassword) {
      return next(errorHandler(400, "Tutti i campi password sono obbligatori"));
    }

    // Verifica corrispondenza password
    if (password !== confirmPassword) {
      return next(
        errorHandler(400, "La nuova password e la conferma non corrispondono")
      );
    }

    // Verifica requisiti password
    if (!validatePassword(password)) {
      return next(
        errorHandler(
          400,
          "La password deve contenere almeno una lettera minuscola, una maiuscola e un numero"
        )
      );
    }

    // Verifica password attuale
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return next(errorHandler(404, "Admin non trovato"));
    }

    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCorrectPassword) {
      return next(errorHandler(401, "Password attuale non corretta"));
    }

    // Aggiorna password
    admin.password = bcrypt.hashSync(password, 10);
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password aggiornata con successo",
    });
  } catch (err) {
    next(errorHandler(500, "Errore nel cambio password"));
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
  changePassword,
  deleteAdmin,
};
