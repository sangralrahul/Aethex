import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, User, Loader2, Activity, FlaskConical,
  Lock, Crown, Paperclip, Image, FileText, Camera, Search,
  ImagePlus, X, Microscope, Download, Presentation, PlayCircle,
  Plus, PanelLeft, MessageSquare, Tag,
  ChevronDown, ChevronLeft, ChevronRight, RefreshCw,
  Home, BookOpen, Upload, Stethoscope,
  Pill, Calculator, TestTube2, ClipboardList, HelpCircle,
  Brain, Languages, Mic, MicOff, SlidersHorizontal, Zap, ExternalLink,
} from "lucide-react";
import { useAiChat as useAiChatOriginal } from "@workspace/api-client-react";
import { type ChatMessage, ChatMessageRole } from "@workspace/api-client-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Groq-backed replacement for the original REST chat hook.
// Keeps the same mutation shape: { data: { message, conversationHistory, ... } } -> { message }
function useAiChat() {
  return useMutation({
    mutationFn: async (vars: { data: { message: string; conversationHistory?: any[]; agent?: string; language?: string; mode?: string; specialty?: string } }) => {
      const history = (vars.data.conversationHistory ?? [])
        .filter((m: any) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
        .map((m: any) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("groq-ai", {
        body: { action: "chat", message: vars.data.message, history },
      });
      if (error) throw new Error(error.message || "Cadus AI request failed");
      if (!data?.message) throw new Error(data?.error || "Cadus AI returned an empty response");
      return { message: data.message as string };
    },
  });
}
// Keep original import referenced to avoid unused-import lint churn.
void useAiChatOriginal;
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ringAnimImg from "@assets/photo_2026-03-29_15-00-52_1774776666332.jpg";
import neuralNetImg from "@assets/photo_2026-03-29_15-00-48_1774776666333.jpg";
import neuralNetBg from "@assets/photo_2026-03-29_15-00-48_1774779103993.jpg";
import PresentationViewer, { type PresentationData } from "@/components/cadus/PresentationViewer";
import CadusLogo from "@/components/cadus/CadusLogo";
import DNABackground from "@/components/cadus/DNABackground";
import CameraModal from "@/components/cadus/CameraModal";
import { loadSettings, type CadusSettings } from "@/components/cadus/SettingsModal";
import { TypewriterText } from "@/components/cadus/TypewriterText";
import { getTranslation } from "@/lib/translations";
import { useUserAuth } from "@/hooks/use-user-auth";

/* ── Cadus theme CSS custom-property tokens ─────────────────────────── */
function getThemeVars(theme: "dark" | "auto" | "light"): React.CSSProperties {
  if (theme === "light") return {
    "--sp-root-bg":                  "#edf4fb",
    "--sp-sidebar-bg":               "rgba(255,255,255,0.98)",
    "--sp-sidebar-border":           "rgba(0,150,190,0.22)",
    "--sp-topbar-bg":                "rgba(240,248,255,0.97)",
    "--sp-topbar-border":            "rgba(0,150,190,0.18)",
    "--sp-divider":                  "rgba(0,120,170,0.12)",
    "--sp-label":                    "rgba(0,120,170,0.65)",
    "--sp-text-primary":             "rgba(8,30,70,0.95)",
    "--sp-text-muted":               "rgba(25,65,130,0.7)",
    "--sp-text-dim":                 "rgba(25,80,145,0.55)",
    "--sp-text-faint":               "rgba(25,80,145,0.4)",
    "--sp-text-footer":              "rgba(25,80,145,0.72)",
    "--sp-model-inactive-color":     "rgba(25,65,130,0.65)",
    "--sp-model-inactive-bg":        "rgba(0,0,0,0.03)",
    "--sp-model-inactive-border":    "rgba(0,0,0,0.08)",
    "--sp-model-icon-inactive":      "rgba(0,0,0,0.06)",
    "--sp-session-active-bg":        "rgba(0,188,212,0.12)",
    "--sp-session-active-border":    "rgba(0,188,212,0.28)",
    "--sp-session-active-text":      "rgba(0,50,110,0.95)",
    "--sp-session-inactive-text":    "rgba(25,75,145,0.72)",
    "--sp-session-meta":             "rgba(0,110,170,0.5)",
    "--sp-ai-bubble-bg":             "rgba(255,255,255,0.98)",
    "--sp-ai-bubble-border":         "rgba(0,150,190,0.2)",
    "--sp-ai-text":                  "rgba(8,30,70,0.92)",
    "--sp-user-bubble-bg":           "linear-gradient(135deg,rgba(0,188,212,0.18),rgba(0,150,200,0.1))",
    "--sp-user-bubble-border":       "rgba(0,188,212,0.38)",
    "--sp-user-text":                "rgba(0,40,90,0.95)",
    "--sp-input-bg":                 "rgba(255,255,255,0.97)",
    "--sp-input-border":             "rgba(0,150,190,0.3)",
    "--sp-textarea-color":           "rgba(8,30,70,0.95)",
    "--sp-placeholder-color":        "rgba(0,120,170,0.38)",
    "--sp-new-chat-bg":              "rgba(0,188,212,0.1)",
    "--sp-new-chat-border":          "rgba(0,188,212,0.3)",
    "--sp-new-chat-color":           "#007fa3",
    "--sp-toggle-color":             "rgba(0,140,190,0.7)",
    "--sp-caret-color":              "#0099bb",
  } as React.CSSProperties;

  /* dark + auto → AETHEX cream palette (matches landing page) */
  return {
    "--sp-root-bg":                  "#F8F7F4",
    "--sp-sidebar-bg":               "#FFFFFF",
    "--sp-sidebar-border":           "rgba(0,0,0,0.07)",
    "--sp-topbar-bg":                "rgba(255,255,255,0.97)",
    "--sp-topbar-border":            "rgba(0,0,0,0.07)",
    "--sp-divider":                  "rgba(0,0,0,0.07)",
    "--sp-label":                    "rgba(0,0,0,0.32)",
    "--sp-text-primary":             "#0A0A0F",
    "--sp-text-muted":               "rgba(0,0,0,0.45)",
    "--sp-text-dim":                 "rgba(0,0,0,0.32)",
    "--sp-text-faint":               "rgba(0,0,0,0.22)",
    "--sp-text-footer":              "rgba(0,0,0,0.35)",
    "--sp-model-inactive-color":     "rgba(0,0,0,0.52)",
    "--sp-model-inactive-bg":        "rgba(0,0,0,0.03)",
    "--sp-model-inactive-border":    "rgba(0,0,0,0.08)",
    "--sp-model-icon-inactive":      "rgba(0,0,0,0.05)",
    "--sp-session-active-bg":        "rgba(0,194,168,0.06)",
    "--sp-session-active-border":    "rgba(0,194,168,0.18)",
    "--sp-session-active-text":      "#0A0A0F",
    "--sp-session-inactive-text":    "rgba(0,0,0,0.42)",
    "--sp-session-meta":             "rgba(0,0,0,0.28)",
    "--sp-ai-bubble-bg":             "#FFFFFF",
    "--sp-ai-bubble-border":         "rgba(0,0,0,0.08)",
    "--sp-ai-text":                  "rgba(0,0,0,0.82)",
    "--sp-user-bubble-bg":           "#007AFF",
    "--sp-user-bubble-border":       "#007AFF",
    "--sp-user-text":                "#FFFFFF",
    "--sp-input-bg":                 "#FFFFFF",
    "--sp-input-border":             "rgba(0,0,0,0.1)",
    "--sp-textarea-color":           "#0A0A0F",
    "--sp-placeholder-color":        "rgba(0,0,0,0.32)",
    "--sp-new-chat-bg":              "#00C2A8",
    "--sp-new-chat-border":          "#00C2A8",
    "--sp-new-chat-color":           "#FFFFFF",
    "--sp-toggle-color":             "rgba(0,0,0,0.35)",
    "--sp-caret-color":              "#00C2A8",
  } as React.CSSProperties;
}

interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

interface ExtendedMessage extends ChatMessage {
  imageUrl?: string;
  isImageGeneration?: boolean;
  isImageTypeSelection?: boolean;
  presentationData?: PresentationData;
  presentationPdfBase64?: string;
  presentationDocxBase64?: string;
  presentationTitle?: string;
  isPresentation?: boolean;
  slideCountOptions?: number[];
  isDeepResearch?: boolean;
  isResearchTypeSelection?: boolean;
  researchReport?: string;
  researchSources?: ResearchSource[];
  researchQueries?: string[];
  hasGoogleSearch?: boolean;
}

type ModelId = "pulse45" | "flux36" | "nova46";
type ChatMode = "normal" | "deep-research" | "create-image" | "create-presentation"
  | "drug-interactions" | "dosage-calc" | "lab-values" | "soap-note"
  | "mcq-gen" | "patient-edu" | "procedure-guide" | "ddx" | "image-analysis";

interface Model {
  id: ModelId;
  name: string;
  version: string;
  description: string;
  icon: React.ElementType;
  color: string;
  textColor: string;
  badgeBg: string;
  activeStyle: { background: string; color: string; border: string };
  pro?: boolean;
}

interface ChatSession {
  id: string;
  modelId: ModelId;
  messages: ExtendedMessage[];
  title: string;
  createdAt: number;
}

const MODELS: Model[] = [
  {
    id: "pulse45",
    name: "Cadus Minor",
    version: "",
    description: "Vitals · Emergency · Critical Care",
    icon: Activity,
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    badgeBg: "bg-emerald-50 border-emerald-200",
    activeStyle: { background: "rgba(16,185,129,0.22)", color: "#34d399", border: "1px solid rgba(52,211,153,0.5)" },
  },
  {
    id: "flux36",
    name: "Cadus Medius",
    version: "",
    description: "Pharmacology · Drug Interactions · Labs",
    icon: FlaskConical,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    badgeBg: "bg-orange-50 border-orange-200",
    activeStyle: { background: "rgba(249,115,22,0.2)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.5)" },
  },
  {
    id: "nova46",
    name: "Cadus Magnus",
    version: "",
    description: "Advanced Diagnostics · Research · Multispecialty",
    icon: Crown,
    color: "bg-violet-600",
    textColor: "text-violet-700",
    badgeBg: "bg-violet-50 border-violet-200",
    activeStyle: { background: "rgba(124,58,237,0.22)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.5)" },
    pro: true,
  },
];

const modelGreetings: Record<ModelId, string> = {
  pulse45:
    "Hello! I'm Cadus AI running Cadus Minor — your emergency medicine and vitals specialist. I can help with vital sign interpretation, ACLS protocols, ICU management, monitoring equipment, and critical care guidelines. Ready to assist!",
  flux36:
    "Hello! I'm Cadus AI running Cadus Medius — your pharmacology and laboratory medicine specialist. I can help with drug interactions, dosage calculations, antibiotic selection, lab value interpretation, and NEET-PG pharmacology prep. How can I help?",
  nova46:
    "Upgrade to unlock Cadus Magnus — advanced diagnosis, image analysis and unlimited queries.",
};

const quickSuggestions: Record<ModelId, string[]> = {
  pulse45: [
    "What is the first-line treatment for Type 2 Diabetes in India?",
    "Explain the management of diabetic ketoacidosis step by step",
    "Pathophysiology of acute myocardial infarction",
    "Approach to a patient presenting with chest pain",
    "Normal ECG — describe all components and clinical significance",
  ],
  flux36: [
    "Warfarin drug interactions with NSAIDs and antibiotics",
    "Normal LFT values and causes of elevated ALT/AST",
    "First-line antibiotic for community-acquired pneumonia in adults",
    "Renal dose adjustment for aminoglycosides",
    "Antidotes for common poisonings — organophosphate, digoxin, heparin",
  ],
  nova46: [
    "Rare autoimmune conditions mimicking SLE — differential diagnosis",
    "Complex multimorbidity management in elderly patient",
    "Latest ACC/AHA heart failure guidelines summary",
    "Approach to pyrexia of unknown origin",
    "NEET PG high-yield pharmacology one-liners",
  ],
};

type HomeSpecialty = "All" | "Internal Med" | "Cardiology" | "Emergency" | "Pharmacology" | "Surgery" | "Pediatrics" | "NEET PG";

const SPECIALTY_PROMPTS: Record<HomeSpecialty, string[]> = {
  "All": [
    "What is the first-line treatment for Type 2 Diabetes in India?",
    "Pathophysiology of Acute MI — explain step by step",
    "Normal ECG — describe all components and significance",
    "What are the causes of megaloblastic anemia?",
    "NEET PG high-yield: Drugs acting on renal tubule",
    "Approach to a patient with jaundice",
  ],
  "Internal Med": [
    "Step-by-step management of diabetic ketoacidosis (DKA)",
    "Causes and treatment approach to hyponatremia",
    "Pyrexia of Unknown Origin (PUO) — workup and common causes",
    "Approach to a patient presenting with jaundice",
    "Interpretation: K⁺ 2.8, BP 160/100, hypokalemic alkalosis — diagnosis?",
    "Management of SLE flare — SLICC criteria and treatment",
  ],
  "Cardiology": [
    "STEMI vs NSTEMI — key differences and management protocols",
    "Classify heart failure by ejection fraction and explain GDMT",
    "ECG findings in LBBB — causes and clinical significance",
    "Hypertensive emergency vs urgency — management approach",
    "Atrial fibrillation — rate vs rhythm control strategy",
    "Aortic stenosis — when to intervene (TAVR vs SAVR)?",
  ],
  "Emergency": [
    "ACLS algorithm for pulseless VT/VF — step by step",
    "Anaphylaxis management — drug doses and timing",
    "Polytrauma primary survey — ABCDE approach",
    "Sepsis-3 criteria and Surviving Sepsis Bundle 2024",
    "Status epilepticus management protocol",
    "GCS scoring — calculate for: E2 V3 M4",
  ],
  "Pharmacology": [
    "Drug interactions between warfarin and common medications",
    "Mechanism of action of beta-blockers with clinical uses",
    "Which antibiotics are safe in pregnancy? Complete list",
    "Renal dose adjustments — aminoglycosides, vancomycin, metformin",
    "Antidotes: Organophosphate, digoxin, heparin, paracetamol overdose",
    "NSAID vs selective COX-2 inhibitor — indications and risks",
  ],
  "Surgery": [
    "Layers of the anterior abdominal wall — lateral to medial",
    "Types of hernia — inguinal, femoral, umbilical — repair techniques",
    "Pre-operative assessment and consent for elective surgery",
    "Complications of appendicectomy — early and late",
    "Management of acute small bowel obstruction",
    "Thyroid surgery complications — RLN injury, hypoparathyroidism",
  ],
  "Pediatrics": [
    "WHO growth chart interpretation — failure to thrive criteria",
    "Management of simple febrile seizures in children",
    "IMCI algorithm — child with cough and fast breathing",
    "IAP immunisation schedule 2024 — complete list",
    "Approach to neonatal jaundice — phototherapy thresholds",
    "Pediatric fluid management — Holliday-Segar formula",
  ],
  "NEET PG": [
    "High-yield pharmacology one-liners for NEET PG 2025",
    "Most common causes of each hepatitis type — quick table",
    "Biochemistry — glycolysis: key enzymes and rate-limiting steps",
    "Anatomy — brachial plexus: roots, trunks, divisions, cords, branches",
    "Pathology: Reed-Sternberg cells — disease, type, marker",
    "Physiology: Starling forces and oedema formation",
  ],
};

interface Attachment {
  id: string;
  name: string;
  type: "image" | "file";
  previewUrl?: string;
  size: string;
}

function renderMarkdownText(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((chunk, i) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return <strong key={i} className="font-semibold" style={{ color: "rgba(220,240,255,0.95)" }}>{chunk.slice(2, -2)}</strong>;
    }
    return <span key={i}>{chunk}</span>;
  });
}

