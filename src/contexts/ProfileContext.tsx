"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { UserProfile, CountryMatch } from "@/types/profile";

const STORAGE_KEY = "atlas-x-profile";
const MATCHES_KEY = "atlas-x-matches";

function loadFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked
  }
}

interface ProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  matches: CountryMatch[];
  setMatches: (matches: CountryMatch[]) => void;
  hasCompletedOnboarding: boolean;
  isPremium: boolean;
  togglePremium: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  setProfile: () => {},
  clearProfile: () => {},
  matches: [],
  setMatches: () => {},
  hasCompletedOnboarding: false,
  isPremium: false,
  togglePremium: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [matches, setMatchesState] = useState<CountryMatch[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedProfile = loadFromStorage<UserProfile>(STORAGE_KEY);
    const savedMatches = loadFromStorage<CountryMatch[]>(MATCHES_KEY);
    if (savedProfile) setProfileState(savedProfile);
    if (savedMatches) setMatchesState(savedMatches);
    setHydrated(true);
  }, []);

  const togglePremium = useCallback(() => {
    setIsPremium((prev) => !prev);
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    saveToStorage(STORAGE_KEY, p);
  }, []);

  const setMatches = useCallback((m: CountryMatch[]) => {
    setMatchesState(m);
    saveToStorage(MATCHES_KEY, m);
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    setMatchesState([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MATCHES_KEY);
    }
  }, []);

  // Don't render until hydrated to avoid flicker
  if (!hydrated) return null;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        clearProfile,
        matches,
        setMatches,
        hasCompletedOnboarding: profile !== null,
        isPremium,
        togglePremium,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
