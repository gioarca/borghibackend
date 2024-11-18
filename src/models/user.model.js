// const mongoose = require("mongoose");
// const { Schema } = mongoose;
// const { isEmail } = require("validator");
// const { bcrypt } = require("bcryptjs");

// const UserSchema = new Schema({
//   email: {
//     type: String,
//     required: [true, "Please enter an email"],
//     unique: true,
//     lowercase: true,
//     validate: [isEmail, "Please enter a valid email"],
//   },
//   password: {
//     type: String,
//     required: [true, "Please enter a password"],
//     minlength: [6, "Minimum password length is 6 characters"],
//   },
// });

// // fire a function before doc saved to db
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   // const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // fire a function after doc saved to db
// UserSchema.post("save", function (doc, next) {
//   console.log("new user was created & saved", doc);
//   next();
// });

// // static method to login user
// UserSchema.statics.login = async function (email, password) {
//   const user = await this.findOne({ email });
//   if (user) {
//     const auth = await bcrypt.compare(password, user.password);
//     if (auth) {
//       return user;
//     }
//     throw Error("incorrect password");
//   }
//   throw Error("incorrect email");
// };

// const User = mongoose.model("User", UserSchema);

// module.exports = User;

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Use bcryptjs, not bcrypt

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  // Check if the password has been modified
  if (!this.isModified("password")) return next();

  try {
    // Hash the password with a salt of 10 rounds
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error); // Pass any errors to the next middleware
  }
});

// Method to compare password
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
