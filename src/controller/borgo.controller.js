const { model } = require("mongoose");
const Borgo = require("../models/borgo.model.js");
const { error } = require("console");

// Endpoint per aggiungere un borgo
const createBorgo = async (req, res) => {
  try {
    const borgo = await Borgo.create(req.body);
    res.status(200).json({ success: true, data: borgo });
  } catch (error) {
    res.status(500).send({ error: err.message });
  }
};

// Endpoint per cercare un borgo inserito filtrarlo per nome e id
const getBorgo = async (req, res) => {
  try {
    // const { _id } = req.params;
    const { _id, name } = req.params;
    const borgo = await Borgo.findById({ _id });
    // const borgo = await Borgo.find({ _id }).find({ name: name });
    // const borgo = await Borgo.findById(_id);
    res.status(200).json(borgo);
  } catch {
    res.status(500).json({ error: error.message });
  }
};

// Endpoint per mostrare tutti i borghi inseriti secondo i nomi e l'id
const getBorghi = async (req, res) => {
  try {
    let { limit, offset } = req.query;
    limit = parseInt(limit) || 100; // imposta un limite pari a 100 se non definito
    offset = parseInt(offset) || 0; // imposta un limite pari a 0 se non definito
    const borgo = await Borgo.find({}).limit(limit).skip(offset);
    res.status(200).json(borgo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Endopoint per aggiornare un borgo
const updateBorgo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const borgo = await Borgo.findByIdAndUpdate(id, { name }, { new: true });
    if (!borgo) {
      return res.status(404).json({ message: "Borgo not found" });
    }
    const updateBorgo = await Borgo.findById(id);
    res.status(200).json(updateBorgo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Endopoint per cancellare un borgo
const deleteBorgo = async (req, res) => {
  try {
    const { id } = req.params;
    const borgo = await Borgo.findByIdAndDelete(id);
    if (!borgo) {
      return res.status(404).json({ message: "Borgo not found!" }); // aggiunto un return
    }
    res.status(200).json({ message: "Borgo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBorgo,
  getBorgo,
  getBorghi,
  updateBorgo,
  deleteBorgo,
};
