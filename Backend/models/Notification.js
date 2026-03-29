const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientRole: { type: String, enum: ["admin", "customer", "supplier"] },
    message:       { type: String, required: true },
    type: { type: String, enum: ["new_supplier", "new_customer", "request_update", "supplier_approved", "supplier_rejected", "offer_received", "offer_accepted", "feedback_received", "contact_message", "order_confirmed", "order_status_update"], required: true },
    read:          { type: Boolean, default: false },
    relatedId:     { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
