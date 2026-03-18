export type Goal = "low_taxes" | "save_money" | "quality_of_life" | "business" | "remote_work" | "investment";
export type ClimatePreference = "warm" | "mild" | "cold" | "any";
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5;
export type FamilyStatus = "single" | "couple" | "family";
export type BudgetRange = "under_1000" | "1000_3000" | "3000_5000" | "5000_plus";

export interface UserProfile {
  nationality: string;
  currentCountry: string;
  budgetRange: BudgetRange;
  goals: Goal[]; // multi-select
  climatePreference: ClimatePreference;
  taxImportance: ImportanceLevel;
  safetyImportance: ImportanceLevel;
  costImportance: ImportanceLevel;
  visaImportance: ImportanceLevel;
  familyStatus: FamilyStatus;
  businessSector: string;
  // Legacy compat — derived from goals for systems that use single goal
  goal: Goal;
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
  budgetRange: "3000_5000",
  goals: ["quality_of_life"],
  goal: "quality_of_life",
  climatePreference: "any",
  taxImportance: 3,
  safetyImportance: 3,
  costImportance: 3,
  visaImportance: 3,
  familyStatus: "single",
  businessSector: "",
};
