/**
 * Update 24 on the device: the antenatal care tracker, ventilator starting settings and ABG-based
 * adjustment, clinic bills and receipts, rabies post-exposure prophylaxis, needle-stick injury,
 * IMNCI sick-child classification and CME credits. No AI in any of this; every rule is a
 * published starting rule (national programme or standard guideline) for the doctor to apply.
 */
import { ANTENATAL, dating } from "./paeds";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const load = <T,>(key: string, fallback: T): T => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } };
const keep = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };
const DAY = 86400000;
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^\d.\-]/g, "")); return String(v ?? "").trim() !== "" && Number.isFinite(n) ? n : undefined; };
export const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const isoDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const local = (s: string) => new Date(`${s}T00:00:00`);

/* ------------------------------------------------------------------ antenatal care */

export interface AncVisit { id: string; date: string; weight: string; bp: string; hb: string; urineAlb: string; urineSugar: string; fh: string; fhr: string; notes: string }
export interface Pregnancy { id: string; code: string; age: string; lmp: string; usgDate: string; usgWeeks: string; gravida: string; para: string; bloodGroup: string; risks: string; visits: AncVisit[]; createdAt: number; updatedAt: number }
export const ANC_KEY = "cadus3.anc";
export const readPregnancies = (): Pregnancy[] => (load<Pregnancy[]>(ANC_KEY, []) || []).filter((p) => p && typeof p.id === "string" && Array.isArray(p.visits)).slice(0, 1000);
export const savePregnancies = (l: Pregnancy[]) => keep(ANC_KEY, l.slice(0, 1000));
export const newPregnancy = (f: Partial<Pregnancy> = {}, now = Date.now()): Pregnancy => ({ id: uid(), code: "", age: "", lmp: "", usgDate: "", usgWeeks: "", gravida: "", para: "", bloodGroup: "", risks: "", visits: [], createdAt: now, updatedAt: now, ...f });
export const newAncVisit = (f: Partial<AncVisit> = {}): AncVisit => ({ id: uid(), date: isoDay(new Date()), weight: "", bp: "", hb: "", urineAlb: "", urineSugar: "", fh: "", fhr: "", notes: "", ...f });

/** Dating from an early scan when there is one (it wins over the LMP), else from the LMP. */
export function ancDating(p: Pregnancy, at = new Date()) {
  const w = num(p.usgWeeks);
  if (p.usgDate && w !== undefined) return dating({ usgDate: `${p.usgDate}T00:00:00`, usgWeeks: Math.floor(w), usgDays: Math.round((w % 1) * 7) }, at);
  return p.lmp ? dating({ lmp: `${p.lmp}T00:00:00` }, at) : null;
}
export const gaAt = (p: Pregnancy, date: string) => { const d = ancDating(p, local(date)); return d ? `${d.gaWeeks}+${d.gaDays}` : ""; };

