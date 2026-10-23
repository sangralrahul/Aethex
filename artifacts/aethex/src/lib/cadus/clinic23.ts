/**
 * Update 23 (1.0.3) on the device: the vaccination scheduler (UIP and IAP) with a record for each
 * child, the insulin planner, blood transfusion doses, TB treatment under NTEP, calories and
 * protein for the diet chart, and a small store for saved ICD-10, consent and MLC drafts.
 * No AI in any of this; every rule is a published starting rule, for the doctor to adjust.
 */
import { NIS } from "./paeds";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const load = <T,>(key: string, fallback: T): T => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } };
const keep = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };
const DAY = 86400000;
const W = 7, M = 30.44, Y = 365.25;
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/* ------------------------------------------------------------------ vaccination */

export type VaxSchedule = "uip" | "iap";
export interface VaxDose { key: string; name: string; atDays: number; label: string; note?: string; untilDays?: number; /** No longer given after this age, in days. */ lastDays?: number }

const withKeys = (l: Omit<VaxDose, "key">[]): VaxDose[] => l.map((v) => ({ ...v, key: `${v.name}@${Math.round(v.atDays)}` }));

/** India's Universal Immunisation Programme, from the paediatrics module, with the age limits for catching up. */
export const UIP: VaxDose[] = withKeys(NIS.map((v) => ({
  ...v,
  lastDays: v.name === "BCG" ? Y : v.name === "OPV 0" ? 15 : v.name.startsWith("Hepatitis B birth") ? 1 : /^Rotavirus/.test(v.name) ? Y : /^Pentavalent/.test(v.name) ? Y : /^MR /.test(v.name) ? 5 * Y : /^JE /.test(v.name) ? 15 * Y : undefined,
})));

/** The IAP (ACVIP) schedule for children seen privately. Brand-specific details are in the notes. */
export const IAP: VaxDose[] = withKeys([
  { name: "BCG", atDays: 0, label: "Birth" }, { name: "OPV 0", atDays: 0, label: "Birth", lastDays: 15 }, { name: "Hepatitis B 1", atDays: 0, label: "Birth" },
  ...["DTwP/DTaP", "IPV", "Hib", "Hepatitis B", "Rotavirus", "PCV"].flatMap((n) => [6, 10, 14].map((w, i) => ({ name: `${n} ${n === "Hepatitis B" ? i + 2 : i + 1}`, atDays: w * W, label: `${w} weeks`, ...(n === "Rotavirus" ? { lastDays: 8 * M, note: i === 2 ? "Third dose only for three-dose brands" : undefined } : {}) }))),
  { name: "Influenza 1", atDays: 6 * M, label: "6 months", note: "Two doses 4 weeks apart the first time, then once a year" }, { name: "Influenza 2", atDays: 7 * M, label: "7 months" },
  { name: "Typhoid conjugate", atDays: 6 * M, untilDays: 9 * M, label: "6–9 months" },
  { name: "MMR 1", atDays: 9 * M, label: "9 months" },
  { name: "Hepatitis A 1", atDays: 12 * M, label: "12 months", note: "One dose of live vaccine, or two of inactivated" },
  { name: "PCV booster", atDays: 12 * M, untilDays: 15 * M, label: "12–15 months" },
  { name: "MMR 2", atDays: 15 * M, label: "15 months" }, { name: "Varicella 1", atDays: 15 * M, label: "15 months" },
  { name: "DTwP/DTaP booster 1", atDays: 16 * M, untilDays: 18 * M, label: "16–18 months" }, { name: "Hib booster", atDays: 16 * M, untilDays: 18 * M, label: "16–18 months" }, { name: "IPV booster", atDays: 16 * M, untilDays: 18 * M, label: "16–18 months" },
  { name: "Hepatitis A 2", atDays: 18 * M, untilDays: 19 * M, label: "18–19 months", note: "Inactivated vaccine only" }, { name: "Varicella 2", atDays: 18 * M, untilDays: 19 * M, label: "18–19 months", note: "At least 3 months after the first" },
  { name: "DTwP/DTaP booster 2", atDays: 4 * Y, untilDays: 6 * Y, label: "4–6 years" }, { name: "MMR 3", atDays: 4 * Y, untilDays: 6 * Y, label: "4–6 years" },
  { name: "HPV 1", atDays: 9 * Y, untilDays: 14 * Y, label: "9–14 years", note: "Two doses 6 months apart under 15 years" }, { name: "HPV 2", atDays: 9.5 * Y, untilDays: 14.5 * Y, label: "6 months later" },
  { name: "Tdap", atDays: 10 * Y, untilDays: 12 * Y, label: "10–12 years" }, { name: "Td", atDays: 16 * Y, untilDays: 18 * Y, label: "16–18 years" },
]);

