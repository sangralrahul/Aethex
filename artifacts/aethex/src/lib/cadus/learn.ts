/**
 * The Learn engine: a daily set, spaced repetition over mistakes (Leitner
 * boxes), timed mock tests with per-subject analytics, and a syllabus tracker
 * for NEET-PG, INI-CET and FMGE. Questions are written by Cadus (the practice
 * endpoint); everything here is scheduling, scoring and bookkeeping on this
 * device.
 */
import { SUBJECTS, type PracticeQuestion } from "./practice";

export const LEARN_KEY = "cadus3.learn";

/** Leitner boxes: how many days until a card is due again. */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30];

export interface Card {
  id: string;
  subject: string;
  q: PracticeQuestion;
  /** 0 = just missed, up to BOX_DAYS.length - 1 = known. */
  box: number;
  /** YYYY-MM-DD when it is next due. */
  due: string;
  reviews: number;
  lapses: number;
  createdAt: number;
}

export interface MockAnswer {
  subject: string;
  correct: boolean;
  /** Seconds spent. */
  secs: number;
  skipped?: boolean;
}

export interface MockResult {
  id: string;
  exam: string;
  at: number;
  questions: number;
  /** Seconds allowed and used. */
  allowedSecs: number;
  usedSecs: number;
  answers: MockAnswer[];
}

export interface LearnState {
  cards: Card[];
  mocks: MockResult[];
  /** Syllabus topics ticked, per exam, as "Subject › Topic". */
  done: Record<string, string[]>;
  /** The day of the last daily set and whether it was finished. */
  daily?: { day: string; finished: boolean; subjects: string[] };
}

export const EMPTY_LEARN: LearnState = { cards: [], mocks: [], done: {} };
const MAX_CARDS = 500;
const MAX_MOCKS = 50;

export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (day: string, n: number) => { const d = new Date(`${day}T00:00:00`); d.setDate(d.getDate() + n); return localDay(d); };
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function cleanLearn(raw: unknown): LearnState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const q = (v: any): PracticeQuestion | null => v && typeof v.question === "string" && Array.isArray(v.options) && v.options.length >= 2 && Number.isInteger(v.answer) && v.answer >= 0 && v.answer < v.options.length
    ? { question: String(v.question).slice(0, 1500), options: v.options.slice(0, 6).map((o: unknown) => String(o).slice(0, 300)), answer: v.answer, explanation: typeof v.explanation === "string" ? v.explanation.slice(0, 2000) : "", ...(typeof v.topic === "string" ? { topic: v.topic.slice(0, 80) } : {}) }
    : null;
  const cards = (Array.isArray(r.cards) ? r.cards : []).map((c: any) => {
    const qq = c && q(c.q);
    return qq && typeof c.id === "string" ? {
      id: c.id.slice(0, 40), subject: String(c.subject || "General").slice(0, 60), q: qq,
      box: Math.min(BOX_DAYS.length - 1, Math.max(0, Number(c.box) || 0)), due: /^\d{4}-\d{2}-\d{2}$/.test(c.due) ? c.due : localDay(),
      reviews: Math.max(0, Number(c.reviews) || 0), lapses: Math.max(0, Number(c.lapses) || 0), createdAt: Number(c.createdAt) || Date.now(),
    } : null;
  }).filter((c): c is Card => !!c).slice(0, MAX_CARDS);
  const mocks = (Array.isArray(r.mocks) ? r.mocks : []).map((m: any) => m && typeof m.id === "string" && Array.isArray(m.answers) ? {
    id: m.id.slice(0, 40), exam: String(m.exam || "NEET-PG").slice(0, 20), at: Number(m.at) || Date.now(), questions: Number(m.questions) || m.answers.length,
    allowedSecs: Number(m.allowedSecs) || 0, usedSecs: Number(m.usedSecs) || 0,
    answers: m.answers.filter((a: any) => a && typeof a.subject === "string").map((a: any) => ({ subject: a.subject.slice(0, 60), correct: a.correct === true, secs: Math.max(0, Number(a.secs) || 0), ...(a.skipped ? { skipped: true } : {}) })),
  } : null).filter((m): m is MockResult => !!m).slice(0, MAX_MOCKS);
  const done: Record<string, string[]> = {};
  if (r.done && typeof r.done === "object") for (const [k, v] of Object.entries(r.done as Record<string, unknown>)) if (Array.isArray(v)) done[k.slice(0, 20)] = v.filter((x): x is string => typeof x === "string").slice(0, 400);
  const daily = r.daily && typeof r.daily === "object" && /^\d{4}-\d{2}-\d{2}$/.test((r.daily as any).day) ? { day: (r.daily as any).day, finished: (r.daily as any).finished === true, subjects: Array.isArray((r.daily as any).subjects) ? (r.daily as any).subjects.slice(0, 6) : [] } : undefined;
  return { cards, mocks, done, ...(daily ? { daily } : {}) };
}

