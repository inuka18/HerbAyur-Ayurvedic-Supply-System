require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetPassword() {
  await mongoose.connect(process.env.MONGO_URI);
  const hashed = await bcrypt.hash("admin123", 10);
  const result = await User.updateOne({ role: "admin" }, { password: hashed });
  console.log(result.modifiedCount ? "✅ Admin password updated to admin123" : "❌ Admin not found");
  process.exit();
}

resetPassword().catch(err => { console.error(err); process.exit(1); });
