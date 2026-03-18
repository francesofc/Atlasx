"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useProfile } from "@/contexts/ProfileContext";
import { buildAIContext, generateResponse, getSuggestedPrompts } from "@/lib/ai-advisor";
import { countries, type Country } from "@/data/countries";
import { DEFAULT_PROFILE } from "@/types/profile";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCompare?: (iso: string) => void;
}

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

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function useDemoContext() {
  const { locale } = useI18n();
  const demoProfile = { ...DEFAULT_PROFILE, goal: "quality_of_life" as const, goals: ["quality_of_life" as const] };
  const demoCountries = countries.slice(0, 5);
  const demoMatches = demoCountries.map((c, i) => ({
    iso_code: c.iso_code,
    score: 90 - i * 5,
    insights: [],
    summary: "",
    edgeOverNext: "",
  }));
  return buildAIContext(demoProfile, demoMatches, locale);
}

// Extract follow-up actions from AI response text
function extractFollowUpActions(text: string): string[] {
  const actions: string[] = [];
  const lines = text.split("\n");

  // Look for "Next Steps" section
  let inNextSteps = false;
  for (const line of lines) {
    if (line.includes("**Next Steps**")) {
      inNextSteps = true;
      continue;
    }
    if (inNextSteps) {
      const match = line.match(/^\d+\.\s+(.+)/);
      if (match) {
        // Strip markdown bold markers for cleaner display
        actions.push(match[1].replace(/\*\*/g, ""));
      } else if (line.trim() === "" || line.startsWith("##") || line.startsWith("**")) {
        inNextSteps = false;
      }
    }
  }

  return actions.slice(0, 3);
}

