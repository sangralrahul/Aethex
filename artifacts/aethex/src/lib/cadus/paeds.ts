/**
 * Paediatrics on the device: weight-based doses computed from the formulary's
 * child dosing text, growth percentiles from WHO/IAP LMS tables (compact
 * anchors with interpolation), and India's National Immunisation Schedule
 * with due dates from the date of birth.
 */
import { DOSING, drugById, type Dosing } from "./formulary";

/* ------------------------------------------------------------------ weight-based dosing */

export interface ChildDoseCalc {
  id: string;
  name: string;
  rule: string;
  /** Each mg/kg figure found in the rule (a range gives two), computed for the weight. */
  doses: { perKg: number; mg: number; label: string }[];
  perDay: boolean;
  frequency: string;
  max?: string;
  note?: string;
}

const round = (v: number) => (v >= 100 ? Math.round(v / 5) * 5 : v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);

/** Parses "15 mg/kg every 4–6 h" or "25–45 mg/kg/day in 2–3 doses" into doses for a weight. Returns null when the rule is not weight-based. */
export function childDoseFor(d: Dosing, kg: number): ChildDoseCalc | null {
  if (!d.child || !(kg > 0)) return null;
  const m = /(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(mg|micrograms?|units?|mL)\/kg(\/day|\/h|\/min)?/i.exec(d.child);
  if (!m) return null;
  // Infusion rates (per hour or minute) are not single doses: leave them to the formulary text.
  if (m[4] && m[4] !== "/day") return null;
  const unit = m[3].toLowerCase().startsWith("microgram") ? "microgram" : m[3].toLowerCase() === "ml" ? "mL" : m[3].toLowerCase().startsWith("unit") ? "unit" : "mg";
  const lo = Number(m[1]), hi = m[2] ? Number(m[2]) : undefined;
  const perDay = !!m[4];
  const freq = /(every \d+(?:[–-]\d+)? ?h(?:ours)?|once daily|twice daily|three times daily|in \d(?:[–-]\d)? doses|single dose|stat|once)/i.exec(d.child)?.[0] ?? (perDay ? "per day, divided" : "per dose");
  const maxM = /max(?:imum)?\s*([^;,)]+)/i.exec(d.child + " " + (d.max ?? ""));
  // A numeric maximum in the same unit caps the computed figure (e.g. "max 4 g" caps mg).
  const capM = maxM ? /(\d+(?:\.\d+)?)\s*(g|mg|microgram|unit)/i.exec(maxM[1]) : null;
  const cap = capM ? Number(capM[1]) * (capM[2].toLowerCase() === "g" && unit === "mg" ? 1000 : 1) : Infinity;
  const capApplies = !!capM && ((capM[2].toLowerCase() === "g" && unit === "mg") || capM[2].toLowerCase() === unit);
  const mk = (perKg: number, label: string) => ({ perKg, mg: round(capApplies ? Math.min(perKg * kg, cap) : perKg * kg), label });
  const doses = hi ? [mk(lo, `${lo} ${unit}/kg`), mk(hi, `${hi} ${unit}/kg`)] : [mk(lo, `${lo} ${unit}/kg`)];
  const drug = drugById(d.id);
  return { id: d.id, name: drug?.genericName ?? d.id, rule: d.child, doses: doses.map((x) => ({ ...x, label: `${x.label}: ${x.mg} ${unit}` })), perDay, frequency: freq, ...(maxM ? { max: maxM[1].trim() } : {}), ...(d.tips ? { note: d.tips } : {}) };
}

