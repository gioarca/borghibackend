const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const port = 3000;

const Borgo = require("./models/borgo.model.js");
const User = require("./models/user.model.js");
const Order = require("./models/order.model.js");

const borgoRoute = require("./v1/routes/borgo.route.js");
const userRoute = require("./v1/routes/user.route.js");
const orderRoute = require("./v1/routes/order.route.js");

const app = express();

// connessione al database
mongoose
  .connect(
    // `mongodb+srv://giorgioarcamone93:kLCWLlCoI6PwJRhi@borgoapi.y2jtmaz.mongodb.net/?retryWrites=true&w=majority&appName=BorgoAPI`
    `mongodb+srv://borghisud:Exlus3m3QclQKjBl@cluster0.xv1petb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    // { useNewUrlParser: true, useUnifiedTopology: true }
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
    "*"
    // "http://localhost:5173/"
    // "*" // only for production
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
app.use("/api/v1/borgo", borgoRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/order", orderRoute);
