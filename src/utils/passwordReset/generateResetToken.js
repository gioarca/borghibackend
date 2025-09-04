const jwt = require("jsonwebtoken");
const { dot } = require("node:test/reporters");
const dotenv = require("dotenv");

const generateResetToken = (user) => {
  dotenv.config();
  return jwt.sign({ userId: user._id }, process.env.RESET_SECRET, {
    expiresIn: "1h",
  });
};

module.exports = generateResetToken;
// Compare this snippet from backend/src/controllers/auth.controller.js:
