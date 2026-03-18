"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";
import { getRecommendations } from "@/lib/recommend";
import { DEFAULT_PROFILE, type UserProfile, type Goal, type ClimatePreference, type FamilyStatus, type BudgetRange, type IncomeRange, type ImportanceLevel } from "@/types/profile";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

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

// Chip selector — pick one from options
function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
            value === opt
              ? "border-white/25 bg-white/10 text-white/90"
              : "border-white/[0.06] bg-white/[0.02] text-white/35 hover:border-white/15 hover:text-white/55"
          }`}
        >
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
  leftLabel,
  rightLabel,
}: {
  value: ImportanceLevel;
  onChange: (v: ImportanceLevel) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {([1, 2, 3, 4, 5] as ImportanceLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`h-3 flex-1 rounded-full transition-all duration-200 ${
              level <= value
                ? "bg-white/30"
                : "bg-white/[0.06]"
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px] text-white/20">{leftLabel}</span>
        <span className="text-[10px] text-white/20">{rightLabel}</span>
      </div>
    </div>
  );
}

// Field wrapper with label
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <label className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">{label}</label>
      {children}
    </div>
  );
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { locale, t } = useI18n();
  const { setProfile, setMatches } = useProfile();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<UserProfile>({ ...DEFAULT_PROFILE });

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
    setProfile(form);
    const results = getRecommendations(form, locale, 5);
    setMatches(results);
    onComplete();
    setStep(1);
  }, [form, setProfile, setMatches, onComplete]);

  const handleClose = useCallback(() => {
    onClose();
    setStep(1);
  }, [onClose]);

  if (!isOpen) return null;

  const ob = t.onboarding;
  const stepNames = [ob.steps.about_you, ob.steps.goals, ob.steps.priorities, ob.steps.details];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c0c12]/95 to-[#101018]/95 backdrop-blur-2xl shadow-2xl shadow-black/60 ax-modal-in ax-border-glow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-7 py-5">
          <div>
            <h2 className="text-base font-semibold text-white/90">{ob.title}</h2>
            <p className="mt-0.5 text-xs text-white/30">{ob.subtitle}</p>
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

        {/* Progress bar */}
        <div className="px-7 pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/25">
              {ob.step} {step} {ob.of} {TOTAL_STEPS}
            </span>
            <span className="text-[10px] font-medium text-white/30">{stepNames[step - 1]}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? "bg-white/30" : "bg-white/[0.06]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-7 py-6 space-y-5 min-h-[320px]">
          {step === 1 && (
            <>
              <Field label={ob.labels.nationality}>
                <TextInput value={form.nationality} onChange={(v) => update("nationality", v)} placeholder={ob.labels.nationality_placeholder} />
              </Field>
              <Field label={ob.labels.current_country}>
                <TextInput value={form.currentCountry} onChange={(v) => update("currentCountry", v)} placeholder={ob.labels.current_country_placeholder} />
              </Field>
              <Field label={ob.labels.preferred_language}>
                <TextInput value={form.preferredLanguage} onChange={(v) => update("preferredLanguage", v)} placeholder={ob.labels.preferred_language_placeholder} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label={ob.labels.goal}>
                <ChipSelect<Goal>
                  options={["expatriation", "business", "investment", "exploration"]}
                  value={form.goal}
                  onChange={(v) => update("goal", v)}
                  labels={ob.goals as Record<Goal, string>}
                />
              </Field>
              <Field label={ob.labels.budget_range}>
                <ChipSelect<BudgetRange>
                  options={["under_1000", "1000_2000", "2000_4000", "4000_plus"]}
                  value={form.budgetRange}
                  onChange={(v) => update("budgetRange", v)}
                  labels={ob.budget as Record<BudgetRange, string>}
                />
              </Field>
              <Field label={ob.labels.income_range}>
                <ChipSelect<IncomeRange>
                  options={["under_2000", "2000_5000", "5000_10000", "10000_plus"]}
                  value={form.incomeRange}
                  onChange={(v) => update("incomeRange", v)}
                  labels={ob.income as Record<IncomeRange, string>}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label={ob.labels.climate}>
                <ChipSelect<ClimatePreference>
                  options={["tropical", "temperate", "continental", "arid", "any"]}
                  value={form.climatePreference}
                  onChange={(v) => update("climatePreference", v)}
                  labels={ob.climates as Record<ClimatePreference, string>}
                />
              </Field>
              <Field label={ob.labels.tax_importance}>
                <ImportanceSlider value={form.taxImportance} onChange={(v) => update("taxImportance", v)} leftLabel={ob.importance.not_important} rightLabel={ob.importance.very_important} />
              </Field>
              <Field label={ob.labels.safety_importance}>
                <ImportanceSlider value={form.safetyImportance} onChange={(v) => update("safetyImportance", v)} leftLabel={ob.importance.not_important} rightLabel={ob.importance.very_important} />
              </Field>
              <Field label={ob.labels.cost_importance}>
                <ImportanceSlider value={form.costImportance} onChange={(v) => update("costImportance", v)} leftLabel={ob.importance.not_important} rightLabel={ob.importance.very_important} />
              </Field>
              <Field label={ob.labels.visa_importance}>
                <ImportanceSlider value={form.visaImportance} onChange={(v) => update("visaImportance", v)} leftLabel={ob.importance.not_important} rightLabel={ob.importance.very_important} />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <Field label={ob.labels.family_status}>
                <ChipSelect<FamilyStatus>
                  options={["single", "couple", "family"]}
                  value={form.familyStatus}
                  onChange={(v) => update("familyStatus", v)}
                  labels={ob.family as Record<FamilyStatus, string>}
                />
              </Field>
              <Field label={ob.labels.business_sector}>
                <textarea
                  value={form.businessSector}
                  onChange={(e) => update("businessSector", e.target.value)}
                  placeholder={ob.labels.business_sector_placeholder}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-white/20 focus:bg-white/[0.05] resize-none"
                />
              </Field>
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
                {ob.back}
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="text-sm text-white/30 transition-colors hover:text-white/60"
              >
                {ob.skip}
              </button>
            )}
          </div>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/15"
            >
              {ob.next}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="rounded-full bg-white/90 px-6 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-white"
            >
              {ob.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
