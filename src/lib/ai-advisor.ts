import type { Country } from "@/data/countries";
import type { UserProfile, CountryMatch } from "@/types/profile";
import type { Locale } from "@/contexts/I18nContext";
import { getCountryByIso, countries as allCountries } from "@/data/countries";

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

export interface AIContext {
  profile: UserProfile;
  matches: CountryMatch[];
  countries: Country[];
  locale: Locale;
}

export function buildAIContext(
  profile: UserProfile,
  matches: CountryMatch[],
  locale: Locale
): AIContext {
  const countries = matches
    .map((m) => getCountryByIso(m.iso_code))
    .filter((c): c is Country => c !== undefined);
  return { profile, matches, countries, locale };
}

export function buildSystemPrompt(ctx: AIContext): string {
  const { profile, matches, countries, locale } = ctx;
  const countryList = matches
    .map((m, i) => {
      const c = countries[i];
      if (!c) return "";
      return `#${i + 1} ${c.name[locale]} (score: ${m.score}/100)
  Economy: GDP $${c.economy.gdp}B, per capita $${c.economy.gdp_per_capita}, inflation ${c.economy.inflation}%
  Tax: ${c.tax.level} (income: ${c.tax.income_tax}, corporate: ${c.tax.corporate_tax})
  Safety: ${c.safety.safety_index}/100, Crime: ${c.safety.crime_index}/100
  Visa: ${c.visa.ease_of_access} — ${c.visa.residency_options}
  Cost: index ${c.cost_of_living.index}, avg salary $${c.cost_of_living.average_salary}/mo
  Population: ${(c.population_data.population / 1e6).toFixed(1)}M, life expectancy: ${c.population_data.life_expectancy}yr
  Government: ${c.government.type}, stability: ${c.government.political_stability}
  Military: power index ${c.military.power_index}, nuclear: ${c.military.nuclear_weapon}
  Climate: ${c.climate.description[locale]}, avg temp: ${c.climate.average_temp}`;
    })
    .join("\n\n");

  return `You are Atlas AI — a senior geopolitical and economic intelligence advisor.
You provide structured, data-driven analysis on countries, relocation, investment, and business strategy.

USER PROFILE:
- Goal: ${profile.goal}
- Budget: ${profile.budgetRange}
- Income: ${profile.incomeRange}
- Family: ${profile.familyStatus}
- Climate preference: ${profile.climatePreference}
- Priorities: Tax ${profile.taxImportance}/5 | Safety ${profile.safetyImportance}/5 | Cost ${profile.costImportance}/5 | Visa ${profile.visaImportance}/5
${profile.businessSector ? `- Business sector: ${profile.businessSector}` : ""}

TOP COUNTRY MATCHES:
${countryList}

Rules: Always reference specific data. Be structured and concise. Tailor to the user's profile.`;
}

// ---------------------------------------------------------------------------
// Suggested prompts — context-aware
// ---------------------------------------------------------------------------

const promptTemplates: Record<string, Record<string, string>> = {
  bestForYou: {
    en: "What's the best country for me and why?",
    fr: "Quel est le meilleur pays pour moi et pourquoi ?",
    es: "¿Cuál es el mejor país para mí y por qué?",
    pt: "Qual é o melhor país para mim e por quê?",
  },
  compare: {
    en: "Compare {a} vs {b} for my situation",
    fr: "Comparer {a} vs {b} pour ma situation",
    es: "Comparar {a} vs {b} para mi situación",
    pt: "Comparar {a} vs {b} para minha situação",
  },
  deepDive: {
    en: "Full briefing on {country}",
    fr: "Briefing complet sur {country}",
    es: "Informe completo sobre {country}",
    pt: "Briefing completo sobre {country}",
  },
  taxStrategy: {
    en: "Best tax optimization strategy for my income",
    fr: "Meilleure stratégie fiscale pour mon revenu",
    es: "Mejor estrategia fiscal para mis ingresos",
    pt: "Melhor estratégia fiscal para minha renda",
  },
  relocate: {
    en: "Step-by-step relocation plan to {country}",
    fr: "Plan de relocation étape par étape vers {country}",
    es: "Plan de reubicación paso a paso a {country}",
    pt: "Plano de mudança passo a passo para {country}",
  },
  nomadBest: {
    en: "Best country for digital nomads under $3,000/month",
    fr: "Meilleur pays pour les nomades numériques à moins de 3 000$/mois",
    es: "Mejor país para nómadas digitales con menos de $3,000/mes",
    pt: "Melhor país para nômades digitais com menos de $3.000/mês",
  },
  businessSetup: {
    en: "Where should I set up a business for low taxes and stability?",
    fr: "Où créer une entreprise pour faibles impôts et stabilité ?",
    es: "¿Dónde debería crear un negocio con bajos impuestos y estabilidad?",
    pt: "Onde devo abrir um negócio com impostos baixos e estabilidade?",
  },
  investmentOutlook: {
    en: "Investment outlook: which country has the most growth potential?",
    fr: "Perspectives d'investissement : quel pays a le plus de potentiel ?",
    es: "Perspectiva de inversión: ¿qué país tiene más potencial?",
    pt: "Perspectiva de investimento: qual país tem mais potencial?",
  },
  safeFamily: {
    en: "Safest country for raising a family?",
    fr: "Pays le plus sûr pour élever une famille ?",
    es: "¿País más seguro para criar una familia?",
    pt: "País mais seguro para criar uma família?",
  },
  costOptimize: {
    en: "How to maximize my quality of life on {budget}?",
    fr: "Comment maximiser ma qualité de vie avec {budget} ?",
    es: "¿Cómo maximizar mi calidad de vida con {budget}?",
    pt: "Como maximizar minha qualidade de vida com {budget}?",
  },
};