export interface Child { id: string; code: string; dob: string; sex: "M" | "F" | ""; schedule: VaxSchedule; /** Dose key to the date it was given (yyyy-mm-dd). */ given: Record<string, string>; createdAt: number; updatedAt: number }
export const CHILDREN_KEY = "cadus3.vaxkids";
export const readChildren = (): Child[] => (load<Child[]>(CHILDREN_KEY, []) || []).filter((c) => c && typeof c.id === "string" && typeof c.dob === "string").slice(0, 1000);
export const saveChildren = (l: Child[]) => keep(CHILDREN_KEY, l.slice(0, 1000));
export const newChild = (f: Partial<Child> = {}, now = Date.now()): Child => ({ id: uid(), code: "", dob: "", sex: "", schedule: "uip", given: {}, createdAt: now, updatedAt: now, ...f });

export type VaxStatus = "given" | "upcoming" | "due" | "overdue" | "missed";
export interface VaxRow extends VaxDose { due: Date; status: VaxStatus; givenOn?: string }
export const dosesFor = (s: VaxSchedule) => (s === "iap" ? IAP : UIP);

/** Every dose for the child with its date and status on the day given. */
export function vaxRows(c: Child, at = new Date()): VaxRow[] {
  const d = new Date(`${c.dob}T00:00:00`);
  if (Number.isNaN(d.getTime())) return [];
  const age = (at.getTime() - d.getTime()) / DAY;
  return dosesFor(c.schedule).map((v) => {
    const due = new Date(d.getTime() + v.atDays * DAY);
    const givenOn = c.given[v.key];
    const status: VaxStatus = givenOn ? "given"
      : v.lastDays !== undefined && age > v.lastDays ? "missed"
      : age < v.atDays - 7 ? "upcoming"
      : age <= (v.untilDays ?? v.atDays + 28) ? "due" : "overdue";
    return { ...v, due, status, givenOn };
  });
}

/** What to give at the next visit: everything due or overdue now, or else the next group of doses. */
export function nextVisit(c: Child, at = new Date()): { date: Date; doses: VaxRow[] } | null {
  const rows = vaxRows(c, at);
  const now = rows.filter((r) => r.status === "due" || r.status === "overdue");
  if (now.length) return { date: at, doses: now };
  const up = rows.filter((r) => r.status === "upcoming").sort((a, b) => a.due.getTime() - b.due.getTime());
  if (!up.length) return null;
  const first = up[0].due.getTime();
  return { date: up[0].due, doses: up.filter((r) => r.due.getTime() - first < 7 * DAY) };
}

export const vaxCounts = (rows: VaxRow[]) => rows.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] ?? 0) + 1 }), {} as Partial<Record<VaxStatus, number>>);

export function vaxCardMarkdown(c: Child, at = new Date()): string {
  const rows = vaxRows(c, at);
  const STATUS: Record<VaxStatus, string> = { given: "Given", upcoming: "", due: "**Due now**", overdue: "**Overdue**", missed: "Not given (past the age limit)" };
  const nv = nextVisit(c, at);
  return [
    `# Vaccination card`,
    `**${c.code || "Child"}** · born ${fmt(new Date(`${c.dob}T00:00:00`))}${c.sex ? ` · ${c.sex === "F" ? "girl" : "boy"}` : ""} · ${c.schedule === "iap" ? "IAP schedule" : "National schedule (UIP)"}`,
    nv ? `\n**Next visit: ${nv.date.getTime() <= at.getTime() ? "as soon as possible" : fmt(nv.date)}** for ${nv.doses.map((d) => d.name).join(", ")}` : "",
    "", "| Age | Vaccine | Due on | Given on |", "|---|---|---|---|",
    ...rows.map((r) => `| ${r.label} | ${r.name}${r.note ? ` (${r.note})` : ""} | ${fmt(r.due)} | ${r.givenOn ? fmt(new Date(`${r.givenOn}T00:00:00`)) : STATUS[r.status]} |`),
    "", "_Bring this card to every visit. A missed dose is given at the next visit; the series does not need to be restarted._",
  ].filter((x) => x !== undefined).join("\n");
}

