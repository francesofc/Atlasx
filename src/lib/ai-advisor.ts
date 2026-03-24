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
  const budgetStr = budgetLabel(profile.budgetRange, locale);
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

  // Add a proper opening when nationality is missing
  const withPrefix = { en: "With ", fr: "Avec ", es: "Con ", pt: "Com " };
  const needsPrefix = !profile.nationality;
  const prefix = needsPrefix ? withPrefix[locale] : "";

  // Build one or two sentences from parts
  const suffix = { en: ", here's my assessment.", fr: ", voici mon analyse.", es: ", aquí está mi análisis.", pt: ", aqui está minha análise." }[locale];

  if (parts.length <= 2) {
    const joined = parts.join(locale === "en" ? " and " : locale === "fr" ? " et " : locale === "es" ? " y " : " e ");
    return prefix + joined + suffix;
  }

  const connector = ", ";
  const lastConnector = locale === "en" ? ", and " : locale === "fr" ? " et " : locale === "es" ? " y " : " e ";
  const joined = parts.slice(0, -1).join(connector) + lastConnector + parts[parts.length - 1];
  return prefix + joined + " —" + suffix;
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
      vars.budget = budgetLabel(ctx.profile.budgetRange, locale);
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
    prompts.push(tpl("costOptimize", locale, { budget: budgetLabel(ctx.profile.budgetRange, locale) }));
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
- Goals: ${(profile.goals || [profile.goal]).map(g => goalLabel(g, locale)).join(", ")}
- Budget: ${budgetLabel(profile.budgetRange, locale)}
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

function goalLabel(goal: string, locale: Locale = "en"): string {
  const labels: Record<string, Record<Locale, string>> = {
    low_taxes: { en: "low taxes", fr: "fiscalité réduite", es: "baja fiscalidad", pt: "baixa tributação" },
    save_money: { en: "saving money", fr: "économie budgétaire", es: "ahorro", pt: "economia" },
    quality_of_life: { en: "high quality of life", fr: "qualité de vie élevée", es: "alta calidad de vida", pt: "alta qualidade de vida" },
    business: { en: "business expansion", fr: "développement d'activité", es: "expansión de negocio", pt: "expansão de negócios" },
    remote_work: { en: "remote work", fr: "travail à distance", es: "trabajo remoto", pt: "trabalho remoto" },
    investment: { en: "investment", fr: "investissement", es: "inversión", pt: "investimento" },
    expatriation: { en: "expatriation", fr: "expatriation", es: "expatriación", pt: "expatriação" },
    exploration: { en: "exploration", fr: "exploration", es: "exploración", pt: "exploração" },
  };
  return labels[goal]?.[locale] || labels[goal]?.en || goal;
}

