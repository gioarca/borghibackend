// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const xss = require("xss-clean");
// const mongoSanitize = require("express-mongo-sanitize");
// const bodyParser = require("body-parser");
// const port = 3000;
// const Borgo = require("./models/borgo.model.js");
// const borgoRoute = require("./v1/routes/borgo.route.js");
// const bcrypt = require("bcrypt");
// const User = require("./models/user.model.js");
// const authRoutes = require("./v1/routes/auth.route.js");
// const cookieParser = require("cookie-parser");
// const jwt = require("jsonwebtoken");
// const { requireAuth, checkUser } = require("./middleware/authMiddleware.js");

// const app = express();

// const i18n = require("i18n");

// i18n.configure({
//   locales: ["en", "it"],
//   directory: __dirname + "/locales",
//   defaultLocale: "en",
//   cookie: "lang",
// });

// app.use(i18n.init);

// // connessione al database
// mongoose
//   .connect(
//     // `mongodb+srv://${process.env.APP_CREDENTIALS}@cluster0.xv1petb.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.APP_NAME}` // production
//     `mongodb+srv://borghisud:Exlus3m3QclQKjBl@cluster0.xv1petb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
//   )
//   .then(() => {
//     console.log("Connected to the database!");
//     app.listen(port, () => {
//       console.log(`Server is running on port ${port}`);
//     });
//   })
//   .catch(() => {
//     console.log("Connection failed!", error);
//   });

// // Funzione per generare un nonce univoco
// const generateNonce = () => {
//   return require("crypto").randomBytes(16).toString("base64");
// };

// // middlewares metodo corretto!
// app.use((req, res, next) => {
//   res.header(
//     "Access-Control-Allow-Origin",
//     "*" // only for production
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   // res.header(
//   //   "Content-Security-Policy",
//   //   `default-src 'none'; script-src 'nonce-${nonce}'`
//   // );
//   next();
// });

// // cors utilizzato per tutte le entrate
// // app.use(
// //   cors({
// //     origin: "*",
// //     // methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Opzionale: specifica i metodi permessi
// //     // credentials: true, // Opzionale: consente di inviare cookie se necessario
// //   })
// // );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(mongoSanitize());
// app.use(xss());
// app.use(cookieParser());

// // app.set("view engine", "ejs");

// // routes
// app.use("/api/v1/borghi", borgoRoute);
// app.use("/api/v1/authRoutes", authRoutes);

// // cookies
// app.get("/set-cookies", (req, res) => {
//   // res.setHeader("Set-Cookie", "newUser=true"); la stessa cosa si scrive come sotto res.cookie
//   res.cookie("newUser", false);
//   res.cookie("isEmployee", true, { maxAge: 1000 * 60 * 60 * 24, secure: true });
//   res.send("you got the cookies!");
// });

// app.get("/read-cookies", (req, res) => {
//   const cookies = req.cookies;
//   console.log(cookies.newUser);
//   res.json(cookies);
// });

// app.get("/borghi", requireAuth, (req, res) => res.render("borghi"));
// app.use(authRoutes);
// app.get("*", checkUser);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { requireAuth, checkUser } = require("./middleware/authMiddleware.js");
const i18n = require("i18n");

const Borgo = require("./models/borgo.model.js");
const borgoRoute = require("./v1/routes/borgo.route.js");
const User = require("./models/user.model.js");
const authRoutes = require("./v1/routes/auth.route.js");

const port = process.env.PORT || 3000;
const app = express();

// Configura i18n
i18n.configure({
  locales: ["en", "it"],
  directory: __dirname + "/locales",
  defaultLocale: "en",
  cookie: "lang",
});
app.use(i18n.init);

// Connessione al database
mongoose
  .connect(
    `mongodb+srv://${process.env.APP_CREDENTIALS}@cluster0.xv1petb.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.APP_NAME}`, // Usa variabile d'ambiente per la connessione
    { useNewUrlParser: true, useUnifiedTopology: true }
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

// Middleware per nonce e CSP
const generateNonce = () =>
  require("crypto").randomBytes(16).toString("base64");

app.use((req, res, next) => {
  const nonce = generateNonce();
  res.locals.nonce = nonce;
  res.header("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`);
  next();
});

// Configura CORS per la produzione
app.use(
  cors({
    origin: "*", // NON Limita l'origine in produzione
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

// Middleware di sicurezza
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());

// Rotte
app.use("/api/v1/borghi", borgoRoute);
app.use("/api/v1/authRoutes", authRoutes);

// Cookies
app.get("/set-cookies", (req, res) => {
  res.cookie("newUser", false, { secure: true, httpOnly: true });
  res.cookie("isEmployee", true, {
    maxAge: 1000 * 60 * 60 * 24,
    secure: true,
    httpOnly: true,
  });
  res.send("you got the cookies!");
});

app.get("/read-cookies", (req, res) => {
  const cookies = req.cookies;
  console.log(cookies.newUser);
  res.json(cookies);
});

app.get("/borghi", requireAuth, (req, res) => res.render("borghi"));
app.use(authRoutes);
app.get("*", checkUser);

// Middleware di gestione degli errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Qualcosa è andato storto!");
});
