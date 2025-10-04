const mongoose = require("mongoose");

const TranslationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  it: { type: String, default: "" },
  en: { type: String, default: "" },
  de: { type: String, default: "" },
});

module.exports = mongoose.model("Translation", TranslationSchema);
