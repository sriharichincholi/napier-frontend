"use client";

import { Moon, Sparkles, Sun } from "lucide-react";
import { setTheme, useIsDark } from "@/lib/theme";

export type MainTab = "live" | "historic";

interface Props {
  tab: MainTab;
  onTab: (t: MainTab) => void;
  onOpenAssistant: () => void;
}

export default function Header({ tab, onTab, onOpenAssistant }: Props) {
  const isDark = useIsDark();

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
      active
        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    }`;

  return (
    <header className="glass sticky top-4 z-40 mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="hidden w-28 md:block" aria-hidden />

        <div className="flex flex-1 flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30">
              <svg className="h-6 w-6 stroke-[2.5] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 005.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"
                />
              </svg>
            </div>
            <h1 className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 bg-clip-text text-4xl font-black tracking-widest text-transparent md:text-5xl">
              NAPIER
            </h1>
          </div>
          <p className="muted mt-1.5 text-xs font-medium tracking-wide md:text-sm">National Airfare Price Index Engine · Real-time</p>
        </div>

        <div className="flex w-auto items-center gap-2 md:w-28 md:justify-end">
          <button
            onClick={() => setTheme(!isDark)}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            className="glass-inner flex h-10 w-10 items-center justify-center transition hover:scale-105"
          >
            {isDark ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-indigo-600" />}
          </button>
          <button
            onClick={onOpenAssistant}
            aria-label="Open AI assistant"
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </button>
        </div>
      </div>

      <nav className="mt-4 flex items-center justify-center gap-1">
        <div className="glass-inner flex gap-1 p-1">
          <button className={tabClass(tab === "live")} onClick={() => onTab("live")}>
            Live Analytics &amp; Mapping
          </button>
          <button className={tabClass(tab === "historic")} onClick={() => onTab("historic")}>
            Historic Trends
          </button>
        </div>
      </nav>
    </header>
  );
}
