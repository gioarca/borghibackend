const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

const { CLOUD_NAME, CLOUDINARY_APY_KEY, CLOUDINARY_APY_SECRET } = process.env;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_APY_KEY,
  api_secret: CLOUDINARY_APY_SECRET,
});

module.exports = cloudinary;
