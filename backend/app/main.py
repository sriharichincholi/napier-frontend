from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import predict, assistant
from app.core.config import settings
from app.core.db import supabase_client

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="National Airfare Price Index Engine Real-time API & Forecasting Engine",
    version="2.0.0"
)

# Enable CORS for frontend dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API Routers
app.include_router(predict.router, prefix="/api/v1", tags=["ML Predictions"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["AI Assistant"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "engine": "NAPIER Airfare Price Index & AI Engine v2.0",
        "docs": "/docs"
    }

@app.get("/api/v1/index-trends")
def get_index_trends(
    route: str = Query("DEL-BOM", description="City-pair route code, e.g., DEL-BOM, DEL-BLR"),
    lead_time: int = Query(14, description="Advance purchase lead window in days (1, 7, 15, 30, 45)")
):
    """Fetches historical and real-time Jevons Index trend data for charts."""
    if not supabase_client:
        return {
            "route": route,
            "lead_time_days": lead_time,
            "total_datapoints": 0,
            "data": []
        }
    try:
        response = (
            supabase_client.table("airfare_index_metrics")
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
