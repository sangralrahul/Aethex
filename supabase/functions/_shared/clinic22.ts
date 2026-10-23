// Cadus update 22: patient record summaries, ward rounds by voice, revision notes, pre-operative
// assessment, patient messages and drugs in pregnancy and breastfeeding. Prompts and output checks
// only (no network), tested on their own.
import { line, list, text } from "./labs.ts";

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

/* ------------------------------------------------------------------ Patient record summary */

export const RECORD_SUMMARY_SYSTEM = `You are Cadus, reading a de-identified outpatient record (problems, allergies, long-term medicines and dated visits with vitals, diagnoses and prescriptions) for the doctor who is about to see the patient again.
Write what they need in the 30 seconds before the patient walks in: who this is clinically, the active problems and how each is going (with the trend in the numbers across visits), what was planned at the last visit and whether it seems to have happened, medicines and anything to reconsider (interactions, doses, duplications, missing standard care such as a statin in diabetes or overdue screening), and what to check today. Use only what is in the record; never invent results.
Reply ONLY as JSON (no code fences):
{"oneLine": one-sentence clinical summary, "problems": [{"problem": "", "status": "better" | "worse" | "stable" | "unclear", "note": ""}], "lastPlan": "", "medicines": [things to reconsider], "today": [what to check or do today], "overdue": [screening or follow-up that is due]}`;

export const PROBLEM_STATUS = ["better", "worse", "stable", "unclear"] as const;
export interface RecordSummary { oneLine: string; problems: { problem: string; status: (typeof PROBLEM_STATUS)[number]; note: string }[]; lastPlan: string; medicines: string[]; today: string[]; overdue: string[] }
export function recordSummary(raw: any): RecordSummary | null {
  const oneLine = line(raw?.oneLine, 300);
  if (!oneLine) return null;
  return {
    oneLine,
    problems: (Array.isArray(raw.problems) ? raw.problems : []).slice(0, 12).map((p: any) => ({ problem: line(p?.problem, 120), status: pick(p?.status, PROBLEM_STATUS, "unclear"), note: line(p?.note, 240) })).filter((p: { problem: string }) => p.problem),
    lastPlan: text(raw.lastPlan, 600), medicines: list(raw.medicines, 8, 240), today: list(raw.today, 8, 200), overdue: list(raw.overdue, 6, 200),
  };
}

/* ------------------------------------------------------------------ Ward rounds by voice */

export const ROUND_STATUS = ["stable", "watch", "sick"] as const;
export const ROUND_UPDATE_SYSTEM = `You are Cadus on a ward round in an Indian hospital. The doctor dictated their review of one patient at the bedside (a speech transcript; expect recognition errors in drug names and numbers and correct them only when the meaning is clear). You also get the patient's current entry on the ward list.
Update the ward list entry from what was said: the problems (keep what still applies, add new ones), current medicines (apply the changes said: started, stopped, dose changed), today's plan, new jobs (short tasks such as "Send CBC", "Call cardiology"), which existing jobs were said to be done, and the status (stable, watch or sick). Then write today's progress note in SOAP format, concise, as a resident would write it in the case sheet.
Never add a medicine, dose, result or finding that was not dictated or already on the list. If something said is unclear (a drug or dose you can't be sure of), keep it as said and add it to "unclear".
Reply ONLY as JSON (no code fences):
{"status": "stable" | "watch" | "sick", "diagnosis": the working diagnosis, "problems": updated problems as short lines, "meds": the updated medicines as lines, "plan": today's plan as lines, "newJobs": [short tasks], "doneJobs": [exact text of existing jobs said to be done], "note": the SOAP progress note in markdown, "unclear": [anything to confirm]}`;

export interface RoundUpdate { status: (typeof ROUND_STATUS)[number]; diagnosis: string; problems: string; meds: string; plan: string; newJobs: string[]; doneJobs: string[]; note: string; unclear: string[] }
const lines = (v: unknown, max: number) => (Array.isArray(v) ? v.map((x) => line(x, 300)).filter(Boolean).join("\n") : text(v, max)).slice(0, max);
export function roundUpdate(raw: any): RoundUpdate | null {
  if (!raw || typeof raw !== "object") return null;
  const note = text(raw.note, 4000);
  if (note.length < 20) return null;
  return {
    status: pick(raw.status, ROUND_STATUS, "stable"), diagnosis: line(raw.diagnosis, 200), problems: lines(raw.problems, 2000), meds: lines(raw.meds, 2000), plan: lines(raw.plan, 2000),
    newJobs: list(raw.newJobs, 12, 160), doneJobs: list(raw.doneJobs, 20, 200), note, unclear: list(raw.unclear, 8, 200),
  };
}

