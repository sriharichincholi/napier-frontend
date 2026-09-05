"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type TimeFrame = "7d" | "30d" | "90d" | "ALL";
type MetricView = "price" | "index";

const AVAILABLE_ROUTES = [
  { code: "DEL-BOM", label: "Delhi → Mumbai" },
  { code: "DEL-BLR", label: "Delhi → Bengaluru" },
  { code: "BOM-BLR", label: "Mumbai → Bengaluru" },
  { code: "DEL-CCU", label: "Delhi → Kolkata" },
  { code: "BLR-HYD", label: "Bengaluru → Hyderabad" },
  { code: "MAA-DEL", label: "Chennai → Delhi" },
];

const LEAD_WINDOWS = [
  { value: 1, label: "T+1 Day" },
  { value: 7, label: "T+7 Days" },
  { value: 15, label: "T+15 Days" },
  { value: 30, label: "T+30 Days" },
  { value: 45, label: "T+45 Days" },
];

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedRoute, setSelectedRoute] = useState<string>("DEL-BOM");
  const [selectedLeadTime, setSelectedLeadTime] = useState<number>(15);
  const [timeframe, setTimeframe] = useState<TimeFrame>("30d");
  const [metricView, setMetricView] = useState<MetricView>("price");

  const chartRef = useRef<HTMLDivElement>(null);

  const scrollToCharts = () => {
    chartRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
      "https://napier-backend.onrender.com";

    const fetchIndexData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${baseUrl}/api/v1/index-trends?route=${selectedRoute}&lead_time=${selectedLeadTime}`
        );

        if (!res.ok) throw new Error(`HTTP status: ${res.status}`);

        const resData = await res.json();
        const list = Array.isArray(resData) ? resData : resData.data;

        if (Array.isArray(list) && list.length > 0) {
          const BASE_AIRFARE_INR = 5000;

          const formatted = list.map((item) => {
            const rawIndex = item.jevons_index_value ?? item.jevons_index ?? 100;
            const estimatedPrice = Math.round(BASE_AIRFARE_INR * (rawIndex / 100));

            return {
              ...item,
              jevons_index: Number(rawIndex.toFixed(2)),
              estimated_price: estimatedPrice,
            };
          });
          setData(formatted);
        } else {
          setData([]);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to connect to index service");
      } finally {
        setLoading(false);
      }
    };

    fetchIndexData();
  }, [selectedRoute, selectedLeadTime]);

  // Dynamic timeframe filter
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    if (timeframe === "7d") return data.slice(-7);
    if (timeframe === "30d") return data.slice(-30);
    if (timeframe === "90d") return data.slice(-90);
    return data;
  }, [data, timeframe]);

  // Metrics calculations
  const latestItem = filteredData.length
    ? filteredData[filteredData.length - 1]
    : { estimated_price: 5000, jevons_index: 100 };
  const firstItem = filteredData.length
    ? filteredData[0]
    : { estimated_price: 5000, jevons_index: 100 };

  const currentPrice = latestItem.estimated_price;
  const currentIndex = latestItem.jevons_index;

  const minPrice = filteredData.length
    ? Math.min(...filteredData.map((d) => d.estimated_price))
    : 5000;
  const maxPrice = filteredData.length
    ? Math.max(...filteredData.map((d) => d.estimated_price))
    : 5000;

  const periodChange = filteredData.length
    ? (
        ((latestItem.estimated_price - firstItem.estimated_price) /
          firstItem.estimated_price) *
        100
      ).toFixed(1)
    : "0.0";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* HERO SECTION */}
      <section className="w-full max-w-5xl px-6 py-20 md:py-28 flex flex-col items-center text-center space-y-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-400">
            NAPIER
          </h1>
        </div>

        <div className="max-w-2xl space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-200">
            Multi-Route Airfare Price Intelligence
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Real-time Jevons Airfare Index engine tracking key DGCA passenger routes across <span className="text-blue-400 font-medium">T+1 to T+45</span> advance booking windows.
          </p>
        </div>

        <button
          onClick={scrollToCharts}
          className="group relative inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
        >
          Explore Route Trends
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-y-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>

      {/* ANALYTICS SECTION */}
      <section
        ref={chartRef}
        className="w-full max-w-6xl px-4 md:px-8 py-12 border-t border-slate-900 space-y-6"
      >
        {/* PARAMETER SELECTION BAR */}
        <div className="flex flex-col gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Route Selector Dropdown */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs text-slate-400 font-medium">City-Pair Route</label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {AVAILABLE_ROUTES.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Advance Lead Window Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">
                Advance Purchase Window
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 space-x-1">
                {LEAD_WINDOWS.map((lw) => (
                  <button
                    key={lw.value}
                    onClick={() => setSelectedLeadTime(lw.value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      selectedLeadTime === lw.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Toggle: Price vs Index */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Metric Display</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 space-x-1">
                <button
                  onClick={() => setMetricView("price")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    metricView === "price"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Price (₹)
                </button>
                <button
                  onClick={() => setMetricView("index")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    metricView === "index"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Jevons Index
                </button>
              </div>
            </div>

            {/* Timeframe Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Timeframe</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 space-x-1">
                {(["7d", "30d", "90d", "ALL"] as TimeFrame[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timeframe === tf
                        ? "bg-slate-800 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Est. Current Fare</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              ₹{currentPrice.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Jevons Index</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {currentIndex}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Min / Max Range</p>
            <p className="text-lg font-bold text-slate-200 mt-1">
              ₹{minPrice.toLocaleString("en-IN")} - ₹{maxPrice.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Trend ({timeframe})</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                Number(periodChange) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {Number(periodChange) >= 0 ? `+${periodChange}%` : `${periodChange}%`}
            </p>
          </div>
        </div>

        {/* CHART VIEWPORT */}
        <div className="w-full h-[420px] bg-slate-900/40 p-4 md:p-6 rounded-xl border border-slate-800 shadow-xl flex items-center justify-center">
          {loading ? (
            <div className="text-blue-400 text-sm animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Loading route parameters ({selectedRoute}, T+{selectedLeadTime})...
            </div>
          ) : error ? (
            <div className="text-center space-y-2">
              <p className="text-rose-400 font-medium">Error loading chart</p>
              <p className="text-xs text-slate-500 font-mono">{error}</p>
            </div>
          ) : filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="calculation_date"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  domain={["auto", "auto"]}
                  tickLine={false}
                  tickFormatter={(val) =>
                    metricView === "price" ? `₹${val}` : val
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
                  }}
                  formatter={(val: any) => [
                    metricView === "price" ? `₹${val.toLocaleString("en-IN")}` : val,
                    metricView === "price" ? "Estimated Price" : "Jevons Index",
                  ]}
                  labelStyle={{ color: "#94a3b8", marginBottom: "0.25rem" }}
                />
                <Line
                  type="monotone"
                  dataKey={metricView === "price" ? "estimated_price" : "jevons_index"}
                  name={metricView === "price" ? "Estimated Price (₹)" : "Jevons Index"}
                  stroke={metricView === "price" ? "#3b82f6" : "#a855f7"}
                  strokeWidth={2.5}
                  dot={{ fill: metricView === "price" ? "#3b82f6" : "#a855f7", r: 3 }}
                  activeDot={{
                    r: 6,
                    fill: metricView === "price" ? "#60a5fa" : "#c084fc",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-slate-400 text-sm font-medium">
                No metric entries found for {selectedRoute} (T+{selectedLeadTime}).
              </p>
              <p className="text-xs text-slate-500">
                Run seed script or scraper worker to generate entries for this route window.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}