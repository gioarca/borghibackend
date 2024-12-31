const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();

const adminRoutes = require("./routes/adminRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const borgoRoute = require("./v1/routes/borgo.route.js");
// const visitRoutes = require("./routes/visitRoutes.js");

dotenv.config();

if (process.env.NODE_ENV === "development") {
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
} else {
  app.use(
    cors({
      origin: "https://vicus.netlify.app/",
      credentials: true,
    })
  );
}

app.use(cookieParser());

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

app.use("/", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/api/v1/borghi", borgoRoute);
// app.use("/api/v1/auth", authRoutes);
// app.use("/visit", visitRoutes);

module.exports = app;
