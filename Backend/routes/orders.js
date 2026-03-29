const router       = require("express").Router();
const Order        = require("../models/Order");
const Offer        = require("../models/Offer");
const Request      = require("../models/Request");
const Notification = require("../models/Notification");
const auth         = require("../middleware/auth");

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

    // Notify supplier
    await Notification.create({
      recipient:     offer.supplierId._id,
      recipientRole: "supplier",
      message:       `📦 New order #${order.receiptNo} confirmed! Customer paid for "${offer.requestId.listName || 'a request'}". Please process the order.`,
      type:          "order_confirmed",
      relatedId:     order._id,
    });

    // Notify customer
    await Notification.create({
      recipient:     offer.requestId.customerId,
      recipientRole: "customer",
      message:       `✅ Payment successful! Order #${order.receiptNo} placed with ${order.supplierName}. Status: Confirmed.`,
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

module.exports = router;
