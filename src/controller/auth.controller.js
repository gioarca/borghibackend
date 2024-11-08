const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { model } = require("mongoose");
const { error } = require("console");

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: "", password: "" };

  //incorrect email
  if (err.message === "incorrect email") {
    errors.email = "that email is not registered";
  }
  //incorrect password
  if (err.message === "incorrect password") {
    errors.password = "that password is incorrect";
  }

  // duplicate error code
  if (err.code === 11000) {
    errors.email = "that email is already registered";
    return errors;
  }

  //validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "net ninja secret", {
    expiresIn: maxAge,
  });
};

module.exports.signup_get = (req, res) => {
  res.json({ message: "Signup page data or redirect instruction" });
};

module.exports.login_get = (req, res) => {
  // Invia una risposta JSON invece di renderizzare una pagina
  res.json({ message: "Login page data or redirect instruction" });
};

// module.exports.signup_post = async (req, res) => {
//   const { email, password } = req.body;
//   console.log(email, password);
//   res.send("new signup");

//   try {
//     const user = await User.create({ email, password });
//     const token = createToken(user._id);
//     res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
//     res.status(200).json({ user: user._id });
//   } catch (err) {
//     const errors = handleErrors(err);
//     res.status(400).json(errors);
//     handleErrors(err);
//   }
// };

module.exports.signup_post = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
    res.status(400).send("error, user not created");
  }
};

module.exports.login_post = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne(email);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ error: err.message });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/signout");
};
