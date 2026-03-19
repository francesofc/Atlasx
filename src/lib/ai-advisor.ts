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
  activeModule?: string;
}

export function buildAIContext(
  profile: UserProfile,
  matches: CountryMatch[],
  locale: Locale,
  activeModule?: string
): AIContext {
  const countries = matches
    .map((m) => getCountryByIso(m.iso_code))
    .filter((c): c is Country => c !== undefined);
  return { profile, matches, countries, locale, activeModule };
}

// ---------------------------------------------------------------------------
// Module lens — shapes every response through the active analysis module
// ---------------------------------------------------------------------------

interface ModuleLens {
  prefix: string;
  emphasis: string[];
  frameQuestion: (q: string) => string;
}

function getModuleLens(activeModule: string | undefined, locale: Locale): ModuleLens | null {
  if (!activeModule) return null;

  const lenses: Record<string, Record<Locale, ModuleLens>> = {
    tax: {
      en: {
        prefix: "Through the tax optimization lens",
        emphasis: ["income tax", "corporate tax", "tax level", "fiscal regime", "tax residency"],
        frameQuestion: (q) => `Fiscal analysis: ${q}`,
      },
      fr: {
        prefix: "Sous l'angle de l'optimisation fiscale",
        emphasis: ["impôt sur le revenu", "impôt sur les sociétés", "régime fiscal", "résidence fiscale"],
        frameQuestion: (q) => `Analyse fiscale : ${q}`,
      },
      es: {
        prefix: "Desde el enfoque de optimización fiscal",
        emphasis: ["impuesto sobre la renta", "impuesto corporativo", "régimen fiscal", "residencia fiscal"],
        frameQuestion: (q) => `Análisis fiscal: ${q}`,
      },
      pt: {
        prefix: "Pela lente da otimização fiscal",
        emphasis: ["imposto de renda", "imposto corporativo", "regime fiscal", "residência fiscal"],
        frameQuestion: (q) => `Análise fiscal: ${q}`,
      },
    },
    safety: {
      en: {
        prefix: "From a security and stability perspective",
        emphasis: ["safety index", "crime index", "political stability", "military posture", "rule of law"],
        frameQuestion: (q) => `Security assessment: ${q}`,
      },
      fr: {
        prefix: "Du point de vue sécurité et stabilité",
        emphasis: ["indice de sécurité", "indice de criminalité", "stabilité politique"],
        frameQuestion: (q) => `Évaluation sécuritaire : ${q}`,
      },
      es: {
        prefix: "Desde la perspectiva de seguridad y estabilidad",
        emphasis: ["índice de seguridad", "índice de criminalidad", "estabilidad política"],
        frameQuestion: (q) => `Evaluación de seguridad: ${q}`,
      },
      pt: {
        prefix: "Da perspectiva de segurança e estabilidade",
        emphasis: ["índice de segurança", "índice de criminalidade", "estabilidade política"],
        frameQuestion: (q) => `Avaliação de segurança: ${q}`,
      },
    },
    investment: {
      en: {
        prefix: "For capital deployment and returns",
        emphasis: ["GDP growth", "inflation", "market access", "ROI", "economic fundamentals"],
        frameQuestion: (q) => `Investment analysis: ${q}`,
      },
      fr: {
        prefix: "Pour le déploiement de capital et les rendements",
        emphasis: ["croissance du PIB", "inflation", "accès au marché", "rendement"],
        frameQuestion: (q) => `Analyse d'investissement : ${q}`,
      },
      es: {
        prefix: "Para el despliegue de capital y rendimientos",
        emphasis: ["crecimiento del PIB", "inflación", "acceso al mercado", "rendimiento"],
        frameQuestion: (q) => `Análisis de inversión: ${q}`,
      },
      pt: {
        prefix: "Para implantação de capital e retornos",
        emphasis: ["crescimento do PIB", "inflação", "acesso ao mercado", "retorno"],
        frameQuestion: (q) => `Análise de investimento: ${q}`,
      },
    },
    war_risk: {
      en: {
        prefix: "Geopolitical risk assessment",
        emphasis: ["military power", "nuclear capability", "political stability", "regional tensions", "defense alliances"],
        frameQuestion: (q) => `Threat assessment: ${q}`,
      },
      fr: {
        prefix: "Évaluation des risques géopolitiques",
        emphasis: ["puissance militaire", "capacité nucléaire", "stabilité politique", "tensions régionales"],
        frameQuestion: (q) => `Évaluation des menaces : ${q}`,
      },
      es: {
        prefix: "Evaluación de riesgo geopolítico",
        emphasis: ["poder militar", "capacidad nuclear", "estabilidad política", "tensiones regionales"],
        frameQuestion: (q) => `Evaluación de amenazas: ${q}`,
      },
      pt: {
        prefix: "Avaliação de risco geopolítico",
        emphasis: ["poder militar", "capacidade nuclear", "estabilidade política", "tensões regionais"],
        frameQuestion: (q) => `Avaliação de ameaças: ${q}`,
      },
    },
    business: {
      en: {
        prefix: "For business environment and corporate strategy",
        emphasis: ["corporate tax", "ease of doing business", "market size", "governance quality", "regulatory stability"],
        frameQuestion: (q) => `Business environment analysis: ${q}`,
      },
      fr: {
        prefix: "Pour l'environnement des affaires et la stratégie d'entreprise",
        emphasis: ["impôt sur les sociétés", "facilité de faire des affaires", "taille du marché"],
        frameQuestion: (q) => `Analyse de l'environnement d'affaires : ${q}`,
      },
      es: {
        prefix: "Para el entorno empresarial y estrategia corporativa",
        emphasis: ["impuesto corporativo", "facilidad de negocios", "tamaño del mercado"],
        frameQuestion: (q) => `Análisis del entorno empresarial: ${q}`,
      },
      pt: {
        prefix: "Para o ambiente de negócios e estratégia corporativa",
        emphasis: ["imposto corporativo", "facilidade de negócios", "tamanho do mercado"],
        frameQuestion: (q) => `Análise do ambiente de negócios: ${q}`,
      },
    },
    cost_of_living: {
      en: {
        prefix: "For affordability and purchasing power",
        emphasis: ["cost index", "average salary", "inflation", "purchasing power parity", "budget optimization"],
        frameQuestion: (q) => `Cost-of-living analysis: ${q}`,
      },
      fr: {
        prefix: "Pour l'accessibilité et le pouvoir d'achat",
        emphasis: ["indice de coût", "salaire moyen", "inflation", "pouvoir d'achat"],
        frameQuestion: (q) => `Analyse du coût de la vie : ${q}`,
      },
      es: {
        prefix: "Para la asequibilidad y el poder adquisitivo",
        emphasis: ["índice de costo", "salario promedio", "inflación", "poder adquisitivo"],
        frameQuestion: (q) => `Análisis del costo de vida: ${q}`,
      },
      pt: {
        prefix: "Para acessibilidade e poder de compra",
        emphasis: ["índice de custo", "salário médio", "inflação", "poder de compra"],
        frameQuestion: (q) => `Análise do custo de vida: ${q}`,
      },
    },
    visa: {
      en: {
        prefix: "For residency pathways and immigration access",
        emphasis: ["visa ease", "residency options", "processing time", "nationality advantages", "permit types"],
        frameQuestion: (q) => `Immigration pathway analysis: ${q}`,
      },
      fr: {
        prefix: "Pour les voies de résidence et l'accès à l'immigration",
        emphasis: ["facilité de visa", "options de résidence", "délais de traitement"],
        frameQuestion: (q) => `Analyse des voies d'immigration : ${q}`,
      },
      es: {
        prefix: "Para las vías de residencia y acceso migratorio",
        emphasis: ["facilidad de visa", "opciones de residencia", "tiempo de procesamiento"],
        frameQuestion: (q) => `Análisis de vías migratorias: ${q}`,
      },
      pt: {
        prefix: "Para caminhos de residência e acesso migratório",
        emphasis: ["facilidade de visto", "opções de residência", "tempo de processamento"],
        frameQuestion: (q) => `Análise de vias migratórias: ${q}`,
      },
    },
    quality_of_life: {
      en: {
        prefix: "For livability, healthcare, and lifestyle quality",
        emphasis: ["life expectancy", "safety", "healthcare", "climate", "cost-to-quality ratio"],
        frameQuestion: (q) => `Livability assessment: ${q}`,
      },
      fr: {
        prefix: "Pour la qualité de vie, la santé et le cadre de vie",
        emphasis: ["espérance de vie", "sécurité", "santé", "climat"],
        frameQuestion: (q) => `Évaluation de la qualité de vie : ${q}`,
      },
      es: {
        prefix: "Para la calidad de vida, salud y estilo de vida",
        emphasis: ["esperanza de vida", "seguridad", "salud", "clima"],
        frameQuestion: (q) => `Evaluación de calidad de vida: ${q}`,
      },
      pt: {
        prefix: "Para qualidade de vida, saúde e estilo de vida",
        emphasis: ["expectativa de vida", "segurança", "saúde", "clima"],
        frameQuestion: (q) => `Avaliação de qualidade de vida: ${q}`,
      },
    },
  };

  const moduleLens = lenses[activeModule];
  if (!moduleLens) return null;
  return moduleLens[locale] || moduleLens.en;
}

// ---------------------------------------------------------------------------
// Profile context — generates personalized framing sentences
// ---------------------------------------------------------------------------

