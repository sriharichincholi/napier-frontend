import numpy as np
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
import random
from dotenv import load_dotenv

# Load secret keys from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ROUTES = ["DEL-BOM", "BLR-DEL", "HYD-BOM"]
LEAD_TIMES = [3, 14, 30]

def generate_historical_seed():
    print("⏳ [NAPIER Seed] Generating 180 days of historical airfare index data...")
    
    end_date = datetime.now()
    records = []
    
    for day in range(180, 0, -1):
        calc_date = (end_date - timedelta(days=day)).strftime("%Y-%m-%d")
        seasonal_factor = 1.0 + (0.05 * np.sin(day / 15))
        
        for route in ROUTES:
            for lead in LEAD_TIMES:
                lead_multiplier = 1.35 if lead == 3 else (1.1 if lead == 14 else 1.0)
                
                base_fare = round(4000.0 * seasonal_factor * lead_multiplier + random.uniform(-150, 150), 2)
                tax_fee = round(base_fare * 0.15, 2)
                total_fare = base_fare + tax_fee
                
                jevons_val = round((base_fare / 4000.0) * 100.0, 4)
                mom_change = round(((jevons_val - 100.0) / 100.0) * 100, 2)
                
                record = {
                    "calculation_date": calc_date,
                    "route_code": route,
                    "lead_time_days": lead,
                    "sample_count": random.randint(15, 25),
                    "avg_base_fare": base_fare,
                    "avg_total_fare": total_fare,
                    "jevons_index_value": jevons_val,
                    "mom_change_pct": mom_change
                }
                records.append(record)
                
    # Insert records into Supabase
    chunk_size = 500
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        supabase.table("airfare_index_metrics").insert(chunk).execute()
        print(f"  Inserted chunk {i // chunk_size + 1} / {(len(records) - 1) // chunk_size + 1}")

    print("\n🎉 [NAPIER Seed] Success! 6 months of historical data inserted!")

if __name__ == "__main__":
    generate_historical_seed()