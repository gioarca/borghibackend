const express = require("express");
const {
  signUp,
  signOut,
  requestNewVerificationEmail,
} = require("../controllers/auth.controller.js");
const { check } = require("express-validator");

const router = express.Router();

router.post(
  "/sign-up",
  [
    check("firstName")
      .notEmpty()
      .escape()
      .withMessage("First name is required"),
    check("lastName").notEmpty().escape().withMessage("Last name is required"),
    // check("taxId")
    //   .notEmpty()
    //   .withMessage("Valid TaxID is required")
    //   .isLength({ min: 16, max: 16 })
    //   .withMessage("TaxID must be exactly 16 characters")
    //   .isAlphanumeric()
    //   .withMessage("TaxID must contain only alphanumeric characters")
    //   .escape(),
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
  signUp
);

router.get("/sign-out", signOut);

router.post("/request-new-verification-email", requestNewVerificationEmail);

module.exports = router;