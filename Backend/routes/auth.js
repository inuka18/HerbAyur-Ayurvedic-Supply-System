const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only PDF, JPEG, PNG, DOC, DOCX allowed"));
}});

// GET current logged-in user profile
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// GET all users (admin only)
router.get("/users", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const users = await User.find({ role: { $ne: "admin" } }).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

// REGISTER
router.post("/register", upload.single("certification"), async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, address, role, companyName } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const userData = {
      firstName, lastName, email, password: hashed, phone, address,
      role: role || "customer",
    };

    if (role === "supplier") {
      userData.companyName = companyName;
      userData.certificationUrl = req.file ? `/uploads/${req.file.filename}` : "";
      userData.status = "pending"; // suppliers need admin approval
    }

    const user = await User.create(userData);

    // Notify admin about new supplier
    if (role === "supplier") {
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        await Notification.create({
          recipient: admin._id,
          recipientRole: "admin",
          message: `New supplier registered: ${firstName} ${lastName} (${companyName}). Awaiting approval.`,
          type: "new_supplier",
          relatedId: user._id,
        });
      }
    }

    // Notify admin about new customer
    if (role === "customer" || !role) {
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        await Notification.create({
          recipient: admin._id,
          recipientRole: "admin",
          message: `New customer registered: ${firstName} ${lastName} (${email}).`,
          type: "new_customer",
          relatedId: user._id,
        });
      }
    }

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role === "supplier" && user.status === "pending")
      return res.status(403).json({ message: "Your account is pending admin approval." });

    if (user.role === "supplier" && user.status === "rejected")
      return res.status(403).json({ message: "Your registration was rejected." });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: `${user.firstName} ${user.lastName}` },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN RESET PASSWORD for any user
router.post("/admin/reset-password", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword)
      return res.status(400).json({ message: "userId and newPassword are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// RESET PASSWORD (public - by email)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ message: "Email and new password are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update own profile
router.patch("/profile", auth, upload.single("certification"), async (req, res) => {
  try {
    const { firstName, lastName, phone, address, companyName } = req.body;

    if (req.user.role === "supplier") {
      const needsApproval = companyName || req.file;

      if (companyName && !req.file) {
        return res.status(400).json({ message: "A new certification is required when changing the company name." });
      }
      // Apply basic fields directly
      const directUpdates = { firstName, lastName, phone, address };

      if (needsApproval) {
        // Only companyName / certification go into pendingChanges
        const changes = { submittedAt: new Date() };
        if (companyName) changes.companyName = companyName;
        if (req.file)    changes.certificationUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
          req.user.id,
          { ...directUpdates, pendingChanges: changes },
          { new: true }
        ).select("-password");

        const admin = await User.findOne({ role: "admin" });
        if (admin) await Notification.create({
          recipient: admin._id, recipientRole: "admin",
          message: `Supplier ${user.firstName} ${user.lastName} submitted company/certification changes. Review and approve or reject.`,
          type: "new_supplier", relatedId: user._id,
        });
        return res.json({ ...user.toObject(), _pendingSubmitted: true });
      }

      // No company/cert change — apply everything directly
      const user = await User.findByIdAndUpdate(req.user.id, directUpdates, { new: true }).select("-password");
      return res.json(user);
    }

    // Customers & Admin — apply directly
    const updates = { firstName, lastName, phone, address };
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST admin approve/reject supplier profile changes
router.post("/profile-changes/:supplierId/:action", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const { supplierId, action } = req.params; // action: approve | reject
    const supplier = await User.findById(supplierId);
    if (!supplier || !supplier.pendingChanges?.submittedAt)
      return res.status(404).json({ message: "No pending changes found" });

    let update;
    if (action === "approve") {
      const c = supplier.pendingChanges;
      update = {
        companyName:      c.companyName      || supplier.companyName,
        certificationUrl: c.certificationUrl || supplier.certificationUrl,
        pendingChanges:   {},
      };
    } else {
      update = { pendingChanges: {} };
    }

    await User.findByIdAndUpdate(supplierId, update);

    await Notification.create({
      recipient: supplier._id, recipientRole: "supplier",
      message: action === "approve"
        ? "✅ Your profile changes have been approved by admin."
        : "❌ Your profile changes were rejected by admin.",
      type: action === "approve" ? "supplier_approved" : "supplier_rejected",
      relatedId: supplier._id,
    });

    res.json({ message: `Changes ${action}d` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST — admin sends warning to supplier
router.post("/warn/:userId", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Warning message is required." });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.warnings = user.warnings || [];
    user.warnings.push({ message: message.trim(), issuedAt: new Date() });
    await user.save();
    await Notification.create({
      recipient:     user._id,
      recipientRole: user.role,
      message:       `⚠️ Admin Warning: ${message.trim()}`,
      type:          "new_supplier",
      relatedId:     user._id,
    });
    res.json({ message: "Warning sent.", warnings: user.warnings });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE — admin removes a user from the system
router.delete("/remove/:userId", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot remove admin." });
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: `${user.firstName} ${user.lastName} removed from system.` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE own account
router.delete("/profile", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET admin stats
router.get("/stats", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const users = await User.find({ role: { $ne: "admin" } });
    const suppliers = users.filter(u => u.role === "supplier");
    const customers = users.filter(u => u.role === "customer");
    res.json({
      totalSuppliers:  suppliers.length,
      pendingSuppliers: suppliers.filter(s => s.status === "pending").length,
      approvedSuppliers: suppliers.filter(s => s.status === "approved").length,
      rejectedSuppliers: suppliers.filter(s => s.status === "rejected").length,
      totalCustomers:  customers.length,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
