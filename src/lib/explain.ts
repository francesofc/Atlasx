import type { Country } from "@/data/countries";
import type { UserProfile, Insight } from "@/types/profile";
import type { Locale } from "@/contexts/I18nContext";

// Templates indexed by locale
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";

const translations = { en, fr, es, pt } as const;

type Components = {
  goal: number;
  budget: number;
  tax: number;
  safety: number;
  visa: number;
  climate: number;
  costRaw: number;
};

// Helper to get explanation templates for current locale
function tpl(locale: Locale) {
  return translations[locale].explain;
}

// Replace {{placeholders}} in template strings
function fill(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, String(val));
  }
  return result;
}

// Budget range → display string
function budgetLabel(profile: UserProfile, locale: Locale): string {
  const labels = translations[locale].onboarding.budget;
  return labels[profile.budgetRange as keyof typeof labels] || profile.budgetRange;
}

// Goal → display string
function goalLabel(profile: UserProfile, locale: Locale): string {
  const labels = translations[locale].onboarding.goals;
  return labels[profile.goal as keyof typeof labels] || profile.goal;
}

// Climate pref → display string
function climateLabel(profile: UserProfile, locale: Locale): string {
  const labels = translations[locale].onboarding.climates;
  return labels[profile.climatePreference as keyof typeof labels] || profile.climatePreference;
}

// ---------------------------------------------------------------------------
// Generate contextual insights (positive + tradeoffs)
// ---------------------------------------------------------------------------
export function generateInsights(
  country: Country,
  comp: Components,
  profile: UserProfile,
  locale: Locale
): Insight[] {
  const t = tpl(locale);
  const insights: Insight[] = [];
  const name = country.name[locale];

  // --- BUDGET ---
  if (comp.budget >= 80) {
    insights.push({
      type: "positive",
      text: fill(t.budget_strong, { budget: budgetLabel(profile, locale), country: name }),
    });
  } else if (comp.budget <= 35) {
    insights.push({
      type: "tradeoff",
      text: fill(t.budget_tight, { budget: budgetLabel(profile, locale), country: name }),
    });
  }

  // --- TAX ---
  if (country.tax.level === "low" && profile.taxImportance >= 3) {
    insights.push({
      type: "positive",
      text: t.tax_low,
    });
  } else if (country.tax.level === "high" && profile.taxImportance >= 3) {
    insights.push({
      type: "tradeoff",
      text: fill(t.tax_high, { country: name }),
    });
  }

  // --- SAFETY ---
  if (country.safety.safety_index >= 70 && profile.safetyImportance >= 3) {
    insights.push({
      type: "positive",
      text: fill(t.safety_high, { score: country.safety.safety_index }),
    });
  } else if (country.safety.safety_index < 40 && profile.safetyImportance >= 2) {
    insights.push({
      type: "tradeoff",
      text: fill(t.safety_low, { score: country.safety.safety_index }),
    });
  }

  // --- VISA ---
  if (country.visa.ease_of_access === "easy" && profile.visaImportance >= 2) {
    insights.push({
      type: "positive",
      text: t.visa_easy,
    });
  } else if (country.visa.ease_of_access === "hard" && profile.visaImportance >= 2) {
    insights.push({
      type: "tradeoff",
      text: t.visa_hard,
    });
  }

  // --- CLIMATE ---
  if (profile.climatePreference !== "any") {
    if (comp.climate >= 80) {
      insights.push({
        type: "positive",
        text: fill(t.climate_match, { climate: climateLabel(profile, locale) }),
      });
    } else {
      insights.push({
        type: "tradeoff",
        text: fill(t.climate_mismatch, { climate: climateLabel(profile, locale) }),
      });
    }
  }

  // --- GOAL-SPECIFIC ---
  if (profile.goal === "business" && country.tax.level === "low") {
    insights.push({ type: "positive", text: t.goal_business_tax });
  }
  if (profile.goal === "expatriation" && country.visa.ease_of_access === "easy" && country.safety.safety_index >= 55) {
    insights.push({ type: "positive", text: t.goal_expat_friendly });
  }
  if (profile.goal === "expatriation" && profile.familyStatus === "family" && country.safety.safety_index >= 60) {
    insights.push({ type: "positive", text: t.goal_family_safe });
  }
  if (profile.goal === "investment" && country.economy.gdp > 1000) {
    insights.push({ type: "positive", text: fill(t.goal_investment_gdp, { gdp: Math.round(country.economy.gdp) }) });
  }
  if (profile.goal === "exploration" && country.cost_of_living.index <= 35) {
    insights.push({ type: "positive", text: t.goal_explore_cheap });
  }

  // --- INFRASTRUCTURE / LANGUAGE tradeoffs ---
  if (country.cost_of_living.index <= 30 && country.safety.safety_index < 50) {
    insights.push({ type: "tradeoff", text: t.tradeoff_infrastructure });
  }
  if (country.cost_of_living.average_salary < 600 && profile.goal === "business") {
    insights.push({ type: "tradeoff", text: t.tradeoff_local_purchasing });
  }

  // Limit to avoid overload — max 4 positive, 2 tradeoffs
  const positives = insights.filter((i) => i.type === "positive").slice(0, 4);
  const tradeoffs = insights.filter((i) => i.type === "tradeoff").slice(0, 2);
  return [...positives, ...tradeoffs];
}

// ---------------------------------------------------------------------------
// Generate a personalized summary paragraph
// ---------------------------------------------------------------------------
export function generateSummary(
  country: Country,
  comp: Components,
  profile: UserProfile,
  locale: Locale
): string {
  const t = tpl(locale);
  const name = country.name[locale];
  const goal = goalLabel(profile, locale);
  const budget = budgetLabel(profile, locale);

  // Pick a strength to highlight
  let strength = "";
  const topFactor = (["tax", "safety", "visa", "budget", "climate"] as const)
    .map((k) => ({ key: k, val: comp[k] }))
    .sort((a, b) => b.val - a.val)[0];

  switch (topFactor.key) {
    case "tax": strength = t.strength_tax; break;
    case "safety": strength = t.strength_safety; break;
    case "visa": strength = t.strength_visa; break;
    case "budget": strength = t.strength_budget; break;
    case "climate": strength = t.strength_climate; break;
  }

  return fill(t.summary_template, { country: name, goal, budget, strength });
}

// ---------------------------------------------------------------------------
// Generate edge explanation (why #N ranks above #N+1)
// ---------------------------------------------------------------------------
export function generateEdge(
  higher: { country: Country; score: number; components: Components },
  lower: { country: Country; score: number; components: Components },
  profile: UserProfile,
  locale: Locale
): string {
  const t = tpl(locale);
  const diff = higher.score - lower.score;
  const higherName = higher.country.name[locale];
  const lowerName = lower.country.name[locale];

  // Find the factor with the biggest gap
  const factors = ["goal", "budget", "tax", "safety", "visa", "climate"] as const;
  let bestFactor: typeof factors[number] = factors[0];
  let bestGap = 0;
  for (const f of factors) {
    const gap = higher.components[f] - lower.components[f];
    if (gap > bestGap) {
      bestGap = gap;
      bestFactor = f;
    }
  }

  const factorLabels: Record<string, string> = {
    goal: t.factor_goal,
    budget: t.factor_budget,
    tax: t.factor_tax,
    safety: t.factor_safety,
    visa: t.factor_visa,
    climate: t.factor_climate,
  };

  return fill(t.edge_template, {
    higher: higherName,
    lower: lowerName,
    points: diff,
    factor: factorLabels[bestFactor] || bestFactor,
  });
}
