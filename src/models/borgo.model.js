const mongoose = require("mongoose");
const { Schema } = mongoose;

const borgoSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter product name"],
  },
  place: {
    type: String,
    required: [true, "Please enter a location"],
  },
  description: {
    type: String,
    required: [true, "Please enter the description of the borgo"],
  },
  imgURL: {
    type: String,
    required: [true, "Please enter a link of an image"],
  },
  internet: {
    type: String,
    required: [true, "Please provide a link"],
  },
  priceHouses: {
    type: String,
    required: [true, "Please enter correct data"],
  },
  airbnbFilter: {
    type: String,
    required: [true, "Please enter a nice House"],
  },
  ospedale: {
    type: String,
    required: [true, "Please enter an hospital nearby"],
  },
  comune: {
    type: String,
    required: [true, "Please enter a comune website nearby"],
  },
  scuole: {
    type: String,
    required: [true, "Please enter a school nearby"],
  },
});

const Borgo = mongoose.model("Borgo", borgoSchema);

module.exports = Borgo;
