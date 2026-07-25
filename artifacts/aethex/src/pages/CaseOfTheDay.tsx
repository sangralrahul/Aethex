import { useState, useEffect } from "react";
import { PageHero } from "@/components/PageHero";
import { Link } from "wouter";
import {
  User, Heart, Activity, Thermometer, Wind, Droplets,
  FlaskConical, ChevronRight, CheckCircle2, XCircle,
  Sparkles, RotateCcw, Calendar, Stethoscope, ChevronLeft,
  BookOpen, Clock,
} from "lucide-react";
import { clinicalCases, getTodaysCase, type ClinicalCase } from "@/data/clinicalCases";
import { cadusUrl } from "@/lib/host";

const SPECIALTY_COLORS: Record<string, string> = {

  "Cardiology":              "#FF3B30",
  "Neurology":               "#AF52DE",
  "Medicine / Cardiology":   "#FF3B30",
  "Endocrinology":           "#FF9500",
  "Paediatrics / Infectious Disease": "#34C759",
  "Obstetrics & Hepatology": "#00C2A8",
};

function VitalBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(0,122,255,0.08)" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: "#007AFF" }} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8E8E93" }}>{label}</p>
        <p className="text-xs font-semibold leading-tight mt-0.5" style={{ color: "#1C1C1E" }}>{value}</p>
      </div>
    </div>
  );
}

