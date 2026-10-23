// Cadus update 20: Prescription Writer, lab report reading and trend explanation, the Daily Clinical
// Case, letters and certificates, the PvPI adverse drug reaction report, the MCCD cause-of-death
// helper, the Mnemonic Maker and brand-to-generic lookup. Prompts and output checks only (no
// network), tested on their own.
import { line, list, text } from "./labs.ts";

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

/* ------------------------------------------------------------------ Prescription Writer */

export const RX_FORMS = ["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Cream", "Ointment", "Drops", "Inhaler", "Sachet", "Patch", "Gel", "Lotion", "Nebulisation"] as const;
export const RX_ROUTES = ["Oral", "IV", "IM", "SC", "Topical", "Inhaled", "Sublingual", "Per rectum", "Per vaginum", "Eye drops", "Ear drops", "Nasal"] as const;

export const RX_WRITE_SYSTEM = `You are Cadus Prescription Writer, helping a registered medical practitioner in India draft a prescription for the patient described. The doctor reviews, edits and signs it: you draft, they prescribe.
Follow current Indian practice and guidelines (ICMR, the Standard Treatment Guidelines, NLEM 2022, IAP for children, FOGSI in pregnancy, and NICE or WHO where Indian guidance is silent). Write generic names (as the NMC requires), prefer NLEM medicines and simple once- or twice-daily regimens, and give the usual Indian strengths.
Adjust every dose for the age, weight, kidney and liver function, pregnancy or breastfeeding and allergies given; for children, calculate the dose from the weight and give the result (for example "5 mL (250 mg)"). Check against the current medicines given and avoid or manage interactions. Do not give antibiotics for an illness that is usually viral; say so in the notes instead. Never include Schedule X medicines.
If information needed to dose safely is missing (a child's weight, kidney function for a renally cleared drug, pregnancy status in a woman of childbearing age), still draft with the usual dose and list what is missing under "check".
Reply ONLY as JSON (no code fences):
{"diagnosis": the working diagnosis, "items": [{"generic": generic name, "strength": e.g. "500 mg", "form": one of ${RX_FORMS.join(", ")}, "dose": e.g. "1 tablet" or "5 mL (250 mg)", "route": one of ${RX_ROUTES.join(", ")}, "frequency": e.g. "Twice daily", "duration": e.g. "5 days", "instructions": e.g. "After food", "why": a few words}], "advice": non-drug advice for the patient in English as short lines, "adviceLocal": the same advice in the patient's language in its own script, or "" when that language is English, "followUp": when to review, "tests": investigations to order, "redFlags": warning signs for the patient to return at once, "check": what the doctor must confirm before signing, "notes": one or two lines of reasoning for the doctor}`;