function tpl(key: string, locale: string, vars?: Record<string, string>): string {
  let text = promptTemplates[key]?.[locale] || promptTemplates[key]?.en || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

export function getSuggestedPrompts(ctx: AIContext): string[] {
  const top = ctx.countries[0];
  const second = ctx.countries[1];
  const locale = ctx.locale;
  const prompts: string[] = [];

  // Always lead with the decision prompt
  prompts.push(tpl("bestForYou", locale));

  // Goal-specific prompt
  if (ctx.profile.goal === "business") {
    prompts.push(tpl("businessSetup", locale));
  } else if (ctx.profile.goal === "expatriation" && top) {
    prompts.push(tpl("relocate", locale, { country: top.name[locale] }));
  } else if (ctx.profile.goal === "investment") {
    prompts.push(tpl("investmentOutlook", locale));
  } else {
    prompts.push(tpl("nomadBest", locale));
  }

  // Comparison if 2+ matches
  if (top && second) {
    prompts.push(tpl("compare", locale, { a: top.name[locale], b: second.name[locale] }));
  }

  // Priority-based
  if (ctx.profile.safetyImportance >= 4) {
    prompts.push(tpl("safeFamily", locale));
  } else if (ctx.profile.taxImportance >= 4) {
    prompts.push(tpl("taxStrategy", locale));
  } else if (ctx.profile.costImportance >= 4) {
    prompts.push(tpl("costOptimize", locale, { budget: budgetLabel(ctx.profile.budgetRange) }));
  } else if (top) {
    prompts.push(tpl("deepDive", locale, { country: top.name[locale] }));
  }

  return prompts.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getName(ctx: AIContext, idx: number): string {
  return ctx.countries[idx]?.name[ctx.locale] || "this country";
}

function goalLabel(goal: string): string {
  const labels: Record<string, string> = {
    expatriation: "expatriation",
    business: "business expansion",
    investment: "investment",
    exploration: "exploration",
  };
  return labels[goal] || goal;
}

function budgetLabel(range: string): string {
  const labels: Record<string, string> = {
    under_1000: "under $1,000/month",
    "1000_2000": "$1,000–$2,000/month",
    "2000_4000": "$2,000–$4,000/month",
    "4000_plus": "$4,000+/month",
  };
  return labels[range] || range;
}

function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

function findCountryInQuestion(q: string): Country | undefined {
  const lower = q.toLowerCase();
  return allCountries.find(
    (c) =>
      lower.includes(c.name.en.toLowerCase()) ||
      lower.includes(c.iso_code.toLowerCase()) ||
      lower.includes(c.name.fr.toLowerCase()) ||
      lower.includes(c.name.es.toLowerCase()) ||
      lower.includes(c.name.pt.toLowerCase())
  );
}

function findTwoCountries(q: string, ctx: AIContext): [Country, Country] | null {
  const lower = q.toLowerCase();
  const found: Country[] = [];
  for (const c of allCountries) {
    if (
      lower.includes(c.name.en.toLowerCase()) ||
      lower.includes(c.iso_code.toLowerCase())
    ) {
      found.push(c);
      if (found.length === 2) break;
    }
  }
  if (found.length === 2) return [found[0], found[1]];
  if (found.length === 1 && ctx.countries.length > 0) {
    const other = ctx.countries.find((c) => c.iso_code !== found[0].iso_code) || ctx.countries[0];
    return [found[0], other];
  }
  if (ctx.countries.length >= 2) return [ctx.countries[0], ctx.countries[1]];
  return null;
}

// ---------------------------------------------------------------------------
// Structured response builder — the "decision engine" format
// ---------------------------------------------------------------------------

function structuredResponse(sections: {
  title: string;
  answer: string;
  why?: string[];
  tradeoffs?: string[];
  alternatives?: { name: string; reason: string }[];
  nextSteps?: string[];
  dataTable?: { label: string; value: string; indicator?: "good" | "warn" | "bad" }[];
}): string {
  const { title, answer, why, tradeoffs, alternatives, nextSteps, dataTable } = sections;
  let out = `## ${title}\n\n${answer}`;

  if (dataTable && dataTable.length > 0) {
    out += "\n\n**Key Data**:\n";
    out += dataTable.map((d) => {
      const icon = d.indicator === "good" ? "🟢" : d.indicator === "bad" ? "🔴" : d.indicator === "warn" ? "🟡" : "📊";
      return `${icon} **${d.label}**: ${d.value}`;
    }).join("\n");
  }

  if (why && why.length > 0) {
    out += "\n\n**Why**:\n";
    out += why.map((w) => `• ${w}`).join("\n");
  }

  if (tradeoffs && tradeoffs.length > 0) {
    out += "\n\n**Trade-offs**:\n";
    out += tradeoffs.map((t) => `⚠️ ${t}`).join("\n");
  }

  if (alternatives && alternatives.length > 0) {
    out += "\n\n**Alternatives**:\n";
    out += alternatives.map((a) => `→ **${a.name}**: ${a.reason}`).join("\n");
  }

  if (nextSteps && nextSteps.length > 0) {
    out += "\n\n**Next Steps**:\n";
    out += nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  }

  return out;
}

// ---------------------------------------------------------------------------
// Score a country against the user profile (for ranking)
// ---------------------------------------------------------------------------

function profileScore(c: Country, ctx: AIContext): number {
  let score = 0;
  const p = ctx.profile;

  // Tax alignment
  if (p.taxImportance >= 4 && c.tax.level === "low") score += 25;
  else if (p.taxImportance >= 4 && c.tax.level === "medium") score += 10;
  else if (c.tax.level === "low") score += 15;
  else if (c.tax.level === "medium") score += 8;

  // Safety
  if (p.safetyImportance >= 4 && c.safety.safety_index >= 65) score += 25;
  else if (c.safety.safety_index >= 65) score += 15;
  else if (c.safety.safety_index >= 45) score += 8;

  // Cost
  if (p.costImportance >= 4 && c.cost_of_living.index <= 40) score += 25;
  else if (p.costImportance >= 4 && c.cost_of_living.index <= 60) score += 12;
  else if (c.cost_of_living.index <= 40) score += 15;
  else if (c.cost_of_living.index <= 60) score += 8;

  // Visa
  if (p.visaImportance >= 4 && c.visa.ease_of_access === "easy") score += 20;
  else if (c.visa.ease_of_access === "easy") score += 12;
  else if (c.visa.ease_of_access === "medium") score += 6;

  // Climate match
  const climDesc = c.climate.description.en.toLowerCase();
  if (p.climatePreference !== "any") {
    if (climDesc.includes(p.climatePreference) || (p.climatePreference === "tropical" && climDesc.includes("hot"))) score += 10;
  }

  // GDP per capita bonus
  if (c.economy.gdp_per_capita > 40000) score += 8;
  else if (c.economy.gdp_per_capita > 20000) score += 4;

  // Stability
  if (c.government.political_stability === "stable") score += 10;
  else if (c.government.political_stability === "moderate") score += 4;

  return score;
}

function rankCountries(ctx: AIContext, pool?: Country[]): Country[] {
  const candidates = pool || ctx.countries;
  return [...candidates].sort((a, b) => profileScore(b, ctx) - profileScore(a, ctx));
}

function indicator(val: number, goodThreshold: number, badThreshold: number, invert = false): "good" | "warn" | "bad" {
  if (invert) return val <= badThreshold ? "good" : val <= goodThreshold ? "warn" : "bad";
  return val >= goodThreshold ? "good" : val >= badThreshold ? "warn" : "bad";
}

// ---------------------------------------------------------------------------
// Response Patterns — Expert mode
// ---------------------------------------------------------------------------

interface ResponsePattern {
  keywords: string[];
  generate: (ctx: AIContext, question: string) => string;
}

// ===== BEST FOR YOU — the decision engine core =====
function generateBestForYou(ctx: AIContext): string {
  const ranked = rankCountries(ctx, allCountries.slice(0, 50));
  const best = ranked[0];
  const alt1 = ranked[1];
  const alt2 = ranked[2];
  const locale = ctx.locale;
  const m = ctx.matches.find((mm) => mm.iso_code === best.iso_code);

  const tradeoffs: string[] = [];
  if (best.cost_of_living.index > 65) tradeoffs.push(`High cost of living (index ${best.cost_of_living.index}/100) — budget carefully`);
  if (best.visa.ease_of_access === "hard") tradeoffs.push(`Visa access is difficult — explore ${best.visa.residency_options.split(",")[0]} pathway`);
  if (best.tax.level === "high") tradeoffs.push(`High tax environment (${best.tax.income_tax}) — consider tax optimization strategies`);
  if (best.safety.safety_index < 50) tradeoffs.push(`Safety index below average (${best.safety.safety_index}/100) — research specific neighborhoods`);
  if (best.economy.inflation > 6) tradeoffs.push(`High inflation (${best.economy.inflation}%) may erode purchasing power`);

  return structuredResponse({
    title: `Best Option for You: ${best.name[locale]}`,
    answer: `Based on your ${goalLabel(ctx.profile.goal)} goals, ${budgetLabel(ctx.profile.budgetRange)} budget, and priorities (Tax: ${ctx.profile.taxImportance}/5, Safety: ${ctx.profile.safetyImportance}/5, Cost: ${ctx.profile.costImportance}/5), **${best.name[locale]}** is your strongest match${m ? ` with a score of ${m.score}/100` : ""}.`,
    dataTable: [
      { label: "Safety", value: `${best.safety.safety_index}/100`, indicator: indicator(best.safety.safety_index, 65, 45) },
      { label: "Cost of Living", value: `Index ${best.cost_of_living.index}`, indicator: indicator(best.cost_of_living.index, 40, 65, true) },
      { label: "Tax Level", value: `${best.tax.level.toUpperCase()} — Income: ${best.tax.income_tax}`, indicator: best.tax.level === "low" ? "good" : best.tax.level === "medium" ? "warn" : "bad" },
      { label: "Visa Access", value: `${best.visa.ease_of_access.toUpperCase()}`, indicator: best.visa.ease_of_access === "easy" ? "good" : best.visa.ease_of_access === "medium" ? "warn" : "bad" },
      { label: "Avg Salary", value: `$${fmt(best.cost_of_living.average_salary)}/mo`, indicator: indicator(best.cost_of_living.average_salary, 3000, 1500) },
      { label: "GDP per Capita", value: `$${fmt(best.economy.gdp_per_capita)}`, indicator: indicator(best.economy.gdp_per_capita, 30000, 15000) },
      { label: "Stability", value: best.government.political_stability, indicator: best.government.political_stability === "stable" ? "good" : best.government.political_stability === "moderate" ? "warn" : "bad" },
    ],
    why: [
      `${best.tax.level === "low" ? "Favorable tax environment" : best.tax.level === "medium" ? "Moderate tax burden" : "Comprehensive public services funded by taxes"} — ${best.tax.income_tax} income tax`,
      `${best.safety.safety_index >= 65 ? "Strong safety record" : best.safety.safety_index >= 45 ? "Adequate safety" : "Improving security"} (${best.safety.safety_index}/100)`,
      `${best.cost_of_living.index <= 40 ? "Very affordable" : best.cost_of_living.index <= 65 ? "Moderate cost" : "Premium but high-quality"} cost of living (index ${best.cost_of_living.index})`,
      `${best.visa.ease_of_access === "easy" ? "Easy visa pathways" : "Accessible residency"}: ${best.visa.residency_options.split(",").slice(0, 2).join(", ")}`,
      `${best.government.political_stability === "stable" ? "Stable political environment" : "Developing governance"} — ${best.government.type}`,
    ],
    tradeoffs: tradeoffs.length > 0 ? tradeoffs : ["No significant drawbacks for your profile — strong overall match"],
    alternatives: [
      { name: alt1.name[locale], reason: `${alt1.tax.level} tax, ${alt1.visa.ease_of_access} visa, safety ${alt1.safety.safety_index}/100, cost index ${alt1.cost_of_living.index}` },
      { name: alt2.name[locale], reason: `${alt2.tax.level} tax, ${alt2.visa.ease_of_access} visa, safety ${alt2.safety.safety_index}/100, cost index ${alt2.cost_of_living.index}` },
    ],
    nextSteps: [
      `Deep-dive into ${best.name[locale]}'s visa requirements and residency pathway`,
      `Compare ${best.name[locale]} vs ${alt1.name[locale]} side by side`,
      `Explore tax optimization strategies for ${best.name[locale]}`,
      `Research specific cities in ${best.name[locale]} for your lifestyle`,
    ],
  });
}

// ===== COMPARISON — structured head-to-head =====
function generateDeepComparison(a: Country, b: Country, ctx: AIContext): string {
  const locale = ctx.locale;
  const ma = ctx.matches.find((m) => m.iso_code === a.iso_code);
  const mb = ctx.matches.find((m) => m.iso_code === b.iso_code);
  const aScore = profileScore(a, ctx);
  const bScore = profileScore(b, ctx);
  const winner = aScore >= bScore ? a : b;
  const loser = aScore >= bScore ? b : a;

  const fields = [
    { label: "GDP per Capita", a: `$${fmt(a.economy.gdp_per_capita)}`, b: `$${fmt(b.economy.gdp_per_capita)}`, higherBetter: true, aVal: a.economy.gdp_per_capita, bVal: b.economy.gdp_per_capita },
    { label: "Safety Index", a: `${a.safety.safety_index}/100`, b: `${b.safety.safety_index}/100`, higherBetter: true, aVal: a.safety.safety_index, bVal: b.safety.safety_index },
    { label: "Cost of Living", a: `${a.cost_of_living.index}`, b: `${b.cost_of_living.index}`, higherBetter: false, aVal: a.cost_of_living.index, bVal: b.cost_of_living.index },
    { label: "Avg Salary", a: `$${fmt(a.cost_of_living.average_salary)}`, b: `$${fmt(b.cost_of_living.average_salary)}`, higherBetter: true, aVal: a.cost_of_living.average_salary, bVal: b.cost_of_living.average_salary },
    { label: "Inflation", a: `${a.economy.inflation}%`, b: `${b.economy.inflation}%`, higherBetter: false, aVal: a.economy.inflation, bVal: b.economy.inflation },
    { label: "Life Expectancy", a: `${a.population_data.life_expectancy}yr`, b: `${b.population_data.life_expectancy}yr`, higherBetter: true, aVal: a.population_data.life_expectancy, bVal: b.population_data.life_expectancy },
  ];

  let aWins = 0;
  let bWins = 0;
  const rows = fields.map((f) => {
    const aWin = f.higherBetter ? f.aVal > f.bVal : f.aVal < f.bVal;
    const bWin = f.higherBetter ? f.bVal > f.aVal : f.bVal < f.aVal;
    if (aWin) aWins++;
    if (bWin) bWins++;
    const marker = aWin ? "🟢" : bWin ? "🔴" : "⚪";
    return `${marker} **${f.label}**: ${f.a} vs ${f.b}`;
  });

  const tradeoffs: string[] = [];
  if (a.tax.level !== b.tax.level) tradeoffs.push(`Tax: ${a.name[locale]} is ${a.tax.level} vs ${b.name[locale]} ${b.tax.level} — ${a.tax.income_tax} vs ${b.tax.income_tax}`);
  if (a.visa.ease_of_access !== b.visa.ease_of_access) tradeoffs.push(`Visa: ${a.name[locale]} has ${a.visa.ease_of_access} access vs ${b.name[locale]} ${b.visa.ease_of_access}`);
  if (a.government.political_stability !== b.government.political_stability) tradeoffs.push(`Stability: ${a.name[locale]} is ${a.government.political_stability} vs ${b.name[locale]} ${b.government.political_stability}`);

  return structuredResponse({
    title: `${a.name[locale]} vs ${b.name[locale]}`,
    answer: `${ma && mb ? `**Match Scores**: ${a.name[locale]} ${ma.score}/100 | ${b.name[locale]} ${mb.score}/100\n\n` : ""}${rows.join("\n")}\n\n**Tax**: ${a.name[locale]} — ${a.tax.level} (${a.tax.income_tax}) vs ${b.name[locale]} — ${b.tax.level} (${b.tax.income_tax})\n**Visa**: ${a.name[locale]} — ${a.visa.ease_of_access} vs ${b.name[locale]} — ${b.visa.ease_of_access}`,
    why: [
      `${winner.name[locale]} leads in ${aScore >= bScore ? aWins : bWins}/${fields.length} metrics`,
      `Better alignment with your ${goalLabel(ctx.profile.goal)} goals and ${budgetLabel(ctx.profile.budgetRange)} budget`,
      `${winner.government.political_stability === "stable" ? "More stable political environment" : "Stronger economic fundamentals"}`,
    ],
    tradeoffs,
    alternatives: (() => {
      const others = rankCountries(ctx, allCountries.slice(0, 50))
        .filter((c) => c.iso_code !== a.iso_code && c.iso_code !== b.iso_code)
        .slice(0, 2);
      return others.map((c) => ({
        name: c.name[locale],
        reason: `${c.tax.level} tax, safety ${c.safety.safety_index}/100, cost ${c.cost_of_living.index} — may outperform both`,
      }));
    })(),
    nextSteps: [
      `Add both to comparison table for detailed side-by-side`,
      `Ask about specific visa pathways for ${winner.name[locale]}`,
      `Explore tax strategies for your situation in ${winner.name[locale]}`,
    ],
  });
}

// ===== DEEP DIVE — country intelligence briefing =====
function generateCountryDeepDive(c: Country, ctx: AIContext): string {
  const locale = ctx.locale;
  const m = ctx.matches.find((mm) => mm.iso_code === c.iso_code);

  const tradeoffs: string[] = [];
  if (c.cost_of_living.index > 70) tradeoffs.push(`High cost of living — index ${c.cost_of_living.index}. Budget ${budgetLabel(ctx.profile.budgetRange)} may be tight.`);
  if (c.visa.ease_of_access === "hard") tradeoffs.push(`Difficult visa access — plan 6-12 months for application process`);
  if (c.tax.level === "high") tradeoffs.push(`High tax environment — explore deductions and treaty benefits`);
  if (c.safety.safety_index < 45) tradeoffs.push(`Below-average safety — research safe neighborhoods carefully`);
  if (c.economy.inflation > 7) tradeoffs.push(`High inflation (${c.economy.inflation}%) eroding purchasing power`);
  if (c.government.political_stability === "unstable") tradeoffs.push(`Political instability — monitor situation before committing`);

  const ranked = rankCountries(ctx, allCountries.slice(0, 50));
  const alts = ranked.filter((cc) => cc.iso_code !== c.iso_code).slice(0, 2);

  return structuredResponse({
    title: `${c.name[locale]} — Intelligence Briefing${m ? ` (Score: ${m.score}/100)` : ""}`,
    answer: `${c.short_description[locale]}\n\n**Government**: ${c.government.type} — ${c.government.current_leader}\n**Climate**: ${c.climate.description[locale]} (avg ${c.climate.average_temp})`,
    dataTable: [
      { label: "GDP", value: `$${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)} per capita)`, indicator: indicator(c.economy.gdp_per_capita, 30000, 15000) },
      { label: "Safety", value: `${c.safety.safety_index}/100 (Crime: ${c.safety.crime_index}/100)`, indicator: indicator(c.safety.safety_index, 65, 45) },
      { label: "Cost of Living", value: `Index ${c.cost_of_living.index} | Avg salary: $${fmt(c.cost_of_living.average_salary)}/mo`, indicator: indicator(c.cost_of_living.index, 40, 65, true) },
      { label: "Tax", value: `${c.tax.level.toUpperCase()} — Income: ${c.tax.income_tax}, Corporate: ${c.tax.corporate_tax}`, indicator: c.tax.level === "low" ? "good" : c.tax.level === "medium" ? "warn" : "bad" },
      { label: "Visa", value: `${c.visa.ease_of_access.toUpperCase()} — ${c.visa.residency_options.split(",").slice(0, 2).join(",")}`, indicator: c.visa.ease_of_access === "easy" ? "good" : c.visa.ease_of_access === "medium" ? "warn" : "bad" },
      { label: "Inflation", value: `${c.economy.inflation}%`, indicator: indicator(c.economy.inflation, 3, 6, true) },
      { label: "Life Expectancy", value: `${c.population_data.life_expectancy} years`, indicator: indicator(c.population_data.life_expectancy, 75, 65) },
      { label: "Population", value: `${fmt(c.population_data.population)} (${c.population_data.density}/km²)` },
      { label: "Military", value: `Power index ${c.military.power_index}${c.military.nuclear_weapon ? " (Nuclear-armed)" : ""}` },
    ],
    why: [
      `Key exports: ${c.economy.main_exports.slice(0, 4).join(", ")}`,
      `Industries: ${c.main_industries.slice(0, 4).join(", ")}`,
      `Stability: **${c.government.political_stability}** political environment`,
      ctx.profile.goal === "business" ? `Business: ${c.tax.corporate_tax} corporate tax in a ${c.government.political_stability} economy` :
      ctx.profile.goal === "expatriation" ? `Expat: ${c.visa.ease_of_access} visa with ${c.visa.residency_options.split(",")[0]} pathway` :
      `Profile fit: ${c.cost_of_living.index <= 45 ? "Affordable" : "Premium"} lifestyle with ${c.safety.safety_index >= 60 ? "strong" : "adequate"} safety`,
    ],
    tradeoffs: tradeoffs.length > 0 ? tradeoffs : ["No major concerns for your profile"],
    alternatives: alts.map((a) => ({
      name: a.name[locale],
      reason: `${a.tax.level} tax, safety ${a.safety.safety_index}/100, cost ${a.cost_of_living.index} — ${profileScore(a, ctx) > profileScore(c, ctx) ? "may be a stronger fit" : "worth considering"}`,
    })),
    nextSteps: [
      `Compare ${c.name[locale]} with your top alternatives`,
      `Explore specific visa and residency pathways`,
      `Research cost of living in major cities`,
      `Ask about tax optimization strategies for ${c.name[locale]}`,
    ],
  });
}

// ===== DIGITAL NOMAD =====
function generateNomadResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const nomadScore = (c: Country) =>
    (100 - c.cost_of_living.index) +
    (c.visa.ease_of_access === "easy" ? 30 : c.visa.ease_of_access === "medium" ? 15 : 0) +
    (c.safety.safety_index > 50 ? 20 : 0) +
    (c.government.political_stability === "stable" ? 10 : 0);

  const ranked = [...allCountries].sort((a, b) => nomadScore(b) - nomadScore(a)).slice(0, 5);
  const best = ranked[0];

  return structuredResponse({
    title: `Best Countries for Digital Nomads`,
    answer: `For your ${budgetLabel(ctx.profile.budgetRange)} budget, **${best.name[locale]}** tops the nomad rankings with cost index ${best.cost_of_living.index}, ${best.visa.ease_of_access} visa access, and safety score ${best.safety.safety_index}/100.`,
    dataTable: ranked.map((c, i) => ({
      label: `#${i + 1} ${c.name[locale]}`,
      value: `Cost: ${c.cost_of_living.index} | Visa: ${c.visa.ease_of_access} | Safety: ${c.safety.safety_index} | $${c.cost_of_living.average_salary}/mo`,
      indicator: i === 0 ? "good" as const : i <= 2 ? "warn" as const : undefined,
    })),
    why: [
      `${best.name[locale]} offers the best balance of affordability, visa accessibility, and safety`,
      `Average salary $${fmt(best.cost_of_living.average_salary)}/mo gives you purchasing power context`,
      `${best.visa.ease_of_access === "easy" ? "Easy visa — some offer specific digital nomad visas" : "Check for digital nomad visa programs"}`,
    ],
    tradeoffs: [
      `Cheapest ≠ best — factor in internet speed, coworking infrastructure, and timezone alignment`,
      `Visa rules change frequently — verify current requirements before committing`,
      `Consider tax residency implications of staying 183+ days`,
    ],
    alternatives: ranked.slice(1, 3).map((c) => ({
      name: c.name[locale],
      reason: `Cost ${c.cost_of_living.index}, ${c.visa.ease_of_access} visa, ${c.safety.safety_index} safety`,
    })),
    nextSteps: [
      `Deep-dive into ${best.name[locale]}'s nomad visa options`,
      `Compare top 3 options side by side`,
      `Ask about tax implications of nomad lifestyle`,
    ],
  });
}

// ===== COST / BUDGET =====
function generateCostResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const sorted = [...ctx.countries].sort((a, b) => a.cost_of_living.index - b.cost_of_living.index);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];

  return structuredResponse({
    title: "Cost of Living Analysis",
    answer: `Your budget: **${budgetLabel(ctx.profile.budgetRange)}**. Best value among your matches: **${cheapest.name[locale]}** (index ${cheapest.cost_of_living.index}).`,
    dataTable: sorted.map((c, i) => ({
      label: c.name[locale],
      value: `Index: ${c.cost_of_living.index} | Salary: $${fmt(c.cost_of_living.average_salary)}/mo | Inflation: ${c.economy.inflation}%`,
      indicator: i === 0 ? "good" as const : i === sorted.length - 1 ? "bad" as const : "warn" as const,
    })),
    why: [
      `${cheapest.name[locale]} has the lowest cost index (${cheapest.cost_of_living.index}) — your budget stretches furthest here`,
      `Average salary of $${fmt(cheapest.cost_of_living.average_salary)}/mo gives local purchasing power context`,
      `Inflation at ${cheapest.economy.inflation}% — ${cheapest.economy.inflation > 5 ? "monitor closely as costs rise" : "stable price environment"}`,
    ],
    tradeoffs: [
      `${priciest.name[locale]} is the most expensive (index ${priciest.cost_of_living.index}) — ${priciest.cost_of_living.index > 80 ? "only viable with high income" : "manageable with planning"}`,
      `Low cost often correlates with lower infrastructure quality — visit before committing`,
      `Exchange rates can shift cost calculations significantly — consider currency stability`,
    ],
    nextSteps: [
      `Compare ${cheapest.name[locale]} vs ${priciest.name[locale]} to understand the trade-off`,
      `Ask about specific city costs within your top pick`,
      `Explore how to maximize your quality of life on your budget`,
    ],
  });
}