function budgetLabel(range: string, locale: Locale = "en"): string {
  const labels: Record<string, Record<Locale, string>> = {
    under_1000: { en: "under $1,000/month", fr: "moins de 1 000 $/mois", es: "menos de $1.000/mes", pt: "menos de $1.000/mês" },
    "1000_2000": { en: "$1,000-$2,000/month", fr: "1 000-2 000 $/mois", es: "$1.000-$2.000/mes", pt: "$1.000-$2.000/mês" },
    "1000_3000": { en: "$1,000-$3,000/month", fr: "1 000-3 000 $/mois", es: "$1.000-$3.000/mes", pt: "$1.000-$3.000/mês" },
    "2000_4000": { en: "$2,000-$4,000/month", fr: "2 000-4 000 $/mois", es: "$2.000-$4.000/mes", pt: "$2.000-$4.000/mês" },
    "3000_5000": { en: "$3,000-$5,000/month", fr: "3 000-5 000 $/mois", es: "$3.000-$5.000/mes", pt: "$3.000-$5.000/mês" },
    "4000_plus": { en: "$4,000+/month", fr: "4 000 $+/mois", es: "$4.000+/mes", pt: "$4.000+/mês" },
    "5000_plus": { en: "$5,000+/month", fr: "5 000 $+/mois", es: "$5.000+/mes", pt: "$5.000+/mês" },
  };
  return labels[range]?.[locale] || labels[range]?.en || range;
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
  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(g => goalLabel(g, locale)).join(", ");
  const budget = budgetLabel(ctx.profile.budgetRange, locale);
  const nat = ctx.profile.nationality || "";

  // Find best-in-class for each dimension
  const bestTax = ranked.filter(c => c.tax.level === "low")[0] || ranked[0];
  const bestSafety = [...ranked].sort((a, b) => b.safety.safety_index - a.safety.safety_index)[0];
  const bestCost = [...ranked].sort((a, b) => a.cost_of_living.index - b.cost_of_living.index)[0];

  const taxLevelL: Record<string, Record<Locale, string>> = {
    low: { en: "low", fr: "faible", es: "baja", pt: "baixa" },
    medium: { en: "moderate", fr: "modérée", es: "moderada", pt: "moderada" },
    high: { en: "high", fr: "élevée", es: "alta", pt: "alta" },
  };
  const visaL: Record<string, Record<Locale, string>> = {
    easy: { en: "easy", fr: "facile", es: "fácil", pt: "fácil" },
    medium: { en: "moderate", fr: "modéré", es: "moderado", pt: "moderado" },
    hard: { en: "restricted", fr: "restreint", es: "restringido", pt: "restrito" },
  };
  const stabilityL: Record<string, Record<Locale, string>> = {
    stable: { en: "stable", fr: "stable", es: "estable", pt: "estável" },
    moderate: { en: "moderate", fr: "modérée", es: "moderada", pt: "moderada" },
    unstable: { en: "unstable", fr: "instable", es: "inestable", pt: "instável" },
  };
  const tl = (level: string) => taxLevelL[level]?.[locale] || level;
  const vl = (level: string) => visaL[level]?.[locale] || level;
  const sl = (level: string) => stabilityL[level]?.[locale] || level;

  let out = "";

  if (lens) {
    out += `*${lens.prefix}.*\n\n`;
  }

  // --- Locale-native response ---
  if (locale === "fr") {
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += `**${best.name[locale]}** est votre meilleur choix stratégique${m ? ` (score : ${m.score}/100)` : ""}. `;
    if (nat) out += `Pour un profil ${nat} `;
    out += `orienté ${goals} avec un budget de ${budget}, `;
    out += `c'est le pays qui offre le meilleur équilibre entre vos priorités.\n\n`;

    // WHY this country wins
    out += `**Pourquoi ${best.name[locale]} l'emporte**:\n`;
    out += `→ Fiscalité ${tl(best.tax.level)} — revenu : ${best.tax.income_tax}, sociétés : ${best.tax.corporate_tax}\n`;
    out += `→ Sécurité ${best.safety.safety_index}/100 — stabilité ${sl(best.government.political_stability)}\n`;
    out += `→ Accès résidence ${vl(best.visa.ease_of_access)} — ${best.visa.residency_options.split(",")[0]}\n`;
    out += `→ Coût de vie index ${best.cost_of_living.index}/100 — PIB/hab $${fmt(best.economy.gdp_per_capita)}\n\n`;

    // Decision framework
    if (bestTax.iso_code !== best.iso_code) {
      out += `**Meilleur choix fiscal** : **${bestTax.name[locale]}** — fiscalité ${tl(bestTax.tax.level)} (${bestTax.tax.income_tax}), mais sécurité ${bestTax.safety.safety_index}/100${bestTax.safety.safety_index < 55 ? " — un compromis sur la sûreté" : ""}.\n\n`;
    }
    if (bestSafety.iso_code !== best.iso_code) {
      out += `**Meilleur choix sécurité** : **${bestSafety.name[locale]}** — index ${bestSafety.safety.safety_index}/100, mais fiscalité ${tl(bestSafety.tax.level)} (${bestSafety.tax.income_tax})${bestSafety.tax.level === "high" ? " — charge fiscale significative" : ""}.\n\n`;
    }

    // Why alternatives are behind
    out += `**Pourquoi les alternatives sont en retrait**:\n`;
    out += `→ **${alt1.name[locale]}** : fiscalité ${tl(alt1.tax.level)} (${alt1.tax.income_tax}), sécurité ${alt1.safety.safety_index}/100`;
    if (alt1.tax.level !== "low" && best.tax.level === "low") out += ` — pénalisé par la charge fiscale`;
    else if (alt1.safety.safety_index < best.safety.safety_index) out += ` — score de sécurité inférieur`;
    out += `\n`;
    out += `→ **${alt2.name[locale]}** : fiscalité ${tl(alt2.tax.level)} (${alt2.tax.income_tax}), sécurité ${alt2.safety.safety_index}/100`;
    if (alt2.cost_of_living.index > best.cost_of_living.index + 15) out += ` — coût de vie nettement plus élevé`;
    else if (alt2.visa.ease_of_access === "hard") out += ` — accès résidence restreint`;
    out += `\n\n`;

    // Trade-off accepted
    out += `**${sH("theTradeoff", locale)}**:\n`;
    if (best.tax.level !== "low") out += `En choisissant ${best.name[locale]}, vous acceptez une fiscalité ${tl(best.tax.level)} en échange d'une sécurité de ${best.safety.safety_index}/100 et d'une stabilité ${sl(best.government.political_stability)}. `;
    else if (best.safety.safety_index < 60) out += `En choisissant ${best.name[locale]}, vous privilégiez la fiscalité ${tl(best.tax.level)} au détriment d'un score de sécurité de ${best.safety.safety_index}/100. `;
    else out += `${best.name[locale]} combine fiscalité ${tl(best.tax.level)} et sécurité solide (${best.safety.safety_index}/100) — un compromis rare et favorable. `;
    out += `Votre budget de ${budget} ${best.cost_of_living.index <= 45 ? "offre un pouvoir d'achat confortable ici" : best.cost_of_living.index <= 65 ? "est viable avec une gestion rigoureuse" : "sera mis à l'épreuve par le coût de vie local"}.\n\n`;

    // Strategic note
    out += `**${sH("strategicNote", locale)}**:\n`;
    out += `${buildStrategicNote(best, locale)}\n\n`;

    // Final recommendation
    out += `**Recommandation finale**:\n`;
    out += `${best.name[locale]} est le choix le plus cohérent pour votre profil. `;
    out += `Prochaine étape : demandez un briefing complet sur ${best.name[locale]} ou comparez-le directement avec ${alt1.name[locale]}.`;
  } else if (locale === "es") {
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += `**${best.name[locale]}** es su mejor opción estratégica${m ? ` (puntuación: ${m.score}/100)` : ""}. `;
    if (nat) out += `Para un perfil ${nat} `;
    out += `orientado a ${goals} con presupuesto de ${budget}, `;
    out += `es el país que ofrece el mejor equilibrio entre sus prioridades.\n\n`;

    out += `**Por qué ${best.name[locale]} gana**:\n`;
    out += `→ Fiscalidad ${tl(best.tax.level)} — renta: ${best.tax.income_tax}, corporativo: ${best.tax.corporate_tax}\n`;
    out += `→ Seguridad ${best.safety.safety_index}/100 — estabilidad ${sl(best.government.political_stability)}\n`;
    out += `→ Acceso residencia ${vl(best.visa.ease_of_access)} — ${best.visa.residency_options.split(",")[0]}\n`;
    out += `→ Costo de vida index ${best.cost_of_living.index}/100 — PIB/cap $${fmt(best.economy.gdp_per_capita)}\n\n`;

    out += `**Por qué las alternativas quedan atrás**:\n`;
    out += `→ **${alt1.name[locale]}**: fiscalidad ${tl(alt1.tax.level)}, seguridad ${alt1.safety.safety_index}/100\n`;
    out += `→ **${alt2.name[locale]}**: fiscalidad ${tl(alt2.tax.level)}, seguridad ${alt2.safety.safety_index}/100\n\n`;

    out += `**${sH("theTradeoff", locale)}**:\n`;
    out += `Al elegir ${best.name[locale]}, ${best.tax.level === "low" && best.safety.safety_index >= 60 ? "combina baja fiscalidad con seguridad sólida — un equilibrio poco frecuente" : "prioriza el equilibrio global entre fiscalidad, seguridad y accesibilidad"}.\n\n`;

    out += `**${sH("strategicNote", locale)}**:\n`;
    out += `${buildStrategicNote(best, locale)}\n\n`;

    out += `**Recomendación final**:\n`;
    out += `${best.name[locale]} es la opción más coherente para su perfil. Solicite un informe completo o compare con ${alt1.name[locale]}.`;
  } else if (locale === "pt") {
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += `**${best.name[locale]}** é sua melhor opção estratégica${m ? ` (pontuação: ${m.score}/100)` : ""}. `;
    if (nat) out += `Para um perfil ${nat} `;
    out += `orientado a ${goals} com orçamento de ${budget}, `;
    out += `é o país que oferece o melhor equilíbrio entre suas prioridades.\n\n`;

    out += `**Por que ${best.name[locale]} vence**:\n`;
    out += `→ Tributação ${tl(best.tax.level)} — renda: ${best.tax.income_tax}, corporativo: ${best.tax.corporate_tax}\n`;
    out += `→ Segurança ${best.safety.safety_index}/100 — estabilidade ${sl(best.government.political_stability)}\n`;
    out += `→ Acesso residência ${vl(best.visa.ease_of_access)} — ${best.visa.residency_options.split(",")[0]}\n`;
    out += `→ Custo de vida index ${best.cost_of_living.index}/100 — PIB/cap $${fmt(best.economy.gdp_per_capita)}\n\n`;

    out += `**Por que as alternativas ficam atrás**:\n`;
    out += `→ **${alt1.name[locale]}**: tributação ${tl(alt1.tax.level)}, segurança ${alt1.safety.safety_index}/100\n`;
    out += `→ **${alt2.name[locale]}**: tributação ${tl(alt2.tax.level)}, segurança ${alt2.safety.safety_index}/100\n\n`;

    out += `**${sH("strategicNote", locale)}**:\n`;
    out += `${buildStrategicNote(best, locale)}\n\n`;

    out += `**Recomendação final**:\n`;
    out += `${best.name[locale]} é a escolha mais coerente para seu perfil. Solicite um briefing completo ou compare com ${alt1.name[locale]}.`;
  } else {
    // English
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += `**${best.name[locale]}** is your strongest strategic match${m ? ` (score: ${m.score}/100)` : ""}. `;
    if (nat) out += `For a ${nat} profile `;
    out += `focused on ${goals} with a ${budget} budget, `;
    out += `this country delivers the best risk-adjusted fit across your priorities.\n\n`;

    out += `**Why ${best.name[locale]} wins**:\n`;
    out += `→ ${tl(best.tax.level).charAt(0).toUpperCase() + tl(best.tax.level).slice(1)} tax — income: ${best.tax.income_tax}, corporate: ${best.tax.corporate_tax}\n`;
    out += `→ Safety ${best.safety.safety_index}/100 — ${sl(best.government.political_stability)} governance\n`;
    out += `→ Residency access ${vl(best.visa.ease_of_access)} — ${best.visa.residency_options.split(",")[0]}\n`;
    out += `→ Cost of living index ${best.cost_of_living.index}/100 — GDP/cap $${fmt(best.economy.gdp_per_capita)}\n\n`;

    if (bestTax.iso_code !== best.iso_code) {
      out += `**Best fiscal option**: **${bestTax.name[locale]}** — ${tl(bestTax.tax.level)} tax (${bestTax.tax.income_tax}), but safety ${bestTax.safety.safety_index}/100${bestTax.safety.safety_index < 55 ? " — a security trade-off" : ""}.\n\n`;
    }
    if (bestSafety.iso_code !== best.iso_code) {
      out += `**Best safety option**: **${bestSafety.name[locale]}** — index ${bestSafety.safety.safety_index}/100, but ${tl(bestSafety.tax.level)} tax (${bestSafety.tax.income_tax})${bestSafety.tax.level === "high" ? " — significant fiscal burden" : ""}.\n\n`;
    }

    out += `**Why the alternatives fall behind**:\n`;
    out += `→ **${alt1.name[locale]}**: ${tl(alt1.tax.level)} tax (${alt1.tax.income_tax}), safety ${alt1.safety.safety_index}/100\n`;
    out += `→ **${alt2.name[locale]}**: ${tl(alt2.tax.level)} tax (${alt2.tax.income_tax}), safety ${alt2.safety.safety_index}/100\n\n`;

    out += `**${sH("theTradeoff", locale)}**:\n`;
    if (best.tax.level === "low" && best.safety.safety_index >= 60) out += `${best.name[locale]} combines low taxation with solid security (${best.safety.safety_index}/100) — a rare and favorable balance. `;
    else out += `Choosing ${best.name[locale]} means prioritizing the overall balance of tax, safety, and accessibility. `;
    out += `Your ${budget} budget ${best.cost_of_living.index <= 45 ? "provides comfortable purchasing power here" : best.cost_of_living.index <= 65 ? "is workable with disciplined planning" : "will be challenged by local cost levels"}.\n\n`;

    out += `**${sH("strategicNote", locale)}**:\n`;
    out += `${buildStrategicNote(best, locale)}\n\n`;

    out += `**Final recommendation**:\n`;
    out += `${best.name[locale]} is the most coherent choice for your profile. Next step: request a full briefing on ${best.name[locale]} or compare head-to-head with ${alt1.name[locale]}.`;
  }

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
  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(g => goalLabel(g, locale)).join(", ");
  const nat = ctx.profile.nationality || "";

  const taxOrder = { low: 0, medium: 1, high: 2 };
  const visaOrder = { easy: 0, medium: 1, hard: 2 };
  const taxL: Record<string, Record<Locale, string>> = {
    low: { en: "low", fr: "faible", es: "baja", pt: "baixa" },
    medium: { en: "moderate", fr: "modérée", es: "moderada", pt: "moderada" },
    high: { en: "high", fr: "élevée", es: "alta", pt: "alta" },
  };
  const visaL: Record<string, Record<Locale, string>> = {
    easy: { en: "easy", fr: "facile", es: "fácil", pt: "fácil" },
    medium: { en: "moderate", fr: "modéré", es: "moderado", pt: "moderado" },
    hard: { en: "restricted", fr: "restreint", es: "restringido", pt: "restrito" },
  };
  const tl = (l: string) => taxL[l]?.[locale] || l;
  const vl = (l: string) => visaL[l]?.[locale] || l;

  // Build advantages in locale
  function buildAdvantages(w: Country, l: Country): string[] {
    const adv: string[] = [];
    if (w.safety.safety_index > l.safety.safety_index) {
      const diff = w.safety.safety_index - l.safety.safety_index;
      adv.push(locale === "fr" ? `Sécurité ${w.safety.safety_index} vs ${l.safety.safety_index} — ${diff} points d'avance`
        : locale === "es" ? `Seguridad ${w.safety.safety_index} vs ${l.safety.safety_index} — ${diff} puntos de ventaja`
        : locale === "pt" ? `Segurança ${w.safety.safety_index} vs ${l.safety.safety_index} — ${diff} pontos à frente`
        : `Safety ${w.safety.safety_index} vs ${l.safety.safety_index} — ${diff} points ahead`);
    }
    if (w.economy.gdp_per_capita > l.economy.gdp_per_capita) {
      adv.push(locale === "fr" ? `PIB/hab $${fmt(w.economy.gdp_per_capita)} vs $${fmt(l.economy.gdp_per_capita)} — base économique plus solide`
        : locale === "es" ? `PIB/cap $${fmt(w.economy.gdp_per_capita)} vs $${fmt(l.economy.gdp_per_capita)} — base económica más fuerte`
        : locale === "pt" ? `PIB/cap $${fmt(w.economy.gdp_per_capita)} vs $${fmt(l.economy.gdp_per_capita)} — base econômica mais forte`
        : `GDP/cap $${fmt(w.economy.gdp_per_capita)} vs $${fmt(l.economy.gdp_per_capita)} — stronger economic base`);
    }
    if (w.cost_of_living.index < l.cost_of_living.index) {
      const diff = l.cost_of_living.index - w.cost_of_living.index;
      adv.push(locale === "fr" ? `Coût de vie ${w.cost_of_living.index} vs ${l.cost_of_living.index} — ${diff} points moins cher`
        : locale === "es" ? `Costo de vida ${w.cost_of_living.index} vs ${l.cost_of_living.index} — ${diff} puntos más económico`
        : locale === "pt" ? `Custo de vida ${w.cost_of_living.index} vs ${l.cost_of_living.index} — ${diff} pontos mais barato`
        : `Cost of living ${w.cost_of_living.index} vs ${l.cost_of_living.index} — ${diff} points cheaper`);
    }
    if (taxOrder[w.tax.level] < taxOrder[l.tax.level]) {
      adv.push(locale === "fr" ? `Fiscalité ${tl(w.tax.level)} (${w.tax.income_tax}) vs ${tl(l.tax.level)} (${l.tax.income_tax})`
        : locale === "es" ? `Fiscalidad ${tl(w.tax.level)} (${w.tax.income_tax}) vs ${tl(l.tax.level)} (${l.tax.income_tax})`
        : locale === "pt" ? `Tributação ${tl(w.tax.level)} (${w.tax.income_tax}) vs ${tl(l.tax.level)} (${l.tax.income_tax})`
        : `Tax ${tl(w.tax.level)} (${w.tax.income_tax}) vs ${tl(l.tax.level)} (${l.tax.income_tax})`);
    }
    if (visaOrder[w.visa.ease_of_access] < visaOrder[l.visa.ease_of_access]) {
      adv.push(locale === "fr" ? `Accès résidence ${vl(w.visa.ease_of_access)} vs ${vl(l.visa.ease_of_access)}`
        : locale === "es" ? `Acceso residencia ${vl(w.visa.ease_of_access)} vs ${vl(l.visa.ease_of_access)}`
        : locale === "pt" ? `Acesso residência ${vl(w.visa.ease_of_access)} vs ${vl(l.visa.ease_of_access)}`
        : `Residency access ${vl(w.visa.ease_of_access)} vs ${vl(l.visa.ease_of_access)}`);
    }
    if (adv.length === 0) {
      adv.push(locale === "fr" ? `Meilleur alignement global avec votre profil`
        : locale === "es" ? `Mejor alineación global con su perfil`
        : locale === "pt" ? `Melhor alinhamento global com seu perfil`
        : `Stronger overall profile alignment`);
    }
    return adv;
  }

  const winAdv = buildAdvantages(winner, loser);
  const loseAdv = buildAdvantages(loser, winner);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${a.name[locale]} vs ${b.name[locale]}\n\n`;

  // Locale-native verdict
  if (locale === "fr") {
    out += `**${sH("verdict", locale)}** : **${winner.name[locale]}** l'emporte pour un profil ${nat ? nat + " " : ""}orienté ${goals}.\n\n`;
    out += `**${sH("whereLeads", locale, { name: winner.name[locale] })}** :\n`;
    out += winAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("whereLeads", locale, { name: loser.name[locale] })}** :\n`;
    out += loseAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("theTradeoff", locale)}** :\n`;
    out += `${winner.name[locale]} offre les fondamentaux les plus solides pour votre profil. ${loser.name[locale]} ${loseAdv.length > 0 ? "se distingue par " + loseAdv[0].toLowerCase().split(" — ")[0] : "propose un cadre de vie différent"}, mais cela ne compense pas l'écart sur vos priorités principales.\n\n`;
    out += `**${sH("bestForProfiles", locale)}** :\n`;
    out += `• **${winner.name[locale]}** : ${buildBestFitDescription(winner, locale)}\n`;
    out += `• **${loser.name[locale]}** : ${buildBestFitDescription(loser, locale)}\n\n`;
    out += `**${sH("nextMove", locale)}** :\n`;
    out += `Demandez un briefing complet sur ${winner.name[locale]} pour explorer les voies de résidence et l'optimisation fiscale.`;
  } else if (locale === "es") {
    out += `**${sH("verdict", locale)}**: **${winner.name[locale]}** gana para un perfil ${nat ? nat + " " : ""}orientado a ${goals}.\n\n`;
    out += `**${sH("whereLeads", locale, { name: winner.name[locale] })}**:\n`;
    out += winAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("whereLeads", locale, { name: loser.name[locale] })}**:\n`;
    out += loseAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("theTradeoff", locale)}**:\n`;
    out += `${winner.name[locale]} ofrece los fundamentos más sólidos para su perfil. ${loser.name[locale]} se destaca por ${loseAdv[0]?.toLowerCase().split(" — ")[0] || "otros aspectos"}, pero no compensa la diferencia en sus prioridades principales.\n\n`;
    out += `**${sH("bestForProfiles", locale)}**:\n`;
    out += `• **${winner.name[locale]}**: ${buildBestFitDescription(winner, locale)}\n`;
    out += `• **${loser.name[locale]}**: ${buildBestFitDescription(loser, locale)}\n\n`;
    out += `**${sH("nextMove", locale)}**:\n`;
    out += `Solicite un informe completo sobre ${winner.name[locale]} para explorar vías de residencia y optimización fiscal.`;
  } else if (locale === "pt") {
    out += `**${sH("verdict", locale)}**: **${winner.name[locale]}** vence para um perfil ${nat ? nat + " " : ""}orientado a ${goals}.\n\n`;
    out += `**${sH("whereLeads", locale, { name: winner.name[locale] })}**:\n`;
    out += winAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("whereLeads", locale, { name: loser.name[locale] })}**:\n`;
    out += loseAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("theTradeoff", locale)}**:\n`;
    out += `${winner.name[locale]} oferece os fundamentos mais sólidos para seu perfil. ${loser.name[locale]} se destaca por ${loseAdv[0]?.toLowerCase().split(" — ")[0] || "outros aspectos"}, mas não compensa a diferença em suas prioridades principais.\n\n`;
    out += `**${sH("nextMove", locale)}**:\n`;
    out += `Solicite um briefing completo sobre ${winner.name[locale]} para explorar vias de residência e otimização fiscal.`;
  } else {
    out += `**${sH("verdict", locale)}**: **${winner.name[locale]}** wins for ${nat ? `a ${nat}` : "your"} ${goals} profile.\n\n`;
    out += `**${sH("whereLeads", locale, { name: winner.name[locale] })}**:\n`;
    out += winAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("whereLeads", locale, { name: loser.name[locale] })}**:\n`;
    out += loseAdv.slice(0, 4).map(a => `→ ${a}`).join("\n") + "\n\n";
    out += `**${sH("theTradeoff", locale)}**:\n`;
    out += `${winner.name[locale]} delivers the strongest fundamentals for your profile. ${loser.name[locale]} counters with ${loseAdv[0]?.toLowerCase().split(" — ")[0] || "different trade-offs"}, but this doesn't offset the gap on your core priorities.\n\n`;
    out += `**${sH("bestForProfiles", locale)}**:\n`;
    out += `• **${winner.name[locale]}**: ${buildBestFitDescription(winner, locale)}\n`;
    out += `• **${loser.name[locale]}**: ${buildBestFitDescription(loser, locale)}\n\n`;
    out += `**${sH("nextMove", locale)}**:\n`;
    out += `Request a full intelligence briefing on ${winner.name[locale]} to explore residency pathways and tax optimization.`;
  }

  return out;
}

