/**
 * Patient cases: a structured, de-identified case sheet (details, complaint,
 * history, examination, vitals, investigations, problems, medicines and plan)
 * with a dated timeline, that Cadus can reason over. Kept on this device.
 * A case never holds a name: the label is a bed number or age and sex.
 */

export type CaseSex = "M" | "F" | "O" | "";
export type EntryKind = "note" | "vitals" | "labs" | "event" | "cadus";

export interface Vitals {
  hr?: number;
  sbp?: number;
  dbp?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  gcs?: number;
  /** On supplemental oxygen. */
  o2?: boolean;
}

export interface CaseEntry {
  id: string;
  at: number;
  kind: EntryKind;
  text: string;
  vitals?: Vitals;
}

export interface PatientCase {
  id: string;
  /** Bed or cubicle, e.g. "12" or "ICU-3". */
  bed: string;
  age: string;
  sex: CaseSex;
  complaint: string;
  history: string;
  exam: string;
  investigations: string;
  problems: string[];
  meds: string;
  plan: string;
  status: "active" | "closed";
  timeline: CaseEntry[];
  createdAt: number;
  updatedAt: number;
}

export const CASES_KEY = "cadus3.cases";
export const CASES_MAX = 100;
export const ENTRIES_MAX = 200;
export const CASE_LIMITS = { bed: 12, age: 12, complaint: 200, history: 6000, exam: 4000, investigations: 4000, problem: 120, problems: 20, meds: 2000, plan: 3000, entry: 2000 };

export const ENTRY_LABEL: Record<EntryKind, string> = { note: "Note", vitals: "Vitals", labs: "Results", event: "Event", cadus: "From Cadus" };

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").slice(0, max) : "");
const num = (v: unknown, lo: number, hi: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n * 10) / 10 : undefined;
};

/** Plausible ranges: anything outside is treated as a typing error and dropped. */
export function cleanVitals(raw: unknown): Vitals | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const v: Vitals = {
    hr: num(r.hr, 10, 300), sbp: num(r.sbp, 30, 300), dbp: num(r.dbp, 10, 200), rr: num(r.rr, 2, 80),
    temp: num(r.temp, 25, 45), spo2: num(r.spo2, 30, 100), gcs: num(r.gcs, 3, 15),
    ...(r.o2 === true ? { o2: true } : {}),
  };
  for (const k of Object.keys(v) as (keyof Vitals)[]) if (v[k] === undefined) delete v[k];
  return Object.keys(v).some((k) => k !== "o2") ? v : undefined;
}

export function newCase(fields: Partial<PatientCase> = {}, now = Date.now()): PatientCase {
  return {
    id: uid(), bed: "", age: "", sex: "", complaint: "", history: "", exam: "", investigations: "", problems: [], meds: "", plan: "",
    status: "active", timeline: [], createdAt: now, updatedAt: now, ...fields,
  };
}

export function newEntry(kind: EntryKind, text: string, vitals?: Vitals, at = Date.now()): CaseEntry {
  return { id: uid(), at, kind, text: text.slice(0, CASE_LIMITS.entry), ...(vitals ? { vitals } : {}) };
}

export function cleanCase(raw: unknown): PatientCase | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  const sex = r.sex === "M" || r.sex === "F" || r.sex === "O" ? r.sex : "";
  const kinds: EntryKind[] = ["note", "vitals", "labs", "event", "cadus"];
  return {
    id: r.id.slice(0, 40),
    bed: str(r.bed, CASE_LIMITS.bed).replace(/\n/g, " ").trim(),
    age: str(r.age, CASE_LIMITS.age).replace(/\n/g, " ").trim(),
    sex,
    complaint: str(r.complaint, CASE_LIMITS.complaint).replace(/\n/g, " "),
    history: str(r.history, CASE_LIMITS.history),
    exam: str(r.exam, CASE_LIMITS.exam),
    investigations: str(r.investigations, CASE_LIMITS.investigations),
    problems: (Array.isArray(r.problems) ? r.problems : []).filter((p): p is string => typeof p === "string" && !!p.trim()).map((p) => p.trim().slice(0, CASE_LIMITS.problem)).slice(0, CASE_LIMITS.problems),
    meds: str(r.meds, CASE_LIMITS.meds),
    plan: str(r.plan, CASE_LIMITS.plan),
    status: r.status === "closed" ? "closed" : "active",
    timeline: (Array.isArray(r.timeline) ? r.timeline : [])
      .filter((e): e is Record<string, unknown> => !!e && typeof e === "object" && typeof (e as any).id === "string")
      .map((e) => {
        const vitals = cleanVitals(e.vitals);
        return {
          id: String(e.id).slice(0, 40),
          at: Number.isFinite(e.at) ? Number(e.at) : Date.now(),
          kind: kinds.includes(e.kind as EntryKind) ? (e.kind as EntryKind) : "note",
          text: str(e.text, CASE_LIMITS.entry),
          ...(vitals ? { vitals } : {}),
        };
      })
      .filter((e) => e.text.trim() || e.vitals)
      .sort((a, b) => b.at - a.at)
      .slice(0, ENTRIES_MAX),
    createdAt: Number.isFinite(r.createdAt) ? Number(r.createdAt) : Date.now(),
    updatedAt: Number.isFinite(r.updatedAt) ? Number(r.updatedAt) : Date.now(),
  };
}