export function readLearn(): LearnState {
  try { return cleanLearn(JSON.parse(localStorage.getItem(LEARN_KEY) || "{}")); } catch { return { ...EMPTY_LEARN }; }
}
export function saveLearn(s: LearnState) {
  try { localStorage.setItem(LEARN_KEY, JSON.stringify(s)); } catch { /* full or blocked */ }
}

/* ------------------------------------------------------------------ spaced repetition */

/** A missed question becomes a card due tomorrow (or is reset if it already exists). */
export function addCard(s: LearnState, subject: string, q: PracticeQuestion, today = localDay()): LearnState {
  const key = q.question.trim().toLowerCase();
  const existing = s.cards.find((c) => c.q.question.trim().toLowerCase() === key);
  if (existing) return { ...s, cards: s.cards.map((c) => (c.id === existing.id ? { ...c, box: 0, due: addDays(today, 1), lapses: c.lapses + 1 } : c)) };
  const card: Card = { id: uid(), subject, q, box: 0, due: addDays(today, 1), reviews: 0, lapses: 0, createdAt: Date.now() };
  return { ...s, cards: [card, ...s.cards].slice(0, MAX_CARDS) };
}

/** Cards due today or earlier, hardest (lowest box) first. */
export function dueCards(s: LearnState, today = localDay(), max = 20): Card[] {
  return s.cards.filter((c) => c.due <= today).sort((a, b) => a.box - b.box || a.due.localeCompare(b.due)).slice(0, max);
}

/** After a review: a correct answer moves the card up a box; a wrong one sends it back to box 0. */
export function reviewCard(s: LearnState, id: string, correct: boolean, today = localDay()): LearnState {
  return {
    ...s,
    cards: s.cards.map((c) => {
      if (c.id !== id) return c;
      const box = correct ? Math.min(BOX_DAYS.length - 1, c.box + 1) : 0;
      return { ...c, box, due: addDays(today, BOX_DAYS[box]), reviews: c.reviews + 1, lapses: correct ? c.lapses : c.lapses + 1 };
    }),
  };
}

/** Cards in the top box after several reviews are known: they can be retired. */
export function retireKnown(s: LearnState): LearnState {
  return { ...s, cards: s.cards.filter((c) => !(c.box === BOX_DAYS.length - 1 && c.reviews >= 4)) };
}

export function cardStats(s: LearnState, today = localDay()): { total: number; due: number; learning: number; known: number } {
  return {
    total: s.cards.length,
    due: s.cards.filter((c) => c.due <= today).length,
    learning: s.cards.filter((c) => c.box < 3).length,
    known: s.cards.filter((c) => c.box >= 3).length,
  };
}

/* ------------------------------------------------------------------ daily set */

/** The subjects for today's set: the weakest two by accuracy plus one at random, deterministic for the day. */
export function dailySubjects(accuracy: (subject: string) => number | null, today = localDay(), n = 3): string[] {
  const seed = Number(today.replace(/-/g, "")) % 97;
  const ranked = [...SUBJECTS].sort((a, b) => (accuracy(a) ?? 101) - (accuracy(b) ?? 101));
  const weak = ranked.slice(0, Math.max(0, n - 1));
  const rest = SUBJECTS.filter((x) => !weak.includes(x));
  return [...weak, rest[seed % rest.length]].slice(0, n);
}

/* ------------------------------------------------------------------ mock tests */

