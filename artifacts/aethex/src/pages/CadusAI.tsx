/**
 * Cadus: the clinical AI workspace inside Aethex.
 * Backend: `groq-ai` on the site's Cloudflare Worker at /api/fn/groq-ai
 * (Claude Haiku 5.5, Groq fallback). See worker/index.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Bookmark, BookmarkCheck, BookOpen, BookOpenCheck, Brain, Gauge,
  Camera, Check, ChevronDown, ChevronRight, ChevronsUpDown, CircleQuestionMark, ClipboardList, Copy, CornerDownRight,
  Database, Download, ExternalLink, FileText, FlaskConical, Folder, FolderInput, FolderMinus, FolderPlus, Globe,
  GraduationCap, Grip, History, House, ImagePlus, Info, Keyboard, Laptop, Layers, LayoutGrid, Library, ListFilter, LogIn,
  LogOut, Menu, MessageSquare, Mic, Moon, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Pencil, Pill, Pin, PinOff, Play,
  Plus, Presentation, RefreshCw, Scale, Search, Settings, ShieldAlert, ShieldCheck, ShoppingBag, SlidersHorizontal,
  Sparkles, Square, SquarePen, Stethoscope, Sun, Syringe, Telescope, Trash2, Users, Volume2, VolumeX, X, Zap, Palette,
  type LucideIcon,
} from "lucide-react";
import { invokeAi } from "@/lib/ai-functions";
import { useUserAuth } from "@/hooks/use-user-auth";
import CadusMark, { CADUS_ICON_DATA_URL } from "@/components/cadus/CadusMark";
import CameraModal from "@/components/cadus/CameraModal";
import PresentationViewer, { type PresentationData } from "@/components/cadus/PresentationViewer";
import { CADUS_CSS } from "@/components/cadus/cadus-styles";
import { markdownToText, renderMarkdown } from "@/lib/cadus-markdown";
import {
  composeFromLibrary, libraryFootnote, libraryNotFound, medicalLibrary, SOURCE_SHORT,
  type LibraryManifest, type LibraryResult,
} from "@/lib/medlib/library";
import { queryTerms } from "@/lib/medlib/text";
import { isCadusHost, loginUrl, mainUrl } from "@/lib/host";

/* ================================================================ types */

type ModeId =
  | "general" | "ddx" | "drugs" | "dosage" | "labs" | "image" | "procedure"
  | "soap" | "discharge" | "patient" | "research" | "mcq" | "slides";
type Provider = "claude" | "groq" | "library";
type View = "chat" | "tools" | "library" | "projects" | "project" | "decks";
type ToolTab = "all" | "clinical" | "documentation" | "learning";
type SettingsTab = "general" | "personal" | "data" | "shortcuts" | "about";
type StyleId = "concise" | "balanced" | "detailed";

interface SourceRef {
  n: number;
  url: string;
  title: string;
}

interface ReviewMeta {
  verdict: "approved" | "corrected";
  confidence: "high" | "moderate" | "low";
  checked: string[];
  changes: string[];
  model?: string;
  provider?: Provider;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: ModeId;
  at: number;
  image?: string;
  deck?: PresentationData;
  provider?: Provider;
  model?: string;
  error?: boolean;
  stopped?: boolean;
  /** user message: live sources were requested */
  search?: boolean;
  sources?: SourceRef[];
  queries?: string[];
  review?: ReviewMeta;
  reviewNote?: string;
  /** Answered in Library mode (no AI credits): written by the backup model from library passages, or quoted. */
  library?: { mode: "llm" | "extract"; reason: string; articles: number };
}

interface Session {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
  pinned?: boolean;
  /** The project this chat belongs to, if any. */
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
  /** Standing instructions sent with every chat in the project. */
  instructions: string;
  createdAt: number;
  updatedAt: number;
}

interface SavedItem {
  id: string;
  sessionId: string;
  messageId: string;
  question: string;
  answer: string;
  mode: ModeId;
  at: number;
  sources?: SourceRef[];
}

interface Prefs {
  theme: "light" | "dark" | "system";
  accent: string;
  textSize: "s" | "m" | "l";
  style: StyleId;
  language: string;
  enterToSend: boolean;
  /** Second-model safety review of every answer. */
  safetyReview: boolean;
  /** Search trusted sources by default. */
  sources: boolean;
  /** Typeface for Cadus answers. */
  answerFont: "serif" | "sans";
  /** Which Cadus model writes the answers. */
  model: ModelId;
}

interface ModeDef {
  id: ModeId;
  label: string;
  short: string;
  icon: LucideIcon;
  desc: string;
  placeholder: string;
  busy: string;
  example: string;
  cat: Exclude<ToolTab, "all"> | "general";
}

interface PaletteItem {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

/* ============================================================ constants */

const MODES: ModeDef[] = [
  { id: "general", cat: "general", label: "General", short: "General", icon: Sparkles, desc: "Any clinical or academic question", placeholder: "Ask a clinical question or describe a case…", busy: "Thinking it through", example: "Explain the mechanism of SGLT2 inhibitors." },
  { id: "ddx", cat: "clinical", label: "Differential diagnosis", short: "Differentials", icon: Stethoscope, desc: "Ranked differentials, red flags and the next best test", placeholder: "Describe the case: age, sex, symptoms, signs, vitals…", busy: "Ranking differentials", example: "28F, fever, joint pain, malar rash and proteinuria." },
  { id: "drugs", cat: "clinical", label: "Drug interactions", short: "Interactions", icon: Pill, desc: "Severity, mechanism and how to manage each interaction", placeholder: "List the medicines, e.g. warfarin, amiodarone, aspirin", busy: "Checking interactions", example: "Warfarin with clarithromycin and omeprazole." },
  { id: "dosage", cat: "clinical", label: "Dose calculator", short: "Dosing", icon: Syringe, desc: "Weight- and renal-adjusted dosing, shown step by step", placeholder: "Drug, indication, weight, age, eGFR…", busy: "Calculating the dose", example: "Vancomycin for a 70 kg adult with eGFR 40." },
  { id: "labs", cat: "clinical", label: "Lab interpretation", short: "Labs", icon: FlaskConical, desc: "Flag abnormal values and find the unifying pattern", placeholder: "Paste lab values, e.g. Hb 8.2, MCV 68, ferritin 9…", busy: "Interpreting results", example: "Na 128, K 5.9, glucose 62, low morning cortisol." },
  { id: "image", cat: "clinical", label: "Image analysis", short: "Imaging", icon: ImagePlus, desc: "Systematic reads of X-rays, ECGs, skin and reports", placeholder: "Attach an image and say what you need…", busy: "Reviewing the image", example: "Upload a chest X-ray and ask for a systematic read." },
  { id: "procedure", cat: "clinical", label: "Procedure guide", short: "Procedures", icon: BookOpenCheck, desc: "Indications, kit, technique and complications", placeholder: "Procedure, e.g. lumbar puncture", busy: "Preparing the guide", example: "Ultrasound-guided central line insertion." },
  { id: "soap", cat: "documentation", label: "SOAP note", short: "SOAP note", icon: ClipboardList, desc: "Turn rough case notes into a clean SOAP note", placeholder: "Paste your case notes…", busy: "Drafting the note", example: "Paste ward-round notes to structure them." },
  { id: "discharge", cat: "documentation", label: "Discharge summary", short: "Discharge", icon: FileText, desc: "A structured discharge summary from your notes", placeholder: "Paste admission details, hospital course, procedures and medicines…", busy: "Drafting the summary", example: "Paste the admission and course to draft one." },
  { id: "patient", cat: "documentation", label: "Patient education", short: "Patient info", icon: Users, desc: "Plain-language explainers patients understand", placeholder: "Topic to explain, e.g. starting insulin", busy: "Writing the explainer", example: "Explain starting insulin to a newly diagnosed patient." },
  { id: "research", cat: "learning", label: "Deep research", short: "Research", icon: Telescope, desc: "A structured, guideline-aware evidence review", placeholder: "Research question, e.g. SGLT2 inhibitors in HFpEF", busy: "Reviewing the evidence", example: "Current evidence for SGLT2 inhibitors in HFpEF." },
  { id: "mcq", cat: "learning", label: "Exam MCQs", short: "MCQs", icon: GraduationCap, desc: "NEET-PG and USMLE-style practice questions", placeholder: "Topic for 5 practice questions, e.g. nephrotic syndrome", busy: "Writing questions", example: "Five NEET-PG questions on nephrotic syndrome." },
  { id: "slides", cat: "learning", label: "Lecture slides", short: "Slides", icon: Presentation, desc: "A complete teaching deck, ready to present", placeholder: "Deck topic, e.g. acute coronary syndrome for MBBS", busy: "Designing your deck", example: "Acute coronary syndrome for final-year MBBS." },
];
const MODE = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, ModeDef>;
const TOOL_MODES = MODES.filter((m) => m.id !== "general");

const GROUPS: { label: string; ids: ModeId[] }[] = [
  { label: "Clinical", ids: ["ddx", "drugs", "dosage", "labs", "image", "procedure"] },
  { label: "Documentation", ids: ["soap", "discharge", "patient"] },
  { label: "Learning and research", ids: ["research", "mcq", "slides"] },
];

const TOOL_TABS: { id: ToolTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "clinical", label: "Clinical" },
  { id: "documentation", label: "Documentation" },
  { id: "learning", label: "Learning" },
];

const QUICK: ModeId[] = ["ddx", "drugs", "labs", "slides", "mcq"];

const EXAMPLES: { mode: ModeId; text: string }[] = [
  { mode: "ddx", text: "45-year-old man, crushing chest pain for 2 hours, diaphoretic, BP 90/60. Differentials and next step?" },
  { mode: "drugs", text: "Clarithromycin with atorvastatin and amlodipine: any clinically relevant interactions?" },
  { mode: "labs", text: "Na 128, K 5.9, glucose 62 mg/dL and a low morning cortisol. What is the pattern?" },
];

const FOLLOW: Record<ModeId, { text: string; mode?: ModeId }[]> = {
  general: [{ text: "Explain that in more depth" }, { text: "Summarise it in three key points" }, { text: "What do current guidelines recommend?" }],
  ddx: [{ text: "Which investigations would confirm the top diagnosis?" }, { text: "Outline the initial management plan" }, { text: "Which red flags need urgent referral?" }],
  drugs: [{ text: "Suggest safer alternatives" }, { text: "How should the patient be monitored?" }, { text: "Explain the mechanism simply" }],
  dosage: [{ text: "Adjust this for renal impairment" }, { text: "What is the paediatric dose?" }, { text: "Which parameters should be monitored?" }],
  labs: [{ text: "What further tests would you order?" }, { text: "What are the most likely causes?" }, { text: "Explain these results to the patient", mode: "patient" }],
  image: [{ text: "What are the main differentials?" }, { text: "Which view or test would help next?" }, { text: "Summarise the key findings" }],
  procedure: [{ text: "List the common complications and how to manage them" }, { text: "What should I cover when taking consent?" }, { text: "Turn this into a checklist" }],
  soap: [{ text: "Shorten this into a handover note" }, { text: "Suggest an assessment and plan" }, { text: "Convert it into a referral letter" }],
  discharge: [{ text: "Rewrite it in patient-friendly language", mode: "patient" }, { text: "List the follow-up appointments needed" }, { text: "Shorten it for the GP letter" }],
  patient: [{ text: "Translate this into Hindi" }, { text: "Make it even simpler" }, { text: "Add a short FAQ section" }],
  research: [{ text: "Summarise this in five key points" }, { text: "What changed in the latest guidelines?" }, { text: "Turn this into practice questions", mode: "mcq" }],
  mcq: [{ text: "Give me five harder questions" }, { text: "Explain the answers in more depth" }, { text: "Make a lecture deck on this topic", mode: "slides" }],
  slides: [{ text: "Create five MCQs on this topic", mode: "mcq" }, { text: "Summarise this topic in key points", mode: "general" }, { text: "Make a shorter deck for a different audience" }],
};

const STYLES: { id: StyleId; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "concise", label: "Quick", desc: "Short, focused answers", icon: Zap },
  { id: "balanced", label: "Balanced", desc: "The right depth for most questions", icon: Scale },
  { id: "detailed", label: "Thorough", desc: "Longer answers with more nuance", icon: Layers },
];

type ModelId = "medius" | "magnus";
/** The Cadus models users choose between. Medius runs the fast model, Magnus the deeper one. */
const MODELS: { id: ModelId; name: string; short: string; desc: string; icon: LucideIcon }[] = [
  { id: "medius", name: "Cadus Medius 3.1", short: "Medius 3.1", desc: "Fast, accurate answers for everyday clinical questions", icon: Gauge },
  { id: "magnus", name: "Cadus Magnus 3.6", short: "Magnus 3.6", desc: "Deeper reasoning for complex cases and research", icon: Brain },
];
const MODEL_DEF = Object.fromEntries(MODELS.map((m) => [m.id, m])) as Record<ModelId, (typeof MODELS)[number]>;

const ACCENTS = [
  { id: "aethex", name: "Aethex teal", light: "#007A6C", dark: "#2DD4BF" },
  { id: "blue", name: "Hospital blue", light: "#1D4ED8", dark: "#60A5FA" },
  { id: "teal", name: "Clinical teal", light: "#0E8F84", dark: "#2DD4BF" },
  { id: "indigo", name: "Indigo", light: "#4F46E5", dark: "#818CF8" },
  { id: "emerald", name: "Emerald", light: "#047857", dark: "#34D399" },
  { id: "graphite", name: "Graphite", light: "#344054", dark: "#CBD5E1" },
];

