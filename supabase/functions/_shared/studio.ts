// Cadus update 11: the prompts and output checks for Consult Translator, Clinical Pathways,
// Flashcards and Compare over time. Pure functions (no network), tested on their own.
import { line, list, text } from "./labs.ts";

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

/* ------------------------------------------------------------------ Consult Translator */

export const TRANSLATE_LANGUAGES = ["Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Urdu", "Assamese", "Nepali", "English"] as const;

export const TRANSLATE_SYSTEM = `You are Cadus Consult Translator, interpreting between a doctor and a patient in an Indian clinic or hospital, like a careful professional medical interpreter.
You get who is speaking, the patient's language and what was said. Translate it faithfully: same meaning, same certainty, nothing added or left out, no advice of your own.
- DOCTOR → PATIENT: translate into the patient's language in its own script, in plain, polite, everyday words a patient understands (spoken style, respectful "aap" forms where the language has them). Keep medicine names, doses and numbers exactly; explain a medical word in brackets the first time if the patient may not know it.
- PATIENT → DOCTOR: translate into clear clinical English, keeping the patient's own description (onset, character, severity, words for pain) and any uncertainty; mark words you could not understand as [unclear: …].
Reply ONLY as JSON (no code fences):
{"translation": the translation,
 "back": a literal translation back into the speaker's language (English for the doctor) so the speaker can check it, short,
 "terms": [{"term": a medical or local term from the message, "plain": what it means, one line}] (0 to 4, only if useful),
 "flag": "" or one line for the doctor if the patient's words suggest a red flag (for example chest pain, suicidal thoughts, bleeding in pregnancy) or a likely misunderstanding}`;

export interface TranslateTurn { translation: string; back: string; terms: { term: string; plain: string }[]; flag: string }
export function translateTurn(raw: any): TranslateTurn | null {
  if (!raw || typeof raw !== "object") return null;
  const translation = text(raw.translation, 4000);
  if (!translation) return null;
  return {
    translation,
    back: text(raw.back, 4000),
    terms: (Array.isArray(raw.terms) ? raw.terms : []).slice(0, 4).map((t: any) => ({ term: line(t?.term, 60), plain: line(t?.plain, 200) })).filter((t: { term: string; plain: string }) => t.term && t.plain),
    flag: line(raw.flag, 240),
  };
}

export const TRANSLATE_NOTE_SYSTEM = `You are Cadus. Write a concise clinical note in English from a translated doctor-patient consultation (the transcript gives each turn in English). Headings: Presenting complaint, History (as the patient described it), What was explained to the patient, Plan agreed, Patient's questions and concerns, and Interpreter notes (anything unclear or worth confirming). Do not invent findings, results or doses that were not said. Markdown only, no code fences.`;

/* ------------------------------------------------------------------ Clinical Pathways */

export const PATHWAY_SYSTEM = `You are Cadus Clinical Pathways: you guide a doctor in India through an evidence-based clinical pathway one step at a time, like a senior colleague at the bedside. Follow current guidelines (ICMR, MoHFW, NICE, AHA/ACC, ESC, WHO, Surviving Sepsis, ADA, IAP) and Indian resources and drugs.
You get the pathway, the patient context and the steps answered so far. Decide the single best next step.
Reply ONLY as JSON (no code fences):
{"kind": "question" (you need one piece of information to decide) | "action" (something to do now before going on) | "end" (the pathway reaches a disposition),
 "title": short heading for this step,
 "text": markdown: for a question, why it matters in one line; for an action, exactly what to do with drugs, doses, routes and timings; for the end, the summary of the decision,
 "options": for a question, 2 to 5 short answers the doctor can tap (mutually exclusive, include "Not known" when sensible); for an action, ["Done"] or a short list of outcomes; for the end, [],
 "redFlags": red flags relevant at this step (0 to 4 short lines),
 "disposition": only at the end: "Discharge" | "Observe" | "Admit ward" | "Admit ICU/HDU" | "Refer" | "Urgent intervention",
 "plan": only at the end: the plan as 3 to 8 short lines,
 "source": the main guideline this step follows, e.g. "ESC 2023 ACS"}
Rules: one question or action per step; never ask for something already answered; reach "end" within about 12 steps. If the answers show an emergency, say so at once as an action. You support, not replace, clinical judgement.`;

