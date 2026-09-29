from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL or SUPABASE_KEY environment variable missing!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(
    title="NAPIER API",
    description="National Airfare Price Index Engine Real-time API",
    version="1.0.0"
)

# Enable CORS for frontend dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "engine": "NAPIER Jevons Airfare Index API v1.0"}

@app.get("/api/v1/index-trends")
def get_index_trends(
    route: str = Query("DEL-BOM", description="City-pair route code, e.g., DEL-BOM, DEL-BLR"),
    lead_time: int = Query(14, description="Advance purchase lead window in days (1, 7, 15, 30, 45)")
):
    """Fetches historical and real-time Jevons Index trend data for charts."""
    try:
        response = (
            supabase.table("airfare_index_metrics")
            .select("*")
            .eq("route_code", route)
            .eq("lead_time_days", lead_time)
            .order("calculation_date", desc=False)
            .execute()
        )
        
        data = response.data if response.data else []
        
        return {
            "route": route,
            "lead_time_days": lead_time,
            "total_datapoints": len(data),
            "data": data
        }
    except Exception as e:
        return {
            "route": route,
            "lead_time_days": lead_time,
            "total_datapoints": 0,
            "data": [],
            "error": str(e)
        }

@app.get("/api/v1/latest-summary")
def get_latest_summary():
    """Fetches latest snapshot of index values across all routes."""
    try:
        response = (
            supabase.table("airfare_index_metrics")
            .select("*")
            .order("created_at", desc=True)
            .limit(9)
            .execute()
        )
        return {"snapshot": response.data or []}
    except Exception as e:
        return {"snapshot": [], "error": str(e)}