function profileContext(profile: UserProfile, locale: Locale): string {
  const parts: string[] = [];

  // Nationality context
  if (profile.nationality) {
    const natPhrases: Record<Locale, (n: string) => string> = {
      en: (n) => `Given your ${n} background`,
      fr: (n) => `Compte tenu de votre profil ${n}`,
      es: (n) => `Dado su perfil ${n}`,
      pt: (n) => `Dado seu perfil ${n}`,
    };
    parts.push(natPhrases[locale](profile.nationality));
  }

  // Tax sensitivity
  if (profile.taxImportance >= 4) {
    const taxPhrases: Record<Locale, string> = {
      en: "strong tax sensitivity",
      fr: "forte sensibilité fiscale",
      es: "alta sensibilidad fiscal",
      pt: "alta sensibilidade fiscal",
    };
    parts.push(taxPhrases[locale]);
  }

  // Budget
  const budgetStr = budgetLabel(profile.budgetRange);
  if (budgetStr) {
    const budgetPhrases: Record<Locale, (b: string) => string> = {
      en: (b) => `a ${b} budget`,
      fr: (b) => `un budget de ${b}`,
      es: (b) => `un presupuesto de ${b}`,
      pt: (b) => `um orçamento de ${b}`,
    };
    parts.push(budgetPhrases[locale](budgetStr));
  }

  // Family status
  if (profile.familyStatus === "family") {
    const famPhrases: Record<Locale, string> = {
      en: "relocating as a family",
      fr: "une relocation en famille",
      es: "reubicación familiar",
      pt: "mudança em família",
    };
    parts.push(famPhrases[locale]);
  } else if (profile.familyStatus === "couple") {
    const couplePhrases: Record<Locale, string> = {
      en: "relocating as a couple",
      fr: "une relocation en couple",
      es: "reubicación en pareja",
      pt: "mudança em casal",
    };
    parts.push(couplePhrases[locale]);
  }

  // Business sector
  if (profile.businessSector) {
    const sectorPhrases: Record<Locale, (s: string) => string> = {
      en: (s) => `operating in the ${s} sector`,
      fr: (s) => `actif dans le secteur ${s}`,
      es: (s) => `operando en el sector ${s}`,
      pt: (s) => `atuando no setor ${s}`,
    };
    parts.push(sectorPhrases[locale](profile.businessSector));
  }

  if (parts.length === 0) return "";

  // Build one or two sentences from parts
  if (parts.length <= 2) {
    return parts.join(locale === "en" ? " and " : locale === "fr" ? " et " : locale === "es" ? " y " : " e ") + (locale === "en" ? ", here's my assessment." : locale === "fr" ? ", voici mon analyse." : locale === "es" ? ", aquí está mi análisis." : ", aqui está minha análise.");
  }

  const connector = locale === "en" ? ", " : locale === "fr" ? ", " : locale === "es" ? ", " : ", ";
  const lastConnector = locale === "en" ? ", and " : locale === "fr" ? " et " : locale === "es" ? " y " : " e ";
  return parts.slice(0, -1).join(connector) + lastConnector + parts[parts.length - 1] + (locale === "en" ? " — here's my assessment." : locale === "fr" ? " — voici mon analyse." : locale === "es" ? " — aquí está mi análisis." : " — aqui está minha análise.");
}

// ---------------------------------------------------------------------------
// Section headers — multilingual
// ---------------------------------------------------------------------------

const sectionHeaders: Record<string, Record<string, string>> = {
  keyData: { en: "Key Data", fr: "Données clés", es: "Datos clave", pt: "Dados principais" },
  why: { en: "Why", fr: "Pourquoi", es: "Por qué", pt: "Por quê" },
  tradeoffs: { en: "Trade-offs", fr: "Compromis", es: "Compromisos", pt: "Compensações" },
  alternatives: { en: "Alternatives", fr: "Alternatives", es: "Alternativas", pt: "Alternativas" },
  nextSteps: { en: "Next Steps", fr: "Prochaines étapes", es: "Próximos pasos", pt: "Próximos passos" },
  executiveSummary: { en: "Executive Summary", fr: "Synthèse", es: "Resumen ejecutivo", pt: "Resumo executivo" },
  fiscalProfile: { en: "Fiscal Profile", fr: "Profil fiscal", es: "Perfil fiscal", pt: "Perfil fiscal" },
  security: { en: "Security & Stability", fr: "Sécurité et stabilité", es: "Seguridad y estabilidad", pt: "Segurança e estabilidade" },
  businessInvestment: { en: "Business & Investment", fr: "Business et investissement", es: "Negocios e inversión", pt: "Negócios e investimento" },
  residencyAccess: { en: "Residency & Access", fr: "Résidence et accès", es: "Residencia y acceso", pt: "Residência e acesso" },
  costLifestyle: { en: "Cost & Lifestyle", fr: "Coût et style de vie", es: "Costo y estilo de vida", pt: "Custo e estilo de vida" },
  strategicNote: { en: "Strategic Note", fr: "Note stratégique", es: "Nota estratégica", pt: "Nota estratégica" },
  bestFit: { en: "Best Fit", fr: "Profil idéal", es: "Perfil ideal", pt: "Perfil ideal" },
  verdict: { en: "Verdict", fr: "Verdict", es: "Veredicto", pt: "Veredicto" },
  whereLeads: { en: "Where {name} leads", fr: "Où {name} excelle", es: "Donde {name} destaca", pt: "Onde {name} se destaca" },
  theTradeoff: { en: "The Trade-off", fr: "Le compromis", es: "La compensación", pt: "A compensação" },
  nextMove: { en: "Next Move", fr: "Prochaine étape", es: "Próximo paso", pt: "Próximo paso" },
  bestForProfiles: { en: "Best For", fr: "Idéal pour", es: "Ideal para", pt: "Ideal para" },
};

