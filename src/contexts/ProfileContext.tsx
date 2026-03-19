"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { UserProfile, CountryMatch } from "@/types/profile";

const STORAGE_KEY = "atlas-x-profile";
const MATCHES_KEY = "atlas-x-matches";

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

  // Hydrate from localStorage ONLY on client after mount
  useEffect(() => {
    try {
      const rawProfile = localStorage.getItem(STORAGE_KEY);
      const rawMatches = localStorage.getItem(MATCHES_KEY);
      if (rawProfile) setProfileState(JSON.parse(rawProfile));
      if (rawMatches) setMatchesState(JSON.parse(rawMatches));
    } catch {
      // storage unavailable or corrupt — continue with defaults
    }
  }, []);

  const togglePremium = useCallback(() => {
    setIsPremium((prev) => !prev);
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  }, []);

  const setMatches = useCallback((m: CountryMatch[]) => {
    setMatchesState(m);
    try { localStorage.setItem(MATCHES_KEY, JSON.stringify(m)); } catch {}
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    setMatchesState([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MATCHES_KEY);
    } catch {}
  }, []);

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