export interface AncFlag { level: "high" | "watch"; text: string }
/** Risk flags from the booking details and every visit. */
export function ancFlags(p: Pregnancy): AncFlag[] {
  const f: AncFlag[] = [];
  const age = num(p.age);
  if (age !== undefined && (age < 18 || age > 35)) f.push({ level: "watch", text: `Age ${age}: ${age < 18 ? "adolescent" : "older mother"} pregnancy` });
  if (/neg|-ve|−/i.test(p.bloodGroup)) f.push({ level: "watch", text: "Rh negative: indirect Coombs test, anti-D at 28 weeks and after delivery if the baby is Rh positive" });
  if (num(p.gravida) !== undefined && num(p.gravida)! >= 5) f.push({ level: "watch", text: "Grand multipara" });
  if (/lscs|caesarean|c-section|previous cs/i.test(p.risks)) f.push({ level: "watch", text: "Previous caesarean: plan the place of delivery" });
  const visits = [...p.visits].sort((a, b) => a.date.localeCompare(b.date));
  for (const v of visits) {
    const [s, d] = (v.bp.match(/(\d{2,3})\s*\/\s*(\d{2,3})/) ?? []).slice(1).map(Number);
    const ga = gaAt(p, v.date);
    if (s >= 160 || d >= 110) f.push({ level: "high", text: `${v.date}: BP ${v.bp}, severe range: treat now and refer` });
    else if (s >= 140 || d >= 90) f.push({ level: "high", text: `${v.date}: BP ${v.bp}${Number(ga.split("+")[0]) >= 20 ? ", hypertension after 20 weeks: check urine protein for pre-eclampsia" : ""}` });
    const hb = num(v.hb);
    if (hb !== undefined && hb < 7) f.push({ level: "high", text: `${v.date}: Hb ${hb}, severe anaemia: refer for evaluation and treatment` });
    else if (hb !== undefined && hb < 11) f.push({ level: "watch", text: `${v.date}: Hb ${hb}, anaemia (${hb < 10 ? "moderate" : "mild"}): iron, and IV iron if moderate in the second or third trimester` });
    if (/\+|trace|present/i.test(v.urineAlb)) f.push({ level: (s >= 140 || d >= 90) ? "high" : "watch", text: `${v.date}: urine albumin ${v.urineAlb}` });
    if (/\+|present/i.test(v.urineSugar)) f.push({ level: "watch", text: `${v.date}: urine sugar ${v.urineSugar}: test for gestational diabetes` });
    const fhr = num(v.fhr);
    if (fhr !== undefined && (fhr < 110 || fhr > 160)) f.push({ level: "high", text: `${v.date}: fetal heart ${fhr}/min (normal 110–160)` });
  }
  for (let i = 1; i < visits.length; i++) {
    const w0 = num(visits[i - 1].weight), w1 = num(visits[i].weight);
    const days = (local(visits[i].date).getTime() - local(visits[i - 1].date).getTime()) / DAY;
    if (w0 !== undefined && w1 !== undefined && days >= 7 && (w1 - w0) / (days / 7) > 1) f.push({ level: "watch", text: `${visits[i].date}: weight up ${(w1 - w0).toFixed(1)} kg in ${Math.round(days / 7)} weeks: check for oedema and BP` });
  }
  return f;
}

/** What is due now and next, from the national antenatal schedule. */
export function ancDue(p: Pregnancy, at = new Date()): { now: (typeof ANTENATAL)[number] | null; next: (typeof ANTENATAL)[number] | null; ga: string; edd: Date | null } {
  const d = ancDating(p, at);
  if (!d) return { now: null, next: null, ga: "", edd: null };
  const starts = [0, 11, 18, 24, 32, 36, 38];
  let i = starts.length - 1;
  while (i > 0 && d.gaWeeks < starts[i]) i--;
  return { now: ANTENATAL[i], next: ANTENATAL[i + 1] ?? null, ga: `${d.gaWeeks}+${d.gaDays}`, edd: d.edd };
}

export function ancCardMarkdown(p: Pregnancy, at = new Date()): string {
  const d = ancDue(p, at);
  const flags = ancFlags(p);
  return [
    "# Antenatal card",
    `**${p.code || "Mother"}**${p.age ? ` · ${p.age} years` : ""}${p.gravida ? ` · G${p.gravida}P${p.para || 0}` : ""}${p.bloodGroup ? ` · ${p.bloodGroup}` : ""}`,
    d.edd ? `**Expected date of delivery: ${fmtDate(d.edd)}** · today ${d.ga} weeks` : "",
    p.risks ? `Risk factors: ${p.risks}` : "",
    "", "| Date | Weeks | Weight | BP | Hb | Urine alb/sugar | Fundal ht | FHR |", "|---|---|---|---|---|---|---|---|",
    ...[...p.visits].sort((a, b) => a.date.localeCompare(b.date)).map((v) => `| ${fmtDate(local(v.date))} | ${gaAt(p, v.date)} | ${v.weight} | ${v.bp} | ${v.hb} | ${v.urineAlb || "–"}/${v.urineSugar || "–"} | ${v.fh} | ${v.fhr} |`),
    flags.length ? `\n**To watch:**\n${flags.map((x) => `- ${x.text}`).join("\n")}` : "",
    d.next ? `\n**Next (${d.next.weeks} weeks):** ${d.next.what.join("; ")}` : "",
    "\n_Come at once for bleeding, leaking water, severe headache or blurred vision, fits, high fever, or the baby moving less._",
  ].filter((x) => x !== "").join("\n");
}

/* ------------------------------------------------------------------ ventilator */

