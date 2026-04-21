"""
export_dataset.py
-----------------
Exports two versions of the dataset:

  --raw        : Raw transaction rows straight from MongoDB orders collection
                 (5,449 rows — one row per item per order)

  --processed  : Aggregated + feature-engineered dataset used to train the model
                 (1,036 rows — one row per supplier+material+month)

Default (no flag) = raw
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
from db      import get_db
from extract import extract_data
from aggregate import aggregate_monthly


def export_raw():
    """Raw transaction rows from MongoDB — before any processing."""
    db = get_db()

    rows = []
    query = {"orderStatus": {"$in": ["Confirmed", "Processing", "Delivered"]}}
    for order in db["orders"].find(query, {"supplierId":1,"items":1,"createdAt":1,"orderStatus":1}):
        for item in order.get("items", []):
            rows.append({
                "order_id":      str(order["_id"]),
                "supplier_id":   str(order["supplierId"]),
                "material_name": item.get("name", ""),
                "quantity":      item.get("supplyQty", 0),
                "unit":          item.get("unit", ""),
                "price":         item.get("price", 0),
                "order_date":    order["createdAt"].strftime("%Y-%m-%d"),
                "month":         order["createdAt"].strftime("%Y-%m"),
                "order_status":  order.get("orderStatus", ""),
            })

    df = pd.DataFrame(rows).sort_values(["supplier_id", "material_name", "order_date"])
    print(df.to_csv(index=False))


def export_processed():
    """Aggregated + feature-engineered dataset used to train the model."""
    raw     = extract_data()
    monthly = aggregate_monthly(raw)
    monthly = monthly.sort_values(
        ["supplier_id", "material_name", "category", "condition", "parts", "month"]
    ).reset_index(drop=True)

    monthly["month_num"] = pd.to_datetime(monthly["month"]).dt.month
    for lag in [1, 2, 3]:
        monthly[f"lag_{lag}"] = (
            monthly.groupby(["supplier_id", "material_name", "category", "condition", "parts"])
            ["total_quantity"].shift(lag).fillna(0)
        )

    cols = [
        "supplier_id", "material_name", "month", "total_quantity",
        "category", "condition", "parts",
        "lag_1", "lag_2", "lag_3", "month_num"
    ]
    print(monthly[cols].to_csv(index=False))


if __name__ == "__main__":
    if "--processed" in sys.argv:
        export_processed()
    else:
        export_raw()