export interface RxDraftItem { generic: string; strength: string; form: string; dose: string; route: string; frequency: string; duration: string; instructions: string; why: string }
export interface RxDraft { diagnosis: string; items: RxDraftItem[]; advice: string; adviceLocal: string; followUp: string; tests: string[]; redFlags: string[]; check: string[]; notes: string }
export function rxDraft(raw: any): RxDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 15).map((i: any) => ({
    generic: line(i?.generic ?? i?.name, 80), strength: line(i?.strength, 40),
    form: pick(i?.form, RX_FORMS, "Tablet"), dose: line(i?.dose, 60) || "1",
    route: pick(i?.route, RX_ROUTES, "Oral"), frequency: line(i?.frequency, 50) || "Once daily",
    duration: line(i?.duration, 50), instructions: line(i?.instructions, 160), why: line(i?.why, 120),
  })).filter((i: RxDraftItem) => i.generic.length > 1);
  const advice = text(raw.advice, 1500);
  if (!items.length && !advice) return null;
  return {
    diagnosis: line(raw.diagnosis, 200), items, advice, adviceLocal: text(raw.adviceLocal, 2500), followUp: line(raw.followUp, 160),
    tests: list(raw.tests, 10, 160), redFlags: list(raw.redFlags, 8, 200), check: list(raw.check, 10, 240), notes: text(raw.notes, 600),
  };
}
export function rxPrompt(b: Record<string, unknown>): string {
  const f = (k: string, n = 200) => line(b[k], n);
  return [
    `DIAGNOSIS OR PROBLEM: ${f("diagnosis", 300)}`,
    `PATIENT: ${[f("age", 20) && `${f("age", 20)} years`, f("sex", 10), f("weight", 10) && `${f("weight", 10)} kg`].filter(Boolean).join(", ") || "age, sex and weight not given"}`,
    f("renal") && `KIDNEY FUNCTION: ${f("renal")}`,
    f("hepatic") && `LIVER: ${f("hepatic")}`,
    f("pregnancy") && `PREGNANCY OR BREASTFEEDING: ${f("pregnancy")}`,
    `ALLERGIES: ${f("allergies") || "none known"}`,
    f("current", 600) && `CURRENT MEDICINES: ${f("current", 600)}`,
    f("setting", 40) && `SETTING: ${f("setting", 40)}`,
    `PATIENT'S LANGUAGE: ${f("language", 30) || "English"}`,
    f("notes", 1200) && `DOCTOR'S NOTES: ${f("notes", 1200)}`,
  ].filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ Lab reports and trends */

export const LAB_EXTRACT_SYSTEM = `You read photographs or PDFs of Indian laboratory reports and copy out the results exactly as printed, for charting over time.
For each result give the report date (as printed, e.g. "12/10/2026"; if several reports, each its own date), the test name in its usual short form (Hb, TLC, Platelets, PCV, Na, K, Urea, Creatinine, SGOT, SGPT, ALP, Bilirubin, Albumin, CRP, HbA1c, FBS, PPBS, RBS, TSH, INR, ESR, Calcium, Uric acid, Total cholesterol, LDL, HDL, Triglycerides, eGFR and so on), the value as a number exactly as printed (no rounding; "<" or ">" kept) and the unit as printed.
Never copy the patient's name, ID, phone number, address or the laboratory's or doctor's names. Do not interpret. If something is unreadable, leave it out.
Reply ONLY as JSON (no code fences): {"rows": [{"date": "...", "test": "...", "value": "...", "unit": "..."}]}`;

export interface LabRow { date: string; test: string; value: string; unit: string }
export function labRows(raw: any): LabRow[] {
  return (Array.isArray(raw?.rows) ? raw.rows : []).slice(0, 400).map((r: any) => ({
    date: line(r?.date, 30), test: line(r?.test, 40), value: line(r?.value, 20).replace(/[^\d.,<>\-]/g, ""), unit: line(r?.unit, 20),
  })).filter((r: LabRow) => r.test && /\d/.test(r.value));
}

export const LAB_TREND_SYSTEM = `You are Cadus, a consultant physician in India explaining a patient's serial laboratory results to a doctor. You get a table of results over time with the usual adult ranges, and sometimes the clinical context.
For each test that matters, say which way it is going and what that means; then what the results suggest together, what to check or do next, and anything that needs action today. Be specific (numbers and rates of change), practical and brief; do not repeat the table. Remember ranges differ by laboratory, age, sex and pregnancy.
Reply ONLY as JSON (no code fences):
{"summary": two sentences, "items": [{"test": name, "trend": "better" | "worse" | "stable" | "new" | "mixed", "meaning": one or two sentences}], "together": what the pattern suggests, "next": [things to check or do], "urgent": [anything needing action today; empty if none]}`;

export const LAB_TRENDS = ["better", "worse", "stable", "new", "mixed"] as const;
export interface LabExplain { summary: string; items: { test: string; trend: (typeof LAB_TRENDS)[number]; meaning: string }[]; together: string; next: string[]; urgent: string[] }
export function labExplain(raw: any): LabExplain | null {
  if (!raw || typeof raw !== "object") return null;
  const summary = text(raw.summary, 600);
  const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 30).map((i: any) => ({ test: line(i?.test, 60), trend: pick(i?.trend, LAB_TRENDS, "stable"), meaning: text(i?.meaning, 400) })).filter((i: { test: string; meaning: string }) => i.test && i.meaning);
  if (!summary && !items.length) return null;
  return { summary, items, together: text(raw.together, 800), next: list(raw.next, 8, 240), urgent: list(raw.urgent, 6, 240) };
}

