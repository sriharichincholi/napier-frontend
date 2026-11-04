from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import assistant, predict, routes
from app.core.config import settings
from app.scrapers.serpapi import LiveDataUnavailable

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="National Airfare Price Index Engine: live one-way fares, forecasts and archived index trends",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(LiveDataUnavailable)
async def live_data_unavailable(_: Request, exc: LiveDataUnavailable):
    return JSONResponse(status_code=503, content={"detail": {"code": "LIVE_DATA_UNAVAILABLE", "message": exc.reason}})


app.include_router(routes.router, prefix="/api/v1", tags=["Routes & Archive"])
app.include_router(predict.router, prefix="/api/v1", tags=["Live Fares & Forecast"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["AI Assistant"])


@app.get("/")
def read_root():
    return {"status": "online", "engine": "NAPIER v2.0", "docs": "/docs"}
