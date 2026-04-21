"""
extract.py
----------
Reads orders from MongoDB and enriches each item with the exact
category, condition, parts from that supplier's inventory.

Unique product key: supplier_id + material_name + category + condition + parts
This ensures Neem Leaves and Neem Oil are treated as separate products.
"""
import pandas as pd
from db import get_db

_TO_KG = {
    "kg": 1, "g": 0.001, "gram": 0.001, "grams": 0.001,
    "lb": 0.453592, "lbs": 0.453592, "oz": 0.0283495,
    "ton": 1000, "tonne": 1000, "l": 1, "ml": 0.001, "bundles": 1,
}

def _to_standard(qty, unit):
    return qty * _TO_KG.get(str(unit).lower().strip(), 1)


def _build_meta(db):
    """
    Builds a lookup: (supplier_id, item_name_lower) -> list of inventory variants
    Each variant has its own category, condition, parts.
    When a supplier has multiple variants of the same material name,
    we match by unit to pick the right one.
    """
    # (supplier_id, name_lower) -> list of {category, condition, parts, unit, canonical}
    sup_variants = {}
    alias_map    = {}  # alias_lower -> canonical name

    for doc in db["inventories"].find(
        {}, {"supplierId":1,"name":1,"aliases":1,"category":1,"condition":1,"parts":1,"unit":1}
    ):
        canonical = doc["name"].strip()
        clow      = canonical.lower()
        sid       = str(doc["supplierId"])

        alias_map[clow] = canonical
        for a in doc.get("aliases", []):
            alias_map[a.lower().strip()] = canonical

        key = (sid, clow)
        if key not in sup_variants:
            sup_variants[key] = []
        sup_variants[key].append({
            "canonical": canonical,
            "category":  doc.get("category")  or "Raw Herb",
            "condition": doc.get("condition") or "Fresh",
            "parts":     doc.get("parts")     or "Whole",
            "unit":      doc.get("unit", "kg"),
        })

    return alias_map, sup_variants


def _pick_variant(variants, order_unit):
    """Pick the best matching variant by unit. Fall back to first."""
    if not variants:
        return {"category": "Raw Herb", "condition": "Fresh", "parts": "Whole"}
    if len(variants) == 1:
        return variants[0]
    # Match by unit
    unit_lower = str(order_unit).lower().strip()
    for v in variants:
        if v["unit"].lower().strip() == unit_lower:
            return v
    return variants[0]


def extract_data():
    db = get_db()
    alias_map, sup_variants = _build_meta(db)

    rows = []
    query = {"orderStatus": {"$in": ["Confirmed", "Processing", "Delivered"]}}
    for order in db["orders"].find(query, {"supplierId":1,"items":1,"createdAt":1}):
        sid   = str(order["supplierId"])
        month = order["createdAt"].strftime("%Y-%m")
        for item in order.get("items", []):
            raw_name  = str(item.get("name", "")).strip()
            canonical = alias_map.get(raw_name.lower(), raw_name)
            unit      = item.get("unit", "kg")
            variants  = sup_variants.get((sid, canonical.lower()), [])
            meta      = _pick_variant(variants, unit)
            qty       = _to_standard(item.get("supplyQty", 0), unit)

            rows.append({
                "supplier_id":   sid,
                "material_name": canonical,
                "category":      meta["category"],
                "condition":     meta["condition"],
                "parts":         meta["parts"],
                "month":         month,
                "quantity":      qty,
            })

    return pd.DataFrame(rows)
