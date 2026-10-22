// Cadus update 9: the prompts and the output checks for Case Simulator, Rx Safety Check,
// Guideline Watch and Report Explainer. Everything here is pure (no network), so the
// endpoint stays small and these checks can be tested on their own.

/* ------------------------------------------------------------------ helpers */

/** A trimmed, single-line string with control characters and markup removed. */
export function line(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>`]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** Multi-line text (markdown kept, control characters and code fences removed). */
export function text(v: unknown, max: number): string {
  return typeof v === "string"
    ? v.replace(/\r/g, "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").replace(/^\s*```[a-z]*\s*\n?|\n?```\s*$/gi, "").trim().slice(0, max)
    : "";
}

export function list(v: unknown, n: number, max: number): string[] {
  return (Array.isArray(v) ? v : []).map((x) => line(x, max)).filter(Boolean).slice(0, n);
}

const num = (v: unknown, lo: number, hi: number): number | null => {
  const digits = typeof v === "string" ? v.replace(/[^\d.-]/g, "") : "";
  const n = typeof v === "number" ? v : digits && /\d/.test(digits) ? Number(digits) : NaN;
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n * 10) / 10)) : null;
};
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

/* ------------------------------------------------------------------ Case Simulator */

export const SIM_LEVELS = ["mbbs", "intern", "pg"] as const;
export const SIM_DIFFICULTY = ["easy", "medium", "hard"] as const;
export const SIM_ACTIONS = ["history", "exam", "test", "treat", "consult", "wait"] as const;
export type SimAction = (typeof SIM_ACTIONS)[number];

export interface SimVitals { hr: number | null; sbp: number | null; dbp: number | null; rr: number | null; spo2: number | null; temp: number | null }
export interface SimCase {
  title: string;
  specialty: string;
  level: (typeof SIM_LEVELS)[number];
  difficulty: (typeof SIM_DIFFICULTY)[number];
  setting: string;
  age: number | null;
  sex: "M" | "F";
  complaint: string;
  opening: string;
  vitals: SimVitals;
  /** Hidden from the learner until the debrief. */
  diagnosis: string;
  differentials: string[];
  keyFindings: string[];
  idealSteps: string[];
  redFlags: string[];
}

export function simVitals(raw: any): SimVitals {
  const v = raw && typeof raw === "object" ? raw : {};
  return {
    hr: num(v.hr, 20, 250),
    sbp: num(v.sbp, 30, 280),
    dbp: num(v.dbp, 10, 180),
    rr: num(v.rr, 4, 70),
    spo2: num(v.spo2, 40, 100),
    temp: num(v.temp, 30, 43),
  };
}

/** A case from the model (or sent back by the browser), checked; null if unusable. */
export function simCase(raw: any): SimCase | null {
  if (!raw || typeof raw !== "object") return null;
  const c: SimCase = {
    title: line(raw.title, 90),
    specialty: line(raw.specialty, 60),
    level: pick(raw.level, SIM_LEVELS, "mbbs"),
    difficulty: pick(raw.difficulty, SIM_DIFFICULTY, "medium"),
    setting: line(raw.setting, 80) || "Emergency department",
    age: num(raw.age, 0, 110),
    sex: String(raw.sex).toUpperCase().startsWith("F") ? "F" : "M",
    complaint: line(raw.complaint, 200),
    opening: text(raw.opening, 1200),
    vitals: simVitals(raw.vitals),
    diagnosis: line(raw.diagnosis, 160),
    differentials: list(raw.differentials, 6, 120),
    keyFindings: list(raw.keyFindings, 10, 200),
    idealSteps: list(raw.idealSteps, 12, 220),
    redFlags: list(raw.redFlags, 6, 200),
  };
  return c.title && c.complaint && c.opening && c.diagnosis ? c : null;
}

export interface SimLogEntry { kind: SimAction; text: string; reply: string; minute: number }
export function simLog(raw: unknown): SimLogEntry[] {
  return (Array.isArray(raw) ? raw : []).slice(-40).map((e: any) => ({
    kind: pick(e?.kind, SIM_ACTIONS, "history"),
    text: line(e?.text, 400),
    reply: text(e?.reply, 1500),
    minute: num(e?.minute, 0, 1440) ?? 0,
  })).filter((e) => e.text || e.kind === "wait");
}

export const SIM_STATUS = ["stable", "improving", "worsening", "critical", "recovered", "died"] as const;
export interface SimTurn { reply: string; vitals: SimVitals; status: (typeof SIM_STATUS)[number]; minutes: number; event: string }
export function simTurn(raw: any, before: SimVitals): SimTurn | null {
  if (!raw || typeof raw !== "object") return null;
  const reply = text(raw.reply, 2500);
  if (!reply) return null;
  const v = simVitals(raw.vitals);
  // A vital the model left out stays as it was.
  const vitals = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x ?? before[k as keyof SimVitals]])) as unknown as SimVitals;
  return { reply, vitals, status: pick(raw.status, SIM_STATUS, "stable"), minutes: num(raw.minutes, 1, 240) ?? 5, event: line(raw.event, 240) };
}

export interface SimDebrief {
  score: number;
  diagnosisCorrect: boolean;
  verdict: string;
  strengths: string[];
  missed: string[];
  unsafe: string[];
  teaching: string[];
  idealApproach: string;
}
export function simDebrief(raw: any): SimDebrief | null {
  if (!raw || typeof raw !== "object") return null;
  const score = num(raw.score, 0, 100);
  const verdict = line(raw.verdict, 300);
  if (score === null || !verdict) return null;
  return {
    score: Math.round(score),
    diagnosisCorrect: raw.diagnosisCorrect === true,
    verdict,
    strengths: list(raw.strengths, 6, 240),
    missed: list(raw.missed, 8, 240),
    unsafe: list(raw.unsafe, 6, 240),
    teaching: list(raw.teaching, 8, 260),
    idealApproach: text(raw.idealApproach, 4000),
  };
}

const LEVEL_LABEL: Record<string, string> = { mbbs: "a final-year MBBS student", intern: "an intern", pg: "a postgraduate resident" };

export const SIM_START_SYSTEM = `You are Cadus Case Simulator, writing a realistic, interactive patient case for medical training in India.
Write ONE case as JSON (no prose, no code fences) with these keys:
{"title": short neutral title that does NOT reveal the diagnosis (e.g. "Breathless woman in the ED"),
 "specialty", "level", "difficulty", "setting" (e.g. "District hospital emergency, 2 am"),
 "age" (number), "sex" ("M" or "F"),
 "complaint": the presenting complaint in one line,
 "opening": what the learner sees and hears on arrival, in 3 to 5 sentences: the patient's words (they may mix Hindi or a regional language with English, give a translation in brackets), who brought them, how they look. No diagnosis, no test results,
 "vitals": {"hr","sbp","dbp","rr","spo2","temp"} as numbers (temp in °C),
 "diagnosis": the actual diagnosis,
 "differentials": 3 to 5 reasonable alternatives,
 "keyFindings": the history points, signs and results that clinch it,
 "idealSteps": what a good doctor at this level does, in order (history, examination, tests, treatment with doses, escalation),
 "redFlags": what must not be missed or delayed}
Rules: Indian context (diseases common in India such as dengue, malaria, TB, snake bite, organophosphate poisoning, rheumatic heart disease, alongside the usual), resources that fit the setting, real drug names and standard doses per Indian and international guidelines. Never use a real person's name. Make the case solvable from history, examination and tests.`;

export function simStartPrompt(o: { specialty: string; level: string; difficulty: string; seed: string }): string {
  return [
    `Specialty: ${o.specialty || "any (pick a common, important presentation)"}`,
    `Learner: ${LEVEL_LABEL[o.level] ?? LEVEL_LABEL.mbbs}`,
    `Difficulty: ${o.difficulty}${o.difficulty === "hard" ? " (an atypical presentation or a dangerous mimic)" : o.difficulty === "easy" ? " (a classic presentation)" : ""}`,
    o.seed ? `Theme the learner asked for: ${o.seed}` : "",
    `Variety key: ${Math.random().toString(36).slice(2, 8)} (use it to vary age, sex, setting and the specific diagnosis)`,
  ].filter(Boolean).join("\n");
}

export const SIM_TURN_SYSTEM = `You run a live patient simulation for a learner. You play the patient, the relatives, the nurse and the lab, never the teacher.
You get the hidden case, what has happened so far and the learner's new action. Reply ONLY as JSON (no code fences):
{"reply": what happens, in markdown: the patient's or relative's answer for history; the findings for an examination (only what that examination would show); for tests, the results as a short markdown table with units and reference ranges and a "Report pending (n min)" line if it takes time (an ECG, X-ray or scan is described as a report); for treatment, what the nurse does and how the patient responds; for a consult, what the senior or specialist says, briefly,
 "vitals": {"hr","sbp","dbp","rr","spo2","temp"} after this action,
 "status": "stable" | "improving" | "worsening" | "critical" | "recovered" | "died",
 "minutes": how many minutes the action takes (a question 1 to 2, an exam 3 to 5, a bedside test 5 to 10, labs 30 to 60, imaging 30 to 90, a drug 5 to 15),
 "event": empty, or one line if something changes (e.g. "She has a generalised seizure")}
Rules: stay true to the hidden case and consistent with what was said before. Answer only what was asked: never volunteer the diagnosis, hints or what to do next. Results follow the real disease. Correct treatment improves the patient over time; wrong, harmful or delayed treatment worsens them realistically (a wrong dose or a contraindicated drug has its real effect). If the learner names a drug without a dose or route, the nurse asks for it. If the action is unclear or not possible in this setting, the nurse says so. Keep replies short, like real life.`;

export function simTurnPrompt(c: SimCase, log: SimLogEntry[], action: { kind: SimAction; text: string }, minute: number): string {
  return [
    `<hidden_case>\n${JSON.stringify(c)}\n</hidden_case>`,
    log.length
      ? `<so_far>\n${log.map((e) => `[min ${e.minute}] ${e.kind.toUpperCase()}: ${e.text}\n→ ${e.reply.slice(0, 600)}`).join("\n")}\n</so_far>`
      : "<so_far>The learner has just arrived.</so_far>",
    `Time now: minute ${minute}.`,
    action.kind === "wait" ? "NEW ACTION: WAIT (the learner waits and observes for 15 minutes)." : `NEW ACTION: ${action.kind.toUpperCase()}: ${action.text}`,
  ].join("\n\n");
}

export const SIM_DEBRIEF_SYSTEM = `You are a senior clinician and examiner debriefing a learner after a simulated case. Be fair, specific and kind, like a good teacher on a ward round in India.
Reply ONLY as JSON (no code fences):
{"score": 0 to 100 (history 20, examination 15, investigations 15, diagnosis 20, management and safety 30; anything unsafe caps the score at 60),
 "diagnosisCorrect": true or false,
 "verdict": one or two sentences overall,
 "strengths": what they did well, specific,
 "missed": important questions, signs or tests they missed or did late,
 "unsafe": anything harmful, wrongly dosed, contraindicated or dangerously delayed (empty if none),
 "teaching": 4 to 6 high-yield teaching points about this condition (Indian guidelines where relevant, real doses),
 "idealApproach": markdown, the ideal approach step by step in under 250 words}`;

export function simDebriefPrompt(c: SimCase, log: SimLogEntry[], finalDiagnosis: string, plan: string, minute: number): string {
  return [
    `<case>\n${JSON.stringify(c)}\n</case>`,
    `<what_the_learner_did>\n${log.map((e) => `[min ${e.minute}] ${e.kind.toUpperCase()}: ${e.text}`).join("\n") || "Nothing."}\n</what_the_learner_did>`,
    `Total time: ${minute} minutes.`,
    `Learner's final diagnosis: ${finalDiagnosis || "(none given)"}`,
    `Learner's plan: ${plan || "(none given)"}`,
  ].join("\n\n");
}

/* ------------------------------------------------------------------ Rx Safety Check */

export interface RxPatient {
  age: number | null;
  sex: "M" | "F" | "";
  weightKg: number | null;
  pregnant: "yes" | "no" | "unknown";
  breastfeeding: boolean;
  egfr: number | null;
  liver: boolean;
  allergies: string;
  conditions: string;
}
export function rxPatient(raw: any): RxPatient {
  const p = raw && typeof raw === "object" ? raw : {};
  return {
    age: num(p.age, 0, 120),
    sex: p.sex === "F" || p.sex === "M" ? p.sex : "",
    weightKg: num(p.weightKg, 0.3, 300),
    pregnant: pick(p.pregnant, ["yes", "no", "unknown"] as const, "unknown"),
    breastfeeding: p.breastfeeding === true,
    egfr: num(p.egfr, 1, 200),
    liver: p.liver === true,
    allergies: line(p.allergies, 300),
    conditions: line(p.conditions, 500),
  };
}
export function rxPatientLine(p: RxPatient): string {
  const bits = [
    p.age !== null ? `${p.age < 2 ? `${Math.round(p.age * 12)} months` : `${p.age} years`}` : "age not given",
    p.sex === "F" ? "female" : p.sex === "M" ? "male" : "",
    p.weightKg !== null ? `${p.weightKg} kg` : "weight not given",
    p.sex !== "M" ? (p.pregnant === "yes" ? "PREGNANT" : p.pregnant === "no" ? "not pregnant" : "") : "",
    p.breastfeeding ? "breastfeeding" : "",
    p.egfr !== null ? `eGFR ${p.egfr}` : "",
    p.liver ? "liver disease" : "",
    p.allergies ? `allergies: ${p.allergies}` : "no allergies recorded",
    p.conditions ? `conditions: ${p.conditions}` : "",
  ];
  return bits.filter(Boolean).join("; ");
}

export const RX_CHECK_SYSTEM = `You are Cadus Rx Safety Check, a clinical pharmacist reviewing a prescription written in India before it reaches the patient.
The prescription may be typed, or a photo or PDF of a handwritten or printed prescription. Brand names are common: map every brand to its generic (and every component of a combination).
Check, for this patient: dose and frequency (adult, paediatric by weight, elderly), route and duration, drug-drug interactions, duplicate drugs or duplicate classes (including inside combinations), allergies and cross-reactivity, pregnancy and breastfeeding, kidney function (adjust by eGFR) and liver disease, age (Beers criteria in the elderly; drugs to avoid in children), contraindications from the listed conditions, and anything missing that the diagnosis needs (e.g. a PPI with dual antiplatelets, folic acid in pregnancy) or that cannot be read.
Reply ONLY as JSON (no code fences):
{"verdict": "ok" | "review" | "unsafe",
 "summary": one or two sentences,
 "medicines": [{"name": as written, "generic": generic name(s) with strength, "dose", "frequency", "duration", "route",
   "status": "ok" | "caution" | "danger", "note": one line, "nlem": true if the generic is on India's National List of Essential Medicines 2022 else false,
   "janAushadhi": the generic name and strength to ask for at a Pradhan Mantri Bhartiya Janaushadhi Kendra, or "" if it is unlikely to be stocked}],
 "issues": [{"severity": "high" | "moderate" | "low", "kind": "dose" | "interaction" | "allergy" | "pregnancy" | "renal" | "hepatic" | "duplicate" | "age" | "contraindication" | "missing" | "legibility" | "other",
   "title": short, "detail": what and why, "action": what to change (a specific alternative or dose), "drugs": the generic names involved}],
 "missingInfo": what you would need to be sure (e.g. "weight, for the paediatric dose")}
Rules: high = could cause serious harm; moderate = needs a change or monitoring; low = good practice. Never invent prices or brand availability. If something cannot be read, say so as a legibility issue instead of guessing. If the patient details are incomplete, check what you can and list what is missing. Order issues by severity.`;

export const RX_ISSUE_KINDS = ["dose", "interaction", "allergy", "pregnancy", "renal", "hepatic", "duplicate", "age", "contraindication", "missing", "legibility", "other"] as const;
export interface RxMedicine { name: string; generic: string; dose: string; frequency: string; duration: string; route: string; status: "ok" | "caution" | "danger"; note: string; nlem: boolean; janAushadhi: string }
export interface RxIssue { severity: "high" | "moderate" | "low"; kind: (typeof RX_ISSUE_KINDS)[number]; title: string; detail: string; action: string; drugs: string[] }
export interface RxReport { verdict: "ok" | "review" | "unsafe"; summary: string; medicines: RxMedicine[]; issues: RxIssue[]; missingInfo: string[] }

const SEV_RANK = { high: 0, moderate: 1, low: 2 } as const;
export function rxReport(raw: any): RxReport | null {
  if (!raw || typeof raw !== "object") return null;
  const medicines: RxMedicine[] = (Array.isArray(raw.medicines) ? raw.medicines : []).slice(0, 25).map((m: any) => ({
    name: line(m?.name, 120),
    generic: line(m?.generic, 160),
    dose: line(m?.dose, 80),
    frequency: line(m?.frequency, 80),
    duration: line(m?.duration, 60),
    route: line(m?.route, 40),
    status: pick(m?.status, ["ok", "caution", "danger"] as const, "caution"),
    note: line(m?.note, 240),
    nlem: m?.nlem === true,
    janAushadhi: line(m?.janAushadhi, 160),
  })).filter((m: RxMedicine) => m.name || m.generic);
  const issues: RxIssue[] = (Array.isArray(raw.issues) ? raw.issues : []).slice(0, 25).map((i: any) => ({
    severity: pick(i?.severity, ["high", "moderate", "low"] as const, "moderate"),
    kind: pick(i?.kind, RX_ISSUE_KINDS, "other"),
    title: line(i?.title, 120),
    detail: line(i?.detail, 500),
    action: line(i?.action, 400),
    drugs: list(i?.drugs, 6, 80),
  })).filter((i: RxIssue) => i.title);
  issues.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
  if (!medicines.length) return null;
  // The verdict can never be milder than the worst issue.
  let verdict = pick(raw.verdict, ["ok", "review", "unsafe"] as const, "review");
  if (issues.some((i) => i.severity === "high") || medicines.some((m) => m.status === "danger")) verdict = "unsafe";
  else if (verdict === "ok" && (issues.some((i) => i.severity === "moderate") || medicines.some((m) => m.status === "caution"))) verdict = "review";
  return { verdict, summary: line(raw.summary, 400), medicines, issues, missingInfo: list(raw.missingInfo, 6, 160) };
}

/* ------------------------------------------------------------------ Guideline Watch */

export const WATCH_SYSTEM = `You are Cadus Guideline Watch, writing a short evidence digest for a busy doctor in India from the newest PubMed records on their topic.
You get the topic and up to 12 records (PMID, title, journal, publication types and abstract). Use ONLY these records; never add papers or facts that are not in them.
Reply ONLY as JSON (no code fences):
{"headline": one line on the most important thing that is new,
 "items": [{"pmid": the record's PMID, "takeaway": what it found, in one plain sentence with the key number if the abstract gives one,
   "impact": "practice-changing" (a guideline, or a large well-done trial or meta-analysis that changes care) | "notable" | "background",
   "why": one short line on what it means for practice in India, or "" }],
 "summary": two or three sentences tying it together}
Order items by impact, then by quality (guidelines, then meta-analyses and large trials). Leave out records that are off-topic, case reports or of little use to a clinician; at most 8 items. Be honest about small or early studies.`;

export const WATCH_IMPACT = ["practice-changing", "notable", "background"] as const;
export interface WatchItem { pmid: string; takeaway: string; impact: (typeof WATCH_IMPACT)[number]; why: string }
export interface WatchDigest { headline: string; items: WatchItem[]; summary: string }
const IMPACT_RANK = { "practice-changing": 0, notable: 1, background: 2 } as const;
export function watchDigest(raw: any, pmids: Set<string>): WatchDigest | null {
  if (!raw || typeof raw !== "object") return null;
  const seen = new Set<string>();
  const items: WatchItem[] = (Array.isArray(raw.items) ? raw.items : [])
    .map((x: any) => ({ pmid: String(x?.pmid ?? "").replace(/\D/g, ""), takeaway: line(x?.takeaway, 360), impact: pick(x?.impact, WATCH_IMPACT, "notable"), why: line(x?.why, 240) }))
    // Only papers that were actually sent, each once.
    .filter((x: WatchItem) => x.takeaway && pmids.has(x.pmid) && !seen.has(x.pmid) && (seen.add(x.pmid), true))
    .slice(0, 8);
  items.sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact]);
  const headline = line(raw.headline, 240);
  if (!items.length || !headline) return null;
  return { headline, items, summary: line(raw.summary, 700) };
}

