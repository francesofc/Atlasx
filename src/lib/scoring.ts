/**
 * Atlas X — Module Scoring Engine
 * Calculates 0–100 scores for each analysis module per country.
 * Green (70–100) = excellent | Orange (40–69) = average | Red (0–39) = poor
 */

import { countries, type Country } from "@/data/countries";

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------

export type ModuleId =
  | "investment"
  | "tax"
  | "safety"
  | "visa"
  | "cost_of_living"
  | "quality_of_life";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  icon: string; // emoji
  description: string;
  color: string; // tailwind color name
}

export const MODULES: ModuleDefinition[] = [
  { id: "investment", label: "Investment", icon: "📈", description: "Business & growth potential", color: "violet" },
  { id: "tax", label: "Tax", icon: "💰", description: "Tax optimization score", color: "emerald" },
  { id: "safety", label: "Safety", icon: "🛡", description: "Security & stability", color: "blue" },
  { id: "visa", label: "Visa", icon: "🛂", description: "Immigration ease", color: "cyan" },
  { id: "cost_of_living", label: "Cost of Living", icon: "🏠", description: "Affordability index", color: "amber" },
  { id: "quality_of_life", label: "Quality of Life", icon: "✨", description: "Overall livability", color: "rose" },
];

// ---------------------------------------------------------------------------
// Score calculation per module
// ---------------------------------------------------------------------------

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function taxTextToRate(text: string): number {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 25;
}

