"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plane,
  Sparkles,
  Tag,
  BarChart2,
  Calendar,
  Zap,
  Info,
  Clock,
  CheckCircle2,
} from "lucide-react";

// Types
interface IndexTrendItem {
  calculation_date: string;
  jevons_index_value?: number;
  jevons_index?: number;
  estimated_price?: number;
}

interface AirlineOffer {
  id: string;
  airline: string;
  code: string;
  departureTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  badge: string;
  badgeType: "trending" | "cheaper" | "popular";
  sparklineData: { price: number }[];
}

const BASE_AIRFARE_INR = 5500;

export default function LiveMetricsPage() {
  const [data, setData] = useState<IndexTrendItem[]>([]);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("all");
  const [viewMode, setViewMode] = useState<"price" | "index">("price");

  // Extended timeline anchored dynamically to Sept 9, 2026
  useEffect(() => {
    const rawBackendData: IndexTrendItem[] = [
      { calculation_date: "2026-08-20", jevons_index_value: 95.4 },
      { calculation_date: "2026-08-22", jevons_index_value: 96.8 },
      { calculation_date: "2026-08-25", jevons_index_value: 98.2 },
      { calculation_date: "2026-08-27", jevons_index_value: 101.5 },
      { calculation_date: "2026-08-29", jevons_index_value: 99.8 },
      { calculation_date: "2026-08-31", jevons_index_value: 103.1 },
      { calculation_date: "2026-09-02", jevons_index_value: 102.4 },
      { calculation_date: "2026-09-04", jevons_index_value: 105.0 },
      { calculation_date: "2026-09-06", jevons_index_value: 104.2 },
      { calculation_date: "2026-09-08", jevons_index_value: 106.8 },
      { calculation_date: "2026-09-09", jevons_index_value: 107.5 },
    ];

    const formatted = rawBackendData.map((item) => {
      const idx = item.jevons_index_value ?? 100;
      return {
        ...item,
        jevons_index: Number(idx.toFixed(2)),
        estimated_price: Math.round(BASE_AIRFARE_INR * (idx / 100)),
      };
    });

    setData(formatted);
  }, []);

  // Filter main chart data based on selected timeframe
  const filteredData = React.useMemo(() => {
    if (timeframe === "7d") return data.slice(-4);
    if (timeframe === "30d") return data.slice(-8);
    return data;
  }, [data, timeframe]);

  // Per-airline real-time offers, sparklines, and smart tags
  const airlines: AirlineOffer[] = [
    {
      id: "1",
      airline: "IndiGo",
      code: "6E-204",
      departureTime: "06:15 AM - 08:30 AM",
      duration: "2h 15m (Non-stop)",
      price: 5499,
      availableSeats: 4,
      badge: "Trending / Best Price of the Day",
      badgeType: "trending",
      sparklineData: [
        { price: 5800 },
        { price: 5650 },
        { price: 5500 },
        { price: 5499 },
      ],
    },
    {
      id: "2",
      airline: "Air India",
      code: "AI-802",
      departureTime: "10:45 AM - 01:00 PM",
      duration: "2h 15m (Non-stop)",
      price: 5850,
      availableSeats: 9,
      badge: "Other Cheaper & Durable Offers Available",
      badgeType: "cheaper",
      sparklineData: [
        { price: 6100 },
        { price: 5900 },
        { price: 5950 },
        { price: 5850 },
      ],
    },
    {
      id: "3",
      airline: "Akasa Air",
      code: "QP-1102",
      departureTime: "04:30 PM - 06:40 PM",
      duration: "2h 10m (Non-stop)",
      price: 5299,
      availableSeats: 2,
      badge: "Lowest Price Deal",
      badgeType: "popular",
      sparklineData: [
        { price: 5500 },
        { price: 5400 },
        { price: 5350 },
        { price: 5299 },
      ],
    },
  ];

  // Calculated Metrics
  const currentPrice = data[data.length - 1]?.estimated_price ?? 0;
  const currentIndex = data[data.length - 1]?.jevons_index ?? 100;

  const prevPrice = data[data.length - 2]?.estimated_price ?? currentPrice;
  const priceDiff = currentPrice - prevPrice;
  const pricePercentChange = prevPrice
    ? ((priceDiff / prevPrice) * 100).toFixed(1)
    : "0.0";

  const prices = data.map((d) => d.estimated_price ?? 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
      {/* Panel Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Plane className="w-7 h-7 text-indigo-400" /> Live Analytics Panel
            </h1>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              Live Feed
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Realtime Basis Tracking & Dynamic Price Insights (Updated Sept 9, 2026)
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1">
          <button
            onClick={() => setViewMode("price")}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              viewMode === "price"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Price View (₹)
          </button>
          <button
            onClick={() => setViewMode("index")}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              viewMode === "index"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Jevons Index
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Current Airfare Basis</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{currentPrice.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{pricePercentChange}% over previous period</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Jevons Index Value</span>
            <BarChart2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{currentIndex}</div>
          <div className="text-xs text-slate-400">Baseline Target: 100.00</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Period Price Range</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{minPrice.toLocaleString("en-IN")} - ₹{maxPrice.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-400">Recorded low to high bounds</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Data Synchronization</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">Synced</div>
          <div className="text-xs text-slate-400">Latest record: Sept 9, 2026</div>
        </div>
      </div>

      {/* Main Interactive Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {viewMode === "price" ? "Realtime Airfare Trend (₹)" : "Jevons Index Velocity"}
            </h2>
            <p className="text-xs text-slate-400">
              {viewMode === "price"
                ? "Calculated price movements scaled against historic base fare"
                : "Realtime value relative to base consumer index benchmark"}
            </p>
          </div>

          {/* Timeframe Controls */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
            {(["7d", "30d", "all"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all uppercase ${
                  timeframe === tf
                    ? "bg-slate-800 text-indigo-400 font-bold border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="mainChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="calculation_date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "10px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
                }}
                labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey={viewMode === "price" ? "estimated_price" : "jevons_index"}
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#mainChartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Realtime Airline Listings & Micro-Trend Sparklines */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-400" /> Realtime Airline Price Listings
            </h2>
            <p className="text-xs text-slate-400">
              Live airline inventory featuring dynamic sparkline trends and seat capacity estimates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {airlines.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Details & Badges */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-white">{item.airline}</span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {item.departureTime}
                  </span>
                  <span>•</span>
                  <span>{item.duration}</span>
                </div>

                {/* Listing Comment / Tag */}
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                      item.badgeType === "trending"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : item.badgeType === "cheaper"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Center Micro Sparkline Graph */}
              <div className="flex flex-col items-start md:items-center gap-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  Realtime Trend
                </span>
                <div className="w-40 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.sparklineData}>
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="#10b981"
                        fillOpacity={0.12}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Price & Seat Clearance */}
              <div className="text-left md:text-right flex md:flex-col justify-between items-end gap-1 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                <div>
                  <div className="text-2xl font-bold text-white">
                    ₹{item.price.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-slate-500">per passenger</div>
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3" />
                  <span>{item.availableSeats} seats left at this fare</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Insight Note */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Live Telemetry Guidance:</span> Ticket availability counts use airline bucket threshold logic. Seat remaining indicators below 5 display clearance alerts to prioritize booking speed.
        </div>
      </div>
    </div>
  );
}
