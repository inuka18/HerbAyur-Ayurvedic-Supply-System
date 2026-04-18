const mongoose = require("mongoose");

const offerItemSchema = new mongoose.Schema({
  name:      String,
  supplyQty: Number,
  unit:      String,
  price:     Number,
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
  reservedQty: { type: Number, default: 0 },
  reservedUnit:{ type: String, default: "" },
});

const offerSchema = new mongoose.Schema(
  {
    requestId:  { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    supplyType: { type: String, enum: ["Whole", "Partial", "Item"],     required: true },
    items:      { type: [offerItemSchema], required: true },
    status:     { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
    stockReserved: { type: Boolean, default: false },
    stockReleased: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
