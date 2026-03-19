"use client";

import { useMemo } from "react";
import { getCountryByIso, type Country } from "@/data/countries";
import { useI18n } from "@/contexts/I18nContext";
import {
  scoreCountry,
  getScoreBreakdown,
  getScoreTier,
  tierColor,
  MODULES,
  type ModuleId,
} from "@/lib/scoring";

interface InsightPanelProps {
  iso: string | null;
  module: ModuleId;
  isOpen: boolean;
  onClose: () => void;
  onAskAI?: (iso: string) => void;
  onAddToCompare?: (iso: string) => void;
}

// ---------------------------------------------------------------------------
// Score ring with gradient
// ---------------------------------------------------------------------------
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const tier = getScoreTier(score);
  const gradId = tier === "green" ? "ring-grad-g" : tier === "orange" ? "ring-grad-o" : "ring-grad-r";
  const glowColor =
    tier === "green" ? "rgba(52,211,153,0.2)" : tier === "orange" ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)";
  const tc = tierColor(tier);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-lg" style={{ background: glowColor }} />
      <svg width={size} height={size} className="absolute -rotate-90">
        <defs>
          <linearGradient id="ring-grad-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="ring-grad-o" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="ring-grad-r" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ax-circle-draw"
          style={{ "--ax-circumference": circumference } as React.CSSProperties}
        />
      </svg>
      <div className="relative text-center">
        <span className={`text-2xl font-bold ${tc.text}`}>{score}</span>
        <span className="block text-[8px] font-semibold uppercase tracking-wider text-white/30">/ 100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breakdown bar