export function vaxReminder(c: Child, at = new Date(), clinic = ""): string {
  const nv = nextVisit(c, at);
  if (!nv) return "";
  const when = nv.date.getTime() <= at.getTime() ? "now (they are due)" : `on ${fmt(nv.date)}`;
  return `Vaccination reminder${clinic ? ` from ${clinic}` : ""}: ${c.code || "your child"} should get ${nv.doses.map((d) => d.name).join(", ")} ${when}. Please bring the vaccination card.`;
}

/* ------------------------------------------------------------------ insulin */

export type InsulinRegimen = "basal" | "basal-bolus" | "premix";
export type Sensitivity = "sensitive" | "standard" | "resistant";
export interface InsulinPlan { tdd: number; basal: number; meals: [number, number, number]; premix: { am: number; pm: number }; icr: number; isf: number; correction: { range: string; add: string }[]; titration: string[]; perKg: number }

const r1 = (x: number) => Math.max(0, Math.round(x));
/**
 * Starting doses: basal alone 0.1, 0.15 or 0.2 U/kg; total daily dose 0.3 (age over 70, eGFR under
 * 30, poor intake), 0.4 or 0.5 U/kg (obesity, steroids), half basal and half split over three meals;
 * premix two-thirds before breakfast and one-third before dinner. ICR = 500/TDD, ISF = 1800/TDD.
 */
export function insulinPlan(weightKg: number, regimen: InsulinRegimen, sens: Sensitivity = "standard"): InsulinPlan | null {
  if (!(weightKg >= 3 && weightKg <= 300)) return null;
  const perKg = regimen === "basal" ? { sensitive: 0.1, standard: 0.15, resistant: 0.2 }[sens] : { sensitive: 0.3, standard: 0.4, resistant: 0.5 }[sens];
  const tdd = r1(weightKg * perKg);
  const basal = regimen === "basal" ? tdd : regimen === "basal-bolus" ? r1(tdd / 2) : 0;
  const meal = regimen === "basal-bolus" ? r1(tdd / 6) : 0;
  const premix = regimen === "premix" ? { am: r1((tdd * 2) / 3), pm: tdd - r1((tdd * 2) / 3) } : { am: 0, pm: 0 };
  const full = regimen === "basal" ? Math.max(tdd * 2, 1) : Math.max(tdd, 1);
  const icr = Math.round(500 / full), isf = Math.max(10, Math.round(1800 / full / 5) * 5);
  const correction = [0, 1, 2, 3].map((k) => ({ range: `${151 + k * isf}–${150 + (k + 1) * isf} mg/dL`, add: `+${k + 1} unit${k ? "s" : ""}` }));
  correction.push({ range: `over ${150 + 4 * isf} mg/dL`, add: "+5 units and tell the doctor; check ketones in type 1" });
  const titration = regimen === "basal" ? [
    "Check fasting sugar every morning.",
    "If the fasting sugar is above 130 mg/dL for 3 days in a row, add 2 units (4 units if above 180).",
    "If any sugar is below 80, or there is a hypo (below 70), reduce the dose by 10–20% (about 4 units) and find the cause.",
    "Once the dose is more than about 0.5 U/kg and the HbA1c is still high, add mealtime insulin rather than more basal.",
  ] : regimen === "basal-bolus" ? [
    "Adjust basal by the fasting sugar: 2 units more if above 140 for 2–3 days; 10–20% less after any hypo.",
    "Adjust each meal dose by the sugar before the next meal (or bedtime): 1–2 units more if above 180; 1–2 units less if below 100.",
    "If not eating, hold the meal dose but keep the basal (reduce by 20% if intake is poor).",
  ] : [
    "Adjust the morning dose by the pre-dinner sugar, and the evening dose by the next fasting sugar.",
    "2 units more if consistently above 140 (fasting) or 180 (pre-dinner); 10–20% less after any hypo.",
    "Premix must be taken with a meal within 30 minutes (human premix) or just before it (analogue premix).",
  ];
  return { tdd: regimen === "basal" ? basal : tdd, basal, meals: [meal, meal, meal], premix, icr, isf, correction, titration, perKg };
}

/* ------------------------------------------------------------------ transfusion */

export type BloodProduct = "prbc" | "platelets" | "ffp" | "cryo";
export interface TransfusionDose { amount: string; detail: string[]; rate: string; storage: string }

