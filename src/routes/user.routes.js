const express = require("express");
const { check } = require("express-validator");
const {
  createUser,
  loginUser,
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
  verifyPassword,
  verifyEmail,
} = require("../controllers/auth.controller.js");
const User = require("../models/user.model.js");
const router = express.Router();

router.post(
  "/sign-up",
  [
    check("firstName")
      .notEmpty()
      .escape()
      .withMessage("First name is required"),

    check("lastName").notEmpty().escape().withMessage("Last name is required"),

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

router.post(
  "/login",
  [
    check("email").notEmpty().isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
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
