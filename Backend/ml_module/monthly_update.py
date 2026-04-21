"""
monthly_update.py
-----------------
Runs on the 25th of each month.

Billing period:
  Start : 25th of PREVIOUS month  00:00:00 UTC
  End   : 24th of CURRENT  month  23:59:59 UTC

  Example — runs on Jan 25:
    period = Dec 25 00:00  ->  Jan 24 23:59

What it does:
  1. Finds all REAL (non-seed) orders in the billing period
  2. Checks they are not already logged (prevents double-counting)
  3. Logs the period to ml_update_log so we know it was processed
  4. The pipeline then reads ALL orders (seed + real) and retrains

The real orders are already in the `orders` collection from normal
system usage — this script just validates and logs the update cycle.
"""
from datetime import datetime, timezone
from db import get_db


def get_billing_period(reference_date=None):
    """
    Returns (start, end) for the billing period.
    Jan 25 -> Dec 25 00:00 to Jan 24 23:59:59
    """
    today = reference_date or datetime.now(timezone.utc)
    end   = today.replace(day=24, hour=23, minute=59, second=59, microsecond=999999)
    if today.month == 1:
        start = today.replace(year=today.year - 1, month=12, day=25,
                              hour=0, minute=0, second=0, microsecond=0)
    else:
        start = today.replace(month=today.month - 1, day=25,
                              hour=0, minute=0, second=0, microsecond=0)
    return start, end


def run_monthly_update(reference_date=None):
    db    = get_db()
    start, end = get_billing_period(reference_date)

    period_label = f"{start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}"
    print(f"[Monthly Update] Billing period: {period_label}")

    # Check if this period was already processed
    already_done = db["ml_update_log"].find_one({"period_label": period_label})
    if already_done:
        print(f"[Monthly Update] Period {period_label} already processed on "
              f"{already_done['processed_at'].strftime('%Y-%m-%d %H:%M')} UTC. Skipping.")
        return True

    # Count real orders in this period
    real_orders = list(db["orders"].find({
        "createdAt":   {"$gte": start, "$lte": end},
        "_isSeedData": {"$ne": True},
        "orderStatus": {"$in": ["Confirmed", "Processing", "Delivered"]},
    }, {"supplierId": 1, "items": 1, "createdAt": 1}))

    total_rows = sum(len(o.get("items", [])) for o in real_orders)

    print(f"[Monthly Update] Real orders found : {len(real_orders)}")
    print(f"[Monthly Update] Transaction rows  : {total_rows}")

    # Log this update cycle
    db["ml_update_log"].insert_one({
        "period_label":  period_label,
        "period_start":  start,
        "period_end":    end,
        "orders_found":  len(real_orders),
        "rows_found":    total_rows,
        "processed_at":  datetime.now(timezone.utc),
    })

    print(f"[Monthly Update] Logged. Pipeline will now retrain on all {total_rows} new rows.")
    return True


if __name__ == "__main__":
    run_monthly_update()
