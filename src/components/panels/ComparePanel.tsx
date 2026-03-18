"use client";

import { useI18n } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";
import { getCountryByIso, type Country } from "@/data/countries";

interface ComparePanelProps {
  isOpen: boolean;
  onClose: () => void;
  compareIsos: string[];
  onRemoveCountry: (iso: string) => void;
  onAddSlot: () => void;
  onClearAll?: () => void;
}

// ---------------------------------------------------------------------------
// Comparison field definitions with value extraction + ranking direction
// ---------------------------------------------------------------------------

interface CompareField {
  key: string;
  getValue: (c: Country) => string;
  getNumeric: (c: Country) => number;
  higherIsBetter: boolean;
}

const COMPARE_FIELDS: CompareField[] = [
  { key: "safety", getValue: (c) => `${c.safety.safety_index}/100`, getNumeric: (c) => c.safety.safety_index, higherIsBetter: true },
  { key: "cost", getValue: (c) => `${c.cost_of_living.index}`, getNumeric: (c) => c.cost_of_living.index, higherIsBetter: false },
  { key: "tax", getValue: (c) => c.tax.income_tax, getNumeric: (c) => ({ low: 1, medium: 2, high: 3 }[c.tax.level] || 2), higherIsBetter: false },
  { key: "visa", getValue: (c) => c.visa.ease_of_access, getNumeric: (c) => ({ easy: 3, medium: 2, hard: 1 }[c.visa.ease_of_access] || 2), higherIsBetter: true },
  { key: "salary", getValue: (c) => `$${c.cost_of_living.average_salary.toLocaleString()}`, getNumeric: (c) => c.cost_of_living.average_salary, higherIsBetter: true },
  { key: "gdp_per_capita", getValue: (c) => `$${c.economy.gdp_per_capita.toLocaleString()}`, getNumeric: (c) => c.economy.gdp_per_capita, higherIsBetter: true },
  { key: "inflation", getValue: (c) => `${c.economy.inflation}%`, getNumeric: (c) => c.economy.inflation, higherIsBetter: false },
  { key: "life_expectancy", getValue: (c) => `${c.population_data.life_expectancy}yr`, getNumeric: (c) => c.population_data.life_expectancy, higherIsBetter: true },
  { key: "stability", getValue: (c) => c.government.political_stability, getNumeric: (c) => ({ stable: 3, moderate: 2, unstable: 1 }[c.government.political_stability] || 2), higherIsBetter: true },
  { key: "corporate_tax", getValue: (c) => c.tax.corporate_tax, getNumeric: (c) => parseFloat(c.tax.corporate_tax) || 20, higherIsBetter: false },
];

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="globe-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" stroke="url(#globe-grad)" />
      <path d="M2 12h20" stroke="url(#globe-grad)" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="url(#globe-grad)" />
    </svg>
  );
}

