import { useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Scan, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Sparkles, Loader2, Upload, X, Activity, ClipboardList, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Modality = "xray" | "ct" | "mri";
type Region = string;

interface Finding {
  name: string;
  description: string;
  urgency: "Normal" | "Incidental" | "Significant" | "Emergency";
  nextStep: string;
}

const REGIONS: Record<Modality, string[]> = {
  xray: ["Chest (PA)", "Abdomen", "Cervical Spine", "Lumbar Spine", "Pelvis", "Hand/Wrist", "Knee"],
  ct: ["Head", "Chest", "Abdomen & Pelvis", "Spine", "Neck", "Pulmonary Angiogram (CTPA)", "Coronary"],
  mri: ["Brain", "Spine (Cervical/Lumbar)", "Knee", "Shoulder", "Abdomen/Liver", "Pelvis"],
};

const FINDINGS: Record<string, Finding[]> = {
  "Chest (PA)": [
    { name: "Normal chest X-ray", description: "Clear lung fields bilaterally, normal cardiothoracic ratio (<0.5), no pleural effusion, no consolidation, mediastinum central.", urgency: "Normal", nextStep: "No further imaging required. Correlate with clinical presentation." },
    { name: "Consolidation", description: "Increased opacity within the lung parenchyma. Lobar or segmental distribution. May show air bronchogram. Consistent with pneumonia or collapse.", urgency: "Significant", nextStep: "Assess for pneumonia (CURB-65), compare with prior CXR. CT chest if no improvement at 4-6 weeks." },
    { name: "Pleural effusion", description: "Blunting of costophrenic angle (>150-200mL). Meniscus sign. May cause tracheal deviation if massive.", urgency: "Significant", nextstep: "USS-guided diagnostic tap if unilateral/undiagnosed. Bloods: LDH, protein (Light's criteria). Consider CT chest." },
    { name: "Pneumothorax", description: "Visible pleural edge with absence of lung markings beyond. May be tension if mediastinal shift away from affected side.", urgency: "Emergency", nextStep: "Tension PTX: immediate needle decompression, then chest drain. Simple PTX: aspirate or chest drain depending on size and symptoms." },
    { name: "Cardiomegaly", description: "Cardiothoracic ratio >0.5 on PA film. Associated with CCF, pericardial effusion, cardiomyopathy.", urgency: "Significant", nextStep: "Echocardiogram, BNP, ECG. Review medications. Cardiology referral." },
    { name: "Hilar lymphadenopathy", description: "Enlarged hila bilaterally. Consider sarcoidosis (bilateral), lymphoma, TB, malignancy.", urgency: "Significant", nextStep: "CT chest with contrast. Bloods: serum ACE, LDH, calcium. Respiratory/haematology referral." },
    { name: "Pulmonary oedema", description: "Upper lobe diversion, Kerley B lines, perihilar haze ('bat wing'), pleural effusions. Suggests elevated PCWP.", urgency: "Emergency", nextStep: "IV furosemide, O2, sit upright. Check BNP, troponin, ECG. Echo to assess LV function. Escalate if severe." },
  ],
  "Head": [
    { name: "Normal CT head", description: "No intracranial haemorrhage, no mass, no midline shift. Grey-white matter differentiation preserved. Ventricles normal.", urgency: "Normal", nextStep: "No acute intracranial pathology. Correlate with clinical history." },
    { name: "Intracerebral haemorrhage", description: "Hyperdense (white) area within brain parenchyma. May cause mass effect or midline shift.", urgency: "Emergency", nextStep: "Urgent neurosurgical referral. Reverse anticoagulation if applicable. BP control (target SBP <140mmHg). Repeat CT at 6h if deteriorating." },
    { name: "Subarachnoid haemorrhage", description: "Hyperdense blood in subarachnoid spaces — typically in basal cisterns, Sylvian fissures. Star/y pattern.", urgency: "Emergency", nextStep: "Nimodipine 60mg q4h. Neurosurgical referral for aneurysm coiling/clipping. LP at 12h if CT negative but SAH suspected." },
    { name: "Ischaemic stroke", description: "Hypodense area (grey/dark) in arterial territory. May not be visible in first 6 hours. Loss of grey-white differentiation.", urgency: "Emergency", nextStep: "Stroke team activation. CT angiography. If within 4.5h of onset and eligible: thrombolysis (alteplase). Consider thrombectomy if large vessel occlusion within 24h." },
    { name: "Subdural haematoma", description: "Crescent-shaped collection following brain contour. Acute (hyperdense), subacute (isodense), chronic (hypodense).", urgency: "Emergency", nextStep: "Neurosurgical referral. Acute: emergency craniotomy/burr holes if significant mass effect. Chronic: burr hole drainage." },
    { name: "Cerebral oedema", description: "Sulcal effacement, loss of grey-white differentiation, compressed ventricles, midline shift.", urgency: "Emergency", nextStep: "Head of bed 30°. IV mannitol or hypertonic saline. Neurosurgical/ICU referral. Intracranial pressure monitoring." },
  ],
  "Abdomen": [
    { name: "Normal abdominal X-ray", description: "Normal bowel gas pattern. No dilated loops, no free air, no calcification in biliary system.", urgency: "Normal", nextStep: "No acute abnormality. Correlate clinically." },
    { name: "Bowel obstruction", description: "Dilated loops of small bowel (>3cm) or large bowel (>6cm/caecum >9cm) with air-fluid levels.", urgency: "Emergency", nextStep: "Nil by mouth, NGT, IV fluids, analgesia. CT abdomen for level/cause. Surgical referral. Contrast enema if sigmoid volvulus suspected." },
    { name: "Free air (perforation)", description: "Air under diaphragm (erect film) or Rigler's sign (both sides of bowel wall visible). Indicates hollow viscus perforation.", urgency: "Emergency", nextStep: "Urgent surgical referral. IV antibiotics (co-amoxiclav + metronidazole). NBM. CT abdomen for site of perforation." },
  ],
  "Pulmonary Angiogram (CTPA)": [
    { name: "Pulmonary embolism", description: "Filling defect within pulmonary arteries (saddle, lobar, segmental, subsegmental). May show right heart strain, Hampton's hump, Westermark sign.", urgency: "Emergency", nextStep: "Risk-stratify (massive/submassive/low-risk). Anticoagulation: LMWH bridging to DOAC/warfarin. Consider thrombolysis if haemodynamically unstable." },
    { name: "No PE detected", description: "Pulmonary vasculature opacified to subsegmental level without filling defects. Normal enhancement.", urgency: "Normal", nextStep: "PE excluded if adequate quality scan. Consider alternative diagnoses for presentation." },
  ],
  "Brain": [
    { name: "Normal MRI brain", description: "No abnormal signal on T1, T2 or FLAIR sequences. No diffusion restriction. Normal enhancement pattern.", urgency: "Normal", nextStep: "No structural abnormality. Correlate with clinical presentation." },
    { name: "Demyelinating plaques (MS)", description: "Periventricular T2/FLAIR hyperintense lesions perpendicular to ventricles (Dawson fingers). May enhance with gadolinium in active lesions.", urgency: "Significant", nextStep: "Neurology referral. McDonald criteria for diagnosis. Consider lumbar puncture for oligoclonal bands. DMT discussion." },
    { name: "Acute ischaemic stroke", description: "Diffusion restriction (bright DWI, dark ADC). High sensitivity within minutes of onset unlike CT.", urgency: "Emergency", nextStep: "Stroke pathway activation. MR angiography for vessel occlusion. Thrombectomy consideration." },
  ],
};

const urgencyConfig = {
  Normal: { color: "#10B981", bg: "#F0FDF4" },
  Incidental: { color: "#007AFF", bg: "rgba(0,122,255,0.07)" },
  Significant: { color: "#F59E0B", bg: "#FFFBEB" },
  Emergency: { color: "#EF4444", bg: "#FEF2F2" },
};

export default function RadiologyAssistant() {
  const [modality, setModality] = useState<Modality>("xray");
  const [region, setRegion] = useState<Region>("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/png");
  const [clinicalContext, setClinicalContext] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const findings = region ? (FINDINGS[region] || []) : [];

  const toggle = (i: number) => setExpanded(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const onPickFile = () => fileRef.current?.click();
  const onFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setAiError("Please upload an image file (JPG/PNG)."); return; }
    if (f.size > 8 * 1024 * 1024) { setAiError("Image is larger than 8 MB. Please compress it."); return; }
    setAiError(null);
    const reader = new FileReader();
    reader.onload = () => { setImageDataUrl(String(reader.result)); setImageMime(f.type); };
    reader.readAsDataURL(f);
  };
  const clearImage = () => { setImageDataUrl(null); setAiReport(null); setAiError(null); if (fileRef.current) fileRef.current.value = ""; };

  const runAiAnalysis = async () => {
    if (!imageDataUrl) { setAiError("Upload an image first."); return; }
    setAiLoading(true); setAiError(null); setAiReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-radiology", {
        body: {
          imageBase64: imageDataUrl,
          mimeType: imageMime,
          modality: modality === "xray" ? "X-ray" : modality.toUpperCase(),
          region: region || "unspecified",
          clinicalContext: clinicalContext.trim() || undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAiReport((data as any).report);
    } catch (e: any) {
      setAiError(e?.message || "AI analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };


  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      <div className="relative overflow-hidden" >
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,22,40,0.93) 0%, rgba(13,33,68,0.9) 50%, rgba(10,48,96,0.93) 100%)" }} />
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-10 relative z-10">
          <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Tools
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
              <Scan className="w-5 h-5" style={{ color: "#7C3AED" }} />
            </div>
            <h1 className="text-3xl font-bold text-[#1c1c1e]">Radiology Assistant</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Radiological findings, descriptions, and clinical management guidance.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Modality */}
        <div className="rounded-2xl p-6 bg-white" style={{ border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "#1C1C1E" }}>Imaging Modality</h2>
          <div className="flex gap-3 mb-6">
            {(["xray", "ct", "mri"] as Modality[]).map(m => (
              <button key={m} onClick={() => { setModality(m); setRegion(""); setExpanded(new Set()); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all uppercase tracking-wide"
                style={modality === m ? { background: "linear-gradient(135deg,#7C3AED,#007AFF)", color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.3)" } :
                  { background: "#F2F2F7", color: "#636366", border: "1px solid transparent" }}>
                {m === "xray" ? "X-Ray" : m.toUpperCase()}
              </button>
            ))}
          </div>

          <h2 className="font-semibold mb-3" style={{ color: "#1C1C1E" }}>Region / Study</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REGIONS[modality].map(r => (
              <button key={r} onClick={() => { setRegion(r); setExpanded(new Set()); }}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                style={region === r ? { background: "linear-gradient(135deg,#7C3AED,#007AFF)", color: "#fff" } :
                  { background: "#F2F2F7", color: "#1C1C1E", border: "1px solid rgba(60,60,67,0.1)" }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Findings */}
        {region && (
          <div className="space-y-3">
            <h2 className="font-semibold" style={{ color: "#1C1C1E" }}>Common Findings — {region}</h2>
            {findings.length === 0 ? (
              <div className="rounded-2xl p-8 bg-white text-center" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
                <Scan className="w-10 h-10 mx-auto mb-3" style={{ color: "#AEAEB2" }} />
                <p style={{ color: "#636366" }}>Detailed findings for this region are being added. Select another region or modality.</p>
              </div>
            ) : findings.map((f, i) => {
              const cfg = urgencyConfig[f.urgency];
              const isOpen = expanded.has(i);
              return (
                <div key={i} className="rounded-2xl bg-white overflow-hidden" style={{ border: `1.5px solid ${cfg.color}33`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <button onClick={() => toggle(i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                    <div className="flex items-center gap-3">
                      {f.urgency === "Normal" ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: cfg.color }} /> : <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />}
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "#1C1C1E" }}>{f.name}</div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{f.urgency}</span>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "#636366" }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "#636366" }} />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 space-y-3">
                      <div>
                        <div className="text-xs font-semibold mb-1" style={{ color: "#AEAEB2" }}>Radiological Description</div>
                        <p className="text-sm" style={{ color: "#1C1C1E" }}>{f.description}</p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: cfg.bg }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: cfg.color }}>Recommended Next Steps</div>
                        <p className="text-sm" style={{ color: "#1C1C1E" }}>{f.nextStep}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-center" style={{ color: "#AEAEB2" }}>
              Descriptions are educational. All imaging must be formally reported by a qualified radiologist.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