export default function CaseOfTheDay() {
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [caseData, setCaseData] = useState<ClinicalCase>(getTodaysCase());
  const [caseIndex, setCaseIndex] = useState(() => {
    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    return dayIndex % clinicalCases.length;
  });

  useEffect(() => {
    setCaseData(clinicalCases[caseIndex]);
    setSelectedOption(null);
    setRevealed(false);
  }, [caseIndex]);

  const specColor = SPECIALTY_COLORS[caseData.specialty] ?? "#007AFF";

  const buildCadusContext = () => {
    const c = caseData;
    return encodeURIComponent(
      `I'd like to discuss this clinical case with you:\n\n` +
      `**Case: ${c.title}**\n` +
      `Patient: ${c.patient_info.age}yr ${c.patient_info.gender}${c.patient_info.occupation ? `, ${c.patient_info.occupation}` : ""}\n` +
      `Chief Complaint: ${c.patient_info.chief_complaint}\n\n` +
      `History: ${c.history}\n\n` +
      `Vitals: ${Object.entries(c.vitals).filter(([,v]) => v).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(" | ")}\n\n` +
      `Investigations:\n${c.investigations.map(i => `- ${i.label}: ${i.value}${i.note ? ` (${i.note})` : ""}`).join("\n")}\n\n` +
      `Please give me a detailed clinical analysis, differential diagnosis, and management plan for this case.`
    );
  };

  const optionStyles = (optId: "A" | "B" | "C" | "D") => {
    if (!revealed && selectedOption !== optId) {
      return {
        bg: "#FFFFFF",
        border: "1px solid rgba(60,60,67,0.12)",
        color: "#1C1C1E",
        iconColor: "#8E8E93",
        iconBg: "rgba(60,60,67,0.06)",
      };
    }
    if (!revealed && selectedOption === optId) {
      return {
        bg: "rgba(0,122,255,0.05)",
        border: "1px solid rgba(0,122,255,0.35)",
        color: "#007AFF",
        iconColor: "#FFFFFF",
        iconBg: "#007AFF",
      };
    }
    if (revealed && optId === caseData.correct_answer) {
      return {
        bg: "rgba(52,199,89,0.07)",
        border: "1px solid rgba(52,199,89,0.4)",
        color: "#248A3D",
        iconColor: "#FFFFFF",
        iconBg: "#34C759",
      };
    }
    if (revealed && selectedOption === optId && optId !== caseData.correct_answer) {
      return {
        bg: "rgba(255,59,48,0.06)",
        border: "1px solid rgba(255,59,48,0.3)",
        color: "#D70015",
        iconColor: "#FFFFFF",
        iconBg: "#FF3B30",
      };
    }
    return {
      bg: "#FFFFFF",
      border: "1px solid rgba(60,60,67,0.08)",
      color: "#8E8E93",
      iconColor: "#C7C7CC",
      iconBg: "rgba(60,60,67,0.04)",
    };
  };

  const vitalEntries = Object.entries(caseData.vitals).filter(([,v]) => !!v) as [string, string][];
  const vitalIcons: Record<string, React.ElementType> = {
    bp: Heart, hr: Activity, rr: Wind, temp: Thermometer, spo2: Droplets, rbs: FlaskConical,
  };
  const vitalLabels: Record<string, string> = {
    bp: "Blood Pressure", hr: "Heart Rate", rr: "Respiratory Rate",
    temp: "Temperature", spo2: "SpO₂", rbs: "RBS",
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Daily Clinical Learning"
        title="Case of the Day"
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        icon={<Stethoscope className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />
      {/* Case navigation bar */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)", background: "#F5F3EE" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "#8E8E93" }}>
            Case {caseIndex + 1} of {clinicalCases.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCaseIndex((i) => (i - 1 + clinicalCases.length) % clinicalCases.length)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
              title="Previous case">
              <ChevronLeft className="w-3.5 h-3.5" style={{ color: "#636366" }} />
            </button>
            <button
              onClick={() => setCaseIndex((i) => (i + 1) % clinicalCases.length)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5"
              title="Next case">
              <ChevronRight className="w-3.5 h-3.5" style={{ color: "#636366" }} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Case Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>

          {/* Card Header */}
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: specColor + "18", color: specColor }}>
                <BookOpen className="w-3 h-3" />
                {caseData.specialty}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: "rgba(60,60,67,0.06)", color: "#636366" }}>
                <Clock className="w-3 h-3" />
                Clinical Case
              </span>
            </div>
            <h1 className="text-xl font-display font-bold mb-3" style={{ color: "#1C1C1E" }}>{caseData.title}</h1>

            {/* Patient Info Strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: caseData.patient_info.gender === "Male" ? "rgba(0,122,255,0.12)" : "rgba(255,45,85,0.1)" }}>
                  <User className="w-2.5 h-2.5" style={{ color: caseData.patient_info.gender === "Male" ? "#007AFF" : "#FF2D55" }} />
                </div>
                <span className="font-semibold" style={{ color: "#1C1C1E" }}>
                  {caseData.patient_info.age}-year-old {caseData.patient_info.gender}
                </span>
              </div>
              {caseData.patient_info.occupation && (
                <span style={{ color: "#636366" }}>· {caseData.patient_info.occupation}</span>
              )}
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="px-5 py-4" style={{ background: "rgba(0,122,255,0.03)", borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#007AFF" }}>Chief Complaint</p>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: "#1C1C1E" }}>"{caseData.patient_info.chief_complaint}"</p>
          </div>

          {/* History */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#8E8E93" }}>History of Present Illness</p>
            <p className="text-sm leading-relaxed" style={{ color: "#3A3A3C" }}>{caseData.history}</p>
          </div>

          {/* Vitals */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)", background: "#FAFAFA" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#8E8E93" }}>Vitals</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vitalEntries.map(([key, val]) => (
                <VitalBadge
                  key={key}
                  icon={vitalIcons[key] ?? Activity}
                  label={vitalLabels[key] ?? key}
                  value={val}
                />
              ))}
            </div>
          </div>

          {/* Investigations */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#8E8E93" }}>Investigations</p>
            <div className="space-y-2">
              {caseData.investigations.map((inv, i) => (
                <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-xl"
                  style={{ background: "rgba(60,60,67,0.04)", border: "1px solid rgba(60,60,67,0.06)" }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: specColor }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold" style={{ color: "#1C1C1E" }}>{inv.label}: </span>
                    <span className="text-xs" style={{ color: "#3A3A3C" }}>{inv.value}</span>
                    {inv.note && (
                      <span className="text-xs ml-1" style={{ color: "#8E8E93" }}>({inv.note})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MCQ Section */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#8E8E93" }}>Clinical Question</p>
            <h2 className="text-base font-bold" style={{ color: "#1C1C1E" }}>What is the most likely diagnosis?</h2>
          </div>

          <div className="px-5 py-4 space-y-2.5">
            {caseData.options.map((opt) => {
              const s = optionStyles(opt.id);
              const isCorrect = revealed && opt.id === caseData.correct_answer;
              const isWrong = revealed && selectedOption === opt.id && opt.id !== caseData.correct_answer;
              return (
                <button
                  key={opt.id}
                  disabled={revealed}
                  onClick={() => setSelectedOption(opt.id)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{ background: s.bg, border: s.border }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all"
                    style={{ background: s.iconBg, color: s.iconColor }}>
                    {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : opt.id}
                  </div>
                  <span className="text-sm font-medium leading-snug" style={{ color: s.color }}>{opt.text}</span>
                </button>
              );
            })}
          </div>

          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={() => { if (selectedOption) setRevealed(true); }}
              disabled={!selectedOption || revealed}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: selectedOption && !revealed ? "#007AFF" : "rgba(60,60,67,0.1)",
                color: selectedOption && !revealed ? "#FFFFFF" : "#C7C7CC",
                cursor: selectedOption && !revealed ? "pointer" : "not-allowed",
              }}>
              {revealed ? "Answer Revealed" : "Reveal Answer"}
            </button>
            {revealed && (
              <button
                onClick={() => { setSelectedOption(null); setRevealed(false); }}
                className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5"
                style={{ border: "1px solid rgba(60,60,67,0.12)" }}
                title="Reset">
                <RotateCcw className="w-4 h-4" style={{ color: "#636366" }} />
              </button>
            )}
          </div>
        </div>

        {/* Answer & Explanation */}
        {revealed && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid rgba(52,199,89,0.25)", boxShadow: "0 2px 16px rgba(52,199,89,0.08)" }}>
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(52,199,89,0.12)" }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#34C759" }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#34C759" }}>Correct Diagnosis</p>
                  <p className="text-sm font-bold leading-tight" style={{ color: "#1C1C1E" }}>
                    {caseData.correct_answer}. {caseData.options.find(o => o.id === caseData.correct_answer)?.text}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#8E8E93" }}>Explanation</p>
              <p className="text-sm leading-relaxed" style={{ color: "#3A3A3C" }}>{caseData.explanation}</p>
            </div>

            {/* Discuss with Cadus AI */}
            <div className="px-5 pb-5">
              <a
                href={`${BASE_URL}/ai-assistant?context=${buildCadusContext()}`}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: "linear-gradient(135deg, #007AFF 0%, #00C2A8 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 16px rgba(0,122,255,0.25)",
                }}>
                <Sparkles className="w-4 h-4" />
                Discuss with Cadus AI
                <ChevronRight className="w-4 h-4" />
              </a>
              <p className="text-center text-xs mt-2" style={{ color: "#8E8E93" }}>
                This case will be pre-loaded into your Cadus AI session for deeper clinical analysis
              </p>
            </div>
          </div>
        )}

        {/* Not revealed — still show Cadus button */}
        {!revealed && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.06) 0%, rgba(0,194,168,0.06) 100%)", border: "1px solid rgba(0,122,255,0.15)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>Not sure? Ask Cadus AI</p>
              <p className="text-xs" style={{ color: "#636366" }}>Get a step-by-step clinical reasoning walkthrough</p>
            </div>
            <a
              href={`${BASE_URL}/ai-assistant?context=${buildCadusContext()}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
              style={{ background: "#007AFF", color: "#FFFFFF" }}>
              Ask AI
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