export const MOCK_PRESETS: { id: string; label: string; questions: number; minutes: number; subjects: number }[] = [
  { id: "quick", label: "Quick 20", questions: 20, minutes: 20, subjects: 4 },
  { id: "half", label: "Half paper 50", questions: 50, minutes: 50, subjects: 8 },
  { id: "full", label: "Full mock 100", questions: 100, minutes: 100, subjects: 12 },
];

/** A spread of subjects for a mock, weighted the way the exams are (clinical subjects more). */
export function mockSubjects(n: number, seed = Date.now()): string[] {
  const weights: Record<string, number> = { Medicine: 3, Surgery: 3, "Obstetrics and Gynaecology": 2, Paediatrics: 2, Pharmacology: 2, Pathology: 2, "Community Medicine": 2, Microbiology: 1, Anatomy: 1, Physiology: 1, Biochemistry: 1, "Forensic Medicine": 1, ENT: 1, Ophthalmology: 1, Orthopaedics: 1, Dermatology: 1, Psychiatry: 1, Anaesthesia: 1, Radiology: 1 };
  const pool = SUBJECTS.flatMap((s) => Array(weights[s] ?? 1).fill(s) as string[]);
  const out: string[] = [];
  let x = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  while (out.length < n && out.length < SUBJECTS.length) {
    x = (x * 48271) % 2147483647;
    const s = pool[x % pool.length];
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

export function recordMock(s: LearnState, m: MockResult): LearnState {
  return { ...s, mocks: [m, ...s.mocks].slice(0, MAX_MOCKS) };
}

export interface MockAnalytics {
  score: number;
  total: number;
  pct: number;
  /** NEET-PG style: +4 for correct, -1 for wrong, 0 for skipped. */
  marks: number;
  maxMarks: number;
  avgSecs: number;
  bySubject: { subject: string; attempted: number; correct: number; pct: number; avgSecs: number }[];
  weakest: string[];
  slowest: string[];
}

export function analyseMock(m: MockResult): MockAnalytics {
  const bySubjectMap = new Map<string, { attempted: number; correct: number; secs: number }>();
  let score = 0, marks = 0, secs = 0;
  for (const a of m.answers) {
    const b = bySubjectMap.get(a.subject) ?? { attempted: 0, correct: 0, secs: 0 };
    if (!a.skipped) { b.attempted++; marks += a.correct ? 4 : -1; } else { marks += 0; }
    if (a.correct) { b.correct++; score++; }
    b.secs += a.secs; secs += a.secs;
    bySubjectMap.set(a.subject, b);
  }
  const bySubject = [...bySubjectMap.entries()].map(([subject, b]) => ({ subject, attempted: b.attempted, correct: b.correct, pct: b.attempted ? Math.round((100 * b.correct) / b.attempted) : 0, avgSecs: m.answers.filter((a) => a.subject === subject).length ? Math.round(b.secs / m.answers.filter((a) => a.subject === subject).length) : 0 })).sort((a, b) => a.pct - b.pct);
  return {
    score, total: m.questions, pct: m.questions ? Math.round((100 * score) / m.questions) : 0, marks, maxMarks: m.questions * 4,
    avgSecs: m.answers.length ? Math.round(secs / m.answers.length) : 0,
    bySubject, weakest: bySubject.filter((b) => b.attempted >= 2).slice(0, 3).map((b) => b.subject),
    slowest: [...bySubject].sort((a, b) => b.avgSecs - a.avgSecs).slice(0, 2).map((b) => b.subject),
  };
}

/** Scores over time for the trend line. */
export const mockTrend = (s: LearnState) => [...s.mocks].reverse().map((m) => ({ at: m.at, pct: analyseMock(m).pct, label: `${m.exam} · ${m.questions}` }));

/* ------------------------------------------------------------------ syllabus */

/** High-yield topics by subject, as the exams weight them (a working list, not the full syllabus). */
export const SYLLABUS: Record<string, string[]> = {
  Anatomy: ["Brachial plexus", "Cranial nerves", "Inguinal canal", "Embryology of heart", "Pharyngeal arches", "Lumbosacral plexus", "Blood supply of brain"],
  Physiology: ["Cardiac cycle", "Nephron and GFR", "Action potential", "Respiratory volumes", "Endocrine axes", "Acid–base", "Muscle contraction"],
  Biochemistry: ["Glycolysis and TCA", "Urea cycle", "Lipid metabolism", "Vitamins", "DNA replication and repair", "Enzyme kinetics", "Inborn errors"],
  Pathology: ["Cell injury and necrosis", "Inflammation", "Neoplasia", "Haemodynamics and shock", "Anaemias", "Leukaemias and lymphomas", "Amyloidosis"],
  Pharmacology: ["Autonomic drugs", "Antimicrobials", "Antihypertensives", "Antidiabetics", "Anticoagulants", "Antiepileptics", "Pharmacokinetics"],
  Microbiology: ["Gram-positive cocci", "Enterobacteriaceae", "Mycobacteria", "Hepatitis viruses", "HIV", "Fungi", "Parasites of India"],
  "Forensic Medicine": ["Post-mortem changes", "Injuries", "Asphyxia", "Poisons: OP, snake, aluminium phosphide", "Sexual offences", "Identification", "Medical law and ethics"],
  "Community Medicine": ["Epidemiology and biostatistics", "Screening", "National programmes", "Immunisation schedule", "Nutrition", "Occupational health", "Health indicators"],
  ENT: ["Otitis media and CSOM", "Hearing tests", "Nasal polyps and sinusitis", "Laryngeal cancer", "Tonsils and adenoids", "Facial nerve"],
  Ophthalmology: ["Cataract", "Glaucoma", "Diabetic retinopathy", "Uveitis", "Refractive errors", "Retinal detachment", "Ocular trauma"],
  Medicine: ["ACS and heart failure", "Diabetes and DKA", "TB and HIV", "Stroke", "CKD and AKI", "Pneumonia and sepsis", "Dengue, malaria, enteric fever", "Thyroid disorders"],
  Surgery: ["Breast cancer", "Thyroid swellings", "Hernias", "Acute abdomen", "Trauma and burns", "GI cancers", "Vascular surgery"],
  "Obstetrics and Gynaecology": ["Antenatal care", "Pre-eclampsia and eclampsia", "PPH", "Labour and partograph", "Contraception", "PCOS and infertility", "Gynaecological cancers"],
  Paediatrics: ["Neonatal resuscitation and jaundice", "Growth and milestones", "IMNCI and diarrhoea", "Malnutrition", "Congenital heart disease", "Immunisation", "Febrile seizures"],
  Orthopaedics: ["Fractures: classification and healing", "Osteomyelitis and TB spine", "Bone tumours", "Dislocations", "Paediatric orthopaedics", "Nerve injuries"],
  Dermatology: ["Psoriasis", "Leprosy", "Pemphigus and pemphigoid", "Fungal infections", "Drug reactions", "Acne", "STIs"],
  Psychiatry: ["Schizophrenia", "Depression and bipolar", "Anxiety disorders", "Substance use", "Delirium and dementia", "Child psychiatry"],
  Anaesthesia: ["Airway assessment", "Induction agents", "Muscle relaxants", "Regional anaesthesia", "Malignant hyperthermia", "Pre-operative assessment"],
  Radiology: ["Chest X-ray signs", "CT head in stroke", "Radiation safety", "Contrast reactions", "Common radiological signs", "Ultrasound in obstetrics"],
};

export const EXAMS = ["NEET-PG", "INI-CET", "FMGE"];

export function toggleTopic(s: LearnState, exam: string, subject: string, topic: string): LearnState {
  const key = `${subject} › ${topic}`;
  const list = s.done[exam] ?? [];
  return { ...s, done: { ...s.done, [exam]: list.includes(key) ? list.filter((x) => x !== key) : [...list, key] } };
}

export function syllabusProgress(s: LearnState, exam: string): { done: number; total: number; pct: number; bySubject: { subject: string; done: number; total: number }[] } {
  const list = new Set(s.done[exam] ?? []);
  const bySubject = SUBJECTS.map((subject) => ({ subject, total: SYLLABUS[subject]?.length ?? 0, done: (SYLLABUS[subject] ?? []).filter((t) => list.has(`${subject} › ${t}`)).length }));
  const total = bySubject.reduce((n, b) => n + b.total, 0);
  const done = bySubject.reduce((n, b) => n + b.done, 0);
  return { done, total, pct: total ? Math.round((100 * done) / total) : 0, bySubject };
}
