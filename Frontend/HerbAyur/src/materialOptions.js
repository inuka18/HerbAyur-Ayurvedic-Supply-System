export const CATEGORIES = [
  "Roots", "Leaves", "Fruits", "Seeds", "Bark",
  "Flowers", "Whole Plant", "Oils", "Powders", "Prepared Medicine",
];

export const CONDITIONS = [
  "Fresh – Raw",
  "Fresh – Cleaned",
  "Fresh – Whole",
  "Dried – Sun Dried",
  "Dried – Shade Dried",
  "Dried – Oven Dried",
  "Powder",
  "Oil",
  "Paste",
  "Juice",
  "Decoction",
  "Extract",
  "Semi-Processed",
  "Processed",
  "Ready to Use",
];

export const PARTS = [
  "Root", "Leaf", "Stem", "Bark", "Flower",
  "Fruit", "Seed", "Whole Plant", "Latex / Sap",
];

export const ALL_UNITS = [
  "g", "kg", "mg",
  "ml", "L",
  "pieces", "bundles", "packets", "bottles",
  "handful", "teaspoon", "tablespoon", "pinch",
  "raththal",
];

// Rule 1: Oil → ml, L only
// Rule 2: Leaf → bundles, handful (suggested first, others still available)
// Rule 3: Powder → g, kg only
export function getUnits(condition, part) {
  if (condition === "Oil")    return ["ml", "L"];
  if (condition === "Powder") return ["g", "kg"];
  if (part === "Leaf")        return ["bundles", "handful", "g", "kg", "packets"];
  return ALL_UNITS;
}

export function isValidUnit(condition, part, unit) {
  return getUnits(condition, part).includes(unit);
}

export const DEFAULT_MATERIAL = {
  name: "", category: "Roots", quantity: "", unit: "g",
  condition: "Fresh – Raw", part: "Root",
};