function ResearchReportCard({
  report, sources, queries, hasGoogleSearch,
}: {
  report: string; sources: ResearchSource[]; queries: string[]; hasGoogleSearch: boolean;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set(Array.from({ length: 10 }, (_, i) => i)));
  const [showAllSources, setShowAllSources] = useState(false);

  const sections = report
    .split(/\n(?=## )/)
    .map((s) => s.replace(/^## /, "").trim())
    .filter(Boolean)
    .map((s) => {
      const nlIdx = s.indexOf("\n");
      const title = nlIdx >= 0 ? s.slice(0, nlIdx).trim() : s.trim();
      const body  = nlIdx >= 0 ? s.slice(nlIdx + 1).trim() : "";
      return { title, body };
    });

  const toggleSection = (i: number) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const visibleSources = showAllSources ? sources : sources.slice(0, 6);

  const sectionIcons: Record<string, string> = {
    "Executive Summary": "📋",
    "Epidemiology & Indian Burden": "🇮🇳",
    "Pathophysiology": "🔬",
    "Clinical Presentation": "🩺",
    "Diagnosis": "🧪",
    "Management & Treatment": "💊",
    "Key Guidelines & Evidence": "📚",
    "Clinical Pearls": "💡",
  };

  const renderBody = (body: string) =>
    body.split("\n").filter(Boolean).map((line, li) => {
      const isBullet = line.startsWith("- ") || line.startsWith("* ");
      const isTakeaway = line.startsWith("**Takeaway:");
      const clean = isBullet ? line.slice(2) : line;
      if (isTakeaway) {
        return (
          <div key={li} className="mt-3 pt-3 border-t border-blue-800/40 flex items-start gap-2">
            <span className="text-yellow-400 shrink-0 text-xs mt-0.5">★</span>
            <span className="text-[12px] font-medium" style={{ color: "rgba(250,220,100,0.9)" }}>{renderMarkdownText(clean)}</span>
          </div>
        );
      }
      return isBullet ? (
        <div key={li} className="flex gap-2">
          <span className="text-cyan-400 mt-1 shrink-0 text-[10px]">◆</span>
          <span className="text-[13px] leading-relaxed">{renderMarkdownText(clean)}</span>
        </div>
      ) : <p key={li} className="text-[13px] leading-relaxed">{renderMarkdownText(line)}</p>;
    });

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-t-2xl" style={{ background: "linear-gradient(135deg,#1e3a8a,#3730a3)" }}>
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Microscope className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-white block">Cadus AI Deep Research</span>
          <span className="text-[10px] text-blue-200/70">{sections.length} sections · {sources.length > 0 ? `${sources.length} sources` : "AI knowledge base"}</span>
        </div>
        {hasGoogleSearch && (
          <span className="flex items-center gap-1 text-[10px] bg-white/15 text-white px-2 py-1 rounded-full shrink-0">
            <Search className="w-2.5 h-2.5" /> Web Search
          </span>
        )}
      </div>

      {/* Search queries used */}
      {queries.length > 0 && (
        <div className="px-4 py-2.5 border-x border-blue-900/50 flex flex-wrap gap-1.5" style={{ background: "rgba(15,30,80,0.6)" }}>
          <span className="text-[10px] text-blue-400/60 mr-1 self-center">Searched:</span>
          {queries.map((q, i) => (
            <span key={i} className="text-[10px] border border-blue-700/40 text-blue-300/80 px-2 py-0.5 rounded-full truncate max-w-[180px]"
              style={{ background: "rgba(30,58,138,0.35)" }} title={q}>
              {q}
            </span>
          ))}
        </div>
      )}

      {/* Report sections */}
      <div className="border-x border-slate-700/50 divide-y divide-slate-700/25" style={{ background: "rgba(5,12,35,0.75)" }}>
        {sections.map((sec, i) => (
          <div key={i}>
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors text-left"
              onClick={() => toggleSection(i)}>
              <span className="text-base shrink-0">{sectionIcons[sec.title] ?? "📌"}</span>
              <span className="text-[13px] font-semibold flex-1" style={{ color: "rgba(210,235,255,0.95)" }}>{sec.title}</span>
              <span className="text-[10px] shrink-0 transition-transform" style={{ color: "rgba(0,200,255,0.45)", transform: expandedSections.has(i) ? "rotate(0deg)" : "rotate(-90deg)" }}>▼</span>
            </button>
            {expandedSections.has(i) && sec.body && (
              <div className="px-5 pb-4 space-y-2" style={{ color: "rgba(175,215,255,0.85)" }}>
                {renderBody(sec.body)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sources — always visible at the bottom */}
      {sources.length > 0 && (
        <div className="border border-slate-700/50 rounded-b-2xl mt-0 overflow-hidden" style={{ background: "rgba(5,12,35,0.85)" }}>
          <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2" style={{ background: "rgba(10,20,60,0.6)" }}>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="text-[12px] font-semibold text-cyan-400">Sources</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-medium">{sources.length}</span>
          </div>
          <div className="p-3 grid grid-cols-1 gap-2">
            {visibleSources.map((src, i) => (
              <a key={i} href={src.url} target="_blank" rel="noreferrer"
                className="flex items-start gap-3 p-2.5 rounded-xl group transition-colors hover:bg-white/5"
                style={{ border: "1px solid rgba(0,188,212,0.12)" }}>
                <div className="flex items-center justify-center w-6 h-6 rounded-md shrink-0 mt-0.5 text-[10px] font-bold text-blue-300"
                  style={{ background: "rgba(30,58,138,0.5)", border: "1px solid rgba(59,130,246,0.3)" }}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-cyan-400 group-hover:text-cyan-300 group-hover:underline leading-snug mb-0.5 line-clamp-2">{src.title}</p>
                  <div className="flex items-center gap-1.5">
                    <img src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=16`} alt="" className="w-3 h-3 rounded-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-[10px]" style={{ color: "rgba(100,160,220,0.55)" }}>{src.domain}</span>
                  </div>
                  {src.snippet && (
                    <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: "rgba(160,195,240,0.55)" }}>{src.snippet}</p>
                  )}
                </div>
                <ExternalLink className="w-3 h-3 shrink-0 mt-1 opacity-0 group-hover:opacity-40 text-cyan-400 transition-opacity" />
              </a>
            ))}
          </div>
          {sources.length > 6 && (
            <div className="px-4 pb-3">
              <button type="button" onClick={() => setShowAllSources((v) => !v)}
                className="text-[11px] text-cyan-500 hover:text-cyan-300 hover:underline transition-colors">
                {showAllSources ? "Show fewer" : `Show ${sources.length - 6} more sources ↓`}
              </button>
            </div>
          )}
        </div>
      )}
      {sources.length === 0 && (
        <div className="border border-t-0 border-slate-700/50 rounded-b-2xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(5,12,35,0.85)" }}>
          <span className="text-[10px] text-white/25">⚠ Based on AI training knowledge — add Google Search API keys for live web sources</span>
        </div>
      )}
    </div>
  );
}

function makeSession(modelId: ModelId): ChatSession {
  return { id: crypto.randomUUID(), modelId, messages: [], title: "New chat", createdAt: Date.now() };
}

const SESSIONS_LS_KEY = "cadus_sessions_v2";
const PINNED_LS_KEY = "cadus_pinned_v1";

function saveSessions(sessions: ChatSession[]): void {
  try { localStorage.setItem(SESSIONS_LS_KEY, JSON.stringify(sessions.slice(0, 30))); } catch {}
}
function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_LS_KEY);
    if (!raw) return [makeSession("pulse45")];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [makeSession("pulse45")];
  } catch { return [makeSession("pulse45")]; }
}
function loadPinned(): string[] {
  try { return JSON.parse(localStorage.getItem(PINNED_LS_KEY) ?? "[]"); } catch { return []; }
}
function savePinned(pins: string[]): void {
  try { localStorage.setItem(PINNED_LS_KEY, JSON.stringify(pins)); } catch {}
}

export default function AiAssistant() {
  const { user } = useUserAuth();

  /* Canonical subdomain redirect: aethex.in/ai-assistant → cadus.aethex.in */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const isMainDomain = host === "aethex.in" || host === "www.aethex.in";
    const isAiPath = path === "/ai-assistant" || path === "/cadus-standalone" ||
      path.startsWith("/ai-assistant/") || path.startsWith("/cadus-standalone/");
    if (isMainDomain && isAiPath) {
      window.location.replace("https://cadus.aethex.in/");
    }
  }, []);

  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => loadSessions()[0]?.id ?? "");
  const [pinnedPrompts, setPinnedPrompts] = useState<string[]>(loadPinned);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [showProModal, setShowProModal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [settings, setSettings] = useState<CadusSettings>(loadSettings);
  const tr = getTranslation(settings.language);
  const themeVars = getThemeVars(settings.theme);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingResearch, setIsGeneratingResearch] = useState(false);
  const [researchStage, setResearchStage] = useState<"idle" | "waiting-type">("idle");
  const [pendingResearchQuery, setPendingResearchQuery] = useState("");
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);
  const [presentationStage, setPresentationStage] = useState<"idle" | "waiting-slide-count">("idle");
  const [pendingPresentationPrompt, setPendingPresentationPrompt] = useState("");
  const [imageStage, setImageStage] = useState<"idle" | "waiting-type">("idle");
  const [pendingImagePrompt, setPendingImagePrompt] = useState("");
  const [buildingTopic, setBuildingTopic] = useState("");
  const [buildingSlideCount, setBuildingSlideCount] = useState(10);
  const [activePresentationData, setActivePresentationData] = useState<(PresentationData & { pdfBase64?: string; docxBase64?: string }) | null>(null);
  const [specialty, setSpecialty] = useState<string>("General");
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));
  const recognitionRef = useRef<any>(null);
  const specialtyPickerRef = useRef<HTMLDivElement>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contextParam = params.get("context");
    if (contextParam) {
      try {
        const decoded = decodeURIComponent(contextParam);
        setInput(decoded);
      } catch {
        /* ignore malformed URI */
      }
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "slides") {
      setActivePresentationData({
        title: "Human Heart — Demo Presentation",
        subtitle: "Medical Education | Cadus AI",
        slides: [
          { n: 1, type: "title", layout: "", t: "The Human Heart", sub: "Structure, Physiology & Clinical Significance", bullets: [] },
          { n: 2, type: "overview", layout: "cards", t: "Overview: Human Heart", sub: "", bullets: [], cards: [
            { heading: "Anatomy & Structure", body: "The heart is a hollow muscular organ in the mediastinum. Four chambers — two atria and two ventricles — pump blood through pulmonary and systemic circuits. Three tissue layers: epicardium, myocardium, and endocardium." },
            { heading: "Physiology & Function", body: "The heart acts as a dual pump circulating blood simultaneously. Cardiac output (CO = HR × SV), preload, afterload, and contractility are the four determinants of cardiac performance." },
            { heading: "Clinical Significance", body: "Cardiovascular disease is the #1 cause of death worldwide. Rapid recognition of MI, heart failure, and arrhythmias using ECG interpretation and biomarkers is essential for every clinician." },
          ]},
          { n: 3, type: "physiology", layout: "stats", t: "Cardiac Physiology by Numbers", sub: "", bullets: [], stats: [
            { value: "5 L/min", label: "Cardiac Output at Rest", desc: "Volume of blood pumped by the heart each minute" },
            { value: "100,000", label: "Heartbeats Per Day", desc: "Approximate number of cardiac contractions daily" },
            { value: "120/80", label: "Normal BP (mmHg)", desc: "Standard systolic / diastolic blood pressure reference" },
          ]},
          { n: 4, type: "clinical", layout: "twocol", t: "Acute Coronary Syndromes", sub: "", bullets: [], leftHeading: "Clinical Presentation", leftBody: "Acute coronary syndrome (ACS) encompasses STEMI, NSTEMI, and unstable angina. Patients present with chest pain, diaphoresis, and dyspnoea. Rapid troponin elevation and ECG changes guide diagnosis. Immediate revascularisation reduces mortality significantly in STEMI. Time is muscle — door-to-balloon under 90 minutes saves lives.", rightPoints: ["STEMI: Complete vessel occlusion — emergency PCI required", "NSTEMI: Partial occlusion — troponin positive, no ST elevation", "Unstable Angina: No troponin rise, high-risk — urgent workup", "Key: Dual antiplatelet therapy + anticoagulation within 10 minutes"] },
          { n: 5, type: "pathways", layout: "list", t: "Management Pathways", sub: "", bullets: ["Primary prevention: Lifestyle modification, statin therapy, BP control", "Secondary prevention: Dual antiplatelet, ACE inhibitors, cardiac rehab", "Acute management: Aspirin + heparin + PCI within 90 minutes", "Heart failure: GDMT including beta-blockers, ARNi, SGLT2 inhibitors", "Sudden death prevention: ICD implant in EF < 35% on optimal therapy"], ki: "Early revascularisation and guideline-directed therapy dramatically reduce cardiovascular mortality — time-sensitive intervention saves lives." },
        ],
      });
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cadus-settings-v1" && e.newValue) {
        try {
          const next = JSON.parse(e.newValue);
          setSettings((prev) => ({ ...prev, ...next }));
        } catch {}
      }
      if (e.key === "cadus_sessions_v2" && !e.newValue) {
        const fresh = makeSession("pulse45");
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const [input, setInput] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [sidebarView, setSidebarView] = useState<"home" | "chats" | "models">("home");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [homeSpecialty, setHomeSpecialty] = useState<HomeSpecialty>("All");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const chatMutation = useAiChat();
  const { toast } = useToast();

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];
  const activeModel: ModelId = activeSession?.modelId ?? "pulse45";
  const messages: ExtendedMessage[] = activeSession?.messages ?? [];
  const hasMessages = messages.length > 0;
  const model = MODELS.find((m) => m.id === activeModel)!;
  const isProLocked = model.pro ?? false;

  const seenMsgKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeSessionId) return;
    messages.forEach((_, idx) => {
      seenMsgKeys.current.add(`${activeSessionId}:${idx}`);
    });
  }, [activeSessionId]);

  const isMsgNew = (idx: number) =>
    !!activeSessionId && !seenMsgKeys.current.has(`${activeSessionId}:${idx}`);

  const markMsgSeen = (idx: number) => {
    if (activeSessionId) seenMsgKeys.current.add(`${activeSessionId}:${idx}`);
  };

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
      if (specialtyPickerRef.current && !specialtyPickerRef.current.contains(e.target as Node)) {
        setShowSpecialtyPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (!voiceSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [voiceSupported, isListening]);

  const updateSession = useCallback((sessionId: string, msgs: ExtendedMessage[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const firstUser = msgs.find((m) => m.role === ChatMessageRole.user);
        const title = firstUser ? firstUser.content.slice(0, 50) : "New chat";
        return { ...s, messages: msgs, title };
      })
    );
  }, []);

  const handleNewChat = () => {
    const sess = makeSession(activeModel);
    setSessions((prev) => [sess, ...prev]);
    setActiveSessionId(sess.id);
    setChatMode("normal");
    setAttachments([]);
    resetPresentationState();
    setInput("");
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = makeSession("pulse45");
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) {
        setActiveSessionId(next[0].id);
      }
      return next;
    });
  };

  const resetPresentationState = () => {
    setPresentationStage("idle");
    setPendingPresentationPrompt("");
    setImageStage("idle");
    setPendingImagePrompt("");
    setResearchStage("idle");
    setPendingResearchQuery("");
  };

  const handleModelSelect = (m: Model) => {
    if (m.pro) { setShowProModal(true); return; }
    const existingSession = [...sessions].reverse().find((s) => s.modelId === m.id);
    if (existingSession) {
      setActiveSessionId(existingSession.id);
    } else {
      const sess = makeSession(m.id);
      setSessions((prev) => [sess, ...prev]);
      setActiveSessionId(sess.id);
    }
    setInput("");
    setChatMode("normal");
    resetPresentationState();
  };

  const toggleMode = (mode: ChatMode) => {
    setChatMode((prev) => {
      if (prev === mode) { resetPresentationState(); return "normal"; }
      resetPresentationState();
      return mode;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasContent = input.trim() || attachments.length > 0;
    if (!hasContent || chatMutation.isPending || isGeneratingImage || isGeneratingResearch || isGeneratingPresentation || isProLocked) return;

    const userMsg = input.trim() || `[Attached: ${attachments.map((a) => a.name).join(", ")}]`;
    setInput("");
    setAttachments([]);

    const currentMsgs = activeSession.messages;
    const sessionId = activeSession.id;
    const userEntry: ExtendedMessage = { role: ChatMessageRole.user, content: userMsg };
    const newMsgs: ExtendedMessage[] = [...currentMsgs, userEntry];
    updateSession(sessionId, newMsgs);

    if (chatMode === "create-image") {
      setPendingImagePrompt(userMsg);
      setImageStage("waiting-type");
      updateSession(sessionId, [...newMsgs, {
        role: ChatMessageRole.assistant,
        content: tr.imageTypeQuestion,
        isImageTypeSelection: true,
      }]);
      return;
    }

    if (chatMode === "create-presentation") {
      setPendingPresentationPrompt(userMsg);
      setPresentationStage("waiting-slide-count");
      updateSession(sessionId, [...newMsgs, {
        role: ChatMessageRole.assistant,
        content: `Great! I'll create a presentation on "${userMsg}". How many slides would you like?`,
        slideCountOptions: [5, 8, 10, 12, 15, 20],
      }]);
      return;
    }

    if (chatMode === "deep-research") {
      setPendingResearchQuery(userMsg);
      setResearchStage("waiting-type");
      updateSession(sessionId, [...newMsgs, {
        role: ChatMessageRole.assistant,
        content: tr.researchTypeQuestion ?? "Would you like a quick summary or a full deep research report?",
        isResearchTypeSelection: true,
      }]);
      return;
    }

    if (chatMode === "image-analysis") {
      const imageAttachment = attachments.find(a => a.type === "image");
      if (!imageAttachment || !imageAttachment.previewUrl) {
        toast({ title: "No image attached", description: "Please attach an X-ray, ECG, or medical image first.", variant: "destructive" });
        updateSession(sessionId, currentMsgs);
        return;
      }
      setIsAnalyzingImage(true);
      try {
        const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
        const resp = await fetch(`${apiBase}/api/ai/analyze-image`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: imageAttachment.previewUrl.split(",")[1],
            imageType: imageAttachment.previewUrl.split(";")[0].split(":")[1] ?? "image/jpeg",
            query: userMsg || "Please provide a full clinical analysis of this medical image.",
            specialty,
          }),
        });
        const data = await resp.json();
        if (data.analysis) {
          updateSession(sessionId, [...newMsgs, { role: ChatMessageRole.assistant, content: data.analysis }]);
        } else throw new Error(data.error ?? "Analysis failed");
      } catch (err: any) {
        toast({ title: "Image analysis failed", description: err?.message ?? "Please try again.", variant: "destructive" });
        updateSession(sessionId, currentMsgs);
      } finally { setIsAnalyzingImage(false); }
      return;
    }

    const apiMode = chatMode === "normal" ? "normal" : chatMode;
    chatMutation.mutate(
      { data: { message: userMsg, conversationHistory: currentMsgs, agent: activeModel, language: settings.language, mode: apiMode, specialty } as any },
      {
        onSuccess: (data) => {
          updateSession(sessionId, [...newMsgs, { role: ChatMessageRole.assistant, content: data.message }]);
          const jwt = user ? localStorage.getItem("aethex_jwt") : null;
          if (jwt && user && data.message) {
            const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
            fetch(`${apiBase}/api/monetization/consults`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
              body: JSON.stringify({ query: userMsg.slice(0, 2000), response: data.message.slice(0, 8000), model: activeModel }),
            }).catch(() => {});
          }
        },
      }
    );
  };

  const sendDirect = (text: string) => {
    if (!text.trim() || chatMutation.isPending || isProLocked) return;
    setInput("");
    setAttachments([]);
    const currentMsgs = activeSession.messages;
    const sessionId = activeSession.id;
    const userEntry: ExtendedMessage = { role: ChatMessageRole.user, content: text };
    const newMsgs: ExtendedMessage[] = [...currentMsgs, userEntry];
    updateSession(sessionId, newMsgs);
    chatMutation.mutate(
      { data: { message: text, conversationHistory: currentMsgs, agent: activeModel, language: settings.language, mode: "normal", specialty } as any },
      {
        onSuccess: (data) => {
          updateSession(sessionId, [...newMsgs, { role: ChatMessageRole.assistant, content: data.message }]);
          const jwt = user ? localStorage.getItem("aethex_jwt") : null;
          if (jwt && user && data.message) {
            const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
            fetch(`${apiBase}/api/monetization/consults`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
              body: JSON.stringify({ query: text.slice(0, 2000), response: data.message.slice(0, 8000), model: activeModel }),
            }).catch(() => {});
          }
        },
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const att: Attachment = {
        id: crypto.randomUUID(), name: file.name, type,
        size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
      };
      if (type === "image") {
        const reader = new FileReader();
        reader.onload = (ev) => { att.previewUrl = ev.target?.result as string; setAttachments((prev) => [...prev, { ...att }]); };
        reader.readAsDataURL(file);
      } else {
        setAttachments((prev) => [...prev, att]);
      }
    });
    setShowAttachMenu(false);
    e.target.value = "";
  };

  const handleSlideCountSelect = async (count: number) => {
    if (isGeneratingPresentation) return;
    const currentMsgs = activeSession.messages;
    const sessionId = activeSession.id;
    const topic = pendingPresentationPrompt;
    const userEntry: ExtendedMessage = { role: ChatMessageRole.user, content: `${count} slides` };
    const newMsgs = [...currentMsgs, userEntry];
    updateSession(sessionId, newMsgs);
    setBuildingTopic(topic);
    setBuildingSlideCount(count);
    setIsGeneratingPresentation(true);
    try {
      const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
      const [slidesResp, pdfResp] = await Promise.allSettled([
        fetch(`${apiBase}/api/ai/generate-slides`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: topic, slideCount: count }) }).then(r => r.json()),
        fetch(`${apiBase}/api/ai/generate-presentation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: topic, slideCount: count }) }).then(r => r.json()),
      ]);
      const slidesData = slidesResp.status === "fulfilled" ? slidesResp.value : null;
      const pdfData = pdfResp.status === "fulfilled" ? pdfResp.value : null;

      if (slidesData?.slides?.length) {
        const merged: PresentationData & { pdfBase64?: string; docxBase64?: string } = {
          ...slidesData, pdfBase64: pdfData?.pdfBase64, docxBase64: pdfData?.docxBase64,
        };
        setActivePresentationData(merged);
        updateSession(sessionId, [...newMsgs, {
          role: ChatMessageRole.assistant,
          content: `Your presentation "${slidesData.title}" (${count} slides) is ready!`,
          isPresentation: true, presentationData: merged,
          presentationTitle: slidesData.title, presentationPdfBase64: pdfData?.pdfBase64,
          presentationDocxBase64: pdfData?.docxBase64,
        }]);
        resetPresentationState();
      } else if (pdfData?.pdfBase64) {
        updateSession(sessionId, [...newMsgs, {
          role: ChatMessageRole.assistant,
          content: `Your presentation "${pdfData.title}" (${pdfData.totalSlides} slides) is ready! Download it below:`,
          isPresentation: true, presentationTitle: pdfData.title,
          presentationPdfBase64: pdfData.pdfBase64, presentationDocxBase64: pdfData.docxBase64,
        }]);
        resetPresentationState();
      } else throw new Error("Generation failed");
    } catch {
      toast({ title: "Presentation generation failed", description: "Please try again.", variant: "destructive" });
      updateSession(sessionId, currentMsgs);
      resetPresentationState();
    } finally { setIsGeneratingPresentation(false); }
  };

  const handleImageTypeSelect = async (imageStyle: "simple" | "diagram" | "real" | "real-labeled") => {
    if (isGeneratingImage) return;
    const currentMsgs = activeSession.messages;
    const sessionId = activeSession.id;
    const prompt = pendingImagePrompt;
    const styleLabels: Record<string, string> = {
      simple: tr.simpleImage,
      diagram: tr.diagram ?? "Diagram",
      real: tr.realImage ?? "Real Image",
      "real-labeled": tr.realImageLabeled ?? "Real Image + Labels",
    };
    const contentLabels: Record<string, string> = {
      simple: "medical illustration",
      diagram: "anatomical diagram",
      real: "real medical image",
      "real-labeled": "labeled real medical image",
    };
    const typeLabel = styleLabels[imageStyle] ?? tr.simpleImage;
    const userEntry: ExtendedMessage = { role: ChatMessageRole.user, content: typeLabel };
    const newMsgs = [...currentMsgs, userEntry];
    updateSession(sessionId, newMsgs);
    setImageStage("idle");
    setIsGeneratingImage(true);
    try {
      const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
      const resp = await fetch(`${apiBase}/api/ai/generate-image`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageStyle }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Image generation failed. Please try again.");
      if (data.imageUrl) {
        let caption: string;
        if (data.isPlaceholder) {
          caption = `Image generation is temporarily unavailable — showing a medical reference image for: "${prompt}"`;
        } else if (data.source === "wikipedia") {
          caption = `Wikipedia medical image for: "${prompt}" — sourced from Wikipedia Commons for clinical accuracy.`;
        } else {
          caption = `Here is your generated ${contentLabels[imageStyle] ?? "medical illustration"} for: "${prompt}"`;
        }
        updateSession(sessionId, [...newMsgs, {
          role: ChatMessageRole.assistant,
          content: caption,
          imageUrl: data.imageUrl, isImageGeneration: true,
        }]);
      } else throw new Error(data.error ?? "No image was returned.");
    } catch (err: any) {
      const description = err?.message ?? "Please try a different prompt.";
      toast({ title: "Image generation failed", description, variant: "destructive" });
      updateSession(sessionId, currentMsgs);
    } finally { setIsGeneratingImage(false); }
  };

  const handleResearchTypeSelect = async (mode: "quick" | "full") => {
    if (isGeneratingResearch) return;
    const currentMsgs = activeSession.messages;
    const sessionId = activeSession.id;
    const query = pendingResearchQuery;
    const typeLabel = mode === "quick"
      ? (tr.quickSummary ?? "Quick Summary")
      : (tr.fullDeepResearch ?? "Full Deep Research");
    const userEntry: ExtendedMessage = { role: ChatMessageRole.user, content: typeLabel };
    const newMsgs = [...currentMsgs, userEntry];
    updateSession(sessionId, newMsgs);
    setResearchStage("idle");
    setIsGeneratingResearch(true);
    try {
      if (mode === "quick") {
        const { data, error } = await supabase.functions.invoke("groq-ai", {
          body: {
            action: "chat",
            message: `Provide a concise clinical summary (3–5 paragraphs) on: ${query}. Cover key facts, clinical relevance, and management highlights.`,
          },
        });
        if (error || !data?.message) throw new Error(error?.message || "No response returned.");
        updateSession(sessionId, [...newMsgs, {
          role: ChatMessageRole.assistant, content: data.message,
        }]);
      } else {
        const { data, error } = await supabase.functions.invoke("groq-ai", {
          body: { action: "deep-research", query },
        });
        if (error || !data?.report) throw new Error(error?.message || data?.error || "Research failed");
        updateSession(sessionId, [...newMsgs, {
          role: ChatMessageRole.assistant, content: "",
          isDeepResearch: true, researchReport: data.report,
          researchSources: data.sources ?? [], researchQueries: data.searchQueries ?? [],
          hasGoogleSearch: data.hasGoogleSearch ?? false,
        }]);
      }
    } catch {
      toast({ title: "Research failed", description: "Please try again.", variant: "destructive" });
      updateSession(sessionId, currentMsgs);
    } finally { setIsGeneratingResearch(false); }
  };

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const handleDownloadPdf = async (content: string, msgId: string) => {
    setIsExportingPdf(msgId);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 16;
      const contentW = pageW - margin * 2;
      let y = 0;

      // White page background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, "F");

      // Header bar — dark navy with white text (readable on dark bg)
      doc.setFillColor(10, 24, 70);
      doc.rect(0, 0, pageW, 24, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("Cadus AI", margin, 15);
      const modeLabel = chatMode && chatMode !== "normal"
        ? chatMode.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        : "Clinical Report";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(180, 210, 255);
      doc.text(`· AI ${modeLabel}`, margin + 28, 15);
      const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      doc.setTextColor(200, 220, 255);
      doc.text(dateStr, pageW - margin, 15, { align: "right" });

      // Teal accent stripe under header
      doc.setFillColor(0, 188, 168);
      doc.rect(0, 24, pageW, 1.5, "F");

      y = 34;
      const firstUserMsg = messages.find(m => m.role === ChatMessageRole.user)?.content?.slice(0, 90) ?? "Clinical Report";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(10, 24, 70);
      const titleLines = doc.splitTextToSize(firstUserMsg, contentW);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 6.5 + 2;

      doc.setDrawColor(0, 188, 168);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 7;

      const checkNewPage = (needed: number) => {
        if (y + needed > pageH - 18) {
          doc.addPage();
          // White background on new page
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageW, pageH, "F");
          // Thin header strip
          doc.setFillColor(10, 24, 70);
          doc.rect(0, 0, pageW, 8, "F");
          doc.setFillColor(0, 188, 168);
          doc.rect(0, 8, pageW, 1, "F");
          y = 16;
        }
      };

      const lines = content.split("\n");
      for (const line of lines) {
        const stripped = line.trimStart();
        if (stripped === "") { y += 3; continue; }

        if (stripped.startsWith("# ")) {
          checkNewPage(12);
          y += 4;
          doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(10, 24, 70);
          const wrapped = doc.splitTextToSize(stripped.slice(2), contentW);
          doc.text(wrapped, margin, y); y += wrapped.length * 6.5 + 2;
        } else if (stripped.startsWith("## ")) {
          checkNewPage(10);
          y += 3;
          doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(0, 100, 130);
          const wrapped = doc.splitTextToSize(stripped.slice(3), contentW);
          doc.text(wrapped, margin, y); y += wrapped.length * 5.8 + 2;
        } else if (stripped.startsWith("### ")) {
          checkNewPage(9);
          y += 2;
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 80, 140);
          const wrapped = doc.splitTextToSize(stripped.slice(4), contentW);
          doc.text(wrapped, margin, y); y += wrapped.length * 5.2 + 1;
        } else if (stripped.startsWith("- ") || stripped.startsWith("• ") || stripped.match(/^\d+\.\s/)) {
          checkNewPage(6);
          const bulletText = stripped.startsWith("- ") ? stripped.slice(2) : stripped.startsWith("• ") ? stripped.slice(2) : stripped.replace(/^\d+\.\s/, "");
          const clean = bulletText.replace(/\*\*(.*?)\*\*/g, "$1");
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(25, 35, 55);
          const wrapped = doc.splitTextToSize(`• ${clean}`, contentW - 5);
          doc.text(wrapped, margin + 3, y); y += wrapped.length * 5 + 0.8;
        } else {
          checkNewPage(6);
          const clean = stripped.replace(/\*\*(.*?)\*\*/g, "$1");
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(25, 35, 55);
          const wrapped = doc.splitTextToSize(clean, contentW);
          doc.text(wrapped, margin, y); y += wrapped.length * 5 + 0.8;
        }
      }

      // Footer on every page
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(240, 243, 250);
        doc.rect(0, pageH - 11, pageW, 11, "F");
        doc.setDrawColor(200, 210, 230);
        doc.setLineWidth(0.3);
        doc.line(0, pageH - 11, pageW, pageH - 11);
        doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(60, 80, 120);
        doc.text("Generated by Cadus AI — AETHEX Medical Platform  |  For clinical reference only. Not a substitute for professional medical judgment.", margin, pageH - 4.5);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 4.5, { align: "right" });
      }

      doc.save(`cadus-report-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: "Export failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    } finally { setIsExportingPdf(null); }
  };

  const handleTogglePin = (prompt: string) => {
    setPinnedPrompts(prev => {
      const next = prev.includes(prompt) ? prev.filter(p => p !== prompt) : [...prev, prompt];
      savePinned(next);
      return next;
    });
  };

  const handleCameraCapture = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const id = `cam-${Date.now()}`;
    setAttachments((prev) => [...prev, { id, type: "image", file, previewUrl, name: file.name }]);
  };

  const handleClearCurrentChat = () => {
    const fresh = makeSession(activeModel);
    setSessions((prev) => prev.map((s) => s.id === activeSessionId ? fresh : s));
    setActiveSessionId(fresh.id);
  };

  const handleExportChats = () => {
    const data = JSON.stringify(sessions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cadus-chats-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const ModelIcon = model.icon;

  // Group sessions by today / yesterday / older
  const now = Date.now();
  const todaySessions = sessions.filter((s) => now - s.createdAt < 86400000);
  const yesterdaySessions = sessions.filter((s) => now - s.createdAt >= 86400000 && now - s.createdAt < 172800000);
  const olderSessions = sessions.filter((s) => now - s.createdAt >= 172800000);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const greetingName = user?.name ? `, ${user.name.split(" ")[0]}` : "";

  return (
    <div className="h-screen flex overflow-hidden relative" style={{ background: "var(--sp-root-bg)", ...themeVars }}>

      {/* AETHEX landing-page background — teal orb left, peach orb right, scattered dots */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        {/* Teal orb — left, like landing page */}
        <div style={{ position:"absolute", left:"-12%", top:"-8%", width:"55vw", height:"55vw",
          borderRadius:"50%", background:"radial-gradient(circle, rgba(0,194,168,0.13) 0%, rgba(0,194,168,0.05) 50%, transparent 75%)" }} />
        {/* Peach/rose orb — right */}
        <div style={{ position:"absolute", right:"-10%", top:"10%", width:"45vw", height:"45vw",
          borderRadius:"50%", background:"radial-gradient(circle, rgba(255,180,150,0.1) 0%, rgba(255,200,180,0.05) 50%, transparent 75%)" }} />
        {/* Bottom teal hint */}
        <div style={{ position:"absolute", left:"30%", bottom:"-5%", width:"40vw", height:"20vw",
          borderRadius:"50%", background:"radial-gradient(circle, rgba(0,194,168,0.06) 0%, transparent 70%)" }} />
        {/* Scattered teal dots — matching landing page */}
        {[
          [8,15],[18,72],[32,38],[45,8],[55,62],[68,28],[78,78],[88,18],[12,88],[42,52],
          [62,92],[82,42],[25,18],[72,68],[50,85],[90,55],[35,96],[15,48],[65,12],[95,80],
        ].map(([l,t],i) => (
          <div key={i} style={{ position:"absolute", left:`${l}%`, top:`${t}%`,
            width: i%3===0 ? 4 : 3, height: i%3===0 ? 4 : 3,
            borderRadius:"50%", background:"rgba(0,194,168,0.35)", opacity:0.6 }} />
        ))}
      </div>

      {/* Hidden inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" multiple className="hidden" onChange={(e) => handleFileSelect(e, "file")} />

      {/* ═══════════════════════════════════════════════════════════
          LEFT SIDEBAR — v2 redesign
      ══════════════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          "relative z-20 flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
          sidebarOpen ? "w-[240px]" : "w-0"
        )}
        style={{ background: "var(--sp-sidebar-bg)", borderRight: "1px solid var(--sp-sidebar-border)" }}
      >
        {/* ── Brand header ── */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
          <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#111827 0%,#1a2035 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
            <CadusLogo size="sm" thinking={false} baseUrl={import.meta.env.BASE_URL} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tracking-tight" style={{ color: "#0A0A0F", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cadus AI</p>
            <p className="text-[10px]" style={{ color: "rgba(0,0,0,0.38)" }}>Clinical Intelligence</p>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg transition-all hover:bg-black/5 shrink-0"
            style={{ color: "rgba(0,0,0,0.32)" }}>
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* ── New chat button ── */}
        <div className="px-3 pb-3 shrink-0">
          <button onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--sp-new-chat-bg)", border: "1px solid var(--sp-new-chat-border)", color: "var(--sp-new-chat-color)" }}>
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(0,0,0,0.28)" }} />
            <span className="text-xs" style={{ color: "rgba(0,0,0,0.28)" }}>Search chats…</span>
          </div>
        </div>

        {/* ── Nav ── */}
        <div className="px-2 pb-2 space-y-0.5 shrink-0">
          {[
            { id: "home" as const, icon: Home, label: "Home" },
            { id: "chats" as const, icon: MessageSquare, label: "All Chats" },
            { id: "models" as const, icon: Activity, label: "Models" },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setSidebarView(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all"
              style={{
                background: sidebarView === id ? "rgba(0,194,168,0.08)" : "transparent",
                color: sidebarView === id ? "#00C2A8" : "rgba(0,0,0,0.45)",
                borderLeft: sidebarView === id ? "2px solid #00C2A8" : "2px solid transparent",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="mx-3 my-1.5 shrink-0" style={{ borderTop: "1px solid var(--sp-divider)" }} />

        {/* ── Session history (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-2 min-h-0 cadus-sidebar-scroll">
          {sidebarView === "chats" && (
            <>
              {[
                { label: tr.today, list: todaySessions },
                { label: tr.yesterday, list: yesterdaySessions },
                { label: tr.older, list: olderSessions },
              ].map(({ label, list }) =>
                list.length > 0 ? (
                  <div key={label} className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5 pt-1"
                      style={{ color: "rgba(0,0,0,0.3)", letterSpacing:"0.1em" }}>{label}</p>
                    {list.map((sess) => {
                      const isActive = sess.id === activeSessionId;
                      return (
                        <div key={sess.id} role="button" tabIndex={0}
                          onClick={() => { setActiveSessionId(sess.id); setSidebarView("home"); }}
                          onKeyDown={(e) => e.key === "Enter" && setActiveSessionId(sess.id)}
                          className="group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all mb-0.5 cursor-pointer"
                          style={{
                            background: isActive ? "rgba(0,194,168,0.07)" : "transparent",
                            borderLeft: isActive ? "2px solid #00C2A8" : "2px solid transparent",
                          }}>
                          <MessageSquare className="w-3 h-3 shrink-0" style={{ color: isActive ? "#00C2A8" : "rgba(0,0,0,0.28)" }} />
                          <span className="text-[12px] truncate flex-1" style={{ color: isActive ? "#0A0A0F" : "rgba(0,0,0,0.5)" }}>{sess.title}</span>
                          <button onClick={(e) => handleDeleteSession(sess.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                            style={{ color: "rgba(220,50,50,0.5)" }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null
              )}
              {sessions.every(s => s.messages.length === 0) && (
                <p className="text-xs text-center px-2 py-6" style={{ color: "rgba(0,0,0,0.22)" }}>{tr.noChatsYet}</p>
              )}
            </>
          )}
          {sidebarView === "models" && (
            <div className="pt-1 space-y-1.5">
              {MODELS.map((m) => {
                const MI = m.icon;
                const isActive = m.id === activeModel;
                return (
                  <button key={m.id} onClick={() => handleModelSelect(m)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all"
                    style={isActive
                      ? { ...m.activeStyle, borderRadius: 12 }
                      : { color: "rgba(0,0,0,0.52)", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: isActive ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.05)" }}>
                      {m.pro && !isActive ? <Lock className="w-3.5 h-3.5" style={{ color: "rgba(109,40,217,0.65)" }} /> : <MI className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{m.name}</div>
                      <div className="text-[10px] opacity-50 truncate">{m.description.split(" · ")[0]}</div>
                    </div>
                    {m.pro && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(109,40,217,0.12)", color: "rgba(109,40,217,0.9)", border: "1px solid rgba(109,40,217,0.2)" }}>PRO</span>}
                  </button>
                );
              })}
            </div>
          )}
          {sidebarView === "home" && sessions.some(s => s.messages.length > 0) && (
            <div className="pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5"
                style={{ color: "rgba(0,0,0,0.3)", letterSpacing:"0.12em" }}>Recent</p>
              {sessions.filter(s => s.messages.length > 0).slice(0, 10).map(sess => {
                const isActive = sess.id === activeSessionId;
                return (
                  <button key={sess.id} onClick={() => setActiveSessionId(sess.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all mb-0.5"
                    style={{
                      background: isActive ? "rgba(0,194,168,0.07)" : "transparent",
                      color: isActive ? "#0A0A0F" : "rgba(0,0,0,0.45)",
                      borderLeft: isActive ? "2px solid #00C2A8" : "2px solid transparent",
                    }}>
                    <MessageSquare className="w-3 h-3 shrink-0" style={{ color: isActive ? "#00C2A8" : "rgba(0,0,0,0.25)" }} />
                    <span className="truncate">{sess.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mx-3 my-1.5 shrink-0" style={{ borderTop: "1px solid var(--sp-divider)" }} />

        {/* ── Pro upgrade card ── */}
        <div className="mx-3 mb-3 shrink-0 rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(109,40,217,0.05) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="px-3.5 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}>
                <Crown className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[12px] font-bold" style={{ color: "rgba(90,40,180,0.95)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Cadus Magnus</span>
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(109,40,217,0.12)", color: "rgba(109,40,217,0.9)", border: "1px solid rgba(109,40,217,0.2)" }}>PRO</span>
            </div>
            <p className="text-[10px] leading-relaxed mb-2.5" style={{ color: "rgba(0,0,0,0.42)" }}>
              Unlock advanced diagnosis, deep research &amp; image analysis.
            </p>
            <button onClick={() => setShowProModal(true)}
              className="w-full text-[11px] font-bold py-2 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
              <Crown className="w-3.5 h-3.5" /> View Plans
            </button>
          </div>
        </div>

        {/* ── Footer links ── */}
        <div className="px-2 pb-4 space-y-0.5 shrink-0">
          {[
            { icon: BookOpen, label: "Learn", onClick: undefined as (() => void) | undefined },
            { icon: FileText, label: "Documentation", onClick: undefined },
            { icon: Crown, label: "Refer & Earn", onClick: () => setShowProModal(true) },
          ].map(({ icon: Icon, label, onClick }) => (
            <button key={label} onClick={onClick}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:bg-black/5"
              style={{ color: "rgba(0,0,0,0.35)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-0 relative">

        {/* ── Persistent top bar ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 relative z-10"
          style={{ borderBottom: "1px solid var(--sp-sidebar-border)", background: "var(--sp-topbar-bg)" }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg transition-all hover:bg-black/5 shrink-0"
              style={{ color: "rgba(0,0,0,0.35)" }}>
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          {!sidebarOpen && (
            <div className="flex items-center gap-2 shrink-0">
              <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#111827 0%,#1a2035 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 6px rgba(0,0,0,0.18)" }}>
                <CadusLogo size="sm" thinking={false} baseUrl={import.meta.env.BASE_URL} />
              </div>
              <span className="text-sm font-bold" style={{ color: "#0A0A0F", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Cadus AI</span>
            </div>
          )}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {hasMessages && (
              <span className="text-sm truncate" style={{ color: "rgba(0,0,0,0.45)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                {activeSession?.title ?? "New chat"}
              </span>
            )}
          </div>
          {/* Model pill */}
          <div className="relative shrink-0" ref={modelPickerRef}>
            <button type="button" onClick={() => setShowModelPicker(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: showModelPicker ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.04)", color: model.activeStyle.color, border: "1px solid rgba(0,0,0,0.09)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
              <ModelIcon className="w-3.5 h-3.5" />
              <span>{model.name}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            {showModelPicker && (
              <div className="absolute top-full right-0 mt-1.5 rounded-2xl shadow-xl overflow-hidden z-50 w-60"
                style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.1)", boxShadow:"0 8px 40px rgba(0,0,0,0.12)" }}>
                <div className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(0,0,0,0.28)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>AI Models</div>
                {MODELS.map((m) => {
                  const MI = m.icon;
                  const isAct = m.id === activeModel;
                  return (
                    <button key={m.id} type="button"
                      onClick={() => { setShowModelPicker(false); handleModelSelect(m); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-all hover:bg-black/4"
                      style={{ background: isAct ? "rgba(0,194,168,0.05)" : "transparent" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isAct ? m.activeStyle.background : "rgba(0,0,0,0.04)", border: isAct ? m.activeStyle.border : "1px solid rgba(0,0,0,0.07)" }}>
                        {m.pro && !isAct ? <Lock className="w-3.5 h-3.5" style={{ color: "rgba(109,40,217,0.65)" }} /> : <MI className="w-3.5 h-3.5" style={{ color: isAct ? m.activeStyle.color : "rgba(0,0,0,0.42)" }} />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: isAct ? m.activeStyle.color : "#0A0A0F", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                          {m.name}
                          {m.pro && <span className="text-[8px] font-bold px-1 py-0.5 rounded-full" style={{ background: "rgba(109,40,217,0.1)", color: "rgba(109,40,217,0.85)" }}>PRO</span>}
                        </div>
                        <div className="text-[10px] opacity-40 truncate" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{m.description.split(" · ")[0]}</div>
                      </div>
                      {isAct && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.activeStyle.color }} />}
                    </button>
                  );
                })}
                <div className="px-4 py-2.5 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                  <button onClick={() => { setShowModelPicker(false); setShowProModal(true); }}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(147,51,234,0.08))", color: "rgba(109,40,217,0.9)", border: "1px solid rgba(139,92,246,0.2)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    <Crown className="w-3.5 h-3.5" /> Unlock Cadus Magnus
                  </button>
                </div>
              </div>
            )}
          </div>
          {showBanner && !hasMessages && (
            <button onClick={() => setShowProModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.1),rgba(147,51,234,0.08))", color: "rgba(109,40,217,0.9)", border: "1px solid rgba(139,92,246,0.2)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
              <Crown className="w-3 h-3" /> Upgrade
            </button>
          )}
        </div>

        {/* ── HOME VIEW — v2 ── */}
        {!hasMessages && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center pt-12 pb-8 px-4">

            {/* Logo + greeting hero */}
            <div className="flex flex-col items-center mb-8">
              <div className="mb-5 relative">
                <div style={{ position:"absolute", inset:-28, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,194,168,0.18) 0%, transparent 70%)", pointerEvents:"none" }} />
                <div style={{ width:104, height:104, borderRadius:28, background:"linear-gradient(145deg,#0d1117 0%,#1a2035 60%,#111c2e 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 40px rgba(0,194,168,0.25), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.07)", border:"1px solid rgba(0,194,168,0.2)" }}>
                  <CadusLogo size="md" thinking={false} baseUrl={import.meta.env.BASE_URL} />
                </div>
              </div>
              <h1 className="text-[1.8rem] font-bold text-center leading-tight mb-2"
                style={{ color: "#0A0A0F", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                {greeting}{greetingName}.
              </h1>
              <p className="text-base text-center" style={{ color: "rgba(0,0,0,0.42)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                What would you like to explore today?
              </p>
            </div>

            {/* ── Stats trust bar ── */}
            <div className="flex items-center gap-4 mb-7 flex-wrap justify-center">
              {[
                { icon: "🏥", label: "10,000+ Clinicians" },
                { icon: "📚", label: "200+ Medical Topics" },
                { icon: "⚡", label: "NEET PG Ready" },
                { icon: "🔒", label: "HIPAA-Aligned" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.45)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>

            {/* ── INPUT FORM (Replit-style) ── */}
            <div className="w-full max-w-2xl mb-5">
              {isProLocked ? (
                <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.09)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                      <Lock className="w-4 h-4" style={{ color: "rgba(0,0,0,0.45)" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#0A0A0F", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{tr.proRequired}</p>
                      <p className="text-xs" style={{ color: "rgba(0,0,0,0.42)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{tr.proGatedMsg}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProModal(true)}
                    className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm whitespace-nowrap"
                    style={{ background: "#7c3aed", color: "#fff", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    <Crown className="w-4 h-4" /> {tr.upgradePro}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-2xl overflow-visible"
                  style={{ background: "var(--sp-input-bg)", border: "1px solid var(--sp-input-border)", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)" }}>
                  {chatMode !== "normal" && (
                    <div className="flex items-center gap-2 px-4 py-2 border-b text-xs font-semibold"
                      style={{ borderColor: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.6)", background: "rgba(0,194,168,0.03)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                      {chatMode === "deep-research"        ? <><Microscope    className="w-3.5 h-3.5" style={{color:"#34D399"}} /> Deep Research Mode</>
                      : chatMode === "create-presentation" ? <><Presentation  className="w-3.5 h-3.5" style={{color:"#FBBF24"}} /> {presentationStage === "idle" ? "Slides Mode" : tr.selectSlideCountAbove}</>
                      : chatMode === "create-image"        ? <><ImagePlus     className="w-3.5 h-3.5" style={{color:"#F472B6"}} /> {imageStage === "waiting-type" ? tr.selectSlideCountAbove : "Image Mode"}</>
                      : chatMode === "drug-interactions"   ? <><Pill          className="w-3.5 h-3.5" style={{color:"#F87171"}} /> Drug Interaction Checker</>
                      : chatMode === "dosage-calc"         ? <><Calculator    className="w-3.5 h-3.5" style={{color:"#FB923C"}} /> Dosage Calculator</>
                      : chatMode === "lab-values"          ? <><TestTube2     className="w-3.5 h-3.5" style={{color:"#4ADE80"}} /> Lab Values Interpreter</>
                      : chatMode === "soap-note"           ? <><ClipboardList className="w-3.5 h-3.5" style={{color:"#38BDF8"}} /> SOAP Note Generator</>
                      : chatMode === "mcq-gen"             ? <><HelpCircle   className="w-3.5 h-3.5" style={{color:"#C084FC"}} /> MCQ / Exam Prep Generator</>
                      : chatMode === "patient-edu"         ? <><Languages    className="w-3.5 h-3.5" style={{color:"#FB7185"}} /> Patient Education Mode</>
                      : chatMode === "procedure-guide"     ? <><Zap          className="w-3.5 h-3.5" style={{color:"#FDE047"}} /> Procedure Guide</>
                      : chatMode === "ddx"                 ? <><Brain        className="w-3.5 h-3.5" style={{color:"#A78BFA"}} /> Differential Diagnosis Generator</>
                      : chatMode === "image-analysis"      ? <><Microscope  className="w-3.5 h-3.5" style={{color:"#2DD4BF"}} /> Medical Scan Analysis (Pro)</>
                      : null}
                      {specialty !== "General" && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(0,122,255,0.1)", color: "rgba(0,100,220,0.85)" }}>
                          {specialty}
                        </span>
                      )}
                      <button type="button" onClick={() => toggleMode(chatMode)} className="ml-auto hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  {attachments.length > 0 && (
                    <div className="flex gap-2 px-4 pt-3 flex-wrap">
                      {attachments.map((a) => (
                        <div key={a.id} className="relative group flex items-center gap-2 rounded-xl px-3 py-2 text-xs max-w-[160px]"
                          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.09)", color: "rgba(0,0,0,0.72)" }}>
                          {a.type === "image" && a.previewUrl
                            ? <img src={a.previewUrl} alt={a.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            : <FileText className="w-5 h-5 shrink-0" style={{ color: "rgba(0,0,0,0.42)" }} />}
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-tight">{a.name}</p>
                            <p style={{ color: "rgba(0,0,0,0.32)" }}>{a.size}</p>
                          </div>
                          <button type="button" onClick={() => removeAttachment(a.id)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full items-center justify-center hidden group-hover:flex"
                            style={{ background: "rgba(200,50,50,0.8)", color: "white" }}>
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                    placeholder={
                      chatMode === "create-image"        ? tr.describeImagePlaceholder
                      : chatMode === "deep-research"     ? tr.researchTopicPlaceholder
                      : chatMode === "create-presentation" && presentationStage === "idle" ? tr.presentationTopicPlaceholder
                      : chatMode === "create-presentation" && presentationStage === "waiting-slide-count" ? tr.selectSlidesPlaceholder
                      : chatMode === "drug-interactions" ? "Enter drug names, e.g. 'Warfarin + Aspirin + Metformin'..."
                      : chatMode === "dosage-calc"       ? "Enter drug + patient details, e.g. 'Gentamicin, 60kg male, eGFR 45'..."
                      : chatMode === "lab-values"        ? "Paste lab results, e.g. 'Hb 8.2, WBC 12000, Platelets 95000, ALT 120...'..."
                      : chatMode === "soap-note"         ? "Describe the clinical encounter in free text — Cadus AI will structure it as a SOAP note..."
                      : chatMode === "mcq-gen"           ? "Enter a topic for NEET-PG / USMLE questions, e.g. 'Myocardial Infarction'..."
                      : chatMode === "patient-edu"       ? "Enter the diagnosis/condition to explain to a patient in simple language..."
                      : chatMode === "procedure-guide"   ? "Enter a procedure name, e.g. 'Central venous catheter insertion'..."
                      : chatMode === "ddx"               ? "Describe symptoms, vitals, history — Cadus AI will generate a ranked DDx with ICD-10 codes..."
                      : chatMode === "image-analysis"    ? "Attach an X-ray, ECG, CT, MRI, or fundus image — then ask a question or just press Send to get a full report..."
                      : "Describe your clinical question, Cadus AI will bring it to life..."
                    }
                    rows={2}
                    className="w-full px-5 pt-4 pb-2 text-[15px] bg-transparent focus:outline-none resize-none cadus-textarea"
                    style={{ color: "var(--sp-textarea-color)", caretColor: "var(--sp-caret-color)", minHeight: "72px", maxHeight: "180px" }}
                    disabled={chatMutation.isPending || isGeneratingPresentation || presentationStage === "waiting-slide-count"}
                  />
                  <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
                    <div className="flex items-center gap-1">
                      <div className="relative" ref={attachMenuRef}>
                        <button type="button" onClick={() => setShowAttachMenu((v) => !v)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ color: showAttachMenu ? "#0A0A0F" : "rgba(0,0,0,0.38)" }}>
                          <Plus className="w-4 h-4" />
                        </button>
                        {showAttachMenu && (
                          <div className="absolute bottom-full left-0 mb-2 rounded-xl shadow-lg overflow-hidden w-52 z-30"
                            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.1)", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}>
                            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.28)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{tr.attach}</div>
                            {[
                              { label: tr.uploadImage, sub: tr.uploadImageFormats, icon: Image, action: () => imageInputRef.current?.click() },
                              { label: tr.uploadDocument, sub: tr.uploadDocumentFormats, icon: FileText, action: () => fileInputRef.current?.click() },
                              { label: tr.takePhoto, sub: tr.useCamera, icon: Camera, action: () => { setShowAttachMenu(false); setShowCamera(true); } },
                            ].map(({ label, sub, icon: Icon, action }) => (
                              <button key={label} type="button" onClick={action}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors hover:bg-black/4"
                                style={{ color: "rgba(0,0,0,0.75)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                                  <Icon className="w-4 h-4" style={{ color: "rgba(0,0,0,0.52)" }} />
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold leading-tight">{label}</p>
                                  <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{sub}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {voiceSupported && (
                        <button type="button"
                          onClick={toggleVoiceInput}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                          title={isListening ? "Stop voice input" : "Voice input (en-IN)"}
                          style={{ background: isListening ? "rgba(248,113,113,0.12)" : "rgba(0,0,0,0.05)", color: isListening ? "#EF4444" : "rgba(0,0,0,0.42)", border: isListening ? "1px solid rgba(248,113,113,0.35)" : "1px solid transparent", animation: isListening ? "cadus-spot-breathe 1.2s ease-in-out infinite" : "none" }}>
                          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button type="submit"
                        disabled={(!input.trim() && attachments.length === 0) || chatMutation.isPending || isGeneratingImage || isGeneratingPresentation || isAnalyzingImage || presentationStage === "waiting-slide-count" || imageStage === "waiting-type"}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                        style={{ background: "#00C2A8" }}>
                        {isAnalyzingImage ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* ── Specialty selector ── */}
            {!isProLocked && (
              <div className="w-full max-w-2xl mb-5">
                <div className="flex gap-2 overflow-x-auto cadus-tool-scroll pb-1">
                  {(["All", "Internal Med", "Cardiology", "Emergency", "Pharmacology", "Surgery", "Pediatrics", "NEET PG"] as HomeSpecialty[]).map((sp) => {
                    const isAct = homeSpecialty === sp;
                    const spColors: Record<string, string> = {
                      "All": "#00C2A8", "Internal Med": "#60A5FA", "Cardiology": "#F87171",
                      "Emergency": "#FB923C", "Pharmacology": "#A78BFA", "Surgery": "#4ADE80",
                      "Pediatrics": "#F472B6", "NEET PG": "#FBBF24",
                    };
                    const c = spColors[sp];
                    return (
                      <button key={sp} onClick={() => setHomeSpecialty(sp)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 whitespace-nowrap"
                        style={{
                          background: isAct ? c : "rgba(0,0,0,0.04)",
                          color: isAct ? "#fff" : "rgba(0,0,0,0.45)",
                          border: isAct ? `1px solid ${c}` : "1px solid rgba(0,0,0,0.08)",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          boxShadow: isAct ? `0 2px 8px ${c}40` : "none",
                        }}>
                        {sp}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Feature card grid ── */}
            {!isProLocked && (
              <div className="w-full max-w-2xl mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: "rgba(0,0,0,0.28)", fontFamily:"'Plus Jakarta Sans', sans-serif", letterSpacing:"0.12em" }}>Clinical Tools</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {([
                    { icon: Stethoscope,   label: "Diagnose",          desc: "Symptom analysis & clinical reasoning",   mode: "normal" as ChatMode,             color: "#00C2A8", bg: "rgba(0,194,168,0.07)" },
                    { icon: Brain,         label: "DDx Generator",     desc: "Differential diagnosis with evidence",    mode: "ddx" as ChatMode,                color: "#A78BFA", bg: "rgba(167,139,250,0.07)" },
                    { icon: Search,        label: "Deep Research",     desc: "Evidence-based medical literature",       mode: "deep-research" as ChatMode,      color: "#34D399", bg: "rgba(52,211,153,0.07)" },
                    { icon: Pill,          label: "Drug Checker",      desc: "Interactions, dosage & safety",          mode: "drug-interactions" as ChatMode,   color: "#F87171", bg: "rgba(248,113,113,0.07)" },
                    { icon: Calculator,    label: "Dosage Calc",       desc: "Weight-based & renal dose adjustment",   mode: "dosage-calc" as ChatMode,         color: "#FB923C", bg: "rgba(251,146,60,0.07)" },
                    { icon: TestTube2,     label: "Lab Interpreter",   desc: "CBC, LFT, RFT, ABG, coagulation",       mode: "lab-values" as ChatMode,          color: "#4ADE80", bg: "rgba(74,222,128,0.07)" },
                    { icon: ClipboardList, label: "SOAP Notes",        desc: "Clinical documentation & discharge",     mode: "soap-note" as ChatMode,           color: "#38BDF8", bg: "rgba(56,189,248,0.07)" },
                    { icon: HelpCircle,    label: "MCQ / NEET PG",    desc: "Question bank & exam explanations",      mode: "mcq-gen" as ChatMode,             color: "#C084FC", bg: "rgba(192,132,252,0.07)" },
                    { icon: Zap,           label: "Procedure Guide",   desc: "Step-by-step clinical procedures",       mode: "procedure-guide" as ChatMode,     color: "#FDE047", bg: "rgba(253,224,71,0.07)" },
                    { icon: Languages,     label: "Patient Edu",       desc: "Simplified patient instructions",        mode: "patient-edu" as ChatMode,         color: "#FB7185", bg: "rgba(251,113,133,0.07)" },
                    { icon: Presentation,  label: "Make Slides",       desc: "Clinical presentations & cases",         mode: "create-presentation" as ChatMode, color: "#FBBF24", bg: "rgba(251,191,36,0.07)" },
                    { icon: Microscope,    label: "Scan Analysis",     desc: "Radiology & pathology AI reading",       mode: "image-analysis" as ChatMode,      color: "#2DD4BF", bg: "rgba(45,212,191,0.07)", pro: true },
                  ]).map(({ icon: Icon, label, desc, mode, color, bg, pro: isPro }) => {
                    const isAct = chatMode === mode && mode !== "normal";
                    return (
                      <button key={label}
                        onClick={() => { if (isPro) { setShowProModal(true); return; } toggleMode(mode); }}
                        className="relative group flex flex-col items-start gap-2.5 p-3.5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-100"
                        style={{
                          background: isAct ? bg : "#FFFFFF",
                          border: isAct ? `1.5px solid ${color}60` : "1px solid rgba(0,0,0,0.07)",
                          boxShadow: isAct ? `0 2px 12px ${color}20` : "0 1px 3px rgba(0,0,0,0.04)",
                        }}>
                        {isPro && (
                          <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(109,40,217,0.1)", color: "rgba(109,40,217,0.85)", border:"1px solid rgba(109,40,217,0.18)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                            PRO
                          </span>
                        )}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: bg }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold leading-tight mb-0.5"
                            style={{ color: isAct ? color : "#0A0A0F", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                            {label}
                          </p>
                          <p className="text-[9px] leading-relaxed"
                            style={{ color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                            {desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Pinned prompts ── */}
            {!isProLocked && pinnedPrompts.length > 0 && (
              <div className="w-full max-w-2xl mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: "rgba(217,119,6,0.7)" }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.4)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Pinned Prompts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pinnedPrompts.map((q) => (
                    <div key={q} className="flex items-center gap-1">
                      <button type="button" onClick={() => setInput(q)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ background: "rgba(217,119,6,0.07)", border: "1px solid rgba(217,119,6,0.2)", color: "rgba(161,86,4,0.9)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                        {q}
                      </button>
                      <button type="button" onClick={() => handleTogglePin(q)}
                        className="p-0.5 rounded hover:bg-black/5"
                        style={{ color: "rgba(217,119,6,0.5)" }} title="Unpin">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Specialty-filtered prompts ── */}
            {!isProLocked && (
              <div className="w-full max-w-2xl mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "rgba(0,0,0,0.28)", letterSpacing:"0.12em", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    {homeSpecialty === "All" ? "Try a Prompt" : `${homeSpecialty} Prompts`}
                  </span>
                  <button
                    onClick={() => {
                      const keys = Object.keys(SPECIALTY_PROMPTS) as HomeSpecialty[];
                      setHomeSpecialty(keys[(keys.indexOf(homeSpecialty) + 1) % keys.length]);
                    }}
                    className="flex items-center gap-1 text-[11px] transition-all hover:opacity-70"
                    style={{ color: "#00C2A8", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    <RefreshCw className="w-3 h-3" /> Switch specialty
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {SPECIALTY_PROMPTS[homeSpecialty].map((q) => (
                    <div key={q} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-black/[0.03]">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#00C2A8", opacity: 0.55 }} />
                      <button type="button" onClick={() => sendDirect(q)}
                        className="flex-1 text-left text-sm transition-all hover:opacity-70"
                        style={{ color: "rgba(0,0,0,0.6)", fontFamily:"'Plus Jakarta Sans', sans-serif", lineHeight: 1.4 }}>
                        {q}
                      </button>
                      <button type="button" onClick={() => handleTogglePin(q)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                        title={pinnedPrompts.includes(q) ? "Unpin" : "Pin prompt"}
                        style={{ color: pinnedPrompts.includes(q) ? "rgba(217,119,6,0.9)" : "rgba(0,0,0,0.28)" }}>
                        <Tag className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Pro locked message ── */}
            {isProLocked && (
              <div className="max-w-md text-center px-4 mb-8">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(109,40,217,0.08)", border: "1px solid rgba(109,40,217,0.18)" }}>
                  <Crown className="w-6 h-6" style={{ color: "rgba(109,40,217,0.7)" }} />
                </div>
                <p className="text-base leading-relaxed" style={{ color: "rgba(0,0,0,0.45)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{modelGreetings.nova46}</p>
                <button onClick={() => setShowProModal(true)}
                  className="mt-4 flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: "#7c3aed", color: "#fff", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  <Crown className="w-4 h-4" /> {tr.upgradePro}
                </button>
              </div>
            )}

            {/* ── Recent chats (list style) ── */}
            {sessions.some(s => s.messages.length > 0) && (
              <div className="w-full max-w-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.28)", letterSpacing:"0.12em", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Recent chats</span>
                  <button onClick={() => setSidebarView("chats")}
                    className="text-xs flex items-center gap-1 transition-all hover:opacity-70"
                    style={{ color: "#00C2A8", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {sessions.filter(s => s.messages.length > 0).slice(0, 5).map((sess) => {
                    const sm = MODELS.find((m) => m.id === sess.modelId)!;
                    const SMIcon = sm?.icon ?? Activity;
                    return (
                      <div key={sess.id}
                        role="button" tabIndex={0}
                        onClick={() => setActiveSessionId(sess.id)}
                        onKeyDown={(e) => e.key === "Enter" && setActiveSessionId(sess.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-black/4"
                        style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#FFFFFF" }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(0,0,0,0.05)" }}>
                          <SMIcon className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.38)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: "#0A0A0F", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{sess.title}</p>
                          <p className="text-[10px] truncate" style={{ color: "rgba(0,0,0,0.35)" }}>
                            {sess.messages[0]?.content?.slice(0, 55) ?? "No messages yet"}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(0,0,0,0.2)" }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CHAT VIEW (has messages) ── */}
        {hasMessages && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5 min-h-full">

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3",
                      msg.role === ChatMessageRole.user
                        ? "self-end flex-row-reverse max-w-[85%]"
                        : "self-start max-w-[92%] w-full"
                    )}
                    style={{ animation: "tw-bubble-in 0.28s ease-out both", animationDelay: `${isMsgNew(idx) ? 0 : 0}ms` }}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                      msg.role === ChatMessageRole.user
                        ? "overflow-hidden"
                        : "overflow-hidden"
                    )}
                      style={msg.role === ChatMessageRole.user
                        ? { background: "rgba(0,122,255,0.1)", border: "1px solid rgba(0,122,255,0.2)" }
                        : undefined}
                    >
                      {msg.role === ChatMessageRole.user
                        ? <User className="w-4 h-4" style={{ color: "rgba(0,100,210,0.7)" }} />
                        : <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#111827 0%,#1a2035 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><CadusLogo size="sm" thinking={false} baseUrl={import.meta.env.BASE_URL} /></div>
                      }
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn("rounded-2xl shadow-sm overflow-hidden",
                        msg.role === ChatMessageRole.user ? "rounded-tr-sm" : "rounded-tl-sm"
                      )}
                      style={msg.role === ChatMessageRole.user
                        ? { background: "var(--sp-user-bubble-bg)", border: "1px solid var(--sp-user-bubble-border)", color: "var(--sp-user-text)" }
                        : { background: "var(--sp-ai-bubble-bg)", borderTop: "1px solid var(--sp-ai-bubble-border)", borderRight: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)", borderLeft: "2px solid rgba(0,194,168,0.45)", color: "var(--sp-ai-text)" }
                      }
                    >
                      {!(msg as ExtendedMessage).isDeepResearch && !(msg as ExtendedMessage).isPresentation && !(msg as ExtendedMessage).slideCountOptions && !(msg as ExtendedMessage).imageUrl && !(msg as ExtendedMessage).isImageTypeSelection && msg.content && (
                        <div>
                          <div className="px-5 py-4 text-[14px] leading-relaxed">
                            <TypewriterText
                              text={msg.content}
                              isNew={isMsgNew(idx)}
                              onDone={() => markMsgSeen(idx)}
                              onScroll={scrollToBottom}
                            />
                          </div>
                          {msg.role === ChatMessageRole.assistant && (
                            <div className="flex items-center gap-2 px-4 pb-3">
                              <button type="button"
                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all hover:bg-black/5"
                                style={{ color: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,0,0,0.08)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                                <RefreshCw className="w-3 h-3" /> Copy
                              </button>
                              <button type="button"
                                onClick={() => handleDownloadPdf(msg.content, String(idx))}
                                disabled={isExportingPdf === String(idx)}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all hover:bg-black/5"
                                style={{ color: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,0,0,0.08)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                                {isExportingPdf === String(idx) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                {isExportingPdf === String(idx) ? "Generating..." : "Export PDF"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {(msg as ExtendedMessage).isDeepResearch && (msg as ExtendedMessage).researchReport && (
                        <div>
                          <ResearchReportCard
                            report={(msg as ExtendedMessage).researchReport!}
                            sources={(msg as ExtendedMessage).researchSources ?? []}
                            queries={(msg as ExtendedMessage).researchQueries ?? []}
                            hasGoogleSearch={(msg as ExtendedMessage).hasGoogleSearch ?? false}
                          />
                          <div className="flex items-center gap-2 px-4 py-3">
                            <button type="button"
                              onClick={() => navigator.clipboard.writeText((msg as ExtendedMessage).researchReport!)}
                              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all hover:bg-black/5"
                              style={{ color: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,0,0,0.08)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                              <RefreshCw className="w-3 h-3" /> Copy Report
                            </button>
                            <button type="button"
                              onClick={() => handleDownloadPdf((msg as ExtendedMessage).researchReport!, String(idx))}
                              disabled={isExportingPdf === String(idx)}
                              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all hover:bg-black/5"
                              style={{ color: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,0,0,0.08)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                              {isExportingPdf === String(idx) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                              {isExportingPdf === String(idx) ? "Generating..." : "Export PDF"}
                            </button>
                          </div>
                        </div>
                      )}
                      {(msg as ExtendedMessage).imageUrl && (
                        <div className="px-4 pb-4 pt-2">
                          {msg.content && <div className="px-1 pb-3 text-[14px]">{msg.content}</div>}
                          <ImageMessageCard
                            imageUrl={(msg as ExtendedMessage).imageUrl!}
                            prompt={pendingImagePrompt || "anatomical illustration"}
                            onZoom={setZoomedImageUrl}
                            downloadLabel={tr.downloadImage}
                          />
                        </div>
                      )}
                      {(msg as ExtendedMessage).isImageTypeSelection && (
                        <div className="px-4 pb-4 pt-2">
                          {msg.content && <div className="px-1 pb-3 text-[14px]">{msg.content}</div>}
                          <div className="flex flex-wrap gap-2.5">
                            {/* Simple Image */}
                            <button type="button" onClick={() => handleImageTypeSelect("simple")}
                              disabled={isGeneratingImage}
                              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 hover:scale-[1.03]"
                              style={{ background: "rgba(0,180,220,0.18)", border: "1px solid rgba(0,229,255,0.4)", color: "#00e5ff" }}>
                              <ImagePlus className="w-4 h-4" /> {tr.simpleImage}
                            </button>
                            {/* Diagram */}
                            <button type="button" onClick={() => handleImageTypeSelect("diagram")}
                              disabled={isGeneratingImage}
                              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 hover:scale-[1.03]"
                              style={{ background: "rgba(130,0,220,0.18)", border: "1px solid rgba(168,85,247,0.5)", color: "#c084fc" }}>
                              <Tag className="w-4 h-4" /> {tr.diagram ?? "Diagram"}
                            </button>
                            {/* Real Image */}
                            <button type="button" onClick={() => handleImageTypeSelect("real")}
                              disabled={isGeneratingImage}
                              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 hover:scale-[1.03]"
                              style={{ background: "rgba(20,160,80,0.18)", border: "1px solid rgba(52,211,153,0.45)", color: "#34d399" }}>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"/><path d="M6.3 6.3A8 8 0 1 0 17.7 17.7"/><path d="M6 2v4h4"/><path d="M18 22v-4h-4"/>
                              </svg>
                              {tr.realImage ?? "Real Image"}
                            </button>
                            {/* Real Image + Labels */}
                            <button type="button" onClick={() => handleImageTypeSelect("real-labeled")}
                              disabled={isGeneratingImage}
                              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 hover:scale-[1.03]"
                              style={{ background: "rgba(220,120,0,0.18)", border: "1px solid rgba(251,146,60,0.45)", color: "#fb923c" }}>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h4M7 11h2"/>
                              </svg>
                              {tr.realImageLabeled ?? "Real Image + Labels"}
                            </button>
                          </div>
                        </div>
                      )}
                      {(msg as ExtendedMessage).isResearchTypeSelection && (
                        <div className="px-4 pb-4 pt-2">
                          {msg.content && <div className="px-1 pb-3 text-[14px]">{msg.content}</div>}
                          <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => handleResearchTypeSelect("quick")}
                              disabled={isGeneratingResearch}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                              style={{ background: "rgba(0,180,100,0.18)", border: "1px solid rgba(52,211,153,0.45)", color: "#34D399" }}>
                              <Search className="w-4 h-4" /> {tr.quickSummary ?? "Quick Summary"}
                            </button>
                            <button type="button" onClick={() => handleResearchTypeSelect("full")}
                              disabled={isGeneratingResearch}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                              style={{ background: "rgba(130,0,220,0.18)", border: "1px solid rgba(168,85,247,0.5)", color: "#c084fc" }}>
                              <Microscope className="w-4 h-4" /> {tr.fullDeepResearch ?? "Full Deep Research"}
                            </button>
                          </div>
                        </div>
                      )}
                      {(msg as ExtendedMessage).slideCountOptions && (
                        <div className="px-4 pb-4 pt-2">
                          {msg.content && <div className="px-1 pb-3 text-[14px]">{msg.content}</div>}
                          <div className="flex flex-wrap gap-2">
                            {(msg as ExtendedMessage).slideCountOptions!.map((n) => (
                              <button key={n} type="button" onClick={() => handleSlideCountSelect(n)}
                                disabled={isGeneratingPresentation}
                                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                style={{ background: "rgba(180,120,0,0.25)", border: "1px solid rgba(251,191,36,0.4)", color: "#fcd34d" }}>
                                {n} {tr.slides}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {(msg as ExtendedMessage).isPresentation && (
                        <div className="px-4 pb-4 pt-2">
                          {msg.content && <div className="px-1 pb-3 text-[14px]">{msg.content}</div>}
                          <div className="flex flex-wrap gap-2">
                            {(msg as ExtendedMessage).presentationData && (
                              <button type="button"
                                onClick={() => setActivePresentationData((msg as ExtendedMessage).presentationData as any)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                style={{ background: "rgba(16,185,129,0.25)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }}>
                                <PlayCircle className="w-4 h-4" /> {tr.openPresentation}
                              </button>
                            )}
                            {(msg as ExtendedMessage).presentationPdfBase64 && (
                              <a href={`data:application/pdf;base64,${(msg as ExtendedMessage).presentationPdfBase64}`}
                                download={`${(msg as ExtendedMessage).presentationTitle ?? "presentation"}.pdf`}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}>
                                <Download className="w-4 h-4" /> PDF
                              </a>
                            )}
                            {(msg as ExtendedMessage).presentationDocxBase64 && (
                              <a href={`data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${(msg as ExtendedMessage).presentationDocxBase64}`}
                                download={`${(msg as ExtendedMessage).presentationTitle ?? "presentation"}.pptx`}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa" }}>
                                <Download className="w-4 h-4" /> PPTX
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Image generating animation */}
                {isGeneratingImage && (
                  <div className="flex gap-3 self-start max-w-[92%]">
                    <div className="shrink-0 mt-1" style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#111827 0%,#1a2035 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
                      <CadusLogo size="sm" thinking baseUrl={import.meta.env.BASE_URL} />
                    </div>
                    <ImageGeneratingAnimation prompt={pendingImagePrompt} />
                  </div>
                )}

                {/* Typing indicator */}
                {(chatMutation.isPending || isGeneratingResearch) && (
                  <div className="flex gap-3 self-start max-w-[92%]" style={{ animation: "tw-bubble-in 0.22s ease-out both" }}>
                    <div className="shrink-0 mt-0.5" style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#111827 0%,#1a2035 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
                      <CadusLogo size="sm" thinking baseUrl={import.meta.env.BASE_URL} />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-3"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderLeft: "2px solid rgba(0,194,168,0.45)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      }}>
                      {isGeneratingResearch ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: "#00C2A8" }} />
                          <span className="text-sm" style={{ color: "rgba(0,0,0,0.5)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{tr.researching}</span>
                        </>
                      ) : (
                        <>
                          {[0, 1, 2].map(i => (
                            <span
                              key={i}
                              className="rounded-full"
                              style={{
                                width: 6, height: 6,
                                background: i === 0
                                  ? "#00C2A8"
                                  : i === 1 ? "#007AFF" : "rgba(0,194,168,0.5)",
                                animation: "tw-dot-bounce 1.2s ease-in-out infinite",
                                animationDelay: `${i * 0.18}s`,
                              }}
                            />
                          ))}
                          <ThinkingTextRotator chatMode={chatMode} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Presentation building */}
                {isGeneratingPresentation && (
                  <div className="flex gap-3 self-start max-w-[95%] w-full">
                    <div className="shrink-0 mt-1" style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#111827 0%,#1a2035 100%)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
                      <CadusLogo size="sm" thinking baseUrl={import.meta.env.BASE_URL} />
                    </div>
                    <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm overflow-hidden"
                      style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", borderLeft: "2px solid rgba(0,194,168,0.45)" }}>
                      <div className="px-4 pt-3 pb-2 text-xs font-medium flex items-center gap-2" style={{ color: "rgba(0,0,0,0.5)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#00C2A8" }} />
                        {tr.buildingPresentation.replace("{n}", String(buildingSlideCount))}
                      </div>
                      <PresentationBuildingAnimation topic={buildingTopic} slideCount={buildingSlideCount} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ── Bottom input (chat view) ── */}
            <div className="shrink-0 px-4 pb-4 pt-2">
              <div className="max-w-3xl mx-auto">
                {isProLocked ? (
                  <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.09)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                        <Lock className="w-4 h-4" style={{ color: "rgba(0,0,0,0.45)" }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#0A0A0F", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{tr.proRequired}</p>
                        <p className="text-xs" style={{ color: "rgba(0,0,0,0.42)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{tr.proGatedMsg}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowProModal(true)}
                      className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm whitespace-nowrap"
                      style={{ background: "#7c3aed", color: "#fff", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                      <Crown className="w-4 h-4" /> {tr.upgradePro}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="rounded-2xl overflow-visible"
                    style={{ background: "var(--sp-input-bg)", border: "1px solid var(--sp-input-border)", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
                  >
                    {chatMode !== "normal" && (
                      <div className="flex items-center gap-2 px-4 py-2 border-b text-xs font-semibold"
                        style={{ borderColor: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.6)", background: "rgba(0,194,168,0.03)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                        {chatMode === "deep-research" ? <><Microscope className="w-3.5 h-3.5" /> {tr.deepResearchMode}</>
                          : chatMode === "create-presentation" ? <><Presentation className="w-3.5 h-3.5" /> {presentationStage === "idle" ? tr.presentationMode : tr.selectSlideCountAbove}</>
                          : <><ImagePlus className="w-3.5 h-3.5" /> {imageStage === "waiting-type" ? tr.selectSlideCountAbove : tr.imageMode}</>}
                        <button type="button" onClick={() => toggleMode(chatMode)} className="ml-auto hover:opacity-70">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {attachments.length > 0 && (
                      <div className="flex gap-2 px-4 pt-3 flex-wrap">
                        {attachments.map((a) => (
                          <div key={a.id} className="relative group flex items-center gap-2 rounded-xl px-3 py-2 text-xs max-w-[160px]"
                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.09)", color: "rgba(0,0,0,0.72)" }}>
                            {a.type === "image" && a.previewUrl
                              ? <img src={a.previewUrl} alt={a.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              : <FileText className="w-5 h-5 shrink-0" style={{ color: "rgba(0,0,0,0.42)" }} />}
                            <div className="min-w-0">
                              <p className="truncate font-medium leading-tight">{a.name}</p>
                              <p style={{ color: "rgba(0,0,0,0.32)" }}>{a.size}</p>
                            </div>
                            <button type="button" onClick={() => removeAttachment(a.id)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full items-center justify-center hidden group-hover:flex"
                              style={{ background: "rgba(200,50,50,0.8)", color: "white" }}>
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                      placeholder={
                        chatMode === "create-image" ? tr.describeImagePlaceholder
                          : chatMode === "deep-research" ? tr.researchTopicPlaceholder
                          : chatMode === "create-presentation" && presentationStage === "idle" ? tr.presentationTopicPlaceholder
                          : chatMode === "create-presentation" && presentationStage === "waiting-slide-count" ? tr.selectSlidesPlaceholder
                          : `${tr.messagePlaceholder} · ${model.name} ${model.version}...`
                      }
                      rows={1}
                      className="w-full px-5 pt-4 pb-2 text-base bg-transparent focus:outline-none resize-none cadus-textarea"
                      style={{ color: "var(--sp-textarea-color)", caretColor: "var(--sp-caret-color)", minHeight: "52px", maxHeight: "160px" }}
                      disabled={chatMutation.isPending || isGeneratingPresentation || presentationStage === "waiting-slide-count"}
                    />
                    <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
                      <div className="flex items-center gap-1">
                        <div className="relative" ref={attachMenuRef}>
                          <button type="button" onClick={() => setShowAttachMenu((v) => !v)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ color: showAttachMenu ? "#0A0A0F" : "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                            <Paperclip className="w-4 h-4" />
                            <span className="hidden sm:inline">{tr.attach}</span>
                          </button>
                          {showAttachMenu && (
                            <div className="absolute bottom-full left-0 mb-2 rounded-xl shadow-lg overflow-hidden w-52 z-30"
                              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.1)", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}>
                              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.28)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{tr.attach}</div>
                              {[
                                { label: tr.uploadImage, sub: tr.uploadImageFormats, icon: Image, action: () => imageInputRef.current?.click() },
                                { label: tr.uploadDocument, sub: tr.uploadDocumentFormats, icon: FileText, action: () => fileInputRef.current?.click() },
                                { label: tr.takePhoto, sub: tr.useCamera, icon: Camera, action: () => { setShowAttachMenu(false); setShowCamera(true); } },
                              ].map(({ label, sub, icon: Icon, action }) => (
                                <button key={label} type="button" onClick={action}
                                  className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors hover:bg-black/4"
                                  style={{ color: "rgba(0,0,0,0.75)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.05)" }}>
                                    <Icon className="w-4 h-4" style={{ color: "rgba(0,0,0,0.52)" }} />
                                  </div>
                                  <div className="text-left">
                                    <p className="font-semibold leading-tight">{label}</p>
                                    <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{sub}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={() => toggleMode("deep-research")}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={chatMode === "deep-research"
                            ? { background: "rgba(52,211,153,0.1)", color: "rgba(5,150,105,0.9)", fontFamily:"'Plus Jakarta Sans', sans-serif" }
                            : { color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                          <Search className="w-4 h-4" />
                          <span className="hidden sm:inline">{tr.deepResearch}</span>
                        </button>
                        <button type="button" onClick={() => toggleMode("create-image")}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={chatMode === "create-image"
                            ? { background: "rgba(244,114,182,0.1)", color: "rgba(190,24,93,0.9)", fontFamily:"'Plus Jakarta Sans', sans-serif" }
                            : { color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                          <ImagePlus className="w-4 h-4" />
                          <span className="hidden sm:inline">{tr.createImage}</span>
                        </button>
                        <button type="button" onClick={() => toggleMode("create-presentation")}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={chatMode === "create-presentation"
                            ? { background: "rgba(251,191,36,0.1)", color: "rgba(161,98,7,0.9)", fontFamily:"'Plus Jakarta Sans', sans-serif" }
                            : { color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                          <Presentation className="w-4 h-4" />
                          <span className="hidden sm:inline">{tr.presentation}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline text-xs" style={{ color: "rgba(0,0,0,0.32)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                          {model.name}
                        </span>
                        <button type="submit"
                          disabled={(!input.trim() && attachments.length === 0) || chatMutation.isPending || isGeneratingImage || isGeneratingPresentation || presentationStage === "waiting-slide-count" || imageStage === "waiting-type"}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                          style={{ background: "#00C2A8" }}>
                          <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                <p className="text-center text-[11px] mt-2" style={{ color: "rgba(0,0,0,0.25)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  {tr.disclaimer}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Pricing Modal ── */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,10,15,0.6)", backdropFilter: "blur(20px)" }}
          onClick={() => setShowProModal(false)}>
          <div className="rounded-3xl w-full overflow-hidden"
            style={{ maxWidth: 920, background: "#F8F7F4", boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08)" }}
            onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="relative px-8 pt-8 pb-6 text-center" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <button onClick={() => setShowProModal(false)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-black/6"
                style={{ color: "rgba(0,0,0,0.35)" }}>
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold mb-4"
                style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.22)", color: "#00A896", fontFamily:"'Plus Jakarta Sans', sans-serif", letterSpacing:"0.04em" }}>
                <Crown className="w-3 h-3" /> CADUS AI PLANS
              </div>
              <h2 className="text-[28px] font-bold mb-2 tracking-tight" style={{ color: "#0A0A0F", fontFamily:"'Cormorant Garamond', Georgia, serif" }}>Choose your plan</h2>
              <p className="text-sm" style={{ color: "rgba(0,0,0,0.45)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Elevate your clinical practice with the right tier</p>
              {/* Billing toggle */}
              <div className="inline-flex items-center gap-1 mt-5 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <button onClick={() => setBillingPeriod("monthly")}
                  className="px-5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={billingPeriod === "monthly"
                    ? { background: "#FFFFFF", color: "#0A0A0F", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", fontFamily:"'Plus Jakarta Sans', sans-serif" }
                    : { color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  Monthly
                </button>
                <button onClick={() => setBillingPeriod("yearly")}
                  className="flex items-center gap-2 px-5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={billingPeriod === "yearly"
                    ? { background: "#FFFFFF", color: "#0A0A0F", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", fontFamily:"'Plus Jakarta Sans', sans-serif" }
                    : { color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                  Yearly
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(0,194,168,0.12)", color: "#00A896" }}>Save 33%</span>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-3 gap-0">
              {([
                {
                  id: "minor",
                  name: "Cadus Minor",
                  tagline: "Get started",
                  badge: null as string|null,
                  badgeStyle: {} as React.CSSProperties,
                  price: "Free",
                  priceSub: "Forever free · no card required",
                  highlight: false,
                  desc: "Perfect for individuals exploring medical AI for the first time.",
                  features: [
                    { text: "20 AI queries per day", included: true },
                    { text: "Basic diagnosis support", included: true },
                    { text: "General medical Q&A", included: true },
                    { text: "Standard response speed", included: true },
                    { text: "Community access", included: true },
                    { text: "DDx Generator", included: false },
                    { text: "Deep Research", included: false },
                    { text: "Medical image analysis", included: false },
                  ],
                  cta: "Your current plan",
                  ctaDisabled: true,
                  ctaStyle: { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,0,0,0.1)" } as React.CSSProperties,
                  cardStyle: { background: "#FFFFFF", borderRight: "1px solid rgba(0,0,0,0.07)" } as React.CSSProperties,
                },
                {
                  id: "medius",
                  name: "Cadus Medius",
                  tagline: "For students & clinicians",
                  badge: "Standard",
                  badgeStyle: { background: "rgba(0,122,255,0.1)", color: "#0066CC", border: "1px solid rgba(0,122,255,0.18)" } as React.CSSProperties,
                  price: billingPeriod === "monthly" ? "₹499" : "₹333",
                  priceSub: billingPeriod === "monthly" ? "per month" : "per month · billed ₹3,999/yr",
                  highlight: false,
                  desc: "For students and clinicians in everyday practice.",
                  features: [
                    { text: "50 AI queries per day", included: true },
                    { text: "DDx Generator", included: true },
                    { text: "Research summaries", included: true },
                    { text: "Study Hub access", included: true },
                    { text: "Faster response speed", included: true },
                    { text: "Procedure guides", included: true },
                    { text: "Deep Research", included: false },
                    { text: "Medical image analysis", included: false },
                  ],
                  cta: "Upgrade to Medius",
                  ctaDisabled: false,
                  ctaStyle: { background: "rgba(0,122,255,0.08)", color: "#0066CC", border: "1px solid rgba(0,122,255,0.22)" } as React.CSSProperties,
                  cardStyle: { background: "#FFFFFF", borderRight: "1px solid rgba(0,0,0,0.07)" } as React.CSSProperties,
                },
                {
                  id: "magnus",
                  name: "Cadus Magnus",
                  tagline: "Advanced clinical AI",
                  badge: "Most Popular",
                  badgeStyle: { background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", border: "none" } as React.CSSProperties,
                  price: billingPeriod === "monthly" ? "₹1,499" : "₹999",
                  priceSub: billingPeriod === "monthly" ? "per month" : "per month · billed ₹11,999/yr",
                  highlight: true,
                  desc: "For advanced clinical work, complex cases & AI-powered research.",
                  features: [
                    { text: "Unlimited AI queries", included: true },
                    { text: "Cadus Magnus advanced model", included: true },
                    { text: "Complex DDx & rare diseases", included: true },
                    { text: "Deep Research + web search", included: true },
                    { text: "Medical image analysis", included: true },
                    { text: "Multispecialty second opinion", included: true },
                    { text: "PDF export & presentations", included: true },
                    { text: "Priority support", included: true },
                  ],
                  cta: "Upgrade to Magnus",
                  ctaDisabled: false,
                  ctaStyle: { background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" } as React.CSSProperties,
                  cardStyle: { background: "linear-gradient(160deg, rgba(124,58,237,0.04) 0%, rgba(147,51,234,0.07) 100%)", borderLeft: "2px solid rgba(124,58,237,0.2)" } as React.CSSProperties,
                },
              ]).map((plan, pi) => (
                <div key={plan.id} className="relative flex flex-col px-7 py-7" style={plan.cardStyle}>
                  {/* Badge */}
                  {plan.badge ? (
                    <div className="inline-flex self-start items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold mb-4"
                      style={{ ...plan.badgeStyle, fontFamily:"'Plus Jakarta Sans', sans-serif", letterSpacing:"0.04em" }}>
                      {plan.id === "magnus" && <Crown className="w-2.5 h-2.5" />}
                      {plan.badge}
                    </div>
                  ) : (
                    <div className="h-7 mb-4" />
                  )}

                  {/* Plan name + tagline */}
                  <h3 className="text-lg font-bold mb-0.5" style={{ color: "#0A0A0F", fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize: 20 }}>{plan.name}</h3>
                  <p className="text-[11px] font-medium mb-1" style={{ color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>{plan.tagline}</p>
                  <p className="text-xs mb-5 leading-relaxed" style={{ color: "rgba(0,0,0,0.48)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{plan.desc}</p>

                  {/* Price */}
                  <div className="mb-1">
                    <div className="flex items-end gap-1.5">
                      <span className="font-extrabold leading-none" style={{ color: plan.highlight ? "#7c3aed" : "#0A0A0F", fontSize: plan.price === "Free" ? 32 : 30, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{plan.price}</span>
                      {plan.price !== "Free" && <span className="text-xs pb-1" style={{ color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>/mo</span>}
                    </div>
                    <p className="text-[10px] mt-1 mb-5" style={{ color: "rgba(0,0,0,0.35)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{plan.priceSub}</p>
                  </div>

                  {/* CTA */}
                  <button disabled={plan.ctaDisabled}
                    className="w-full py-3 rounded-xl text-xs font-bold transition-all mb-6 disabled:cursor-not-allowed"
                    style={{ ...plan.ctaStyle, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    {plan.cta}
                  </button>

                  {/* Divider */}
                  <div className="mb-4" style={{ height: 1, background: "rgba(0,0,0,0.07)" }} />

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <div key={f.text} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: f.included
                              ? plan.highlight ? "rgba(124,58,237,0.15)" : "rgba(0,194,168,0.12)"
                              : "rgba(0,0,0,0.04)",
                          }}>
                          {f.included
                            ? <span className="text-[8px] font-black" style={{ color: plan.highlight ? "#7c3aed" : "#00A896" }}>✓</span>
                            : <span className="text-[10px] leading-none" style={{ color: "rgba(0,0,0,0.2)" }}>–</span>}
                        </div>
                        <span className="text-xs leading-relaxed"
                          style={{ color: f.included ? (plan.highlight ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.65)") : "rgba(0,0,0,0.25)", fontFamily:"'Plus Jakarta Sans', sans-serif", textDecoration: f.included ? "none" : "none" }}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="px-8 py-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-6">
                {[
                  { icon: "🔒", text: "HIPAA-aligned privacy" },
                  { icon: "✦", text: "Cancel anytime" },
                  { icon: "₹", text: "Prices in INR" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-[11px]"
                    style={{ color: "rgba(0,0,0,0.38)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    <span>{icon}</span>{text}
                  </div>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.28)", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                Trusted by 10,000+ clinicians in India
              </p>
            </div>
          </div>
        </div>
      )}


      {/* ── In-Browser Presentation Viewer ── */}
      {activePresentationData && (
        <PresentationViewer
          data={activePresentationData}
          pdfBase64={activePresentationData.pdfBase64}
          docxBase64={activePresentationData.docxBase64}
          onClose={() => setActivePresentationData(null)}
          initialIdx={Number(new URLSearchParams(window.location.search).get("slide") ?? 0) || 0}
        />
      )}

      {/* ── Camera Modal ── */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* ── Image Zoom Modal ── */}
      {zoomedImageUrl && (
        <div
          role="dialog"
          aria-label="Zoomed image"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
            animation: "tw-fade-in 0.18s ease-out",
          }}
          onClick={() => setZoomedImageUrl(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setZoomedImageUrl(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 40, height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.8)",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <img
            src={zoomedImageUrl}
            alt="Zoomed medical illustration"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 16,
              boxShadow: "0 8px 60px rgba(0,194,168,0.25), 0 0 0 1px rgba(0,188,212,0.15)",
              animation: "cadus-img-fade-in 0.22s ease-out",
              cursor: "default",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Rotating thinking text component ─────────────────────────────────── */
const THINKING_MESSAGES: Record<string, string[]> = {
  "create-image": [
    "Generating clinical illustration…",
    "Rendering anatomical diagram…",
    "Composing medical visual…",
    "Applying textbook-style detail…",
    "Finalising medical artwork…",
  ],
  "deep-research": [
    "Searching medical literature…",
    "Analysing clinical data…",
    "Cross-referencing guidelines…",
    "Compiling research report…",
    "Verifying evidence base…",
  ],
  "create-presentation": [
    "Building slide structure…",
    "Composing medical content…",
    "Designing clinical slides…",
    "Formatting presentation…",
    "Assembling slide deck…",
  ],
  default: [
    "Analysing symptoms…",
    "Processing medical data…",
    "Reviewing clinical guidelines…",
    "Consulting medical knowledge…",
    "Preparing response…",
  ],
};

function ThinkingTextRotator({ chatMode }: { chatMode: ChatMode }) {
  const messages = THINKING_MESSAGES[chatMode] ?? THINKING_MESSAGES.default;
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(i => (i + 1) % messages.length);
      setKey(k => k + 1);
    }, 2800);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <span
      key={key}
      style={{
        fontSize: 11,
        color: "rgba(0,0,0,0.38)",
        letterSpacing: "0.04em",
        marginLeft: 4,
        display: "inline-block",
        animation: "cadus-think-text-fade 2.8s ease-in-out forwards",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        minWidth: 170,
      }}
    >
      {messages[idx]}
    </span>
  );
}

/* ── Image message card with skeleton + fade-in + zoom ─────────────────── */
function ImageMessageCard({
  imageUrl, prompt, onZoom, downloadLabel,
}: {
  imageUrl: string;
  prompt: string;
  onZoom: (url: string) => void;
  downloadLabel: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ maxWidth: 420 }}>
      {/* Medical Anatomy Reference badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 8,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "rgba(0,194,168,0.75)",
        textTransform: "uppercase",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        Medical Anatomy Reference · Cadus AI
      </div>

      {/* Image wrapper */}
      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
        {/* Skeleton shown until image loads */}
        {!loaded && (
          <div style={{
            width: "100%",
            paddingBottom: "75%",
            background: "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,194,168,0.07) 50%, rgba(0,0,0,0.04) 100%)",
            backgroundSize: "800px 100%",
            animation: "cadus-skeleton-shimmer 1.5s linear infinite",
            borderRadius: 14,
          }} />
        )}

        {/* Actual image */}
        <img
          src={imageUrl}
          alt="Cadus AI medical illustration"
          onLoad={() => setLoaded(true)}
          style={{
            display: loaded ? "block" : "none",
            width: "100%",
            borderRadius: 14,
            objectFit: "contain",
            maxHeight: 480,
            border: "1px solid rgba(0,188,212,0.2)",
            animation: loaded ? "cadus-img-fade-in 0.35s ease-out" : undefined,
          }}
        />

        {/* Zoom button (top-right overlay) */}
        {loaded && (
          <button
            type="button"
            title="View full size"
            onClick={() => onZoom(imageUrl)}
            style={{
              position: "absolute", top: 10, right: 10,
              width: 32, height: 32,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(0,194,168,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "zoom-in",
              backdropFilter: "blur(6px)",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,194,168,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.55)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,194,168,0.9)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Caption / AI note */}
      {loaded && (
        <div style={{
          marginTop: 8,
          padding: "8px 10px",
          borderRadius: 8,
          background: "rgba(0,194,168,0.06)",
          border: "1px solid rgba(0,194,168,0.12)",
          fontSize: 11,
          color: "rgba(0,0,0,0.5)",
          lineHeight: 1.5,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <span style={{ color: "#00C2A8", fontWeight: 600 }}>Note: </span>
          This is an educational medical illustration. For any symptoms or clinical decisions, always consult a licensed doctor.
        </div>
      )}

      {/* Download link */}
      <a
        href={imageUrl}
        download="cadus-medical-illustration.png"
        target="_blank"
        rel="noreferrer"
        style={{
          marginTop: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 600,
          color: "#00E5FF",
          textDecoration: "none",
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
      >
        <Download className="w-3 h-3" /> {downloadLabel}
      </a>
    </div>
  );
}

/* Deep-ocean particles config */
const OCEAN_PARTICLES = [
  { x: 12, y: 85, r: 2.2, delay: 0,    dur: 5.5, kind: 1 },
  { x: 28, y: 78, r: 1.5, delay: 0.8,  dur: 7.2, kind: 2 },
  { x: 42, y: 90, r: 3.0, delay: 1.6,  dur: 4.8, kind: 1 },
  { x: 58, y: 82, r: 1.8, delay: 0.4,  dur: 6.3, kind: 2 },
  { x: 70, y: 88, r: 2.5, delay: 2.1,  dur: 5.9, kind: 1 },
  { x: 84, y: 76, r: 1.4, delay: 1.2,  dur: 8.0, kind: 2 },
  { x: 20, y: 70, r: 2.0, delay: 3.0,  dur: 6.8, kind: 1 },
  { x: 50, y: 95, r: 1.6, delay: 0.2,  dur: 5.2, kind: 2 },
  { x: 65, y: 72, r: 2.8, delay: 1.9,  dur: 7.5, kind: 1 },
  { x: 88, y: 91, r: 1.3, delay: 2.5,  dur: 6.1, kind: 2 },
  { x: 35, y: 65, r: 1.9, delay: 0.7,  dur: 9.0, kind: 1 },
  { x: 75, y: 60, r: 2.3, delay: 3.5,  dur: 7.8, kind: 2 },
];

/* Sunlight rays config */
const OCEAN_RAYS = [
  { left: "8%",  width: 44, rot: -12, delay: 0,   dur: 6 },
  { left: "22%", width: 30, rot: -4,  delay: 1.2, dur: 8 },
  { left: "38%", width: 55, rot: 2,   delay: 0.5, dur: 7 },
  { left: "54%", width: 28, rot: 8,   delay: 2.1, dur: 9 },
  { left: "68%", width: 40, rot: -6,  delay: 0.9, dur: 6.5 },
  { left: "82%", width: 22, rot: 14,  delay: 1.7, dur: 7.5 },
];

function ImageGeneratingAnimation({ prompt }: { prompt: string }) {
  return (
    <div style={{ width: "320px" }}>
      {/* ── Ocean scene container ── */}
      <div style={{
        position: "relative",
        width: "100%",
        paddingBottom: "100%",
        borderRadius: "18px",
        overflow: "hidden",
        background: "linear-gradient(180deg, #020c1b 0%, #011528 30%, #010d1f 65%, #000a15 100%)",
      }}>

        {/* ── Sunlight rays from surface ── */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {OCEAN_RAYS.map((r, i) => (
            <div key={i} style={{
              position: "absolute",
              left: r.left,
              top: "-10%",
              width: r.width,
              height: "130%",
              background: "linear-gradient(180deg, rgba(100,200,255,0.22) 0%, rgba(50,150,220,0.08) 60%, transparent 100%)",
              transformOrigin: "top center",
              transform: `rotate(${r.rot}deg)`,
              animation: `${i % 2 === 0 ? "ocean-ray-sway" : "ocean-ray-sway2"} ${r.dur}s ease-in-out ${r.delay}s infinite`,
              filter: "blur(8px)",
            }} />
          ))}
        </div>

        {/* ── Subtle AI grid overlay ── */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(rgba(0,160,220,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,160,220,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
          pointerEvents: "none",
        }} />

        {/* ── Water caustics shimmer ── */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 120px 60px at 30% 20%, rgba(0,180,240,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 90px 45px  at 72% 15%, rgba(0,150,220,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 70px 35px  at 55% 35%, rgba(0,200,255,0.04) 0%, transparent 70%)
          `,
          animation: "ocean-depth-drift 5s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* ── Floating particles / plankton ── */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {OCEAN_PARTICLES.map((p, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: "50%",
              background: p.kind === 1
                ? `radial-gradient(circle, rgba(0,220,255,0.95) 0%, rgba(0,160,220,0.4) 70%)`
                : `radial-gradient(circle, rgba(120,220,255,0.8) 0%, rgba(80,180,240,0.3) 70%)`,
              boxShadow: p.kind === 1
                ? `0 0 ${p.r * 3}px rgba(0,220,255,0.65)`
                : `0 0 ${p.r * 2.5}px rgba(100,200,255,0.5)`,
              animation: `${p.kind === 1 ? "ocean-bubble-rise" : "ocean-bubble-drift"} ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }} />
          ))}
        </div>

        {/* ── Depth vignette ── */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 40%, rgba(0,5,16,0.55) 100%)",
          pointerEvents: "none",
        }} />

        {/* ── Glassmorphism center card ── */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: "192px",
            padding: "22px 20px 20px",
            borderRadius: "18px",
            background: "rgba(2, 18, 38, 0.62)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(0, 180, 230, 0.18)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            animation: "ocean-card-glow 3s ease-in-out infinite",
          }}>

            {/* Circular progress loader */}
            <div style={{
              position: "relative",
              width: "68px",
              height: "68px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {/* Outer ring */}
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid rgba(0,180,230,0.12)",
                borderTop: "2.5px solid #00d4ff",
                borderRight: "2.5px solid rgba(0,200,255,0.4)",
                animation: "ocean-ring-rotate 1.4s linear infinite",
                boxShadow: "0 0 12px rgba(0,212,255,0.4)",
              }} />
              {/* Middle ring */}
              <div style={{
                position: "absolute",
                inset: "10px",
                borderRadius: "50%",
                border: "1.5px solid rgba(0,160,220,0.08)",
                borderBottom: "2px solid rgba(0,180,240,0.55)",
                borderLeft: "2px solid rgba(0,160,230,0.3)",
                animation: "ocean-ring-rotate 2.2s linear infinite reverse",
              }} />
              {/* Inner pulsing orb */}
              <div style={{
                position: "absolute",
                inset: "20px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0,200,255,0.35) 0%, rgba(0,130,200,0.08) 100%)",
                animation: "ocean-ring-glow 2s ease-in-out infinite",
              }} />
              {/* Icon */}
              <div style={{ position: "relative", zIndex: 2, animation: "ocean-icon-pulse 2s ease-in-out infinite" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,210,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="rgba(0,210,255,0.5)" stroke="none" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "rgba(0,220,255,0.92)",
                animation: "ocean-text-breathe 2s ease-in-out infinite",
                textShadow: "0 0 10px rgba(0,200,255,0.4)",
              }}>
                GENERATING IMAGE
              </span>
              <span style={{
                fontSize: "9.5px",
                color: "rgba(140,210,255,0.5)",
                letterSpacing: "0.06em",
                animation: "ocean-text-breathe 2s ease-in-out 0.4s infinite",
              }}>
                Cadus AI  •  Processing…
              </span>

              {/* Progress dots */}
              <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: `rgba(0,${180 + i * 18},${220 + i * 10},0.9)`,
                    boxShadow: `0 0 6px rgba(0,200,255,0.6)`,
                    animation: `ocean-text-breathe 1s ease-in-out ${i * 0.22}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Surface highlight (top edge glow) ── */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "3px",
          background: "linear-gradient(90deg, transparent 0%, rgba(0,180,240,0.5) 40%, rgba(0,210,255,0.7) 50%, rgba(0,180,240,0.5) 60%, transparent 100%)",
          animation: "ocean-text-breathe 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* ── Bottom depth fade ── */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "70px",
          background: "linear-gradient(transparent, rgba(0,5,15,0.75))",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── Prompt label below card ── */}
      <div style={{
        marginTop: "10px",
        fontSize: "10.5px",
        color: "rgba(0,190,230,0.4)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        letterSpacing: "0.03em",
        fontWeight: 500,
        paddingLeft: "2px",
      }}>
        {prompt.length > 55 ? prompt.substring(0, 55) + "…" : prompt}
      </div>
    </div>
  );
}

function PresentationBuildingAnimation({ topic, slideCount }: { topic: string; slideCount: number }) {
  const [lines, setLines] = useState<string[]>([]);
  const topicShort = topic.substring(0, 36);

  useEffect(() => {
    const phases = [
      `> analyzing topic: "${topicShort}"`,
      `> initializing ${slideCount}-slide structure...`,
      `{`,
      `  "title": "${topicShort}",`,
      `  "subtitle": "Comprehensive Medical Guide",`,
      `  "slides": [`,
      `    { "slideNumber": 1, "title": "Introduction",`,
      `      "bullets": ["Definition...", "Epidemiology...", "Etiology..."],`,
      `      "keyFact": "High-yield clinical statistic...", }`,
      `    { "slideNumber": 2, "title": "Anatomy & Physiology",`,
      `      "bullets": ["Gross anatomy...", "Histology...", "Blood supply..."], }`,
      `    { "slideNumber": 3, "title": "Pathophysiology",`,
      `      "bullets": ["Molecular mechanism...", "Cellular changes..."], }`,
      `    ... composing ${Math.max(slideCount - 3, 1)} more slides ...`,
      `  ]`,
      `}`,
      `> drawing ${slideCount} diagrams...`,
      `> rendering slide layouts...`,
      `> compiling PDF with pdf-lib...`,
      `> encoding DOCX document...`,
      `> finalizing download package...`,
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLines((prev) => { const next = [...prev, phases[i % phases.length]]; return next.slice(-16); });
      i++;
      if (i >= phases.length) i = Math.max(phases.length - 10, 6);
    }, 155);
    return () => clearInterval(interval);
  }, [topicShort, topic, slideCount]);

  return (
    <div className="font-mono text-xs overflow-hidden" style={{ background: "#0d1117", borderTop: "1px solid rgba(0,188,212,0.2)" }}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b" style={{ background: "#161b22", borderColor: "rgba(100,200,255,0.1)" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-1.5 text-[10px] text-slate-400 font-sans">cadus_presentation_builder.json</span>
      </div>
      <div className="px-4 py-3 space-y-0.5 min-h-[160px] max-h-[220px] overflow-hidden">
        {lines.map((line, i) => (
          <div key={i} className={cn("leading-[18px] whitespace-pre",
            line.startsWith(">") ? "text-emerald-400"
            : line.includes('"title"') || line.includes('"subtitle"') ? "text-amber-300"
            : line.includes('"bullets"') || line.includes('"mindMap"') ? "text-sky-300"
            : line.includes('"keyFact"') ? "text-violet-300"
            : line.startsWith("    ...") ? "text-slate-500 italic"
            : line === "{" || line === "}" || line === "  ]" ? "text-slate-400"
            : "text-slate-300")}>
            {line}{i === lines.length - 1 && <span className="animate-pulse text-emerald-400 ml-0.5">█</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