export function transfusionDose(p: BloodProduct, weightKg: number, child: boolean, o: { hb?: number; targetHb?: number } = {}): TransfusionDose | null {
  if (!(weightKg >= 0.5 && weightKg <= 250)) return null;
  if (p === "prbc") {
    const rise = o.hb !== undefined && o.targetHb !== undefined && o.targetHb > o.hb ? o.targetHb - o.hb : child ? 3 : 1;
    if (child) {
      const ml = Math.min(Math.round(weightKg * rise * 4), Math.round(weightKg * 20));
      return { amount: `${ml} ml packed red cells`, detail: [`Volume = weight × rise in Hb (g/dL) × 4 = ${weightKg} × ${rise.toFixed(1)} × 4, capped at 20 ml/kg.`, "10–15 ml/kg raises the Hb by about 2–3 g/dL."], rate: "Over 3–4 hours (about 5 ml/kg/hour); slower, with furosemide if needed, in heart failure or severe chronic anaemia.", storage: "Start within 30 minutes of leaving the blood-bank fridge; finish within 4 hours." };
    }
    const units = Math.max(1, Math.ceil(rise));
    return { amount: `${units} unit${units > 1 ? "s" : ""} of packed red cells`, detail: ["One unit raises the Hb by about 1 g/dL (haematocrit by about 3%) in an average adult.", "Give one unit at a time and recheck the Hb unless bleeding."], rate: "Slowly for the first 15 minutes while watching closely, then over 1.5–3 hours; each unit within 4 hours.", storage: "Start within 30 minutes of leaving the blood-bank fridge; finish within 4 hours." };
  }
  if (p === "platelets") {
    const rdp = Math.max(1, Math.round(weightKg / 10));
    return child
      ? { amount: `${Math.round(weightKg * 10)}–${Math.round(weightKg * 15)} ml (about ${rdp} random-donor unit${rdp > 1 ? "s" : ""})`, detail: ["10–15 ml/kg raises the count by about 50,000/µL."], rate: "Over 30–60 minutes.", storage: "Kept at 20–24 °C on an agitator; never refrigerate. Use a fresh standard set." }
      : { amount: `1 single-donor (apheresis) unit, or ${Math.min(6, Math.max(4, rdp))} random-donor units`, detail: ["One apheresis unit or 4–6 random-donor units raise the count by about 20,000–40,000/µL.", "Check a count 10–60 minutes after to look for refractoriness."], rate: "Each unit over 30 minutes.", storage: "Kept at 20–24 °C on an agitator; never refrigerate. Use a fresh standard set." };
  }
  if (p === "ffp") {
    const lo = Math.round(weightKg * 10), hi = Math.round(weightKg * 15);
    return { amount: `${lo}–${hi} ml (about ${Math.max(1, Math.round(lo / 200))}–${Math.max(1, Math.round(hi / 200))} units of about 200 ml)`, detail: ["10–15 ml/kg raises clotting factors by about 15–20%.", "For warfarin reversal, use vitamin K and prothrombin complex concentrate if available."], rate: "10–20 ml/kg/hour; faster in major bleeding.", storage: "Thaw at 37 °C; use within 6 hours of thawing (24 hours if kept at 2–6 °C)." };
  }
  const units = Math.max(1, Math.round(weightKg / 10));
  return { amount: `${units} unit${units > 1 ? "s" : ""} of cryoprecipitate`, detail: ["1 unit per 10 kg raises fibrinogen by about 0.5–1 g/L.", "Give if fibrinogen is below 1.5 g/L with bleeding (below 2 g/L in obstetric haemorrhage)."], rate: "As fast as tolerated, each unit over about 10–15 minutes.", storage: "Thaw at 37 °C and use within 4–6 hours." };
}

export const TRANSFUSION_THRESHOLDS: { product: string; when: string }[] = [
  { product: "Red cells", when: "Hb below 7 g/dL in most stable adults; below 8 g/dL with heart disease or for orthopaedic or cardiac surgery; any level with active bleeding and instability." },
  { product: "Red cells (children)", when: "Hb below 7 g/dL in stable children; severe anaemia with signs of failure or shock at any level." },
  { product: "Platelets", when: "Below 10,000/µL to prevent bleeding; below 20,000 with fever or sepsis; below 50,000 for surgery, a central line or lumbar puncture, or with bleeding; below 100,000 for neurosurgery or eye surgery." },
  { product: "Fresh frozen plasma", when: "Bleeding, or before a procedure, with INR or aPTT over 1.5 times normal; massive transfusion; TTP (plasma exchange). Not to correct an INR without bleeding." },
  { product: "Cryoprecipitate", when: "Fibrinogen below 1.5 g/L with bleeding (below 2 g/L in obstetric haemorrhage); DIC with low fibrinogen." },
];

