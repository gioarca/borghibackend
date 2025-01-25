const speakeasy = require("speakeasy");

const verifyOTP = (user, token) => {
  return speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
  });
};

module.exports = verifyOTP;
