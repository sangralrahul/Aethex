/** Update 77: the study record's shape and how two copies merge (shared by the site and worker/study.ts). */
export interface QSnap { key: string; question: string; options: string[]; correct: number; explanation: string; subject: string; topic?: string; source: string }
export interface Attempt { key: string; subject: string; correct: boolean; at: number }
export interface WrongItem { q: QSnap; at: number; tries: number; mastered?: number; updatedAt: number }
export type BookmarkKind = "question" | "topic" | "condition" | "subject";
export interface Bookmark { key: string; kind: BookmarkKind; title: string; href?: string; subject?: string; q?: QSnap; note?: string; at: number; updatedAt: number; removed?: boolean }
export interface StudyState { v: 1; goal: number; goalAt: number; days: Record<string, number>; attempts: Attempt[]; wrong: Record<string, WrongItem>; bookmarks: Record<string, Bookmark>; updatedAt: number }

export const MAX_ATTEMPTS = 3000;
export const blankStudy = (): StudyState => ({ v: 1, goal: 30, goalAt: 0, days: {}, attempts: [], wrong: {}, bookmarks: {}, updatedAt: 0 });

/** Two records merged: nothing answered or saved on either device is lost. */
export function mergeStates(a: StudyState, b: StudyState): StudyState {
  const days: Record<string, number> = { ...a.days };
  for (const [d, n] of Object.entries(b.days)) days[d] = Math.max(days[d] ?? 0, n);
  const seen = new Set<string>();
  const attempts = [...a.attempts, ...b.attempts].filter((x) => { const k = `${x.key}@${x.at}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((x, y) => x.at - y.at).slice(-MAX_ATTEMPTS);
  const pick = <T extends { updatedAt: number }>(x: Record<string, T>, y: Record<string, T>) => {
    const out: Record<string, T> = { ...x };
    for (const [k, v] of Object.entries(y)) if (!out[k] || v.updatedAt > out[k]!.updatedAt) out[k] = v;
    return out;
  };
  const goalFromB = b.goalAt > a.goalAt;
  return { v: 1, goal: goalFromB ? b.goal : a.goal, goalAt: Math.max(a.goalAt, b.goalAt), days, attempts, wrong: pick(a.wrong, b.wrong), bookmarks: pick(a.bookmarks, b.bookmarks), updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}

