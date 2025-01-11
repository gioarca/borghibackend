// const express = require("express");
// const cookieParser = require("cookie-parser");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const connectDB = require("./connection/db.js");
// const startServer = require("./connection/server.js");

// const app = express();

// const adminRoutes = require("./routes/admin.routes.js");
// const userRoutes = require("./routes/user.routes.js");
// const authRoutes = require("./routes/auth.routes.js");
// const borgoRoute = require("./routes/borgo.route.js");
// // const experienceRoutes = require("./routes/experience.routes.js");

// dotenv.config();

// if (process.env.NODE_ENV === "development") {
//   app.use(
//     cors({
//       origin: "http://localhost:5173",
//       credentials: true,
//     })
//   );
//   startServer();
// } else {
//   app.use(
//     cors({
//       origin: "https://vicus.netlify.app/",
//       credentials: true,
//     })
//   );
//   connectDB();
// }

// app.use(cookieParser());

// app.use(express.json({ limit: "200mb" }));
// app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// app.use("/", authRoutes);
// app.use("/user", userRoutes);
// app.use("/admin", adminRoutes);
// app.use("/borghi", borgoRoute);
// // app.use("/visit", visitRoutes);

// module.exports = app;

const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./connection/db.js");
const config = require("config");

dotenv.config();

const app = express();

// Configurazione CORS
if (process.env.NODE_ENV === "development") {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
  connectDB(); // Connessione al database locale
} else {
  app.use(
    cors({
      origin: "https://vicus.netlify.app/",
      credentials: true,
    })
  );
  connectDB(); // Connessione al database di produzione
}

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

// Avvio del server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
