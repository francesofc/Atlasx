"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";

export type Locale = "en" | "fr" | "es" | "pt";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  es: "ES",
  pt: "PT",
};

type Translations = typeof en;
const translations: Record<Locale, Translations> = { en, fr, es, pt };

// ---------------------------------------------------------------------------
// Deep merge with fallback: if a key is missing in locale, use English
// ---------------------------------------------------------------------------
function deepMerge<T extends Record<string, unknown>>(fallback: T, override: T): T {
  const result = { ...fallback } as Record<string, unknown>;
  for (const key in override) {
    if (
      typeof override[key] === "object" &&
      override[key] !== null &&
      !Array.isArray(override[key]) &&
      typeof fallback[key] === "object" &&
      fallback[key] !== null
    ) {
      result[key] = deepMerge(
        fallback[key] as Record<string, unknown>,
        override[key] as Record<string, unknown>
      );
    } else if (override[key] !== undefined && override[key] !== "") {
      result[key] = override[key];
    }
  }
  return result as T;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  // Always merge with English as fallback so missing keys display cleanly
  const t =
    locale === "en"
      ? en
      : deepMerge(en as unknown as Record<string, unknown>, translations[locale] as unknown as Record<string, unknown>) as Translations;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