// Visual bar for numeric comparison
function CompareBar({ value, max, isBest, isWorst }: { value: number; max: number; isBest: boolean; isWorst: boolean }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = isBest ? "bg-emerald-400/60" : isWorst ? "bg-red-400/50" : "bg-white/20";

  return (
    <div className="w-[75%] mx-auto mt-1 h-[3px] rounded-full bg-white/[0.05]">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ComparePanel({ isOpen, onClose, compareIsos, onRemoveCountry, onAddSlot, onClearAll }: ComparePanelProps) {
  const { locale, t } = useI18n();
  const { matches } = useProfile();
  const cmpT = (t as Record<string, unknown>).compare_panel as Record<string, unknown> | undefined;
  const fieldsT = (cmpT?.fields || {}) as Record<string, string>;

  const activeCountries = compareIsos
    .map((iso) => getCountryByIso(iso))
    .filter((c): c is Country => c !== undefined);

  const hasCountries = activeCountries.length > 0;
  const canAdd = compareIsos.length < 4;

  function getCellColor(field: CompareField, country: Country): string {
    if (activeCountries.length < 2) return "text-white/60";
    const vals = activeCountries.map((c) => field.getNumeric(c));
    const val = field.getNumeric(country);
    const best = field.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = field.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    if (val === best && best !== worst) return "text-emerald-400/80 font-semibold";
    if (val === worst && best !== worst) return "text-red-400/70";
    return "text-white/60";
  }

  function getCellBg(field: CompareField, country: Country): string {
    if (activeCountries.length < 2) return "";
    const vals = activeCountries.map((c) => field.getNumeric(c));
    const val = field.getNumeric(country);
    const best = field.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = field.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    if (val === best && best !== worst) return "bg-emerald-500/[0.04]";
    if (val === worst && best !== worst) return "bg-red-500/[0.03]";
    return "";
  }

  function getBarProps(field: CompareField, country: Country) {
    const vals = activeCountries.map((c) => field.getNumeric(c));
    const val = field.getNumeric(country);
    const maxVal = Math.max(...vals);
    const best = field.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = field.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    return {
      value: val,
      max: maxVal || 1,
      isBest: val === best && best !== worst,
      isWorst: val === worst && best !== worst,
    };
  }

  return (
    <div
      className={`fixed bottom-0 right-0 z-[45] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="w-[calc(100vw-2rem)] max-w-4xl mx-4 mb-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0a0a12]/95 to-[#0e0e18]/95 backdrop-blur-2xl shadow-2xl shadow-black/60 ax-border-glow"
        style={{ boxShadow: "0 -10px 60px rgba(139,92,246,0.04), 0 20px 80px rgba(0,0,0,0.5)" }}
      >
        {/* Decorative top glow */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white/85">{(cmpT?.title as string) || "Country Comparison"}</h2>
            <p className="text-[10px] text-white/25">
              {canAdd
                ? (cmpT?.select_country as string) || "Click a country on the map to add"
                : (cmpT?.subtitle as string) || "Select up to 4 countries to compare"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAdd && (
              <button
                onClick={onAddSlot}
                className="ax-btn flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] px-3 py-1.5 text-[10px] font-medium text-white/35 hover:border-white/[0.2] hover:text-white/55"
              >
                <PlusIcon />
                <span>{(cmpT?.add_country as string) || "Add Country"}</span>
              </button>
            )}
            {hasCountries && onClearAll && (
              <button
                onClick={onClearAll}
                className="ax-btn flex items-center gap-1.5 rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-1.5 text-[10px] font-medium text-red-400/50 hover:border-red-500/30 hover:text-red-400/80 hover:bg-red-500/[0.08] transition-colors"
              >
                <TrashIcon />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="ax-btn flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:border-white/20 hover:text-white/60"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        {!hasCountries ? (
          <div className="px-6 py-14 text-center">
            {/* Premium empty state */}
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl ax-breathe" />
              <GlobeIcon />
            </div>
            <h3 className="text-sm font-semibold text-white/60 mb-1.5">Start Comparing</h3>
            <p className="text-[11px] text-white/25 mb-6 max-w-xs mx-auto">
              Select countries from the map or use the panel to build your comparison
            </p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  onClick={onAddSlot}
                  className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] text-white/10 ax-section-in transition-all hover:scale-110 hover:border-violet-500/20 hover:text-violet-400/40 hover:bg-violet-500/[0.03]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="animate-pulse" style={{ animationDelay: `${i * 600}ms`, animationDuration: "2.5s" }}>
                    <PlusIcon />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[600px]">
              {/* Country header cards */}
              <div className="flex border-b border-white/[0.04]">
                <div className="w-[140px] shrink-0 px-4 py-3" />
                {activeCountries.map((c, ci) => {
                  const matchScore = matches.find((m) => m.iso_code === c.iso_code)?.score;
                  return (
                    <div
                      key={c.iso_code}
                      className="flex-1 px-3 py-3 text-center min-w-[120px] ax-section-in"
                      style={{ animationDelay: `${ci * 80}ms` }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[12px] font-semibold text-white/75">{c.name[locale]}</span>
                        <button
                          onClick={() => onRemoveCountry(c.iso_code)}
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.06] text-white/25 transition-all hover:bg-red-500/20 hover:text-red-400/70 hover:scale-110"
                        >
                          <XIcon size={6} />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-white/20 mt-0.5">{c.iso_code}</div>
                      {matchScore !== undefined && (
                        <div className="mt-1.5">
                          <span className="inline-block rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-medium text-cyan-400/60">
                            Score: {matchScore}
                          </span>
                          {/* Score bar */}
                          <div className="w-16 mx-auto mt-1 h-[2px] rounded-full bg-white/[0.05]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-violet-500/60 transition-all duration-700 ease-out"
                              style={{ width: `${matchScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Empty slots — clickable with hover effects */}
                {Array.from({ length: 4 - activeCountries.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 px-3 py-3 min-w-[120px]">
                    <button
                      onClick={onAddSlot}
                      className="w-full flex flex-col items-center justify-center py-3 rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] text-white/12 transition-all hover:border-violet-500/20 hover:text-violet-400/30 hover:bg-violet-500/[0.02] hover:scale-105"
                    >
                      <div className="animate-pulse" style={{ animationDuration: "2.5s", animationDelay: `${i * 400}ms` }}>
                        <PlusIcon />
                      </div>
                      <span className="text-[9px] mt-1 opacity-50">{(cmpT?.add_country as string) || "Add"}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Data rows — with staggered reveal + visual bars */}
              {COMPARE_FIELDS.map((field, fi) => (
                <div
                  key={field.key}
                  className={`flex ax-section-in ${fi < COMPARE_FIELDS.length - 1 ? "border-b border-white/[0.03]" : ""} transition-colors hover:bg-white/[0.015]`}
                  style={{ animationDelay: `${150 + fi * 50}ms` }}
                >
                  <div className="w-[140px] shrink-0 px-4 py-2.5 text-[11px] text-white/35 font-medium">
                    {fieldsT[field.key] || field.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                  {activeCountries.map((c) => {
                    const barProps = activeCountries.length >= 2 ? getBarProps(field, c) : null;
                    return (
                      <div
                        key={c.iso_code}
                        className={`flex-1 px-3 py-2.5 text-center min-w-[120px] transition-colors ${getCellColor(field, c)} ${getCellBg(field, c)}`}
                      >
                        <span className="text-[11px]">{field.getValue(c)}</span>
                        {barProps && (
                          <CompareBar
                            value={barProps.value}
                            max={barProps.max}
                            isBest={barProps.isBest}
                            isWorst={barProps.isWorst}
                          />
                        )}
                      </div>
                    );
                  })}
                  {Array.from({ length: 4 - activeCountries.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex-1 px-3 py-2.5 text-center text-[11px] text-white/10 min-w-[120px]">
                      —
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color legend */}
        {hasCountries && activeCountries.length >= 2 && (
          <div className="flex items-center justify-center gap-4 border-t border-white/[0.04] px-6 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              <span className="text-[9px] text-white/25">{(cmpT?.best as string) || "Best"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400/70" />
              <span className="text-[9px] text-white/25">{(cmpT?.worst as string) || "Worst"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
