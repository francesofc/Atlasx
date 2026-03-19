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
      <div className="absolute left-[280px] top-0 bottom-0 right-0">
        <MapView onCountryClick={handleCountryClick} scoreMap={scoreMap} />

        {/* ── Premium Floating Command Bar ── */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 ax-fade-in-up">
          <div className="flex items-center gap-0.5 rounded-[20px] bg-[#0c0c1a]/80 backdrop-blur-xl border border-white/[0.07] px-2.5 py-2 ax-depth-2" style={{ boxShadow: "0 0 30px rgba(139,92,246,0.06), 0 4px 20px rgba(0,0,0,0.3)" }}>
            <button
              onClick={() => handleViewChange("explore")}
              className={`flex items-center gap-2.5 rounded-[14px] px-5 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                activeView === "explore"
                  ? "bg-white/[0.1] text-white/90 shadow-lg shadow-black/20"
                  : "text-white/40 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              Explore
            </button>

            <button
              onClick={() => handleViewChange("ai")}
              className={`flex items-center gap-2.5 rounded-[14px] px-5 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                activeView === "ai"
                  ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300/90 shadow-lg shadow-cyan-500/10 border border-cyan-500/10"
                  : "text-white/40 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
              AI Advisor
            </button>

            <button
              onClick={() => handleViewChange("compare")}
              className={`flex items-center gap-2.5 rounded-[14px] px-5 py-2.5 text-[13px] font-medium transition-all duration-300 relative ${
                activeView === "compare"
                  ? "bg-gradient-to-r from-violet-500/15 to-indigo-500/10 text-violet-300/90 shadow-lg shadow-violet-500/10 border border-violet-500/10"
                  : "text-white/40 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              Compare
              {compareIsos.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white shadow-lg shadow-violet-500/40">
                  {compareIsos.length}
                </span>
              )}
            </button>

            <div className="w-px h-7 bg-white/[0.06] mx-1" />

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className={`flex items-center gap-2.5 rounded-[14px] px-4 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                hasCompletedOnboarding
                  ? "text-emerald-400/50 hover:text-emerald-400/70 hover:bg-emerald-500/[0.04]"
                  : "text-white/40 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
              </svg>
              {hasCompletedOnboarding ? "Profile" : "Set up"}
            </button>
          </div>
        </div>

        {/* ── Active Module Indicator ── */}
        <div className="absolute bottom-20 left-6 z-10 ax-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 rounded-2xl bg-[#0c0c1a]/70 backdrop-blur-xl border border-white/[0.06] px-5 py-3.5 ax-depth-1 transition-transform duration-200 hover:scale-[1.03] cursor-default">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.06]">
              <span className="text-sm text-white/60">{activeModuleDef?.icon}</span>
            </div>
            <div>
              <span className="block text-[13px] font-semibold text-white/85 capitalize tracking-tight">
                {activeModule.replace(/_/g, " ")}
              </span>
              <span className="block text-[10px] text-white/30 mt-0.5">Analyzing {Object.keys(scoreMap).length} countries</span>
            </div>
          </div>
        </div>

        {/* ── Score Legend ── */}
        <div className="absolute bottom-6 left-6 z-10">
          <div className="flex items-center gap-5 rounded-xl bg-[#0c0c1a]/60 backdrop-blur-xl border border-white/[0.05] px-5 py-3 pointer-events-none">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-6 rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-400/60" />
              <span className="text-[10.5px] font-medium text-white/40">Excellent</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-6 rounded-full bg-gradient-to-r from-amber-500/35 to-amber-400/50" />
              <span className="text-[10.5px] font-medium text-white/40">Average</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-6 rounded-full bg-gradient-to-r from-red-500/35 to-red-400/50" />
              <span className="text-[10.5px] font-medium text-white/40">Poor</span>
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