/* ------------------------------------------------------------------ Daily Clinical Case */

export const DAILY_LEVELS = ["mbbs", "intern", "pg"] as const;
export const DAILY_CASE_SYSTEM = `You write the Cadus Daily Clinical Case: one realistic case from Indian practice for a medical student, intern or resident, with five single-best-answer questions that walk through it (diagnosis, the key investigation, interpreting a result, management with doses, and a complication or follow-up).
The stem is a short case in markdown: presentation, examination with vitals, and investigation results (a small table where useful). Describe any ECG, X-ray, CT, smear or skin finding in words as a radiologist or pathologist would report it. Use Indian settings, drugs and guidelines, and conditions common in India as well as classic exam cases. Be accurate; never invent guideline numbers.
Each question has exactly four options and exactly one unambiguously correct answer; spread the answers across the four positions. The explanation says why the answer is right and why the strongest wrong option is wrong.
Reply ONLY as JSON (no code fences):
{"title": short title without the diagnosis, "specialty": specialty, "stem": markdown, "questions": [{"q": question, "options": [four options], "answer": 0-3, "explain": two or three sentences}], "pearl": one high-yield take-home line}`;

export interface DailyCase { title: string; specialty: string; stem: string; questions: { q: string; options: string[]; answer: number; explain: string }[]; pearl: string }
export function dailyCase(raw: any): DailyCase | null {
  if (!raw || typeof raw !== "object") return null;
  const questions = (Array.isArray(raw.questions) ? raw.questions : []).slice(0, 6).map((q: any) => {
    const options = (Array.isArray(q?.options) ? q.options : []).slice(0, 4).map((o: unknown) => line(o, 200).replace(/^[A-D][).:]\s+/, ""));
    const answer = Number(q?.answer);
    return { q: text(q?.q, 600), options, answer, explain: text(q?.explain, 800) };
  }).filter((q: { q: string; options: string[]; answer: number }) => q.q && q.options.length === 4 && q.options.every(Boolean) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3);
  const stem = text(raw.stem, 5000);
  if (questions.length < 3 || stem.length < 60) return null;
  return { title: line(raw.title, 100) || "Today's case", specialty: line(raw.specialty, 60), stem, questions, pearl: line(raw.pearl, 300) };
}

/* ------------------------------------------------------------------ Letters and certificates */

export const LETTER_KINDS = ["referral", "fitness", "leave", "insurance", "other"] as const;
export type LetterKind = (typeof LETTER_KINDS)[number];
const LETTER_TASKS: Record<LetterKind, string> = {
  referral: "A REFERRAL LETTER to the colleague or centre named: the reason for referral and how urgent it is, a concise clinical summary (presentation, findings, key results), treatment given so far and the response, current medicines and allergies, and what exactly you are asking them to do. Courteous and specific.",
  fitness: "A MEDICAL FITNESS CERTIFICATE for the purpose given (employment, sport, travel, joining duty and so on): that the person was examined on the date given, the relevant findings, and the opinion (fit, fit with restrictions, or unfit, with the restrictions) ONLY as the notes support it. If the notes do not support an opinion, leave the opinion as a placeholder.",
  leave: "A MEDICAL CERTIFICATE FOR LEAVE (sickness certificate): that the person was examined and is suffering from the condition, the period of rest advised (dates as given) and, if given, the date they may resume duty or school. Brief and formal, in the usual Indian format.",
  insurance: "A PRE-AUTHORISATION CLINICAL JUSTIFICATION for health insurance (TPA) or a government scheme such as PM-JAY or a state scheme: diagnosis with the ICD-10 code, presenting complaints and their duration, relevant findings and investigation results supporting the diagnosis, the proposed line of treatment (medical management, surgery or procedure) and why it is needed now, why it needs admission, and the expected length of stay. Never invent package codes, costs, policy numbers or results: leave placeholders.",
  other: "The LETTER the doctor describes, in a formal and courteous Indian clinical style.",
};
export function letterSystem(kind: LetterKind): string {
  return `You are Cadus, writing a clinical letter or certificate for a registered medical practitioner in India to check, sign and stamp.
Write it ONLY from the notes given; never invent findings, results, dates, registration numbers or names. Where something needed is missing, put a placeholder in square brackets such as [Registration No.], [Date of examination] or [Hospital name], and list it under "missing". Refer to the patient as given (initials, age and sex); never add a name. Use the doctor's name and qualifications only if given. Plain, formal English, ready to print on the letterhead; markdown with no code fences.
${LETTER_TASKS[kind]}
Reply ONLY as JSON (no code fences): {"title": the document's title, "body": the letter in markdown, from the salutation or certificate heading to the signature block, "missing": [placeholders to fill]}`;
}
export interface Letter { title: string; body: string; missing: string[] }
export function letterResult(raw: any): Letter | null {
  const body = text(raw?.body, 8000);
  if (body.length < 60) return null;
  return { title: line(raw?.title, 120) || "Letter", body, missing: list(raw?.missing, 12, 120) };
}

