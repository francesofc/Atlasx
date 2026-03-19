"use client";

import { useI18n, LOCALE_LABELS, type Locale } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";

const locales = Object.keys(LOCALE_LABELS) as Locale[];

export type ActiveView = "explore" | "ai" | "compare" | "recommendations";

interface HeaderProps {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  compareCount?: number;
  onEditProfile?: () => void;
  onHelpMeDecide?: () => void;
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export default function Header({ activeView, onChangeView, compareCount = 0, onEditProfile, onHelpMeDecide }: HeaderProps) {
  const { locale, setLocale, t } = useI18n();
  const { hasCompletedOnboarding } = useProfile();

  const navItems: { key: ActiveView; label: string; icon: React.ReactNode }[] = [
    { key: "explore", label: t.nav.explore, icon: <GlobeIcon /> },
    { key: "ai", label: t.nav.ai_advisor, icon: <SparkleIcon /> },
    { key: "compare", label: t.nav.compare, icon: <CompareIcon /> },
    {
      key: "recommendations",
      label: t.nav.recommendations,
      icon: <StarIcon />,
    },
  ];

  return (
    <header className="pointer-events-none fixed left-0 top-0 z-30 w-full">
      <div className="flex items-center justify-between px-5 py-3.5">
        {/* Logo — premium gradient */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-blue-500/20 shadow-lg shadow-black/30 ax-gradient-border">
            <div className="absolute inset-px rounded-[10px] bg-[#0a0a14]/90" />
            <span className="relative text-sm font-bold tracking-tight ax-gradient-text-brand">A</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold tracking-[0.06em] ax-gradient-text">
              {t.app.title}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 ax-pulse-dot" />
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-emerald-400/50">Live</span>
            </div>
          </div>
        </div>

        {/* Floating glassmorphism nav */}
        <nav className="pointer-events-auto flex items-center gap-0.5 rounded-2xl ax-glass-2 px-1.5 py-1.5 shadow-2xl shadow-black/40 ax-border-glow ax-gradient-border">
          {navItems.map((item) => {
            const isActive = activeView === item.key;
            const isRecommendations = item.key === "recommendations";
            const showGreen = isRecommendations && hasCompletedOnboarding;

            return (
              <button
                key={item.key}
                onClick={() => onChangeView(item.key)}
                className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-medium tracking-wide transition-all duration-300 ${
                  isActive
                    ? showGreen
                      ? "bg-emerald-500/15 text-emerald-400 shadow-inner shadow-emerald-500/10"
                      : "bg-white/[0.12] text-white/95 shadow-inner shadow-white/5"
                    : showGreen
                      ? "text-emerald-400/50 hover:bg-emerald-500/[0.08] hover:text-emerald-400/80"
                      : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400/60 to-violet-400/60" />
                )}
                <span className={`relative transition-all duration-300 group-hover:scale-110 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-90"}`}>
                  {item.icon}
                  {item.key === "compare" && compareCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-[8px] font-bold text-white shadow-lg shadow-violet-500/30">
                      {compareCount}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Help me decide button */}
          {onHelpMeDecide && (
            <button
              onClick={onHelpMeDecide}
              className="ax-btn flex items-center gap-2 rounded-xl ax-glass-1 px-3.5 py-2 shadow-lg shadow-black/20 transition-all hover:shadow-cyan-500/10 group"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400/70 group-hover:text-cyan-400 transition-colors">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="12" r="10" />
                <path d="M12 17h.01" />
              </svg>
              <span className="text-[11px] font-medium tracking-wide text-cyan-400/60 group-hover:text-cyan-400/90 transition-colors">Decide</span>
            </button>
          )}

          {/* Your Profile button */}
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className={`ax-btn flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg shadow-black/20 transition-all ${
                hasCompletedOnboarding
                  ? "ax-glass-1 hover:shadow-emerald-500/10"
                  : "ax-glass-1"
              }`}
            >
              <span className={`transition-colors ${hasCompletedOnboarding ? "text-emerald-400/80" : "text-white/40"}`}>
                <UserIcon />
              </span>
              <span className={`text-[11px] font-medium tracking-wide transition-colors ${hasCompletedOnboarding ? "text-emerald-400/70" : "text-white/35"}`}>
                {hasCompletedOnboarding ? "Profile" : "Set up"}
              </span>
            </button>
          )}

          {/* Language switcher */}
          <div className="flex items-center rounded-xl ax-glass-1 shadow-lg shadow-black/20 overflow-hidden">
            {locales.map((loc, i) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={`px-2.5 py-2 text-[10px] font-semibold tracking-wider transition-all duration-200 ${
                  locale === loc
                    ? "text-white/90 bg-white/[0.06]"
                    : "text-white/25 hover:text-white/55 hover:bg-white/[0.03]"
                } ${i > 0 ? "border-l border-white/[0.04]" : ""}`}
                aria-label={`${t.language_switcher.label}: ${LOCALE_LABELS[loc]}`}
              >
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
