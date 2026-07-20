import { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, Sparkles, BookOpen } from "lucide-react";

interface FlashCardProps {
  cards: { front: string; back: string }[];
}

const CARD_COLORS = [
  { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", glow: "rgba(102,126,234,0.3)", accent: "#a78bfa" },
  { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", glow: "rgba(240,147,251,0.3)", accent: "#f472b6" },
  { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", glow: "rgba(79,172,254,0.3)", accent: "#67e8f9" },
  { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", glow: "rgba(67,233,123,0.3)", accent: "#6ee7b7" },
  { bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", glow: "rgba(250,112,154,0.3)", accent: "#fbbf24" },
  { bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", glow: "rgba(161,140,209,0.3)", accent: "#c4b5fd" },
  { bg: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)", glow: "rgba(252,203,144,0.3)", accent: "#e879f9" },
  { bg: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", glow: "rgba(224,195,252,0.3)", accent: "#93c5fd" },
  { bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", glow: "rgba(246,211,101,0.3)", accent: "#fdba74" },
  { bg: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)", glow: "rgba(137,247,254,0.3)", accent: "#60a5fa" },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function FlashCard({ cards }: FlashCardProps) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleFlip = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setFlipped(f => !f);
    timerRef.current = setTimeout(() => setIsAnimating(false), reducedMotion ? 50 : 500);
  }, [isAnimating, reducedMotion]);

  const next = () => {
    if (current < cards.length - 1) {
      setCurrent(i => i + 1);
      setFlipped(false);
    }
  };
  const prev = () => {
    if (current > 0) {
      setCurrent(i => i - 1);
      setFlipped(false);
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
        <BookOpen className="w-10 h-10 mb-3" style={{ color: "#6B7280" }} />
        <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No flashcards available</p>
      </div>
    );
  }

  const card = cards[current];
  const colorScheme = CARD_COLORS[current % CARD_COLORS.length];
  const progress = ((current + 1) / cards.length) * 100;
  const flipDuration = reducedMotion ? "0.05s" : "0.5s";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colorScheme.bg }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: "#0F1729" }}>
            Card {current + 1} of {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: colorScheme.accent }} />
          <span className="text-xs font-medium" style={{ color: colorScheme.accent }}>
            Tap to reveal
          </span>
        </div>
      </div>

      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "#E5E1D8" }} role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={cards.length} aria-label={`Card ${current + 1} of ${cards.length}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: colorScheme.bg }}
        />
      </div>

      <div style={{ perspective: reducedMotion ? "none" : "1200px" }}>
        <button
          type="button"
          className="relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-2xl"
          style={{
            minHeight: 280,
            transformStyle: reducedMotion ? "flat" : "preserve-3d",
            transition: `transform ${flipDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            focusVisibleRingColor: colorScheme.accent,
          } as React.CSSProperties}
          onClick={handleFlip}
          aria-label={flipped ? "Showing answer. Click to see question." : "Showing question. Click to see answer."}
          aria-pressed={flipped}
        >
          <div
            className="absolute inset-0 rounded-2xl p-6 flex flex-col"
            style={{
              background: colorScheme.bg,
              backfaceVisibility: "hidden",
              boxShadow: `0 20px 60px ${colorScheme.glow}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                QUESTION
              </span>
              <RotateCcw className="w-5 h-5 text-white/60" aria-hidden="true" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center text-lg leading-relaxed font-semibold text-white drop-shadow-sm"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                {card.front}
              </p>
            </div>
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                <RotateCcw className="w-3 h-3 text-white/70" aria-hidden="true" />
                <span className="text-xs text-white/70 font-medium">Tap to flip</span>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 rounded-2xl p-6 flex flex-col"
            style={{
              background: "#F5F3EE",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              border: `2px solid`,
              borderImage: `${colorScheme.bg} 1`,
              boxShadow: `0 20px 60px ${colorScheme.glow}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: colorScheme.bg, color: "#fff" }}>
                ANSWER
              </span>
              <RotateCcw className="w-5 h-5" style={{ color: colorScheme.accent }} aria-hidden="true" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center text-base leading-relaxed font-medium" style={{ color: "#0F1729" }}>
                {card.back}
              </p>
            </div>
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <RotateCcw className="w-3 h-3" style={{ color: colorScheme.accent }} aria-hidden="true" />
                <span className="text-xs font-medium" style={{ color: colorScheme.accent }}>Tap to see question</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={prev} disabled={current === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-30 hover:scale-105 active:scale-95"
          style={{ background: "rgba(255,255,255,0.08)", color: "#0F1729", border: "1px solid rgba(255,255,255,0.1)" }}
          aria-label="Previous card">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex gap-1.5" role="tablist" aria-label="Card navigation">
          {cards.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); setFlipped(false); }}
              className="rounded-full transition-all duration-300"
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to card ${i + 1}`}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                background: i === current ? CARD_COLORS[i % CARD_COLORS.length].bg : "#E5E1D8",
              }} />
          ))}
        </div>

        <button onClick={next} disabled={current === cards.length - 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-30 hover:scale-105 active:scale-95"
          style={{ background: colorScheme.bg, color: "#fff" }}
          aria-label="Next card">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