/* ------------------------------------------------------------------ Adverse drug reaction (PvPI) */

export const ADR_SERIOUS = ["death", "life-threatening", "hospitalisation", "disability", "congenital anomaly", "other medically important", "not serious"] as const;
export const ADR_OUTCOMES = ["recovered", "recovering", "not recovered", "fatal", "recovered with sequelae", "unknown"] as const;
export const ADR_CAUSALITY = ["certain", "probable", "possible", "unlikely", "conditional", "unassessable"] as const;
export const ADR_CHALLENGE = ["yes", "no", "unknown", "not applicable"] as const;
export const ADR_SYSTEM = `You are Cadus, helping a doctor, pharmacist or nurse in India fill in the Pharmacovigilance Programme of India (PvPI) Suspected Adverse Drug Reaction Reporting Form from their notes.
Fill each field ONLY from the notes; leave a field empty and list it under "missing" when the notes do not say. Patient by initials, age and sex only. Assess causality by the WHO-UMC system and explain it in one or two sentences (timing, dechallenge, rechallenge, other causes). Suggest how to manage the reaction now in one or two lines.
Reply ONLY as JSON (no code fences):
{"patient": {"initials": "", "age": "", "sex": "", "weight": ""}, "reaction": {"description": what happened, "onset": date or time after the drug, "stopped": date or ""}, "suspects": [{"drug": generic and brand if given, "dose": "", "route": "", "frequency": "", "started": "", "stopped": "", "indication": ""}], "concomitant": [other medicines], "dechallenge": "yes" (improved on stopping) | "no" | "unknown" | "not applicable", "rechallenge": "yes" (recurred on restarting) | "no" | "unknown" | "not applicable", "seriousness": one of ${ADR_SERIOUS.map((s) => `"${s}"`).join(", ")}, "outcome": one of ${ADR_OUTCOMES.map((s) => `"${s}"`).join(", ")}, "causality": {"category": one of ${ADR_CAUSALITY.map((s) => `"${s}"`).join(", ")}, "reason": ""}, "relevant": relevant history and investigations, "management": "", "missing": [fields to complete]}`;

