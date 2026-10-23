/**
 * Cadus update 9 in the browser: Case Simulator, Rx Safety Check, Guideline Watch and
 * Report Explainer. The shapes the server returns (checked again here), the presets,
 * and what each keeps on this device. Nothing here calls the network.
 */

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveKey(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* full or blocked: keep working without saving */ }
}

/* ------------------------------------------------------------------ Case Simulator */

export type SimAction = "history" | "exam" | "test" | "treat" | "consult" | "wait";
/** What a spoken instruction in the Case Simulator is: a question for the patient unless it sounds like an examination, a test, a treatment or a call. */
export function simKindFromSpeech(text: string): SimAction {
  const t = text.trim().toLowerCase();
  if (/^(?:(?:i(?:'ll| will| would like to)?|let me|let's|please)\s+)?(?:call|page|phone|ring)\b.*\b(senior|consultant|registrar|resident|icu|surgeon|team|pg)\b/.test(t)) return "consult";
  if (/^(?:(?:i(?:'ll| will| would like to)?|let me|let's|please)\s+)?(?:wait|observe)\b/.test(t)) return "wait";
  if (/^(?:(?:i(?:'ll| will| would like to)?|let me|let's|please)\s+)?(?:give|start|administer|put (?:him|her|them|the patient) on|insert|intubate|transfuse|nebuli[sz]e|load|bolus|shift|catheteri[sz]e|prepare|begin)\b/.test(t)) return "treat";
  if (/^(?:(?:i(?:'ll| will| would like to)?|let me|let's|please)\s+)?(?:order|send|get|do|request|arrange|check)\b.*\b(test|cbc|blood|ecg|x-?ray|ultrasound|usg|ct|mri|abg|culture|electrolytes|sugar|rbs|lft|kft|rft|urine|echo|troponin|scan|smear|panel|profile)\b/.test(t)) return "test";
  if (/^(?:(?:i(?:'ll| will| would like to)?|let me|let's|please)\s+)?(?:examine|check (?:the |his |her )?(?:pulse|bp|blood pressure|pupils|chest|abdomen|heart|reflexes|temperature|saturation|spo2|jvp|pedal|eyes|throat)|look at|palpate|auscultate|percuss|listen to (?:the |his |her )?(?:chest|heart|lungs|abdomen))\b/.test(t)) return "exam";
  return "history";
}
export interface SimVitals { hr: number | null; sbp: number | null; dbp: number | null; rr: number | null; spo2: number | null; temp: number | null }
export interface SimCase {
  title: string; specialty: string; level: "mbbs" | "intern" | "pg"; difficulty: "easy" | "medium" | "hard"; setting: string;
  age: number | null; sex: "M" | "F"; complaint: string; opening: string; vitals: SimVitals;
  diagnosis: string; differentials: string[]; keyFindings: string[]; idealSteps: string[]; redFlags: string[];
}
export type SimStatus = "stable" | "improving" | "worsening" | "critical" | "recovered" | "died";
export interface SimEntry { id: string; kind: SimAction; text: string; reply: string; minute: number; event?: string; status?: SimStatus }
export interface SimDebrief { score: number; diagnosisCorrect: boolean; verdict: string; strengths: string[]; missed: string[]; unsafe: string[]; teaching: string[]; idealApproach: string }

export const SIM_SPECIALTIES = [
  "Any", "Emergency medicine", "Internal medicine", "Cardiology", "Respiratory medicine", "Infectious diseases", "Toxicology",
  "Paediatrics", "Obstetrics and gynaecology", "General surgery", "Neurology", "Nephrology", "Endocrinology", "Psychiatry",
];
export const SIM_LEVELS: { id: SimCase["level"]; label: string }[] = [
  { id: "mbbs", label: "MBBS" },
  { id: "intern", label: "Intern" },
  { id: "pg", label: "PG resident" },
];
export const SIM_DIFFICULTIES: { id: SimCase["difficulty"]; label: string }[] = [
  { id: "easy", label: "Classic" },
  { id: "medium", label: "Standard" },
  { id: "hard", label: "Tricky" },
];
export const SIM_ACTION_DEFS: { id: SimAction; label: string; placeholder: string; quick: string[] }[] = [
  { id: "history", label: "Ask", placeholder: "Ask the patient or relative a question…", quick: ["When did it start?", "Any past illnesses or medicines?", "Any allergies?", "Any similar episodes before?"] },
  { id: "exam", label: "Examine", placeholder: "What do you examine? e.g. chest auscultation", quick: ["General examination", "Pupils", "Chest", "Cardiovascular system", "Abdomen", "Neurological examination"] },
  { id: "test", label: "Order test", placeholder: "Which test? e.g. CBC, RBS, ECG, ABG", quick: ["CBC", "Random blood sugar", "ECG", "ABG", "Serum electrolytes", "Chest X-ray"] },
  { id: "treat", label: "Treat", placeholder: "Drug, dose and route, or a procedure", quick: ["Oxygen by face mask", "IV access and normal saline 500 mL bolus", "Monitor and catheterise"] },
  { id: "consult", label: "Call senior", placeholder: "Who do you call and what do you say?", quick: ["Call the medicine registrar", "Call ICU for review"] },
  { id: "wait", label: "Wait 15 min", placeholder: "", quick: [] },
];

/** Vital signs outside the usual adult range, for colouring. */
export function vitalFlag(key: keyof SimVitals, v: number | null, ageYears: number | null): "" | "warn" | "bad" {
  if (v === null) return "";
  const child = ageYears !== null && ageYears < 12;
  switch (key) {
    case "hr": return child ? (v > 160 || v < 60 ? "bad" : v > 130 ? "warn" : "") : v > 130 || v < 45 ? "bad" : v > 100 || v < 55 ? "warn" : "";
    case "sbp": return v < 80 || v > 200 ? "bad" : v < 95 || v > 160 ? "warn" : "";
    case "dbp": return v > 120 ? "bad" : v > 100 ? "warn" : "";
    case "rr": return child ? (v > 50 ? "bad" : v > 40 ? "warn" : "") : v > 30 || v < 8 ? "bad" : v > 22 || v < 10 ? "warn" : "";
    case "spo2": return v < 90 ? "bad" : v < 94 ? "warn" : "";
    case "temp": return v >= 40 || v < 35 ? "bad" : v >= 38 ? "warn" : "";
  }
  return "";
}

export interface SimRecord { id: string; title: string; specialty: string; diagnosis: string; score: number; correct: boolean; minutes: number; at: number }
export const SIMS_KEY = "cadus3.sims";
export const readSims = () => readKey<SimRecord[]>(SIMS_KEY, []).filter((x) => x && typeof x.score === "number");
export const saveSims = (l: SimRecord[]) => saveKey(SIMS_KEY, l.slice(0, 100));

/* ------------------------------------------------------------------ Rx Safety Check */

export interface RxPatient { age: string; sex: "" | "M" | "F"; weightKg: string; pregnant: "unknown" | "yes" | "no"; breastfeeding: boolean; egfr: string; liver: boolean; allergies: string; conditions: string }
export const blankRxPatient = (): RxPatient => ({ age: "", sex: "", weightKg: "", pregnant: "unknown", breastfeeding: false, egfr: "", liver: false, allergies: "", conditions: "" });
export interface RxMedicine { name: string; generic: string; dose: string; frequency: string; duration: string; route: string; status: "ok" | "caution" | "danger"; note: string; nlem: boolean; janAushadhi: string }
export type RxIssueKind = "dose" | "interaction" | "allergy" | "pregnancy" | "renal" | "hepatic" | "duplicate" | "age" | "contraindication" | "missing" | "legibility" | "other";
export interface RxIssue { severity: "high" | "moderate" | "low"; kind: RxIssueKind; title: string; detail: string; action: string; drugs: string[]; local?: boolean }
export interface RxReport { verdict: "ok" | "review" | "unsafe"; summary: string; medicines: RxMedicine[]; issues: RxIssue[]; missingInfo: string[] }
export const RX_KIND_LABEL: Record<RxIssueKind, string> = {
  dose: "Dose", interaction: "Interaction", allergy: "Allergy", pregnancy: "Pregnancy", renal: "Kidney", hepatic: "Liver",
  duplicate: "Duplicate", age: "Age", contraindication: "Contraindication", missing: "Missing", legibility: "Can't read", other: "Other",
};
export const RX_VERDICT: Record<RxReport["verdict"], { label: string; sub: string }> = {
  ok: { label: "No problems found", sub: "Check it yourself before it goes to the patient." },
  review: { label: "Review before giving", sub: "Changes or monitoring are needed." },
  unsafe: { label: "Unsafe as written", sub: "Change it before it reaches the patient." },
};

/** The patient fields as the server expects them (numbers, or nothing). */
export function rxPatientPayload(p: RxPatient) {
  const n = (s: string) => (s.trim() && Number.isFinite(Number(s)) ? Number(s) : undefined);
  return {
    age: n(p.age), sex: p.sex || undefined, weightKg: n(p.weightKg), pregnant: p.sex === "M" ? "no" : p.pregnant,
    breastfeeding: p.sex !== "M" && p.breastfeeding, egfr: n(p.egfr), liver: p.liver, allergies: p.allergies.trim(), conditions: p.conditions.trim(),
  };
}

/** One line about the patient, for the saved list and the printout. */
export function rxPatientSummary(p: RxPatient): string {
  return [
    p.age ? `${p.age} y` : "", p.sex, p.weightKg ? `${p.weightKg} kg` : "",
    p.sex !== "M" && p.pregnant === "yes" ? "pregnant" : "", p.breastfeeding && p.sex !== "M" ? "breastfeeding" : "",
    p.egfr ? `eGFR ${p.egfr}` : "", p.liver ? "liver disease" : "", p.allergies ? `allergy: ${p.allergies}` : "",
  ].filter(Boolean).join(" · ") || "No patient details";
}

/** The report as markdown, for printing, copying or asking Cadus. */
export function rxReportMarkdown(r: RxReport, patient: string): string {
  const out = [`# Prescription check`, `**Patient:** ${patient}`, `**Result:** ${RX_VERDICT[r.verdict].label}. ${r.summary}`];
  if (r.issues.length) {
    out.push("## Problems found");
    r.issues.forEach((i) => out.push(`- **${i.severity === "high" ? "High" : i.severity === "moderate" ? "Moderate" : "Low"} · ${RX_KIND_LABEL[i.kind]}: ${i.title}.** ${i.detail}${i.action ? ` **Change:** ${i.action}` : ""}`));
  }
  out.push("## Medicines", "| Written | Generic | Dose | How often | For | Jan Aushadhi |", "|---|---|---|---|---|---|");
  r.medicines.forEach((m) => out.push(`| ${m.name} | ${m.generic}${m.nlem ? " (NLEM)" : ""} | ${m.dose} | ${m.frequency} | ${m.duration} | ${m.janAushadhi || "-"} |`));
  if (r.missingInfo.length) out.push("## To be sure, Cadus needs", ...r.missingInfo.map((x) => `- ${x}`));
  out.push("", "*Checked by Cadus. The prescriber remains responsible for every medicine.*");
  return out.join("\n");
}

export interface RxCheckRecord { id: string; at: number; patient: string; label: string; report: RxReport }
export const RXCHECKS_KEY = "cadus3.rxchecks";
export const readRxChecks = () => readKey<RxCheckRecord[]>(RXCHECKS_KEY, []).filter((x) => x && x.report && Array.isArray(x.report.medicines));
export const saveRxChecks = (l: RxCheckRecord[]) => saveKey(RXCHECKS_KEY, l.slice(0, 30));

/* ------------------------------------------------------------------ Guideline Watch */

export interface WatchTopic { id: string; label: string; query: string; on: boolean; custom?: boolean }
export interface WatchPaper { pmid: string; title: string; journal: string; year: string; types: string[]; doi: string }
export interface WatchItem { pmid: string; takeaway: string; impact: "practice-changing" | "notable" | "background"; why: string }
export interface WatchDigest { headline: string; items: WatchItem[]; summary: string }
export interface WatchRun { at: number; days: number; papers: WatchPaper[]; digest: WatchDigest | null; fresh: string[] }
export interface WatchState { topics: WatchTopic[]; days: 7 | 30 | 90; keyOnly: boolean; runs: Record<string, WatchRun> }

export const WATCH_PRESETS: { label: string; query: string }[] = [
  { label: "Cardiology", query: "heart failure OR myocardial infarction OR atrial fibrillation OR hypertension OR acute coronary syndrome" },
  { label: "Diabetes and endocrinology", query: "diabetes mellitus OR thyroid OR obesity OR insulin OR GLP-1" },
  { label: "Infectious diseases", query: "sepsis OR tuberculosis OR dengue OR malaria OR antimicrobial resistance OR typhoid" },
  { label: "Respiratory", query: "asthma OR COPD OR pneumonia OR interstitial lung disease" },
  { label: "Nephrology", query: "chronic kidney disease OR acute kidney injury OR dialysis" },
  { label: "Paediatrics", query: "(child OR infant OR neonate) AND (sepsis OR pneumonia OR malnutrition OR diarrhoea OR vaccination)" },
  { label: "Obstetrics", query: "pre-eclampsia OR postpartum haemorrhage OR gestational diabetes OR preterm birth" },
  { label: "Neurology", query: "stroke OR epilepsy OR migraine OR dementia" },
  { label: "Oncology", query: "breast cancer OR lung cancer OR oral cancer OR cervical cancer" },
  { label: "Critical care", query: "intensive care OR mechanical ventilation OR septic shock OR resuscitation" },
  { label: "Gastroenterology", query: "cirrhosis OR hepatitis OR inflammatory bowel disease OR GI bleeding" },
  { label: "Psychiatry", query: "depression OR schizophrenia OR bipolar disorder OR anxiety disorder" },
];
export const WATCH_KEY = "cadus3.watch";
export function readWatch(): WatchState {
  const s = readKey<Partial<WatchState>>(WATCH_KEY, {});
  const topics = Array.isArray(s.topics) && s.topics.length
    ? s.topics.filter((t) => t && t.label && t.query)
    : WATCH_PRESETS.map((p, i) => ({ id: `p${i}`, label: p.label, query: p.query, on: i < 2 }));
  return { topics, days: s.days === 7 || s.days === 90 ? s.days : 30, keyOnly: s.keyOnly !== false, runs: s.runs && typeof s.runs === "object" ? s.runs : {} };
}
export const saveWatch = (s: WatchState) => saveKey(WATCH_KEY, s);
export const pubmedUrl = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid)}/`;
export const IMPACT_LABEL: Record<WatchItem["impact"], string> = { "practice-changing": "Practice-changing", notable: "Notable", background: "Background" };

/** A topic's digest as markdown with numbered sources, for the Library. */
export function watchMarkdown(topic: string, run: WatchRun): { md: string; sources: { n: number; url: string; title: string }[] } {
  const papers = new Map(run.papers.map((p) => [p.pmid, p]));
  const sources: { n: number; url: string; title: string }[] = [];
  const cite = (pmid: string) => {
    let s = sources.find((x) => x.url === pubmedUrl(pmid));
    if (!s) { s = { n: sources.length + 1, url: pubmedUrl(pmid), title: papers.get(pmid)?.title || `PubMed ${pmid}` }; sources.push(s); }
    return s.n;
  };
  if (!run.digest) return { md: `No new evidence on ${topic} in the last ${run.days} days.`, sources };
  const lines = [`**Bottom line:** ${run.digest.headline}`, "", run.digest.summary, "", "## What's new"];
  run.digest.items.forEach((i) => lines.push(`- **${IMPACT_LABEL[i.impact]}:** ${i.takeaway}${i.why ? ` ${i.why}` : ""} [${cite(i.pmid)}]`));
  return { md: lines.join("\n"), sources };
}

/* ------------------------------------------------------------------ Report Explainer */

export interface ExplainFinding { name: string; value: string; ref: string; flag: "critical" | "high" | "low" | "abnormal" | "normal"; meaning: string }
export interface ExplainResult { title: string; kind: string; doctorSummary: string; findings: ExplainFinding[]; patientSummary: string; questions: string[]; urgent: boolean; urgentReason: string }
export interface ExplainRecord { id: string; at: number; language: string; result: ExplainResult }
export const EXPLAINS_KEY = "cadus3.explains";
export const readExplains = () => readKey<ExplainRecord[]>(EXPLAINS_KEY, []).filter((x) => x && x.result && typeof x.result.patientSummary === "string");
export const saveExplains = (l: ExplainRecord[]) => saveKey(EXPLAINS_KEY, l.slice(0, 40));
export const FLAG_LABEL: Record<ExplainFinding["flag"], string> = { critical: "Critical", high: "High", low: "Low", abnormal: "Abnormal", normal: "Normal" };

/** The patient's explanation as plain text for WhatsApp. */
export function explainShareText(r: ExplainResult): string {
  const plain = r.patientSummary.replace(/^#+\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
  return [`*${r.title}*`, plain, r.questions.length ? `\n${r.questions.map((q) => `• ${q}`).join("\n")}` : ""].filter(Boolean).join("\n\n").slice(0, 3500);
}
