const mongoose = require("mongoose");
const { Schema } = mongoose;

const experienceSchema = new Schema({
  borgoId: {
    type: String,
  },
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
  availability: {
    type: Date,
  },
});

const Experience = mongoose.model("Borgo", experienceSchema);

module.exports = Experience;
