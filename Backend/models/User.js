const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName:   { type: String, required: true },
    lastName:    { type: String, required: true },
    email:       { type: String, required: true, unique: true },
    password:    { type: String, required: true },
    phone:       { type: String, required: true },
    address:     { type: String, required: true },
    role:        { type: String, enum: ["customer", "supplier", "admin"], default: "customer" },
    companyName:      { type: String },
    certificationUrl: { type: String },
    status:      { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    // Supplier pending profile changes awaiting admin approval
    pendingChanges: {
      firstName:        { type: String },
      lastName:         { type: String },
      phone:            { type: String },
      address:          { type: String },
      companyName:      { type: String },
      certificationUrl: { type: String },
      submittedAt:      { type: Date },
    },
    warnings: [
      {
        message:   { type: String, required: true },
        issuedAt:  { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
