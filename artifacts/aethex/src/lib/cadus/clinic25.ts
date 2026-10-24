/**
 * Update 25 on the device: the appointment book, pharmacy stock and expiry, mental health
 * screening (PHQ-9, GAD-7, AUDIT-C), kidney dose adjustment, severe acute malnutrition, referral
 * contacts, clinic accounts and levothyroxine dosing. No AI in any of this.
 */
import { addPatient, readOpd, saveOpd } from "./clinic21";
import { billTotal, readBills } from "./clinic24";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const load = <T,>(key: string, fallback: T): T => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } };
const keep = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };
const DAY = 86400000;
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const local = (s: string) => new Date(`${s}T00:00:00`);
const csvRow = (r: unknown[]) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",");

/* ------------------------------------------------------------------ appointments */

export type ApptStatus = "booked" | "arrived" | "seen" | "no-show" | "cancelled";
export interface Appt { id: string; date: string; time: string; name: string; phone: string; reason: string; age: string; sex: "M" | "F" | ""; status: ApptStatus; createdAt: number }
export interface ApptSettings { start: string; end: string; slot: number; breakStart: string; breakEnd: string; closed: number[]; perSlot: number }
export interface ApptState { settings: ApptSettings; appts: Appt[] }
export const APPT_KEY = "cadus3.appts";
export const DEFAULT_APPT: ApptSettings = { start: "10:00", end: "14:00", slot: 15, breakStart: "", breakEnd: "", closed: [0], perSlot: 1 };
export const readAppts = (): ApptState => { const s = load<Partial<ApptState>>(APPT_KEY, {}); return { settings: { ...DEFAULT_APPT, ...(s.settings ?? {}) }, appts: Array.isArray(s.appts) ? s.appts.filter((a) => a && typeof a.id === "string") : [] }; };
export const saveAppts = (s: ApptState) => keep(APPT_KEY, { ...s, appts: s.appts.slice(-20000) });
export const newAppt = (f: Partial<Appt> = {}): Appt => ({ id: uid(), date: ymd(new Date()), time: "", name: "", phone: "", reason: "", age: "", sex: "", status: "booked", createdAt: Date.now(), ...f });
const mins = (t: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** The day's slots with how many are booked in each; none on closed weekdays. */
export function daySlots(s: ApptState, date: string): { time: string; booked: Appt[]; free: number }[] {
  const d = local(date);
  if (Number.isNaN(d.getTime()) || s.settings.closed.includes(d.getDay())) return [];
  const a = mins(s.settings.start), b = mins(s.settings.end), step = Math.max(5, Math.min(120, Number(s.settings.slot) || 15));
  if (!(a < b)) return [];
  const bs = mins(s.settings.breakStart), be = mins(s.settings.breakEnd);
  const out: { time: string; booked: Appt[]; free: number }[] = [];
  for (let m = a; m + step <= b; m += step) {
    if (bs < be && m >= bs && m < be) continue;
    const t = hhmm(m);
    const booked = s.appts.filter((x) => x.date === date && x.time === t && x.status !== "cancelled");
    out.push({ time: t, booked, free: Math.max(0, (s.settings.perSlot || 1) - booked.length) });
  }
  return out;
}
export const nextFreeSlot = (s: ApptState, date: string, after = "") => daySlots(s, date).find((x) => x.free > 0 && x.time >= after)?.time ?? "";
export function apptReminder(a: Appt, clinic = ""): string {
  const d = local(a.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  return `Reminder${clinic ? ` from ${clinic}` : ""}: your appointment is on ${d}${a.time ? ` at ${a.time}` : ""}. Please arrive 10 minutes early and bring your previous prescriptions and reports. Reply to change the time.`;
}
/** Marks the patient as arrived and puts them in today's OPD queue (initials and age only). */
export function arriveToOpd(a: Appt): number {
  const day = readOpd();
  const initials = a.name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 3);
  const next = addPatient(day, { label: initials ? `${initials} (appt ${a.time})` : `Appt ${a.time}`, age: a.age, sex: a.sex, complaint: a.reason });
  saveOpd(next);
  return next.patients.at(-1)!.token;
}
export function apptStats(s: ApptState, date: string) {
  const day = s.appts.filter((a) => a.date === date);
  const n = (st: ApptStatus) => day.filter((a) => a.status === st).length;
  return { total: day.filter((a) => a.status !== "cancelled").length, booked: n("booked"), arrived: n("arrived") + n("seen"), noShow: n("no-show"), cancelled: n("cancelled") };
}

/* ------------------------------------------------------------------ pharmacy stock */

export interface StockItem { id: string; name: string; form: string; strength: string; batch: string; expiry: string; qty: number; reorder: number; unit: string; mrp: number; updatedAt: number }
export interface StockMove { id: string; itemId: string; at: number; change: number; note: string }
export interface StockState { items: StockItem[]; moves: StockMove[] }
export const STOCK_KEY = "cadus3.stock";
export const readStock = (): StockState => { const s = load<Partial<StockState>>(STOCK_KEY, {}); return { items: Array.isArray(s.items) ? s.items.filter((i) => i && typeof i.id === "string") : [], moves: Array.isArray(s.moves) ? s.moves.slice(-5000) : [] }; };
export const saveStock = (s: StockState) => keep(STOCK_KEY, { items: s.items, moves: s.moves.slice(-5000) });
export const newStockItem = (f: Partial<StockItem> = {}): StockItem => ({ id: uid(), name: "", form: "Tablet", strength: "", batch: "", expiry: "", qty: 0, reorder: 10, unit: "tablets", mrp: 0, updatedAt: Date.now(), ...f });
/** Expiry is a month (yyyy-mm): the stock is usable to the end of that month. */
export const expiryEnd = (e: string) => { const m = /^(\d{4})-(\d{2})/.exec(e); return m ? new Date(Number(m[1]), Number(m[2]), 0, 23, 59) : null; };
export type StockFlag = "expired" | "expiring" | "out" | "low";
export function stockFlags(i: StockItem, at = new Date(), days = 90): StockFlag[] {
  const f: StockFlag[] = [];
  const end = expiryEnd(i.expiry);
  if (end && end.getTime() < at.getTime()) f.push("expired");
  else if (end && end.getTime() - at.getTime() <= days * DAY) f.push("expiring");
  if (i.qty <= 0) f.push("out");
  else if (i.qty <= i.reorder) f.push("low");
  return f;
}
export function moveStock(s: StockState, itemId: string, change: number, note = ""): StockState {
  return {
    items: s.items.map((i) => (i.id === itemId ? { ...i, qty: Math.max(0, i.qty + change), updatedAt: Date.now() } : i)),
    moves: [...s.moves, { id: uid(), itemId, at: Date.now(), change, note: note.slice(0, 80) }],
  };
}
export const reorderList = (s: StockState, at = new Date()) => s.items.filter((i) => { const f = stockFlags(i, at); return f.includes("out") || f.includes("low") || f.includes("expired"); }).map((i) => ({ ...i, suggest: Math.max(i.reorder * 2 - (stockFlags(i, at).includes("expired") ? 0 : i.qty), i.reorder) }));
export const stockValue = (s: StockState) => Math.round(s.items.reduce((a, i) => a + (Number(i.mrp) || 0) * (Number(i.qty) || 0), 0));
export const stockCsv = (s: StockState) => ["Name,Form,Strength,Batch,Expiry,Quantity,Unit,Reorder level,MRP", ...s.items.map((i) => csvRow([i.name, i.form, i.strength, i.batch, i.expiry, i.qty, i.unit, i.reorder, i.mrp]))].join("\n");

/* ------------------------------------------------------------------ mental health screening */

export const FREQ = ["Not at all", "Several days", "More than half the days", "Nearly every day"];
export const PHQ9 = [
  "Little interest or pleasure in doing things", "Feeling down, depressed, or hopeless", "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy", "Poor appetite or overeating", "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television", "Moving or speaking so slowly that other people could have noticed, or the opposite: being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];
export const GAD7 = [
  "Feeling nervous, anxious, or on edge", "Not being able to stop or control worrying", "Worrying too much about different things", "Trouble relaxing",
  "Being so restless that it is hard to sit still", "Becoming easily annoyed or irritable", "Feeling afraid, as if something awful might happen",
];
export const AUDITC: { q: string; options: string[] }[] = [
  { q: "How often do you have a drink containing alcohol?", options: ["Never", "Monthly or less", "2–4 times a month", "2–3 times a week", "4 or more times a week"] },
  { q: "How many standard drinks do you have on a typical day when you are drinking?", options: ["1 or 2", "3 or 4", "5 or 6", "7 to 9", "10 or more"] },
  { q: "How often do you have six or more drinks on one occasion?", options: ["Never", "Less than monthly", "Monthly", "Weekly", "Daily or almost daily"] },
];
export interface ScreenResult { score: number; max: number; band: string; level: 0 | 1 | 2 | 3 | 4; advice: string[]; urgent?: string }
const sum = (a: (number | undefined)[]) => a.reduce<number>((s, x) => s + (x ?? 0), 0);
export function phq9(ans: (number | undefined)[]): ScreenResult {
  const score = sum(ans);
  const level = (score >= 20 ? 4 : score >= 15 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0) as ScreenResult["level"];
  const band = ["Minimal", "Mild", "Moderate", "Moderately severe", "Severe"][level];
  const advice = [
    ["Reassure; rescreen if symptoms continue."],
    ["Watchful waiting: support, sleep and activity advice; repeat PHQ-9 in 2–4 weeks."],
    ["Treatment plan: psychological therapy (e.g. CBT, problem-solving) and/or an antidepressant; review in 2–4 weeks."],
    ["Start treatment now: an antidepressant and/or psychotherapy; review within 2 weeks."],
    ["Start an antidepressant, and refer to a psychiatrist, especially with poor response or functional impairment."],
  ][level];
  const urgent = (ans[8] ?? 0) > 0 ? "Item 9 is positive: ask directly about suicidal thoughts, plans, means and past attempts today. If there is a plan or intent, don't leave the person alone; arrange urgent psychiatric care. Tele-MANAS helpline: 14416 or 1-800-891-4416." : undefined;
  return { score, max: 27, band, level, advice, urgent };
}
export function gad7(ans: (number | undefined)[]): ScreenResult {
  const score = sum(ans);
  const level = (score >= 15 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0) as ScreenResult["level"];
  return { score, max: 21, band: ["Minimal", "Mild", "Moderate", "Severe"][level], level, advice: [["No treatment needed; rescreen if symptoms continue."], ["Monitor; advice on sleep, exercise and worry; repeat in 4 weeks."], ["Probable anxiety disorder: assess further and consider psychological therapy or an SSRI."], ["Active treatment: psychological therapy and/or an SSRI; consider referral."]][level] };
}
export function auditC(ans: (number | undefined)[], sex: "M" | "F"): ScreenResult {
  const score = sum(ans);
  const cut = sex === "F" ? 3 : 4;
  const level = (score >= 8 ? 3 : score >= cut ? 2 : 0) as ScreenResult["level"];
  return { score, max: 12, band: level === 3 ? "High risk" : level === 2 ? "Positive screen" : "Low risk", level, advice: level === 3 ? ["Likely harmful drinking or dependence: complete the full AUDIT, check for withdrawal and liver disease, and offer referral (de-addiction services)."] : level === 2 ? ["Hazardous drinking: brief intervention (feedback, advice to cut down, a goal) and follow up."] : ["Positive reinforcement; recheck yearly."] };
}

/* ------------------------------------------------------------------ kidney dose adjustment */

/** Cockcroft-Gault creatinine clearance (ml/min); creatinine in mg/dL. */
export function cockcroftGault(age: number, weightKg: number, creatinine: number, sex: "M" | "F"): number | null {
  if (!(age > 0 && weightKg > 0 && creatinine > 0)) return null;
  return Math.round(((140 - age) * weightKg * (sex === "F" ? 0.85 : 1)) / (72 * creatinine));
}
export type RenalBand = ">50" | "30-50" | "10-30" | "<10" | "HD";
export const bandFor = (crcl: number, dialysis: boolean): RenalBand => (dialysis ? "HD" : crcl > 50 ? ">50" : crcl >= 30 ? "30-50" : crcl >= 10 ? "10-30" : "<10");
export interface RenalDrug { name: string; usual: string; dose: Partial<Record<RenalBand, string>>; note?: string }
/** Common medicines and their adjustment by creatinine clearance (from standard references: BNF,
 * product labels, Sanford). A missing band means no change from the usual dose. */
export const RENAL_DRUGS: RenalDrug[] = [
  { name: "Metformin", usual: "500–1000 mg twice daily", dose: { "30-50": "eGFR 30–44: don't start; maximum 1000 mg a day", "10-30": "Avoid (eGFR under 30)", "<10": "Avoid", HD: "Avoid" }, note: "Use eGFR. Stop during acute illness, dehydration or iodinated contrast." },
  { name: "Sitagliptin", usual: "100 mg once daily", dose: { "30-50": "50 mg once daily (eGFR 30–45)", "10-30": "25 mg once daily", "<10": "25 mg once daily", HD: "25 mg once daily" } },
  { name: "Vildagliptin", usual: "50 mg twice daily", dose: { "30-50": "50 mg once daily", "10-30": "50 mg once daily", "<10": "50 mg once daily", HD: "50 mg once daily" } },
  { name: "Linagliptin", usual: "5 mg once daily", dose: {}, note: "No change at any kidney function." },
  { name: "Glimepiride", usual: "1–4 mg once daily", dose: { "30-50": "Start 1 mg; titrate slowly", "10-30": "Avoid if possible (hypoglycaemia); prefer insulin or linagliptin", "<10": "Avoid", HD: "Avoid" }, note: "Avoid glibenclamide in CKD." },
  { name: "Insulin", usual: "As titrated", dose: { "10-30": "Reduce total dose by about 25%", "<10": "Reduce total dose by about 50%", HD: "Reduce by about 50%; watch for hypoglycaemia" } },
  { name: "Amoxicillin", usual: "500 mg three times daily", dose: { "10-30": "250–500 mg every 12 hours", "<10": "250–500 mg every 24 hours", HD: "250–500 mg every 24 hours, dose after dialysis" } },
  { name: "Amoxicillin-clavulanate", usual: "625 mg three times daily", dose: { "10-30": "375–625 mg every 12 hours; avoid the 1 g tablet", "<10": "375–625 mg every 24 hours", HD: "375–625 mg every 24 hours, extra dose after dialysis" } },
  { name: "Ciprofloxacin", usual: "500 mg twice daily", dose: { "30-50": "250–500 mg every 12 hours", "10-30": "250–500 mg every 18–24 hours", "<10": "250–500 mg every 24 hours", HD: "250–500 mg every 24 hours, after dialysis" } },
  { name: "Levofloxacin", usual: "750 mg once daily", dose: { "30-50": "750 mg every 48 hours (CrCl 20–49)", "10-30": "750 mg once, then 500 mg every 48 hours", "<10": "750 mg once, then 500 mg every 48 hours", HD: "750 mg once, then 500 mg every 48 hours" } },
  { name: "Nitrofurantoin", usual: "100 mg twice daily (MR)", dose: { "10-30": "Avoid (eGFR under 30)", "<10": "Avoid", HD: "Avoid" }, note: "Ineffective and toxic in poor kidney function." },
  { name: "Cotrimoxazole", usual: "960 mg twice daily", dose: { "10-30": "Half the dose (CrCl 15–30)", "<10": "Avoid", HD: "Avoid unless essential (specialist advice)" }, note: "Watch potassium." },
  { name: "Meropenem", usual: "1 g every 8 hours", dose: { "30-50": "1 g every 12 hours (CrCl 26–50)", "10-30": "500 mg every 12 hours", "<10": "500 mg every 24 hours", HD: "500 mg every 24 hours, after dialysis" } },
  { name: "Piperacillin-tazobactam", usual: "4.5 g every 6–8 hours", dose: { "10-30": "2.25–3.375 g every 6 hours (CrCl 20–40)", "<10": "2.25 g every 8 hours", HD: "2.25 g every 8–12 hours, extra 0.75 g after dialysis" } },
  { name: "Ceftriaxone", usual: "1–2 g once daily", dose: {}, note: "No change; maximum 2 g a day if both kidney and liver function are poor." },
  { name: "Gentamicin", usual: "5–7 mg/kg once daily", dose: { "30-50": "Extend the interval to 36 hours; dose by levels", "10-30": "Extend to 48 hours or avoid; dose by levels", "<10": "Avoid, or a single dose with levels", HD: "Dose after dialysis by levels" }, note: "Avoid if there is another option." },
  { name: "Vancomycin", usual: "15–20 mg/kg every 8–12 hours", dose: { "30-50": "Dose by trough levels (every 24 hours)", "10-30": "Loading dose, then by levels", "<10": "Loading dose, then by levels", HD: "Loading dose, then 500–1000 mg after each dialysis by levels" } },
  { name: "Fluconazole", usual: "200–400 mg once daily", dose: { "30-50": "Half the dose after the loading dose", "10-30": "Half the dose after the loading dose", "<10": "Half the dose after the loading dose", HD: "Full dose after each dialysis" } },
  { name: "Aciclovir (oral, zoster)", usual: "800 mg five times daily", dose: { "10-30": "800 mg every 8 hours", "<10": "800 mg every 12 hours", HD: "800 mg every 12 hours, after dialysis" } },
  { name: "Oseltamivir", usual: "75 mg twice daily", dose: { "30-50": "30 mg twice daily", "10-30": "30 mg once daily", "<10": "Not recommended (specialist advice)", HD: "30 mg after each dialysis" } },
  { name: "Enoxaparin (treatment)", usual: "1 mg/kg every 12 hours", dose: { "10-30": "1 mg/kg once daily (CrCl under 30)", "<10": "Use unfractionated heparin", HD: "Use unfractionated heparin" }, note: "Prophylaxis with CrCl under 30: 20–30 mg once daily." },
  { name: "Rivaroxaban (AF)", usual: "20 mg once daily", dose: { "30-50": "15 mg once daily", "10-30": "15 mg once daily (CrCl 15–29, with caution)", "<10": "Avoid", HD: "Avoid" } },
  { name: "Apixaban (AF)", usual: "5 mg twice daily", dose: { "10-30": "2.5 mg twice daily (CrCl 15–29)", "<10": "Avoid", HD: "Specialist advice" }, note: "Also 2.5 mg twice daily if two of: age 80 or over, weight 60 kg or less, creatinine 1.5 mg/dL or more." },
  { name: "Dabigatran", usual: "150 mg twice daily", dose: { "30-50": "110 mg twice daily if bleeding risk is high", "10-30": "Avoid (CrCl under 30)", "<10": "Avoid", HD: "Avoid" } },
  { name: "Gabapentin", usual: "300–1200 mg three times daily", dose: { "30-50": "400–1400 mg a day in 2 doses", "10-30": "200–700 mg a day once or in 2 doses", "<10": "100–300 mg a day", HD: "100–300 mg after each dialysis" } },
  { name: "Pregabalin", usual: "75–300 mg twice daily", dose: { "30-50": "75–300 mg a day in 2–3 doses", "10-30": "25–150 mg a day", "<10": "25–75 mg once daily", HD: "25–75 mg daily, extra dose after dialysis" } },
  { name: "Tramadol", usual: "50–100 mg every 6 hours", dose: { "10-30": "50–100 mg every 12 hours, maximum 200 mg a day", "<10": "50 mg every 12 hours", HD: "50 mg every 12 hours, after dialysis" } },
  { name: "Morphine", usual: "As titrated", dose: { "30-50": "Reduce the dose and lengthen the interval", "10-30": "Avoid if possible; prefer fentanyl or low-dose oxycodone", "<10": "Avoid", HD: "Avoid" }, note: "Active metabolites build up." },
  { name: "NSAIDs (ibuprofen, diclofenac)", usual: "As usual", dose: { "30-50": "Avoid if possible; short course with monitoring", "10-30": "Avoid", "<10": "Avoid", HD: "Avoid (residual function)" } },
  { name: "Allopurinol", usual: "100–300 mg once daily", dose: { "30-50": "Start 50–100 mg; increase slowly to target urate", "10-30": "Start 50 mg; increase slowly", "<10": "Start 50 mg on alternate days or less", HD: "Dose after dialysis" } },
  { name: "Colchicine (gout flare)", usual: "500 mcg two to three times daily", dose: { "30-50": "500 mcg once or twice daily", "10-30": "500 mcg once daily; don't repeat within 2 weeks", "<10": "Avoid", HD: "Avoid" } },
  { name: "Spironolactone", usual: "25–50 mg once daily", dose: { "30-50": "12.5–25 mg once daily or alternate days; check potassium", "10-30": "Avoid", "<10": "Avoid", HD: "Avoid" } },
  { name: "Atenolol", usual: "50–100 mg once daily", dose: { "10-30": "Maximum 50 mg a day (CrCl 15–35)", "<10": "25 mg a day or 50 mg on alternate days", HD: "25–50 mg after dialysis" } },
  { name: "Digoxin", usual: "62.5–250 mcg once daily", dose: { "30-50": "62.5–125 mcg once daily; check levels", "10-30": "62.5 mcg once daily or alternate days; levels", "<10": "62.5 mcg on alternate days; levels", HD: "62.5 mcg on alternate days; levels" } },
  { name: "Levetiracetam", usual: "500–1500 mg twice daily", dose: { "30-50": "250–750 mg twice daily", "10-30": "250–500 mg twice daily", "<10": "500–1000 mg once daily", HD: "500–1000 mg once daily, plus 250–500 mg after dialysis" } },
  { name: "Famotidine", usual: "20–40 mg twice daily", dose: { "30-50": "Half the dose or every 48 hours", "10-30": "20 mg once daily", "<10": "20 mg once daily", HD: "20 mg once daily" } },
  { name: "Lithium", usual: "By levels", dose: { "30-50": "Reduce the dose; frequent levels", "10-30": "Avoid", "<10": "Avoid", HD: "Avoid" } },
  { name: "Methotrexate", usual: "7.5–25 mg once weekly", dose: { "30-50": "Reduce the dose by half", "10-30": "Avoid", "<10": "Avoid", HD: "Avoid" } },
];
export const renalLookup = (q: string) => { const t = q.trim().toLowerCase(); return t ? RENAL_DRUGS.filter((d) => d.name.toLowerCase().includes(t)) : RENAL_DRUGS; };
export const renalDose = (d: RenalDrug, band: RenalBand) => d.dose[band] ?? (band === "HD" ? d.dose["<10"] ?? d.usual : d.usual);

/* ------------------------------------------------------------------ severe acute malnutrition */

export interface SamIn { ageMonths: number; weightKg: number; muac?: number; whz?: number; oedema: 0 | 1 | 2 | 3; appetitePass?: boolean; complications?: boolean }
export interface SamPlan { status: "SAM" | "MAM" | "normal"; admit: boolean; why: string[]; f75?: { perDay: number; perFeed: number; feeds: number }; f100?: { perDayLow: number; perDayHigh: number }; steps: string[] }
/** WHO / national NRC guidance for children 6–59 months. */
export function samPlan(c: SamIn): SamPlan | null {
  if (!(c.ageMonths >= 6 && c.ageMonths <= 59 && c.weightKg > 1)) return null;
  const why: string[] = [];
  if (c.muac !== undefined && c.muac < 11.5) why.push(`MUAC ${c.muac} cm (under 11.5)`);
  if (c.whz !== undefined && c.whz < -3) why.push(`Weight-for-height Z ${c.whz} (under −3)`);
  if (c.oedema > 0) why.push(`Bilateral pitting oedema (${"+".repeat(c.oedema)})`);
  const sam = why.length > 0;
  const mam = !sam && ((c.muac !== undefined && c.muac < 12.5) || (c.whz !== undefined && c.whz < -2));
  if (!sam) return { status: mam ? "MAM" : "normal", admit: false, why: mam ? [`${c.muac !== undefined && c.muac < 12.5 ? `MUAC ${c.muac} cm` : `WHZ ${c.whz}`}: moderate acute malnutrition`] : ["No acute malnutrition by these measures"], steps: mam ? ["Supplementary feeding (ICDS take-home ration), counselling on feeding, deworming and micronutrients", "Follow up every 2 weeks; refer if the child gets worse"] : ["Growth monitoring and feeding advice"] };
  const admit = c.oedema === 3 || c.complications === true || c.appetitePass === false || c.ageMonths < 6;
  const perDay = Math.round(c.weightKg * (c.oedema === 3 ? 100 : 130));
  const steps = admit ? [
    "Admit to the Nutrition Rehabilitation Centre (NRC) or paediatric ward.",
    "Treat and prevent hypoglycaemia (10% glucose or F-75 at once), hypothermia (kangaroo care, cover the head) and dehydration (ReSoMal, not standard IV fluids unless in shock).",
    "Antibiotics for all: amoxicillin if uncomplicated; ampicillin plus gentamicin if complicated.",
    "Stabilisation: F-75 every 2–3 hours (8–12 feeds), day and night; no iron yet.",
    "Transition when appetite returns and oedema is going: F-100 (or RUTF) in the same volume for 2 days, then increase.",
    "Rehabilitation: F-100 150–220 ml/kg/day; iron after the first week; vitamin A, folic acid, zinc and multivitamins; play and mother's counselling.",
    "Discharge at 15% weight gain (or WHZ −2 or more) with no oedema for 2 weeks and the child eating well; follow up 2, 4 and 8 weeks.",
  ] : [
    "Uncomplicated SAM with appetite: community-based care (where available) with RUTF about 200 kcal/kg/day, amoxicillin for 5 days, deworming and follow-up every week.",
    "Admit if the child loses appetite, develops complications or oedema worsens.",
  ];
  return { status: "SAM", admit, why, f75: admit ? { perDay, perFeed: Math.round(perDay / 8), feeds: 8 } : undefined, f100: admit ? { perDayLow: Math.round(c.weightKg * 150), perDayHigh: Math.round(c.weightKg * 220) } : undefined, steps };
}

/* ------------------------------------------------------------------ referral contacts */

export interface Contact { id: string; name: string; speciality: string; place: string; phone: string; whatsapp: string; email: string; notes: string; favourite: boolean; updatedAt: number }
export const CONTACTS_KEY = "cadus3.contacts";
export const readContacts = (): Contact[] => (load<Contact[]>(CONTACTS_KEY, []) || []).filter((c) => c && typeof c.id === "string").slice(0, 2000);
export const saveContacts = (l: Contact[]) => keep(CONTACTS_KEY, l.slice(0, 2000));
export const newContact = (f: Partial<Contact> = {}): Contact => ({ id: uid(), name: "", speciality: "", place: "", phone: "", whatsapp: "", email: "", notes: "", favourite: false, updatedAt: Date.now(), ...f });
export const searchContacts = (l: Contact[], q: string) => { const t = q.trim().toLowerCase(); return [...l].sort((a, b) => Number(b.favourite) - Number(a.favourite) || a.name.localeCompare(b.name)).filter((c) => !t || `${c.name} ${c.speciality} ${c.place} ${c.notes}`.toLowerCase().includes(t)); };
export const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;
export const waHref = (p: string, text = "") => { let d = p.replace(/\D/g, ""); if (d.length === 10) d = `91${d}`; return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`; };
/** A contacts file (vCard 3.0) to share or import into a phone. */
export const vcard = (c: Contact) => ["BEGIN:VCARD", "VERSION:3.0", `FN:${c.name}`, c.speciality ? `TITLE:${c.speciality}` : "", c.place ? `ORG:${c.place}` : "", c.phone ? `TEL;TYPE=CELL:${c.phone}` : "", c.email ? `EMAIL:${c.email}` : "", c.notes ? `NOTE:${c.notes.replace(/\n/g, " ")}` : "", "END:VCARD"].filter(Boolean).join("\r\n");

/* ------------------------------------------------------------------ clinic accounts */

export const EXPENSE_HEADS = ["Rent", "Salaries", "Electricity and water", "Medicines and consumables", "Equipment and repairs", "Lab and outsourcing", "Software and internet", "Professional fees and licences", "Other"];
export interface Expense { id: string; date: string; head: string; amount: number; note: string; mode: "cash" | "upi" | "card" | "bank" }
export const EXPENSES_KEY = "cadus3.expenses";
export const readExpenses = (): Expense[] => (load<Expense[]>(EXPENSES_KEY, []) || []).filter((e) => e && typeof e.id === "string").slice(-20000);
export const saveExpenses = (l: Expense[]) => keep(EXPENSES_KEY, l.slice(-20000));
export const newExpense = (f: Partial<Expense> = {}): Expense => ({ id: uid(), date: ymd(new Date()), head: "Rent", amount: 0, note: "", mode: "bank", ...f });
/** Income (from Clinic Bills & Receipts, cancelled ones left out) against expenses for a month (yyyy-mm). */
export function monthAccounts(month: string, expenses = readExpenses(), bills = readBills()) {
  const income = bills.filter((b) => b.date.startsWith(month) && !b.cancelled).reduce((s, b) => s + billTotal(b), 0);
  const ex = expenses.filter((e) => e.date.startsWith(month));
  const spent = ex.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const byHead = EXPENSE_HEADS.map((h) => ({ head: h, amount: ex.filter((e) => e.head === h).reduce((s, e) => s + (Number(e.amount) || 0), 0) })).filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount);
  const receipts = bills.filter((b) => b.date.startsWith(month) && !b.cancelled).length;
  return { income: Math.round(income * 100) / 100, spent: Math.round(spent * 100) / 100, net: Math.round((income - spent) * 100) / 100, byHead, receipts, perPatient: receipts ? Math.round(income / receipts) : 0 };
}
export const expensesCsv = (l: Expense[]) => ["Date,Head,Amount,Mode,Note", ...[...l].sort((a, b) => a.date.localeCompare(b.date)).map((e) => csvRow([e.date, e.head, e.amount, e.mode, e.note]))].join("\n");

/* ------------------------------------------------------------------ levothyroxine */

export interface ThyroidIn { weightKg?: number; age?: number; cardiac?: boolean; tsh?: number; currentDose?: number; pregnant?: boolean; trimester?: 1 | 2 | 3 }
export interface ThyroidPlan { start?: string; change?: string; target: string; recheck: string; notes: string[] }
const r25 = (x: number) => Math.max(12.5, Math.round(x / 12.5) * 12.5);
/** ATA and Endocrine Society practice: full replacement 1.6 µg/kg in the young and well, low and slow
 * over 60 or with heart disease; adjust by 12.5–25 µg every 6–8 weeks by TSH; +25–30% in pregnancy. */
export function thyroidPlan(t: ThyroidIn): ThyroidPlan {
  const notes = ["Take on an empty stomach, 30–60 minutes before breakfast, at the same time daily.", "Keep 4 hours apart from calcium, iron and antacids.", "Stay on the same brand where possible."];
  const target = t.pregnant ? (t.trimester === 1 || !t.trimester ? "TSH under 2.5 mIU/L (first trimester), or the lab's trimester range" : "TSH under 3.0 mIU/L, or the lab's trimester range") : (t.age ?? 0) >= 70 ? "TSH 1–6 mIU/L is acceptable in older people" : "TSH 0.5–2.5 mIU/L (within the reference range)";
  const recheck = t.pregnant ? "TSH every 4 weeks until 20 weeks, then at least once each trimester" : "TSH 6–8 weeks after starting or any change";
  if (t.currentDose && t.tsh !== undefined) {
    const d = t.currentDose;
    let change = "Keep the same dose.";
    const hi = t.pregnant ? (t.trimester === 1 || !t.trimester ? 2.5 : 3) : (t.age ?? 0) >= 70 ? 6 : 4.5;
    if (t.tsh > 10) change = `Increase to ${r25(d + 25)}–${r25(d + 50)} µg daily.`;
    else if (t.tsh > hi) change = `Increase to ${r25(d + (t.cardiac || (t.age ?? 0) >= 60 ? 12.5 : 25))} µg daily.`;
    else if (t.tsh < 0.1) change = `Reduce to ${r25(d - 25)} µg daily (TSH suppressed).`;
    else if (t.tsh < 0.4) change = `Reduce to ${r25(d - 12.5)} µg daily, especially if older or with heart disease or osteoporosis.`;
    if (t.pregnant && t.tsh <= hi) change = "Keep the same dose; many women need about 25–30% more as pregnancy goes on.";
    return { change, target, recheck, notes };
  }
  let start: string;
  if (t.pregnant) start = t.weightKg ? `Newly diagnosed overt hypothyroidism: about ${r25(t.weightKg * 1.6)} µg daily (1.6 µg/kg). Already on levothyroxine: add 2 extra tablets a week (about 25–30% more) as soon as pregnancy is confirmed.` : "Already on levothyroxine: add 2 extra tablets a week (about 25–30% more) as soon as pregnancy is confirmed.";
  else if (t.cardiac || (t.age ?? 0) >= 60) start = `Start low: ${t.cardiac ? "12.5–25" : "25–50"} µg daily, and increase by 12.5–25 µg every 6–8 weeks.`;
  else if (t.weightKg) start = `Full replacement: about ${r25(t.weightKg * 1.6)} µg daily (1.6 µg/kg).`;
  else start = "Enter the weight for the full replacement dose (1.6 µg/kg).";
  if (t.tsh !== undefined && !t.currentDose && t.tsh > 4.5 && t.tsh <= 10 && !t.pregnant) notes.unshift(`TSH ${t.tsh}: subclinical. Repeat in 6–12 weeks with free T4 and anti-TPO before treating; treat if symptomatic, planning pregnancy, or TSH stays above 10.`);
  return { start, target, recheck, notes };
}
