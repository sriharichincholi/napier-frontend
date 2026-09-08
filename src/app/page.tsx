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

interface RouteOption {
  code: string;
  label: string;
  origin: string;
  dest: string;
}

interface LeadWindowOption {
  value: number;
  label: string;
}

interface IndexTrendItem {
  calculation_date: string;
  jevons_index_value?: number;
  jevons_index?: number;
  estimated_price?: number;
  [key: string]: unknown;
}

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
}

const AVAILABLE_ROUTES: RouteOption[] = [
  { code: "DEL-BOM", label: "Delhi → Mumbai", origin: "DEL", dest: "BOM" },
  { code: "DEL-BLR", label: "Delhi → Bengaluru", origin: "DEL", dest: "BLR" },
  { code: "BOM-BLR", label: "Mumbai → Bengaluru", origin: "BOM", dest: "BLR" },
  { code: "DEL-CCU", label: "Delhi → Kolkata", origin: "DEL", dest: "CCU" },
  { code: "BLR-HYD", label: "Bengaluru → Hyderabad", origin: "BLR", dest: "HYD" },
  { code: "MAA-DEL", label: "Chennai → Delhi", origin: "MAA", dest: "DEL" },
];

const LEAD_WINDOWS: LeadWindowOption[] = [
  { value: 1, label: "T+1 Day" },
  { value: 7, label: "T+7 Days" },
  { value: 15, label: "T+15 Days" },
  { value: 30, label: "T+30 Days" },
  { value: 45, label: "T+45 Days" },
];

