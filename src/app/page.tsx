"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Icon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const Plane = (props: { className?: string }) => (
  <Icon {...props}>
    <path d="M2 12h20" />
    <path d="m13 2 9 10-9 10" />
    <path d="M13 12H2l5-5" />
    <path d="m13 12-6 5" />
  </Icon>
);

const TrendingUp = (props: { className?: string }) => (
  <Icon {...props}>
    <path d="M3 3v18h18" />
    <path d="m7 16 4-5 3 3 6-7" />
  </Icon>
);

const AlertTriangle = (props: { className?: string }) => (
  <Icon {...props}>
    <path d="m21.7 18-8.5-14.5a1.4 1.4 0 0 0-2.4 0L2.3 18a1.4 1.4 0 0 0 1.2 2h17a1.4 1.4 0 0 0 1.2-2Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
);

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set this to http://127.0.0.1:8000 for local dev or your Render URL once deployed
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/v1/index-trends?route=DEL-BOM&lead_time=14`);
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch NAPIER index data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [API_URL]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Plane className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold tracking-tight">NAPIER</h1>
          </div>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-sm font-medium">
            Jevons Airfare Index
          </span>
        </header>

        {/* Analytics Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Airfare Inflation Trend (DEL - BOM)
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Scrubbed via IQR Anomaly detection • 14-day lead time
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Loading index metrics...
              </div>
            ) : data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="calculation_date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#f8fafc",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="jevons_index"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <span>No local index data returned. Make sure FastAPI server is running.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}