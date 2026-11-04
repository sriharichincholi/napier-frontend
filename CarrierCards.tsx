"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import GlassCard from "./GlassCard";
import { duration, inr, stopsLabel } from "@/lib/format";
import type { CarrierQuote } from "@/lib/api";

type SortKey = "recommended" | "price-asc" | "price-desc" | "name";

export default function CarrierCards({ quotes, route }: { quotes: CarrierQuote[]; route: string }) {
  const [sort, setSort] = useState<SortKey>("recommended");

  const sorted = useMemo(() => {
    const list = [...quotes];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [quotes, sort]);

  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-slate-800/70">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-cyan-500" />
            Live fares · {route}
          </h2>
          <p className="muted text-xs">One-way results from Google Flights. Each card opens that carrier’s one-way search.</p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort carriers"
          className="glass-inner px-3 py-1.5 text-xs outline-none"
        >
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Airline name</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((c) => (
          <a
            key={c.name}
            href={c.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-inner group flex flex-col justify-between p-4 transition hover:-translate-y-1 hover:border-cyan-400/70"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{c.name}</span>
                <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800">{c.code}</span>
              </div>
              <p className="muted mt-2 text-[11px]">
                {[stopsLabel(c.stops), duration(c.duration_min)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-slate-800/70">
              <p className="muted text-[10px]">One-way fare</p>
              <p className="text-xl font-extrabold transition group-hover:text-cyan-500">{inr(c.price)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-500">
                View on Google Flights <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}
