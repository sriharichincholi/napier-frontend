import datetime
from typing import Dict, Any, List, Tuple
import numpy as np
import holidays

class HolidayFeatureTransformer:
    MAJOR_FESTIVALS_2025_2026 = {
        datetime.date(2025, 3, 14): "Holi",
        datetime.date(2025, 10, 2): "Dussehra",
        datetime.date(2025, 10, 20): "Diwali",
        datetime.date(2025, 10, 21): "Deepavali",
        datetime.date(2025, 12, 25): "Christmas",
        datetime.date(2025, 12, 31): "New Year's Eve",
        datetime.date(2026, 1, 1): "New Year's Day",
        datetime.date(2026, 1, 14): "Makar Sankranti / Pongal",
        datetime.date(2026, 1, 26): "Republic Day",
        datetime.date(2026, 3, 4): "Holi",
        datetime.date(2026, 10, 20): "Dussehra",
        datetime.date(2026, 11, 8): "Diwali",
        datetime.date(2026, 12, 25): "Christmas",
        datetime.date(2026, 12, 31): "New Year's Eve",
    }

    def __init__(self):
        self.in_holidays = holidays.India(years=[2025, 2026])

    def get_holiday_features(self, target_date: datetime.date) -> Dict[str, Any]:
        is_official_holiday = target_date in self.in_holidays
        festival_name = self.MAJOR_FESTIVALS_2025_2026.get(target_date) or self.in_holidays.get(target_date)

        min_days_to_festival = 99
        closest_festival = "None"
        for fest_date, name in self.MAJOR_FESTIVALS_2025_2026.items():
            diff = abs((fest_date - target_date).days)
            if diff < min_days_to_festival:
                min_days_to_festival = diff
                closest_festival = name

        is_festival_window = min_days_to_festival <= 3
        weekday = target_date.weekday()
        is_weekend = weekday in (4, 5, 6)

        impact_pct = 0.0
        if is_festival_window or festival_name:
            impact_pct += 18.4
        elif min_days_to_festival <= 7:
            impact_pct += 10.2
        if is_weekend:
            impact_pct += 6.5

        if target_date.month in (5, 6, 12):
            impact_pct += 5.0

        return {
            "is_official_holiday": is_official_holiday,
            "festival_name": festival_name or (closest_festival if min_days_to_festival <= 3 else None),
            "days_to_closest_festival": min_days_to_festival,
            "is_festival_window": is_festival_window,
            "is_weekend": is_weekend,
            "impact_factor_pct": round(impact_pct, 1)
        }


class PriceForecaster:
    BASE_ROUTE_FARES = {
        "DEL-BOM": 5400.0,
        "DEL-BLR": 5800.0,
        "BOM-BLR": 4200.0,
        "DEL-CCU": 4900.0,
        "BLR-HYD": 3600.0,
        "MAA-DEL": 5300.0,
        "FRA-HYD": 48000.0,
        "LHR-BOM": 52000.0,
        "SIN-BOM": 38000.0,
        "DXB-DEL": 24000.0,
    }

    def __init__(self):
        self.transformer = HolidayFeatureTransformer()

    def predict_route_fare(self, origin: str, destination: str, current_live_base: float = None) -> Dict[str, Any]:
        route_code = f"{origin.upper()}-{destination.upper()}"
        base_fare = current_live_base or self.BASE_ROUTE_FARES.get(route_code, 5200.0)

        now = datetime.datetime.now(datetime.timezone.utc)
        today = now.date()

        feat_1d = self.transformer.get_holiday_features(today + datetime.timedelta(days=1))
        feat_7d = self.transformer.get_holiday_features(today + datetime.timedelta(days=7))

        mult_1h = 1.002
        mult_24h = 1.0 + (feat_1d["impact_factor_pct"] / 100.0)
        mult_7d = 1.0 + (feat_7d["impact_factor_pct"] / 100.0)

        pred_1h = round(base_fare * mult_1h, 2)
        pred_24h = round(base_fare * mult_24h, 2)
        pred_7d = round(base_fare * mult_7d, 2)

        corridors = {
            "1h": {"lower": round(pred_1h * 0.955, 2), "upper": round(pred_1h * 1.045, 2)},
            "24h": {"lower": round(pred_24h * 0.92, 2), "upper": round(pred_24h * 1.08, 2)},
            "7d": {"lower": round(pred_7d * 0.88, 2), "upper": round(pred_7d * 1.12, 2)},
        }

        total_impact = feat_7d["impact_factor_pct"]
        if total_impact >= 15.0 or pred_7d > pred_24h * 1.08:
            recommendation = "GREAT TIME TO BOOK"
            advice_text = f"Prices projected to surge up to +{total_impact}% due to upcoming holiday/festival demand. Book now to lock in rates."
            status_badge = "SURGE_WARNING"
        elif pred_24h < base_fare * 0.96:
            recommendation = "WAIT FOR DIP"
            advice_text = f"Substantial intra-day price softening detected. Fares expected to dip further over the next 24 hours."
            status_badge = "EXPECT_DIP"
        else:
            recommendation = "PRICES STABLE"
            advice_text = "Market conditions show steady carrier capacity and minimal fare volatility over the 7-day window."
            status_badge = "STABLE_MARKET"

        return {
            "origin": origin.upper(),
            "destination": destination.upper(),
            "route_code": route_code,
            "base_fare": base_fare,
            "predicted_price_1h": pred_1h,
            "predicted_price_24h": pred_24h,
            "predicted_price_7d": pred_7d,
            "confidence_corridors": corridors,
            "holiday_impact_factor": f"+{feat_7d['impact_factor_pct']}%",
            "holiday_impact_pct": feat_7d["impact_factor_pct"],
            "festival_name": feat_7d["festival_name"],
            "recommendation": recommendation,
            "advice_text": advice_text,
            "status_badge": status_badge,
            "generated_at": now.isoformat()
        }

forecaster = PriceForecaster()
