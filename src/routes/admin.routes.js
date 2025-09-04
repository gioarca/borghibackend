const express = require("express");
const { check } = require("express-validator");
const Admin = require("../models/admin.model.js");
const { verify } = require("crypto");
const router = express.Router();
const {
  createAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getAllUsers,
  getAdminProfile,
} = require("../controllers/admin.controller.js");
const {
  passwordReset,
  passwordResetRequest,
  verifyEmail,
  verifyPassword,
} = require("../controllers/auth.controller.js");
const {
  verifyToken,
  cloudinaryMiddleware,
  verifyAdmin,
} = require("../middleware/auth.middleware.js");

// ---------- Admin Routes ----------
// Admin registration
router.post(
  "/sign-up",
  [
    check("firstName")
      .notEmpty()
      .escape()
      .withMessage("First name is required"),
    check("lastName").notEmpty().escape().withMessage("Last name is required"),
    check("taxId")
      .notEmpty()
      .withMessage("Valid TaxID is required")
      .isLength({ min: 16, max: 16 })
      .withMessage("TaxID must be exactly 16 characters")
      .isAlphanumeric()
      .withMessage("TaxID must contain only alphanumeric characters")
      .escape(),
    check("email")
      .notEmpty()
      .isEmail()
      .escape()
      .withMessage("Valid email is required"),
    check("phoneNumber").notEmpty().withMessage("Phone number is required"),
    check("specialization")
      .notEmpty()
      .escape()
      .withMessage("Specialization is required"),
    check("city").notEmpty().escape().withMessage("City is required"),
  ],
  createAdmin
);

// Admin login
router.post(
  "/login",
  [
    check("email").notEmpty().isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  loginAdmin
);

// User verification
router.post("/verify-email/:token", (req, res, next) =>
  verifyEmail(req, res, next, Admin)
);
router.post("/verify-password", verifyToken, (req, res, next) =>
  verifyPassword(req, res, next, Admin)
);
router.post("/password-reset-request", (req, res, next) =>
  passwordResetRequest(req, res, next, Admin)
);
router.post("/password-reset/:token", (req, res, next) =>
  passwordReset(req, res, next, Admin)
);

router.put(
  "/update/:id",
  verifyToken,
  cloudinaryMiddleware,
  [
    check("taxId")
      .optional()
      .notEmpty()
      .withMessage("Valid TaxID is required")
      .isLength({ min: 16, max: 16 })
      .withMessage("TaxID must be exactly 16 characters")
      .isAlphanumeric()
      .withMessage("TaxID must contain only alphanumeric characters")
      .escape(),
    check("email")
      .optional()
      .isEmail()
      .escape()
      .withMessage("Valid email is required"),
    check("password")
      .optional()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  updateAdmin
);

// router.get("/users", verifyToken, verifyAdmin, getAllUsers); --> non funziona!
router.get("/users", getAllUsers);
router.get("/admins", getAllAdmins);
router.delete("/delete/:id", verifyToken, deleteAdmin);
router.get("/:id", getAdminById);
router.get("/profile/:id", verifyToken, getAdminProfile);

module.exports = router;
