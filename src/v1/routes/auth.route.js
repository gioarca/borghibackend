const express = require("express");
const router = express.Router();
const User = require("../../models/user.model.js");
const Admin = require("../../models/admin.model.js");

const authController = require("../../controller/auth.controller.js");
const authAdminController = require("../../controller/authAdmin.controller.js");

router.get("/signup", authController.signup_get);
router.post("/signup", authController.signup_post);
router.get("/login", authController.login_get);
router.post("/login", authController.login_post);
router.get("/logout", authController.logout_get);

// Register route with VAT for admins
router.post("/adminregistration", authAdminController.register);

// Email verification route
// router.get("/verify/:token", verifyEmail);

// Login route (requires VAT for admins)
router.post("/adminlogin", authAdminController.login);

module.exports = router;
