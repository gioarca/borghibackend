const Model = require("mongoose");
const { error } = require("console");
const Coworking = require("../models/coworking.model");

// Endpoint per aggiungere un'esperienza
const createCoworking = async (req, res) => {
  try {
    const coworking = await Coworking.create(req.body);
    res.status(200).json({ success: true, data: coworking });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getCoworking = async (req, res) => {
  try {
    const { _id } = req.params;
    const coworking = await Coworking.findById(_id);
    res.status(200).json(coworking);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Endopoint per aggiornare un coworking
const updateCoworking = async (req, res) => {
  try {
    const { _id } = req.params;
    const {
      name,
      place,
      place_description,
      description,
      imgURL,
      internet,
      priceHouses,
      airbnbFilter,
      hospital,
      app,
      school,
      district,
      airport,
      coworking,
    } = req.body;
    const Coworking = await Coworking.findByIdAndUpdate(
      _id,
      {
        name,
        place,
        place_description,
        description,
        imgURL,
        internet,
        priceHouses,
        airbnbFilter,
        hospital,
        app,
        school,
        district,
        airport,
        coworking,
      },
      { new: true }
    );
    if (!Coworking) {
      return res.status(404).json({ message: "coworking not found" });
    }

    if (!_id) {
      return res.status(400).json({ error: "coworking ID is required" });
    }

    const updateCoworking = await Coworking.findById(_id);
    res.status(200).json(updateCoworking);
  } catch (error) {
    console.error("Error updating Coworking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Endopoint per cancellare un'esperienza
const deleteCoworking = async (req, res) => {
  try {
    const { _id } = req.params;
    const Coworking = await Coworking.findByIdAndDelete(_id);
    if (!Coworking) {
      return res.status(404).json({ message: "Coworking not found!" }); // aggiunto un return
    }
    res.status(200).json({ message: "Coworking deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = {
  createCoworking,
  getCoworking,
  deleteCoworking,
  updateCoworking,
};
