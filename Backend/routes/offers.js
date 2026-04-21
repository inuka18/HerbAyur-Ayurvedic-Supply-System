const router = require("express").Router();
const Offer        = require("../models/Offer");
const Request      = require("../models/Request");
const Notification = require("../models/Notification");
const User         = require("../models/User");
const auth         = require("../middleware/auth");
const { reserveInventoryForItems, restoreInventoryForItems, releaseOfferReservation } = require("../utils/offerStock");

// POST — supplier submits an offer
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "supplier")
    return res.status(403).json({ message: "Only suppliers can submit offers." });
  let reservedItems = null;
  let offerCreated = false;
  try {
    const { requestId, supplyType, items } = req.body;
    const selectedItems = Array.isArray(items) ? items : [];
    if (selectedItems.length === 0) {
      return res.status(400).json({ message: "Select at least one item to supply." });
    }

    for (const item of selectedItems) {
      if (!item.inventoryId) {
        return res.status(400).json({ message: `Please select inventory for "${item.name}".` });
      }
      if (!Number.isFinite(Number(item.supplyQty)) || Number(item.supplyQty) <= 0) {
        return res.status(400).json({ message: `Invalid supply quantity for "${item.name}".` });
      }
      if (!Number.isFinite(Number(item.price)) || Number(item.price) <= 0) {
        return res.status(400).json({ message: `Price must be a positive number for "${item.name}".` });
      }
    }

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    reservedItems = await reserveInventoryForItems(req.user.id, selectedItems);
    const offer = await Offer.create({
      requestId,
      supplierId: req.user.id,
      supplyType,
      items: reservedItems,
      stockReserved: true,
      stockReleased: false,
    });
    offerCreated = true;

    // Notify the customer
    if (request.customerId) {
      try {
        const supplier = await User.findById(req.user.id);
        await Notification.create({
          recipient:     request.customerId,
          recipientRole: "customer",
          message:       `A supplier "${supplier.firstName} ${supplier.lastName}" has submitted an offer for your request.`,
          type:          "offer_received",
          relatedId:     offer._id,
        });
      } catch (notifyErr) {
        console.error("Offer notification failed:", notifyErr.message);
      }
    }

    res.status(201).json(offer);
  } catch (err) {
    if (reservedItems && !offerCreated) {
      try { await restoreInventoryForItems(req.user.id, reservedItems); }
      catch (rollbackErr) { console.error("Offer stock rollback failed:", rollbackErr.message); }
    }
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
      // Reject all other offers for same request and notify each supplier
      const others = await Offer.find({ requestId: offer.requestId._id, _id: { $ne: offer._id }, status: { $ne: "Rejected" } });
      for (const other of others) {
        if (other.status !== "Rejected") {
          other.status = "Rejected";
          await other.save();
        }
        await releaseOfferReservation(other);
        await Notification.create({
          recipient:     other.supplierId,
          recipientRole: "supplier",
          message:       `Your offer for "${offer.requestId.listName || "a request"}" was rejected because the customer accepted another supplier's offer.`,
          type:          "offer_accepted",
          relatedId:     other._id,
        });
      }
    } else {
      // Reject offers that overlap on same items and notify each
      const acceptedItemNames = offer.items.map(i => i.name);
      const siblings = await Offer.find({ requestId: offer.requestId._id, _id: { $ne: offer._id }, status: "Pending" });
      for (const sibling of siblings) {
        const overlap = sibling.items.some(i => acceptedItemNames.includes(i.name));
        if (overlap) {
          sibling.status = "Rejected";
          await sibling.save();
          await releaseOfferReservation(sibling);
          await Notification.create({
            recipient:     sibling.supplierId,
            recipientRole: "supplier",
            message:       `Your offer for "${offer.requestId.listName || "a request"}" was rejected because the customer accepted another supplier for the same items.`,
            type:          "offer_accepted",
            relatedId:     sibling._id,
          });
        }
      }
    }

    offer.status = "Accepted";
    await offer.save();

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
