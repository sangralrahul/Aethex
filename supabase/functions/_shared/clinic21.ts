// Cadus update 21: the Clinical Image Quiz, the On-call Helper and Journal Club appraisal. Prompts
// and output checks only (no network), tested on their own.
import { line, list, text } from "./labs.ts";

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

/* ------------------------------------------------------------------ Clinical Image Quiz */

export const IMAGE_QUIZ_SYSTEM = `You are Cadus, turning a doctor's or teacher's own clinical images (X-rays, CT or MRI slices, ECGs, clinical photographs, smears, specimens, fundus or skin photos) into exam-style teaching questions for medical students, interns and residents in India.
Look carefully at each image, in the order given (image 1, image 2 …). For each, write the number of questions asked, single-best-answer with exactly four options and one unambiguously correct answer: spot the finding, name the diagnosis, the next step, or a classic association. Base every question on what is actually visible plus the teacher's hint if given; never invent a finding that isn't there. If an image is unclear or you are unsure what it shows, say so in "unsure" and write fewer questions for it rather than guessing.
Each explanation describes exactly where to look on the image and why the answer is right. Spread correct answers across positions.
If you can see any patient identifier on an image (a name, hospital number, date of birth, face that identifies someone), list the image numbers in "identifiers" so the teacher can crop them before sharing.
Reply ONLY as JSON (no code fences):
{"title": short title, "questions": [{"image": image number from 1, "q": question, "options": [four options], "answer": 0-3, "explain": two or three sentences}], "unsure": [image numbers], "identifiers": [image numbers]}`;

export interface ImageQuiz { title: string; questions: { image: number; q: string; options: string[]; answer: number; explain: string }[]; unsure: number[]; identifiers: number[] }
export function imageQuiz(raw: any, images: number): ImageQuiz | null {
  if (!raw || typeof raw !== "object") return null;
  const nums = (v: unknown) => (Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= images).slice(0, images);
  const questions = (Array.isArray(raw.questions) ? raw.questions : []).slice(0, 30).map((q: any) => ({
    image: Number(q?.image), q: text(q?.q, 500),
    options: (Array.isArray(q?.options) ? q.options : []).slice(0, 4).map((o: unknown) => line(o, 200).replace(/^[A-D][).:]\s+/, "")),
    answer: Number(q?.answer), explain: text(q?.explain, 700),
  })).filter((q: { image: number; q: string; options: string[]; answer: number }) => Number.isInteger(q.image) && q.image >= 1 && q.image <= images && q.q && q.options.length === 4 && q.options.every(Boolean) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3);
  if (!questions.length) return null;
  return { title: line(raw.title, 100) || "Image quiz", questions, unsure: nums(raw.unsure), identifiers: nums(raw.identifiers) };
}

/* ------------------------------------------------------------------ On-call Helper */

export const ONCALL_CALLS = ["Fever", "Low blood pressure", "Chest pain", "Low oxygen / breathless", "Low urine output", "Agitation / confusion", "High or low blood sugar", "Fall", "Seizure", "High blood pressure", "Fast heart rate", "Bleeding", "Abnormal potassium", "Pain not controlled", "Other"] as const;
export const ONCALL_URGENCY = ["now", "soon", "can wait"] as const;
export const ONCALL_SYSTEM = `You are Cadus On-call Helper, a calm senior resident advising a junior doctor in an Indian hospital who has just been called by a nurse about a ward patient, usually at night.
Give a practical plan for the first minutes: whether to see the patient now (the default for anything that could be serious), within 30 minutes, or whether it can safely wait, and why; the questions to ask the nurse on the phone; what to check when you get there; immediate orders with doses (Indian drugs and usual adult doses; adjust for the age, kidney function and allergies given); the dangerous causes not to miss; and when to call the senior, ICU or rapid response. Follow current guidelines (Surviving Sepsis, NICE, ADA, AHA and Indian guidance).
Be short: this is read on a phone in the middle of the night. Never give false reassurance: if it could be serious, say see now.
Reply ONLY as JSON (no code fences):
{"urgency": "now" | "soon" | "can wait", "why": one sentence, "askNurse": [questions], "check": [what to examine or look at], "orders": [immediate orders with doses], "dontMiss": [dangerous causes], "escalate": [when to call senior or ICU], "note": a short note for the case sheet}`;

