const express = require("express");
const router = express.Router();
const path = require("path");

// Serve translation JSON files
router.get("/:lang", (req, res) => {
  const lang = req.params.lang;

  // Path to translation files
  const filePath = path.join(__dirname, `../locales/${lang}.json`);
  try {
    res.sendFile(filePath); // Serve the appropriate file
  } catch (error) {
    res.status(404).json({ error: "Translation not found" });
  }
});

module.exports = router;
