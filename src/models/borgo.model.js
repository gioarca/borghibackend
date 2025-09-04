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
  place_description: {
    type: String,
    // required: [true, "Please enter where is the location"],
  },
  description: {
    type: String,
    // required: [true, "Please enter the description of the borgo"],
  },
  imgURL: {
    type: String,
    required: [true, "Please enter a link of an image"],
  },
  internet: {
    type: String,
    // required: [true, "Please provide a link"],
  },
  priceHouses: {
    type: String,
    // required: [true, "Please enter correct data"],
  },
  airbnbFilter: {
    type: String,
    // required: [true, "Please enter a nice House"],
  },
  hospital: {
    type: String,
    // required: [true, "Please enter an hospital nearby"],
  },
  app: {
    type: String,
    // required: [true, "Please enter the app Io link"],
  },
  school: {
    type: String,
    // required: [true, "Please enter a school website link"],
  },
  district: {
    type: String,
    // required: [true, "Please enter a website of a district nearby"],
  },
  airport: {
    type: String,
    // required: [true, "Please enter a maps link from the borgo"],
  },
  coworking: {
    type: String,
    // Coworking is an optional --> later on will be implemented in the webapp
  },
  experienceVideoId: {
    type: String,
  },
});

const Borgo = mongoose.model("Borgo", borgoSchema);

module.exports = Borgo;
