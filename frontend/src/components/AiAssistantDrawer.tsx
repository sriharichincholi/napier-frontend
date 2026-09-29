"use client";

import React, { useState } from "react";
import { sendChatMessage, CarrierQuote } from "@/lib/api";

interface Message {
  sender: "user" | "ai";
  text: string;
  badge?: string;
  carrierLinks?: CarrierQuote[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
  destination: string;
}

export default function AiAssistantDrawer({ isOpen, onClose, origin, destination }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: `Hello! I am your NAPIER AI assistant. Ask me about real-time price trends, festival surge forecasts, or seat availability for ${origin}-${destination}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedChips = [
    "Should I book today or wait until Friday?",
    "How much will prices go up around Diwali?",
    "Which airline offers the best price right now?",
  ];

  const handleSend = async (queryText?: string) => {
    const userMsg = queryText || input;
    if (!userMsg.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(userMsg, origin, destination);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.markdown_advice,
          badge: res.status_badge,
          carrierLinks: res.carrier_links,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I am analyzing telemetry data. Feel free to rephrase or pick a suggested query below!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />

      <aside className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col justify-between">
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="text-sm font-bold text-white">NAPIER AI Assistant</h3>
              <p className="text-[10px] text-slate-400">Context-Aware Travel Intelligence ({origin} ➔ {destination})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-base font-mono">
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-950/50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl max-w-[88%] space-y-2 ${
                m.sender === "user"
                  ? "bg-purple-600 text-white ml-auto text-right shadow-md shadow-purple-600/20"
                  : "bg-slate-900 border border-slate-800 text-slate-200 mr-auto shadow-md"
              }`}
            >
              {m.badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-block mb-1">
                  ● {m.badge}
                </span>
              )}

              <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

              {m.carrierLinks && m.carrierLinks.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5 mt-2">
                  <p className="text-[10px] text-slate-400 font-semibold">Direct Booking Links:</p>
                  {m.carrierLinks.slice(0, 3).map((c) => (
                    <a
                      key={c.name}
                      href={c.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500 text-[10px] flex justify-between items-center transition-colors"
                    >
                      <span className="font-bold text-slate-200">{c.name} ({c.code})</span>
                      <span className="font-mono text-emerald-400 font-bold">₹{Math.round(c.price).toLocaleString("en-IN")} ➔</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              NAPIER AI processing travel query...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-purple-500 transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about travel advice, Diwali surges..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-xs rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00BB77]"
            />
            <button
              type="submit"
              disabled={loading}
              className="font-bold text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#00BB77] hover:opacity-90 text-white transition-all shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
