"use client";

import { useRef, useState } from "react";
import AssistantDrawer from "@/components/AssistantDrawer";
import CarrierCards from "@/components/CarrierCards";
import FareChart from "@/components/FareChart";
import ForecastPanel from "@/components/ForecastPanel";
import GlassCard from "@/components/GlassCard";
import Header, { type MainTab } from "@/components/Header";
import HistoricTrends from "@/components/HistoricTrends";
import RouteSearch, { QUICK_ROUTES } from "@/components/RouteSearch";
import { ApiError, buildGoogleFlightsUrl, fetchRoutePrediction, resolveRoute, type MLPrediction, type ResolvedRoute } from "@/lib/api";
import { isoDate } from "@/lib/format";

type Status = "idle" | "loading" | "ready" | "error";

export default function Home() {
  const [tab, setTab] = useState<MainTab>("live");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(() => isoDate(14));

  const [status, setStatus] = useState<Status>("idle");
  const [route, setRoute] = useState<ResolvedRoute | null>(null);
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const requestId = useRef(0);

  async function runSearch(q: string, d: string) {
    const id = ++requestId.current;
    setStatus("loading");
    setError(null);
    setPrediction(null);
    setRoute(null);
    try {
      const resolved = await resolveRoute(q);
      if (id !== requestId.current) return;
      setRoute(resolved); // lets the skeleton name the exact route being fetched
      const result = await fetchRoutePrediction(resolved.origin, resolved.destination, d);
      if (id !== requestId.current) return;
      setPrediction(result);
      setStatus("ready");
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e : new Error("Request failed."));
      setStatus("error");
    }
  }

  const search = (q = query) => {
    if (q.trim()) runSearch(q.trim(), date);
  };

  const code = route ? `${route.origin} → ${route.destination}` : null;
  const googleUrl = route ? buildGoogleFlightsUrl(route.origin, route.destination, date) : null;
  const liveRouteCode = route ? `${route.origin}-${route.destination}` : null;

  return (
    <div className="flex min-h-screen flex-col gap-6 px-4 pb-10 pt-4 md:px-6">
      <Header tab={tab} onTab={setTab} onOpenAssistant={() => setAssistantOpen(true)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6">
        {tab === "live" && (
          <>
            <RouteSearch
              query={query}
              date={date}
              loading={status === "loading"}
              statusLabel={code}
              googleUrl={googleUrl}
              onQuery={setQuery}
              onDate={setDate}
              onSubmit={() => search()}
            />

            {status === "idle" && (
              <GlassCard className="p-8 text-center">
                <p className="text-lg font-semibold">Search any route to pull live one-way fares</p>
                <p className="muted mx-auto mt-1 max-w-xl text-sm">
                  Use city names or IATA codes. Prices come straight from Google Flights; nothing is estimated or pre-filled.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {QUICK_ROUTES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setQuery(r);
                        search(r);
                      }}
                      className="glass-inner px-3 py-1.5 text-xs font-medium transition hover:border-cyan-400/70 hover:text-cyan-500"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {status === "loading" && (
              <GlassCard glow className="space-y-4 p-6">
                <p className="animate-pulse text-sm font-semibold">
                  {code ? `Fetching live telemetry for ${route!.origin} → ${route!.destination}...` : "Resolving route..."}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="glass-inner h-24 animate-pulse" />
                  ))}
                </div>
                <div className="glass-inner h-48 animate-pulse" />
              </GlassCard>
            )}

            {status === "error" && error && (
              <GlassCard className="space-y-3 p-6">
                <p className="font-semibold text-rose-500">
                  {error instanceof ApiError && error.code === "LIVE_DATA_UNAVAILABLE" ? "Live fares unavailable" : "Search failed"}
                </p>
                <p className="muted text-sm">{error.message}</p>
                <button
                  onClick={() => search()}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-xs font-bold text-white"
                >
                  Retry
                </button>
              </GlassCard>
            )}

            {status === "ready" && prediction && liveRouteCode && (
              <div className="space-y-6">
                <ForecastPanel p={prediction} />
                <FareChart quotes={prediction.live_carrier_quotes} p={prediction} />
                <CarrierCards quotes={prediction.live_carrier_quotes} route={code!} />
              </div>
            )}
          </>
        )}

        {tab === "historic" && <HistoricTrends route={liveRouteCode} />}
      </main>

      <footer className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard glow className="space-y-2 p-6">
          <h3 className="text-lg font-bold">Purpose of NAPIER</h3>
          <p className="muted text-xs leading-relaxed">
            The <strong>National Airfare Price Index Engine · Real-time</strong> maps live one-way fares for any airport pair and tracks an
            archived Jevons price index over time.
          </p>
        </GlassCard>
        <GlassCard className="space-y-2 p-6">
          <h3 className="text-lg font-bold">About &amp; system status</h3>
          <p className="muted text-xs leading-relaxed">
            Fares are fetched live via SerpApi’s Google Flights engine and cached for 30–60 minutes. Projections are heuristic, anchored on
            the live fare.
          </p>
          <div className="muted flex justify-between border-t border-slate-200/70 pt-2 text-[11px] dark:border-slate-800/70">
            <span>© 2026 NAPIER Engine</span>
            <span className="font-mono text-cyan-500">v2.0</span>
          </div>
        </GlassCard>
      </footer>

      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        origin={route?.origin ?? null}
        destination={route?.destination ?? null}
        date={date}
      />
    </div>
  );
}
