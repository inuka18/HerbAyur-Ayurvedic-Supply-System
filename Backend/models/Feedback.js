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

// one feedback per order per customer
feedbackSchema.index({ orderId: 1, customerId: 1 }, { unique: true, sparse: true });
feedbackSchema.index({ offerId: 1, customerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
