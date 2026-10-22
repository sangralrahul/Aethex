/**
 * Records kept on this device: the PG Logbook (procedures, cases, duties and academic work,
 * with counts and a printable or CSV export) and Follow-ups (patients to review on a date,
 * shown on Today). Labels are initials or bed numbers, never names.
 */

const readKey = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; } };
const saveKey = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };
export const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const addDaysIso = (iso: string, n: number) => { const [y, m, d] = iso.split("-").map(Number); const x = new Date(y, m - 1, d + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };

/* ------------------------------------------------------------------ PG Logbook */

export type LogKind = "procedure" | "surgery" | "case" | "duty" | "academic";
export type LogRole = "observed" | "assisted" | "supervised" | "independent";
export interface LogEntry { id: string; date: string; kind: LogKind; title: string; role: LogRole; department: string; supervisor: string; notes: string; at: number }
export const LOG_KEY = "cadus3.logbook";
export const KIND_LABEL: Record<LogKind, string> = { procedure: "Procedure", surgery: "Surgery", case: "Case", duty: "Duty", academic: "Academic" };
export const ROLE_LABEL: Record<LogRole, string> = { observed: "Observed", assisted: "Assisted", supervised: "Performed under supervision", independent: "Performed independently" };
export const ROLE_SHORT: Record<LogRole, string> = { observed: "O", assisted: "A", supervised: "PS", independent: "PI" };
export const LOG_PRESETS: Record<LogKind, string[]> = {
  procedure: ["Venepuncture", "IV cannulation", "ABG", "Urinary catheter", "NG tube", "Lumbar puncture", "Central venous line", "Arterial line", "Intercostal drain", "Pleural tap", "Ascitic tap", "Bone marrow aspiration", "Endotracheal intubation", "CPR", "Defibrillation", "Suturing", "Incision and drainage", "Lumbar epidural", "Spinal anaesthesia", "Normal delivery", "Episiotomy repair"],
  surgery: ["Appendicectomy", "Hernia repair", "Laparoscopic cholecystectomy", "Caesarean section", "Debridement", "Circumcision", "Excision biopsy", "Tracheostomy"],
  case: ["Case worked up", "Case presented", "Death audit", "Referral seen"],
  duty: ["Casualty duty", "ICU duty", "Ward night duty", "Labour room duty", "OPD"],
  academic: ["Seminar", "Journal club", "Case presentation", "CME attended", "Paper presented", "Poster", "Publication", "Thesis work", "Teaching undergraduates"],
};
export const readLog = () => readKey<LogEntry[]>(LOG_KEY, []).filter((e) => e && e.id && e.title && LOG_PRESETS[e.kind]);
export const saveLog = (l: LogEntry[]) => saveKey(LOG_KEY, l.slice(0, 5000));

export interface LogCount { title: string; kind: LogKind; total: number; byRole: Record<LogRole, number>; last: string }
/** Counts by title, most done first. */
export function logCounts(l: LogEntry[]): LogCount[] {
  const m = new Map<string, LogCount>();
  for (const e of l) {
    const k = `${e.kind}|${e.title.trim().toLowerCase()}`;
    const c = m.get(k) ?? { title: e.title.trim(), kind: e.kind, total: 0, byRole: { observed: 0, assisted: 0, supervised: 0, independent: 0 }, last: "" };
    c.total++; c.byRole[e.role]++; if (e.date > c.last) c.last = e.date;
    m.set(k, c);
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.title.localeCompare(b.title));
}
const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
export function logCsv(l: LogEntry[]): string {
  const rows = [["Date", "Type", "Title", "Role", "Department", "Supervisor", "Notes"], ...[...l].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, KIND_LABEL[e.kind], e.title, ROLE_LABEL[e.role], e.department, e.supervisor, e.notes])];
  return "﻿" + rows.map((r) => r.map((c) => csvCell(String(c ?? ""))).join(",")).join("\r\n") + "\r\n";
}
export function logMarkdown(l: LogEntry[], name: string, from: string, to: string): string {
  const inRange = l.filter((e) => (!from || e.date >= from) && (!to || e.date <= to)).sort((a, b) => a.date.localeCompare(b.date));
  const counts = logCounts(inRange);
  return [
    `# Logbook${name ? `: ${name}` : ""}`,
    `${from || inRange[0]?.date || ""} to ${to || inRange.at(-1)?.date || ""} · ${inRange.length} entries · O observed, A assisted, PS performed under supervision, PI performed independently`,
    `## Summary\n| Item | Type | O | A | PS | PI | Total |\n|---|---|---|---|---|---|---|\n${counts.map((c) => `| ${c.title} | ${KIND_LABEL[c.kind]} | ${c.byRole.observed} | ${c.byRole.assisted} | ${c.byRole.supervised} | ${c.byRole.independent} | ${c.total} |`).join("\n")}`,
    `## Entries\n| Date | Item | Role | Department | Supervisor | Notes |\n|---|---|---|---|---|---|\n${inRange.map((e) => `| ${e.date} | ${e.title} | ${ROLE_SHORT[e.role]} | ${e.department} | ${e.supervisor} | ${e.notes.replace(/\|/g, "/").replace(/\n/g, " ")} |`).join("\n")}`,
    "\n\nSignature of the candidate: ____________________     Signature of the guide / HOD: ____________________",
  ].join("\n\n");
}

/* ------------------------------------------------------------------ Follow-ups */

export interface FollowUp { id: string; label: string; reason: string; review: string; due: string; done: boolean; at: number }
export const FOLLOWUP_KEY = "cadus3.followups";
export const readFollowUps = () => readKey<FollowUp[]>(FOLLOWUP_KEY, []).filter((f) => f && f.id && f.due);
export const saveFollowUps = (l: FollowUp[]) => saveKey(FOLLOWUP_KEY, l.slice(0, 1000));
export const FOLLOWUP_IN = [{ label: "3 days", days: 3 }, { label: "1 week", days: 7 }, { label: "2 weeks", days: 14 }, { label: "1 month", days: 30 }, { label: "3 months", days: 90 }];
export const dueIn = (days: number, from = isoToday()) => addDaysIso(from, days);
export function followUpGroups(l: FollowUp[], today = isoToday()) {
  const open = l.filter((f) => !f.done).sort((a, b) => a.due.localeCompare(b.due));
  return {
    overdue: open.filter((f) => f.due < today),
    today: open.filter((f) => f.due === today),
    week: open.filter((f) => f.due > today && f.due <= addDaysIso(today, 7)),
    later: open.filter((f) => f.due > addDaysIso(today, 7)),
    done: l.filter((f) => f.done).sort((a, b) => b.at - a.at),
  };
}
