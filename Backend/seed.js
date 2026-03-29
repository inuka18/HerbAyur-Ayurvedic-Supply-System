require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ role: "admin" });
  if (exists) { console.log("Admin already exists:", exists.email); process.exit(); }

  const password = await bcrypt.hash("admin123", 10);
  await User.create({
    firstName: "Admin",
    lastName:  "HerbAyur",
    email:     "admin@herbayur.lk",
    password,
    phone:     "+94 78 3730 114",
    address:   "Malabe, Sri Lanka",
    role:      "admin",
    status:    "approved",
  });

  console.log("✅ Admin created — email: admin@herbayur.lk  password: admin123");
  process.exit();
}

seed().catch(err => { console.error(err); process.exit(1); });
