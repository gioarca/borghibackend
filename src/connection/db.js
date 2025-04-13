// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const express = require("express");
// const cookieParser = require("cookie-parser");

// dotenv.config();

// function connectDB() {
//   const uri = process.env.MONGODB_URI;
//   mongoose
//     .connect(`${uri}/?retryWrites=true&w=majority&appName=Cluster0`, {
//       serverSelectionTimeoutMS: 10000, // Timeout per la selezione del server (60 secondi)
//     })
//     .then(() => console.log(`Connected to the database!`))
//     .catch((error) => console.error(`Error: ${error.message}`));
// }

// module.exports = connectDB;

const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MongoDB URI is undefined");
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 60000,
    });

    console.log("✅ MongoDB connected!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};

module.exports = connectDB;
