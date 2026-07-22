import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, FlaskConical, RefreshCw, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Sparkles, Loader2, Activity, ClipboardList, Lightbulb } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Panel = "cbc" | "lft" | "rft" | "lipid" | "thyroid";

interface LabTest {
  name: string;
  key: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  lowInterpretation: string;
  highInterpretation: string;
}

const PANELS: Record<Panel, { label: string; tests: LabTest[] }> = {
  cbc: {
    label: "Complete Blood Count (CBC)",
    tests: [
      { name: "Haemoglobin", key: "hb", unit: "g/dL", normalMin: 12, normalMax: 17, lowInterpretation: "Anaemia. Consider iron deficiency, B12/folate deficiency, haemolysis, or chronic disease.", highInterpretation: "Polycythaemia. Consider dehydration, polycythaemia vera, or secondary polycythaemia." },
      { name: "White Cell Count", key: "wbc", unit: "×10⁹/L", normalMin: 4, normalMax: 11, lowInterpretation: "Leucopenia. Consider viral infection, drugs (chemotherapy, carbimazole), bone marrow failure, SLE.", highInterpretation: "Leucocytosis. Consider bacterial infection, inflammation, leukaemia, or steroid use." },
      { name: "Platelets", key: "plt", unit: "×10⁹/L", normalMin: 150, normalMax: 400, lowInterpretation: "Thrombocytopenia. Risk of bleeding. Causes: ITP, DIC, heparin, bone marrow failure, hypersplenism.", highInterpretation: "Thrombocytosis. Risk of thrombosis. Causes: reactive (infection, inflammation) or essential thrombocythaemia." },
      { name: "MCV", key: "mcv", unit: "fL", normalMin: 80, normalMax: 100, lowInterpretation: "Microcytic anaemia: iron deficiency, thalassaemia, anaemia of chronic disease (sometimes normocytic).", highInterpretation: "Macrocytic anaemia: B12/folate deficiency, alcohol, hypothyroidism, drugs (methotrexate, hydroxyurea)." },
      { name: "Neutrophils", key: "neut", unit: "×10⁹/L", normalMin: 1.8, normalMax: 7.5, lowInterpretation: "Neutropenia. Risk of infection. Causes: drugs, viral illness, bone marrow failure, ethnic variant.", highInterpretation: "Neutrophilia. Bacterial infection, inflammation, corticosteroids, stress response, CML." },
    ]
  },
  lft: {
    label: "Liver Function Tests (LFT)",
    tests: [
      { name: "ALT", key: "alt", unit: "U/L", normalMin: 5, normalMax: 40, lowInterpretation: "Below normal — clinically not significant.", highInterpretation: "Hepatocellular damage. Mild elevation: steatosis, NAFLD. Marked: viral hepatitis, drug-induced, ischaemia." },
      { name: "AST", key: "ast", unit: "U/L", normalMin: 5, normalMax: 40, lowInterpretation: "Below normal — clinically not significant.", highInterpretation: "Hepatocellular injury. Also rises in myocardial infarction and rhabdomyolysis (non-specific)." },
      { name: "ALP", key: "alp", unit: "U/L", normalMin: 30, normalMax: 120, lowInterpretation: "Low ALP: hypothyroidism, zinc deficiency.", highInterpretation: "Cholestatic disease: PBC, PSC, biliary obstruction. Also raised in bone disease (Paget's), pregnancy." },
      { name: "GGT", key: "ggt", unit: "U/L", normalMin: 5, normalMax: 50, lowInterpretation: "Normal finding.", highInterpretation: "Alcohol use, biliary disease. Sensitive marker of alcohol intake. Also elevated by drugs/phenytoin." },
      { name: "Bilirubin (Total)", key: "bili", unit: "μmol/L", normalMin: 3, normalMax: 20, lowInterpretation: "Clinically not significant.", highInterpretation: "Jaundice (>34 μmol/L). Pre-hepatic: haemolysis. Hepatic: hepatitis, Gilbert's. Post-hepatic: obstruction." },
      { name: "Albumin", key: "alb", unit: "g/L", normalMin: 35, normalMax: 50, lowInterpretation: "Hypoalbuminaemia: chronic liver disease, malnutrition, nephrotic syndrome, acute phase response.", highInterpretation: "Hyperalbuminaemia: dehydration (relative)." },
    ]
  },
  rft: {
    label: "Renal Function Tests (RFT)",
    tests: [
      { name: "Creatinine", key: "cr", unit: "μmol/L", normalMin: 60, normalMax: 110, lowInterpretation: "Reduced muscle mass (elderly, malnutrition). Pregnancy.", highInterpretation: "AKI or CKD. Consider causes: prerenal (dehydration), renal (GN, ATN), postrenal (obstruction)." },
      { name: "Urea", key: "urea", unit: "mmol/L", normalMin: 2.5, normalMax: 7.5, lowInterpretation: "Liver failure, malnutrition, overhydration.", highInterpretation: "Uraemia. High urea:creatinine ratio suggests prerenal cause (dehydration, GI bleed) vs intrinsic renal." },
      { name: "Sodium", key: "na", unit: "mmol/L", normalMin: 135, normalMax: 145, lowInterpretation: "Hyponatraemia: SIADH, hypothyroidism, Addison's, heart failure, cirrhosis, diuretics.", highInterpretation: "Hypernatraemia: dehydration, diabetes insipidus, excessive sodium intake." },
      { name: "Potassium", key: "k", unit: "mmol/L", normalMin: 3.5, normalMax: 5.0, lowInterpretation: "Hypokalaemia: diuretics, diarrhoea, vomiting, Cushing's, hyperaldosteronism. Risk of arrhythmia.", highInterpretation: "Hyperkalaemia: AKI, CKD, ACEi/ARBs, Addison's. Risk of fatal arrhythmia >6.5 mmol/L." },
      { name: "eGFR", key: "egfr", unit: "mL/min/1.73m²", normalMin: 60, normalMax: 120, lowInterpretation: "CKD staging: <60 for >3 months = CKD. G3a(45–59), G3b(30–44), G4(15–29), G5(<15). Refer nephrology.", highInterpretation: "Normal or hyperfiltration (early diabetes, pregnancy)." },
    ]
  },
  lipid: {
    label: "Lipid Profile",
    tests: [
      { name: "Total Cholesterol", key: "tc", unit: "mmol/L", normalMin: 0, normalMax: 5.0, lowInterpretation: "Low TC: malnutrition, liver disease, hyperthyroidism.", highInterpretation: "Hypercholesterolaemia. Calculate ASCVD risk. Consider statins if 10-yr risk >7.5%." },
      { name: "LDL Cholesterol", key: "ldl", unit: "mmol/L", normalMin: 0, normalMax: 3.0, lowInterpretation: "Familial hypolipidaemia, liver disease.", highInterpretation: "Primary target for cardiovascular risk reduction. Target <1.8 mmol/L for high-risk patients." },
      { name: "HDL Cholesterol", key: "hdl", unit: "mmol/L", normalMin: 1.0, normalMax: 99, lowInterpretation: "Low HDL: increased CV risk. Associated with metabolic syndrome, smoking, physical inactivity.", highInterpretation: "Protective. Very high HDL may paradoxically not confer benefit in some studies." },
      { name: "Triglycerides", key: "tg", unit: "mmol/L", normalMin: 0, normalMax: 1.7, lowInterpretation: "Normal — no concern.", highInterpretation: ">1.7: borderline. >5.6: risk of pancreatitis. Causes: diabetes, alcohol, obesity, familial hypertriglyceridaemia." },
    ]
  },
  thyroid: {
    label: "Thyroid Function Tests",
    tests: [
      { name: "TSH", key: "tsh", unit: "mIU/L", normalMin: 0.4, normalMax: 4.0, lowInterpretation: "Suppressed TSH: hyperthyroidism (primary), subclinical hyperthyroidism, TSH-secreting tumour (rare).", highInterpretation: "Elevated TSH: hypothyroidism (primary). Subclinical if T4 normal, overt if T4 low." },
      { name: "Free T4 (fT4)", key: "ft4", unit: "pmol/L", normalMin: 12, normalMax: 22, lowInterpretation: "Low fT4 with high TSH: overt primary hypothyroidism — start levothyroxine. Low fT4 with low TSH: secondary hypothyroidism (pituitary).", highInterpretation: "Elevated fT4: hyperthyroidism. With low TSH: Graves' disease, toxic nodule, thyroiditis." },
      { name: "Free T3 (fT3)", key: "ft3", unit: "pmol/L", normalMin: 3.5, normalMax: 6.5, lowInterpretation: "Low T3 syndrome (sick euthyroid) — common in acute illness. Not usually treated.", highInterpretation: "T3 toxicosis — elevated T3 with normal T4. Graves' disease. More potent than T4." },
    ]
  }
};

