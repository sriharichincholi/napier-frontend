"use client";

import { useState } from "react";
import { ArrowUpRight, Send, X } from "lucide-react";
import { inr } from "@/lib/format";
import { sendChatMessage, type CarrierQuote } from "@/lib/api";

interface Message {
  sender: "user" | "ai";
  text: string;
  carriers?: CarrierQuote[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  origin: string | null;
  destination: string | null;
  date: string;
}

export default function AssistantDrawer({ open, onClose, origin, destination, date }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "ai", text: "Hi, I’m the NAPIER assistant. Search a route, then ask about live fares, festival surges or the cheapest carrier." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = !!origin && !!destination;

  async function send(text: string) {
    if (!text.trim() || busy || !origin || !destination) return;
    setMessages((m) => [...m, { sender: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await sendChatMessage(text, origin, destination, date);
      setMessages((m) => [...m, { sender: "ai", text: res.markdown_advice, carriers: res.carrier_links }]);
    } catch (e) {
      setMessages((m) => [...m, { sender: "ai", text: `⚠️ ${e instanceof Error ? e.message : "Request failed."}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />}
      <aside
        aria-hidden={!open}
        className={`glass fixed bottom-4 right-4 top-4 z-50 flex w-[calc(100%-2rem)] flex-col overflow-hidden transition-transform duration-300 sm:w-96 ${
          open ? "translate-x-0" : "translate-x-[120%]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/70 p-4 dark:border-slate-800/70">
          <h3 className="text-sm font-bold">NAPIER AI Assistant{ready ? ` · ${origin} → ${destination}` : ""}</h3>
          <button onClick={onClose} aria-label="Close assistant" className="muted hover:text-cyan-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[88%] space-y-2 rounded-2xl p-3.5 ${
                m.sender === "user"
                  ? "ml-auto bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                  : "glass-inner mr-auto"
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.text.replace(/^#+\s*/gm, "").replace(/\*\*/g, "")}</p>
              {m.carriers && (
                <div className="space-y-1 border-t border-slate-200/70 pt-2 dark:border-slate-700/70">
                  {m.carriers.map((c) => (
                    <a
                      key={c.name}
                      href={c.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 hover:text-cyan-500"
                    >
                      <span>{c.name}</span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        {inr(c.price)} <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <p className="muted animate-pulse">Fetching live telemetry…</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-slate-200/70 p-4 dark:border-slate-800/70"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!ready}
            placeholder={ready ? "Ask about fares, festivals, carriers…" : "Search a route first"}
            aria-label="Message"
            className="glass-inner flex-1 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-cyan-400/70 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!ready || busy}
            aria-label="Send"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-3 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
