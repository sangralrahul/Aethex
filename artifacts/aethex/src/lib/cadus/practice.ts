/**
 * Exam practice progress: accuracy by subject, the daily streak, questions to
 * revise and the questions already seen (so new sets don't repeat them).
 * Stored on this device only.
 */

export const PRACTICE_KEY = "cadus3.practice";

/** The 19 NEET-PG subjects. */
export const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Forensic Medicine",
  "Community Medicine", "ENT", "Ophthalmology", "Medicine", "Surgery", "Obstetrics and Gynaecology",
  "Paediatrics", "Orthopaedics", "Dermatology", "Psychiatry", "Anaesthesia", "Radiology",
];

export interface PracticeQuestion {
  question: string;
  options: string[];
  /** Index of the correct option (0 to 3). */
  answer: number;
  explanation: string;
  topic?: string;
}

export interface Mistake {
  id: string;
  subject: string;
  q: PracticeQuestion;
  /** The option the user picked. */
  chosen: number;
  at: number;
}

export interface SubjectStat {
  attempted: number;
  correct: number;
}

export interface PracticeState {
  stats: Record<string, SubjectStat>;
  /** Days with at least one answer, as YYYY-MM-DD in local time, oldest first. */
  days: string[];
  mistakes: Mistake[];
  /** Question stems already asked, per subject, newest last. */
  seen: Record<string, string[]>;
}

export const EMPTY_PRACTICE: PracticeState = { stats: {}, days: [], mistakes: [], seen: {} };

const MAX_MISTAKES = 100;
const MAX_SEEN = 60;
const MAX_DAYS = 400;

export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const isQuestion = (q: any): q is PracticeQuestion =>
  !!q && typeof q.question === "string" && Array.isArray(q.options) && q.options.length === 4 &&
  q.options.every((o: unknown) => typeof o === "string") && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3;

export function readPractice(): PracticeState {
  try {
    const raw = JSON.parse(localStorage.getItem(PRACTICE_KEY) || "null");
    if (!raw || typeof raw !== "object") return { ...EMPTY_PRACTICE };
    const stats: Record<string, SubjectStat> = {};
    for (const [k, v] of Object.entries(raw.stats ?? {})) {
      const s = v as SubjectStat;
      if (Number.isFinite(s?.attempted) && Number.isFinite(s?.correct)) stats[k] = { attempted: Math.max(0, s.attempted), correct: Math.max(0, Math.min(s.correct, s.attempted)) };
    }
    const days = Array.isArray(raw.days) ? raw.days.filter((d: unknown) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
    const mistakes = Array.isArray(raw.mistakes)
      ? raw.mistakes.filter((m: any) => m && typeof m.id === "string" && typeof m.subject === "string" && isQuestion(m.q))
      : [];
    const seen: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(raw.seen ?? {})) if (Array.isArray(v)) seen[k] = v.filter((x) => typeof x === "string");
    return { stats, days, mistakes, seen };
  } catch {
    return { ...EMPTY_PRACTICE };
  }
}

export function savePractice(s: PracticeState) {
  try {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify(s));
  } catch { /* storage full or blocked */ }
}

const stem = (q: PracticeQuestion) => q.question.replace(/\s+/g, " ").trim().slice(0, 160);

/** Record one answer. Returns the new state (the input is not changed). */
export function recordAnswer(s: PracticeState, subject: string, q: PracticeQuestion, chosen: number, day = localDay(), now = Date.now()): PracticeState {
  const right = chosen === q.answer;
  const prev = s.stats[subject] ?? { attempted: 0, correct: 0 };
  const stats = { ...s.stats, [subject]: { attempted: prev.attempted + 1, correct: prev.correct + (right ? 1 : 0) } };
  const days = s.days.includes(day) ? s.days : [...s.days, day].sort().slice(-MAX_DAYS);
  const key = stem(q);
  const others = s.mistakes.filter((m) => stem(m.q) !== key);
  const mistakes = right
    ? others
    : [{ id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, subject, q, chosen, at: now }, ...others].slice(0, MAX_MISTAKES);
  const seenList = (s.seen[subject] ?? []).filter((x) => x !== key);
  const seen = { ...s.seen, [subject]: [...seenList, key].slice(-MAX_SEEN) };
  return { stats, days, mistakes, seen };
}

/** Consecutive days of practice up to today (or up to yesterday, if not yet practised today). */
export function streak(days: string[], today = localDay()): number {
  const set = new Set(days);
  const step = (d: string, delta: number) => {
    const [y, m, dd] = d.split("-").map(Number);
    return localDay(new Date(y, m - 1, dd + delta));
  };
  let cur = set.has(today) ? today : step(today, -1);
  let n = 0;
  while (set.has(cur)) {
    n += 1;
    cur = step(cur, -1);
  }
  return n;
}

export function totals(s: PracticeState): SubjectStat {
  return Object.values(s.stats).reduce((a, b) => ({ attempted: a.attempted + b.attempted, correct: a.correct + b.correct }), { attempted: 0, correct: 0 });
}

/** Accuracy as a whole percentage, or null before any attempts. */
export function accuracy(st?: SubjectStat): number | null {
  return st && st.attempted > 0 ? Math.round((st.correct / st.attempted) * 100) : null;
}

/** Recent question stems for a subject, so a new set avoids repeating them. */
export function avoidList(s: PracticeState, subject: string, max = 25): string[] {
  return (s.seen[subject] ?? []).slice(-max);
}

/** Subjects with at least five attempts, weakest first. */
export function weakest(s: PracticeState, max = 3): string[] {
  return Object.entries(s.stats)
    .filter(([, st]) => st.attempted >= 5)
    .sort((a, b) => a[1].correct / a[1].attempted - b[1].correct / b[1].attempted)
    .slice(0, max)
    .map(([k]) => k);
}

export function removeMistake(s: PracticeState, id: string): PracticeState {
  return { ...s, mistakes: s.mistakes.filter((m) => m.id !== id) };
}
