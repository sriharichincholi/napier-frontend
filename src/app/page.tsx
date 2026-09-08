"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Sparkles,
  Plane,
  ArrowRight,
  Info,
  Calendar,
  Send,
  RefreshCw,
  BarChart3,
  Filter,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  ChevronRight,
  Sliders,
} from "lucide-react";

// Types & Interfaces
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
}

interface HistoricalDataPoint {
  day: string;
  indigo: number;
  airIndia: number;
  vistara: number;
  index: number;
}

export default function NAPIERDashboard() {
  // Application Filter States
  const [selectedRoute, setSelectedRoute] = useState("DEL-BOM");
  const [selectedLeadTime, setSelectedLeadTime] = useState("15");
  const [timeframe, setTimeframe] = useState("30D");
  const [cabinClass, setCabinClass] = useState("Economy");
  const [showIndexInfo, setShowIndexInfo] = useState(false);

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

  // Route Definitions
  const routes = [
    { label: "DEL → BOM", value: "DEL-BOM", origin: "Delhi", dest: "Mumbai" },
    { label: "BLR → DEL", value: "BLR-DEL", origin: "Bengaluru", dest: "Delhi" },
    { label: "BOM → MAA", value: "BOM-MAA", origin: "Mumbai", dest: "Chennai" },
    { label: "CCU → DEL", value: "CCU-DEL", origin: "Kolkata", dest: "Delhi" },
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

    const multiplier = Number(selectedLeadTime) < 15 ? 1.25 : Number(selectedLeadTime) > 30 ? 0.85 : 1.0;
    const base = basePrices[selectedRoute] || 5000;
    const currentPrice = Math.round(base * multiplier);
    const currentIndex = Number((100 + (currentPrice - 5000) / 40).toFixed(2));

    return {
      currentPrice,
      currentIndex,
      periodChange: selectedLeadTime === "7" ? "+8.4" : "-2.1",
      optimalWindow: "18 - 24 Days",
      volatility: "Moderate",
    };
  }, [selectedRoute, selectedLeadTime]);

  // Airline Fare Data Generation
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
      },
      {
        name: "Air India",
        code: "AI",
        price: Math.round(base * 1.05),
        change: "+1.5%",
        reliability: 84,
        stops: "Non-stop",
      },
      {
        name: "Vistara",
        code: "UK",
        price: Math.round(base * 1.1),
        change: "+3.8%",
        reliability: 95,
        stops: "Non-stop",
      },
      {
        name: "Akasa Air",
        code: "QP",
        price: Math.round(base * 0.94),
        change: "-0.8%",
        reliability: 88,
        stops: "Non-stop",
      },
    ];

    const minPrice = Math.min(...list.map((item) => item.price));
    return list.map((item) => ({
      ...item,
      isLowest: item.price === minPrice,
    }));
  }, [routeMetrics.currentPrice]);

  // Mock Trend Chart Data
  const trendData: HistoricalDataPoint[] = [
    { day: "T-30", indigo: 4200, airIndia: 4800, vistara: 5100, index: 102.1 },
    { day: "T-25", indigo: 4100, airIndia: 4750, vistara: 5000, index: 100.8 },
    { day: "T-20", indigo: 4350, airIndia: 4900, vistara: 5200, index: 104.2 },
    { day: "T-15", indigo: 4850, airIndia: 5600, vistara: 5890, index: 118.7 },
    { day: "T-10", indigo: 5200, airIndia: 6100, vistara: 6400, index: 126.4 },
    { day: "T-5", indigo: 6800, airIndia: 7400, vistara: 7900, index: 145.0 },
  ];

  // AI Handler with Dynamic Response Logic
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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Left Main Content Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-800">
        {/* Navigation Header */}
        <header className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600/20 p-2.5 rounded-xl border border-purple-500/30 shadow-inner">
              <Plane className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-white tracking-wide">NAPIER</h1>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  v2.4 REALTIME
                </span>
              </div>
              <p className="text-xs text-slate-400">Jevons Geometric Airfare Index & Dynamic Yield Engine</p>
            </div>
          </div>

          {/* Quick Route Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {routes.map((route) => (
              <button
                key={route.value}
                onClick={() => setSelectedRoute(route.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
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

        {/* Dashboard Body */}
        <main className="p-6 space-y-6 flex-1">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" /> Lead Time (T+):
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
                  <Filter className="w-3.5 h-3.5 text-purple-400" /> Class:
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
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">History Window:</span>
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

          {/* Key Metrics KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-24 h-24 text-purple-400" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Est. Average Fare ({selectedRoute})</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-white">
                  ₹{routeMetrics.currentPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {routeMetrics.periodChange}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Weighted average for T+{selectedLeadTime} departure</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Jevons Price Index</p>
                <button
                  onClick={() => setShowIndexInfo(!showIndexInfo)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-purple-400">{routeMetrics.currentIndex}</span>
                <span className="text-xs text-slate-400">Baseline: 100</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Geometric mean index (spike-resistant)</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
              <p className="text-xs text-slate-400 font-medium">Optimal Booking Window</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-indigo-400">{routeMetrics.optimalWindow}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Lowest expected yield volatility zone</p>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
              <p className="text-xs text-slate-400 font-medium">Market Volatility Rating</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-amber-400">{routeMetrics.volatility}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Based on carrier pricing spread</p>
            </div>
          </div>

          {/* Jevons Explanation Modal / Card */}
          {showIndexInfo && (
            <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-200/80 leading-relaxed">
                <p className="font-semibold text-purple-300 mb-1">What is the Jevons Index?</p>
                The Jevons Price Index is an elementary price index calculated as the unweighted geometric mean of price ratios. In airfare analysis, it eliminates distorted averages caused by last-minute premium price spikes on single carriers, offering a true picture of real fare movements.
              </div>
            </div>
          )}

          {/* Airline Fare Overview Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> Carrier Comparison ({selectedRoute})
              </h2>
              <span className="text-xs text-slate-500">Live prices for T+{selectedLeadTime} Days</span>
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

          {/* Historical Index & Price Trend Simulation Table */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Lead Time Progression Trend (T-30 to T-0)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Booking Days</th>
                    <th className="pb-3 font-semibold">IndiGo</th>
                    <th className="pb-3 font-semibold">Air India</th>
                    <th className="pb-3 font-semibold">Vistara</th>
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
                      <td className="py-2.5 font-bold text-slate-100">{row.index}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Right Sidebar - Reactive AI Assistant */}
      <aside className="w-80 lg:w-96 border-l border-slate-800 bg-slate-900/80 flex flex-col h-full backdrop-blur-md shrink-0">
        {/* Assistant Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-sm text-white">NAPIER AI Assistant</h2>
          </div>
          <button
            onClick={() => setChatMessages([chatMessages[0]])}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear Chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-950/50 flex flex-col">
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
        <div className="p-2 border-t border-slate-800/60 bg-slate-950/40 flex gap-1.5 overflow-x-auto no-scrollbar">
          {["Cheapest fare?", "Jevons formula?", "Price trend?"].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setChatInput(chip);
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-[11px] text-slate-400 whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Form Input */}
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
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
}
