const mongoose = require("mongoose");
const { Schema } = mongoose;

const experienceSchema = new Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  price: {
    type: Number,
  },
  duration: {
    type: String,
  },
  category: {
    type: String,
  },
  // availability: {
  //   type: Date,
  // },
});

const Experience = mongoose.model("Experience", experienceSchema);

module.exports = Experience;
