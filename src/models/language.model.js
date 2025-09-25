const translationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  it: { type: String, required: true },
  en: { type: String, required: true },
  de: { type: String, required: true },
});

const Translation = mongoose.model("Translation", translationSchema);