// ===== SAFETY =====
function generateSafetyResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const sorted = [...ctx.countries].sort((a, b) => b.safety.safety_index - a.safety.safety_index);
  const safest = sorted[0];

  return structuredResponse({
    title: "Safety & Security Analysis",
    answer: `Safest option: **${safest.name[locale]}** with safety index ${safest.safety.safety_index}/100 and ${safest.government.political_stability} politics.${ctx.profile.familyStatus === "family" ? " **Family safety is prioritized in this analysis.**" : ""}`,
    dataTable: sorted.map((c) => ({
      label: c.name[locale],
      value: `Safety: ${c.safety.safety_index}/100 | Crime: ${c.safety.crime_index} | Stability: ${c.government.political_stability}`,
      indicator: indicator(c.safety.safety_index, 65, 45),
    })),
    why: [
      `${safest.name[locale]} combines high safety (${safest.safety.safety_index}/100) with ${safest.government.political_stability} governance`,
      `Low crime index (${safest.safety.crime_index}/100) means everyday life is secure`,
      `${safest.military.nuclear_weapon ? "Nuclear-armed state — strong deterrent" : "Solid defense capabilities"} with power index ${safest.military.power_index}`,
    ],
    tradeoffs: [
      `Safest countries often have higher costs of living — ${safest.name[locale]} cost index is ${safest.cost_of_living.index}`,
      `Safety metrics are national averages — city-level data can vary significantly`,
    ],
    nextSteps: [
      `Deep-dive into ${safest.name[locale]} for full intelligence`,
      `Compare top 3 safest countries side by side`,
      ctx.profile.familyStatus === "family" ? `Ask about family-friendly cities in ${safest.name[locale]}` : `Ask about expat communities in ${safest.name[locale]}`,
    ],
  });
}

