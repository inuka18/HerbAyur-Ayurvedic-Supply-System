const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    offerId:      { type: mongoose.Schema.Types.ObjectId, ref: "Offer",   required: true },
    requestId:    { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
    customerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    supplierId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    items:        [{ name: String, supplyQty: Number, unit: String, price: Number }],
    totalAmount:  { type: Number, required: true },
    paymentMethod:{ type: String, enum: ["Card", "Bank Transfer", "Cash on Delivery"], required: true },
    paymentStatus:{ type: String, enum: ["Paid", "Pending"], default: "Paid" },
    orderStatus:  { type: String, enum: ["Confirmed", "Processing", "Delivered"], default: "Confirmed" },
    receiptNo:    { type: String, unique: true },
    listName:     { type: String, default: "" },
    supplierName: { type: String, default: "" },
    customerName: { type: String, default: "" },
    customerConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate receipt number before save
orderSchema.pre("save", function (next) {
  if (!this.receiptNo) {
    this.receiptNo = "HA-" + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
