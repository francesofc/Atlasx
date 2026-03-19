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
  activeModule?: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

// ---------------------------------------------------------------------------
// Locale-aware greetings & intelligence branding
// ---------------------------------------------------------------------------
const greetings: Record<string, { title: string; subtitle: string; moduleHint: string }> = {
  en: {
    title: "Atlas Intelligence",
    subtitle: "Geopolitical analysis, tax strategy, and relocation intelligence. Ask anything about countries, markets, or opportunities.",
    moduleHint: "Analyzing through the {module} lens. Responses are tailored to this perspective.",
  },
  fr: {
    title: "Intelligence Atlas",
    subtitle: "Analyse géopolitique, stratégie fiscale et intelligence de relocalisation. Posez vos questions sur les pays, marchés ou opportunités.",
    moduleHint: "Analyse via le prisme {module}. Les réponses sont orientées vers cette perspective.",
  },
  es: {
    title: "Inteligencia Atlas",
    subtitle: "Análisis geopolítico, estrategia fiscal e inteligencia de reubicación. Pregunte sobre países, mercados u oportunidades.",
    moduleHint: "Analizando desde la perspectiva de {module}. Las respuestas se adaptan a esta visión.",
  },
  pt: {
    title: "Inteligência Atlas",
    subtitle: "Análise geopolítica, estratégia fiscal e inteligência de realocação. Pergunte sobre países, mercados ou oportunidades.",
    moduleHint: "Analisando pela perspectiva de {module}. As respostas são adaptadas a esta visão.",
  },
};

const thinkingTexts: Record<string, string> = {
  en: "Analyzing intelligence data...",
  fr: "Analyse des données en cours...",
  es: "Analizando datos de inteligencia...",
  pt: "Analisando dados de inteligência...",
};

const suggestedLabels: Record<string, string> = {
  en: "Intelligence Queries",
  fr: "Requêtes d'intelligence",
  es: "Consultas de inteligencia",
  pt: "Consultas de inteligência",
};

const moduleLensLabels: Record<string, string> = {
  en: "{module} lens active",
  fr: "Prisme {module} actif",
  es: "Perspectiva {module} activa",
  pt: "Perspectiva {module} ativa",
};

const profileHints: Record<string, string> = {
  en: "Configure your profile for tailored intelligence",
  fr: "Configurez votre profil pour une intelligence personnalisée",
  es: "Configure su perfil para inteligencia personalizada",
  pt: "Configure seu perfil para inteligência personalizada",
};

const placeholderTexts: Record<string, string> = {
  en: "Ask about any country, tax strategy, or opportunity...",
  fr: "Posez une question sur un pays, une stratégie fiscale...",
  es: "Pregunte sobre cualquier país, estrategia fiscal...",
  pt: "Pergunte sobre qualquer país, estratégia fiscal...",
};

const upgradeTexts: Record<string, { title: string; description: string; cta: string }> = {
  en: {
    title: "Unlock full intelligence access",
    description: "Continue with unlimited geopolitical analysis and strategic insights.",
    cta: "Upgrade to Premium",
  },
  fr: {
    title: "Débloquez l'accès complet",
    description: "Continuez avec des analyses géopolitiques et des insights stratégiques illimités.",
    cta: "Passer à Premium",
  },
  es: {
    title: "Desbloquea acceso completo",
    description: "Continúa con análisis geopolíticos e insights estratégicos ilimitados.",
    cta: "Actualizar a Premium",
  },
  pt: {
    title: "Desbloqueie acesso completo",
    description: "Continue com análises geopolíticas e insights estratégicos ilimitados.",
    cta: "Atualizar para Premium",
  },
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364-.707.707M6.343 17.657l-.707.707m0-12.728.707.707m11.314 11.314.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    </svg>
  );
}

function ChevronRightIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ArrowUpRightIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Demo context — realistic defaults
// ---------------------------------------------------------------------------
function useDemoContext() {
  const { locale } = useI18n();
  const demoProfile = {
    ...DEFAULT_PROFILE,
    goal: "investment" as const,
    goals: ["investment" as const],
    budgetRange: "3000_5000" as const,
    nationality: "",
  };
  const demoCountries = countries.slice(0, 5);
  const demoMatches = demoCountries.map((c, i) => ({
    iso_code: c.iso_code,
    score: 92 - i * 4,
    insights: [],
    summary: "",
    edgeOverNext: "",
  }));
  return buildAIContext(demoProfile, demoMatches, locale);
}

