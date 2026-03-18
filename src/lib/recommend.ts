import { countries, type Country } from "@/data/countries";
import type { UserProfile, CountryMatch, Insight, ImportanceLevel, Goal } from "@/types/profile";
import type { Locale } from "@/contexts/I18nContext";
import { generateInsights, generateSummary, generateEdge } from "./explain";

// ---------------------------------------------------------------------------
// Weight configuration — defines how much each factor matters
// ---------------------------------------------------------------------------
const WEIGHTS = {
  goal: 0.28,       // highest — the user's primary objective
  budget: 0.18,     // budget vs cost of living alignment
  tax: 0.15,        // tax preference
  safety: 0.13,     // safety preference
  visa: 0.12,       // visa accessibility
  climate: 0.08,    // climate match
  costRaw: 0.06,    // raw cost-of-living score (independent of budget)
} as const;

// Importance level (1–5) → multiplier that scales the base weight
function importanceMultiplier(level: ImportanceLevel): number {
  return 0.4 + (level - 1) * 0.3; // 0.4, 0.7, 1.0, 1.3, 1.6
}

// Budget range → approximate monthly spend capacity (USD)
const BUDGET_USD: Record<string, number> = {
  under_1000: 800,
  "1000_2000": 1500,
  "1000_3000": 2000,
  "2000_4000": 3000,
  "3000_5000": 4000,
  "4000_plus": 6000,
  "5000_plus": 7000,
};

// Rough monthly cost estimate from cost_of_living_index
function estimatedMonthlyCost(index: number): number {
  return index * 22; // e.g. index 30 → ~$660, index 70 → ~$1540
}

// ---------------------------------------------------------------------------
// Individual scoring functions — each returns 0–100
// ---------------------------------------------------------------------------

function scoreTax(country: Country): number {
  if (country.tax.level === "low") return 100;
  if (country.tax.level === "medium") return 50;
  return 10;
}

function scoreSafety(country: Country): number {
  return Math.min((country.safety.safety_index / 85) * 100, 100);
}

function scoreVisa(country: Country): number {
  if (country.visa.ease_of_access === "easy") return 100;
  if (country.visa.ease_of_access === "medium") return 50;
  return 10;
}

function scoreBudget(country: Country, profile: UserProfile): number {
  const budget = BUDGET_USD[profile.budgetRange] || 3000;
  const cost = estimatedMonthlyCost(country.cost_of_living.index);
  const ratio = budget / cost;
  if (ratio >= 2.5) return 100;
  if (ratio >= 1.5) return 85;
  if (ratio >= 1.0) return 65;
  if (ratio >= 0.7) return 35;
  return 10;
}

function scoreCostRaw(country: Country): number {
  return Math.max(0, Math.min(100, 110 - country.cost_of_living.index));
}

function scoreClimate(country: Country, profile: UserProfile): number {
  if (profile.climatePreference === "any") return 70;
  const text = country.climate.description.en.toLowerCase();
  const keywords: Record<string, string[]> = {
    warm: ["tropical", "hot", "monsoon", "equatorial", "humid", "arid", "desert", "subtropical", "mediterranean"],
    mild: ["temperate", "maritime", "mediterranean", "oceanic", "mild", "moderate"],
    cold: ["continental", "cold", "alpine", "subarctic", "arctic", "snow"],
    // Legacy compat
    tropical: ["tropical", "monsoon", "equatorial", "rainforest", "humid year"],
    temperate: ["temperate", "maritime", "mediterranean", "oceanic", "mild"],
    continental: ["continental", "cold winter", "alpine", "subarctic"],
    arid: ["arid", "desert", "dry", "hot desert"],
  };
  const terms = keywords[profile.climatePreference] || [];
  return terms.some((t) => text.includes(t)) ? 100 : 15;
}