export function readCases(): PatientCase[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CASES_KEY) || "[]");
    return (Array.isArray(raw) ? raw : []).map(cleanCase).filter((c): c is PatientCase => !!c).slice(0, CASES_MAX);
  } catch {
    return [];
  }
}

export function saveCases(list: PatientCase[]) {
  try { localStorage.setItem(CASES_KEY, JSON.stringify(list.slice(0, CASES_MAX))); } catch { /* full or blocked */ }
}

/* ------------------------------------------------------------------ reading a case */

const SEX: Record<CaseSex, string> = { M: "man", F: "woman", O: "person", "": "patient" };

/** "Bed 12 · 54M" */
export function caseLabel(c: PatientCase): string {
  const ageSex = `${c.age}${c.sex && c.sex !== "O" ? c.sex : ""}`.trim();
  return [c.bed && `Bed ${c.bed}`, ageSex].filter(Boolean).join(" · ") || "New case";
}

/** "54-year-old man" */
export function caseWho(c: PatientCase): string {
  const age = c.age.trim();
  if (/^\d{1,3}$/.test(age)) {
    const child = Number(age) < 16;
    const who = child ? (c.sex === "M" ? "boy" : c.sex === "F" ? "girl" : "child") : SEX[c.sex];
    return `${age}-year-old ${who}`;
  }
  return [age, SEX[c.sex]].filter(Boolean).join(" ");
}

/** The latest vitals on the timeline. */
export function latestVitals(c: PatientCase): { at: number; vitals: Vitals } | null {
  const e = c.timeline.find((x) => x.vitals);
  return e?.vitals ? { at: e.at, vitals: e.vitals } : null;
}

export type Flag = "ok" | "warn" | "danger";

/** A simple flag for each vital sign (NEWS2-style thresholds), to draw the eye. */
export function vitalFlags(v: Vitals): Partial<Record<keyof Vitals, Flag>> {
  const f: Partial<Record<keyof Vitals, Flag>> = {};
  const band = (k: keyof Vitals, val: number | undefined, danger: (n: number) => boolean, warn: (n: number) => boolean) => {
    if (val === undefined) return;
    f[k] = danger(val) ? "danger" : warn(val) ? "warn" : "ok";
  };
  band("hr", v.hr, (n) => n <= 40 || n >= 131, (n) => n <= 50 || n >= 91);
  band("sbp", v.sbp, (n) => n <= 90 || n >= 220, (n) => n <= 110);
  band("rr", v.rr, (n) => n <= 8 || n >= 25, (n) => n <= 11 || n >= 21);
  band("temp", v.temp, (n) => n <= 35, (n) => n <= 36 || n >= 38.1);
  band("spo2", v.spo2, (n) => n <= 91, (n) => n <= 95);
  band("gcs", v.gcs, (n) => n <= 8, (n) => n < 15);
  return f;
}

export function vitalsText(v: Vitals): string {
  return [
    v.hr !== undefined && `HR ${v.hr}`,
    v.sbp !== undefined && `BP ${v.sbp}${v.dbp !== undefined ? `/${v.dbp}` : ""}`,
    v.rr !== undefined && `RR ${v.rr}`,
    v.temp !== undefined && `T ${v.temp}°C`,
    v.spo2 !== undefined && `SpO₂ ${v.spo2}%${v.o2 ? " on O₂" : ""}`,
    v.gcs !== undefined && `GCS ${v.gcs}`,
  ].filter(Boolean).join(", ");
}

const fmt = (t: number) => new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * The case as text for Cadus: everything filled in, the latest vitals and the
 * most recent timeline entries. De-identified by design (no names are stored),
 * and the privacy guard runs on it again before it is sent.
 */
