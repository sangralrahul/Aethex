/**
 * Exam Study Planner: a day-by-day plan from today to the exam, built on this device from
 * the Learn syllabus. Topics not yet done are spread over the learning days (bigger and
 * weaker subjects first), then a revision block, weekly mock days, a final block of mocks
 * on the weakest subjects, and a light day before the exam. Ticking a learning day off
 * also ticks its topics in Learn.
 */
import { SUBJECTS } from "./practice";
import { SYLLABUS } from "./learn";

export type StudyKind = "learn" | "revise" | "mock" | "rest";
export interface StudyItem { subject: string; topic: string }
export interface StudyDay { date: string; kind: StudyKind; items: StudyItem[]; done: boolean }
export interface StudyPlan {
  id: string;
  exam: string;
  examDate: string;
  hours: number;
  subjects: string[];
  days: StudyDay[];
  /** Days ticked off in earlier versions of this plan (before a re-plan). */
  doneBefore: number;
  createdAt: number;
}

export const PLAN_EXAMS = ["NEET-PG", "INI-CET", "FMGE", "University exam"] as const;
export const STUDYPLAN_KEY = "cadus3.studyplan";
export const MAX_PLAN_DAYS = 400;

/** How much of the exam a subject usually carries: a rough working weight, not official numbers. */
const WEIGHT: Record<string, number> = {
  Medicine: 3, Surgery: 3, "Obstetrics and Gynaecology": 3, "Community Medicine": 3, Pathology: 3, Pharmacology: 3,
  Paediatrics: 2, Microbiology: 2, Physiology: 2, Anatomy: 2, Biochemistry: 2, Ophthalmology: 2, ENT: 2, "Forensic Medicine": 2,
};
const weight = (s: string) => WEIGHT[s] ?? 1;

/* ---- dates as YYYY-MM-DD in local time */
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayIso = () => isoDate(new Date());
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export function addDays(s: string, n: number): string { const d = parse(s); d.setDate(d.getDate() + n); return isoDate(d); }
export function daysBetween(a: string, b: string): number { return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000); }

/** Subjects ordered for study: heavier and weaker first. accuracy is 0-100, or null if not practised. */
export function orderSubjects(subjects: string[], accuracy: Record<string, number | null> = {}): string[] {
  const score = (s: string) => weight(s) + (accuracy[s] != null && (accuracy[s] as number) < 50 ? 1.5 : accuracy[s] != null && (accuracy[s] as number) < 65 ? 0.75 : 0);
  return [...subjects].sort((a, b) => score(b) - score(a) || SUBJECTS.indexOf(a) - SUBJECTS.indexOf(b));
}

/** The weakest subjects, for mock and catch-up days. */
function weakest(subjects: string[], accuracy: Record<string, number | null>, n: number): string[] {
  const tried = subjects.filter((s) => accuracy[s] != null).sort((a, b) => (accuracy[a] as number) - (accuracy[b] as number));
  const rest = orderSubjects(subjects.filter((s) => accuracy[s] == null));
  return [...tried, ...rest].slice(0, n);
}

/** Splits items into n consecutive groups as evenly as possible (n ≥ 1). */
function spread<T>(items: T[], n: number): T[][] {
  const out: T[][] = Array.from({ length: n }, () => []);
  if (!items.length) return out;
  for (let i = 0; i < items.length; i++) out[Math.min(n - 1, Math.floor((i * n) / items.length))].push(items[i]);
  return out;
}

export interface PlanInput {
  exam: string;
  examDate: string;
  start?: string;
  hours: number;
  subjects: string[];
  /** Topics already done, as "Subject › Topic". */
  done?: Iterable<string>;
  accuracy?: Record<string, number | null>;
}

/** The plan's days from start to the day before the exam. Throws a message the user can read. */
export function buildDays(input: PlanInput): StudyDay[] {
  const start = input.start ?? todayIso();
  const total = daysBetween(start, input.examDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.examDate) || Number.isNaN(total)) throw new Error("Choose the exam date");
  if (total < 1) throw new Error("The exam date must be after today");
  if (total > MAX_PLAN_DAYS) throw new Error("Plans can cover up to 400 days. Choose a nearer date.");
  const subjects = SUBJECTS.filter((s) => input.subjects.includes(s));
  if (!subjects.length) throw new Error("Choose at least one subject");
  const accuracy = input.accuracy ?? {};
  const done = new Set(input.done ?? []);
  const ordered = orderSubjects(subjects, accuracy);
  const allTopics: StudyItem[] = ordered.flatMap((s) => (SYLLABUS[s] ?? []).map((topic) => ({ subject: s, topic })));
  const todo = allTopics.filter((t) => !done.has(`${t.subject} › ${t.topic}`));

  // Phases: [learn (with weekly mocks)] [revision] [final mocks] [light day before the exam].
  const rest = total >= 3 ? 1 : 0;
  const working = total - rest;
  const finalMocks = working >= 5 ? Math.min(7, Math.max(1, Math.round(working * 0.1))) : 0;
  const revision = working >= 10 ? Math.round(working * 0.2) : 0;
  const learnSpan = working - finalMocks - revision;

  const kinds: StudyKind[] = [];
  for (let i = 0; i < learnSpan; i++) kinds.push(learnSpan >= 14 && i % 7 === 6 ? "mock" : "learn");
  for (let i = 0; i < revision; i++) kinds.push("revise");
  for (let i = 0; i < finalMocks; i++) kinds.push("mock");
  if (rest) kinds.push("rest");
  // Nothing left to learn: the learning days become revision.
  if (!todo.length) for (let i = 0; i < kinds.length; i++) if (kinds[i] === "learn") kinds[i] = "revise";

  const learnIdx = kinds.map((k, i) => (k === "learn" ? i : -1)).filter((i) => i >= 0);
  const reviseIdx = kinds.map((k, i) => (k === "revise" ? i : -1)).filter((i) => i >= 0);
  const days: StudyDay[] = kinds.map((kind, i) => ({ date: addDays(start, i), kind, items: [], done: false }));
  spread(todo, Math.max(1, learnIdx.length)).forEach((g, n) => { if (learnIdx[n] !== undefined) days[learnIdx[n]].items = g; });
  // Revision covers every topic of the chosen subjects, done or not.
  spread(allTopics, Math.max(1, reviseIdx.length)).forEach((g, n) => { if (reviseIdx[n] !== undefined) days[reviseIdx[n]].items = g; });
  // Few days: learning days also carry the topics that didn't fit (a crash plan).
  if (!learnIdx.length && !reviseIdx.length && todo.length) {
    const any = days.map((d, i) => (d.kind !== "rest" ? i : -1)).filter((i) => i >= 0);
    spread(todo, Math.max(1, any.length)).forEach((g, n) => { if (any[n] !== undefined) days[any[n]].items = g; });
  }
  const weak = weakest(subjects, accuracy, 3);
  let w = 0;
  for (const d of days) {
    if (d.kind === "mock" && !d.items.length) {
      d.items = [weak[w % weak.length], weak[(w + 1) % weak.length]].filter((s, i, a) => s && a.indexOf(s) === i).map((s) => ({ subject: s, topic: "" }));
      w++;
    }
  }
  return days;
}

