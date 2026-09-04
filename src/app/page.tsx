"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Uses Vercel environment variable if set, otherwise falls back directly to Render production backend
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
      "https://napier-backend.onrender.com";

    const fetchIndexData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Standardized fetch without trailing slashes that trigger FastAPI 404/redirects
        const res = await fetch(`${baseUrl}/api/v1/index-trends`);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const resData = await res.json();

        // Extract array if nested under a 'data' object key, otherwise use direct response
        const list = Array.isArray(resData) ? resData : resData.data;

        if (Array.isArray(list) && list.length > 0) {
          // Normalize backend property 'jevons_index_value' to 'jevons_index' for Recharts
          const formatted = list.map((item) => ({
            ...item,
            jevons_index: item.jevons_index_value ?? item.jevons_index ?? 0,
          }));
          setData(formatted);
        } else {
          setData([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch index data:", err);
        setError(err.message || "Failed to load index data from backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchIndexData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Airfare Inflation Trend (DEL - BOM)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Scrubbed via IQR Anomaly detection • 14-day lead time
          </p>
        </div>

        <div className="w-full h-96 bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl flex items-center justify-center">
          {loading ? (
            <div className="text-yellow-400 text-sm animate-pulse">
              Loading live index data from Render backend...
            </div>
          ) : error ? (
            <div className="text-center space-y-2">
              <p className="text-red-400 font-medium">Error loading chart data</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="calculation_date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.5rem",
                  }}
                  itemStyle={{ color: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="jevons_index"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
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