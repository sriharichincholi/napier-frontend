"""Heuristic short-horizon projection anchored on a LIVE fare plus holiday-demand factors.

Not a trained model: every projection is `live_base * (1 + demand_factor)`. A live base is required;
there are no static route fares or fallback prices.
"""
import datetime
from typing import Any

import holidays


class HolidayFeatureTransformer:
    MAJOR_FESTIVALS = {
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
        year = datetime.date.today().year
        self.in_holidays = holidays.India(years=[year, year + 1])

    def get_holiday_features(self, target_date: datetime.date) -> dict[str, Any]:
        festival_name = self.MAJOR_FESTIVALS.get(target_date) or self.in_holidays.get(target_date)

        min_days, closest = 99, None
        for fest_date, name in self.MAJOR_FESTIVALS.items():
            diff = abs((fest_date - target_date).days)
            if diff < min_days:
                min_days, closest = diff, name

        in_window = min_days <= 3
        is_weekend = target_date.weekday() in (4, 5, 6)

        impact = 0.0
        if in_window or festival_name:
            impact += 18.4
        elif min_days <= 7:
            impact += 10.2
        if is_weekend:
            impact += 6.5
        if target_date.month in (5, 6, 12):
            impact += 5.0

        return {
            "festival_name": festival_name or (closest if in_window else None),
            "days_to_closest_festival": min_days,
            "impact_factor_pct": round(impact, 1),
        }


class PriceForecaster:
    def __init__(self):
        self.transformer = HolidayFeatureTransformer()

    def predict_route_fare(self, origin: str, destination: str, current_live_base: float) -> dict[str, Any]:
        if not current_live_base or current_live_base <= 0:
            raise ValueError("A live base fare is required to project prices.")

        base = float(current_live_base)
        today = datetime.datetime.now(datetime.timezone.utc).date()
        f1 = self.transformer.get_holiday_features(today + datetime.timedelta(days=1))
        f7 = self.transformer.get_holiday_features(today + datetime.timedelta(days=7))

        p1h = round(base * 1.002, 2)
        p24h = round(base * (1 + f1["impact_factor_pct"] / 100), 2)
        p7d = round(base * (1 + f7["impact_factor_pct"] / 100), 2)

        corridors = {
            "1h": {"lower": round(p1h * 0.955, 2), "upper": round(p1h * 1.045, 2)},
            "24h": {"lower": round(p24h * 0.92, 2), "upper": round(p24h * 1.08, 2)},
            "7d": {"lower": round(p7d * 0.88, 2), "upper": round(p7d * 1.12, 2)},
        }

        impact = f7["impact_factor_pct"]
        if impact >= 15.0 or p7d > p24h * 1.08:
            rec, badge = "GREAT TIME TO BOOK", "SURGE_WARNING"
            advice = f"Prices projected to rise up to +{impact}% on holiday/festival demand. Booking now locks in today's live fare."
        elif p24h < base * 0.96:
            rec, badge = "WAIT FOR DIP", "EXPECT_DIP"
            advice = "Fares are projected to soften over the next 24 hours."
        else:
            rec, badge = "PRICES STABLE", "STABLE_MARKET"
            advice = "No significant demand pressure projected over the 7-day window."

        return {
            "origin": origin.upper(),
            "destination": destination.upper(),
            "route_code": f"{origin.upper()}-{destination.upper()}",
            "base_fare": base,
            "predicted_price_1h": p1h,
            "predicted_price_24h": p24h,
            "predicted_price_7d": p7d,
            "confidence_corridors": corridors,
            "holiday_impact_factor": f"+{impact}%",
            "holiday_impact_pct": impact,
            "festival_name": f7["festival_name"],
            "recommendation": rec,
            "advice_text": advice,
            "status_badge": badge,
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }


forecaster = PriceForecaster()
