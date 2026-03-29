const router       = require("express").Router();
const Contact      = require("../models/Contact");
const Notification = require("../models/Notification");
const User         = require("../models/User");
const jwt          = require("jsonwebtoken");

router.post("/", async (req, res) => {
  try {
    // Optionally identify logged-in user from token
    let role = "guest", userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        role   = decoded.role || "guest";
        userId = decoded.id   || null;
      } catch {}
    }

    const msg = await Contact.create({ ...req.body, role, userId });

    // Notify admin
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await Notification.create({
        recipient:     admin._id,
        recipientRole: "admin",
        message:       `New contact message from ${msg.name} (${role}): "${msg.message.slice(0, 60)}${msg.message.length > 60 ? "..." : ""}".`,
        type:          "contact_message",
        relatedId:     msg._id,
      });
    }

    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  const messages = await Contact.find().sort({ createdAt: -1 });
  res.json(messages);
});

module.exports = router;
