"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  data: any[];
  loading: boolean;
  metricView: "price" | "index";
  setMetricView: (m: "price" | "index") => void;
}

export default function InteractivePriceChart({ data, loading, metricView, setMetricView }: Props) {
  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📈</span>
            Interactive Fare & Index Trend Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Smooth time-series visualization with shaded expected price corridors
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMetricView("price")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              metricView === "price"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Price (₹)
          </button>
          <button
            onClick={() => setMetricView("index")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              metricView === "index"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Jevons Index
          </button>
        </div>
      </div>

      <div className="w-full h-[320px] flex items-center justify-center">
        {loading ? (
          <div className="text-sm text-emerald-400 animate-pulse flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            Loading forecasting telemetry...
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00BB77" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00BB77" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="calculation_date" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["auto", "auto"]} tickLine={false} tickFormatter={(v) => (metricView === "price" ? `₹${v}` : v)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#ffffff",
                  borderRadius: "0.75rem",
                }}
                formatter={(val: any) => [
                  metricView === "price" ? `₹${Number(val).toLocaleString("en-IN")}` : val,
                  metricView === "price" ? "Fare Quote" : "Jevons Index"
                ]}
              />
              <Area
                type="monotone"
                dataKey={metricView === "price" ? "estimated_price" : "jevons_index"}
                stroke={metricView === "price" ? "#00BB77" : "#a855f7"}
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#${metricView === "price" ? "colorPrice" : "colorIndex"})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-slate-500">No chart entries available.</p>
        )}
      </div>
    </div>
  );
}