// ===== TAX =====
function generateTaxResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const sorted = [...ctx.countries].sort((a, b) => {
    const order = { low: 0, medium: 1, high: 2 };
    return order[a.tax.level] - order[b.tax.level];
  });

  const lowTax = allCountries.filter((c) => c.tax.level === "low").slice(0, 5);

  return structuredResponse({
    title: "Tax & Fiscal Strategy",
    answer: `For your ${goalLabel(ctx.profile.goal)} goals, focus on **${sorted[0].name[locale]}** (${sorted[0].tax.level} tax — income: ${sorted[0].tax.income_tax}, corporate: ${sorted[0].tax.corporate_tax}).`,
    dataTable: sorted.map((c) => ({
      label: c.name[locale],
      value: `${c.tax.level.toUpperCase()} — Income: ${c.tax.income_tax} | Corp: ${c.tax.corporate_tax}`,
      indicator: c.tax.level === "low" ? "good" as const : c.tax.level === "medium" ? "warn" as const : "bad" as const,
    })),
    why: [
      `${sorted[0].name[locale]} offers the most favorable tax regime among your matches`,
      `${sorted[0].tax.income_tax.includes("0%") ? "0% income tax maximizes your net income" : `Income tax of ${sorted[0].tax.income_tax} — competitive regionally`}`,
      `${sorted[0].government.political_stability === "stable" ? "Stable governance reduces regulatory risk" : "Monitor regulatory changes"}`,
    ],
    tradeoffs: [
      `Low-tax jurisdictions may have fewer public services — factor in private insurance, education costs`,
      `Tax residency rules (183-day rule) apply — plan your physical presence carefully`,
      `Double taxation treaties affect effective rates — check your home country's agreements`,
    ],
    alternatives: lowTax.filter((c) => !sorted.slice(0, 2).find((s) => s.iso_code === c.iso_code)).slice(0, 2).map((c) => ({
      name: c.name[locale],
      reason: `${c.tax.income_tax} income, ${c.tax.corporate_tax} corporate — ${c.visa.ease_of_access} visa`,
    })),
    nextSteps: [
      `Compare tax regimes of your top 3 options`,
      `Ask about specific tax optimization for ${goalLabel(ctx.profile.goal)}`,
      `Explore residency-by-investment programs in low-tax jurisdictions`,
    ],
  });
}

