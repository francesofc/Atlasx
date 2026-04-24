"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { getCountryByIso, type Country } from "@/data/countries";
import { useI18n } from "@/contexts/I18nContext";
import { getCultureByIso, type CountryCulture } from "@/data/country-culture";
import {
  scoreCountry,
  getScoreBreakdown,
  getScoreTier,
  tierColor,
  getModuleExplanation,
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

type Tab = "overview" | "analytics" | "culture";

/* ── Wikipedia image hook ── */
function useCountryImage(wikiSlug: string): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wikiSlug) { setLoading(false); return; }
    setUrl(null);
    setLoading(true);
    const controller = new AbortController();
    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        const src = data?.originalimage?.source || data?.thumbnail?.source || null;
        setUrl(src);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [wikiSlug]);

  return { url, loading };
}

/* ── Score Ring ── */
function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
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
      <div className="h-[6px] w-full rounded-full bg-white/[0.04] overflow-hidden">
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
    case "overview":
      if (score >= 70) opportunities.push("Strong performer across multiple dimensions");
      if (country.government.political_stability === "stable") opportunities.push("Solid institutional foundation");
      if (country.economy.gdp_per_capita > 20000) opportunities.push("Developed economic base");
      if (score < 40) risks.push("Significant challenges across multiple areas");
      if (country.government.political_stability === "unstable") risks.push("Governance concerns affect overall outlook");
      break;
    case "economic_growth":
      if (country.economy.inflation > 8) risks.push(`High inflation at ${country.economy.inflation}% threatens stability`);
      if (country.economy.inflation < 3) opportunities.push("Low inflation creates stable growth conditions");
      if (country.economy.gdp_per_capita > 40000) opportunities.push("Mature, high-income economy");
      if (country.economy.gdp_per_capita < 5000) risks.push("Low GDP per capita signals development challenges");
      if (country.cost_of_living.average_salary > 3000) opportunities.push("Strong wage growth supports domestic demand");
      break;
    case "war_risk":
      if (country.military.nuclear_weapon) risks.push("Nuclear-armed — elevated geopolitical tension");
      if (country.government.political_stability === "unstable") risks.push("Political instability increases conflict probability");
      if (country.safety.safety_index > 70) opportunities.push("High safety index indicates low conflict exposure");
      if (country.government.political_stability === "stable") opportunities.push("Stable governance reduces military conflict risk");
      if (country.safety.crime_index > 50) risks.push("Elevated internal security concerns");
      break;
    case "political_stability":
      if (country.government.political_stability === "unstable") risks.push("Weak governance creates unpredictable policy environment");
      if (country.government.political_stability === "stable") opportunities.push("Strong institutions ensure policy predictability");
      if (country.safety.safety_index > 65) opportunities.push("Low internal tension supports governance");
      if (country.population_data.life_expectancy > 78) opportunities.push("High life expectancy correlates with quality governance");
      if (country.safety.crime_index > 55) risks.push("Elevated crime suggests enforcement gaps");
      break;
    case "business":
      if (country.tax.level === "low") opportunities.push("Tax-friendly environment for business formation");
      if (country.tax.level === "high") risks.push("High tax burden increases operating costs");
      if (country.visa.ease_of_access === "easy") opportunities.push("Easy visa access facilitates talent mobility");
      if (country.government.political_stability === "stable") opportunities.push("Stable governance protects business interests");
      if (country.economy.gdp_per_capita > 30000) opportunities.push("Strong consumer market for B2C businesses");
      break;
    case "strategic_opportunity":
      if (country.economy.gdp_per_capita < 15000 && country.government.political_stability !== "unstable") opportunities.push("Emerging market with growth runway");
      if (country.cost_of_living.index < 40) opportunities.push("Low operating costs create competitive advantage");
      if (country.visa.ease_of_access === "easy") opportunities.push("Accessible market entry via visa pathways");
      if (country.government.political_stability === "unstable") risks.push("Political risk may offset opportunity gains");
      if (country.economy.inflation > 10) risks.push("High inflation erodes strategic investment value");
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
      case "overview":
        return [
          { label: "GDP/Capita", value: `$${country.economy.gdp_per_capita.toLocaleString()}` },
          { label: "Safety", value: `${country.safety.safety_index}/100` },
          { label: "Stability", value: country.government.political_stability },
          { label: "Tax Level", value: country.tax.level },
          { label: "Visa", value: country.visa.ease_of_access },
        ];
      case "economic_growth":
        return [
          { label: "GDP/Capita", value: `$${country.economy.gdp_per_capita.toLocaleString()}` },
          { label: "Inflation", value: `${country.economy.inflation}%` },
          { label: "Avg Salary", value: `$${country.cost_of_living.average_salary.toLocaleString()}/mo` },
          { label: "Stability", value: country.government.political_stability },
        ];
      case "war_risk":
        return [
          { label: "Safety Index", value: `${country.safety.safety_index}/100` },
          { label: "Nuclear", value: country.military.nuclear_weapon ? "Yes" : "No" },
          { label: "Military Power", value: `${country.military.power_index}` },
          { label: "Stability", value: country.government.political_stability },
        ];
      case "political_stability":
        return [
          { label: "Stability", value: country.government.political_stability },
          { label: "Safety Index", value: `${country.safety.safety_index}/100` },
          { label: "Crime Index", value: `${country.safety.crime_index}/100` },
          { label: "Life Expectancy", value: `${country.population_data.life_expectancy} yr` },
          { label: "Government", value: country.government.type },
        ];
      case "business":
        return [
          { label: "Tax Level", value: country.tax.level },
          { label: "Corporate Tax", value: country.tax.corporate_tax },
          { label: "Visa Access", value: country.visa.ease_of_access },
          { label: "GDP/Capita", value: `$${country.economy.gdp_per_capita.toLocaleString()}` },
          { label: "Stability", value: country.government.political_stability },
        ];
      case "strategic_opportunity":
        return [
          { label: "GDP/Capita", value: `$${country.economy.gdp_per_capita.toLocaleString()}` },
          { label: "Cost Index", value: `${country.cost_of_living.index}` },
          { label: "Visa", value: country.visa.ease_of_access },
          { label: "Inflation", value: `${country.economy.inflation}%` },
          { label: "Stability", value: country.government.political_stability },
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

/* ── Intelligence Brief ── */
function IntelligenceBrief({ country, module, score }: { country: Country; module: ModuleId; score: number }) {
  const tier = getScoreTier(score);
  const explanations = getModuleExplanation(module);
  const explanation = explanations[tier];

  const quickFacts = useMemo(() => {
    return [
      { icon: "🏛", label: "Government", value: country.government.type },
      { icon: "👤", label: "Leader", value: country.government.current_leader },
      { icon: "🌍", label: "Population", value: `${(country.population_data.population / 1e6).toFixed(1)}M` },
      { icon: "💰", label: "Currency", value: country.economy.currency },
      { icon: "🌡", label: "Climate", value: country.climate.average_temp },
      { icon: "🗣", label: "Language", value: country.language.split(",")[0].trim() },
    ];
  }, [country]);

  const keyIndustries = country.main_industries.slice(0, 4);
  const topExports = country.economy.main_exports.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3.5 ax-section-in" style={{ animationDelay: "150ms", borderLeft: `2px solid ${tier === "green" ? "rgba(52,211,153,0.4)" : tier === "orange" ? "rgba(251,191,36,0.4)" : "rgba(248,113,113,0.4)"}` }}>
        <p className="text-[11px] leading-relaxed text-white/40">{explanation}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickFacts.map((f, i) => (
          <div
            key={f.label}
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5 ax-section-in transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.08] hover:scale-[1.02]"
            style={{ animationDelay: `${180 + i * 40}ms` }}
          >
            <span className="text-xs">{f.icon}</span>
            <div className="min-w-0">
              <span className="block text-[9px] text-white/20 uppercase tracking-wider">{f.label}</span>
              <span className="block text-[11px] font-medium text-white/60 truncate">{f.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="ax-section-in" style={{ animationDelay: "350ms" }}>
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-white/15 mb-2">Industries</span>
          <div className="flex flex-wrap gap-1">
            {keyIndustries.map((ind) => (
              <span key={ind} className="inline-block rounded-lg bg-white/[0.03] border border-white/[0.05] px-2 py-1 text-[9px] text-white/35 hover:text-white/55 transition-colors">{ind}</span>
            ))}
          </div>
        </div>
        <div className="ax-section-in" style={{ animationDelay: "380ms" }}>
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-white/15 mb-2">Exports</span>
          <div className="flex flex-wrap gap-1">
            {topExports.map((exp) => (
              <span key={exp} className="inline-block rounded-lg bg-white/[0.03] border border-white/[0.05] px-2 py-1 text-[9px] text-white/35 hover:text-white/55 transition-colors">{exp}</span>
            ))}
          </div>
        </div>
      </div>
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

/* ── Tab Button ── */
function TabBtn({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 py-3 px-1 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 border-b-2 ${
        active
          ? "border-cyan-400/70 text-cyan-300/90"
          : "border-transparent text-white/28 hover:text-white/50 hover:border-white/15"
      }`}
    >
      <span className="text-[13px]">{icon}</span>
      {label}
      {active && (
        <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      )}
    </button>
  );
}

/* ── Culture Tab ── */
function CultureTab({ culture }: { culture: CountryCulture }) {
  return (
    <div className="space-y-5 pb-4">
      {/* Genre badge + scene note */}
      <div className="ax-section-in" style={{ animationDelay: "80ms" }}>
        <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.05) 100%)" }}>
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🎵</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-300/60">Music Scene</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {culture.music_genre.split(" · ").map((g) => (
                <span
                  key={g}
                  className="inline-block rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300/70"
                >
                  {g}
                </span>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-white/35 italic">&ldquo;{culture.scene_note}&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Top Artists */}
      <div className="ax-section-in" style={{ animationDelay: "160ms" }}>
        <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/18 mb-3">Top Artists</span>
        <div className="space-y-2">
          {culture.artists.map((artist, i) => (
            <div
              key={artist.name}
              className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 ax-section-in transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.08] group"
              style={{ animationDelay: `${200 + i * 50}ms` }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums" style={{ background: "rgba(139,92,246,0.12)", color: "rgba(196,181,253,0.6)" }}>
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-white/70 group-hover:text-white/85 transition-colors truncate">{artist.name}</span>
                <span className="block text-[10px] text-white/28 truncate">{artist.genre}</span>
              </div>
              <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">🎤</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hit Songs */}
      <div className="ax-section-in" style={{ animationDelay: "500ms" }}>
        <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/18 mb-3">Essential Tracks</span>
        <div className="rounded-xl border border-white/[0.05] overflow-hidden" style={{ background: "rgba(255,255,255,0.012)" }}>
          {culture.hits.map((hit, i) => (
            <div
              key={hit.title}
              className={`flex items-center gap-3 px-3.5 py-3 ax-section-in transition-all duration-150 hover:bg-white/[0.03] group ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
              style={{ animationDelay: `${540 + i * 50}ms` }}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                <svg className="opacity-20 group-hover:opacity-50 transition-opacity" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
                  <path d="M10 8l6 4-6 4V8z" fill="white" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-white/65 group-hover:text-white/80 transition-colors truncate">{hit.title}</span>
                <span className="block text-[10px] text-white/28 truncate">{hit.artist}</span>
              </div>
              <span className="text-[10px] tabular-nums text-white/18 shrink-0">{hit.year}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Hero Image ── */
function HeroImage({ url, loading, countryName }: { url: string | null; loading: boolean; countryName: string }) {
  if (loading) {
    return (
      <div className="relative h-[160px] w-full overflow-hidden bg-white/[0.02]">
        <div className="absolute inset-0 ax-skeleton" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]" />
      </div>
    );
  }
  if (!url) {
    return (
      <div
        className="relative h-[160px] w-full overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.10) 50%, rgba(6,182,212,0.08) 100%)" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl opacity-10">🌍</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#0a0a0f]/60" />
      </div>
    );
  }
  return (
    <div className="relative h-[160px] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={countryName}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        style={{ filter: "brightness(0.55) saturate(1.1)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-transparent to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#0a0a0f]/50" />
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
    </div>
  );
}

/* ── Main Panel ── */
export default function InsightPanel({ iso, module, isOpen, onClose, onAskAI, onAddToCompare }: InsightPanelProps) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const country = useMemo(() => (iso ? getCountryByIso(iso) : undefined), [iso]);
  const culture = useMemo(() => (iso ? getCultureByIso(iso) : undefined), [iso]);
  const moduleDef = MODULES.find((m) => m.id === module)!;

  const score = useMemo(() => (country ? scoreCountry(country, module) : 0), [country, module]);
  const tier = getScoreTier(score);
  const tc = tierColor(tier);
  const breakdown = useMemo(() => (country ? getScoreBreakdown(country, module) : []), [country, module]);
  const insights = useMemo(() => (country ? generateInsights(country, module, score) : { risks: [], opportunities: [] }), [country, module, score]);

  const { url: heroUrl, loading: heroLoading } = useCountryImage(culture?.wikiSlug ?? "");

  // Reset tab when country changes
  useEffect(() => { setActiveTab("overview"); }, [iso]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!isOpen || !country) return null;

  const tierLabel = tier === "green" ? "Excellent" : tier === "orange" ? "Average" : "Poor";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-35 ax-overlay-backdrop ax-scale-in"
        style={{ animationDuration: "0.3s" }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed right-4 top-4 bottom-4 z-40 w-full max-w-[400px] rounded-2xl ax-glass-3 ax-depth-3 flex flex-col overflow-hidden ax-panel-in">

        {/* ── Hero Image ── */}
        <div className="relative shrink-0">
          <HeroImage url={heroUrl} loading={heroLoading} countryName={country.name[locale]} />

          {/* Module badge — top left over image */}
          <div className="absolute top-3.5 left-4 flex items-center gap-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/[0.08] px-2.5 py-1.5">
            <span className="text-[11px]">{moduleDef.icon}</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">{moduleDef.label}</span>
          </div>

          {/* Close button — top right over image */}
          <button
            onClick={handleClose}
            className="absolute top-3.5 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-black/40 backdrop-blur-md border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-black/60 transition-all"
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Country name + score pill — bottom of hero */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-lg" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                {country.name[locale]}
              </h2>
              <p className="text-[10px] text-white/45 mt-0.5">{country.capital} · {country.language.split(",")[0].trim()}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`ax-tier-badge ${tc.bg} ${tc.border} border ${tc.text} px-3 py-1 text-[10px]`}>
                <span className={`h-[6px] w-[6px] rounded-full ${tc.dot}`} />
                {tierLabel}
              </span>
              <span className={`text-[22px] font-bold tabular-nums ${tc.text} drop-shadow-lg`} style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
                {score}<span className="text-[11px] font-normal text-white/30">/100</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="shrink-0 flex gap-5 px-5 border-b border-white/[0.06] bg-transparent">
          <TabBtn label="Overview" icon="🔭" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <TabBtn label="Analytics" icon="📊" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
          <TabBtn label="Culture" icon="🎵" active={activeTab === "culture"} onClick={() => setActiveTab("culture")} />
        </div>

        {/* ── Scrollable Tab Content ── */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 scrollbar-thin">

          {/* ───── OVERVIEW TAB ───── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Intelligence Brief */}
              <div>
                <SectionHeader title="Intelligence Brief" delay={60} />
                <IntelligenceBrief country={country} module={module} score={score} />
              </div>

              {/* Opportunities */}
              <div>
                <SectionHeader title="Opportunities" delay={400} />
                <div className="space-y-2">
                  {insights.opportunities.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-emerald-500/[0.08] bg-emerald-500/[0.03] px-4 py-3 ax-section-in hover:bg-emerald-500/[0.05] transition-colors"
                      style={{ animationDelay: `${440 + i * 60}ms` }}
                    >
                      <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17l5-5 5 5" /><path d="M7 12l5-5 5 5" />
                      </svg>
                      <span className="text-[12px] leading-relaxed text-emerald-400/70">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks */}
              <div>
                <SectionHeader title="Risks" delay={600} />
                <div className="space-y-2">
                  {insights.risks.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-red-500/[0.08] bg-red-500/[0.03] px-4 py-3 ax-section-in hover:bg-red-500/[0.05] transition-colors"
                      style={{ animationDelay: `${640 + i * 60}ms` }}
                    >
                      <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3v12" /><path d="M12 21h.01" />
                      </svg>
                      <span className="text-[12px] leading-relaxed text-red-400/65">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* About */}
              <div className="ax-section-in" style={{ animationDelay: "800ms" }}>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3.5">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 mb-2">About {country.name[locale]}</span>
                  <p className="text-[11.5px] leading-relaxed text-white/35">{country.short_description[locale]}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 ax-section-in" style={{ animationDelay: "880ms" }}>
                {onAddToCompare && (
                  <button
                    onClick={() => onAddToCompare(country.iso_code)}
                    className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500/[0.15] to-indigo-500/[0.10] border border-violet-500/[0.15] px-4 py-3.5 text-[12px] font-semibold text-violet-300/70 hover:text-violet-300 hover:border-violet-500/30 transition-all"
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
                    className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/[0.14] to-blue-500/[0.10] border border-cyan-500/[0.18] px-4 py-3.5 text-[12px] font-semibold text-cyan-300/80 hover:text-cyan-300 hover:border-cyan-500/30 shadow-sm shadow-cyan-500/5 transition-all"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                    </svg>
                    Ask AI
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ───── ANALYTICS TAB ───── */}
          {activeTab === "analytics" && (
            <div className="space-y-5">
              {/* Score Ring */}
              <div className="flex flex-col items-center py-4 ax-section-in">
                <div
                  className="relative flex items-center justify-center rounded-full p-4"
                  style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.03) 40%, transparent 70%)" }}
                >
                  <ScoreRing score={score} size={110} />
                </div>
                <p className="mt-3 text-[11px] text-white/30 text-center max-w-[220px]">
                  {tier === "green" ? "Strong performance across assessed indicators" : tier === "orange" ? "Mixed performance — some areas of concern" : "Significant challenges in this module"}
                </p>
              </div>

              {/* Score Breakdown */}
              <div>
                <SectionHeader title="Score Breakdown" delay={100} />
                <div className="ax-insight-card ax-glass-1">
                  {breakdown.map((b, i) => (
                    <BreakdownBar key={b.label} label={b.label} score={b.score} tier={b.tier} delay={120 + i * 60} />
                  ))}
                </div>
              </div>

              {/* Key Data */}
              <div>
                <SectionHeader title="Key Data" delay={400} />
                <div className="ax-insight-card ax-glass-1">
                  <ModuleStats country={country} module={module} />
                </div>
              </div>

              {/* Economic snapshot */}
              <div className="ax-section-in" style={{ animationDelay: "600ms" }}>
                <SectionHeader title="Economic Snapshot" delay={580} />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "GDP", value: `$${(country.economy.gdp / 1000).toFixed(1)}T`, icon: "📈" },
                    { label: "GDP/Capita", value: `$${country.economy.gdp_per_capita.toLocaleString()}`, icon: "💵" },
                    { label: "Inflation", value: `${country.economy.inflation}%`, icon: "📊" },
                    { label: "Life Expect.", value: `${country.population_data.life_expectancy}yr`, icon: "🫀" },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-3 ax-section-in hover:bg-white/[0.04] transition-colors"
                      style={{ animationDelay: `${620 + i * 40}ms` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px]">{stat.icon}</span>
                        <span className="text-[9px] text-white/20 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <span className="text-[15px] font-bold text-white/65 tabular-nums">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ───── CULTURE TAB ───── */}
          {activeTab === "culture" && (
            culture ? (
              <CultureTab culture={culture} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center ax-section-in">
                <span className="text-4xl mb-4 opacity-30">🎵</span>
                <p className="text-[12px] text-white/25">No culture data available for this country yet.</p>
              </div>
            )
          )}

        </div>
      </div>
    </>
  );
}
