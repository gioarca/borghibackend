const express = require("express");
const {
  signOut,
  requestNewVerificationEmail,
} = require("../controllers/auth.controller.js");
const { check } = require("express-validator");
const router = express.Router();

router.get("/sign-out", signOut);
router.post("/request-new-verification-email", requestNewVerificationEmail);

module.exports = router;
