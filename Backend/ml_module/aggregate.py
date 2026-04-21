"""
aggregate.py
------------
Aggregates monthly demand per unique product:
  supplier_id + material_name + category + condition + parts + month

This ensures Neem Leaves and Neem Oil are separate rows.
Missing months are filled with 0 per unique product.
"""
import pandas as pd

# The 5 columns that define a unique product
PRODUCT_KEY = ["supplier_id", "material_name", "category", "condition", "parts"]


def aggregate_monthly(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    # Sum quantity per unique product per month
    grp = (
        df.groupby(PRODUCT_KEY + ["month"])["quantity"]
        .sum()
        .reset_index()
        .rename(columns={"quantity": "total_quantity"})
    )

    # Build full contiguous month range for every unique product
    all_months  = pd.period_range(grp["month"].min(), grp["month"].max(), freq="M")
    month_strs  = pd.DataFrame({"month": all_months.strftime("%Y-%m")})
    unique_keys = grp[PRODUCT_KEY].drop_duplicates()

    # Cross join: every product x every month
    full_index = unique_keys.merge(month_strs, how="cross")

    # Left join actual quantities — missing months become 0
    merged = full_index.merge(
        grp[PRODUCT_KEY + ["month", "total_quantity"]],
        on=PRODUCT_KEY + ["month"],
        how="left",
    ).fillna({"total_quantity": 0})

    merged["total_quantity"] = merged["total_quantity"].astype(float)
    return merged.sort_values(PRODUCT_KEY + ["month"]).reset_index(drop=True)
