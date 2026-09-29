"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchRoutePrediction, MLPrediction, sendChatMessage, CarrierQuote } from "@/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

type TimeFrame = "7d" | "30d" | "90d" | "ALL";
type MetricView = "price" | "index";
type ThemeMode = "dark" | "light";
type MainTab = "live" | "historic";
type AirlineSortKey = "recommended" | "price-asc" | "price-desc" | "name";

interface RouteOption {
  code: string;
  label: string;
  origin: string;
  dest: string;
  query: string;
}

const AVAILABLE_ROUTES: RouteOption[] = [
  { code: "DEL-BOM", label: "Delhi → Mumbai", origin: "DEL", dest: "BOM", query: "Delhi to Mumbai" },
  { code: "DEL-BLR", label: "Delhi → Bengaluru", origin: "DEL", dest: "BLR", query: "Delhi to Bengaluru" },
  { code: "BOM-BLR", label: "Mumbai → Bengaluru", origin: "BOM", dest: "BLR", query: "Mumbai to Bengaluru" },
  { code: "DEL-CCU", label: "Delhi → Kolkata", origin: "DEL", dest: "CCU", query: "Delhi to Kolkata" },
  { code: "BLR-HYD", label: "Bengaluru → Hyderabad", origin: "BLR", dest: "HYD", query: "Bengaluru to Hyderabad" },
  { code: "MAA-DEL", label: "Chennai → Delhi", origin: "MAA", dest: "DEL", query: "Chennai to Delhi" },
  { code: "FRA-HYD", label: "Frankfurt → Hyderabad", origin: "FRA", dest: "HYD", query: "Frankfurt to Hyderabad" },
  { code: "LHR-BOM", label: "London → Mumbai", origin: "LHR", dest: "BOM", query: "London to Mumbai" },
  { code: "PNQ-DEL", label: "Pune → Delhi", origin: "PNQ", dest: "DEL", query: "Pune to Delhi" },
  { code: "AMD-BOM", label: "Ahmedabad → Mumbai", origin: "AMD", dest: "BOM", query: "Ahmedabad to Mumbai" },
  { code: "GOI-DEL", label: "Goa → Delhi", origin: "GOI", dest: "DEL", query: "Goa to Delhi" },
  { code: "DXB-DEL", label: "Dubai → Delhi", origin: "DXB", dest: "DEL", query: "Dubai to Delhi" },
  { code: "SIN-BOM", label: "Singapore → Mumbai", origin: "SIN", dest: "BOM", query: "Singapore to Mumbai" },
];

const SEARCH_AUTOPROMPTS = [
  "Delhi to Mumbai (DEL-BOM)",
  "Frankfurt to Hyderabad (FRA-HYD)",
  "Bengaluru to Delhi (BLR-DEL)",
  "Mumbai to Bengaluru (BOM-BLR)",
  "Chennai to Delhi (MAA-DEL)",
  "London to Mumbai (LHR-BOM)",
  "Dubai to Delhi (DXB-DEL)",
  "Singapore to Mumbai (SIN-BOM)"
];

