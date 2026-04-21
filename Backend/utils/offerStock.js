const Inventory = require("../models/Inventory");

const normalize = (s = "") => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");

function convertQuantity(value, fromUnit, toUnit) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!fromUnit || !toUnit) return null;
  if (fromUnit === toUnit) return amount;

  const factors = {
    kg: 1000,
    g: 1,
    mg: 0.001,
    L: 1000,
    ml: 1,
  };

  const sameFamily =
    (["kg", "g", "mg"].includes(fromUnit) && ["kg", "g", "mg"].includes(toUnit)) ||
    (["L", "ml"].includes(fromUnit) && ["L", "ml"].includes(toUnit));
  if (!sameFamily) return null;

  return (amount * factors[fromUnit]) / factors[toUnit];
}

async function reserveInventoryForItems(supplierId, items) {
  const adjustments = [];
  try {
    const reservedItems = [];

    for (const item of items) {
      if (!item.inventoryId) throw new Error(`Please select inventory for "${item.name}".`);

      const inventory = await Inventory.findOne({ _id: item.inventoryId, supplierId });
      if (!inventory) throw new Error(`Inventory item not found for "${item.name}".`);

      const reserveQty = convertQuantity(item.supplyQty, item.unit, inventory.unit);
      if (!reserveQty || reserveQty <= 0) {
        throw new Error(`Invalid quantity/unit for "${item.name}".`);
      }

      const updated = await Inventory.findOneAndUpdate(
        { _id: inventory._id, supplierId, quantity: { $gte: reserveQty } },
        { $inc: { quantity: -reserveQty } },
        { new: true }
      );
      if (!updated) {
        throw new Error(`Not enough stock for "${item.name}" in inventory.`);
      }

      adjustments.push({ inventoryId: inventory._id, qty: reserveQty });
      reservedItems.push({
        ...item,
        inventoryId: inventory._id,
        reservedQty: reserveQty,
        reservedUnit: inventory.unit,
      });
    }

    return reservedItems;
  } catch (err) {
    for (const adj of adjustments) {
      await Inventory.findOneAndUpdate(
        { _id: adj.inventoryId, supplierId },
        { $inc: { quantity: adj.qty } }
      );
    }
    throw err;
  }
}

async function restoreInventoryForItems(supplierId, items) {
  for (const item of items || []) {
    const reservedQty = Number(item.reservedQty);

    if (item.inventoryId && Number.isFinite(reservedQty) && reservedQty > 0) {
      await Inventory.findOneAndUpdate(
        { _id: item.inventoryId, supplierId },
        { $inc: { quantity: reservedQty } }
      );
      continue;
    }

    // Legacy fallback for older offers that don't have reservation metadata.
    const inventory = await Inventory.find({ supplierId });
    const matched = inventory.find((inv) =>
      normalize(inv.name) === normalize(item.name) ||
      (inv.aliases || []).some((a) => normalize(a) === normalize(item.name))
    );
    if (!matched) continue;

    const qty = convertQuantity(item.supplyQty, item.unit, matched.unit);
    if (!qty || qty <= 0) continue;
    await Inventory.findOneAndUpdate(
      { _id: matched._id, supplierId },
      { $inc: { quantity: qty } }
    );
  }
}

async function releaseOfferReservation(offer) {
  if (!offer || !offer.stockReserved || offer.stockReleased) return false;
  await restoreInventoryForItems(offer.supplierId, offer.items || []);
  offer.stockReleased = true;
  await offer.save();
  return true;
}

module.exports = {
  reserveInventoryForItems,
  restoreInventoryForItems,
  releaseOfferReservation,
};
