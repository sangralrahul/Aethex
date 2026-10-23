/**
 * Update 22 on the device: patient records (visits over time), clinic analytics from the OPD queue
 * history and prescriptions, revision notes with spaced revision, ward-round progress notes, the
 * RCRI for pre-operative assessment and the pill chart. No AI in any of this.
 */
import type { Prescription } from "./formulary";
import type { OpdDay } from "./clinic21";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const load = <T,>(key: string, fallback: T): T => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } };
const keep = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };
const DAY = 86400000;

/* ------------------------------------------------------------------ patient records */

export interface VisitVitals { bp: string; pulse: string; temp: string; spo2: string; weight: string; rbs: string }
export interface Visit { id: string; at: number; complaint: string; vitals: VisitVitals; diagnosis: string; notes: string; rx: string; followUp: string }
export interface PatientRecord { id: string; code: string; yob: string; sex: "M" | "F" | ""; allergies: string; problems: string; meds: string; visits: Visit[]; createdAt: number; updatedAt: number }
export const RECORDS_KEY = "cadus3.patients";
export const EMPTY_VISIT_VITALS: VisitVitals = { bp: "", pulse: "", temp: "", spo2: "", weight: "", rbs: "" };
export const readRecords = (): PatientRecord[] => (load<PatientRecord[]>(RECORDS_KEY, []) || []).filter((r) => r && typeof r.id === "string" && Array.isArray(r.visits)).slice(0, 2000);
export const saveRecords = (l: PatientRecord[]) => keep(RECORDS_KEY, l.slice(0, 2000));
export const newRecord = (f: Partial<PatientRecord> = {}, now = Date.now()): PatientRecord => ({ id: uid(), code: "", yob: "", sex: "", allergies: "", problems: "", meds: "", visits: [], createdAt: now, updatedAt: now, ...f });
export const newVisit = (f: Partial<Visit> = {}, now = Date.now()): Visit => ({ id: uid(), at: now, complaint: "", vitals: { ...EMPTY_VISIT_VITALS }, diagnosis: "", notes: "", rx: "", followUp: "", ...f });
export const ageOf = (r: PatientRecord, at = new Date()) => (/^\d{4}$/.test(r.yob) ? String(at.getFullYear() - Number(r.yob)) : "");
export const recordLabel = (r: PatientRecord) => [r.code || "Patient", [ageOf(r), r.sex].filter(Boolean).join("")].filter(Boolean).join(" · ");
export function searchRecords(list: PatientRecord[], q: string): PatientRecord[] {
  const t = q.trim().toLowerCase();
  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  if (!t) return sorted;
  return sorted.filter((r) => [r.code, r.problems, r.meds, r.allergies, ...r.visits.map((v) => `${v.complaint} ${v.diagnosis}`)].join(" ").toLowerCase().includes(t));
}
/** The record as text for a summary: age and sex, never the clinic code. */
export function recordText(r: PatientRecord): string {
  const visits = [...r.visits].sort((a, b) => a.at - b.at).slice(-15);
  return [
    `Patient: ${[ageOf(r) && `${ageOf(r)} years`, r.sex === "F" ? "female" : r.sex === "M" ? "male" : ""].filter(Boolean).join(", ") || "age and sex not recorded"}`,
    `Allergies: ${r.allergies || "none recorded"}`, `Problems: ${r.problems || "none recorded"}`, `Long-term medicines: ${r.meds || "none recorded"}`,
    ...visits.map((v) => {
      const vit = Object.entries(v.vitals).filter(([, x]) => x).map(([k, x]) => `${k.toUpperCase()} ${x}`).join(", ");
      return [`\nVisit ${new Date(v.at).toISOString().slice(0, 10)}: ${v.complaint}`, vit && `Vitals: ${vit}`, v.diagnosis && `Diagnosis: ${v.diagnosis}`, v.notes && `Notes: ${v.notes}`, v.rx && `Prescription: ${v.rx.replace(/\n+/g, " ").slice(0, 800)}`, v.followUp && `Follow-up: ${v.followUp}`].filter(Boolean).join("\n");
    }),
  ].join("\n");
}
export function recordMarkdown(r: PatientRecord): string {
  const visits = [...r.visits].sort((a, b) => b.at - a.at);
  return [
    `# ${recordLabel(r)}`, "",
    `**Allergies:** ${r.allergies || "None recorded"}  \n**Problems:** ${r.problems || "—"}  \n**Long-term medicines:** ${r.meds || "—"}`, "",
    ...visits.flatMap((v) => {
      const vit = Object.entries(v.vitals).filter(([, x]) => x).map(([k, x]) => `${k.toUpperCase()} ${x}`).join(" · ");
      return [`## ${new Date(v.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}: ${v.complaint || "Visit"}`, vit, v.diagnosis && `**Diagnosis:** ${v.diagnosis}`, v.notes, v.rx && `**Prescription:**\n\n${v.rx}`, v.followUp && `**Follow-up:** ${v.followUp}`, ""].filter((x) => x !== "" && x !== undefined) as string[];
    }),
  ].join("\n").trim();
}
/** A trend of one vital across visits, oldest first (for the small charts). */
export function vitalSeries(r: PatientRecord, key: keyof VisitVitals): { at: number; value: number }[] {
  return [...r.visits].sort((a, b) => a.at - b.at).map((v) => ({ at: v.at, value: parseFloat(key === "bp" ? v.vitals.bp.split("/")[0] : v.vitals[key]) })).filter((x) => Number.isFinite(x.value));
}
/** Backup and restore as a JSON file. */
export const recordsBackup = (l: PatientRecord[]) => JSON.stringify({ app: "Cadus", kind: "patient-records", version: 1, at: new Date().toISOString(), records: l }, null, 1);
export function restoreRecords(json: string, existing: PatientRecord[]): { records: PatientRecord[]; added: number } {
  const raw = JSON.parse(json);
  const incoming: PatientRecord[] = (Array.isArray(raw?.records) ? raw.records : []).filter((r: any) => r && typeof r.id === "string" && Array.isArray(r.visits));
  const have = new Set(existing.map((r) => r.id));
  const add = incoming.filter((r) => !have.has(r.id));
  return { records: [...add, ...existing], added: add.length };
}

