import { useState, useEffect, useRef, useCallback } from "react";
import { useSeo } from "@/hooks/use-seo";
import { PageHero } from "@/components/PageHero";
import {
  Brain, Clock, CheckCircle2, XCircle, ChevronRight, BarChart3,
  Trophy, Zap, BookOpen, Target, RefreshCw, Play, ArrowLeft,
  AlertCircle, Star, TrendingUp, Users, Award, Sparkles, Timer,
  CheckCheck, X, ChevronDown,
} from "lucide-react";

import { ALL_SUBJECTS, QUESTIONS, type Difficulty, type MCQ, type Subject } from "@/data/neetpgQuestions";
import { study } from "@/lib/study/progress";
import { fromBank } from "@/lib/study/questions";
import { BookmarkButton, TodayCard } from "@/components/study/StudyBits";
import { Leaderboard } from "@/components/study/StudyBits2";


// ── Leaderboard Data ───────────────────────────────────────────────────────

const SUBJECTS: Subject[] = ALL_SUBJECTS;
const FILTER_TABS = ["All", ...SUBJECTS] as const;

const DIFF_STYLES: Record<Difficulty, { bg: string; color: string; border: string }> = {
  Easy: { bg: "rgba(52,199,89,0.12)", color: "#34C759", border: "rgba(52,199,89,0.25)" },
  Medium: { bg: "rgba(255,149,0,0.12)", color: "#FF9500", border: "rgba(255,149,0,0.25)" },
  Hard: { bg: "rgba(255,59,48,0.12)", color: "#FF3B30", border: "rgba(255,59,48,0.25)" },
};

const SUBJ_COLORS: Record<Subject, string> = {
  Anatomy: "#007AFF", Physiology: "#5856D6", Biochemistry: "#FF9500",
  Pathology: "#FF3B30", Pharmacology: "#00C2A8", Microbiology: "#34C759",
  Medicine: "#AF52DE", Surgery: "#FF6B35", Gynaecology: "#FF2D92",
  Paediatrics: "#0EA5E9", "Community Medicine": "#14B8A6", "Forensic Medicine": "#64748B", Ophthalmology: "#06B6D4", ENT: "#8B5CF6",
  Psychiatry: "#EC4899", Dermatology: "#F59E0B", Orthopaedics: "#F97316", Anaesthesia: "#3B82F6", Radiology: "#475569",
};

