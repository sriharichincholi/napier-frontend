"use client";

import React, { useState, useEffect, useMemo } from "react";
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

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeFrame>("30d");

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
          const formatted = list.map((item) => ({
            ...item,
            jevons_index: item.jevons_index_value ?? item.jevons_index ?? 100,
          }));
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

  // Filter data dynamically based on selected timeframe
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    if (timeframe === "7d") return data.slice(-7);
    if (timeframe === "30d") return data.slice(-30);
    if (timeframe === "90d") return data.slice(-90);
    return data;
  }, [data, timeframe]);

  // Dynamic summary metrics
  const latestIndex = filteredData.length
    ? filteredData[filteredData.length - 1].jevons_index.toFixed(2)
    : "100.00";
  const firstIndex = filteredData.length
    ? filteredData[0].jevons_index
    : 100;
  const periodChange = filteredData.length
    ? (
        ((filteredData[filteredData.length - 1].jevons_index - firstIndex) /
          firstIndex) *
        100
      ).toFixed(2)
    : "0.00";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Airline Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Airfare Inflation Trend
                </h1>
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                  DEL → BOM
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Scrubbed via IQR Anomaly Detection • 14-day lead time
              </p>
            </div>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1 self-start md:self-auto">
            {(["7d", "30d", "90d", "ALL"] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeframe === tf
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">
              Current Jevons Index
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {latestIndex}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">
              Period Trend ({timeframe})
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                Number(periodChange) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {Number(periodChange) >= 0 ? `+${periodChange}%` : `${periodChange}%`}
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Data Points</p>
            <p className="text-2xl font-bold text-slate-200 mt-1">
              {filteredData.length} entries
            </p>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="w-full h-[400px] bg-slate-900/40 p-4 md:p-6 rounded-xl border border-slate-800 shadow-xl flex items-center justify-center">
          {loading ? (
            <div className="text-yellow-400 text-sm animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              Loading live index data from Render backend...
            </div>
          ) : error ? (
            <div className="text-center space-y-2">
              <p className="text-rose-400 font-medium">Error loading chart data</p>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#10b981", fontWeight: "600" }}
                  labelStyle={{ color: "#94a3b8", marginBottom: "0.25rem" }}
                />
                <Line
                  type="monotone"
                  dataKey="jevons_index"
                  name="Jevons Index"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 3 }}
                  activeDot={{ r: 6, fill: "#34d399", stroke: "#022c22" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm">
              No index data returned from backend.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}