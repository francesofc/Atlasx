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

/** Convert ISO 3166-1 alpha-2 code to flag emoji */
function isoToFlag(iso: string): string {
  const code = iso.toUpperCase().slice(0, 2);
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function CompareBar({ value, max, isBest, isWorst }: { value: number; max: number; isBest: boolean; isWorst: boolean }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-[70%] mx-auto mt-2 h-[4px] rounded-full bg-white/[0.04]">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${
          isBest
            ? "bg-gradient-to-r from-emerald-500/60 to-emerald-400/40"
            : isWorst
              ? "bg-gradient-to-r from-red-500/50 to-red-400/30"
              : "bg-gradient-to-r from-white/20 to-white/10"
        }`}
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
    if (activeCountries.length < 2) return "text-white/55";
    const vals = activeCountries.map((c) => field.getNumeric(c));
    const val = field.getNumeric(country);
    const best = field.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = field.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    if (val === best && best !== worst) return "text-emerald-400/80 font-semibold";
    if (val === worst && best !== worst) return "text-red-400/65";
    return "text-white/55";
  }

  function getCellBg(field: CompareField, country: Country): string {
    if (activeCountries.length < 2) return "";
    const vals = activeCountries.map((c) => field.getNumeric(c));
    const val = field.getNumeric(country);
    const best = field.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = field.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    if (val === best && best !== worst) return "bg-emerald-500/[0.03]";
    if (val === worst && best !== worst) return "bg-red-500/[0.02]";
    return "";
  }

  function getCellBorder(field: CompareField, country: Country): string {
    if (activeCountries.length < 2) return "border-l-2 border-transparent";
    const vals = activeCountries.map((c) => field.getNumeric(c));
    const val = field.getNumeric(country);
    const best = field.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = field.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    if (val === best && best !== worst) return "border-l-2 border-emerald-400/40";
    if (val === worst && best !== worst) return "border-l-2 border-red-400/30";
    return "border-l-2 border-transparent";
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
      className={`fixed bottom-4 left-[296px] right-4 z-[45] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+16px)] opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-4xl mx-auto max-h-[70vh] flex flex-col rounded-2xl bg-[#0a0a18]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden ax-depth-3">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600/0 via-violet-500/50 to-cyan-500/0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-[15px] font-bold ax-gradient-text tracking-tight">{(cmpT?.title as string) || "Country Comparison"}</h2>
            <p className="text-[10px] text-white/25 mt-0.5 font-medium">
              {canAdd
                ? "Click a country on the map to add"
                : "Up to 4 countries"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAdd && (
              <button
                onClick={onAddSlot}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] px-3.5 py-2 text-[11px] font-medium text-white/30 hover:border-violet-500/25 hover:text-violet-400/60 hover:bg-violet-500/[0.03] transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </button>
            )}
            {hasCountries && onClearAll && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/[0.12] bg-red-500/[0.03] px-3.5 py-2 text-[11px] font-medium text-red-400/45 hover:border-red-500/25 hover:text-red-400/75 transition-all"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {!hasCountries ? (
          /* -- Premium Empty State -- */
          <div className="px-8 py-16 text-center ax-section-in">
            {/* Geometric pattern */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-violet-500/8 blur-2xl ax-breathe mx-auto" />
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Diamond grid pattern */}
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <defs>
                    <linearGradient id="cmp-geo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="rgb(6,182,212)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="rgb(139,92,246)" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <rect x="16" y="4" width="16" height="16" rx="2" transform="rotate(45 24 12)" stroke="url(#cmp-geo-grad)" strokeWidth="1.2" fill="none" />
                  <rect x="4" y="16" width="16" height="16" rx="2" transform="rotate(45 12 24)" stroke="url(#cmp-geo-grad)" strokeWidth="1.2" fill="none" opacity="0.6" />
                  <rect x="28" y="16" width="16" height="16" rx="2" transform="rotate(45 36 24)" stroke="url(#cmp-geo-grad)" strokeWidth="1.2" fill="none" opacity="0.6" />
                  <rect x="16" y="28" width="16" height="16" rx="2" transform="rotate(45 24 36)" stroke="url(#cmp-geo-grad)" strokeWidth="1.2" fill="none" opacity="0.4" />
                  <circle cx="24" cy="24" r="3" fill="url(#cmp-geo-grad)" opacity="0.5" />
                </svg>
              </div>
            </div>
            <h3 className="text-[16px] font-bold ax-gradient-text mb-2.5">Compare Side by Side</h3>
            <p className="text-[11px] text-white/25 mb-10 max-w-[280px] mx-auto leading-relaxed font-medium">
              Select up to 4 countries from the map to compare safety, cost, tax, visa access, and more.
            </p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  onClick={onAddSlot}
                  className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] text-white/10 ax-section-in transition-all duration-300 hover:scale-110 hover:border-violet-500/20 hover:text-violet-400/40 hover:bg-violet-500/[0.04] hover:shadow-lg hover:shadow-violet-500/5"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="transition-transform duration-300 group-hover:scale-110">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* -- Comparison Table -- */
          <div className="overflow-y-auto overflow-x-auto scrollbar-none flex-1">
            <div className="min-w-[600px]">
              {/* Country header cards */}
              <div className="flex border-b border-white/[0.06] sticky top-0 bg-[#0a0a18]/98 backdrop-blur-xl z-10">
                <div className="w-[140px] shrink-0 px-5 py-3" />
                {activeCountries.map((c, ci) => {
                  const matchScore = matches.find((m) => m.iso_code === c.iso_code)?.score;
                  return (
                    <div
                      key={c.iso_code}
                      className="flex-1 px-3 py-4 text-center min-w-[120px] ax-section-in"
                      style={{ animationDelay: `${ci * 80}ms` }}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-2xl leading-none">{isoToFlag(c.iso_code)}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold text-white/80 tracking-tight">{c.name[locale]}</span>
                          <button
                            onClick={() => onRemoveCountry(c.iso_code)}
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.05] text-white/20 transition-all hover:bg-red-500/15 hover:text-red-400/60"
                          >
                            <svg width="6" height="6" viewBox="0 0 14 14" fill="none">
                              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-[9px] font-mono text-white/15">{c.iso_code}</div>
                      </div>
                      {matchScore !== undefined && (
                        <div className="mt-2.5">
                          <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold bg-gradient-to-r from-cyan-500/[0.12] to-violet-500/[0.08] border border-cyan-400/[0.1] text-cyan-400/70">
                            {matchScore}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {Array.from({ length: 4 - activeCountries.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 px-3 py-4 min-w-[120px]">
                    <button
                      onClick={onAddSlot}
                      className="w-full flex flex-col items-center justify-center py-4 rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] text-white/10 transition-all hover:border-violet-500/15 hover:text-violet-400/25 hover:bg-violet-500/[0.02]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span className="text-[9px] mt-1 opacity-50">Add</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {COMPARE_FIELDS.map((field, fi) => (
                <div
                  key={field.key}
                  className={`flex ax-section-in ${
                    fi < COMPARE_FIELDS.length - 1 ? "border-b border-white/[0.03]" : ""
                  } ${fi % 2 === 0 ? "bg-white/[0.008]" : ""} transition-colors hover:bg-white/[0.02]`}
                  style={{ animationDelay: `${120 + fi * 40}ms` }}
                >
                  <div className="w-[140px] shrink-0 px-5 py-3.5 text-[11px] text-white/35 font-semibold uppercase tracking-wider">
                    {fieldsT[field.key] || field.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                  {activeCountries.map((c) => {
                    const barProps = activeCountries.length >= 2 ? getBarProps(field, c) : null;
                    return (
                      <div
                        key={c.iso_code}
                        className={`flex-1 px-3 py-3.5 text-center min-w-[120px] transition-colors ${getCellColor(field, c)} ${getCellBg(field, c)} ${getCellBorder(field, c)}`}
                      >
                        <span className="text-[12px] font-bold">{field.getValue(c)}</span>
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
                    <div key={`empty-${i}`} className="flex-1 px-3 py-3.5 text-center text-[11px] text-white/8 min-w-[120px] border-l-2 border-transparent">
                      —
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        {hasCountries && activeCountries.length >= 2 && (
          <div className="flex items-center justify-center gap-6 border-t border-white/[0.05] px-6 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-emerald-400/80 to-emerald-500/60" />
              <span className="text-[10px] text-white/25 font-medium">{(cmpT?.best as string) || "Best"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-red-400/70 to-red-500/50" />
              <span className="text-[10px] text-white/25 font-medium">{(cmpT?.worst as string) || "Worst"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
