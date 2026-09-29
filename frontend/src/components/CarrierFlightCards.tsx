"use client";

import React from "react";
import { CarrierQuote } from "@/lib/api";

interface Props {
  quotes: CarrierQuote[];
  origin: string;
  destination: string;
}

export default function CarrierFlightCards({ quotes, origin, destination }: Props) {
  if (!quotes || quotes.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✈️</span>
            Direct Carrier Quotes & Live Seats ({origin} ➔ {destination})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified direct carrier links with pre-filled route parameters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {quotes.map((carrier) => (
          <a
            key={carrier.name}
            href={carrier.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative border border-slate-800 bg-slate-950 p-4 rounded-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {carrier.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {carrier.code}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Status: Active</span>
                <span className="text-emerald-400 font-mono font-bold">
                  ● {carrier.seats_left} Seats Left
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-slate-800">
              <p className="text-[10px] text-slate-500">Live Fare</p>
              <p className="text-lg font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                ₹{Math.round(carrier.price).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="mt-2 text-[10px] flex items-center justify-between text-emerald-400 font-semibold group-hover:underline">
              <span>Verify & Book</span>
              <span>➔</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
