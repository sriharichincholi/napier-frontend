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

  useEffect(() => {
    // 1. Fallback to live Render backend URL
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://napier-backend.onrender.com";

    fetch(`${API_URL}/api/v1/index-trends`)
      .then((res) => res.json())
      .then((resData) => {
        // 2. Extract array from response payload
        const list = Array.isArray(resData) ? resData : resData.data;

        if (Array.isArray(list) && list.length > 0) {
          // 3. Normalize backend property 'jevons_index_value' for Recharts
          const formatted = list.map((item) => ({
            ...item,
            jevons_index: item.jevons_index_value ?? item.jevons_index ?? 100,
          }));
          setData(formatted);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch index data:", err);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Airfare Inflation Trend (DEL - BOM)</h1>
      
      {data.length > 0 ? (
        <div className="w-full h-80 bg-slate-900 p-4 rounded-xl border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="calculation_date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
              />
              <Line
                type="monotone"
                dataKey="jevons_index"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-yellow-400">Loading live index data from Render backend...</p>
      )}
    </main>
  );
}