// ===== VISA / RELOCATION =====
function generateVisaResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const sorted = [...ctx.countries].sort((a, b) => {
    const order = { easy: 0, medium: 1, hard: 2 };
    return order[a.visa.ease_of_access] - order[b.visa.ease_of_access];
  });
  const easiest = sorted[0];

  return structuredResponse({
    title: "Visa & Residency Pathways",
    answer: `Easiest pathway: **${easiest.name[locale]}** with ${easiest.visa.ease_of_access} access. Options: ${easiest.visa.residency_options}.`,
    dataTable: sorted.map((c) => ({
      label: c.name[locale],
      value: `${c.visa.ease_of_access.toUpperCase()} — ${c.visa.residency_options.split(",").slice(0, 2).join(",")}`,
      indicator: c.visa.ease_of_access === "easy" ? "good" as const : c.visa.ease_of_access === "medium" ? "warn" as const : "bad" as const,
    })),
    why: [
      `${easiest.name[locale]} offers the fastest path to residency among your matches`,
      `Options include: ${easiest.visa.residency_options}`,
      `${easiest.government.political_stability === "stable" ? "Stable immigration policy" : "Policies may change — apply early"}`,
    ],
    tradeoffs: [
      `Easy visa ≠ easy citizenship — permanent residency timelines vary (typically 5-10 years)`,
      `Some "easy" pathways require financial thresholds (investment visas, proof of income)`,
      `Work permits may be separate from residency permits — verify employment rights`,
    ],
    nextSteps: [
      `Get a step-by-step relocation plan for ${easiest.name[locale]}`,
      `Compare visa difficulty vs. quality of life for top options`,
      `Ask about specific visa requirements for your nationality`,
    ],
  });
}

