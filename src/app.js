const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const port = 3000;

const Borgo = require("./models/borgo.model.js");

const borgoRoute = require("./v1/routes/borgo.route.js");

const app = express();

// connessione al database
mongoose
  .connect(
    `mongodb+srv://borghisud:Exlus3m3QclQKjBl@cluster0.xv1petb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    console.log("Connected to the database!");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(() => {
    console.log("Connection failed!");
  });

// middlewares
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "*" // only for production
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());

// routes
app.use("/api/v1/borghi", borgoRoute);
