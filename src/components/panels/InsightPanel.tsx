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

/* ── Score Ring ── */
function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const tier = getScoreTier(score);
  const gradId = tier === "green" ? "ring-grad-g" : tier === "orange" ? "ring-grad-o" : "ring-grad-r";
  const glowColor =
    tier === "green" ? "rgba(52,211,153,0.15)" : tier === "orange" ? "rgba(251,191,36,0.15)" : "rgba(248,113,113,0.15)";
  const tc = tierColor(tier);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-xl" style={{ background: glowColor }} />
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ax-circle-draw"
          style={{ "--ax-circumference": circumference } as React.CSSProperties}
        />
      </svg>
      <div className="relative text-center">
        <span className={`text-2xl font-bold tracking-tight ${tc.text}`}>{score}</span>
        <span className="block text-[9px] font-medium text-white/25 tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

/* ── Breakdown Bar ── */
function BreakdownBar({ label, score, tier, delay }: { label: string; score: number; tier: "green" | "orange" | "red"; delay: number }) {
  const tc = tierColor(tier);
  const barColor =
    tier === "green" ? "from-emerald-400/70 to-cyan-400/40" : tier === "orange" ? "from-amber-400/60 to-yellow-400/40" : "from-red-400/60 to-rose-400/40";

  return (
    <div className="py-2.5 ax-section-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-white/45">{label}</span>
        <span className={`text-[12px] font-bold tabular-nums ${tc.text}`}>{score}</span>
      </div>
      <div className="h-[5px] w-full rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} ax-bar-fill`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/* ── Insights Generator ── */
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

  if (risks.length === 0) risks.push("No major risks identified for this module");
  if (opportunities.length === 0) opportunities.push("Baseline conditions are adequate");

  return { risks: risks.slice(0, 3), opportunities: opportunities.slice(0, 4) };
}

/* ── Key Stats ── */
function ModuleStats({ country, module }: { country: Country; module: ModuleId }) {
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
    <div className="divide-y divide-white/[0.04]">
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 ax-section-in" style={{ animationDelay: `${200 + i * 60}ms` }}>
          <span className="text-[12px] text-white/35">{s.label}</span>
          <span className="text-[12px] font-semibold text-white/75 capitalize">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ title, delay }: { title: string; delay: number }) {
  return (
    <div className="ax-section-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="ax-divider mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20 whitespace-nowrap">{title}</span>
      </div>
    </div>
  );
}

/* ── Main Panel ── */
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-35 ax-overlay-backdrop ax-scale-in"
        style={{ animationDuration: "0.3s" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-4 top-4 bottom-4 z-40 w-full max-w-[400px] rounded-2xl ax-glass-3 shadow-2xl shadow-black/60 flex flex-col overflow-hidden ax-panel-in">
        {/* Top accent line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Header */}
        <div className="relative px-6 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                  <span className="text-xs">{moduleDef.icon}</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{moduleDef.label} Analysis</span>
              </div>
              <h2 className="text-xl font-bold ax-gradient-text tracking-tight">{country.name[locale]}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all mt-1"
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin">
          {/* Score Hero */}
          <div className="flex flex-col items-center py-4 ax-section-in">
            <ScoreRing score={score} />
            <div className="mt-4">
              <span className={`ax-tier-badge ${tc.bg} ${tc.border} border ${tc.text}`}>
                <span className={`h-[6px] w-[6px] rounded-full ${tc.dot}`} />
                {tier === "green" ? "Excellent" : tier === "orange" ? "Average" : "Poor"}
              </span>
            </div>
          </div>

          {/* Score Breakdown */}
          <SectionHeader title="Score Breakdown" delay={80} />
          <div className="ax-insight-card ax-glass-1 mb-6">
            {breakdown.map((b, i) => (
              <BreakdownBar key={b.label} label={b.label} score={b.score} tier={b.tier} delay={120 + i * 60} />
            ))}
          </div>

          {/* Key Data */}
          <SectionHeader title="Key Data" delay={200} />
          <div className="ax-insight-card ax-glass-1 mb-6">
            <ModuleStats country={country} module={module} />
          </div>

          {/* Opportunities */}
          <SectionHeader title="Opportunities" delay={280} />
          <div className="space-y-2 mb-6">
            {insights.opportunities.map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-emerald-500/[0.08] bg-emerald-500/[0.03] px-4 py-3 ax-section-in"
                style={{ animationDelay: `${320 + i * 60}ms` }}
              >
                <div className="mt-1.5 h-[6px] w-[6px] shrink-0 rounded-full bg-emerald-400/50" />
                <span className="text-[12px] leading-relaxed text-emerald-400/70">{text}</span>
              </div>
            ))}
          </div>

          {/* Risks */}
          <SectionHeader title="Risks" delay={400} />
          <div className="space-y-2 mb-6">
            {insights.risks.map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-red-500/[0.08] bg-red-500/[0.03] px-4 py-3 ax-section-in"
                style={{ animationDelay: `${440 + i * 60}ms` }}
              >
                <div className="mt-1.5 h-[6px] w-[6px] shrink-0 rounded-full bg-red-400/50" />
                <span className="text-[12px] leading-relaxed text-red-400/65">{text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 ax-section-in" style={{ animationDelay: "520ms" }}>
            {onAddToCompare && (
              <button
                onClick={() => onAddToCompare(country.iso_code)}
                className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl ax-glass-1 px-4 py-3.5 text-[12px] font-semibold text-white/50 hover:text-violet-400/90 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                Compare
              </button>
            )}
            {onAskAI && (
              <button
                onClick={() => onAskAI(country.iso_code)}
                className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/[0.08] to-blue-500/[0.05] border border-cyan-500/[0.12] px-4 py-3.5 text-[12px] font-semibold text-cyan-400/70 hover:text-cyan-400 hover:border-cyan-500/25 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                </svg>
                Ask AI
              </button>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 ax-section-in" style={{ animationDelay: "600ms" }}>
            <p className="text-[12px] leading-relaxed text-white/25 italic">
              {country.short_description[locale]}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