// ── Helper: Format seconds ─────────────────────────────────────────────────
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ── Practice Mode Component ────────────────────────────────────────────────
function PracticeMode({ questions, onExit }: { questions: MCQ[]; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const current = questions[idx];
  const answered = selected !== null;

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setElapsed(e => e + 1);
      setQuestionTime(t => t + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSelect = (optIdx: number) => {
    if (answered) return;
    setSelected(optIdx);
    if (timerRef.current) clearInterval(timerRef.current);
    study.record(fromBank(current), optIdx === current.correct); // update 77
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      onExit();
      return;
    }
    setIdx(i => i + 1);
    setSelected(null);
    setQuestionTime(0);
    timerRef.current = window.setInterval(() => {
      setElapsed(e => e + 1);
      setQuestionTime(t => t + 1);
    }, 1000);
  };

  const progress = ((idx + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: "#636366" }}>
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#007AFF" }}>
            <Timer className="w-4 h-4" />
            {fmtTime(questionTime)}
          </div>
          <div className="text-sm font-semibold" style={{ color: "#636366" }}>
            Q{idx + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full mb-8 overflow-hidden" style={{ background: "rgba(60,60,67,0.1)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg,#6D28D9,#4F46E5)" }} />
      </div>

      {/* Question Card */}
      <div className="rounded-2xl p-6 lg:p-8 mb-6"
        style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        {/* Tags */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: `${SUBJ_COLORS[current.subject]}14`, color: SUBJ_COLORS[current.subject] }}>
            {current.subject}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={DIFF_STYLES[current.difficulty]}>
            {current.difficulty}
          </span>
          {current.reference && (
            <span className="text-xs text-gray-400 italic ml-auto hidden sm:block">
              {current.reference}
            </span>
          )}
        </div>

        <div className="flex justify-end mb-3 gap-2"><BookmarkButton item={{ key: fromBank(current).key, kind: "question", title: current.question.slice(0, 140), subject: current.subject, q: fromBank(current) }} /></div>
        {/* Question */}
        <p className="text-base lg:text-lg font-semibold leading-relaxed mb-7" style={{ color: "#1C1C1E" }}>
          {current.question}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {current.options.map((opt, i) => {
            const label = ["A", "B", "C", "D"][i];
            let bg = "#FFFFFF";
            let border = "rgba(60,60,67,0.15)";
            let textColor = "#1C1C1E";
            let labelBg = "rgba(60,60,67,0.08)";
            let labelColor = "#636366";

            if (answered) {
              if (i === current.correct) {
                bg = "rgba(52,199,89,0.08)"; border = "#34C759"; textColor = "#1C1C1E";
                labelBg = "#34C759"; labelColor = "#FFFFFF";
              } else if (i === selected) {
                bg = "rgba(255,59,48,0.08)"; border = "#FF3B30"; textColor = "#1C1C1E";
                labelBg = "#FF3B30"; labelColor = "#FFFFFF";
              }
            } else if (!answered) {
              // Hover handled by CSS
            }

            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={answered}
                className="flex items-start gap-4 p-4 rounded-xl text-left transition-all"
                style={{ background: bg, border: `2px solid ${border}`, cursor: answered ? "default" : "pointer" }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-all"
                  style={{ background: labelBg, color: labelColor }}>
                  {label}
                </span>
                <span className="text-sm leading-relaxed font-medium" style={{ color: textColor }}>{opt}</span>
                {answered && i === current.correct && (
                  <CheckCircle2 className="w-5 h-5 ml-auto shrink-0 mt-0.5" style={{ color: "#34C759" }} />
                )}
                {answered && i === selected && i !== current.correct && (
                  <XCircle className="w-5 h-5 ml-auto shrink-0 mt-0.5" style={{ color: "#FF3B30" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && (
          <div className="mt-6 p-5 rounded-xl"
            style={{ background: selected === current.correct ? "rgba(52,199,89,0.07)" : "rgba(255,149,0,0.07)", border: `1px solid ${selected === current.correct ? "rgba(52,199,89,0.2)" : "rgba(255,149,0,0.2)"}` }}>
            <div className="flex items-center gap-2 mb-3">
              {selected === current.correct
                ? <CheckCheck className="w-4 h-4" style={{ color: "#34C759" }} />
                : <AlertCircle className="w-4 h-4" style={{ color: "#FF9500" }} />}
              <span className="text-sm font-bold" style={{ color: selected === current.correct ? "#34C759" : "#FF9500" }}>
                {selected === current.correct ? "Correct!" : `Correct answer: ${["A", "B", "C", "D"][current.correct]}`}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#3A3A3C" }}>
              {current.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Next button */}
      {answered && (
        <div className="flex justify-end">
          <button onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6D28D9,#4F46E5)", color: "#FFFFFF" }}>
            {idx + 1 >= questions.length ? "Finish" : "Next Question"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Quick Test Setup ───────────────────────────────────────────────────────
interface TestConfig { subject: Subject | "All"; count: 10 | 20 | 30; difficulty: Difficulty | "All" }
interface TestResult { score: number; total: number; timeSec: number; answers: { q: MCQ; selected: number }[] }

function QuickTest({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<"setup" | "test" | "results">("setup");
  const [config, setConfig] = useState<TestConfig>({ subject: "All", count: 10, difficulty: "All" });
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ q: MCQ; selected: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startTest = () => {
    let pool = [...QUESTIONS];
    if (config.subject !== "All") pool = pool.filter(q => q.subject === config.subject);
    if (config.difficulty !== "All") pool = pool.filter(q => q.difficulty === config.difficulty);
    pool = pool.sort(() => Math.random() - 0.5).slice(0, config.count);
    if (pool.length === 0) pool = QUESTIONS.slice(0, config.count);
    setQuestions(pool);
    setIdx(0);
    setAnswers([]);
    setSelected(null);
    setAnswered(false);
    setElapsed(0);
    setPhase("test");
    timerRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const handleSelect = (optIdx: number) => {
    if (answered) return;
    setSelected(optIdx);
    setAnswered(true);
    study.record(fromBank(questions[idx]!), optIdx === questions[idx]!.correct); // update 77
  };

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, { q: questions[idx], selected }];
    if (idx + 1 >= questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setAnswers(newAnswers);
      setPhase("results");
    } else {
      setAnswers(newAnswers);
      setIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onExit} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
            <ArrowLeft className="w-5 h-5" style={{ color: "#636366" }} />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold" style={{ color: "#1C1C1E" }}>Quick Test Setup</h2>
            <p className="text-sm" style={{ color: "#636366" }}>Configure your practice test</p>
          </div>
        </div>

        <div className="rounded-2xl p-6 lg:p-8"
          style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          {/* Subject */}
          <div className="mb-7">
            <label className="block text-sm font-bold mb-3" style={{ color: "#1C1C1E" }}>Subject</label>
            <div className="flex flex-wrap gap-2">
              {(["All", ...SUBJECTS] as const).map(s => (
                <button key={s} onClick={() => setConfig(c => ({ ...c, subject: s }))}
                  className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={config.subject === s
                    ? { background: "#007AFF", color: "#FFFFFF" }
                    : { background: "rgba(60,60,67,0.06)", color: "#636366", border: "1px solid rgba(60,60,67,0.12)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Number */}
          <div className="mb-7">
            <label className="block text-sm font-bold mb-3" style={{ color: "#1C1C1E" }}>Number of Questions</label>
            <div className="flex gap-3">
              {([10, 20, 30] as const).map(n => (
                <button key={n} onClick={() => setConfig(c => ({ ...c, count: n }))}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                  style={config.count === n
                    ? { background: "#007AFF", color: "#FFFFFF" }
                    : { background: "rgba(60,60,67,0.06)", color: "#636366", border: "1px solid rgba(60,60,67,0.12)" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-8">
            <label className="block text-sm font-bold mb-3" style={{ color: "#1C1C1E" }}>Difficulty</label>
            <div className="flex gap-3 flex-wrap">
              {(["All", "Easy", "Medium", "Hard"] as const).map(d => (
                <button key={d} onClick={() => setConfig(c => ({ ...c, difficulty: d as any }))}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all min-w-[80px]"
                  style={config.difficulty === d
                    ? { background: "#007AFF", color: "#FFFFFF" }
                    : { background: "rgba(60,60,67,0.06)", color: "#636366", border: "1px solid rgba(60,60,67,0.12)" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startTest}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6D28D9,#4F46E5)", color: "#FFFFFF", boxShadow: "0 4px 20px rgba(109,40,217,0.3)" }}>
            <Play className="w-5 h-5" />
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (phase === "test") {
    const current = questions[idx];
    const progress = ((idx + 1) / questions.length) * 100;
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold" style={{ color: "#636366" }}>Q{idx + 1}/{questions.length}</span>
          <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "#007AFF" }}>
            <Timer className="w-4 h-4" /> {fmtTime(elapsed)}
          </div>
        </div>
        <div className="h-2 rounded-full mb-8 overflow-hidden" style={{ background: "rgba(60,60,67,0.1)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#6D28D9,#4F46E5)" }} />
        </div>
        <div className="rounded-2xl p-6 lg:p-8"
          style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${SUBJ_COLORS[current.subject]}14`, color: SUBJ_COLORS[current.subject] }}>{current.subject}</span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={DIFF_STYLES[current.difficulty]}>{current.difficulty}</span>
          </div>
          <p className="text-base font-semibold leading-relaxed mb-6" style={{ color: "#1C1C1E" }}>{current.question}</p>
          <div className="flex flex-col gap-3 mb-6">
            {current.options.map((opt, i) => {
              const label = ["A", "B", "C", "D"][i];
              let bg = "#FFFFFF", border = "rgba(60,60,67,0.15)", lBg = "rgba(60,60,67,0.08)", lColor = "#636366";
              if (answered) {
                if (i === current.correct) { bg = "rgba(52,199,89,0.08)"; border = "#34C759"; lBg = "#34C759"; lColor = "#FFF"; }
                else if (i === selected) { bg = "rgba(255,59,48,0.08)"; border = "#FF3B30"; lBg = "#FF3B30"; lColor = "#FFF"; }
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={answered}
                  className="flex items-start gap-4 p-4 rounded-xl text-left transition-all"
                  style={{ background: bg, border: `2px solid ${border}`, cursor: answered ? "default" : "pointer" }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: lBg, color: lColor }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: "#1C1C1E" }}>{opt}</span>
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="mb-6 p-4 rounded-xl" style={{ background: selected === current.correct ? "rgba(52,199,89,0.07)" : "rgba(255,59,48,0.07)", border: `1px solid ${selected === current.correct ? "rgba(52,199,89,0.2)" : "rgba(255,59,48,0.2)"}` }}>
              <p className="text-xs font-bold mb-1" style={{ color: selected === current.correct ? "#34C759" : "#FF3B30" }}>
                {selected === current.correct ? "✓ Correct!" : `✗ Correct: ${["A", "B", "C", "D"][current.correct]}`}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#3A3A3C" }}>{current.explanation}</p>
            </div>
          )}
          {answered && (
            <button onClick={handleNext}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#6D28D9,#4F46E5)", color: "#FFFFFF" }}>
              {idx + 1 >= questions.length ? "View Results" : "Next"} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results
  const score = answers.filter(a => a.selected === a.q.correct).length;
  const pct = Math.round((score / answers.length) * 100);
  const subjectMap: Record<string, { correct: number; total: number }> = {};
  answers.forEach(a => {
    if (!subjectMap[a.q.subject]) subjectMap[a.q.subject] = { correct: 0, total: 0 };
    subjectMap[a.q.subject].total++;
    if (a.selected === a.q.correct) subjectMap[a.q.subject].correct++;
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-8 text-center mb-6"
        style={{ background: "linear-gradient(135deg,#0A0F1E,#0F2040)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: pct >= 75 ? "rgba(52,199,89,0.2)" : pct >= 50 ? "rgba(255,149,0,0.2)" : "rgba(255,59,48,0.2)" }}>
          <Trophy className="w-10 h-10" style={{ color: pct >= 75 ? "#34C759" : pct >= 50 ? "#FF9500" : "#FF3B30" }} />
        </div>
        <div className="text-5xl font-display font-bold mb-2" style={{ color: pct >= 75 ? "#34C759" : pct >= 50 ? "#FF9500" : "#FF3B30" }}>{pct}%</div>
        <p className="text-white font-semibold mb-4">{score} / {answers.length} correct</p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: "Score", value: `${score}/${answers.length}`, color: "#007AFF" },
            { label: "Time", value: fmtTime(elapsed), color: "#00C2A8" },
            { label: "Accuracy", value: `${pct}%`, color: pct >= 75 ? "#34C759" : "#FF9500" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: "#1C1C1E" }}>Subject-wise Analysis</h3>
        <div className="flex flex-col gap-3">
          {Object.entries(subjectMap).map(([subj, data]) => {
            const sPct = Math.round((data.correct / data.total) * 100);
            return (
              <div key={subj}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: "#1C1C1E" }}>{subj}</span>
                  <span className="text-xs font-bold" style={{ color: sPct >= 75 ? "#34C759" : sPct >= 50 ? "#FF9500" : "#FF3B30" }}>
                    {data.correct}/{data.total} ({sPct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(60,60,67,0.1)" }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${sPct}%`,
                    background: sPct >= 75 ? "#34C759" : sPct >= 50 ? "#FF9500" : "#FF3B30",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setPhase("setup"); setAnswers([]); }} className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#6D28D9,#4F46E5)", color: "#FFFFFF" }}>
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
        <button onClick={onExit} className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-gray-100"
          style={{ border: "1px solid rgba(60,60,67,0.15)", color: "#636366" }}>
          Back to Hub
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
type Mode = "hub" | "practice" | "quicktest";

export default function NeetPg() {
  useSeo({ title: "NEET-PG preparation: subjects, PYQs and study plans | Aethex Study", description: "Prepare for NEET-PG with subject-wise plans, previous-year questions, mock tests and flashcards on Aethex Study.", path: "/neet-pg" });
  const [mode, setMode] = useState<Mode>("hub");
  const [subjectFilter, setSubjectFilter] = useState<typeof FILTER_TABS[number]>("All");

  const filteredQuestions = subjectFilter === "All"
    ? QUESTIONS
    : QUESTIONS.filter(q => q.subject === subjectFilter);

  if (mode === "practice") {
    return (
      <div className="min-h-screen py-12" style={{ background: "#F7F8FA" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PracticeMode questions={filteredQuestions.length ? filteredQuestions : QUESTIONS} onExit={() => setMode("hub")} />
        </div>
      </div>
    );
  }

  if (mode === "quicktest") {
    return (
      <div className="min-h-screen py-12" style={{ background: "#F7F8FA" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuickTest onExit={() => setMode("hub")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA" }}>

      {/* ── Hero ── */}
      <PageHero
        tag="NEET-PG"
        title="NEET-PG MCQ Engine"
        subtitle="Practice questions for NEET-PG, NExT and USMLE, with an explanation for every answer and your results by subject."
        icon={<Brain className="w-7 h-7" style={{ color: "rgba(255,255,255,0.85)" }} />}
        right={
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setMode("practice")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: "#6D28D9", color: "#FFFFFF" }}>
              <Play className="w-4 h-4" /> Practice Mode
            </button>
            <button onClick={() => setMode("quicktest")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.1)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Zap className="w-4 h-4" /> Quick Test
            </button>
          </div>
        }
      />

      {/* ── Stats Bar ── */}
      <section className="py-8" style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(60,60,67,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: `${QUESTIONS.length}`, label: "Questions", icon: BookOpen, color: "#6D28D9" },
              { value: `${SUBJECTS.length}`, label: "Subjects covered", icon: Brain, color: "#6D28D9" },
              { value: "2", label: "Modes: practice and timed", icon: Target, color: "#6D28D9" },
              { value: "+4 / −1", label: "NEET-PG marking", icon: BarChart3, color: "#6D28D9" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center px-4 py-2"
                  style={i > 0 ? { borderLeft: "1px solid rgba(60,60,67,0.1)" } : {}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${stat.color}14` }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="text-2xl font-display font-bold mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs font-medium" style={{ color: "#636366" }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* update 77: today's goal, streak and the new tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 st-neet-today">
        <TodayCard />
        <div className="st-quick"><a href="/custom-test" className="st-btn ghost">Build a custom test</a><a href="/my-library?tab=revision" className="st-btn ghost">Revise wrong answers</a><a href="/my-library?tab=bookmarks" className="st-btn ghost">Bookmarks and notes</a></div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {[
            {
              icon: Play, title: "Practice Mode", color: "#6D28D9",
              gradient: "from-violet-700 to-indigo-950",
              desc: "Go through questions one by one with instant feedback, detailed explanations, and per-question timer. Great for deep learning.",
              features: ["Instant correct/wrong feedback", "Detailed explanations", "Per-question timer", "Subject & difficulty tags"],
              cta: "Start Practicing", mode: "practice" as Mode,
            },
            {
              icon: Zap, title: "Quick Test Mode", color: "#4338CA",
              gradient: "from-indigo-600 to-slate-900",
              desc: "Configure a timed mock test by subject, difficulty, and question count. Get a full performance analysis at the end.",
              features: ["Choose 10 / 20 / 30 Qs", "Filter by subject & difficulty", "Full timer for the test", "Subject-wise score analysis"],
              cta: "Start Quick Test", mode: "quicktest" as Mode,
            },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.title}
                className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className={`h-32 bg-gradient-to-br ${card.gradient} flex items-center px-8`}>
                  <Icon className="w-12 h-12 text-white opacity-90" />
                  <h3 className="text-2xl font-display font-bold text-white ml-5">{card.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#636366" }}>{card.desc}</p>
                  <ul className="flex flex-col gap-2 mb-6">
                    {card.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#3A3A3C" }}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: card.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setMode(card.mode)}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: card.color, color: "#FFFFFF" }}>
                    {card.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Question Browser */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold" style={{ color: "#1C1C1E" }}>Question Browser</h2>
              <p className="text-sm mt-1" style={{ color: "#636366" }}>{filteredQuestions.length} questions · NEET-PG style</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-8">
            {FILTER_TABS.map(tab => (
              <button key={tab} onClick={() => setSubjectFilter(tab)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={subjectFilter === tab
                  ? { background: "#007AFF", color: "#FFFFFF", boxShadow: "0 2px 10px rgba(0,122,255,0.25)" }
                  : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.15)" }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {filteredQuestions.map((q, qi) => (
              <QuestionPreviewCard key={q.id} q={q} number={qi + 1} />
            ))}
          </div>
        </div>

        {/* Leaderboard: update 81, real mock-test results of students who chose to show their name */}
        <div className="mt-12"><Leaderboard /></div>
      </div>
    </div>
  );
}

// ── Question Preview Card (collapsible) ────────────────────────────────────
function QuestionPreviewCard({ q, number }: { q: MCQ; number: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <button className="w-full flex items-start gap-4 p-5 text-left transition-all hover:bg-gray-50" onClick={() => setOpen(o => !o)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: `${SUBJ_COLORS[q.subject]}14`, color: SUBJ_COLORS[q.subject] }}>{q.subject}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={DIFF_STYLES[q.difficulty]}>{q.difficulty}</span>
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: "#1C1C1E" }}>{q.question}</p>
        </div>
        <ChevronDown className="w-5 h-5 shrink-0 transition-transform mt-0.5" style={{ color: "#AEAEB2", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "rgba(60,60,67,0.08)" }}>
          <div className="flex flex-col gap-2 mt-4 mb-4">
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: i === q.correct ? "rgba(52,199,89,0.07)" : "rgba(60,60,67,0.04)", border: `1px solid ${i === q.correct ? "rgba(52,199,89,0.2)" : "transparent"}` }}>
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: i === q.correct ? "#34C759" : "rgba(60,60,67,0.1)", color: i === q.correct ? "#FFF" : "#636366" }}>
                  {["A", "B", "C", "D"][i]}
                </span>
                <span className="text-sm" style={{ color: i === q.correct ? "#1C1C1E" : "#3A3A3C", fontWeight: i === q.correct ? 600 : 400 }}>{opt}</span>
                {i === q.correct && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0 mt-0.5" style={{ color: "#34C759" }} />}
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl" style={{ background: "rgba(0,122,255,0.05)", border: "1px solid rgba(0,122,255,0.12)" }}>
            <p className="text-xs font-bold mb-1.5" style={{ color: "#007AFF" }}>Explanation</p>
            <p className="text-xs leading-relaxed" style={{ color: "#3A3A3C" }}>{q.explanation}</p>
            {q.reference && <p className="text-xs mt-2 italic" style={{ color: "#AEAEB2" }}>Ref: {q.reference}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