// Score a single goal against a country
function scoreSingleGoal(country: Country, goal: Goal, profile: UserProfile): number {
  let s = 40;

  switch (goal) {
    case "low_taxes":
      if (country.tax.level === "low") s += 40;
      else if (country.tax.level === "medium") s += 15;
      if (country.government.political_stability === "stable") s += 10;
      if (country.visa.ease_of_access !== "hard") s += 5;
      break;

    case "save_money":
      if (country.cost_of_living.index <= 30) s += 35;
      else if (country.cost_of_living.index <= 50) s += 20;
      else if (country.cost_of_living.index <= 70) s += 5;
      if (country.tax.level === "low") s += 15;
      else if (country.tax.level === "medium") s += 5;
      if (country.safety.safety_index >= 50) s += 5;
      break;

    case "quality_of_life":
      if (country.safety.safety_index >= 70) s += 20;
      else if (country.safety.safety_index >= 55) s += 10;
      if (country.population_data.life_expectancy >= 78) s += 10;
      if (country.economy.gdp_per_capita >= 30000) s += 10;
      if (country.government.political_stability === "stable") s += 10;
      if (profile.familyStatus === "family" && country.safety.safety_index >= 60) s += 5;
      break;

    case "business":
      if (country.tax.level === "low") s += 25;
      else if (country.tax.level === "medium") s += 10;
      if (country.economy.gdp > 1500) s += 10;
      if (country.visa.ease_of_access === "easy") s += 10;
      if (country.safety.safety_index >= 60) s += 5;
      if (country.government.political_stability === "stable") s += 5;
      break;

    case "remote_work":
      if (country.cost_of_living.index <= 45) s += 20;
      else if (country.cost_of_living.index <= 65) s += 10;
      if (country.visa.ease_of_access === "easy") s += 15;
      else if (country.visa.ease_of_access === "medium") s += 5;
      if (country.safety.safety_index >= 55) s += 10;
      if (country.economy.gdp_per_capita >= 15000) s += 5;
      break;

    case "investment":
      if (country.economy.gdp > 1000) s += 15;
      if (country.tax.level === "low") s += 20;
      else if (country.tax.level === "medium") s += 8;
      if (country.safety.safety_index >= 55) s += 10;
      if (country.visa.ease_of_access !== "hard") s += 5;
      if (country.government.political_stability === "stable") s += 5;
      break;

    // Legacy goals
    case "expatriation" as Goal:
      if (country.visa.ease_of_access === "easy") s += 20;
      else if (country.visa.ease_of_access === "medium") s += 8;
      if (country.safety.safety_index >= 65) s += 15;
      if (country.cost_of_living.index <= 45) s += 10;
      if (profile.familyStatus === "family" && country.safety.safety_index >= 60) s += 10;
      break;

    case "exploration" as Goal:
      s += 15;
      if (country.cost_of_living.index <= 40) s += 15;
      if (country.visa.ease_of_access === "easy") s += 10;
      if (country.safety.safety_index >= 50) s += 5;
      break;
  }

  return Math.min(s, 100);
}

// Multi-goal scoring — average of all selected goals
function scoreGoal(country: Country, profile: UserProfile): number {
  const goals = profile.goals && profile.goals.length > 0 ? profile.goals : [profile.goal];
  const scores = goals.map((g) => scoreSingleGoal(country, g, profile));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ---------------------------------------------------------------------------
// Master scoring — combines all factors with user-adjusted weights
// ---------------------------------------------------------------------------

export interface ScoredCountry {
  country: Country;
  score: number;
  components: {
    goal: number;
    budget: number;
    tax: number;
    safety: number;
    visa: number;
    climate: number;
    costRaw: number;
  };
}

function scoreCountry(country: Country, profile: UserProfile): ScoredCountry {
  const components = {
    goal: scoreGoal(country, profile),
    budget: scoreBudget(country, profile),
    tax: scoreTax(country),
    safety: scoreSafety(country),
    visa: scoreVisa(country),
    climate: scoreClimate(country, profile),
    costRaw: scoreCostRaw(country),
  };

  const w = {
    goal: WEIGHTS.goal,
    budget: WEIGHTS.budget,
    tax: WEIGHTS.tax * importanceMultiplier(profile.taxImportance),
    safety: WEIGHTS.safety * importanceMultiplier(profile.safetyImportance),
    visa: WEIGHTS.visa * importanceMultiplier(profile.visaImportance),
    climate: WEIGHTS.climate,
    costRaw: WEIGHTS.costRaw * importanceMultiplier(profile.costImportance),
  };

  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0);

  const raw =
    w.goal * components.goal +
    w.budget * components.budget +
    w.tax * components.tax +
    w.safety * components.safety +
    w.visa * components.visa +
    w.climate * components.climate +
    w.costRaw * components.costRaw;

  const score = Math.round(raw / totalWeight);

  return { country, score: Math.min(score, 99), components };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getRecommendations(
  profile: UserProfile,
  locale: Locale,
  topN = 5
): CountryMatch[] {
  const scored = countries
    .map((c) => scoreCountry(c, profile))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, topN);

  return top.map((entry, idx) => {
    const insights: Insight[] = generateInsights(entry.country, entry.components, profile, locale);
    const summary = generateSummary(entry.country, entry.components, profile, locale);
    const nextEntry = top[idx + 1];
    const edgeOverNext = nextEntry
      ? generateEdge(entry, nextEntry, profile, locale)
      : "";

    return {
      iso_code: entry.country.iso_code,
      score: entry.score,
      insights,
      summary,
      edgeOverNext,
    };
  });
}

// Get match score for a specific country ISO
export function getCountryMatchScore(
  iso: string,
  profile: UserProfile
): { score: number; label: string; color: string } | null {
  const country = countries.find((c) => c.iso_code === iso);
  if (!country) return null;
  const scored = scoreCountry(country, profile);
  const score = scored.score;
  if (score >= 75) return { score, label: "Great match", color: "emerald" };
  if (score >= 55) return { score, label: "Good match", color: "cyan" };
  if (score >= 40) return { score, label: "Moderate match", color: "amber" };
  return { score, label: "Low match", color: "red" };
}
