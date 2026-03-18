"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";
import { getRecommendations } from "@/lib/recommend";
import { DEFAULT_PROFILE, type UserProfile, type Goal, type ClimatePreference, type FamilyStatus, type BudgetRange, type ImportanceLevel } from "@/types/profile";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  editMode?: boolean; // true when editing existing profile
}

const TOTAL_STEPS = 3;

// Reusable text input
function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-white/20 focus:bg-white/[0.05]"
    />
  );
}

// Multi-select chip selector
function MultiChipSelect<T extends string>({
  options,
  values,
  onChange,
  labels,
  icons,
}: {
  options: T[];
  values: T[];
  onChange: (v: T[]) => void;
  labels: Record<T, string>;
  icons?: Record<T, string>;
}) {
  const toggle = (opt: T) => {
    if (values.includes(opt)) {
      if (values.length === 1) return; // keep at least one
      onChange(values.filter((v) => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = values.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[12px] transition-all duration-200 ${
              selected
                ? "border-cyan-500/25 bg-cyan-500/[0.08] text-white/85 shadow-inner shadow-cyan-500/5"
                : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:border-white/12 hover:text-white/50"
            }`}
          >
            {icons && <span className="text-sm">{icons[opt]}</span>}
            <span className="font-medium">{labels[opt]}</span>
            {selected && (
              <svg className="ml-auto h-3.5 w-3.5 text-cyan-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Single-select chip selector
function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  labels,
  icons,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
  icons?: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-medium transition-all duration-200 ${
            value === opt
              ? "border-cyan-500/25 bg-cyan-500/[0.08] text-white/85 shadow-inner shadow-cyan-500/5"
              : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:border-white/12 hover:text-white/50"
          }`}
        >
          {icons && <span className="text-sm">{icons[opt]}</span>}
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

// Importance slider (1–5 dots)
function ImportanceSlider({
  value,
  onChange,
  label,
}: {
  value: ImportanceLevel;
  onChange: (v: ImportanceLevel) => void;
  label: string;
}) {
  const levelLabels = ["Low", "Low-Med", "Medium", "Med-High", "High"];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/40">{label}</span>
        <span className="text-[10px] font-medium text-cyan-400/50">{levelLabels[value - 1]}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {([1, 2, 3, 4, 5] as ImportanceLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`h-2.5 flex-1 rounded-full transition-all duration-200 ${
              level <= value
                ? "bg-gradient-to-r from-cyan-500/30 to-cyan-400/20"
                : "bg-white/[0.06]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Field wrapper with label
function Field({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-xs font-semibold text-white/50">{label}</label>
        {subtitle && <p className="text-[10px] text-white/20 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const GOAL_LABELS: Record<Goal, string> = {
  low_taxes: "Pay less taxes",
  save_money: "Save money",
  quality_of_life: "High quality of life",
  business: "Build a business",
  remote_work: "Remote work lifestyle",
  investment: "Investment opportunities",
};

const GOAL_ICONS: Record<Goal, string> = {
  low_taxes: "💰",
  save_money: "🏦",
  quality_of_life: "🌟",
  business: "🏢",
  remote_work: "💻",
  investment: "📈",
};

const CLIMATE_LABELS: Record<ClimatePreference, string> = {
  warm: "Warm",
  mild: "Mild",
  cold: "Cold",
  any: "No preference",
};

const CLIMATE_ICONS: Record<ClimatePreference, string> = {
  warm: "☀️",
  mild: "🌤",
  cold: "❄️",
  any: "🌍",
};

const BUDGET_LABELS: Record<BudgetRange, string> = {
  under_1000: "< $1,000/mo",
  "1000_3000": "$1,000 – $3,000",
  "3000_5000": "$3,000 – $5,000",
  "5000_plus": "$5,000+",
};

const FAMILY_LABELS: Record<FamilyStatus, string> = {
  single: "Single",
  couple: "Couple",
  family: "Family",
};

const FAMILY_ICONS: Record<FamilyStatus, string> = {
  single: "👤",
  couple: "👥",
  family: "👨‍👩‍👧",
};

export default function OnboardingModal({ isOpen, onClose, onComplete, editMode }: OnboardingModalProps) {
  const { locale } = useI18n();
  const { setProfile, setMatches, profile } = useProfile();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<UserProfile>(() => {
    if (editMode && profile) return { ...profile };
    return { ...DEFAULT_PROFILE };
  });

  const update = useCallback(<K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const handleFinish = useCallback(() => {
    // Derive primary goal from goals array
    const finalForm = { ...form, goal: form.goals[0] };
    setProfile(finalForm);
    const results = getRecommendations(finalForm, locale, 10);
    setMatches(results);
    onComplete();
    setStep(1);
  }, [form, setProfile, setMatches, onComplete, locale]);

  const handleClose = useCallback(() => {
    onClose();
    setStep(1);
  }, [onClose]);

  if (!isOpen) return null;

  const stepNames = ["Your Goals", "Your Priorities", "About You"];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c0c16]/97 to-[#10101c]/97 backdrop-blur-2xl shadow-2xl shadow-black/60 ax-modal-in ax-border-glow">
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-7 py-5">
          <div>
            <h2 className="text-base font-semibold text-white/90">
              {editMode ? "Edit Your Profile" : "Build Your Profile"}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/30">
              {editMode ? "Update your preferences for better recommendations" : "Tell us about you so we can find your ideal country"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="px-7 pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/25">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-[10px] font-medium text-cyan-400/40">{stepNames[step - 1]}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? "bg-gradient-to-r from-cyan-500/30 to-cyan-400/20" : "bg-white/[0.06]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-7 py-6 space-y-5 min-h-[340px]">
          {step === 1 && (
            <>
              <Field label="What are your goals?" subtitle="Select all that apply">
                <MultiChipSelect<Goal>
                  options={["low_taxes", "save_money", "quality_of_life", "business", "remote_work", "investment"]}
                  values={form.goals}
                  onChange={(v) => update("goals", v)}
                  labels={GOAL_LABELS}
                  icons={GOAL_ICONS}
                />
              </Field>
              <Field label="Monthly budget">
                <ChipSelect<BudgetRange>
                  options={["under_1000", "1000_3000", "3000_5000", "5000_plus"]}
                  value={form.budgetRange}
                  onChange={(v) => update("budgetRange", v)}
                  labels={BUDGET_LABELS}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Climate preference">
                <ChipSelect<ClimatePreference>
                  options={["warm", "mild", "cold", "any"]}
                  value={form.climatePreference}
                  onChange={(v) => update("climatePreference", v)}
                  labels={CLIMATE_LABELS}
                  icons={CLIMATE_ICONS}
                />
              </Field>
              <div className="space-y-4 pt-1">
                <ImportanceSlider value={form.taxImportance} onChange={(v) => update("taxImportance", v)} label="Tax sensitivity" />
                <ImportanceSlider value={form.safetyImportance} onChange={(v) => update("safetyImportance", v)} label="Safety importance" />
                <ImportanceSlider value={form.costImportance} onChange={(v) => update("costImportance", v)} label="Cost of living importance" />
                <ImportanceSlider value={form.visaImportance} onChange={(v) => update("visaImportance", v)} label="Visa ease importance" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Family status">
                <ChipSelect<FamilyStatus>
                  options={["single", "couple", "family"]}
                  value={form.familyStatus}
                  onChange={(v) => update("familyStatus", v)}
                  labels={FAMILY_LABELS}
                  icons={FAMILY_ICONS}
                />
              </Field>
              <Field label="Where are you from?">
                <TextInput value={form.nationality} onChange={(v) => update("nationality", v)} placeholder="e.g. French, American, Brazilian..." />
              </Field>
              <Field label="Where do you live now?">
                <TextInput value={form.currentCountry} onChange={(v) => update("currentCountry", v)} placeholder="e.g. France, United States..." />
              </Field>
              {form.goals.includes("business") && (
                <Field label="Business sector (optional)">
                  <TextInput value={form.businessSector} onChange={(v) => update("businessSector", v)} placeholder="e.g. Tech, E-commerce, Consulting..." />
                </Field>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.04] px-7 py-4">
          <div>
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="text-sm text-white/30 transition-colors hover:text-white/60"
              >
                Back
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="text-sm text-white/30 transition-colors hover:text-white/60"
              >
                {editMode ? "Cancel" : "Skip"}
              </button>
            )}
          </div>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/15"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="ax-btn rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/15 border border-cyan-500/20 px-6 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:from-cyan-500/30 hover:to-blue-500/25 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              {editMode ? "Update Profile" : "Get My Results"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
