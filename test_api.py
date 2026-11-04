from fastapi.testclient import TestClient

from app.main import app
from app.scrapers.serpapi import LiveDataUnavailable

client = TestClient(app)

QUOTES = [
    {"name": "IndiGo", "code": "6E", "price": 5100, "stops": 0, "duration_min": 135,
     "departure_time": None, "arrival_time": None, "booking_url": "https://www.google.com/travel/flights?q=x&tt=o"},
    {"name": "Air India", "code": "AI", "price": 5600, "stops": 0, "duration_min": 140,
     "departure_time": None, "arrival_time": None, "booking_url": "https://www.google.com/travel/flights?q=y&tt=o"},
]


def _patch(monkeypatch, result):
    async def fake(origin, destination, date=None):
        if isinstance(result, Exception):
            raise result
        return result, "2026-11-20"

    # patched at the call sites (they import the name directly)
    for module in ("app.api.v1.predict", "app.api.v1.assistant"):
        monkeypatch.setattr(f"{module}.fetch_live_quotes", fake)


def test_predict_uses_cheapest_live_fare(monkeypatch):
    _patch(monkeypatch, QUOTES)
    body = client.get("/api/v1/predict/DEL/BOM").json()
    assert body["base_fare"] == 5100
    assert [q["name"] for q in body["live_carrier_quotes"]] == ["IndiGo", "Air India"]
    assert "tt=o" in body["google_flights_url"]


def test_predict_503_without_live_data_never_synthesises(monkeypatch):
    _patch(monkeypatch, LiveDataUnavailable("no key"))
    r = client.get("/api/v1/predict/DEL/BOM")
    assert r.status_code == 503
    assert r.json()["detail"]["code"] == "LIVE_DATA_UNAVAILABLE"


def test_predict_validates_input():
    assert client.get("/api/v1/predict/DEL/DEL").status_code == 422
    assert client.get("/api/v1/predict/DELHI/BOM").status_code == 422


def test_resolve_endpoint():
    assert client.get("/api/v1/resolve", params={"q": "Delhi to Mumbai"}).json()["origin"] == "DEL"
    assert client.get("/api/v1/resolve", params={"q": "zzz to qqq"}).status_code == 404


def test_index_trends_requires_explicit_route():
    assert client.get("/api/v1/index-trends").status_code == 422


def test_chat_cheapest(monkeypatch):
    _patch(monkeypatch, QUOTES)
    body = client.post("/api/v1/assistant/chat", json={"message": "cheapest airline?", "origin": "DEL", "destination": "BOM"}).json()
    assert body["status_badge"] == "CHEAPEST_CARRIER_FOUND" and "IndiGo" in body["markdown_advice"]
