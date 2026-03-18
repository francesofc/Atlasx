import type { Locale } from "@/contexts/I18nContext";

export type TaxLevel = "low" | "medium" | "high";
export type VisaDifficulty = "easy" | "medium" | "hard";
export type PoliticalStability = "stable" | "moderate" | "unstable";

// Localized string — one value per supported language
export type LocalizedString = Record<Locale, string>;

// ---------------------------------------------------------------------------
// Expanded structured data interfaces
// ---------------------------------------------------------------------------

export interface EconomyData {
  gdp: number; // billions USD
  gdp_per_capita: number; // USD
  main_exports: string[];
  main_imports: string[];
  currency: string;
  inflation: number; // percentage
}

export interface PopulationData {
  population: number;
  life_expectancy: number; // years
  density: number; // per km²
}

export interface SafetyData {
  crime_index: number; // 0–100
  safety_index: number; // 0–100
}

export interface GovernmentData {
  type: string;
  current_leader: string;
  political_stability: PoliticalStability;
}

export interface VisaData {
  ease_of_access: VisaDifficulty;
  residency_options: string;
}

export interface TaxData {
  level: TaxLevel;
  income_tax: string;
  corporate_tax: string;
}

export interface ClimateData {
  description: LocalizedString;
  average_temp: string; // e.g. "15°C"
  seasons: string;
}

export interface MilitaryData {
  power_index: number; // lower = stronger (Global Firepower)
  nuclear_weapon: boolean;
}

export interface CostOfLivingData {
  index: number; // 0–150+
  average_salary: number; // monthly USD
}

export interface Country {
  // Multilingual fields
  name: LocalizedString;
  short_description: LocalizedString;

  // Identity
  iso_code: string;
  capital: string;
  language: string;
  main_industries: string[];

  // Structured data sections
  economy: EconomyData;
  population_data: PopulationData;
  safety: SafetyData;
  government: GovernmentData;
  visa: VisaData;
  tax: TaxData;
  climate: ClimateData;
  military: MilitaryData;
  cost_of_living: CostOfLivingData;
}

// Backward-compatible accessors
export function getPopulation(c: Country): number { return c.population_data.population; }
export function getGdp(c: Country): number { return c.economy.gdp; }
export function getCurrency(c: Country): string { return c.economy.currency; }
export function getAverageSalary(c: Country): number { return c.cost_of_living.average_salary; }
export function getCostOfLivingIndex(c: Country): number { return c.cost_of_living.index; }
export function getSafetyIndex(c: Country): number { return c.safety.safety_index; }
export function getTaxLevel(c: Country): TaxLevel { return c.tax.level; }
export function getVisaDifficulty(c: Country): VisaDifficulty { return c.visa.ease_of_access; }

// ---------------------------------------------------------------------------
// Dataset: 25 countries — full structured data
// ---------------------------------------------------------------------------