export function allChildDoses(kg: number): ChildDoseCalc[] {
  return DOSING.map((d) => childDoseFor(d, kg)).filter((x): x is ChildDoseCalc => !!x).sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ growth (WHO 0–5, extended to 18 with IAP-like anchors) */

/** L, M, S anchors at ages in months; linear interpolation between them. Sources: WHO Child Growth Standards 2006 (0–60 months) and WHO 2007 reference (5–19 years), rounded. */
type LMS = [number, number, number];
type Table = { age: number; lms: LMS }[];

const W_BOYS: Table = [
  { age: 0, lms: [0.35, 3.35, 0.146] }, { age: 3, lms: [0.17, 6.38, 0.124] }, { age: 6, lms: [0.12, 7.93, 0.117] }, { age: 12, lms: [0.09, 9.65, 0.112] }, { age: 24, lms: [0.06, 12.15, 0.109] }, { age: 36, lms: [-0.08, 14.3, 0.113] }, { age: 48, lms: [-0.2, 16.3, 0.12] }, { age: 60, lms: [-0.3, 18.3, 0.13] },
  { age: 84, lms: [-0.5, 22.4, 0.15] }, { age: 108, lms: [-0.7, 28.0, 0.17] }, { age: 132, lms: [-0.8, 35.0, 0.19] }, { age: 156, lms: [-0.8, 44.5, 0.19] }, { age: 180, lms: [-0.7, 55.0, 0.17] }, { age: 216, lms: [-0.6, 64.0, 0.15] },
];
const W_GIRLS: Table = [
  { age: 0, lms: [0.38, 3.23, 0.142] }, { age: 3, lms: [0.19, 5.85, 0.127] }, { age: 6, lms: [0.14, 7.3, 0.122] }, { age: 12, lms: [0.1, 8.95, 0.118] }, { age: 24, lms: [0.06, 11.5, 0.116] }, { age: 36, lms: [-0.1, 13.9, 0.12] }, { age: 48, lms: [-0.2, 16.1, 0.13] }, { age: 60, lms: [-0.3, 18.2, 0.14] },
  { age: 84, lms: [-0.5, 22.0, 0.16] }, { age: 108, lms: [-0.7, 28.0, 0.18] }, { age: 132, lms: [-0.8, 36.0, 0.19] }, { age: 156, lms: [-0.8, 45.5, 0.18] }, { age: 180, lms: [-0.7, 52.0, 0.16] }, { age: 216, lms: [-0.6, 56.0, 0.15] },
];
const H_BOYS: Table = [
  { age: 0, lms: [1, 49.9, 0.038] }, { age: 3, lms: [1, 61.4, 0.035] }, { age: 6, lms: [1, 67.6, 0.034] }, { age: 12, lms: [1, 75.7, 0.035] }, { age: 24, lms: [1, 87.1, 0.037] }, { age: 36, lms: [1, 96.1, 0.04] }, { age: 48, lms: [1, 103.3, 0.042] }, { age: 60, lms: [1, 110.0, 0.043] },
  { age: 84, lms: [1, 121.7, 0.045] }, { age: 108, lms: [1, 132.6, 0.046] }, { age: 132, lms: [1, 143.1, 0.048] }, { age: 156, lms: [1, 156.0, 0.05] }, { age: 180, lms: [1, 169.0, 0.045] }, { age: 216, lms: [1, 176.1, 0.04] },
];
const H_GIRLS: Table = [
  { age: 0, lms: [1, 49.1, 0.038] }, { age: 3, lms: [1, 59.8, 0.036] }, { age: 6, lms: [1, 65.7, 0.035] }, { age: 12, lms: [1, 74.0, 0.036] }, { age: 24, lms: [1, 85.7, 0.038] }, { age: 36, lms: [1, 95.1, 0.041] }, { age: 48, lms: [1, 102.7, 0.043] }, { age: 60, lms: [1, 109.4, 0.044] },
  { age: 84, lms: [1, 120.8, 0.046] }, { age: 108, lms: [1, 132.5, 0.047] }, { age: 132, lms: [1, 145.0, 0.047] }, { age: 156, lms: [1, 156.4, 0.042] }, { age: 180, lms: [1, 161.7, 0.037] }, { age: 216, lms: [1, 163.1, 0.036] },
];

function lmsAt(t: Table, months: number): LMS {
  const m = Math.max(t[0].age, Math.min(t[t.length - 1].age, months));
  let i = 0;
  while (i < t.length - 2 && t[i + 1].age < m) i++;
  const a = t[i], b = t[i + 1];
  const f = (m - a.age) / (b.age - a.age);
  return [a.lms[0] + f * (b.lms[0] - a.lms[0]), a.lms[1] + f * (b.lms[1] - a.lms[1]), a.lms[2] + f * (b.lms[2] - a.lms[2])];
}
const zFrom = (x: number, [L, M, S]: LMS) => (Math.abs(L) < 1e-6 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S));
/** Standard normal CDF (Abramowitz-Stegun). */
export function percentile(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return Math.round((z > 0 ? 1 - p : p) * 1000) / 10;
}

export interface Growth {
  ageMonths: number;
  weightZ?: number; weightPct?: number;
  heightZ?: number; heightPct?: number;
  bmi?: number; bmiZ?: number; bmiPct?: number;
  /** A plain-language read: normal, underweight, stunted, overweight, etc. */
  flags: string[];
}

