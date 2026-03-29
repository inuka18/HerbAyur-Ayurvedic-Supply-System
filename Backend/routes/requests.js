const router = require("express").Router();
const Request = require("../models/Request");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// GET all requests (admin/supplier)
router.get("/", async (req, res) => {
  const requests = await Request.find().sort({ createdAt: -1 });
  res.json(requests);
});

// GET single request
router.get("/:id", async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Not found" });
  res.json(request);
});

// POST create request — only logged-in customers
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "customer")
    return res.status(403).json({ message: "Only customers can post requirements." });
  try {
    const request = await Request.create({ ...req.body, customerId: req.user.id });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update status + notify customer
router.patch("/:id/status", async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (request.customerId) {
      await Notification.create({
        recipient: request.customerId,
        recipientRole: "customer",
        message: `Your requirement for "${request.materials[0]?.name || "materials"}" is now ${req.body.status}.`,
        type: "request_update",
        relatedId: request._id,
      });
    }

    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE request
router.delete("/:id", async (req, res) => {
  await Request.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
