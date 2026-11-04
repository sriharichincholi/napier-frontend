"""Computes the Jevons airfare index from archived `raw_flight_prices` and writes `airfare_index_metrics`."""
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from app.core.db import supabase_client

BENCHMARK_BASE_FARE = 4000.0  # base-period benchmark fare (INR)


def remove_outliers_iqr(df: pd.DataFrame, column: str) -> pd.DataFrame:
    if len(df) < 4:
        return df
    q1, q3 = df[column].quantile(0.25), df[column].quantile(0.75)
    iqr = q3 - q1
    return df[(df[column] >= q1 - 1.5 * iqr) & (df[column] <= q3 + 1.5 * iqr)]


def calculate_jevons_index(current_prices: np.ndarray, base_prices: np.ndarray) -> float:
    """Jevons geometric-mean index: exp(mean(ln(Pt / P0))) * 100."""
    return round(float(np.exp(np.mean(np.log(current_prices / base_prices))) * 100.0), 4)


def run_napier_engine() -> None:
    if supabase_client is None:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY must be set.")
    data = supabase_client.table("raw_flight_prices").select("*").execute().data
    if not data:
        print("No raw records found.")
        return

    df = pd.DataFrame(data)
    records = []
    for (route_code, lead), group in df.groupby(["route_code", "lead_time_days"]):
        clean = remove_outliers_iqr(group, "price")
        if clean.empty:
            continue
        prices = clean["price"].to_numpy(dtype=float)
        jevons = calculate_jevons_index(prices, np.full_like(prices, BENCHMARK_BASE_FARE))
        avg = round(float(np.mean(prices)), 2)
        records.append({
            "calculation_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "route_code": route_code,
            "lead_time_days": int(lead),
            "sample_count": len(clean),
            "avg_base_fare": avg,
            "avg_total_fare": avg,
            "jevons_index_value": jevons,
            "mom_change_pct": round((jevons - 100.0), 2),
        })

    if records:
        supabase_client.table("airfare_index_metrics").insert(records).execute()
        print(f"Uploaded {len(records)} index rows.")


if __name__ == "__main__":
    run_napier_engine()