// ---------------------------------------------------------------------------
function BreakdownBar({ label, score, tier }: { label: string; score: number; tier: "green" | "orange" | "red" }) {
  const tc = tierColor(tier);
  const barColor =
    tier === "green" ? "from-emerald-400/70 to-cyan-400/50" : tier === "orange" ? "from-amber-400/60 to-yellow-400/50" : "from-red-400/60 to-rose-400/50";

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-white/45">{label}</span>
        <span className={`text-[12px] font-bold tabular-nums ${tc.text}`}>{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} ax-bar-fill`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI-generated insights per module
// ---------------------------------------------------------------------------
function generateInsights(country: Country, module: ModuleId, score: number): { risks: string[]; opportunities: string[] } {
  const risks: string[] = [];
  const opportunities: string[] = [];

  switch (module) {
    case "investment":
      if (country.economy.inflation > 5) risks.push(`High inflation at ${country.economy.inflation}% erodes returns`);
      if (country.government.political_stability === "unstable") risks.push("Political instability creates investment uncertainty");
      if (country.economy.gdp_per_capita > 30000) opportunities.push("Strong consumer market with high purchasing power");
      if (country.tax.level === "low") opportunities.push("Favorable tax environment attracts foreign capital");
      if (country.economy.inflation < 3) opportunities.push("Price stability supports long-term planning");
      if (country.government.political_stability === "stable") opportunities.push("Stable governance protects investments");
      break;
    case "tax":
      if (country.tax.level === "high") risks.push("High overall tax burden reduces net income");
      if (country.tax.level === "low") opportunities.push("Low tax jurisdiction ideal for optimization");
      opportunities.push(`Income tax: ${country.tax.income_tax}`);
      opportunities.push(`Corporate tax: ${country.tax.corporate_tax}`);
      break;
    case "safety":
      if (country.safety.crime_index > 60) risks.push(`Elevated crime index (${country.safety.crime_index}/100)`);
      if (country.military.nuclear_weapon) risks.push("Nuclear-armed nation — geopolitical tension factor");
      if (country.government.political_stability === "unstable") risks.push("Political instability creates security risks");
      if (country.safety.safety_index > 70) opportunities.push("High safety index provides secure environment");
      if (country.government.political_stability === "stable") opportunities.push("Stable governance ensures rule of law");
      break;
    case "visa":
      if (country.visa.ease_of_access === "hard") risks.push("Complex visa process with strict requirements");
      if (country.visa.ease_of_access === "easy") opportunities.push("Streamlined visa process for most nationalities");
      if (country.visa.residency_options) opportunities.push(`Residency: ${country.visa.residency_options}`);
      break;
    case "cost_of_living":
      if (country.cost_of_living.index > 70) risks.push("High cost of living requires substantial budget");
      if (country.cost_of_living.average_salary < 1500) risks.push("Low average salary limits local opportunities");
      if (country.cost_of_living.index < 40) opportunities.push("Very affordable — ideal for remote workers");
      if (country.cost_of_living.average_salary > 3000) opportunities.push(`Strong salaries ($${country.cost_of_living.average_salary.toLocaleString()}/mo)`);
      break;
    case "quality_of_life":
      if (country.population_data.life_expectancy < 70) risks.push(`Lower life expectancy (${country.population_data.life_expectancy} years)`);
      if (country.population_data.life_expectancy > 78) opportunities.push(`High life expectancy (${country.population_data.life_expectancy} years)`);
      if (country.safety.safety_index > 65) opportunities.push("Safe and secure living environment");
      if (country.economy.gdp_per_capita > 25000) opportunities.push("Strong economy supports quality services");
      break;
  }

  // Always have at least one item
  if (risks.length === 0) risks.push("No major risks identified for this module");
  if (opportunities.length === 0) opportunities.push("Baseline conditions are adequate");

  return { risks: risks.slice(0, 3), opportunities: opportunities.slice(0, 4) };
}

// ---------------------------------------------------------------------------
// Key stats per module
// ---------------------------------------------------------------------------
function ModuleStats({ country, module }: { country: Country; module: ModuleId }) {
  const { locale } = useI18n();

  const stats: { label: string; value: string }[] = useMemo(() => {
    switch (module) {
      case "investment":
        return [
          { label: "GDP per Capita", value: `$${country.economy.gdp_per_capita.toLocaleString()}` },
          { label: "Inflation", value: `${country.economy.inflation}%` },
          { label: "Currency", value: country.economy.currency },
          { label: "Stability", value: country.government.political_stability },
        ];
      case "tax":
        return [
          { label: "Tax Level", value: country.tax.level },
          { label: "Income Tax", value: country.tax.income_tax },
          { label: "Corporate Tax", value: country.tax.corporate_tax },
        ];
      case "safety":
        return [
          { label: "Safety Index", value: `${country.safety.safety_index}/100` },
          { label: "Crime Index", value: `${country.safety.crime_index}/100` },
          { label: "Stability", value: country.government.political_stability },
          { label: "Nuclear", value: country.military.nuclear_weapon ? "Yes" : "No" },
        ];
      case "visa":
        return [
          { label: "Visa Access", value: country.visa.ease_of_access },
          { label: "Residency", value: country.visa.residency_options },
          { label: "Stability", value: country.government.political_stability },
        ];
      case "cost_of_living":
        return [
          { label: "Cost Index", value: `${country.cost_of_living.index}/100` },
          { label: "Avg Salary", value: `$${country.cost_of_living.average_salary.toLocaleString()}/mo` },
          { label: "Currency", value: country.economy.currency },
        ];
      case "quality_of_life":
        return [
          { label: "Life Expectancy", value: `${country.population_data.life_expectancy} yr` },
          { label: "Safety", value: `${country.safety.safety_index}/100` },
          { label: "Cost Index", value: `${country.cost_of_living.index}` },
          { label: "GDP/Capita", value: `$${country.economy.gdp_per_capita.toLocaleString()}` },
        ];
    }
  }, [country, module]);

  return (
    <div className="space-y-0.5">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-white/[0.03]">
          <span className="text-[12px] text-white/40">{s.label}</span>
          <span className="text-[12px] font-semibold text-white/80 capitalize">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main InsightPanel
// ---------------------------------------------------------------------------
export default function InsightPanel({ iso, module, isOpen, onClose, onAskAI, onAddToCompare }: InsightPanelProps) {
  const { locale } = useI18n();

  const country = useMemo(() => (iso ? getCountryByIso(iso) : undefined), [iso]);
  const moduleDef = MODULES.find((m) => m.id === module)!;

  const score = useMemo(() => (country ? scoreCountry(country, module) : 0), [country, module]);
  const tier = getScoreTier(score);
  const tc = tierColor(tier);
  const breakdown = useMemo(() => (country ? getScoreBreakdown(country, module) : []), [country, module]);
  const insights = useMemo(() => (country ? generateInsights(country, module, score) : { risks: [], opportunities: [] }), [country, module, score]);

  if (!isOpen || !country) return null;

  return (
    <div className="fixed right-0 top-0 z-40 h-full w-full max-w-[380px] border-l border-white/[0.06] bg-[#070711]/97 backdrop-blur-2xl shadow-2xl shadow-black/60 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{moduleDef.icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">{moduleDef.label} Analysis</span>
          </div>
          <h2 className="text-lg font-bold ax-gradient-text truncate">{country.name[locale]}</h2>
        </div>
        <button
          onClick={onClose}
          className="ax-btn flex h-8 w-8 items-center justify-center rounded-full ax-glass-1 text-white/35 hover:text-white/70 transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
        {/* Score hero */}
        <div className="flex flex-col items-center py-2 ax-section-in">
          <ScoreRing score={score} />
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full ${tc.bg} ${tc.border} border px-3 py-1 text-[11px] font-bold ${tc.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tc.dot}`} />
              {tier === "green" ? "Excellent" : tier === "orange" ? "Average" : "Poor"}
            </span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="ax-section-in" style={{ animationDelay: "80ms" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25 mb-3">Score Breakdown</h3>
          <div className="rounded-xl ax-glass-1 p-4">
            {breakdown.map((b) => (
              <BreakdownBar key={b.label} label={b.label} score={b.score} tier={b.tier} />
            ))}
          </div>
        </div>

        {/* Key Statistics */}
        <div className="ax-section-in" style={{ animationDelay: "160ms" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25 mb-3">Key Data</h3>
          <div className="rounded-xl ax-glass-1 p-4">
            <ModuleStats country={country} module={module} />
          </div>
        </div>

        {/* Opportunities */}
        <div className="ax-section-in" style={{ animationDelay: "240ms" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25 mb-3">Opportunities</h3>
          <div className="space-y-2">
            {insights.opportunities.map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-3.5 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                <span className="text-[12px] leading-relaxed text-emerald-400/75">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div className="ax-section-in" style={{ animationDelay: "320ms" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25 mb-3">Risks</h3>
          <div className="space-y-2">
            {insights.risks.map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-3.5 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/60" />
                <span className="text-[12px] leading-relaxed text-red-400/70">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="ax-section-in flex gap-2.5" style={{ animationDelay: "400ms" }}>
          {onAddToCompare && (
            <button
              onClick={() => onAddToCompare(country.iso_code)}
              className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl ax-glass-1 px-4 py-3 text-[12px] font-semibold text-white/55 hover:text-violet-400/90 transition-all"
            >
              Compare
            </button>
          )}
          {onAskAI && (
            <button
              onClick={() => onAskAI(country.iso_code)}
              className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.05] border border-cyan-500/15 px-4 py-3 text-[12px] font-semibold text-cyan-400/70 hover:text-cyan-400 transition-all"
            >
              Ask AI
            </button>
          )}
        </div>

        {/* Description */}
        <div className="ax-section-in" style={{ animationDelay: "480ms" }}>
          <p className="text-[12px] leading-relaxed text-white/30 italic">
            {country.short_description[locale]}
          </p>
        </div>
      </div>
    </div>
  );
}