export const REACTION_STEPS = [
  "STOP the transfusion. Keep the IV line open with normal saline through a new set.",
  "Check the patient's identity against the bag and the form at the bedside again.",
  "Check temperature, pulse, BP, breathing and SpO₂; look for urticaria, wheeze, loin or chest pain, dark urine and bleeding from the drip site.",
  "Mild (itching or hives only, stable): antihistamine; restart slowly only if the bag and identity are correct and there are no other signs.",
  "Fever without other signs: paracetamol; don't restart that unit if the temperature rose by 2 °C or more, or with rigors.",
  "Anaphylaxis: adrenaline 0.5 mg IM (0.01 mg/kg in children), oxygen and fluids.",
  "Breathless with crackles and high BP (TACO): sit up, oxygen, furosemide. Breathless with low BP and fever within 6 hours (TRALI): oxygen and support; no diuretic.",
  "Suspected haemolytic reaction or sepsis: treat shock, send blood cultures, and inform the blood bank immediately.",
  "Send the bag with the set, fresh blood samples (EDTA and clotted) and the first urine to the blood bank with the reaction form.",
  "Record it in the case sheet and report it to the blood bank for haemovigilance (HvPI).",
];

/* ------------------------------------------------------------------ TB under NTEP */

export type TbSite = "pulmonary" | "extrapulmonary" | "cns" | "bone";
export interface TbPlan { band: string; tablets: number; ipEnd: Date; end: Date; months: number; visits: { date: Date; what: string }[]; notes: string[] }

/** NTEP adult weight bands for the daily fixed-dose combination (HRZE 75/150/400/275 in the intensive phase, HRE in continuation). */
export const TB_BANDS: { from: number; to: number; tablets: number }[] = [
  { from: 25, to: 34, tablets: 2 }, { from: 35, to: 49, tablets: 3 }, { from: 50, to: 64, tablets: 4 }, { from: 65, to: 75, tablets: 5 }, { from: 75.01, to: 999, tablets: 6 },
];

export function tbPlan(weightKg: number, start: string, site: TbSite): TbPlan | null {
  const s = new Date(`${start}T00:00:00`);
  if (Number.isNaN(s.getTime()) || !(weightKg >= 25 && weightKg <= 250)) return null;
  const b = TB_BANDS.find((x) => weightKg >= x.from && weightKg <= x.to) ?? TB_BANDS.at(-1)!;
  const months = site === "cns" || site === "bone" ? 12 : 6;
  const ipEnd = new Date(s.getTime() + 56 * DAY);
  // 8 weeks of HRZE, then 16 weeks of HRE (24 weeks), or 10 months of HRE for CNS and bone TB.
  const end = new Date(ipEnd.getTime() + (months === 12 ? Math.round(10 * M) : 16 * W) * DAY);
  const visits = [
    { date: s, what: "Start; notify on Ni-kshay; baseline tests (HIV, blood sugar, drug-susceptibility test by NAAT), weight; counsel; screen household contacts" },
    ...Array.from({ length: months }, (_, i) => ({ date: new Date(s.getTime() + Math.round((i + 1) * M) * DAY), what: "Monthly review: adherence, weight (change the band if needed), side effects" })),
    { date: ipEnd, what: "End of the intensive phase: sputum smear (pulmonary); start the continuation phase (HRE)" },
    { date: end, what: "End of treatment: sputum for pulmonary TB; record the outcome; follow up at 6, 12, 18 and 24 months" },
  ].sort((a, b2) => a.date.getTime() - b2.date.getTime());
  const notes = [
    `${b.tablets} tablets of the 4-drug FDC (HRZE) daily for 8 weeks, then ${b.tablets} tablets of the 3-drug FDC (HRE) daily for ${months === 12 ? "10 months" : "16 weeks"}.`,
    "Give pyridoxine to prevent neuropathy, especially with diabetes, HIV, alcohol use, malnutrition or pregnancy.",
    "Check liver function at baseline if there is liver disease, alcohol use, HIV or old age; stop all drugs if jaundice or ALT over 3 times normal with symptoms (5 times without).",
    "Offer TB preventive treatment (for example 3HP or 6H) to household contacts once active TB is ruled out.",
    "Every notified patient is entitled to the Ni-kshay Poshan Yojana nutrition support.",
  ];
  if (months === 12) notes.unshift("CNS and bone or joint TB: the continuation phase is extended to 10 months (12 months in all); steroids for TB meningitis.");
  return { band: b.to > 900 ? "over 75 kg" : `${b.from === 75.01 ? 75 : b.from}–${b.to} kg`, tablets: b.tablets, ipEnd, end, months, visits, notes };
}

