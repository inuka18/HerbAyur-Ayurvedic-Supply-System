"""
features.py
-----------
Feature engineering:
  - lag_1, lag_2, lag_3  : previous 1/2/3 months demand for same product
  - month_num            : 1-12 for seasonality

Lag grouping uses the full product key:
  supplier_id + material_name + category + condition + parts
So Neem Leaves and Neem Oil each get their own independent lag history.
"""
import pandas as pd
from sklearn.preprocessing import LabelEncoder
import pickle, os

ENCODER_PATH = os.path.join(os.path.dirname(__file__), "encoders.pkl")

CAT_COLS     = ["supplier_id", "material_name", "category", "condition", "parts"]
FEATURE_COLS = CAT_COLS + ["month_num", "lag_1", "lag_2", "lag_3"]
TARGET_COL   = "total_quantity"

# Full product key for grouping lags
PRODUCT_KEY  = ["supplier_id", "material_name", "category", "condition", "parts"]


def engineer_features(df: pd.DataFrame, fit: bool = True):
    df = df.copy().sort_values(PRODUCT_KEY + ["month"])
    df["month_num"] = pd.to_datetime(df["month"]).dt.month

    # Lag features — grouped by full product key so each variant is independent
    for lag in [1, 2, 3]:
        df[f"lag_{lag}"] = (
            df.groupby(PRODUCT_KEY)["total_quantity"]
            .shift(lag)
            .fillna(0)
        )

    # Label encode categoricals
    if fit:
        encoders = {c: LabelEncoder().fit(df[c].astype(str)) for c in CAT_COLS}
        with open(ENCODER_PATH, "wb") as f:
            pickle.dump(encoders, f)
    else:
        with open(ENCODER_PATH, "rb") as f:
            encoders = pickle.load(f)
        for c in CAT_COLS:
            le = encoders[c]
            df[c] = df[c].astype(str).apply(
                lambda v: v if v in le.classes_ else le.classes_[0]
            )

    for c in CAT_COLS:
        df[c] = encoders[c].transform(df[c].astype(str))

    return df, encoders
