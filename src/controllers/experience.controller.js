const Model = require("mongoose");
const { error } = require("console");
const Experience = require("../models/experience.model");

const getExperience = async (req, res) => {
  try {
    const { _id } = req.params;
    const experience = await Experience.getExperiencesByBorgoId(_id);
    res.status(200).json(experience);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = {
  getExperience,
};
