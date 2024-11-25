const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { requireAuth, checkUser } = require("./middleware/authMiddleware.js");
const i18n = require("i18n");
const path = require("path");
const Borgo = require("./models/borgo.model.js");
const borgoRoute = require("./v1/routes/borgo.route.js");
const authRoutes = require("./v1/routes/auth.route.js");

require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();

// Security middleware
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// i18n configuration
i18n.configure({
  locales: ["en", "it"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  cookie: "lang",
});
app.use(i18n.init);

// Database connection
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
  .catch((error) => {
    console.error("Connection failed!", error);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const translationRoute = require("./v1/routes/language.route.js");
app.use("/api/v1/translations", translationRoute);

// CORS
// const corsOptions = {
//   origin: "production" ? "https://vicus.netlify.app" : "*",
//   methods: "GET,POST,PUT,DELETE",
//   allowedHeaders: "Content-Type",
//   credentials: true,
// };
// app.use(cors(corsOptions));

const corsOptions = {
  origin: "*", // Permetti il dominio del frontend, metodo corretto
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(cors());

// app.use((req, res, next) => {
//   res.header(
//     "Access-Control-Allow-Origin",
//     "http://localhost:3000/" // only for production
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   next();
// });

// Routes
app.use("/api/v1/borghi", borgoRoute);
app.use("/api/v1/auth", authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});
