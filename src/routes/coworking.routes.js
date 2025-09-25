const express = require("express");
const Coworking = require("../models/coworking.model.js");
const router = express.Router();
const {
  createCoworking,
  getCoworking,
  updateCoworking,
  deleteCoworking,
} = require("../controllers/coworking.controller.js");

router.post("/", createCoworking);
router.get("/:_id", getCoworking); // ricerca per _id
router.put("/:_id", updateCoworking);
router.delete("/:_id", deleteCoworking);

module.exports = router;
