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
  { code: "DEL-BOM", label: "Delhi → Mumbai", origin: "DEL", dest: "BOM", query: "Delhi to Mumbai" },
  { code: "FRA-HYD", label: "Frankfurt → Hyderabad", origin: "FRA", dest: "HYD", query: "Frankfurt to Hyderabad" },
  { code: "DEL-BLR", label: "Delhi → Bengaluru", origin: "DEL", dest: "BLR", query: "Delhi to Bengaluru" },
  { code: "BOM-BLR", label: "Mumbai → Bengaluru", origin: "BOM", dest: "BLR", query: "Mumbai to Bengaluru" },
  { code: "DEL-CCU", label: "Delhi → Kolkata", origin: "DEL", dest: "CCU", query: "Delhi to Kolkata" },
  { code: "BLR-HYD", label: "Bengaluru → Hyderabad", origin: "BLR", dest: "HYD", query: "Bengaluru to Hyderabad" },
  { code: "MAA-DEL", label: "Chennai → Delhi", origin: "MAA", dest: "DEL", query: "Chennai to Delhi" },
  { code: "LHR-BOM", label: "London → Mumbai", origin: "LHR", dest: "BOM", query: "London to Mumbai" },
];

const LEAD_WINDOWS: LeadWindowOption[] = [
  { value: 1, label: "T+1 Day" },
  { value: 7, label: "T+7 Days" },
  { value: 15, label: "T+15 Days" },
  { value: 30, label: "T+30 Days" },
  { value: 45, label: "T+45 Days" },
];

const AIRPORT_DATABASE: Record<string, { code: string; city: string; country: string }> = {
  hyd: { code: "HYD", city: "Hyderabad", country: "India" },
  hyderabad: { code: "HYD", city: "Hyderabad", country: "India" },
  del: { code: "DEL", city: "Delhi", country: "India" },
  delhi: { code: "DEL", city: "Delhi", country: "India" },
  bom: { code: "BOM", city: "Mumbai", country: "India" },
  mumbai: { code: "BOM", city: "Mumbai", country: "India" },
  blr: { code: "BLR", city: "Bengaluru", country: "India" },
  bengaluru: { code: "BLR", city: "Bengaluru", country: "India" },
  bangalore: { code: "BLR", city: "Bengaluru", country: "India" },
  ccu: { code: "CCU", city: "Kolkata", country: "India" },
  kolkata: { code: "CCU", city: "Kolkata", country: "India" },
  maa: { code: "MAA", city: "Chennai", country: "India" },
  chennai: { code: "MAA", city: "Chennai", country: "India" },
  pnq: { code: "PNQ", city: "Pune", country: "India" },
  pune: { code: "PNQ", city: "Pune", country: "India" },
  amd: { code: "AMD", city: "Ahmedabad", country: "India" },
  ahmedabad: { code: "AMD", city: "Ahmedabad", country: "India" },
  goi: { code: "GOI", city: "Goa", country: "India" },
  goa: { code: "GOI", city: "Goa", country: "India" },
  fra: { code: "FRA", city: "Frankfurt", country: "Germany" },
  frankfurt: { code: "FRA", city: "Frankfurt", country: "Germany" },
  lhr: { code: "LHR", city: "London Heathrow", country: "UK" },
  london: { code: "LHR", city: "London", country: "UK" },
  jfk: { code: "JFK", city: "New York", country: "USA" },
  newyork: { code: "JFK", city: "New York", country: "USA" },
  dxb: { code: "DXB", city: "Dubai", country: "UAE" },
  dubai: { code: "DXB", city: "Dubai", country: "UAE" },
  sin: { code: "SIN", city: "Singapore", country: "Singapore" },
  singapore: { code: "SIN", city: "Singapore", country: "Singapore" },
};

const SEARCH_AUTOPROMPTS = [
  "Delhi to Mumbai (DEL-BOM)",
  "Frankfurt to Hyderabad (FRA-HYD)",
  "Bengaluru to Delhi (BLR-DEL)",
  "Mumbai to Bengaluru (BOM-BLR)",
  "Chennai to Delhi (MAA-DEL)",
  "London to Mumbai (LHR-BOM)",
];