const PANEL_LIST: { id: Panel; label: string }[] = [
  { id: "cbc", label: "CBC" }, { id: "lft", label: "LFT" }, { id: "rft", label: "RFT" },
  { id: "lipid", label: "Lipid" }, { id: "thyroid", label: "Thyroid" }
];

export default function LabValueInterpreter() {
  const [panel, setPanel] = useState<Panel>("cbc");
  const [values, setValues] = useState<Record<string, string>>({});
  const [interpreted, setInterpreted] = useState(false);

  const interpret = () => setInterpreted(true);
  const reset = () => { setValues({}); setInterpreted(false); };

  const currentPanel = PANELS[panel];

  const getStatus = (test: LabTest, val: number) => {
    if (val < test.normalMin) return "low";
    if (val > test.normalMax) return "high";
    return "normal";
  };

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      <div className="relative overflow-hidden" >
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,22,40,0.93) 0%, rgba(13,33,68,0.9) 50%, rgba(10,48,96,0.93) 100%)" }} />
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-10 relative z-10">
          <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Tools
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
              <FlaskConical className="w-5 h-5" style={{ color: "#7C3AED" }} />
            </div>
            <h1 className="text-3xl font-bold text-white">Lab Value Interpreter</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Enter CBC, LFT, RFT, lipid, or thyroid results and get clinical interpretation.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Panel Selector */}
        <div className="flex gap-2 flex-wrap">
          {PANEL_LIST.map(p => (
            <button key={p.id} onClick={() => { setPanel(p.id); reset(); }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={panel === p.id ? { background: "linear-gradient(135deg,#7C3AED,#007AFF)", color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.3)" } :
                { background: "#fff", color: "#636366", border: "1px solid rgba(60,60,67,0.15)" }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="rounded-2xl p-6 bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h2 className="font-semibold mb-5" style={{ color: "#1C1C1E" }}>{currentPanel.label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {currentPanel.tests.map(test => (
              <div key={test.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1C1C1E" }}>
                  {test.name}
                  <span className="ml-1 font-normal text-xs" style={{ color: "#AEAEB2" }}>
                    (Normal: {test.normalMin}–{test.normalMax} {test.unit})
                  </span>
                </label>
                <input type="number" placeholder={`${test.unit}`} value={values[test.key] || ""}
                  onChange={e => { setValues(prev => ({ ...prev, [test.key]: e.target.value })); setInterpreted(false); }}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid rgba(60,60,67,0.2)", color: "#1C1C1E" }} />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={interpret} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#7C3AED,#007AFF)" }}>
              Interpret Results
            </button>
            <button onClick={reset} className="px-4 py-3 rounded-xl transition-all hover:opacity-70"
              style={{ border: "1.5px solid rgba(60,60,67,0.2)", color: "#636366" }}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        {interpreted && (
          <div className="space-y-3">
            {currentPanel.tests.map(test => {
              const rawVal = values[test.key];
              if (!rawVal) return null;
              const val = parseFloat(rawVal);
              const status = getStatus(test, val);
              const isAbnormal = status !== "normal";
              return (
                <div key={test.key} className="rounded-2xl p-5 bg-white"
                  style={{ border: `1.5px solid ${isAbnormal ? (status === "low" ? "rgba(59,130,246,0.3)" : "rgba(239,68,68,0.3)") : "rgba(16,185,129,0.3)"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {!isAbnormal ? <CheckCircle className="w-4 h-4" style={{ color: "#10B981" }} /> :
                        status === "low" ? <TrendingDown className="w-4 h-4" style={{ color: "#3B82F6" }} /> :
                          <TrendingUp className="w-4 h-4" style={{ color: "#EF4444" }} />}
                      <span className="font-semibold text-sm" style={{ color: "#1C1C1E" }}>{test.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: isAbnormal ? (status === "low" ? "#3B82F6" : "#EF4444") : "#10B981" }}>
                        {val} <span className="text-xs font-normal">{test.unit}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: isAbnormal ? (status === "low" ? "#EFF6FF" : "#FEF2F2") : "#F0FDF4", color: isAbnormal ? (status === "low" ? "#3B82F6" : "#EF4444") : "#10B981" }}>
                        {status === "low" ? "LOW" : status === "high" ? "HIGH" : "NORMAL"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: "#636366" }}>
                    {status === "low" ? test.lowInterpretation : status === "high" ? test.highInterpretation : `Within reference range (${test.normalMin}–${test.normalMax} ${test.unit}).`}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#AEAEB2" }}>Reference: {test.normalMin}–{test.normalMax} {test.unit}</p>
                </div>
              );
            })}
            {currentPanel.tests.every(t => !values[t.key]) && (
              <div className="rounded-2xl p-8 bg-white text-center" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
                <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: "#AEAEB2" }} />
                <p style={{ color: "#636366" }}>No values entered. Please enter at least one result to interpret.</p>
              </div>
            )}
            <p className="text-xs text-center" style={{ color: "#AEAEB2" }}>
              Reference ranges may vary by laboratory. Always interpret in clinical context.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