export type VentLung = "normal" | "ards" | "obstructive";
/** Predicted body weight (ARDSnet). */
export const pbw = (sex: "M" | "F", heightCm: number) => Math.round(((sex === "M" ? 50 : 45.5) + 0.91 * (heightCm - 152.4)) * 10) / 10;
/** ARDSnet lower-PEEP/higher-FiO2 table. */
export const PEEP_TABLE: [number, number][] = [[0.3, 5], [0.4, 5], [0.4, 8], [0.5, 8], [0.5, 10], [0.6, 10], [0.7, 10], [0.7, 12], [0.7, 14], [0.8, 14], [0.9, 14], [0.9, 16], [0.9, 18], [1.0, 18], [1.0, 20], [1.0, 22], [1.0, 24]];

export interface VentStart { pbw: number; vt: number; vtRange: string; rr: number; peep: number; fio2: number; ie: string; mode: string; notes: string[] }
export function ventStart(sex: "M" | "F", heightCm: number, lung: VentLung): VentStart | null {
  if (!(heightCm >= 120 && heightCm <= 220)) return null;
  const w = pbw(sex, heightCm);
  const per = lung === "normal" ? 7 : 6;
  const vt = Math.round((w * per) / 10) * 10;
  if (lung === "ards") return { pbw: w, vt, vtRange: `${Math.round(w * 4)}–${Math.round(w * 6)} ml (4–6 ml/kg)`, rr: 20, peep: 8, fio2: 0.6, ie: "1:1 to 1:2", mode: "Volume control (assist-control)", notes: ["Plateau pressure 30 cmH₂O or less; driving pressure (plateau − PEEP) under 15.", "Target SpO₂ 88–95% or PaO₂ 55–80 mmHg; pH 7.30–7.45 (permissive hypercapnia).", "Set PEEP and FiO₂ together from the ARDSnet table.", "P/F under 150: prone positioning for at least 16 hours a day; consider a neuromuscular blocker early."] };
  if (lung === "obstructive") return { pbw: w, vt, vtRange: `${Math.round(w * 6)}–${Math.round(w * 8)} ml (6–8 ml/kg)`, rr: 12, peep: 5, fio2: 0.4, ie: "1:3 to 1:5", mode: "Volume control (assist-control)", notes: ["Long expiratory time: low rate and high inspiratory flow (60–80 L/min) to avoid air trapping.", "Check auto-PEEP with an expiratory hold; keep plateau under 30.", "Accept a higher PaCO₂ if pH is above 7.20; treat bronchospasm.", "If BP falls after intubation: disconnect briefly to let trapped air out, then fluids."] };
  return { pbw: w, vt, vtRange: `${Math.round(w * 6)}–${Math.round(w * 8)} ml (6–8 ml/kg)`, rr: 14, peep: 5, fio2: 0.4, ie: "1:2", mode: "Volume control (assist-control)", notes: ["Even with normal lungs, keep tidal volume at 6–8 ml/kg of predicted, not actual, weight.", "Target SpO₂ 92–96%; wean FiO₂ first.", "Check an ABG 20–30 minutes after starting."] };
}

