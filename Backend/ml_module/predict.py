"""
predict.py
----------
Predicts next month demand for every unique product:
  supplier_id + material_name + category + condition + parts

Each variant (e.g. Neem Leaves vs Neem Oil) gets its own prediction.
"""
import pickle, os
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from db import get_db
from features import FEATURE_COLS, CAT_COLS, ENCODER_PATH, PRODUCT_KEY
from train import MODEL_PATH, MODEL_VERSION


def predict_next_month(df_featured: pd.DataFrame, df_monthly: pd.DataFrame):
    with open(MODEL_PATH,   "rb") as f: model    = pickle.load(f)
    with open(ENCODER_PATH, "rb") as f: encoders = pickle.load(f)

    def decode(col, series):
        return encoders[col].inverse_transform(series.astype(int))

    # Latest row per unique product
    latest = (
        df_featured.sort_values("month_orig")
        .groupby(PRODUCT_KEY, sort=False)
        .last()
        .reset_index()
    )

    # Get unit from inventory per supplier+material+variant
    db = get_db()
    unit_map = {}
    for doc in db["inventories"].find({}, {"supplierId":1,"name":1,"unit":1,"category":1,"condition":1,"parts":1}):
        sid  = str(doc["supplierId"])
        name = doc["name"]
        cat  = doc.get("category") or ""
        cond = doc.get("condition") or ""
        part = doc.get("parts") or ""
        unit = doc.get("unit", "kg")
        # Store with full key
        unit_map[(sid, name, cat, cond, part)] = unit
        # Also store fallback keys (less specific)
        unit_map.setdefault((sid, name, cat, "", ""), unit)
        unit_map.setdefault((sid, name, "", "", ""), unit)
        unit_map.setdefault((name, cat, cond, part), unit)
        unit_map.setdefault((name, cat, "", ""), unit)
        unit_map.setdefault((name, "", "", ""), unit)

    # Next calendar month from today
    today         = datetime.now(timezone.utc)
    next_month_dt = today.replace(day=1) + pd.DateOffset(months=1)
    next_month    = next_month_dt.strftime("%Y-%m")

    # Shift lags forward by 1 month
    pred_df = latest.copy()
    pred_df["lag_3"]     = pred_df["lag_2"]
    pred_df["lag_2"]     = pred_df["lag_1"]
    pred_df["lag_1"]     = pred_df["total_quantity"]
    pred_df["month_num"] = next_month_dt.month

    preds = np.clip(model.predict(pred_df[FEATURE_COLS]), 0, None)

    results = pd.DataFrame({
        "supplier_id":        decode("supplier_id",   pred_df["supplier_id"]),
        "material_name":      decode("material_name", pred_df["material_name"]),
        "category":           decode("category",      pred_df["category"]),
        "condition":          decode("condition",     pred_df["condition"]),
        "parts":              decode("parts",         pred_df["parts"]),
        "prediction_month":   next_month,
        "predicted_quantity": np.round(preds, 2),
        "model_version":      MODEL_VERSION,
    })

    # Attach unit from inventory using best matching key
    def get_unit(row):
        sid  = row["supplier_id"]
        name = row["material_name"]
        cat  = row["category"]
        cond = row["condition"]
        part = row["parts"]
        return (
            unit_map.get((sid, name, cat, cond, part)) or
            unit_map.get((sid, name, cat, "", "")) or
            unit_map.get((sid, name, "", "", "")) or
            unit_map.get((name, cat, cond, part)) or
            unit_map.get((name, cat, "", "")) or
            unit_map.get((name, "", "", "")) or
            "kg"
        )
    results["unit"] = results.apply(get_unit, axis=1)

    return results, next_month


def save_predictions(results: pd.DataFrame):
    db  = get_db()
    col = db["predictions"]
    now = datetime.now(timezone.utc)

    docs = [{
        "supplier_id":        r["supplier_id"],
        "material_name":      r["material_name"],
        "category":           r["category"],
        "condition":          r["condition"],
        "parts":              r["parts"],
        "unit":               r.get("unit", "kg"),
        "prediction_month":   r["prediction_month"],
        "predicted_quantity": float(r["predicted_quantity"]),
        "model_version":      r["model_version"],
        "created_at":         now,
    } for _, r in results.iterrows()]

    if docs:
        col.delete_many({"prediction_month": docs[0]["prediction_month"]})
        col.insert_many(docs)
        print(f"  Saved {len(docs)} predictions for {docs[0]['prediction_month']}")
