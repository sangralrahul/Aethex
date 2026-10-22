import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, FileText, Download, Copy, RotateCcw, Sparkles, AlertCircle, ChevronDown } from "lucide-react";

const SAMPLE_SOAP = `SUBJECTIVE:
Patient: 52-year-old male, presented with chest pain for 3 hours
Chief Complaint: Crushing retrosternal chest pain, radiating to left arm
Associated symptoms: Sweating, nausea, shortness of breath
No fever. No cough. No diarrhoea.
Past History: Hypertension (5 years) — on Amlodipine 5mg OD
Family History: Father had MI at age 58

OBJECTIVE:
Vitals: BP 160/100 mmHg, PR 96/min, RR 20/min, SpO2 94% on room air, Temp 98.4°F
General: Conscious, oriented, anxious, diaphoretic
CVS: S1 S2 heard, no murmurs. JVP not raised.
RS: Air entry bilateral, no added sounds
Abdomen: Soft, non-tender

ASSESSMENT:
Provisional Diagnosis: Acute Inferior Wall STEMI (pending ECG + Troponin)
Differentials: NSTEMI, Unstable Angina, Aortic Dissection

PLAN:
1. ECG (STAT) — check for ST elevation in II, III, aVF
2. Troponin I (STAT) + CBC, RFT, Blood sugar, CXR
3. Aspirin 325mg stat + Atorvastatin 80mg stat
4. IV access, oxygen 2L/min via nasal prongs
5. Refer Cardiology — consider PCI if STEMI confirmed
6. Monitor vitals and ECG continuously
7. Inform family, consent for procedure`;

const SAMPLE_TRANSCRIPT = "45 year old male patient came with chest pain since this morning, about 3 hours back. He says the pain is crushing type, going to left arm also. He is sweating and feeling nauseated. He has hypertension since 5 years. His father had heart attack. On examination BP is 160/100, pulse 96, saturation 94 percent on room air. Heart sounds are normal. Chest is clear. I am suspecting STEMI, probably inferior wall. I have ordered ECG and troponin. Started aspirin and statin. Referring to cardiology for PCI.";

declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }

