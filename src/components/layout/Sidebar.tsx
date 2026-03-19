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

/* ── Module icons as clean SVGs ── */
function ModuleIcon({ id, size = 16 }: { id: ModuleId; size?: number }) {
  const s = (d: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
  const iconMap: Record<ModuleId, React.ReactNode> = {
    overview: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    investment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    tax: s("M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"),
    safety: s("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
    visa: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
    cost_of_living: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    quality_of_life: s("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"),
    economic_growth: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    war_risk: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    political_stability: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    business: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    strategic_opportunity: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
  };
  return <>{iconMap[id]}</>;
}

const CORE_MODULES: ModuleId[] = ["overview", "investment", "tax", "safety", "visa", "cost_of_living", "quality_of_life"];
const STRATEGIC_MODULES: ModuleId[] = ["economic_growth", "war_risk", "political_stability", "business", "strategic_opportunity"];

function TierDot({ tier }: { tier: "green" | "orange" | "red" }) {
  const colors = {
    green: "bg-emerald-400",
    orange: "bg-amber-400",
    red: "bg-red-400",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${colors[tier]}`} />;
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
  const top5 = scores.slice(0, 5);
  const { locale, setLocale } = useI18n();
  const { hasCompletedOnboarding } = useProfile();
  const activeModuleDef = MODULES.find((m) => m.id === activeModule);

  const tierCounts = useMemo(() => {
    const g = scores.filter((s) => s.tier === "green").length;
    const o = scores.filter((s) => s.tier === "orange").length;
    const r = scores.filter((s) => s.tier === "red").length;
    return { g, o, r, total: scores.length };
  }, [scores]);

  function renderModuleGroup(label: string, modules: ModuleId[]) {
    return (
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 px-4 mb-1.5">{label}</p>
        <div className="space-y-px">
          {modules.map((id) => {
            const mod = MODULES.find((m) => m.id === id)!;
            const isActive = activeModule === id;
            return (
              <button
                key={id}
                onClick={() => onModuleChange(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 rounded-lg mx-0 group relative ${
                  isActive
                    ? "bg-white/[0.08] text-white/90"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/65"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-400" />
                )}
                <span className={`shrink-0 transition-colors ${isActive ? "text-cyan-400/80" : "text-white/25 group-hover:text-white/45"}`}>
                  <ModuleIcon id={id} size={15} />
                </span>
                <span className={`text-[12px] font-medium truncate transition-colors ${isActive ? "text-white/90" : ""}`}>
                  {mod.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-30 h-full w-[280px] flex flex-col border-r border-white/[0.06] bg-[#08081a]/95 backdrop-blur-2xl">
      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-blue-500/20">
            <div className="absolute inset-px rounded-[10px] bg-[#0a0a18]/90" />
            <span className="relative text-sm font-black ax-gradient-text-brand tracking-tight">A</span>
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight ax-gradient-text">ATLAS X</h1>
            <p className="text-[9px] text-white/20 font-medium tracking-[0.15em] uppercase">Geopolitical Intelligence</p>
          </div>
        </div>
      </div>

      {/* ── Gradient divider ── */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* ── Modules ── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5 scrollbar-thin min-h-0 px-1">
        {renderModuleGroup("CORE ANALYSIS", CORE_MODULES)}
        {renderModuleGroup("STRATEGIC", STRATEGIC_MODULES)}
      </div>

      {/* ── Gradient divider ── */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* ── Top Rankings Preview ── */}
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">TOP RANKINGS</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400/70" />
              <span className="text-[8px] text-white/20 tabular-nums">{tierCounts.g}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-amber-400/70" />
              <span className="text-[8px] text-white/20 tabular-nums">{tierCounts.o}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-red-400/70" />
              <span className="text-[8px] text-white/20 tabular-nums">{tierCounts.r}</span>
            </div>
          </div>
        </div>

        {/* Score distribution bar */}
        <div className="flex h-[2px] rounded-full overflow-hidden bg-white/[0.03] mb-3">
          {tierCounts.g > 0 && <div className="h-full bg-emerald-400/50 rounded-full" style={{ width: `${(tierCounts.g / tierCounts.total) * 100}%` }} />}
          {tierCounts.o > 0 && <div className="h-full bg-amber-400/40 rounded-full" style={{ width: `${(tierCounts.o / tierCounts.total) * 100}%` }} />}
          {tierCounts.r > 0 && <div className="h-full bg-red-400/40 rounded-full" style={{ width: `${(tierCounts.r / tierCounts.total) * 100}%` }} />}
        </div>

        {/* Top 5 */}
        <div className="space-y-0.5">
          {top5.map((cs, idx) => {
            const rank = idx + 1;
            const isSelected = selectedIso === cs.iso;
            const medalClass = rank === 1 ? "ax-medal-gold" : rank === 2 ? "ax-medal-silver" : rank === 3 ? "ax-medal-bronze" : "";
            const medalSymbol = rank === 1 ? "★" : rank === 2 ? "★" : rank === 3 ? "★" : null;
            return (
              <button
                key={cs.iso}
                onClick={() => onCountrySelect(cs.iso)}
                className={`w-full flex flex-col rounded-lg px-2.5 py-1.5 text-left transition-all duration-150 group border-l-2 ${
                  isSelected
                    ? "bg-white/[0.08] border-l-cyan-400/50"
                    : rank === 1
                    ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.07] border-l-transparent hover:border-l-amber-400/30"
                    : "hover:bg-white/[0.04] border-l-transparent hover:border-l-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5 w-full">
                  {medalSymbol ? (
                    <span className={`w-4 text-[10px] font-bold text-right shrink-0 ${medalClass}`}>
                      {medalSymbol}
                    </span>
                  ) : (
                    <span className="w-4 text-[10px] font-bold tabular-nums text-white/15 text-right shrink-0">
                      {rank}
                    </span>
                  )}
                  <TierDot tier={cs.tier} />
                  <span className={`text-[11px] font-medium truncate flex-1 ${isSelected ? "text-white/85" : "text-white/50 group-hover:text-white/65"}`}>
                    {cs.name}
                  </span>
                  <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${
                    cs.tier === "green" ? "ax-score-text-green" : cs.tier === "orange" ? "text-amber-400/65" : "text-red-400/60"
                  }`}>
                    {cs.score}
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="ml-[26px] mt-1 h-[1.5px] w-[calc(100%-26px)] rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cs.tier === "green" ? "bg-emerald-400/40" : cs.tier === "orange" ? "bg-amber-400/30" : "bg-red-400/30"
                    }`}
                    style={{ width: `${cs.score}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[9px] text-white/15">{scores.length} countries analyzed</p>
          {top5.length > 0 && (
            <button
              onClick={() => onCountrySelect(top5[0].iso)}
              className="text-[9px] text-cyan-400/40 hover:text-cyan-400/70 transition-colors font-medium"
            >
              View All Rankings
            </button>
          )}
        </div>
      </div>

      {/* ── Gradient divider ── */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* ── Tool Actions ── */}
      <div className="shrink-0 px-3 py-3 space-y-1">
        <button onClick={onOpenAI} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/35 hover:bg-cyan-500/[0.06] hover:text-cyan-400/70 transition-all group border-l-2 border-l-cyan-400/20">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400/50 group-hover:text-cyan-400/80 transition-colors">
            <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          </svg>
          <span className="text-[12px] font-medium">AI Advisor</span>
        </button>
        <button onClick={onOpenCompare} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/35 hover:bg-violet-500/[0.06] hover:text-violet-400/70 transition-all group relative border-l-2 border-l-violet-400/20">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400/50 group-hover:text-violet-400/80 transition-colors">
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span className="text-[12px] font-medium">Compare</span>
          {compareCount > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/80 text-[9px] font-bold text-white">{compareCount}</span>
          )}
        </button>
        <button onClick={onOpenProfile} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/35 hover:bg-white/[0.04] hover:text-white/60 transition-all">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={hasCompletedOnboarding ? "text-emerald-400/50" : ""}>
            <circle cx="12" cy="8" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
          </svg>
          <span className="text-[12px] font-medium">{hasCompletedOnboarding ? "Profile" : "Set Up Profile"}</span>
          {hasCompletedOnboarding && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400/60" />}
        </button>
        <button onClick={onOpenRecommendations} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/35 hover:bg-white/[0.04] hover:text-white/60 transition-all">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={hasCompletedOnboarding ? "text-amber-400/50" : ""}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
          </svg>
          <span className="text-[12px] font-medium">{hasCompletedOnboarding ? "My Results" : "Get Matched"}</span>
        </button>
      </div>

      {/* ── Language ── */}
      <div className="shrink-0 px-4 pb-4 pt-1">
        <div className="flex items-center gap-1 justify-center">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider transition-all duration-200 ${
                locale === loc
                  ? "text-white/80 bg-white/[0.08]"
                  : "text-white/20 hover:text-white/45 hover:bg-white/[0.03]"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
