import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle2,
  Trophy, TrendingUp, Brain, AlertCircle, Sparkles, ArrowRight,
  BarChart3, Medal, Star,
} from "lucide-react";
import { cadusUrl } from "@/lib/host";


const SUBJECTS_BREAKDOWN = [
  { name: "Anatomy", total: 35, correct: 24, color: "#007AFF" },
  { name: "Physiology", total: 30, correct: 18, color: "#00C2A8" },
  { name: "Pharmacology", total: 40, correct: 22, color: "#8B5CF6" },
  { name: "Pathology", total: 35, correct: 28, color: "#F59E0B" },
  { name: "Medicine", total: 50, correct: 35, color: "#EF4444" },
  { name: "Surgery", total: 45, correct: 30, color: "#10B981" },
  { name: "Microbiology", total: 25, correct: 15, color: "#EC4899" },
  { name: "Others", total: 40, correct: 26, color: "#06B6D4" },
];

const MOCK_QUESTIONS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  question: [
    "A 45-year-old male presents with crushing chest pain radiating to the left arm for 2 hours. ECG shows ST elevation in leads II, III, aVF. What is the most likely diagnosis?",
    "Which of the following is the drug of choice for prophylaxis of Pneumocystis jirovecii pneumonia in HIV patients?",
    "A child presents with fever, rash starting at hairline and moving centrifugally, koplik's spots. Causative agent is?",
    "Which enzyme is deficient in Phenylketonuria (PKU)?",
    "The most common cause of mitral stenosis in India is:",
  ][i % 5],
  options: [
    ["Inferior STEMI", "Anterior STEMI", "Unstable Angina", "NSTEMI"],
    ["Co-trimoxazole", "Dapsone", "Pentamidine", "Fluconazole"],
    ["Measles virus", "Rubella virus", "Varicella virus", "Parvovirus B19"],
    ["Phenylalanine hydroxylase", "Tyrosinase", "Homogentisate oxidase", "Fumarylacetoacetase"],
    ["Rheumatic fever", "Congenital", "Infective endocarditis", "Calcific degeneration"],
  ][i % 5],
  correct: 0,
  subject: SUBJECTS_BREAKDOWN[i % SUBJECTS_BREAKDOWN.length].name,
  explanation: "This is the correct answer based on the clinical presentation and ECG findings described in the question stem. Key teaching point: Remember the classic presentation.",
}));

type Phase = "intro" | "exam" | "result";

