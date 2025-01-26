const express = require("express");
const { check } = require("express-validator");
const {
  updateUser,
  deleteUser,
  getAllUsers,
  getUserProfile,
} = require("../controllers/user.controller.js");
const {
  cloudinaryMiddleware,
  verifyAdmin,
  verifyToken,
} = require("../middleware/authMiddleware.js");
const {
  passwordReset,
  passwordResetRequest,
  userSignIn,
  generate2FA,
  verify2FA,
  disable2FA,
  verifyPassword,
  verifyEmail,
} = require("../controllers/auth.controller.js");
const User = require("../models/user.model.js");
const router = express.Router();

router.post(
  "/sign-in",
  [
    check("email").notEmpty().isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  userSignIn
);

router.post("/verify-email/:token", (req, res, next) =>
  verifyEmail(req, res, next, User)
);
router.post("/verify-password", verifyToken, (req, res, next) =>
  verifyPassword(req, res, next, User)
);

router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.get("/profile/:id", verifyToken, getUserProfile);

router.post("/password-reset-request", (req, res, next) =>
  passwordResetRequest(req, res, next, User)
);
router.post("/password-reset/:token", (req, res, next) =>
  passwordReset(req, res, next, User)
);

router.post("/generate2FA/:id", verifyToken, (req, res, next) =>
  generate2FA(req, res, next, User)
);

router.post(
  "/verify2FA/:id",
  verifyToken,
  [
    check("userId").notEmpty().withMessage("User ID is required"),
    check("tempSecretCode")
      .notEmpty()
      .withMessage("Temporary secret code is required"),
  ],
  (req, res, next) => verify2FA(req, res, next, User)
);

router.post(
  "/disable2FA/:id",
  verifyToken,
  [
    check("password")
      .notEmpty()
      .withMessage("Password is required for 2FA disable verification"),
    check("confirmPassword")
      .notEmpty()
      .withMessage("Confirm password is required for 2FA disable verification"),
  ],
  (req, res, next) => disable2FA(req, res, next, User)
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

module.exports = router;