export function watchRecords(papers: { pmid: string; title: string; journal: string; year: string; types: string[]; abstract: { label?: string; text: string }[] }[]): string {
  return papers.map((p) => [
    `PMID ${p.pmid} | ${p.title} | ${p.journal} ${p.year} | ${p.types.slice(0, 4).join(", ")}`,
    p.abstract.map((a) => (a.label ? `${a.label}: ${a.text}` : a.text)).join(" ").slice(0, 1400),
  ].join("\n")).join("\n\n");
}

/* ------------------------------------------------------------------ Report Explainer */

export const EXPLAIN_SYSTEM = `You are Cadus Report Explainer. A doctor gives you a medical report (laboratory results, imaging, pathology, an ECG or another test) as a photo, a PDF or text. You write two things: a summary for the doctor, and an explanation for the patient in the language the doctor chooses.
Reply ONLY as JSON (no code fences):
{"title": what the report is, e.g. "Complete blood count and kidney function",
 "kind": "lab" | "imaging" | "pathology" | "ecg" | "other",
 "doctorSummary": markdown, for the doctor: the abnormal results and the pattern they make, the likely clinical significance and differentials, and suggested next steps; concise, with values and units,
 "findings": [{"name", "value" with unit, "ref" (reference range as printed, or ""), "flag": "critical" | "high" | "low" | "abnormal" | "normal", "meaning": one plain-English line}] for every abnormal result and the key normal ones (at most 20),
 "patientSummary": markdown in the patient's language and script: what was tested, what is normal, what is not and what it may mean, in short sentences a patient with no medical training understands, kind and calm, never frightening and never falsely reassuring; do not give a final diagnosis or name a medicine or dose; end by saying their doctor will explain what happens next,
 "questions": 3 to 5 questions the patient could ask their doctor, in the patient's language,
 "urgent": true if any result needs action today (a critical value, a dangerous finding),
 "urgentReason": one line for the doctor if urgent, else ""}
Rules: read every value exactly as printed, with units; if something is unreadable, say so instead of guessing. Use the report's own reference ranges where printed. Never include the patient's name, phone, ID or address in anything you write.`;

