const router = require("express").Router();
const Notification = require("../models/Notification");
const User = require("../models/User");
const auth = require("../middleware/auth");

// GET notifications for logged-in user
router.get("/", auth, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
  res.json(notifications);
});

// PATCH mark all as read
router.patch("/read-all", auth, async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id }, { read: true });
  res.json({ message: "Marked all as read" });
});

// PATCH mark one as read
router.patch("/:id/read", auth, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ message: "Marked as read" });
});

// POST admin approve/reject supplier
router.post("/supplier-action", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  const { supplierId, action } = req.body; // action: "approved" | "rejected"
  const supplier = await User.findByIdAndUpdate(supplierId, { status: action }, { new: true });
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });

  await Notification.create({
    recipient: supplier._id,
    recipientRole: "supplier",
    message: action === "approved"
      ? "🎉 Your supplier account has been approved! You can now log in."
      : "❌ Your supplier registration was rejected by the admin.",
    type: action === "approved" ? "supplier_approved" : "supplier_rejected",
    relatedId: supplier._id,
  });

  res.json({ message: `Supplier ${action}` });
});

module.exports = router;
