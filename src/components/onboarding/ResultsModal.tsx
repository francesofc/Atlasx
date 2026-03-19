"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";
import { getCountryByIso } from "@/data/countries";
import { buildAIContext, generateResponse } from "@/lib/ai-advisor";
import type { CountryMatch } from "@/types/profile";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedo: () => void;
}

const RANK_STYLES = [
  "from-amber-400/20 to-amber-600/5 border-amber-500/20",
  "from-slate-300/15 to-slate-500/5 border-slate-400/15",
  "from-orange-400/10 to-orange-600/5 border-orange-500/15",
  "from-violet-400/10 to-violet-600/5 border-violet-500/12",
  "from-violet-400/10 to-violet-600/5 border-violet-500/12",
];

const RANK_LABELS = ["1st", "2nd", "3rd", "4th", "5th"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg width="64" height="64" className="absolute -rotate-90">
        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
        <circle
          cx="32" cy="32" r="28" fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <span className="text-sm font-bold text-white/80">{score}</span>
    </div>
  );
}

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function DiamondIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Full (unlocked) country card
// ---------------------------------------------------------------------------

function FullCountryCard({
  match,
  idx,
  locale,
  r,
  ex,
}: {
  match: CountryMatch;
  idx: number;
  locale: string;
  r: Record<string, unknown>;
  ex: Record<string, string>;
}) {
  const country = getCountryByIso(match.iso_code);
  if (!country) return null;

  const positives = match.insights.filter((i) => i.type === "positive");
  const tradeoffs = match.insights.filter((i) => i.type === "tradeoff");

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${RANK_STYLES[idx]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-white/50">
            {RANK_LABELS[idx]}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white/90">
              {country.name[locale as keyof typeof country.name]}
            </h3>
            <span className="text-[11px] font-mono text-white/30">{country.iso_code}</span>
          </div>
        </div>
        <ScoreRing score={match.score} />
      </div>

      {match.summary && (
        <p className="mt-4 text-[13px] leading-relaxed text-white/45">
          {match.summary}
        </p>
      )}

      {positives.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/25">
            {r.why as string}
          </p>
          <div className="space-y-1.5">
            {positives.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/50" />
                <span className="text-[12px] leading-relaxed text-emerald-400/70">
                  {insight.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tradeoffs.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/25">
            {r.tradeoffs as string}
          </p>
          <div className="space-y-1.5">
            {tradeoffs.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg border border-amber-500/10 bg-amber-500/[0.03] px-3 py-2"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/40" />
                <span className="text-[12px] leading-relaxed text-amber-400/60">
                  {insight.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {match.edgeOverNext && (
        <div className="mt-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/20 mb-1">
            {ex.ranking_edge}
          </p>
          <p className="text-[11px] text-white/35">{match.edgeOverNext}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Locked (blurred) country card
// ---------------------------------------------------------------------------

function LockedCountryCard({
  match,
  idx,
  locale,
  premiumT,
}: {
  match: CountryMatch;
  idx: number;
  locale: string;
  premiumT: Record<string, string>;
}) {
  const country = getCountryByIso(match.iso_code);
  if (!country) return null;

  return (
    <div className={`relative rounded-xl border bg-gradient-to-br overflow-hidden ${RANK_STYLES[idx]}`}>
      {/* Visible header */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-white/50">
              {RANK_LABELS[idx]}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white/90">
                {country.name[locale as keyof typeof country.name]}
              </h3>
              <span className="text-[11px] font-mono text-white/30">{country.iso_code}</span>
            </div>
          </div>
          <ScoreRing score={match.score} />
        </div>
      </div>

      {/* Blurred content area */}
      <div className="relative px-5 pb-5">
        {/* Fake blurred content */}
        <div className="select-none" aria-hidden="true" style={{ filter: "blur(6px)" }}>
          <p className="text-[13px] leading-relaxed text-white/45">
            This country offers excellent opportunities for your goals with strong economic indicators and favorable conditions for long-term planning.
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/50" />
              <span className="text-[12px] text-emerald-400/70">Strong match for your specific criteria and preferences</span>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/50" />
              <span className="text-[12px] text-emerald-400/70">Favorable conditions aligned with your budget range</span>
            </div>
          </div>
        </div>

        {/* Premium overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0c0c12] via-[#0c0c12]/80 to-transparent">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400/70 mb-3">
            <LockIcon size={18} />
          </div>
          <p className="text-sm font-medium text-white/60">{premiumT.locked_title}</p>
          <p className="text-[11px] text-white/30 mt-0.5">{premiumT.locked_insight}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Premium CTA block
// ---------------------------------------------------------------------------

function PremiumCTA({ premiumT }: { premiumT: Record<string, string> }) {
  return (
    <div className="mx-7 my-6 rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.04] p-6">
      {/* Feature teaser grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {(["feature_full_ranking", "feature_comparisons", "feature_insights", "feature_analysis"] as const).map((key) => (
          <div key={key} className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
            <DiamondIcon size={12} />
            <span className="text-[11px] text-white/50">{premiumT[key]}</span>
          </div>
        ))}
      </div>

      {/* CTA content */}
      <div className="text-center">
        <h3 className="text-base font-semibold text-white/90">{premiumT.cta_title}</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-white/35 max-w-md mx-auto">
          {premiumT.cta_description}
        </p>
        <button className="mt-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:shadow-violet-500/30 hover:brightness-110">
          {premiumT.cta_button}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare Countries Teaser
// ---------------------------------------------------------------------------

function CompareTeaser({
  matches,
  locale,
  premiumT,
  isPremium,
}: {
  matches: CountryMatch[];
  locale: string;
  premiumT: Record<string, string>;
  isPremium: boolean;
}) {
  const top3 = matches.slice(0, 3);
  const fields = ["score", "safety", "tax", "visa", "cost"] as const;
  const fieldLabels: Record<string, string> = {
    score: "Match Score",
    safety: "Safety",
    tax: "Tax Level",
    visa: "Visa",
    cost: "Cost of Living",
  };

  return (
    <div className="mx-7 mb-6">
      <h3 className="text-sm font-semibold text-white/70 mb-1">{premiumT.compare_title}</h3>
      <p className="text-[11px] text-white/30 mb-4">{premiumT.compare_subtitle}</p>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Header row */}
        <div className="grid border-b border-white/[0.04] bg-white/[0.02]" style={{ gridTemplateColumns: `120px repeat(${top3.length}, 1fr)` }}>
          <div className="px-3 py-2.5" />
          {top3.map((m) => {
            const c = getCountryByIso(m.iso_code);
            return (
              <div key={m.iso_code} className="px-3 py-2.5 text-center">
                <span className="text-[11px] font-semibold text-white/60">
                  {c?.name[locale as keyof typeof c.name] || m.iso_code}
                </span>
              </div>
            );
          })}
        </div>

        {/* First row always visible */}
        <div className="grid border-b border-white/[0.04]" style={{ gridTemplateColumns: `120px repeat(${top3.length}, 1fr)` }}>
          <div className="px-3 py-2 text-[11px] text-white/40">{fieldLabels.score}</div>
          {top3.map((m) => (
            <div key={m.iso_code} className="px-3 py-2 text-center text-[12px] font-semibold text-white/70">
              {m.score}
            </div>
          ))}
        </div>

        {/* Remaining rows — blurred if not premium */}
        <div className={`relative ${!isPremium ? "overflow-hidden" : ""}`}>
          <div className={!isPremium ? "select-none" : ""} style={!isPremium ? { filter: "blur(5px)" } : undefined}>
            {fields.slice(1).map((field, fi) => {
              return (
                <div key={field} className={`grid ${fi < fields.length - 2 ? "border-b border-white/[0.04]" : ""}`} style={{ gridTemplateColumns: `120px repeat(${top3.length}, 1fr)` }}>
                  <div className="px-3 py-2 text-[11px] text-white/40">{fieldLabels[field]}</div>
                  {top3.map((m) => {
                    const c = getCountryByIso(m.iso_code);
                    let val = "—";
                    if (c) {
                      if (field === "safety") val = `${c.safety.safety_index}/100`;
                      else if (field === "tax") val = c.tax.level;
                      else if (field === "visa") val = c.visa.ease_of_access;
                      else if (field === "cost") val = `${c.cost_of_living.index}`;
                    }
                    return (
                      <div key={m.iso_code} className="px-3 py-2 text-center text-[11px] text-white/50 capitalize">
                        {val}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Lock overlay for non-premium */}
          {!isPremium && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#0c0c12] via-[#0c0c12]/60 to-transparent">
              <div className="flex items-center gap-2 text-violet-400/60">
                <LockIcon size={14} />
                <span className="text-[11px] font-medium">{premiumT.compare_locked}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Advisor Chat
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    </svg>
  );
}

function AIAdvisorChat({
  isPremium,
  aiT,
  premiumT,
}: {
  isPremium: boolean;
  aiT: Record<string, string>;
  premiumT: Record<string, string>;
}) {
  const { locale } = useI18n();
  const { profile, matches } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const FREE_LIMIT = 2;
  const isLocked = !isPremium && questionCount >= FREE_LIMIT;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isThinking || !profile || isLocked) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setIsThinking(true);

    const ctx = buildAIContext(profile, matches, locale);
    const response = await generateResponse(question, ctx);

    setMessages((prev) => [...prev, { role: "ai", text: response }]);
    setQuestionCount((c) => c + 1);
    setIsThinking(false);
  }, [input, isThinking, profile, matches, locale, isLocked]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Render markdown-like bold (**text**)
  function renderText(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white/80">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="mx-7 my-6 rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.06] to-blue-500/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400/80">
          <SparkleIcon size={14} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white/80">{aiT.title}</h3>
        </div>
        {!isPremium && (
          <span className="ml-auto text-[10px] text-white/25">
            {questionCount}/{FREE_LIMIT}
          </span>
        )}
      </div>

      {/* Chat area */}
      <div className="px-5 py-4 space-y-3 max-h-[300px] overflow-y-auto">
        {/* Greeting */}
        {messages.length === 0 && !isThinking && (
          <div className="flex gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400/60 mt-0.5">
              <SparkleIcon size={10} />
            </div>
            <p className="text-[12px] leading-relaxed text-white/40 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
              {aiT.greeting}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {msg.role === "ai" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400/60 mt-0.5">
                <SparkleIcon size={10} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-white/[0.08] text-white/70 border border-white/[0.06]"
                  : "bg-white/[0.02] text-white/50 border border-white/[0.04]"
              }`}
            >
              {msg.role === "ai" ? renderText(msg.text) : msg.text}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400/60 mt-0.5">
              <SparkleIcon size={10} />
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" style={{ animationDelay: "600ms" }} />
                </div>
                <span className="text-[11px] text-white/25">{aiT.thinking}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="relative px-5 pb-4 pt-1">
        {isLocked ? (
          <div className="relative">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3" style={{ filter: "blur(3px)" }}>
              <span className="text-[12px] text-white/20">{aiT.placeholder}</span>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-violet-400/70">
                <LockIcon size={14} />
                <span className="text-[12px] font-medium">{aiT.limit_title}</span>
              </div>
              <p className="text-[10px] text-white/25 mt-0.5">{aiT.limit_description}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={aiT.placeholder}
              disabled={isThinking}
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[12px] text-white/70 placeholder:text-white/20 outline-none transition-colors focus:border-cyan-500/25 focus:bg-white/[0.05] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400/70 transition-all duration-200 hover:bg-cyan-500/25 hover:text-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500/15"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22 11 13 2 9l20-7Z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ResultsModal
// ---------------------------------------------------------------------------

export default function ResultsModal({ isOpen, onClose, onRedo }: ResultsModalProps) {
  const { locale, t } = useI18n();
  const { matches, isPremium, togglePremium } = useProfile();
  const [showCompare, setShowCompare] = useState(false);

  if (!isOpen || matches.length === 0) return null;

  const r = t.results;
  const ex = t.explain;
  const premiumT = t.premium;

  const freeMatches = matches.slice(0, 3);
  const lockedMatches = isPremium ? [] : matches.slice(3, 5);
  const premiumMatches = isPremium ? matches.slice(3, 5) : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0a0a14]/96 to-[#0e0e1a]/96 backdrop-blur-2xl shadow-2xl shadow-black/60 ax-modal-in ax-border-glow scrollbar-thin">
        {/* Decorative top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent z-20" />

        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/[0.05] bg-[#0a0a14]/96 backdrop-blur-md px-7 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold ax-gradient-text">{r.title}</h2>
              <p className="mt-1 text-xs text-white/35">{r.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Premium toggle (dev) */}
              <button
                onClick={togglePremium}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                  isPremium
                    ? "border border-violet-500/30 bg-violet-500/15 text-violet-400"
                    : "border border-white/[0.08] bg-white/[0.03] text-white/25 hover:text-white/40"
                }`}
              >
                <DiamondIcon size={10} />
                {isPremium ? premiumT.active : premiumT.badge}
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Free results (top 3) */}
        <div className="px-7 py-6 space-y-5">
          {freeMatches.map((match, idx) => (
            <FullCountryCard
              key={match.iso_code}
              match={match}
              idx={idx}
              locale={locale}
              r={r as unknown as Record<string, unknown>}
              ex={ex as unknown as Record<string, string>}
            />
          ))}
        </div>

        {/* Locked cards (#4, #5) — only shown when NOT premium */}
        {lockedMatches.length > 0 && (
          <div className="px-7 pb-4 space-y-4">
            {lockedMatches.map((match, idx) => (
              <LockedCountryCard
                key={match.iso_code}
                match={match}
                idx={idx + 3}
                locale={locale}
                premiumT={premiumT as unknown as Record<string, string>}
              />
            ))}
          </div>
        )}

        {/* Premium unlocked cards (#4, #5) — shown when IS premium */}
        {premiumMatches.length > 0 && (
          <div className="px-7 pb-4 space-y-5">
            {premiumMatches.map((match, idx) => (
              <FullCountryCard
                key={match.iso_code}
                match={match}
                idx={idx + 3}
                locale={locale}
                r={r as unknown as Record<string, unknown>}
                ex={ex as unknown as Record<string, string>}
              />
            ))}
          </div>
        )}

        {/* Premium CTA — only when not premium */}
        {!isPremium && <PremiumCTA premiumT={premiumT as unknown as Record<string, string>} />}

        {/* Compare button */}
        <div className="px-7 pb-2">
          <button
            onClick={() => setShowCompare(!showCompare)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/50 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white/70"
          >
            {r.compare}
          </button>
        </div>

        {/* Compare teaser */}
        {showCompare && (
          <CompareTeaser
            matches={matches}
            locale={locale}
            premiumT={premiumT as unknown as Record<string, string>}
            isPremium={isPremium}
          />
        )}

        {/* AI Advisor */}
        <AIAdvisorChat
          isPremium={isPremium}
          aiT={t.ai as unknown as Record<string, string>}
          premiumT={premiumT as unknown as Record<string, string>}
        />

        {/* Personalized badge */}
        <div className="px-7 pb-2">
          <p className="text-center text-[10px] tracking-wide text-white/15">{ex.personalized_for}</p>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-white/[0.04] bg-[#101018]/95 backdrop-blur-md px-7 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onRedo}
              className="text-sm text-white/30 transition-colors hover:text-white/60"
            >
              {r.redo}
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/15"
            >
              {r.explore}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
