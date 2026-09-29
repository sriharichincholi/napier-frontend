import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.ml.forecaster import forecaster
from app.scrapers.scraper import scrape_google_flights_live, build_google_flights_url

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    origin: Optional[str] = "DEL"
    destination: Optional[str] = "BOM"
    route_code: Optional[str] = "DEL-BOM"

class CarrierQuote(BaseModel):
    name: str
    code: str
    price: float
    seats_left: int
    booking_url: str

class ChatResponse(BaseModel):
    markdown_advice: str
    status_badge: str
    recommendation: str
    suggested_queries: List[str]
    carrier_links: List[CarrierQuote]
    ml_summary: Dict[str, Any]

@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(req: ChatRequest):
    msg_lower = req.message.lower().strip()
    origin = req.origin.upper() if req.origin else "DEL"
    destination = req.destination.upper() if req.destination else "BOM"
    route_code = f"{origin}-{destination}"

    # Scrape live quotes for actual requested origin and destination
    scraped_quotes = await scrape_google_flights_live(origin, destination)

    carrier_links = [
        CarrierQuote(
            name=q["name"],
            code=q["code"],
            price=q["price"],
            seats_left=q["seats_left"],
            booking_url=q["booking_url"]
        ) for q in scraped_quotes
    ]

    base_price = scraped_quotes[0]["price"] if scraped_quotes else 5200.0
    pred = forecaster.predict_route_fare(origin, destination, current_live_base=base_price)

    if "diwali" in msg_lower or "festival" in msg_lower or "holiday" in msg_lower:
        advice = f"### 🪔 Festival & Holiday Surge Analysis for {route_code}\n\n" \
                 f"Holiday Proximity Impact: **{pred['holiday_impact_factor']}**\n\n" \
                 f"- **7-Day Target Price:** ₹{pred['predicted_price_7d']:,}\n" \
                 f"- **95% Confidence Upper Corridor:** ₹{pred['confidence_corridors']['7d']['upper']:,}\n\n" \
                 f"**Advice:** Demand peaks sharply during festival windows. We recommend securing tickets immediately before carrier yield algorithms increment fares by an additional 12-20%."
        status_badge = "FESTIVAL_SURGE_DETECTED"
    elif "wait" in msg_lower or "book" in msg_lower or "today" in msg_lower or "friday" in msg_lower:
        advice = f"### ✈️ Booking Recommendation for {route_code}\n\n" \
                 f"**Recommendation:** {pred['recommendation']}\n\n" \
                 f"- **Next Hour ($T+1h$):** ₹{pred['predicted_price_1h']:,}\n" \
                 f"- **Next Day ($T+24h$):** ₹{pred['predicted_price_24h']:,}\n" \
                 f"- **Next Week ($T+7d$):** ₹{pred['predicted_price_7d']:,}\n\n" \
                 f"{pred['advice_text']}"
        status_badge = pred['status_badge']
    elif "cheapest" in msg_lower or "airline" in msg_lower or "best price" in msg_lower:
        cheapest = min(carrier_links, key=lambda c: c.price)
        advice = f"### 💰 Lowest Airfare Carrier for {route_code}\n\n" \
                 f"Currently, **{cheapest.name} ({cheapest.code})** offers the best price starting at **₹{cheapest.price:,}** with **{cheapest.seats_left} seats left** at this tier.\n\n" \
                 f"Direct verification and booking links are provided below."
        status_badge = "CHEAPEST_CARRIER_FOUND"
    else:
        advice = f"### 🤖 NAPIER AI Intelligence Summary for {route_code}\n\n" \
                 f"Market trends indicate steady demand for **{route_code}**.\n\n" \
                 f"- **Current Estimated Fare:** ₹{pred['predicted_price_24h']:,}\n" \
                 f"- **7-Day Trend Forecast:** ₹{pred['predicted_price_7d']:,}\n" \
                 f"- **Status:** {pred['recommendation']}\n\n" \
                 f"Feel free to ask specific questions about festival price surges, carrier seat availability, or optimal booking dates!"
        status_badge = "AI_TELEMETRY_READY"

    suggested_queries = [
        "Should I book today or wait until Friday?",
        "How much will prices go up around Diwali?",
        "Which airline offers the best price right now?"
    ]

    return ChatResponse(
        markdown_advice=advice,
        status_badge=status_badge,
        recommendation=pred["recommendation"],
        suggested_queries=suggested_queries,
        carrier_links=carrier_links,
        ml_summary={
            "predicted_price_1h": pred["predicted_price_1h"],
            "predicted_price_24h": pred["predicted_price_24h"],
            "predicted_price_7d": pred["predicted_price_7d"],
            "holiday_impact_factor": pred["holiday_impact_factor"],
            "confidence_corridors": pred["confidence_corridors"]
        }
    )
