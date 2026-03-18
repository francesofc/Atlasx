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

export default function ComparePanel({ isOpen, onClose, compareIsos, onRemoveCountry, onAddSlot }: ComparePanelProps) {
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
          <div className="px-6 py-12 text-center">
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] text-white/10 ax-section-in transition-transform hover:scale-105 hover:border-white/[0.15]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <PlusIcon />
                </div>
              ))}
            </div>
            <p className="text-[12px] text-white/25">
              {(cmpT?.from_map as string) || "Click a country on the map to add it"}
            </p>
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
                        <div className="mt-1 inline-block rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-medium text-cyan-400/60">
                          Score: {matchScore}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Empty slots */}
                {Array.from({ length: 4 - activeCountries.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 px-3 py-3 min-w-[120px]">
                    <button
                      onClick={onAddSlot}
                      className="w-full flex flex-col items-center justify-center py-2 rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] text-white/15 transition-all hover:border-white/[0.12] hover:text-white/30 hover:scale-105"
                    >
                      <PlusIcon />
                      <span className="text-[9px] mt-1">{(cmpT?.add_country as string) || "Add"}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Data rows — with staggered reveal */}
              {COMPARE_FIELDS.map((field, fi) => (
                <div
                  key={field.key}
                  className={`flex ax-section-in ${fi < COMPARE_FIELDS.length - 1 ? "border-b border-white/[0.03]" : ""} transition-colors hover:bg-white/[0.015]`}
                  style={{ animationDelay: `${150 + fi * 50}ms` }}
                >
                  <div className="w-[140px] shrink-0 px-4 py-2.5 text-[11px] text-white/35 font-medium">
                    {fieldsT[field.key] || field.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                  {activeCountries.map((c) => (
                    <div
                      key={c.iso_code}
                      className={`flex-1 px-3 py-2.5 text-center text-[11px] font-medium min-w-[120px] transition-colors ${getCellColor(field, c)} ${getCellBg(field, c)}`}
                    >
                      {field.getValue(c)}
                    </div>
                  ))}
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
