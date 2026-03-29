const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:       { type: String, required: true },
    category:   { type: String, default: "Roots" },
    aliases:    { type: [String], default: [] },
    quantity:   { type: Number, required: true, min: 0 },
    unit:       { type: String, default: "kg" },
    price:      { type: Number, default: 0 }, // price per unit
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