export interface ExplainFinding { name: string; value: string; ref: string; flag: "critical" | "high" | "low" | "abnormal" | "normal"; meaning: string }
export interface ExplainResult { title: string; kind: "lab" | "imaging" | "pathology" | "ecg" | "other"; doctorSummary: string; findings: ExplainFinding[]; patientSummary: string; questions: string[]; urgent: boolean; urgentReason: string }
const FLAG_RANK = { critical: 0, high: 1, low: 1, abnormal: 1, normal: 2 } as const;
export function explainResult(raw: any): ExplainResult | null {
  if (!raw || typeof raw !== "object") return null;
  const findings: ExplainFinding[] = (Array.isArray(raw.findings) ? raw.findings : []).slice(0, 30).map((f: any) => ({
    name: line(f?.name, 100),
    value: line(f?.value, 60),
    ref: line(f?.ref, 60),
    flag: pick(f?.flag, ["critical", "high", "low", "abnormal", "normal"] as const, "abnormal"),
    meaning: line(f?.meaning, 240),
  })).filter((f: ExplainFinding) => f.name);
  findings.sort((a, b) => FLAG_RANK[a.flag] - FLAG_RANK[b.flag]);
  const doctorSummary = text(raw.doctorSummary, 5000);
  const patientSummary = text(raw.patientSummary, 6000);
  if (!doctorSummary || !patientSummary) return null;
  const urgent = raw.urgent === true || findings.some((f) => f.flag === "critical");
  return {
    title: line(raw.title, 120) || "Report",
    kind: pick(raw.kind, ["lab", "imaging", "pathology", "ecg", "other"] as const, "other"),
    doctorSummary,
    findings: findings.slice(0, 20),
    patientSummary,
    questions: list(raw.questions, 5, 240),
    urgent,
    urgentReason: urgent ? line(raw.urgentReason, 240) || "A critical value needs review today." : "",
  };
}
