"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserProfile, CountryMatch } from "@/types/profile";

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
  const [matches, setMatches] = useState<CountryMatch[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  const togglePremium = useCallback(() => {
    setIsPremium((prev) => !prev);
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    setMatches([]);
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
