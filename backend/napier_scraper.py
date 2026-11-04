"""Archive job: pull live one-way fares via SerpApi and store them in Supabase `raw_flight_prices`.

Run from backend/:  python napier_scraper.py
Routes with no live data are skipped; nothing is simulated.
"""
import asyncio
from datetime import datetime, timedelta, timezone

from app.core.db import supabase_client
from app.scrapers.serpapi import LiveDataUnavailable, fetch_live_quotes

ROUTES = [("DEL", "BOM"), ("DEL", "BLR"), ("BOM", "BLR"), ("DEL", "CCU"), ("BLR", "HYD"), ("MAA", "DEL")]
LEAD_TIMES = [1, 7, 15, 30, 45]


async def run_full_scraping_cycle() -> None:
    if supabase_client is None:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY must be set to archive fares.")

    for origin, dest in ROUTES:
        for lead in LEAD_TIMES:
            dep = (datetime.now(timezone.utc) + timedelta(days=lead)).strftime("%Y-%m-%d")
            try:
                quotes, _ = await fetch_live_quotes(origin, dest, dep)
            except LiveDataUnavailable as exc:
                print(f"skip {origin}-{dest} T+{lead}: {exc.reason}")
                continue
            now = datetime.now(timezone.utc).isoformat()
            rows = [
                {
                    "route_code": f"{origin}-{dest}",
                    "origin": origin,
                    "destination": dest,
                    "lead_time_days": lead,
                    "price": q["price"],
                    "departure_date": dep,
                    "scraped_at": now,
                }
                for q in quotes
            ]
            supabase_client.table("raw_flight_prices").insert(rows).execute()
            print(f"saved {len(rows)} quotes {origin}-{dest} T+{lead}")


if __name__ == "__main__":
    asyncio.run(run_full_scraping_cycle())
