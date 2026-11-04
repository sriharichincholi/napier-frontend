"use client";

import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import GlassCard from "./GlassCard";
import { isoDate } from "@/lib/format";

export const QUICK_ROUTES = [
  "Delhi to Mumbai",
  "Mumbai to Bengaluru",
  "Delhi to Bengaluru",
  "Hyderabad to Delhi",
  "Frankfurt to Hyderabad",
  "London to Mumbai",
  "Dubai to Delhi",
  "Singapore to Mumbai",
];

interface Props {
  query: string;
  date: string;
  loading: boolean;
  statusLabel: string | null; // e.g. "DEL → BOM"
  googleUrl: string | null;
  onQuery: (v: string) => void;
  onDate: (v: string) => void;
  onSubmit: () => void;
}

export default function RouteSearch({ query, date, loading, statusLabel, googleUrl, onQuery, onDate, onSubmit }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <GlassCard glow={loading || !!statusLabel} className="relative z-20 p-4 md:p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          onSubmit();
        }}
        className="flex flex-col items-stretch gap-3 lg:flex-row"
      >
        <div className="relative flex-1">
          <Search className="muted pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => {
              onQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder="City or IATA pair — e.g. “Delhi to Mumbai” or “DEL-BOM”"
            aria-label="Route search"
            className="glass-inner w-full py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-cyan-400/70"
          />
          {open && (
            <div className="glass absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl">
              <p className="muted border-b border-slate-200/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider dark:border-slate-800/70">
                Quick searches
              </p>
              {QUICK_ROUTES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onQuery(r);
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-xs transition hover:bg-cyan-500/10"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="date"
          value={date}
          min={isoDate(0)}
          onChange={(e) => onDate(e.target.value)}
          aria-label="Departure date"
          suppressHydrationWarning
          className="glass-inner px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-400/70"
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Mapping…" : "Live Map Query →"}
        </button>
      </form>

      {statusLabel && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800/70">
          <a
            href={googleUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold transition hover:text-cyan-500"
          >
            Live Price Mapping: <span className="text-cyan-500">{statusLabel}</span>
          </a>
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-500 hover:underline"
            >
              Open one-way on Google Flights <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </GlassCard>
  );
}