export interface VentNow { ph?: number; paco2?: number; pao2?: number; fio2?: number; peep?: number; rr?: number; vt?: number; plateau?: number; pbw?: number; lung: VentLung }
export interface VentAdvice { pf?: number; ardsGrade?: string; steps: string[] }
/** What to change from the ABG and the current settings. */
export function ventAdjust(n: VentNow): VentAdvice {
  const steps: string[] = [];
  const fio2 = n.fio2 !== undefined ? (n.fio2 > 1 ? n.fio2 / 100 : n.fio2) : undefined;
  const pf = n.pao2 !== undefined && fio2 ? Math.round(n.pao2 / fio2) : undefined;
  const ardsGrade = pf === undefined ? undefined : pf <= 100 ? "severe" : pf <= 200 ? "moderate" : pf <= 300 ? "mild" : undefined;
  if (n.plateau !== undefined && n.plateau > 30 && n.vt && n.pbw) {
    const next = Math.max(Math.round(n.pbw * 4), n.vt - Math.round(n.pbw));
    steps.push(`Plateau ${n.plateau} is above 30: reduce tidal volume by 1 ml/kg to about ${next} ml (not below 4 ml/kg), and raise the rate to keep minute ventilation (up to 35/min).`);
  }
  if (n.paco2 !== undefined && n.rr) {
    const target = n.lung === "obstructive" ? Math.max(40, Math.min(n.paco2, 60)) : 40;
    if (n.ph !== undefined && n.ph < 7.25 && n.paco2 > 45) {
      const rr = Math.min(35, Math.round((n.rr * n.paco2) / Math.max(target, 45)));
      steps.push(n.lung === "obstructive" ? `Respiratory acidosis (pH ${n.ph}): in obstructive disease raise the rate cautiously (to about ${Math.min(rr, n.rr + 4)}) and check auto-PEEP; accept PaCO₂ if pH stays above 7.20.` : `Respiratory acidosis (pH ${n.ph}, PaCO₂ ${n.paco2}): raise the rate to about ${rr}/min (new rate = rate × PaCO₂ ÷ target).`);
    } else if (n.ph !== undefined && n.ph > 7.45 && n.paco2 < 35) {
      steps.push(`Respiratory alkalosis (pH ${n.ph}, PaCO₂ ${n.paco2}): lower the rate to about ${Math.max(8, Math.round((n.rr * n.paco2) / 40))}/min; look for pain, anxiety or over-breathing.`);
    } else if (n.ph !== undefined && n.ph < 7.30 && n.paco2 <= 45) {
      steps.push(`Metabolic acidosis (pH ${n.ph} with PaCO₂ ${n.paco2}): treat the cause; the rate may need to be higher to compensate.`);
    }
  }
  if (n.pao2 !== undefined && fio2 !== undefined) {
    if (n.pao2 < 55) {
      const row = PEEP_TABLE.find(([f, p]) => f > fio2 + 0.001 || (f >= fio2 - 0.001 && p > (n.peep ?? 0)));
      steps.push(`PaO₂ ${n.pao2} is low: ${row ? `step up the FiO₂/PEEP pair to FiO₂ ${row[0]} with PEEP ${row[1]}` : "at the top of the table: consider prone positioning, recruitment and referral for ECMO"}; check the tube position, secretions and for a pneumothorax.`);
    } else if (n.pao2 > 100 && fio2 > 0.4) {
      steps.push(`PaO₂ ${n.pao2} on FiO₂ ${fio2}: wean FiO₂ first (to keep SpO₂ ${n.lung === "ards" ? "88–95" : "92–96"}%), then PEEP in steps of 2 every few hours.`);
    }
  }
  if (ardsGrade && n.lung === "ards" && pf !== undefined && pf < 150) steps.push(`P/F ${pf}: prone positioning (16+ hours a day) is recommended; consider a neuromuscular blocker for the first 48 hours.`);
  if (!steps.length) steps.push("The ABG is within the targets for these settings: keep going and reassess; consider a spontaneous breathing trial if the cause is improving.");
  return { pf, ardsGrade, steps };
}

export const OXYGEN_DEVICES: { device: string; flow: string; fio2: string }[] = [
  { device: "Nasal cannula", flow: "1–6 L/min", fio2: "24–44%" },
  { device: "Simple face mask", flow: "5–10 L/min", fio2: "35–55%" },
  { device: "Venturi mask", flow: "As marked on the valve", fio2: "24–60% (fixed)" },
  { device: "Non-rebreather mask", flow: "10–15 L/min", fio2: "60–90%" },
  { device: "High-flow nasal cannula", flow: "30–60 L/min", fio2: "21–100% (set)" },
];

/* ------------------------------------------------------------------ clinic bills */