export function growth(sex: "boy" | "girl", ageMonths: number, kg?: number, cm?: number): Growth {
  const g: Growth = { ageMonths, flags: [] };
  const W = sex === "boy" ? W_BOYS : W_GIRLS, H = sex === "boy" ? H_BOYS : H_GIRLS;
  if (kg && kg > 0) { g.weightZ = Math.round(zFrom(kg, lmsAt(W, ageMonths)) * 100) / 100; g.weightPct = percentile(g.weightZ); }
  if (cm && cm > 0) { g.heightZ = Math.round(zFrom(cm, lmsAt(H, ageMonths)) * 100) / 100; g.heightPct = percentile(g.heightZ); }
  if (kg && cm && kg > 0 && cm > 0) {
    g.bmi = Math.round((kg / Math.pow(cm / 100, 2)) * 10) / 10;
    // BMI-for-age: use a simple approximation from the median tables (adequate for flags, not for research).
    const mW = lmsAt(W, ageMonths)[1], mH = lmsAt(H, ageMonths)[1];
    const mBmi = mW / Math.pow(mH / 100, 2);
    g.bmiZ = Math.round((Math.log(g.bmi / mBmi) / (ageMonths < 60 ? 0.085 : 0.13)) * 100) / 100;
    g.bmiPct = percentile(g.bmiZ);
  }
  if (g.weightZ !== undefined) {
    if (g.weightZ < -3) g.flags.push("Severely underweight (weight-for-age below −3 SD)");
    else if (g.weightZ < -2) g.flags.push("Underweight (weight-for-age below −2 SD)");
  }
  if (g.heightZ !== undefined) {
    if (g.heightZ < -3) g.flags.push("Severely stunted (height-for-age below −3 SD)");
    else if (g.heightZ < -2) g.flags.push("Stunted (height-for-age below −2 SD)");
  }
  if (g.bmiZ !== undefined) {
    if (g.bmiZ < -3) g.flags.push(ageMonths < 60 ? "Possible severe wasting (BMI-for-age below −3 SD): measure weight-for-height and MUAC, assess for SAM" : "Severe thinness (BMI-for-age below −3 SD)");
    else if (g.bmiZ < -2) g.flags.push(ageMonths < 60 ? "Possible wasting (BMI-for-age below −2 SD): measure weight-for-height and MUAC" : "Thinness (BMI-for-age below −2 SD)");
    else if (g.bmiZ > 2) g.flags.push(ageMonths < 60 ? "Overweight (BMI-for-age above +2 SD)" : "Obesity (BMI-for-age above +2 SD)");
    else if (g.bmiZ > 1 && ageMonths >= 60) g.flags.push("Overweight (BMI-for-age above +1 SD)");
  }
  if (!g.flags.length && (g.weightZ !== undefined || g.heightZ !== undefined)) g.flags.push("Growth within the normal range for age");
  return g;
}

export function ageInMonths(dob: string, at = new Date()): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const whole = (at.getFullYear() - d.getFullYear()) * 12 + (at.getMonth() - d.getMonth());
  const frac = at.getDate() < d.getDate() ? -1 + (30 - (d.getDate() - at.getDate())) / 30 : (at.getDate() - d.getDate()) / 30;
  return Math.max(0, whole + Math.max(-1, Math.min(0.99, frac)));
}

/* ------------------------------------------------------------------ National Immunisation Schedule (India, UIP 2024) */

export interface Vaccine { name: string; /** Age in weeks, months or years, as a number of days after birth. */ atDays: number; label: string; note?: string; /** The end of the usual window, in days after birth (default 28 days after atDays). */ untilDays?: number }
const W = 7, M = 30.44, Y = 365.25;
export const NIS: Vaccine[] = [
  { name: "BCG", atDays: 0, label: "At birth", note: "Up to 1 year if missed" }, { name: "OPV 0", atDays: 0, label: "At birth", note: "Within 15 days" }, { name: "Hepatitis B birth dose", atDays: 0, label: "At birth", note: "Within 24 hours" },
  { name: "OPV 1", atDays: 6 * W, label: "6 weeks" }, { name: "Pentavalent 1 (DPT-HepB-Hib)", atDays: 6 * W, label: "6 weeks" }, { name: "Rotavirus 1", atDays: 6 * W, label: "6 weeks" }, { name: "fIPV 1", atDays: 6 * W, label: "6 weeks" }, { name: "PCV 1", atDays: 6 * W, label: "6 weeks" },
  { name: "OPV 2", atDays: 10 * W, label: "10 weeks" }, { name: "Pentavalent 2", atDays: 10 * W, label: "10 weeks" }, { name: "Rotavirus 2", atDays: 10 * W, label: "10 weeks" },
  { name: "OPV 3", atDays: 14 * W, label: "14 weeks" }, { name: "Pentavalent 3", atDays: 14 * W, label: "14 weeks" }, { name: "Rotavirus 3", atDays: 14 * W, label: "14 weeks" }, { name: "fIPV 2", atDays: 14 * W, label: "14 weeks" }, { name: "PCV 2", atDays: 14 * W, label: "14 weeks" },
  { name: "MR 1", atDays: 9 * M, untilDays: 12 * M, label: "9–12 months" }, { name: "JE 1", atDays: 9 * M, untilDays: 12 * M, label: "9–12 months", note: "Endemic districts" }, { name: "PCV booster", atDays: 9 * M, label: "9 months" }, { name: "fIPV 3", atDays: 9 * M, label: "9 months" }, { name: "Vitamin A (1st)", atDays: 9 * M, label: "9 months", note: "Then every 6 months to 5 years" },
  { name: "DPT booster 1", atDays: 16 * M, untilDays: 24 * M, label: "16–24 months" }, { name: "OPV booster", atDays: 16 * M, untilDays: 24 * M, label: "16–24 months" }, { name: "MR 2", atDays: 16 * M, untilDays: 24 * M, label: "16–24 months" }, { name: "JE 2", atDays: 16 * M, untilDays: 24 * M, label: "16–24 months", note: "Endemic districts" },
  { name: "DPT booster 2", atDays: 5 * Y, untilDays: 6 * Y, label: "5–6 years" }, { name: "Td", atDays: 10 * Y, label: "10 years" }, { name: "Td", atDays: 16 * Y, label: "16 years" },
];