function sH(key: string, locale: string, vars?: Record<string, string>): string {
  let text = sectionHeaders[key]?.[locale] || sectionHeaders[key]?.en || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

// ---------------------------------------------------------------------------
// Suggested prompts — strategic, module-aware
// ---------------------------------------------------------------------------

const promptTemplates: Record<string, Record<string, string>> = {
  bestForYou: {
    en: "Which country is my strongest strategic match — and why?",
    fr: "Quel pays est mon meilleur choix stratégique — et pourquoi ?",
    es: "¿Cuál es mi mejor opción estratégica — y por qué?",
    pt: "Qual país é minha melhor opção estratégica — e por quê?",
  },
  compare: {
    en: "Head-to-head: {a} vs {b} — which wins for my profile?",
    fr: "Face à face : {a} vs {b} — lequel gagne pour mon profil ?",
    es: "Cara a cara: {a} vs {b} — ¿cuál gana para mi perfil?",
    pt: "Frente a frente: {a} vs {b} — qual vence para meu perfil?",
  },
  deepDive: {
    en: "Full intelligence briefing on {country}",
    fr: "Briefing complet sur {country}",
    es: "Informe de inteligencia sobre {country}",
    pt: "Briefing completo sobre {country}",
  },
  taxStrategy: {
    en: "Tax-optimal jurisdictions for my income structure",
    fr: "Juridictions optimales fiscalement pour ma structure de revenus",
    es: "Jurisdicciones fiscalmente óptimas para mi estructura de ingresos",
    pt: "Jurisdições fiscais ideais para minha estrutura de renda",
  },
  relocate: {
    en: "Step-by-step relocation plan to {country}",
    fr: "Plan de relocation étape par étape vers {country}",
    es: "Plan de reubicación paso a paso a {country}",
    pt: "Plano de mudança passo a passo para {country}",
  },
  nomadBest: {
    en: "Best jurisdiction for digital nomads balancing cost, visa, and lifestyle",
    fr: "Meilleure juridiction pour nomades numériques — coût, visa et cadre de vie",
    es: "Mejor jurisdicción para nómadas digitales — costo, visa y estilo de vida",
    pt: "Melhor jurisdição para nômades digitais — custo, visto e estilo de vida",
  },
  businessSetup: {
    en: "Best jurisdiction for incorporating with low corporate tax and stable governance",
    fr: "Meilleure juridiction pour créer une société avec faible impôt et gouvernance stable",
    es: "Mejor jurisdicción para constituir empresa con bajo impuesto y gobernanza estable",
    pt: "Melhor jurisdição para constituir empresa com baixo imposto e governança estável",
  },
  investmentOutlook: {
    en: "Where should I deploy capital for maximum risk-adjusted returns?",
    fr: "Où déployer mon capital pour un rendement ajusté au risque maximal ?",
    es: "¿Dónde desplegar capital para máximo rendimiento ajustado al riesgo?",
    pt: "Onde implantar capital para máximo retorno ajustado ao risco?",
  },
  safeFamily: {
    en: "Security risk assessment for my top-ranked countries",
    fr: "Évaluation des risques de sécurité pour mes pays les mieux classés",
    es: "Evaluación de riesgos de seguridad para mis países mejor clasificados",
    pt: "Avaliação de riscos de segurança para meus países melhor classificados",
  },
  costOptimize: {
    en: "Where does my {budget} budget buy the best quality of life?",
    fr: "Où mon budget de {budget} offre-t-il la meilleure qualité de vie ?",
    es: "¿Dónde mi presupuesto de {budget} compra la mejor calidad de vida?",
    pt: "Onde meu orçamento de {budget} compra a melhor qualidade de vida?",
  },
  warRisk: {
    en: "Geopolitical threat assessment: which countries should I avoid?",
    fr: "Évaluation des menaces géopolitiques : quels pays éviter ?",
    es: "Evaluación de amenazas geopolíticas: ¿qué países evitar?",
    pt: "Avaliação de ameaças geopolíticas: quais países evitar?",
  },
  visaPathway: {
    en: "Fastest residency pathway given my nationality and profile",
    fr: "Voie de résidence la plus rapide selon ma nationalité et mon profil",
    es: "Vía de residencia más rápida según mi nacionalidad y perfil",
    pt: "Via de residência mais rápida dada minha nacionalidade e perfil",
  },
  qualityBalance: {
    en: "Which country offers the best balance of safety, healthcare, and lifestyle?",
    fr: "Quel pays offre le meilleur équilibre sécurité, santé et cadre de vie ?",
    es: "¿Qué país ofrece el mejor equilibrio de seguridad, salud y estilo de vida?",
    pt: "Qual país oferece o melhor equilíbrio de segurança, saúde e estilo de vida?",
  },
};

const modulePromptMap: Record<string, string> = {
  tax: "taxStrategy",
  safety: "safeFamily",
  investment: "investmentOutlook",
  business: "businessSetup",
  war_risk: "warRisk",
  cost_of_living: "costOptimize",
  visa: "visaPathway",
  quality_of_life: "qualityBalance",
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

  // Always lead with the strategic match question
  prompts.push(tpl("bestForYou", locale));

  // Module-specific prompt — takes priority slot 2
  const activeModuleKey = ctx.activeModule ? modulePromptMap[ctx.activeModule] : undefined;
  if (activeModuleKey && promptTemplates[activeModuleKey]) {
    const vars: Record<string, string> = {};
    if (activeModuleKey === "costOptimize") {
      vars.budget = budgetLabel(ctx.profile.budgetRange);
    }
    prompts.push(tpl(activeModuleKey, locale, vars));
  }

  // Goal-specific prompt
  const goals = ctx.profile.goals || [ctx.profile.goal];
  if (goals.includes("business") && activeModuleKey !== "businessSetup") {
    prompts.push(tpl("businessSetup", locale));
  } else if (goals.includes("remote_work" as any)) {
    prompts.push(tpl("nomadBest", locale));
  } else if (goals.includes("investment") && activeModuleKey !== "investmentOutlook") {
    prompts.push(tpl("investmentOutlook", locale));
  } else if (goals.includes("low_taxes" as any) && activeModuleKey !== "taxStrategy") {
    prompts.push(tpl("taxStrategy", locale));
  } else if (top) {
    prompts.push(tpl("deepDive", locale, { country: top.name[locale] }));
  } else {
    prompts.push(tpl("nomadBest", locale));
  }

  // Comparison if 2+ matches
  if (top && second) {
    prompts.push(tpl("compare", locale, { a: top.name[locale], b: second.name[locale] }));
  }

  // Priority-based
  if (ctx.profile.safetyImportance >= 4 && activeModuleKey !== "safeFamily") {
    prompts.push(tpl("safeFamily", locale));
  } else if (ctx.profile.taxImportance >= 4 && activeModuleKey !== "taxStrategy") {
    prompts.push(tpl("taxStrategy", locale));
  } else if (ctx.profile.costImportance >= 4 && activeModuleKey !== "costOptimize") {
    prompts.push(tpl("costOptimize", locale, { budget: budgetLabel(ctx.profile.budgetRange) }));
  } else if (top) {
    prompts.push(tpl("deepDive", locale, { country: top.name[locale] }));
  }

  // Deduplicate and cap at 4
  const unique: string[] = [];
  for (const p of prompts) {
    if (!unique.includes(p)) unique.push(p);
  }
  return unique.slice(0, 4);
}

// ---------------------------------------------------------------------------
// System prompt — senior analyst persona
// ---------------------------------------------------------------------------

export function buildSystemPrompt(ctx: AIContext): string {
  const { profile, matches, countries, locale } = ctx;
  const lens = getModuleLens(ctx.activeModule, locale);
  const pCtx = profileContext(profile, locale);

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

  const moduleDirective = lens
    ? `\n\nACTIVE ANALYSIS MODULE: ${ctx.activeModule!.replace(/_/g, " ").toUpperCase()}
${lens.prefix}. Frame every response through this lens. Lead with ${lens.emphasis.slice(0, 3).join(", ")} data. When answering any question, prioritize ${ctx.activeModule!.replace(/_/g, " ")} implications above all other factors.`
    : "";

  const profileDirective = pCtx ? `\nUSER CONTEXT: ${pCtx}` : "";

  return `You are Atlas AI — a senior geopolitical and economic intelligence analyst. You speak with authority, precision, and strategic clarity. You are not a chatbot. You are an advisor.

VOICE & STYLE:
- Lead with a direct position. Never open with "it depends" or "both have pros and cons."
- Be concise but rich. Every sentence earns its place.
- Use data to support verdicts, not replace them. Interpret, don't just report.
- When comparing, always pick a winner for this user's profile.
- Reference the user's profile naturally — nationality, budget, goals, family status.
- Write section headers in ${locale.toUpperCase()} language.

USER PROFILE:
- Nationality: ${profile.nationality || "Not specified"}
- Current country: ${profile.currentCountry || "Not specified"}
- Goals: ${(profile.goals || [profile.goal]).map(goalLabel).join(", ")}
- Budget: ${budgetLabel(profile.budgetRange)}
- Family: ${profile.familyStatus}
- Climate preference: ${profile.climatePreference}
- Priorities: Tax ${profile.taxImportance}/5 | Safety ${profile.safetyImportance}/5 | Cost ${profile.costImportance}/5 | Visa ${profile.visaImportance}/5
${profile.businessSector ? `- Business sector: ${profile.businessSector}` : ""}
${profileDirective}

TOP COUNTRY MATCHES:
${countryList}
${moduleDirective}

RESPONSE FORMAT:
- Use the premium structured format with ## headers and **bold** sections.
- For country briefings: Executive Summary, Fiscal Profile, Security & Stability, Business & Investment, Residency & Access, Cost & Lifestyle, Strategic Note, Best Fit.
- For comparisons: Verdict with clear winner, advantages of each side with data, trade-off summary, best-fit profiles, next move.
- Always provide actionable next steps.
- Keep each section to 1-2 lines max. Density over length.`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function goalLabel(goal: string): string {
  const labels: Record<string, string> = {
    low_taxes: "low taxes",
    save_money: "saving money",
    quality_of_life: "high quality of life",
    business: "business expansion",
    remote_work: "remote work",
    investment: "investment",
    expatriation: "expatriation",
    exploration: "exploration",
  };
  return labels[goal] || goal;
}

function budgetLabel(range: string): string {
  const labels: Record<string, string> = {
    under_1000: "under $1,000/month",
    "1000_2000": "$1,000-$2,000/month",
    "1000_3000": "$1,000-$3,000/month",
    "2000_4000": "$2,000-$4,000/month",
    "3000_5000": "$3,000-$5,000/month",
    "4000_plus": "$4,000+/month",
    "5000_plus": "$5,000+/month",
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
      lower.includes(c.iso_code.toLowerCase()) ||
      lower.includes(c.name.fr.toLowerCase()) ||
      lower.includes(c.name.es.toLowerCase()) ||
      lower.includes(c.name.pt.toLowerCase())
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
// Score a country against the user profile
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
    if (climDesc.includes(p.climatePreference) || (p.climatePreference === "warm" && climDesc.includes("hot"))) score += 10;
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
// Premium response builders
// ---------------------------------------------------------------------------

function buildBestFitDescription(c: Country, locale: Locale): string {
  const traits: string[] = [];
  if (c.tax.level === "low") {
    const t: Record<Locale, string> = { en: "tax-conscious expatriates", fr: "expatriés soucieux de la fiscalité", es: "expatriados conscientes de impuestos", pt: "expatriados conscientes de impostos" };
    traits.push(t[locale]);
  }
  if (c.safety.safety_index >= 65) {
    const t: Record<Locale, string> = { en: "families seeking security", fr: "familles cherchant la sécurité", es: "familias buscando seguridad", pt: "famílias buscando segurança" };
    traits.push(t[locale]);
  }
  if (c.cost_of_living.index <= 40) {
    const t: Record<Locale, string> = { en: "budget-optimizing digital nomads", fr: "nomades numériques optimisant leur budget", es: "nómadas digitales optimizando presupuesto", pt: "nômades digitais otimizando orçamento" };
    traits.push(t[locale]);
  }
  if (c.economy.gdp_per_capita > 35000) {
    const t: Record<Locale, string> = { en: "high-earning professionals", fr: "professionnels à hauts revenus", es: "profesionales de altos ingresos", pt: "profissionais de alta renda" };
    traits.push(t[locale]);
  }
  if (c.visa.ease_of_access === "easy") {
    const t: Record<Locale, string> = { en: "those wanting fast residency access", fr: "ceux recherchant un accès résidence rapide", es: "quienes buscan acceso rápido a residencia", pt: "quem busca acesso rápido à residência" };
    traits.push(t[locale]);
  }

  if (traits.length === 0) {
    const t: Record<Locale, string> = { en: "balanced relocators weighing multiple factors", fr: "personnes en relocation cherchant l'équilibre", es: "personas en reubicación buscando equilibrio", pt: "pessoas em mudança buscando equilíbrio" };
    return t[locale];
  }
  return traits.slice(0, 2).join(locale === "en" ? " and " : locale === "fr" ? " et " : locale === "es" ? " y " : " e ");
}

function buildStrategicNote(c: Country, locale: Locale): string {
  // Generate a non-obvious insight
  if (c.economy.inflation > 6 && c.cost_of_living.index <= 40) {
    const t: Record<Locale, string> = {
      en: `Low cost of living masks rising inflation at ${c.economy.inflation}% — real purchasing power is eroding faster than headline numbers suggest.`,
      fr: `Le faible coût de la vie masque une inflation de ${c.economy.inflation}% — le pouvoir d'achat réel s'érode plus vite que les chiffres ne le suggèrent.`,
      es: `El bajo costo de vida oculta una inflación del ${c.economy.inflation}% — el poder adquisitivo real se erosiona más rápido de lo que sugieren los números.`,
      pt: `O baixo custo de vida mascara uma inflação de ${c.economy.inflation}% — o poder de compra real está erodindo mais rápido do que os números sugerem.`,
    };
    return t[locale];
  }
  if (c.tax.level === "low" && c.safety.safety_index < 50) {
    const t: Record<Locale, string> = {
      en: `The tax advantage is real, but the below-average safety index (${c.safety.safety_index}/100) means you'll spend some savings on private security and premium neighborhoods.`,
      fr: `L'avantage fiscal est réel, mais l'indice de sécurité inférieur (${c.safety.safety_index}/100) signifie que vous dépenserez une partie des économies en sécurité privée.`,
      es: `La ventaja fiscal es real, pero el índice de seguridad inferior (${c.safety.safety_index}/100) significa que gastará parte de los ahorros en seguridad privada.`,
      pt: `A vantagem fiscal é real, mas o índice de segurança inferior (${c.safety.safety_index}/100) significa que gastará parte das economias em segurança privada.`,
    };
    return t[locale];
  }
  if (c.government.political_stability === "stable" && c.visa.ease_of_access === "hard") {
    const t: Record<Locale, string> = {
      en: `Excellent fundamentals, but the visa barrier is the real bottleneck. Start the application 12+ months before your target move date.`,
      fr: `Excellents fondamentaux, mais la barrière du visa est le vrai goulot d'étranglement. Commencez la demande 12+ mois avant votre date cible.`,
      es: `Excelentes fundamentos, pero la barrera de visa es el verdadero cuello de botella. Inicie la solicitud 12+ meses antes de su fecha objetivo.`,
      pt: `Excelentes fundamentos, mas a barreira do visto é o verdadeiro gargalo. Inicie a solicitação 12+ meses antes da data alvo.`,
    };
    return t[locale];
  }
  if (c.military.nuclear_weapon) {
    const t: Record<Locale, string> = {
      en: `Nuclear-armed state with power index ${c.military.power_index} — strong deterrent, but also a higher-profile geopolitical target. Factor this into long-term planning.`,
      fr: `État nucléaire avec indice de puissance ${c.military.power_index} — forte dissuasion, mais aussi cible géopolitique plus visible.`,
      es: `Estado nuclear con índice de poder ${c.military.power_index} — fuerte disuasión, pero también un objetivo geopolítico más visible.`,
      pt: `Estado nuclear com índice de poder ${c.military.power_index} — forte dissuasão, mas também um alvo geopolítico mais visível.`,
    };
    return t[locale];
  }
  // Default strategic note
  const t: Record<Locale, string> = {
    en: `With ${c.government.political_stability} governance and ${c.economy.main_exports.slice(0, 2).join("/")} as economic pillars, this country's trajectory hinges on commodity diversification and institutional reform.`,
    fr: `Avec une gouvernance ${c.government.political_stability} et ${c.economy.main_exports.slice(0, 2).join("/")} comme piliers économiques, la trajectoire dépend de la diversification et des réformes institutionnelles.`,
    es: `Con gobernanza ${c.government.political_stability} y ${c.economy.main_exports.slice(0, 2).join("/")} como pilares económicos, la trayectoria depende de la diversificación y reformas institucionales.`,
    pt: `Com governança ${c.government.political_stability} e ${c.economy.main_exports.slice(0, 2).join("/")} como pilares econômicos, a trajetória depende da diversificação e reformas institucionais.`,
  };
  return t[locale];
}

// ---------------------------------------------------------------------------
// Response generators — premium format
// ---------------------------------------------------------------------------

// ===== BEST FOR YOU — the decision engine core =====
function generateBestForYou(ctx: AIContext): string {
  const ranked = rankCountries(ctx, allCountries.slice(0, 50));
  const best = ranked[0];
  const alt1 = ranked[1];
  const alt2 = ranked[2];
  const locale = ctx.locale;
  const m = ctx.matches.find((mm) => mm.iso_code === best.iso_code);
  const lens = getModuleLens(ctx.activeModule, locale);
  const pCtx = profileContext(ctx.profile, locale);

  let out = "";

  // Module lens opener
  if (lens) {
    out += `*${lens.prefix}.*\n\n`;
  }

  // Executive Summary
  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `**${best.name[locale]}** is your strongest strategic match${m ? ` (score: ${m.score}/100)` : ""}. `;

  // Profile-aware verdict
  if (pCtx) {
    out += pCtx + "\n\n";
  } else {
    const goals = (ctx.profile.goals || [ctx.profile.goal]).map(goalLabel).join(", ");
    out += `For your ${goals} objectives with ${budgetLabel(ctx.profile.budgetRange)}, this country delivers the best risk-adjusted fit.\n\n`;
  }

  // Module-specific leading section
  if (ctx.activeModule === "tax" || ctx.profile.taxImportance >= 4) {
    out += `**${sH("fiscalProfile", locale)}**:\n`;
    out += `${best.tax.level.toUpperCase()} tax jurisdiction — Income: ${best.tax.income_tax}, Corporate: ${best.tax.corporate_tax}. ${best.tax.level === "low" ? "This is a net tax-positive move." : best.tax.level === "medium" ? "Moderate burden, but treaty benefits may optimize effective rates." : "High tax, but strong public services offset the cost."}\n\n`;
  }

  if (ctx.activeModule === "safety" || ctx.profile.safetyImportance >= 4) {
    out += `**${sH("security", locale)}**:\n`;
    out += `Safety index ${best.safety.safety_index}/100, crime index ${best.safety.crime_index}/100, ${best.government.political_stability} political environment. ${best.safety.safety_index >= 65 ? "Well above the threshold for comfortable daily life." : best.safety.safety_index >= 45 ? "Adequate baseline — neighborhood selection matters." : "Below average — factor in private security costs."}\n\n`;
  }

  // Core data sections
  if (ctx.activeModule !== "tax" && ctx.profile.taxImportance < 4) {
    out += `**${sH("fiscalProfile", locale)}**:\n`;
    out += `${best.tax.level.toUpperCase()} — Income: ${best.tax.income_tax}, Corporate: ${best.tax.corporate_tax}\n\n`;
  }

  if (ctx.activeModule !== "safety" && ctx.profile.safetyImportance < 4) {
    out += `**${sH("security", locale)}**:\n`;
    out += `Safety ${best.safety.safety_index}/100 | Crime ${best.safety.crime_index}/100 | ${best.government.political_stability} governance\n\n`;
  }

  out += `**${sH("businessInvestment", locale)}**:\n`;
  out += `GDP $${best.economy.gdp}B ($${fmt(best.economy.gdp_per_capita)}/capita) | Inflation ${best.economy.inflation}% | Key sectors: ${best.economy.main_exports.slice(0, 3).join(", ")}\n\n`;

  out += `**${sH("residencyAccess", locale)}**:\n`;
  out += `${best.visa.ease_of_access.toUpperCase()} access — ${best.visa.residency_options.split(",").slice(0, 2).join(", ")}\n\n`;

  out += `**${sH("costLifestyle", locale)}**:\n`;
  out += `Cost index ${best.cost_of_living.index}/100 | Avg salary $${fmt(best.cost_of_living.average_salary)}/mo | ${best.climate.description[locale]}\n\n`;

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `${buildStrategicNote(best, locale)}\n\n`;

  out += `**${sH("bestFit", locale)}**: ${buildBestFitDescription(best, locale)}\n\n`;

  // Alternatives
  out += `**${sH("alternatives", locale)}**:\n`;
  out += `→ **${alt1.name[locale]}**: ${alt1.tax.level} tax, safety ${alt1.safety.safety_index}/100, cost ${alt1.cost_of_living.index}, ${alt1.visa.ease_of_access} visa\n`;
  out += `→ **${alt2.name[locale]}**: ${alt2.tax.level} tax, safety ${alt2.safety.safety_index}/100, cost ${alt2.cost_of_living.index}, ${alt2.visa.ease_of_access} visa\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Deep-dive into ${best.name[locale]}'s residency pathway, then compare head-to-head with ${alt1.name[locale]}.`;

  return out;
}

// ===== COMPARISON — always pick a winner =====
function generateDeepComparison(a: Country, b: Country, ctx: AIContext): string {
  const locale = ctx.locale;
  const aScore = profileScore(a, ctx);
  const bScore = profileScore(b, ctx);
  const winner = aScore >= bScore ? a : b;
  const loser = aScore >= bScore ? b : a;
  const lens = getModuleLens(ctx.activeModule, locale);
  const pCtx = profileContext(ctx.profile, locale);

  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(goalLabel).join(", ");

  let out = "";

  // Module lens opener
  if (lens) {
    out += `*${lens.prefix}.*\n\n`;
  }

  out += `## ${a.name[locale]} vs ${b.name[locale]}\n\n`;

  // Clear verdict
  out += `**${sH("verdict", locale)}**: ${winner.name[locale]} wins for your ${goals} profile. `;
  if (pCtx) {
    out += pCtx + "\n\n";
  } else {
    out += `Here's the breakdown.\n\n`;
  }

  // Winner advantages
  out += `**${sH("whereLeads", locale, { name: winner.name[locale] })}**:\n`;
  const winnerAdvantages: string[] = [];
  if (winner.safety.safety_index > loser.safety.safety_index) {
    winnerAdvantages.push(`Safety index ${winner.safety.safety_index} vs ${loser.safety.safety_index} — ${winner.safety.safety_index - loser.safety.safety_index} points safer`);
  }
  if (winner.economy.gdp_per_capita > loser.economy.gdp_per_capita) {
    winnerAdvantages.push(`GDP per capita $${fmt(winner.economy.gdp_per_capita)} vs $${fmt(loser.economy.gdp_per_capita)} — stronger economic base`);
  }
  if (winner.cost_of_living.index < loser.cost_of_living.index) {
    winnerAdvantages.push(`Cost index ${winner.cost_of_living.index} vs ${loser.cost_of_living.index} — ${loser.cost_of_living.index - winner.cost_of_living.index} points cheaper`);
  }
  const taxOrder = { low: 0, medium: 1, high: 2 };
  if (taxOrder[winner.tax.level] < taxOrder[loser.tax.level]) {
    winnerAdvantages.push(`${winner.tax.level.toUpperCase()} tax (${winner.tax.income_tax}) vs ${loser.tax.level} (${loser.tax.income_tax})`);
  }
  if (winner.government.political_stability === "stable" && loser.government.political_stability !== "stable") {
    winnerAdvantages.push(`Politically ${winner.government.political_stability} vs ${loser.government.political_stability}`);
  }
  const visaOrder = { easy: 0, medium: 1, hard: 2 };
  if (visaOrder[winner.visa.ease_of_access] < visaOrder[loser.visa.ease_of_access]) {
    winnerAdvantages.push(`${winner.visa.ease_of_access.toUpperCase()} visa access vs ${loser.visa.ease_of_access}`);
  }
  if (winner.population_data.life_expectancy > loser.population_data.life_expectancy) {
    winnerAdvantages.push(`Life expectancy ${winner.population_data.life_expectancy} vs ${loser.population_data.life_expectancy} years`);
  }
  // Ensure at least 2 advantages
  if (winnerAdvantages.length === 0) {
    winnerAdvantages.push(`Stronger overall profile alignment (score: ${Math.max(aScore, bScore)} vs ${Math.min(aScore, bScore)})`);
  }
  out += winnerAdvantages.slice(0, 4).map((a) => `→ ${a}`).join("\n") + "\n\n";

  // Loser advantages
  out += `**${sH("whereLeads", locale, { name: loser.name[locale] })}**:\n`;
  const loserAdvantages: string[] = [];
  if (loser.safety.safety_index > winner.safety.safety_index) {
    loserAdvantages.push(`Safety index ${loser.safety.safety_index} vs ${winner.safety.safety_index}`);
  }
  if (loser.economy.gdp_per_capita > winner.economy.gdp_per_capita) {
    loserAdvantages.push(`GDP per capita $${fmt(loser.economy.gdp_per_capita)} vs $${fmt(winner.economy.gdp_per_capita)}`);
  }
  if (loser.cost_of_living.index < winner.cost_of_living.index) {
    loserAdvantages.push(`Cost index ${loser.cost_of_living.index} vs ${winner.cost_of_living.index} — more affordable`);
  }
  if (taxOrder[loser.tax.level] < taxOrder[winner.tax.level]) {
    loserAdvantages.push(`${loser.tax.level.toUpperCase()} tax (${loser.tax.income_tax}) vs ${winner.tax.level} (${winner.tax.income_tax})`);
  }
  if (loser.government.political_stability === "stable" && winner.government.political_stability !== "stable") {
    loserAdvantages.push(`More stable governance: ${loser.government.political_stability} vs ${winner.government.political_stability}`);
  }
  if (visaOrder[loser.visa.ease_of_access] < visaOrder[winner.visa.ease_of_access]) {
    loserAdvantages.push(`Easier visa: ${loser.visa.ease_of_access} vs ${winner.visa.ease_of_access}`);
  }
  if (loser.cost_of_living.average_salary > winner.cost_of_living.average_salary) {
    loserAdvantages.push(`Higher avg salary: $${fmt(loser.cost_of_living.average_salary)}/mo vs $${fmt(winner.cost_of_living.average_salary)}/mo`);
  }
  if (loserAdvantages.length === 0) {
    loserAdvantages.push(`${loser.name[locale]} offers ${loser.climate.description[locale]} — may suit specific lifestyle preferences`);
  }
  out += loserAdvantages.slice(0, 4).map((a) => `→ ${a}`).join("\n") + "\n\n";

  // The trade-off
  out += `**${sH("theTradeoff", locale)}**:\n`;
  const tradeoffPhrases: Record<Locale, string> = {
    en: `${winner.name[locale]} delivers stronger fundamentals for your profile, but ${loser.name[locale]} ${loserAdvantages.length > 0 ? "counters with " + loserAdvantages[0].toLowerCase().split(" — ")[0] : "offers different lifestyle trade-offs"}.`,
    fr: `${winner.name[locale]} offre de meilleurs fondamentaux pour votre profil, mais ${loser.name[locale]} ${loserAdvantages.length > 0 ? "compense avec " + loserAdvantages[0].toLowerCase().split(" — ")[0] : "offre d'autres compromis de vie"}.`,
    es: `${winner.name[locale]} ofrece fundamentos más fuertes para su perfil, pero ${loser.name[locale]} ${loserAdvantages.length > 0 ? "compensa con " + loserAdvantages[0].toLowerCase().split(" — ")[0] : "ofrece diferentes compromisos de estilo de vida"}.`,
    pt: `${winner.name[locale]} oferece fundamentos mais fortes para seu perfil, mas ${loser.name[locale]} ${loserAdvantages.length > 0 ? "compensa com " + loserAdvantages[0].toLowerCase().split(" — ")[0] : "oferece diferentes compromissos de estilo de vida"}.`,
  };
  out += tradeoffPhrases[locale] + "\n\n";

  // Best for profiles
  out += `**${sH("bestForProfiles", locale)}**:\n`;
  out += `• **${winner.name[locale]}**: ${buildBestFitDescription(winner, locale)}\n`;
  out += `• **${loser.name[locale]}**: ${buildBestFitDescription(loser, locale)}\n\n`;

  // Next move
  out += `**${sH("nextMove", locale)}**:\n`;
  const nextMovePhrases: Record<Locale, string> = {
    en: `Request a full intelligence briefing on ${winner.name[locale]} to explore residency pathways and tax optimization.`,
    fr: `Demandez un briefing complet sur ${winner.name[locale]} pour explorer les voies de résidence et l'optimisation fiscale.`,
    es: `Solicite un informe completo sobre ${winner.name[locale]} para explorar vías de residencia y optimización fiscal.`,
    pt: `Solicite um briefing completo sobre ${winner.name[locale]} para explorar vias de residência e otimização fiscal.`,
  };
  out += nextMovePhrases[locale];

  return out;
}

// ===== COUNTRY DEEP DIVE — intelligence briefing format =====
function generateCountryDeepDive(c: Country, ctx: AIContext): string {
  const locale = ctx.locale;
  const m = ctx.matches.find((mm) => mm.iso_code === c.iso_code);
  const lens = getModuleLens(ctx.activeModule, locale);
  const pCtx = profileContext(ctx.profile, locale);

  let out = "";

  // Module lens opener
  if (lens) {
    out += `*${lens.prefix}.*\n\n`;
  }

  // Executive Summary
  out += `## ${sH("executiveSummary", locale)}\n\n`;

  // Build a 2-sentence verdict
  const verdictStrength = m && m.score >= 70 ? "strong" : m && m.score >= 50 ? "viable" : "conditional";
  const verdictPhrases: Record<string, Record<Locale, string>> = {
    strong: {
      en: `${c.name[locale]} is a high-confidence match${m ? ` (${m.score}/100)` : ""}.`,
      fr: `${c.name[locale]} est une correspondance de haute confiance${m ? ` (${m.score}/100)` : ""}.`,
      es: `${c.name[locale]} es una coincidencia de alta confianza${m ? ` (${m.score}/100)` : ""}.`,
      pt: `${c.name[locale]} é uma correspondência de alta confiança${m ? ` (${m.score}/100)` : ""}.`,
    },
    viable: {
      en: `${c.name[locale]} is a viable option${m ? ` (${m.score}/100)` : ""} with specific strengths worth examining.`,
      fr: `${c.name[locale]} est une option viable${m ? ` (${m.score}/100)` : ""} avec des forces spécifiques à examiner.`,
      es: `${c.name[locale]} es una opción viable${m ? ` (${m.score}/100)` : ""} con fortalezas específicas a examinar.`,
      pt: `${c.name[locale]} é uma opção viável${m ? ` (${m.score}/100)` : ""} com pontos fortes específicos a examinar.`,
    },
    conditional: {
      en: `${c.name[locale]} is a conditional fit${m ? ` (${m.score}/100)` : ""} — strong in select areas but requires trade-off tolerance.`,
      fr: `${c.name[locale]} est un choix conditionnel${m ? ` (${m.score}/100)` : ""} — fort dans certains domaines mais nécessite une tolérance aux compromis.`,
      es: `${c.name[locale]} es un ajuste condicional${m ? ` (${m.score}/100)` : ""} — fuerte en áreas selectas pero requiere tolerancia a compromisos.`,
      pt: `${c.name[locale]} é um ajuste condicional${m ? ` (${m.score}/100)` : ""} — forte em áreas selecionadas mas requer tolerância a compensações.`,
    },
  };
  out += verdictPhrases[verdictStrength][locale] + " ";

  // Key insight line
  const keyInsight = c.tax.level === "low" && c.safety.safety_index >= 60
    ? { en: "Rare combination of fiscal efficiency and personal security.", fr: "Combinaison rare d'efficacité fiscale et de sécurité personnelle.", es: "Combinación rara de eficiencia fiscal y seguridad personal.", pt: "Combinação rara de eficiência fiscal e segurança pessoal." }
    : c.economy.gdp_per_capita > 35000 && c.cost_of_living.index <= 50
    ? { en: "Premium economy with moderate living costs — strong purchasing power.", fr: "Économie premium avec coût de vie modéré — fort pouvoir d'achat.", es: "Economía premium con costos de vida moderados — fuerte poder adquisitivo.", pt: "Economia premium com custo de vida moderado — forte poder de compra." }
    : c.visa.ease_of_access === "easy" && c.government.political_stability === "stable"
    ? { en: "Easy access and stable governance — low friction relocation.", fr: "Accès facile et gouvernance stable — relocation à faible friction.", es: "Acceso fácil y gobernanza estable — reubicación de baja fricción.", pt: "Acesso fácil e governança estável — mudança de baixa fricção." }
    : { en: `${c.government.type} with ${c.government.political_stability} governance and ${c.economy.main_exports[0]}-driven economy.`, fr: `${c.government.type} avec gouvernance ${c.government.political_stability} et économie tirée par ${c.economy.main_exports[0]}.`, es: `${c.government.type} con gobernanza ${c.government.political_stability} y economía impulsada por ${c.economy.main_exports[0]}.`, pt: `${c.government.type} com governança ${c.government.political_stability} e economia impulsionada por ${c.economy.main_exports[0]}.` };
  out += keyInsight[locale] + "\n\n";

  // Profile context
  if (pCtx) {
    out += `${pCtx}\n\n`;
  }

  // Fiscal Profile
  out += `**${sH("fiscalProfile", locale)}**:\n`;
  out += `${c.tax.level.toUpperCase()} tax regime — Income: ${c.tax.income_tax}, Corporate: ${c.tax.corporate_tax}. `;
  out += c.tax.level === "low"
    ? (locale === "en" ? "Strong fiscal position for income retention." : locale === "fr" ? "Position fiscale forte pour la rétention de revenus." : locale === "es" ? "Posición fiscal fuerte para retención de ingresos." : "Posição fiscal forte para retenção de renda.")
    : c.tax.level === "medium"
    ? (locale === "en" ? "Balanced approach — look into treaty-based optimization." : locale === "fr" ? "Approche équilibrée — explorez l'optimisation par traités." : locale === "es" ? "Enfoque equilibrado — explore optimización por tratados." : "Abordagem equilibrada — explore otimização por tratados.")
    : (locale === "en" ? "High burden, but comprehensive public infrastructure compensates." : locale === "fr" ? "Charge élevée, mais infrastructure publique complète en compensation." : locale === "es" ? "Alta carga, pero infraestructura pública completa compensa." : "Alta carga, mas infraestrutura pública abrangente compensa.");
  out += "\n\n";

  // Security & Stability
  out += `**${sH("security", locale)}**:\n`;
  out += `Safety ${c.safety.safety_index}/100 | Crime ${c.safety.crime_index}/100 | ${c.government.political_stability} — ${c.government.type}. `;
  out += c.safety.safety_index >= 65
    ? (locale === "en" ? "Above-threshold safety for families and solo expatriates alike." : locale === "fr" ? "Sécurité au-dessus du seuil pour familles et expatriés." : locale === "es" ? "Seguridad por encima del umbral para familias y expatriados." : "Segurança acima do limiar para famílias e expatriados.")
    : c.safety.safety_index >= 45
    ? (locale === "en" ? "Moderate — stick to established expatriate zones." : locale === "fr" ? "Modéré — restez dans les zones d'expatriés établies." : locale === "es" ? "Moderado — manténgase en zonas de expatriados establecidas." : "Moderado — fique em zonas de expatriados estabelecidas.")
    : (locale === "en" ? "Below average — private security and gated communities recommended." : locale === "fr" ? "En dessous de la moyenne — sécurité privée et résidences fermées recommandées." : locale === "es" ? "Por debajo del promedio — seguridad privada y comunidades cerradas recomendadas." : "Abaixo da média — segurança privada e condomínios fechados recomendados.");
  out += "\n\n";

  // Business & Investment
  out += `**${sH("businessInvestment", locale)}**:\n`;
  out += `GDP $${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)}/capita) | Inflation ${c.economy.inflation}% | Industries: ${c.main_industries.slice(0, 3).join(", ")}. `;
  out += c.economy.gdp_per_capita > 30000
    ? (locale === "en" ? "Mature market with high purchasing power." : locale === "fr" ? "Marché mature avec fort pouvoir d'achat." : locale === "es" ? "Mercado maduro con alto poder adquisitivo." : "Mercado maduro com alto poder de compra.")
    : c.economy.gdp_per_capita > 15000
    ? (locale === "en" ? "Emerging market with growth runway." : locale === "fr" ? "Marché émergent avec potentiel de croissance." : locale === "es" ? "Mercado emergente con potencial de crecimiento." : "Mercado emergente com potencial de crescimento.")
    : (locale === "en" ? "Frontier market — high risk, high potential reward." : locale === "fr" ? "Marché frontière — risque élevé, potentiel de rendement élevé." : locale === "es" ? "Mercado frontera — alto riesgo, alto potencial de retorno." : "Mercado fronteira — alto risco, alto potencial de retorno.");
  out += "\n\n";

  // Residency & Access
  out += `**${sH("residencyAccess", locale)}**:\n`;
  out += `${c.visa.ease_of_access.toUpperCase()} access — ${c.visa.residency_options}. `;
  out += c.visa.ease_of_access === "easy"
    ? (locale === "en" ? "Fast-track available — some pathways under 6 months." : locale === "fr" ? "Voie rapide disponible — certains parcours en moins de 6 mois." : locale === "es" ? "Vía rápida disponible — algunas vías en menos de 6 meses." : "Via rápida disponível — alguns caminhos em menos de 6 meses.")
    : c.visa.ease_of_access === "medium"
    ? (locale === "en" ? "Moderate timeline — plan 6-12 months for full processing." : locale === "fr" ? "Délai modéré — prévoyez 6-12 mois pour le traitement complet." : locale === "es" ? "Plazo moderado — planifique 6-12 meses para el procesamiento completo." : "Prazo moderado — planeje 6-12 meses para processamento completo.")
    : (locale === "en" ? "High barrier — requires significant documentation and patience." : locale === "fr" ? "Barrière élevée — nécessite une documentation importante et de la patience." : locale === "es" ? "Alta barrera — requiere documentación significativa y paciencia." : "Alta barreira — requer documentação significativa e paciência.");
  out += "\n\n";

  // Cost & Lifestyle
  out += `**${sH("costLifestyle", locale)}**:\n`;
  out += `Cost index ${c.cost_of_living.index}/100 | Avg salary $${fmt(c.cost_of_living.average_salary)}/mo | ${c.climate.description[locale]}. `;
  out += c.cost_of_living.index <= 40
    ? (locale === "en" ? `Your ${budgetLabel(ctx.profile.budgetRange)} budget goes far here.` : locale === "fr" ? `Votre budget de ${budgetLabel(ctx.profile.budgetRange)} va loin ici.` : locale === "es" ? `Su presupuesto de ${budgetLabel(ctx.profile.budgetRange)} rinde mucho aquí.` : `Seu orçamento de ${budgetLabel(ctx.profile.budgetRange)} vai longe aqui.`)
    : c.cost_of_living.index <= 65
    ? (locale === "en" ? `Moderate costs — ${budgetLabel(ctx.profile.budgetRange)} is workable with planning.` : locale === "fr" ? `Coûts modérés — ${budgetLabel(ctx.profile.budgetRange)} est réalisable avec planification.` : locale === "es" ? `Costos moderados — ${budgetLabel(ctx.profile.budgetRange)} es viable con planificación.` : `Custos moderados — ${budgetLabel(ctx.profile.budgetRange)} é viável com planejamento.`)
    : (locale === "en" ? `Premium market — ${budgetLabel(ctx.profile.budgetRange)} requires careful allocation.` : locale === "fr" ? `Marché premium — ${budgetLabel(ctx.profile.budgetRange)} nécessite une allocation soigneuse.` : locale === "es" ? `Mercado premium — ${budgetLabel(ctx.profile.budgetRange)} requiere asignación cuidadosa.` : `Mercado premium — ${budgetLabel(ctx.profile.budgetRange)} requer alocação cuidadosa.`);
  out += "\n\n";

  // Strategic Note
  out += `**${sH("strategicNote", locale)}**:\n`;
  out += buildStrategicNote(c, locale) + "\n\n";

  // Best Fit
  out += `**${sH("bestFit", locale)}**: ${buildBestFitDescription(c, locale)}\n\n`;

  // Next move
  const ranked = rankCountries(ctx, allCountries.slice(0, 50));
  const alt = ranked.find((cc) => cc.iso_code !== c.iso_code);
  out += `**${sH("nextMove", locale)}**:\n`;
  if (alt) {
    const nextPhrases: Record<Locale, string> = {
      en: `Compare ${c.name[locale]} head-to-head with ${alt.name[locale]}, or request a step-by-step relocation plan.`,
      fr: `Comparez ${c.name[locale]} face à face avec ${alt.name[locale]}, ou demandez un plan de relocation étape par étape.`,
      es: `Compare ${c.name[locale]} cara a cara con ${alt.name[locale]}, o solicite un plan de reubicación paso a paso.`,
      pt: `Compare ${c.name[locale]} frente a frente com ${alt.name[locale]}, ou solicite um plano de mudança passo a passo.`,
    };
    out += nextPhrases[locale];
  } else {
    const nextPhrases: Record<Locale, string> = {
      en: `Request a step-by-step relocation plan to ${c.name[locale]}.`,
      fr: `Demandez un plan de relocation étape par étape vers ${c.name[locale]}.`,
      es: `Solicite un plan de reubicación paso a paso a ${c.name[locale]}.`,
      pt: `Solicite um plano de mudança passo a passo para ${c.name[locale]}.`,
    };
    out += nextPhrases[locale];
  }

  return out;
}

// ===== DIGITAL NOMAD =====
function generateNomadResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);
  const nomadScore = (c: Country) =>
    (100 - c.cost_of_living.index) +
    (c.visa.ease_of_access === "easy" ? 30 : c.visa.ease_of_access === "medium" ? 15 : 0) +
    (c.safety.safety_index > 50 ? 20 : 0) +
    (c.government.political_stability === "stable" ? 10 : 0);

  const ranked = [...allCountries].sort((a, b) => nomadScore(b) - nomadScore(a)).slice(0, 5);
  const best = ranked[0];

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `**${best.name[locale]}** dominates the nomad rankings. Cost index ${best.cost_of_living.index}, ${best.visa.ease_of_access} visa, safety ${best.safety.safety_index}/100 — the trifecta for ${budgetLabel(ctx.profile.budgetRange)} remote workers.\n\n`;

  out += `**Top 5 Nomad Jurisdictions**:\n`;
  ranked.forEach((c, i) => {
    const icon = i === 0 ? "→" : "  ";
    out += `${icon} **#${i + 1} ${c.name[locale]}**: Cost ${c.cost_of_living.index} | Visa ${c.visa.ease_of_access} | Safety ${c.safety.safety_index} | $${fmt(c.cost_of_living.average_salary)}/mo avg\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `Cheapest is not best. ${ranked[0].name[locale]} balances cost with infrastructure quality. ${ranked[1].name[locale]} may edge ahead on internet speed and coworking density — verify before committing.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Deep-dive into ${best.name[locale]}'s nomad visa options, then compare with ${ranked[1].name[locale]}.`;

  return out;
}

// ===== COST / BUDGET =====
function generateCostResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);
  const sorted = [...ctx.countries].sort((a, b) => a.cost_of_living.index - b.cost_of_living.index);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `**${cheapest.name[locale]}** maximizes purchasing power at cost index ${cheapest.cost_of_living.index}. Your ${budgetLabel(ctx.profile.budgetRange)} stretches ${cheapest.cost_of_living.index <= 35 ? "significantly" : "reasonably"} further here than in ${priciest.name[locale]} (index ${priciest.cost_of_living.index}).\n\n`;

  out += `**${sH("costLifestyle", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.cost_of_living.index <= 40 ? "→" : c.cost_of_living.index <= 65 ? "  " : "  ";
    out += `${mark} **${c.name[locale]}**: Index ${c.cost_of_living.index} | Salary $${fmt(c.cost_of_living.average_salary)}/mo | Inflation ${c.economy.inflation}%\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `Low cost often correlates with lower infrastructure quality. ${cheapest.name[locale]} at index ${cheapest.cost_of_living.index} delivers real savings, but verify internet, healthcare, and banking access on the ground before committing.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Compare ${cheapest.name[locale]} vs ${priciest.name[locale]} to understand the full trade-off spectrum.`;

  return out;
}

// ===== SAFETY =====
function generateSafetyResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);
  const sorted = [...ctx.countries].sort((a, b) => b.safety.safety_index - a.safety.safety_index);
  const safest = sorted[0];

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `**${safest.name[locale]}** leads with safety index ${safest.safety.safety_index}/100 and ${safest.government.political_stability} governance.`;
  if (ctx.profile.familyStatus === "family") {
    out += locale === "en" ? " Family safety prioritized in this assessment." : locale === "fr" ? " Sécurité familiale prioritaire dans cette évaluation." : locale === "es" ? " Seguridad familiar priorizada en esta evaluación." : " Segurança familiar priorizada nesta avaliação.";
  }
  out += "\n\n";

  out += `**${sH("security", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.safety.safety_index >= 65 ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: Safety ${c.safety.safety_index}/100 | Crime ${c.safety.crime_index} | ${c.government.political_stability} | ${c.military.nuclear_weapon ? "Nuclear" : `Power ${c.military.power_index}`}\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `National safety metrics are averages. ${safest.name[locale]} scores ${safest.safety.safety_index}/100 nationally, but city-level variance can be 20+ points. Target expatriate-established neighborhoods for the safest daily experience.\n\n`;

  out += `**${sH("theTradeoff", locale)}**:\n`;
  out += `Safest countries often carry premium costs — ${safest.name[locale]} cost index is ${safest.cost_of_living.index}. Security comes at a price.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Full intelligence briefing on ${safest.name[locale]}, or compare top 3 safest options head-to-head.`;

  return out;
}

// ===== TAX =====
function generateTaxResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);
  const sorted = [...ctx.countries].sort((a, b) => {
    const order = { low: 0, medium: 1, high: 2 };
    return order[a.tax.level] - order[b.tax.level];
  });
  const best = sorted[0];
  const lowTax = allCountries.filter((c) => c.tax.level === "low").slice(0, 5);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `**${best.name[locale]}** offers the strongest fiscal position — ${best.tax.level} tax with ${best.tax.income_tax} income and ${best.tax.corporate_tax} corporate rates. `;
  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(goalLabel).join(", ");
  out += `For your ${goals} objectives, this preserves maximum net income.\n\n`;

  out += `**${sH("fiscalProfile", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.tax.level === "low" ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: ${c.tax.level.toUpperCase()} — Income: ${c.tax.income_tax} | Corp: ${c.tax.corporate_tax} | Stability: ${c.government.political_stability}\n`;
  });
  out += "\n";

  if (lowTax.filter((c) => !sorted.find((s) => s.iso_code === c.iso_code)).length > 0) {
    out += `**${sH("alternatives", locale)}**:\n`;
    lowTax.filter((c) => !sorted.slice(0, 3).find((s) => s.iso_code === c.iso_code)).slice(0, 3).forEach((c) => {
      out += `→ **${c.name[locale]}**: ${c.tax.income_tax} income, ${c.tax.corporate_tax} corporate — ${c.visa.ease_of_access} visa\n`;
    });
    out += "\n";
  }

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `Low tax does not mean zero obligation. The 183-day residency rule, substance requirements, and double taxation treaties all affect your effective rate. ${best.name[locale]}'s ${best.tax.income_tax} headline rate may differ from your actual burden.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Compare ${best.name[locale]} vs your current country's tax regime, then explore residency-by-investment programs.`;

  return out;
}

// ===== VISA / RESIDENCY =====
function generateVisaResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);
  const sorted = [...ctx.countries].sort((a, b) => {
    const order = { easy: 0, medium: 1, hard: 2 };
    return order[a.visa.ease_of_access] - order[b.visa.ease_of_access];
  });
  const easiest = sorted[0];

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `**${easiest.name[locale]}** provides the fastest path — ${easiest.visa.ease_of_access} access with ${easiest.visa.residency_options.split(",")[0]} as the primary pathway.`;
  if (ctx.profile.nationality) {
    out += ` ${locale === "en" ? `Your ${ctx.profile.nationality} nationality may unlock bilateral agreements.` : locale === "fr" ? `Votre nationalité ${ctx.profile.nationality} peut débloquer des accords bilatéraux.` : locale === "es" ? `Su nacionalidad ${ctx.profile.nationality} puede desbloquear acuerdos bilaterales.` : `Sua nacionalidade ${ctx.profile.nationality} pode desbloquear acordos bilaterais.`}`;
  }
  out += "\n\n";

  out += `**${sH("residencyAccess", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.visa.ease_of_access === "easy" ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: ${c.visa.ease_of_access.toUpperCase()} — ${c.visa.residency_options}\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `Easy visa access does not guarantee easy citizenship. Permanent residency timelines range 5-10 years. Work permits are often separate from residency permits — verify employment rights before relocating.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Request a step-by-step relocation plan for ${easiest.name[locale]}, or compare visa difficulty vs quality of life across your top matches.`;

  return out;
}

// ===== RELOCATION PLAN =====
function generateRelocationPlan(c: Country, ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `Relocation roadmap to **${c.name[locale]}** — tailored for your ${(ctx.profile.goals || [ctx.profile.goal]).map(goalLabel).join(", ")} objectives and ${budgetLabel(ctx.profile.budgetRange)} budget.\n\n`;

  out += `**${sH("fiscalProfile", locale)}**: ${c.tax.level.toUpperCase()} — ${c.tax.income_tax} income, ${c.tax.corporate_tax} corporate\n`;
  out += `**${sH("residencyAccess", locale)}**: ${c.visa.ease_of_access.toUpperCase()} — ${c.visa.residency_options.split(",")[0]}\n`;
  out += `**${sH("costLifestyle", locale)}**: Index ${c.cost_of_living.index} | Avg salary $${fmt(c.cost_of_living.average_salary)}/mo\n`;
  out += `**${sH("security", locale)}**: ${c.safety.safety_index}/100 safety | ${c.government.political_stability} governance\n\n`;

  const steps: Record<Locale, string[]> = {
    en: [
      `**Month 1-2**: Research visa requirements, gather documents (passport, financials, background check). ${c.visa.ease_of_access === "hard" ? "Engage an immigration lawyer early." : "Standard documentation should suffice."}`,
      `**Month 2-3**: Apply for ${c.visa.residency_options.split(",")[0]} — budget $500-2,000 for application fees.`,
      `**Month 3-4**: Secure housing remotely, set up banking, arrange health insurance. ${c.cost_of_living.index > 60 ? "Budget premium rates." : "Competitive local rates available."}`,
      `**Month 4-5**: Plan the move — shipping, flights, first 30 days essentials.`,
      `**Month 5-6**: Arrive, register with local authorities, open bank account, get local SIM.`,
      `**Ongoing**: Build local network, optimize tax position, explore the country. ${c.language.includes("English") ? "English widely spoken." : `Learn basic ${c.language.split(",")[0].trim()} before arrival.`}`,
    ],
    fr: [
      `**Mois 1-2** : Recherche des exigences de visa, collecte des documents. ${c.visa.ease_of_access === "hard" ? "Engagez un avocat en immigration tôt." : "Documentation standard suffisante."}`,
      `**Mois 2-3** : Demande de ${c.visa.residency_options.split(",")[0]} — budget 500-2 000$ pour les frais.`,
      `**Mois 3-4** : Logement à distance, banque, assurance santé.`,
      `**Mois 4-5** : Planification du déménagement — expédition, vols, essentiels.`,
      `**Mois 5-6** : Arrivée, inscription autorités locales, compte bancaire, SIM locale.`,
      `**En continu** : Réseau local, optimisation fiscale, exploration.`,
    ],
    es: [
      `**Mes 1-2**: Investigar requisitos de visa, reunir documentos. ${c.visa.ease_of_access === "hard" ? "Contrate un abogado de inmigración temprano." : "Documentación estándar debería ser suficiente."}`,
      `**Mes 2-3**: Solicitar ${c.visa.residency_options.split(",")[0]} — presupueste $500-2,000 para tasas.`,
      `**Mes 3-4**: Asegurar vivienda remotamente, configurar banca, contratar seguro de salud.`,
      `**Mes 4-5**: Planificar la mudanza — envío, vuelos, esenciales.`,
      `**Mes 5-6**: Llegar, registrarse con autoridades locales, abrir cuenta bancaria, obtener SIM local.`,
      `**En curso**: Red local, optimización fiscal, exploración.`,
    ],
    pt: [
      `**Mês 1-2**: Pesquisar requisitos de visto, reunir documentos. ${c.visa.ease_of_access === "hard" ? "Contrate um advogado de imigração cedo." : "Documentação padrão deve ser suficiente."}`,
      `**Mês 2-3**: Solicitar ${c.visa.residency_options.split(",")[0]} — orçamento $500-2.000 para taxas.`,
      `**Mês 3-4**: Garantir moradia remotamente, configurar banco, contratar seguro saúde.`,
      `**Mês 4-5**: Planejar a mudança — envio, voos, essenciais.`,
      `**Mês 5-6**: Chegar, registrar com autoridades locais, abrir conta bancária, obter SIM local.`,
      `**Em andamento**: Rede local, otimização fiscal, exploração.`,
    ],
  };

  out += `**${sH("nextSteps", locale)}**:\n`;
  (steps[locale] || steps.en).forEach((s) => { out += `${s}\n`; });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  const costRange = c.cost_of_living.index > 60 ? "$8,000-15,000" : c.cost_of_living.index > 35 ? "$4,000-8,000" : "$2,000-5,000";
  out += `Total relocation cost estimate: ${costRange} (flights, deposits, first month, fees). Factor in 3 months emergency reserves at local cost levels.`;

  return out;
}

// ===== ECONOMY / INVESTMENT =====
function generateEconomyResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);
  const sorted = [...ctx.countries].sort((a, b) => b.economy.gdp_per_capita - a.economy.gdp_per_capita);
  const top = sorted[0];

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `**${top.name[locale]}** leads on economic fundamentals — $${fmt(top.economy.gdp_per_capita)} per capita GDP, ${top.economy.inflation}% inflation, anchored by ${top.economy.main_exports.slice(0, 2).join(" and ")}.\n\n`;

  out += `**${sH("businessInvestment", locale)}**:\n`;
  sorted.forEach((c, i) => {
    const mark = i === 0 ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: GDP $${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)}/cap) | Inflation ${c.economy.inflation}% | ${c.tax.corporate_tax} corp tax\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `High GDP per capita correlates with high cost of living — ${top.name[locale]} cost index is ${top.cost_of_living.index}. ${top.economy.inflation < 4 ? "Low inflation supports stable returns and planning certainty." : "Elevated inflation erodes returns — hedge with hard assets or foreign-denominated accounts."}\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Deep-dive into ${top.name[locale]}'s sector-specific opportunities, or compare economic fundamentals across your top 3.`;

  return out;
}

// ===== MILITARY / GEOPOLITICS =====
function generateMilitaryResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);
  const sorted = [...ctx.countries].sort((a, b) => a.military.power_index - b.military.power_index);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `Strongest military posture: **${sorted[0].name[locale]}** (power index ${sorted[0].military.power_index}${sorted[0].military.nuclear_weapon ? ", nuclear-armed" : ""}). But for relocation, political stability matters more than raw military strength.\n\n`;

  out += `**${sH("security", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.government.political_stability === "stable" ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: Power ${c.military.power_index} | ${c.government.political_stability} | ${c.military.nuclear_weapon ? "Nuclear" : "Conventional"} | Safety ${c.safety.safety_index}/100\n`;
  });
  out += "\n";

  const stableCountries = ctx.countries.filter((c) => c.government.political_stability === "stable");
  out += `**${sH("strategicNote", locale)}**:\n`;
  out += `${stableCountries.length > 0 ? `Stable jurisdictions in your matches: ${stableCountries.map((c) => c.name[locale]).join(", ")}. ` : ""}Military strength is a deterrent metric, not a livability one. Focus on safety index and governance stability for practical decision-making.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Shift to safety and stability analysis for actionable relocation insights.`;

  return out;
}