export const PATHWAY_KINDS = ["question", "action", "end"] as const;
export const DISPOSITIONS = ["Discharge", "Observe", "Admit ward", "Admit ICU/HDU", "Refer", "Urgent intervention"] as const;
export interface PathwayStep {
  kind: (typeof PATHWAY_KINDS)[number];
  title: string;
  text: string;
  options: string[];
  redFlags: string[];
  disposition: string;
  plan: string[];
  source: string;
}
export function pathwayStep(raw: any): PathwayStep | null {
  if (!raw || typeof raw !== "object") return null;
  const kind = pick(raw.kind, PATHWAY_KINDS, "question");
  const title = line(raw.title, 120);
  const body = text(raw.text, 3000);
  let options = list(raw.options, 5, 80);
  if (!title || !body) return null;
  if (kind === "question" && options.length < 2) return null;
  if (kind === "action" && !options.length) options = ["Done"];
  if (kind === "end") options = [];
  return {
    kind, title, text: body, options,
    redFlags: list(raw.redFlags, 4, 200),
    disposition: kind === "end" ? pick(raw.disposition, DISPOSITIONS, "Observe") : "",
    plan: kind === "end" ? list(raw.plan, 8, 240) : [],
    source: line(raw.source, 120),
  };
}
export interface PathwayAnswer { title: string; answer: string }
export function pathwayAnswers(raw: unknown): PathwayAnswer[] {
  return (Array.isArray(raw) ? raw : []).slice(0, 20).map((a: any) => ({ title: line(a?.title, 120), answer: line(a?.answer, 200) })).filter((a) => a.title && a.answer);
}

/* ------------------------------------------------------------------ Flashcards */

export const FLASHCARDS_SYSTEM = `You are Cadus, making exam-quality flashcards for a medical student or doctor in India (NEET-PG, INI-CET, university exams) from the material given.
Rules: one fact or concept per card; the front is a clear question or cloze ("___"), the back is the short answer (under 30 words) with the key number, drug or criterion; cover the most testable points first; no trivial cards; nothing that is not supported by the material or by standard textbooks; no patient identifiers.
Reply ONLY as JSON (no code fences): {"title": a short deck title, "cards": [{"front", "back", "tag": a one-word topic tag}]}`;

