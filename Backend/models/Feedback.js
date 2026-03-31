const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    offerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Offer"  },
    orderId:    { type: mongoose.Schema.Types.ObjectId, ref: "Order"  },
    rating:     { type: Number, min: 1, max: 5, required: true },
    comment:    { type: String, default: "" },
  },
  { timestamps: true }
);

// One feedback per supplier per order per customer
// This allows a customer to review each supplier separately for each order
feedbackSchema.index({ supplierId: 1, orderId: 1, customerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
