/**
 * Cadus update 11 in the browser: Consult Translator, Clinical Pathways, Flashcards and
 * Compare over time. Types, presets, spaced repetition and what each keeps on this device.
 */

export const sid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
function readKey<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function saveKey(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full or blocked */ }
}

/* ------------------------------------------------------------------ Consult Translator */

/** Languages, with the browser's speech code for listening and reading aloud. */
export const TR_LANGUAGES: { name: string; native: string; speech: string }[] = [
  { name: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { name: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { name: "Marathi", native: "मराठी", speech: "mr-IN" },
  { name: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { name: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { name: "Gujarati", native: "ગુજરાતી", speech: "gu-IN" },
  { name: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN" },
  { name: "Malayalam", native: "മലയാളം", speech: "ml-IN" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", speech: "pa-IN" },
  { name: "Odia", native: "ଓଡ଼ିଆ", speech: "or-IN" },
  { name: "Urdu", native: "اردو", speech: "ur-IN" },
  { name: "Assamese", native: "অসমীয়া", speech: "as-IN" },
  { name: "Nepali", native: "नेपाली", speech: "ne-NP" },
];
export interface TrTurn {
  id: string;
  who: "doctor" | "patient";
  /** What was said, as typed or heard. */
  said: string;
  /** The translation shown to the other side. */
  translation: string;
  back: string;
  terms: { term: string; plain: string }[];
  flag: string;
  at: number;
}
/** The English side of a turn (for the note and the context of the next turn). */
export const englishOf = (t: TrTurn) => (t.who === "doctor" ? t.said : t.translation);
export interface TrSession { id: string; language: string; turns: TrTurn[]; note?: string; at: number }
export const TRANSLATOR_KEY = "cadus3.translator";
export const readTrSessions = () => readKey<TrSession[]>(TRANSLATOR_KEY, []).filter((x) => x && Array.isArray(x.turns));
export const saveTrSessions = (l: TrSession[]) => saveKey(TRANSLATOR_KEY, l.slice(0, 20));
/** Common things a doctor says, ready to translate with one tap. */
export const TR_PHRASES = [
  "Please tell me what problem brought you here today.",
  "Since when do you have this problem?",
  "Do you have any allergy to medicines?",
  "Please show me where it hurts.",
  "I need to examine you now. Is that alright?",
  "Take this medicine twice a day after food.",
  "We need to do a blood test today.",
  "Come back immediately if you have chest pain, breathlessness or fainting.",
];

/* ------------------------------------------------------------------ Clinical Pathways */

export interface PathwayDef { id: string; title: string; hint: string; group: "Emergency" | "Medicine" | "Paediatrics and obstetrics" }
export const PATHWAYS: PathwayDef[] = [
  { id: "chest-pain", title: "Chest pain", hint: "ACS, PE, dissection: ECG, troponin, HEART score", group: "Emergency" },
  { id: "sepsis", title: "Suspected sepsis", hint: "qSOFA, the hour-1 bundle, source and antibiotics", group: "Emergency" },
  { id: "stroke", title: "Acute stroke", hint: "FAST, timing, CT, thrombolysis window", group: "Emergency" },
  { id: "breathless", title: "Acute breathlessness", hint: "Asthma, COPD, heart failure, pneumonia, PE", group: "Emergency" },
  { id: "poisoning", title: "Poisoning or snake bite", hint: "Toxidrome, organophosphate, ASV criteria", group: "Emergency" },
  { id: "ugib", title: "Upper GI bleed", hint: "Resuscitation, Glasgow-Blatchford, endoscopy", group: "Emergency" },
  { id: "fever", title: "Acute fever in India", hint: "Dengue, malaria, typhoid, scrub typhus, leptospirosis", group: "Medicine" },
  { id: "dka", title: "DKA and HHS", hint: "Fluids, insulin, potassium, resolution criteria", group: "Medicine" },
  { id: "syncope", title: "Syncope", hint: "Red flags, ECG, who to admit", group: "Medicine" },
  { id: "headache", title: "Headache", hint: "Red flags, SAH, meningitis, imaging", group: "Medicine" },
  { id: "aki", title: "Acute kidney injury", hint: "Stage, cause, fluids, when to dialyse", group: "Medicine" },
  { id: "hyperk", title: "Hyperkalaemia", hint: "ECG changes, calcium, insulin-dextrose", group: "Medicine" },
  { id: "child-fever", title: "Child with fever", hint: "IMNCI danger signs, age bands, focus", group: "Paediatrics and obstetrics" },
  { id: "child-diarrhoea", title: "Child with diarrhoea", hint: "Dehydration plan A, B or C, zinc, ORS", group: "Paediatrics and obstetrics" },
  { id: "pph", title: "Postpartum haemorrhage", hint: "The 4 Ts, uterotonics, escalation", group: "Paediatrics and obstetrics" },
  { id: "pre-eclampsia", title: "High BP in pregnancy", hint: "Severity, magnesium, delivery timing", group: "Paediatrics and obstetrics" },
];
export interface PathwayStep { kind: "question" | "action" | "end"; title: string; text: string; options: string[]; redFlags: string[]; disposition: string; plan: string[]; source: string }
export interface PathwayRun { id: string; pathway: string; context: string; steps: { step: PathwayStep; answer?: string }[]; at: number }
export const PATHWAYS_KEY = "cadus3.pathways";
export const readRuns = () => readKey<PathwayRun[]>(PATHWAYS_KEY, []).filter((x) => x && Array.isArray(x.steps));
export const saveRuns = (l: PathwayRun[]) => saveKey(PATHWAYS_KEY, l.slice(0, 20));
export function runMarkdown(r: PathwayRun): string {
  const end = r.steps.find((s) => s.step.kind === "end")?.step;
  return [
    `# ${r.pathway}`,
    r.context ? `**Patient:** ${r.context}` : "",
    "## Steps",
    ...r.steps.filter((s) => s.answer).map((s, i) => `${i + 1}. **${s.step.title}:** ${s.answer}`),
    end ? `## Decision: ${end.disposition}\n${end.text}\n\n${end.plan.map((p) => `- ${p}`).join("\n")}` : "",
    end?.source ? `*Following ${end.source}. Decision support only; use clinical judgement.*` : "*Decision support only; use clinical judgement.*",
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Flashcards (SM-2 spaced repetition) */

export interface Card { id: string; front: string; back: string; tag: string; due: number; interval: number; ease: number; reps: number; lapses: number }
export interface Deck { id: string; title: string; cards: Card[]; createdAt: number; source?: string }
export const DECKS_KEY = "cadus3.flashcards";
export const readDecks = () => readKey<Deck[]>(DECKS_KEY, []).filter((d) => d && Array.isArray(d.cards));
export const saveDecks = (l: Deck[]) => saveKey(DECKS_KEY, l.slice(0, 60));
const DAY = 86400000;
export const newCard = (c: { front: string; back: string; tag?: string }, now = Date.now()): Card => ({ id: sid(), front: c.front, back: c.back, tag: c.tag || "", due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 });
export type Grade = "again" | "hard" | "good" | "easy";
/** The next review for a card: SM-2, with "again" bringing it back in ten minutes. */
export function schedule(c: Card, g: Grade, now = Date.now()): Card {
  if (g === "again") return { ...c, reps: 0, lapses: c.lapses + 1, interval: 0, ease: Math.max(1.3, c.ease - 0.2), due: now + 10 * 60000 };
  const ease = Math.max(1.3, c.ease + (g === "easy" ? 0.15 : g === "hard" ? -0.15 : 0));
  const interval = c.reps === 0 ? (g === "easy" ? 4 : 1) : c.reps === 1 ? (g === "hard" ? 3 : g === "easy" ? 8 : 6) : Math.round(c.interval * (g === "hard" ? 1.2 : g === "easy" ? ease * 1.3 : ease));
  return { ...c, ease, interval, reps: c.reps + 1, due: now + interval * DAY };
}
export const dueCards = (d: Deck, now = Date.now()) => d.cards.filter((c) => c.due <= now);
/** "1 d", "6 d", "3 mo": when a grade would show the card again. */
export function nextLabel(c: Card, g: Grade): string {
  const n = schedule(c, g, 0);
  if (g === "again") return "10 min";
  return n.interval >= 30 ? `${Math.round(n.interval / 30)} mo` : `${n.interval} d`;
}
/** Anki's plain-text import: front, back and tags, tab-separated, with a header. */
export function ankiText(d: Deck): string {
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, " ").trim();
  return ["#separator:tab", "#html:false", "#tags column:3", ...d.cards.map((c) => `${clean(c.front)}\t${clean(c.back)}\tcadus ${clean(c.tag)}`.trim())].join("\n");
}

/* ------------------------------------------------------------------ Compare over time */

export const COMPARE_KINDS: { id: string; label: string; hint: string }[] = [
  { id: "xray", label: "X-ray", hint: "Chest or skeletal" },
  { id: "ecg", label: "ECG", hint: "12-lead or strip" },
  { id: "ct", label: "CT / MRI", hint: "Matching slices" },
  { id: "usg", label: "Ultrasound", hint: "Images or report" },
  { id: "lab", label: "Lab report", hint: "Photos, PDFs or pasted" },
  { id: "skin", label: "Skin or wound", hint: "Photos at the same distance" },
];
export interface CompareChange { finding: string; before: string; after: string; trend: "better" | "worse" | "new" | "resolved" | "same" }
export interface CompareResult { overall: "better" | "worse" | "mixed" | "same" | "unclear"; summary: string; changes: CompareChange[]; concerns: string[]; next: string[]; limits: string }
export interface CompareRecord { id: string; at: number; kind: string; earlierDate: string; laterDate: string; result: CompareResult }
export const COMPARES_KEY = "cadus3.compares";
export const readCompares = () => readKey<CompareRecord[]>(COMPARES_KEY, []).filter((x) => x && x.result);
export const saveCompares = (l: CompareRecord[]) => saveKey(COMPARES_KEY, l.slice(0, 30));
export const OVERALL_LABEL: Record<CompareResult["overall"], string> = { better: "Better", worse: "Worse", mixed: "Mixed", same: "No real change", unclear: "Can't tell" };
export const TREND_LABEL: Record<CompareChange["trend"], string> = { better: "Better", worse: "Worse", new: "New", resolved: "Resolved", same: "Same" };

/* ------------------------------------------------------------------ Med Reconciliation */

export interface MedRecItem { generic: string; before: string; after: string; change: "continued" | "changed" | "started" | "stopped" | "unclear"; note: string; status: "ok" | "check" | "problem" }
export interface MedRecIssue { severity: "high" | "moderate" | "low"; title: string; detail: string; action: string }
export interface MedRecResult { summary: string; items: MedRecItem[]; issues: MedRecIssue[]; patientSheet: string; questions: string[] }
export interface MedRecRecord { id: string; at: number; stage: string; language: string; patient: string; result: MedRecResult }
export const MEDREC_KEY = "cadus3.medrec";
export const readMedRecs = () => readKey<MedRecRecord[]>(MEDREC_KEY, []).filter((x) => x && x.result && Array.isArray(x.result.items));
export const saveMedRecs = (l: MedRecRecord[]) => saveKey(MEDREC_KEY, l.slice(0, 30));
export const CHANGE_LABEL: Record<MedRecItem["change"], string> = { continued: "Continued", changed: "Changed", started: "Started", stopped: "Stopped", unclear: "Unclear" };
export const STAGES = [
  { id: "admission", label: "On admission", before: "Home medicines", after: "Admission chart" },
  { id: "transfer", label: "On transfer", before: "Previous ward or ICU chart", after: "New chart" },
  { id: "discharge", label: "At discharge", before: "Home or inpatient medicines", after: "Discharge prescription" },
] as const;
export function medRecMarkdown(r: MedRecRecord): string {
  const st = STAGES.find((s) => s.id === r.stage) ?? STAGES[2];
  return [
    `# Medicine reconciliation (${st.label.toLowerCase()})`,
    r.patient ? `**Patient:** ${r.patient}` : "",
    r.result.summary,
    r.result.issues.length ? `## Problems\n${r.result.issues.map((i) => `- **${i.severity === "high" ? "High" : i.severity === "moderate" ? "Moderate" : "Low"}: ${i.title}.** ${i.detail}${i.action ? ` **Do:** ${i.action}` : ""}`).join("\n")}` : "",
    `## Medicines\n| Medicine | ${st.before} | ${st.after} | Change | Note |\n|---|---|---|---|---|\n${r.result.items.map((i) => `| ${i.generic} | ${i.before || "-"} | ${i.after || "-"} | ${CHANGE_LABEL[i.change]} | ${i.note || ""} |`).join("\n")}`,
    r.result.questions.length ? `## To confirm\n${r.result.questions.map((q) => `- ${q}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Presentation Coach */

export const PRESENT_FORMATS: { id: string; label: string; hint: string; seconds: number }[] = [
  { id: "rounds", label: "Ward round", hint: "A patient on the morning round, under 2 minutes", seconds: 120 },
  { id: "long", label: "Long case", hint: "University or PG exam, history to management", seconds: 600 },
  { id: "short", label: "Short case", hint: "Examination findings and diagnosis", seconds: 180 },
  { id: "sbar", label: "SBAR call", hint: "Handover, or a call to your senior", seconds: 60 },
  { id: "opd", label: "OPD to consultant", hint: "One patient in under a minute", seconds: 60 },
];
export interface PresentResult { score: number; rubric: { item: string; score: number; note: string }[]; strengths: string[]; improve: string[]; missing: string[]; questions: string[]; model: string }
export interface PresentRecord { id: string; at: number; format: string; seconds: number; words: number; text: string; result: PresentResult }
export const PRESENT_KEY = "cadus3.present";
export const readPresents = () => readKey<PresentRecord[]>(PRESENT_KEY, []).filter((x) => x && x.result);
export const savePresents = (l: PresentRecord[]) => saveKey(PRESENT_KEY, l.slice(0, 40));
