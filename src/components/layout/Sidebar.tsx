"use client";

import { MODULES, scoreAllCountries, type ModuleId, type CountryScore } from "@/lib/scoring";
import { useI18n, LOCALE_LABELS, type Locale } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useMemo, useState } from "react";

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
function ModuleIcon({ id, size = 18 }: { id: ModuleId; size?: number }) {
  const iconMap: Record<ModuleId, React.ReactNode> = {
    investment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    tax: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="3" />
        <path d="M8 7v10M12 7v10M16 7v10" />
        <path d="M2 12h20" />
      </svg>
    ),
    safety: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    visa: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    cost_of_living: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    quality_of_life: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
      </svg>
    ),
  };
  return <>{iconMap[id]}</>;
}

function TierDot({ tier }: { tier: "green" | "orange" | "red" }) {
  const colors = {
    green: "bg-emerald-400 shadow-emerald-400/40",
    orange: "bg-amber-400 shadow-amber-400/40",
    red: "bg-red-400 shadow-red-400/40",
  };
  return <span className={`h-[6px] w-[6px] rounded-full shadow-sm ${colors[tier]}`} />;
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
  const { locale, setLocale } = useI18n();
  const { hasCompletedOnboarding } = useProfile();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeModuleDef = MODULES.find((m) => m.id === activeModule);

  return (
    <>
      {/* ── Thin Icon Rail ── */}
      <aside className="fixed left-0 top-0 z-30 h-full w-[72px] flex flex-col items-center border-r border-white/[0.04] bg-[#060610]/90 backdrop-blur-2xl">
        {/* Logo */}
        <div className="flex h-[64px] w-full items-center justify-center shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-blue-500/15 transition-all duration-300 hover:scale-105 hover:from-cyan-500/25 hover:via-violet-500/15 hover:to-blue-500/25 group"
          >
            <div className="absolute inset-px rounded-[13px] bg-[#080814]/90" />
            <span className="relative text-sm font-bold ax-gradient-text-brand">A</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#060610] ax-pulse-dot" />
          </button>
        </div>

        {/* Separator */}
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-2" />

        {/* Module Icons */}
        <nav className="flex flex-col items-center gap-1 py-1">
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => onModuleChange(mod.id)}
                className={`ax-rail-btn ax-tooltip ${isActive ? "active" : ""}`}
                data-tip={mod.label}
              >
                <ModuleIcon id={mod.id} size={18} />
              </button>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent my-2" />

        {/* Tool Icons */}
        <nav className="flex flex-col items-center gap-1">
          {/* AI */}
          <button onClick={onOpenAI} className="ax-rail-btn ax-tooltip" data-tip="AI Advisor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
          </button>
          {/* Compare */}
          <button onClick={onOpenCompare} className="ax-rail-btn ax-tooltip relative" data-tip="Compare">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            {compareCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-[8px] font-bold text-white shadow-lg shadow-violet-500/30 ring-2 ring-[#060610]">
                {compareCount}
              </span>
            )}
          </button>
          {/* Profile */}
          <button onClick={onOpenProfile} className="ax-rail-btn ax-tooltip" data-tip={hasCompletedOnboarding ? "Profile" : "Set up"}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={hasCompletedOnboarding ? "text-emerald-400/60" : ""}>
              <circle cx="12" cy="8" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>
          </button>
          {/* Results */}
          <button onClick={onOpenRecommendations} className="ax-rail-btn ax-tooltip" data-tip={hasCompletedOnboarding ? "Results" : "Match"}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={hasCompletedOnboarding ? "text-amber-400/60" : ""}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
            </svg>
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Language toggle at bottom */}
        <div className="flex flex-col items-center gap-0.5 pb-4">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`w-8 h-6 rounded-md text-[9px] font-bold tracking-wider transition-all duration-200 ${
                locale === loc
                  ? "text-white/80 bg-white/[0.08]"
                  : "text-white/20 hover:text-white/50 hover:bg-white/[0.04]"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Expandable Rankings Drawer ── */}
      <div
        className={`fixed left-[72px] top-0 z-20 h-full w-[280px] border-r border-white/[0.04] bg-[#080814]/95 backdrop-blur-2xl flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <div>
            <h2 className="text-[13px] font-semibold text-white/85 tracking-tight">
              {activeModuleDef?.label || "Rankings"}
            </h2>
            <p className="text-[10px] text-white/25 mt-0.5">{scores.length} countries analyzed</p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all"
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Score Summary Bar */}
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <ScoreSummary scores={scores} />
        </div>

        {/* Rankings List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
          {scores.map((cs, idx) => (
            <CountryRow
              key={cs.iso}
              cs={cs}
              rank={idx + 1}
              isSelected={selectedIso === cs.iso}
              onClick={() => {
                onCountrySelect(cs.iso);
                setIsExpanded(false);
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Click-away overlay ── */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}

function CountryRow({ cs, rank, isSelected, onClick }: { cs: CountryScore; rank: number; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
        isSelected
          ? "bg-white/[0.07] shadow-sm shadow-white/[0.02]"
          : "hover:bg-white/[0.04]"
      }`}
    >
      <span className="w-5 text-[10px] font-mono text-white/20 text-right shrink-0 tabular-nums">
        {rank}
      </span>
      <TierDot tier={cs.tier} />
      <span className={`flex-1 text-[12px] font-medium truncate transition-colors ${isSelected ? "text-white/90" : "text-white/55"}`}>
        {cs.name}
      </span>
      <span className={`text-[12px] font-semibold tabular-nums ${
        cs.tier === "green" ? "text-emerald-400/80" : cs.tier === "orange" ? "text-amber-400/75" : "text-red-400/70"
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
  const total = scores.length;

  return (
    <div className="space-y-2">
      {/* Bar visualization */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.03]">
        {green > 0 && (
          <div
            className="h-full bg-emerald-400/60 transition-all duration-700"
            style={{ width: `${(green / total) * 100}%` }}
          />
        )}
        {orange > 0 && (
          <div
            className="h-full bg-amber-400/50 transition-all duration-700"
            style={{ width: `${(orange / total) * 100}%` }}
          />
        )}
        {red > 0 && (
          <div
            className="h-full bg-red-400/50 transition-all duration-700"
            style={{ width: `${(red / total) * 100}%` }}
          />
        )}
      </div>
      {/* Labels */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
            <span className="text-white/30">{green}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
            <span className="text-white/30">{orange}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400/70" />
            <span className="text-white/30">{red}</span>
          </div>
        </div>
        <span className="text-white/15">{total} total</span>
      </div>
    </div>
  );
}
