import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Stethoscope, X, ChevronRight, AlertTriangle, Info, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AiDifferential {
  condition: string;
  icd10?: string;
  probability: "high" | "moderate" | "low";
  triage: "emergency" | "urgent" | "semi-urgent" | "routine";
  rationale?: string;
  supporting_features?: string[];
  against_features?: string[];
}
interface AiReport {
  overall_triage?: "emergency" | "urgent" | "semi-urgent" | "routine";
  summary?: string;
  red_flags?: string[];
  differentials?: AiDifferential[];
  recommended_workup?: string[];
  immediate_actions?: string[];
  patient_advice?: string[];
}

const AI_TRIAGE_COLOR: Record<string, { color: string; bg: string }> = {
  emergency: { color: "#D70015", bg: "rgba(255,59,48,0.1)" },
  urgent: { color: "#C45000", bg: "rgba(255,149,0,0.1)" },
  "semi-urgent": { color: "#0060C9", bg: "rgba(0,122,255,0.1)" },
  routine: { color: "#248A3D", bg: "rgba(52,199,89,0.1)" },
};
const AI_PROB_COLOR: Record<string, string> = { high: "#EF4444", moderate: "#F59E0B", low: "#10B981" };

interface Diagnosis {
  name: string;
  probability: "High" | "Moderate" | "Low";
  symptoms: string[];
  triage: "Emergency" | "Urgent" | "Semi-urgent" | "Routine";
  description: string;
  redFlags?: string[];
}

const SYMPTOM_DATABASE: Record<string, string[]> = {
  "Chest pain": ["Chest tightness","Shortness of breath","Sweating","Nausea","Left arm pain","Jaw pain","Palpitations","Cough"],
  "Shortness of breath": ["Wheeze","Cough","Chest pain","Orthopnoea","Ankle swelling","Fever","Sputum"],
  "Headache": ["Nausea","Vomiting","Photophobia","Neck stiffness","Visual disturbance","Fever","Confusion"],
  "Fever": ["Chills","Rigors","Sweating","Malaise","Cough","Dysuria","Rash","Neck stiffness"],
  "Abdominal pain": ["Nausea","Vomiting","Diarrhoea","Constipation","Blood in stool","Jaundice","Fever"],
  "Cough": ["Sputum","Haemoptysis","Fever","Shortness of breath","Wheeze","Weight loss","Night sweats"],
  "Dizziness": ["Vertigo","Tinnitus","Hearing loss","Nausea","Palpitations","Syncope","Headache"],
  "Joint pain": ["Swelling","Redness","Stiffness","Fever","Rash","Morning stiffness"],
  "Palpitations": ["Chest pain","Dizziness","Syncope","Shortness of breath","Sweating"],
  "Nausea": ["Vomiting","Abdominal pain","Diarrhoea","Fever","Jaundice"],
  "Back pain": ["Leg weakness","Urinary incontinence","Saddle anaesthesia","Fever","Night pain","Weight loss"],
  "Rash": ["Fever","Itching","Joint pain","Photosensitivity","Blisters"],
  "Weight loss": ["Fatigue","Night sweats","Cough","Appetite loss","Abdominal pain"],
  "Fatigue": ["Weight loss","Night sweats","Pallor","Breathlessness","Fever"],
};

