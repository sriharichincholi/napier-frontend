"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchRoutePrediction, MLPrediction, CarrierQuote } from "@/lib/api";
import SmartRecommendationBanner from "@/components/SmartRecommendationBanner";
import HorizonForecastCards from "@/components/HorizonForecastCards";
import InteractivePriceChart from "@/components/InteractivePriceChart";
import CarrierFlightCards from "@/components/CarrierFlightCards";
import AiAssistantDrawer from "@/components/AiAssistantDrawer";

interface RouteOption {
  code: string;
  label: string;
  origin: string;
  dest: string;
}

const AVAILABLE_ROUTES: RouteOption[] = [
  { code: "DEL-BOM", label: "Delhi → Mumbai", origin: "DEL", dest: "BOM" },
  { code: "DEL-BLR", label: "Delhi → Bengaluru", origin: "DEL", dest: "BLR" },
  { code: "BOM-BLR", label: "Mumbai → Bengaluru", origin: "BOM", dest: "BLR" },
  { code: "DEL-CCU", label: "Delhi → Kolkata", origin: "DEL", dest: "CCU" },
  { code: "BLR-HYD", label: "Bengaluru → Hyderabad", origin: "BLR", dest: "HYD" },
  { code: "MAA-DEL", label: "Chennai → Delhi", origin: "MAA", dest: "DEL" },
  { code: "FRA-HYD", label: "Frankfurt → Hyderabad", origin: "FRA", dest: "HYD" },
  { code: "LHR-BOM", label: "London → Mumbai", origin: "LHR", dest: "BOM" },
];

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState("DEL-BOM");
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricView, setMetricView] = useState<"price" | "index">("price");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const activeRouteObj = useMemo(() => {
    return AVAILABLE_ROUTES.find((r) => r.code === selectedRoute) || AVAILABLE_ROUTES[0];
  }, [selectedRoute]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchRoutePrediction(activeRouteObj.origin, activeRouteObj.dest);
      setPrediction(res);
      setLoading(false);
    }
    loadData();
  }, [activeRouteObj]);

  const mockChartData = useMemo(() => {
    if (!prediction) return [];
    const base = prediction.predicted_price_24h;
    const points = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const noise = (Math.sin(i) * 0.04 + Math.cos(i * 0.5) * 0.03);
      const price = Math.round(base * (1 + noise));
      points.push({
        calculation_date: d.toISOString().split("T")[0],
        estimated_price: price,
        jevons_index: Number(((price / prediction.base_fare) * 100).toFixed(2)),
      });
    }
    return points;
  }, [prediction]);

  const carrierQuotes = useMemo(() => {
    if (!prediction) return [];
    const base = prediction.predicted_price_24h;
    const o = activeRouteObj.origin;
    const d = activeRouteObj.dest;
    const targetDate = "2026-10-15";

    return [
      {
        name: "IndiGo",
        code: "6E",
        price: Math.round(base * 0.95),
        seats_left: 3,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20IndiGo`,
      },
      {
        name: "Air India",
        code: "AI",
        price: Math.round(base * 1.08),
        seats_left: 7,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20Air%20India`,
      },
      {
        name: "Air India Express",
        code: "IX",
        price: Math.round(base * 0.92),
        seats_left: 2,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20Air%20India%20Express`,
      },
      {
        name: "Akasa Air",
        code: "QP",
        price: Math.round(base * 0.94),
        seats_left: 5,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20Akasa%20Air`,
      },
      {
        name: "SpiceJet",
        code: "SG",
        price: Math.round(base * 0.98),
        seats_left: 11,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20SpiceJet`,
      },
    ];
  }, [prediction, activeRouteObj]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="p-6 border-b border-slate-900 bg-slate-950/80 sticky top-0 z-40 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-[#00BB77] flex items-center justify-center font-black text-white text-lg shadow-lg shadow-purple-500/20">
            N
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-[#00BB77]">
              NAPIER AI v2.0
            </h1>
            <p className="text-[11px] font-semibold text-slate-400">
              National Airfare Price Index Engine & Travel Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="text-xs font-semibold rounded-xl px-4 py-2.5 bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00BB77] cursor-pointer"
          >
            {AVAILABLE_ROUTES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label} ({r.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAiOpen(true)}
            className="font-bold text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#00BB77] text-white hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <span>✨ Ask AI Assistant</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <SmartRecommendationBanner prediction={prediction} loading={loading} />

        <HorizonForecastCards prediction={prediction} loading={loading} />

        <InteractivePriceChart
          data={mockChartData}
          loading={loading}
          metricView={metricView}
          setMetricView={setMetricView}
        />

        <CarrierFlightCards
          quotes={carrierQuotes}
          origin={activeRouteObj.origin}
          destination={activeRouteObj.dest}
        />
      </main>

      {/* AI ASSISTANT DRAWER */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        origin={activeRouteObj.origin}
        destination={activeRouteObj.dest}
      />
    </div>
  );
}
