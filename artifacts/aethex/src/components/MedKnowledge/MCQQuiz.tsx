import { useState } from "react";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, Lock, Crown } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { UpgradeModal } from "@/components/UpgradeModal";

interface MCQ {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

interface MCQQuizProps {
  questions: MCQ[];
  topic: string;
  subject?: string;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function MCQQuiz({ questions, topic, subject }: MCQQuizProps) {
  const { user, isPro, getJwt } = useUserAuth();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<{ selected: string; correct: boolean }[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const q = questions[current];

  const canSeeExplanation = isPro || !!user;

  const handleSelect = (opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const isCorrect = opt.startsWith(q.correct);
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, { selected: opt, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
      if (user && subject) {
        const jwt = getJwt();
        if (jwt) {
          fetch(`${API_BASE}/api/monetization/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
            body: JSON.stringify({ subject, attempted: questions.length, correct: score + (selected && q && selected.startsWith(q.correct) ? 1 : 0) }),
          }).catch(() => {});
        }
      }
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
        <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: "#00C2A8" }} />
        <h3 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Quiz Complete!</h3>
        <p className="text-lg mb-1" style={{ color: "#6B7280" }}>Your Score</p>
        <div className="text-5xl font-bold mb-2" style={{ color: pct >= 70 ? "#238636" : pct >= 50 ? "#E3B341" : "#F85149" }}>
          {score}/{questions.length}
        </div>
        <div className="text-2xl font-semibold mb-6" style={{ color: "#6B7280" }}>{pct}%</div>
        <p className="mb-6 text-sm" style={{ color: "#6B7280" }}>
          {pct >= 70 ? "Excellent! You have a strong grasp of this topic." : pct >= 50 ? "Good effort! Review the missed questions." : "Keep studying! Revise the topic and try again."}
        </p>
        {subject && (
          <p className="text-xs mb-4" style={{ color: "rgba(0,194,168,0.8)" }}>
            ✓ Progress saved to your {subject} tracker
          </p>
        )}
        <button onClick={handleReset} className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90" style={{ background: "#00C2A8", color: "#F5F3EE" }}>
          <RotateCcw className="w-4 h-4" /> Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#E5E1D8" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Question {current + 1} of {questions.length}</span>
            <span className="text-sm font-semibold" style={{ color: "#00C2A8" }}>Score: {score}/{current}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "#E5E1D8" }}>
            <div className="h-full rounded-full transition-all" style={{ background: "#00C2A8", width: `${((current) / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="p-6">
          <p className="text-base font-medium mb-5 leading-relaxed" style={{ color: "#0F1729" }}>{q.question}</p>
          <div className="space-y-3 mb-6">
            {q.options.map((opt) => {
              const isCorrect = opt.startsWith(q.correct);
              const isSelected = selected === opt;
              let borderColor = "#E5E1D8";
              let bg = "#F5F3EE";
              let textColor = "#0F1729";

              if (answered) {
                if (isCorrect) { borderColor = "#238636"; bg = "rgba(35,134,54,0.1)"; textColor = "#7EE787"; }
                else if (isSelected && !isCorrect) { borderColor = "#F85149"; bg = "rgba(248,81,73,0.1)"; textColor = "#F85149"; }
              } else if (isSelected) {
                borderColor = "#00C2A8"; bg = "rgba(0,194,168,0.1)";
              }

              return (
                <button key={opt} onClick={() => handleSelect(opt)}
                  className="w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium"
                  style={{ background: bg, borderColor, color: textColor, cursor: answered ? "default" : "pointer" }}>
                  <span className="flex items-center gap-3">
                    {answered && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#238636" }} />}
                    {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 shrink-0" style={{ color: "#F85149" }} />}
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="rounded-xl mb-4 overflow-hidden" style={{ border: "1px solid rgba(0,194,168,0.2)" }}>
              {canSeeExplanation ? (
                <div className="p-4 text-sm leading-relaxed" style={{ background: "rgba(0,194,168,0.08)", color: "#0F1729" }}>
                  <span className="font-bold" style={{ color: "#00C2A8" }}>Explanation: </span>{q.explanation}
                </div>
              ) : (
                <div
                  className="relative p-4 cursor-pointer"
                  style={{ background: "rgba(0,194,168,0.06)" }}
                  onClick={() => setShowUpgrade(true)}
                >
                  <div className="blur-sm select-none text-sm leading-relaxed" style={{ color: "#0F1729" }}>
                    <span className="font-bold" style={{ color: "#00C2A8" }}>Explanation: </span>{q.explanation}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: "rgba(10,16,32,0.6)" }}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                      <Crown className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                      <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>
                        {user ? "Cadus Magnus Only" : "Sign up to reveal"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {answered && (
            <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#00C2A8", color: "#F5F3EE" }}>
              {current < questions.length - 1 ? "Next Question" : "See Results"} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} featureName="full MCQ explanations" />}
    </>
  );
}
