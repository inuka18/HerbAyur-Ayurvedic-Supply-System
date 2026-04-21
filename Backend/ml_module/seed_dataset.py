"""
seed_dataset.py
---------------
Generates ~5000 synthetic monthly demand records specific to each supplier
and their actual inventory items in MongoDB.

Each record represents one supplier + one material + one month with:
  supplier_id, material_name, month, total_quantity, category,
  condition, parts, unit, lag_1, lag_2, lag_3, month_num, is_seed

Run once: python seed_dataset.py
"""
import random
from datetime import datetime, timezone, timedelta
from db import get_db

random.seed(42)

# Seasonal demand multipliers per month (Ayurvedic herbs)
SEASONAL = {
    1: 1.35, 2: 1.25, 3: 1.05, 4: 0.90, 5: 0.85,
    6: 1.10, 7: 1.15, 8: 1.10, 9: 0.95, 10: 1.00,
    11: 1.20, 12: 1.40,
}

# Base monthly demand (kg) per material — realistic Ayurvedic supply volumes
MATERIAL_BASE = {
    "Ginger":           {"kg": 180, "bundles": 60,  "ml": 50,  "L": 40},
    "Turmeric":         {"kg": 150, "bundles": 50,  "ml": 40,  "L": 30},
    "Neem":             {"kg": 120, "bundles": 80,  "ml": 30,  "L": 25},
    "Castor":           {"kg": 300, "bundles": 100, "ml": 200, "L": 150},
    "Bael Flower":      {"kg": 90,  "bundles": 40,  "ml": 20,  "L": 15},
    "White Sandalwood": {"kg": 60,  "bundles": 20,  "ml": 15,  "L": 10},
    "sarasparilla":     {"kg": 50,  "bundles": 35,  "ml": 10,  "L": 8},
    "Neem Oil":         {"kg": 40,  "bundles": 20,  "ml": 80,  "L": 60},
}

# Supplier scale factors — larger companies supply more
SUPPLIER_SCALE = {
    "69c7cd1e4b7516ed732818d5": 1.8,  # Herbal Lanka
    "69c7ee8eb3f8c64735cec9c7": 2.2,  # ayurvedaya
    "69c8a699658ac2b0ef69d89a": 1.5,  # Bashi Herb
    "69cb74352bea242f7ef66eb4": 1.2,  # nisal herb
    "69d0bc4c0810dd47855bb1dc": 1.0,  # Sithija
    "69d0dbfae1410fc50140c23f": 1.3,  # Hela Osu
    "69d0f2c4ba443c145ad8049f": 0.9,  # Sahan Herbal
    "69d1ec0dcb1b6f9092adbc3a": 1.1,  # Hela Osu Ragama
}


def rand_date_in_month(year, month):
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    delta = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, delta - 1))


def get_base_qty(material_name, unit):
    mat_bases = MATERIAL_BASE.get(material_name, {"kg": 80, "bundles": 40, "ml": 50, "L": 30})
    unit_lower = unit.lower()
    for key in mat_bases:
        if key in unit_lower:
            return mat_bases[key]
    return mat_bases.get("kg", 80)


def build_seed_orders(suppliers, inv_by_supplier, months):
    """Build synthetic orders covering ~5000 transaction rows."""
    orders = []
    for year, month in months:
        seasonal = SEASONAL[month]
        for sup in suppliers:
            sid = str(sup["_id"])
            mats = inv_by_supplier.get(sid, [])
            if not mats:
                continue
            scale = SUPPLIER_SCALE.get(sid, 1.0)
            # 4-7 orders per supplier per month for density
            for _ in range(random.randint(6, 10)):
                chosen = random.sample(mats, min(random.randint(2, 4), len(mats)))
                items = []
                for mat in chosen:
                    base = get_base_qty(mat["name"], mat["unit"])
                    qty  = round(base * scale * seasonal * random.gauss(1.0, 0.18), 2)
                    qty  = max(qty, 0.5)
                    items.append({
                        "name":      mat["name"],
                        "supplyQty": qty,
                        "unit":      mat["unit"],
                        "price":     mat["price"],
                    })
                total = sum(i["supplyQty"] * i["price"] for i in items)
                dt = rand_date_in_month(year, month)
                orders.append({
                    "supplierId":        sup["_id"],
                    "customerId":        sup["_id"],
                    "offerId":           sup["_id"],
                    "requestId":         sup["_id"],
                    "items":             items,
                    "totalAmount":       round(total, 2),
                    "paymentMethod":     random.choice(["Card", "Bank Transfer", "Cash on Delivery"]),
                    "paymentStatus":     "Paid",
                    "orderStatus":       random.choice(["Confirmed", "Processing", "Delivered"]),
                    "receiptNo":         f"SEED-{year}{month:02d}-{random.randint(100000,999999)}-{len(orders)}",
                    "listName":          "Seed Data",
                    "supplierName":      sup.get("companyName", ""),
                    "customerName":      "Seed Customer",
                    "customerConfirmed": True,
                    "createdAt":         dt,
                    "updatedAt":         dt,
                    "_isSeedData":       True,
                })
    return orders


def main():
    db = get_db()

    # Fetch approved suppliers
    suppliers = list(db["users"].find(
        {"role": "supplier", "status": "approved"},
        {"_id": 1, "companyName": 1, "firstName": 1}
    ))
    if not suppliers:
        print("No approved suppliers found.")
        return
    print(f"Found {len(suppliers)} suppliers")

    # Fetch inventory per supplier — deduplicated by name, exact values
    inv_by_supplier = {}
    for sup in suppliers:
        sid = str(sup["_id"])
        inv = list(db["inventories"].find(
            {"supplierId": sup["_id"]},
            {"name": 1, "unit": 1, "price": 1, "category": 1, "condition": 1, "parts": 1}
        ))
        # Keep ALL variants — do NOT deduplicate by name
        # Neem Leaves and Neem Oil are separate products
        mats = []
        for i in inv:
            mats.append({
                "name":      i["name"],
                "unit":      i.get("unit", "kg"),
                "price":     i.get("price", 10),
                "category":  i.get("category")  or "Raw Herb",
                "condition": i.get("condition") or "Fresh",
                "parts":     i.get("parts")     or "Whole",
            })
        if mats:
            inv_by_supplier[sid] = mats

    total_pairs = sum(len(v) for v in inv_by_supplier.values())
    print(f"Total supplier-material pairs: {total_pairs}")

    # Generate 36 months (3 years) ending at last month
    today = datetime.now(timezone.utc)
    months = []
    y, m = today.year - 3, today.month
    for _ in range(36):
        months.append((y, m))
        m += 1
        if m > 12:
            m = 1
            y += 1

    print(f"Generating seed data for {len(months)} months: "
          f"{months[0][0]}-{months[0][1]:02d} to {months[-1][0]}-{months[-1][1]:02d}")

    # Remove old seed data
    deleted = db["orders"].delete_many({"_isSeedData": True})
    print(f"Removed {deleted.deleted_count} old seed orders")

    # Insert new seed orders
    orders = build_seed_orders(suppliers, inv_by_supplier, months)
    if orders:
        db["orders"].insert_many(orders)
        print(f"Inserted {len(orders)} seed orders")

        # Count transaction rows (each order has multiple items)
        total_rows = sum(len(o["items"]) for o in orders)
        print(f"Total transaction rows (dataset records): {total_rows}")
    else:
        print("No orders generated.")

    print("\nDone. Run: python pipeline.py")


if __name__ == "__main__":
    main()
