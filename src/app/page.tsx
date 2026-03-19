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
import { getScoreMap, MODULES, type ModuleId } from "@/lib/scoring";
import type { CountryInfo } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });
const ParticleField = dynamic(() => import("@/components/effects/ParticleField"), { ssr: false });

export default function Home() {
  const { hasCompletedOnboarding } = useProfile();

  // Module state
  const [activeModule, setActiveModule] = useState<ModuleId>("investment");
  const scoreMap = useMemo(() => getScoreMap(activeModule), [activeModule]);
  const activeModuleDef = MODULES.find((m) => m.id === activeModule);

  // Panel state
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [compareIsos, setCompareIsos] = useState<string[]>([]);

  // Active view state for top bar
  const [activeView, setActiveView] = useState<"explore" | "ai" | "compare">("explore");

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
    setActiveView("ai");
  }, []);

  const handleCloseAI = useCallback(() => {
    setIsAIOpen(false);
    setActiveView("explore");
  }, []);

  // --- Compare ---
  const handleAddToCompare = useCallback((iso: string) => {
    setCompareIsos((prev) => {
      if (prev.includes(iso) || prev.length >= 4) return prev;
      return [...prev, iso];
    });
    setIsCompareOpen(true);
    setActiveView("compare");
  }, []);

  const handleRemoveFromCompare = useCallback((iso: string) => {
    setCompareIsos((prev) => prev.filter((i) => i !== iso));
  }, []);

  const handleCloseCompare = useCallback(() => {
    setIsCompareOpen(false);
    setActiveView("explore");
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

  // --- View handlers ---
  const handleViewChange = useCallback((view: "explore" | "ai" | "compare") => {
    setActiveView(view);
    if (view === "ai") {
      setIsAIOpen(true);
      setIsInsightOpen(false);
      setIsCompareOpen(false);
    } else if (view === "compare") {
      setIsCompareOpen(true);
      setIsAIOpen(false);
    } else {
      setIsAIOpen(false);
      setIsCompareOpen(false);
    }
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050510]">
      {/* === IMMERSIVE BACKGROUND === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 w-[1000px] h-[1000px] rounded-full ax-breathe ax-gradient-rotate"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 35%, transparent 70%)" }}
        />
        <div
          className="absolute left-[30%] top-[60%] w-[600px] h-[600px] rounded-full ax-breathe"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.03) 0%, transparent 60%)", animationDelay: "4s", animationDuration: "12s" }}
        />
      </div>

      <ParticleField />

      {/* === LEFT ICON RAIL + DRAWER === */}
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onCountrySelect={handleSidebarCountrySelect}
        selectedIso={selectedIso}
        onOpenAI={() => handleOpenAI()}
        onOpenCompare={() => { setIsCompareOpen(true); setActiveView("compare"); }}
        onOpenProfile={() => setIsOnboardingOpen(true)}
        onOpenRecommendations={() => setIsResultsOpen(true)}
        compareCount={compareIsos.length}
      />

      {/* === FULL MAP AREA (hero) === */}
      <div className="absolute left-[72px] top-0 bottom-0 right-0">
        <MapView onCountryClick={handleCountryClick} scoreMap={scoreMap} />

        {/* ── Floating Top Bar ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 ax-fade-in-up">
          <div className="flex items-center gap-1 rounded-2xl ax-glass-2 px-2 py-1.5 ax-depth-2">
            {/* Nav tabs */}
            <button
              onClick={() => handleViewChange("explore")}
              className={`ax-nav-tab flex items-center gap-2 ${activeView === "explore" ? "active" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>Explore</span>
            </button>

            <button
              onClick={() => handleViewChange("ai")}
              className={`ax-nav-tab flex items-center gap-2 ${activeView === "ai" ? "active" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
              <span>AI Advisor</span>
            </button>

            <button
              onClick={() => handleViewChange("compare")}
              className={`ax-nav-tab flex items-center gap-2 ${activeView === "compare" ? "active" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Compare</span>
              {compareIsos.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/80 text-[9px] font-bold text-white">
                  {compareIsos.length}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/[0.06] mx-1" />

            {/* Profile / Setup */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className={`ax-nav-tab flex items-center gap-2 ${hasCompletedOnboarding ? "text-emerald-400/50" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
              </svg>
              <span>{hasCompletedOnboarding ? "Profile" : "Set up"}</span>
            </button>
          </div>
        </div>

        {/* ── Module Indicator (bottom-left over map) ── */}
        <div className="absolute bottom-24 left-5 z-10 ax-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 rounded-2xl ax-glass-2 px-5 py-3 pointer-events-none ax-depth-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06]">
              <span className="text-sm">{activeModuleDef?.icon}</span>
            </div>
            <div>
              <span className="block text-[13px] font-semibold text-white/80 capitalize tracking-tight">
                {activeModule.replace(/_/g, " ")}
              </span>
              <span className="block text-[10px] text-white/30">Countries color-coded by score</span>
            </div>
          </div>
        </div>

        {/* ── Score Legend (bottom-left) ── */}
        <div className="absolute bottom-8 left-5 z-10">
          <div className="flex items-center gap-5 rounded-xl ax-glass-1 px-4 py-2 pointer-events-none ax-depth-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-emerald-400/50" />
              <span className="text-[10px] font-medium text-white/30">70–100</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-amber-400/40" />
              <span className="text-[10px] font-medium text-white/30">40–69</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-red-400/40" />
              <span className="text-[10px] font-medium text-white/30">0–39</span>
            </div>
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
      <AIPanel isOpen={isAIOpen} onClose={handleCloseAI} onAddToCompare={handleAddToCompare} activeModule={activeModule} />

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
