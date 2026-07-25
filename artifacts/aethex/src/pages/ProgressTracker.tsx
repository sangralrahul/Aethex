import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, BookOpen, Target, Award, RefreshCw } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { loginUrl } from "@/lib/host";


const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const NEET_SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology",
  "Microbiology", "Forensic Medicine", "Community Medicine", "Medicine",
  "Surgery", "Obstetrics & Gynaecology", "Paediatrics", "Ophthalmology",
  "ENT", "Orthopaedics", "Psychiatry", "Radiology", "Dermatology",
  "Anaesthesia", "Cardiology",
];

const SUBJECT_COLORS: Record<string, string> = {
  Anatomy: "#0ea5e9", Physiology: "#8b5cf6", Biochemistry: "#f59e0b",
  Pathology: "#ef4444", Pharmacology: "#10b981", Microbiology: "#6366f1",
  "Forensic Medicine": "#ec4899", "Community Medicine": "#14b8a6",
  Medicine: "#3b82f6", Surgery: "#f97316", "Obstetrics & Gynaecology": "#e879f9",
  Paediatrics: "#84cc16", Ophthalmology: "#06b6d4", ENT: "#a78bfa",
  Orthopaedics: "#fb923c", Psychiatry: "#f472b6", Radiology: "#64748b",
  Dermatology: "#a3e635", Anaesthesia: "#38bdf8", Cardiology: "#f43f5e",
};

interface SubjectProgress {
  subject: string;
  attempted: number;
  correct: number;
}

export default function ProgressTracker() {
  const { user, getJwt, isLoggedIn } = useUserAuth();
  const [progress, setProgress] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    const jwt = getJwt();
    fetch(`${API_BASE}/api/monetization/progress`, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    })
      .then(r => r.json())
      .then(data => { setProgress(data.progress ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLoggedIn]);

  const getSubjectData = (subject: string): SubjectProgress => {
    const found = progress.find(p => p.subject === subject);
    return found ?? { subject, attempted: 0, correct: 0 };
  };

  const totalAttempted = progress.reduce((a, b) => a + b.attempted, 0);
  const totalCorrect = progress.reduce((a, b) => a + b.correct, 0);
  const overallPct = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const subjectsAttempted = progress.filter(p => p.attempted > 0).length;

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "linear-gradient(160deg,rgba(10,22,40,0.96) 0%,rgba(13,33,68,0.93) 50%,rgba(10,48,96,0.96) 100%)"
        }} />
        <div className="max-w-4xl mx-auto px-4 pt-14 pb-10 relative z-10">
          <Link href="/study-hub" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Study Hub
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.2)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: "#00C2A8" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">NEET-PG Progress Tracker</h1>
              {user && <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Hi {user.name}, here's your subject-wise performance</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {!isLoggedIn ? (
          <div className="rounded-2xl p-10 text-center bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#00C2A8" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1c1c1e" }}>Sign in to track your progress</h2>
            <p className="text-sm mb-6" style={{ color: "#636366" }}>Your NEET-PG MCQ scores are saved to your account.</p>
            <a href={loginUrl("/")}>
              <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
                Sign In
              </button>
            </a>

          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Attempted", value: totalAttempted, icon: Target, color: "#007AFF" },
                { label: "Correct", value: totalCorrect, icon: Award, color: "#00C2A8" },
                { label: "Overall %", value: `${overallPct}%`, icon: TrendingUp, color: overallPct >= 70 ? "#10b981" : overallPct >= 50 ? "#f59e0b" : "#ef4444" },
                { label: "Subjects Attempted", value: `${subjectsAttempted}/${NEET_SUBJECTS.length}`, icon: BookOpen, color: "#8b5cf6" },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    <span className="text-xs font-medium" style={{ color: "#636366" }}>{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl h-20 animate-pulse bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)" }} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(60,60,67,0.1)" }}>
                  <h2 className="font-semibold" style={{ color: "#1c1c1e" }}>Subject-wise Performance</h2>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(60,60,67,0.06)" }}>
                  {NEET_SUBJECTS.map(subject => {
                    const data = getSubjectData(subject);
                    const pct = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
                    const color = SUBJECT_COLORS[subject] ?? "#00C2A8";
                    const barWidth = data.attempted > 0 ? `${pct}%` : "0%";

                    return (
                      <div key={subject} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium" style={{ color: "#1c1c1e" }}>{subject}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs" style={{ color: "#636366" }}>
                              {data.attempted > 0 ? `${data.correct}/${data.attempted}` : "Not started"}
                            </span>
                            {data.attempted > 0 && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: pct >= 70 ? "#f0fdf4" : pct >= 50 ? "#fffbeb" : "#fef2f2",
                                  color: pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"
                                }}>
                                {pct}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(60,60,67,0.08)" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: barWidth, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(0,194,168,0.05)", border: "1px solid rgba(0,194,168,0.15)" }}>
              <RefreshCw className="w-5 h-5 mx-auto mb-2" style={{ color: "#00C2A8" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "#1c1c1e" }}>Progress syncs automatically</p>
              <p className="text-xs" style={{ color: "#636366" }}>Your scores are saved when you complete MCQ quizzes in the Study Hub.</p>
              <Link href="/study-hub">
                <button className="mt-3 px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
                  Practice MCQs
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
