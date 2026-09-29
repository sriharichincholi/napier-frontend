"use client";

import React from "react";
import { MLPrediction } from "@/lib/api";

interface Props {
  prediction: MLPrediction | null;
  loading: boolean;
}

export default function HorizonForecastCards({ prediction, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  if (!prediction) return null;

  const horizons = [
    {
      label: "Next Hour (T+1h)",
      price: prediction.predicted_price_1h,
      corridor: prediction.confidence_corridors["1h"],
      tag: "Intra-day shifts",
      color: "text-emerald-400",
      bg: "border-emerald-500/20 bg-emerald-500/5",
    },
    {
      label: "Next Day (T+24h)",
      price: prediction.predicted_price_24h,
      corridor: prediction.confidence_corridors["24h"],
      tag: "Short-term window",
      color: "text-blue-400",
      bg: "border-blue-500/20 bg-blue-500/5",
    },
    {
      label: "Next Week (T+7d)",
      price: prediction.predicted_price_7d,
      corridor: prediction.confidence_corridors["7d"],
      tag: prediction.holiday_impact_factor !== "+0.0%" ? `Holiday Proximity ${prediction.holiday_impact_factor}` : "Macro trend",
      color: "text-purple-400",
      bg: "border-purple-500/20 bg-purple-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {horizons.map((h, i) => (
        <div
          key={i}
          className={`p-5 rounded-2xl border ${h.bg} backdrop-blur-md flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-lg`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">{h.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-current ${h.color}`}>
                {h.tag}
              </span>
            </div>

            <p className={`text-2xl font-black ${h.color} mt-1`}>
              ₹{Math.round(h.price).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>95% Confidence Band:</span>
            <span className="font-mono text-slate-200 font-semibold">
              ₹{Math.round(h.corridor.lower).toLocaleString("en-IN")} - ₹{Math.round(h.corridor.upper).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
