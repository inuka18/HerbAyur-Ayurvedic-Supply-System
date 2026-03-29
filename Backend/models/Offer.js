const mongoose = require("mongoose");

const offerItemSchema = new mongoose.Schema({
  name:      String,
  supplyQty: Number,
  unit:      String,
  price:     Number,
});

const offerSchema = new mongoose.Schema(
  {
    requestId:  { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    supplyType: { type: String, enum: ["Whole", "Partial", "Item"],     required: true },
    items:      { type: [offerItemSchema], required: true },
    status:     { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