/* ------------------------------------------------------------------ OPD history and clinic analytics */

export const OPD_HISTORY_KEY = "cadus3.opd.history";
export interface OpdArchived { date: string; patients: { token: number; age: string; sex: string; complaint: string; status: string; arrivedAt: number; calledAt?: number; doneAt?: number }[] }
export const readOpdHistory = (): OpdArchived[] => (load<OpdArchived[]>(OPD_HISTORY_KEY, []) || []).filter((d) => d && typeof d.date === "string" && Array.isArray(d.patients));
/** Keeps a finished day's queue (without labels or vitals) for the analytics; 365 days at most. */
export function archiveOpdDay(d: OpdDay) {
  if (!d.patients.length) return;
  const day: OpdArchived = { date: d.date, patients: d.patients.map((p) => ({ token: p.token, age: p.age, sex: p.sex, complaint: p.complaint, status: p.status, arrivedAt: p.arrivedAt, calledAt: p.calledAt, doneAt: p.doneAt })) };
  keep(OPD_HISTORY_KEY, [day, ...readOpdHistory().filter((x) => x.date !== d.date)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 365));
}

const STOP = new Set(["since", "for", "and", "with", "of", "the", "a", "an", "in", "on", "since", "x", "days", "day", "weeks", "week", "months", "month", "yrs", "years", "hrs", "hours", "h", "d", "c/o", "k/c/o", "h/o"]);
/** "Fever 3 days, cough" → "fever, cough": the complaint words for counting. */
export function complaintTerms(c: string): string[] {
  return c.toLowerCase().split(/[,;/+]| and /).map((p) => p.replace(/\d+(\.\d+)?/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).join(" ").trim()).filter((p) => p.length > 2).slice(0, 4);
}
const top = (counts: Map<string, number>, n: number) => [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([label, count]) => ({ label, count }));
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