const DIAGNOSES: Diagnosis[] = [
  {
    name: "Acute Coronary Syndrome",
    probability: "High", triage: "Emergency",
    symptoms: ["Chest pain","Shortness of breath","Sweating","Nausea","Left arm pain"],
    description: "STEMI/NSTEMI — Immediate revascularisation required. Call emergency services.",
    redFlags: ["Crushing chest pain", "Diaphoresis", "Radiation to jaw/arm", "ECG changes"]
  },
  {
    name: "Pulmonary Embolism",
    probability: "High", triage: "Emergency",
    symptoms: ["Chest pain","Shortness of breath","Palpitations","Cough"],
    description: "Clot in pulmonary vasculature. Wells score + D-dimer. CTPA if indicated.",
    redFlags: ["Sudden onset dyspnoea", "Pleuritic chest pain", "Recent immobility/surgery"]
  },
  {
    name: "Bacterial Meningitis",
    probability: "High", triage: "Emergency",
    symptoms: ["Headache","Fever","Neck stiffness","Photophobia","Confusion"],
    description: "Life-threatening. Give IV benzylpenicillin immediately. Lumbar puncture after CT.",
    redFlags: ["Non-blanching rash", "Kernig's sign", "Rapid deterioration"]
  },
  {
    name: "Community-Acquired Pneumonia",
    probability: "High", triage: "Urgent",
    symptoms: ["Cough","Fever","Shortness of breath","Sputum","Chest pain"],
    description: "CURB-65 score guides admission. Amoxicillin + clarithromycin if moderate.",
  },
  {
    name: "Heart Failure",
    probability: "Moderate", triage: "Urgent",
    symptoms: ["Shortness of breath","Ankle swelling","Orthopnoea","Cough","Fatigue"],
    description: "BNP/NT-proBNP, Echo. Furosemide + ACEi/ARB + beta-blocker if HFrEF.",
  },
  {
    name: "Acute Appendicitis",
    probability: "Moderate", triage: "Urgent",
    symptoms: ["Abdominal pain","Nausea","Vomiting","Fever"],
    description: "Right iliac fossa pain, Alvarado score. Surgical review. CT/USS if equivocal.",
  },
  {
    name: "Tension-Type Headache",
    probability: "High", triage: "Routine",
    symptoms: ["Headache","Nausea"],
    description: "Bilateral band-like pressure. Analgesia, lifestyle modification, avoid overuse.",
  },
  {
    name: "Migraine",
    probability: "High", triage: "Routine",
    symptoms: ["Headache","Nausea","Vomiting","Photophobia","Visual disturbance"],
    description: "Unilateral throbbing ± aura. Triptans for acute attack. Prophylaxis if frequent.",
  },
  {
    name: "Urinary Tract Infection",
    probability: "High", triage: "Routine",
    symptoms: ["Fever","Dysuria"],
    description: "MSU C&S. Trimethoprim or nitrofurantoin for uncomplicated. Exclude pyelonephritis.",
  },
  {
    name: "Viral URTI",
    probability: "High", triage: "Routine",
    symptoms: ["Fever","Cough","Fatigue","Malaise"],
    description: "Supportive care. No antibiotics unless secondary bacterial infection suspected.",
  },
  {
    name: "Gastroenteritis",
    probability: "High", triage: "Routine",
    symptoms: ["Nausea","Vomiting","Diarrhoea","Abdominal pain","Fever"],
    description: "Rehydration is key. ORS/IV fluids if severe. Stool culture if blood in stool.",
  },
  {
    name: "Benign Positional Vertigo",
    probability: "High", triage: "Routine",
    symptoms: ["Dizziness","Vertigo","Nausea"],
    description: "Epley manoeuvre is curative. No medication needed in most cases.",
  },
  {
    name: "Anaemia",
    probability: "Moderate", triage: "Routine",
    symptoms: ["Fatigue","Shortness of breath","Palpitations","Pallor"],
    description: "FBC, iron studies, B12/folate, reticulocytes. Treat underlying cause.",
  },
  {
    name: "Rheumatoid Arthritis",
    probability: "Moderate", triage: "Semi-urgent",
    symptoms: ["Joint pain","Swelling","Morning stiffness","Fatigue","Fever"],
    description: "Refer to rheumatology. Early DMARD therapy (methotrexate) improves prognosis.",
  },
  {
    name: "Pulmonary Tuberculosis",
    probability: "Moderate", triage: "Urgent",
    symptoms: ["Cough","Weight loss","Night sweats","Haemoptysis","Fever","Fatigue"],
    description: "CXR + sputum AFB x3. Isolate if smear-positive. RHEZ for 2 months, then RH x4.",
    redFlags: ["Haemoptysis", "Prolonged cough >3 weeks", "Night sweats + weight loss"]
  },
  {
    name: "Cauda Equina Syndrome",
    probability: "Low", triage: "Emergency",
    symptoms: ["Back pain","Leg weakness","Urinary incontinence","Saddle anaesthesia"],
    description: "Surgical emergency. Immediate MRI spine. Neurosurgical decompression required.",
    redFlags: ["Saddle anaesthesia", "Bladder/bowel dysfunction", "Bilateral leg weakness"]
  },
];

const triageConfig = {
  Emergency: { color: "#EF4444", bg: "#FEF2F2" },
  Urgent: { color: "#F59E0B", bg: "#FFFBEB" },
  "Semi-urgent": { color: "#007AFF", bg: "rgba(0,122,255,0.07)" },
  Routine: { color: "#10B981", bg: "#F0FDF4" },
};

const probColor = { High: "#EF4444", Moderate: "#F59E0B", Low: "#10B981" };

