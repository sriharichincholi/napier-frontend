import numpy as np
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def remove_outliers_iqr(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """Drops promotional glitches or outlier luxury fares using IQR filtering."""
    if len(df) < 4:
        return df
    
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    filtered_df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    dropped = len(df) - len(filtered_df)
    if dropped > 0:
        print(f"  [IQR Filter] Scrubbed {dropped} anomaly records.")
    return filtered_df

def calculate_jevons_index(current_prices: np.ndarray, base_prices: np.ndarray) -> float:
    """Computes Jevons Geometric Mean Index: Exp(Mean(Ln(Pt / P0))) * 100."""
    price_relatives = current_prices / base_prices
    geometric_mean = np.exp(np.mean(np.log(price_relatives)))
    return round(float(geometric_mean * 100.0), 4)

def run_napier_engine():
    print("🚀 [NAPIER Engine] Computing Jevons Index for latest scraped data...")
    
    response = supabase.table("raw_flight_prices").select("*").execute()
    data = response.data
    
    if not data:
        print("⚠️ No raw records found.")
        return

    df = pd.DataFrame(data)
    grouped = df.groupby(["route_code", "lead_time_days"])
    index_records = []
    
    for (route_code, lead_time), group in grouped:
        clean_group = remove_outliers_iqr(group, "base_fare")
        if clean_group.empty:
            continue

        base_fares = clean_group["base_fare"].to_numpy()
        total_fares = clean_group["total_fare"].to_numpy()
        
        benchmark_base_fare = 4000.0  # Base period benchmark fare (INR)
        base_array = np.full_like(base_fares, fill_value=benchmark_base_fare)
        
        jevons_val = calculate_jevons_index(base_fares, base_array)
        avg_base = round(float(np.mean(base_fares)), 2)
        avg_total = round(float(np.mean(total_fares)), 2)
        
        index_records.append({
            "calculation_date": datetime.now().strftime("%Y-%m-%d"),
            "route_code": route_code,
            "lead_time_days": int(lead_time),
            "sample_count": len(clean_group),
            "avg_base_fare": avg_base,
            "avg_total_fare": avg_total,
            "jevons_index_value": jevons_val,
            "mom_change_pct": round(((jevons_val - 100.0) / 100.0) * 100, 2)
        })

    if index_records:
        supabase.table("airfare_index_metrics").insert(index_records).execute()
        print(f"🎉 [NAPIER Engine] Calculated and uploaded {len(index_records)} index metric rows!")

if __name__ == "__main__":
    run_napier_engine()