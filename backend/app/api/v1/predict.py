from fastapi import APIRouter, HTTPException
from app.ml.forecaster import forecaster
from app.scrapers.scraper import scrape_google_flights_live

router = APIRouter()

@router.get("/predict/{origin}/{destination}")
async def get_price_prediction(origin: str, destination: str):
    try:
        scraped_quotes = await scrape_google_flights_live(origin, destination)
        base_price = scraped_quotes[0]["price"] if scraped_quotes else None
        result = forecaster.predict_route_fare(origin, destination, current_live_base=base_price)
        result["live_carrier_quotes"] = scraped_quotes
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
