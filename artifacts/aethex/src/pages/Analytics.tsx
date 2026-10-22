import { useState } from "react";
import { Link } from "wouter";
import { TrendingUp, Target, Flame, Clock, Award, Brain, Share2, ChevronUp, ChevronDown } from "lucide-react";

const MCQ_DATA = [
  { week: "W1 Mar", accuracy: 62 }, { week: "W2 Mar", accuracy: 68 }, { week: "W3 Mar", accuracy: 71 },
  { week: "W4 Mar", accuracy: 69 }, { week: "W1 Apr", accuracy: 75 }, { week: "W2 Apr", accuracy: 78 },
];

const SUBJECT_DATA = [
  { name: "Pharmacology", pct: 55, color: "#EF4444" },
  { name: "Pathology", pct: 82, color: "#00C2A8" },
  { name: "Anatomy", pct: 68, color: "#007AFF" },
  { name: "Physiology", pct: 74, color: "#8B5CF6" },
  { name: "Medicine", pct: 71, color: "#F59E0B" },
  { name: "Surgery", pct: 66, color: "#10B981" },
];

const STREAK_DATA = Array.from({ length: 35 }, (_, i) => ({
  day: i,
  active: [0,1,2,3,5,6,7,8,9,10,12,13,14,15,16,17,19,20,21,22,23,24,26,27,28,29,30,31,33,34].includes(i),
  intensity: Math.floor(Math.random() * 3) + 1,
}));

const TOP_QUERIES = [
  { topic: "Drug interactions", count: 38 },
  { topic: "Differential diagnosis", count: 29 },
  { topic: "SOAP note generation", count: 22 },
  { topic: "Lab value interpretation", count: 18 },
  { topic: "Drug dosage calculation", count: 14 },
];

export default function Analytics() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const maxMCQ = Math.max(...MCQ_DATA.map(d => d.accuracy));

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-14 pb-16">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0A0E1A 0%,#1a1f3a 100%)" }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" style={{ background: "rgba(0,122,255,0.1)" }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(0,122,255,0.15)", border: "1px solid rgba(0,122,255,0.25)", color: "#60A5FA" }}>
            <TrendingUp className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Doctor Performance Dashboard</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing: "-1px" }}>
            Your <span style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analytics</span>
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>Track your MCQ accuracy, study streak, CME progress, and learning insights — all in one place.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {(["week", "month", "year"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
              style={period === p ? { background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.15)" }}>
              Last {p}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#636366" }}>
            <Share2 className="w-3.5 h-3.5" /> Share Progress
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "MCQ Accuracy", value: "78%", change: +6, icon: Target, color: "#007AFF" },
            { label: "Study Streak", value: "12 days", change: +3, icon: Flame, color: "#EF4444" },
            { label: "Time on Platform", value: "22h", change: +4, icon: Clock, color: "#8B5CF6" },
            { label: "CME Credits", value: "10/30", change: +3, icon: Award, color: "#F59E0B" },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}14` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: k.color }} />
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: "#00C2A8" }}>
                    <ChevronUp className="w-3 h-3" />+{k.change}
                  </span>
                </div>
                <div className="text-2xl font-black mb-0.5" style={{ color: "#1C1C1E" }}>{k.value}</div>
                <div className="text-xs" style={{ color: "#AEAEB2" }}>{k.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* MCQ Accuracy Trend */}
          <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
            <h3 className="font-bold text-sm mb-5 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "#007AFF" }} /> MCQ Accuracy Trend
            </h3>
            <div className="flex items-end gap-2 h-28">
              {MCQ_DATA.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: d.accuracy === maxMCQ ? "#007AFF" : "#AEAEB2" }}>{d.accuracy}%</span>
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${(d.accuracy / 100) * 100}px`, background: d.accuracy === maxMCQ ? "linear-gradient(180deg,#007AFF,#00C2A8)" : "#E5E7EB" }} />
                  <span className="text-[9px] text-center" style={{ color: "#AEAEB2" }}>{d.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Performance */}
          <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
            <h3 className="font-bold text-sm mb-5 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
              <Target className="w-4 h-4" style={{ color: "#EF4444" }} /> Subject-wise Performance
            </h3>
            <div className="space-y-3">
              {SUBJECT_DATA.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: "#1C1C1E" }}>{s.name}</span>
                    <span className="text-xs font-bold" style={{ color: s.pct < 65 ? "#EF4444" : "#00C2A8" }}>{s.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#F2F2F7" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Study Streak Calendar */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
            <Flame className="w-4 h-4" style={{ color: "#EF4444" }} /> Study Streak — Last 35 Days
            <span className="ml-auto text-xs font-normal" style={{ color: "#AEAEB2" }}>🔥 12-day current streak</span>
          </h3>
          <div className="flex gap-1.5 flex-wrap">
            {STREAK_DATA.map((d, i) => (
              <div key={i} className="w-7 h-7 rounded-md" title={`Day ${i + 1}`}
                style={{ background: d.active ? d.intensity === 3 ? "#007AFF" : d.intensity === 2 ? "#60A5FA" : "#BFDBFE" : "#F2F2F7" }} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs" style={{ color: "#AEAEB2" }}>Less</span>
            {["#F2F2F7", "#BFDBFE", "#60A5FA", "#007AFF"].map((c, i) => <div key={i} className="w-4 h-4 rounded" style={{ background: c }} />)}
            <span className="text-xs" style={{ color: "#AEAEB2" }}>More</span>
          </div>
        </div>

        {/* Cadus Query Topics */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
            <Brain className="w-4 h-4" style={{ color: "#8B5CF6" }} /> What You Ask Cadus Most
          </h3>
          <div className="space-y-2.5">
            {TOP_QUERIES.map((q, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-4 text-right font-bold" style={{ color: "#AEAEB2" }}>{i + 1}</span>
                <span className="flex-1 text-sm" style={{ color: "#1C1C1E" }}>{q.topic}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${(q.count / 38) * 80}px`, background: "#8B5CF6" }} />
                  <span className="text-xs" style={{ color: "#AEAEB2" }}>{q.count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly email digest */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "rgba(0,122,255,0.04)", border: "1px solid rgba(0,122,255,0.15)" }}>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-0.5" style={{ color: "#1C1C1E" }}>Weekly Performance Digest</p>
            <p className="text-xs" style={{ color: "#636366" }}>Get a personalised weekly summary of your progress sent to your email every Monday morning.</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap" style={{ background: "#007AFF", color: "#FFFFFF" }}>Enable Digest</button>
        </div>
      </div>
    </div>
  );
}