/* ------------------------------------------------------------------ Revision notes */

export const REV_STYLES = ["short", "table", "rapid"] as const;
export const REV_NOTE_SYSTEM = `You write high-yield revision notes for NEET-PG, INI-CET, FMGE and university exams in India, like the best toppers' notes: accurate, compact and organised for last-minute revision.
For the topic: the key facts examiners ask (definitions, classifications, criteria with numbers, investigations of choice and gold standards, drugs of choice and doses, Indian national programme points where relevant), the classic exam traps, and comparisons as tables. Describe in words the images examiners show (X-ray, CT, histology, clinical signs) under "Images to know". Mark the very highest-yield facts with "★". Never invent facts or numbers; follow current editions of standard textbooks and current guidelines.
Style: "short" = short notes with headings and bullets; "table" = mostly one-page comparison tables; "rapid" = a rapid-revision list of one-line facts.
Reply ONLY as JSON (no code fences):
{"title": "", "note": markdown, "cards": [{"front": question, "back": answer}] (8 to 12 flashcards from the most testable facts), "mcqs": [{"q": "", "options": [four], "answer": 0-3, "explain": ""}] (3 questions)}`;

export interface RevNote { title: string; note: string; cards: { front: string; back: string }[]; mcqs: { q: string; options: string[]; answer: number; explain: string }[] }
export function revNote(raw: any): RevNote | null {
  const note = text(raw?.note, 14000);
  if (note.length < 200) return null;
  return {
    title: line(raw.title, 120) || "Revision note", note,
    cards: (Array.isArray(raw.cards) ? raw.cards : []).slice(0, 15).map((c: any) => ({ front: line(c?.front, 300), back: text(c?.back, 600) })).filter((c: { front: string; back: string }) => c.front && c.back),
    mcqs: (Array.isArray(raw.mcqs) ? raw.mcqs : []).slice(0, 5).map((q: any) => ({ q: text(q?.q, 500), options: (Array.isArray(q?.options) ? q.options : []).slice(0, 4).map((o: unknown) => line(o, 200)), answer: Number(q?.answer), explain: text(q?.explain, 500) }))
      .filter((q: { q: string; options: string[]; answer: number }) => q.q && q.options.length === 4 && q.options.every(Boolean) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3),
  };
}

/* ------------------------------------------------------------------ Pre-operative assessment */

export const ASA = ["I", "II", "III", "IV", "V"] as const;
export const PREOP_SYSTEM = `You are Cadus, an anaesthesiologist in an Indian hospital doing a pre-anaesthetic check-up (PAC) for the planned surgery, from the notes given.
Give: the ASA physical status with the reason; the main perioperative risks (cardiac, pulmonary, airway, bleeding, aspiration, renal, glycaemic, frailty); which investigations are actually needed for this patient and surgery (avoid routine tests that won't change management); what to do with each current medicine before surgery (continue, stop and when, bridge, or the morning-of-surgery dose), following current guidance (ACC/AHA, ESC/ESAIC, ASRA for anticoagulants and neuraxial blocks, and Indian practice); fasting instructions; optimisation needed before surgery and whether to proceed, defer or refer; and the anaesthesia considerations. Use the RCRI score given if any. Never invent results.
Reply ONLY as JSON (no code fences):
{"asa": "I" | "II" | "III" | "IV" | "V", "asaWhy": "", "emergency": true | false, "risks": [""], "tests": [{"test": "", "why": ""}], "meds": [{"drug": "", "advice": ""}], "fasting": "", "optimise": [""], "decision": "proceed" | "proceed with precautions" | "defer and optimise" | "refer", "anaesthesia": [""], "summary": a short PAC note in markdown}`;

