from fastapi import APIRouter, HTTPException
from app.ml.forecaster import forecaster

router = APIRouter()

@router.get("/predict/{origin}/{destination}")
def get_price_prediction(origin: str, destination: str):
    try:
        result = forecaster.predict_route_fare(origin, destination)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