export function makePlan(input: PlanInput, id: string): StudyPlan {
  return { id, exam: input.exam, examDate: input.examDate, hours: input.hours, subjects: [...input.subjects], days: buildDays(input), doneBefore: 0, createdAt: Date.now() };
}

/** A fresh plan from today, keeping the settings and what was ticked off. */
export function replan(plan: StudyPlan, done: Iterable<string>, accuracy: Record<string, number | null>, start = todayIso()): StudyPlan {
  const ticked = plan.days.filter((d) => d.done).length;
  return { ...plan, days: buildDays({ exam: plan.exam, examDate: plan.examDate, start, hours: plan.hours, subjects: plan.subjects, done, accuracy }), doneBefore: plan.doneBefore + ticked, createdAt: Date.now() };
}

export interface PlanProgress { total: number; done: number; pct: number; behind: number; daysLeft: number; today: StudyDay | null; topicsLeft: number }
export function progress(plan: StudyPlan, today = todayIso()): PlanProgress {
  const work = plan.days.filter((d) => d.kind !== "rest");
  const done = work.filter((d) => d.done).length;
  return {
    total: work.length,
    done,
    pct: work.length ? Math.round((100 * done) / work.length) : 0,
    behind: work.filter((d) => d.date < today && !d.done).length,
    daysLeft: Math.max(0, daysBetween(today, plan.examDate)),
    today: plan.days.find((d) => d.date === today) ?? null,
    topicsLeft: plan.days.filter((d) => d.kind === "learn" && !d.done).reduce((n, d) => n + d.items.length, 0),
  };
}

/** What a day asks for, in words, from the hours a day the user set. */
export function dayTask(d: StudyDay, hours: number): string {
  const q = Math.max(10, Math.round(hours * 15 / 5) * 5);
  if (d.kind === "rest") return "Light revision of your notes and flashcards, then rest. Sleep early.";
  if (d.kind === "mock") return `A timed mock test, then go through every wrong answer${d.items.length ? `; extra time on ${d.items.map((i) => i.subject).join(" and ")}` : ""}.`;
  if (d.kind === "revise") return `Revise ${d.items.length} topic${d.items.length === 1 ? "" : "s"} and do about ${q} questions on them.`;
  return `Study ${d.items.length} topic${d.items.length === 1 ? "" : "s"}, then about ${q} questions on them.`;
}

export const KIND_LABEL: Record<StudyKind, string> = { learn: "Learn", revise: "Revise", mock: "Mock test", rest: "Light day" };

/** The plan as calendar events (an .ics file), one all-day event per day. */
export function planIcs(plan: StudyPlan): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const events = plan.days.map((d, i) => {
    const what = d.items.map((x) => (x.topic ? `${x.subject}: ${x.topic}` : x.subject)).join("\n");
    return [
      "BEGIN:VEVENT",
      `UID:${plan.id}-${i}@cadus.aethex.in`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addDays(d.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${esc(`${plan.exam} · ${KIND_LABEL[d.kind]}${d.items.length && d.kind !== "mock" ? ` · ${d.items[0].subject}${d.items.length > 1 ? ` +${d.items.length - 1}` : ""}` : ""}`)}`,
      `DESCRIPTION:${esc(`${dayTask(d, plan.hours)}${what ? `\n\n${what}` : ""}`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aethex//Cadus Study Planner//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
}

export function readPlan(): StudyPlan | null {
  try {
    const p = JSON.parse(localStorage.getItem(STUDYPLAN_KEY) || "null");
    return p && Array.isArray(p.days) && typeof p.examDate === "string" ? { doneBefore: 0, ...p } : null;
  } catch { return null; }
}
export function savePlan(p: StudyPlan | null) {
  try { if (p) localStorage.setItem(STUDYPLAN_KEY, JSON.stringify(p)); else localStorage.removeItem(STUDYPLAN_KEY); } catch { /* full or blocked */ }
}