export interface Analytics {
  days: { date: string; patients: number; avgWait: number | null }[];
  total: number; avgPerDay: number; avgWait: number | null; leftUnseen: number;
  complaints: { label: string; count: number }[]; medicines: { label: string; count: number }[]; diagnoses: { label: string; count: number }[];
  ages: { label: string; count: number }[]; sex: { M: number; F: number; other: number }; hours: number[]; prescriptions: number;
}
/** Everything the analytics page shows, for the days from `from` to `to` (YYYY-MM-DD, inclusive). */
export function clinicAnalytics(days: OpdArchived[], rx: Prescription[], from: string, to: string): Analytics {
  const inRange = days.filter((d) => d.date >= from && d.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  const complaints = new Map<string, number>(), ages = new Map<string, number>([["0–12", 0], ["13–18", 0], ["19–40", 0], ["41–60", 0], ["61+", 0]]);
  const sex = { M: 0, F: 0, other: 0 };
  const hours = Array(24).fill(0) as number[];
  let waitSum = 0, waitN = 0, left = 0, total = 0;
  const perDay = inRange.map((d) => {
    let ws = 0, wn = 0;
    for (const p of d.patients) {
      total++;
      if (p.status === "left") left++;
      if (p.calledAt) { ws += p.calledAt - p.arrivedAt; wn++; }
      complaintTerms(p.complaint).forEach((t) => bump(complaints, t));
      const a = Number(p.age);
      if (p.age && Number.isFinite(a)) bump(ages, a <= 12 ? "0–12" : a <= 18 ? "13–18" : a <= 40 ? "19–40" : a <= 60 ? "41–60" : "61+");
      if (p.sex === "M") sex.M++; else if (p.sex === "F") sex.F++; else sex.other++;
      hours[new Date(p.arrivedAt).getHours()]++;
    }
    waitSum += ws; waitN += wn;
    return { date: d.date, patients: d.patients.length, avgWait: wn ? Math.round(ws / wn / 60000) : null };
  });
  const toDate = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const meds = new Map<string, number>(), dx = new Map<string, number>();
  const rxIn = rx.filter((p) => { const d = toDate(p.createdAt); return d >= from && d <= to; });
  for (const p of rxIn) {
    p.items.forEach((i) => i.name && bump(meds, i.name.trim().replace(/\s+/g, " ").replace(/^\w/, (c) => c.toUpperCase())));
    if (p.diagnosis.trim()) bump(dx, p.diagnosis.trim().toLowerCase().replace(/^\w/, (c) => c.toUpperCase()));
  }
  return {
    days: perDay, total, avgPerDay: perDay.length ? Math.round((total / perDay.length) * 10) / 10 : 0, avgWait: waitN ? Math.round(waitSum / waitN / 60000) : null, leftUnseen: left,
    complaints: top(complaints, 10), medicines: top(meds, 10), diagnoses: top(dx, 10), ages: [...ages.entries()].map(([label, count]) => ({ label, count })), sex, hours, prescriptions: rxIn.length,
  };
}

/* ------------------------------------------------------------------ revision notes and spaced revision */

export interface RevItem { id: string; at: number; topic: string; subject: string; title: string; note: string; cards: { front: string; back: string }[]; mcqs: { q: string; options: string[]; answer: number; explain: string }[]; revisions: number[]; nextDue: number }
export const REV_KEY = "cadus3.revnotes";
/** Revise after 1, 3, 7, 21 and 45 days. */
export const REV_GAPS = [1, 3, 7, 21, 45];
export const readRev = (): RevItem[] => (load<RevItem[]>(REV_KEY, []) || []).filter((r) => r && typeof r.note === "string").slice(0, 300);
export const saveRev = (l: RevItem[]) => keep(REV_KEY, l.slice(0, 300));
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const newRev = (f: Omit<RevItem, "id" | "at" | "revisions" | "nextDue">, now = Date.now()): RevItem => ({ ...f, id: uid(), at: now, revisions: [], nextDue: startOfDay(now) + REV_GAPS[0] * DAY });
/** Marks a revision done and schedules the next one; after the last gap it comes back every 60 days. */
export function markRevised(r: RevItem, now = Date.now()): RevItem {
  const revisions = [...r.revisions, now];
  const gap = REV_GAPS[revisions.length] ?? 60;
  return { ...r, revisions, nextDue: startOfDay(now) + gap * DAY };
}
export const dueRev = (l: RevItem[], now = Date.now()) => l.filter((r) => r.nextDue <= startOfDay(now) + DAY - 1).sort((a, b) => a.nextDue - b.nextDue);

/* ------------------------------------------------------------------ ward-round progress notes */

export interface RoundNote { at: number; note: string }
export const ROUNDNOTES_KEY = "cadus3.roundnotes";
export const readRoundNotes = (): Record<string, RoundNote[]> => load<Record<string, RoundNote[]>>(ROUNDNOTES_KEY, {}) || {};
export function addRoundNote(patientId: string, note: string, now = Date.now()) {
  const all = readRoundNotes();
  all[patientId] = [{ at: now, note }, ...(all[patientId] ?? [])].slice(0, 30);
  keep(ROUNDNOTES_KEY, all);
}

/* ------------------------------------------------------------------ RCRI */

export const RCRI_ITEMS = [
  { id: "surgery", label: "High-risk surgery (intraperitoneal, intrathoracic or suprainguinal vascular)" },
  { id: "ihd", label: "Ischaemic heart disease" },
  { id: "hf", label: "History of heart failure" },
  { id: "cvd", label: "Stroke or TIA" },
  { id: "insulin", label: "Diabetes on insulin" },
  { id: "creat", label: "Creatinine above 2 mg/dL" },
] as const;
/** Revised Cardiac Risk Index (Lee 1999): points and the risk of a major cardiac event. */
export function rcri(ticked: string[]): { score: number; risk: string } {
  const score = RCRI_ITEMS.filter((i) => ticked.includes(i.id)).length;
  return { score, risk: score === 0 ? "0.4%" : score === 1 ? "0.9%" : score === 2 ? "6.6%" : "11% or more" };
}

/* ------------------------------------------------------------------ pill chart */

export type Slot = "morning" | "afternoon" | "evening" | "night";
export const SLOT_ICON: Record<Slot, string> = { morning: "🌅", afternoon: "☀️", evening: "🌇", night: "🌙" };
/** When in the day a frequency falls. */
export function slotsFor(freq: string): Slot[] | "sos" | "weekly" | "now" {
  const f = freq.toLowerCase();
  if (/as needed|\b(sos|prn)\b/.test(f)) return "sos";
  if (/weekly/.test(f)) return "weekly";
  if (/stat/.test(f)) return "now";
  if (/four times|every 6/.test(f)) return ["morning", "afternoon", "evening", "night"];
  if (/three times|every 8|\b(tds|tid)\b/.test(f)) return ["morning", "afternoon", "night"];
  if (/twice|every 12|\b(bd|bid)\b/.test(f)) return ["morning", "night"];
  if (/at night|bedtime|\bhs\b/.test(f)) return ["night"];
  return ["morning"];
}
const food = (i: string) => (/before (food|meals?)|empty stomach|khali pet/i.test(i) ? "🍽️✗ before food" : /after (food|meals?)|with food/i.test(i) ? "🍽️✓ after food" : "");
/** The prescription as a picture-based pill chart (sun and moon for the times of day) for patients who don't read. */
export function pillChartMarkdown(p: Prescription): string {
  const rows = p.items.map((i) => {
    const s = slotsFor(i.frequency);
    const cell = (slot: Slot) => (Array.isArray(s) && s.includes(slot) ? `**${i.dose || "1"}**` : "");
    const special = s === "sos" ? "When needed" : s === "weekly" ? "Once a week" : s === "now" ? "Now, once" : "";
    return `| **${i.name}** ${i.strength} | ${cell("morning")} | ${cell("afternoon")} | ${cell("evening")} | ${cell("night")} | ${[special, food(i.instructions), i.duration].filter(Boolean).join(" · ")} |`;
  });
  return [
    `# Medicine chart${p.patient ? `: ${p.patient}` : ""}`, "",
    `| Medicine | ${SLOT_ICON.morning} Morning | ${SLOT_ICON.afternoon} Afternoon | ${SLOT_ICON.evening} Evening | ${SLOT_ICON.night} Night | How long |`,
    "|---|---|---|---|---|---|",
    ...rows, "",
    p.followUp ? `**Next visit:** ${p.followUp}` : "",
  ].filter((x, k, a) => x !== "" || a[k - 1] !== "").join("\n").trim();
}