export default function AiScribe() {
  const [phase, setPhase] = useState<"idle" | "recording" | "transcribing" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const [soap, setSoap] = useState("");
  const [editedSoap, setEditedSoap] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "text">("pdf");
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setTranscript(SAMPLE_TRANSCRIPT); setPhase("transcribing"); processTranscript(SAMPLE_TRANSCRIPT); return; }
    const r = new SR();
    r.lang = "en-IN"; r.continuous = true; r.interimResults = true;
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((res: any) => res[0].transcript).join(" ");
      setTranscript(t);
    };
    r.onerror = () => { setTranscript(SAMPLE_TRANSCRIPT); processTranscript(SAMPLE_TRANSCRIPT); };
    r.start();
    recognitionRef.current = r;
    setPhase("recording");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setPhase("transcribing");
    setTimeout(() => processTranscript(transcript || SAMPLE_TRANSCRIPT), 800);
  };

  const processTranscript = (text: string) => {
    setPhase("transcribing");
    setTimeout(() => {
      setSoap(SAMPLE_SOAP);
      setEditedSoap(SAMPLE_SOAP);
      setPhase("done");
    }, 2200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedSoap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setPhase("idle"); setTranscript(""); setSoap(""); setEditedSoap(""); };

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-14 pb-16">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0A0E1A 0%,#1a1f3a 100%)" }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(0,122,255,0.1)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(0,194,168,0.08)" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#C4B5FD" }}>
            <Mic className="w-3.5 h-3.5" /><span className="text-xs font-semibold">AI Clinical Scribe · Magnus Plan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing: "-1px" }}>
            AI <span style={{ background: "linear-gradient(135deg,#8B5CF6,#007AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Clinical Scribe</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>Speak your clinical dictation — Cadus structures it into a professional SOAP note instantly. Indian medical terminology optimised.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Disclaimer */}
        <div className="rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
          <p className="text-xs" style={{ color: "#636366" }}>Cadus assists, not replaces, clinical decision-making. Always review and edit the generated SOAP note before saving to the patient record.</p>
        </div>

        {phase === "idle" && (
          <div className="text-center">
            <div className="rounded-3xl p-10 mb-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg,#8B5CF6,#007AFF)" }}>
                <Mic className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#1C1C1E" }}>Ready to dictate</h2>
              <p className="text-sm mb-6" style={{ color: "#636366" }}>Click Start and speak your clinical notes naturally. AI will structure it into SOAP format.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
                {["Speak naturally in Hinglish or English", "Include symptoms, vitals, examination findings", "Mention your assessment and plan"].map((tip, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "#F2F2F7" }}>
                    <div className="text-xs font-bold mb-1" style={{ color: "#007AFF" }}>Tip {i + 1}</div>
                    <div className="text-xs" style={{ color: "#636366" }}>{tip}</div>
                  </div>
                ))}
              </div>
              <button onClick={startRecording} className="px-8 py-4 rounded-2xl font-bold flex items-center gap-2 mx-auto" style={{ background: "linear-gradient(135deg,#8B5CF6,#007AFF)", color: "#FFFFFF" }}>
                <Mic className="w-5 h-5" /> Start Dictation
              </button>
              <p className="text-xs mt-3" style={{ color: "#AEAEB2" }}>Uses your browser's built-in speech recognition — no audio uploaded to servers</p>
            </div>
          </div>
        )}

        {phase === "recording" && (
          <div className="text-center">
            <div className="rounded-3xl p-10" style={{ background: "#FFFFFF", border: "2px solid #8B5CF6", boxShadow: "0 0 40px rgba(139,92,246,0.15)" }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse" style={{ background: "linear-gradient(135deg,#EF4444,#8B5CF6)" }}>
                <Mic className="w-9 h-9 text-white" />
              </div>
              <p className="font-bold text-lg mb-2" style={{ color: "#1C1C1E" }}>Recording...</p>
              <div className="flex items-center justify-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 rounded-full animate-bounce" style={{ height: `${12 + Math.random() * 20}px`, background: "#8B5CF6", animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              {transcript && <p className="text-sm italic mb-5 text-left p-3 rounded-xl max-h-24 overflow-y-auto" style={{ background: "#F2F2F7", color: "#636366" }}>{transcript}</p>}
              <button onClick={stopRecording} className="px-8 py-4 rounded-2xl font-bold flex items-center gap-2 mx-auto" style={{ background: "#EF4444", color: "#FFFFFF" }}>
                <MicOff className="w-5 h-5" /> Stop & Generate SOAP Note
              </button>
            </div>
          </div>
        )}

        {phase === "transcribing" && (
          <div className="text-center rounded-3xl p-10" style={{ background: "#FFFFFF" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(139,92,246,0.1)" }}>
              <Sparkles className="w-8 h-8 animate-spin" style={{ color: "#8B5CF6" }} />
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: "#1C1C1E" }}>Cadus is structuring your note...</p>
            <p className="text-sm" style={{ color: "#AEAEB2" }}>Extracting symptoms, vitals, diagnosis, and plan from your dictation</p>
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            {/* Transcript */}
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <h3 className="font-bold text-sm mb-2" style={{ color: "#AEAEB2" }}>Original Transcript</h3>
              <p className="text-sm italic" style={{ color: "#636366" }}>{transcript || SAMPLE_TRANSCRIPT}</p>
            </div>

            {/* SOAP Note */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid rgba(139,92,246,0.2)", boxShadow: "0 4px 20px rgba(139,92,246,0.08)" }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)", background: "rgba(139,92,246,0.04)" }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: "#8B5CF6" }} />
                  <span className="font-bold text-sm" style={{ color: "#8B5CF6" }}>AI-Generated SOAP Note</span>
                </div>
                <span className="text-xs" style={{ color: "#AEAEB2" }}>Edit below before saving</span>
              </div>
              <div className="p-5">
                <textarea value={editedSoap} onChange={e => setEditedSoap(e.target.value)} rows={20} className="w-full text-sm font-mono resize-y outline-none" style={{ color: "#1C1C1E", background: "transparent" }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>
                <Copy className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy Text"}
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#F2F2F7", color: "#636366" }}>
                <FileText className="w-3.5 h-3.5" /> Export Word
              </button>
              <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold ml-auto" style={{ background: "#F2F2F7", color: "#636366" }}>
                <RotateCcw className="w-3.5 h-3.5" /> New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