// Parse structured response for better rendering
function renderStructuredText(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section headers
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="text-[13px] font-bold text-white/85 mt-2 mb-1.5 tracking-tight">
          {line.slice(3)}
        </h3>
      );
      continue;
    }

    // Sub-headers (bold sections)
    if (line.startsWith("**") && line.endsWith("**:")) {
      elements.push(
        <p key={key++} className="text-[11px] font-semibold text-cyan-400/60 mt-3 mb-1 uppercase tracking-wider">
          {line.replace(/\*\*/g, "").replace(/:$/, "")}
        </p>
      );
      continue;
    }

    // Data indicators
    if (line.match(/^[🟢🔴🟡📊☢️🛡🥇🥈🥉✅⚠️→]/u)) {
      elements.push(
        <div key={key++} className="text-[11px] leading-relaxed text-white/55 py-0.5 pl-1 border-l-2 border-white/[0.06] ml-1 mb-0.5">
          {renderInlineBold(line)}
        </div>
      );
      continue;
    }

    // Numbered steps
    if (line.match(/^\d+\.\s/)) {
      elements.push(
        <div key={key++} className="text-[11px] leading-relaxed text-white/50 py-0.5 pl-3">
          {renderInlineBold(line)}
        </div>
      );
      continue;
    }

    // Bullet points
    if (line.startsWith("• ") || line.startsWith("- ")) {
      elements.push(
        <div key={key++} className="text-[11px] leading-relaxed text-white/50 py-0.5 pl-3">
          {renderInlineBold(line)}
        </div>
      );
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1.5" />);
      continue;
    }

    // Regular text
    elements.push(
      <p key={key++} className="text-[12px] leading-relaxed text-white/50">
        {renderInlineBold(line)}
      </p>
    );
  }

  return <>{elements}</>;
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white/80">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AIPanel({ isOpen, onClose, onAddToCompare }: AIPanelProps) {
  const { locale, t } = useI18n();
  const { profile, matches, isPremium } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const demoCtx = useDemoContext();

  const aiT = t.ai as Record<string, string>;
  const FREE_LIMIT = 2;
  const isLocked = !isPremium && questionCount >= FREE_LIMIT;
  const hasProfile = !!profile;

  const ctx = useMemo(() => {
    return hasProfile
      ? buildAIContext(profile!, matches, locale)
      : demoCtx;
  }, [hasProfile, profile, matches, locale, demoCtx]);

  const suggestedPrompts = useMemo(() => getSuggestedPrompts(ctx), [ctx]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = useCallback(async (text?: string) => {
    const question = (text || input).trim();
    if (!question || isThinking || isLocked) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setIsThinking(true);

    const response = await generateResponse(question, ctx);

    setMessages((prev) => [...prev, { role: "ai", text: response }]);
    setQuestionCount((c) => c + 1);
    setIsThinking(false);
  }, [input, isThinking, isLocked, ctx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  function findMentionedCountries(text: string): Country[] {
    const lower = text.toLowerCase();
    return countries.filter(
      (c) =>
        lower.includes(c.name.en.toLowerCase()) ||
        lower.includes(c.name[locale].toLowerCase())
    );
  }

  return (
    <div
      className={`fixed right-0 top-0 z-40 h-full w-full max-w-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="h-full border-l border-white/[0.08] bg-gradient-to-b from-[#0c0c16]/97 to-[#10101c]/97 backdrop-blur-2xl shadow-2xl shadow-black/60 flex flex-col ax-border-glow"
        style={{ boxShadow: "-20px 0 80px rgba(34,211,238,0.03), 0 0 120px rgba(0,0,0,0.5)" }}
      >
        {/* Decorative top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-cyan-400/80">
              <SparkleIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/90">{aiT.title}</h2>
              <p className="text-[10px] text-white/30">
                {!hasProfile ? "Demo mode — complete profile for personalized advice" : "Relocation · Tax · Business · Investment Advisor"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isPremium && (
              <span className="text-[10px] text-white/25 font-mono">{questionCount}/{FREE_LIMIT}</span>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 scrollbar-thin">
          {/* Greeting + Suggested Prompts */}
          {messages.length === 0 && !isThinking && (
            <>
              <div className="flex gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400/60 mt-0.5">
                  <SparkleIcon size={10} />
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2.5">
                  <p className="text-[12px] leading-relaxed text-white/50">
                    {aiT.greeting}
                  </p>
                  <p className="text-[10px] text-white/25 mt-2 italic">
                    I can analyze countries, compare options, build relocation plans, and optimize your tax strategy.
                  </p>
                </div>
              </div>

              {/* Suggested prompts — engagement entry point */}
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20 px-1">
                  {aiT.suggested_title || "Ask Me Anything"}
                </p>
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="ax-card-hover w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[11px] text-white/45 transition-all duration-200 hover:border-cyan-500/20 hover:bg-cyan-500/[0.04] hover:text-white/65 ax-section-in"
                    style={{ animationDelay: `${300 + i * 100}ms` }}
                  >
                    <span className="text-cyan-400/50 mr-2">→</span>
                    {prompt}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "ai" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400/60 mt-0.5">
                  <SparkleIcon size={10} />
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-3 text-[12px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white/[0.08] text-white/75 border border-white/[0.1]"
                    : "bg-white/[0.02] text-white/55 border border-white/[0.05]"
                }`}
              >
                {msg.role === "ai" ? renderStructuredText(msg.text) : msg.text}

                {/* Country mention pills — "Add to Compare" */}
                {msg.role === "ai" && onAddToCompare && (() => {
                  const mentioned = findMentionedCountries(msg.text).slice(0, 4);
                  if (mentioned.length === 0) return null;
                  return (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                      <span className="text-[9px] text-white/20 mr-1 self-center">Add to compare:</span>
                      {mentioned.map((c) => (
                        <button
                          key={c.iso_code}
                          onClick={() => onAddToCompare!(c.iso_code)}
                          className="inline-flex items-center gap-1 rounded-full border border-violet-500/15 bg-violet-500/[0.05] px-2 py-0.5 text-[10px] font-medium text-violet-400/70 transition-all hover:border-violet-500/30 hover:bg-violet-500/[0.1] hover:text-violet-400 hover:scale-105"
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          {c.name[locale]}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Engagement loop — follow-up actions */}
                {msg.role === "ai" && i === messages.length - 1 && (() => {
                  const actions = extractFollowUpActions(msg.text);
                  if (actions.length === 0) return null;
                  return (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-1.5">
                      <span className="text-[9px] text-white/20 font-semibold uppercase tracking-wider">Continue exploring</span>
                      {actions.map((action, ai) => (
                        <button
                          key={ai}
                          onClick={() => handleSend(action)}
                          className="w-full text-left rounded-lg border border-cyan-500/10 bg-cyan-500/[0.03] px-2.5 py-2 text-[10px] text-cyan-400/50 transition-all hover:border-cyan-500/20 hover:bg-cyan-500/[0.06] hover:text-cyan-400/75 ax-section-in"
                          style={{ animationDelay: `${ai * 80}ms` }}
                        >
                          <span className="text-cyan-400/40 mr-1.5">→</span>
                          {action}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400/60 mt-0.5">
                <SparkleIcon size={10} />
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" />
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

        {/* Input */}
        <div className="border-t border-white/[0.06] px-5 py-4">
          {isLocked ? (
            <div className="relative">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3" style={{ filter: "blur(3px)" }}>
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
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={aiT.placeholder}
                disabled={isThinking}
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[12px] text-white/75 placeholder:text-white/25 outline-none transition-colors focus:border-cyan-500/30 focus:bg-white/[0.06] disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isThinking}
                className="ax-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-cyan-400/70 transition-all duration-200 hover:from-cyan-500/30 hover:to-blue-500/20 hover:text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 disabled:opacity-30"
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
    </div>
  );
}