// ===== RELOCATION PLAN =====
function generateRelocationPlan(c: Country, ctx: AIContext): string {
  const locale = ctx.locale;

  return structuredResponse({
    title: `Relocation Plan: ${c.name[locale]}`,
    answer: `Here's your structured relocation roadmap to **${c.name[locale]}** based on your ${goalLabel(ctx.profile.goal)} goals and ${budgetLabel(ctx.profile.budgetRange)} budget.`,
    dataTable: [
      { label: "Visa", value: `${c.visa.ease_of_access} — ${c.visa.residency_options.split(",")[0]}`, indicator: c.visa.ease_of_access === "easy" ? "good" : c.visa.ease_of_access === "medium" ? "warn" : "bad" },
      { label: "Monthly Cost", value: `Index ${c.cost_of_living.index} | Avg salary: $${fmt(c.cost_of_living.average_salary)}/mo`, indicator: indicator(c.cost_of_living.index, 40, 65, true) },
      { label: "Safety", value: `${c.safety.safety_index}/100`, indicator: indicator(c.safety.safety_index, 65, 45) },
      { label: "Tax", value: `${c.tax.income_tax} income | ${c.tax.corporate_tax} corporate`, indicator: c.tax.level === "low" ? "good" : c.tax.level === "medium" ? "warn" : "bad" },
    ],
    why: [
      `${c.name[locale]} aligns with your priorities`,
      `${c.visa.ease_of_access === "easy" ? "Fast visa processing" : c.visa.ease_of_access === "medium" ? "Moderate visa timeline" : "Plan 6-12 months for visa"} — ${c.visa.residency_options.split(",")[0]}`,
      `${c.government.political_stability === "stable" ? "Stable environment for long-term planning" : "Monitor political situation"}`,
    ],
    nextSteps: [
      `**Month 1-2**: Research visa requirements, gather documents (passport, financials, background check)`,
      `**Month 2-3**: Apply for ${c.visa.residency_options.split(",")[0]} — budget for application fees`,
      `**Month 3-4**: Secure housing remotely, set up banking, arrange health insurance`,
      `**Month 4-5**: Plan the move — shipping, flights, first 30 days essentials`,
      `**Month 5-6**: Arrive, register with local authorities, open bank account, get local SIM`,
      `**Ongoing**: Build local network, optimize tax position, explore the country`,
    ],
    tradeoffs: [
      `Total relocation cost estimate: $${c.cost_of_living.index > 60 ? "8,000-15,000" : c.cost_of_living.index > 35 ? "4,000-8,000" : "2,000-5,000"} (flights, deposits, first month, fees)`,
      `Language barrier: ${c.language.includes("English") ? "Minimal — English widely spoken" : `Learn basic ${c.language.split(",")[0].trim()} before arrival`}`,
      `Healthcare: ${c.cost_of_living.index > 60 ? "Premium healthcare available but expensive without insurance" : "Affordable healthcare — explore local insurance options"}`,
    ],
  });
}

