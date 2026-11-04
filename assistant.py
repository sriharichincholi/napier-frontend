from fastapi import APIRouter, HTTPException

from app.ml.forecaster import forecaster
from app.schemas import CarrierQuote, ChatRequest, ChatResponse
from app.scrapers.serpapi import fetch_live_quotes

router = APIRouter()


def _inr(n: float) -> str:
    return f"₹{round(n):,}"


@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(req: ChatRequest):
    msg = req.message.lower().strip()
    origin, destination = req.origin.upper(), req.destination.upper()
    route_code = f"{origin}-{destination}"

    try:
        quotes, _ = await fetch_live_quotes(origin, destination, req.date)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    carriers = [CarrierQuote(**q) for q in quotes]
    cheapest = min(carriers, key=lambda c: c.price)
    pred = forecaster.predict_route_fare(origin, destination, current_live_base=cheapest.price)

    if any(k in msg for k in ("diwali", "festival", "holiday")):
        advice = (
            f"### 🪔 Festival & Holiday Surge Analysis for {route_code}\n\n"
            f"Holiday proximity impact: **{pred['holiday_impact_factor']}**\n\n"
            f"- **7-day projection:** {_inr(pred['predicted_price_7d'])}\n"
            f"- **95% upper corridor:** {_inr(pred['confidence_corridors']['7d']['upper'])}\n\n"
            "Festival windows lift demand sharply; booking earlier avoids the projected increase."
        )
        badge = "FESTIVAL_SURGE_DETECTED"
    elif any(k in msg for k in ("wait", "book", "today", "friday")):
        advice = (
            f"### ✈️ Booking Recommendation for {route_code}\n\n"
            f"**Recommendation:** {pred['recommendation']}\n\n"
            f"- **Next hour:** {_inr(pred['predicted_price_1h'])}\n"
            f"- **Next day:** {_inr(pred['predicted_price_24h'])}\n"
            f"- **Next week:** {_inr(pred['predicted_price_7d'])}\n\n"
            f"{pred['advice_text']}"
        )
        badge = pred["status_badge"]
    elif any(k in msg for k in ("cheapest", "airline", "best price")):
        advice = (
            f"### 💰 Lowest live fare for {route_code}\n\n"
            f"**{cheapest.name} ({cheapest.code})** is cheapest at **{_inr(cheapest.price)}** one-way."
        )
        badge = "CHEAPEST_CARRIER_FOUND"
    else:
        advice = (
            f"### 🤖 NAPIER summary for {route_code}\n\n"
            f"- **Cheapest live fare:** {_inr(cheapest.price)} ({cheapest.name})\n"
            f"- **7-day projection:** {_inr(pred['predicted_price_7d'])}\n"
            f"- **Status:** {pred['recommendation']}"
        )
        badge = "AI_TELEMETRY_READY"

    return ChatResponse(
        markdown_advice=advice,
        status_badge=badge,
        recommendation=pred["recommendation"],
        suggested_queries=[
            "Should I book today or wait until Friday?",
            "How much will prices go up around Diwali?",
            "Which airline offers the best price right now?",
        ],
        carrier_links=carriers,
        ml_summary={
            "predicted_price_1h": pred["predicted_price_1h"],
            "predicted_price_24h": pred["predicted_price_24h"],
            "predicted_price_7d": pred["predicted_price_7d"],
            "holiday_impact_factor": pred["holiday_impact_factor"],
            "confidence_corridors": pred["confidence_corridors"],
        },
    )
