export type Goal = "expatriation" | "business" | "investment" | "exploration";
export type ClimatePreference = "tropical" | "temperate" | "continental" | "arid" | "any";
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;
export type FamilyStatus = "single" | "couple" | "family";
export type BudgetRange = "under_1000" | "1000_2000" | "2000_4000" | "4000_plus";
export type IncomeRange = "under_2000" | "2000_5000" | "5000_10000" | "10000_plus";

export interface UserProfile {
  nationality: string;
  currentCountry: string;
  preferredLanguage: string;
  budgetRange: BudgetRange;
  incomeRange: IncomeRange;
  goal: Goal;
  climatePreference: ClimatePreference;
  taxImportance: ImportanceLevel;
  safetyImportance: ImportanceLevel;
  costImportance: ImportanceLevel;
  visaImportance: ImportanceLevel;
  familyStatus: FamilyStatus;
  businessSector: string;
}

// A single contextual insight — generated dynamically, not a static key
export interface Insight {
  text: string;
  type: "positive" | "tradeoff";
}

export interface CountryMatch {
  iso_code: string;
  score: number; // 0–100
  insights: Insight[];
  summary: string; // personalized paragraph
  edgeOverNext: string; // why this ranks higher than the next
}

export const DEFAULT_PROFILE: UserProfile = {
  nationality: "",
  currentCountry: "",
  preferredLanguage: "",
  budgetRange: "2000_4000",
  incomeRange: "5000_10000",
  goal: "exploration",
  climatePreference: "any",
  taxImportance: 3,
  safetyImportance: 3,
  costImportance: 3,
  visaImportance: 3,
  familyStatus: "single",
  businessSector: "",
};
