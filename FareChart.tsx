"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import GlassCard from "./GlassCard";
import { inr } from "@/lib/format";
import { useIsDark } from "@/lib/theme";
import type { CarrierQuote, MLPrediction } from "@/lib/api";

/** Live fare comparison across carriers (real quotes only) + insights derived from them. */
export default function FareChart({ quotes, p }: { quotes: CarrierQuote[]; p: MLPrediction }) {
  const isDark = useIsDark();
  const axis = isDark ? "#94a3b8" : "#475569";
  const data = [...quotes].sort((a, b) => a.price - b.price).map((q) => ({ name: q.name, price: q.price }));
  const cheapest = data[0];
  const priciest = data[data.length - 1];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <GlassCard className="p-5 lg:col-span-2">
        <h3 className="text-lg font-bold">Carrier fare comparison</h3>
        <p className="muted mb-4 text-xs">Live one-way fares for {p.route_code} on {p.departure_date}</p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <defs>
                <linearGradient id="fareGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#cbd5e1"} opacity={0.5} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: axis, fontSize: 11 }} tickLine={false} stroke={axis} />
              <YAxis tick={{ fill: axis, fontSize: 11 }} tickLine={false} stroke={axis} tickFormatter={(v: number) => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(v) => inr(Number(v))}
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="price" name="One-way fare" fill="url(#fareGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="space-y-3 p-5 text-xs leading-relaxed">
        <h3 className="border-b border-slate-200/70 pb-3 text-sm font-bold dark:border-slate-800/70">Insights</h3>
        <div className="glass-inner p-3.5">
          <p className="font-bold">Lowest fare</p>
          <p className="muted">{cheapest.name} at {inr(cheapest.price)}</p>
        </div>
        {data.length > 1 && (
          <div className="glass-inner p-3.5">
            <p className="font-bold">Carrier spread</p>
            <p className="muted">{inr(priciest.price - cheapest.price)} between {cheapest.name} and {priciest.name}.</p>
          </div>
        )}
        <div className="glass-inner p-3.5">
          <p className="font-bold text-cyan-500">Outlook</p>
          <p className="muted">{p.advice_text}</p>
        </div>
      </GlassCard>
    </div>
  );
}
