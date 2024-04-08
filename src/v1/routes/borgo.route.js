const express = require("express");
const Borgo = require("../../models/borgo.model.js");
const router = express.Router();
const {
  createBorgo,
  getBorgo,
  getBorghi,
  updateBorgo,
  deleteBorgo,
} = require("../../controller/borgo.controller.js");

router.post("/", createBorgo);
router.get("/:_id", getBorgo); // ricerca per nome o per _id
router.get("/", getBorghi);
router.put("/:_id", updateBorgo);
router.delete("/:_id", deleteBorgo);

module.exports = router;