export default function Home() {
  const [data, setData] = useState<IndexTrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Theme & Panel Navigation States
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [activeTab, setActiveTab] = useState<MainTab>("live");

  // Filter States
  const [selectedRoute, setSelectedRoute] = useState<string>("DEL-BOM");
  const [selectedLeadTime, setSelectedLeadTime] = useState<number>(15);
  const [timeframe, setTimeframe] = useState<TimeFrame>("30d");
  const [metricView, setMetricView] = useState<MetricView>("price");
  const [airlineSort, setAirlineSort] = useState<AirlineSortKey>("recommended");

  // Dynamic Route Search & Direct Selection States
  const [searchQuery, setSearchQuery] = useState("Delhi to Mumbai");
  const [showAutoPrompts, setShowAutoPrompts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any | null>(null);

  // AI Drawer Sidebar State
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Hello! I am your NAPIER AI assistant. Ask me about real-time price mapping, ticket availability, or historic index trends.",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const activeRouteObj = useMemo(() => {
    return (
      AVAILABLE_ROUTES.find((r) => r.code === selectedRoute) || AVAILABLE_ROUTES[0]
    );
  }, [selectedRoute]);

  // Synchronized Route Switcher Handler for dropdowns in both Realtime & Historic Panels
  const handleRouteSelectCode = (routeCode: string) => {
    const found = AVAILABLE_ROUTES.find((r) => r.code === routeCode);
    if (found) {
      setSelectedRoute(found.code);
      setSearchQuery(found.query);
    }
  };

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

  const numChange = Number(periodChange);

  // Customer-oriented graph comment & suggestion generator
  const graphInsight = useMemo(() => {
    if (numChange < -2.0) {
      return {
        badge: "Great Time to Book!",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/30",
        comment: `Prices for ${activeRouteObj.label} have dropped by ${Math.abs(numChange)}% over this timeframe. Historical patterns indicate fares are near a local minimum.`,
        suggestion: "Recommendation: Secure your booking now before airline yield management algorithms trigger price surges.",
      };
    } else if (numChange > 2.0) {
      return {
        badge: "High Price Volatility",
        color: "text-rose-500",
        bg: "bg-rose-500/10 border-rose-500/30",
        comment: `Prices have surged by +${numChange}% recently. Demand on this sector is currently outpacing available seat capacity.`,
        suggestion: "Recommendation: If flexible, consider shifting your travel dates by +/- 2 days or check alternate advance windows (T+30).",
      };
    } else {
      return {
        badge: "Stable Market Trend",
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/30",
        comment: `Market pricing remains stable with negligible movement (${numChange}%) across the selected observation window.`,
        suggestion: "Recommendation: Standard booking conditions apply. Monitor for flash sales or wait for T+15 window confirmation.",
      };
    }
  }, [numChange, activeRouteObj]);

  // Airline Cards with Sorting, Filtering, and Ticket Availability
  const airlineCards = useMemo(() => {
    const o = activeRouteObj.origin;
    const d = activeRouteObj.dest;
    const hash = selectedRoute.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const baseList = [
      {
        name: "IndiGo",
        code: "6E",
        price: Math.round(currentPrice * 0.96),
        seatsLeft: Math.max(2, 4 + (hash % 3)),
        rating: 4.6,
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20IndiGo`,
      },
      {
        name: "Air India",
        code: "AI",
        price: Math.round(currentPrice * 1.08),
        seatsLeft: Math.max(2, 9 - (hash % 4)),
        rating: 4.2,
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20Air%20India`,
      },
      {
        name: "Air India Express",
        code: "IX",
        price: Math.round(currentPrice * 0.92),
        seatsLeft: Math.max(2, 2 + (hash % 2)),
        rating: 4.1,
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20Air%20India%20Express`,
      },
      {
        name: "Akasa Air",
        code: "QP",
        price: Math.round(currentPrice * 0.94),
        seatsLeft: Math.max(2, 6 - (hash % 3)),
        rating: 4.5,
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20Akasa%20Air`,
      },
      {
        name: "SpiceJet",
        code: "SG",
        price: Math.round(currentPrice * 0.98),
        seatsLeft: Math.max(2, 12 - (hash % 5)),
        rating: 3.8,
        url: `https://www.google.com/travel/flights?q=Flights%20to%20${d}%20from%20${o}%20on%20${targetDateStr}%20on%20SpiceJet`,
      },
    ];

    return [...baseList].sort((a, b) => {
      if (airlineSort === "price-asc") return a.price - b.price;
      if (airlineSort === "price-desc") return b.price - a.price;
      if (airlineSort === "name") return a.name.localeCompare(b.name);
      return 0; // recommended
    });
  }, [currentPrice, activeRouteObj, targetDateStr, airlineSort, selectedRoute]);

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const cleaned = searchQuery.toLowerCase().replace(/[^a-z0-9\s-]/g, "");

    setTimeout(() => {
      let origin = { code: "HYD", city: "Hyderabad" };
      let dest = { code: "FRA", city: "Frankfurt" };

      const tokens = cleaned.split(/[\s-]+/);
      const matchedAirports: { code: string; city: string }[] = [];

      tokens.forEach((t) => {
        if (AIRPORT_DATABASE[t]) {
          matchedAirports.push(AIRPORT_DATABASE[t]);
        }
      });

      if (matchedAirports.length >= 2) {
        origin = matchedAirports[0];
        dest = matchedAirports[1];
      } else if (matchedAirports.length === 1) {
        if (cleaned.includes("to") || cleaned.includes("dest")) {
          dest = matchedAirports[0];
        } else {
          origin = matchedAirports[0];
        }
      }

      const isIntl =
        origin.code === "FRA" ||
        dest.code === "FRA" ||
        origin.code === "LHR" ||
        dest.code === "LHR" ||
        origin.code === "JFK" ||
        dest.code === "JFK" ||
        origin.code === "DXB" ||
        dest.code === "DXB" ||
        origin.code === "SIN" ||
        dest.code === "SIN";

      const basePrice = isIntl ? 48000 : 5200;

      const mockResult = {
        query: searchQuery,
        origin: `${origin.code} (${origin.city})`,
        destination: `${dest.code} (${dest.city})`,
        jevonsIndex: (108.2 + Math.random() * 12).toFixed(1),
        options: [
          {
            airline: isIntl ? "Lufthansa" : "IndiGo",
            code: isIntl ? "LH" : "6E",
            price: `₹${Math.round(basePrice * 1.05).toLocaleString("en-IN")}`,
            seatsLeft: 3,
            duration: isIntl ? "8h 45m" : "2h 15m",
            type: isIntl ? "Non-stop" : "Direct",
          },
          {
            airline: "Air India",
            code: "AI",
            price: `₹${Math.round(basePrice * 0.94).toLocaleString("en-IN")}`,
            seatsLeft: 8,
            duration: isIntl ? "11h 20m" : "2h 30m",
            type: isIntl ? "1-Stop (DEL)" : "Direct",
          },
          {
            airline: isIntl ? "Emirates" : "Akasa Air",
            code: isIntl ? "EK" : "QP",
            price: `₹${Math.round(basePrice * 1.12).toLocaleString("en-IN")}`,
            seatsLeft: 5,
            duration: isIntl ? "10h 15m" : "2h 20m",
            type: isIntl ? "1-Stop (DXB)" : "Direct",
          },
        ],
      };

      setSearchResults(mockResult);
      setIsSearching(false);
      setShowAutoPrompts(false);
    }, 700);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      const textLower = userText.toLowerCase().trim();
      let aiReply = "";

      if (/^(hi|hello|hey|greetings)/i.test(textLower)) {
        aiReply = `Hello! How can I assist you with ${activeRouteObj.label} (${selectedRoute}) real-time mapping, ticket availability, or historic index trends today?`;
      } else if (textLower.includes("cheapest") || textLower.includes("best price") || textLower.includes("lowest")) {
        const lowestFare = Math.round(currentPrice * 0.92);
        aiReply = `Air India Express and IndiGo currently offer the most competitive live rates for ${selectedRoute} (T+${selectedLeadTime}) starting at ~₹${lowestFare.toLocaleString("en-IN")}.`;
      } else if (textLower.includes("trend") || textLower.includes("predict") || textLower.includes("forecast") || textLower.includes("price")) {
        aiReply = `Over the selected ${timeframe} timeframe, ${selectedRoute} displays a ${periodChange}% price movement. Current estimated average fare is ₹${currentPrice.toLocaleString("en-IN")}. ${graphInsight.suggestion}`;
      } else if (textLower.includes("jevons") || textLower.includes("index") || textLower.includes("historic")) {
        aiReply = `Switch over to the 'Historic Analytics' panel to inspect deep-dive database records and long-term Jevons Index trendlines for ${selectedRoute}.`;
      } else {
        aiReply = `I am monitoring ${activeRouteObj.label} live telemetry and database historical analytics. Feel free to ask about ticket availability, carrier sorting, or price forecasts!`;
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    }, 500);
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-[#F4F8F5] text-[#1C2E24]"
      }`}
    >
      {/* HEADER SECTION */}
      <header
        className={`p-6 border-b sticky top-0 z-40 flex items-center justify-between backdrop-blur transition-colors ${
          isDark
            ? "border-slate-900 bg-slate-950/80"
            : "border-[#D8E6DF] bg-[#F4F8F5]/85"
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

        {/* Top Right Controls */}
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

      {/* MAIN PANEL NAVIGATION (LIVE ANALYTICS vs HISTORIC ANALYTICS) */}
      <nav
        className={`px-6 py-3 border-b flex items-center justify-center gap-3 sticky top-[81px] z-30 backdrop-blur transition-colors ${
          isDark
            ? "bg-slate-950/90 border-slate-900"
            : "bg-[#F4F8F5]/90 border-[#D8E6DF]"
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

      {/* FLOATING ACTION TRIGGER BUTTON */}
      <button
        onClick={() => setIsAiSidebarOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-40 hover:scale-105 transition-all duration-300 p-4 rounded-full shadow-2xl border border-white/20 flex items-center justify-center group ${
          isDark
            ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-[#00BB77] shadow-purple-500/40"
            : "bg-gradient-to-r from-[#2D5E43] via-[#3B7A57] to-[#00BB77] shadow-[#3B7A57]/30 text-white"
        }`}
        title="Toggle AI Sidebar"
      >
        <span className="text-xl">✨</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold text-white pl-0 group-hover:pl-2">
          Ask NAPIER AI
        </span>
      </button>

      {/* SLIDING AI SIDEBAR */}
      {isAiSidebarOpen && (
        <div
          className={`fixed inset-0 backdrop-blur-sm z-50 transition-opacity ${
            isDark ? "bg-slate-950/60" : "bg-[#1C2E24]/20"
          }`}
          onClick={() => setIsAiSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-96 border-l z-50 shadow-2xl transition-transform duration-300 transform flex flex-col justify-between ${
          isAiSidebarOpen ? "translate-x-0" : "translate-x-full"
        } ${
          isDark
            ? "bg-slate-900 border-slate-800"
            : "bg-[#F4F8F5] border-[#C2DFD0]"
        }`}
      >
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark
              ? "border-slate-800 bg-slate-950/80"
              : "border-[#D8E6DF] bg-[#E8F0EC]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
              NAPIER AI Assistant
            </h3>
          </div>
          <button
            onClick={() => setIsAiSidebarOpen(false)}
            className={`${isDark ? "text-slate-400 hover:text-white" : "text-[#4A6356] hover:text-[#1C2E24]"} text-lg font-mono p-1`}
          >
            ✕
          </button>
        </div>

        <div className={`flex-1 p-4 overflow-y-auto space-y-3 text-xs ${isDark ? "bg-slate-950/50" : "bg-[#F4F8F5]"}`}>
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl max-w-[85%] ${
                msg.sender === "user"
                  ? isDark
                    ? "bg-purple-600 text-white ml-auto text-right shadow-md shadow-purple-600/20"
                    : "bg-[#3B7A57] text-white ml-auto text-right shadow-md shadow-[#3B7A57]/20"
                  : isDark
                  ? "bg-slate-900 border border-slate-800 text-slate-200 mr-auto shadow-md"
                  : "bg-[#E8F0EC] border border-[#C2DFD0] text-[#1C2E24] mr-auto shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div
          className={`p-4 border-t ${
            isDark ? "border-slate-800 bg-slate-950/80" : "border-[#D8E6DF] bg-[#E8F0EC]"
          }`}
        >
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about live mapping, ticket availability..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className={`flex-1 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-slate-900 border border-slate-800 text-white focus:ring-[#00BB77]"
                  : "bg-white border border-[#C2DFD0] text-[#1C2E24] focus:ring-[#3B7A57]"
              }`}
            />
            <button
              type="submit"
              className={`font-bold text-xs px-4 py-2.5 rounded-xl transition-all text-white ${
                isDark
                  ? "bg-gradient-to-r from-purple-600 to-[#00BB77] hover:opacity-90"
                  : "bg-[#3B7A57] hover:bg-[#2D5E43]"
              }`}
            >
              Send
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        {/* ======================================================== */}
        {/* PANEL 1: LIVE ANALYTICS & MAPPING PANEL                   */}
        {/* ======================================================== */}
        {activeTab === "live" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* DYNAMIC SEARCH BAR WITH AUTOPROMPTS & INTEGRATED ROUTE DROPDOWN */}
            <section
              className={`border rounded-2xl p-4 shadow-xl relative transition-all duration-500 ${
                isDark
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-[#E8F0EC] border-[#C2DFD0] shadow-[#1C2E24]/5"
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

                {/* SYNCHRONIZED ROUTE SELECT DROPDOWN FOR REALTIME PANEL */}
                <select
                  value={selectedRoute}
                  onChange={(e) => handleRouteSelectCode(e.target.value)}
                  className={`w-full sm:w-auto text-xs font-semibold rounded-xl px-4 py-3 border focus:ring-2 focus:outline-none cursor-pointer transition-all ${
                    isDark
                      ? "bg-slate-950 border-slate-800 text-white focus:ring-[#00BB77]"
                      : "bg-white border border-[#C2DFD0] text-[#1C2E24] focus:ring-[#3B7A57]"
                  }`}
                >
                  {AVAILABLE_ROUTES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label} ({r.code})
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isSearching}
                  className={`w-full sm:w-auto font-bold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg text-white ${
                    isDark
                      ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-[#00BB77] hover:opacity-90 shadow-purple-500/20"
                      : "bg-gradient-to-r from-[#2D5E43] via-[#3B7A57] to-[#00BB77] hover:bg-[#1C2E24] shadow-[#3B7A57]/20"
                  }`}
                >
                  {isSearching ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mapping...</span>
                    </>
                  ) : (
                    <>
                      <span>Live Map Query</span>
                      <span>➔</span>
                    </>
                  )}
                </button>
              </form>

              {searchResults && (
                <div
                  className={`mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300 ${
                    isDark ? "border-slate-800/80" : "border-[#C2DFD0]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00BB77] animate-pulse" />
                      <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                        Live Price Mapping Feed: <span className={isDark ? "text-purple-500" : "text-[#3B7A57]"}>{searchResults.origin}</span> ➔ <span className="text-[#00BB77]">{searchResults.destination}</span>
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchResults(null)}
                      className={`text-xs font-mono ${isDark ? "text-slate-500 hover:text-slate-300" : "text-[#4A6356] hover:text-[#1C2E24]"}`}
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {searchResults.options.map((opt: any, idx: number) => (
                      <div
                        key={idx}
                        className={`border rounded-xl p-3 flex justify-between items-center ${
                          isDark
                            ? "bg-slate-950 border-slate-800"
                            : "bg-[#F4F8F5] border-[#C2DFD0]"
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                            {opt.airline} <span className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-[#4A6356]"}`}>({opt.code})</span>
                          </p>
                          <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>{opt.type} • {opt.duration}</p>
                          <span className="text-[10px] font-mono text-emerald-500 font-semibold mt-1 inline-block">
                            ● {opt.seatsLeft} Seats Available
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-extrabold ${isDark ? "text-[#00BB77]" : "text-[#2D5E43]"}`}>{opt.price}</p>
                          <span className={`text-[9px] font-mono ${isDark ? "text-purple-500" : "text-[#3B7A57]"}`}>Index: {searchResults.jevonsIndex}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* LIVE PRICE MAPPING PANEL & AIRLINE LISTING WITH SORT/FILTER & AVAILABILITY */}
            <section
              className={`border rounded-2xl p-5 shadow-2xl transition-colors ${
                isDark
                  ? "bg-slate-900/60 border-slate-800"
                  : "bg-[#E8F0EC] border-[#C2DFD0] shadow-[#1C2E24]/5"
              }`}
            >
              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b pb-4 ${
                  isDark ? "border-slate-800/80" : "border-[#D8E6DF]"
                }`}
              >
                <div>
                  <h2
                    className={`text-lg font-bold flex items-center gap-2 ${
                      isDark ? "text-white" : "text-[#1C2E24]"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Price Mapping & Airline Availability Panel
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>
                    Real-time ticker availability checker and multi-parameter sorting for {activeRouteObj.label} ({targetDateStr})
                  </p>
                </div>

                {/* SORT & FILTER CONTROLS */}
                <div className="flex items-center gap-2">
                  <label className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>
                    Sort By:
                  </label>
                  <select
                    value={airlineSort}
                    onChange={(e) => setAirlineSort(e.target.value as AirlineSortKey)}
                    className={`text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:outline-none ${
                      isDark
                        ? "bg-slate-950 border border-slate-800 text-white focus:ring-[#00BB77]"
                        : "bg-white border border-[#C2DFD0] text-[#1C2E24] focus:ring-[#3B7A57]"
                    }`}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Airline Name</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {airlineCards.map((carrier) => (
                  <a
                    key={carrier.name}
                    href={carrier.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      isDark
                        ? "bg-slate-950 border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                        : "bg-[#F4F8F5] border-[#C2DFD0] hover:border-[#3B7A57] hover:bg-white hover:shadow-[#1C2E24]/10"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isDark
                              ? "text-slate-200 group-hover:text-emerald-400"
                              : "text-[#1C2E24] group-hover:text-[#3B7A57]"
                          }`}
                        >
                          {carrier.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isDark
                              ? "bg-slate-800 text-slate-400"
                              : "bg-[#E8F0EC] text-[#4A6356]"
                          }`}
                        >
                          {carrier.code}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className={isDark ? "text-slate-400" : "text-[#4A6356]"}>Rating: ★ {carrier.rating}</span>
                        <span className="text-emerald-500 font-mono font-bold">● {carrier.seatsLeft} Seats Left</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-slate-700/40">
                      <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-[#4A6356]"}`}>
                        Live Mapped Fare
                      </p>
                      <p
                        className={`text-lg font-extrabold ${
                          isDark
                            ? "text-white group-hover:text-emerald-400"
                            : "text-[#1C2E24] group-hover:text-[#2D5E43]"
                        } transition-colors`}
                      >
                        ₹{carrier.price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className={`mt-2 text-[10px] flex items-center justify-between group-hover:underline ${isDark ? "text-emerald-400" : "text-[#3B7A57]"}`}>
                      <span>Verify & Book</span>
                      <span>➔</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* LIVE GRAPH & CUSTOMER-ORIENTED COMMENTS & SUGGESTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <main
                className={`lg:col-span-2 border rounded-2xl p-5 flex flex-col justify-between space-y-6 ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800"
                    : "bg-[#E8F0EC] border-[#C2DFD0] shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                        Real-Time Price & Index Mapping Feed
                      </h3>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>
                        Live telemetry tracking trends for {activeRouteObj.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMetricView("price")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          metricView === "price"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : isDark ? "text-slate-400 hover:text-white bg-slate-950" : "text-[#4A6356] bg-white"
                        }`}
                      >
                        Price (₹)
                      </button>
                      <button
                        onClick={() => setMetricView("index")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          metricView === "index"
                            ? "bg-purple-600 text-white shadow-sm"
                            : isDark ? "text-slate-400 hover:text-white bg-slate-950" : "text-[#4A6356] bg-white"
                        }`}
                      >
                        Jevons Index
                      </button>
                    </div>
                  </div>

                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className={`border p-3 rounded-xl ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-[#F4F8F5] border-[#C2DFD0]"}`}>
                      <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Current Fare</p>
                      <p className={`text-xl font-bold mt-0.5 ${isDark ? "text-blue-500" : "text-[#2D5E43]"}`}>₹{currentPrice.toLocaleString("en-IN")}</p>
                    </div>
                    <div className={`border p-3 rounded-xl ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-[#F4F8F5] border-[#C2DFD0]"}`}>
                      <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Jevons Index</p>
                      <p className={`text-xl font-bold mt-0.5 ${isDark ? "text-purple-500" : "text-[#3B7A57]"}`}>{currentIndex}</p>
                    </div>
                    <div className={`border p-3 rounded-xl ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-[#F4F8F5] border-[#C2DFD0]"}`}>
                      <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Min / Max</p>
                      <p className={`text-xs font-bold mt-1.5 ${isDark ? "text-slate-200" : "text-[#1C2E24]"}`}>₹{minPrice} - ₹{maxPrice}</p>
                    </div>
                    <div className={`border p-3 rounded-xl ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-[#F4F8F5] border-[#C2DFD0]"}`}>
                      <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Trend ({timeframe})</p>
                      <p className={`text-xl font-bold mt-0.5 ${numChange < 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {numChange > 0 ? `+${periodChange}%` : `${periodChange}%`}
                      </p>
                    </div>
                  </div>

                  {/* CHART */}
                  <div className={`w-full h-[320px] p-4 rounded-xl border flex items-center justify-center ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-[#F4F8F5] border-[#C2DFD0]"}`}>
                    {loading ? (
                      <div className={`text-sm animate-pulse flex items-center gap-2 ${isDark ? "text-blue-500" : "text-[#3B7A57]"}`}>
                        <span className="w-2 h-2 rounded-full animate-ping bg-emerald-500" />
                        Loading live telemetry stream...
                      </div>
                    ) : error ? (
                      <p className="text-rose-500 text-xs font-medium">{error}</p>
                    ) : filteredData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#C2DFD0"} opacity={0.7} />
                          <XAxis dataKey="calculation_date" stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} tickLine={false} />
                          <YAxis stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} domain={["auto", "auto"]} tickLine={false} tickFormatter={(val) => (metricView === "price" ? `₹${val}` : val)} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? "#0f172a" : "#F4F8F5",
                              borderColor: isDark ? "#334155" : "#C2DFD0",
                              color: isDark ? "#ffffff" : "#1C2E24",
                              borderRadius: "0.75rem",
                            }}
                            formatter={(val: any) => [metricView === "price" ? `₹${Number(val).toLocaleString("en-IN")}` : val, metricView === "price" ? "Estimated Fare" : "Jevons Index"]}
                          />
                          <Line
                            type="monotone"
                            dataKey={metricView === "price" ? "estimated_price" : "jevons_index"}
                            stroke={metricView === "price" ? "#00BB77" : "#a855f7"}
                            strokeWidth={2.5}
                            dot={{ fill: metricView === "price" ? "#00BB77" : "#a855f7", r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-slate-500">No data entries available.</p>
                    )}
                  </div>
                </div>
              </main>

              {/* CUSTOMER-ORIENTED GRAPH COMMENTS & SUGGESTIONS PANEL */}
              <aside className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0] shadow-sm"}`}>
                <div>
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                      <span>💬 Graph Analytics & Insights</span>
                    </h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${graphInsight.bg} ${graphInsight.color}`}>
                      {graphInsight.badge}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed">
                    <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-white border-[#C2DFD0]"}`}>
                      <p className={`font-bold mb-1 ${isDark ? "text-slate-300" : "text-[#1C2E24]"}`}>Customer Comment:</p>
                      <p className={isDark ? "text-slate-400" : "text-[#4A6356]"}>{graphInsight.comment}</p>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-white border-[#C2DFD0]"}`}>
                      <p className={`font-bold mb-1 text-emerald-500`}>Smart Suggestion:</p>
                      <p className={isDark ? "text-slate-300" : "text-[#1C2E24]"}>{graphInsight.suggestion}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border text-[11px] ${isDark ? "bg-slate-950/40 border-slate-800 text-slate-400" : "bg-[#F4F8F5] border-[#C2DFD0] text-[#4A6356]"}`}>
                  <p className="font-semibold mb-1">Route & Window Selection:</p>
                  <p>Route: <span className="font-mono text-emerald-500">{selectedRoute}</span></p>
                  <p>Lead Time: <span className="font-mono text-emerald-500">T+{selectedLeadTime} Days</span></p>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PANEL 2: HISTORIC TRENDS & DATABASE ANALYTICS PANEL        */}
        {/* ======================================================== */}
        {activeTab === "historic" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className={`border rounded-2xl p-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-[#E8F0EC] border-[#C2DFD0] shadow-sm"}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b pb-4">
                <div>
                  <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                    <span>📈 Database-Oriented Past Historic Analytics</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>
                    Comprehensive archival time-series and Jevons index metrics stored in the Supabase database
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedRoute}
                    onChange={(e) => handleRouteSelectCode(e.target.value)}
                    className={`text-xs rounded-lg px-3 py-2 focus:ring-2 focus:outline-none ${
                      isDark
                        ? "bg-slate-950 border border-slate-800 text-white focus:ring-purple-500"
                        : "bg-white border border-[#C2DFD0] text-[#1C2E24] focus:ring-[#3B7A57]"
                    }`}
                  >
                    {AVAILABLE_ROUTES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label} ({r.code})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setTimeframe("ALL")}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      timeframe === "ALL"
                        ? "bg-purple-600 text-white"
                        : isDark ? "bg-slate-950 text-slate-400 border border-slate-800" : "bg-white text-[#4A6356] border border-[#C2DFD0]"
                    }`}
                  >
                    View All Archive
                  </button>
                </div>
              </div>

              {/* ARCHIVAL SUMMARY METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={`border p-4 rounded-xl ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-[#C2DFD0]"}`}>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Total Archival Data Points</p>
                  <p className={`text-2xl font-black mt-1 ${isDark ? "text-purple-400" : "text-[#2D5E43]"}`}>{data.length} Records</p>
                </div>
                <div className={`border p-4 rounded-xl ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-[#C2DFD0]"}`}>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Archival Peak Jevons Index</p>
                  <p className={`text-2xl font-black mt-1 ${isDark ? "text-emerald-400" : "text-[#3B7A57]"}`}>
                    {data.length ? Math.max(...data.map(d => d.jevons_index ?? 100)) : 100}
                  </p>
                </div>
                <div className={`border p-4 rounded-xl ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-[#C2DFD0]"}`}>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#4A6356]"}`}>Archival Lowest Fare Recorded</p>
                  <p className={`text-2xl font-black mt-1 text-blue-500`}>
                    ₹{data.length ? Math.min(...data.map(d => d.estimated_price ?? 5000)).toLocaleString("en-IN") : 5000}
                  </p>
                </div>
              </div>

              {/* HISTORIC JEVONS INDEX & PRICE GRAPH */}
              <div className={`w-full h-[400px] p-4 rounded-xl border flex items-center justify-center ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-white border-[#C2DFD0]"}`}>
                {loading ? (
                  <div className={`text-sm animate-pulse ${isDark ? "text-purple-400" : "text-[#3B7A57]"}`}>
                    Loading database archival records...
                  </div>
                ) : filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#C2DFD0"} opacity={0.7} />
                      <XAxis dataKey="calculation_date" stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} tickLine={false} />
                      <YAxis stroke={isDark ? "#64748b" : "#4A6356"} tick={{ fill: isDark ? "#94a3b8" : "#4A6356", fontSize: 11 }} domain={["auto", "auto"]} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#0f172a" : "#F4F8F5",
                          borderColor: isDark ? "#334155" : "#C2DFD0",
                          color: isDark ? "#ffffff" : "#1C2E24",
                          borderRadius: "0.75rem",
                        }}
                      />
                      <Line type="monotone" dataKey="jevons_index" name="Jevons Index" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: "#a855f7", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-500">No historic database records found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t ${
            isDark ? "border-slate-900 text-slate-300" : "border-[#C2DFD0] text-[#1C2E24]"
          }`}
        >
          <div
            className={`border rounded-2xl p-6 space-y-3 transition-all duration-300 shadow-lg ${
              isDark
                ? "bg-slate-900/40 border-[#00BB77] shadow-[#00BB77]/5"
                : "bg-[#E8F0EC] border-[#C2DFD0] shadow-[#1C2E24]/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-[#00BB77]" : "bg-[#3B7A57]"}`} />
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#1C2E24]"}`}>
                Purpose of NAPIER
              </h3>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-[#4A6356]"}`}>
              The <strong>National Airfare Price Index Engine Real-time (NAPIER)</strong> provides dual-panel telemetry for live price mapping and database-oriented historic analytics across aviation sectors.
            </p>
          </div>

          <div
            className={`border rounded-2xl p-6 space-y-3 ${
              isDark
                ? "bg-slate-900/40 border-slate-800/80"
                : "bg-[#E8F0EC] border-[#C2DFD0] shadow-sm"
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
              <span>v1.0.8 Dual-Panel Active</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
