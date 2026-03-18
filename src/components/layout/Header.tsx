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
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.06] backdrop-blur-md shadow-lg shadow-black/20">
            <span className="text-sm font-bold tracking-tight text-white/80">A</span>
          </div>
          <span className="text-sm font-semibold tracking-[0.08em] text-white/70">
            {t.app.title}
          </span>
        </div>

        {/* Floating glassmorphism nav */}
        <nav className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-1.5 py-1.5 backdrop-blur-2xl shadow-2xl shadow-black/30 ax-border-glow">
          {navItems.map((item) => {
            const isActive = activeView === item.key;
            const isRecommendations = item.key === "recommendations";
            const showGreen = isRecommendations && hasCompletedOnboarding;

            return (
              <button
                key={item.key}
                onClick={() => onChangeView(item.key)}
                className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-medium tracking-wide transition-all duration-300 ${
                  isActive
                    ? showGreen
                      ? "bg-emerald-500/15 text-emerald-400/90 shadow-inner shadow-emerald-500/5"
                      : "bg-white/[0.1] text-white/90 shadow-inner shadow-white/5"
                    : showGreen
                      ? "text-emerald-400/50 hover:bg-emerald-500/[0.06] hover:text-emerald-400/70"
                      : "text-white/35 hover:bg-white/[0.05] hover:text-white/60"
                }`}
              >
                <span className={`relative transition-transform duration-300 group-hover:scale-110 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
                  {item.icon}
                  {item.key === "compare" && compareCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white">
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
              className="flex items-center gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] px-3.5 py-1.5 backdrop-blur-xl shadow-lg shadow-black/20 transition-all hover:border-cyan-500/25 hover:bg-cyan-500/[0.1] hover:shadow-cyan-500/10"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400/70">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="12" r="10" />
                <path d="M12 17h.01" />
              </svg>
              <span className="text-[11px] font-medium tracking-wide text-cyan-400/60">Help me decide</span>
            </button>
          )}

          {/* Your Profile button */}
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 backdrop-blur-xl shadow-lg shadow-black/20 transition-all ${
                hasCompletedOnboarding
                  ? "border-emerald-500/15 bg-emerald-500/[0.06] hover:border-emerald-500/25 hover:bg-emerald-500/[0.1]"
                  : "border-white/[0.08] bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.08]"
              }`}
            >
              <span className={hasCompletedOnboarding ? "text-emerald-400/70" : "text-white/40"}>
                <UserIcon />
              </span>
              <span className={`text-[11px] font-medium tracking-wide ${hasCompletedOnboarding ? "text-emerald-400/60" : "text-white/35"}`}>
                {hasCompletedOnboarding ? "Profile" : "Set up profile"}
              </span>
            </button>
          )}

          {/* Language switcher */}
          <div className="flex items-center rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-lg shadow-black/20">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={`px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-200 ${
                  locale === loc
                    ? "text-white/80"
                    : "text-white/25 hover:text-white/50"
                } ${loc === locales[0] ? "rounded-l-xl" : ""} ${loc === locales[locales.length - 1] ? "rounded-r-xl" : ""}`}
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