// ===== MULTI-CRITERIA — for complex questions combining tax+safety+business etc. =====
function generateMultiCriteriaAdvice(ctx: AIContext, question: string): string {
  const locale = ctx.locale;
  const ranked = rankCountries(ctx, allCountries.slice(0, 50));
  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(g => goalLabel(g, locale)).join(", ");
  const budget = budgetLabel(ctx.profile.budgetRange, locale);
  const nat = ctx.profile.nationality || "";

  // Find best for each axis
  const bestTax = allCountries.filter(c => c.tax.level === "low").sort((a, b) => profileScore(b, ctx) - profileScore(a, ctx))[0] || ranked[0];
  const bestSafety = [...allCountries.slice(0, 50)].sort((a, b) => b.safety.safety_index - a.safety.safety_index)[0];
  const bestBalance = ranked[0]; // Overall best fit
  const bestBudget = [...allCountries.slice(0, 50)].filter(c => c.cost_of_living.index <= 50 && c.safety.safety_index >= 45).sort((a, b) => profileScore(b, ctx) - profileScore(a, ctx))[0] || ranked[2];

  const taxL: Record<string, Record<Locale, string>> = {
    low: { en: "low", fr: "faible", es: "baja", pt: "baixa" },
    medium: { en: "moderate", fr: "modérée", es: "moderada", pt: "moderada" },
    high: { en: "high", fr: "élevée", es: "alta", pt: "alta" },
  };
  const tl = (l: string) => taxL[l]?.[locale] || l;

  let out = "";

  if (locale === "fr") {
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += nat ? `Pour un profil ${nat} cherchant à optimiser fiscalité et sécurité avec un budget de ${budget}, voici mon analyse.\n\n`
      : `Pour un profil orienté ${goals} avec un budget de ${budget}, voici mon analyse stratégique.\n\n`;

    out += `**Recommandation principale : ${bestBalance.name[locale]}**\n`;
    out += `→ Fiscalité ${tl(bestBalance.tax.level)} (${bestBalance.tax.income_tax} revenu, ${bestBalance.tax.corporate_tax} sociétés)\n`;
    out += `→ Sécurité ${bestBalance.safety.safety_index}/100, stabilité ${bestBalance.government.political_stability}\n`;
    out += `→ Coût de vie ${bestBalance.cost_of_living.index}/100, PIB/hab $${fmt(bestBalance.economy.gdp_per_capita)}\n`;
    out += `→ Accès résidence ${bestBalance.visa.ease_of_access}\n\n`;

    out += `**Pourquoi ${bestBalance.name[locale]} l'emporte** : `;
    if (bestBalance.tax.level === "low" && bestBalance.safety.safety_index >= 60) {
      out += `C'est l'un des rares pays à combiner une fiscalité ${tl(bestBalance.tax.level)} avec un indice de sécurité solide (${bestBalance.safety.safety_index}/100). Pour un entrepreneur, ce double avantage est décisif.\n\n`;
    } else {
      out += `Il offre le meilleur compromis global entre vos critères prioritaires. Aucune autre juridiction ne rivalise sur l'ensemble des axes simultanément.\n\n`;
    }

    if (bestTax.iso_code !== bestBalance.iso_code) {
      out += `**Meilleur choix fiscal** : **${bestTax.name[locale]}** — ${bestTax.tax.income_tax} revenu, ${bestTax.tax.corporate_tax} sociétés. Mais sécurité ${bestTax.safety.safety_index}/100${bestTax.safety.safety_index < 55 ? " — un compromis significatif" : ""}.\n\n`;
    }
    if (bestSafety.iso_code !== bestBalance.iso_code) {
      out += `**Meilleur choix sécurité** : **${bestSafety.name[locale]}** — index ${bestSafety.safety.safety_index}/100. Mais fiscalité ${tl(bestSafety.tax.level)} (${bestSafety.tax.income_tax})${bestSafety.tax.level === "high" ? " — charge élevée" : ""}.\n\n`;
    }
    if (bestBudget.iso_code !== bestBalance.iso_code && bestBudget.iso_code !== bestTax.iso_code) {
      out += `**Alternative budget-compatible** : **${bestBudget.name[locale]}** — coût ${bestBudget.cost_of_living.index}/100, fiscalité ${tl(bestBudget.tax.level)}, sécurité ${bestBudget.safety.safety_index}/100.\n\n`;
    }

    out += `**${sH("theTradeoff", locale)}** :\n`;
    out += `Optimiser la fiscalité sans sacrifier la sécurité élimine de nombreuses juridictions. Les pays à fiscalité nulle (type paradis fiscaux) affichent souvent des indices de sécurité en dessous de 50. ${bestBalance.name[locale]} est le compromis le plus intelligent pour votre profil.\n\n`;

    out += `**Recommandation finale** :\n`;
    out += `${bestBalance.name[locale]} est votre meilleur choix. Demandez un briefing stratégique complet ou comparez-le avec ${bestTax.iso_code !== bestBalance.iso_code ? bestTax.name[locale] : ranked[1].name[locale]}.`;
  } else if (locale === "es") {
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += `${nat ? `Para un perfil ${nat} ` : ""}buscando optimizar fiscalidad y seguridad con presupuesto de ${budget}, este es mi análisis.\n\n`;
    out += `**Recomendación principal: ${bestBalance.name[locale]}**\n`;
    out += `→ Fiscalidad ${tl(bestBalance.tax.level)} (${bestBalance.tax.income_tax} renta, ${bestBalance.tax.corporate_tax} corporativo)\n`;
    out += `→ Seguridad ${bestBalance.safety.safety_index}/100, estabilidad ${bestBalance.government.political_stability}\n`;
    out += `→ Costo de vida ${bestBalance.cost_of_living.index}/100\n\n`;
    out += `**Por qué gana**: Ofrece el mejor equilibrio global entre fiscalidad, seguridad y accesibilidad para su perfil.\n\n`;
    if (bestTax.iso_code !== bestBalance.iso_code) {
      out += `**Mejor opción fiscal**: **${bestTax.name[locale]}** — ${bestTax.tax.income_tax}, pero seguridad ${bestTax.safety.safety_index}/100.\n\n`;
    }
    out += `**Recomendación final**: ${bestBalance.name[locale]} es su mejor opción. Solicite un informe completo o compare con ${ranked[1].name[locale]}.`;
  } else if (locale === "pt") {
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += `${nat ? `Para um perfil ${nat} ` : ""}buscando otimizar tributação e segurança com orçamento de ${budget}, esta é minha análise.\n\n`;
    out += `**Recomendação principal: ${bestBalance.name[locale]}**\n`;
    out += `→ Tributação ${tl(bestBalance.tax.level)} (${bestBalance.tax.income_tax} renda, ${bestBalance.tax.corporate_tax} corporativo)\n`;
    out += `→ Segurança ${bestBalance.safety.safety_index}/100, estabilidade ${bestBalance.government.political_stability}\n`;
    out += `→ Custo de vida ${bestBalance.cost_of_living.index}/100\n\n`;
    out += `**Por que vence**: Oferece o melhor equilíbrio global entre tributação, segurança e acessibilidade para seu perfil.\n\n`;
    if (bestTax.iso_code !== bestBalance.iso_code) {
      out += `**Melhor opção fiscal**: **${bestTax.name[locale]}** — ${bestTax.tax.income_tax}, mas segurança ${bestTax.safety.safety_index}/100.\n\n`;
    }
    out += `**Recomendação final**: ${bestBalance.name[locale]} é sua melhor opção. Solicite um briefing completo ou compare com ${ranked[1].name[locale]}.`;
  } else {
    out += `## ${sH("executiveSummary", locale)}\n\n`;
    out += `${nat ? `For a ${nat} profile ` : ""}optimizing tax and security with a ${budget} budget, here's my assessment.\n\n`;
    out += `**Top recommendation: ${bestBalance.name[locale]}**\n`;
    out += `→ ${tl(bestBalance.tax.level).charAt(0).toUpperCase() + tl(bestBalance.tax.level).slice(1)} tax (${bestBalance.tax.income_tax} income, ${bestBalance.tax.corporate_tax} corporate)\n`;
    out += `→ Safety ${bestBalance.safety.safety_index}/100, ${bestBalance.government.political_stability} governance\n`;
    out += `→ Cost of living ${bestBalance.cost_of_living.index}/100, GDP/cap $${fmt(bestBalance.economy.gdp_per_capita)}\n\n`;
    out += `**Why it wins**: Best risk-adjusted balance of tax efficiency, security, and accessibility for your profile.\n\n`;
    if (bestTax.iso_code !== bestBalance.iso_code) {
      out += `**Best fiscal option**: **${bestTax.name[locale]}** — ${bestTax.tax.income_tax} income tax, but safety ${bestTax.safety.safety_index}/100.\n\n`;
    }
    if (bestSafety.iso_code !== bestBalance.iso_code) {
      out += `**Best safety option**: **${bestSafety.name[locale]}** — ${bestSafety.safety.safety_index}/100, but ${tl(bestSafety.tax.level)} tax.\n\n`;
    }
    out += `**Final recommendation**: ${bestBalance.name[locale]} is your strongest choice. Request a full briefing or compare with ${ranked[1].name[locale]}.`;
  }

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
  const ddTaxRegime = { en: "tax regime", fr: "régime fiscal", es: "régimen fiscal", pt: "regime fiscal" }[locale];
  const ddInc = { en: "Income", fr: "Revenu", es: "Renta", pt: "Renda" }[locale];
  const ddCorp = { en: "Corporate", fr: "Sociétés", es: "Corporativo", pt: "Corporativo" }[locale];
  const ddTaxLvl: Record<string, Record<Locale, string>> = {
    low: { en: "LOW", fr: "FAIBLE", es: "BAJA", pt: "BAIXA" },
    medium: { en: "MODERATE", fr: "MODÉRÉE", es: "MODERADA", pt: "MODERADA" },
    high: { en: "HIGH", fr: "ÉLEVÉE", es: "ALTA", pt: "ALTA" },
  };
  out += `${ddTaxLvl[c.tax.level]?.[locale] || c.tax.level.toUpperCase()} ${ddTaxRegime} — ${ddInc} : ${c.tax.income_tax}, ${ddCorp} : ${c.tax.corporate_tax}. `;
  out += c.tax.level === "low"
    ? (locale === "en" ? "Strong fiscal position for income retention." : locale === "fr" ? "Position fiscale forte pour la rétention de revenus." : locale === "es" ? "Posición fiscal fuerte para retención de ingresos." : "Posição fiscal forte para retenção de renda.")
    : c.tax.level === "medium"
    ? (locale === "en" ? "Balanced approach — look into treaty-based optimization." : locale === "fr" ? "Approche équilibrée — explorez l'optimisation par traités." : locale === "es" ? "Enfoque equilibrado — explore optimización por tratados." : "Abordagem equilibrada — explore otimização por tratados.")
    : (locale === "en" ? "High burden, but comprehensive public infrastructure compensates." : locale === "fr" ? "Charge élevée, mais infrastructure publique complète en compensation." : locale === "es" ? "Alta carga, pero infraestructura pública completa compensa." : "Alta carga, mas infraestrutura pública abrangente compensa.");
  out += "\n\n";

  // Security & Stability
  out += `**${sH("security", locale)}**:\n`;
  const ddSafety = { en: "Safety", fr: "Sécurité", es: "Seguridad", pt: "Segurança" }[locale];
  const ddCrime = { en: "Crime", fr: "Criminalité", es: "Crimen", pt: "Crime" }[locale];
  out += `${ddSafety} ${c.safety.safety_index}/100 | ${ddCrime} ${c.safety.crime_index}/100 | ${c.government.political_stability} — ${c.government.type}. `;
  out += c.safety.safety_index >= 65
    ? (locale === "en" ? "Above-threshold safety for families and solo expatriates alike." : locale === "fr" ? "Sécurité au-dessus du seuil pour familles et expatriés." : locale === "es" ? "Seguridad por encima del umbral para familias y expatriados." : "Segurança acima do limiar para famílias e expatriados.")
    : c.safety.safety_index >= 45
    ? (locale === "en" ? "Moderate — stick to established expatriate zones." : locale === "fr" ? "Modéré — restez dans les zones d'expatriés établies." : locale === "es" ? "Moderado — manténgase en zonas de expatriados establecidas." : "Moderado — fique em zonas de expatriados estabelecidas.")
    : (locale === "en" ? "Below average — private security and gated communities recommended." : locale === "fr" ? "En dessous de la moyenne — sécurité privée et résidences fermées recommandées." : locale === "es" ? "Por debajo del promedio — seguridad privada y comunidades cerradas recomendadas." : "Abaixo da média — segurança privada e condomínios fechados recomendados.");
  out += "\n\n";

  // Business & Investment
  out += `**${sH("businessInvestment", locale)}**:\n`;
  const ddGdp = { en: "GDP", fr: "PIB", es: "PIB", pt: "PIB" }[locale];
  const ddCap = { en: "capita", fr: "hab", es: "cap", pt: "cap" }[locale];
  const ddInd = { en: "Industries", fr: "Industries", es: "Industrias", pt: "Indústrias" }[locale];
  out += `${ddGdp} $${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)}/${ddCap}) | Inflation ${c.economy.inflation}% | ${ddInd} : ${c.main_industries.slice(0, 3).join(", ")}. `;
  out += c.economy.gdp_per_capita > 30000
    ? (locale === "en" ? "Mature market with high purchasing power." : locale === "fr" ? "Marché mature avec fort pouvoir d'achat." : locale === "es" ? "Mercado maduro con alto poder adquisitivo." : "Mercado maduro com alto poder de compra.")
    : c.economy.gdp_per_capita > 15000
    ? (locale === "en" ? "Emerging market with growth runway." : locale === "fr" ? "Marché émergent avec potentiel de croissance." : locale === "es" ? "Mercado emergente con potencial de crecimiento." : "Mercado emergente com potencial de crescimento.")
    : (locale === "en" ? "Frontier market — high risk, high potential reward." : locale === "fr" ? "Marché frontière — risque élevé, potentiel de rendement élevé." : locale === "es" ? "Mercado frontera — alto riesgo, alto potencial de retorno." : "Mercado fronteira — alto risco, alto potencial de retorno.");
  out += "\n\n";

  // Residency & Access
  out += `**${sH("residencyAccess", locale)}**:\n`;
  const ddAccess = { en: "access", fr: "accès", es: "acceso", pt: "acesso" }[locale];
  const ddVisaLvl: Record<string, Record<Locale, string>> = {
    easy: { en: "EASY", fr: "FACILE", es: "FÁCIL", pt: "FÁCIL" },
    medium: { en: "MODERATE", fr: "MODÉRÉ", es: "MODERADO", pt: "MODERADO" },
    hard: { en: "RESTRICTED", fr: "RESTREINT", es: "RESTRINGIDO", pt: "RESTRITO" },
  };
  out += `${ddVisaLvl[c.visa.ease_of_access]?.[locale] || c.visa.ease_of_access.toUpperCase()} ${ddAccess} — ${c.visa.residency_options}. `;
  out += c.visa.ease_of_access === "easy"
    ? (locale === "en" ? "Fast-track available — some pathways under 6 months." : locale === "fr" ? "Voie rapide disponible — certains parcours en moins de 6 mois." : locale === "es" ? "Vía rápida disponible — algunas vías en menos de 6 meses." : "Via rápida disponível — alguns caminhos em menos de 6 meses.")
    : c.visa.ease_of_access === "medium"
    ? (locale === "en" ? "Moderate timeline — plan 6-12 months for full processing." : locale === "fr" ? "Délai modéré — prévoyez 6-12 mois pour le traitement complet." : locale === "es" ? "Plazo moderado — planifique 6-12 meses para el procesamiento completo." : "Prazo moderado — planeje 6-12 meses para processamento completo.")
    : (locale === "en" ? "High barrier — requires significant documentation and patience." : locale === "fr" ? "Barrière élevée — nécessite une documentation importante et de la patience." : locale === "es" ? "Alta barrera — requiere documentación significativa y paciencia." : "Alta barreira — requer documentação significativa e paciência.");
  out += "\n\n";

  // Cost & Lifestyle
  out += `**${sH("costLifestyle", locale)}**:\n`;
  const ddCostIdx = { en: "Cost index", fr: "Indice de coût", es: "Índice de costo", pt: "Índice de custo" }[locale];
  const ddAvgSal = { en: "Avg salary", fr: "Salaire moy", es: "Salario prom", pt: "Salário méd" }[locale];
  const ddMo = { en: "mo", fr: "mois", es: "mes", pt: "mês" }[locale];
  out += `${ddCostIdx} ${c.cost_of_living.index}/100 | ${ddAvgSal} $${fmt(c.cost_of_living.average_salary)}/${ddMo} | ${c.climate.description[locale]}. `;
  out += c.cost_of_living.index <= 40
    ? (locale === "en" ? `Your ${budgetLabel(ctx.profile.budgetRange, locale)} budget goes far here.` : locale === "fr" ? `Votre budget de ${budgetLabel(ctx.profile.budgetRange, locale)} va loin ici.` : locale === "es" ? `Su presupuesto de ${budgetLabel(ctx.profile.budgetRange, locale)} rinde mucho aquí.` : `Seu orçamento de ${budgetLabel(ctx.profile.budgetRange, locale)} vai longe aqui.`)
    : c.cost_of_living.index <= 65
    ? (locale === "en" ? `Moderate costs — ${budgetLabel(ctx.profile.budgetRange, locale)} is workable with planning.` : locale === "fr" ? `Coûts modérés — ${budgetLabel(ctx.profile.budgetRange, locale)} est réalisable avec planification.` : locale === "es" ? `Costos moderados — ${budgetLabel(ctx.profile.budgetRange, locale)} es viable con planificación.` : `Custos moderados — ${budgetLabel(ctx.profile.budgetRange, locale)} é viável com planejamento.`)
    : (locale === "en" ? `Premium market — ${budgetLabel(ctx.profile.budgetRange, locale)} requires careful allocation.` : locale === "fr" ? `Marché premium — ${budgetLabel(ctx.profile.budgetRange, locale)} nécessite une allocation soigneuse.` : locale === "es" ? `Mercado premium — ${budgetLabel(ctx.profile.budgetRange, locale)} requiere asignación cuidadosa.` : `Mercado premium — ${budgetLabel(ctx.profile.budgetRange, locale)} requer alocação cuidadosa.`);
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
  out += locale === "fr" ? `**${best.name[locale]}** domine le classement nomade. Indice de coût ${best.cost_of_living.index}, visa ${best.visa.ease_of_access}, sécurité ${best.safety.safety_index}/100 — le trio gagnant pour les travailleurs à distance ${budgetLabel(ctx.profile.budgetRange, locale)}.\n\n`
    : locale === "es" ? `**${best.name[locale]}** domina el ranking nómada. Índice de costo ${best.cost_of_living.index}, visa ${best.visa.ease_of_access}, seguridad ${best.safety.safety_index}/100 — la trifecta para trabajadores remotos ${budgetLabel(ctx.profile.budgetRange, locale)}.\n\n`
    : locale === "pt" ? `**${best.name[locale]}** domina o ranking nômade. Índice de custo ${best.cost_of_living.index}, visto ${best.visa.ease_of_access}, segurança ${best.safety.safety_index}/100 — a trifeta para trabalhadores remotos ${budgetLabel(ctx.profile.budgetRange, locale)}.\n\n`
    : `**${best.name[locale]}** dominates the nomad rankings. Cost index ${best.cost_of_living.index}, ${best.visa.ease_of_access} visa, safety ${best.safety.safety_index}/100 — the trifecta for ${budgetLabel(ctx.profile.budgetRange, locale)} remote workers.\n\n`;

  const topNomadTitle: Record<Locale, string> = {
    en: "Top 5 Nomad Jurisdictions",
    fr: "Top 5 Juridictions Nomades",
    es: "Top 5 Jurisdicciones Nómadas",
    pt: "Top 5 Jurisdições Nômades",
  };
  out += `**${topNomadTitle[locale]}**:\n`;
  ranked.forEach((c, i) => {
    const icon = i === 0 ? "→" : "  ";
    out += locale === "fr" ? `${icon} **#${i + 1} ${c.name[locale]}** : Coût ${c.cost_of_living.index} | Visa ${c.visa.ease_of_access} | Sécurité ${c.safety.safety_index} | $${fmt(c.cost_of_living.average_salary)}/mois moy\n`
      : locale === "es" ? `${icon} **#${i + 1} ${c.name[locale]}**: Costo ${c.cost_of_living.index} | Visa ${c.visa.ease_of_access} | Seguridad ${c.safety.safety_index} | $${fmt(c.cost_of_living.average_salary)}/mes prom\n`
      : locale === "pt" ? `${icon} **#${i + 1} ${c.name[locale]}**: Custo ${c.cost_of_living.index} | Visto ${c.visa.ease_of_access} | Segurança ${c.safety.safety_index} | $${fmt(c.cost_of_living.average_salary)}/mês méd\n`
      : `${icon} **#${i + 1} ${c.name[locale]}**: Cost ${c.cost_of_living.index} | Visa ${c.visa.ease_of_access} | Safety ${c.safety.safety_index} | $${fmt(c.cost_of_living.average_salary)}/mo avg\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += locale === "fr" ? `Le moins cher n'est pas le meilleur. ${ranked[0].name[locale]} équilibre coût et qualité d'infrastructure. ${ranked[1].name[locale]} peut devancer sur la vitesse internet et la densité de coworking — vérifiez avant de vous engager.\n\n`
    : locale === "es" ? `Lo más barato no es lo mejor. ${ranked[0].name[locale]} equilibra costo con calidad de infraestructura. ${ranked[1].name[locale]} puede aventajar en velocidad de internet y densidad de coworking — verifique antes de comprometerse.\n\n`
    : locale === "pt" ? `O mais barato não é o melhor. ${ranked[0].name[locale]} equilibra custo com qualidade de infraestrutura. ${ranked[1].name[locale]} pode se destacar em velocidade de internet e densidade de coworking — verifique antes de se comprometer.\n\n`
    : `Cheapest is not best. ${ranked[0].name[locale]} balances cost with infrastructure quality. ${ranked[1].name[locale]} may edge ahead on internet speed and coworking density — verify before committing.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Approfondissez les options de visa nomade de ${best.name[locale]}, puis comparez avec ${ranked[1].name[locale]}.`
    : locale === "es" ? `Profundice en las opciones de visa nómada de ${best.name[locale]}, luego compare con ${ranked[1].name[locale]}.`
    : locale === "pt" ? `Aprofunde-se nas opções de visto nômade de ${best.name[locale]}, depois compare com ${ranked[1].name[locale]}.`
    : `Deep-dive into ${best.name[locale]}'s nomad visa options, then compare with ${ranked[1].name[locale]}.`;

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
  const stretchWord = cheapest.cost_of_living.index <= 35
    ? { en: "significantly", fr: "considérablement", es: "significativamente", pt: "significativamente" }
    : { en: "reasonably", fr: "raisonnablement", es: "razonablemente", pt: "razoavelmente" };
  out += locale === "fr" ? `**${cheapest.name[locale]}** maximise le pouvoir d'achat avec un indice de coût de ${cheapest.cost_of_living.index}. Votre budget ${budgetLabel(ctx.profile.budgetRange, locale)} s'étend ${stretchWord[locale]} plus loin ici qu'à ${priciest.name[locale]} (indice ${priciest.cost_of_living.index}).\n\n`
    : locale === "es" ? `**${cheapest.name[locale]}** maximiza el poder adquisitivo con índice de costo ${cheapest.cost_of_living.index}. Su presupuesto ${budgetLabel(ctx.profile.budgetRange, locale)} se extiende ${stretchWord[locale]} más aquí que en ${priciest.name[locale]} (índice ${priciest.cost_of_living.index}).\n\n`
    : locale === "pt" ? `**${cheapest.name[locale]}** maximiza o poder de compra com índice de custo ${cheapest.cost_of_living.index}. Seu orçamento ${budgetLabel(ctx.profile.budgetRange, locale)} se estende ${stretchWord[locale]} mais aqui do que em ${priciest.name[locale]} (índice ${priciest.cost_of_living.index}).\n\n`
    : `**${cheapest.name[locale]}** maximizes purchasing power at cost index ${cheapest.cost_of_living.index}. Your ${budgetLabel(ctx.profile.budgetRange, locale)} stretches ${stretchWord[locale]} further here than in ${priciest.name[locale]} (index ${priciest.cost_of_living.index}).\n\n`;

  out += `**${sH("costLifestyle", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.cost_of_living.index <= 40 ? "→" : c.cost_of_living.index <= 65 ? "  " : "  ";
    out += locale === "fr" ? `${mark} **${c.name[locale]}** : Indice ${c.cost_of_living.index} | Salaire $${fmt(c.cost_of_living.average_salary)}/mois | Inflation ${c.economy.inflation}%\n`
      : locale === "es" ? `${mark} **${c.name[locale]}**: Índice ${c.cost_of_living.index} | Salario $${fmt(c.cost_of_living.average_salary)}/mes | Inflación ${c.economy.inflation}%\n`
      : locale === "pt" ? `${mark} **${c.name[locale]}**: Índice ${c.cost_of_living.index} | Salário $${fmt(c.cost_of_living.average_salary)}/mês | Inflação ${c.economy.inflation}%\n`
      : `${mark} **${c.name[locale]}**: Index ${c.cost_of_living.index} | Salary $${fmt(c.cost_of_living.average_salary)}/mo | Inflation ${c.economy.inflation}%\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += locale === "fr" ? `Un coût faible est souvent corrélé à une infrastructure de moindre qualité. ${cheapest.name[locale]} à l'indice ${cheapest.cost_of_living.index} offre de réelles économies, mais vérifiez l'accès internet, santé et bancaire sur place avant de vous engager.\n\n`
    : locale === "es" ? `El bajo costo a menudo se correlaciona con menor calidad de infraestructura. ${cheapest.name[locale]} con índice ${cheapest.cost_of_living.index} ofrece ahorros reales, pero verifique el acceso a internet, salud y banca en el terreno antes de comprometerse.\n\n`
    : locale === "pt" ? `Custo baixo frequentemente se correlaciona com menor qualidade de infraestrutura. ${cheapest.name[locale]} no índice ${cheapest.cost_of_living.index} oferece economia real, mas verifique o acesso à internet, saúde e serviços bancários no local antes de se comprometer.\n\n`
    : `Low cost often correlates with lower infrastructure quality. ${cheapest.name[locale]} at index ${cheapest.cost_of_living.index} delivers real savings, but verify internet, healthcare, and banking access on the ground before committing.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Comparez ${cheapest.name[locale]} vs ${priciest.name[locale]} pour comprendre le spectre complet des compromis.`
    : locale === "es" ? `Compare ${cheapest.name[locale]} vs ${priciest.name[locale]} para entender el espectro completo de compensaciones.`
    : locale === "pt" ? `Compare ${cheapest.name[locale]} vs ${priciest.name[locale]} para entender o espectro completo de compensações.`
    : `Compare ${cheapest.name[locale]} vs ${priciest.name[locale]} to understand the full trade-off spectrum.`;

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
  out += locale === "fr" ? `**${safest.name[locale]}** en tête avec un indice de sécurité de ${safest.safety.safety_index}/100 et une gouvernance ${safest.government.political_stability}.`
    : locale === "es" ? `**${safest.name[locale]}** lidera con índice de seguridad ${safest.safety.safety_index}/100 y gobernanza ${safest.government.political_stability}.`
    : locale === "pt" ? `**${safest.name[locale]}** lidera com índice de segurança ${safest.safety.safety_index}/100 e governança ${safest.government.political_stability}.`
    : `**${safest.name[locale]}** leads with safety index ${safest.safety.safety_index}/100 and ${safest.government.political_stability} governance.`;
  if (ctx.profile.familyStatus === "family") {
    out += locale === "en" ? " Family safety prioritized in this assessment." : locale === "fr" ? " Sécurité familiale prioritaire dans cette évaluation." : locale === "es" ? " Seguridad familiar priorizada en esta evaluación." : " Segurança familiar priorizada nesta avaliação.";
  }
  out += "\n\n";

  out += `**${sH("security", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.safety.safety_index >= 65 ? "→" : "  ";
    out += locale === "fr" ? `${mark} **${c.name[locale]}** : Sécurité ${c.safety.safety_index}/100 | Criminalité ${c.safety.crime_index} | ${c.government.political_stability} | ${c.military.nuclear_weapon ? "Nucléaire" : `Puissance ${c.military.power_index}`}\n`
      : locale === "es" ? `${mark} **${c.name[locale]}**: Seguridad ${c.safety.safety_index}/100 | Crimen ${c.safety.crime_index} | ${c.government.political_stability} | ${c.military.nuclear_weapon ? "Nuclear" : `Potencia ${c.military.power_index}`}\n`
      : locale === "pt" ? `${mark} **${c.name[locale]}**: Segurança ${c.safety.safety_index}/100 | Crime ${c.safety.crime_index} | ${c.government.political_stability} | ${c.military.nuclear_weapon ? "Nuclear" : `Poder ${c.military.power_index}`}\n`
      : `${mark} **${c.name[locale]}**: Safety ${c.safety.safety_index}/100 | Crime ${c.safety.crime_index} | ${c.government.political_stability} | ${c.military.nuclear_weapon ? "Nuclear" : `Power ${c.military.power_index}`}\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += locale === "fr" ? `Les métriques de sécurité nationales sont des moyennes. ${safest.name[locale]} obtient ${safest.safety.safety_index}/100 au niveau national, mais la variance au niveau des villes peut être de 20+ points. Ciblez les quartiers établis par les expatriés pour l'expérience quotidienne la plus sûre.\n\n`
    : locale === "es" ? `Las métricas de seguridad nacional son promedios. ${safest.name[locale]} obtiene ${safest.safety.safety_index}/100 a nivel nacional, pero la variación a nivel de ciudad puede ser de 20+ puntos. Apunte a vecindarios establecidos por expatriados para la experiencia diaria más segura.\n\n`
    : locale === "pt" ? `As métricas de segurança nacional são médias. ${safest.name[locale]} pontua ${safest.safety.safety_index}/100 nacionalmente, mas a variação por cidade pode ser de 20+ pontos. Mire bairros estabelecidos por expatriados para a experiência diária mais segura.\n\n`
    : `National safety metrics are averages. ${safest.name[locale]} scores ${safest.safety.safety_index}/100 nationally, but city-level variance can be 20+ points. Target expatriate-established neighborhoods for the safest daily experience.\n\n`;

  out += `**${sH("theTradeoff", locale)}**:\n`;
  out += locale === "fr" ? `Les pays les plus sûrs ont souvent des coûts premium — l'indice de coût de ${safest.name[locale]} est ${safest.cost_of_living.index}. La sécurité a un prix.\n\n`
    : locale === "es" ? `Los países más seguros suelen tener costos premium — el índice de costo de ${safest.name[locale]} es ${safest.cost_of_living.index}. La seguridad tiene un precio.\n\n`
    : locale === "pt" ? `Os países mais seguros frequentemente têm custos premium — o índice de custo de ${safest.name[locale]} é ${safest.cost_of_living.index}. Segurança tem um preço.\n\n`
    : `Safest countries often carry premium costs — ${safest.name[locale]} cost index is ${safest.cost_of_living.index}. Security comes at a price.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Briefing complet sur ${safest.name[locale]}, ou comparez les 3 options les plus sûres face à face.`
    : locale === "es" ? `Informe completo sobre ${safest.name[locale]}, o compare las 3 opciones más seguras cara a cara.`
    : locale === "pt" ? `Briefing completo sobre ${safest.name[locale]}, ou compare as 3 opções mais seguras frente a frente.`
    : `Full intelligence briefing on ${safest.name[locale]}, or compare top 3 safest options head-to-head.`;

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
  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(g => goalLabel(g, locale)).join(", ");
  out += locale === "fr" ? `**${best.name[locale]}** offre la position fiscale la plus solide — fiscalité ${best.tax.level} avec ${best.tax.income_tax} sur le revenu et ${best.tax.corporate_tax} sur les sociétés. Pour vos objectifs ${goals}, cela préserve le revenu net maximum.\n\n`
    : locale === "es" ? `**${best.name[locale]}** ofrece la posición fiscal más fuerte — impuestos ${best.tax.level} con ${best.tax.income_tax} sobre la renta y ${best.tax.corporate_tax} corporativo. Para sus objetivos de ${goals}, esto preserva el ingreso neto máximo.\n\n`
    : locale === "pt" ? `**${best.name[locale]}** oferece a posição fiscal mais forte — tributação ${best.tax.level} com ${best.tax.income_tax} de renda e ${best.tax.corporate_tax} corporativo. Para seus objetivos de ${goals}, isso preserva a renda líquida máxima.\n\n`
    : `**${best.name[locale]}** offers the strongest fiscal position — ${best.tax.level} tax with ${best.tax.income_tax} income and ${best.tax.corporate_tax} corporate rates. For your ${goals} objectives, this preserves maximum net income.\n\n`;

  out += `**${sH("fiscalProfile", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.tax.level === "low" ? "→" : "  ";
    out += locale === "fr" ? `${mark} **${c.name[locale]}** : ${c.tax.level.toUpperCase()} — Revenu : ${c.tax.income_tax} | Sociétés : ${c.tax.corporate_tax} | Stabilité : ${c.government.political_stability}\n`
      : locale === "es" ? `${mark} **${c.name[locale]}**: ${c.tax.level.toUpperCase()} — Renta: ${c.tax.income_tax} | Corp: ${c.tax.corporate_tax} | Estabilidad: ${c.government.political_stability}\n`
      : locale === "pt" ? `${mark} **${c.name[locale]}**: ${c.tax.level.toUpperCase()} — Renda: ${c.tax.income_tax} | Corp: ${c.tax.corporate_tax} | Estabilidade: ${c.government.political_stability}\n`
      : `${mark} **${c.name[locale]}**: ${c.tax.level.toUpperCase()} — Income: ${c.tax.income_tax} | Corp: ${c.tax.corporate_tax} | Stability: ${c.government.political_stability}\n`;
  });
  out += "\n";

  if (lowTax.filter((c) => !sorted.find((s) => s.iso_code === c.iso_code)).length > 0) {
    out += `**${sH("alternatives", locale)}**:\n`;
    lowTax.filter((c) => !sorted.slice(0, 3).find((s) => s.iso_code === c.iso_code)).slice(0, 3).forEach((c) => {
      out += locale === "fr" ? `→ **${c.name[locale]}** : ${c.tax.income_tax} revenu, ${c.tax.corporate_tax} sociétés — visa ${c.visa.ease_of_access}\n`
        : locale === "es" ? `→ **${c.name[locale]}**: ${c.tax.income_tax} renta, ${c.tax.corporate_tax} corporativo — visa ${c.visa.ease_of_access}\n`
        : locale === "pt" ? `→ **${c.name[locale]}**: ${c.tax.income_tax} renda, ${c.tax.corporate_tax} corporativo — visto ${c.visa.ease_of_access}\n`
        : `→ **${c.name[locale]}**: ${c.tax.income_tax} income, ${c.tax.corporate_tax} corporate — ${c.visa.ease_of_access} visa\n`;
    });
    out += "\n";
  }

  out += `**${sH("strategicNote", locale)}**:\n`;
  out += locale === "fr" ? `Faible fiscalité ne signifie pas zéro obligation. La règle des 183 jours de résidence, les exigences de substance et les conventions de double imposition affectent votre taux effectif. Le taux nominal de ${best.tax.income_tax} de ${best.name[locale]} peut différer de votre charge réelle.\n\n`
    : locale === "es" ? `Impuestos bajos no significa cero obligación. La regla de residencia de 183 días, los requisitos de sustancia y los tratados de doble imposición afectan su tasa efectiva. La tasa nominal de ${best.tax.income_tax} de ${best.name[locale]} puede diferir de su carga real.\n\n`
    : locale === "pt" ? `Baixa tributação não significa zero obrigação. A regra de residência de 183 dias, requisitos de substância e tratados de dupla tributação afetam sua taxa efetiva. A taxa nominal de ${best.tax.income_tax} de ${best.name[locale]} pode diferir da sua carga real.\n\n`
    : `Low tax does not mean zero obligation. The 183-day residency rule, substance requirements, and double taxation treaties all affect your effective rate. ${best.name[locale]}'s ${best.tax.income_tax} headline rate may differ from your actual burden.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Comparez ${best.name[locale]} vs le régime fiscal de votre pays actuel, puis explorez les programmes de résidence par investissement.`
    : locale === "es" ? `Compare ${best.name[locale]} vs el régimen fiscal de su país actual, luego explore programas de residencia por inversión.`
    : locale === "pt" ? `Compare ${best.name[locale]} vs o regime tributário do seu país atual, depois explore programas de residência por investimento.`
    : `Compare ${best.name[locale]} vs your current country's tax regime, then explore residency-by-investment programs.`;

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
  out += locale === "fr" ? `**${easiest.name[locale]}** offre le chemin le plus rapide — accès ${easiest.visa.ease_of_access} avec ${easiest.visa.residency_options.split(",")[0]} comme voie principale.`
    : locale === "es" ? `**${easiest.name[locale]}** ofrece el camino más rápido — acceso ${easiest.visa.ease_of_access} con ${easiest.visa.residency_options.split(",")[0]} como vía principal.`
    : locale === "pt" ? `**${easiest.name[locale]}** oferece o caminho mais rápido — acesso ${easiest.visa.ease_of_access} com ${easiest.visa.residency_options.split(",")[0]} como via principal.`
    : `**${easiest.name[locale]}** provides the fastest path — ${easiest.visa.ease_of_access} access with ${easiest.visa.residency_options.split(",")[0]} as the primary pathway.`;
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
  out += locale === "fr" ? `Un accès visa facile ne garantit pas une citoyenneté facile. Les délais de résidence permanente varient de 5 à 10 ans. Les permis de travail sont souvent séparés des permis de résidence — vérifiez les droits d'emploi avant de déménager.\n\n`
    : locale === "es" ? `El acceso fácil de visa no garantiza una ciudadanía fácil. Los plazos de residencia permanente van de 5 a 10 años. Los permisos de trabajo suelen estar separados de los permisos de residencia — verifique los derechos laborales antes de reubicarse.\n\n`
    : locale === "pt" ? `Acesso fácil de visto não garante cidadania fácil. Os prazos de residência permanente variam de 5 a 10 anos. As autorizações de trabalho são frequentemente separadas das autorizações de residência — verifique os direitos de emprego antes de se mudar.\n\n`
    : `Easy visa access does not guarantee easy citizenship. Permanent residency timelines range 5-10 years. Work permits are often separate from residency permits — verify employment rights before relocating.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Demandez un plan de relocation étape par étape pour ${easiest.name[locale]}, ou comparez la difficulté des visas vs la qualité de vie parmi vos meilleurs résultats.`
    : locale === "es" ? `Solicite un plan de reubicación paso a paso para ${easiest.name[locale]}, o compare la dificultad de visa vs calidad de vida entre sus mejores opciones.`
    : locale === "pt" ? `Solicite um plano de mudança passo a passo para ${easiest.name[locale]}, ou compare a dificuldade de visto vs qualidade de vida entre suas melhores opções.`
    : `Request a step-by-step relocation plan for ${easiest.name[locale]}, or compare visa difficulty vs quality of life across your top matches.`;

  return out;
}

// ===== RELOCATION PLAN =====
function generateRelocationPlan(c: Country, ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  const relGoals = (ctx.profile.goals || [ctx.profile.goal]).map(g => goalLabel(g, locale)).join(", ");
  out += locale === "fr" ? `Feuille de route de relocation vers **${c.name[locale]}** — adaptée à vos objectifs ${relGoals} et budget ${budgetLabel(ctx.profile.budgetRange, locale)}.\n\n`
    : locale === "es" ? `Hoja de ruta de reubicación a **${c.name[locale]}** — adaptada a sus objetivos de ${relGoals} y presupuesto ${budgetLabel(ctx.profile.budgetRange, locale)}.\n\n`
    : locale === "pt" ? `Roteiro de mudança para **${c.name[locale]}** — adaptado aos seus objetivos de ${relGoals} e orçamento ${budgetLabel(ctx.profile.budgetRange, locale)}.\n\n`
    : `Relocation roadmap to **${c.name[locale]}** — tailored for your ${relGoals} objectives and ${budgetLabel(ctx.profile.budgetRange, locale)} budget.\n\n`;

  const relIncomeL = { en: "income", fr: "revenu", es: "renta", pt: "renda" }[locale];
  const relCorpL = { en: "corporate", fr: "sociétés", es: "corporativo", pt: "corporativo" }[locale];
  const relSalaryL = { en: "Avg salary", fr: "Salaire moy", es: "Salario prom", pt: "Salário méd" }[locale];
  const relSafetyL = { en: "safety", fr: "sécurité", es: "seguridad", pt: "segurança" }[locale];
  const relGovL = { en: "governance", fr: "gouvernance", es: "gobernanza", pt: "governança" }[locale];
  const relIdxL = { en: "Index", fr: "Indice", es: "Índice", pt: "Índice" }[locale];
  out += `**${sH("fiscalProfile", locale)}**: ${c.tax.level.toUpperCase()} — ${c.tax.income_tax} ${relIncomeL}, ${c.tax.corporate_tax} ${relCorpL}\n`;
  out += `**${sH("residencyAccess", locale)}**: ${c.visa.ease_of_access.toUpperCase()} — ${c.visa.residency_options.split(",")[0]}\n`;
  out += `**${sH("costLifestyle", locale)}**: ${relIdxL} ${c.cost_of_living.index} | ${relSalaryL} $${fmt(c.cost_of_living.average_salary)}/${locale === "fr" ? "mois" : locale === "es" ? "mes" : locale === "pt" ? "mês" : "mo"}\n`;
  out += `**${sH("security", locale)}**: ${c.safety.safety_index}/100 ${relSafetyL} | ${c.government.political_stability} ${relGovL}\n\n`;

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
  out += locale === "fr" ? `Estimation du coût total de relocation : ${costRange} (vols, dépôts, premier mois, frais). Prévoyez 3 mois de réserves d'urgence aux niveaux de coûts locaux.`
    : locale === "es" ? `Estimación del costo total de reubicación: ${costRange} (vuelos, depósitos, primer mes, tarifas). Tenga en cuenta 3 meses de reservas de emergencia a los niveles de costos locales.`
    : locale === "pt" ? `Estimativa de custo total de mudança: ${costRange} (voos, depósitos, primeiro mês, taxas). Considere 3 meses de reservas de emergência nos níveis de custo locais.`
    : `Total relocation cost estimate: ${costRange} (flights, deposits, first month, fees). Factor in 3 months emergency reserves at local cost levels.`;

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
  const andWord = { en: "and", fr: "et", es: "y", pt: "e" }[locale];
  out += locale === "fr" ? `**${top.name[locale]}** en tête sur les fondamentaux économiques — PIB/hab $${fmt(top.economy.gdp_per_capita)}, inflation ${top.economy.inflation}%, ancré par ${top.economy.main_exports.slice(0, 2).join(` ${andWord} `)}.\n\n`
    : locale === "es" ? `**${top.name[locale]}** lidera en fundamentos económicos — PIB/cap $${fmt(top.economy.gdp_per_capita)}, inflación ${top.economy.inflation}%, anclado por ${top.economy.main_exports.slice(0, 2).join(` ${andWord} `)}.\n\n`
    : locale === "pt" ? `**${top.name[locale]}** lidera em fundamentos econômicos — PIB/cap $${fmt(top.economy.gdp_per_capita)}, inflação ${top.economy.inflation}%, ancorado por ${top.economy.main_exports.slice(0, 2).join(` ${andWord} `)}.\n\n`
    : `**${top.name[locale]}** leads on economic fundamentals — $${fmt(top.economy.gdp_per_capita)} per capita GDP, ${top.economy.inflation}% inflation, anchored by ${top.economy.main_exports.slice(0, 2).join(` ${andWord} `)}.\n\n`;

  out += `**${sH("businessInvestment", locale)}**:\n`;
  sorted.forEach((c, i) => {
    const mark = i === 0 ? "→" : "  ";
    out += locale === "fr" ? `${mark} **${c.name[locale]}** : PIB $${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)}/hab) | Inflation ${c.economy.inflation}% | Sociétés ${c.tax.corporate_tax}\n`
      : locale === "es" ? `${mark} **${c.name[locale]}**: PIB $${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)}/cap) | Inflación ${c.economy.inflation}% | Corp ${c.tax.corporate_tax}\n`
      : locale === "pt" ? `${mark} **${c.name[locale]}**: PIB $${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)}/cap) | Inflação ${c.economy.inflation}% | Corp ${c.tax.corporate_tax}\n`
      : `${mark} **${c.name[locale]}**: GDP $${c.economy.gdp}B ($${fmt(c.economy.gdp_per_capita)}/cap) | Inflation ${c.economy.inflation}% | ${c.tax.corporate_tax} corp tax\n`;
  });
  out += "\n";

  out += `**${sH("strategicNote", locale)}**:\n`;
  const inflNote = top.economy.inflation < 4
    ? { en: "Low inflation supports stable returns and planning certainty.", fr: "La faible inflation soutient des rendements stables et une certitude de planification.", es: "La baja inflación apoya rendimientos estables y certeza de planificación.", pt: "A baixa inflação suporta retornos estáveis e certeza de planejamento." }
    : { en: "Elevated inflation erodes returns — hedge with hard assets or foreign-denominated accounts.", fr: "L'inflation élevée érode les rendements — couvrez-vous avec des actifs tangibles ou des comptes en devise étrangère.", es: "La inflación elevada erosiona rendimientos — cubra con activos tangibles o cuentas en divisa extranjera.", pt: "A inflação elevada corrói retornos — proteja-se com ativos tangíveis ou contas em moeda estrangeira." };
  out += locale === "fr" ? `Un PIB/hab élevé est corrélé à un coût de vie élevé — l'indice de coût de ${top.name[locale]} est ${top.cost_of_living.index}. ${inflNote[locale]}\n\n`
    : locale === "es" ? `Un PIB/cap alto se correlaciona con alto costo de vida — el índice de costo de ${top.name[locale]} es ${top.cost_of_living.index}. ${inflNote[locale]}\n\n`
    : locale === "pt" ? `Um PIB/cap alto se correlaciona com alto custo de vida — o índice de custo de ${top.name[locale]} é ${top.cost_of_living.index}. ${inflNote[locale]}\n\n`
    : `High GDP per capita correlates with high cost of living — ${top.name[locale]} cost index is ${top.cost_of_living.index}. ${inflNote[locale]}\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Approfondissez les opportunités sectorielles de ${top.name[locale]}, ou comparez les fondamentaux économiques de vos 3 meilleurs choix.`
    : locale === "es" ? `Profundice en las oportunidades sectoriales de ${top.name[locale]}, o compare los fundamentos económicos de sus 3 mejores opciones.`
    : locale === "pt" ? `Aprofunde-se nas oportunidades setoriais de ${top.name[locale]}, ou compare os fundamentos econômicos das suas 3 melhores opções.`
    : `Deep-dive into ${top.name[locale]}'s sector-specific opportunities, or compare economic fundamentals across your top 3.`;

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
  const nuclearStr = sorted[0].military.nuclear_weapon
    ? { en: ", nuclear-armed", fr: ", puissance nucléaire", es: ", potencia nuclear", pt: ", potência nuclear" }[locale]
    : "";
  out += locale === "fr" ? `Posture militaire la plus forte : **${sorted[0].name[locale]}** (indice de puissance ${sorted[0].military.power_index}${nuclearStr}). Mais pour la relocation, la stabilité politique compte plus que la puissance militaire brute.\n\n`
    : locale === "es" ? `Postura militar más fuerte: **${sorted[0].name[locale]}** (índice de poder ${sorted[0].military.power_index}${nuclearStr}). Pero para la reubicación, la estabilidad política importa más que la fuerza militar bruta.\n\n`
    : locale === "pt" ? `Postura militar mais forte: **${sorted[0].name[locale]}** (índice de poder ${sorted[0].military.power_index}${nuclearStr}). Mas para a mudança, a estabilidade política importa mais do que a força militar bruta.\n\n`
    : `Strongest military posture: **${sorted[0].name[locale]}** (power index ${sorted[0].military.power_index}${nuclearStr}). But for relocation, political stability matters more than raw military strength.\n\n`;

  out += `**${sH("security", locale)}**:\n`;
  sorted.forEach((c) => {
    const mark = c.government.political_stability === "stable" ? "→" : "  ";
    const nucLabel = c.military.nuclear_weapon
      ? { en: "Nuclear", fr: "Nucléaire", es: "Nuclear", pt: "Nuclear" }[locale]
      : { en: "Conventional", fr: "Conventionnel", es: "Convencional", pt: "Convencional" }[locale];
    out += locale === "fr" ? `${mark} **${c.name[locale]}** : Puissance ${c.military.power_index} | ${c.government.political_stability} | ${nucLabel} | Sécurité ${c.safety.safety_index}/100\n`
      : locale === "es" ? `${mark} **${c.name[locale]}**: Poder ${c.military.power_index} | ${c.government.political_stability} | ${nucLabel} | Seguridad ${c.safety.safety_index}/100\n`
      : locale === "pt" ? `${mark} **${c.name[locale]}**: Poder ${c.military.power_index} | ${c.government.political_stability} | ${nucLabel} | Segurança ${c.safety.safety_index}/100\n`
      : `${mark} **${c.name[locale]}**: Power ${c.military.power_index} | ${c.government.political_stability} | ${nucLabel} | Safety ${c.safety.safety_index}/100\n`;
  });
  out += "\n";

  const stableCountries = ctx.countries.filter((c) => c.government.political_stability === "stable");
  out += `**${sH("strategicNote", locale)}**:\n`;
  const stableList = stableCountries.length > 0 ? stableCountries.map((c) => c.name[locale]).join(", ") : "";
  out += locale === "fr" ? `${stableList ? `Juridictions stables dans vos résultats : ${stableList}. ` : ""}La puissance militaire est une métrique de dissuasion, pas d'habitabilité. Concentrez-vous sur l'indice de sécurité et la stabilité gouvernementale pour une prise de décision pratique.\n\n`
    : locale === "es" ? `${stableList ? `Jurisdicciones estables en sus resultados: ${stableList}. ` : ""}La fuerza militar es una métrica de disuasión, no de habitabilidad. Enfóquese en el índice de seguridad y la estabilidad de gobernanza para una toma de decisiones práctica.\n\n`
    : locale === "pt" ? `${stableList ? `Jurisdições estáveis nos seus resultados: ${stableList}. ` : ""}A força militar é uma métrica de dissuasão, não de habitabilidade. Concentre-se no índice de segurança e na estabilidade de governança para uma tomada de decisão prática.\n\n`
    : `${stableList ? `Stable jurisdictions in your matches: ${stableList}. ` : ""}Military strength is a deterrent metric, not a livability one. Focus on safety index and governance stability for practical decision-making.\n\n`;

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Passez à l'analyse de sécurité et stabilité pour des insights de relocation actionnables.`
    : locale === "es" ? `Pase al análisis de seguridad y estabilidad para insights de reubicación accionables.`
    : locale === "pt" ? `Passe para a análise de segurança e estabilidade para insights de mudança acionáveis.`
    : `Shift to safety and stability analysis for actionable relocation insights.`;

  return out;
}

// ===== CLIMATE =====
function generateClimateResponse(ctx: AIContext): string {
  const locale = ctx.locale;
  const lens = getModuleLens(ctx.activeModule, locale);

  let out = "";
  if (lens) out += `*${lens.prefix}.*\n\n`;

  out += `## ${sH("executiveSummary", locale)}\n\n`;
  const prefStr = ctx.profile.climatePreference !== "any"
    ? (locale === "fr" ? `Votre préférence : climat **${ctx.profile.climatePreference}**.`
      : locale === "es" ? `Su preferencia: clima **${ctx.profile.climatePreference}**.`
      : locale === "pt" ? `Sua preferência: clima **${ctx.profile.climatePreference}**.`
      : `Your preference: **${ctx.profile.climatePreference}** climate.`)
    : (locale === "fr" ? "Profil agnostique au climat."
      : locale === "es" ? "Perfil agnóstico al clima."
      : locale === "pt" ? "Perfil agnóstico ao clima."
      : "Climate-agnostic profile.");
  out += `${prefStr} `;

  const matched = ctx.countries.filter((c) => {
    const desc = c.climate.description.en.toLowerCase();
    const pref = ctx.profile.climatePreference;
    return pref === "any" || desc.includes(pref) || (pref === "warm" && (desc.includes("hot") || desc.includes("tropical")));
  });
  out += locale === "fr" ? `${matched.length}/${ctx.countries.length} correspondances alignées avec votre préférence climatique.\n\n`
    : locale === "es" ? `${matched.length}/${ctx.countries.length} coincidencias alineadas con su preferencia climática.\n\n`
    : locale === "pt" ? `${matched.length}/${ctx.countries.length} correspondências alinhadas com sua preferência climática.\n\n`
    : `${matched.length}/${ctx.countries.length} matches align with your climate preference.\n\n`;

  out += `**${sH("costLifestyle", locale)}**:\n`;
  ctx.countries.forEach((c) => {
    const desc = c.climate.description.en.toLowerCase();
    const pref = ctx.profile.climatePreference;
    const isMatch = pref === "any" || desc.includes(pref) || (pref === "warm" && (desc.includes("hot") || desc.includes("tropical")));
    const mark = isMatch ? "→" : "  ";
    const avgLabel = { en: "avg", fr: "moy", es: "prom", pt: "méd" }[locale];
    out += `${mark} **${c.name[locale]}**: ${c.climate.average_temp} ${avgLabel} | ${c.climate.seasons} | ${c.climate.description[locale]}\n`;
  });
  out += "\n";

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Demandez les meilleures villes pour votre préférence climatique, ou comparez la qualité de vie par zone climatique.`
    : locale === "es" ? `Pregunte por las mejores ciudades para su preferencia climática, o compare la calidad de vida por zona climática.`
    : locale === "pt" ? `Pergunte pelas melhores cidades para sua preferência climática, ou compare a qualidade de vida por zona climática.`
    : `Ask about best cities for your climate preference, or compare quality of life across climate zones.`;

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
  const stableNames = stableOnes.map((c) => c.name[locale]).join(", ");
  const goals = (ctx.profile.goals || [ctx.profile.goal]).map(g => goalLabel(g, locale)).join(", ");
  if (stableOnes.length > 0) {
    out += locale === "fr" ? `${stableNames} ${stableOnes.length === 1 ? "se distingue" : "se distinguent"} par la qualité de gouvernance. `
      : locale === "es" ? `${stableNames} ${stableOnes.length === 1 ? "se destaca" : "se destacan"} por la calidad de gobernanza. `
      : locale === "pt" ? `${stableNames} ${stableOnes.length === 1 ? "se destaca" : "se destacam"} pela qualidade de governança. `
      : `${stableNames} ${stableOnes.length === 1 ? "stands" : "stand"} out for governance quality. `;
  } else {
    out += locale === "fr" ? "Aucune juridiction hautement stable dans vos résultats actuels — envisagez d'élargir vos options. "
      : locale === "es" ? "Ninguna jurisdicción altamente estable en sus resultados actuales — considere ampliar opciones. "
      : locale === "pt" ? "Nenhuma jurisdição altamente estável nos seus resultados atuais — considere ampliar opções. "
      : "No highly stable jurisdictions in your current matches — consider broadening options. ";
  }
  out += locale === "fr" ? `Pour des objectifs de ${goals}, la stabilité politique impacte directement la solidité de la devise, l'état de droit et les droits de propriété.\n\n`
    : locale === "es" ? `Para objetivos de ${goals}, la estabilidad política impacta directamente la fortaleza de la moneda, el estado de derecho y los derechos de propiedad.\n\n`
    : locale === "pt" ? `Para objetivos de ${goals}, a estabilidade política impacta diretamente a força da moeda, o estado de direito e os direitos de propriedade.\n\n`
    : `For ${goals}, political stability directly impacts currency strength, rule of law, and property rights.\n\n`;

  out += `**${sH("security", locale)}**:\n`;
  ctx.countries.forEach((c) => {
    const mark = c.government.political_stability === "stable" ? "→" : "  ";
    out += `${mark} **${c.name[locale]}**: ${c.government.type} | ${c.government.current_leader} | ${c.government.political_stability}\n`;
  });
  out += "\n";

  out += `**${sH("nextMove", locale)}**:\n`;
  out += locale === "fr" ? `Concentrez-vous sur les pays à gouvernance stable pour les engagements long terme, ou demandez des détails sur l'environnement réglementaire de votre secteur.`
    : locale === "es" ? `Enfóquese en países con gobernanza estable para compromisos a largo plazo, o pregunte sobre entornos regulatorios específicos de su industria.`
    : locale === "pt" ? `Concentre-se em países com governança estável para compromissos de longo prazo, ou pergunte sobre ambientes regulatórios específicos da sua indústria.`
    : `Focus on countries with stable governance for long-term commitments, or ask about specific regulatory environments for your industry.`;

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

  // Multi-criteria detection — route complex questions to decision engine
  // Questions combining 2+ dimensions (tax+safety, cost+visa, etc.) get special handling
  const taxKeywords = ["tax", "impôt", "impôts", "fiscal", "fiscalité", "impuesto", "imposto"];
  const safetyKeywords = ["safe", "safety", "sécurité", "sûreté", "seguridad", "segurança", "sacrifier"];
  const costKeywords = ["cost", "budget", "coût", "costo", "custo", "cher", "barato"];
  const visaKeywords = ["visa", "résidence", "residencia", "residência"];
  const businessKeywords = ["entrepreneur", "business", "entreprise", "consulting", "activité", "negocio", "empresa"];
  const qualityKeywords = ["qualité de vie", "quality of life", "calidad de vida", "qualidade de vida"];

  const dims = [taxKeywords, safetyKeywords, costKeywords, visaKeywords, businessKeywords, qualityKeywords];
  const matchedDims = dims.filter(kws => kws.some(kw => q.includes(kw)));

  // If 2+ dimensions matched AND question asks for a recommendation → multi-criteria
  const isRecommendation = ["meilleur", "best", "mejor", "melhor", "quel pays", "which country", "cuál", "qual", "combinent", "combine", "choisir", "choose", "lancer", "start"].some(t => q.includes(t));
  if (matchedDims.length >= 2 && isRecommendation) {
    return generateMultiCriteriaAdvice(ctx, question);
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
