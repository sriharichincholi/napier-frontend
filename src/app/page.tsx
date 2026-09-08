"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface AirlineCard {
  name: string;
  code: string;
  price: number;
  change: string;
  isLowest?: boolean;
  reliability: number;
  stops: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
}

interface HistoricalDataPoint {
  day: string;
  indigo: number;
  airIndia: number;
  vistara: number;
  akasa: number;
  index: number;
}

interface RouteOption {
  label: string;
  value: string;
  origin: string;
  dest: string;
  distanceKm: number;
  avgFlightsPerDay: number;
}

// ==========================================
// EMBEDDED SVG ICONS (NO DEPENDENCY ERRORS)
// ==========================================
const IconPlane = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const IconSparkles = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const IconTrendingUp = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconTrendingDown = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const IconInfo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSend = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const IconRefresh = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconFilter = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const IconClock = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLayers = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const IconBarChart = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function NAPIERDashboard() {
  // Navigation & Filter States
  const [selectedRoute, setSelectedRoute] = useState("DEL-BOM");
  const [selectedLeadTime, setSelectedLeadTime] = useState("15");
  const [timeframe, setTimeframe] = useState("30D");
  const [cabinClass, setCabinClass] = useState("Economy");
  const [showIndexInfo, setShowIndexInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "breakdown">("overview");

  // Chat Assistant States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello! I am your NAPIER AI assistant. Ask me about airfare trends, price predictions, or optimal booking windows.",
      timestamp: "10:00 AM",
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Master Route Configuration
  const routes: RouteOption[] = [
    { label: "DEL → BOM", value: "DEL-BOM", origin: "Delhi (DEL)", dest: "Mumbai (BOM)", distanceKm: 1148, avgFlightsPerDay: 68 },
    { label: "BLR → DEL", value: "BLR-DEL", origin: "Bengaluru (BLR)", dest: "Delhi (DEL)", distanceKm: 1740, avgFlightsPerDay: 52 },
    { label: "BOM → MAA", value: "BOM-MAA", origin: "Mumbai (BOM)", dest: "Chennai (MAA)", distanceKm: 1028, avgFlightsPerDay: 34 },
    { label: "CCU → DEL", value: "CCU-DEL", origin: "Kolkata (CCU)", dest: "Delhi (DEL)", distanceKm: 1305, avgFlightsPerDay: 41 },
  ];

  const leadTimes = ["7", "15", "30", "60"];

  // Dynamic Route Metrics Calculation
  const routeMetrics = useMemo(() => {
    const basePrices: Record<string, number> = {
      "DEL-BOM": 5342,
      "BLR-DEL": 6120,
      "BOM-MAA": 4290,
      "CCU-DEL": 5800,
    };

    const multiplier = Number(selectedLeadTime) < 15 ? 1.28 : Number(selectedLeadTime) > 30 ? 0.82 : 1.0;
    const classMultiplier = cabinClass === "Business" ? 3.2 : cabinClass === "Premium Economy" ? 1.6 : 1.0;

    const base = basePrices[selectedRoute] || 5000;
    const currentPrice = Math.round(base * multiplier * classMultiplier);
    const currentIndex = Number((100 + (currentPrice - 5000) / 45).toFixed(2));

    return {
      currentPrice,
      currentIndex,
      periodChange: selectedLeadTime === "7" ? "+8.4" : "-2.1",
      optimalWindow: "18 - 24 Days",
      volatility: Number(selectedLeadTime) < 15 ? "High" : "Moderate",
      confidenceScore: 94.2,
    };
  }, [selectedRoute, selectedLeadTime, cabinClass]);

  // Dynamic Airline Fare List
  const airlineCards: AirlineCard[] = useMemo(() => {
    const base = routeMetrics.currentPrice;
    const list: AirlineCard[] = [
      {
        name: "IndiGo",
        code: "6E",
        price: Math.round(base * 0.91),
        change: "-2.1%",
        reliability: 92,
        stops: "Non-stop",
        duration: "2h 10m",
        departureTime: "06:00 AM",
        arrivalTime: "08:10 AM",
      },
      {
        name: "Air India",
        code: "AI",
        price: Math.round(base * 1.05),
        change: "+1.5%",
        reliability: 84,
        stops: "Non-stop",
        duration: "2h 15m",
        departureTime: "09:30 AM",
        arrivalTime: "11:45 AM",
      },
      {
        name: "Vistara",
        code: "UK",
        price: Math.round(base * 1.1),
        change: "+3.8%",
        reliability: 95,
        stops: "Non-stop",
        duration: "2h 05m",
        departureTime: "04:15 PM",
        arrivalTime: "06:20 PM",
      },
      {
        name: "Akasa Air",
        code: "QP",
        price: Math.round(base * 0.94),
        change: "-0.8%",
        reliability: 88,
        stops: "Non-stop",
        duration: "2h 20m",
        departureTime: "08:45 PM",
        arrivalTime: "11:05 PM",
      },
    ];

    const minPrice = Math.min(...list.map((item) => item.price));
    return list.map((item) => ({
      ...item,
      isLowest: item.price === minPrice,
    }));
  }, [routeMetrics.currentPrice]);

  // Lead-time progression table data
  const trendData: HistoricalDataPoint[] = useMemo(() => {
    const base = routeMetrics.currentPrice;
    return [
      { day: "T-60", indigo: Math.round(base * 0.78), airIndia: Math.round(base * 0.85), vistara: Math.round(base * 0.9), akasa: Math.round(base * 0.8), index: 94.2 },
      { day: "T-45", indigo: Math.round(base * 0.82), airIndia: Math.round(base * 0.88), vistara: Math.round(base * 0.93), akasa: Math.round(base * 0.83), index: 97.5 },
      { day: "T-30", indigo: Math.round(base * 0.88), airIndia: Math.round(base * 0.92), vistara: Math.round(base * 0.98), akasa: Math.round(base * 0.89), index: 101.8 },
      { day: "T-20", indigo: Math.round(base * 0.91), airIndia: Math.round(base * 0.98), vistara: Math.round(base * 1.02), akasa: Math.round(base * 0.93), index: 106.4 },
      { day: "T-15", indigo: Math.round(base * 0.95), airIndia: Math.round(base * 1.05), vistara: Math.round(base * 1.1), akasa: Math.round(base * 0.97), index: routeMetrics.currentIndex },
      { day: "T-7", indigo: Math.round(base * 1.25), airIndia: Math.round(base * 1.35), vistara: Math.round(base * 1.42), akasa: Math.round(base * 1.28), index: 138.9 },
      { day: "T-3", indigo: Math.round(base * 1.6), airIndia: Math.round(base * 1.72), vistara: Math.round(base * 1.85), akasa: Math.round(base * 1.64), index: 172.1 },
    ];
  }, [routeMetrics.currentPrice, routeMetrics.currentIndex]);

  // AI Reactive Handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      timestamp: timeString,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Simulate AI thinking and reply matching intent
    setTimeout(() => {
      const textLower = userText.toLowerCase().trim();
      let aiReply = "";

      // 1. Reactive Greetings
      if (/^(hi|hello|hey|greetings|hola|good\s?(morning|afternoon|evening))/i.test(textLower)) {
        aiReply = `Hello! How can I assist you with ${selectedRoute} airfare data or general flight insights today?`;
      }
      // 2. Lowest/Cheapest Fare Queries
      else if (textLower.includes("cheap") || textLower.includes("best fare") || textLower.includes("lowest")) {
        const cheapestCarrier = airlineCards.reduce((min, c) => (c.price < min.price ? c : min), airlineCards[0]);
        aiReply = `Currently, the lowest fare found for ${selectedRoute} (T+${selectedLeadTime}) is ₹${cheapestCarrier.price.toLocaleString("en-IN")} offered by ${cheapestCarrier.name}.`;
      }
      // 3. Jevons Index Queries
      else if (textLower.includes("jevons") || textLower.includes("index") || textLower.includes("formula")) {
        aiReply = `The Jevons Index uses a geometric mean to baseline airfare price shifts while eliminating extreme single-airline spikes. The current index for ${selectedRoute} is ${routeMetrics.currentIndex}.`;
      }
      // 4. Trend & Fare Prediction Queries
      else if (textLower.includes("trend") || textLower.includes("predict") || textLower.includes("price") || textLower.includes("fare")) {
        aiReply = `For ${selectedRoute} at T+${selectedLeadTime} days out, the estimated average fare is ₹${routeMetrics.currentPrice.toLocaleString("en-IN")}. The historical trend shows a ${routeMetrics.periodChange}% change over the last ${timeframe}.`;
      }
      // 5. Default Fallback
      else {
        aiReply = `I analyzed your query: "${userText}". I can help you compare carriers, evaluate Jevons index trends, or find optimal booking windows for ${selectedRoute}. What would you like to explore?`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 400);
  };

  const activeRouteDetails = routes.find((r) => r.value === selectedRoute) || routes[0];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-800/80">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600/20 p-2.5 rounded-xl border border-purple-500/30">
              <IconPlane className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-white tracking-wide">NAPIER</h1>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  v2.4 REALTIME
                </span>
              </div>
              <p className="text-xs text-slate-400">Jevons Geometric Airfare Index & Prediction Engine</p>
            </div>
          </div>

          {/* Quick Route Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {routes.map((route) => (
              <button
                key={route.value}
                onClick={() => setSelectedRoute(route.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRoute === route.value
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {route.label}
              </button>
            ))}
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-6 space-y-6 flex-1">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <IconClock className="w-3.5 h-3.5 text-purple-400" /> Lead Time (T+):
                </span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {leadTimes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedLeadTime(t)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedLeadTime === t
                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <IconFilter className="w-3.5 h-3.5 text-purple-400" /> Cabin:
                </span>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Window:</span>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {["7D", "30D", "90D"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      timeframe === tf ? "bg-slate-800 text-purple-400 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Est. Average Fare ({selectedRoute})</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-white">
                  ₹{routeMetrics.currentPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  <IconTrendingUp className="w-3 h-3" /> {routeMetrics.periodChange}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Weighted average for T+{selectedLeadTime} departure</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Jevons Price Index</p>
                <button
                  onClick={() => setShowIndexInfo(!showIndexInfo)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <IconInfo className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-purple-400">{routeMetrics.currentIndex}</span>
                <span className="text-xs text-slate-400">Baseline: 100</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Geometric mean index (spike-resistant)</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Optimal Booking Window</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-indigo-400">{routeMetrics.optimalWindow}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Lowest expected yield volatility zone</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Market Volatility Rating</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-amber-400">{routeMetrics.volatility}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Based on carrier pricing spread</p>
            </div>
          </div>

          {/* Jevons Explanation Banner */}
          {showIndexInfo && (
            <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl flex items-start gap-3">
              <IconInfo className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-200/80 leading-relaxed">
                <p className="font-semibold text-purple-300 mb-1">What is the Jevons Index?</p>
                The Jevons Price Index is an elementary price index calculated as the unweighted geometric mean of price ratios. In airfare analytics, it prevents artificial inflation caused by last-minute premium price spikes on single carriers, offering a true picture of market movement.
              </div>
            </div>
          )}

          {/* View Tab Selectors */}
          <div className="flex border-b border-slate-800 gap-6 text-xs font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-purple-500 text-purple-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Carrier Fares
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 transition-colors border-b-2 ${
                activeTab === "analytics"
                  ? "border-purple-500 text-purple-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Historical Progression
            </button>
            <button
              onClick={() => setActiveTab("breakdown")}
              className={`pb-3 transition-colors border-b-2 ${
                activeTab === "breakdown"
                  ? "border-purple-500 text-purple-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Route Details
            </button>
          </div>

          {/* Tab 1: Carrier Comparison */}
          {activeTab === "overview" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <IconBarChart className="w-4 h-4 text-purple-400" /> Carrier Comparison ({selectedRoute})
                </h2>
                <span className="text-xs text-slate-500">Live fares for T+{selectedLeadTime} Days</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {airlineCards.map((carrier) => (
                  <div
                    key={carrier.code}
                    className={`p-4 rounded-2xl border transition-all duration-200 relative ${
                      carrier.isLowest
                        ? "border-purple-500/50 bg-purple-950/10 shadow-lg shadow-purple-900/10"
                        : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700"
                    }`}
                  >
                    {carrier.isLowest && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                        CHEAPEST
                      </span>
                    )}
                    <div className="text-xs text-slate-400 font-semibold">{carrier.name} ({carrier.code})</div>
                    <div className="text-2xl font-bold text-white mt-2">₹{carrier.price.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{carrier.departureTime} • {carrier.duration}</div>
                    <div className="flex items-center justify-between mt-3 text-xs border-t border-slate-800/60 pt-2">
                      <span className={carrier.change.startsWith("-") ? "text-emerald-400" : "text-rose-400"}>
                        {carrier.change} vs avg
                      </span>
                      <span className="text-slate-500">{carrier.reliability}% OTP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Historical Lead Time Table */}
          {activeTab === "analytics" && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <IconLayers className="w-4 h-4 text-purple-400" /> Lead Time Progression Trend (T-60 to T-0)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Lead Time</th>
                      <th className="pb-3 font-semibold">IndiGo</th>
                      <th className="pb-3 font-semibold">Air India</th>
                      <th className="pb-3 font-semibold">Vistara</th>
                      <th className="pb-3 font-semibold">Akasa Air</th>
                      <th className="pb-3 font-semibold">Jevons Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {trendData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 font-mono text-purple-400">{row.day}</td>
                        <td className="py-2.5">₹{row.indigo.toLocaleString("en-IN")}</td>
                        <td className="py-2.5">₹{row.airIndia.toLocaleString("en-IN")}</td>
                        <td className="py-2.5">₹{row.vistara.toLocaleString("en-IN")}</td>
                        <td className="py-2.5">₹{row.akasa.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 font-bold text-slate-100">{row.index}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Route Details */}
          {activeTab === "breakdown" && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">Route Specifications: {activeRouteDetails.label}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Origin</span>
                  <span className="font-semibold text-slate-200">{activeRouteDetails.origin}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Destination</span>
                  <span className="font-semibold text-slate-200">{activeRouteDetails.dest}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Distance</span>
                  <span className="font-semibold text-slate-200">{activeRouteDetails.distanceKm} km</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block">Daily Flights</span>
                  <span className="font-semibold text-slate-200">~{activeRouteDetails.avgFlightsPerDay} Flights/Day</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar - Reactive AI Assistant */}
      <aside className="w-80 lg:w-96 border-l border-slate-800 bg-slate-900/80 flex flex-col h-full backdrop-blur-md shrink-0">
        {/* Assistant Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <IconSparkles className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-sm text-white">NAPIER AI Assistant</h2>
          </div>
          <button
            onClick={() => setChatMessages([chatMessages[0]])}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear Chat"
          >
            <IconRefresh className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chat Messages Container with Correct Bubbles */}
        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-950/50 flex flex-col">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-purple-600 text-white rounded-br-xs shadow-md shadow-purple-600/20"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs shadow-md"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 border-t border-slate-800/60 bg-slate-950/40 flex gap-1.5 overflow-x-auto">
          {["Cheapest fare?", "Jevons formula?", "Price trend?"].map((chip) => (
            <button
              key={chip}
              onClick={() => setChatInput(chip)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-[11px] text-slate-400 whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about fares, trends..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20"
          >
            <IconSend className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
}