export interface VaccineDue extends Vaccine { due: Date; status: "due" | "overdue" | "upcoming" }

/** The schedule with dates from a date of birth, and whether each is upcoming, due now or overdue. */
export function schedule(dob: string, at = new Date()): VaccineDue[] {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return [];
  const age = (at.getTime() - d.getTime()) / 86400000;
  return NIS.map((v) => {
    const due = new Date(d.getTime() + v.atDays * 86400000);
    const status: VaccineDue["status"] = age < v.atDays - 7 ? "upcoming" : age <= (v.untilDays ?? v.atDays + 28) ? "due" : "overdue";
    return { ...v, due, status };
  });
}

/* ------------------------------------------------------------------ obstetrics */

export interface Dating { edd: Date; gaWeeks: number; gaDays: number; trimester: 1 | 2 | 3; weeksToGo: number }

/** EDD and gestational age from the LMP (Naegele) or from an ultrasound date and GA on that day. */
export function dating(opts: { lmp?: string; usgDate?: string; usgWeeks?: number; usgDays?: number; cycleDays?: number }, at = new Date()): Dating | null {
  let start: Date | null = null;
  if (opts.usgDate && opts.usgWeeks !== undefined) {
    const u = new Date(opts.usgDate);
    if (Number.isNaN(u.getTime())) return null;
    start = new Date(u.getTime() - ((opts.usgWeeks * 7) + (opts.usgDays ?? 0)) * 86400000);
  } else if (opts.lmp) {
    const l = new Date(opts.lmp);
    if (Number.isNaN(l.getTime())) return null;
    const adjust = (opts.cycleDays ?? 28) - 28;
    start = new Date(l.getTime() + adjust * 86400000);
  }
  if (!start) return null;
  const edd = new Date(start.getTime() + 280 * 86400000);
  const days = Math.floor((at.getTime() - start.getTime()) / 86400000);
  if (days < 0 || days > 320) return null;
  const gaWeeks = Math.floor(days / 7), gaDays = days % 7;
  return { edd, gaWeeks, gaDays, trimester: gaWeeks < 14 ? 1 : gaWeeks < 28 ? 2 : 3, weeksToGo: Math.max(0, 40 - gaWeeks) };
}

export const ANTENATAL: { weeks: string; what: string[] }[] = [
  { weeks: "Booking (before 12)", what: ["Registration (MCP card, PMSMA)", "Hb, blood group and Rh, HIV, HBsAg, VDRL, urine routine, blood sugar, TSH", "Dating ultrasound", "Folic acid 400 microgram daily (5 mg if high risk)", "Td/Tdap dose 1", "Weight, BP, history of risk factors"] },
  { weeks: "11–14", what: ["NT scan and first-trimester screening (dual marker) if available", "Start iron 60 mg + folic acid from 14 weeks (IFA 180 tablets through pregnancy)", "Calcium 500 mg twice daily from 14 weeks"] },
  { weeks: "18–20", what: ["Anomaly scan", "Td dose 2 (4 weeks after the first)", "BP, weight, fundal height, fetal heart"] },
  { weeks: "24–28", what: ["Oral glucose test (75 g, 2-hour, DIPSI) for gestational diabetes", "Hb repeat", "Anti-D at 28 weeks if Rh negative", "Danger signs explained: bleeding, headache, blurred vision, reduced movements, leaking"] },
  { weeks: "32", what: ["Growth scan if indicated", "BP, urine protein, Hb", "Birth preparedness: place, transport, blood donor, money"] },
  { weeks: "36", what: ["Presentation and lie; plan for breech", "Group B strep per local policy", "Discuss labour, breastfeeding, family planning"] },
  { weeks: "38–40", what: ["Weekly visits: BP, urine, fetal movements", "Membrane sweep at 40–41 weeks if offered", "Induction discussed by 41 weeks"] },
];