// ===== CLIMATE =====
function generateClimateResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  out += `${ctx.profile.climatePreference !== "any" ? `Your preference: **${ctx.profile.climatePreference}** climate.` : "Climate-agnostic profile."} `;

  const matched = ctx.countries.filter((c) => {
    const desc = c.climate.description.en.toLowerCase();
    const pref = ctx.profile.climatePreference;
    return pref === "any" || desc.includes(pref) || (pref === "warm" && (desc.includes("hot") || desc.includes("tropical")));
  });
  out += `${matched.length}/${ctx.countries.length} matches align with your climate preference.\n\n`;

  out += `**${sH("costLifestyle", locale)}**:\n`;
  ctx.countries.forEach((c) => {
    const desc = c.climate.description.en.toLowerCase();
    const pref = ctx.profile.climatePreference;
    const isMatch = pref === "any" || desc.includes(pref) || (pref === "warm" && (desc.includes("hot") || desc.includes("tropical")));
    const mark = isMatch ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: ${c.climate.average_temp} avg | ${c.climate.seasons} | ${c.climate.description[locale]}\n`;
  });
  out += "\n";

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Ask about best cities for your climate preference, or compare quality of life across climate zones.`;

  return out;
}

// ===== GOVERNMENT =====
function generateGovernmentResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  const stableOnes = ctx.countries.filter((c) => c.government.political_stability === "stable");
  out += `${stableOnes.length > 0 ? `${stableOnes.map((c) => c.name[locale]).join(", ")} ${stableOnes.length === 1 ? "stands" : "stand"} out for governance quality.` : "No highly stable jurisdictions in your current matches — consider broadening options."} `;
  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(goalLabel).join(", ");
  out += `For ${goals}, political stability directly impacts currency strength, rule of law, and property rights.\n\n`;

  out += `**${sH("security", locale)}**:\n`;
  ctx.countries.forEach((c) => {
    const mark = c.government.political_stability === "stable" ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: ${c.government.type} | ${c.government.current_leader} | ${c.government.political_stability}\n`;
  });
  out += "\n";

  out += `**${sH("nextMove", locale)}**:\n`;
  out += `Focus on countries with stable governance for long-term commitments, or ask about specific regulatory environments for your industry.`;

  return out;
}

// ---------------------------------------------------------------------------
// Pattern matching registry — expanded multilingual keywords
// ---------------------------------------------------------------------------

interface ResponsePattern {
  keywords: string[];
  generate: (ctx: AIContext, question: string) => string;
}

const PATTERNS: ResponsePattern[] = [
  {
    keywords: [
      "best for me", "best option", "best country for me", "recommend", "which country",
      "what country", "where should", "which is best", "strongest match", "strategic match",
      // fr
      "meilleur pour moi", "meilleur pays", "quel pays", "recommander", "où devrais",
      "meilleur choix", "meilleure option",
      // es
      "mejor para mí", "mejor país", "cuál país", "recomendar", "dónde debería",
      "mejor opción", "opción estratégica",
      // pt
      "melhor para mim", "melhor país", "qual país", "recomendar", "onde deveria",
      "melhor opção", "opção estratégica",
    ],
    generate: (ctx) => generateBestForYou(ctx),
  },
  {
    keywords: [
      "compare", "vs", "versus", "difference", "head-to-head", "face to face",
      // fr
      "comparer", "comparaison", "différence", "face à face",
      // es
      "comparar", "comparación", "diferencia", "cara a cara",
      // pt
      "comparar", "comparação", "diferença", "frente a frente",
    ],
    generate: (ctx, q) => {
      const pair = findTwoCountries(q, ctx);
      if (!pair) return generateBestForYou(ctx);
      return generateDeepComparison(pair[0], pair[1], ctx);
    },
  },
  {
    keywords: [
      "step-by-step", "relocation plan", "how to move", "relocate to", "move to",
      "plan to move", "relocation roadmap", "moving guide",
      // fr
      "plan de relocation", "comment déménager", "étape par étape", "s'installer",
      "plan de déménagement",
      // es
      "plan de reubicación", "cómo mudarme", "paso a paso", "mudarme a",
      "plan de mudanza",
      // pt
      "plano de mudança", "como me mudar", "passo a passo", "mudar para",
      "plano de relocação",
    ],
    generate: (ctx, q) => {
      const country = findCountryInQuestion(q) || ctx.countries[0];
      if (!country) return generateBestForYou(ctx);
      return generateRelocationPlan(country, ctx);
    },
  },
  {
    keywords: [
      "tell me about", "analyze", "analysis", "overview", "briefing", "deep dive",
      "detail", "about", "full briefing", "intelligence briefing", "country profile",
      // fr
      "parle-moi de", "analyser", "analyse", "aperçu", "briefing complet",
      "profil du pays", "en détail",
      // es
      "cuéntame sobre", "analizar", "análisis", "resumen", "informe completo",
      "perfil del país", "en detalle",
      // pt
      "me fale sobre", "analisar", "análise", "resumo", "briefing completo",
      "perfil do país", "em detalhe",
    ],
    generate: (ctx, q) => {
      const country = findCountryInQuestion(q);
      if (country) return generateCountryDeepDive(country, ctx);
      if (ctx.countries[0]) return generateCountryDeepDive(ctx.countries[0], ctx);
      return generateBestForYou(ctx);
    },
  },
  {
    keywords: [
      "nomad", "remote work", "freelance", "digital nomad", "work remotely",
      "remote worker", "location independent",
      // fr
      "nomade numérique", "travail à distance", "freelance", "télétravail",
      // es
      "nómada digital", "trabajo remoto", "freelance", "teletrabajo",
      // pt
      "nômade digital", "trabalho remoto", "freelance", "teletrabalho",
    ],
    generate: (ctx) => generateNomadResponse(ctx),
  },
  {
    keywords: [
      "cost", "budget", "expensive", "cheap", "afford", "price", "purchasing power",
      "quality of life on", "maximize", "stretch",
      // fr
      "coût", "budget", "cher", "pas cher", "pouvoir d'achat", "prix",
      "qualité de vie avec",
      // es
      "costo", "presupuesto", "caro", "barato", "poder adquisitivo", "precio",
      "calidad de vida con",
      // pt
      "custo", "orçamento", "caro", "barato", "poder de compra", "preço",
      "qualidade de vida com",
    ],
    generate: (ctx) => generateCostResponse(ctx),
  },
  {
    keywords: [
      "safe", "safety", "security", "danger", "crime", "risk assessment",
      "threat", "stability",
      // fr
      "sécurité", "sûreté", "danger", "criminalité", "risque", "menace",
      "sûr", "stable",
      // es
      "seguridad", "seguro", "peligro", "crimen", "criminalidad", "riesgo",
      "amenaza", "estable",
      // pt
      "segurança", "seguro", "perigo", "crime", "criminalidade", "risco",
      "ameaça", "estável",
    ],
    generate: (ctx) => generateSafetyResponse(ctx),
  },
  {
    keywords: [
      "tax", "taxes", "fiscal", "corporate tax", "income tax", "optimization",
      "tax-optimal", "jurisdiction", "tax efficiency",
      // fr
      "impôt", "impôts", "fiscal", "fiscalité", "optimisation fiscale",
      "taxe", "juridiction",
      // es
      "impuesto", "impuestos", "fiscal", "fiscalidad", "optimización fiscal",
      "jurisdicción",
      // pt
      "imposto", "impostos", "fiscal", "fiscalidade", "otimização fiscal",
      "jurisdição",
    ],
    generate: (ctx) => generateTaxResponse(ctx),
  },
  {
    keywords: [
      "visa", "residency", "permit", "immigra", "passport", "residency pathway",
      "citizenship", "work permit",
      // fr
      "visa", "résidence", "permis", "immigration", "passeport", "citoyenneté",
      "titre de séjour", "permis de travail",
      // es
      "visa", "visado", "residencia", "permiso", "inmigración", "pasaporte",
      "ciudadanía", "permiso de trabajo",
      // pt
      "visto", "residência", "permissão", "imigração", "passaporte", "cidadania",
      "autorização de trabalho",
    ],
    generate: (ctx) => generateVisaResponse(ctx),
  },
  {
    keywords: [
      "economy", "gdp", "economic", "invest", "growth", "market", "capital",
      "returns", "roi", "deploy capital",
      // fr
      "économie", "pib", "économique", "investir", "croissance", "marché",
      "rendement", "capital", "retour sur investissement",
      // es
      "economía", "pib", "económico", "invertir", "crecimiento", "mercado",
      "rendimiento", "capital", "retorno de inversión",
      // pt
      "economia", "pib", "econômico", "investir", "crescimento", "mercado",
      "rendimento", "capital", "retorno de investimento",
    ],
    generate: (ctx) => generateEconomyResponse(ctx),
  },
  {
    keywords: [
      "military", "defense", "army", "nuclear", "geopolit", "war", "power",
      "defense alliance", "threat assessment",
      // fr
      "militaire", "défense", "armée", "nucléaire", "géopolit", "guerre",
      "puissance", "alliance",
      // es
      "militar", "defensa", "ejército", "nuclear", "geopolít", "guerra",
      "potencia", "alianza",
      // pt
      "militar", "defesa", "exército", "nuclear", "geopolít", "guerra",
      "potência", "aliança",
    ],
    generate: (ctx) => generateMilitaryResponse(ctx),
  },
  {
    keywords: [
      "climate", "weather", "temperature", "hot", "cold", "warm", "tropical",
      "seasons",
      // fr
      "climat", "météo", "température", "chaud", "froid", "tropical",
      "saisons", "temps",
      // es
      "clima", "tiempo", "temperatura", "calor", "frío", "tropical",
      "estaciones",
      // pt
      "clima", "tempo", "temperatura", "quente", "frio", "tropical",
      "estações",
    ],
    generate: (ctx) => generateClimateResponse(ctx),
  },
  {
    keywords: [
      "government", "politic", "leader", "president", "prime minister", "democracy",
      "governance", "regime", "rule of law",
      // fr
      "gouvernement", "politique", "dirigeant", "président", "premier ministre",
      "démocratie", "gouvernance",
      // es
      "gobierno", "política", "líder", "presidente", "primer ministro",
      "democracia", "gobernanza",
      // pt
      "governo", "política", "líder", "presidente", "primeiro-ministro",
      "democracia", "governança",
    ],
    generate: (ctx) => generateGovernmentResponse(ctx),
  },
  {
    keywords: [
      "why", "best", "top", "#1", "number one", "first",
      "incorporate", "set up business", "business setup",
      // fr
      "pourquoi", "meilleur", "premier", "numéro un",
      "créer une entreprise", "monter une société",
      // es
      "por qué", "mejor", "primero", "número uno",
      "crear empresa", "montar negocio",
      // pt
      "por que", "melhor", "primeiro", "número um",
      "criar empresa", "montar negócio",
    ],
    generate: (ctx, q) => {
      const country = findCountryInQuestion(q);
      if (country) return generateCountryDeepDive(country, ctx);
      return generateBestForYou(ctx);
    },
  },
  {
    keywords: [
      "family", "children", "kids", "school", "education",
      // fr
      "famille", "enfants", "école", "éducation",
      // es
      "familia", "niños", "hijos", "escuela", "educación",
      // pt
      "família", "crianças", "filhos", "escola", "educação",
    ],
    generate: (ctx) => generateSafetyResponse(ctx),
  },
  {
    keywords: [
      "quality of life", "livability", "healthcare", "health", "life expectancy",
      "lifestyle", "best balance",
      // fr
      "qualité de vie", "habitabilité", "santé", "espérance de vie",
      "cadre de vie", "meilleur équilibre",
      // es
      "calidad de vida", "habitabilidad", "salud", "esperanza de vida",
      "estilo de vida", "mejor equilibrio",
      // pt
      "qualidade de vida", "habitabilidade", "saúde", "expectativa de vida",
      "estilo de vida", "melhor equilíbrio",
    ],
    generate: (ctx) => generateCostResponse(ctx),
  },
];

// ---------------------------------------------------------------------------
// Main response generator
// ---------------------------------------------------------------------------

/**
 * Generate an expert AI response with premium structured format.
 */
export async function generateResponse(
  question: string,
  ctx: AIContext
): Promise<string> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

  const q = question.toLowerCase();

  // Specific country deep dive — broad multilingual trigger
  const specificCountry = findCountryInQuestion(q);
  const deepDiveTriggers = [
    "about", "tell", "analyze", "detail", "briefing", "profile", "intelligence",
    "parle", "analyse", "détail", "profil",
    "cuéntame", "analizar", "detalle", "perfil", "informe",
    "fale", "analisar", "detalhe", "perfil",
  ];
  const comparisonTriggers = ["compare", "vs", "versus", "comparer", "comparar", "frente"];

  if (specificCountry && !comparisonTriggers.some((t) => q.includes(t)) && deepDiveTriggers.some((t) => q.includes(t))) {
    return generateCountryDeepDive(specificCountry, ctx);
  }

  // Pattern matching
  for (const pattern of PATTERNS) {
    if (pattern.keywords.some((kw) => q.includes(kw))) {
      return pattern.generate(ctx, question);
    }
  }

  // Module-aware fallback: if a module is active, route to the relevant generator
  if (ctx.activeModule) {
    const moduleRoutes: Record<string, (ctx: AIContext) => string> = {
      tax: generateTaxResponse,
      safety: generateSafetyResponse,
      investment: generateEconomyResponse,
      business: generateEconomyResponse,
      war_risk: generateMilitaryResponse,
      cost_of_living: generateCostResponse,
      visa: generateVisaResponse,
      quality_of_life: generateCostResponse,
    };
    const moduleGenerator = moduleRoutes[ctx.activeModule];
    if (moduleGenerator) return moduleGenerator(ctx);
  }

  // Default: always give a useful decision
  return generateBestForYou(ctx);
}
