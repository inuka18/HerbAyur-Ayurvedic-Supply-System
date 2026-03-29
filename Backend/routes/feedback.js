const router      = require("express").Router();
const Feedback     = require("../models/Feedback");
const Notification = require("../models/Notification");
const User         = require("../models/User");
const auth         = require("../middleware/auth");

// POST — customer submits feedback (supports both offerId and orderId)
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "customer")
    return res.status(403).json({ message: "Only customers can submit feedback." });
  try {
    const { supplierId, offerId, orderId, rating, comment } = req.body;
    if (!supplierId || !rating)
      return res.status(400).json({ message: "supplierId and rating are required." });
    if (!offerId && !orderId)
      return res.status(400).json({ message: "Either offerId or orderId is required." });

    const feedbackData = { supplierId, customerId: req.user.id, rating, comment };
    if (orderId) feedbackData.orderId = orderId;
    if (offerId) feedbackData.offerId = offerId;

    const feedback = await Feedback.create(feedbackData);

    const supplier = await User.findById(supplierId);
    if (supplier) {
      await Notification.create({
        recipient:     supplier._id,
        recipientRole: "supplier",
        message:       `⭐ You received a ${rating}-star rating from a customer. "${comment ? comment.slice(0, 60) : "No comment"}"`,
        type:          "feedback_received",
        relatedId:     feedback._id,
      });
    }

    res.status(201).json(feedback);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "You have already submitted feedback for this order." });
    res.status(400).json({ message: err.message });
  }
});

// GET — all feedback for a supplier with avg rating
router.get("/supplier/:supplierId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ supplierId: req.params.supplierId })
      .populate("customerId", "firstName lastName")
      .populate("orderId", "receiptNo listName totalAmount items createdAt")
      .sort({ createdAt: -1 });
    const avg = feedbacks.length
      ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
      : null;
    res.json({ feedbacks, avg, count: feedbacks.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET — logged-in supplier's own feedbacks
router.get("/my-feedbacks", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Forbidden" });
  try {
    const feedbacks = await Feedback.find({ supplierId: req.user.id })
      .populate("customerId", "firstName lastName phone")
      .populate("orderId",    "receiptNo listName totalAmount items createdAt orderStatus")
      .sort({ createdAt: -1 });
    const avg = feedbacks.length
      ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
      : null;
    res.json({ feedbacks, avg, count: feedbacks.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET — check feedback by offerId
router.get("/check/:offerId", auth, async (req, res) => {
  try {
    const existing = await Feedback.findOne({ offerId: req.params.offerId, customerId: req.user.id });
    res.json({ given: !!existing, feedback: existing });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET — check feedback by orderId
router.get("/check-order/:orderId", auth, async (req, res) => {
  try {
    const existing = await Feedback.findOne({ orderId: req.params.orderId, customerId: req.user.id });
    res.json({ given: !!existing, feedback: existing });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
