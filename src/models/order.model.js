const mongoose = require("mongoose");
const { Schema } = mongoose;
const { Borgo } = require("../models/borgo.model");
const { User } = require("../models/user.model");

const orderSchema = new Schema({
  borghi: {
    type: Schema.Types.ObjectId,
    ref: "Borgo",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
