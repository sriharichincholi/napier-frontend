from typing import Any, List, Optional

from pydantic import BaseModel


class CarrierQuote(BaseModel):
    name: str
    code: str
    price: int
    stops: int
    duration_min: Optional[int] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    booking_url: str


class ChatRequest(BaseModel):
    message: str
    origin: str
    destination: str
    date: Optional[str] = None


class ChatResponse(BaseModel):
    markdown_advice: str
    status_badge: str
    recommendation: str
    suggested_queries: List[str]
    carrier_links: List[CarrierQuote]
    ml_summary: dict[str, Any]