// ---------------------------------------------------------------------------
// Structured text rendering
// ---------------------------------------------------------------------------
function extractFollowUpActions(text: string): string[] {
  const actions: string[] = [];
  const lines = text.split("\n");
  let inNextSteps = false;
  for (const line of lines) {
    if (line.includes("**Next Steps**")) {
      inNextSteps = true;
      continue;
    }
    if (inNextSteps) {
      const match = line.match(/^\d+\.\s+(.+)/);
      if (match) {
        actions.push(match[1].replace(/\*\*/g, ""));
      } else if (line.trim() === "" || line.startsWith("##") || line.startsWith("**")) {
        inNextSteps = false;
      }
    }
  }
  return actions.slice(0, 3);
}

function renderStructuredText(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="text-[13px] font-semibold text-white/80 mt-3 mb-1.5 tracking-tight">
          {line.slice(3)}
        </h3>
      );
      continue;
    }

    if (line.startsWith("**") && line.endsWith("**:")) {
      elements.push(
        <p key={key++} className="text-[10px] font-semibold text-cyan-400/50 mt-3 mb-1 uppercase tracking-wider">
          {line.replace(/\*\*/g, "").replace(/:$/, "")}
        </p>
      );
      continue;
    }

    if (line.match(/^[🟢🔴🟡📊☢️🛡🥇🥈🥉✅⚠️→]/u)) {
      elements.push(
        <div key={key++} className="text-[12px] leading-relaxed text-white/50 py-0.5 pl-3 border-l-2 border-white/[0.06] ml-1 mb-1">
          {renderInlineBold(line)}
        </div>
      );
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      elements.push(
        <div key={key++} className="text-[12px] leading-relaxed text-white/50 py-0.5 pl-4">
          {renderInlineBold(line)}
        </div>
      );
      continue;
    }

    if (line.startsWith("• ") || line.startsWith("- ")) {
      elements.push(
        <div key={key++} className="text-[12px] leading-relaxed text-white/50 py-0.5 pl-4">
          {renderInlineBold(line)}
        </div>
      );
      continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

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
      return <strong key={i} className="font-semibold text-white/75">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AIPanel({ isOpen, onClose, onAddToCompare, activeModule }: AIPanelProps) {
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

  // Locale helpers
  const loc = locale as string;
  const g = greetings[loc] || greetings.en;
  const thinkingText = aiT.thinking || thinkingTexts[loc] || thinkingTexts.en;
  const suggestedLabel = suggestedLabels[loc] || suggestedLabels.en;
  const moduleLensLabel = (moduleLensLabels[loc] || moduleLensLabels.en).replace("{module}", (activeModule || "").replace(/_/g, " "));
  const profileHint = profileHints[loc] || profileHints.en;
  const placeholderText = aiT.placeholder || placeholderTexts[loc] || placeholderTexts.en;
  const upgrade = upgradeTexts[loc] || upgradeTexts.en;

  const ctx = useMemo(() => {
    return hasProfile
      ? buildAIContext(profile!, matches, locale, activeModule)
      : demoCtx;
  }, [hasProfile, profile, matches, locale, demoCtx, activeModule]);

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
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-35 ax-overlay-backdrop ax-scale-in"
          style={{ animationDuration: "0.3s" }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-4 top-4 bottom-4 z-40 w-full max-w-[420px] rounded-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+16px)] opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-full bg-[#0a0a18]/95 backdrop-blur-2xl border-l border-white/[0.06] shadow-2xl shadow-black/60 flex flex-col relative">
          {/* Decorative accents */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-32 bg-gradient-to-b from-cyan-500/20 to-transparent" />

          {/* Header */}
          <div className="relative px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-violet-500/10 border border-cyan-500/10">
                  <div className="absolute inset-px rounded-[15px] bg-[#0a0a18]/80" />
                  <span className="relative text-cyan-400/90"><SparkleIcon size={18} /></span>
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white/90 tracking-tight">{g.title}</h2>
                  <p className="text-[10px] text-white/30 mt-0.5 font-medium">
                    {activeModule
                      ? moduleLensLabel
                      : !hasProfile
                        ? profileHint
                        : aiT.subtitle || "Geopolitical & Economic Intelligence"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {!isPremium && (
                  <span className="text-[10px] text-white/30 font-mono tabular-nums bg-white/[0.05] px-3 py-1.5 rounded-lg border border-white/[0.04]">{questionCount}/{FREE_LIMIT}</span>
                )}
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/30 transition-all hover:text-white/60 hover:bg-white/[0.08] border border-white/[0.04]"
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
            {/* Empty state — greeting + prompts */}
            {messages.length === 0 && !isThinking && (
              <>
                {/* Intelligence greeting card */}
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-violet-500/[0.04] border border-white/[0.06] p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/10 text-cyan-400/70">
                      <SparkleIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-white/80 mb-1.5">{g.title}</h3>
                      <p className="text-[12px] text-white/35 leading-relaxed">
                        {activeModule
                          ? g.moduleHint.replace("{module}", activeModule.replace(/_/g, " "))
                          : g.subtitle}
                      </p>
                    </div>
                  </div>
                  {activeModule && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-pulse" />
                        <span className="text-[10px] text-cyan-400/50 font-medium uppercase tracking-wider">{moduleLensLabel}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested prompts */}
                <div className="mt-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 px-1 mb-3">
                    {suggestedLabel}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(prompt)}
                        className="w-full text-left rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3.5 text-[12px] text-white/40 transition-all duration-300 hover:border-cyan-500/12 hover:bg-cyan-500/[0.04] hover:text-white/65 hover:translate-x-1 ax-section-in group flex items-start gap-2.5"
                        style={{ animationDelay: `${200 + i * 100}ms` }}
                      >
                        <span className="text-cyan-400/30 group-hover:text-cyan-400/60 transition-colors mt-[1px] shrink-0">
                          <ChevronRightIcon size={10} />
                        </span>
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ax-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                style={{ animationDelay: "50ms" }}
              >
                {msg.role === "ai" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400/50 mt-0.5">
                    <SparkleIcon size={12} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-[12px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-white/[0.07] text-white/70 border border-white/[0.08]"
                      : "bg-white/[0.02] text-white/55 border border-white/[0.04]"
                  }`}
                >
                  {msg.role === "ai" ? renderStructuredText(msg.text) : msg.text}

                  {/* Country pills */}
                  {msg.role === "ai" && onAddToCompare && (() => {
                    const mentioned = findMentionedCountries(msg.text).slice(0, 4);
                    if (mentioned.length === 0) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-white/[0.05] flex flex-wrap gap-1.5">
                        <span className="text-[9px] text-white/15 mr-1 self-center">Add to compare:</span>
                        {mentioned.map((c) => (
                          <button
                            key={c.iso_code}
                            onClick={() => onAddToCompare!(c.iso_code)}
                            className="inline-flex items-center gap-1 rounded-full border border-violet-500/[0.12] bg-violet-500/[0.04] px-2.5 py-1 text-[10px] font-medium text-violet-400/60 transition-all hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-violet-400/90"
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

                  {/* Follow-up actions */}
                  {msg.role === "ai" && i === messages.length - 1 && (() => {
                    const actions = extractFollowUpActions(msg.text);
                    if (actions.length === 0) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-1.5">
                        <span className="text-[9px] text-white/15 font-semibold uppercase tracking-wider">Continue exploring</span>
                        {actions.map((action, ai) => (
                          <button
                            key={ai}
                            onClick={() => handleSend(action)}
                            className="w-full text-left rounded-xl border border-cyan-500/[0.08] bg-cyan-500/[0.02] px-3 py-2.5 text-[11px] text-cyan-400/45 transition-all hover:border-cyan-500/15 hover:bg-cyan-500/[0.05] hover:text-cyan-400/70 ax-section-in"
                            style={{ animationDelay: `${ai * 80}ms` }}
                          >
                            <span className="text-cyan-400/35 mr-1.5">→</span>
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
              <div className="flex gap-3 ax-fade-in-up">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400/50 mt-0.5">
                  <SparkleIcon size={12} />
                </div>
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" style={{ animationDelay: "600ms" }} />
                    </div>
                    <span className="text-[11px] text-white/20">{thinkingText}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] px-5 py-4 bg-[#08081a]/50">
            {isLocked ? (
              <div className="rounded-2xl border border-violet-500/[0.12] bg-gradient-to-r from-violet-500/[0.04] to-cyan-500/[0.03] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white/70 mb-0.5">{upgrade.title}</p>
                    <p className="text-[11px] text-white/30 leading-relaxed">{upgrade.description}</p>
                  </div>
                  <button className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500/20 to-cyan-500/15 border border-violet-500/15 px-4 py-2.5 text-[11px] font-semibold text-violet-300/80 transition-all hover:from-violet-500/30 hover:to-cyan-500/20 hover:text-violet-200">
                    <ArrowUpRightIcon size={11} />
                    {upgrade.cta}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  disabled={isThinking}
                  className="flex-1 rounded-2xl ax-glass-1 px-4 py-3.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none transition-all duration-300 focus:border-cyan-500/25 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.1)] disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isThinking}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-cyan-400/70 transition-all duration-300 hover:from-cyan-500/30 hover:to-blue-500/20 hover:text-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10 disabled:opacity-25 disabled:hover:shadow-none"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22 11 13 2 9l20-7Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
