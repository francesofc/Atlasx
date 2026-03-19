"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import InsightPanel from "@/components/panels/InsightPanel";
import AIPanel from "@/components/panels/AIPanel";
import ComparePanel from "@/components/panels/ComparePanel";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import ResultsModal from "@/components/onboarding/ResultsModal";
import { useProfile } from "@/contexts/ProfileContext";
import { getScoreMap, type ModuleId } from "@/lib/scoring";
import type { CountryInfo } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });
const ParticleField = dynamic(() => import("@/components/effects/ParticleField"), { ssr: false });

export default function Home() {
  const { hasCompletedOnboarding } = useProfile();

  // Module state
  const [activeModule, setActiveModule] = useState<ModuleId>("investment");
  const scoreMap = useMemo(() => getScoreMap(activeModule), [activeModule]);

  // Panel state
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [compareIsos, setCompareIsos] = useState<string[]>([]);

  // --- Map country click ---
  const handleCountryClick = useCallback((country: CountryInfo) => {
    if (isCompareOpen && compareIsos.length < 4) {
      const iso = country.iso;
      if (iso && !compareIsos.includes(iso)) {
        setCompareIsos((prev) => [...prev, iso]);
        return;
      }
    }
    setSelectedIso(country.iso);
    setIsInsightOpen(true);
    setIsAIOpen(false);
  }, [isCompareOpen, compareIsos]);

  // --- Sidebar country select ---
  const handleSidebarCountrySelect = useCallback((iso: string) => {
    setSelectedIso(iso);
    setIsInsightOpen(true);
    setIsAIOpen(false);
  }, []);

  // --- Panel close ---
  const handleInsightClose = useCallback(() => {
    setIsInsightOpen(false);
  }, []);

  // --- AI ---
  const handleOpenAI = useCallback((iso?: string) => {
    if (iso) setSelectedIso(iso);
    setIsInsightOpen(false);
    setIsAIOpen(true);
  }, []);

  const handleCloseAI = useCallback(() => {
    setIsAIOpen(false);
  }, []);

  // --- Compare ---
  const handleAddToCompare = useCallback((iso: string) => {
    setCompareIsos((prev) => {
      if (prev.includes(iso) || prev.length >= 4) return prev;
      return [...prev, iso];
    });
    setIsCompareOpen(true);
  }, []);

  const handleRemoveFromCompare = useCallback((iso: string) => {
    setCompareIsos((prev) => prev.filter((i) => i !== iso));
  }, []);

  const handleCloseCompare = useCallback(() => {
    setIsCompareOpen(false);
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareIsos([]);
  }, []);

  const handleAddSlot = useCallback(() => {
    setIsInsightOpen(false);
  }, []);

  // --- Onboarding ---
  const handleCloseOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setIsOnboardingOpen(false);
    setIsResultsOpen(true);
  }, []);

  const handleCloseResults = useCallback(() => {
    setIsResultsOpen(false);
  }, []);

  const handleRedoOnboarding = useCallback(() => {
    setIsResultsOpen(false);
    setIsOnboardingOpen(true);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050510]">
      {/* === IMMERSIVE BACKGROUND === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 w-[900px] h-[900px] rounded-full ax-breathe ax-gradient-rotate"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.05) 35%, transparent 70%)" }}
        />
        <div
          className="absolute left-[35%] top-[65%] w-[600px] h-[600px] rounded-full ax-breathe"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 60%)", animationDelay: "4s", animationDuration: "12s" }}
        />
      </div>

      <ParticleField />

      {/* === LEFT SIDEBAR === */}
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onCountrySelect={handleSidebarCountrySelect}
        selectedIso={selectedIso}
        onOpenAI={() => handleOpenAI()}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenProfile={() => setIsOnboardingOpen(true)}
        onOpenRecommendations={() => setIsResultsOpen(true)}
        compareCount={compareIsos.length}
      />

      {/* === CENTER MAP === */}
      <div className="absolute left-[260px] top-0 bottom-0 right-0">
        <MapView onCountryClick={handleCountryClick} scoreMap={scoreMap} />

        {/* Module indicator overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl ax-glass-2 px-4 py-2.5 pointer-events-none">
          <span className="text-sm">{(() => { const m = ['📈','💰','🛡','🛂','🏠','✨']; const ids: ModuleId[] = ['investment','tax','safety','visa','cost_of_living','quality_of_life']; return m[ids.indexOf(activeModule)]; })()}</span>
          <div>
            <span className="text-[12px] font-bold text-white/80 capitalize">{activeModule.replace(/_/g, " ")}</span>
            <span className="block text-[9px] text-white/30">Module active — countries color-coded by score</span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-20 left-4 flex items-center gap-4 rounded-xl ax-glass-1 px-4 py-2 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/60" />
            <span className="text-[9px] font-medium text-white/35">70–100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/50" />
            <span className="text-[9px] font-medium text-white/35">40–69</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400/50" />
            <span className="text-[9px] font-medium text-white/35">0–39</span>
          </div>
        </div>
      </div>

      {/* === RIGHT INSIGHT PANEL === */}
      <InsightPanel
        iso={selectedIso}
        module={activeModule}
        isOpen={isInsightOpen}
        onClose={handleInsightClose}
        onAskAI={(iso) => handleOpenAI(iso)}
        onAddToCompare={handleAddToCompare}
      />

      {/* === AI PANEL === */}
      <AIPanel isOpen={isAIOpen} onClose={handleCloseAI} onAddToCompare={handleAddToCompare} />

      {/* === COMPARE PANEL === */}
      <ComparePanel
        isOpen={isCompareOpen}
        onClose={handleCloseCompare}
        compareIsos={compareIsos}
        onRemoveCountry={handleRemoveFromCompare}
        onAddSlot={handleAddSlot}
        onClearAll={handleClearCompare}
      />

      {/* === MODALS === */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
        onComplete={handleOnboardingComplete}
        editMode={hasCompletedOnboarding}
      />
      <ResultsModal
        isOpen={isResultsOpen}
        onClose={handleCloseResults}
        onRedo={handleRedoOnboarding}
      />
    </main>
  );
}
