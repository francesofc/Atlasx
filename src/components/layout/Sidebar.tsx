"use client";

import { MODULES, scoreAllCountries, type ModuleId, type CountryScore } from "@/lib/scoring";
import { useI18n, LOCALE_LABELS, type Locale } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useMemo } from "react";

const locales = Object.keys(LOCALE_LABELS) as Locale[];

interface SidebarProps {
  activeModule: ModuleId;
  onModuleChange: (module: ModuleId) => void;
  onCountrySelect: (iso: string) => void;
  selectedIso: string | null;
  onOpenAI: () => void;
  onOpenCompare: () => void;
  onOpenProfile: () => void;
  onOpenRecommendations: () => void;
  compareCount: number;
}

function TierDot({ tier }: { tier: "green" | "orange" | "red" }) {
  const colors = {
    green: "bg-emerald-400 shadow-emerald-400/40",
    orange: "bg-amber-400 shadow-amber-400/40",
    red: "bg-red-400 shadow-red-400/40",
  };
  return <span className={`h-2 w-2 rounded-full shadow-sm ${colors[tier]}`} />;
}

export default function Sidebar({
  activeModule,
  onModuleChange,
  onCountrySelect,
  selectedIso,
  onOpenAI,
  onOpenCompare,
  onOpenProfile,
  onOpenRecommendations,
  compareCount,
}: SidebarProps) {
  const scores = useMemo(() => scoreAllCountries(activeModule), [activeModule]);
  const { locale, setLocale, t } = useI18n();
  const { hasCompletedOnboarding } = useProfile();

  return (
    <aside className="fixed left-0 top-0 z-20 h-full w-[260px] flex flex-col border-r border-white/[0.06] bg-[#070711]/95 backdrop-blur-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-blue-500/20">
          <div className="absolute inset-px rounded-[7px] bg-[#0a0a14]/90" />
          <span className="relative text-xs font-bold ax-gradient-text-brand">A</span>
        </div>
        <div>
          <span className="text-[13px] font-bold tracking-wide ax-gradient-text">ATLAS X</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ax-pulse-dot" />
            <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-emerald-400/50">Live Intelligence</span>
          </div>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="px-3 py-3 border-b border-white/[0.06]">
        <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">Tools</p>
        <div className="grid grid-cols-2 gap-1.5">
          {/* AI Advisor */}
          <button
            onClick={onOpenAI}
            className="ax-btn flex items-center gap-2 rounded-xl px-3 py-2.5 ax-glass-1 transition-all hover:shadow-cyan-500/10 hover:shadow-lg group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400/70 group-hover:text-cyan-400 transition-colors shrink-0">
              <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
            <span className="text-[10px] font-semibold text-white/50 group-hover:text-white/80 transition-colors">AI Advisor</span>
          </button>

          {/* Compare */}
          <button
            onClick={onOpenCompare}
            className="ax-btn flex items-center gap-2 rounded-xl px-3 py-2.5 ax-glass-1 transition-all hover:shadow-violet-500/10 hover:shadow-lg group relative"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400/70 group-hover:text-violet-400 transition-colors shrink-0">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="text-[10px] font-semibold text-white/50 group-hover:text-white/80 transition-colors">Compare</span>
            {compareCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-[8px] font-bold text-white shadow-lg shadow-violet-500/30">
                {compareCount}
              </span>
            )}
          </button>

          {/* Profile / Onboarding */}
          <button
            onClick={onOpenProfile}
            className={`ax-btn flex items-center gap-2 rounded-xl px-3 py-2.5 ax-glass-1 transition-all group ${
              hasCompletedOnboarding ? "hover:shadow-emerald-500/10" : ""
            } hover:shadow-lg`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-colors ${hasCompletedOnboarding ? "text-emerald-400/70 group-hover:text-emerald-400" : "text-white/40 group-hover:text-white/70"}`}>
              <circle cx="12" cy="8" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>
            <span className={`text-[10px] font-semibold transition-colors ${hasCompletedOnboarding ? "text-emerald-400/60 group-hover:text-emerald-400/90" : "text-white/50 group-hover:text-white/80"}`}>
              {hasCompletedOnboarding ? "Profile" : "Set up"}
            </span>
          </button>

          {/* Recommendations */}
          <button
            onClick={onOpenRecommendations}
            className={`ax-btn flex items-center gap-2 rounded-xl px-3 py-2.5 ax-glass-1 transition-all group ${
              hasCompletedOnboarding ? "hover:shadow-amber-500/10" : ""
            } hover:shadow-lg`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-colors ${hasCompletedOnboarding ? "text-amber-400/70 group-hover:text-amber-400" : "text-white/40 group-hover:text-white/70"}`}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
            </svg>
            <span className={`text-[10px] font-semibold transition-colors ${hasCompletedOnboarding ? "text-amber-400/60 group-hover:text-amber-400/90" : "text-white/50 group-hover:text-white/80"}`}>
              {hasCompletedOnboarding ? "Results" : "Match"}
            </span>
          </button>
        </div>
      </div>

      {/* Modules */}
      <div className="px-3 py-3">
        <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">Modules</p>
        <div className="space-y-0.5">
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => onModuleChange(mod.id)}
                className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.08] shadow-inner shadow-white/5"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <span className={`text-base transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                  {mod.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={`block text-[12px] font-semibold transition-colors ${isActive ? "text-white/90" : "text-white/50 group-hover:text-white/70"}`}>
                    {mod.label}
                  </span>
                  <span className={`block text-[9px] transition-colors ${isActive ? "text-white/35" : "text-white/20"}`}>
                    {mod.description}
                  </span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Country Rankings */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-5 py-3 flex items-center justify-between shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">Rankings</p>
          <span className="text-[9px] font-medium text-white/15">{scores.length} countries</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          {scores.map((cs, idx) => (
            <CountryRow
              key={cs.iso}
              cs={cs}
              rank={idx + 1}
              isSelected={selectedIso === cs.iso}
              onClick={() => onCountrySelect(cs.iso)}
            />
          ))}
        </div>
      </div>

      {/* Footer — Language switcher + score summary */}
      <div className="border-t border-white/[0.06] px-4 py-3 space-y-2.5">
        {/* Score summary */}
        <ScoreSummary scores={scores} />

        {/* Language Switcher */}
        <div className="flex items-center rounded-lg ax-glass-1 overflow-hidden">
          {locales.map((loc, i) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`flex-1 py-1.5 text-[10px] font-semibold tracking-wider text-center transition-all duration-200 ${
                locale === loc
                  ? "text-white/90 bg-white/[0.08]"
                  : "text-white/25 hover:text-white/50 hover:bg-white/[0.03]"
              } ${i > 0 ? "border-l border-white/[0.04]" : ""}`}
              aria-label={`${t.language_switcher.label}: ${LOCALE_LABELS[loc]}`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function CountryRow({ cs, rank, isSelected, onClick }: { cs: CountryScore; rank: number; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150 ${
        isSelected
          ? "bg-white/[0.08] shadow-sm"
          : "hover:bg-white/[0.04]"
      }`}
    >
      <span className="w-5 text-[10px] font-mono text-white/20 text-right shrink-0">
        {rank}
      </span>
      <TierDot tier={cs.tier} />
      <span className={`flex-1 text-[11px] font-medium truncate ${isSelected ? "text-white/90" : "text-white/55"}`}>
        {cs.name}
      </span>
      <span className={`text-[11px] font-bold tabular-nums ${
        cs.tier === "green" ? "text-emerald-400/80" : cs.tier === "orange" ? "text-amber-400/80" : "text-red-400/80"
      }`}>
        {cs.score}
      </span>
    </button>
  );
}

function ScoreSummary({ scores }: { scores: CountryScore[] }) {
  const green = scores.filter((s) => s.tier === "green").length;
  const orange = scores.filter((s) => s.tier === "orange").length;
  const red = scores.filter((s) => s.tier === "red").length;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          <span className="text-[10px] text-white/30">{green}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="text-[10px] text-white/30">{orange}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="text-[10px] text-white/30">{red}</span>
        </div>
      </div>
      <span className="text-[9px] text-white/15">{scores.length} total</span>
    </div>
  );
}
