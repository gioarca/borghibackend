const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./connection/db.js");
const app = express();
const mongoose = require("mongoose");

dotenv.config();
connectDB();

if (process.env.NODE_ENV === "development") {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
} else {
  app.use(
    cors({
      origin: "https://vicuss.netlify.app",
      credentials: true,
    })
  );
}

app.use(
  express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith(".jsx")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// Rotte
const adminRoutes = require("./routes/admin.routes.js");
const userRoutes = require("./routes/user.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const borgoRoute = require("./routes/borgo.route.js");

app.use("/", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/borghi", borgoRoute);

// Handler per route non trovate
app.use((req, res) => {
  res.status(404).send({
    error: {
      message: "Risorsa non trovata",
      status: 404,
    },
  });
});

// Avvio del server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(
    `Server running on http://localhost:${port} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
  console.log("NODE_ENV:", process.env.NODE_ENV);
});
