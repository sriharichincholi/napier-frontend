"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import GlassCard from "./GlassCard";
import { fetchIndexTrends, type IndexPoint } from "@/lib/api";
import { useIsDark } from "@/lib/theme";

const LEAD_TIMES = [1, 7, 15, 30, 45];

export default function HistoricTrends({ route }: { route: string | null }) {
  const isDark = useIsDark();
  const [lead, setLead] = useState(15);
  const [range, setRange] = useState<"30d" | "ALL">("ALL");
  const [state, setState] = useState<{ key: string; data: IndexPoint[]; error: string | null } | null>(null);

  const key = route ? `${route}:${lead}` : null;

  useEffect(() => {
    if (!route || !key) return;
    let stale = false;
    fetchIndexTrends(route, lead)
      .then((r) => !stale && setState({ key, data: r.data, error: null }))
      .catch((e: Error) => !stale && setState({ key, data: [], error: e.message }));
    return () => {
      stale = true;
    };
  }, [route, lead, key]);

  const loading = !!key && state?.key !== key;
  const rows = useMemo(() => {
    if (!state || state.key !== key) return [];
    if (range === "ALL") return state.data;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return state.data.filter((d) => new Date(d.calculation_date) >= cutoff);
  }, [state, key, range]);

  const axis = isDark ? "#94a3b8" : "#475569";
  const pill = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-bold transition ${
      active ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass-inner muted"
    }`;

  return (
    <GlassCard className="p-5 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-slate-800/70">
        <div>
          <h2 className="text-xl font-bold">Archived Jevons index</h2>
          <p className="muted text-xs">{route ? `Route ${route}` : "Search a route on the Live tab first"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lead}
            onChange={(e) => setLead(Number(e.target.value))}
            aria-label="Lead time"
            className="glass-inner px-3 py-1.5 text-xs outline-none"
          >
            {LEAD_TIMES.map((d) => (
              <option key={d} value={d}>
                {d}-day lead
              </option>
            ))}
          </select>
          <button className={pill(range === "30d")} onClick={() => setRange("30d")}>30 days</button>
          <button className={pill(range === "ALL")} onClick={() => setRange("ALL")}>All archive</button>
        </div>
      </div>

      {!route ? (
        <p className="muted py-16 text-center text-sm">No route selected.</p>
      ) : loading ? (
        <p className="muted animate-pulse py-16 text-center text-sm">Loading archive for {route}…</p>
      ) : state?.error ? (
        <p className="py-16 text-center text-sm text-rose-500">{state.error}</p>
      ) : rows.length === 0 ? (
        <p className="muted py-16 text-center text-sm">
          No archived data for {route} at a {lead}-day lead yet. Run the archive job to start collecting it.
        </p>
      ) : (
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#cbd5e1"} opacity={0.5} />
              <XAxis dataKey="calculation_date" tick={{ fill: axis, fontSize: 11 }} stroke={axis} />
              <YAxis tick={{ fill: axis, fontSize: 11 }} stroke={axis} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  borderRadius: "0.75rem",
                }}
              />
              <Line type="monotone" dataKey="jevons_index_value" name="Jevons index" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, fill: "#a855f7" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