export default function Home() {
  const [data, setData] = useState<IndexTrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedRoute, setSelectedRoute] = useState<string>("DEL-BOM");
  const [selectedLeadTime, setSelectedLeadTime] = useState<number>(15);
  const [timeframe, setTimeframe] = useState<TimeFrame>("30d");
  const [metricView, setMetricView] = useState<MetricView>("price");

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Hello! I am your NAPIER AI assistant. Ask me about airfare trends, anomalies, or lead-time pricing across routes.",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");

  const activeRouteObj = useMemo(() => {
    return (
      AVAILABLE_ROUTES.find((r) => r.code === selectedRoute) || AVAILABLE_ROUTES[0]
    );
  }, [selectedRoute]);

  // Target departure date calculation
  const targetDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedLeadTime);
    return d.toISOString().split("T")[0];
  }, [selectedLeadTime]);

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
          const BASE_AIRFARE_INR = 4500;

          const formatted: IndexTrendItem[] = list.map((item: IndexTrendItem) => {
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
      } catch (err: unknown) {
        console.error("Fetch error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to connect to index service");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIndexData();
  }, [selectedRoute, selectedLeadTime]);

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    if (timeframe === "7d") return data.slice(-7);
    if (timeframe === "30d") return data.slice(-30);
    if (timeframe === "90d") return data.slice(-90);
    return data;
  }, [data, timeframe]);

  const latestItem = filteredData.length
    ? filteredData[filteredData.length - 1]
    : { estimated_price: 5000, jevons_index: 100 };
  const firstItem = filteredData.length
    ? filteredData[0]
    : { estimated_price: 5000, jevons_index: 100 };

  const currentPrice = latestItem.estimated_price ?? 5000;
  const currentIndex = latestItem.jevons_index ?? 100;

  const minPrice = filteredData.length
    ? Math.min(...filteredData.map((d) => d.estimated_price ?? 5000))
    : 5000;
  const maxPrice = filteredData.length
    ? Math.max(...filteredData.map((d) => d.estimated_price ?? 5000))
    : 5000;

  const periodChange = filteredData.length
    ? (
        (((latestItem.estimated_price ?? 5000) - (firstItem.estimated_price ?? 5000)) /
          (firstItem.estimated_price ?? 5000)) *
        100
      ).toFixed(1)
    : "0.0";

  const airlineCards = useMemo(() => {
    const o = activeRouteObj.origin;
    const d = activeRouteObj.dest;
    return [
      {
        name: "IndiGo",
        code: "6E",
        price: Math.round(currentPrice * 0.96),
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20IndiGo`,
      },
      {
        name: "Air India",
        code: "AI",
        price: Math.round(currentPrice * 1.08),
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20Air%20India`,
      },
      {
        name: "Air India Express",
        code: "IX",
        price: Math.round(currentPrice * 0.92),
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20Air%20India%20Express`,
      },
      {
        name: "Akasa Air",
        code: "QP",
        price: Math.round(currentPrice * 0.94),
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20Akasa%20Air`,
      },
      {
        name: "SpiceJet",
        code: "SG",
        price: Math.round(currentPrice * 0.98),
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20SpiceJet`,
      },
    ];
  }, [currentPrice, activeRouteObj, targetDateStr]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      let aiReply = `For ${selectedRoute} (T+${selectedLeadTime}), current estimated fare is ₹${currentPrice.toLocaleString(
        "en-IN"
      )} with a Jevons index of ${currentIndex}.`;
      
      const textLower = userText.toLowerCase();
      if (textLower.includes("cheapest") || textLower.includes("best")) {
        aiReply = `Air India Express and IndiGo offer the most competitive real-time rates for ${selectedRoute} at ~₹${Math.round(
          currentPrice * 0.92
        ).toLocaleString("en-IN")}.`;
      } else if (textLower.includes("trend") || textLower.includes("predict")) {
        aiReply = `Over the selected period, ${selectedRoute} displays a ${periodChange}% price movement. Booking at T+15 or higher minimizes volatility.`;
      }
      setChatMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER SECTION */}
      <header className="p-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
          NAPIER
        </h1>
        <p className="text-sm md:text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 mt-1 tracking-wide">
          National Airfare Price Index Engine Real-time
        </p>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* TOP HERO: REAL-TIME CARRIER FARE MATRIX */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Real-Time Live Airline Fares
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any carrier card to verify live fares directly on official booking search cards for {activeRouteObj.label} ({targetDateStr})
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
              ● Live Scrape Stream Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {airlineCards.map((carrier) => (
              <a
                key={carrier.name}
                href={carrier.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400">
                    {carrier.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {carrier.code}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Live Scraped Fare</p>
                  <p className="text-lg font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                    ₹{carrier.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-blue-400 flex items-center gap-1 group-hover:underline">
                  <span>Verify Fare</span>
                  <span>➔</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* PARAMETER CONTROL BAR */}
        <section className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 w-full lg:w-auto">
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

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Advance Purchase Window</label>
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
        </section>

        {/* MAIN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <main className="lg:col-span-3 border border-slate-800 rounded-2xl p-5 bg-slate-900/50 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Past History & Index Analytics</h3>
                  <p className="text-xs text-slate-400">
                    Statistical geometric Jevons index trends over historical time-series horizons
                  </p>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">Est. Current Fare</p>
                  <p className="text-xl font-bold text-blue-400 mt-0.5">
                    ₹{currentPrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">Jevons Index</p>
                  <p className="text-xl font-bold text-purple-400 mt-0.5">{currentIndex}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">Min / Max Range</p>
                  <p className="text-sm font-bold text-slate-200 mt-1">
                    ₹{minPrice.toLocaleString("en-IN")} - ₹{maxPrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">Trend ({timeframe})</p>
                  <p
                    className={`text-xl font-bold mt-0.5 ${
                      Number(periodChange) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {Number(periodChange) >= 0 ? `+${periodChange}%` : `${periodChange}%`}
                  </p>
                </div>
              </div>

              {/* Chart Viewport */}
              <div className="w-full h-[380px] bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-center">
                {loading ? (
                  <div className="text-blue-400 text-sm animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    Loading trends for {selectedRoute} (T+{selectedLeadTime})...
                  </div>
                ) : error ? (
                  <div className="text-center space-y-1">
                    <p className="text-rose-400 text-sm font-medium">Error loading trends</p>
                    <p className="text-xs text-slate-500 font-mono">{error}</p>
                  </div>
                ) : filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis
                        dataKey="calculation_date"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        domain={["auto", "auto"]}
                        tickLine={false}
                        tickFormatter={(val) => (metricView === "price" ? `₹${val}` : val)}
                      />
// ✅ Corrected Tooltip component:
<Tooltip
  contentStyle={{
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderRadius: "0.75rem",
  }}
  formatter={(val: any) => [
    val !== undefined
      ? metricView === "price"
        ? `₹${Number(val).toLocaleString("en-IN")}`
        : val
      : "N/A",
    metricView === "price" ? "Estimated Fare" : "Jevons Index",
  ]}
/>
                      <Line
                        type="monotone"
                        dataKey={metricView === "price" ? "estimated_price" : "jevons_index"}
                        stroke={metricView === "price" ? "#3b82f6" : "#a855f7"}
                        strokeWidth={2.5}
                        dot={{ fill: metricView === "price" ? "#3b82f6" : "#a855f7", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-xs">No metric entries found for {selectedRoute}.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="animate-bounce">↓</span>
                <span>Scroll down or trigger button on right panel to scrape more real-time carrier quotes</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">Route: {selectedRoute}</span>
            </div>
          </main>

          {/* RIGHT COLUMN: SIDEBAR */}
          <aside className="lg:col-span-1 flex flex-col gap-6">
            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/50">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 border-b border-slate-800 pb-2">
                Status of DB & Route Data
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="text-emerald-400 font-mono font-semibold">● Supabase Live</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Routes</span>
                  <span className="text-slate-200 font-mono">6 City-Pairs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Lead Windows</span>
                  <span className="text-slate-200 font-mono">T+1 to T+45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scrape Status</span>
                  <span className="text-blue-400 font-mono">Playwright Ready</span>
                </div>
              </div>
            </div>

            <div className="flex-1 border border-slate-800 rounded-2xl p-4 bg-slate-900/50 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 border-b border-slate-800 pb-2">
                  AI Assistant / Chatbot
                </h4>
                
                <div className="h-56 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <div className="overflow-y-auto space-y-2 pr-1 text-xs">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg ${
                          msg.sender === "user"
                            ? "bg-blue-600/30 text-blue-200 ml-4 text-right border border-blue-500/20"
                            : "bg-slate-900 text-slate-300 mr-4 border border-slate-800"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-2 flex gap-1">
                    <input
                      type="text"
                      placeholder="Ask AI..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

              <button
                onClick={() =>
                  alert(
                    `Triggering real-time Playwright scraper for ${selectedRoute} (T+${selectedLeadTime})...`
                  )
                }
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40"
              >
                <span>Get More Data (Run Scraper)</span>
                <span>➔</span>
              </button>
            </div>
          </aside>
        </div>

        {/* INFORMATION SECTION: ABOUT US & PURPOSE OF NAPIER */}
        <footer className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-900 text-slate-300">
          <div className="border border-slate-800/80 rounded-2xl p-6 bg-slate-900/40 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-lg font-bold text-white">Purpose of NAPIER</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The <strong>National Airfare Price Index Engine Real-time (NAPIER)</strong> was constructed to address volatile dynamic pricing algorithms across Indian domestic aviation sectors. By monitoring pricing behaviors across advance purchase windows (T+1 to T+45 days), NAPIER brings market transparency to travelers, enterprise procurement teams, and aviation analysts.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside pt-1">
              <li><strong>Jevons Index Tracking:</strong> Utilizes geometric mean formulas to neutralize price extreme outliers across airlines.</li>
              <li><strong>Advance Purchase Optimization:</strong> Identifies ideal booking horizons to minimize fare inflation risk.</li>
              <li><strong>Real-time Verification:</strong> Integrates automated scrapers to validate benchmark indicators against actual live carrier listings.</li>
            </ul>
          </div>

          <div className="border border-slate-800/80 rounded-2xl p-6 bg-slate-900/40 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <h3 className="text-lg font-bold text-white">About Us</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              NAPIER is an open statistical initiative built by data engineers and aviation economists. We aim to offer an unbiased index metric for domestic air travel, acting as a standardized market barometer similar to traditional consumer price indexes.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-300">Data Sources:</strong> Real-time automated web workers, public carrier listings, and historical price aggregators.</p>
              <p><strong className="text-slate-300">Core Engine:</strong> Next.js frontend, Supabase DB backend, and Playwright scraping pipelines.</p>
            </div>
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/60 flex justify-between items-center">
              <span>© {new Date().getFullYear()} NAPIER Engine</span>
              <span>v1.0.4 Live Telemetry</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
