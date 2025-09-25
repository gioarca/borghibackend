const express = require("express");
const {
  signOut,
  requestNewVerificationEmail,
  verifyEmail,
} = require("../controllers/auth.controller.js");
const { check } = require("express-validator");
const router = express.Router();

router.get("/sign-out", signOut);
router.post("/request-new-verification-email", requestNewVerificationEmail);
router.post("/verify-email/:token", verifyEmail);

module.exports = router;
