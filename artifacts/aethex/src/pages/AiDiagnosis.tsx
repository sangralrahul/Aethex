import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, AlertTriangle, Send, Loader2, RotateCcw,
  CheckCircle, XCircle, Trophy, Target, Brain, ChevronDown, ChevronUp, Plus, X
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Chest pain", "Shortness of breath", "Headache",
  "Nausea", "Vomiting", "Abdominal pain", "Diarrhoea", "Joint pain",
  "Fatigue", "Dizziness", "Palpitations", "Weight loss", "Night sweats",
  "Rash", "Sore throat", "Dysuria", "Back pain", "Syncope",
];

interface Diagnosis {
  rank: number;
  name: string;
  probability: string;
  explanation: string;
  keyFeatures: string[];
  nextSteps: string;
}

export default function AiDiagnosis() {
  const [mode, setMode] = useState<"diagnosis" | "practice">("diagnosis");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceRevealed, setPracticeRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showSymptoms, setShowSymptoms] = useState(true);

  function toggleSymptom(s: string) {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit() {
    if (selectedSymptoms.length === 0 && !freeText.trim()) return;
    setLoading(true);
    setDiagnoses([]);
    setPracticeRevealed(false);
    setExpanded(null);
    const symptomList = [
      ...selectedSymptoms,
      ...(freeText.trim() ? [freeText.trim()] : [])
    ].join(", ");

    const prompt = `A patient presents with the following symptoms: ${symptomList}. 
    
    Provide exactly 5 differential diagnoses ranked by probability. For each diagnosis, respond ONLY as valid JSON in this exact format (no markdown, no prose):
    {
      "diagnoses": [
        {
          "rank": 1,
          "name": "Disease Name",
          "probability": "High/Medium/Low",
          "explanation": "2-3 sentence clinical explanation",
          "keyFeatures": ["feature 1", "feature 2", "feature 3"],
          "nextSteps": "Investigations and initial management"
        }
      ]
    }`;

    try {
      const res = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          conversationHistory: [],
          agent: "cadus",
          language: "en",
          mode: "normal",
        }),
      });
      const data = await res.json();
      const text: string = data.message || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setDiagnoses(parsed.diagnoses || []);
        if (mode === "practice") setScore(s => ({ ...s, total: s.total + 1 }));
      }
    } catch {
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePracticeReveal() {
    setPracticeRevealed(true);
    const top = diagnoses[0]?.name?.toLowerCase() || "";
    const ans = practiceAnswer.toLowerCase();
    if (ans.length > 3 && top.includes(ans.split(" ")[0])) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
    }
  }

  function reset() {
    setSelectedSymptoms([]);
    setFreeText("");
    setDiagnoses([]);
    setPracticeAnswer("");
    setPracticeRevealed(false);
  }

  const probColor = (p: string) =>
    p === "High" ? "#22c55e" : p === "Medium" ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A", color: "#fff" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#0B0F1A 0%,#0d1730 60%,#0B0F1A 100%)", borderBottom: "1px solid rgba(0,194,168,0.15)", padding: "48px 0 32px" }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ background: "rgba(0,194,168,0.15)", borderRadius: 12, padding: 10 }}>
              <Stethoscope size={28} style={{ color: "#00C2A8" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Diagnosis Assistant</h1>
              <p style={{ color: "rgba(255,255,255,0.55)" }}>Powered by Cadus · Educational use only</p>
            </div>
            {mode === "practice" && (
              <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(0,194,168,0.12)", border: "1px solid rgba(0,194,168,0.25)" }}>
                <Trophy size={16} style={{ color: "#00C2A8" }} />
                <span style={{ color: "#00C2A8", fontWeight: 600 }}>{score.correct}/{score.total}</span>
              </div>
            )}
          </div>

          {/* Red Disclaimer */}
          <div className="flex items-start gap-3 rounded-xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: "#fca5a5", fontSize: 14 }}>
              <strong>Educational use only — not for clinical decision making.</strong> This tool is designed to help medical students and doctors learn differential diagnosis. Do not use AI outputs to diagnose or treat real patients.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 rounded-xl mb-0 w-fit" style={{ background: "rgba(255,255,255,0.06)" }}>
            {(["diagnosis", "practice"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); reset(); }}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={mode === m ? { background: "#00C2A8", color: "#0B0F1A" } : { color: "rgba(255,255,255,0.6)" }}>
                {m === "practice" ? "🎯 Practice Mode" : "🔍 Diagnosis Mode"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Symptom Selector */}
        <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
          <button className="flex items-center gap-2 w-full mb-4" onClick={() => setShowSymptoms(v => !v)}>
            <span className="font-semibold">Select Symptoms</span>
            {showSymptoms ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {selectedSymptoms.length > 0 && (
              <span className="ml-auto text-sm px-2 py-0.5 rounded-full" style={{ background: "rgba(0,194,168,0.2)", color: "#00C2A8" }}>
                {selectedSymptoms.length} selected
              </span>
            )}
          </button>
          <AnimatePresence>
            {showSymptoms && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {COMMON_SYMPTOMS.map(s => (
                    <button key={s} onClick={() => toggleSymptom(s)}
                      className="px-3 py-1.5 rounded-full text-sm transition-all"
                      style={selectedSymptoms.includes(s)
                        ? { background: "#00C2A8", color: "#0B0F1A", fontWeight: 600 }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {selectedSymptoms.includes(s) ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Free text */}
          <div className="relative">
            <textarea
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder="Describe additional symptoms, duration, severity, context... (e.g. 3-day history of high fever with rigors, productive cough, right lower lobe crackles)"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}
            />
          </div>

          {/* Selected chips */}
          {selectedSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedSymptoms.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ background: "rgba(0,194,168,0.15)", color: "#00C2A8", border: "1px solid rgba(0,194,168,0.3)" }}>
                  {s}
                  <button onClick={() => toggleSymptom(s)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={handleSubmit} disabled={loading || (selectedSymptoms.length === 0 && !freeText.trim())}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
              style={{ background: loading || (selectedSymptoms.length === 0 && !freeText.trim()) ? "rgba(0,194,168,0.3)" : "#00C2A8", color: "#0B0F1A" }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
              {loading ? "Analysing..." : "Get Differentials"}
            </button>
            {(diagnoses.length > 0 || selectedSymptoms.length > 0) && (
              <button onClick={reset} className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
                <RotateCcw size={16} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Practice Mode — student input BEFORE reveal */}
        {mode === "practice" && diagnoses.length > 0 && !practiceRevealed && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(255,193,7,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} style={{ color: "#f59e0b" }} />
              <span className="font-semibold">What is your top diagnosis?</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Answer before seeing AI results</span>
            </div>
            <input
              value={practiceAnswer}
              onChange={e => setPracticeAnswer(e.target.value)}
              placeholder="Type your diagnosis here..."
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}
            />
            <button onClick={handlePracticeReveal} disabled={!practiceAnswer.trim()}
              className="mt-3 px-6 py-2 rounded-xl font-semibold transition-all"
              style={{ background: practiceAnswer.trim() ? "#f59e0b" : "rgba(245,158,11,0.3)", color: "#0B0F1A" }}>
              Reveal AI Answer
            </button>
          </motion.div>
        )}

        {/* Practice Score Banner */}
        {mode === "practice" && practiceRevealed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle size={20} style={{ color: "#22c55e" }} />
            <span style={{ color: "#86efac" }}>Your answer: <strong>"{practiceAnswer}"</strong> · Top AI diagnosis: <strong>{diagnoses[0]?.name}</strong></span>
          </motion.div>
        )}

        {/* Results */}
        {diagnoses.length > 0 && (mode === "diagnosis" || practiceRevealed) && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Top 5 Differential Diagnoses</h2>
            {diagnoses.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: "#161B2E", border: `1px solid ${expanded === i ? "rgba(0,194,168,0.4)" : "rgba(255,255,255,0.08)"}` }}
                onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ background: i === 0 ? "rgba(0,194,168,0.2)" : "rgba(255,255,255,0.06)", color: i === 0 ? "#00C2A8" : "rgba(255,255,255,0.6)" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{d.name}</div>
                    <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{d.explanation?.slice(0, 80)}...</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${probColor(d.probability)}20`, color: probColor(d.probability), border: `1px solid ${probColor(d.probability)}40` }}>
                      {d.probability}
                    </span>
                    {expanded === i ? <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                      <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <div className="pt-4">
                          <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>{d.explanation}</p>
                        </div>
                        {d.keyFeatures?.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#00C2A8" }}>Key Features</div>
                            <div className="flex flex-wrap gap-2">
                              {d.keyFeatures.map((f, j) => (
                                <span key={j} className="px-3 py-1 rounded-full text-sm"
                                  style={{ background: "rgba(0,194,168,0.08)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(0,194,168,0.2)" }}>
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#007AFF" }}>Next Steps</div>
                          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{d.nextSteps}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(0,194,168,0.15)" }}>
              <Loader2 size={32} style={{ color: "#00C2A8" }} className="animate-spin" />
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Analysing symptoms with Cadus...</p>
          </div>
        )}
      </div>
    </div>
  );
}
