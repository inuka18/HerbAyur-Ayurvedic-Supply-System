const router = require("express").Router();
const Request = require("../models/Request");
const Offer   = require("../models/Offer");
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

// DELETE request — customer can cancel only if no orders placed
router.delete("/:id", auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Only the owner can cancel
    if (String(request.customerId) !== String(req.user.id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorised" });

    // Block cancellation if any orders have been placed for this request
    if ((request.coveredItems || []).length > 0)
      return res.status(400).json({ message: "Cannot cancel — orders have already been placed for some items in this request." });

    await Request.findByIdAndDelete(req.params.id);

    // Notify all suppliers who submitted offers for this request
    const offers = await Offer.find({ requestId: req.params.id });
    const notifiedSuppliers = new Set();
    for (const offer of offers) {
      const sid = String(offer.supplierId);
      if (notifiedSuppliers.has(sid)) continue;
      notifiedSuppliers.add(sid);
      await Notification.create({
        recipient:     offer.supplierId,
        recipientRole: "supplier",
        message:       `❌ The customer has cancelled the request "${request.listName || "a requirement list"}". Your offer for this request is no longer active.`,
        type:          "request_update",
        relatedId:     offer._id,
      });
    }

    res.json({ message: "Request cancelled successfully." });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
