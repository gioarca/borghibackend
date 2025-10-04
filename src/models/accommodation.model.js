const mongoose = require("mongoose");
const { Schema } = mongoose;

const accommodationSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter a name"],
  },
  location: {
    type: String,
    required: [true, "Please enter a location"],
  },
  description: {
    type: String,
    required: [true, "Please enter the description of the accomodation"],
  },
  image: {
    type: String,
    required: [true, "Please enter a link of an image"],
  },
  amenities: {
    type: [String],
    // required: [true, "Please provide a link"],
  },
  rating: {
    type: Number,
    // required: [true, "Please enter correct data"],
  },
  reviews: {
    type: Number,
    // required: [true, "Please enter a nice House"],
  },
  price: {
    type: Number,
    // required: [true, "Please enter a nice House"],
  },
  borgo: { type: mongoose.Schema.Types.ObjectId, ref: "Borgo", required: true }, // 🔗 collegamento
});

const Accommodation = mongoose.model("Accommodation", accommodationSchema);

module.exports = Accommodation;