export function tbCardMarkdown(code: string, weightKg: number, start: string, site: TbSite): string {
  const p = tbPlan(weightKg, start, site);
  if (!p) return "";
  return [
    `# TB treatment card`, `**${code || "Patient"}** · ${weightKg} kg (band ${p.band}) · started ${fmt(new Date(`${start}T00:00:00`))} · ${p.months} months`,
    "", `**Tablets each day: ${p.tablets}**`, "", "| Date | What happens |", "|---|---|",
    ...p.visits.map((v) => `| ${fmt(v.date)} | ${v.what} |`), "", ...p.notes.map((n) => `- ${n}`),
    "", "_Take the tablets every day, on an empty stomach if possible. Don't stop when you feel better. Come back at once for yellow eyes, vomiting, rash, or changes in eyesight._",
  ].join("\n");
}

/* ------------------------------------------------------------------ diet chart: calories and protein */

export type Activity = "bed" | "light" | "moderate" | "heavy";
export interface EnergyIn { sex: "M" | "F"; age: number; weightKg: number; heightCm: number; activity: Activity; goal: "maintain" | "lose" | "gain"; pregnancy?: "" | "t1" | "t2" | "t3" | "lactation"; renal?: "" | "ckd" | "dialysis" }

/** Mifflin-St Jeor, an activity factor, the goal, and pregnancy or lactation (ICMR-NIN additions). */
export function energyNeeds(e: EnergyIn): { kcal: number; protein: number; bmi: number; ibw: number } | null {
  if (!(e.weightKg >= 20 && e.weightKg <= 300 && e.heightCm >= 100 && e.heightCm <= 230 && e.age >= 12 && e.age <= 110)) return null;
  const bmr = 10 * e.weightKg + 6.25 * e.heightCm - 5 * e.age + (e.sex === "M" ? 5 : -161);
  let kcal = bmr * { bed: 1.2, light: 1.375, moderate: 1.55, heavy: 1.725 }[e.activity];
  kcal += e.goal === "lose" ? -500 : e.goal === "gain" ? 300 : 0;
  kcal += e.pregnancy === "t2" || e.pregnancy === "t3" ? 350 : e.pregnancy === "lactation" ? 600 : 0;
  const ibw = Math.round((e.heightCm - 100) * 0.9);
  const ref = Math.min(e.weightKg, Math.max(ibw, 35));
  let protein = ref * (e.renal === "ckd" ? 0.6 : e.renal === "dialysis" ? 1.2 : 1.0);
  if (e.pregnancy && e.pregnancy !== "t1") protein += e.pregnancy === "lactation" ? 15 : 10;
  return { kcal: Math.round(Math.min(4000, Math.max(1000, kcal)) / 50) * 50, protein: Math.round(protein), bmi: Math.round((e.weightKg / (e.heightCm / 100) ** 2) * 10) / 10, ibw };
}

/* ------------------------------------------------------------------ saved drafts (ICD-10, consent, MLC, diet) */

export type Draft23Kind = "icd" | "consent" | "mlc" | "diet";
export interface Draft23 { id: string; kind: Draft23Kind; title: string; at: number; data: unknown }
const DRAFTS_KEY = "cadus3.drafts23";
export const readDrafts23 = (kind?: Draft23Kind): Draft23[] => (load<Draft23[]>(DRAFTS_KEY, []) || []).filter((d) => d && typeof d.id === "string" && (!kind || d.kind === kind));
export function saveDraft23(kind: Draft23Kind, title: string, data: unknown, now = Date.now()): Draft23 {
  const d: Draft23 = { id: uid(), kind, title: title.slice(0, 160), at: now, data };
  const all = readDrafts23();
  // Keep the newest 30 of each kind.
  const mine = [d, ...all.filter((x) => x.kind === kind)].slice(0, 30);
  keep(DRAFTS_KEY, [...mine, ...all.filter((x) => x.kind !== kind)]);
  return d;
}
export const deleteDraft23 = (id: string) => keep(DRAFTS_KEY, readDrafts23().filter((d) => d.id !== id));
export { iso as isoDate };