export interface Flashcard { front: string; back: string; tag: string }
export function flashcards(raw: any, max: number): { title: string; cards: Flashcard[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const seen = new Set<string>();
  const cards: Flashcard[] = (Array.isArray(raw.cards) ? raw.cards : [])
    .map((c: any) => ({ front: line(c?.front, 300), back: line(c?.back, 400), tag: line(c?.tag, 30).replace(/\s+/g, "-").toLowerCase() }))
    .filter((c: Flashcard) => c.front && c.back && !seen.has(c.front.toLowerCase()) && (seen.add(c.front.toLowerCase()), true))
    .slice(0, max);
  if (!cards.length) return null;
  return { title: line(raw.title, 80) || "Flashcards", cards };
}

/* ------------------------------------------------------------------ Compare over time */

export const COMPARE_KINDS = ["xray", "ecg", "ct", "usg", "lab", "skin", "other"] as const;
const KIND_LABEL: Record<string, string> = { xray: "X-ray", ecg: "ECG", ct: "CT or MRI", usg: "ultrasound", lab: "laboratory report", skin: "clinical photograph (skin or wound)", other: "medical image or report" };
export const compareKindLabel = (k: string) => KIND_LABEL[k] ?? KIND_LABEL.other;

export const COMPARE_SYSTEM = `You are Cadus Compare: you compare two of the same kind of medical study taken at different times (the EARLIER one first, then the LATER one) and say what changed, like a consultant reviewing serial studies.
Read each study systematically first, then compare like for like. Account for differences in technique (projection, rotation, inspiration, lead placement, lab reference ranges) before calling a change real.
Reply ONLY as JSON (no code fences):
{"overall": "better" | "worse" | "mixed" | "same" | "unclear",
 "summary": two or three sentences for the doctor,
 "changes": [{"finding": what, "before": as seen earlier, "after": as seen later, "trend": "better" | "worse" | "new" | "resolved" | "same"}] (the important ones, at most 10),
 "concerns": anything that needs action now (0 to 4 lines),
 "next": suggested next steps (0 to 4 lines),
 "limits": one line on what limits the comparison (image quality, different technique, missing parts), or ""}
Never invent values or findings you cannot see; if a study is unreadable say so and use "unclear".`;

export const TRENDS = ["better", "worse", "new", "resolved", "same"] as const;
export const OVERALL = ["better", "worse", "mixed", "same", "unclear"] as const;
export interface CompareResult {
  overall: (typeof OVERALL)[number];
  summary: string;
  changes: { finding: string; before: string; after: string; trend: (typeof TRENDS)[number] }[];
  concerns: string[];
  next: string[];
  limits: string;
}
export function compareResult(raw: any): CompareResult | null {
  if (!raw || typeof raw !== "object") return null;
  const summary = line(raw.summary, 800);
  if (!summary) return null;
  return {
    overall: pick(raw.overall, OVERALL, "unclear"),
    summary,
    changes: (Array.isArray(raw.changes) ? raw.changes : []).slice(0, 10).map((c: any) => ({ finding: line(c?.finding, 120), before: line(c?.before, 200), after: line(c?.after, 200), trend: pick(c?.trend, TRENDS, "same") })).filter((c: { finding: string }) => c.finding),
    concerns: list(raw.concerns, 4, 240),
    next: list(raw.next, 4, 240),
    limits: line(raw.limits, 240),
  };
}

/* ------------------------------------------------------------------ Medicine reconciliation */

export const MEDREC_SYSTEM = `You are Cadus Med Reconciliation, a clinical pharmacist in an Indian hospital reconciling a patient's medicines at a transition of care (admission, transfer or discharge).
You get the BEFORE list (what the patient was taking at home or before the transition) and the AFTER list (the new chart or discharge prescription), typed or as photos, and what is known about the patient. Brand names are common: map each to its generic and every component of a combination.
Match the same medicine across the lists even when written differently. For each medicine decide: continued (same), changed (dose, frequency, route or formulation), started (only AFTER), stopped (only BEFORE), or unclear (cannot tell).
Then check: stopped medicines with no reason that should probably continue (antiplatelets after a stent, antiepileptics, steroids, thyroxine, insulin), duplicates (including within combinations), interactions, doses wrong for the kidneys, liver, age or weight, allergies, and anything the condition needs that is missing.
Reply ONLY as JSON (no code fences):
{"summary": one or two sentences,
 "items": [{"generic": generic name and strength, "before": dose and frequency as written, or "", "after": dose and frequency, or "", "change": "continued" | "changed" | "started" | "stopped" | "unclear", "note": one line (what changed or why it matters), "status": "ok" | "check" | "problem"}],
 "issues": [{"severity": "high" | "moderate" | "low", "title": short, "detail": what and why, "action": what to do}],
 "patientSheet": markdown in the patient's language and script: "Your medicines now" as a table (medicine, what it is for in plain words, when to take it: morning / afternoon / night, with or after food), then "Stopped: do not take" as a list, then "Changed" as a list, then one line to bring all medicines to the next visit. Plain words, no jargon. Only medicines from the AFTER list go in "now".,
 "questions": things the doctor should confirm (0 to 5)}
Never invent a medicine, dose or reason. If an entry cannot be read, mark it unclear.`;

export const MEDREC_CHANGES = ["continued", "changed", "started", "stopped", "unclear"] as const;
export interface MedRecItem { generic: string; before: string; after: string; change: (typeof MEDREC_CHANGES)[number]; note: string; status: "ok" | "check" | "problem" }
export interface MedRecIssue { severity: "high" | "moderate" | "low"; title: string; detail: string; action: string }
export interface MedRec { summary: string; items: MedRecItem[]; issues: MedRecIssue[]; patientSheet: string; questions: string[] }
const SEV = { high: 0, moderate: 1, low: 2 } as const;
const CHANGE_ORDER = { stopped: 0, started: 1, changed: 2, unclear: 3, continued: 4 } as const;
export function medRec(raw: any): MedRec | null {
  if (!raw || typeof raw !== "object") return null;
  const items: MedRecItem[] = (Array.isArray(raw.items) ? raw.items : []).slice(0, 40).map((x: any) => ({
    generic: line(x?.generic, 160),
    before: line(x?.before, 120),
    after: line(x?.after, 120),
    change: pick(x?.change, MEDREC_CHANGES, "unclear"),
    note: line(x?.note, 240),
    status: pick(x?.status, ["ok", "check", "problem"] as const, "check"),
  })).filter((x: MedRecItem) => x.generic);
  if (!items.length) return null;
  // A medicine on only one list cannot be "continued".
  for (const it of items) {
    if (it.change === "continued" && it.before && !it.after) it.change = "stopped";
    if (it.change === "continued" && !it.before && it.after) it.change = "started";
  }
  items.sort((a, b) => CHANGE_ORDER[a.change] - CHANGE_ORDER[b.change]);
  const issues: MedRecIssue[] = (Array.isArray(raw.issues) ? raw.issues : []).slice(0, 15).map((i: any) => ({
    severity: pick(i?.severity, ["high", "moderate", "low"] as const, "moderate"),
    title: line(i?.title, 140), detail: line(i?.detail, 500), action: line(i?.action, 400),
  })).filter((i: MedRecIssue) => i.title);
  issues.sort((a, b) => SEV[a.severity] - SEV[b.severity]);
  return { summary: line(raw.summary, 400), items, issues, patientSheet: text(raw.patientSheet, 8000), questions: list(raw.questions, 5, 240) };
}

/* ------------------------------------------------------------------ Presentation Coach */

export const PRESENT_FORMATS: Record<string, { label: string; rubric: string }> = {
  rounds: { label: "Ward-round presentation", rubric: "Opening line (who, why admitted, day of admission); overnight events; current symptoms; vitals and examination; key results with trends; assessment by problem; plan by problem; concise and under 2 minutes" },
  long: { label: "Long case (university or PG exam)", rubric: "Identification and chief complaints with duration; history of presenting illness in order with negatives that matter; past, drug, family, personal and socio-economic history; general and systemic examination in order; summary; provisional diagnosis with justification; differentials with reasons for and against; investigations planned; management" },
  short: { label: "Short case (spot examination)", rubric: "Introduction and consent; inspection, palpation, percussion, auscultation in order; positive and relevant negative findings; a one-line summary; diagnosis with the anatomical and functional level; one or two differentials" },
  sbar: { label: "SBAR handover or referral call", rubric: "Situation in one line; background that matters; assessment with vitals and the main concern; a clear recommendation or request with urgency; closed loop (read-back, what to do if worse)" },
  opd: { label: "OPD case to a consultant", rubric: "Who and why in one line; key history; key examination; what you think it is; what you want to do or ask; under 60 seconds" },
};
export const PRESENT_SYSTEM = `You are Cadus Presentation Coach, a senior consultant in an Indian teaching hospital listening to a student or resident present a case. Be fair, specific and encouraging, and hold them to the standard of the format.
You get the format, its rubric, the learner's level and the presentation (it may be a speech-to-text transcript with filler words; judge the content and order, not the transcription).
Reply ONLY as JSON (no code fences):
{"score": 0 to 100,
 "rubric": [{"item": a rubric item, "score": 0 to 10, "note": one line}] (one per rubric item, in order),
 "strengths": what they did well (2 to 4),
 "improve": the most useful changes, most important first (2 to 5),
 "missing": important facts or negatives a consultant would ask about that were not said (0 to 6),
 "questions": 3 questions the consultant or examiner would now ask,
 "model": markdown: the same case presented well in this format, using only the facts given (write [not stated] where a key fact is missing; never invent findings)}`;
export interface Presentation { score: number; rubric: { item: string; score: number; note: string }[]; strengths: string[]; improve: string[]; missing: string[]; questions: string[]; model: string }
export function presentation(raw: any): Presentation | null {
  if (!raw || typeof raw !== "object") return null;
  const n = Number(raw.score);
  const model = text(raw.model, 8000);
  if (!Number.isFinite(n) || !model) return null;
  return {
    score: Math.max(0, Math.min(100, Math.round(n))),
    rubric: (Array.isArray(raw.rubric) ? raw.rubric : []).slice(0, 12).map((r: any) => ({ item: line(r?.item, 120), score: Math.max(0, Math.min(10, Math.round(Number(r?.score) || 0))), note: line(r?.note, 240) })).filter((r: { item: string }) => r.item),
    strengths: list(raw.strengths, 4, 240),
    improve: list(raw.improve, 5, 260),
    missing: list(raw.missing, 6, 200),
    questions: list(raw.questions, 3, 240),
    model,
  };
}
