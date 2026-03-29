const router    = require("express").Router();
const Inventory = require("../models/Inventory");
const auth      = require("../middleware/auth");

/* ── helpers ── */

// Normalize string: lowercase, trim, remove special chars
const normalize = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");

// Simple character-level similarity (Dice coefficient)
function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) bigrams.add(str.slice(i, i + 2));
    return bigrams;
  };
  const aB = getBigrams(a), bB = getBigrams(b);
  let intersection = 0;
  aB.forEach(bg => { if (bB.has(bg)) intersection++; });
  return (2 * intersection) / (aB.size + bB.size);
}

// Match a requested material name against supplier inventory
function findMatch(requestedName, inventoryItems) {
  let best = null, bestScore = 0;
  for (const item of inventoryItems) {
    const namesToCheck = [item.name, ...item.aliases];
    for (const candidate of namesToCheck) {
      const score = similarity(requestedName, candidate);
      if (score > bestScore) { bestScore = score; best = item; }
    }
  }
  // threshold: 0.4 = reasonable fuzzy match
  return bestScore >= 0.4 ? { item: best, score: bestScore } : null;
}

/* ── routes ── */

// GET supplier's own inventory
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Forbidden" });
  const items = await Inventory.find({ supplierId: req.user.id }).sort({ name: 1 });
  res.json(items);
});

// POST add inventory item
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Forbidden" });
  try {
    const { name, quantity, unit, aliases } = req.body;
    const item = await Inventory.create({
      supplierId: req.user.id, name, quantity, unit,
      aliases: aliases || [],
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH update / restock item
router.patch("/:id", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Forbidden" });
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, supplierId: req.user.id },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE inventory item
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Forbidden" });
  await Inventory.findOneAndDelete({ _id: req.params.id, supplierId: req.user.id });
  res.json({ message: "Deleted" });
});

// POST AI match — given a list of requested material names, return matched inventory items
router.post("/match", auth, async (req, res) => {
  if (req.user.role !== "supplier") return res.status(403).json({ message: "Forbidden" });
  try {
    const { materialNames } = req.body; // string[]
    const inventory = await Inventory.find({ supplierId: req.user.id });
    const results = {};
    for (const name of materialNames) {
      const match = findMatch(name, inventory);
      results[name] = match
        ? { inventoryId: match.item._id, inventoryName: match.item.name, quantity: match.item.quantity, unit: match.item.unit, price: match.item.price || 0, score: match.score }
        : null;
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
