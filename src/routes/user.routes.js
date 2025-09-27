const express = require("express");
const { verify } = require("crypto");
const { check } = require("express-validator");
const User = require("../models/user.model.js");
const router = express.Router();
const {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getUserProfile,
} = require("../controllers/user.controller.js");
const {
  passwordReset,
  passwordResetRequest,
  requestNewVerificationEmail,
  verifyPassword,
  verifyEmail,
} = require("../controllers/auth.controller.js");
const {
  cloudinaryMiddleware,
  verifyToken,
} = require("../middleware/auth.middleware.js");

// ---------- User Routes ----------
// User registration
router.post(
  "/sign-up",
  [
    check("name").notEmpty().escape().withMessage("First name is required"),

    check("email")
      .notEmpty()
      .isEmail()
      .escape()
      .withMessage("Valid email is required"),

    check("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  createUser
);

// User login
router.post(
  "/login",
  [
    check("email").notEmpty().isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

// User verification
router.post("/verify-email/:token", (req, res, next) =>
  verifyEmail(req, res, next, User)
);

// User verification email resend
router.post("/resend-verification", (req, res, next) =>
  requestNewVerificationEmail(req, res, next, User)
);

// Password verification
router.post("/verify-password", verifyToken, (req, res, next) =>
  verifyPassword(req, res, next, User)
);

router.post("/password-reset-request", (req, res, next) =>
  passwordResetRequest(req, res, next, User)
);
router.post("/password-reset/:token", (req, res, next) =>
  passwordReset(req, res, next, User)
);

router.put(
  "/update/:id",
  verifyToken,
  cloudinaryMiddleware,
  [
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
  updateUser
);

router.delete("/delete/:id", verifyToken, deleteUser);
router.get("/:id", verifyToken, getUserProfile);

module.exports = router;