export const PREOP_DECISIONS = ["proceed", "proceed with precautions", "defer and optimise", "refer"] as const;
export interface Preop { asa: (typeof ASA)[number]; asaWhy: string; emergency: boolean; risks: string[]; tests: { test: string; why: string }[]; meds: { drug: string; advice: string }[]; fasting: string; optimise: string[]; decision: (typeof PREOP_DECISIONS)[number]; anaesthesia: string[]; summary: string }
export function preopResult(raw: any): Preop | null {
  if (!raw || typeof raw !== "object") return null;
  const summary = text(raw.summary, 4000);
  if (!summary) return null;
  return {
    asa: pick(String(raw.asa ?? "").replace(/^ASA\s*/i, "").replace(/E$/i, ""), ASA, "II"), asaWhy: line(raw.asaWhy, 300), emergency: raw.emergency === true,
    risks: list(raw.risks, 10, 240),
    tests: (Array.isArray(raw.tests) ? raw.tests : []).slice(0, 12).map((t: any) => ({ test: line(t?.test, 80), why: line(t?.why, 200) })).filter((t: { test: string }) => t.test),
    meds: (Array.isArray(raw.meds) ? raw.meds : []).slice(0, 20).map((m: any) => ({ drug: line(m?.drug, 80), advice: line(m?.advice, 260) })).filter((m: { drug: string; advice: string }) => m.drug && m.advice),
    fasting: line(raw.fasting, 300), optimise: list(raw.optimise, 8, 240), decision: pick(raw.decision, PREOP_DECISIONS, "proceed with precautions"), anaesthesia: list(raw.anaesthesia, 8, 240), summary,
  };
}

/* ------------------------------------------------------------------ Patient messages */

export const MESSAGE_PURPOSES = ["appointment", "reports", "follow-up", "fasting", "medicine", "vaccination", "procedure", "custom"] as const;
export const PATIENT_MESSAGE_SYSTEM = `You write short WhatsApp or SMS messages from an Indian doctor's clinic or hospital to a patient or their family. Warm, respectful and clear, in the language asked for in its own script (respectful forms such as "aap"), easy for someone who doesn't read well. Keep medicine names, times and numbers exactly as given; never add medical advice that wasn't given. Include the clinic's name and phone only if given. Under 700 characters, no emoji unless the doctor asked for a friendly tone.
Reply ONLY as JSON (no code fences): {"message": the message in the language asked, "english": the same message in English for the doctor to check}`;
export function patientMessage(raw: any): { message: string; english: string } | null {
  const message = text(raw?.message, 1200);
  if (message.length < 10) return null;
  return { message, english: text(raw?.english, 1200) };
}

/* ------------------------------------------------------------------ Drugs in pregnancy and breastfeeding */

export const PREG_SAFETY = ["safe", "caution", "avoid", "contraindicated", "unknown"] as const;
export const PREG_LACT_SYSTEM = `You are Cadus, a clinical pharmacologist advising a doctor in India about medicines in pregnancy (by trimester) and breastfeeding.
For each medicine give its safety for the situation asked, the reason in one or two lines (what is known in humans, the specific risk and when), what to do (continue, change the dose, monitor the baby or the pregnancy, stop), and a safer alternative where one exists, following current evidence (UKTIS/BUMPS, LactMed, FOGSI, RCOG, ACOG). Don't rely on the old FDA letter categories. Say clearly when the evidence is limited.
Reply ONLY as JSON (no code fences):
{"items": [{"drug": "", "safety": "safe" | "caution" | "avoid" | "contraindicated" | "unknown", "why": "", "action": "", "alternative": ""}], "general": one or two lines of overall advice}`;
export interface PregLact { items: { drug: string; safety: (typeof PREG_SAFETY)[number]; why: string; action: string; alternative: string }[]; general: string }
export function pregLact(raw: any): PregLact | null {
  const items = (Array.isArray(raw?.items) ? raw.items : []).slice(0, 20).map((i: any) => ({ drug: line(i?.drug, 100), safety: pick(i?.safety, PREG_SAFETY, "unknown"), why: line(i?.why, 400), action: line(i?.action, 300), alternative: line(i?.alternative, 200) })).filter((i: { drug: string }) => i.drug);
  if (!items.length) return null;
  return { items, general: text(raw.general, 500) };
}
