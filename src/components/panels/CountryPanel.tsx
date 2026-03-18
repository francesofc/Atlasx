"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import type { CountryInfo } from "@/types";
import { getCountryByIso, getCountryByName, type Country } from "@/data/countries";
import { useI18n } from "@/contexts/I18nContext";

interface CountryPanelProps {
  country: CountryInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCompare?: (iso: string) => void;
  onAskAI?: (iso: string) => void;
}

// ---------------------------------------------------------------------------
// Animated number — counts up from 0 to target
// ---------------------------------------------------------------------------
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 900 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);

      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };

    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  // Format intelligently
  const formatted = value >= 1000
    ? display.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : value >= 10
      ? display.toFixed(0)
      : display.toFixed(1);

  return <span className="tabular-nums">{prefix}{formatted}{suffix}</span>;
}

// ---------------------------------------------------------------------------
// Animated progress bar with color logic
// ---------------------------------------------------------------------------
function AnimatedBar({ value, max = 100, invert = false }: { value: number; max?: number; invert?: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  // invert: lower is better (cost) → green when low, red when high
  const ratio = invert ? 1 - pct / 100 : pct / 100;
  const color = ratio >= 0.65
    ? "from-emerald-500/60 to-emerald-400/40"
    : ratio >= 0.35
      ? "from-amber-500/50 to-yellow-400/40"
      : "from-red-500/50 to-rose-400/40";

  return (
    <div className="mt-1.5 h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} ax-bar-fill`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Circular score ring with animated SVG draw
// ---------------------------------------------------------------------------
function ScoreRing({ value, max = 100, size = 52, label }: { value: number; max?: number; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = value / max;
  const offset = circumference - ratio * circumference;
  const color = ratio >= 0.65 ? "stroke-emerald-400/70" : ratio >= 0.35 ? "stroke-amber-400/70" : "stroke-red-400/70";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          className={`${color} ax-circle-draw`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ "--ax-circumference": circumference } as React.CSSProperties}
        />
      </svg>
      <span className="text-[11px] font-bold text-white/70">{value}</span>
      {label && <span className="absolute -bottom-3 text-[8px] text-white/25">{label}</span>}
    </div>
  );
}

// Format large numbers
function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

// Badge for categorical values — with semantic colors
function Badge({ label, variant }: { label: string; variant: "low" | "medium" | "high" | "easy" | "hard" }) {
  const colors = {
    low: "border-emerald-500/20 text-emerald-400/70 bg-emerald-500/[0.08]",
    easy: "border-emerald-500/20 text-emerald-400/70 bg-emerald-500/[0.08]",
    medium: "border-amber-500/20 text-amber-400/70 bg-amber-500/[0.08]",
    high: "border-red-500/20 text-red-400/70 bg-red-500/[0.08]",
    hard: "border-red-500/20 text-red-400/70 bg-red-500/[0.08]",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-transform hover:scale-105 ${colors[variant]}`}>
      {label}
    </span>
  );
}

// Staggered section component — animates in on mount
function Section({ icon, title, children, delay = 0 }: { icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="border-t border-white/[0.04] pt-5 pb-1 ax-section-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center text-white/30">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Data row with hover effect
function DataRow({ label, value, children }: { label: string; value?: string | React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 rounded-lg px-1 -mx-1 transition-colors hover:bg-white/[0.02]">
      <span className="text-sm text-white/35">{label}</span>
      <span className="text-right text-sm font-medium text-white/75">{children || value}</span>
    </div>
  );
}

// SVG icons (inline, minimal)
const icons = {
  overview: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  economy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  quality: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  business: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  climate: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

// Stagger step (ms)
const S = 80;

export default function CountryPanel({ country, isOpen, onClose, onAddToCompare, onAskAI }: CountryPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useI18n();

  const data: Country | undefined = useMemo(() => {
    if (!country) return undefined;
    return getCountryByIso(country.iso) || getCountryByName(country.name);
  }, [country]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px] transition-opacity duration-400"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Panel — glassmorphism + floating glow */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label={t.panel.country}
        className={`
          fixed right-0 top-0 z-50 h-full w-full max-w-md
          border-l border-white/[0.08]
          bg-gradient-to-b from-[#0a0a12]/95 to-[#0e0e18]/95
          backdrop-blur-2xl
          shadow-2xl shadow-black/60
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={isOpen ? { boxShadow: "-20px 0 80px rgba(139,92,246,0.04), 0 0 120px rgba(0,0,0,0.5)" } : undefined}
      >
        {/* Decorative top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-7 py-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
              {t.panel.country}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white/90">
              {data ? data.name[locale] : country?.name || "—"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ax-btn flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70"
            aria-label={t.panel.close}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="h-[calc(100%-68px)] overflow-y-auto px-7 py-5 scrollbar-thin">
          {!data ? (
            <div className="flex flex-col items-center justify-center pt-16 text-center ax-section-in">
              {/* Premium "data being compiled" state */}
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl ax-breathe" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
                  {icons.overview}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white/50 mb-1">
                {country?.name || "Country"}
              </h3>
              <p className="text-[11px] text-white/25 mb-5 max-w-[240px]">
                {t.panel.not_found || "Detailed intelligence data is being compiled for this region."}
              </p>
              <div className="flex gap-2">
                {onAddToCompare && country?.iso && (
                  <button
                    onClick={() => onAddToCompare(country.iso)}
                    className="ax-btn flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-white/40 hover:border-violet-500/25 hover:text-violet-400/70"
                  >
                    Compare
                  </button>
                )}
                {onAskAI && country?.iso && (
                  <button
                    onClick={() => onAskAI(country.iso)}
                    className="ax-btn flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-white/40 hover:border-cyan-500/25 hover:text-cyan-400/70"
                  >
                    Ask AI
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5" key={data.iso_code}>
              {/* ISO badge + description */}
              <div className="ax-section-in" style={{ animationDelay: "0ms" }}>
                <div className="mb-3 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5">
                  <span className="font-mono text-[11px] tracking-wider text-white/35">{data.iso_code}</span>
                </div>
                <p className="text-sm leading-relaxed text-white/45">{data.short_description[locale]}</p>
              </div>

              {/* Score rings — at-a-glance */}
              <div className="ax-section-in flex items-center justify-around py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]" style={{ animationDelay: `${S}ms` }}>
                <ScoreRing value={data.safety.safety_index} label="Safety" />
                <ScoreRing value={data.cost_of_living.index} label="Cost" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white/80">
                    <AnimatedNumber value={data.economy.gdp_per_capita} prefix="$" />
                  </div>
                  <span className="text-[8px] text-white/25">GDP / capita</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="ax-section-in flex gap-2" style={{ animationDelay: `${S * 2}ms` }}>
                {onAddToCompare && (
                  <button
                    onClick={() => onAddToCompare(data.iso_code)}
                    className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[12px] font-medium text-white/50 hover:border-violet-500/25 hover:text-violet-400/80"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                    {t.panel.action_compare || "Compare"}
                  </button>
                )}
                {onAskAI && (
                  <button
                    onClick={() => onAskAI(data.iso_code)}
                    className="ax-btn flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[12px] font-medium text-white/50 hover:border-cyan-500/25 hover:text-cyan-400/80"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                    </svg>
                    {t.panel.action_ask_ai || "Ask AI"}
                  </button>
                )}
              </div>

              {/* Overview */}
              <Section icon={icons.overview} title={t.sections.overview} delay={S * 3}>
                <DataRow label={t.fields.capital} value={data.capital} />
                <DataRow label={t.fields.population}>
                  <AnimatedNumber value={data.population_data.population} suffix="" />
                  <span className="text-white/40 text-xs ml-1">({formatNumber(data.population_data.population)})</span>
                </DataRow>
                <DataRow label={t.fields.language} value={data.language} />
              </Section>

              {/* Economy */}
              <Section icon={icons.economy} title={t.sections.economy} delay={S * 4}>
                <DataRow label={t.fields.gdp}>
                  <AnimatedNumber value={data.economy.gdp} prefix="$" suffix="B" />
                </DataRow>
                <DataRow label={t.fields.gdp_per_capita || "GDP per Capita"}>
                  <AnimatedNumber value={data.economy.gdp_per_capita} prefix="$" />
                </DataRow>
                <DataRow label={t.fields.currency} value={data.economy.currency} />
                <DataRow label={t.fields.inflation || "Inflation"}>
                  <span className={data.economy.inflation > 5 ? "text-red-400/70" : data.economy.inflation > 3 ? "text-amber-400/70" : "text-emerald-400/70"}>
                    <AnimatedNumber value={data.economy.inflation} suffix="%" />
                  </span>
                </DataRow>
                <DataRow label={t.fields.average_salary}>
                  <AnimatedNumber value={data.cost_of_living.average_salary} prefix="$" suffix="/mo" />
                </DataRow>
                <DataRow label={t.fields.main_exports || "Exports"}>
                  <span className="text-[11px] text-white/55">{data.economy.main_exports.slice(0, 3).join(", ")}</span>
                </DataRow>
                <DataRow label={t.fields.main_industries}>
                  <div className="flex flex-wrap justify-end gap-1.5 pt-0.5">
                    {data.main_industries.map((ind) => (
                      <span key={ind} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/45 transition-colors hover:bg-white/[0.08]">
                        {ind}
                      </span>
                    ))}
                  </div>
                </DataRow>
              </Section>

              {/* Quality of Life — with animated bars */}
              <Section icon={icons.quality} title={t.sections.quality_of_life} delay={S * 5}>
                <div className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/35">{t.fields.cost_of_living}</span>
                    <span className="text-sm font-medium text-white/75">
                      <AnimatedNumber value={data.cost_of_living.index} suffix="/100" />
                    </span>
                  </div>
                  <AnimatedBar value={data.cost_of_living.index} invert />
                </div>
                <div className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/35">{t.fields.safety_index}</span>
                    <span className="text-sm font-medium text-white/75">
                      <AnimatedNumber value={data.safety.safety_index} suffix="/100" />
                    </span>
                  </div>
                  <AnimatedBar value={data.safety.safety_index} />
                </div>
              </Section>

              {/* Business & Tax */}
              <Section icon={icons.business} title={t.sections.business_tax} delay={S * 6}>
                <DataRow label={t.fields.tax_level}>
                  <Badge label={t.tax_levels[data.tax.level]} variant={data.tax.level} />
                </DataRow>
                <DataRow label={t.fields.income_tax || "Income Tax"} value={data.tax.income_tax} />
                <DataRow label={t.fields.corporate_tax || "Corporate Tax"} value={data.tax.corporate_tax} />
                <DataRow label={t.fields.visa_difficulty}>
                  <Badge label={t.visa_levels[data.visa.ease_of_access]} variant={data.visa.ease_of_access} />
                </DataRow>
                <DataRow label={t.fields.residency_options || "Residency"}>
                  <span className="text-[11px] text-white/55 max-w-[180px] text-right">{data.visa.residency_options}</span>
                </DataRow>
              </Section>

              {/* Government */}
              <Section icon={icons.shield} title={t.sections.government || "Government"} delay={S * 7}>
                <DataRow label={t.fields.government_type || "System"} value={data.government.type} />
                <DataRow label={t.fields.current_leader || "Leader"} value={data.government.current_leader} />
                <DataRow label={t.fields.political_stability || "Stability"}>
                  <Badge
                    label={t.stability_levels?.[data.government.political_stability] || data.government.political_stability}
                    variant={data.government.political_stability === "stable" ? "easy" : data.government.political_stability === "moderate" ? "medium" : "hard"}
                  />
                </DataRow>
              </Section>

              {/* Demographics */}
              <Section icon={icons.users} title={t.sections.demographics || "Demographics"} delay={S * 8}>
                <DataRow label={t.fields.life_expectancy || "Life Expectancy"}>
                  <span className={data.population_data.life_expectancy >= 75 ? "text-emerald-400/70" : data.population_data.life_expectancy >= 65 ? "text-amber-400/70" : "text-red-400/70"}>
                    <AnimatedNumber value={data.population_data.life_expectancy} suffix=" yr" />
                  </span>
                </DataRow>
                <DataRow label={t.fields.density || "Density"}>
                  <AnimatedNumber value={data.population_data.density} suffix="/km²" />
                </DataRow>
                <div className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/35">{t.fields.crime_index || "Crime Index"}</span>
                    <span className="text-sm font-medium text-white/75">
                      <AnimatedNumber value={data.safety.crime_index} suffix="/100" />
                    </span>
                  </div>
                  <AnimatedBar value={data.safety.crime_index} invert />
                </div>
              </Section>

              {/* Climate */}
              <Section icon={icons.climate} title={t.sections.climate} delay={S * 9}>
                <p className="py-2 text-sm leading-relaxed text-white/50">{data.climate.description[locale]}</p>
                <DataRow label={t.fields.average_temp || "Avg Temperature"} value={data.climate.average_temp} />
                <DataRow label={t.fields.seasons || "Seasons"} value={data.climate.seasons} />
              </Section>

              {/* Military */}
              <Section icon={icons.shield} title={t.sections.military || "Military"} delay={S * 10}>
                <DataRow label={t.fields.military_power || "Power Index"} value={String(data.military.power_index)} />
                <DataRow label={t.fields.nuclear_weapon || "Nuclear"}>
                  <span className={data.military.nuclear_weapon ? "text-red-400/70" : "text-emerald-400/70"}>
                    {data.military.nuclear_weapon ? "Yes" : "No"}
                  </span>
                </DataRow>
              </Section>

              {/* Bottom spacer */}
              <div className="h-6" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
