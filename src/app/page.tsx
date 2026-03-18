"use client";

import { useState, useCallback, lazy, Suspense } from "react";
import MapView from "@/components/map/MapView";
import CountryPanel from "@/components/panels/CountryPanel";
import AIPanel from "@/components/panels/AIPanel";
import ComparePanel from "@/components/panels/ComparePanel";
import Header, { type ActiveView } from "@/components/layout/Header";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import ResultsModal from "@/components/onboarding/ResultsModal";
import { useProfile } from "@/contexts/ProfileContext";
import type { CountryInfo } from "@/types";

// Lazy-load particle field so it doesn't block initial render
const ParticleField = lazy(() => import("@/components/effects/ParticleField"));

export default function Home() {
  const { hasCompletedOnboarding } = useProfile();
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("explore");
  const [compareIsos, setCompareIsos] = useState<string[]>([]);

  // --- Map interactions ---
  const handleCountryClick = useCallback((country: CountryInfo) => {
    // If compare panel is open, add country directly to comparison
    if (isCompareOpen && compareIsos.length < 4) {
      const iso = country.iso;
      if (iso && !compareIsos.includes(iso)) {
        setCompareIsos((prev) => [...prev, iso]);
        return;
      }
    }
    setSelectedCountry(country);
    setIsPanelOpen(true);
  }, [isCompareOpen, compareIsos]);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // --- Navigation ---
  const handleChangeView = useCallback(
    (view: ActiveView) => {
      setActiveView(view);

      switch (view) {
        case "explore":
          // Close overlays, return to map
          setIsAIOpen(false);
          setIsCompareOpen(false);
          break;
        case "ai":
          setIsAIOpen(true);
          setIsCompareOpen(false);
          break;
        case "compare":
          setIsCompareOpen(true);
          setIsAIOpen(false);
          break;
        case "recommendations":
          setIsAIOpen(false);
          setIsCompareOpen(false);
          if (hasCompletedOnboarding) {
            // Show results directly
            setIsResultsOpen(true);
          } else {
            // Trigger onboarding first
            setIsOnboardingOpen(true);
          }
          break;
      }
    },
    [hasCompletedOnboarding]
  );

  // --- Onboarding ---
  const handleCloseOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
    setActiveView("explore");
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setIsOnboardingOpen(false);
    setIsResultsOpen(true);
    setActiveView("recommendations");
  }, []);

  // --- Results ---
  const handleCloseResults = useCallback(() => {
    setIsResultsOpen(false);
    setActiveView("explore");
  }, []);

  const handleRedoOnboarding = useCallback(() => {
    setIsResultsOpen(false);
    setIsOnboardingOpen(true);
  }, []);

  // --- AI / Compare close ---
  const handleCloseAI = useCallback(() => {
    setIsAIOpen(false);
    setActiveView("explore");
  }, []);

  const handleCloseCompare = useCallback(() => {
    setIsCompareOpen(false);
    setActiveView("explore");
  }, []);

  // --- Compare management ---
  const handleAddToCompare = useCallback((iso: string) => {
    setCompareIsos((prev) => {
      if (prev.includes(iso) || prev.length >= 4) return prev;
      return [...prev, iso];
    });
    // Open compare panel and switch view
    setIsCompareOpen(true);
    setActiveView("compare");
  }, []);

  const handleRemoveFromCompare = useCallback((iso: string) => {
    setCompareIsos((prev) => prev.filter((i) => i !== iso));
  }, []);

  const handleAddSlot = useCallback(() => {
    // Close compare panel temporarily so user can click map
    // The panel stays "open" but user is guided to click on map
    setIsPanelOpen(false);
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareIsos([]);
  }, []);

  // --- Open AI with context ---
  const handleAskAIAbout = useCallback((iso: string) => {
    setIsPanelOpen(false);
    setIsAIOpen(true);
    setActiveView("ai");
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030305]">
      {/* === IMMERSIVE BACKGROUND SYSTEM === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary breathing glow — violet/blue */}
        <div
          className="absolute left-1/2 top-1/2 w-[800px] h-[800px] rounded-full ax-breathe ax-gradient-rotate"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, rgba(59,130,246,0.05) 40%, rgba(6,182,212,0.03) 70%, transparent 100%)",
          }}
        />
        {/* Secondary warm glow — offset, slower */}
        <div
          className="absolute left-[40%] top-[60%] w-[600px] h-[600px] rounded-full ax-breathe"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, rgba(236,72,153,0.02) 50%, transparent 100%)",
            animationDelay: "4s",
            animationDuration: "12s",
          }}
        />
        {/* Tertiary edge glow */}
        <div
          className="absolute right-[-10%] top-[20%] w-[400px] h-[400px] rounded-full ax-breathe"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.03) 0%, transparent 70%)",
            animationDelay: "2s",
            animationDuration: "10s",
          }}
        />
      </div>

      {/* Canvas particle field */}
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>

      <Header activeView={activeView} onChangeView={handleChangeView} compareCount={compareIsos.length} />
      <MapView onCountryClick={handleCountryClick} />

      <CountryPanel
        country={selectedCountry}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        onAddToCompare={handleAddToCompare}
        onAskAI={handleAskAIAbout}
      />

      <AIPanel isOpen={isAIOpen} onClose={handleCloseAI} onAddToCompare={handleAddToCompare} />
      <ComparePanel
        isOpen={isCompareOpen}
        onClose={handleCloseCompare}
        compareIsos={compareIsos}
        onRemoveCountry={handleRemoveFromCompare}
        onAddSlot={handleAddSlot}
        onClearAll={handleClearCompare}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
        onComplete={handleOnboardingComplete}
      />
      <ResultsModal
        isOpen={isResultsOpen}
        onClose={handleCloseResults}
        onRedo={handleRedoOnboarding}
      />
    </main>
  );
}