export interface AdrReport {
  patient: { initials: string; age: string; sex: string; weight: string };
  reaction: { description: string; onset: string; stopped: string };
  suspects: { drug: string; dose: string; route: string; frequency: string; started: string; stopped: string; indication: string }[];
  concomitant: string[];
  dechallenge: (typeof ADR_CHALLENGE)[number]; rechallenge: (typeof ADR_CHALLENGE)[number];
  seriousness: (typeof ADR_SERIOUS)[number]; outcome: (typeof ADR_OUTCOMES)[number];
  causality: { category: (typeof ADR_CAUSALITY)[number]; reason: string };
  relevant: string; management: string; missing: string[];
}
export function adrReport(raw: any): AdrReport | null {
  if (!raw || typeof raw !== "object") return null;
  const description = text(raw?.reaction?.description, 1200);
  const suspects = (Array.isArray(raw.suspects) ? raw.suspects : []).slice(0, 6).map((s: any) => ({
    drug: line(s?.drug, 100), dose: line(s?.dose, 40), route: line(s?.route, 30), frequency: line(s?.frequency, 40), started: line(s?.started, 40), stopped: line(s?.stopped, 40), indication: line(s?.indication, 120),
  })).filter((s: { drug: string }) => s.drug);
  if (!description || !suspects.length) return null;
  const p = raw.patient ?? {};
  return {
    patient: { initials: line(p.initials, 10).replace(/[a-z]{3,}/gi, (w: string) => w[0].toUpperCase() + "."), age: line(p.age, 20), sex: line(p.sex, 10), weight: line(p.weight, 15) },
    reaction: { description, onset: line(raw.reaction?.onset, 80), stopped: line(raw.reaction?.stopped, 60) },
    suspects, concomitant: list(raw.concomitant, 12, 100),
    dechallenge: pick(raw.dechallenge, ADR_CHALLENGE, "unknown"), rechallenge: pick(raw.rechallenge, ADR_CHALLENGE, "unknown"),
    seriousness: pick(raw.seriousness, ADR_SERIOUS, "not serious"), outcome: pick(raw.outcome, ADR_OUTCOMES, "unknown"),
    causality: { category: pick(raw.causality?.category, ADR_CAUSALITY, "unassessable"), reason: text(raw.causality?.reason, 500) },
    relevant: text(raw.relevant, 800), management: text(raw.management, 500), missing: list(raw.missing, 12, 120),
  };
}

/* ------------------------------------------------------------------ Cause of death (MCCD) */

export const MCCD_MANNERS = ["natural", "accident", "suicide", "homicide", "pending investigation"] as const;
export const MCCD_SYSTEM = `You are Cadus, helping a doctor in India write the cause of death correctly on the Medical Certificate of Cause of Death (MCCD, Form 4 for institutional deaths, Form 4A for others), following the WHO international form and ICD-10 rules.
From the case summary, write Part I as a causal sequence: (a) the immediate cause, due to (b), due to (c), due to (d), with the UNDERLYING cause (the disease or injury that started the train of events) on the lowest line used, and the approximate interval between onset and death for each line. Part II lists other significant conditions that contributed but are not in the sequence. Give the ICD-10 code of the underlying cause.
Never write a mode of dying (cardiac arrest, cardiorespiratory arrest, respiratory failure, asystole, shock, old age) as a cause on its own; if the notes give only that, explain why it can't stand and what is needed. Avoid abbreviations. If the death may be due to injury, poisoning, an unclear cause, or is otherwise medico-legal, say clearly that it must be reported to the police and that the doctor should not certify until that is done.
Reply ONLY as JSON (no code fences):
{"partI": [{"line": "a" | "b" | "c" | "d", "cause": "", "interval": ""}], "partII": [{"cause": "", "interval": ""}], "underlying": "", "icd10": "", "manner": one of ${MCCD_MANNERS.map((m) => `"${m}"`).join(", ")}, "medicolegal": true | false, "warnings": [problems to fix or check], "explanation": two or three sentences on why the sequence is written this way}`;

