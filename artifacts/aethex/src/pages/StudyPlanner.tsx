import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Brain, Calendar, Clock, Target, CheckCircle2, Circle,
  RotateCcw, Flame, ChevronRight, Sparkles, BookOpen,
  TrendingUp, AlertCircle, Plus, Minus, ArrowRight,
} from "lucide-react";

const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology",
  "Pharmacology", "Microbiology", "Forensic Medicine",
  "Community Medicine", "ENT", "Ophthalmology",
  "Medicine", "Surgery", "Obstetrics & Gynaecology",
  "Paediatrics", "Orthopaedics", "Psychiatry", "Radiology",
  "Anaesthesia", "Dermatology",
];

const MOCK_SCHEDULE = [
  { day: "Day 1 — Mon, Apr 07", topics: ["Anatomy: Upper Limb joints & nerve supply", "Pharmacology: Autonomic Nervous System basics"], mcqs: 40, revision: false, done: false },
  { day: "Day 2 — Tue, Apr 08", topics: ["Physiology: CVS — cardiac cycle, ECG", "Pathology: Inflammation — types & mediators"], mcqs: 40, revision: false, done: false },
  { day: "Day 3 — Wed, Apr 09", topics: ["Biochemistry: Enzymes & metabolic pathways", "Microbiology: Bacteriology — gram positive cocci"], mcqs: 30, revision: true, done: false },
  { day: "Day 4 — Thu, Apr 10", topics: ["Medicine: Cardiology — IHD, MI, CCF", "Surgery: Surgical infections & hernias"], mcqs: 50, revision: false, done: false },
  { day: "Day 5 — Fri, Apr 11", topics: ["Pharmacology: CVS drugs — antihypertensives", "Paediatrics: Neonatology"], mcqs: 40, revision: false, done: false },
  { day: "Day 6 — Sat, Apr 12", topics: ["Full revision: Anatomy + Physiology Week 1", "Mock MCQ drill: 100 questions"], mcqs: 100, revision: true, done: false },
  { day: "Day 7 — Sun, Apr 13", topics: ["Rest + Light Revision: Mnemonics & High-yield points"], mcqs: 20, revision: false, done: false },
];

