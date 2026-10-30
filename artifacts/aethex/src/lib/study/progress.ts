/**
 * Update 77: a student's own study record on Aethex Study.
 * - Every answered question (NEET-PG practice, quick test, topic quizzes, custom tests, revision) counts towards the
 *   daily goal and the streak, and towards accuracy by subject.
 * - A wrong answer goes into the revision deck with the question itself, until it is answered right in revision.
 * - Bookmarks (questions, topics, conditions, subjects) with the student's own notes.
 * Kept in this browser, and in the account when signed in (/api/study/state, worker/study.ts), merged both ways.
 */
import { useSyncExternalStore } from "react";

import { MAX_ATTEMPTS, blankStudy, mergeStates, type Attempt, type Bookmark, type BookmarkKind, type QSnap, type StudyState, type WrongItem } from "./merge";
export { mergeStates };
export type { Attempt, Bookmark, BookmarkKind, QSnap, StudyState, WrongItem };

const KEY = "aethex.study.v1";
export const GOALS = [10, 20, 30, 50, 75, 100, 150];
const blank = blankStudy;

/** Today in India, "YYYY-MM-DD". */
export const istDay = (at = Date.now()) => new Date(at + 330 * 60000).toISOString().slice(0, 10);
export const addDay = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** A short, stable key for a question from its text (for questions without an id, like the generated ones). */
export function qKey(source: string, text: string, id?: string | number) {
  if (id !== undefined) return `${source}:${id}`;
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${source}:${(h >>> 0).toString(36)}`;
}

let state: StudyState = blank();
let loaded = false;
const subs = new Set<() => void>();
let syncTimer = 0;
let syncOn = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); if (v && v.v === 1) state = { ...blank(), ...v }; } catch { /* bad or blocked */ }
  window.addEventListener("storage", (e) => { if (e.key === KEY) { loaded = false; load(); emit(); } });
}
function emit() { subs.forEach((f) => f()); }
function save(next: StudyState, push = true) {
  state = { ...next, updatedAt: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked or full */ }
  emit();
  if (push && syncOn) { window.clearTimeout(syncTimer); syncTimer = window.setTimeout(() => void pushState(), 1200); }
}

async function pushState() {
  try { await fetch("/api/study/state", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(state) }); } catch { /* offline: kept here */ }
}
/** Signed in: fetch the account's record, merge it with this browser's and keep both in step from now on. */
export async function syncStudy(): Promise<boolean> {
  load();
  try {
    const r = await fetch("/api/study/state", { credentials: "same-origin" });
    if (!r.ok) return false;
    const { state: remote } = (await r.json()) as { state: StudyState | null };
    syncOn = true;
    const merged = remote && remote.v === 1 ? mergeStates(state, { ...blank(), ...remote }) : state;
    save(merged, false);
    await pushState();
    return true;
  } catch { return false; }
}

/* ---------------------------------------------------------------- what the pages do */
export const study = {
  get: () => { load(); return state; },
  /** One answered question. */
  record(q: QSnap, correct: boolean) {
    load();
    const now = Date.now(), day = istDay(now);
    const next: StudyState = { ...state, days: { ...state.days, [day]: (state.days[day] ?? 0) + 1 }, attempts: [...state.attempts, { key: q.key, subject: q.subject, correct, at: now }].slice(-MAX_ATTEMPTS), wrong: { ...state.wrong } };
    const w = next.wrong[q.key];
    if (!correct) next.wrong[q.key] = { q, at: w && !w.mastered ? w.at : now, tries: (w?.tries ?? 0) + 1, updatedAt: now };
    save(next);
  },
  /** An answer in revision: right takes it out of the deck. */
  revised(q: QSnap, correct: boolean) {
    study.record(q, correct);
    if (!correct) return;
    const w = state.wrong[q.key];
    if (w && !w.mastered) save({ ...state, wrong: { ...state.wrong, [q.key]: { ...w, mastered: Date.now(), updatedAt: Date.now() } } });
  },
  setGoal(n: number) { load(); save({ ...state, goal: Math.max(5, Math.min(500, Math.round(n))), goalAt: Date.now() }); },
  isBookmarked: (key: string) => { load(); const b = state.bookmarks[key]; return !!b && !b.removed; },
  toggleBookmark(b: Omit<Bookmark, "at" | "updatedAt">) {
    load();
    const now = Date.now(), cur = state.bookmarks[b.key];
    const on = !!cur && !cur.removed;
    save({ ...state, bookmarks: { ...state.bookmarks, [b.key]: on ? { ...cur!, removed: true, updatedAt: now } : { ...b, note: cur?.note ?? b.note, at: now, updatedAt: now } } });
  },
  /** A note on a bookmark; writing a note on something not bookmarked bookmarks it. */
  setNote(b: Omit<Bookmark, "at" | "updatedAt" | "note">, note: string) {
    load();
    const now = Date.now(), cur = state.bookmarks[b.key];
    save({ ...state, bookmarks: { ...state.bookmarks, [b.key]: { ...(cur && !cur.removed ? cur : { ...b, at: now }), note: note.slice(0, 5000), updatedAt: now, removed: false } } });
  },
  clearMastered() { load(); const wrong = { ...state.wrong }; for (const [k, w] of Object.entries(wrong)) if (w.mastered) delete wrong[k]; save({ ...state, wrong }); },
};

function subscribe(f: () => void) { load(); subs.add(f); return () => { subs.delete(f); }; }
const getSnap = () => { load(); return state; };
const serverSnap = blank();
export function useStudy(): StudyState { return useSyncExternalStore(subscribe, getSnap, () => serverSnap); }

/* ---------------------------------------------------------------- figures */
/** Consecutive days meeting the goal, ending today (or yesterday, if today isn't done yet). */
export function streakOf(s: StudyState, today = istDay()): { current: number; best: number; todayDone: boolean } {
  const done = (d: string) => (s.days[d] ?? 0) >= s.goal;
  let d = done(today) ? today : addDay(today, -1), current = 0;
  while (done(d)) { current++; d = addDay(d, -1); }
  const sorted = Object.keys(s.days).filter(done).sort();
  let best = 0, run = 0, prev = "";
  for (const x of sorted) { run = prev && addDay(prev, 1) === x ? run + 1 : 1; best = Math.max(best, run); prev = x; }
  return { current, best: Math.max(best, current), todayDone: done(today) };
}
export function bySubject(s: StudyState) {
  const m = new Map<string, { n: number; right: number }>();
  for (const a of s.attempts) { const x = m.get(a.subject) ?? { n: 0, right: 0 }; x.n++; if (a.correct) x.right++; m.set(a.subject, x); }
  return [...m.entries()].map(([subject, x]) => ({ subject, attempted: x.n, correct: x.right, pct: Math.round((x.right / x.n) * 100) })).sort((a, b) => a.pct - b.pct);
}
export const openWrong = (s: StudyState) => Object.values(s.wrong).filter((w) => !w.mastered).sort((a, b) => b.at - a.at);
export const liveBookmarks = (s: StudyState) => Object.values(s.bookmarks).filter((b) => !b.removed).sort((a, b) => b.updatedAt - a.updatedAt);
