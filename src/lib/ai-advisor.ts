import type { Country } from "@/data/countries";
import type { UserProfile, CountryMatch } from "@/types/profile";
import type { Locale } from "@/contexts/I18nContext";
import { getCountryByIso, countries as allCountries } from "@/data/countries";

// ---------------------------------------------------------------------------
// Context builder — assembles everything the AI needs to know
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

export function getSuggestedPrompts(ctx: AIContext): string[] {
  const top = ctx.countries[0];
  const second = ctx.countries[1];

  const prompts: string[] = [];

  if (top && second) {
    prompts.push(`Compare ${top.name[ctx.locale]} vs ${second.name[ctx.locale]}`);
  }

  if (ctx.profile.goal === "business") {
    prompts.push("Best country for low corporate tax and political stability");
  } else if (ctx.profile.goal === "expatriation") {
    prompts.push("Which country has the easiest visa pathway for expats?");
  } else {
    prompts.push("Best country for digital nomads under $3,000/month");
  }

  prompts.push("Which country is safest for families?");

  if (top) {
    prompts.push(`Tell me about ${top.name[ctx.locale]}'s economy in depth`);
  }

  return prompts.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Mock response generator — Geopolitical Intelligence Expert
// ---------------------------------------------------------------------------

interface ResponsePattern {
  keywords: string[];
  generate: (ctx: AIContext, question: string) => string;
}

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

// Find a country by name in the question
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

// Find two countries for comparison
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

function generateDeepComparison(a: Country, b: Country, ctx: AIContext): string {
  const ma = ctx.matches.find((m) => m.iso_code === a.iso_code);
  const mb = ctx.matches.find((m) => m.iso_code === b.iso_code);
  const locale = ctx.locale;

  const fields = [
    { label: "GDP", a: `$${a.economy.gdp}B`, b: `$${b.economy.gdp}B`, higherBetter: true, aVal: a.economy.gdp, bVal: b.economy.gdp },
    { label: "GDP per Capita", a: `$${fmt(a.economy.gdp_per_capita)}`, b: `$${fmt(b.economy.gdp_per_capita)}`, higherBetter: true, aVal: a.economy.gdp_per_capita, bVal: b.economy.gdp_per_capita },
    { label: "Safety", a: `${a.safety.safety_index}/100`, b: `${b.safety.safety_index}/100`, higherBetter: true, aVal: a.safety.safety_index, bVal: b.safety.safety_index },
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

  return `## ${a.name[locale]} vs ${b.name[locale]}

${ma && mb ? `**Match Scores**: ${a.name[locale]} ${ma.score}/100 | ${b.name[locale]} ${mb.score}/100\n` : ""}
${rows.join("\n")}

**Tax**: ${a.name[locale]} — ${a.tax.level} (income ${a.tax.income_tax}, corp ${a.tax.corporate_tax}) vs ${b.name[locale]} — ${b.tax.level} (income ${b.tax.income_tax}, corp ${b.tax.corporate_tax})

**Visa**: ${a.name[locale]} — ${a.visa.ease_of_access} (${a.visa.residency_options.split(",")[0]}) vs ${b.name[locale]} — ${b.visa.ease_of_access} (${b.visa.residency_options.split(",")[0]})

**Political Stability**: ${a.name[locale]} — ${a.government.political_stability} vs ${b.name[locale]} — ${b.government.political_stability}

**Verdict**: ${aWins > bWins ? `**${a.name[locale]}** leads in ${aWins}/${fields.length} metrics` : bWins > aWins ? `**${b.name[locale]}** leads in ${bWins}/${fields.length} metrics` : "Both countries are evenly matched"}. For your ${goalLabel(ctx.profile.goal)} goals with a ${budgetLabel(ctx.profile.budgetRange)} budget, ${aWins > bWins ? a.name[locale] : bWins > aWins ? b.name[locale] : "either"} offers stronger alignment with your priorities.`;
}

function generateCountryDeepDive(c: Country, ctx: AIContext): string {
  const locale = ctx.locale;
  const m = ctx.matches.find((mm) => mm.iso_code === c.iso_code);
  const scoreStr = m ? ` — Match Score: **${m.score}/100**` : "";

  return `## ${c.name[locale]} — Intelligence Briefing${scoreStr}

**🏛 Government**: ${c.government.type}
Leader: ${c.government.current_leader} | Stability: **${c.government.political_stability}**

**💰 Economy**:
• GDP: **$${c.economy.gdp}B** ($${fmt(c.economy.gdp_per_capita)} per capita)
• Currency: ${c.economy.currency} | Inflation: ${c.economy.inflation}%
• Key exports: ${c.economy.main_exports.slice(0, 3).join(", ")}
• Key imports: ${c.economy.main_imports.slice(0, 3).join(", ")}

**🏦 Tax & Business**:
• Income tax: ${c.tax.income_tax}
• Corporate tax: ${c.tax.corporate_tax}
• Tax environment: **${c.tax.level}**

**🛡 Safety & Security**:
• Safety index: **${c.safety.safety_index}/100** | Crime index: ${c.safety.crime_index}/100
• Military power: ${c.military.power_index} ${c.military.nuclear_weapon ? "(Nuclear-armed)" : ""}

**🏠 Cost of Living**:
• Index: **${c.cost_of_living.index}**/100 | Avg salary: $${fmt(c.cost_of_living.average_salary)}/mo

**🌍 Demographics**:
• Population: ${fmt(c.population_data.population)} | Density: ${c.population_data.density}/km²
• Life expectancy: ${c.population_data.life_expectancy} years

**🌤 Climate**: ${c.climate.description[locale]}
Avg temp: ${c.climate.average_temp} | Seasons: ${c.climate.seasons}

**📋 Visa**: ${c.visa.ease_of_access} access — ${c.visa.residency_options}

${ctx.profile.goal === "business" ? `**Business Outlook**: With ${c.tax.corporate_tax} corporate tax and a ${c.government.political_stability} political environment, ${c.name[locale]} offers ${c.tax.level === "low" ? "excellent" : c.tax.level === "medium" ? "moderate" : "challenging"} conditions for business establishment.` :
ctx.profile.goal === "expatriation" ? `**Expat Assessment**: Visa access is **${c.visa.ease_of_access}** with options including ${c.visa.residency_options.split(",")[0]}. Cost of living index ${c.cost_of_living.index} ${c.cost_of_living.index <= 40 ? "makes this highly affordable for expats" : c.cost_of_living.index <= 65 ? "offers moderate affordability" : "is on the higher end"}.` :
`**Overall Assessment**: ${c.name[locale]} ranks ${c.safety.safety_index >= 70 ? "high" : c.safety.safety_index >= 50 ? "moderate" : "lower"} on safety and ${c.cost_of_living.index <= 40 ? "very affordable" : c.cost_of_living.index <= 65 ? "moderately priced" : "expensive"} for cost of living.`}`;
}

const PATTERNS: ResponsePattern[] = [
  // --- Compare specific countries ---
  {
    keywords: ["compare", "vs", "versus", "difference", "better", "comparar", "comparer", "diferencia"],
    generate: (ctx, q) => {
      const pair = findTwoCountries(q, ctx);
      if (!pair) return fallback(ctx);
      return generateDeepComparison(pair[0], pair[1], ctx);
    },
  },

  // --- Deep dive / tell me about / analyze ---
  {
    keywords: ["tell me about", "analyze", "analysis", "overview", "briefing", "deep dive", "detail", "about"],
    generate: (ctx, q) => {
      const country = findCountryInQuestion(q);
      if (country) return generateCountryDeepDive(country, ctx);
      if (ctx.countries[0]) return generateCountryDeepDive(ctx.countries[0], ctx);
      return fallback(ctx);
    },
  },

  // --- Digital nomad / remote work ---
  {
    keywords: ["nomad", "remote", "freelance", "digital nomad", "work remotely", "nómada", "nômade"],
    generate: (ctx) => {
      const candidates = [...ctx.countries].sort((a, b) => {
        const scoreA = (100 - a.cost_of_living.index) + (a.visa.ease_of_access === "easy" ? 30 : a.visa.ease_of_access === "medium" ? 15 : 0) + (a.safety.safety_index > 50 ? 20 : 0);
        const scoreB = (100 - b.cost_of_living.index) + (b.visa.ease_of_access === "easy" ? 30 : b.visa.ease_of_access === "medium" ? 15 : 0) + (b.safety.safety_index > 50 ? 20 : 0);
        return scoreB - scoreA;
      });

      // Also check all countries for best nomad options
      const allNomad = [...allCountries]
        .filter((c) => c.cost_of_living.index <= 50 && c.visa.ease_of_access !== "hard")
        .sort((a, b) => a.cost_of_living.index - b.cost_of_living.index)
        .slice(0, 5);

      return `## Best Countries for Digital Nomads

**From your matches** (ranked by nomad suitability):
${candidates.slice(0, 3).map((c, i) => `${i + 1}. **${c.name[ctx.locale]}** — Cost index: ${c.cost_of_living.index}, Visa: ${c.visa.ease_of_access}, Safety: ${c.safety.safety_index}/100, Avg salary: $${c.cost_of_living.average_salary}/mo`).join("\n")}

**Top nomad-friendly countries globally** (affordable + easy visa):
${allNomad.map((c) => `• **${c.name[ctx.locale]}** — Cost index ${c.cost_of_living.index}, ${c.visa.ease_of_access} visa, $${c.cost_of_living.average_salary}/mo avg salary`).join("\n")}

💡 With your ${budgetLabel(ctx.profile.budgetRange)} budget, you'd have ${ctx.profile.budgetRange === "4000_plus" ? "excellent" : ctx.profile.budgetRange === "2000_4000" ? "very comfortable" : "reasonable"} purchasing power in the top options. Look for countries offering specific **digital nomad visas** (Portugal D7, Thailand DTV, Colombia Digital Nomad).`;
    },
  },

  // --- Cost / budget / affordable ---
  {
    keywords: ["cost", "budget", "expensive", "cheap", "afford", "price", "coût", "costo", "custo", "orçamento"],
    generate: (ctx) => {
      const sorted = [...ctx.countries].sort((a, b) => a.cost_of_living.index - b.cost_of_living.index);
      const cheapest = sorted[0];
      const priciest = sorted[sorted.length - 1];

      return `## Cost of Living Analysis

**Your budget**: ${budgetLabel(ctx.profile.budgetRange)}

**Ranked by affordability**:
${sorted.map((c, i) => {
  const emoji = i === 0 ? "🟢" : i === sorted.length - 1 ? "🔴" : "🟡";
  return `${emoji} **${c.name[ctx.locale]}** — Index: ${c.cost_of_living.index}/100, Avg salary: $${fmt(c.cost_of_living.average_salary)}/mo, Inflation: ${c.economy.inflation}%`;
}).join("\n")}

**Best value**: ${cheapest.name[ctx.locale]} (index ${cheapest.cost_of_living.index}). Your budget would cover ${cheapest.cost_of_living.average_salary > 0 ? `${((Number(ctx.profile.budgetRange === "4000_plus" ? 5000 : ctx.profile.budgetRange === "2000_4000" ? 3000 : ctx.profile.budgetRange === "1000_2000" ? 1500 : 800) / cheapest.cost_of_living.average_salary) * 100).toFixed(0)}% of the local average salary` : "a comfortable lifestyle"}.

**Most expensive**: ${priciest.name[ctx.locale]} (index ${priciest.cost_of_living.index}). ${priciest.cost_of_living.index > 80 ? "This is one of the world's most expensive locations." : "Still manageable with proper budgeting."}

💡 For your ${goalLabel(ctx.profile.goal)} goals, focus on countries with cost index below ${ctx.profile.budgetRange === "4000_plus" ? "75" : ctx.profile.budgetRange === "2000_4000" ? "50" : "35"}.`;
    },
  },

  // --- Safety / security / crime ---
  {
    keywords: ["safe", "safety", "security", "danger", "crime", "seguridad", "sécurité", "segurança"],
    generate: (ctx) => {
      const sorted = [...ctx.countries].sort((a, b) => b.safety.safety_index - a.safety.safety_index);

      return `## Safety & Security Analysis

**Ranked by safety** (higher = safer):
${sorted.map((c, i) => {
  const emoji = c.safety.safety_index >= 70 ? "🟢" : c.safety.safety_index >= 50 ? "🟡" : "🔴";
  return `${emoji} **${c.name[ctx.locale]}** — Safety: ${c.safety.safety_index}/100 | Crime: ${c.safety.crime_index}/100 | Stability: ${c.government.political_stability}`;
}).join("\n")}

${ctx.profile.familyStatus === "family" ? "⚠️ **Family consideration**: For families with children, I strongly recommend countries with safety index above 65 and stable political environments." : ""}

${ctx.profile.safetyImportance >= 4 ? `Since safety is a **top priority** for you (${ctx.profile.safetyImportance}/5), **${sorted[0].name[ctx.locale]}** is your clear best option at ${sorted[0].safety.safety_index}/100.` : ""}

**Global context**: ${sorted[0].name[ctx.locale]} ${sorted[0].military.nuclear_weapon ? "is a nuclear-armed state with" : "has"} a military power index of ${sorted[0].military.power_index}, indicating ${sorted[0].military.power_index < 0.2 ? "a top-tier global military" : sorted[0].military.power_index < 0.5 ? "a strong regional defense" : "a more limited military"}.`;
    },
  },

  // --- Tax / fiscal / corporate ---
  {
    keywords: ["tax", "taxes", "fiscal", "corporate", "income tax", "impôt", "impuesto", "imposto"],
    generate: (ctx) => {
      const sorted = [...ctx.countries].sort((a, b) => {
        const order = { low: 0, medium: 1, high: 2 };
        return order[a.tax.level] - order[b.tax.level];
      });

      return `## Tax & Fiscal Intelligence

**Ranked by tax favorability**:
${sorted.map((c) => {
  const emoji = c.tax.level === "low" ? "🟢" : c.tax.level === "medium" ? "🟡" : "🔴";
  return `${emoji} **${c.name[ctx.locale]}** — ${c.tax.level.toUpperCase()}
  Income tax: ${c.tax.income_tax} | Corporate: ${c.tax.corporate_tax}`;
}).join("\n")}

${ctx.profile.goal === "business" ? `**Business optimization**: For ${goalLabel(ctx.profile.goal)}, focus on low corporate tax jurisdictions. ${sorted[0].name[ctx.locale]} offers ${sorted[0].tax.corporate_tax} corporate tax in a ${sorted[0].government.political_stability} environment.` : ""}

**Key insight**: ${sorted.filter((c) => c.tax.level === "low").length > 0
  ? `${sorted.filter((c) => c.tax.level === "low").map((c) => c.name[ctx.locale]).join(" and ")} offer${sorted.filter((c) => c.tax.level === "low").length === 1 ? "s" : ""} the most favorable tax regime. ${sorted[0].tax.income_tax.includes("0%") ? "With 0% income tax, your net income would be maximized." : ""}`
  : "None of your matches have a low-tax environment. Consider exploring UAE (0% income tax) or Singapore (0-22% with territorial system)."}

${ctx.profile.taxImportance >= 4 ? `⚠️ Tax is a **top priority** for you (${ctx.profile.taxImportance}/5). This should be a key factor in your decision.` : ""}`;
    },
  },

  // --- Visa / residency / immigration ---
  {
    keywords: ["visa", "residency", "permit", "move", "relocate", "immigra", "passport", "visado", "résidence", "visto"],
    generate: (ctx) => {
      const sorted = [...ctx.countries].sort((a, b) => {
        const order = { easy: 0, medium: 1, hard: 2 };
        return order[a.visa.ease_of_access] - order[b.visa.ease_of_access];
      });

      return `## Visa & Residency Pathways

${sorted.map((c) => {
  const emoji = c.visa.ease_of_access === "easy" ? "🟢" : c.visa.ease_of_access === "medium" ? "🟡" : "🔴";
  return `${emoji} **${c.name[ctx.locale]}** — ${c.visa.ease_of_access.toUpperCase()} access
  Options: ${c.visa.residency_options}`;
}).join("\n\n")}

${ctx.profile.goal === "business" ? `**Business visa tip**: Even countries with 'medium' difficulty often have fast-track entrepreneur/investor visas. ${sorted.find((c) => c.visa.residency_options.toLowerCase().includes("invest"))?.name[ctx.locale] || sorted[0].name[ctx.locale]} has specific investor pathways.` : ""}

${ctx.profile.goal === "expatriation" ? `**Expat recommendation**: ${sorted[0].name[ctx.locale]} has the easiest visa pathway. For long-term residence, explore their ${sorted[0].visa.residency_options.split(",")[0]} option.` : ""}

**Pro tip**: Countries with "easy" visa access often also allow visa-free stays of 30–90 days, letting you test-live before committing to residency.`;
    },
  },

  // --- Why #1 / best / top / recommend ---
  {
    keywords: ["why", "best", "top", "recommend", "first", "#1", "number one", "pourquoi", "mejor", "melhor"],
    generate: (ctx) => {
      const top = ctx.countries[0];
      const m = ctx.matches[0];
      if (!top || !m) return fallback(ctx);
      const positives = m.insights.filter((i) => i.type === "positive");
      return `## Why ${top.name[ctx.locale]} Is Your #1 Match

**Score: ${m.score}/100** for ${goalLabel(ctx.profile.goal)}

**Key strengths**:
${positives.length > 0 ? positives.map((p) => `✅ ${p.text}`).join("\n") : `✅ Strong alignment with your profile priorities`}

**Data snapshot**:
| Metric | Value |
|--------|-------|
| GDP | $${top.economy.gdp}B ($${fmt(top.economy.gdp_per_capita)} per capita) |
| Safety | ${top.safety.safety_index}/100 |
| Tax | ${top.tax.level} (income: ${top.tax.income_tax}) |
| Visa | ${top.visa.ease_of_access} |
| Cost | Index ${top.cost_of_living.index} |
| Salary | $${fmt(top.cost_of_living.average_salary)}/mo |
| Stability | ${top.government.political_stability} |

${m.summary || `${top.name[ctx.locale]} offers a compelling combination of ${top.tax.level === "low" ? "low taxes" : "economic opportunity"}, ${top.safety.safety_index >= 60 ? "strong safety" : "growing infrastructure"}, and ${top.visa.ease_of_access === "easy" ? "easy visa access" : "accessible pathways"} for your goals.`}

${ctx.countries[1] ? `**Edge over #2** (${ctx.countries[1].name[ctx.locale]}): ${m.edgeOverNext || `Scores ${m.score - (ctx.matches[1]?.score || 0)} points higher overall`}` : ""}`;
    },
  },

  // --- Climate / weather ---
  {
    keywords: ["climate", "weather", "temperature", "hot", "cold", "warm", "climat", "clima", "tempo"],
    generate: (ctx) => {
      return `## Climate Intelligence

${ctx.countries.map((c) => `**${c.name[ctx.locale]}**: ${c.climate.description[ctx.locale]}
  Avg temperature: ${c.climate.average_temp} | Seasons: ${c.climate.seasons}`).join("\n\n")}

${ctx.profile.climatePreference !== "any" ? `Based on your preference for **${ctx.profile.climatePreference}** climates:
${ctx.countries.map((c) => {
  const desc = c.climate.description.en.toLowerCase();
  const pref = ctx.profile.climatePreference;
  const match = desc.includes(pref) || (pref === "tropical" && desc.includes("hot")) || (pref === "arid" && desc.includes("desert"));
  return `${match ? "✅" : "⚠️"} ${c.name[ctx.locale]} — ${match ? "Good match" : "May require adjustment"}`;
}).join("\n")}` : "You have no strong climate preference, so all options remain viable."}`;
    },
  },

  // --- Economy / GDP / investment ---
  {
    keywords: ["economy", "gdp", "economic", "invest", "growth", "market", "économie", "economía", "economia"],
    generate: (ctx) => {
      const sorted = [...ctx.countries].sort((a, b) => b.economy.gdp_per_capita - a.economy.gdp_per_capita);

      return `## Economic Intelligence

**Ranked by GDP per capita**:
${sorted.map((c, i) => {
  const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "📊";
  return `${emoji} **${c.name[ctx.locale]}**
  GDP: $${c.economy.gdp}B | Per capita: $${fmt(c.economy.gdp_per_capita)} | Inflation: ${c.economy.inflation}%
  Key exports: ${c.economy.main_exports.slice(0, 3).join(", ")}
  Stability: ${c.government.political_stability}`;
}).join("\n\n")}

${ctx.profile.goal === "investment" ? `**Investment outlook**: ${sorted[0].name[ctx.locale]} offers the highest per-capita GDP at $${fmt(sorted[0].economy.gdp_per_capita)}, with ${sorted[0].economy.inflation}% inflation and ${sorted[0].government.political_stability} politics. ${sorted[0].economy.inflation > 5 ? "⚠️ High inflation may erode returns." : "Low inflation supports stable returns."}` : ""}

${ctx.profile.goal === "business" ? `**Business environment**: Consider countries with low corporate tax (${ctx.countries.filter((c) => c.tax.level === "low").map((c) => c.name[ctx.locale]).join(", ") || "UAE, Singapore"}) and stable governance for optimal business conditions.` : ""}`;
    },
  },

  // --- Military / defense / geopolitics ---
  {
    keywords: ["military", "defense", "army", "nuclear", "geopolit", "war", "power", "militaire", "militar"],
    generate: (ctx) => {
      const sorted = [...ctx.countries].sort((a, b) => a.military.power_index - b.military.power_index);

      return `## Defense & Geopolitical Analysis

**Military power ranking** (lower index = stronger):
${sorted.map((c) => {
  return `${c.military.nuclear_weapon ? "☢️" : "🛡"} **${c.name[ctx.locale]}** — Power index: ${c.military.power_index} ${c.military.nuclear_weapon ? "(Nuclear-armed)" : ""} | Stability: ${c.government.political_stability}`;
}).join("\n")}

**Nuclear states in your matches**: ${ctx.countries.filter((c) => c.military.nuclear_weapon).map((c) => c.name[ctx.locale]).join(", ") || "None"}

**Geopolitical assessment**: ${sorted[0].name[ctx.locale]} has the strongest military (${sorted[0].military.power_index}) among your matches. For ${goalLabel(ctx.profile.goal)}, political stability matters more than military power — focus on countries rated **stable**: ${ctx.countries.filter((c) => c.government.political_stability === "stable").map((c) => c.name[ctx.locale]).join(", ") || "Consider rebalancing your matches"}.`;
    },
  },

  // --- Government / politics / leader ---
  {
    keywords: ["government", "politic", "leader", "president", "prime minister", "democracy", "gouvernement", "gobierno", "governo"],
    generate: (ctx) => {
      return `## Political Intelligence

${ctx.countries.map((c) => `**${c.name[ctx.locale]}**
  System: ${c.government.type}
  Leader: ${c.government.current_leader}
  Stability: ${c.government.political_stability === "stable" ? "🟢 Stable" : c.government.political_stability === "moderate" ? "🟡 Moderate" : "🔴 Unstable"}`).join("\n\n")}

**Most stable for ${goalLabel(ctx.profile.goal)}**: ${ctx.countries.filter((c) => c.government.political_stability === "stable").map((c) => c.name[ctx.locale]).join(", ") || "Consider countries with stronger governance structures."}

**Note**: Political stability directly impacts business environment, currency stability, and long-term planning security.`;
    },
  },
];

function fallback(ctx: AIContext): string {
  const top = ctx.countries[0];
  const m = ctx.matches[0];
  if (!top || !m) return "I'm Atlas AI — your geopolitical intelligence advisor. Ask me to analyze any country, compare destinations, or get tailored strategies for relocation, business, or investment. Try asking:\n\n• \"Compare UAE vs Portugal\"\n• \"Best country for digital nomads\"\n• \"Analyze Japan's economy\"\n• \"Which country is safest?\"";

  return `## Your Intelligence Summary

**Profile**: ${goalLabel(ctx.profile.goal)} | Budget: ${budgetLabel(ctx.profile.budgetRange)} | Family: ${ctx.profile.familyStatus}

**Top match**: **${top.name[ctx.locale]}** (${m.score}/100)
${m.insights.filter((i) => i.type === "positive").slice(0, 3).map((p) => `✅ ${p.text}`).join("\n")}

**Quick stats**: GDP $${top.economy.gdp}B | Safety ${top.safety.safety_index}/100 | Tax: ${top.tax.level} | Cost: ${top.cost_of_living.index}

Ask me to deep-dive into any country, compare options, or analyze specific factors like taxes, visas, safety, economy, or geopolitics.`;
}

/**
 * Generate a mock AI response based on the user's question and context.
 */
export async function generateResponse(
  question: string,
  ctx: AIContext
): Promise<string> {
  // Simulate network delay for realism
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

  const q = question.toLowerCase();

  // Check if asking about a specific country (deep dive)
  const specificCountry = findCountryInQuestion(q);
  if (specificCountry && !q.includes("compare") && !q.includes("vs") && (q.includes("about") || q.includes("tell") || q.includes("analyze") || q.includes("detail"))) {
    return generateCountryDeepDive(specificCountry, ctx);
  }

  // Find the best matching pattern
  for (const pattern of PATTERNS) {
    if (pattern.keywords.some((kw) => q.includes(kw))) {
      return pattern.generate(ctx, question);
    }
  }

  // No pattern matched — use fallback
  return fallback(ctx);
}