// ===== ECONOMY =====
function generateEconomyResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const sorted = [...ctx.countries].sort((a, b) => b.economy.gdp_per_capita - a.economy.gdp_per_capita);
  const top = sorted[0];

  return structuredResponse({
    title: "Economic Intelligence",
    answer: `Strongest economy among your matches: **${top.name[locale]}** with GDP per capita $${fmt(top.economy.gdp_per_capita)} and ${top.economy.inflation}% inflation.`,
    dataTable: sorted.map((c, i) => ({
      label: `${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "📊"} ${c.name[locale]}`,
      value: `GDP: $${c.economy.gdp}B | Per cap: $${fmt(c.economy.gdp_per_capita)} | Inflation: ${c.economy.inflation}%`,
      indicator: indicator(c.economy.gdp_per_capita, 30000, 15000),
    })),
    why: [
      `${top.name[locale]} leads in per-capita GDP — strong purchasing power and economic development`,
      `Key sectors: ${top.economy.main_exports.slice(0, 3).join(", ")}`,
      `${top.economy.inflation < 4 ? "Low inflation supports stable returns" : "Higher inflation — hedge with hard assets"}`,
    ],
    tradeoffs: [
      `High GDP per capita often means high cost of living — ${top.name[locale]} cost index is ${top.cost_of_living.index}`,
      `Past performance doesn't guarantee growth — check structural trends`,
    ],
    nextSteps: [
      `Deep-dive into ${top.name[locale]}'s investment landscape`,
      `Compare economic fundamentals of top 3 options`,
      `Ask about sector-specific opportunities`,
    ],
  });
}

// ===== MILITARY / GEOPOLITICS =====
function generateMilitaryResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const sorted = [...ctx.countries].sort((a, b) => a.military.power_index - b.military.power_index);

  return structuredResponse({
    title: "Defense & Geopolitical Analysis",
    answer: `Strongest military presence: **${sorted[0].name[locale]}** (power index: ${sorted[0].military.power_index}${sorted[0].military.nuclear_weapon ? ", nuclear-armed" : ""}).`,
    dataTable: sorted.map((c) => ({
      label: `${c.military.nuclear_weapon ? "☢️" : "🛡"} ${c.name[locale]}`,
      value: `Power: ${c.military.power_index} | Stability: ${c.government.political_stability}${c.military.nuclear_weapon ? " | Nuclear" : ""}`,
      indicator: c.government.political_stability === "stable" ? "good" as const : c.government.political_stability === "moderate" ? "warn" as const : "bad" as const,
    })),
    why: [
      `For ${goalLabel(ctx.profile.goal)}, political stability matters more than military strength`,
      `Stable countries: ${ctx.countries.filter((c) => c.government.political_stability === "stable").map((c) => c.name[locale]).join(", ") || "Consider broadening your options"}`,
      `Nuclear states in your matches: ${ctx.countries.filter((c) => c.military.nuclear_weapon).map((c) => c.name[locale]).join(", ") || "None"}`,
    ],
    tradeoffs: [
      `Strong military doesn't equal personal safety — check safety index separately`,
      `Geopolitical tensions can affect visa policies, trade, and currency stability`,
    ],
    nextSteps: [
      `Focus on safety and stability analysis for practical decision-making`,
      `Compare political stability of your top options`,
    ],
  });
}

