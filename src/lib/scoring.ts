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
  | "overview"
  | "investment"
  | "tax"
  | "safety"
  | "visa"
  | "cost_of_living"
  | "quality_of_life"
  | "economic_growth"
  | "war_risk"
  | "political_stability"
  | "business"
  | "strategic_opportunity";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  icon: string; // emoji
  description: string;
  color: string; // tailwind color name
}

export const MODULES: ModuleDefinition[] = [
  { id: "overview", label: "Overview", icon: "🌐", description: "Composite score across all dimensions", color: "slate" },
  { id: "investment", label: "Investment", icon: "📈", description: "Business & growth potential", color: "violet" },
  { id: "tax", label: "Tax", icon: "💰", description: "Tax optimization score", color: "emerald" },
  { id: "safety", label: "Safety", icon: "🛡", description: "Security & stability", color: "blue" },
  { id: "visa", label: "Visa", icon: "🛂", description: "Immigration ease", color: "cyan" },
  { id: "cost_of_living", label: "Cost of Living", icon: "🏠", description: "Affordability index", color: "amber" },
  { id: "quality_of_life", label: "Quality of Life", icon: "✨", description: "Overall livability", color: "rose" },
  { id: "economic_growth", label: "Economic Growth", icon: "🚀", description: "GDP growth, inflation control & economic dynamism", color: "lime" },
  { id: "war_risk", label: "War Risk", icon: "⚔️", description: "Conflict risk & military threat level", color: "red" },
  { id: "political_stability", label: "Political Stability", icon: "🏛", description: "Governance quality & institutional strength", color: "indigo" },
  { id: "business", label: "Business", icon: "💼", description: "Business-friendly environment & infrastructure", color: "teal" },
  { id: "strategic_opportunity", label: "Strategic Opportunity", icon: "🎯", description: "Emerging market & undervalued growth potential", color: "fuchsia" },
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
// New module scoring functions
// ---------------------------------------------------------------------------

function scoreEconomicGrowth(c: Country): number {
  // Inflation control — low inflation signals a well-managed economy (0% = 100, 15%+ = 0)
  const inflationScore = clamp(100 - (c.economy.inflation / 15) * 100);
  // GDP per capita as economic baseline (higher = more developed, max ~80k)
  const gdpScore = clamp((c.economy.gdp_per_capita / 80000) * 100);
  // Salary-to-cost ratio as a growth/dynamism proxy
  const salaryRatio = c.cost_of_living.average_salary / Math.max(c.cost_of_living.index * 20, 1);
  const ratioScore = clamp(Math.min(salaryRatio * 25, 100));
  // Political stability supports sustained growth
  const stabilityMap = { stable: 85, moderate: 50, unstable: 15 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;

  return clamp(inflationScore * 0.3 + gdpScore * 0.25 + ratioScore * 0.25 + stabilityScore * 0.2);
}

function scoreWarRisk(c: Country): number {
  // HIGH score = LOW risk (safe country)
  // Safety index — directly reflects how safe a country feels
  const safetyScore = c.safety.safety_index;
  // Political stability — stable governments less likely to engage in conflict
  const stabilityMap = { stable: 95, moderate: 55, unstable: 10 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;
  // Nuclear weapon — inverted: having nukes increases risk
  const nuclearScore = c.military.nuclear_weapon ? 15 : 90;
  // Military power index — inverted: high military power = higher war involvement risk
  // power_index ranges roughly 0–3, lower = stronger military
  const militaryScore = clamp(c.military.power_index * 40);

  return clamp(safetyScore * 0.3 + stabilityScore * 0.3 + nuclearScore * 0.2 + militaryScore * 0.2);
}

function scorePoliticalStability(c: Country): number {
  // Government stability rating — primary indicator
  const stabilityMap = { stable: 95, moderate: 50, unstable: 10 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;
  // Safety index as proxy for effective governance
  const safetyScore = c.safety.safety_index;
  // Life expectancy as proxy for governance quality (well-governed countries have higher life expectancy)
  const lifeScore = clamp(((c.population_data.life_expectancy - 50) / 35) * 100);
  // Low crime supports the picture of stable governance
  const crimeScore = clamp(100 - c.safety.crime_index);

  return clamp(stabilityScore * 0.35 + safetyScore * 0.25 + lifeScore * 0.2 + crimeScore * 0.2);
}

function scoreBusiness(c: Country): number {
  // Tax friendliness — lower taxes = better for business
  const taxMap = { low: 90, medium: 55, high: 20 };
  const taxScore = taxMap[c.tax.level] || 50;
  // Visa ease — easier access = more business-friendly
  const visaMap = { easy: 85, medium: 55, hard: 20 };
  const visaScore = visaMap[c.visa.ease_of_access] || 50;
  // Political stability — essential for business continuity
  const stabilityMap = { stable: 90, moderate: 50, unstable: 15 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;
  // GDP per capita as infrastructure/market quality proxy
  const gdpScore = clamp((c.economy.gdp_per_capita / 80000) * 100);
  // Corporate tax rate (lower = better for business)
  const corpRate = taxTextToRate(c.tax.corporate_tax);
  const corpScore = clamp(100 - (corpRate / 35) * 100);

  return clamp(taxScore * 0.2 + visaScore * 0.15 + stabilityScore * 0.25 + gdpScore * 0.2 + corpScore * 0.2);
}

function scoreStrategicOpportunity(c: Country): number {
  // Lower GDP per capita but stable = high growth opportunity (sweet spot around $5k–$25k)
  // Countries with very low GDP may be too risky, very high GDP = already developed
  const gdpRaw = c.economy.gdp_per_capita;
  let growthPotential: number;
  if (gdpRaw < 3000) {
    growthPotential = clamp((gdpRaw / 3000) * 50); // too undeveloped, moderate opportunity
  } else if (gdpRaw <= 25000) {
    growthPotential = clamp(60 + ((25000 - gdpRaw) / 22000) * 40); // sweet spot — lower in range = higher opportunity
  } else {
    growthPotential = clamp(60 - ((gdpRaw - 25000) / 55000) * 60); // diminishing opportunity
  }
  // Visa ease — easy access = easier to deploy capital
  const visaMap = { easy: 85, medium: 55, hard: 20 };
  const visaScore = visaMap[c.visa.ease_of_access] || 50;
  // Low cost of living = undervalued market
  const costScore = clamp(100 - c.cost_of_living.index);
  // Stability required for strategic bets
  const stabilityMap = { stable: 80, moderate: 55, unstable: 15 };
  const stabilityScore = stabilityMap[c.government.political_stability] || 50;
  // Low inflation = stable environment for investment
  const inflationScore = clamp(100 - (c.economy.inflation / 15) * 100);

  return clamp(growthPotential * 0.3 + visaScore * 0.15 + costScore * 0.2 + stabilityScore * 0.2 + inflationScore * 0.15);
}

/** Overview is the average of all other 11 module scores */
function scoreOverview(c: Country): number {
  const moduleScores = [
    scoreInvestment(c),
    scoreTax(c),
    scoreSafety(c),
    scoreVisa(c),
    scoreCostOfLiving(c),
    scoreQualityOfLife(c),
    scoreEconomicGrowth(c),
    scoreWarRisk(c),
    scorePoliticalStability(c),
    scoreBusiness(c),
    scoreStrategicOpportunity(c),
  ];
  const avg = moduleScores.reduce((sum, s) => sum + s, 0) / moduleScores.length;
  return clamp(avg);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const SCORE_FNS: Record<ModuleId, (c: Country) => number> = {
  overview: scoreOverview,
  investment: scoreInvestment,
  tax: scoreTax,
  safety: scoreSafety,
  visa: scoreVisa,
  cost_of_living: scoreCostOfLiving,
  quality_of_life: scoreQualityOfLife,
  economic_growth: scoreEconomicGrowth,
  war_risk: scoreWarRisk,
  political_stability: scorePoliticalStability,
  business: scoreBusiness,
  strategic_opportunity: scoreStrategicOpportunity,
};

export interface CountryScore {
  iso: string;
  name: string;
  score: number;
  tier: "green" | "orange" | "red";
  reason: string;
}

/** Generate a 1-line reason why this country ranks where it does for the given module */
function getRankingReason(c: Country, module: ModuleId, score: number): string {
  const tier = getScoreTier(score);
  const stabLabel = c.government.political_stability;
  switch (module) {
    case "overview":
      return tier === "green" ? "Strong all-around performer across key dimensions" : tier === "orange" ? "Mixed performance — strengths offset by gaps" : "Below average across most categories";
    case "investment":
      if (tier === "green") return c.tax.level === "low" ? "Low tax base with strong GDP and capital mobility" : "High GDP per capita with stable governance";
      if (tier === "red") return stabLabel === "unstable" ? "Political instability deters capital inflows" : "Weak economic fundamentals limit appeal";
      return c.economy.inflation > 5 ? "Moderate potential but inflationary pressure" : "Balanced investment conditions with trade-offs";
    case "tax":
      if (tier === "green") return "Favorable tax regime with low effective rates";
      if (tier === "red") return "High tax burden across income and corporate levels";
      return "Moderate tax environment with some optimization room";
    case "safety":
      if (tier === "green") return `Safety index ${c.safety.safety_index}/100 with ${stabLabel} governance`;
      if (tier === "red") return `Elevated crime (${c.safety.crime_index}/100) and security concerns`;
      return "Average safety conditions — standard precautions advised";
    case "visa":
      if (tier === "green") return `${c.visa.ease_of_access} visa access — ${c.visa.residency_options}`;
      if (tier === "red") return "Strict visa requirements with limited pathways";
      return "Moderate visa complexity — planning required";
    case "cost_of_living":
      if (tier === "green") return `Very affordable (index ${c.cost_of_living.index}) with reasonable salaries`;
      if (tier === "red") return "High cost of living erodes purchasing power";
      return "Moderate costs with salary-adjusted balance";
    case "quality_of_life":
      if (tier === "green") return `High life expectancy (${c.population_data.life_expectancy}yr) and strong livability`;
      if (tier === "red") return "Quality of life challenges across health and infrastructure";
      return "Decent livability with room for improvement";
    case "economic_growth":
      if (tier === "green") return c.economy.inflation < 3 ? "Low inflation with strong economic dynamism" : "Robust economic indicators and growth signals";
      if (tier === "red") return "Weak growth fundamentals and economic headwinds";
      return "Moderate growth trajectory with mixed signals";
    case "war_risk":
      if (tier === "green") return `Low conflict risk — ${stabLabel} governance, no nuclear threats`;
      if (tier === "red") return c.military.nuclear_weapon ? "Nuclear-armed with elevated geopolitical tension" : "Significant conflict risk factors present";
      return "Moderate risk profile — monitor geopolitical developments";
    case "political_stability":
      if (tier === "green") return `${stabLabel} governance with strong institutional framework`;
      if (tier === "red") return "Weak governance and institutional fragility";
      return "Moderate governance — functional but reform-dependent";
    case "business":
      if (tier === "green") return c.tax.level === "low" ? "Tax-friendly with easy market access" : "Strong business infrastructure and stability";
      if (tier === "red") return "Challenging business environment — regulatory barriers";
      return "Viable business climate with some friction";
    case "strategic_opportunity":
      if (tier === "green") return c.economy.gdp_per_capita < 15000 ? "Emerging market with high upside and low entry costs" : "Strong opportunity profile with accessible entry";
      if (tier === "red") return "Limited strategic opportunity — high costs or instability";
      return "Moderate opportunity — selective entry recommended";
  }
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
        reason: getRankingReason(c, module, score),
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
    case "overview": {
      // Show each module's score as a sub-score
      const moduleIds: Exclude<ModuleId, "overview">[] = [
        "investment", "tax", "safety", "visa", "cost_of_living", "quality_of_life",
        "economic_growth", "war_risk", "political_stability", "business", "strategic_opportunity",
      ];
      const moduleLabels: Record<string, string> = {
        investment: "Investment",
        tax: "Tax",
        safety: "Safety",
        visa: "Visa",
        cost_of_living: "Cost of Living",
        quality_of_life: "Quality of Life",
        economic_growth: "Economic Growth",
        war_risk: "War Risk",
        political_stability: "Political Stability",
        business: "Business",
        strategic_opportunity: "Strategic Opportunity",
      };
      return moduleIds.map((id) => {
        const s = SCORE_FNS[id](country);
        return { label: moduleLabels[id], score: s, tier: getScoreTier(s) };
      });
    }
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
    case "economic_growth": {
      const inflationS = clamp(100 - (country.economy.inflation / 15) * 100);
      const gdpS = clamp((country.economy.gdp_per_capita / 80000) * 100);
      const ratioRaw = country.cost_of_living.average_salary / Math.max(country.cost_of_living.index * 20, 1);
      const ratioS = clamp(Math.min(ratioRaw * 25, 100));
      const stabMap = { stable: 85, moderate: 50, unstable: 15 };
      const stabS = stabMap[country.government.political_stability] || 50;
      return [
        { label: "Inflation Control", score: inflationS, tier: getScoreTier(inflationS) },
        { label: "GDP Strength", score: gdpS, tier: getScoreTier(gdpS) },
        { label: "Salary-to-Cost Ratio", score: ratioS, tier: getScoreTier(ratioS) },
        { label: "Political Stability", score: stabS, tier: getScoreTier(stabS) },
      ];
    }
    case "war_risk": {
      const safeS = country.safety.safety_index;
      const stabMap = { stable: 95, moderate: 55, unstable: 10 };
      const stabS = stabMap[country.government.political_stability] || 50;
      const nucS = country.military.nuclear_weapon ? 15 : 90;
      const milS = clamp(country.military.power_index * 40);
      return [
        { label: "Safety Index", score: safeS, tier: getScoreTier(safeS) },
        { label: "Political Stability", score: stabS, tier: getScoreTier(stabS) },
        { label: "Nuclear Risk (inverted)", score: nucS, tier: getScoreTier(nucS) },
        { label: "Military Posture (inverted)", score: milS, tier: getScoreTier(milS) },
      ];
    }
    case "political_stability": {
      const stabMap = { stable: 95, moderate: 50, unstable: 10 };
      const stabS = stabMap[country.government.political_stability] || 50;
      const safeS = country.safety.safety_index;
      const lifeS = clamp(((country.population_data.life_expectancy - 50) / 35) * 100);
      const crimeS = clamp(100 - country.safety.crime_index);
      return [
        { label: "Governance Rating", score: stabS, tier: getScoreTier(stabS) },
        { label: "Safety Index", score: safeS, tier: getScoreTier(safeS) },
        { label: "Life Expectancy", score: lifeS, tier: getScoreTier(lifeS) },
        { label: "Low Crime", score: crimeS, tier: getScoreTier(crimeS) },
      ];
    }
    case "business": {
      const txMap = { low: 90, medium: 55, high: 20 };
      const txS = txMap[country.tax.level] || 50;
      const vsMap = { easy: 85, medium: 55, hard: 20 };
      const vsS = vsMap[country.visa.ease_of_access] || 50;
      const stMap = { stable: 90, moderate: 50, unstable: 15 };
      const stS = stMap[country.government.political_stability] || 50;
      const gdpS = clamp((country.economy.gdp_per_capita / 80000) * 100);
      const corpRate = taxTextToRate(country.tax.corporate_tax);
      const corpS = clamp(100 - (corpRate / 35) * 100);
      return [
        { label: "Tax Friendliness", score: txS, tier: getScoreTier(txS) },
        { label: "Visa Access", score: vsS, tier: getScoreTier(vsS) },
        { label: "Political Stability", score: stS, tier: getScoreTier(stS) },
        { label: "Economic Infrastructure", score: gdpS, tier: getScoreTier(gdpS) },
        { label: "Corporate Tax", score: corpS, tier: getScoreTier(corpS) },
      ];
    }
    case "strategic_opportunity": {
      const gdpRaw = country.economy.gdp_per_capita;
      let growthPotential: number;
      if (gdpRaw < 3000) {
        growthPotential = clamp((gdpRaw / 3000) * 50);
      } else if (gdpRaw <= 25000) {
        growthPotential = clamp(60 + ((25000 - gdpRaw) / 22000) * 40);
      } else {
        growthPotential = clamp(60 - ((gdpRaw - 25000) / 55000) * 60);
      }
      const vsMap = { easy: 85, medium: 55, hard: 20 };
      const vsS = vsMap[country.visa.ease_of_access] || 50;
      const costS = clamp(100 - country.cost_of_living.index);
      const stMap = { stable: 80, moderate: 55, unstable: 15 };
      const stS = stMap[country.government.political_stability] || 50;
      const inflS = clamp(100 - (country.economy.inflation / 15) * 100);
      return [
        { label: "Growth Potential", score: growthPotential, tier: getScoreTier(growthPotential) },
        { label: "Visa Access", score: vsS, tier: getScoreTier(vsS) },
        { label: "Low Cost of Living", score: costS, tier: getScoreTier(costS) },
        { label: "Stability", score: stS, tier: getScoreTier(stS) },
        { label: "Inflation Control", score: inflS, tier: getScoreTier(inflS) },
      ];
    }
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

// ---------------------------------------------------------------------------
// Module explanations — human-readable tier descriptions
// ---------------------------------------------------------------------------

export function getModuleExplanation(module: ModuleId): Record<"green" | "orange" | "red", string> {
  switch (module) {
    case "overview":
      return {
        green: "Top-tier country — strong performance across most dimensions",
        orange: "Mixed profile — strengths in some areas, weaknesses in others",
        red: "Significant challenges — below average across multiple dimensions",
      };
    case "investment":
      return {
        green: "Excellent investment climate — strong GDP, low inflation, favorable taxes",
        orange: "Moderate investment potential — some favorable conditions but notable risks",
        red: "Challenging investment environment — high inflation, instability, or heavy taxation",
      };
    case "tax":
      return {
        green: "Very tax-friendly — low income and corporate tax rates",
        orange: "Moderate taxation — average rates with some optimization potential",
        red: "High tax burden — elevated income and corporate tax rates",
      };
    case "safety":
      return {
        green: "Very safe — low crime, stable governance",
        orange: "Moderate safety — some risk factors present",
        red: "Higher risk — significant safety concerns",
      };
    case "visa":
      return {
        green: "Easy immigration — accessible visa and residency options",
        orange: "Moderate access — some visa restrictions apply",
        red: "Difficult immigration — restrictive visa policies",
      };
    case "cost_of_living":
      return {
        green: "Very affordable — low cost of living with good salary ratios",
        orange: "Moderate cost — balanced affordability",
        red: "Expensive — high living costs relative to income",
      };
    case "quality_of_life":
      return {
        green: "Excellent quality of life — high life expectancy, safety, and services",
        orange: "Decent quality of life — adequate but room for improvement",
        red: "Lower quality of life — challenges in health, safety, or economic access",
      };
    case "economic_growth":
      return {
        green: "Strong economic dynamism — controlled inflation, robust GDP, healthy salary ratios",
        orange: "Moderate growth trajectory — some economic headwinds",
        red: "Weak economic outlook — high inflation, low GDP, or poor wage conditions",
      };
    case "war_risk":
      return {
        green: "Very low conflict risk — peaceful, non-nuclear, stable governance",
        orange: "Moderate risk — some military or political tension factors",
        red: "Elevated conflict risk — nuclear capability, military power, or instability",
      };
    case "political_stability":
      return {
        green: "Highly stable governance — strong institutions, low corruption indicators",
        orange: "Moderately stable — functional governance with some concerns",
        red: "Unstable governance — weak institutions, high crime, or political volatility",
      };
    case "business":
      return {
        green: "Very business-friendly — low taxes, easy access, strong infrastructure",
        orange: "Moderate business environment — some barriers or higher costs",
        red: "Challenging for business — high taxes, restricted access, or instability",
      };
    case "strategic_opportunity":
      return {
        green: "High strategic potential — emerging market with stability and low costs",
        orange: "Moderate opportunity — some growth potential but limiting factors",
        red: "Low strategic opportunity — either overdeveloped or too unstable for growth plays",
      };
  }
}
