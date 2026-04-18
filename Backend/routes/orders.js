const router       = require("express").Router();
const Order        = require("../models/Order");
const Offer        = require("../models/Offer");
const Request      = require("../models/Request");
const Notification = require("../models/Notification");
const auth         = require("../middleware/auth");
const { releaseOfferReservation } = require("../utils/offerStock");

// POST — customer creates order after payment
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "customer")
    return res.status(403).json({ message: "Only customers can create orders." });
  try {
    const { offerId, paymentMethod } = req.body;
    const offer = await Offer.findById(offerId)
      .populate("requestId")
      .populate("supplierId", "firstName lastName companyName");
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    const order = await Order.create({
      offerId,
      requestId:     offer.requestId._id,
      customerId:    req.user.id,
      supplierId:    offer.supplierId._id,
      items:         offer.items,
      totalAmount:   offer.items.reduce((s, i) => s + i.price * i.supplyQty, 0),
      paymentMethod,
      paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      listName:      offer.requestId.listName || "",
      supplierName:  offer.supplierId.companyName || `${offer.supplierId.firstName} ${offer.supplierId.lastName}`,
      customerName:  req.user.name,
    });

    // Mark covered items on the request
    const request = await Request.findById(offer.requestId._id);
    if (request) {
      const newCovered = [...new Set([
        ...request.coveredItems,
        ...offer.items.map(i => i.name.toLowerCase().trim()),
      ])];
      const allMaterialNames = request.materials.map(m => m.name.toLowerCase().trim());
      const fullyCompleted   = allMaterialNames.every(n => newCovered.includes(n));
      await Request.findByIdAndUpdate(offer.requestId._id, { coveredItems: newCovered, fullyCompleted });
    }

    // Mark the paid offer as Accepted
    await Offer.findByIdAndUpdate(offerId, { status: "Accepted" });

    // Reject all other offers that supply any of the same items, notify each supplier
    const paidItemNames = offer.items.map(i => i.name.toLowerCase().trim());
    const siblings = await Offer.find({
      requestId: offer.requestId._id,
      _id:       { $ne: offerId },
      status:    { $ne: "Rejected" },
    });

    for (const sibling of siblings) {
      const siblingItemNames = sibling.items.map(i => i.name.toLowerCase().trim());
      const overlapping = siblingItemNames.filter(n => paidItemNames.includes(n));

      // Reject if: whole supply OR any item overlaps with the paid offer
      const shouldReject = offer.supplyType === "Whole" ||
                           sibling.supplyType === "Whole" ||
                           overlapping.length > 0;

      if (shouldReject) {
        sibling.status = "Rejected";
        await sibling.save();
        await releaseOfferReservation(sibling);
        const reason = offer.supplyType === "Whole"
          ? `the customer accepted a whole-list offer from another supplier`
          : `the customer accepted another supplier for: ${overlapping.map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(", ")}`;
        await Notification.create({
          recipient:     sibling.supplierId,
          recipientRole: "supplier",
          message:       `Your offer for "${offer.requestId.listName || "a request"}" was rejected because ${reason}.`,
          type:          "offer_accepted",
          relatedId:     sibling._id,
        });
      }
    }

    // Notify supplier
    await Notification.create({
      recipient:     offer.supplierId._id,
      recipientRole: "supplier",
      message:       paymentMethod === "Cash on Delivery"
        ? `📦 New COD order #${order.receiptNo} placed for "${offer.requestId.listName || 'a request'}". Payment is pending on delivery.`
        : `📦 New order #${order.receiptNo} confirmed! Customer paid for "${offer.requestId.listName || 'a request'}". Please process the order.`,
      type:          "order_confirmed",
      relatedId:     order._id,
    });

    // Notify customer
    await Notification.create({
      recipient:     offer.requestId.customerId,
      recipientRole: "customer",
      message:       paymentMethod === "Cash on Delivery"
        ? `🕐 COD order #${order.receiptNo} placed with ${order.supplierName}. Payment is pending — please pay on delivery.`
        : `✅ Payment successful! Order #${order.receiptNo} placed with ${order.supplierName}. Status: Confirmed.`,
      type:          "order_confirmed",
      relatedId:     order._id,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET — customer's own orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate("supplierId", "firstName lastName companyName phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET — supplier's orders
router.get("/supplier-orders", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Forbidden" });
  try {
    const orders = await Order.find({ supplierId: req.user.id })
      .populate("customerId", "firstName lastName phone address")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET — all orders (admin)
router.get("/all", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const orders = await Order.find()
      .populate("customerId", "firstName lastName phone address")
      .populate("supplierId", "firstName lastName companyName phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH — customer confirms delivery
router.patch("/:id/confirm-delivery", auth, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can confirm delivery." });
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.orderStatus !== "Delivered") return res.status(400).json({ message: "Order is not marked as Delivered by supplier yet." });

    order.customerConfirmed = true;
    await order.save();

    // Notify supplier
    await Notification.create({
      recipient:     order.supplierId,
      recipientRole: "supplier",
      message:       `✅ Customer confirmed delivery for order #${order.receiptNo}. Order complete!`,
      type:          "order_status_update",
      relatedId:     order._id,
    });

    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH — update order status (supplier or admin)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: req.body.orderStatus },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Notify customer
    await Notification.create({
      recipient:     order.customerId,
      recipientRole: "customer",
      message:       `📦 Your order #${order.receiptNo} from ${order.supplierName} is now "${req.body.orderStatus}".`,
      type:          "order_status_update",
      relatedId:     order._id,
    });

    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PATCH — customer marks COD payment as paid (after delivery)
router.patch("/:id/pay-cod", auth, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can do this." });
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentMethod !== "Cash on Delivery") return res.status(400).json({ message: "Not a COD order." });
    if (order.orderStatus !== "Delivered") return res.status(400).json({ message: "Order must be delivered before marking as paid." });
    if (order.paymentStatus !== "Pending") return res.status(400).json({ message: "Payment already updated." });

    order.paymentStatus = "Paid";
    await order.save();

    await Notification.create({
      recipient:     order.supplierId,
      recipientRole: "supplier",
      message:       `💵 Customer marked COD payment as paid for order #${order.receiptNo}. Please confirm receipt of cash.`,
      type:          "order_status_update",
      relatedId:     order._id,
    });

    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PATCH — supplier confirms COD cash received
router.patch("/:id/confirm-cod-payment", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Only suppliers can do this." });
  try {
    const order = await Order.findOne({ _id: req.params.id, supplierId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentMethod !== "Cash on Delivery") return res.status(400).json({ message: "Not a COD order." });
    if (order.paymentStatus !== "Paid") return res.status(400).json({ message: "Customer has not marked payment yet." });

    order.paymentStatus = "COD Confirmed";
    await order.save();

    await Notification.create({
      recipient:     order.customerId,
      recipientRole: "customer",
      message:       `✅ Supplier confirmed receipt of your COD payment for order #${order.receiptNo}.`,
      type:          "order_status_update",
      relatedId:     order._id,
    });

    res.json(order);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