export const countries: Country[] = [
  {
    iso_code: "USA",
    name: { en: "United States", fr: "États-Unis", es: "Estados Unidos", pt: "Estados Unidos" },
    short_description: {
      en: "The world's largest economy and a global leader in technology, finance, and innovation.",
      fr: "La plus grande économie du monde et un leader mondial en technologie, finance et innovation.",
      es: "La economía más grande del mundo y líder global en tecnología, finanzas e innovación.",
      pt: "A maior economia do mundo e líder global em tecnologia, finanças e inovação.",
    },
    capital: "Washington, D.C.",
    language: "English",
    main_industries: ["Technology", "Finance", "Healthcare", "Manufacturing", "Energy"],
    economy: { gdp: 25_460, gdp_per_capita: 76_330, main_exports: ["Refined Petroleum", "Aircraft", "Medical Instruments", "Integrated Circuits", "Soybeans"], main_imports: ["Cars", "Crude Petroleum", "Computers", "Pharmaceuticals", "Electronics"], currency: "USD", inflation: 3.4 },
    population_data: { population: 331_900_000, life_expectancy: 77.5, density: 36 },
    safety: { crime_index: 47, safety_index: 55 },
    government: { type: "Federal presidential constitutional republic", current_leader: "Joe Biden", political_stability: "stable" },
    visa: { ease_of_access: "hard", residency_options: "Green Card, EB-5 Investor, H-1B, E-2 Treaty Investor" },
    tax: { level: "high", income_tax: "10–37%", corporate_tax: "21%" },
    climate: { description: { en: "Varied — continental, subtropical, arid, and tropical zones", fr: "Varié — zones continentales, subtropicales, arides et tropicales", es: "Variado — zonas continentales, subtropicales, áridas y tropicales", pt: "Variado — zonas continentais, subtropicais, áridas e tropicais" }, average_temp: "12°C", seasons: "4 distinct seasons" },
    military: { power_index: 0.0712, nuclear_weapon: true },
    cost_of_living: { index: 71, average_salary: 5_500 },
  },
  {
    iso_code: "GBR",
    name: { en: "United Kingdom", fr: "Royaume-Uni", es: "Reino Unido", pt: "Reino Unido" },
    short_description: {
      en: "A major global financial hub with a rich cultural heritage and strong tech ecosystem.",
      fr: "Un pôle financier mondial majeur avec un riche patrimoine culturel et un écosystème tech solide.",
      es: "Un importante centro financiero global con un rico patrimonio cultural y un fuerte ecosistema tecnológico.",
      pt: "Um importante centro financeiro global com rico patrimônio cultural e forte ecossistema tecnológico.",
    },
    capital: "London", language: "English",
    main_industries: ["Finance", "Technology", "Pharmaceuticals", "Aerospace", "Creative Industries"],
    economy: { gdp: 3_070, gdp_per_capita: 45_850, main_exports: ["Cars", "Gas Turbines", "Gold", "Pharmaceuticals", "Crude Petroleum"], main_imports: ["Gold", "Cars", "Crude Petroleum", "Pharmaceuticals", "Gas"], currency: "GBP", inflation: 4.0 },
    population_data: { population: 67_800_000, life_expectancy: 81.0, density: 281 },
    safety: { crime_index: 46, safety_index: 59 },
    government: { type: "Parliamentary constitutional monarchy", current_leader: "King Charles III / PM Keir Starmer", political_stability: "stable" },
    visa: { ease_of_access: "medium", residency_options: "Skilled Worker, Innovator Founder, Global Talent, Investor" },
    tax: { level: "high", income_tax: "20–45%", corporate_tax: "25%" },
    climate: { description: { en: "Temperate maritime with mild winters and cool summers", fr: "Maritime tempéré avec des hivers doux et des étés frais", es: "Marítimo templado con inviernos suaves y veranos frescos", pt: "Marítimo temperado com invernos amenos e verões frescos" }, average_temp: "10°C", seasons: "4 seasons, frequent rain" },
    military: { power_index: 0.1435, nuclear_weapon: true },
    cost_of_living: { index: 67, average_salary: 3_800 },
  },
  {
    iso_code: "FRA",
    name: { en: "France", fr: "France", es: "Francia", pt: "França" },
    short_description: {
      en: "Europe's cultural capital, known for luxury, gastronomy, and a diversified economy.",
      fr: "Capitale culturelle de l'Europe, connue pour le luxe, la gastronomie et une économie diversifiée.",
      es: "Capital cultural de Europa, conocida por el lujo, la gastronomía y una economía diversificada.",
      pt: "Capital cultural da Europa, conhecida pelo luxo, gastronomia e uma economia diversificada.",
    },
    capital: "Paris", language: "French",
    main_industries: ["Tourism", "Aerospace", "Luxury Goods", "Agriculture", "Energy"],
    economy: { gdp: 2_780, gdp_per_capita: 40_890, main_exports: ["Aircraft", "Pharmaceuticals", "Cars", "Wine", "Perfumes"], main_imports: ["Crude Petroleum", "Cars", "Pharmaceuticals", "Natural Gas", "Electronics"], currency: "EUR", inflation: 2.3 },
    population_data: { population: 67_750_000, life_expectancy: 82.5, density: 119 },
    safety: { crime_index: 52, safety_index: 56 },
    government: { type: "Unitary semi-presidential republic", current_leader: "Emmanuel Macron", political_stability: "stable" },
    visa: { ease_of_access: "medium", residency_options: "Talent Passport, Entrepreneur, Student, Family Reunification" },
    tax: { level: "high", income_tax: "11–45%", corporate_tax: "25%" },
    climate: { description: { en: "Temperate with oceanic west, continental east, and Mediterranean south", fr: "Tempéré avec un ouest océanique, un est continental et un sud méditerranéen", es: "Templado con oeste oceánico, este continental y sur mediterráneo", pt: "Temperado com oeste oceânico, leste continental e sul mediterrâneo" }, average_temp: "13°C", seasons: "4 distinct seasons" },
    military: { power_index: 0.1878, nuclear_weapon: true },
    cost_of_living: { index: 65, average_salary: 3_200 },
  },
  {
    iso_code: "DEU",
    name: { en: "Germany", fr: "Allemagne", es: "Alemania", pt: "Alemanha" },
    short_description: {
      en: "Europe's largest economy, renowned for engineering excellence and industrial exports.",
      fr: "La plus grande économie d'Europe, renommée pour l'excellence en ingénierie et les exportations industrielles.",
      es: "La mayor economía de Europa, reconocida por su excelencia en ingeniería y exportaciones industriales.",
      pt: "A maior economia da Europa, reconhecida pela excelência em engenharia e exportações industriais.",
    },
    capital: "Berlin", language: "German",
    main_industries: ["Automotive", "Engineering", "Chemicals", "Technology", "Renewable Energy"],
    economy: { gdp: 4_070, gdp_per_capita: 48_720, main_exports: ["Cars", "Vehicle Parts", "Pharmaceuticals", "Machinery", "Electronics"], main_imports: ["Crude Petroleum", "Cars", "Natural Gas", "Vehicle Parts", "Pharmaceuticals"], currency: "EUR", inflation: 2.9 },
    population_data: { population: 84_400_000, life_expectancy: 81.0, density: 240 },
    safety: { crime_index: 35, safety_index: 65 },
    government: { type: "Federal parliamentary republic", current_leader: "Friedrich Merz", political_stability: "stable" },
    visa: { ease_of_access: "medium", residency_options: "EU Blue Card, Freelancer Visa, Job Seeker, Investor" },
    tax: { level: "high", income_tax: "14–45%", corporate_tax: "15% + trade tax" },
    climate: { description: { en: "Temperate continental with warm summers and cold winters", fr: "Continental tempéré avec des étés chauds et des hivers froids", es: "Continental templado con veranos cálidos e inviernos fríos", pt: "Continental temperado com verões quentes e invernos frios" }, average_temp: "10°C", seasons: "4 distinct seasons" },
    military: { power_index: 0.2847, nuclear_weapon: false },
    cost_of_living: { index: 65, average_salary: 4_100 },
  },
  {
    iso_code: "JPN",
    name: { en: "Japan", fr: "Japon", es: "Japón", pt: "Japão" },
    short_description: {
      en: "A technological powerhouse blending ancient tradition with cutting-edge innovation.",
      fr: "Une puissance technologique mêlant tradition ancienne et innovation de pointe.",
      es: "Una potencia tecnológica que combina tradición antigua con innovación de vanguardia.",
      pt: "Uma potência tecnológica que combina tradição antiga com inovação de ponta.",
    },
    capital: "Tokyo", language: "Japanese",
    main_industries: ["Automotive", "Electronics", "Robotics", "Finance", "Tourism"],
    economy: { gdp: 4_230, gdp_per_capita: 33_820, main_exports: ["Cars", "Integrated Circuits", "Vehicle Parts", "Machinery", "Iron & Steel"], main_imports: ["Crude Petroleum", "Natural Gas", "Coal", "Pharmaceuticals", "Electronics"], currency: "JPY", inflation: 2.8 },
    population_data: { population: 125_700_000, life_expectancy: 84.5, density: 347 },
    safety: { crime_index: 22, safety_index: 78 },
    government: { type: "Parliamentary constitutional monarchy", current_leader: "Emperor Naruhito / PM Shigeru Ishiba", political_stability: "stable" },
    visa: { ease_of_access: "medium", residency_options: "Highly Skilled Professional, Business Manager, Specified Skilled Worker" },
    tax: { level: "medium", income_tax: "5–45%", corporate_tax: "23.2%" },
    climate: { description: { en: "Ranges from subarctic in the north to subtropical in the south", fr: "Du subarctique au nord au subtropical au sud", es: "Desde subártico en el norte hasta subtropical en el sur", pt: "Do subártico no norte ao subtropical no sul" }, average_temp: "15°C", seasons: "4 distinct seasons, rainy season" },
    military: { power_index: 0.1601, nuclear_weapon: false },
    cost_of_living: { index: 69, average_salary: 3_400 },
  },
  {
    iso_code: "CAN",
    name: { en: "Canada", fr: "Canada", es: "Canadá", pt: "Canadá" },
    short_description: {
      en: "A vast, multicultural nation with abundant natural resources and a strong quality of life.",
      fr: "Une vaste nation multiculturelle avec des ressources naturelles abondantes et une excellente qualité de vie.",
      es: "Una vasta nación multicultural con abundantes recursos naturales y una excelente calidad de vida.",
      pt: "Uma vasta nação multicultural com recursos naturais abundantes e excelente qualidade de vida.",
    },
    capital: "Ottawa", language: "English, French",
    main_industries: ["Natural Resources", "Technology", "Finance", "Agriculture", "Aerospace"],
    economy: { gdp: 2_140, gdp_per_capita: 52_720, main_exports: ["Crude Petroleum", "Cars", "Gold", "Natural Gas", "Wood"], main_imports: ["Cars", "Vehicle Parts", "Trucks", "Crude Petroleum", "Computers"], currency: "CAD", inflation: 3.1 },
    population_data: { population: 40_100_000, life_expectancy: 82.0, density: 4 },
    safety: { crime_index: 42, safety_index: 60 },
    government: { type: "Federal parliamentary constitutional monarchy", current_leader: "King Charles III / PM Mark Carney", political_stability: "stable" },
    visa: { ease_of_access: "medium", residency_options: "Express Entry, Provincial Nominee, Start-Up Visa, Family Sponsorship" },
    tax: { level: "high", income_tax: "15–33% federal + provincial", corporate_tax: "15% federal + provincial" },
    climate: { description: { en: "Continental with long, cold winters and warm summers", fr: "Continental avec de longs hivers froids et des étés chauds", es: "Continental con inviernos largos y fríos y veranos cálidos", pt: "Continental com invernos longos e frios e verões quentes" }, average_temp: "1°C", seasons: "4 seasons, harsh winters" },
    military: { power_index: 0.3813, nuclear_weapon: false },
    cost_of_living: { index: 67, average_salary: 4_000 },
  },
  {
    iso_code: "AUS",
    name: { en: "Australia", fr: "Australie", es: "Australia", pt: "Austrália" },
    short_description: {
      en: "A resource-rich continent-nation offering high living standards and economic stability.",
      fr: "Un continent-nation riche en ressources offrant un niveau de vie élevé et une stabilité économique.",
      es: "Un continente-nación rico en recursos con altos estándares de vida y estabilidad económica.",
      pt: "Um continente-nação rico em recursos com altos padrões de vida e estabilidade econômica.",
    },
    capital: "Canberra", language: "English",
    main_industries: ["Mining", "Agriculture", "Finance", "Tourism", "Technology"],
    economy: { gdp: 1_680, gdp_per_capita: 64_490, main_exports: ["Iron Ore", "Coal", "Natural Gas", "Gold", "Aluminum"], main_imports: ["Cars", "Refined Petroleum", "Computers", "Telecommunications", "Pharmaceuticals"], currency: "AUD", inflation: 3.6 },
    population_data: { population: 26_400_000, life_expectancy: 83.0, density: 3 },
    safety: { crime_index: 43, safety_index: 58 },
    government: { type: "Federal parliamentary constitutional monarchy", current_leader: "King Charles III / PM Anthony Albanese", political_stability: "stable" },
    visa: { ease_of_access: "hard", residency_options: "Skilled Independent, Employer Sponsored, Business Innovation, Global Talent" },
    tax: { level: "medium", income_tax: "19–45%", corporate_tax: "30% (25% for small business)" },
    climate: { description: { en: "Mostly arid interior with tropical north and temperate south", fr: "Intérieur principalement aride avec un nord tropical et un sud tempéré", es: "Interior mayormente árido con norte tropical y sur templado", pt: "Interior majoritariamente árido com norte tropical e sul temperado" }, average_temp: "22°C", seasons: "Reversed seasons (Southern Hemisphere)" },
    military: { power_index: 0.2567, nuclear_weapon: false },
    cost_of_living: { index: 73, average_salary: 4_300 },
  },
  {
    iso_code: "BRA",
    name: { en: "Brazil", fr: "Brésil", es: "Brasil", pt: "Brasil" },
    short_description: {
      en: "Latin America's largest economy with vast natural resources and a dynamic culture.",
      fr: "La plus grande économie d'Amérique latine avec de vastes ressources naturelles et une culture dynamique.",
      es: "La mayor economía de América Latina con vastos recursos naturales y una cultura dinámica.",
      pt: "A maior economia da América Latina com vastos recursos naturais e uma cultura dinâmica.",
    },
    capital: "Brasília", language: "Portuguese",
    main_industries: ["Agriculture", "Mining", "Oil & Gas", "Manufacturing", "Finance"],
    economy: { gdp: 1_920, gdp_per_capita: 8_920, main_exports: ["Soybeans", "Iron Ore", "Crude Petroleum", "Sugar", "Poultry"], main_imports: ["Refined Petroleum", "Vehicle Parts", "Electronics", "Pharmaceuticals", "Fertilizers"], currency: "BRL", inflation: 4.6 },
    population_data: { population: 214_300_000, life_expectancy: 75.5, density: 25 },
    safety: { crime_index: 67, safety_index: 35 },
    government: { type: "Federal presidential constitutional republic", current_leader: "Luiz Inácio Lula da Silva", political_stability: "moderate" },
    visa: { ease_of_access: "easy", residency_options: "Digital Nomad Visa, Retirement, Investment, Family Reunification" },
    tax: { level: "high", income_tax: "7.5–27.5%", corporate_tax: "15% + 10% surcharge" },
    climate: { description: { en: "Mostly tropical with equatorial and subtropical regions", fr: "Principalement tropical avec des régions équatoriales et subtropicales", es: "Mayormente tropical con regiones ecuatoriales y subtropicales", pt: "Majoritariamente tropical com regiões equatoriais e subtropicais" }, average_temp: "25°C", seasons: "Wet and dry seasons" },
    military: { power_index: 0.1944, nuclear_weapon: false },
    cost_of_living: { index: 34, average_salary: 750 },
  },
  {
    iso_code: "IND",
    name: { en: "India", fr: "Inde", es: "India", pt: "Índia" },
    short_description: {
      en: "The world's most populous nation and a fast-growing digital and services economy.",
      fr: "La nation la plus peuplée au monde et une économie numérique et de services en forte croissance.",
      es: "La nación más poblada del mundo y una economía digital y de servicios en rápido crecimiento.",
      pt: "A nação mais populosa do mundo e uma economia digital e de serviços em rápido crescimento.",
    },
    capital: "New Delhi", language: "Hindi, English",
    main_industries: ["IT Services", "Agriculture", "Textiles", "Pharmaceuticals", "Automotive"],
    economy: { gdp: 3_730, gdp_per_capita: 2_610, main_exports: ["Refined Petroleum", "Pharmaceuticals", "Diamonds", "IT Services", "Rice"], main_imports: ["Crude Petroleum", "Gold", "Coal", "Diamonds", "Telecom Equipment"], currency: "INR", inflation: 5.4 },
    population_data: { population: 1_428_600_000, life_expectancy: 70.0, density: 464 },
    safety: { crime_index: 45, safety_index: 44 },
    government: { type: "Federal parliamentary constitutional republic", current_leader: "Narendra Modi", political_stability: "moderate" },
    visa: { ease_of_access: "medium", residency_options: "Employment, Business, Research, Overseas Citizen of India (OCI)" },
    tax: { level: "medium", income_tax: "5–30%", corporate_tax: "22–25%" },
    climate: { description: { en: "Tropical monsoon, arid desert, and alpine in the north", fr: "Mousson tropicale, désert aride et alpin au nord", es: "Monzón tropical, desierto árido y alpino en el norte", pt: "Monção tropical, deserto árido e alpino no norte" }, average_temp: "25°C", seasons: "Summer, monsoon, winter" },
    military: { power_index: 0.1025, nuclear_weapon: true },
    cost_of_living: { index: 24, average_salary: 520 },
  },
  {
    iso_code: "KOR",
    name: { en: "South Korea", fr: "Corée du Sud", es: "Corea del Sur", pt: "Coreia do Sul" },
    short_description: {
      en: "An innovation-driven economy and global leader in electronics and pop culture.",
      fr: "Une économie axée sur l'innovation et un leader mondial de l'électronique et de la culture pop.",
      es: "Una economía impulsada por la innovación y líder mundial en electrónica y cultura pop.",
      pt: "Uma economia impulsionada pela inovação e líder mundial em eletrônicos e cultura pop.",
    },
    capital: "Seoul", language: "Korean",
    main_industries: ["Electronics", "Automotive", "Shipbuilding", "Semiconductors", "Entertainment"],
    economy: { gdp: 1_670, gdp_per_capita: 32_420, main_exports: ["Integrated Circuits", "Cars", "Refined Petroleum", "Ships", "Displays"], main_imports: ["Crude Petroleum", "Integrated Circuits", "Natural Gas", "Coal", "Computers"], currency: "KRW", inflation: 3.6 },
    population_data: { population: 51_700_000, life_expectancy: 83.5, density: 531 },
    safety: { crime_index: 27, safety_index: 72 },
    government: { type: "Presidential constitutional republic", current_leader: "Han Duck-soo (acting)", political_stability: "moderate" },
    visa: { ease_of_access: "medium", residency_options: "D-8 Investor, E-7 Skilled Worker, F-2 Resident, Digital Nomad (Workcation)" },
    tax: { level: "medium", income_tax: "6–45%", corporate_tax: "9–24%" },
    climate: { description: { en: "Continental with hot, humid summers and cold, dry winters", fr: "Continental avec des étés chauds et humides et des hivers froids et secs", es: "Continental con veranos calurosos y húmedos e inviernos fríos y secos", pt: "Continental com verões quentes e úmidos e invernos frios e secos" }, average_temp: "12°C", seasons: "4 distinct seasons" },
    military: { power_index: 0.1505, nuclear_weapon: false },
    cost_of_living: { index: 66, average_salary: 3_100 },
  },
  {
    iso_code: "ARE",
    name: { en: "United Arab Emirates", fr: "Émirats arabes unis", es: "Emiratos Árabes Unidos", pt: "Emirados Árabes Unidos" },
    short_description: {
      en: "A modern, tax-friendly hub connecting East and West through trade and tourism.",
      fr: "Un hub moderne et fiscalement avantageux reliant l'Est et l'Ouest par le commerce et le tourisme.",
      es: "Un centro moderno y fiscalmente amigable que conecta Oriente y Occidente a través del comercio y el turismo.",
      pt: "Um centro moderno e fiscalmente favorável conectando Oriente e Ocidente através do comércio e turismo.",
    },
    capital: "Abu Dhabi", language: "Arabic",
    main_industries: ["Oil & Gas", "Tourism", "Real Estate", "Finance", "Logistics"],
    economy: { gdp: 507, gdp_per_capita: 53_760, main_exports: ["Crude Petroleum", "Refined Petroleum", "Gold", "Aluminum", "Diamonds"], main_imports: ["Gold", "Cars", "Diamonds", "Jewelry", "Telecom Equipment"], currency: "AED", inflation: 2.3 },
    population_data: { population: 9_400_000, life_expectancy: 78.0, density: 118 },
    safety: { crime_index: 15, safety_index: 84 },
    government: { type: "Federal constitutional monarchy (elective)", current_leader: "Sheikh Mohamed bin Zayed Al Nahyan", political_stability: "stable" },
    visa: { ease_of_access: "easy", residency_options: "Golden Visa (10yr), Green Visa, Freelancer, Remote Work Visa" },
    tax: { level: "low", income_tax: "0%", corporate_tax: "9% (above AED 375K)" },
    climate: { description: { en: "Hot desert with very high temperatures and minimal rainfall", fr: "Désert chaud avec des températures très élevées et des précipitations minimales", es: "Desierto caluroso con temperaturas muy altas y precipitaciones mínimas", pt: "Deserto quente com temperaturas muito altas e precipitação mínima" }, average_temp: "28°C", seasons: "Hot summer, mild winter" },
    military: { power_index: 0.3453, nuclear_weapon: false },
    cost_of_living: { index: 62, average_salary: 3_600 },
  },
  {
    iso_code: "SGP",
    name: { en: "Singapore", fr: "Singapour", es: "Singapur", pt: "Singapura" },
    short_description: {
      en: "A compact city-state that punches above its weight as a global finance and tech hub.",
      fr: "Une cité-État compacte qui surpasse sa taille en tant que hub mondial de la finance et de la tech.",
      es: "Una ciudad-estado compacta que supera su tamaño como centro global de finanzas y tecnología.",
      pt: "Uma cidade-estado compacta que supera seu tamanho como centro global de finanças e tecnologia.",
    },
    capital: "Singapore", language: "English, Malay, Mandarin, Tamil",
    main_industries: ["Finance", "Technology", "Biotech", "Shipping", "Electronics"],
    economy: { gdp: 397, gdp_per_capita: 65_230, main_exports: ["Integrated Circuits", "Refined Petroleum", "Gas Turbines", "Pharmaceuticals", "Gold"], main_imports: ["Integrated Circuits", "Refined Petroleum", "Crude Petroleum", "Gold", "Computers"], currency: "SGD", inflation: 2.5 },
    population_data: { population: 5_900_000, life_expectancy: 83.5, density: 8_358 },
    safety: { crime_index: 18, safety_index: 82 },
    government: { type: "Parliamentary republic", current_leader: "PM Lawrence Wong", political_stability: "stable" },
    visa: { ease_of_access: "medium", residency_options: "Employment Pass, EntrePass, ONE Pass, Permanent Residence" },
    tax: { level: "low", income_tax: "0–22%", corporate_tax: "17%" },
    climate: { description: { en: "Tropical rainforest — hot and humid year-round", fr: "Forêt tropicale — chaud et humide toute l'année", es: "Selva tropical — caluroso y húmedo todo el año", pt: "Floresta tropical — quente e úmido o ano todo" }, average_temp: "27°C", seasons: "No distinct seasons, always warm" },
    military: { power_index: 0.5088, nuclear_weapon: false },
    cost_of_living: { index: 81, average_salary: 4_500 },
  },
  {
    iso_code: "CHE",
    name: { en: "Switzerland", fr: "Suisse", es: "Suiza", pt: "Suíça" },
    short_description: {
      en: "A wealthy, neutral nation known for banking secrecy, precision, and quality of life.",
      fr: "Une nation riche et neutre connue pour le secret bancaire, la précision et la qualité de vie.",
      es: "Una nación rica y neutral conocida por el secreto bancario, la precisión y la calidad de vida.",
      pt: "Uma nação rica e neutra conhecida pelo sigilo bancário, precisão e qualidade de vida.",
    },
    capital: "Bern", language: "German, French, Italian",
    main_industries: ["Banking", "Pharmaceuticals", "Watchmaking", "Machinery", "Chocolate & Food"],
    economy: { gdp: 808, gdp_per_capita: 93_260, main_exports: ["Gold", "Pharmaceuticals", "Watches", "Machinery", "Medical Instruments"], main_imports: ["Gold", "Pharmaceuticals", "Cars", "Jewelry", "Crude Petroleum"], currency: "CHF", inflation: 1.4 },
    population_data: { population: 8_800_000, life_expectancy: 83.5, density: 220 },
    safety: { crime_index: 21, safety_index: 78 },
    government: { type: "Federal semi-direct democracy republic", current_leader: "Federal Council (7 members)", political_stability: "stable" },
    visa: { ease_of_access: "hard", residency_options: "L Permit (short-term), B Permit (annual), C Permit (permanent), Investor" },
    tax: { level: "low", income_tax: "0–11.5% federal + cantonal", corporate_tax: "8.5% federal + cantonal" },
    climate: { description: { en: "Temperate alpine with cold winters and mild summers", fr: "Alpin tempéré avec des hivers froids et des étés doux", es: "Alpino templado con inviernos fríos y veranos suaves", pt: "Alpino temperado com invernos frios e verões amenos" }, average_temp: "7°C", seasons: "4 distinct seasons" },
    military: { power_index: 0.7188, nuclear_weapon: false },
    cost_of_living: { index: 122, average_salary: 6_500 },
  },
  {
    iso_code: "MEX",
    name: { en: "Mexico", fr: "Mexique", es: "México", pt: "México" },
    short_description: {
      en: "A vibrant emerging economy with deep cultural roots and strong manufacturing exports.",
      fr: "Une économie émergente dynamique avec des racines culturelles profondes et de fortes exportations manufacturières.",
      es: "Una economía emergente vibrante con profundas raíces culturales y fuertes exportaciones manufactureras.",
      pt: "Uma economia emergente vibrante com raízes culturais profundas e fortes exportações manufatureiras.",
    },
    capital: "Mexico City", language: "Spanish",
    main_industries: ["Manufacturing", "Oil & Gas", "Agriculture", "Tourism", "Automotive"],
    economy: { gdp: 1_320, gdp_per_capita: 10_950, main_exports: ["Cars", "Computers", "Vehicle Parts", "Trucks", "Crude Petroleum"], main_imports: ["Refined Petroleum", "Vehicle Parts", "Integrated Circuits", "Computers", "Telecom Equipment"], currency: "MXN", inflation: 4.7 },
    population_data: { population: 128_900_000, life_expectancy: 75.0, density: 66 },
    safety: { crime_index: 54, safety_index: 41 },
    government: { type: "Federal presidential constitutional republic", current_leader: "Claudia Sheinbaum", political_stability: "moderate" },
    visa: { ease_of_access: "easy", residency_options: "Temporary Resident (1–4yr), Permanent Resident, Digital Nomad (180 days visa-free)" },
    tax: { level: "medium", income_tax: "1.92–35%", corporate_tax: "30%" },
    climate: { description: { en: "Varies from tropical to desert depending on altitude and region", fr: "Varie du tropical au désertique selon l'altitude et la région", es: "Varía de tropical a desértico según la altitud y la región", pt: "Varia de tropical a desértico dependendo da altitude e da região" }, average_temp: "21°C", seasons: "Wet and dry seasons" },
    military: { power_index: 0.4602, nuclear_weapon: false },
    cost_of_living: { index: 30, average_salary: 680 },
  },
  {
    iso_code: "NGA",
    name: { en: "Nigeria", fr: "Nigéria", es: "Nigeria", pt: "Nigéria" },
    short_description: {
      en: "Africa's largest economy and most populous nation with a booming tech startup scene.",
      fr: "La plus grande économie d'Afrique et la nation la plus peuplée avec une scène tech en plein essor.",
      es: "La mayor economía de África y la nación más poblada con una escena tecnológica en auge.",
      pt: "A maior economia da África e a nação mais populosa com uma cena de startups de tecnologia em expansão.",
    },
    capital: "Abuja", language: "English",
    main_industries: ["Oil & Gas", "Agriculture", "Telecommunications", "Finance", "Film (Nollywood)"],
    economy: { gdp: 477, gdp_per_capita: 2_180, main_exports: ["Crude Petroleum", "Natural Gas", "Cocoa", "Rubber", "Urea"], main_imports: ["Refined Petroleum", "Wheat", "Cars", "Rice", "Pharmaceuticals"], currency: "NGN", inflation: 28.9 },
    population_data: { population: 218_500_000, life_expectancy: 54.5, density: 226 },
    safety: { crime_index: 63, safety_index: 32 },
    government: { type: "Federal presidential constitutional republic", current_leader: "Bola Tinubu", political_stability: "unstable" },
    visa: { ease_of_access: "medium", residency_options: "Subject-to-Regularisation (STR), Temporary Work Permit, CERPAC" },
    tax: { level: "low", income_tax: "7–24%", corporate_tax: "30%" },
    climate: { description: { en: "Tropical in the south, arid in the north", fr: "Tropical au sud, aride au nord", es: "Tropical en el sur, árido en el norte", pt: "Tropical no sul, árido no norte" }, average_temp: "27°C", seasons: "Wet and dry seasons" },
    military: { power_index: 0.4683, nuclear_weapon: false },
    cost_of_living: { index: 22, average_salary: 250 },
  },
  {
    iso_code: "ZAF",
    name: { en: "South Africa", fr: "Afrique du Sud", es: "Sudáfrica", pt: "África do Sul" },
    short_description: {
      en: "Africa's most industrialized economy with rich mineral resources and diverse culture.",
      fr: "L'économie la plus industrialisée d'Afrique avec de riches ressources minérales et une culture diversifiée.",
      es: "La economía más industrializada de África con ricos recursos minerales y cultura diversa.",
      pt: "A economia mais industrializada da África com ricos recursos minerais e cultura diversificada.",
    },
    capital: "Pretoria", language: "English, Zulu, Afrikaans",
    main_industries: ["Mining", "Agriculture", "Finance", "Manufacturing", "Tourism"],
    economy: { gdp: 405, gdp_per_capita: 6_740, main_exports: ["Gold", "Platinum", "Iron Ore", "Cars", "Coal"], main_imports: ["Crude Petroleum", "Refined Petroleum", "Cars", "Telecom Equipment", "Pharmaceuticals"], currency: "ZAR", inflation: 5.3 },
    population_data: { population: 60_400_000, life_expectancy: 64.0, density: 49 },
    safety: { crime_index: 77, safety_index: 31 },
    government: { type: "Parliamentary republic", current_leader: "Cyril Ramaphosa", political_stability: "moderate" },
    visa: { ease_of_access: "medium", residency_options: "Critical Skills, General Work, Business, Retirement" },
    tax: { level: "medium", income_tax: "18–45%", corporate_tax: "27%" },
    climate: { description: { en: "Mostly semi-arid with subtropical east and Mediterranean southwest", fr: "Principalement semi-aride avec un est subtropical et un sud-ouest méditerranéen", es: "Mayormente semiárido con este subtropical y suroeste mediterráneo", pt: "Majoritariamente semiárido com leste subtropical e sudoeste mediterrâneo" }, average_temp: "18°C", seasons: "Reversed seasons (Southern Hemisphere)" },
    military: { power_index: 0.4632, nuclear_weapon: false },
    cost_of_living: { index: 33, average_salary: 1_100 },
  },
  {
    iso_code: "PRT",
    name: { en: "Portugal", fr: "Portugal", es: "Portugal", pt: "Portugal" },
    short_description: {
      en: "A welcoming European nation popular with digital nomads, offering sun, safety, and culture.",
      fr: "Une nation européenne accueillante populaire auprès des nomades numériques, offrant soleil, sécurité et culture.",
      es: "Una nación europea acogedora popular entre nómadas digitales, que ofrece sol, seguridad y cultura.",
      pt: "Uma nação europeia acolhedora popular entre nômades digitais, oferecendo sol, segurança e cultura.",
    },
    capital: "Lisbon", language: "Portuguese",
    main_industries: ["Tourism", "Textiles", "Cork", "Technology", "Wine"],
    economy: { gdp: 268, gdp_per_capita: 26_310, main_exports: ["Cars", "Vehicle Parts", "Refined Petroleum", "Leather Footwear", "Paper"], main_imports: ["Crude Petroleum", "Cars", "Vehicle Parts", "Pharmaceuticals", "Natural Gas"], currency: "EUR", inflation: 2.3 },
    population_data: { population: 10_300_000, life_expectancy: 81.5, density: 112 },
    safety: { crime_index: 29, safety_index: 71 },
    government: { type: "Unitary semi-presidential republic", current_leader: "Luís Montenegro", political_stability: "stable" },
    visa: { ease_of_access: "easy", residency_options: "D7 Passive Income, Digital Nomad, Golden Visa, Tech Visa, D2 Entrepreneur" },
    tax: { level: "medium", income_tax: "14.5–48% (NHR regime: 20% flat for 10yr)", corporate_tax: "21%" },
    climate: { description: { en: "Mediterranean with warm, dry summers and mild, wet winters", fr: "Méditerranéen avec des étés chauds et secs et des hivers doux et humides", es: "Mediterráneo con veranos cálidos y secos e inviernos suaves y húmedos", pt: "Mediterrâneo com verões quentes e secos e invernos amenos e úmidos" }, average_temp: "16°C", seasons: "Warm dry summers, mild winters" },
    military: { power_index: 0.8981, nuclear_weapon: false },
    cost_of_living: { index: 44, average_salary: 1_600 },
  },
  {
    iso_code: "ESP",
    name: { en: "Spain", fr: "Espagne", es: "España", pt: "Espanha" },
    short_description: {
      en: "A vibrant European economy with world-class tourism, cuisine, and renewable energy.",
      fr: "Une économie européenne dynamique avec un tourisme, une cuisine et des énergies renouvelables de classe mondiale.",
      es: "Una economía europea dinámica con turismo, gastronomía y energías renovables de clase mundial.",
      pt: "Uma economia europeia dinâmica com turismo, gastronomia e energias renováveis de classe mundial.",
    },
    capital: "Madrid", language: "Spanish",
    main_industries: ["Tourism", "Agriculture", "Automotive", "Renewable Energy", "Fashion"],
    economy: { gdp: 1_400, gdp_per_capita: 29_670, main_exports: ["Cars", "Refined Petroleum", "Vehicle Parts", "Pharmaceuticals", "Pork"], main_imports: ["Crude Petroleum", "Cars", "Pharmaceuticals", "Natural Gas", "Vehicle Parts"], currency: "EUR", inflation: 3.2 },
    population_data: { population: 47_400_000, life_expectancy: 83.5, density: 94 },
    safety: { crime_index: 33, safety_index: 66 },
    government: { type: "Parliamentary constitutional monarchy", current_leader: "King Felipe VI / PM Pedro Sánchez", political_stability: "stable" },
    visa: { ease_of_access: "easy", residency_options: "Non-Lucrative Visa, Digital Nomad Visa, Entrepreneur, Golden Visa" },
    tax: { level: "medium", income_tax: "19–47%", corporate_tax: "25%" },
    climate: { description: { en: "Mediterranean coast, continental interior, oceanic northwest", fr: "Côte méditerranéenne, intérieur continental, nord-ouest océanique", es: "Costa mediterránea, interior continental, noroeste oceánico", pt: "Costa mediterrânea, interior continental, noroeste oceânico" }, average_temp: "15°C", seasons: "Hot dry summers, mild winters" },
    military: { power_index: 0.4257, nuclear_weapon: false },
    cost_of_living: { index: 50, average_salary: 2_300 },
  },
  {
    iso_code: "ITA",
    name: { en: "Italy", fr: "Italie", es: "Italia", pt: "Itália" },
    short_description: {
      en: "A global icon of design, cuisine, and culture with a strong industrial northern economy.",
      fr: "Une icône mondiale du design, de la cuisine et de la culture avec une forte économie industrielle au nord.",
      es: "Un ícono global del diseño, la cocina y la cultura con una fuerte economía industrial en el norte.",
      pt: "Um ícone global de design, culinária e cultura com uma forte economia industrial no norte.",
    },
    capital: "Rome", language: "Italian",
    main_industries: ["Fashion", "Automotive", "Tourism", "Food & Beverage", "Machinery"],
    economy: { gdp: 2_010, gdp_per_capita: 34_100, main_exports: ["Pharmaceuticals", "Cars", "Refined Petroleum", "Vehicle Parts", "Packaged Food"], main_imports: ["Crude Petroleum", "Cars", "Pharmaceuticals", "Natural Gas", "Vehicle Parts"], currency: "EUR", inflation: 2.1 },
    population_data: { population: 59_000_000, life_expectancy: 83.0, density: 206 },
    safety: { crime_index: 46, safety_index: 58 },
    government: { type: "Unitary parliamentary republic", current_leader: "PM Giorgia Meloni", political_stability: "moderate" },
    visa: { ease_of_access: "medium", residency_options: "Elective Residence, Self-Employment, Digital Nomad, EU Blue Card" },
    tax: { level: "high", income_tax: "23–43%", corporate_tax: "24% + 3.9% IRAP" },
    climate: { description: { en: "Mediterranean in the south, continental in the north", fr: "Méditerranéen au sud, continental au nord", es: "Mediterráneo en el sur, continental en el norte", pt: "Mediterrâneo no sul, continental no norte" }, average_temp: "14°C", seasons: "4 seasons, warm south" },
    military: { power_index: 0.1863, nuclear_weapon: false },
    cost_of_living: { index: 58, average_salary: 2_600 },
  },
  {
    iso_code: "NLD",
    name: { en: "Netherlands", fr: "Pays-Bas", es: "Países Bajos", pt: "Países Baixos" },
    short_description: {
      en: "A small but mighty trading nation and Europe's gateway, with a progressive culture.",
      fr: "Une petite mais puissante nation commerçante et porte d'entrée de l'Europe, avec une culture progressiste.",
      es: "Una nación comercial pequeña pero poderosa y puerta de entrada a Europa, con una cultura progresista.",
      pt: "Uma nação comercial pequena mas poderosa e porta de entrada da Europa, com uma cultura progressista.",
    },
    capital: "Amsterdam", language: "Dutch",
    main_industries: ["Trade & Logistics", "Agriculture", "Technology", "Finance", "Energy"],
    economy: { gdp: 1_010, gdp_per_capita: 57_430, main_exports: ["Refined Petroleum", "Machinery", "Chemicals", "Flowers", "Pharmaceuticals"], main_imports: ["Crude Petroleum", "Computers", "Cars", "Refined Petroleum", "Telecom Equipment"], currency: "EUR", inflation: 2.7 },
    population_data: { population: 17_800_000, life_expectancy: 82.0, density: 521 },
    safety: { crime_index: 30, safety_index: 71 },
    government: { type: "Parliamentary constitutional monarchy", current_leader: "King Willem-Alexander / PM Dick Schoof", political_stability: "stable" },
    visa: { ease_of_access: "medium", residency_options: "Highly Skilled Migrant, DAFT (US/Japan), Startup Visa, Self-Employment" },
    tax: { level: "high", income_tax: "36.93–49.5%", corporate_tax: "19–25.8%" },
    climate: { description: { en: "Maritime temperate with cool summers and mild winters", fr: "Maritime tempéré avec des étés frais et des hivers doux", es: "Marítimo templado con veranos frescos e inviernos suaves", pt: "Marítimo temperado com verões frescos e invernos amenos" }, average_temp: "10°C", seasons: "4 seasons, frequent rain" },
    military: { power_index: 0.5765, nuclear_weapon: false },
    cost_of_living: { index: 73, average_salary: 4_000 },
  },
  {
    iso_code: "TUR",
    name: { en: "Turkey", fr: "Turquie", es: "Turquía", pt: "Turquia" },
    short_description: {
      en: "A transcontinental nation bridging Europe and Asia with a rapidly growing economy.",
      fr: "Une nation transcontinentale reliant l'Europe et l'Asie avec une économie en croissance rapide.",
      es: "Una nación transcontinental que une Europa y Asia con una economía en rápido crecimiento.",
      pt: "Uma nação transcontinental conectando Europa e Ásia com uma economia em rápido crescimento.",
    },
    capital: "Ankara", language: "Turkish",
    main_industries: ["Textiles", "Automotive", "Tourism", "Agriculture", "Construction"],
    economy: { gdp: 906, gdp_per_capita: 10_620, main_exports: ["Cars", "Gold", "Steel", "Textiles", "Machinery"], main_imports: ["Gold", "Crude Petroleum", "Steel", "Vehicle Parts", "Plastics"], currency: "TRY", inflation: 64.8 },
    population_data: { population: 85_300_000, life_expectancy: 76.0, density: 110 },
    safety: { crime_index: 41, safety_index: 52 },
    government: { type: "Presidential constitutional republic", current_leader: "Recep Tayyip Erdoğan", political_stability: "moderate" },
    visa: { ease_of_access: "easy", residency_options: "Tourism Residence, Short-Term, Citizenship by Investment ($400K real estate)" },
    tax: { level: "medium", income_tax: "15–40%", corporate_tax: "25%" },
    climate: { description: { en: "Mediterranean coast, continental interior with harsh winters", fr: "Côte méditerranéenne, intérieur continental avec des hivers rigoureux", es: "Costa mediterránea, interior continental con inviernos rigurosos", pt: "Costa mediterrânea, interior continental com invernos rigorosos" }, average_temp: "14°C", seasons: "4 seasons, variable by region" },
    military: { power_index: 0.1697, nuclear_weapon: false },
    cost_of_living: { index: 28, average_salary: 800 },
  },
  {
    iso_code: "THA",
    name: { en: "Thailand", fr: "Thaïlande", es: "Tailandia", pt: "Tailândia" },
    short_description: {
      en: "Southeast Asia's second-largest economy, a top destination for tourism and expat living.",
      fr: "La deuxième plus grande économie d'Asie du Sud-Est, une destination phare pour le tourisme et les expatriés.",
      es: "La segunda mayor economía del sudeste asiático, un destino líder para turismo y vida expatriada.",
      pt: "A segunda maior economia do Sudeste Asiático, um destino líder para turismo e vida de expatriados.",
    },
    capital: "Bangkok", language: "Thai",
    main_industries: ["Tourism", "Agriculture", "Electronics", "Automotive", "Food Processing"],
    economy: { gdp: 536, gdp_per_capita: 7_640, main_exports: ["Computers", "Cars", "Integrated Circuits", "Rubber", "Refined Petroleum"], main_imports: ["Crude Petroleum", "Gold", "Integrated Circuits", "Iron & Steel", "Machinery"], currency: "THB", inflation: 1.2 },
    population_data: { population: 71_800_000, life_expectancy: 77.0, density: 137 },
    safety: { crime_index: 39, safety_index: 55 },
    government: { type: "Parliamentary constitutional monarchy", current_leader: "King Vajiralongkorn / PM Paetongtarn Shinawatra", political_stability: "moderate" },
    visa: { ease_of_access: "easy", residency_options: "Long-Term Resident (LTR), Thailand Elite, Retirement Visa, Digital Nomad (DTV)" },
    tax: { level: "low", income_tax: "0–35%", corporate_tax: "20%" },
    climate: { description: { en: "Tropical — hot and humid with a distinct monsoon season", fr: "Tropical — chaud et humide avec une saison de mousson distincte", es: "Tropical — caluroso y húmedo con una temporada de monzón marcada", pt: "Tropical — quente e úmido com uma temporada de monção distinta" }, average_temp: "28°C", seasons: "Hot, rainy, cool seasons" },
    military: { power_index: 0.3417, nuclear_weapon: false },
    cost_of_living: { index: 32, average_salary: 650 },
  },
  {
    iso_code: "EGY",
    name: { en: "Egypt", fr: "Égypte", es: "Egipto", pt: "Egito" },
    short_description: {
      en: "A historic civilization and strategic Suez Canal nation with a young, growing population.",
      fr: "Une civilisation historique et une nation stratégique du canal de Suez avec une population jeune en croissance.",
      es: "Una civilización histórica y nación estratégica del canal de Suez con una población joven y creciente.",
      pt: "Uma civilização histórica e nação estratégica do canal de Suez com uma população jovem e crescente.",
    },
    capital: "Cairo", language: "Arabic",
    main_industries: ["Tourism", "Oil & Gas", "Agriculture", "Textiles", "Construction"],
    economy: { gdp: 476, gdp_per_capita: 4_290, main_exports: ["Crude Petroleum", "Refined Petroleum", "Gold", "Natural Gas", "Fertilizers"], main_imports: ["Wheat", "Crude Petroleum", "Cars", "Pharmaceuticals", "Corn"], currency: "EGP", inflation: 33.7 },
    population_data: { population: 104_300_000, life_expectancy: 72.0, density: 103 },
    safety: { crime_index: 46, safety_index: 45 },
    government: { type: "Presidential republic", current_leader: "Abdel Fattah el-Sisi", political_stability: "moderate" },
    visa: { ease_of_access: "easy", residency_options: "Tourist Visa on Arrival, Work Permit, Investor Residence, Property Ownership" },
    tax: { level: "low", income_tax: "0–25%", corporate_tax: "22.5%" },
    climate: { description: { en: "Hot desert with very little rainfall year-round", fr: "Désert chaud avec très peu de précipitations toute l'année", es: "Desierto caluroso con muy pocas precipitaciones durante todo el año", pt: "Deserto quente com muito pouca precipitação durante todo o ano" }, average_temp: "22°C", seasons: "Hot summer, mild winter" },
    military: { power_index: 0.2283, nuclear_weapon: false },
    cost_of_living: { index: 20, average_salary: 300 },
  },
  {
    iso_code: "COL",
    name: { en: "Colombia", fr: "Colombie", es: "Colombia", pt: "Colômbia" },
    short_description: {
      en: "A resurging Latin American economy with biodiversity, culture, and a growing tech scene.",
      fr: "Une économie latino-américaine en résurgence avec biodiversité, culture et une scène tech en croissance.",
      es: "Una economía latinoamericana en resurgimiento con biodiversidad, cultura y una escena tecnológica en crecimiento.",
      pt: "Uma economia latino-americana ressurgente com biodiversidade, cultura e uma cena tecnológica em crescimento.",
    },
    capital: "Bogotá", language: "Spanish",
    main_industries: ["Oil & Gas", "Coffee", "Mining", "Tourism", "Technology"],
    economy: { gdp: 344, gdp_per_capita: 6_630, main_exports: ["Crude Petroleum", "Coal", "Coffee", "Gold", "Cut Flowers"], main_imports: ["Refined Petroleum", "Cars", "Corn", "Pharmaceuticals", "Telecom Equipment"], currency: "COP", inflation: 9.3 },
    population_data: { population: 51_900_000, life_expectancy: 77.0, density: 46 },
    safety: { crime_index: 60, safety_index: 40 },
    government: { type: "Presidential constitutional republic", current_leader: "Gustavo Petro", political_stability: "moderate" },
    visa: { ease_of_access: "easy", residency_options: "Digital Nomad Visa, Investment, Retirement, Marriage, Work Permit" },
    tax: { level: "medium", income_tax: "0–39%", corporate_tax: "35%" },
    climate: { description: { en: "Tropical along the coast and plains, cooler in the highlands", fr: "Tropical le long de la côte et des plaines, plus frais dans les hauts plateaux", es: "Tropical a lo largo de la costa y llanuras, más fresco en las tierras altas", pt: "Tropical ao longo da costa e planícies, mais fresco nas terras altas" }, average_temp: "24°C", seasons: "Wet and dry seasons" },
    military: { power_index: 0.4177, nuclear_weapon: false },
    cost_of_living: { index: 27, average_salary: 550 },
  },
  {
    iso_code: "NOR",
    name: { en: "Norway", fr: "Norvège", es: "Noruega", pt: "Noruega" },
    short_description: {
      en: "One of the world's wealthiest nations with a sovereign wealth fund and exceptional welfare.",
      fr: "L'une des nations les plus riches au monde avec un fonds souverain et une protection sociale exceptionnelle.",
      es: "Una de las naciones más ricas del mundo con un fondo soberano y un bienestar social excepcional.",
      pt: "Uma das nações mais ricas do mundo com um fundo soberano e bem-estar social excepcional.",
    },
    capital: "Oslo", language: "Norwegian",
    main_industries: ["Oil & Gas", "Shipping", "Seafood", "Renewable Energy", "Technology"],
    economy: { gdp: 579, gdp_per_capita: 106_150, main_exports: ["Crude Petroleum", "Natural Gas", "Fish", "Aluminum", "Nickel"], main_imports: ["Cars", "Computers", "Refined Petroleum", "Pharmaceuticals", "Telecom Equipment"], currency: "NOK", inflation: 3.8 },
    population_data: { population: 5_500_000, life_expectancy: 83.0, density: 15 },
    safety: { crime_index: 29, safety_index: 75 },
    government: { type: "Parliamentary constitutional monarchy", current_leader: "King Harald V / PM Jonas Gahr Støre", political_stability: "stable" },
    visa: { ease_of_access: "hard", residency_options: "Skilled Worker, Family Immigration, Self-Employment, EU/EEA Free Movement" },
    tax: { level: "high", income_tax: "22% flat + bracket tax (0–17.6%)", corporate_tax: "22%" },
    climate: { description: { en: "Maritime west coast, continental interior, arctic north", fr: "Côte ouest maritime, intérieur continental, nord arctique", es: "Costa oeste marítima, interior continental, norte ártico", pt: "Costa oeste marítima, interior continental, norte ártico" }, average_temp: "2°C", seasons: "4 seasons, midnight sun/polar night" },
    military: { power_index: 0.7212, nuclear_weapon: false },
    cost_of_living: { index: 101, average_salary: 5_800 },
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getCountryByIso(iso: string): Country | undefined {
  return countries.find(
    (c) => c.iso_code.toLowerCase() === iso.toLowerCase()
  );
}

export function getCountryByName(name: string): Country | undefined {
  const lower = name.toLowerCase();
  return countries.find(
    (c) => c.name.en.toLowerCase() === lower
  );
}
