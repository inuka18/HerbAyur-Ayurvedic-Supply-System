"""
train.py — XGBoost model training with time-based split.
"""
import os, pickle
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from features import FEATURE_COLS, TARGET_COL

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "model.pkl")
MODEL_VERSION = "v1.0"


def train_model(df: pd.DataFrame):
    months = sorted(df["month_orig"].unique())
    n      = len(months)
    if n < 2:
        raise ValueError("Need at least 2 months of data.")

    test_size = 1 if n < 4 else 3
    cutoff    = months[-test_size]
    train     = df[df["month_orig"] <  cutoff]
    test      = df[df["month_orig"] >= cutoff]
    if train.empty:
        train = test = df

    X_tr, y_tr = train[FEATURE_COLS], train[TARGET_COL]
    X_te, y_te = test[FEATURE_COLS],  test[TARGET_COL]

    print(f"  Train: {len(train)} rows | Test: {len(test)} rows")

    model = XGBRegressor(
        n_estimators=500, learning_rate=0.03, max_depth=5,
        min_child_weight=3, subsample=0.8, colsample_bytree=0.8,
        gamma=0.1, reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, n_jobs=-1,
        early_stopping_rounds=30, eval_metric="rmse",
    )
    model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    preds = np.clip(model.predict(X_te), 0, None)
    mae   = mean_absolute_error(y_te, preds)
    rmse  = root_mean_squared_error(y_te, preds)
    mask  = y_te > 0
    mape  = np.mean(np.abs((y_te[mask] - preds[mask]) / y_te[mask])) * 100 if mask.any() else 0
    print(f"  MAE={mae:.2f} | RMSE={rmse:.2f} | MAPE={mape:.1f}%")
    return model, {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "MAPE": round(mape, 1)}


def load_model():
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)