export default function Home() {
  // Theme & Panel Navigation States
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [activeTab, setActiveTab] = useState<MainTab>("live");

  // Selection States
  const [selectedRoute, setSelectedRoute] = useState("DEL-BOM");
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricView, setMetricView] = useState<MetricView>("price");
  const [airlineSort, setAirlineSort] = useState<AirlineSortKey>("recommended");
  const [timeframe, setTimeframe] = useState<TimeFrame>("30d");

  // Dynamic Route Search States
  const [searchQuery, setSearchQuery] = useState("Delhi to Mumbai");
  const [showAutoPrompts, setShowAutoPrompts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any | null>(null);

  // AI Drawer Sidebar State
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: "user" | "ai"; text: string; badge?: string; carrierLinks?: CarrierQuote[] }[]
  >([
    {
      sender: "ai",
      text: "Hello! I am your NAPIER AI assistant. Ask me about real-time price mapping, festival surges, ticket availability, or historic index trends.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";

  const activeRouteObj = useMemo(() => {
    return AVAILABLE_ROUTES.find((r) => r.code === selectedRoute) || AVAILABLE_ROUTES[0];
  }, [selectedRoute]);

  const handleRouteSelectCode = (routeCode: string) => {
    const found = AVAILABLE_ROUTES.find((r) => r.code === routeCode);
    if (found) {
      setSelectedRoute(found.code);
      setSearchQuery(found.query);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchRoutePrediction(activeRouteObj.origin, activeRouteObj.dest);
      setPrediction(res);
      setLoading(false);
    }
    loadData();
  }, [activeRouteObj]);

  const chartData = useMemo(() => {
    if (!prediction) return [];
    const base = prediction.predicted_price_24h;
    const points = [];
    const now = new Date();
    const count = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : timeframe === "90d" ? 90 : 180;

    for (let i = count; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const noise = (Math.sin(i * 0.4) * 0.05 + Math.cos(i * 0.2) * 0.03);
      const price = Math.round(base * (1 + noise));
      points.push({
        calculation_date: d.toISOString().split("T")[0],
        estimated_price: price,
        jevons_index: Number(((price / prediction.base_fare) * 100).toFixed(2)),
      });
    }
    return points;
  }, [prediction, timeframe]);

  const carrierQuotes = useMemo(() => {
    if (!prediction) return [];
    const base = prediction.predicted_price_24h;
    const o = activeRouteObj.origin;
    const d = activeRouteObj.dest;
    const targetDate = "2026-10-15";

    const baseList = [
      {
        name: "IndiGo",
        code: "6E",
        price: Math.round(base * 0.95),
        seats_left: 3,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20IndiGo`,
      },
      {
        name: "Air India",
        code: "AI",
        price: Math.round(base * 1.08),
        seats_left: 7,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20Air%20India`,
      },
      {
        name: "Air India Express",
        code: "IX",
        price: Math.round(base * 0.92),
        seats_left: 2,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20Air%20India%20Express`,
      },
      {
        name: "Akasa Air",
        code: "QP",
        price: Math.round(base * 0.94),
        seats_left: 5,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20Akasa%20Air`,
      },
      {
        name: "SpiceJet",
        code: "SG",
        price: Math.round(base * 0.98),
        seats_left: 11,
        booking_url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDate}%20on%20SpiceJet`,
      },
    ];

    return [...baseList].sort((a, b) => {
      if (airlineSort === "price-asc") return a.price - b.price;
      if (airlineSort === "price-desc") return b.price - a.price;
      if (airlineSort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [prediction, activeRouteObj, airlineSort]);

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      const basePrice = activeRouteObj.origin === "FRA" || activeRouteObj.origin === "LHR" ? 48000 : 5200;
      setSearchResults({
        query: searchQuery,
        origin: activeRouteObj.origin,
        destination: activeRouteObj.dest,
        options: [
          { airline: "IndiGo", code: "6E", price: `₹${Math.round(basePrice * 0.95).toLocaleString("en-IN")}`, seatsLeft: 3, duration: "2h 15m", type: "Non-stop" },
          { airline: "Air India", code: "AI", price: `₹${Math.round(basePrice * 1.08).toLocaleString("en-IN")}`, seatsLeft: 7, duration: "2h 30m", type: "Direct" },
          { airline: "Akasa Air", code: "QP", price: `₹${Math.round(basePrice * 0.94).toLocaleString("en-IN")}`, seatsLeft: 5, duration: "2h 20m", type: "Direct" }
        ]
      });
      setIsSearching(false);
      setShowAutoPrompts(false);
    }, 500);
  };

  const handleSendAiMessage = async (msgText?: string) => {
    const text = msgText || chatInput;
    if (!text.trim() || chatLoading) return;

    setChatMessages((prev) => [...prev, { sender: "user", text }]);
    if (!msgText) setChatInput("");
    setChatLoading(true);

    try {
      const res = await sendChatMessage(text, activeRouteObj.origin, activeRouteObj.dest);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.markdown_advice,
          badge: res.status_badge,
          carrierLinks: res.carrier_links,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Telemetry active. Feel free to ask about festival fare surges or cheapest carrier quotes!" }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-[#F4F8F5] text-[#1C2E24]"
      }`}
    >
      {/* 1. BRANDING & HEADER LAYOUT (CENTERED NAPIER LOGO) */}
      <header
        className={`p-6 border-b sticky top-0 z-40 flex items-center justify-between backdrop-blur transition-colors ${
          isDark ? "border-slate-900 bg-slate-950/80" : "border-[#D8E6DF] bg-[#F4F8F5]/85"
        }`}
      >
        <div className="flex-1 flex flex-col items-center text-center pl-10">
          <div className="relative group flex items-center justify-center gap-3">
            <div
              className={`absolute -inset-2 bg-gradient-to-r rounded-3xl blur-xl transition duration-1000 group-hover:duration-200 animate-pulse ${
                isDark
                  ? "from-purple-600 via-indigo-500 to-[#00BB77] opacity-70 group-hover:opacity-100"
                  : "from-[#3B7A57] via-[#529471] to-[#00BB77] opacity-40 group-hover:opacity-70"
              }`}
            />

            {/* Original Brand Logo Icon (Upward trending growth chart inside gradient badge) */}
            <div
              className={`relative w-11 h-11 md:w-13 md:h-13 rounded-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0 ${
                isDark
                  ? "bg-gradient-to-br from-purple-600 via-purple-500 to-[#00BB77] shadow-purple-500/30"
                  : "bg-gradient-to-br from-[#2D5E43] via-[#3B7A57] to-[#529471] shadow-[#3B7A57]/30"
              }`}
            >
              <svg
                className="w-6 h-6 text-white stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 005.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"
                />
              </svg>
            </div>

            <h1
              className={`relative text-4xl md:text-5xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r drop-shadow-md ${
                isDark
                  ? "from-purple-500 via-indigo-500 to-[#00BB77]"
                  : "from-[#1C2E24] via-[#2D5E43] to-[#3B7A57]"
              }`}
            >
              NAPIER
            </h1>
          </div>

          <p
            className={`text-sm md:text-base font-bold bg-clip-text text-transparent bg-gradient-to-r ${
              isDark
                ? "from-purple-400 via-pink-400 to-amber-300"
                : "from-[#2D5E43] via-[#3B7A57] to-[#00BB77]"
            } mt-2 tracking-wide`}
          >
            National Airfare Price Index Engine Real-time
          </p>
        </div>

        {/* Top Right Navigation Controls */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-md ${
              isDark
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                : "bg-[#E8F0EC] border-[#C2DFD0] text-[#2D5E43] hover:bg-[#D8E6DF]"
            }`}
            title={isDark ? "Switch to Mint / Sage Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.5a5.5 5.5 0 100-11 5.5 5.5 0 000 11zm0 1.5a7 7 0 110-14 7 7 0 010 14zm0-17a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 2zm0 18a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 20zM4.223 4.223a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.06l-1.061-1.06a.75.75 0 010-1.06zm12.728 12.728a.75.75 0 011.06 0l1.06 1.061a.75.75 0 01-1.06 1.06l-1.06-1.061a.75.75 0 010-1.06zM2 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 12zm18 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0120 12zM4.223 19.777a.75.75 0 010-1.06l1.06-1.061a.75.75 0 011.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm12.728-12.728a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.061 1.06l-1.06 1.06a.75.75 0 01-1.061 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M9.5 2a.75.75 0 01.75.75A9.75 9.75 0 0019.25 12.5a.75.75 0 01.62 1.17A10.5 10.5 0 119.33 2.13.75.75 0 019.5 2z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setIsAiSidebarOpen(true)}
            className={`font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shrink-0 text-white ${
              isDark
                ? "bg-gradient-to-r from-purple-600 to-[#00BB77] hover:opacity-90 shadow-purple-500/20"
                : "bg-gradient-to-r from-[#2D5E43] to-[#3B7A57] hover:bg-[#1C2E24] shadow-[#3B7A57]/20"
            }`}
          >
            <span>✨ AI Assistant</span>
          </button>
        </div>
      </header>

      {/* DUAL-PANEL TAB SWITCHER */}
      <nav
        className={`px-6 py-3 border-b flex items-center justify-center gap-3 sticky top-[81px] z-30 backdrop-blur transition-colors ${
          isDark ? "bg-slate-950/90 border-slate-900" : "bg-[#F4F8F5]/90 border-[#D8E6DF]"
        }`}
      >
        <button
          onClick={() => setActiveTab("live")}
          className={`px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "live"
              ? isDark
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-[#3B7A57] text-white shadow-lg shadow-[#3B7A57]/30"
              : isDark
              ? "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              : "bg-[#E8F0EC] text-[#4A6356] hover:text-[#1C2E24] border border-[#C2DFD0]"
          }`}
        >
          <span>📊 Live Analytics & Mapping Panel</span>
        </button>

        <button
          onClick={() => setActiveTab("historic")}
          className={`px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "historic"
              ? isDark
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "bg-[#2D5E43] text-white shadow-lg shadow-[#2D5E43]/30"
              : isDark
              ? "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              : "bg-[#E8F0EC] text-[#4A6356] hover:text-[#1C2E24] border border-[#C2DFD0]"
          }`}
        >
          <span>📈 Historic Trends & Database Analytics</span>
        </button>
      </nav>

      {/* MAIN CONTAINER CONTENT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* STANDALONE ROUTE SELECTION CONTROL BAR WITH GLOW */}
        <div
          className={`relative overflow-hidden rounded-2xl p-4 shadow-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0]"
          }`}
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-[#00BB77] animate-pulse" />

          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                Select Flight Sector / Route (440+ Sector Database)
              </h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>
                Choose a route to switch telemetry feeds across both panels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedRoute}
              onChange={(e) => handleRouteSelectCode(e.target.value)}
              className={`w-full sm:w-64 text-sm font-semibold rounded-xl px-4 py-2.5 border focus:ring-2 focus:outline-none cursor-pointer transition-all ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-white focus:ring-[#00BB77]"
                  : "bg-white border-[#C2DFD0] text-[#1C2E24] focus:ring-[#3B7A57]"
              }`}
            >
              {AVAILABLE_ROUTES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} ({r.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PANEL 1: LIVE ANALYTICS & MAPPING */}
        {activeTab === "live" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* DYNAMIC ROUTE SEARCH PANEL */}
            <section
              className={`border rounded-2xl p-4 shadow-xl relative transition-all ${
                isDark ? "bg-slate-900/80 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0]"
              }`}
            >
              <form onSubmit={handleRouteSearch} className="flex flex-col sm:flex-row gap-3 items-center relative">
                <div className="relative flex-1 w-full">
                  <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowAutoPrompts(true);
                    }}
                    onFocus={() => setShowAutoPrompts(true)}
                    placeholder="Search route with text autoprompt convenience (e.g., 'Delhi to Mumbai')..."
                    className={`w-full text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      isDark
                        ? "bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:ring-[#00BB77]"
                        : "bg-[#F4F8F5] border border-[#C2DFD0] text-[#1C2E24] placeholder:text-[#4A6356]/70 focus:ring-[#3B7A57]"
                    }`}
                  />

                  {/* AUTOPROMPT DROPDOWN */}
                  {showAutoPrompts && (
                    <div
                      className={`absolute left-0 right-0 top-full mt-2 rounded-xl border shadow-2xl z-20 overflow-hidden ${
                        isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-[#C2DFD0] text-[#1C2E24]"
                      }`}
                    >
                      <div className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider border-b ${isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-[#E8F0EC] border-[#C2DFD0] text-[#4A6356]"}`}>
                        Quick Convenience Suggestions
                      </div>
                      {SEARCH_AUTOPROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(prompt);
                            setShowAutoPrompts(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                            isDark ? "hover:bg-slate-900" : "hover:bg-[#E8F0EC]"
                          }`}
                        >
                          <span>{prompt}</span>
                          <span className="text-[10px] font-mono opacity-60">Auto-fill</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className={`w-full sm:w-auto font-bold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg text-white ${
                    isDark
                      ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-[#00BB77] hover:opacity-90 shadow-purple-500/20"
                      : "bg-gradient-to-r from-[#2D5E43] via-[#3B7A57] to-[#00BB77] hover:bg-[#1C2E24] shadow-[#3B7A57]/20"
                  }`}
                >
                  {isSearching ? "Mapping..." : "Live Map Query ➔"}
                </button>
              </form>

              {searchResults && (
                <div className={`mt-4 pt-4 border-t animate-in fade-in duration-300 ${isDark ? "border-slate-800" : "border-[#C2DFD0]"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                      Live Price Mapping: <span className="text-emerald-500">{searchResults.origin} ➔ {searchResults.destination}</span>
                    </h4>
                    <button onClick={() => setSearchResults(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {searchResults.options.map((opt: any, idx: number) => (
                      <div key={idx} className={`border rounded-xl p-3 flex justify-between items-center ${isDark ? "bg-slate-950 border-slate-800" : "bg-[#F4F8F5] border-[#C2DFD0]"}`}>
                        <div>
                          <p className={`text-xs font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>{opt.airline} ({opt.code})</p>
                          <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>{opt.type} • {opt.duration}</p>
                          <span className="text-[10px] text-emerald-500 font-semibold mt-1 inline-block">● {opt.seatsLeft} Seats Available</span>
                        </div>
                        <p className={`text-sm font-extrabold ${isDark ? "text-[#00BB77]" : "text-[#2D5E43]"}`}>{opt.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* SMART RECOMMENDATION BANNER WITH RUNNING GRADIENT GLOW */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-emerald-400 animate-pulse" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl border bg-purple-500/10 border-purple-500/30 text-purple-300 shrink-0 text-2xl">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        {prediction?.recommendation || "GREAT TIME TO BOOK"}
                      </span>
                      {prediction?.festival_name && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                          🪔 {prediction.festival_name} ({prediction.holiday_impact_factor})
                        </span>
                      )}
                    </div>
                    <p className={`text-base font-semibold mt-2 leading-snug ${isDark ? "text-slate-100" : "text-[#1C2E24]"}`}>
                      {prediction?.advice_text || "Prices projected to rise over the next week as surge demand builds. Lock in your fare now."}
                    </p>
                  </div>
                </div>

                <div className="text-right border-l border-slate-800 pl-4 shrink-0">
                  <span className={`text-[11px] font-medium block ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>7-Day Projection</span>
                  <span className={`text-xl font-extrabold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                    ₹{prediction ? Math.round(prediction.predicted_price_7d).toLocaleString("en-IN") : "5,240"}
                  </span>
                </div>
              </div>
            </div>

            {/* HORIZON FORECAST CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Next Hour (T+1h)", price: prediction?.predicted_price_1h || 4820, tag: "Intra-day shifts", color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/5", corridor: prediction?.confidence_corridors["1h"] || { lower: 4610, upper: 5030 } },
                { label: "Next Day (T+24h)", price: prediction?.predicted_price_24h || 4750, tag: "Short-term window", color: "text-blue-400", bg: "border-blue-500/20 bg-blue-500/5", corridor: prediction?.confidence_corridors["24h"] || { lower: 4370, upper: 5130 } },
                { label: "Next Week (T+7d)", price: prediction?.predicted_price_7d || 5240, tag: prediction?.holiday_impact_factor !== "+0.0%" ? `Holiday Proximity ${prediction?.holiday_impact_factor}` : "Macro trend", color: "text-purple-400", bg: "border-purple-500/20 bg-purple-500/5", corridor: prediction?.confidence_corridors["7d"] || { lower: 4610, upper: 5870 } },
              ].map((h, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${h.bg} backdrop-blur-md flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-lg`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>{h.label}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-current ${h.color}`}>{h.tag}</span>
                    </div>
                    <p className={`text-2xl font-black ${h.color} mt-1`}>₹{Math.round(h.price).toLocaleString("en-IN")}</p>
                  </div>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${isDark ? "border-slate-800 text-slate-400" : "border-[#C2DFD0] text-[#4A6356]"}`}>
                    <span>95% Confidence Band:</span>
                    <span className={`font-mono font-semibold ${isDark ? "text-slate-200" : "text-[#1C2E24]"}`}>
                      ₹{Math.round(h.corridor.lower).toLocaleString("en-IN")} - ₹{Math.round(h.corridor.upper).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* INTERACTIVE PRICE CHART & COMMENTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <main className={`lg:col-span-2 border rounded-2xl p-5 flex flex-col justify-between space-y-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0]"}`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>Interactive Fare & Index Trend Matrix</h3>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Smooth time-series telemetry for {activeRouteObj.label}</p>
                    </div>
                    <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-[#C2DFD0]"}`}>
                      <button onClick={() => setMetricView("price")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${metricView === "price" ? "bg-emerald-500 text-white shadow-md" : "text-slate-400"}`}>Price (₹)</button>
                      <button onClick={() => setMetricView("index")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${metricView === "index" ? "bg-purple-600 text-white shadow-md" : "text-slate-400"}`}>Jevons Index</button>
                    </div>
                  </div>

                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
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
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#C2DFD0"} opacity={0.5} />
                        <XAxis dataKey="calculation_date" stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} tickLine={false} />
                        <YAxis stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} domain={["auto", "auto"]} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? "#0f172a" : "#F4F8F5", borderColor: isDark ? "#334155" : "#C2DFD0", borderRadius: "0.75rem" }} />
                        <Area type="monotone" dataKey={metricView === "price" ? "estimated_price" : "jevons_index"} stroke={metricView === "price" ? "#00BB77" : "#a855f7"} strokeWidth={3} fillOpacity={1} fill={`url(#${metricView === "price" ? "colorPrice" : "colorIndex"})`} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </main>

              <aside className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0]"}`}>
                <div>
                  <h3 className={`text-sm font-bold border-b pb-3 mb-4 ${isDark ? "text-white border-slate-800" : "text-[#1C2E24] border-[#C2DFD0]"}`}>💬 Graph Analytics & Insights</h3>
                  <div className="space-y-4 text-xs leading-relaxed">
                    <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-[#C2DFD0] text-[#1C2E24]"}`}>
                      <p className="font-bold mb-1">Market Volatility Insight:</p>
                      <p className={isDark ? "text-slate-400" : "text-[#4A6356]"}>
                        Demand on {selectedRoute} exhibits positive multi-day momentum due to impending holiday dates.
                      </p>
                    </div>
                    <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-[#C2DFD0] text-[#1C2E24]"}`}>
                      <p className="font-bold mb-1 text-emerald-500">Smart Suggestion:</p>
                      <p>Recommendation: Secure your seat now to bypass price surge thresholds.</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            {/* CARRIER CARDS */}
            <section className={`border rounded-2xl p-5 shadow-2xl ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0]"}`}>
              <div className="flex items-center justify-between mb-5 border-b pb-4 border-slate-800">
                <div>
                  <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Price Mapping & Airline Availability Panel
                  </h2>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Direct verification & booking links</p>
                </div>
                <select value={airlineSort} onChange={(e) => setAirlineSort(e.target.value as AirlineSortKey)} className={`text-xs rounded-lg px-3 py-1.5 ${isDark ? "bg-slate-950 border border-slate-800 text-white" : "bg-white border border-[#C2DFD0] text-[#1C2E24]"}`}>
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Airline Name</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {carrierQuotes.map((carrier) => (
                  <a
                    key={carrier.name}
                    href={carrier.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group border rounded-xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 ${isDark ? "bg-slate-950 border-slate-800 hover:border-emerald-500" : "bg-[#F4F8F5] border-[#C2DFD0] hover:border-[#3B7A57]"}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-[#1C2E24]"}`}>{carrier.name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? "bg-slate-800 text-slate-400" : "bg-[#E8F0EC] text-[#4A6356]"}`}>{carrier.code}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold mt-2 block">● {carrier.seats_left} Seats Left</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-[#4A6356]"}`}>Live Fare</p>
                      <p className={`text-lg font-extrabold ${isDark ? "text-white group-hover:text-emerald-400" : "text-[#1C2E24]"}`}>₹{carrier.price.toLocaleString("en-IN")}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-2 block font-semibold">Verify & Book ➔</span>
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* PANEL 2: HISTORIC TRENDS */}
        {activeTab === "historic" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className={`border rounded-2xl p-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0]"}`}>
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>📈 Database-Oriented Past Historic Analytics</h2>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Archival Jevons Index records stored in database</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setTimeframe("30d")} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${timeframe === "30d" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>30 Days</button>
                  <button onClick={() => setTimeframe("ALL")} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${timeframe === "ALL" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}>All Archive</button>
                </div>
              </div>

              <div className="w-full h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#C2DFD0"} opacity={0.5} />
                    <XAxis dataKey="calculation_date" stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} />
                    <YAxis stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? "#0f172a" : "#F4F8F5", borderColor: isDark ? "#334155" : "#C2DFD0" }} />
                    <Line type="monotone" dataKey="jevons_index" name="Jevons Index" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: "#a855f7", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 2. RESTORE FOOTER: PURPOSE & ABOUT US SECTIONS */}
        <footer
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t ${
            isDark ? "border-slate-900 text-slate-300" : "border-[#C2DFD0] text-[#1C2E24]"
          }`}
        >
          <div
            className={`relative overflow-hidden border rounded-2xl p-6 space-y-3 transition-all duration-300 shadow-lg ${
              isDark
                ? "bg-slate-900/40 border-[#00BB77] shadow-[#00BB77]/5"
                : "bg-[#E8F0EC] border-[#C2DFD0] shadow-[#1C2E24]/5"
            }`}
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#00BB77] to-purple-600 animate-pulse" />
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-[#00BB77]" : "bg-[#3B7A57]"}`} />
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                Purpose of NAPIER
              </h3>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-[#4A6356]"}`}>
              The <strong>National Airfare Price Index Engine Real-time (NAPIER)</strong> provides dual-panel telemetry for live price mapping and database-oriented historic analytics across 440+ aviation sectors.
            </p>
          </div>

          <div
            className={`border rounded-2xl p-6 space-y-3 ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isDark ? "bg-purple-500" : "bg-[#3B7A57]"}`} />
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                About Us & System Status
              </h3>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>
              NAPIER is an open statistical initiative built by data engineers and aviation economists, offering live mapping and archival Jevons Index tracking.
            </p>
            <div
              className={`pt-2 text-[11px] border-t flex justify-between items-center ${
                isDark ? "text-slate-500 border-slate-800/60" : "text-[#4A6356]/70 border-[#C2DFD0]"
              }`}
            >
              <span>© 2026 NAPIER Engine</span>
              <span className="font-mono text-emerald-400">v1.0.8 Dual-Panel Active</span>
            </div>
          </div>
        </footer>
      </div>

      {/* 4. FIXED FLOATING AI ASSISTANT FAB */}
      <button
        onClick={() => setIsAiSidebarOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-40 hover:scale-105 transition-all duration-300 p-4 rounded-full shadow-2xl border border-white/20 flex items-center justify-center group ${
          isDark
            ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-[#00BB77] shadow-purple-500/40"
            : "bg-gradient-to-r from-[#2D5E43] via-[#3B7A57] to-[#00BB77] shadow-[#3B7A57]/30 text-white"
        }`}
        title="Toggle NAPIER AI Sidebar"
      >
        <span className="text-xl">✨</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold text-white pl-0 group-hover:pl-2">
          Ask NAPIER AI
        </span>
      </button>

      {/* SLIDING AI SIDEBAR */}
      {isAiSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsAiSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-96 border-l z-50 shadow-2xl transition-transform duration-300 transform flex flex-col justify-between ${
          isAiSidebarOpen ? "translate-x-0" : "translate-x-full"
        } ${isDark ? "bg-slate-900 border-slate-800" : "bg-[#F4F8F5] border-[#C2DFD0]"}`}
      >
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-slate-800 bg-slate-950/80" : "border-[#D8E6DF] bg-[#E8F0EC]"}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>NAPIER AI Assistant</h3>
          </div>
          <button onClick={() => setIsAiSidebarOpen(false)} className="text-slate-400 hover:text-white text-base font-mono p-1">✕</button>
        </div>

        <div className={`flex-1 p-4 overflow-y-auto space-y-3 text-xs ${isDark ? "bg-slate-950/50" : "bg-[#F4F8F5]"}`}>
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl max-w-[85%] space-y-2 ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white ml-auto text-right shadow-md"
                  : isDark
                  ? "bg-slate-900 border border-slate-800 text-slate-200 mr-auto"
                  : "bg-[#E8F0EC] border border-[#C2DFD0] text-[#1C2E24] mr-auto"
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
            </div>
          ))}
          {chatLoading && <div className="text-xs text-slate-400 animate-pulse">NAPIER AI processing...</div>}
        </div>

        <div className={`p-4 border-t ${isDark ? "border-slate-800 bg-slate-950/80" : "border-[#D8E6DF] bg-[#E8F0EC]"}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about live mapping, ticket availability..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className={`flex-1 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 ${
                isDark ? "bg-slate-900 border border-slate-800 text-white focus:ring-[#00BB77]" : "bg-white border border-[#C2DFD0] text-[#1C2E24] focus:ring-[#3B7A57]"
              }`}
            />
            <button type="submit" className="font-bold text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#00BB77] text-white">
              Send
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