// ===== CLIMATE =====
function generateClimateResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  return structuredResponse({
    title: "Climate Intelligence",
    answer: `${ctx.profile.climatePreference !== "any" ? `Your preference: **${ctx.profile.climatePreference}** climate.` : "You're open to any climate."} Here's how your matches compare:`,
    dataTable: ctx.countries.map((c) => {
      const desc = c.climate.description.en.toLowerCase();
      const pref = ctx.profile.climatePreference;
      const match = pref === "any" || desc.includes(pref) || (pref === "tropical" && desc.includes("hot"));
      return {
        label: `${match ? "✅" : "⚠️"} ${c.name[locale]}`,
        value: `${c.climate.average_temp} avg | ${c.climate.seasons} | ${c.climate.description[locale].slice(0, 50)}`,
        indicator: match ? "good" as const : "warn" as const,
      };
    }),
    why: ctx.countries.slice(0, 3).map((c) => `${c.name[locale]}: ${c.climate.description[locale]}`),
    nextSteps: [
      `Ask about best cities for your climate preference`,
      `Compare quality of life across climate zones`,
    ],
  });
}

// ===== GOVERNMENT =====
function generateGovernmentResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  return structuredResponse({
    title: "Political Intelligence",
    answer: `Political landscape of your top matches. Stability is critical for ${goalLabel(ctx.profile.goal)} — ${ctx.profile.goal === "business" ? "unstable governments create regulatory risk" : "it affects daily life quality and long-term planning"}.`,
    dataTable: ctx.countries.map((c) => ({
      label: c.name[locale],
      value: `${c.government.type} | ${c.government.current_leader} | ${c.government.political_stability}`,
      indicator: c.government.political_stability === "stable" ? "good" as const : c.government.political_stability === "moderate" ? "warn" as const : "bad" as const,
    })),
    why: [
      `Most stable: ${ctx.countries.filter((c) => c.government.political_stability === "stable").map((c) => c.name[locale]).join(", ") || "None in your current matches"}`,
      `Political stability directly impacts: currency, rule of law, property rights, business environment`,
    ],
    nextSteps: [
      `Focus on countries with stable governance for long-term plans`,
      `Ask about specific regulatory environments for your industry`,
    ],
  });
}

// ---------------------------------------------------------------------------
// Pattern matching registry
// ---------------------------------------------------------------------------

const PATTERNS: ResponsePattern[] = [
  {
    keywords: ["best for me", "best option", "best country for me", "recommend", "which country", "what country", "where should", "which is best", "mejor para", "meilleur pour", "melhor para"],
    generate: (ctx) => generateBestForYou(ctx),
  },
  {
    keywords: ["compare", "vs", "versus", "difference", "better", "comparar", "comparer", "diferencia"],
    generate: (ctx, q) => {
      const pair = findTwoCountries(q, ctx);
      if (!pair) return generateBestForYou(ctx);
      return generateDeepComparison(pair[0], pair[1], ctx);
    },
  },
  {
    keywords: ["step-by-step", "relocation plan", "how to move", "relocate to", "move to", "plan to move", "plan de relocation"],
    generate: (ctx, q) => {
      const country = findCountryInQuestion(q) || ctx.countries[0];
      if (!country) return generateBestForYou(ctx);
      return generateRelocationPlan(country, ctx);
    },
  },
  {
    keywords: ["tell me about", "analyze", "analysis", "overview", "briefing", "deep dive", "detail", "about", "full briefing"],
    generate: (ctx, q) => {
      const country = findCountryInQuestion(q);
      if (country) return generateCountryDeepDive(country, ctx);
      if (ctx.countries[0]) return generateCountryDeepDive(ctx.countries[0], ctx);
      return generateBestForYou(ctx);
    },
  },
  {
    keywords: ["nomad", "remote", "freelance", "digital nomad", "work remotely", "nómada", "nômade"],
    generate: (ctx) => generateNomadResponse(ctx),
  },
  {
    keywords: ["cost", "budget", "expensive", "cheap", "afford", "price", "coût", "costo", "custo", "orçamento", "quality of life"],
    generate: (ctx) => generateCostResponse(ctx),
  },
  {
    keywords: ["safe", "safety", "security", "danger", "crime", "seguridad", "sécurité", "segurança", "family"],
    generate: (ctx) => generateSafetyResponse(ctx),
  },
  {
    keywords: ["tax", "taxes", "fiscal", "corporate", "income tax", "impôt", "impuesto", "imposto", "optimization"],
    generate: (ctx) => generateTaxResponse(ctx),
  },
  {
    keywords: ["visa", "residency", "permit", "move", "relocate", "immigra", "passport", "visado", "résidence", "visto"],
    generate: (ctx) => generateVisaResponse(ctx),
  },
  {
    keywords: ["economy", "gdp", "economic", "invest", "growth", "market", "économie", "economía", "economia", "investment"],
    generate: (ctx) => generateEconomyResponse(ctx),
  },
  {
    keywords: ["military", "defense", "army", "nuclear", "geopolit", "war", "power", "militaire", "militar"],
    generate: (ctx) => generateMilitaryResponse(ctx),
  },
  {
    keywords: ["climate", "weather", "temperature", "hot", "cold", "warm", "climat", "clima", "tempo"],
    generate: (ctx) => generateClimateResponse(ctx),
  },
  {
    keywords: ["government", "politic", "leader", "president", "prime minister", "democracy", "gouvernement", "gobierno", "governo"],
    generate: (ctx) => generateGovernmentResponse(ctx),
  },
  {
    keywords: ["why", "best", "top", "#1", "number one", "pourquoi", "mejor", "melhor", "first"],
    generate: (ctx, q) => {
      const country = findCountryInQuestion(q);
      if (country) return generateCountryDeepDive(country, ctx);
      return generateBestForYou(ctx);
    },
  },
];

// ---------------------------------------------------------------------------
// Locale-aware fallback
// ---------------------------------------------------------------------------

function fallback(ctx: AIContext): string {
  return generateBestForYou(ctx);
}

/**
 * Generate an expert AI response with structured format.
 */
export async function generateResponse(
  question: string,
  ctx: AIContext
): Promise<string> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

  const q = question.toLowerCase();

  // Specific country deep dive
  const specificCountry = findCountryInQuestion(q);
  if (specificCountry && !q.includes("compare") && !q.includes("vs") && (q.includes("about") || q.includes("tell") || q.includes("analyze") || q.includes("detail") || q.includes("briefing"))) {
    return generateCountryDeepDive(specificCountry, ctx);
  }

  // Pattern matching
  for (const pattern of PATTERNS) {
    if (pattern.keywords.some((kw) => q.includes(kw))) {
      return pattern.generate(ctx, question);
    }
  }

  // Default: always give a useful decision
  return fallback(ctx);
}
