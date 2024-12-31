const jwt = require("jsonwebtoken");

const generateResetToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.RESET_SECRET, {
    expiresIn: "1h",
  });
};

module.exports = generateResetToken;
// Compare this snippet from backend/src/controllers/auth.controller.js:
