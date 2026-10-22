/**
 * The bridge between Cadus and the Cadus desktop app (1.0.2 and later). The app has no
 * access to the page's data; it asks the page two things:
 *   window.__cadusStatus()   what is waiting (cards due, open ward jobs, today's study plan),
 *                            for the app's reminders and tray menu; counts only, no content.
 *   "cadus:open" events      open a part of Cadus (from the tray, a reminder or the
 *                            quick-open shortcut, which opens a new chat ready to type).
 * Links work the same way in any browser with ?open=today, ?open=new-chat and so on.
 */
import { dueCards, readDecks } from "./studio";
import { cardStats, readLearn } from "./learn";
import { readWard } from "./wardlist";
import { progress, readPlan } from "./studyplan";

export interface DesktopStatus { cardsDue: number; learnDue: number; openJobs: number; studyToday: string; version: 1 }

export function desktopStatus(): DesktopStatus {
  let cardsDue = 0, learnDue = 0, openJobs = 0, studyToday = "";
  try { cardsDue = readDecks().reduce((n, d) => n + dueCards(d).length, 0); } catch { /* none */ }
  try { learnDue = cardStats(readLearn()).due; } catch { /* none */ }
  try { openJobs = readWard().patients.reduce((n, p) => n + p.jobs.filter((j) => !j.done).length, 0); } catch { /* none */ }
  try {
    const plan = readPlan();
    const t = plan ? progress(plan).today : null;
    if (plan && t && !t.done && t.kind !== "rest") studyToday = `${plan.exam}: ${t.kind === "mock" ? "mock test day" : `${t.items.length} topic${t.items.length === 1 ? "" : "s"} today`}`;
  } catch { /* none */ }
  return { cardsDue, learnDue, openJobs, studyToday, version: 1 };
}

/** The parts of Cadus the app and ?open= links can open. */
export const OPEN_TARGETS = ["new-chat", "today", "calculators", "flashcards", "ward", "studyplan", "handover", "discharge", "ddx", "practice", "followups", "logbook", "ecg", "abx", "infusions", "abg"] as const;
export type OpenTarget = (typeof OPEN_TARGETS)[number];
export const isOpenTarget = (v: unknown): v is OpenTarget => (OPEN_TARGETS as readonly string[]).includes(String(v));

/** Listens for the app; returns the clean-up. */
export function installDesktopBridge(open: (target: OpenTarget) => void): () => void {
  const w = window as unknown as { __cadusStatus?: () => DesktopStatus };
  w.__cadusStatus = desktopStatus;
  const onOpen = (e: Event) => { const t = (e as CustomEvent).detail; if (isOpenTarget(t)) open(t); };
  window.addEventListener("cadus:open", onOpen);
  return () => { window.removeEventListener("cadus:open", onOpen); if (w.__cadusStatus === desktopStatus) delete w.__cadusStatus; };
}
