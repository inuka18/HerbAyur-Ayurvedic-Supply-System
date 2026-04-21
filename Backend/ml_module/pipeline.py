"""
pipeline.py — full ML pipeline orchestrator.

Usage:
  python pipeline.py              # train + predict + save
  python pipeline.py --predict    # predict only (reuse saved model)
  python pipeline.py --update     # run monthly update then retrain
"""
import sys
import pandas as pd
from extract        import extract_data
from aggregate      import aggregate_monthly
from features       import engineer_features
from train          import train_model
from predict        import predict_next_month, save_predictions


def run(predict_only=False, monthly_update=False):

    if monthly_update:
        print("[Step 0] Monthly update — importing real transactions")
        from monthly_update import run_monthly_update
        run_monthly_update()

    print("[Step 1] Extract data from MongoDB")
    raw = extract_data()
    print(f"  {len(raw)} transaction rows")

    print("[Step 2] Aggregate monthly demand")
    monthly = aggregate_monthly(raw)
    print(f"  {len(monthly)} supplier-material-month rows")
    print(f"  Month range: {monthly['month'].min()} -> {monthly['month'].max()}")
    print(f"  Suppliers: {monthly['supplier_id'].nunique()} | "
          f"Materials: {monthly['material_name'].nunique()}")

    print("[Step 3] Feature engineering")
    featured, _ = engineer_features(monthly, fit=not predict_only)
    featured["month_orig"] = monthly["month"]

    if not predict_only:
        print("[Step 4] Train model")
        _, metrics = train_model(featured)
        print(f"  Metrics: {metrics}")

    print("[Step 5] Predict next month demand")
    results, pred_month = predict_next_month(featured, monthly)

    print(f"[Step 6] Save predictions -> MongoDB")
    save_predictions(results)

    print(f"\nDone. Predictions saved for {pred_month}.")


if __name__ == "__main__":
    run(
        predict_only   = "--predict" in sys.argv,
        monthly_update = "--update"  in sys.argv,
    )
