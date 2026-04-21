export const CATEGORIES = [
  "Raw Herb",
  "Dried Herb",
  "Powder",
  "Oil",
  "Extract",
  "Paste",
  "Juice",
  "Capsule",
  "Tablet",
  "Syrup",
  "Decoction",
];

export const CONDITIONS = [
  "Fresh",
  "Cleaned",
  "Whole",
  "Cut / Sliced",
  "Crushed",
  "Dried – Sun Dried",
  "Dried – Shade Dried",
  "Dried – Oven Dried",
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

export const CATEGORY_UNITS = {
  "Raw Herb": ["kg", "g", "bundles", "pieces", "raththal"],
  "Dried Herb": ["kg", "g", "bundles", "pieces", "packets", "raththal"],
  Powder: ["kg", "g", "mg", "packets"],
  Oil: ["L", "ml", "bottles"],
  Extract: ["L", "ml", "kg", "g", "bottles"],
  Paste: ["kg", "g", "packets", "bottles"],
  Juice: ["L", "ml", "bottles"],
  Capsule: ["pieces", "packets", "bottles"],
  Tablet: ["pieces", "packets", "bottles"],
  Syrup: ["L", "ml", "bottles"],
  Decoction: ["L", "ml", "bottles"],
};

const LEGACY_CATEGORY_MAP = {
  Roots: "Raw Herb",
  Leaves: "Raw Herb",
  Fruits: "Raw Herb",
  Seeds: "Raw Herb",
  Bark: "Raw Herb",
  Flowers: "Raw Herb",
  "Whole Plant": "Raw Herb",
  Oils: "Oil",
  Powders: "Powder",
  "Prepared Medicine": "Extract",
};

const LEGACY_CONDITION_MAP = {
  "Fresh – Raw": "Fresh",
  "Fresh – Cleaned": "Cleaned",
  "Fresh – Whole": "Whole",
};

export function normalizeCategory(category) {
  if (CATEGORIES.includes(category)) return category;
  return LEGACY_CATEGORY_MAP[category] || "Raw Herb";
}

export function normalizeCondition(condition) {
  if (CONDITIONS.includes(condition)) return condition;
  return LEGACY_CONDITION_MAP[condition] || "Fresh";
}

export function normalizePart(part) {
  if (PARTS.includes(part)) return part;
  return "Root";
}

export function getUnits(category) {
  return CATEGORY_UNITS[normalizeCategory(category)] || ALL_UNITS;
}

export function isValidUnit(category, unit) {
  return getUnits(category).includes(unit);
}

export const DEFAULT_MATERIAL = {
  name: "", category: "Raw Herb", quantity: "", unit: "kg",
  condition: "Fresh", part: "Root",
};
