"use client";

import React from "react";
import { MLPrediction } from "@/lib/api";

interface Props {
  prediction: MLPrediction | null;
  loading: boolean;
}

export default function SmartRecommendationBanner({ prediction, loading }: Props) {
  if (loading) {
    return (
      <div className="w-full p-6 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-slate-800 rounded" />
          <div className="h-3 w-2/3 bg-slate-800/60 rounded" />
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const isSurge = prediction.status_badge === "SURGE_WARNING";
  const isDip = prediction.status_badge === "EXPECT_DIP";

  const badgeBg = isSurge
    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
    : isDip
    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
    : "bg-blue-500/10 border-blue-500/30 text-blue-400";

  const accentColor = isSurge ? "from-rose-500 to-amber-500" : isDip ? "from-emerald-500 to-teal-400" : "from-blue-500 to-indigo-500";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md">
      <div className={`absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r ${accentColor}`} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl border ${badgeBg} shrink-0`}>
            {isSurge ? (
              <span className="text-2xl">⚡</span>
            ) : isDip ? (
              <span className="text-2xl">📉</span>
            ) : (
              <span className="text-2xl">✨</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeBg}`}>
                {prediction.recommendation}
              </span>
              {prediction.festival_name && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                  🪔 {prediction.festival_name} ({prediction.holiday_impact_factor})
                </span>
              )}
            </div>

            <p className="text-slate-100 text-base font-semibold mt-2 leading-snug">
              {prediction.advice_text}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="text-right border-l border-slate-800 pl-4">
            <span className="text-[11px] font-medium text-slate-400 block">7-Day Projection</span>
            <span className="text-xl font-extrabold text-white">
              ₹{Math.round(prediction.predicted_price_7d).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