export default function SymptomChecker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [checked, setChecked] = useState(false);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [duration, setDuration] = useState("");

  const allSymptoms = useMemo(() => {
    const set = new Set<string>();
    Object.keys(SYMPTOM_DATABASE).forEach(s => { set.add(s); SYMPTOM_DATABASE[s].forEach(x => set.add(x)); });
    return Array.from(set).sort();
  }, []);

  const toggleSymptom = (s: string) => {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setChecked(false);
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    if (!selected.includes(custom.trim())) setSelected(prev => [...prev, custom.trim()]);
    setCustom("");
    setChecked(false);
  };

  const results = useMemo(() => {
    if (!checked || selected.length === 0) return [];
    return DIAGNOSES
      .map(d => ({ ...d, matched: d.symptoms.filter(s => selected.some(sel => sel.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sel.toLowerCase()))).length }))
      .filter(d => d.matched > 0)
      .sort((a, b) => {
        const triageOrder = { Emergency: 0, Urgent: 1, "Semi-urgent": 2, Routine: 3 };
        return triageOrder[a.triage] - triageOrder[b.triage] || b.matched - a.matched;
      })
      .slice(0, 6);
  }, [checked, selected]);

  const handleAiPredict = async () => {
    if (selected.length === 0) return;
    setAiLoading(true); setAiError(null); setAiReport(null);
    try {
      const ctx: Record<string, string> = {};
      if (age.trim()) ctx.age = age.trim();
      if (sex.trim()) ctx.sex = sex.trim();
      if (duration.trim()) ctx.duration = duration.trim();
      const { data, error } = await supabase.functions.invoke("predict-symptoms", {
        body: { symptoms: selected, context: Object.keys(ctx).length ? ctx : undefined },
      });
      if (error) throw new Error(error.message || "AI request failed");
      if (!data?.ok) throw new Error(data?.error || "AI request failed");
      setAiReport(data.report as AiReport);
      setChecked(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      <div className="relative overflow-hidden" >
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,22,40,0.93) 0%, rgba(13,33,68,0.9) 50%, rgba(10,48,96,0.93) 100%)" }} />
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-10 relative z-10">
          <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Tools
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.2)" }}>
              <Stethoscope className="w-5 h-5" style={{ color: "#00C2A8" }} />
            </div>
            <h1 className="text-3xl font-bold text-white">Symptom Checker</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Enter symptoms and get probable diagnoses with triage severity scoring.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl p-6 bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "#1C1C1E" }}>Select Presenting Symptoms</h2>

          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Add custom symptom..." value={custom} onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustom()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid rgba(60,60,67,0.2)", color: "#1C1C1E" }} />
            <button onClick={addCustom} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "#007AFF" }}>Add</button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {allSymptoms.map(s => (
              <button key={s} onClick={() => toggleSymptom(s)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={selected.includes(s) ? {
                  background: "rgba(0,194,168,0.15)", color: "#00C2A8", border: "1.5px solid rgba(0,194,168,0.4)"
                } : {
                  background: "#F2F2F7", color: "#636366", border: "1px solid transparent"
                }}>
                {selected.includes(s) && <span className="mr-1">✓</span>}{s}
              </button>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-xl mb-4" style={{ background: "rgba(0,194,168,0.06)", border: "1px solid rgba(0,194,168,0.2)" }}>
              <span className="text-xs font-medium w-full mb-1" style={{ color: "#00C2A8" }}>Selected symptoms:</span>
              {selected.map(s => (
                <div key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-sm"
                  style={{ border: "1px solid rgba(0,194,168,0.3)", color: "#1C1C1E" }}>
                  {s}
                  <button onClick={() => toggleSymptom(s)} className="ml-1 opacity-50 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setChecked(true)} disabled={selected.length === 0}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
              Check Symptoms ({selected.length})
            </button>
            <button onClick={() => { setSelected([]); setChecked(false); }}
              className="px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ border: "1.5px solid rgba(60,60,67,0.2)", color: "#636366" }}>
              Clear
            </button>
          </div>
        </div>

        {checked && (
          <>
            <div className="rounded-2xl p-4 bg-white" style={{ border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
                <p className="text-xs" style={{ color: "#92400E" }}>
                  <strong>Clinical Decision Support Tool</strong> — Results are for educational reference only and do not constitute a diagnosis. Emergency symptoms should be evaluated immediately by a clinician.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="rounded-2xl p-8 bg-white text-center" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
                  <Info className="w-10 h-10 mx-auto mb-3" style={{ color: "#AEAEB2" }} />
                  <p className="font-medium" style={{ color: "#1C1C1E" }}>No matching conditions found</p>
                  <p className="text-sm mt-1" style={{ color: "#636366" }}>Try adding more specific symptoms.</p>
                </div>
              ) : results.map((d, i) => {
                const tc = triageConfig[d.triage];
                return (
                  <div key={i} className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold" style={{ color: "#1C1C1E" }}>{d.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium" style={{ color: probColor[d.probability] }}>{d.probability} probability</span>
                          <span style={{ color: "#AEAEB2" }}>·</span>
                          <span className="text-xs">{d.matched}/{d.symptoms.length} symptoms matched</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                        style={{ background: tc.bg, color: tc.color }}>
                        {d.triage}
                      </div>
                    </div>
                    <p className="text-sm mb-3" style={{ color: "#636366" }}>{d.description}</p>
                    {d.redFlags && (
                      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2" }}>
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#EF4444" }} />
                        <div>
                          <span className="text-xs font-semibold" style={{ color: "#EF4444" }}>Red flags: </span>
                          <span className="text-xs" style={{ color: "#991B1B" }}>{d.redFlags.join(" · ")}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-1.5 flex-wrap mt-3">
                      {d.symptoms.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={selected.some(sel => sel.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sel.toLowerCase())) ?
                            { background: "rgba(0,194,168,0.12)", color: "#00C2A8" } :
                            { background: "#F2F2F7", color: "#AEAEB2" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
