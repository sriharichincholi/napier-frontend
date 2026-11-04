from fastapi import APIRouter, HTTPException, Query

from app.core.db import supabase_client
from app.data.airports import city_of, resolve_route, search_airports

router = APIRouter()


@router.get("/resolve")
def resolve(q: str = Query(..., min_length=3, description="'Delhi to Mumbai', 'DEL-BOM', ...")):
    pair = resolve_route(q)
    if not pair:
        raise HTTPException(status_code=404, detail=f"Could not understand route '{q}'. Try 'Delhi to Mumbai' or 'DEL-BOM'.")
    o, d = pair
    return {"origin": o, "destination": d, "origin_city": city_of(o), "destination_city": city_of(d)}


@router.get("/airports")
def airports(q: str = Query(..., min_length=1)):
    return {"results": search_airports(q)}


@router.get("/index-trends")
def index_trends(route: str = Query(..., pattern=r"^[A-Za-z]{3}-[A-Za-z]{3}$"), lead_time: int = Query(..., ge=1, le=365)):
    """Archived Jevons index rows from Supabase. Empty list when nothing has been collected yet."""
    if supabase_client is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured on the backend.")
    try:
        rows = (
            supabase_client.table("airfare_index_metrics")
            .select("*")
            .eq("route_code", route.upper())
            .eq("lead_time_days", lead_time)
            .order("calculation_date", desc=False)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Database query failed: {exc}")
    return {"route": route.upper(), "lead_time_days": lead_time, "total_datapoints": len(rows), "data": rows}
