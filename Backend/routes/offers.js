const router = require("express").Router();
const Offer        = require("../models/Offer");
const Request      = require("../models/Request");
const Notification = require("../models/Notification");
const User         = require("../models/User");
const Inventory    = require("../models/Inventory");
const auth         = require("../middleware/auth");

// POST — supplier submits an offer
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "supplier")
    return res.status(403).json({ message: "Only suppliers can submit offers." });
  try {
    const { requestId, supplyType, items } = req.body;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const offer = await Offer.create({ requestId, supplierId: req.user.id, supplyType, items });

    // Notify the customer
    if (request.customerId) {
      const supplier = await User.findById(req.user.id);
      await Notification.create({
        recipient:     request.customerId,
        recipientRole: "customer",
        message:       `A supplier "${supplier.firstName} ${supplier.lastName}" has submitted an offer for your request.`,
        type:          "offer_received",
        relatedId:     offer._id,
      });
    }

    res.status(201).json(offer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET — fetch all offers for a request (customer view)
router.get("/request/:requestId", auth, async (req, res) => {
  try {
    const offers = await Offer.find({ requestId: req.params.requestId })
      .populate("supplierId", "firstName lastName phone address companyName")
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET — fetch all offers submitted by logged-in supplier
router.get("/my-offers", auth, async (req, res) => {
  if (req.user.role !== "supplier")
    return res.status(403).json({ message: "Forbidden" });
  try {
    const offers = await Offer.find({ supplierId: req.user.id })
      .populate("requestId")
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH — customer accepts an offer
router.patch("/:id/accept", auth, async (req, res) => {
  if (req.user.role !== "customer")
    return res.status(403).json({ message: "Only customers can accept offers." });
  try {
    const offer = await Offer.findById(req.params.id).populate("requestId");
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (offer.supplyType === "Whole") {
      // Reject all other offers for same request
      await Offer.updateMany(
        { requestId: offer.requestId._id, _id: { $ne: offer._id } },
        { status: "Rejected" }
      );
    } else {
      // Reject offers that overlap on same items
      const acceptedItemNames = offer.items.map(i => i.name);
      const siblings = await Offer.find({ requestId: offer.requestId._id, _id: { $ne: offer._id }, status: "Pending" });
      for (const sibling of siblings) {
        const overlap = sibling.items.some(i => acceptedItemNames.includes(i.name));
        if (overlap) await Offer.findByIdAndUpdate(sibling._id, { status: "Rejected" });
      }
    }

    offer.status = "Accepted";
    await offer.save();

    // Auto-decrease supplier inventory for each offered item
    const normalize = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
    const inventory = await Inventory.find({ supplierId: offer.supplierId });
    for (const offeredItem of offer.items) {
      // find best matching inventory item by name or alias
      let matched = inventory.find(inv =>
        normalize(inv.name) === normalize(offeredItem.name) ||
        inv.aliases.some(a => normalize(a) === normalize(offeredItem.name))
      );
      if (matched) {
        matched.quantity = Math.max(0, matched.quantity - offeredItem.supplyQty);
        await matched.save();
      }
    }

    // Notify the supplier
    const supplier = await User.findById(offer.supplierId);
    const request  = offer.requestId;
    if (supplier) {
      await Notification.create({
        recipient:     supplier._id,
        recipientRole: "supplier",
        message:       `Your offer for the request by "${request.customer?.name || "a customer"}" has been accepted!`,
        type:          "offer_accepted",
        relatedId:     offer._id,
      });
    }

    res.json({ message: "Offer accepted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