function scoreInvestment(c: Country): number {
  // GDP per capita (higher = better, max ~80k)
  const gdpScore = clamp((c.economy.gdp_per_capita / 80000) * 100);
  // Low inflation is better (0% = 100, 15%+ = 0)
  const inflationScore = clamp(100 - (c.economy.inflation / 15) * 100);
  // Political stability
  const stabilityMap = { stable: 90, moderate: 55, unstable: 20 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;
  // Tax level (lower = more attractive for business)
  const taxMap = { low: 85, medium: 55, high: 30 };
  const taxScore = taxMap[c.tax.level] || 50;

  return clamp(gdpScore * 0.35 + inflationScore * 0.2 + stabilityScore * 0.25 + taxScore * 0.2);
}

function scoreTax(c: Country): number {
  // Tax level
  const levelMap = { low: 95, medium: 50, high: 15 };
  const levelScore = levelMap[c.tax.level] || 50;
  // Income tax rate (lower = better)
  const incomeRate = taxTextToRate(c.tax.income_tax);
  const incomeScore = clamp(100 - (incomeRate / 50) * 100);
  // Corporate tax rate (lower = better)
  const corpRate = taxTextToRate(c.tax.corporate_tax);
  const corpScore = clamp(100 - (corpRate / 35) * 100);

  return clamp(levelScore * 0.4 + incomeScore * 0.35 + corpScore * 0.25);
}

function scoreSafety(c: Country): number {
  // Safety index (0–100, higher = safer)
  const safetyScore = c.safety.safety_index;
  // Crime index inverted (lower crime = better)
  const crimeScore = clamp(100 - c.safety.crime_index);
  // Political stability
  const stabilityMap = { stable: 90, moderate: 50, unstable: 15 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;
  // Nuclear risk (negative factor)
  const nuclearPenalty = c.military.nuclear_weapon ? 10 : 0;

  return clamp(safetyScore * 0.4 + crimeScore * 0.3 + stabilityScore * 0.3 - nuclearPenalty);
}

function scoreVisa(c: Country): number {
  const easeMap = { easy: 90, medium: 55, hard: 20 };
  const easeScore = easeMap[c.visa.ease_of_access] || 50;
  // Stability matters for visa reliability
  const stabilityMap = { stable: 85, moderate: 55, unstable: 25 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;

  return clamp(easeScore * 0.7 + stabilityScore * 0.3);
}

function scoreCostOfLiving(c: Country): number {
  // Cost of living index: lower = more affordable = higher score
  const costScore = clamp(100 - c.cost_of_living.index);
  // Salary-to-cost ratio
  const salaryRatio = c.cost_of_living.average_salary / Math.max(c.cost_of_living.index * 20, 1);
  const ratioScore = clamp(Math.min(salaryRatio * 25, 100));

  return clamp(costScore * 0.6 + ratioScore * 0.4);
}

function scoreQualityOfLife(c: Country): number {
  // Life expectancy (max ~85)
  const lifeScore = clamp(((c.population_data.life_expectancy - 50) / 35) * 100);
  // Safety
  const safetyScore = c.safety.safety_index;
  // Cost balance (moderate is ideal)
  const costBalance = clamp(100 - Math.abs(c.cost_of_living.index - 50) * 1.5);
  // GDP per capita as proxy for services quality
  const gdpScore = clamp((c.economy.gdp_per_capita / 60000) * 100);

  return clamp(lifeScore * 0.3 + safetyScore * 0.25 + costBalance * 0.2 + gdpScore * 0.25);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const SCORE_FNS: Record<ModuleId, (c: Country) => number> = {
  investment: scoreInvestment,
  tax: scoreTax,
  safety: scoreSafety,
  visa: scoreVisa,
  cost_of_living: scoreCostOfLiving,
  quality_of_life: scoreQualityOfLife,
};

export interface CountryScore {
  iso: string;
  name: string;
  score: number;
  tier: "green" | "orange" | "red";
}

export function getScoreTier(score: number): "green" | "orange" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "orange";
  return "red";
}

export function scoreCountry(country: Country, module: ModuleId): number {
  return SCORE_FNS[module](country);
}

export function scoreAllCountries(module: ModuleId): CountryScore[] {
  return countries
    .map((c) => {
      const score = scoreCountry(c, module);
      return {
        iso: c.iso_code,
        name: c.name.en,
        score,
        tier: getScoreTier(score),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Returns a map of ISO3 → score for Mapbox paint expressions */
export function getScoreMap(module: ModuleId): Record<string, number> {
  const result: Record<string, number> = {};
  for (const c of countries) {
    result[c.iso_code] = scoreCountry(c, module);
  }
  return result;
}

/** Get breakdown of sub-scores for a country */
export function getScoreBreakdown(country: Country, module: ModuleId): { label: string; score: number; tier: "green" | "orange" | "red" }[] {
  switch (module) {
    case "investment": return [
      { label: "GDP per Capita", score: clamp((country.economy.gdp_per_capita / 80000) * 100), tier: getScoreTier(clamp((country.economy.gdp_per_capita / 80000) * 100)) },
      { label: "Inflation Control", score: clamp(100 - (country.economy.inflation / 15) * 100), tier: getScoreTier(clamp(100 - (country.economy.inflation / 15) * 100)) },
      { label: "Political Stability", score: ({ stable: 90, moderate: 55, unstable: 20 }[country.government.political_stability] || 50), tier: getScoreTier(({ stable: 90, moderate: 55, unstable: 20 }[country.government.political_stability] || 50)) },
      { label: "Tax Environment", score: ({ low: 85, medium: 55, high: 30 }[country.tax.level] || 50), tier: getScoreTier(({ low: 85, medium: 55, high: 30 }[country.tax.level] || 50)) },
    ];
    case "tax": return [
      { label: "Tax Level", score: ({ low: 95, medium: 50, high: 15 }[country.tax.level] || 50), tier: getScoreTier(({ low: 95, medium: 50, high: 15 }[country.tax.level] || 50)) },
      { label: "Income Tax", score: clamp(100 - (taxTextToRate(country.tax.income_tax) / 50) * 100), tier: getScoreTier(clamp(100 - (taxTextToRate(country.tax.income_tax) / 50) * 100)) },
      { label: "Corporate Tax", score: clamp(100 - (taxTextToRate(country.tax.corporate_tax) / 35) * 100), tier: getScoreTier(clamp(100 - (taxTextToRate(country.tax.corporate_tax) / 35) * 100)) },
    ];
    case "safety": return [
      { label: "Safety Index", score: country.safety.safety_index, tier: getScoreTier(country.safety.safety_index) },
      { label: "Low Crime", score: clamp(100 - country.safety.crime_index), tier: getScoreTier(clamp(100 - country.safety.crime_index)) },
      { label: "Stability", score: ({ stable: 90, moderate: 50, unstable: 15 }[country.government.political_stability] || 50), tier: getScoreTier(({ stable: 90, moderate: 50, unstable: 15 }[country.government.political_stability] || 50)) },
    ];
    case "visa": return [
      { label: "Visa Access", score: ({ easy: 90, medium: 55, hard: 20 }[country.visa.ease_of_access] || 50), tier: getScoreTier(({ easy: 90, medium: 55, hard: 20 }[country.visa.ease_of_access] || 50)) },
      { label: "Political Stability", score: ({ stable: 85, moderate: 55, unstable: 25 }[country.government.political_stability] || 50), tier: getScoreTier(({ stable: 85, moderate: 55, unstable: 25 }[country.government.political_stability] || 50)) },
    ];
    case "cost_of_living": return [
      { label: "Affordability", score: clamp(100 - country.cost_of_living.index), tier: getScoreTier(clamp(100 - country.cost_of_living.index)) },
      { label: "Salary Ratio", score: clamp(Math.min((country.cost_of_living.average_salary / Math.max(country.cost_of_living.index * 20, 1)) * 25, 100)), tier: getScoreTier(clamp(Math.min((country.cost_of_living.average_salary / Math.max(country.cost_of_living.index * 20, 1)) * 25, 100))) },
    ];
    case "quality_of_life": return [
      { label: "Life Expectancy", score: clamp(((country.population_data.life_expectancy - 50) / 35) * 100), tier: getScoreTier(clamp(((country.population_data.life_expectancy - 50) / 35) * 100)) },
      { label: "Safety", score: country.safety.safety_index, tier: getScoreTier(country.safety.safety_index) },
      { label: "Cost Balance", score: clamp(100 - Math.abs(country.cost_of_living.index - 50) * 1.5), tier: getScoreTier(clamp(100 - Math.abs(country.cost_of_living.index - 50) * 1.5)) },
      { label: "Economic Strength", score: clamp((country.economy.gdp_per_capita / 60000) * 100), tier: getScoreTier(clamp((country.economy.gdp_per_capita / 60000) * 100)) },
    ];
  }
}

/** Tier color classes */
export function tierColor(tier: "green" | "orange" | "red") {
  return {
    green: { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    orange: { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/20", dot: "bg-amber-400" },
    red: { text: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20", dot: "bg-red-400" },
  }[tier];
}