export type PayMode = "cash" | "upi" | "card" | "other";
export interface BillItem { text: string; qty: number; rate: number }
export interface Bill { id: string; no: string; date: string; patient: string; phone: string; items: BillItem[]; discount: number; mode: PayMode; paid: number; note: string; at: number; cancelled?: boolean }
export const BILLS_KEY = "cadus3.bills";
export const BILL_PRESETS = ["Consultation", "Follow-up consultation", "Dressing", "Injection", "Nebulisation", "ECG", "Blood sugar test", "Suture removal", "Procedure"];
export const readBills = (): Bill[] => (load<Bill[]>(BILLS_KEY, []) || []).filter((b) => b && typeof b.id === "string" && Array.isArray(b.items)).slice(0, 20000);
export const saveBills = (l: Bill[]) => keep(BILLS_KEY, l.slice(0, 20000));
export const billTotal = (b: Pick<Bill, "items" | "discount">) => Math.max(0, Math.round((b.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0) - (Number(b.discount) || 0)) * 100) / 100);
/** The next number in the series for the financial year (April to March), e.g. 2026-27/0042. */
export function nextBillNo(bills: Bill[], date = new Date(), prefix = ""): string {
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const fy = `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  const head = `${prefix ? `${prefix}/` : ""}${fy}/`;
  const max = bills.filter((b) => b.no.startsWith(head)).reduce((m, b) => Math.max(m, Number(b.no.slice(head.length)) || 0), 0);
  return `${head}${String(max + 1).padStart(4, "0")}`;
}
export const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export function daySummary(bills: Bill[], date: string) {
  const day = bills.filter((b) => b.date === date && !b.cancelled);
  const by = { cash: 0, upi: 0, card: 0, other: 0 } as Record<PayMode, number>;
  for (const b of day) by[b.mode] += billTotal(b);
  return { count: day.length, total: Object.values(by).reduce((s, x) => s + x, 0), by };
}
export function billMarkdown(b: Bill, clinic = ""): string {
  const total = billTotal(b);
  return [
    `# ${b.cancelled ? "CANCELLED " : ""}Receipt`, clinic ? `**${clinic}**` : "",
    `Receipt no. **${b.no}** · ${fmtDate(local(b.date))}`, `Received from: **${b.patient || "________"}**${b.phone ? ` · ${b.phone}` : ""}`,
    "", "| # | Item | Qty | Rate | Amount |", "|---|---|---|---|---|",
    ...b.items.map((i, k) => `| ${k + 1} | ${i.text} | ${i.qty} | ${rupees(Number(i.rate) || 0)} | ${rupees((Number(i.qty) || 0) * (Number(i.rate) || 0))} |`),
    b.discount ? `| | Discount | | | −${rupees(Number(b.discount))} |` : "",
    `| | **Total** | | | **${rupees(total)}** |`,
    "", `Paid by ${({ cash: "cash", upi: "UPI", card: "card", other: "other" } as Record<PayMode, string>)[b.mode]}.${b.note ? ` ${b.note}` : ""}`,
    "", "_This is a computer-generated receipt._",
  ].filter((x) => x !== "").join("\n");
}
export const billsCsv = (bills: Bill[]) => ["Receipt no,Date,Patient,Items,Discount,Total,Mode,Status", ...bills.map((b) => [b.no, b.date, b.patient, b.items.map((i) => `${i.text} x${i.qty}`).join("; "), b.discount || 0, billTotal(b), b.mode, b.cancelled ? "cancelled" : "paid"].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");

/* ------------------------------------------------------------------ rabies post-exposure prophylaxis */

export type BiteCategory = 1 | 2 | 3;
export const BITE_SIGNS: { cat: BiteCategory; text: string }[] = [
  { cat: 1, text: "Touching or feeding the animal; licks on intact skin" },
  { cat: 2, text: "Nibbling of uncovered skin; minor scratches or abrasions without bleeding" },
  { cat: 3, text: "Bites or scratches that break the skin (one or more); licks on broken skin; saliva on mucous membranes (eye, mouth); any contact with a bat" },
];
export type ArvRoute = "im" | "id";
export interface RabiesPlan { category: BiteCategory; vaccine: { day: number; date: Date; what: string }[]; rig?: { iu: number; ml?: string; what: string }; wound: string[]; notes: string[] }
/**
 * National Rabies Control Programme (2019) and WHO (2018): category from the exposure, vaccine on
 * days 0, 3, 7, 14 and 28 (IM, Essen) or 0, 3, 7 and 28 (ID, two sites), immunoglobulin for
 * category III (human 20 IU/kg, equine 40 IU/kg) into the wounds; only days 0 and 3 if fully
 * vaccinated before.
 */
export function rabiesPlan(cat: BiteCategory, o: { start: string; route: ArvRoute; weightKg?: number; vaccinatedBefore?: boolean; rig?: "human" | "equine" }): RabiesPlan | null {
  const s = local(o.start);
  if (Number.isNaN(s.getTime())) return null;
  const wound = cat === 1 ? ["Wash the area with soap and water."] : [
    "Wash every wound at once with soap and running water for 15 minutes, then apply povidone-iodine or another antiseptic.",
    "Do not suture or close the wound; if suturing can't be avoided, infiltrate immunoglobulin first and suture loosely hours later.",
    "Tetanus prophylaxis as for any wound; antibiotics for deep, dirty or hand wounds.",
  ];
  if (cat === 1) return { category: 1, vaccine: [], wound, notes: ["No vaccine needed if the history is reliable."] };
  const days = o.vaccinatedBefore ? [0, 3] : o.route === "im" ? [0, 3, 7, 14, 28] : [0, 3, 7, 28];
  const what = o.route === "im" ? "1 dose (1 vial) IM in the deltoid (front of the thigh in small children); never the buttock" : "0.1 ml intradermal at 2 sites (both deltoids)";
  const vaccine = days.map((d) => ({ day: d, date: new Date(s.getTime() + d * DAY), what: o.vaccinatedBefore ? (o.route === "im" ? "1 booster dose IM" : "0.1 ml intradermal at 1 site") : what }));
  let rig: RabiesPlan["rig"];
  if (cat === 3 && !o.vaccinatedBefore) {
    const w = o.weightKg && o.weightKg > 0 ? o.weightKg : undefined;
    const kind = o.rig ?? "equine";
    const iu = w ? Math.round(w * (kind === "human" ? 20 : 40)) : 0;
    rig = { iu, ml: w ? `${(iu / (kind === "human" ? 150 : 300)).toFixed(1)} ml at ${kind === "human" ? 150 : 300} IU/ml (check the vial)` : undefined, what: `${kind === "human" ? "Human (HRIG) 20 IU/kg" : "Equine (ERIG) 40 IU/kg"}, on day 0 (or up to day 7), infiltrated into and around every wound as far as possible; dilute with saline if the volume is too small for many wounds. A rabies monoclonal antibody can be used instead, dosed as on its label.` };
  }
  const notes = [
    o.vaccinatedBefore ? "Previously fully vaccinated: two booster doses, no immunoglobulin." : "Start the vaccine at once, however late the patient comes; don't wait to see the animal.",
    "Day 0 is the day of the first dose; if a dose is late, carry on from there without restarting.",
    "Children get the same dose as adults.",
  ];
  return { category: cat, vaccine, rig, wound, notes };
}

/* ------------------------------------------------------------------ needle-stick and sharps injury */

export type SourceStatus = "positive" | "negative" | "unknown";
export type HbvImmunity = "responder" | "non-responder" | "unvaccinated" | "unknown";
export interface SharpsPlan { first: string[]; hiv: string[]; hbv: string[]; hcv: string[]; followUp: string[] }
export function sharpsPlan(o: { kind: "percutaneous" | "mucous" | "intact-skin"; hivSource: SourceStatus; hbvSource: SourceStatus; hcvSource: SourceStatus; hbv: HbvImmunity; hoursSince?: number }): SharpsPlan {
  const first = o.kind === "mucous" ? ["Flush the eye, nose or mouth with plenty of clean water or saline; don't use soap or antiseptic in the eye."] : ["Let the wound bleed freely under running water and wash with soap and water; don't squeeze, scrub, suck or use bleach."];
  first.push("Report to the PEP or infection-control officer at once; record the exposure.", "Test the exposed person at baseline: HIV, HBsAg and anti-HBs, anti-HCV, creatinine (and a pregnancy test).", "Ask for consent to test the source for HIV, HBsAg and anti-HCV.");
  const hiv: string[] = [];
  if (o.kind === "intact-skin") hiv.push("Blood on intact skin: no HIV PEP needed.");
  else if (o.hivSource === "negative") hiv.push("Source HIV negative (and no recent risk of the window period): no HIV PEP; stop it if already started.");
  else if (o.hoursSince !== undefined && o.hoursSince > 72) hiv.push("More than 72 hours since the exposure: PEP is no longer recommended; follow up with HIV tests.");
  else hiv.push("Start HIV PEP as soon as possible, ideally within 2 hours and no later than 72 hours: TLD (tenofovir 300 mg + lamivudine 300 mg + dolutegravir 50 mg) one tablet daily for 28 days (NACO).", o.hivSource === "unknown" ? "Source status unknown: start PEP now and stop if the source tests negative." : "Source HIV positive: complete all 28 days; ask about the source's viral load and treatment.");
  const hbv: string[] = [];
  if (o.hbv === "responder") hbv.push("Vaccinated with anti-HBs 10 mIU/ml or more at any time: protected, nothing more needed.");
  else if (o.hbvSource === "negative") hbv.push(o.hbv === "unvaccinated" ? "Source HBsAg negative: start hepatitis B vaccination anyway." : "Source HBsAg negative: no immunoglobulin; complete vaccination if incomplete.");
  else if (o.hbv === "unvaccinated") hbv.push("Hepatitis B immunoglobulin 0.06 ml/kg IM (ideally within 24 hours, up to 7 days) and start the vaccine (0, 1, 6 months) at a different site.");
  else if (o.hbv === "non-responder") hbv.push("Known non-responder: hepatitis B immunoglobulin, two doses one month apart (or one dose and revaccination).");
  else hbv.push("Vaccinated but response unknown: test anti-HBs now; if under 10, give immunoglobulin and a vaccine booster.");
  const hcv = o.hcvSource === "negative" ? ["Source anti-HCV negative: no further HCV testing needed."] : ["There is no PEP for hepatitis C: test HCV RNA at 3–6 weeks or anti-HCV at 3 and 6 months; treat early if infection occurs."];
  const followUp = ["HIV test at 6 weeks and 3 months (and 6 months if hepatitis C infection occurred).", "Check for side effects of PEP at 2 weeks; creatinine if on tenofovir.", "Use condoms and don't donate blood until the 3-month test is negative; breastfeeding mothers should discuss risks.", "Counselling and support: the risk of infection from one needle-stick is low (HIV about 0.3%, hepatitis C about 1.8%, hepatitis B up to 30% if not immune)."];
  return { first, hiv, hbv, hcv, followUp };
}

/* ------------------------------------------------------------------ IMNCI sick child */

export interface ImnciIn { ageMonths: number; danger: { cantDrink?: boolean; vomitsAll?: boolean; convulsions?: boolean; lethargic?: boolean }; cough?: boolean; rr?: number; chestIndrawing?: boolean; stridor?: boolean; diarrhoeaDays?: number; blood?: boolean; dehydration?: { lethargic?: boolean; restless?: boolean; sunkenEyes?: boolean; drinksPoorly?: boolean; thirsty?: boolean; pinchVerySlow?: boolean; pinchSlow?: boolean }; fever?: boolean; stiffNeck?: boolean; weightKg?: number }
export interface ImnciClass { area: string; label: string; colour: "pink" | "yellow" | "green"; treat: string[] }
/** IMNCI (2 months to 5 years): general danger signs, cough or difficult breathing, diarrhoea and fever. */
export function imnci(c: ImnciIn): { danger: boolean; classes: ImnciClass[]; urgentReferral: boolean } {
  const classes: ImnciClass[] = [];
  const danger = !!(c.danger.cantDrink || c.danger.vomitsAll || c.danger.convulsions || c.danger.lethargic);
  if (danger) classes.push({ area: "Danger signs", label: "General danger sign present", colour: "pink", treat: ["Urgent referral after the first dose of treatment for the other classifications", "Keep the child warm; prevent low blood sugar (breast milk or sugar water)"] });
  if (c.cough) {
    const fast = c.rr !== undefined && (c.ageMonths < 12 ? c.rr >= 50 : c.rr >= 40);
    if (danger || c.stridor) classes.push({ area: "Cough or difficult breathing", label: "Severe pneumonia or very severe disease", colour: "pink", treat: ["First dose of injectable antibiotic (ampicillin + gentamicin)", "Oxygen if available", "Refer urgently"] });
    else if (fast || c.chestIndrawing) classes.push({ area: "Cough or difficult breathing", label: "Pneumonia", colour: "yellow", treat: [`Oral amoxicillin for 5 days${c.weightKg ? ` (about ${Math.round(c.weightKg * 45)} mg twice a day, 40–45 mg/kg/dose)` : " (40–45 mg/kg twice a day)"}`, "Soothe the throat and relieve the cough with a safe remedy", "Follow up in 2 days"] });
    else classes.push({ area: "Cough or difficult breathing", label: "Cough or cold (no pneumonia)", colour: "green", treat: ["No antibiotic", "Soothe the throat with a safe remedy", "Return at once if breathing becomes fast or difficult; follow up in 5 days if not better"] });
  }
  if (c.diarrhoeaDays !== undefined && c.diarrhoeaDays > 0) {
    const d = c.dehydration ?? {};
    const severe = [d.lethargic, d.sunkenEyes, d.drinksPoorly, d.pinchVerySlow].filter(Boolean).length >= 2;
    const some = [d.restless, d.sunkenEyes, d.thirsty, d.pinchSlow].filter(Boolean).length >= 2;
    const w = c.weightKg;
    if (severe) classes.push({ area: "Diarrhoea", label: "Severe dehydration", colour: "pink", treat: [`Plan C: IV Ringer's lactate 100 ml/kg${w ? ` (${Math.round(w * 100)} ml)` : ""}: ${c.ageMonths < 12 ? "30 ml/kg in 1 hour, then 70 ml/kg in 5 hours" : "30 ml/kg in 30 minutes, then 70 ml/kg in 2½ hours"}`, "If IV isn't possible: ORS by nasogastric tube 20 ml/kg/hour for 6 hours, and refer urgently", "Reassess every 1–2 hours"] });
    else if (some) classes.push({ area: "Diarrhoea", label: "Some dehydration", colour: "yellow", treat: [`Plan B: ORS 75 ml/kg over 4 hours${w ? ` (about ${Math.round(w * 75)} ml)` : ""} in the clinic, then reassess`, "Zinc for 14 days (10 mg under 6 months, 20 mg from 6 months)", "Continue breastfeeding"] });
    else classes.push({ area: "Diarrhoea", label: "No dehydration", colour: "green", treat: ["Plan A: extra fluids and ORS at home (50–100 ml after each loose stool under 2 years, 100–200 ml from 2 years)", "Zinc for 14 days", "Continue feeding; return if worse"] });
    if (c.diarrhoeaDays >= 14) classes.push({ area: "Diarrhoea", label: severe || some ? "Severe persistent diarrhoea" : "Persistent diarrhoea", colour: severe || some ? "pink" : "yellow", treat: severe || some ? ["Treat dehydration before referral unless there is another severe classification", "Refer"] : ["Feeding advice, multivitamins and zinc", "Follow up in 5 days"] });
    if (c.blood) classes.push({ area: "Diarrhoea", label: "Dysentery", colour: "yellow", treat: ["Oral ciprofloxacin 15 mg/kg twice a day for 3 days (or as per local sensitivity)", "Follow up in 2 days"] });
  }
  if (c.fever) {
    if (danger || c.stiffNeck) classes.push({ area: "Fever", label: "Very severe febrile disease", colour: "pink", treat: ["First dose of injectable antibiotic", "Test for malaria in endemic areas and give the first dose of antimalarial if positive", "Paracetamol for high fever; refer urgently"] });
    else classes.push({ area: "Fever", label: "Fever: look for the cause", colour: "yellow", treat: ["Test for malaria (RDT or smear) in malarious areas and treat if positive", "Paracetamol for fever 38.5 °C or more", "Follow up in 2 days if fever persists; daily for 7 days or more needs referral"] });
  }
  return { danger, classes, urgentReferral: classes.some((x) => x.colour === "pink") };
}

/* ------------------------------------------------------------------ CME credits */

export interface CmeEntry { id: string; date: string; title: string; organiser: string; hours: number; cert: string; kind: "conference" | "workshop" | "online" | "cme" | "other" }
export interface CmeState { entries: CmeEntry[]; target: number; periodStart: string; periodEnd: string; council: string }
export const CME_KEY = "cadus3.cme";
export const readCme = (): CmeState => { const s = load<Partial<CmeState>>(CME_KEY, {}); return { entries: Array.isArray(s.entries) ? s.entries.filter((e) => e && typeof e.id === "string") : [], target: Number(s.target) || 30, periodStart: s.periodStart || "", periodEnd: s.periodEnd || "", council: s.council || "" }; };
export const saveCme = (s: CmeState) => keep(CME_KEY, s);
export const newCme = (f: Partial<CmeEntry> = {}): CmeEntry => ({ id: uid(), date: isoDay(new Date()), title: "", organiser: "", hours: 1, cert: "", kind: "cme", ...f });
export function cmeProgress(s: CmeState, at = new Date()) {
  const inPeriod = s.entries.filter((e) => (!s.periodStart || e.date >= s.periodStart) && (!s.periodEnd || e.date <= s.periodEnd));
  const earned = Math.round(inPeriod.reduce((a, e) => a + (Number(e.hours) || 0), 0) * 10) / 10;
  const left = Math.max(0, Math.round((s.target - earned) * 10) / 10);
  const daysLeft = s.periodEnd ? Math.ceil((local(s.periodEnd).getTime() - at.getTime()) / DAY) : undefined;
  const perMonth = daysLeft && daysLeft > 0 && left > 0 ? Math.round((left / (daysLeft / 30.44)) * 10) / 10 : undefined;
  return { earned, left, pct: s.target ? Math.min(100, Math.round((earned / s.target) * 100)) : 0, daysLeft, perMonth, count: inPeriod.length };
}
export const cmeCsv = (s: CmeState) => ["Date,Title,Organiser,Type,Credit hours,Certificate", ...[...s.entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.title, e.organiser, e.kind, e.hours, e.cert].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");
