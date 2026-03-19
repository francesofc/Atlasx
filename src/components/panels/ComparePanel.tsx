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
  { key: "stability", getValue: (c) => c.government.political_stability, getNumeric: (c) => ({ stable: 3, moderate: 2, unstable: 1 }[c.government.political_stability] || 2), higherIsBetter: true },
];

/** Correct ISO 3166-1 alpha-3 → alpha-2 mapping for flag emoji */
const ISO3_TO_ISO2: Record<string, string> = {
  USA: "US", GBR: "GB", FRA: "FR", DEU: "DE", JPN: "JP", CAN: "CA",
  AUS: "AU", BRA: "BR", IND: "IN", KOR: "KR", ARE: "AE", SGP: "SG",
  CHE: "CH", MEX: "MX", NGA: "NG", ZAF: "ZA", PRT: "PT", ESP: "ES",
  ITA: "IT", NLD: "NL", TUR: "TR", THA: "TH", EGY: "EG", COL: "CO",
  NOR: "NO", SWE: "SE", POL: "PL", GRC: "GR", IRL: "IE", CZE: "CZ",
  DNK: "DK", AUT: "AT", ARG: "AR", CHL: "CL", PER: "PE", ECU: "EC",
  SAU: "SA", QAT: "QA", ISR: "IL", CHN: "CN", VNM: "VN", IDN: "ID",
  MYS: "MY", PHL: "PH", TWN: "TW", MAR: "MA", KEN: "KE", GHA: "GH",
  NZL: "NZ", CRI: "CR",
};

/** Convert ISO alpha-3 to flag emoji using correct alpha-2 lookup */
function isoToFlag(iso3: string): string {
  const iso2 = ISO3_TO_ISO2[iso3.toUpperCase()];
  if (!iso2) return "🏳️";
  return String.fromCodePoint(...[...iso2].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function CompareBar({ value, max, isBest, isWorst }: { value: number; max: number; isBest: boolean; isWorst: boolean }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-[65%] mx-auto mt-1 h-[3px] rounded-full bg-white/[0.04]">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${
          isBest
            ? "bg-gradient-to-r from-emerald-500/60 to-emerald-400/40"
            : isWorst
              ? "bg-gradient-to-r from-red-500/45 to-red-400/25"
              : "bg-gradient-to-r from-white/15 to-white/8"
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
    if (activeCountries.length < 2) return "text-white/50";
    const vals = activeCountries.map((c) => field.getNumeric(c));
    const val = field.getNumeric(country);
    const best = field.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = field.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    if (val === best && best !== worst) return "text-emerald-400/80 font-medium";
    if (val === worst && best !== worst) return "text-red-400/60";
    return "text-white/50";
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
      className={`fixed bottom-5 left-[296px] right-5 z-[45] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+20px)] opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="max-w-3xl mx-auto rounded-2xl bg-[#080814]/80 backdrop-blur-2xl border border-white/[0.06] overflow-hidden"
        style={{ boxShadow: "0 -4px 32px rgba(0,0,0,0.3), 0 8px 40px rgba(0,0,0,0.25)" }}
      >
        {/* Top accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        {/* Header — compact */}
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-white/70 tracking-tight">{(cmpT?.title as string) || "Compare"}</h2>
            {canAdd && (
              <span className="text-[9px] text-white/20 font-medium">
                Click map to add
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {canAdd && (
              <button
                onClick={onAddSlot}
                className="flex items-center gap-1 rounded-lg border border-dashed border-white/[0.08] px-2.5 py-1.5 text-[10px] font-medium text-white/25 hover:border-violet-500/20 hover:text-violet-400/50 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add
              </button>
            )}
            {hasCountries && onClearAll && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-white/20 hover:text-red-400/60 hover:bg-red-500/[0.05] transition-all"
              >
                Clear
              </button>
            )}
            <div className="w-px h-4 bg-white/[0.06] mx-0.5" />
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all"
            >
              <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {!hasCountries ? (
          /* ── Compact Empty State ── */
          <div className="px-6 py-8 text-center">
            <p className="text-[12px] text-white/30 mb-4 font-medium">
              Select countries from the map to compare them side by side
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  onClick={onAddSlot}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-white/[0.06] text-white/10 transition-all hover:border-violet-500/15 hover:text-violet-400/30"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Comparison Table ── */
          <div className="overflow-x-auto scrollbar-none">
            <div className="min-w-[520px]">
              {/* Country header row */}
              <div className="flex border-b border-white/[0.05]">
                <div className="w-[110px] shrink-0" />
                {activeCountries.map((c, ci) => (
                  <div
                    key={c.iso_code}
                    className="flex-1 px-2 py-2.5 text-center min-w-[100px]"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-base leading-none">{isoToFlag(c.iso_code)}</span>
                      <span className="text-[12px] font-semibold text-white/75 tracking-tight">{c.name[locale]}</span>
                      <button
                        onClick={() => onRemoveCountry(c.iso_code)}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-white/15 transition-all hover:bg-red-500/15 hover:text-red-400/60 ml-0.5"
                      >
                        <svg width="5" height="5" viewBox="0 0 14 14" fill="none">
                          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {compareIsos.length < 4 && (
                  <div className="flex-1 px-2 py-2.5 min-w-[100px] flex items-center justify-center">
                    <button
                      onClick={onAddSlot}
                      className="text-[9px] text-white/12 hover:text-violet-400/30 transition-all"
                    >
                      + add
                    </button>
                  </div>
                )}
              </div>

              {/* Data rows — compact */}
              {COMPARE_FIELDS.map((field, fi) => (
                <div
                  key={field.key}
                  className={`flex items-center ${
                    fi < COMPARE_FIELDS.length - 1 ? "border-b border-white/[0.025]" : ""
                  } ${fi % 2 === 0 ? "bg-white/[0.006]" : ""} transition-colors hover:bg-white/[0.015]`}
                >
                  <div className="w-[110px] shrink-0 px-4 py-2 text-[10px] text-white/30 font-medium capitalize">
                    {fieldsT[field.key] || field.key.replace(/_/g, " ")}
                  </div>
                  {activeCountries.map((c) => {
                    const barProps = activeCountries.length >= 2 ? getBarProps(field, c) : null;
                    return (
                      <div
                        key={c.iso_code}
                        className={`flex-1 px-2 py-2 text-center min-w-[100px] ${getCellColor(field, c)}`}
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
                  {compareIsos.length < 4 && (
                    <div className="flex-1 px-2 py-2 text-center text-[10px] text-white/[0.06] min-w-[100px]">
                      —
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend — minimal */}
        {hasCountries && activeCountries.length >= 2 && (
          <div className="flex items-center justify-center gap-5 border-t border-white/[0.04] px-4 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
              <span className="text-[9px] text-white/20">{(cmpT?.best as string) || "Best"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400/50" />
              <span className="text-[9px] text-white/20">{(cmpT?.worst as string) || "Worst"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
