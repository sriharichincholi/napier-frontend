import { Zap } from "lucide-react";
import GlassCard from "./GlassCard";
import { inr } from "@/lib/format";
import type { MLPrediction } from "@/lib/api";

export default function ForecastPanel({ p }: { p: MLPrediction }) {
  const horizons = [
    { label: "Next hour", value: p.predicted_price_1h, band: p.confidence_corridors["1h"], tone: "text-cyan-500" },
    { label: "Next day", value: p.predicted_price_24h, band: p.confidence_corridors["24h"], tone: "text-indigo-500" },
    { label: "Next week", value: p.predicted_price_7d, band: p.confidence_corridors["7d"], tone: "text-purple-500" },
  ];

  return (
    <div className="space-y-5">
      <GlassCard glow className="p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-purple-500">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-300">
                  {p.recommendation}
                </span>
                {p.festival_name && (
                  <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-300">
                    {p.festival_name} ({p.holiday_impact_factor})
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-semibold leading-snug">{p.advice_text}</p>
            </div>
          </div>
          <div className="shrink-0 md:border-l md:border-slate-200/70 md:pl-5 md:text-right dark:md:border-slate-800/70">
            <span className="muted block text-[11px] font-medium">Cheapest live fare</span>
            <span className="text-2xl font-extrabold">{inr(p.base_fare)}</span>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {horizons.map((h) => (
          <GlassCard key={h.label} className="flex flex-col justify-between p-5 transition hover:-translate-y-0.5">
            <div>
              <span className="muted text-xs font-bold">{h.label}</span>
              <p className={`mt-1 text-2xl font-black ${h.tone}`}>{inr(h.value)}</p>
              <p className="muted mt-0.5 text-[10px]">projection, not a quote</p>
            </div>
            <div className="muted mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-[11px] dark:border-slate-800/70">
              <span>Range</span>
              <span className="font-mono font-semibold">
                {inr(h.band.lower)} – {inr(h.band.upper)}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