export default function MockTest() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(180 * 60);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (phase !== "exam" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { setPhase("result"); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const q = MOCK_QUESTIONS[current];
  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
  const pctTime = (timeLeft / (180 * 60)) * 100;
  const totalCorrect = SUBJECTS_BREAKDOWN.reduce((a, s) => a + s.correct, 0);
  const totalQ = SUBJECTS_BREAKDOWN.reduce((a, s) => a + s.total, 0);
  const score = Math.round((totalCorrect / totalQ) * 100);
  const percentile = 73;

  const toggleFlag = useCallback(() => {
    setFlagged(prev => { const n = new Set(prev); n.has(current) ? n.delete(current) : n.add(current); return n; });
  }, [current]);

  if (phase === "intro") return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#F2F2F7" }}>
      <div className="max-w-lg w-full">
        <div className="rounded-3xl p-8 text-center" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: "#1C1C1E" }}>NEET-PG Mock Test</h1>
          <p className="text-sm mb-6" style={{ color: "#636366" }}>Simulate the real NEET-PG exam experience with full 300-question mock</p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[{ v: "300", l: "Questions" }, { v: "3h", l: "Duration" }, { v: "19", l: "Subjects" }].map((s, i) => (
              <div key={i} className="rounded-xl py-3" style={{ background: "#F2F2F7" }}>
                <div className="text-xl font-black" style={{ color: "#007AFF" }}>{s.v}</div>
                <div className="text-[11px]" style={{ color: "#AEAEB2" }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="text-left rounded-xl p-4 mb-6 space-y-2" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
            {["Do not refresh or navigate away during the test", "Test auto-submits when timer ends", "Each correct answer: +4 marks, Wrong: -1 mark"].map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "#636366" }}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#EF4444" }} />{r}
              </div>
            ))}
          </div>
          <button onClick={() => setPhase("exam")} className="w-full py-4 rounded-2xl font-bold text-base" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
            Start Mock Test →
          </button>
          <p className="text-xs mt-3" style={{ color: "#AEAEB2" }}>Demo: Showing 20 of 300 questions</p>
        </div>
      </div>
    </div>
  );

  if (phase === "result") return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Score card */}
        <div className="rounded-3xl p-8 mb-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <Trophy className="w-12 h-12 text-white mx-auto mb-3" />
            <div className="text-6xl font-black text-white mb-1">{score}%</div>
            <p className="text-white/80 mb-4">{totalCorrect}/{totalQ} correct · Percentile: <strong className="text-white">{percentile}th</strong></p>
            <div className="grid grid-cols-3 gap-3">
              {[{ v: totalCorrect, l: "Correct", c: "#4ADE80" }, { v: totalQ - totalCorrect - 12, l: "Wrong", c: "#F87171" }, { v: 12, l: "Skipped", c: "rgba(255,255,255,0.5)" }].map((s, i) => (
                <div key={i} className="rounded-xl py-2.5" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <div className="text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[11px] text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="rounded-2xl p-6 mb-4" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#1C1C1E" }}><BarChart3 className="w-4.5 h-4.5" style={{ color: "#007AFF" }} /> Subject-wise Breakdown</h2>
          <div className="space-y-3">
            {SUBJECTS_BREAKDOWN.map((s, i) => {
              const pct = Math.round((s.correct / s.total) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "#1C1C1E" }}>{s.name}</span>
                    <span className="text-xs" style={{ color: "#636366" }}>{s.correct}/{s.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#F2F2F7" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4.5 h-4.5" style={{ color: "#7C3AED" }} />
            <span className="font-bold text-sm" style={{ color: "#7C3AED" }}>Cadus AI Performance Analysis</span>
          </div>
          <p className="text-sm mb-3" style={{ color: "#636366" }}>
            Your weakest area is <strong style={{ color: "#EF4444" }}>Pharmacology (55%)</strong>. You're spending too long on Pathology questions — averaging 72 sec vs recommended 36 sec. Focus on autonomic drugs and antibiotics this week.
          </p>
          <Link href="/ai-assistant" className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#7C3AED" }}>
            Get personalised revision plan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Leaderboard teaser */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#1C1C1E" }}><Medal className="w-4.5 h-4.5" style={{ color: "#F59E0B" }} /> This Week's Top Scorers</h3>
          {[{ n: "Dr. Priya S.", score: 94, city: "Delhi" }, { n: "Dr. Arjun K.", score: 91, city: "Mumbai" }, { n: "Dr. Sneha R.", score: 89, city: "Bangalore" }].map((u, i) => (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < 2 ? "1px solid rgba(60,60,67,0.07)" : "none" }}>
              <span className="w-5 text-center font-bold text-sm" style={{ color: i === 0 ? "#F59E0B" : "#AEAEB2" }}>{i + 1}</span>
              <span className="flex-1 text-sm font-medium" style={{ color: "#1C1C1E" }}>{u.n} <span className="text-xs" style={{ color: "#AEAEB2" }}>· {u.city}</span></span>
              <span className="font-bold text-sm" style={{ color: "#007AFF" }}>{u.score}%</span>
            </div>
          ))}
        </div>

        <button onClick={() => { setPhase("intro"); setAnswers({}); setFlagged(new Set()); setTimeLeft(180 * 60); setCurrent(0); }}
          className="w-full py-3.5 rounded-2xl font-bold" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
          Take Another Mock Test
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Exam Header */}
      <div className="fixed top-[100px] left-0 right-0 z-40 px-4 py-2" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(60,60,67,0.1)" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full" style={{ background: "#F2F2F7" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${pctTime}%`, background: pctTime > 30 ? "#00C2A8" : "#EF4444" }} />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: pctTime > 30 ? "rgba(0,194,168,0.1)" : "rgba(239,68,68,0.1)" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: pctTime > 30 ? "#00C2A8" : "#EF4444" }} />
            <span className="font-bold text-sm tabular-nums" style={{ color: pctTime > 30 ? "#00C2A8" : "#EF4444" }}>{mins}:{secs.toString().padStart(2, "0")}</span>
          </div>
          <button onClick={() => setPhase("result")} className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "#F2F2F7", color: "#636366" }}>Submit</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-16 pb-10">
        <div className="rounded-2xl p-6 mb-4" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full mr-2" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>Q {current + 1}/{MOCK_QUESTIONS.length}</span>
              <span className="text-xs" style={{ color: "#AEAEB2" }}>{q.subject}</span>
            </div>
            <button onClick={toggleFlag} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: flagged.has(current) ? "rgba(245,158,11,0.1)" : "#F2F2F7", color: flagged.has(current) ? "#F59E0B" : "#AEAEB2" }}>
              <Flag className="w-3.5 h-3.5" /> {flagged.has(current) ? "Flagged" : "Flag"}
            </button>
          </div>
          <p className="text-base font-medium mb-5 leading-relaxed" style={{ color: "#1C1C1E" }}>{q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              const sel = answers[current] === i;
              const correct = showExplanation && i === q.correct;
              const wrong = showExplanation && sel && i !== q.correct;
              return (
                <button key={i} onClick={() => !showExplanation && setAnswers(p => ({ ...p, [current]: i }))}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: correct ? "rgba(0,194,168,0.08)" : wrong ? "rgba(239,68,68,0.08)" : sel ? "rgba(0,122,255,0.08)" : "#F2F2F7",
                    border: `1px solid ${correct ? "rgba(0,194,168,0.3)" : wrong ? "rgba(239,68,68,0.3)" : sel ? "rgba(0,122,255,0.3)" : "transparent"}`,
                    color: "#1C1C1E",
                  }}>
                  <span className="font-bold mr-2" style={{ color: correct ? "#00C2A8" : wrong ? "#EF4444" : sel ? "#007AFF" : "#AEAEB2" }}>{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {answers[current] !== undefined && !showExplanation && (
            <button onClick={() => setShowExplanation(true)} className="mt-4 text-xs font-semibold" style={{ color: "#007AFF" }}>Show Explanation</button>
          )}
          {showExplanation && (
            <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: "rgba(0,194,168,0.06)", border: "1px solid rgba(0,194,168,0.15)", color: "#636366" }}>
              <strong style={{ color: "#00C2A8" }}>Explanation: </strong>{q.explanation}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={() => { setCurrent(c => Math.max(0, c - 1)); setShowExplanation(false); }} disabled={current === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="flex gap-1 flex-wrap justify-center flex-1">
            {MOCK_QUESTIONS.map((_, i) => (
              <button key={i} onClick={() => { setCurrent(i); setShowExplanation(false); }}
                className="w-7 h-7 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: i === current ? "#007AFF" : answers[i] !== undefined ? "rgba(0,194,168,0.12)" : flagged.has(i) ? "rgba(245,158,11,0.12)" : "#F2F2F7",
                  color: i === current ? "#FFFFFF" : answers[i] !== undefined ? "#00C2A8" : flagged.has(i) ? "#F59E0B" : "#AEAEB2",
                }}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => { setCurrent(c => Math.min(MOCK_QUESTIONS.length - 1, c + 1)); setShowExplanation(false); }} disabled={current === MOCK_QUESTIONS.length - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
