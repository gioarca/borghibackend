const express = require("express");
const Accommodations = require("../models/accommodation.model.js");
const router = express.Router({ mergeParams: true }); // 🔑 importante

const {
  createAccommodation,
  getAccommodation,
  getAccommodations,
  updateAccommodation,
  deleteAccommodation,
} = require("../controllers/accommodation.controller.js");

router.post("/", createAccommodation);
router.get("/:param", getAccommodation); // ricerca per nome o per _id
router.get("/", getAccommodations);
router.put("/:_id", updateAccommodation);
router.delete("/:_id", deleteAccommodation);

module.exports = router;
