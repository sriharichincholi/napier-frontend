"""Live one-way fares from SerpApi's Google Flights engine, cached 30-60 min. No synthetic fallback."""
from datetime import date as date_cls, datetime, timedelta, timezone

import httpx

from app.core.cache import fare_cache
from app.core.config import settings
from app.scrapers.parse import parse_serpapi_flights

SERPAPI_URL = "https://serpapi.com/search.json"


class LiveDataUnavailable(Exception):
    """Raised when real fares cannot be obtained. Callers surface this; they never invent prices."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def default_departure_date() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d")


def validate_departure_date(value: str | None) -> str:
    if not value:
        return default_departure_date()
    try:
        parsed = date_cls.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("date must be YYYY-MM-DD") from exc
    if parsed < datetime.now(timezone.utc).date():
        raise ValueError("date is in the past")
    return value


async def fetch_live_quotes(origin: str, destination: str, departure_date: str | None = None) -> tuple[list[dict], str]:
    """Return (carrier quotes, departure_date). Raises LiveDataUnavailable if no real data."""
    origin, destination = origin.upper(), destination.upper()
    departure_date = validate_departure_date(departure_date)
    key = f"fares:{origin}-{destination}:{departure_date}"

    cached = await fare_cache.get(key)
    if cached:
        return cached, departure_date

    if not settings.SERPAPI_KEY:
        raise LiveDataUnavailable("SERPAPI_KEY is not configured on the backend.")

    params = {
        "engine": "google_flights",
        "departure_id": origin,
        "arrival_id": destination,
        "outbound_date": departure_date,
        "type": "2",  # SerpApi: 1 = round trip, 2 = one way
        "currency": "INR",
        "hl": "en",
        "api_key": settings.SERPAPI_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(SERPAPI_URL, params=params)
    except httpx.HTTPError as exc:
        raise LiveDataUnavailable(f"SerpApi request failed: {exc.__class__.__name__}") from exc

    if resp.status_code != 200:
        raise LiveDataUnavailable(f"SerpApi returned HTTP {resp.status_code}.")
    payload = resp.json()
    if payload.get("error"):
        raise LiveDataUnavailable(f"SerpApi: {payload['error']}")

    quotes = parse_serpapi_flights(payload, origin, destination, departure_date)
    if not quotes:
        raise LiveDataUnavailable(f"No flights found for {origin} → {destination} on {departure_date}.")

    await fare_cache.set(key, quotes)
    return quotes, departure_date