export default function StudyPlanner() {
  const [step, setStep] = useState<"input" | "plan">("input");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(6);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [schedule, setSchedule] = useState(MOCK_SCHEDULE.map(d => ({ ...d })));
  const [generating, setGenerating] = useState(false);

  const daysToExam = useMemo(() => {
    if (!examDate) return 0;
    return Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));
  }, [examDate]);

  const toggleSubject = (s: string) => {
    setWeakSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleDone = (i: number) => {
    setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, done: !d.done } : d));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setStep("plan"); }, 1800);
  };

  const done = schedule.filter(d => d.done).length;
  const pct = Math.round((done / schedule.length) * 100);

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-14 pb-16">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(8,18,36,0.95) 0%,rgba(10,26,50,0.9) 100%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(0,122,255,0.15)", border: "1px solid rgba(0,122,255,0.25)", color: "#60A5FA" }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Powered by Cadus</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing: "-1px" }}>
            AI NEET-PG <span style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Study Planner</span>
          </h1>
          <p className="text-base max-w-xl mx-auto mb-0" style={{ color: "rgba(255,255,255,0.6)" }}>
            Enter your exam date and Cadus builds a personalised day-by-day schedule — adapted to your weak areas.
          </p>
          {examDate && step === "plan" && (
            <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <Flame className="w-5 h-5" style={{ color: "#EF4444" }} />
              <span className="text-white font-bold text-lg">{daysToExam} days</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>to exam date</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {step === "input" ? (
          <div className="space-y-6">
            {/* Exam Date */}
            <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
                <Calendar className="w-4.5 h-4.5" style={{ color: "#007AFF" }} /> Exam Date
              </h2>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "#F2F2F7", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E" }} />
              {examDate && <p className="mt-2 text-sm" style={{ color: "#007AFF" }}>{daysToExam} days remaining</p>}
            </div>

            {/* Daily Hours */}
            <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
                <Clock className="w-4.5 h-4.5" style={{ color: "#007AFF" }} /> Daily Study Hours
              </h2>
              <div className="flex items-center gap-4">
                <button onClick={() => setDailyHours(h => Math.max(2, h - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F2F2F7", border: "1px solid rgba(60,60,67,0.15)" }}><Minus className="w-4 h-4" /></button>
                <div className="flex-1 text-center">
                  <span className="text-4xl font-black" style={{ color: "#007AFF" }}>{dailyHours}</span>
                  <span className="text-sm ml-1" style={{ color: "#636366" }}>hrs/day</span>
                </div>
                <button onClick={() => setDailyHours(h => Math.min(16, h + 1))} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F2F2F7", border: "1px solid rgba(60,60,67,0.15)" }}><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Weak Subjects */}
            <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h2 className="font-bold text-base mb-1 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
                <Target className="w-4.5 h-4.5" style={{ color: "#EF4444" }} /> Weak Subjects
              </h2>
              <p className="text-xs mb-4" style={{ color: "#AEAEB2" }}>Select subjects you want extra focus on. AI allocates more sessions to these.</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => {
                  const sel = weakSubjects.includes(s);
                  return (
                    <button key={s} onClick={() => toggleSubject(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={sel ? { background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" } : { background: "#F2F2F7", color: "#636366", border: "1px solid rgba(60,60,67,0.12)" }}>
                      {sel && "🎯 "}{s}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={!examDate || generating}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}>
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Cadus is building your plan...</>
              ) : (
                <><Sparkles className="w-4.5 h-4.5" /> Generate My Study Plan</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-white">Your Progress</h2>
                <span className="text-white/80 text-sm">{done}/{schedule.length} days done</span>
              </div>
              <div className="h-3 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#FFFFFF" }} />
              </div>
              <p className="text-white/70 text-xs mt-2">{pct}% of syllabus plan covered</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[{ v: daysToExam, l: "Days Left" }, { v: `${dailyHours}h`, l: "Per Day" }, { v: weakSubjects.length || "All", l: "Focus Areas" }].map((s, i) => (
                  <div key={i} className="text-center rounded-xl py-2" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <div className="text-xl font-black text-white">{s.v}</div>
                    <div className="text-[10px] text-white/60">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              {schedule.map((day, i) => (
                <div key={i} className="rounded-2xl p-5 transition-all" style={{ background: day.done ? "rgba(0,194,168,0.06)" : "#FFFFFF", border: `1px solid ${day.done ? "rgba(0,194,168,0.2)" : "rgba(60,60,67,0.1)"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button onClick={() => toggleDone(i)} className="mt-0.5 shrink-0">
                        {day.done ? <CheckCircle2 className="w-5 h-5" style={{ color: "#00C2A8" }} /> : <Circle className="w-5 h-5" style={{ color: "#AEAEB2" }} />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: day.done ? "#00C2A8" : "#1C1C1E" }}>{day.day}</span>
                          {day.revision && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>📚 Revision Day</span>}
                        </div>
                        <ul className="space-y-1">
                          {day.topics.map((t, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-sm" style={{ color: "#636366" }}>
                              <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#007AFF" }} />{t}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" style={{ color: "#007AFF" }} />
                          <span className="text-xs" style={{ color: "#AEAEB2" }}>{day.mcqs} MCQs to attempt</span>
                          <Link href="/neet-pg" className="text-xs font-medium ml-auto" style={{ color: "#007AFF" }}>Start MCQs →</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Missed Day */}
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.08)" }}>
                <AlertCircle className="w-5 h-5" style={{ color: "#EF4444" }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: "#1C1C1E" }}>Missed a day?</p>
                <p className="text-xs" style={{ color: "#AEAEB2" }}>Cadus will readjust your plan automatically</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                <RotateCcw className="w-3.5 h-3.5" /> Reschedule
              </button>
            </div>

            <button onClick={() => setStep("input")} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: "#F2F2F7", color: "#636366" }}>
              ← Edit Plan Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
