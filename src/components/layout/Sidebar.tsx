"use client";

import { MODULES, scoreAllCountries, type ModuleId, type CountryScore } from "@/lib/scoring";
import { useMemo } from "react";

interface SidebarProps {
  activeModule: ModuleId;
  onModuleChange: (module: ModuleId) => void;
  onCountrySelect: (iso: string) => void;
  selectedIso: string | null;
}

function TierDot({ tier }: { tier: "green" | "orange" | "red" }) {
  const colors = {
    green: "bg-emerald-400 shadow-emerald-400/40",
    orange: "bg-amber-400 shadow-amber-400/40",
    red: "bg-red-400 shadow-red-400/40",
  };
  return <span className={`h-2 w-2 rounded-full shadow-sm ${colors[tier]}`} />;
}

export default function Sidebar({ activeModule, onModuleChange, onCountrySelect, selectedIso }: SidebarProps) {
  const scores = useMemo(() => scoreAllCountries(activeModule), [activeModule]);
  const activeModuleDef = MODULES.find((m) => m.id === activeModule)!;

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
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-5 py-3 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">Rankings</p>
          <span className="text-[9px] font-medium text-white/15">{scores.length} countries</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
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

      {/* Module summary footer */}
      <div className="border-t border-white/[0.06] px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoreSummary scores={scores} />
          </div>
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
  );
}