const LANGUAGES = ["English", "Hindi", "Hinglish", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu"];

const SESSIONS_KEY = "cadus3.sessions";
const PREFS_KEY = "cadus3.prefs";
const USAGE_KEY = "cadus3.usage";
const LIBRARY_KEY = "cadus3.library";
const PROJECTS_KEY = "cadus3.projects";
const UI_KEY = "cadus3.ui";
const FREE_DAILY = 20;
const DEFAULT_PREFS: Prefs = { theme: "light", accent: "aethex", textSize: "m", style: "balanced", language: "English", enterToSend: true, safetyReview: true, sources: false, answerFont: "sans", model: "medius" };
/** Bumped when the default look changes, so saved settings move to the new theme, colour and answer font once. */
const PREFS_VERSION = 3;

function loadPrefs(): Prefs {
  const { v, ...saved } = readJSON<Partial<Prefs> & { v?: number }>(PREFS_KEY, {});
  if (v !== PREFS_VERSION) {
    delete saved.theme;
    delete saved.accent;
    delete saved.answerFont;
  }
  return { ...DEFAULT_PREFS, ...saved };
}
const PROJECT_IDEAS = ["Cardiology rotation", "NEET-PG revision", "Thesis literature review"];
const INSTRUCTIONS_MAX = 2000;

/** Other Aethex apps, shown in the sidebar's app launcher. */
const APPS: { label: string; path: string; icon: LucideIcon }[] = [
  { label: "Aethex home", path: "/", icon: House },
  { label: "Study Hub", path: "/study-hub", icon: GraduationCap },
  { label: "Medical books", path: "/books", icon: BookOpen },
  { label: "Flashcards", path: "/flashcards", icon: Layers },
  { label: "Shop", path: "/shop", icon: ShoppingBag },
  { label: "Classic Cadus", path: "/ai-assistant-classic", icon: History },
];
/** Study content is reviewed by Haiku 5.5; clinical answers by Sonnet 5.5. */
const STUDY_MODES = new Set<ModeId>(["mcq", "research", "slides"]);

/* =============================================================== helpers */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    if (key !== SESSIONS_KEY || !Array.isArray(value)) return;
    try {
      const slim = (value as Session[]).map((s, i) => (i < 3 ? s : { ...s, messages: s.messages.map((m) => ({ ...m, image: undefined })) }));
      localStorage.setItem(key, JSON.stringify(slim));
    } catch { /* storage full */ }
  }
}

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? "⌘" : "Ctrl";

function useMedia(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const fn = () => setMatch(mq.matches);
    fn();
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, [query]);
  return match;
}

async function fileToDataUrl(file: File, max = 1568): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function relTime(t: number): string {
  const d = Date.now() - t;
  if (d < 60_000) return "Just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} min ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} h ago`;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const BACKUP_MODEL = "Cadus backup model";
const providerLabel = (p?: Provider) => (p === "library" ? "Cadus Medical Library" : p === "groq" ? BACKUP_MODEL : MODEL_DEF.medius.name);
/** The name users see for the model behind an answer. */
const modelLabel = (model?: string, provider?: Provider) =>
  provider === "library" ? "Cadus Medical Library"
  : provider === "groq" ? BACKUP_MODEL
  : model?.includes("sonnet") || model?.includes("opus") ? MODEL_DEF.magnus.name : MODEL_DEF.medius.name;
const LIBRARY_REASON: Record<string, string> = {
  credits: "the AI credits are used up",
  auth: "the AI key was rejected",
  missing: "no AI key is set",
};
const shortModel = (label: string) => label.replace(/^Cadus /, "");
const hostOf = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};
const safeSources = (list?: SourceRef[]) => (Array.isArray(list) ? list : []).filter((x) => x && typeof x.url === "string" && /^https?:\/\//.test(x.url));
const withSources = (text: string, list?: SourceRef[]) => {
  const src = safeSources(list);
  return src.length ? `${text}\n\nSources:\n${src.map((x) => `[${x.n}] ${x.title} - ${x.url}`).join("\n")}` : text;
};
const CONF_LABEL: Record<ReviewMeta["confidence"], string> = { high: "High confidence", moderate: "Moderate confidence", low: "Low confidence" };

function pdfSafe(s: string): string {
  return s
    .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[→⇒]/g, "->").replace(/[•●▪]/g, "-")
    .replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/×/g, "x")
    .replace(/[µμ]/g, "u").replace(/…/g, "...").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

async function exportPdf(title: string, entries: { who: string; text: string }[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 50;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 74, "F");
  doc.setFillColor(29, 78, 216);
  doc.rect(0, 74, W, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Cadus", M, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 170, 184);
  doc.text("CLINICAL AI BY AETHEX", M + 64, 46);
  doc.text(new Date().toLocaleString("en-IN"), W - M, 46, { align: "right" });
  let y = 114;
  doc.setTextColor(16, 24, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  for (const line of doc.splitTextToSize(pdfSafe(title), W - 2 * M) as string[]) {
    doc.text(line, M, y);
    y += 18;
  }
  y += 8;
  for (const e of entries) {
    if (y > H - 100) { doc.addPage(); y = 60; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(29, 78, 216);
    doc.text(e.who.toUpperCase(), M, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(32, 40, 54);
    for (const line of doc.splitTextToSize(pdfSafe(markdownToText(e.text)), W - 2 * M) as string[]) {
      if (y > H - 64) { doc.addPage(); y = 60; }
      doc.text(line, M, y);
      y += 15;
    }
    y += 16;
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 148, 160);
    doc.text("AI-generated clinical decision support. Verify independently before use.", M, H - 30);
    doc.text(`${i} / ${pages}`, W - M, H - 30, { align: "right" });
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "consultation";
  doc.save(`cadus-${slug}.pdf`);
}

function downloadJSON(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function invokeCadus(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await invokeAi("groq-ai", { body });
  if (error) {
    let detail = "";
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") detail = (await ctx.json())?.error ?? "";
    } catch { /* ignore */ }
    throw new Error(detail || error.message || "Request failed");
  }
  if (data?.error) throw new Error(String(data.error));
  return data;
}

function friendlyError(raw: string): string {
  if (/fetch|network|Failed to send|load failed/i.test(raw)) return "Couldn't reach Cadus. Check your connection and try again.";
  if (/No AI key|not configured/i.test(raw)) return "Cadus isn't configured yet. The site owner needs to add the AI key in Cloudflare.";
  if (/rate|busy|429/i.test(raw)) return "Cadus is busy right now. Please try again in a moment.";
  return raw || "Something went wrong. Please try again.";
}

/** The main mode of a chat: the first specialised tool the user picked in it. */
function sessionMode(s: Session): ModeId {
  const m = s.messages.find((x) => x.role === "user" && x.mode !== "general") ?? s.messages.find((x) => x.role === "user");
  return m && MODE[m.mode] ? m.mode : "general";
}

/** Which sidebar filter a chat falls under. */
const sessionCat = (s: Session): ModeDef["cat"] => MODE[sessionMode(s)].cat;

/** Links to other Aethex apps must point at the main domain when Cadus runs on its own subdomain. */
const appHref = (path: string) => (path === "/ai-assistant-classic" || !isCadusHost() ? path : mainUrl(path));

const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 2).trimEnd()}…` : flat;
};

/* ======================================================== library mode */

const SOURCE_LONG: Record<string, string> = { w: "Wikipedia", m: "NIH health pages", d: "the Human Disease Ontology" };

interface LibraryRequest {
  userMsg: Msg;
  hist: { role: string; content: string }[];
  reason: string;
  draftBody: Record<string, unknown>;
  style: StyleId;
  language: string;
  instructions: string;
}

/**
 * Library mode: Claude has no credits (or no valid key), so answer from the offline
 * Cadus Medical Library. The backup model writes the answer from the retrieved
 * passages when it is available; otherwise the passages are quoted directly.
 */
async function answerFromLibrary(req: LibraryRequest): Promise<Msg> {
  const { userMsg, hist, reason } = req;
  const base = { id: uid(), role: "assistant" as const, mode: userMsg.mode, at: Date.now() };
  const why = LIBRARY_REASON[reason] ?? "the AI is unavailable";
  const manifest = await medicalLibrary.manifest();
  if (!manifest) {
    // No library deployed yet: the backup model on its own is the last resort.
    let fb: any = null;
    try {
      fb = await invokeCadus({ ...req.draftBody, allowFallback: true });
    } catch { /* no backup model either: explained below */ }
    if (!fb?.message) throw new Error("AI credits are used up and the offline medical library isn't installed yet.");
    return {
      ...base, content: String(fb.message), provider: fb.provider, model: fb.model,
      reviewNote: `The main AI is unavailable (${why}) and the offline medical library isn't installed, so the backup model answered without the safety review.`,
    };
  }
  const prev = [...hist].reverse().find((m) => m.role === "user")?.content;
  const followUp = !!prev && queryTerms(userMsg.content).length < 5;
  let result: LibraryResult = { terms: [], articles: [], passages: [], missing: [] };
  try {
    result = await medicalLibrary.search(userMsg.content, { context: followUp ? prev : undefined });
  } catch { /* treated as no match */ }
  if (!result.passages.length) {
    return {
      ...base, provider: "library",
      content: `${libraryNotFound(userMsg.content)}\n\n${libraryFootnote("extract", [])}`,
      library: { mode: "extract", reason, articles: 0 },
    };
  }
  const names = [...new Set(result.articles.map((a) => SOURCE_LONG[a.source] ?? "the library"))];
  let content = "";
  let mode: "llm" | "extract" = "extract";
  let provider: Provider = "library";
  let model: string | undefined;
  try {
    const r = await invokeCadus({
      action: "library-answer",
      question: userMsg.content,
      mode: userMsg.mode,
      style: req.style,
      language: req.language,
      history: hist.slice(-4),
      passages: result.passages.map((p) => ({ n: p.n, title: p.title, heading: p.heading, text: p.text.slice(0, 1600) })),
      ...(req.instructions ? { instructions: req.instructions } : {}),
    });
    if (r?.message) {
      content = String(r.message);
      mode = "llm";
      provider = r.provider === "groq" ? "groq" : "library";
      model = r.model;
    }
  } catch { /* no backup model: quote the library instead */ }
  if (!content) content = composeFromLibrary(userMsg.content, result);
  return {
    ...base,
    content: `${content}\n\n${libraryFootnote(mode, names)}`,
    provider,
    model,
    sources: result.articles.filter((a) => a.url).map((a) => ({ n: a.n, url: a.url, title: `${a.title} · ${SOURCE_SHORT[a.source] ?? "Library"}` })),
    library: { mode, reason: why, articles: result.articles.length },
  };
}

/* ================================================================= page */

