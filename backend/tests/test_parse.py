from urllib.parse import parse_qs, urlparse

from app.scrapers.parse import build_google_flights_url, parse_serpapi_flights

PAYLOAD = {
    "best_flights": [
        {"price": 5200, "total_duration": 135, "flights": [
            {"airline": "IndiGo", "flight_number": "6E 2041",
             "departure_airport": {"time": "2026-11-20 06:00"}, "arrival_airport": {"time": "2026-11-20 08:15"}}]},
    ],
    "other_flights": [
        {"price": 4900, "total_duration": 300, "flights": [
            {"airline": "IndiGo", "flight_number": "6E 100"},
            {"airline": "IndiGo", "flight_number": "6E 200", "arrival_airport": {"time": "2026-11-20 14:00"}}]},
        {"price": 0, "flights": [{"airline": "Ghost", "flight_number": "XX 1"}]},
        {"price": 6100, "flights": []},
    ],
}


def test_url_is_one_way_and_carrier_scoped():
    url = build_google_flights_url("del", "bom", "2026-11-20", "Air India")
    qs = parse_qs(urlparse(url).query)
    assert qs["tt"] == ["o"]
    assert "One way flights from DEL to BOM on 2026-11-20 on Air India" in qs["q"][0]


def test_parse_keeps_cheapest_per_carrier_and_skips_invalid():
    quotes = parse_serpapi_flights(PAYLOAD, "DEL", "BOM", "2026-11-20")
    assert [q["name"] for q in quotes] == ["IndiGo"]
    assert quotes[0]["price"] == 4900 and quotes[0]["stops"] == 1 and quotes[0]["code"] == "6E"
    assert "tt=o" in quotes[0]["booking_url"]


def test_parse_empty_payload():
    assert parse_serpapi_flights({}, "DEL", "BOM", "2026-11-20") == []
