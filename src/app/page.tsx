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

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeFrame>("30d");
  const [metricView, setMetricView] = useState<MetricView>("price");

  // Ref for smooth scrolling
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
        const res = await fetch(`${baseUrl}/api/v1/index-trends`);

        if (!res.ok) throw new Error(`HTTP status: ${res.status}`);

        const resData = await res.json();
        const list = Array.isArray(resData) ? resData : resData.data;

        if (Array.isArray(list) && list.length > 0) {
          // Standard baseline for DEL-BOM route is approx ₹5,000 at Index 100
          const BASE_AIRFARE_INR = 5000;

          const formatted = list.map((item) => {
            const rawIndex = item.jevons_index_value ?? item.jevons_index ?? 100;
            // Calculate absolute estimated price in INR
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
  }, []);

  // Filter data dynamically based on timeframe
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    if (timeframe === "7d") return data.slice(-7);
    if (timeframe === "30d") return data.slice(-30);
    if (timeframe === "90d") return data.slice(-90);
    return data;
  }, [data, timeframe]);

  // Dynamic calculations for Price and Index
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
      {/* HERO / LANDING PAGE SECTION */}
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
            Real Airfare Prices & Inflation Trends
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Stop guessing ticket prices. <span className="text-blue-400 font-medium">NAPIER</span> tracks raw ticket costs alongside Jevons index metrics to scrub surge price anomalies and show you the true cost of flying DEL → BOM.
          </p>
        </div>

        <button
          onClick={scrollToCharts}
          className="group relative inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
        >
          Look at the Prices & Charts
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

      {/* DASHBOARD & ANALYTICS SECTION */}
      <section
        ref={chartRef}
        className="w-full max-w-6xl px-4 md:px-8 py-12 border-t border-slate-900 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Airfare Trends (DEL → BOM)
              </h3>
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                Direct Routes
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Scrubbed via IQR Anomaly Detection • 14-day lead time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle View: Price (₹) vs Index */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center space-x-1">
              <button
                onClick={() => setMetricView("price")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  metricView === "price"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Price (₹)
              </button>
              <button
                onClick={() => setMetricView("index")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  metricView === "index"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Jevons Index
              </button>
            </div>

            {/* Timeframe Buttons */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center space-x-1">
              {(["7d", "30d", "90d", "ALL"] as TimeFrame[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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

        {/* METRIC CARDS SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Est. Current Fare</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              ₹{currentPrice.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Current Index</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {currentIndex}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Lowest / Highest Fare</p>
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
              Loading live price & index data...
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
            <p className="text-slate-400 text-sm">No data available.</p>
          )}
        </div>
      </section>
    </main>
  );
}