export interface Mccd { partI: { line: string; cause: string; interval: string }[]; partII: { cause: string; interval: string }[]; underlying: string; icd10: string; manner: (typeof MCCD_MANNERS)[number]; medicolegal: boolean; warnings: string[]; explanation: string }
export function mccdResult(raw: any): Mccd | null {
  if (!raw || typeof raw !== "object") return null;
  const lines = ["a", "b", "c", "d"];
  const partI = (Array.isArray(raw.partI) ? raw.partI : []).slice(0, 4).map((x: any, i: number) => ({ line: lines[i], cause: line(x?.cause, 160), interval: line(x?.interval, 40) })).filter((x: { cause: string }) => x.cause);
  if (!partI.length) return null;
  const icd = line(raw.icd10, 12).toUpperCase();
  return {
    partI, partII: (Array.isArray(raw.partII) ? raw.partII : []).slice(0, 4).map((x: any) => ({ cause: line(x?.cause, 160), interval: line(x?.interval, 40) })).filter((x: { cause: string }) => x.cause),
    underlying: line(raw.underlying, 160) || partI[partI.length - 1].cause, icd10: /^[A-Z]\d{2}(\.\d{1,2})?$/.test(icd) ? icd : "",
    manner: pick(raw.manner, MCCD_MANNERS, "natural"), medicolegal: raw.medicolegal === true || raw.manner === "pending investigation",
    warnings: list(raw.warnings, 8, 240), explanation: text(raw.explanation, 700),
  };
}

/* ------------------------------------------------------------------ Mnemonic Maker */

export const MNEMONIC_SYSTEM = `You are Cadus Mnemonic Maker, helping Indian medical students and doctors remember lists for NEET-PG, INI-CET, FMGE and university exams.
For the topic or list given, give up to three mnemonics. Use a well-known standard mnemonic when one exists (mark it "classic"); otherwise make a new one that is memorable, clean, easy to say (Indian English or Hinglish words are welcome) and mark it "new". Every letter or word must map to a correct item; never bend a fact to fit a mnemonic, and never leave out an important item without saying so. Then a short vivid memory story or image tying it together, and the high-yield facts about the topic that examiners ask.
Reply ONLY as JSON (no code fences):
{"topic": "", "mnemonics": [{"mnemonic": the word or phrase, "kind": "classic" | "new", "parts": [{"key": letter or word, "stands": what it stands for}], "note": what it covers or leaves out}], "story": "", "facts": [high-yield facts]}`;

export interface Mnemonics { topic: string; mnemonics: { mnemonic: string; kind: "classic" | "new"; parts: { key: string; stands: string }[]; note: string }[]; story: string; facts: string[] }
export function mnemonicsResult(raw: any): Mnemonics | null {
  const mnemonics = (Array.isArray(raw?.mnemonics) ? raw.mnemonics : []).slice(0, 3).map((m: any) => ({
    mnemonic: line(m?.mnemonic, 120), kind: m?.kind === "classic" ? "classic" as const : "new" as const,
    parts: (Array.isArray(m?.parts) ? m.parts : []).slice(0, 20).map((p: any) => ({ key: line(p?.key, 30), stands: line(p?.stands, 200) })).filter((p: { key: string; stands: string }) => p.key && p.stands),
    note: line(m?.note, 300),
  })).filter((m: { mnemonic: string; parts: unknown[] }) => m.mnemonic && m.parts.length >= 2);
  if (!mnemonics.length) return null;
  return { topic: line(raw.topic, 160), mnemonics, story: text(raw.story, 800), facts: list(raw.facts, 10, 260) };
}

/* ------------------------------------------------------------------ Brand to generic */

export const GENERIC_SYSTEM = `You identify Indian medicine brand names. For each brand given, give the generic composition (each salt with its strength, as in the usual Indian product) and whether you are sure. If a brand has several strengths or variants (e.g. "-D", "-M", "Forte", "Plus"), give the composition of the variant written. If you do not recognise a brand, say so (sure false, generic ""). Never guess a composition and mark it sure.
Reply ONLY as JSON (no code fences): {"items": [{"brand": as given, "generic": composition with strengths, "sure": true | false}]}`;
export interface GenericLookup { brand: string; generic: string; sure: boolean }
export function genericLookup(raw: any): GenericLookup[] {
  return (Array.isArray(raw?.items) ? raw.items : []).slice(0, 30).map((i: any) => ({ brand: line(i?.brand, 80), generic: line(i?.generic, 200), sure: i?.sure === true && !!line(i?.generic, 200) })).filter((i: GenericLookup) => i.brand);
}