export default function CadusAI() {
  const { user, isPro, logout } = useUserAuth();
  const systemDark = useMedia("(prefers-color-scheme: dark)");
  const isDesktop = useMedia("(min-width: 900px)");

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [sessions, setSessions] = useState<Session[]>(() =>
    readJSON<Session[]>(SESSIONS_KEY, []).filter((s) => s && typeof s.id === "string" && Array.isArray(s.messages)),
  );
  const [library, setLibrary] = useState<SavedItem[]>(() => readJSON<SavedItem[]>(LIBRARY_KEY, []).filter((x) => x && x.id));
  const [projects, setProjects] = useState<Project[]>(() =>
    readJSON<Project[]>(PROJECTS_KEY, []).filter((p) => p && typeof p.id === "string" && typeof p.name === "string"),
  );
  const [collapsed, setCollapsed] = useState<boolean>(() => !!readJSON<{ collapsed?: boolean }>(UI_KEY, {}).collapsed);
  const [moreOpen, setMoreOpen] = useState<boolean>(() => !!readJSON<{ moreOpen?: boolean }>(UI_KEY, {}).moreOpen);
  const [view, setView] = useState<View>("chat");
  const [projectId, setProjectId] = useState("");
  const [chatFilter, setChatFilter] = useState<ToolTab>("all");
  const [chatSearch, setChatSearch] = useState<string | null>(null);
  const [moveFor, setMoveFor] = useState("");
  const [projectDialog, setProjectDialog] = useState<{ id?: string; name: string; instructions: string; moveSession?: string } | null>(null);
  const [confirmProjectDelete, setConfirmProjectDelete] = useState(false);
  const [libInfo, setLibInfo] = useState<LibraryManifest | null | undefined>(undefined);
  const [libTestQ, setLibTestQ] = useState("");
  const [libTest, setLibTest] = useState<{ q: string; busy: boolean; hits: { title: string; source: string; url: string }[] } | null>(null);
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<ModeId>("general");
  const [input, setInput] = useState("");
  const [image, setImage] = useState("");
  const [pending, setPending] = useState<{ id: string; sid: string; mode: ModeId; image: boolean; stage: "draft" | "review" | "library"; search: boolean; review: boolean } | null>(null);
  const [lastProvider, setLastProvider] = useState<Provider>("claude");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pop, setPop] = useState<string | null>(null);
  const [rowPos, setRowPos] = useState<{ top: number; left: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; text: string; where: "side" | "top" } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palQuery, setPalQuery] = useState("");
  const [palIndex, setPalIndex] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [deck, setDeck] = useState<PresentationData | null>(null);
  const [toolTab, setToolTab] = useState<ToolTab>("all");
  const [libQuery, setLibQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState("");
  const [copied, setCopied] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [usage, setUsage] = useState(() => {
    const u = readJSON(USAGE_KEY, { date: today(), count: 0 });
    return u.date === today() ? u : { date: today(), count: 0 };
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const cancelled = useRef<Set<string>>(new Set());
  const toastTimer = useRef<number | undefined>(undefined);
  const composerRef = useRef<HTMLDivElement>(null);
  const [menuMax, setMenuMax] = useState(480);

  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark);
  const accent = ACCENTS.find((a) => a.id === prefs.accent) ?? ACCENTS[0];
  const active = sessions.find((s) => s.id === activeId);
  const messages = view === "chat" ? active?.messages ?? [] : [];
  const modeDef = MODE[mode];
  const styleDef = STYLES.find((s) => s.id === prefs.style) ?? STYLES[1];
  const modelDef = MODEL_DEF[prefs.model] ?? MODEL_DEF.medius;
  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "";
  const serif = prefs.answerFont !== "sans";
  // Newsreader has a smaller x-height than the sans, so serif answers are set a little larger to read the same.
  const sansSize = prefs.textSize === "s" ? 14 : prefs.textSize === "l" ? 16.5 : 15.5;
  const fontSize = serif ? (prefs.textSize === "s" ? 15.5 : prefs.textSize === "l" ? 18.5 : 17) : sansSize;
  const isHome = view === "chat" && messages.length === 0;
  const showHeroComposer = isHome && isDesktop;
  const showDock = view === "chat" && !showHeroComposer;
  const project = projects.find((p) => p.id === projectId);
  const activeProject = active?.projectId ? projects.find((p) => p.id === active.projectId) : undefined;
  const pinned = sessions.filter((s) => s.pinned);
  const chatQuery = (chatSearch ?? "").trim().toLowerCase();
  const chatList = sessions.filter(
    (s) =>
      !s.pinned &&
      (chatFilter === "all" || sessionCat(s) === chatFilter) &&
      (!chatQuery || s.title.toLowerCase().includes(chatQuery)),
  );
  const decks = useMemo(
    () =>
      sessions
        .flatMap((s) => s.messages.filter((m) => m.deck?.slides?.length).map((m) => ({ s, m })))
        .sort((a, b) => b.m.at - a.m.at),
    [sessions],
  );
  const projectStats = useMemo(() => {
    const out: Record<string, { chats: number; last: number }> = {};
    for (const s of sessions) {
      if (!s.projectId) continue;
      const cur = out[s.projectId] ?? { chats: 0, last: 0 };
      out[s.projectId] = { chats: cur.chats + 1, last: Math.max(cur.last, s.updatedAt) };
    }
    return out;
  }, [sessions]);
  const sortedProjects = [...projects].sort(
    (a, b) => Math.max(b.updatedAt, projectStats[b.id]?.last ?? 0) - Math.max(a.updatedAt, projectStats[a.id]?.last ?? 0),
  );
  const homeHref = isCadusHost() ? mainUrl("/") : "/";
  const signInHref = isCadusHost() ? loginUrl("/") : "/login";

  /* --------------------------------------------------------- effects */

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Cadus · Clinical AI by Aethex";
    const icons = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"));
    const prev = icons.map((l) => l.href);
    icons.forEach((l) => { l.href = CADUS_ICON_DATA_URL; });
    return () => {
      document.title = prevTitle;
      icons.forEach((l, i) => { l.href = prev[i]; });
      try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => writeJSON(PREFS_KEY, { ...prefs, v: PREFS_VERSION }), [prefs]);
  useEffect(() => writeJSON(SESSIONS_KEY, sessions.slice(0, 100)), [sessions]);
  useEffect(() => writeJSON(LIBRARY_KEY, library.slice(0, 300)), [library]);
  useEffect(() => writeJSON(USAGE_KEY, usage), [usage]);
  useEffect(() => writeJSON(PROJECTS_KEY, projects), [projects]);
  useEffect(() => writeJSON(UI_KEY, { collapsed, moreOpen }), [collapsed, moreOpen]);
  useEffect(() => {
    if (view === "project" && !project) setView("projects");
  }, [view, project]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!messages.length) el.scrollTo({ top: 0 });
    else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending?.id, activeId, view]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(260, ta.scrollHeight)}px`;
  }, [input, showHeroComposer, view]);

  useEffect(() => {
    if (!pop) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest(`[data-pop="${pop}"]`)) {
        setPop(null);
        setConfirmDelete("");
        setMoveFor("");
        setConfirmProjectDelete(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        setPalQuery("");
        setPalIndex(0);
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        newChat();
        return;
      }
      if (e.key === "Escape") {
        if (paletteOpen) setPaletteOpen(false);
        else if (projectDialog) setProjectDialog(null);
        else if (settingsOpen) setSettingsOpen(false);
        else if (pop) { setPop(null); setConfirmDelete(""); setMoveFor(""); setConfirmProjectDelete(false); }
        else if (renaming) setRenaming(null);
        else if (sidebarOpen) setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!settingsOpen) setConfirmClear(false);
  }, [settingsOpen]);

  useEffect(() => {
    if (settingsOpen && settingsTab === "data" && libInfo === undefined) void medicalLibrary.manifest().then(setLibInfo);
  }, [settingsOpen, settingsTab, libInfo]);

  const runLibraryTest = async () => {
    const q = libTestQ.trim();
    if (!q) return;
    setLibTest({ q, busy: true, hits: [] });
    try {
      const r = await medicalLibrary.search(q, { maxArticles: 5, maxPassages: 5 });
      setLibTest({ q, busy: false, hits: r.articles.map((a) => ({ title: a.title, source: SOURCE_SHORT[a.source] ?? "Library", url: a.url })) });
    } catch {
      setLibTest({ q, busy: false, hits: [] });
    }
  };

  const toast = (t: string) => {
    setToastMsg(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(""), 2400);
  };

  /* -------------------------------------------------------- sessions */

  const upsert = useCallback((sid: string, fn: (m: Msg[]) => Msg[], title?: string, inProject?: string) => {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === sid);
      const base: Session = existing ?? { id: sid, title: title || "New chat", messages: [], updatedAt: Date.now(), ...(inProject ? { projectId: inProject } : {}) };
      const next: Session = { ...base, messages: fn(base.messages), updatedAt: Date.now() };
      return [next, ...prev.filter((s) => s.id !== sid)];
    });
  }, []);

  /* -------------------------------------------------------- projects */

  const openProjects = () => {
    setView("projects");
    setSidebarOpen(false);
    setPop(null);
  };

  const openProject = (id: string) => {
    setProjectId(id);
    setView("project");
    setActiveId("");
    setInput("");
    setImage("");
    setMode("general");
    setSidebarOpen(false);
    setPop(null);
    setConfirmProjectDelete(false);
  };

  const newProject = (moveSession?: string) => {
    setPop(null);
    setMoveFor("");
    setSidebarOpen(false);
    setProjectDialog({ name: "", instructions: "", moveSession });
  };

  const saveProjectDialog = () => {
    if (!projectDialog) return;
    const name = projectDialog.name.trim().slice(0, 60);
    if (!name) return;
    const instructions = projectDialog.instructions.trim().slice(0, INSTRUCTIONS_MAX);
    if (projectDialog.id) {
      const id = projectDialog.id;
      setProjects((p) => p.map((x) => (x.id === id ? { ...x, name, instructions, updatedAt: Date.now() } : x)));
      toast("Project updated");
    } else {
      const id = uid();
      setProjects((p) => [{ id, name, instructions, createdAt: Date.now(), updatedAt: Date.now() }, ...p]);
      if (projectDialog.moveSession) {
        const sid = projectDialog.moveSession;
        setSessions((p) => p.map((s) => (s.id === sid ? { ...s, projectId: id } : s)));
        toast(`Moved to ${clip(name, 32)}`);
      } else {
        openProject(id);
        focusComposer();
      }
    }
    setProjectDialog(null);
  };

  const deleteProject = (id: string) => {
    setProjects((p) => p.filter((x) => x.id !== id));
    setSessions((p) => p.map((s) => (s.projectId === id ? { ...s, projectId: undefined } : s)));
    setConfirmProjectDelete(false);
    setPop(null);
    setView("projects");
    toast("Project deleted. Its chats are still in your list.");
  };

  const moveToProject = (sid: string, pid?: string) => {
    setSessions((p) => p.map((s) => (s.id === sid ? { ...s, projectId: pid } : s)));
    setMoveFor("");
    setPop(null);
    const name = projects.find((x) => x.id === pid)?.name;
    toast(name ? `Moved to ${clip(name, 32)}` : "Removed from project");
  };

  const instructionsFor = (sid: string, pid?: string) => {
    const owner = pid ?? sessions.find((s) => s.id === sid)?.projectId;
    return owner ? projects.find((p) => p.id === owner)?.instructions || "" : "";
  };

  const focusComposer = () => window.setTimeout(() => taRef.current?.focus(), 60);

  function newChat(m: ModeId = "general") {
    setView("chat");
    setActiveId("");
    setInput("");
    setImage("");
    setMode(m);
    setSidebarOpen(false);
    setPop(null);
    focusComposer();
  }

  const openSession = (id: string) => {
    setView("chat");
    setActiveId(id);
    setSidebarOpen(false);
    setPop(null);
  };

  const deleteSession = (id: string) => {
    setSessions((p) => p.filter((s) => s.id !== id));
    if (id === activeId) setActiveId("");
    setConfirmDelete("");
    setPop(null);
    toast("Chat deleted");
  };

  const togglePin = (id: string) => {
    setSessions((p) => p.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)));
    setPop(null);
  };

  const commitRename = () => {
    if (!renaming) return;
    const text = renaming.text.trim();
    if (text) setSessions((p) => p.map((s) => (s.id === renaming.id ? { ...s, title: text.slice(0, 90) } : s)));
    setRenaming(null);
  };

  const openRowMenu = (e: ReactMouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const key = `row:${id}`;
    if (pop === key) { setPop(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setRowPos({ top: Math.max(8, Math.min(r.bottom + 4, window.innerHeight - 280)), left: Math.max(8, Math.min(r.left - 6, window.innerWidth - 248)) });
    setConfirmDelete("");
    setMoveFor("");
    setPop(key);
  };

  /* ------------------------------------------------------------ send */

  const runRequest = useCallback(
    async (sid: string, history: Msg[], userMsg: Msg, instructions = "") => {
      const reqId = uid();
      const search = userMsg.mode === "research" || !!userMsg.search;
      const doReview = prefs.safetyReview;
      const project = instructions.trim() ? { instructions: instructions.trim() } : {};
      setPending({ id: reqId, sid, mode: userMsg.mode, image: !!userMsg.image, stage: "draft", search, review: doReview });
      setUsage((u) => (u.date === today() ? { ...u, count: u.count + 1 } : { date: today(), count: 1 }));
      const hist = history.filter((m) => !m.error && !m.stopped).slice(-16).map((m) => ({ role: m.role, content: m.content }));
      let reply: Msg;
      try {
        if (userMsg.mode === "slides") {
          const data = await invokeCadus({ action: "generate-slides", topic: userMsg.content, review: doReview, model: prefs.model, ...project });
          const d = data?.presentation as PresentationData | undefined;
          if (!d?.slides?.length) throw new Error("No slides were returned. Please try again.");
          reply = {
            id: uid(), role: "assistant", mode: "slides", at: Date.now(), deck: d, provider: data.provider, model: data.model,
            review: data.review ?? undefined,
            reviewNote: doReview && !data.review ? "The fact-check couldn't run for this deck. Review it before teaching." : undefined,
            content: `Your lecture deck **${d.title}** is ready: ${d.slides.length} slides covering ${d.subtitle || "the topic"}.`,
          };
        } else {
          // Step 1: draft (optionally grounded in live, cited sources)
          const draftBody = {
            action: userMsg.image ? "analyze-image" : "chat",
            message: userMsg.content,
            image: userMsg.image,
            mode: userMsg.mode,
            style: prefs.style,
            language: prefs.language,
            history: hist,
            search,
            // Cadus can answer from the offline medical library when the AI has no credits.
            library: true,
            model: prefs.model,
            ...project,
          };
          const draft = await invokeCadus(draftBody);
          if (cancelled.current.has(reqId)) return;
          if (draft?.libraryMode) {
            // No AI credits (or no valid key): answer from the offline medical library.
            setPending((p) => (p?.id === reqId ? { ...p, stage: "library", review: false } : p));
            reply = await answerFromLibrary({
              userMsg, hist, reason: String(draft.reason || "credits"), draftBody,
              style: prefs.style, language: prefs.language, instructions: instructions.trim(),
            });
          } else {
            if (!draft?.message) throw new Error("Cadus returned an empty answer. Please try again.");
            const sources = safeSources(draft.sources);
            let content = String(draft.message);
            let review: ReviewMeta | undefined;
            let reviewNote: string | undefined;
            // Step 2: safety review by a second model
            if (doReview) {
              setPending((p) => (p?.id === reqId ? { ...p, stage: "review" } : p));
              try {
                const rv = await invokeCadus({
                  action: "review",
                  mode: userMsg.mode,
                  question: userMsg.content,
                  draft: content,
                  history: hist.slice(-6),
                  sources,
                  image: userMsg.image,
                  language: prefs.language,
                  ...project,
                });
                if (rv?.message) {
                  content = String(rv.message);
                  review = rv.review ?? undefined;
                } else {
                  reviewNote = "The safety review didn't return a result for this answer. Check it carefully before relying on it.";
                }
              } catch {
                reviewNote = "The safety review couldn't run for this answer. Check it carefully before relying on it.";
              }
            }
            reply = {
              id: uid(), role: "assistant", mode: userMsg.mode, at: Date.now(), content,
              provider: draft.provider, model: draft.model,
              sources: sources.length ? sources : undefined,
              queries: Array.isArray(draft.queries) && draft.queries.length ? draft.queries : undefined,
              review, reviewNote,
            };
          }
        }
      } catch (e) {
        reply = { id: uid(), role: "assistant", mode: userMsg.mode, at: Date.now(), error: true, content: friendlyError(e instanceof Error ? e.message : String(e)) };
      }
      if (cancelled.current.has(reqId)) return;
      if (reply.provider) setLastProvider(reply.provider);
      upsert(sid, (m) => [...m, reply]);
      setPending((p) => (p?.id === reqId ? null : p));
    },
    [prefs.style, prefs.language, prefs.safetyReview, prefs.model, upsert],
  );

  const send = (textOverride?: string, modeOverride?: ModeId) => {
    const text = (textOverride ?? input).trim();
    const m = modeOverride ?? mode;
    if ((!text && !image) || pending) return;
    const isNew = !(view === "chat" && activeId);
    const sid = isNew ? uid() : activeId;
    // A chat started from a project page belongs to that project.
    const inProject = isNew && view === "project" && project ? project.id : undefined;
    const userMsg: Msg = { id: uid(), role: "user", content: text || "Please analyse this image.", mode: m, image: image || undefined, at: Date.now(), search: prefs.sources || m === "research" };
    const history = sessions.find((s) => s.id === sid)?.messages ?? [];
    upsert(sid, (msgs) => [...msgs, userMsg], clip(text || "Image analysis", 64), inProject);
    setView("chat");
    setActiveId(sid);
    setMode(m);
    setInput("");
    setImage("");
    setPop(null);
    focusComposer();
    void runRequest(sid, history, userMsg, instructionsFor(sid, inProject));
  };

  // Links from the rest of Aethex open Cadus with a question (?q=), which is asked
  // straight away, or a case to discuss (?context=), which goes into the composer.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim() ?? "";
    let context = params.get("context")?.trim() ?? "";
    if (!q && !context) return;
    try { context = decodeURIComponent(context); } catch { /* already plain text */ }
    params.delete("q");
    params.delete("context");
    const rest = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
    if (q) send(q.slice(0, 4000));
    else {
      setInput(context.slice(0, 12000));
      focusComposer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    if (!pending) return;
    cancelled.current.add(pending.id);
    upsert(pending.sid, (m) => [...m, { id: uid(), role: "assistant", mode: pending.mode, at: Date.now(), content: "Response stopped.", stopped: true }]);
    setPending(null);
  };

  const regenerate = (assistantId: string) => {
    if (!active || pending) return;
    const idx = active.messages.findIndex((m) => m.id === assistantId);
    let userIdx = -1;
    for (let i = idx - 1; i >= 0; i--) if (active.messages[i].role === "user") { userIdx = i; break; }
    if (userIdx < 0) return;
    const userMsg = active.messages[userIdx];
    upsert(active.id, (msgs) => msgs.slice(0, userIdx + 1));
    void runRequest(active.id, active.messages.slice(0, userIdx), userMsg, instructionsFor(active.id));
  };

  /* --------------------------------------------------------- actions */

  const questionFor = (m: Msg): string => {
    const idx = messages.findIndex((x) => x.id === m.id);
    return [...messages.slice(0, Math.max(idx, 0))].reverse().find((x) => x.role === "user")?.content || active?.title || "Cadus answer";
  };

  const copy = async (m: Msg) => {
    try {
      await navigator.clipboard.writeText(withSources(m.content, m.sources));
      setCopied(m.id);
      window.setTimeout(() => setCopied(""), 1600);
      toast("Copied to clipboard");
    } catch {
      toast("Couldn't copy to the clipboard");
    }
  };

  const savedIds = useMemo(() => new Set(library.map((x) => x.messageId)), [library]);
  const toggleSave = (m: Msg) => {
    if (savedIds.has(m.id)) {
      setLibrary((l) => l.filter((x) => x.messageId !== m.id));
      toast("Removed from Library");
      return;
    }
    setLibrary((l) => [{ id: uid(), sessionId: activeId, messageId: m.id, question: questionFor(m), answer: m.content, mode: m.mode, at: Date.now(), sources: safeSources(m.sources) }, ...l]);
    toast("Saved to Library");
  };

  const speak = (m: Msg) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) { toast("Read aloud isn't supported in this browser"); return; }
    if (speakingId === m.id) { synth.cancel(); setSpeakingId(""); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(markdownToText(m.content).slice(0, 6000));
    u.lang = prefs.language === "Hindi" ? "hi-IN" : "en-IN";
    const done = () => setSpeakingId((id) => (id === m.id ? "" : id));
    u.onend = done;
    u.onerror = done;
    setSpeakingId(m.id);
    synth.speak(u);
  };

  const exportAnswer = (m: Msg) => {
    void exportPdf(active?.title || "Cadus answer", [{ who: "Question", text: questionFor(m) }, { who: m.review ? "Cadus (safety-reviewed)" : "Cadus", text: withSources(m.content, m.sources) }]);
  };

  const exportSession = (s?: Session) => {
    const target = s ?? active;
    if (!target) return;
    setPop(null);
    void exportPdf(target.title, target.messages.filter((m) => !m.stopped).map((m) => ({ who: m.role === "user" ? "You" : m.review ? "Cadus (safety-reviewed)" : "Cadus", text: withSources(m.content, m.sources) })));
  };

  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast("Please choose an image file"); return; }
    try {
      setImage(await fileToDataUrl(f));
      setMode("image");
      setPop(null);
      taRef.current?.focus();
    } catch {
      toast("Couldn't read that image");
    }
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast("Voice input isn't supported in this browser"); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = prefs.language === "Hindi" ? "hi-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput((base ? `${base} ` : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const pickMode = (id: ModeId) => {
    setMode(id);
    setPop(null);
    if (id === "image" && !image) fileRef.current?.click();
    focusComposer();
  };

  const startTool = (id: ModeId) => {
    newChat(id);
    if (id === "image") window.setTimeout(() => fileRef.current?.click(), 80);
  };

  const openSettings = (tab: SettingsTab = "general") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
    setPop(null);
    setSidebarOpen(false);
  };

  const togglePop = (key: string) => setPop((p) => (p === key ? null : key));

  /** Open a composer menu sized to the space available above or below the composer. */
  const toggleComposerMenu = (key: "add" | "tools", placement: "hero" | "dock") => {
    const r = composerRef.current?.getBoundingClientRect();
    if (r) setMenuMax(Math.max(220, Math.floor(placement === "hero" ? window.innerHeight - r.bottom - 20 : r.top - 20)));
    togglePop(key);
  };

  /* --------------------------------------------------------- palette */

  const paletteSections = (() => {
    const q = palQuery.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);
    const actions: PaletteItem[] = [
      { key: "a:new", label: "New chat", hint: `${MOD} ⇧ O`, icon: SquarePen, run: () => newChat() },
      { key: "a:newproj", label: "New project", icon: FolderPlus, run: () => newProject() },
      { key: "a:projects", label: "Open projects", icon: Folder, run: () => openProjects() },
      { key: "a:lib", label: "Open Library", icon: Library, run: () => setView("library") },
      { key: "a:decks", label: "Open decks", icon: Presentation, run: () => setView("decks") },
      { key: "a:tools", label: "Browse clinical tools", icon: LayoutGrid, run: () => setView("tools") },
      { key: "a:theme", label: dark ? "Switch to light theme" : "Switch to dark theme", icon: dark ? Sun : Moon, run: () => setPrefs((p) => ({ ...p, theme: dark ? "light" : "dark" })) },
      { key: "a:font", label: serif ? "Use sans-serif answers" : "Use serif answers", icon: Palette, run: () => setPrefs((p) => ({ ...p, answerFont: serif ? "sans" : "serif" })) },
      { key: "a:settings", label: "Open settings", icon: Settings, run: () => openSettings() },
    ].filter((a) => match(a.label));
    const projectItems: PaletteItem[] = sortedProjects
      .filter((p) => match(p.name))
      .slice(0, 6)
      .map((p) => ({ key: `p:${p.id}`, label: p.name, hint: `${projectStats[p.id]?.chats ?? 0} chats`, icon: Folder, run: () => openProject(p.id) }));
    const tools: PaletteItem[] = TOOL_MODES.filter((m) => match(m.label) || match(m.desc)).map((m) => ({
      key: `t:${m.id}`, label: m.label, hint: m.desc, icon: m.icon, run: () => startTool(m.id),
    }));
    const chats: PaletteItem[] = sessions
      .filter((s) => match(s.title) || (q.length > 2 && s.messages.some((m) => m.content.toLowerCase().includes(q))))
      .slice(0, 8)
      .map((s) => ({ key: `c:${s.id}`, label: s.title, hint: relTime(s.updatedAt), icon: MODE[sessionMode(s)].icon, run: () => openSession(s.id) }));
    return [
      { label: "Chats", items: chats },
      { label: "Projects", items: projectItems },
      { label: "Actions", items: actions },
      { label: "Clinical tools", items: tools },
    ].filter((s) => s.items.length > 0);
  })();
  const palFlat = paletteSections.flatMap((s) => s.items);

  const runPalette = (item?: PaletteItem) => {
    if (!item) return;
    setPaletteOpen(false);
    item.run();
  };

  const openPalette = () => {
    setPaletteOpen(true);
    setPalQuery("");
    setPalIndex(0);
    setSidebarOpen(false);
  };

  /* ------------------------------------------------------- renderers */

  const toolCard = (m: ModeDef, withExample = false) => (
    <button key={m.id} className="cx-card" onClick={() => startTool(m.id)}>
      <span className="cx-card-ic"><m.icon size={18} /></span>
      <b>{m.label}</b>
      <small>{m.desc}</small>
      {withExample && <span className="cx-card-ex">“{m.example}”</span>}
      <span className="cx-card-go">Start <ArrowRight size={14} /></span>
    </button>
  );

  const toolsFiltered = TOOL_MODES.filter((m) => toolTab === "all" || m.cat === toolTab);

  const toolTabs = (
    <div className="cx-tabs" role="tablist">
      {TOOL_TABS.map((t) => (
        <button key={t.id} role="tab" aria-selected={toolTab === t.id} className={toolTab === t.id ? "on" : ""} onClick={() => setToolTab(t.id)}>{t.label}</button>
      ))}
    </div>
  );

  const composer = (placement: "hero" | "dock") => (
    <div ref={composerRef} className={`cx-composer ${placement === "hero" ? "is-hero" : ""} ${listening ? "is-rec" : ""}`}>
      {image && (
        <div className="cx-att-row">
          <div className="cx-att">
            <img src={image} alt="Attached" />
            <div><b>Image attached</b><small>Ready to analyse</small></div>
            <button onClick={() => setImage("")} aria-label="Remove image"><X size={14} /></button>
          </div>
        </div>
      )}
      <textarea
        ref={taRef}
        value={input}
        rows={1}
        placeholder={view === "project" && project && mode === "general" ? `Start a new chat in ${project.name}…` : modeDef.placeholder}
        aria-label="Message Cadus"
        onChange={(e) => setInput(e.target.value)}
        onPaste={(e) => {
          const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
          if (f) { e.preventDefault(); void onFile(f); }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && prefs.enterToSend && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="cx-cbar">
        <div className="cx-cbar-l">
          <button className={`cx-cbtn bordered cx-tip ${pop === "add" ? "open" : ""}`} data-pop="add" data-tip="Add image" onClick={() => toggleComposerMenu("add", placement)} aria-label="Add image"><Plus size={18} /></button>
          <button className={`cx-cbtn cx-tools-btn ${pop === "tools" ? "open" : ""}`} data-pop="tools" onClick={() => toggleComposerMenu("tools", placement)} aria-haspopup="menu" aria-expanded={pop === "tools"}>
            <SlidersHorizontal size={16} /><span>Tools</span>
          </button>
          <button
            className={`cx-cbtn cx-src cx-tip ${prefs.sources || mode === "research" ? "on" : ""}`}
            data-tip={mode === "research" ? "Deep research always searches sources" : prefs.sources ? "Sources on: cites WHO, NICE, ICMR, PubMed" : "Search trusted medical sources"}
            aria-pressed={prefs.sources || mode === "research"}
            onClick={() => { if (mode !== "research") setPrefs((p) => ({ ...p, sources: !p.sources })); }}
          >
            <Globe size={16} /><span>Sources</span>
          </button>
          {mode !== "general" && (
            <span className="cx-mode-pill">
              <modeDef.icon size={14} />
              <span>{modeDef.label}</span>
              <button onClick={() => setMode("general")} aria-label="Clear tool"><X size={12} /></button>
            </span>
          )}
        </div>
        <div className="cx-cbar-r">
          {listening && <span className="cx-rec-l"><i /> Listening</span>}
          <button className={`cx-cbtn cx-tip ${listening ? "rec" : ""}`} data-tip={listening ? "Stop dictation" : "Dictate"} onClick={toggleVoice} aria-label="Dictate"><Mic size={18} /></button>
          {pending ? (
            <button className="cx-send cx-tip" data-tip="Stop" onClick={stop} aria-label="Stop response"><Square size={12} fill="currentColor" /></button>
          ) : (
            <button className="cx-send" onClick={() => send()} disabled={!input.trim() && !image} aria-label="Send"><ArrowUp size={18} /></button>
          )}
        </div>
      </div>
      {pop === "add" && (
        <div className={`cx-pop cx-add-menu ${placement === "hero" ? "down" : "up"}`} data-pop="add" role="menu" style={{ maxHeight: menuMax }}>
          <button className="cx-pop-i" onClick={() => { setPop(null); fileRef.current?.click(); }}><ImagePlus size={16} /> Upload an image <span className="r">X-ray, ECG, report</span></button>
          <button className="cx-pop-i" onClick={() => { setPop(null); setCameraOpen(true); }}><Camera size={16} /> Take a photo</button>
          <div className="cx-pop-sep" />
          <p className="cx-pop-gl">Tip: paste an image straight into the message box</p>
        </div>
      )}
      {pop === "tools" && (
        <div className={`cx-pop cx-tools-menu ${placement === "hero" ? "down" : "up"}`} data-pop="tools" role="menu" style={{ maxHeight: menuMax }}>
          <div className="cx-tools-grid">
            <p className="cx-pop-gl">Default</p>
            <button className={`cx-tool-i ${mode === "general" ? "on" : ""}`} onClick={() => pickMode("general")}>
              <span className="cx-tool-i-ic"><Sparkles size={15} /></span>
              <span><b>General</b><small>Any clinical or academic question</small></span>
            </button>
            <span />
            {GROUPS.map((g) => [
              <p key={`${g.label}-h`} className="cx-pop-gl">{g.label}</p>,
              ...g.ids.map((id) => {
                const m = MODE[id];
                return (
                  <button key={id} className={`cx-tool-i ${mode === id ? "on" : ""}`} onClick={() => pickMode(id)}>
                    <span className="cx-tool-i-ic"><m.icon size={15} /></span>
                    <span><b>{m.label}</b><small>{m.desc}</small></span>
                  </button>
                );
              }),
            ])}
          </div>
        </div>
      )}
    </div>
  );

  /** One-line labels for the home page's quick actions. */
  const QUICK_LABEL: Partial<Record<ModeId, string>> = { ddx: "Differentials", drugs: "Interactions", labs: "Lab results", slides: "Lecture slides", mcq: "Exam MCQs" };
  const recentChats = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 7);
  const projectName = (id?: string) => (id ? projects.find((p) => p.id === id)?.name : undefined);
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  /** The home page is a small workspace dashboard: ask, then pick up recent work. */
  const renderHome = () => (
    <section className="cx-home">
      <div className="cx-dash">
        <header className="cx-dash-h">
          <div>
            <h1>{greeting()}{firstName ? `, ${firstName}` : ""}</h1>
            <p>Ask a clinical question, or pick up where you left off.</p>
          </div>
          <span className="cx-dash-date">{todayLabel}</span>
        </header>
        {showHeroComposer && <div className="cx-hero-c">{composer("hero")}</div>}
        <div className="cx-quick">
          {QUICK.map((id) => {
            const m = MODE[id];
            return <button key={id} className="cx-q" onClick={() => startTool(id)} title={m.desc}><m.icon size={15} /> {QUICK_LABEL[id] ?? m.short}</button>;
          })}
          <button className="cx-q more" onClick={() => setView("tools")}><LayoutGrid size={15} /> All tools</button>
        </div>

        <div className="cx-panels">
          <div className="cx-panel-col">
            <section className="cx-panel">
              <header className="cx-panel-h">
                <b><History size={15} /> Recent chats</b>
                {sessions.length > 0 && <button onClick={openPalette}><Search size={13} /> Search</button>}
              </header>
              <div className="cx-panel-b">
                {recentChats.length ? recentChats.map((s) => {
                  const m = MODE[sessionMode(s)];
                  const proj = projectName(s.projectId);
                  return (
                    <button key={s.id} className="cx-li" onClick={() => openSession(s.id)}>
                      <span className="cx-li-ic"><m.icon size={14} /></span>
                      <span className="cx-li-t"><b>{s.title}</b><small>{m.label}{proj ? ` · ${proj}` : ""}</small></span>
                      <span className="cx-li-m">{relTime(s.updatedAt)}</span>
                    </button>
                  );
                }) : (
                  <>
                    <p className="cx-panel-empty">Your chats will appear here. Try a sample case:</p>
                    {EXAMPLES.slice(0, 3).map((ex) => {
                      const m = MODE[ex.mode];
                      return (
                        <button key={ex.text} className="cx-li" onClick={() => send(ex.text, ex.mode)}>
                          <span className="cx-li-ic"><m.icon size={14} /></span>
                          <span className="cx-li-t"><b>{ex.text}</b><small>{m.label}</small></span>
                          <ArrowRight size={14} className="cx-li-go" />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </section>
            <section className="cx-panel">
              <header className="cx-panel-h">
                <b><Folder size={15} /> Projects</b>
                <button onClick={projects.length ? openProjects : () => setProjectDialog({ name: "", instructions: "" })}>{projects.length ? "All projects" : <><Plus size={13} /> New project</>}</button>
              </header>
              <div className="cx-panel-b">
                {sortedProjects.length ? sortedProjects.slice(0, 3).map((p) => {
                  const st = projectStats[p.id];
                  const n = st?.chats ?? 0;
                  return (
                    <button key={p.id} className="cx-li" onClick={() => openProject(p.id)}>
                      <span className="cx-li-ic"><Folder size={14} /></span>
                      <span className="cx-li-t"><b>{p.name}</b><small>{n} chat{n === 1 ? "" : "s"}{p.instructions.trim() ? " · Custom instructions" : ""}</small></span>
                      <span className="cx-li-m">{relTime(Math.max(p.updatedAt, st?.last ?? 0))}</span>
                    </button>
                  );
                }) : <p className="cx-panel-empty">Group the chats for a rotation, an exam or a thesis, and give Cadus standing instructions for each.</p>}
              </div>
            </section>
          </div>

          <div className="cx-panel-col">
            <section className="cx-panel">
              <header className="cx-panel-h">
                <b><Zap size={15} /> Today</b>
                <span className="cx-plan">{isPro ? "Pro" : "Free"}</span>
              </header>
              <div className="cx-today">
                <div>
                  <div className="cx-meter-top"><span>Questions asked</span><b>{isPro ? `${usage.count} · Unlimited` : `${usage.count} of ${FREE_DAILY}`}</b></div>
                  {!isPro && <div className="cx-meter"><i style={{ width: `${Math.min(100, (usage.count / FREE_DAILY) * 100)}%` }} /></div>}
                </div>
                <div className="cx-stat-row">
                  <span><ShieldCheck size={15} /> Safety review</span>
                  {prefs.safetyReview ? <em>On</em> : <button onClick={() => setPrefs({ ...prefs, safetyReview: true })}>Turn on</button>}
                </div>
                <div className="cx-stat-row">
                  <span><Globe size={15} /> Cited sources</span>
                  {prefs.sources ? <em>On</em> : <button onClick={() => setPrefs({ ...prefs, sources: true })}>Turn on</button>}
                </div>
              </div>
            </section>
            <section className="cx-panel">
              <header className="cx-panel-h">
                <b><Bookmark size={15} /> Saved answers</b>
                {library.length > 0 && <button onClick={() => setView("library")}>Library</button>}
              </header>
              <div className="cx-panel-b">
                {library.length ? library.slice(0, 3).map((x) => {
                  const m = MODE[x.mode] ?? MODE.general;
                  return (
                    <button key={x.id} className="cx-li" onClick={() => setView("library")}>
                      <span className="cx-li-ic"><m.icon size={14} /></span>
                      <span className="cx-li-t"><b>{x.question}</b><small>{m.label}</small></span>
                      <span className="cx-li-m">{relTime(x.at)}</span>
                    </button>
                  );
                }) : <p className="cx-panel-empty">Tap the bookmark under any answer to keep it here for ward rounds and revision.</p>}
              </div>
            </section>
            <section className="cx-panel">
              <header className="cx-panel-h">
                <b><Presentation size={15} /> Lecture decks</b>
                <button onClick={decks.length ? () => setView("decks") : () => startTool("slides")}>{decks.length ? "All decks" : <><Plus size={13} /> New deck</>}</button>
              </header>
              <div className="cx-panel-b">
                {decks.length ? decks.slice(0, 3).map(({ m }) => {
                  const d = m.deck!;
                  return (
                    <button key={m.id} className="cx-li" onClick={() => setDeck(d)} title={`Present ${d.title}`}>
                      <span className="cx-li-ic"><Play size={13} /></span>
                      <span className="cx-li-t"><b>{d.title}</b><small>{d.slides.length} slides{m.review ? " · Fact-checked" : ""}</small></span>
                      <span className="cx-li-m">{relTime(m.at)}</span>
                    </button>
                  );
                }) : <p className="cx-panel-empty">Ask for a lecture on any topic and Cadus builds a fact-checked teaching deck.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
      <p className="cx-home-note">
        <ShieldCheck size={13} /> Clinical decision support. {prefs.safetyReview ? "Every answer is checked by a second AI model, but" : "Cadus can make mistakes, so"} always verify before acting.
      </p>
    </section>
  );

  const renderTools = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div><h1>Clinical tools</h1><p>Twelve specialised modes. Each one changes how Cadus structures its answer, from ranked differentials to ready-to-present lecture decks.</p></div>
        {toolTabs}
      </header>
      <div className="cx-grid">{toolsFiltered.map((m) => toolCard(m, true))}</div>
      <section className="cx-section">
        <div className="cx-section-h"><div><h2>Try an example</h2><p>Run a sample case to see how Cadus reasons and checks its answer</p></div></div>
        <div className="cx-ex-grid">
          {EXAMPLES.map((ex) => {
            const m = MODE[ex.mode];
            return (
              <button key={ex.text} className="cx-ex" onClick={() => send(ex.text, ex.mode)}>
                <span className="cx-badge"><m.icon size={12} /> {m.label}</span>
                <p>{ex.text}</p>
                <span className="cx-ex-f">Run example <ArrowRight size={15} /></span>
              </button>
            );
          })}
        </div>
      </section>
      <footer className="cx-trust">
        <span><ShieldCheck size={14} /> Every answer checked by a second AI model</span>
        <span><Globe size={14} /> Cites WHO, NICE, ICMR and PubMed with Sources on</span>
        <span><Laptop size={14} /> Chat history stays on this device</span>
        <span><Stethoscope size={14} /> Decision support, not a diagnosis</span>
      </footer>
    </section>
  );

  const libFiltered = library.filter((x) => {
    const q = libQuery.trim().toLowerCase();
    return !q || x.question.toLowerCase().includes(q) || x.answer.toLowerCase().includes(q);
  });

  const renderLibrary = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div><h1>Library</h1><p>Answers you've saved for quick reference. Saved items stay even if you delete the chat.</p></div>
        {library.length > 0 && (
          <label className="cx-search">
            <Search size={15} />
            <input value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder="Search saved answers" />
          </label>
        )}
      </header>
      {library.length === 0 ? (
        <div className="cx-empty-state">
          <CadusMark size={40} />
          <h3>Nothing saved yet</h3>
          <p>Tap the bookmark under any answer to keep it here, ready for ward rounds, revision or teaching.</p>
          <button className="cx-btn" onClick={() => newChat()}><SquarePen size={15} /> Start a chat</button>
        </div>
      ) : libFiltered.length === 0 ? (
        <div className="cx-empty-state"><h3>No matches</h3><p>Try a different search term.</p></div>
      ) : (
        <div className="cx-lib">
          {libFiltered.map((x) => {
            const m = MODE[x.mode] ?? MODE.general;
            const exists = sessions.some((s) => s.id === x.sessionId);
            return (
              <article key={x.id} className="cx-lib-card">
                <div className="cx-lib-meta"><span className="cx-badge"><m.icon size={12} /> {m.label}</span><span>{relTime(x.at)}</span></div>
                <h3>{x.question}</h3>
                <p>{markdownToText(x.answer)}</p>
                <div className="cx-lib-acts">
                  <button onClick={() => openSession(x.sessionId)} disabled={!exists} title={exists ? "Open the original chat" : "The original chat was deleted"}><ExternalLink size={13} /> Open chat</button>
                  <button onClick={() => { void navigator.clipboard?.writeText(withSources(x.answer, x.sources)); toast("Copied to clipboard"); }}><Copy size={13} /> Copy</button>
                  <button onClick={() => void exportPdf(x.question, [{ who: "Question", text: x.question }, { who: "Cadus", text: withSources(x.answer, x.sources) }])}><Download size={13} /> PDF</button>
                  <button className="danger" onClick={() => { setLibrary((l) => l.filter((y) => y.id !== x.id)); toast("Removed from Library"); }}><Trash2 size={13} /> Remove</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const editProject = (p: Project) => {
    setPop(null);
    setProjectDialog({ id: p.id, name: p.name, instructions: p.instructions });
  };

  const renderProjects = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div>
          <h1>Projects</h1>
          <p>Keep related chats together and give Cadus standing instructions for each one, such as a rotation, an exam or a thesis.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn primary" onClick={() => newProject()}><Plus size={15} /> New project</button>
        </div>
      </header>
      {projects.length === 0 ? (
        <div className="cx-empty-state">
          <span className="cx-proj-ic" style={{ marginBottom: 0 }}><Folder size={20} /></span>
          <h3>Create your first project</h3>
          <p>A project holds its own chats and instructions, so Cadus answers every question in it with the right audience, focus and format.</p>
          <div className="cx-ideas">
            {PROJECT_IDEAS.map((n) => (
              <button key={n} className="cx-chip" onClick={() => setProjectDialog({ name: n, instructions: "" })}><Plus size={14} /> {n}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="cx-projects">
          {sortedProjects.map((p) => {
            const st = projectStats[p.id];
            const n = st?.chats ?? 0;
            return (
              <button key={p.id} className="cx-proj" onClick={() => openProject(p.id)}>
                <span className="cx-proj-ic"><Folder size={18} /></span>
                <b>{p.name}</b>
                <small>{p.instructions || "No instructions yet"}</small>
                <span className="cx-proj-f"><MessageSquare size={13} /> {n} chat{n === 1 ? "" : "s"} · Updated {relTime(Math.max(p.updatedAt, st?.last ?? 0))}</span>
              </button>
            );
          })}
          <button className="cx-proj add" onClick={() => newProject()}><span className="cx-proj-ic"><FolderPlus size={18} /></span>New project</button>
        </div>
      )}
    </section>
  );

  const renderProject = () => {
    if (!project) return null;
    const list = sessions.filter((s) => s.projectId === project.id);
    const ids = new Set(list.map((s) => s.id));
    const saved = library.filter((x) => ids.has(x.sessionId)).length;
    const last = Math.max(project.updatedAt, projectStats[project.id]?.last ?? 0);
    return (
      <section className="cx-page">
        <button className="cx-back" onClick={openProjects}><ArrowLeft size={15} /> All projects</button>
        <header className="cx-page-h">
          <div>
            <h1>{project.name}</h1>
            <p>{list.length ? `${list.length} chat${list.length === 1 ? "" : "s"} · Updated ${relTime(last)}` : `Created ${relTime(project.createdAt)}`}</p>
          </div>
          <div className="cx-page-acts">
            <button className="cx-btn" onClick={() => editProject(project)}><Pencil size={14} /> Edit</button>
            <div className="cx-rel" data-pop="proj">
              <button className="cx-ib" onClick={() => { setConfirmProjectDelete(false); togglePop("proj"); }} aria-label="Project options" aria-haspopup="menu" aria-expanded={pop === "proj"}>
                <MoreHorizontal size={18} />
              </button>
              {pop === "proj" && (
                <div className="cx-pop cx-proj-menu" role="menu">
                  {confirmProjectDelete ? (
                    <>
                      <p className="cx-pop-gl">Delete “{clip(project.name, 24)}”? Its chats stay in your list.</p>
                      <button className="cx-pop-i danger" onClick={() => deleteProject(project.id)}><Trash2 size={16} /> Delete project</button>
                      <button className="cx-pop-i" onClick={() => setConfirmProjectDelete(false)}><X size={16} /> Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="cx-pop-i" onClick={() => editProject(project)}><Pencil size={16} /> Edit name and instructions</button>
                      <button
                        className="cx-pop-i"
                        onClick={() => {
                          setPop(null);
                          downloadJSON(`cadus-project-${today()}.json`, { exportedAt: new Date().toISOString(), project, sessions: list });
                        }}
                      >
                        <Download size={16} /> Export project
                      </button>
                      <div className="cx-pop-sep" />
                      <button className="cx-pop-i danger" onClick={() => setConfirmProjectDelete(true)}><Trash2 size={16} /> Delete project</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="cx-proj-layout">
          <div>
            {composer("hero")}
            <div className="cx-proj-chats">
              <p className="cx-sub-h"><span>Chats in this project</span>{list.length > 0 && <span>{list.length}</span>}</p>
              {list.length === 0 ? (
                <div className="cx-hist-empty">Start a chat above and it is saved here. You can also move an existing chat in from its ⋯ menu in the sidebar.</div>
              ) : (
                list.map((s) => {
                  const I = MODE[sessionMode(s)].icon;
                  const reply = [...s.messages].reverse().find((m) => m.role === "assistant" && !m.error && !m.stopped);
                  return (
                    <button key={s.id} className="cx-pchat" onClick={() => openSession(s.id)}>
                      <span className="cx-pchat-ic"><I size={16} /></span>
                      <span className="cx-pchat-t">
                        <b>{s.title}</b>
                        <small>{relTime(s.updatedAt)}{reply ? ` · ${clip(markdownToText(reply.content), 96)}` : ""}</small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <aside>
            <div className="cx-pcard">
              <div className="cx-pcard-h">
                <b><SlidersHorizontal size={14} /> Instructions</b>
                <button onClick={() => editProject(project)}>{project.instructions ? "Edit" : "Add"}</button>
              </div>
              {project.instructions ? (
                <p>{project.instructions}</p>
              ) : (
                <p className="muted">Tell Cadus how to answer in this project: who it is for, what to focus on, the format you prefer and the guidelines to follow.</p>
              )}
            </div>
            <div className="cx-pcard">
              <div className="cx-pcard-stats">
                <div><b>{list.length}</b><small>Chats</small></div>
                <div><b>{saved}</b><small>Saved answers</small></div>
              </div>
            </div>
            <p className="cx-pcard-note"><ShieldCheck size={14} /> Instructions shape focus and format. Cadus's clinical standards and safety review always apply.</p>
          </aside>
        </div>
      </section>
    );
  };

  const renderDecks = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div>
          <h1>Decks</h1>
          <p>Every lecture deck you've made with Cadus, ready to present in one click.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn primary" onClick={() => startTool("slides")}><Plus size={15} /> New deck</button>
        </div>
      </header>
      {decks.length === 0 ? (
        <div className="cx-empty-state">
          <span className="cx-proj-ic" style={{ marginBottom: 0 }}><Presentation size={20} /></span>
          <h3>No decks yet</h3>
          <p>Ask for a lecture on any topic and Cadus designs a complete teaching deck, fact-checked slide by slide, that you can present straight away.</p>
          <button className="cx-btn" onClick={() => startTool("slides")}><Presentation size={15} /> Make a deck</button>
        </div>
      ) : (
        <div className="cx-decks">
          {decks.map(({ s, m }) => {
            const d = m.deck!;
            return (
              <article key={m.id} className="cx-dk">
                <button className="cx-dk-cover" onClick={() => setDeck(d)} aria-label={`Present ${d.title}`}>
                  <span className="cx-dk-k"><CadusMark size={14} variant="mono" color="rgba(255,255,255,.72)" /> Lecture deck</span>
                  <b>{d.title}</b>
                  <small>{d.subtitle}</small>
                  <span className="cx-dk-play"><Play size={15} fill="currentColor" /></span>
                </button>
                <div className="cx-dk-b">
                  <div className="cx-dk-meta">
                    <span>{d.slides.length} slides · {relTime(m.at)}</span>
                    {m.review && <span className="cx-rv"><ShieldCheck size={12} /> Fact-checked</span>}
                  </div>
                  <div className="cx-lib-acts">
                    <button onClick={() => setDeck(d)}><Play size={13} /> Present</button>
                    <button onClick={() => openSession(s.id)}><ExternalLink size={13} /> Open chat</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const renderThread = () => (
    <div className="cx-thread">
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="cx-u">
            {m.mode !== "general" && (() => { const I = MODE[m.mode].icon; return <span className="cx-u-mode"><I size={13} /> {MODE[m.mode].label}</span>; })()}
            {m.image && <img src={m.image} alt="Attached by you" className="cx-u-img" />}
            <div className="cx-u-b">{m.content}</div>
          </div>
        ) : (
          <div key={m.id} className="cx-a">
            <div className="cx-a-h">
              <CadusMark size={20} title="Cadus" />
              {m.review && (
                <span className="cx-rv"><ShieldCheck size={13} /> Safety-reviewed{m.review.changes.length ? ` · ${m.review.changes.length} correction${m.review.changes.length > 1 ? "s" : ""}` : ""}</span>
              )}
              {m.review && <span className={`cx-conf ${m.review.confidence}`}>{CONF_LABEL[m.review.confidence]}</span>}
              {m.library && (
                <span className="cx-libchip" title={`Library mode: ${m.library.reason}`}>
                  <Library size={13} /> Medical Library · {m.library.mode === "llm" ? "written by the backup model" : "quoted"}
                </span>
              )}
            </div>
            {m.error ? (
              <div className="cx-err">
                <AlertTriangle size={16} />
                <span>{m.content}</span>
                <button onClick={() => regenerate(m.id)} disabled={!!pending}><RefreshCw size={13} /> Retry</button>
              </div>
            ) : m.stopped ? (
              <div className="cx-stopped">
                <span>Response stopped.</span>
                <button onClick={() => regenerate(m.id)} disabled={!!pending}><RefreshCw size={13} /> Regenerate</button>
              </div>
            ) : (
              <>
                <div className="cx-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content, { cites: safeSources(m.sources).length }) }} />
                {safeSources(m.sources).length > 0 && (
                  <div className="cx-sources">
                    <p className="cx-src-h"><Globe size={14} /> Sources</p>
                    <ol>
                      {safeSources(m.sources).map((x) => (
                        <li key={x.n}>
                          <a href={x.url} target="_blank" rel="noopener noreferrer" title={x.title}>
                            <span className="n">{x.n}</span><span className="t">{x.title}</span><span className="d">{hostOf(x.url)}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {m.review && (
                  <details className="cx-rvd">
                    <summary><ShieldCheck size={14} /> Safety review details <ChevronDown size={14} className="chev" /></summary>
                    <div className="cx-rvd-b">
                      {m.review.checked.length > 0 && (
                        <div className="cx-rvd-row"><span>Checked</span><div className="chips">{m.review.checked.map((c) => <em key={c}>{c}</em>)}</div></div>
                      )}
                      <div className="cx-rvd-row">
                        <span>Corrections</span>
                        {m.review.changes.length ? <ul>{m.review.changes.map((c) => <li key={c}>{c}</li>)}</ul> : <p>None needed. The draft was approved as written.</p>}
                      </div>
                      <p className="cx-rvd-note">Automated review by {modelLabel(m.review.model, m.review.provider)}. It catches most errors but cannot guarantee there are none. Confirm doses and decisions against current guidelines and your local protocols.</p>
                    </div>
                  </details>
                )}
                {m.reviewNote && <div className="cx-rvwarn"><ShieldAlert size={15} /> {m.reviewNote}</div>}
                {m.deck && (
                  <div className="cx-deck">
                    <span className="cx-deck-ic"><Presentation size={21} /></span>
                    <span className="cx-deck-t"><b>{m.deck.title}</b><small>{m.deck.slides.length} slides · Lecture deck</small></span>
                    <button className="cx-deck-go" onClick={() => setDeck(m.deck!)}><Play size={13} fill="currentColor" /> Present</button>
                  </div>
                )}
                <div className="cx-a-acts">
                  <button className="cx-act cx-tip" data-tip={copied === m.id ? "Copied" : "Copy"} onClick={() => copy(m)} aria-label="Copy">{copied === m.id ? <Check size={16} /> : <Copy size={16} />}</button>
                  <button className="cx-act cx-tip" data-tip="Regenerate" onClick={() => regenerate(m.id)} disabled={!!pending} aria-label="Regenerate"><RefreshCw size={16} /></button>
                  <button className={`cx-act cx-tip ${savedIds.has(m.id) ? "on" : ""}`} data-tip={savedIds.has(m.id) ? "Saved to Library" : "Save to Library"} onClick={() => toggleSave(m)} aria-label="Save to Library">
                    {savedIds.has(m.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                  <button className={`cx-act cx-tip ${speakingId === m.id ? "on" : ""}`} data-tip={speakingId === m.id ? "Stop reading" : "Read aloud"} onClick={() => speak(m)} aria-label="Read aloud">
                    {speakingId === m.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <button className="cx-act cx-tip" data-tip="Export as PDF" onClick={() => exportAnswer(m)} aria-label="Export as PDF"><Download size={16} /></button>
                  <span className="cx-a-by">
                    {m.library
                      ? `${m.library.mode === "llm" ? BACKUP_MODEL : "Quoted"} · Cadus Medical Library`
                      : shortModel(modelLabel(m.model, m.provider))}
                    {m.review ? ` · reviewed by ${shortModel(modelLabel(m.review.model, m.review.provider))}` : ""}
                  </span>
                </div>
                {m.id === lastAssistant?.id && !pending && (
                  <div className="cx-follow">
                    <p>Suggested follow-ups</p>
                    {FOLLOW[m.mode].map((f) => (
                      <button key={f.text} onClick={() => send(f.text, f.mode ?? m.mode)}><CornerDownRight size={15} /> {f.text}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ),
      )}
      {pending && pending.sid === activeId && (
        <div className="cx-a">
          <div className="cx-a-h">
            <CadusMark size={20} thinking title="Cadus is working" />
          </div>
          <div className="cx-think">
            <div className="cx-steps">
              {pending.mode === "slides" ? (
                <div className="cx-step on"><i className="cx-spin" /> {pending.review ? "Designing your deck and fact-checking every slide" : "Designing your deck"}</div>
              ) : (
                <>
                  {pending.stage === "library" ? (
                    <>
                      <div className="cx-step done"><AlertTriangle size={15} className="warn" /> The main AI is unavailable (no AI credits). Switching to Library mode</div>
                      <div className="cx-step on"><i className="cx-spin" /> Searching the Cadus Medical Library and preparing the answer</div>
                    </>
                  ) : (
                  <div className={`cx-step ${pending.stage === "draft" ? "on" : "done"}`}>
                    {pending.stage === "draft" ? <i className="cx-spin" /> : <Check size={15} />}
                    {pending.search ? "Searching trusted medical sources and drafting" : pending.image ? "Reviewing the image" : MODE[pending.mode].busy}
                  </div>
                  )}
                  {pending.review && (
                    <div className={`cx-step ${pending.stage === "review" ? "on" : "todo"}`}>
                      {pending.stage === "review" ? <i className="cx-spin" /> : <i className="cx-dot" />}
                      Safety review by {STUDY_MODES.has(pending.mode) ? MODEL_DEF.medius.short : MODEL_DEF.magnus.short}: doses, interactions, red flags
                    </div>
                  )}
                </>
              )}
            </div>
            <i className="cx-sk" style={{ width: "94%" }} />
            <i className="cx-sk" style={{ width: "82%" }} />
            <i className="cx-sk" style={{ width: "60%" }} />
          </div>
        </div>
      )}
    </div>
  );

  const sessionRow = (s: Session) => {
    if (renaming?.id === s.id && renaming.where === "side") {
      return (
        <div key={s.id} className="cx-row on">
          <input
            autoFocus
            value={renaming.text}
            onChange={(e) => setRenaming({ ...renaming, text: e.target.value })}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
            aria-label="Rename chat"
          />
        </div>
      );
    }
    const key = `row:${s.id}`;
    const busy = pending?.sid === s.id;
    const inProject = s.projectId ? projects.find((p) => p.id === s.projectId) : undefined;
    return (
      <div
        key={s.id}
        className={`cx-row ${s.id === activeId && view === "chat" ? "on" : ""}`}
        onClick={() => openSession(s.id)}
        title={inProject ? `${s.title} · ${inProject.name}` : s.title}
      >
        <span className={`cx-ring ${busy ? "busy" : ""}`} aria-hidden />
        <span className="cx-row-t">{s.title}</span>
        <button className={`cx-row-more ${pop === key ? "open" : ""}`} data-pop={key} onClick={(e) => openRowMenu(e, s.id)} aria-label="Chat options"><MoreHorizontal size={16} /></button>
      </div>
    );
  };

  const rowMenuSession = pop?.startsWith("row:") ? sessions.find((s) => `row:${s.id}` === pop) : undefined;

  const sessionMenuItems = (s: Session, where: "side" | "top") =>
    moveFor === s.id ? (
      <>
        <p className="cx-pop-gl">Move to project</p>
        {sortedProjects.map((p) => (
          <button key={p.id} className="cx-pop-i" onClick={() => moveToProject(s.id, p.id)} disabled={s.projectId === p.id}>
            <Folder size={16} /> <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            {s.projectId === p.id && <Check size={15} className="r" />}
          </button>
        ))}
        {s.projectId && <button className="cx-pop-i" onClick={() => moveToProject(s.id, undefined)}><FolderMinus size={16} /> Remove from project</button>}
        <div className="cx-pop-sep" />
        <button className="cx-pop-i" onClick={() => newProject(s.id)}><FolderPlus size={16} /> New project…</button>
        <button className="cx-pop-i" onClick={() => setMoveFor("")}><ArrowLeft size={16} /> Back</button>
      </>
    ) : confirmDelete === s.id ? (
      <>
        <p className="cx-pop-gl">Delete “{clip(s.title, 28)}”?</p>
        <button className="cx-pop-i danger" onClick={() => deleteSession(s.id)}><Trash2 size={16} /> Delete chat</button>
        <button className="cx-pop-i" onClick={() => setConfirmDelete("")}><X size={16} /> Cancel</button>
      </>
    ) : (
      <>
        <button className="cx-pop-i" onClick={() => togglePin(s.id)}>{s.pinned ? <PinOff size={16} /> : <Pin size={16} />} {s.pinned ? "Unpin" : "Pin"}</button>
        <button className="cx-pop-i" onClick={() => { setPop(null); setRenaming({ id: s.id, text: s.title, where }); }}><Pencil size={16} /> Rename</button>
        <button className="cx-pop-i" onClick={() => (projects.length ? setMoveFor(s.id) : newProject(s.id))}>
          <FolderInput size={16} /> {s.projectId ? "Change project" : "Add to project"} <ChevronRight size={15} className="r" />
        </button>
        <button className="cx-pop-i" onClick={() => exportSession(s)}><Download size={16} /> Export as PDF</button>
        <div className="cx-pop-sep" />
        <button className="cx-pop-i danger" onClick={() => setConfirmDelete(s.id)}><Trash2 size={16} /> Delete</button>
      </>
    );

  const avatar = user
    ? <div className="cx-av">{(user.name || user.email || "U").slice(0, 1).toUpperCase()}</div>
    : <div className="cx-av guest"><Users size={15} /></div>;

  return (
    <div
      className={`cx ${dark ? "cx-dark" : "cx-light"} ${serif ? "ans-serif" : "ans-sans"} ${collapsed && isDesktop ? "is-collapsed" : ""}`}
      style={{ ["--acc" as string]: dark ? accent.dark : accent.light, ["--fs" as string]: `${fontSize}px`, ["--fs-u" as string]: `${sansSize}px` }}
    >
      <style>{CADUS_CSS}</style>

      {/* ============================================== sidebar */}
      <div className={`cx-scrim ${sidebarOpen ? "on" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`cx-side ${sidebarOpen ? "open" : ""}`} aria-label="Sidebar">
        <div className="cx-side-head">
          <button
            className="cx-brand"
            title={collapsed && isDesktop ? "Expand sidebar" : "Cadus home"}
            onClick={() => (collapsed && isDesktop ? setCollapsed(false) : newChat())}
            aria-label="Cadus home"
          >
            <CadusMark size={28} />
            <span className="cx-wm">Cadus<small>Clinical AI by Aethex</small></span>
          </button>
          <button className="cx-ib cx-collapse cx-dt" title="Collapse sidebar" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"><PanelLeftClose size={18} /></button>
          <button className="cx-ib cx-m" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <nav className="cx-nav" aria-label="Cadus">
          <button className="cx-nav-i cx-new" onClick={() => newChat()} title={`New chat (${MOD} ⇧ O)`}>
            <span className="cx-new-ic"><Plus size={15} strokeWidth={2.6} /></span><span className="cx-nav-l">New chat</span><kbd>{MOD} ⇧ O</kbd>
          </button>
          {([
            ["projects", Folder, "Projects", projects.length, openProjects],
            ["library", Library, "Library", library.length, () => { setView("library"); setSidebarOpen(false); }],
            ["decks", Presentation, "Decks", decks.length, () => { setView("decks"); setSidebarOpen(false); }],
            ["tools", LayoutGrid, "Clinical tools", 0, () => { setView("tools"); setSidebarOpen(false); }],
          ] as [View, LucideIcon, string, number, () => void][]).map(([id, Icon, label, count, go]) => (
            <button
              key={id}
              className={`cx-nav-i ${view === id || (id === "projects" && view === "project") ? "on" : ""}`}
              onClick={go}
              title={label}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={17} /><span className="cx-nav-l">{label}</span>{count > 0 && <em>{count}</em>}
            </button>
          ))}
          <button className="cx-nav-i" onClick={() => openSettings("personal")} title="Customize"><Palette size={17} /><span className="cx-nav-l">Customize</span></button>
          <button className={`cx-nav-i ${moreOpen ? "open" : ""}`} onClick={() => setMoreOpen((o) => !o)} title="More" aria-expanded={moreOpen}>
            <MoreHorizontal size={17} /><span className="cx-nav-l">More</span><ChevronDown size={14} className="cx-chev" />
          </button>
          {moreOpen && (
            <div className="cx-more">
              <button className="cx-nav-i" onClick={openPalette} title="Search"><Search size={16} /><span className="cx-nav-l">Search</span><kbd>{MOD} K</kbd></button>
              <button className="cx-nav-i" onClick={() => openSettings("shortcuts")} title="Keyboard shortcuts"><Keyboard size={16} /><span className="cx-nav-l">Keyboard shortcuts</span></button>
              <a className="cx-nav-i" href="/ai-assistant-classic" title="Classic Cadus"><History size={16} /><span className="cx-nav-l">Classic Cadus</span></a>
              <button className="cx-nav-i" onClick={() => openSettings("about")} title="Help and about"><CircleQuestionMark size={16} /><span className="cx-nav-l">Help and about</span></button>
            </div>
          )}
          {collapsed && isDesktop && (
            <button className="cx-nav-i" title="Expand sidebar" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"><PanelLeftOpen size={17} /></button>
          )}
        </nav>

        <div className="cx-hist">
          {pinned.length > 0 && (
            <div className="cx-sec">
              <p className="cx-gl"><span>Pinned</span></p>
              {pinned.map(sessionRow)}
            </div>
          )}
          <div className="cx-sec">
            <div className="cx-gl">
              <span>Chats</span>
              <button
                className={`cx-gl-b ${chatSearch !== null ? "on" : ""}`}
                onClick={() => setChatSearch((q) => (q === null ? "" : null))}
                aria-label="Search chats"
                title="Search chats"
              >
                <Search size={14} />
              </button>
              <div className="cx-rel" data-pop="filter">
                <button
                  className={`cx-gl-b ${chatFilter !== "all" ? "on" : ""} ${pop === "filter" ? "open" : ""}`}
                  onClick={() => togglePop("filter")}
                  aria-label="Filter chats"
                  title="Filter chats"
                  aria-haspopup="menu"
                  aria-expanded={pop === "filter"}
                >
                  <ListFilter size={14} />
                </button>
                {pop === "filter" && (
                  <div className="cx-pop cx-filter-menu" role="menu">
                    <p className="cx-pop-gl">Show chats</p>
                    {TOOL_TABS.map((t) => (
                      <button key={t.id} className="cx-pop-i" onClick={() => { setChatFilter(t.id); setPop(null); }}>
                        {t.label === "All" ? "All chats" : t.label}
                        {chatFilter === t.id && <Check size={15} className="r" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {chatSearch !== null && (
              <label className="cx-side-search">
                <Search size={14} />
                <input
                  autoFocus
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setChatSearch(null); } }}
                  placeholder="Search chat titles"
                  aria-label="Search chat titles"
                />
                <button onClick={() => setChatSearch(null)} aria-label="Close search"><X size={13} /></button>
              </label>
            )}
            {chatFilter !== "all" && (
              <div className="cx-filter-chip">
                <span>{TOOL_TABS.find((t) => t.id === chatFilter)?.label} chats</span>
                <button onClick={() => setChatFilter("all")}>Show all</button>
              </div>
            )}
            {sessions.length === 0 ? (
              <div className="cx-hist-empty">Your chats will appear here. History is saved only in this browser.</div>
            ) : chatList.length === 0 ? (
              <p className="cx-hist-none">{pinned.length === sessions.length && !chatQuery && chatFilter === "all" ? "All your chats are pinned." : "No chats match."}</p>
            ) : (
              chatList.map(sessionRow)
            )}
          </div>
        </div>

        <div className="cx-side-foot">
          <div className="cx-acct-wrap" data-pop="acct">
            <button className={`cx-acct ${pop === "acct" ? "open" : ""}`} onClick={() => togglePop("acct")} aria-haspopup="menu" aria-expanded={pop === "acct"} title="Account">
              {avatar}
              <div className="cx-acct-t">
                <b>{user ? user.name || "Aethex member" : "Guest"}</b>
                <small>{user ? (isPro ? "Pro plan" : "Free plan") : "Not signed in"}</small>
              </div>
              <ChevronsUpDown size={15} />
            </button>
            {pop === "acct" && (
              <div className="cx-pop cx-acct-menu" role="menu">
                <div className="cx-acct-head">
                  {avatar}
                  <div style={{ minWidth: 0 }}><b>{user ? user.name || "Aethex member" : "Guest"}</b><small>{user?.email || "Sign in to use your Aethex account"}</small></div>
                  <span className="cx-plan" style={{ marginLeft: "auto" }}>{isPro ? "Pro" : "Free"}</span>
                </div>
                <div className="cx-usage">
                  <div className="cx-usage-top"><span>Questions today</span><b>{isPro ? `${usage.count} · Unlimited` : `${usage.count} of ${FREE_DAILY}`}</b></div>
                  {!isPro && <div className="cx-usage-bar"><i style={{ width: `${Math.min(100, (usage.count / FREE_DAILY) * 100)}%` }} /></div>}
                </div>
                <div className="cx-theme-seg">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button key={t} className={prefs.theme === t ? "on" : ""} onClick={() => setPrefs((p) => ({ ...p, theme: t }))}>
                      {t === "light" ? <Sun size={13} /> : t === "dark" ? <Moon size={13} /> : <Laptop size={13} />}{t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"}
                    </button>
                  ))}
                </div>
                <button className="cx-pop-i" onClick={() => openSettings()}><Settings size={16} /> Settings</button>
                <button className="cx-pop-i" onClick={() => openSettings("personal")}><Palette size={16} /> Customize</button>
                <button className="cx-pop-i" onClick={() => openSettings("about")}><CircleQuestionMark size={16} /> Help and about</button>
                <div className="cx-pop-sep" />
                <a className="cx-pop-i" href={homeHref}><ArrowLeft size={16} /> Back to aethex.in</a>
                {user ? (
                  <button className="cx-pop-i" onClick={() => { setPop(null); logout(); toast("Signed out"); }}><LogOut size={16} /> Sign out</button>
                ) : (
                  <a className="cx-pop-i" href={signInHref}><LogIn size={16} /> Sign in</a>
                )}
              </div>
            )}
          </div>
          <div className="cx-apps-wrap" data-pop="apps">
            <button className={`cx-ib ${pop === "apps" ? "open" : ""}`} onClick={() => togglePop("apps")} aria-label="Aethex apps" title="Aethex apps" aria-haspopup="menu" aria-expanded={pop === "apps"}>
              <Grip size={18} />
            </button>
            {pop === "apps" && (
              <div className="cx-pop cx-apps-menu" role="menu">
                <p className="cx-pop-gl">Aethex apps</p>
                <div className="cx-apps-grid">
                  {APPS.map((a) => (
                    <a key={a.path} className="cx-app" href={appHref(a.path)} role="menuitem">
                      <span className="cx-app-ic"><a.icon size={19} /></span>
                      <span>{a.label}</span>
                    </a>
                  ))}
                </div>
                <a className="cx-apps-foot" href={homeHref}><CadusMark size={14} /> <span>Cadus is part of Aethex</span> <ArrowUpRight size={13} style={{ marginLeft: "auto" }} /></a>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================== main */}
      <main className="cx-main">
        <header className={`cx-top ${view !== "chat" || messages.length ? "lined" : ""}`}>
          <button className="cx-ib cx-m" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="cx-picker-wrap" data-pop="picker">
            <button className={`cx-picker ${pop === "picker" ? "open" : ""}`} onClick={() => togglePop("picker")} aria-haspopup="menu" aria-expanded={pop === "picker"}>
              Cadus <span>{modelDef.short}</span> <ChevronDown size={15} />
            </button>
            {pop === "picker" && (
              <div className="cx-pop cx-picker-menu" role="menu">
                <p className="cx-pop-gl">Model</p>
                {MODELS.map((md) => (
                  <button key={md.id} className={`cx-pick ${prefs.model === md.id ? "on" : ""}`} onClick={() => { setPrefs((p) => ({ ...p, model: md.id })); setPop(null); }}>
                    <span className="cx-pick-ic"><md.icon size={16} /></span>
                    <span><b>{md.name}</b><small>{md.desc}</small></span>
                    {prefs.model === md.id && <Check size={16} className="ck" />}
                  </button>
                ))}
                <div className="cx-pop-sep" />
                <p className="cx-pop-gl">Response style</p>
                {STYLES.map((s) => (
                  <button key={s.id} className={`cx-pick ${prefs.style === s.id ? "on" : ""}`} onClick={() => { setPrefs((p) => ({ ...p, style: s.id })); setPop(null); }}>
                    <span className="cx-pick-ic"><s.icon size={16} /></span>
                    <span><b>{s.label}</b><small>{s.desc}</small></span>
                    {prefs.style === s.id && <Check size={16} className="ck" />}
                  </button>
                ))}
                <div className="cx-pick-foot"><ShieldCheck size={13} /> {prefs.safetyReview ? `Clinical answers are safety-reviewed by ${MODEL_DEF.magnus.short}` : "Safety review is off"}</div>
              </div>
            )}
          </div>

          <div className="cx-top-mid">
            {view === "chat" && active && messages.length > 0 && (
              <div className="cx-crumbs">
                {activeProject && (
                  <>
                    <button className="cx-crumb" onClick={() => openProject(activeProject.id)} title={`Open ${activeProject.name}`}>
                      <Folder size={14} /><span>{activeProject.name}</span>
                    </button>
                    <span className="cx-crumb-sep" aria-hidden>/</span>
                  </>
                )}
                {renaming?.id === active.id && renaming.where === "top" ? (
                  <input
                    className="cx-title-in"
                    autoFocus
                    value={renaming.text}
                    onChange={(e) => setRenaming({ ...renaming, text: e.target.value })}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                    aria-label="Rename chat"
                  />
                ) : (
                  <div className="cx-title-wrap" data-pop="title">
                    <button className={`cx-title-btn ${pop === "title" ? "open" : ""}`} onClick={() => { setConfirmDelete(""); setMoveFor(""); togglePop("title"); }}>
                      <span>{active.title}</span><ChevronDown size={14} />
                    </button>
                    {pop === "title" && <div className="cx-pop cx-title-menu" role="menu">{sessionMenuItems(active, "top")}</div>}
                  </div>
                )}
              </div>
            )}
            {view !== "chat" && (() => {
              const [Icon, label]: [LucideIcon, string] =
                view === "tools" ? [LayoutGrid, "Clinical tools"]
                : view === "library" ? [Library, "Library"]
                : view === "decks" ? [Presentation, "Decks"]
                : view === "project" && project ? [Folder, project.name]
                : [Folder, "Projects"];
              return <span className="cx-title-btn static"><Icon size={14} /> <span>{label}</span></span>;
            })()}
          </div>

          <div className="cx-top-r">
            {view === "chat" && lastAssistant?.library ? (
              <button
                className="cx-safe cx-dt off"
                onClick={() => openSettings("data")}
                title={`Library mode: ${lastAssistant.library.reason}. Answers come from the offline medical library until credits are topped up.`}
              >
                <Library size={14} /> Library mode
              </button>
            ) : (
              <button
                className={`cx-safe cx-dt ${prefs.safetyReview ? "" : "off"}`}
                onClick={() => openSettings("general")}
                title={prefs.safetyReview ? "Every answer is audited by a second AI model before you see it" : "Safety review is off"}
              >
                {prefs.safetyReview ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} Safety review {prefs.safetyReview ? "on" : "off"}
              </button>
            )}
            {view === "chat" && active && messages.length > 0 && (
              <button className="cx-ghost cx-dt" onClick={() => exportSession()}><Download size={15} /> Export</button>
            )}
            <button className="cx-ib cx-dt" title={dark ? "Light theme" : "Dark theme"} onClick={() => setPrefs((p) => ({ ...p, theme: dark ? "light" : "dark" }))} aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="cx-ib cx-m" onClick={() => newChat()} aria-label="New chat"><SquarePen size={18} /></button>
          </div>
        </header>

        <div
          className="cx-view"
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 160);
          }}
        >
          {view === "tools" ? renderTools()
            : view === "library" ? renderLibrary()
            : view === "projects" ? renderProjects()
            : view === "project" ? renderProject()
            : view === "decks" ? renderDecks()
            : isHome ? renderHome()
            : renderThread()}
        </div>

        {showDock && (
          <div className="cx-dock">
            {!isHome && !atBottom && (
              <button className="cx-scrolldown" onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })} aria-label="Scroll to latest"><ArrowDown size={17} /></button>
            )}
            <div className="cx-dock-in">
              {composer("dock")}
              <p className="cx-fine">
                {lastAssistant?.library
                  ? "Library mode: AI credits are unavailable, so answers come from the offline medical library without the safety review. Verify clinical decisions."
                  : prefs.safetyReview
                    ? "Answers are audited by a second AI model, but Cadus can still make mistakes. Verify clinical decisions."
                    : "Safety review is off. Cadus can make mistakes; verify clinical decisions."}
              </p>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </main>

      {/* row menu (fixed so the scrolling list doesn't clip it) */}
      {rowMenuSession && rowPos && (
        <div
          className="cx-pop cx-row-menu"
          data-pop={pop ?? ""}
          style={{ position: "fixed", top: rowPos.top, left: rowPos.left, width: 232, maxHeight: `calc(100vh - ${rowPos.top + 12}px)` }}
          role="menu"
        >
          {sessionMenuItems(rowMenuSession, "side")}
        </div>
      )}

      {/* ============================================== project dialog */}
      {projectDialog && (
        <div className="cx-overlay center" onMouseDown={() => setProjectDialog(null)}>
          <form
            className="cx-dialog"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); saveProjectDialog(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cx-pd-title"
          >
            <div className="cx-dialog-h">
              <div>
                <h3 id="cx-pd-title">{projectDialog.id ? "Edit project" : "Create a project"}</h3>
                <p>{projectDialog.id ? "Changes apply to new answers in this project." : "Group related chats and tell Cadus how to answer in them."}</p>
              </div>
              <button type="button" className="cx-ib" onClick={() => setProjectDialog(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="cx-dialog-b">
              <label className="cx-field">
                <span>Name</span>
                <input
                  className="cx-input"
                  autoFocus
                  maxLength={60}
                  value={projectDialog.name}
                  onChange={(e) => setProjectDialog({ ...projectDialog, name: e.target.value })}
                  placeholder="e.g. Cardiology rotation"
                />
              </label>
              <label className="cx-field">
                <span>Instructions <span style={{ fontWeight: 400, color: "var(--t3)" }}>(optional)</span></span>
                <textarea
                  className="cx-input"
                  maxLength={INSTRUCTIONS_MAX}
                  value={projectDialog.instructions}
                  onChange={(e) => setProjectDialog({ ...projectDialog, instructions: e.target.value })}
                  placeholder="e.g. I'm a final-year MBBS student preparing for NEET-PG. Keep answers exam-focused, highlight high-yield facts and follow Indian guidelines where they exist."
                />
                <small>Cadus follows these for audience, focus and format. Its clinical standards and safety review always come first. Avoid patient names or other identifying details.</small>
              </label>
            </div>
            <div className="cx-dialog-f">
              <span className="count">{projectDialog.instructions.length} / {INSTRUCTIONS_MAX}</span>
              <button type="button" className="cx-btn" onClick={() => setProjectDialog(null)}>Cancel</button>
              <button type="submit" className="cx-btn primary" disabled={!projectDialog.name.trim()}>{projectDialog.id ? "Save changes" : "Create project"}</button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================== command palette */}
      {paletteOpen && (
        <div className="cx-overlay" onMouseDown={() => setPaletteOpen(false)}>
          <div className="cx-palette" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search">
            <div className="cx-pal-in">
              <Search size={18} />
              <input
                autoFocus
                value={palQuery}
                placeholder="Search chats, tools and actions…"
                onChange={(e) => { setPalQuery(e.target.value); setPalIndex(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setPalIndex((i) => Math.min(palFlat.length - 1, i + 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setPalIndex((i) => Math.max(0, i - 1)); }
                  if (e.key === "Enter") { e.preventDefault(); runPalette(palFlat[palIndex]); }
                }}
              />
              <kbd>Esc</kbd>
            </div>
            <div className="cx-pal-list">
              {palFlat.length === 0 && <p className="cx-pal-empty">No results for “{palQuery}”</p>}
              {(() => {
                let i = -1;
                return paletteSections.map((sec) => (
                  <div key={sec.label}>
                    <p className="cx-pal-gl">{sec.label}</p>
                    {sec.items.map((it) => {
                      i += 1;
                      const idx = i;
                      return (
                        <button key={it.key} className={`cx-pal-i ${idx === palIndex ? "on" : ""}`} onMouseEnter={() => setPalIndex(idx)} onClick={() => runPalette(it)}>
                          <it.icon size={16} /><span>{it.label}</span>{it.hint && <small>{it.hint}</small>}
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
            <div className="cx-pal-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Open</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== settings */}
      {settingsOpen && (
        <div className="cx-overlay center" onMouseDown={() => setSettingsOpen(false)}>
          <div className="cx-settings" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Settings">
            <nav className="cx-set-nav">
              <h2>Settings</h2>
              {([
                ["general", "General", Settings],
                ["personal", "Personalisation", Palette],
                ["data", "Data and privacy", Database],
                ["shortcuts", "Shortcuts", Keyboard],
                ["about", "About", Info],
              ] as [SettingsTab, string, LucideIcon][]).map(([id, label, Icon]) => (
                <button key={id} className={settingsTab === id ? "on" : ""} onClick={() => setSettingsTab(id)}><Icon size={16} /> {label}</button>
              ))}
            </nav>
            <div className="cx-set-body">
              <div className="cx-set-head">
                <h3>{{ general: "General", personal: "Personalisation", data: "Data and privacy", shortcuts: "Keyboard shortcuts", about: "About Cadus" }[settingsTab]}</h3>
                <button className="cx-ib" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={18} /></button>
              </div>
              <div className="cx-set-scroll">
                {settingsTab === "general" && (
                  <>
                    <div className="cx-set-row">
                      <div><b>Theme</b><small>Light is the default. Dark is easier on the eyes at night. Auto follows your device.</small></div>
                      <div className="cx-seg">
                        {(["light", "dark", "system"] as const).map((t) => (
                          <button key={t} className={prefs.theme === t ? "on" : ""} onClick={() => setPrefs({ ...prefs, theme: t })}>
                            {t === "light" ? <Sun size={13} /> : t === "dark" ? <Moon size={13} /> : <Laptop size={13} />}{t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Reply language</b><small>Cadus answers in this language</small></div>
                      <select className="cx-select" value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })} aria-label="Reply language">
                        {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Enter to send</b><small>Use Shift + Enter for a new line</small></div>
                      <button className={`cx-switch ${prefs.enterToSend ? "on" : ""}`} role="switch" aria-checked={prefs.enterToSend} aria-label="Enter to send" onClick={() => setPrefs({ ...prefs, enterToSend: !prefs.enterToSend })} />
                    </div>
                    <div className="cx-set-row">
                      <div><b>Safety review</b><small>A second model audits every answer before you see it: Cadus Magnus 3.6 for clinical answers, Cadus Medius 3.1 for study content. Adds about 10 to 20 seconds. Recommended.</small></div>
                      <button className={`cx-switch ${prefs.safetyReview ? "on" : ""}`} role="switch" aria-checked={prefs.safetyReview} aria-label="Safety review" onClick={() => setPrefs({ ...prefs, safetyReview: !prefs.safetyReview })} />
                    </div>
                    <div className="cx-set-row">
                      <div><b>Search sources by default</b><small>Cite live sources from WHO, NICE, ICMR, PubMed and other trusted medical sites. Deep research always searches.</small></div>
                      <button className={`cx-switch ${prefs.sources ? "on" : ""}`} role="switch" aria-checked={prefs.sources} aria-label="Search sources by default" onClick={() => setPrefs({ ...prefs, sources: !prefs.sources })} />
                    </div>
                  </>
                )}
                {settingsTab === "personal" && (
                  <>
                    <div className="cx-set-row">
                      <div><b>Answer font</b><small>Serif reads like a well-set textbook and is easier on long answers. Tables and doses always use the sans.</small></div>
                      <div className="cx-seg">
                        <button className={serif ? "on" : ""} onClick={() => setPrefs({ ...prefs, answerFont: "serif" })}><span className="ff serif">Aa</span>Serif</button>
                        <button className={!serif ? "on" : ""} onClick={() => setPrefs({ ...prefs, answerFont: "sans" })}><span className="ff">Aa</span>Sans</button>
                      </div>
                    </div>
                    <p className={`cx-font-prev ${serif ? "serif" : ""}`}>
                      <b>Bottom line:</b> Cadus answers are set in {serif ? "Newsreader, a serif designed for long-form reading on screens" : "Plus Jakarta Sans, the clean sans-serif used across Aethex"}, so dense clinical detail stays easy to read.
                    </p>
                    <div className="cx-set-row">
                      <div><b>Accent colour</b><small>{accent.name}. Used for highlights, links and focus</small></div>
                      <div className="cx-swatch">
                        {ACCENTS.map((a) => (
                          <button key={a.id} className={prefs.accent === a.id ? "on" : ""} style={{ background: dark ? a.dark : a.light }} onClick={() => setPrefs({ ...prefs, accent: a.id })} aria-label={a.name} title={a.name} />
                        ))}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Default response mode</b><small>Also available from the Cadus menu at the top</small></div>
                      <div className="cx-seg">
                        {STYLES.map((s) => (
                          <button key={s.id} className={prefs.style === s.id ? "on" : ""} onClick={() => setPrefs({ ...prefs, style: s.id })}><s.icon size={13} />{s.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Text size</b><small>Size of answers and messages</small></div>
                      <div className="cx-seg">
                        {(["s", "m", "l"] as const).map((s) => (
                          <button key={s} className={prefs.textSize === s ? "on" : ""} onClick={() => setPrefs({ ...prefs, textSize: s })}>{s === "s" ? "Small" : s === "m" ? "Default" : "Large"}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {settingsTab === "data" && (
                  <>
                    <div className="cx-set-row">
                      <div><b>Where your data lives</b><small>Chats, projects and Library items are stored only in this browser. Messages and project instructions are sent securely to the AI to generate answers.</small></div>
                    </div>
                    <div className="cx-set-row">
                      <div>
                        <b>Offline medical library</b>
                        <small>
                          {libInfo === undefined
                            ? "Checking…"
                            : libInfo === null
                              ? "Not installed. If the AI credits run out, the backup model answers on its own."
                              : `${libInfo.articles.toLocaleString("en-IN")} articles from ${Object.values(libInfo.sources).map((x) => x.name.split(" (")[0].split(" via ")[0]).join(", ")}. Built ${new Date(libInfo.builtAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Cadus answers from it automatically when the AI credits run out.`}
                          {libInfo && !libInfo.sources.w && " Wikipedia's medical articles are added by the GitHub workflow “Build Cadus medical library”."}
                        </small>
                      </div>
                      {libInfo && <span className="cx-plan">Ready</span>}
                    </div>
                    {libInfo && (
                      <div className="cx-libtest">
                        <form onSubmit={(e) => { e.preventDefault(); void runLibraryTest(); }}>
                          <Search size={15} />
                          <input value={libTestQ} onChange={(e) => setLibTestQ(e.target.value)} placeholder="Test the library, e.g. myasthenia gravis" aria-label="Search the offline library" />
                          <button type="submit" className="cx-btn" disabled={!libTestQ.trim()}>Search</button>
                        </form>
                        {libTest && (
                          libTest.busy ? <p className="cx-libtest-note">Searching…</p>
                          : libTest.hits.length ? (
                            <ol>
                              {libTest.hits.map((h) => (
                                <li key={`${h.title}-${h.source}`}><a href={h.url} target="_blank" rel="noopener noreferrer">{h.title}</a><span>{h.source}</span></li>
                              ))}
                            </ol>
                          ) : <p className="cx-libtest-note">No articles match “{libTest.q}”.</p>
                        )}
                      </div>
                    )}
                    <div className="cx-set-row">
                      <div><b>Export all chats</b><small>{sessions.length} chats, {projects.length} projects and {library.length} saved answers as a JSON file</small></div>
                      <button className="cx-btn" onClick={() => downloadJSON(`cadus-export-${today()}.json`, { exportedAt: new Date().toISOString(), sessions, projects, library })} disabled={!sessions.length && !library.length && !projects.length}><Download size={14} /> Export</button>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Clear Library</b><small>Remove all {library.length} saved answers</small></div>
                      <button className="cx-btn danger" disabled={!library.length} onClick={() => { setLibrary([]); toast("Library cleared"); }}><Trash2 size={14} /> Clear</button>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Delete all chats</b><small>This can't be undone</small></div>
                      <button
                        className={`cx-btn danger ${confirmClear ? "armed" : ""}`}
                        disabled={!sessions.length}
                        onClick={() => {
                          if (!confirmClear) { setConfirmClear(true); return; }
                          setSessions([]);
                          setActiveId("");
                          setConfirmClear(false);
                          toast("All chats deleted");
                        }}
                      >
                        <Trash2 size={14} /> {confirmClear ? "Click again to confirm" : "Delete all"}
                      </button>
                    </div>
                  </>
                )}
                {settingsTab === "shortcuts" && (
                  <div className="cx-keys">
                    <div><span>Search and command palette</span><span><kbd>{MOD}</kbd><kbd>K</kbd></span></div>
                    <div><span>New chat</span><span><kbd>{MOD}</kbd><kbd>⇧</kbd><kbd>O</kbd></span></div>
                    <div><span>Send message</span><span><kbd>Enter</kbd></span></div>
                    <div><span>New line</span><span><kbd>⇧</kbd><kbd>Enter</kbd></span></div>
                    <div><span>Paste an image into the message</span><span><kbd>{MOD}</kbd><kbd>V</kbd></span></div>
                    <div><span>Close menus and dialogs</span><span><kbd>Esc</kbd></span></div>
                  </div>
                )}
                {settingsTab === "about" && (
                  <>
                    <div className="cx-about">
                      <CadusMark size={48} />
                      <div><h4>Cadus 2.0</h4><p>Clinical AI by Aethex</p></div>
                    </div>
                    <div className="cx-set-row"><div><b>How Cadus answers</b><small>1. Cadus Medius 3.1, or Cadus Magnus 3.6 if you pick it, drafts each answer to the Cadus clinical standards: evidence-based, structured, dose-checked and aware of Indian guidance. 2. Cadus Magnus 3.6 audits clinical answers for doses, interactions, red flags and invented facts, and corrects them (Medius 3.1 checks study content). 3. With Sources on, Cadus searches trusted medical sites and cites them. 4. If the AI credits run out, Cadus switches to Library mode: it answers from its offline medical library (Wikipedia, NIH and the Disease Ontology), cites each article and labels the answer. A backup model covers other outages.</small></div></div>
                    <div className="cx-set-row"><div><b>Limitations</b><small>Cadus is decision support for qualified professionals and students. It is not a certified medical device, and the safety review reduces errors without eliminating them. Confirm diagnoses and doses against current guidelines and local protocols.</small></div></div>
                    <div className="cx-set-row">
                      <div><b>Classic Cadus</b><small>The previous version, with its original modes</small></div>
                      <a className="cx-link" href="/ai-assistant-classic">Open <ExternalLink size={13} /></a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="cx-toast" role="status"><Check size={15} /> {toastMsg}</div>}
      {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} onCapture={(f) => { setCameraOpen(false); void onFile(f); }} />}
      {deck && <PresentationViewer data={deck} onClose={() => setDeck(null)} />}
    </div>
  );
}
