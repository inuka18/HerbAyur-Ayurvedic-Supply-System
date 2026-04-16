const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  category:  { type: String, default: "Raw Herb" },
  unit:      { type: String, default: "kg" },
  quantity:  { type: Number, required: true },
  condition: { type: String, default: "Fresh" },
  part:      { type: String, default: "Root" },
});

const requestSchema = new mongoose.Schema(
  {
    customer: {
      name:     { type: String, required: true },
      phone:    { type: String, required: true },
      location: { type: String, required: true },
    },
    listName:     { type: String, default: "" },
    requiredDate: { type: Date, required: true },
    materials:    { type: [materialSchema], required: true },
    status:       { type: String, default: "Pending" },
    customerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    coveredItems: { type: [String], default: [] }, // material names covered by accepted+paid offers
    fullyCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
