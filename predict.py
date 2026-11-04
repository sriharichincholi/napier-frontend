import re

from fastapi import APIRouter, HTTPException, Path, Query

from app.ml.forecaster import forecaster
from app.scrapers.parse import build_google_flights_url
from app.scrapers.serpapi import fetch_live_quotes

router = APIRouter()
IATA = r"^[A-Za-z]{3}$"


def _check_date(value: str | None) -> str | None:
    if value and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise HTTPException(status_code=422, detail="date must be YYYY-MM-DD")
    return value


@router.get("/predict/{origin}/{destination}")
async def get_price_prediction(
    origin: str = Path(pattern=IATA),
    destination: str = Path(pattern=IATA),
    date: str | None = Query(None, description="Departure date, YYYY-MM-DD (default: today + 14 days)"),
):
    """Live one-way fares for the route + a holiday-demand projection anchored on the cheapest live fare."""
    if origin.upper() == destination.upper():
        raise HTTPException(status_code=422, detail="origin and destination must differ")
    try:
        quotes, dep_date = await fetch_live_quotes(origin, destination, _check_date(date))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    result = forecaster.predict_route_fare(origin, destination, current_live_base=min(q["price"] for q in quotes))
    result["live_carrier_quotes"] = quotes
    result["departure_date"] = dep_date
    result["google_flights_url"] = build_google_flights_url(origin, destination, dep_date)
    return result
