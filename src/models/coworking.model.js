// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const coworkingSchema = new Schema({
//   title: {
//     type: String,
//   },
//   description: {
//     type: String,
//   },
//   image: {
//     type: String,
//   },
//   price: {
//     type: Number,
//   },
//   duration: {
//     type: String,
//   },
//   category: {
//     type: String,
//   },
//   // availability: {
//   //   type: Date,
//   // },
// });

// const Coworking = mongoose.model("Coworking", coworkingSchema);

// module.exports = Coworking;

// models/Coworking.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const cowLocationSchema = new Schema({
  address: { type: String },
  city: { type: String, index: true },
  postcode: { type: String },
  country: { type: String, default: "Italy" },
  geo: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] }, // [lng, lat]
  },
});

const coworkingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, index: true }, // utile per url
    description: { type: String },
    images: [{ type: String }], // array di URL
    pricePerDay: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EUR" },
    category: {
      type: String,
      enum: ["open-space", "private-room", "meeting-room", "hub", "other"],
      default: "open-space",
    },
    capacity: { type: Number, default: 1, min: 1 },
    amenities: [{ type: String }], // e.g. ['wifi','printer','coffee']
    location: cowLocationSchema,
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    openingHours: {
      // semplice fallback: orario per giorno (opzionale)
      monday: { open: String, close: String },
      // ... ripeti per gli altri giorni
    },
    minDays: { type: Number, default: 1 }, // soggiorno minimo in giorni
    maxDays: { type: Number }, // opzionale
    ratingCount: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 }, // per virtual averageRating
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// virtual
coworkingSchema.virtual("averageRating").get(function () {
  if (!this.ratingCount) return 0;
  return this.ratingSum / this.ratingCount;
});

// indexes
coworkingSchema.index({ "location.geo": "2dsphere" });
coworkingSchema.index({ pricePerDay: 1 });
coworkingSchema.index({ category: 1 });

const Coworking = mongoose.model("Coworking", coworkingSchema);

module.exports = Coworking;
