const express = require("express");
const Borgo = require("../models/borgo.model.js");
const router = express.Router();
const {
  createBorgo,
  getBorgo,
  getBorghi,
  getExperience,
  updateBorgo,
  deleteBorgo,
  loadMoreBorghi,
} = require("../controllers/borgo.controller.js");

router.post("/", createBorgo);
router.get("/:_id", getBorgo); // ricerca per nome o per _id
router.get("/:_id/experience", getExperience); // ricerca per nome o per _id
router.get("/", getBorghi);
router.get("/", loadMoreBorghi);
router.put("/:_id", updateBorgo);
router.delete("/:_id", deleteBorgo);

module.exports = router;
