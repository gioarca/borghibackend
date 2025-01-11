const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

function connectDB() {
  const URI = process.env.MONGODB_URI;
  mongoose
    .connect(URI)
    .then(() => console.log(`Connected to the database!`))
    .catch((error) => console.error(`Error: ${error.message}`));
}

module.exports = connectDB;