export interface OncallPlan { urgency: (typeof ONCALL_URGENCY)[number]; why: string; askNurse: string[]; check: string[]; orders: string[]; dontMiss: string[]; escalate: string[]; note: string }
export function oncallPlan(raw: any): OncallPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const orders = list(raw.orders, 10, 240), check = list(raw.check, 10, 200);
  if (!orders.length && !check.length) return null;
  return { urgency: pick(raw.urgency, ONCALL_URGENCY, "now"), why: line(raw.why, 300), askNurse: list(raw.askNurse, 8, 200), check, orders, dontMiss: list(raw.dontMiss, 8, 200), escalate: list(raw.escalate, 6, 200), note: text(raw.note, 1200) };
}

/* ------------------------------------------------------------------ Journal Club */

export const APPRAISE_DESIGNS = ["RCT", "Cohort", "Case-control", "Cross-sectional", "Systematic review / meta-analysis", "Diagnostic accuracy", "Qualitative", "Other"] as const;
export const APPRAISE_ANSWERS = ["yes", "no", "unclear"] as const;
export const APPRAISE_SYSTEM = `You are Cadus Journal Club, a clinical epidemiologist helping a resident in India appraise a research paper and present it at journal club.
From the paper given (full text, PDF or abstract), identify the design and appraise it with the matching CASP checklist questions (RCT, cohort, case-control, systematic review, diagnostic study, qualitative) or the closest equivalent; answer each "yes", "no" or "unclear" with a short reason from the paper. Report the key results with the actual numbers (effect sizes, confidence intervals, p values, NNT where you can compute it from the reported figures). Name the main biases and limitations, and say how far the results apply to Indian patients and practice. Never invent numbers that aren't in the paper; if only an abstract is given, say what can't be judged.
Also give five questions to discuss at journal club, and a short slide outline.
Reply ONLY as JSON (no code fences):
{"citation": "authors, title, journal, year (as given)", "design": one of ${APPRAISE_DESIGNS.map((d) => `"${d}"`).join(", ")}, "pico": {"p": "", "i": "", "c": "", "o": ""}, "summary": two or three sentences, "results": [key results with numbers], "checklist": [{"q": "", "a": "yes" | "no" | "unclear", "note": ""}], "bias": [main biases and limitations], "applicability": "", "bottomLine": one or two sentences, "discuss": [five questions], "slides": [{"title": "", "points": [""]}]}`;

export interface Appraisal {
  citation: string; design: (typeof APPRAISE_DESIGNS)[number]; pico: { p: string; i: string; c: string; o: string };
  summary: string; results: string[]; checklist: { q: string; a: (typeof APPRAISE_ANSWERS)[number]; note: string }[];
  bias: string[]; applicability: string; bottomLine: string; discuss: string[]; slides: { title: string; points: string[] }[];
}
export function appraisal(raw: any): Appraisal | null {
  if (!raw || typeof raw !== "object") return null;
  const checklist = (Array.isArray(raw.checklist) ? raw.checklist : []).slice(0, 14).map((c: any) => ({ q: line(c?.q, 200), a: pick(c?.a, APPRAISE_ANSWERS, "unclear"), note: line(c?.note, 300) })).filter((c: { q: string }) => c.q);
  const summary = text(raw.summary, 800);
  if (!summary || checklist.length < 3) return null;
  const p = raw.pico ?? {};
  return {
    citation: line(raw.citation, 300), design: pick(raw.design, APPRAISE_DESIGNS, "Other"),
    pico: { p: line(p.p, 240), i: line(p.i, 240), c: line(p.c, 240), o: line(p.o, 240) },
    summary, results: list(raw.results, 10, 300), checklist, bias: list(raw.bias, 10, 260), applicability: text(raw.applicability, 600),
    bottomLine: text(raw.bottomLine, 400), discuss: list(raw.discuss, 6, 240),
    slides: (Array.isArray(raw.slides) ? raw.slides : []).slice(0, 12).map((s: any) => ({ title: line(s?.title, 100), points: list(s?.points, 6, 200) })).filter((s: { title: string }) => s.title),
  };
}
