# NAPIER v2.0

National Airfare Price Index Engine: live one-way fares (SerpApi → Google Flights), holiday-demand projections, and an archived Jevons index.

```
backend/   FastAPI  (app/ = API, napier_scraper.py = archive job, napier_engine.py = index job)
frontend/  Next.js + Tailwind v4 (Spatial Glass UI, light/dark)
```

## Run

```bash
# backend
cd backend && cp .env.example .env     # set SERPAPI_KEY (required for prices)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest

# frontend
cd frontend && cp .env.example .env.local
npm install && npm run dev
npm run build
```

## Data integrity
- Prices only ever come from SerpApi. If it fails or the key is missing the API returns `503 LIVE_DATA_UNAVAILABLE` and the UI shows the error; nothing is synthesised.
- Any IATA pair can be priced; `/api/v1/resolve` maps names ("Delhi to Mumbai") to codes via `app/data/airports.py`.
- Cache TTL is 30–60 min (`CACHE_TTL_SECONDS`, clamped). Backend order: Redis (`REDIS_URL`) → Supabase `fare_cache` → in-process.
- Forecasts are heuristic (`live fare × holiday factor`), not a trained model.

## Supabase (optional)
```sql
create table if not exists fare_cache (
  cache_key  text primary key,
  payload    jsonb not null,
  expires_at timestamptz not null
);
```
Archive/index jobs expect `raw_flight_prices(route_code, origin, destination, lead_time_days, price, departure_date, scraped_at)` and `airfare_index_metrics`.
