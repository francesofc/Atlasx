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
    <main className="relative h-screen w-screen overflow-hidden bg-[#030308]">
      {/* === DEEP SPACE BACKGROUND — centered on map === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary ambient glow — centered in the map area */}
        <div
          className="absolute w-[1200px] h-[1200px] rounded-full ax-breathe ax-gradient-rotate"
          style={{
            left: "calc(280px + 50%)",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, rgba(59,130,246,0.03) 30%, transparent 65%)",
          }}
        />
        {/* Secondary atmospheric wash */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full ax-breathe"
          style={{
            left: "calc(280px + 35%)",
            top: "65%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(34,211,238,0.025) 0%, transparent 55%)",
            animationDelay: "4s",
            animationDuration: "14s",
          }}
        />
        {/* Warm bottom-right glow */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full ax-breathe"
          style={{
            right: "-100px",
            bottom: "-100px",
            background: "radial-gradient(circle, rgba(251,191,36,0.015) 0%, transparent 50%)",
            animationDelay: "7s",
            animationDuration: "16s",
          }}
        />
      </div>

      <ParticleField />

      {/* === LEFT SIDEBAR (secondary) === */}
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

      {/* ================================================================
          === THE MAP HERO — dominant central surface ===
          ================================================================ */}
      <div className="absolute left-[280px] top-0 bottom-0 right-0">

        {/* ── Map Surface with inset framing ── */}
        <div className="absolute inset-3 rounded-2xl overflow-hidden ax-map-surface">
          {/* The map itself */}
          <MapView onCountryClick={handleCountryClick} scoreMap={scoreMap} />

          {/* Vignette overlay — atmospheric depth framing */}
          <div className="absolute inset-0 pointer-events-none ax-map-vignette" />

          {/* Inner border highlight for the map frame */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.04]" />
        </div>

        {/* ── Minimal Floating Mode Switcher ── */}
        <div className="absolute top-7 left-1/2 -translate-x-1/2 z-10 ax-fade-in-up">
          <div
            className="flex items-center gap-0.5 rounded-2xl bg-[#080814]/70 backdrop-blur-2xl border border-white/[0.05] px-1.5 py-1.5"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
          >
            <button
              onClick={() => handleViewChange("explore")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium transition-all duration-300 ${
                activeView === "explore"
                  ? "bg-white/[0.08] text-white/85"
                  : "text-white/30 hover:text-white/55 hover:bg-white/[0.03]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              Explore
            </button>

            <button
              onClick={() => handleViewChange("ai")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium transition-all duration-300 ${
                activeView === "ai"
                  ? "bg-cyan-500/[0.1] text-cyan-300/80 border border-cyan-500/[0.08]"
                  : "text-white/30 hover:text-white/55 hover:bg-white/[0.03]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
              AI
            </button>

            <button
              onClick={() => handleViewChange("compare")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium transition-all duration-300 relative ${
                activeView === "compare"
                  ? "bg-violet-500/[0.1] text-violet-300/80 border border-violet-500/[0.08]"
                  : "text-white/30 hover:text-white/55 hover:bg-white/[0.03]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              Compare
              {compareIsos.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/80 text-[8px] font-bold text-white">
                  {compareIsos.length}
                </span>
              )}
            </button>

            <div className="w-px h-5 bg-white/[0.04] mx-0.5" />

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-300 ${
                hasCompletedOnboarding
                  ? "text-emerald-400/40 hover:text-emerald-400/60 hover:bg-emerald-500/[0.03]"
                  : "text-white/30 hover:text-white/55 hover:bg-white/[0.03]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
              </svg>
              {hasCompletedOnboarding ? "Profile" : "Set up"}
            </button>
          </div>
        </div>

        {/* ── Unified Map Context — module + legend in one integrated overlay ── */}
        <div className="absolute bottom-7 left-7 z-10 ax-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div
            className="rounded-2xl bg-[#080814]/65 backdrop-blur-2xl border border-white/[0.05] overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
          >
            {/* Active Module */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/[0.05]">
                <span className="text-[13px] text-white/55">{activeModuleDef?.icon}</span>
              </div>
              <div>
                <span className="block text-[12px] font-semibold text-white/80 capitalize tracking-tight leading-tight">
                  {activeModule.replace(/_/g, " ")}
                </span>
                <span className="block text-[9px] text-white/25 mt-0.5">{Object.keys(scoreMap).length} countries</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/50 animate-pulse" />
                <span className="text-[8px] font-medium text-cyan-400/35 uppercase tracking-wider">Live</span>
              </div>
            </div>

            {/* Score Legend */}
            <div className="flex items-center gap-4 px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-gradient-to-r from-emerald-500/50 to-emerald-400/70" />
                <span className="text-[9px] font-medium text-white/30">70–100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-gradient-to-r from-amber-500/45 to-amber-400/60" />
                <span className="text-[9px] font-medium text-white/30">40–69</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-gradient-to-r from-red-500/45 to-red-400/60" />
                <span className="text-[9px] font-medium text-white/30">0–39</span>
              </div>
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