export function caseSummary(c: PatientCase, opts: { entries?: number } = {}): string {
  const v = latestVitals(c);
  const recent = c.timeline.slice(0, opts.entries ?? 8).reverse();
  const lines = [
    `A ${caseWho(c)}${c.bed ? ` in bed ${c.bed}` : ""}.`.replace(/^A ([aeiou8]|11|18)/i, "An $1"),
    c.complaint.trim() && `Presenting complaint: ${c.complaint.trim()}`,
    c.history.trim() && `History: ${c.history.trim()}`,
    c.exam.trim() && `Examination: ${c.exam.trim()}`,
    v && `Latest vitals (${fmt(v.at)}): ${vitalsText(v.vitals)}`,
    c.investigations.trim() && `Investigations: ${c.investigations.trim()}`,
    c.problems.length && `Problem list: ${c.problems.map((p, i) => `${i + 1}. ${p}`).join("; ")}`,
    c.meds.trim() && `Medicines: ${c.meds.trim()}`,
    c.plan.trim() && `Plan so far: ${c.plan.trim()}`,
    recent.length && `Timeline:\n${recent.map((e) => `- ${fmt(e.at)} (${ENTRY_LABEL[e.kind].toLowerCase()}): ${[e.vitals && vitalsText(e.vitals), e.text.trim()].filter(Boolean).join(". ")}`).join("\n")}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** How complete the sheet is: which core sections are still empty. */
export function missingSections(c: PatientCase): string[] {
  const out: string[] = [];
  if (!c.complaint.trim()) out.push("presenting complaint");
  if (!c.history.trim()) out.push("history");
  if (!c.exam.trim()) out.push("examination");
  if (!latestVitals(c)) out.push("vitals");
  if (!c.investigations.trim()) out.push("investigations");
  return out;
}

/** What Cadus is asked for each case action. */
export const CASE_ACTIONS: { id: string; label: string; mode: string; ask: string }[] = [
  { id: "ddx", label: "Differentials", mode: "ddx", ask: "Give a ranked differential diagnosis for this case, with the features for and against each, the can't-miss diagnoses, and the key tests to tell them apart." },
  { id: "next", label: "Next steps", mode: "general", ask: "What are the next investigations and management steps for this case? Prioritise by urgency, give doses where relevant, and say what to watch for and when to escalate." },
  { id: "progress", label: "Progress note", mode: "progress", ask: "Write today's progress note (SOAP) for this case from the details given." },
  { id: "handover", label: "SBAR handover", mode: "handover", ask: "Write an SBAR handover for this patient for the next shift." },
  { id: "referral", label: "Referral letter", mode: "referral", ask: "Write a referral letter for this patient to the appropriate specialist, with the reason for referral and the question to answer." },
  { id: "discharge", label: "Discharge summary", mode: "discharge", ask: "Write a discharge summary for this patient from the details given, with medicines, follow-up and red flags to return for." },
];

/** A case from a ward patient (or the other way round), so the two stay in step. */
export function caseFromWard(p: { bed: string; label: string; diagnosis: string; problems: string; meds: string; plan: string }): PatientCase {
  const m = /^(\d{1,3})\s*([MFmf])?/.exec(p.label.trim());
  return newCase({
    bed: p.bed,
    age: m?.[1] ?? p.label.slice(0, CASE_LIMITS.age),
    sex: (m?.[2]?.toUpperCase() as CaseSex) ?? "",
    complaint: p.diagnosis,
    history: p.problems,
    meds: p.meds,
    plan: p.plan,
    problems: p.diagnosis ? [p.diagnosis] : [],
  });
}

export const EXAMPLE_CASE = (): PatientCase => {
  const now = Date.now();
  return newCase({
    bed: "14",
    age: "58",
    sex: "M",
    complaint: "Fever and breathlessness for 3 days",
    history: "Productive cough with rusty sputum, right-sided pleuritic chest pain. Type 2 diabetes for 10 years on metformin 1 g twice daily. Smoker, 20 pack-years. No recent travel or hospital stay.",
    exam: "Looks unwell, talking in short sentences. Bronchial breathing and crackles at the right base. No pedal oedema.",
    investigations: "Hb 13.1 g/dL, WBC 18,600/µL (neutrophils 88%), urea 52 mg/dL, creatinine 1.4 mg/dL, Na 133, K 4.6, glucose 286 mg/dL. Chest X-ray: right lower lobe consolidation.",
    problems: ["Community-acquired pneumonia, right lower lobe", "Type 2 diabetes, hyperglycaemia", "Acute kidney injury?"],
    meds: "Metformin 1 g twice daily (held)",
    plan: "",
    // Newest first, as on the timeline.
    timeline: [
      newEntry("vitals", "After 1 L of crystalloid", { hr: 104, sbp: 106, dbp: 64, rr: 24, temp: 38.4, spo2: 94, o2: true, gcs: 15 }, now - 3600_000),
      newEntry("event", "Oxygen 2 L/min by nasal cannula started; blood cultures sent", undefined, now - 2.5 * 3600_000),
      newEntry("vitals", "On arrival in the emergency department", { hr: 112, sbp: 98, dbp: 60, rr: 26, temp: 38.9, spo2: 91, gcs: 15 }, now - 3 * 3600_000),
    ],
  }, now);
};
