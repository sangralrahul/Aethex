/**
 * Bedside maths, worked out on this device (no AI): ICU infusions (dose ↔ mL/h, gravity drip
 * rates), steroid and opioid dose conversions, and step-by-step ABG interpretation.
 * Ranges are usual adult ranges for orientation only: always check the unit's protocol.
 */

/* ------------------------------------------------------------------ infusions */

export type DoseUnit = "mcg/kg/min" | "mcg/min" | "units/min" | "units/kg/h" | "units/h" | "mg/kg/h" | "mg/h" | "mg/min" | "mcg/kg/h";
export interface InfusionPreset {
  id: string; name: string;
  /** Drug in the syringe, in the unit's mass (mg or units). */
  amount: number; amountUnit: "mg" | "units"; volumeMl: number;
  doseUnit: DoseUnit; range: [number, number]; note: string;
}
/** Common 50 mL syringe-pump dilutions in Indian ICUs. */
export const INFUSIONS: InfusionPreset[] = [
  { id: "noradrenaline", name: "Noradrenaline", amount: 4, amountUnit: "mg", volumeMl: 50, doseUnit: "mcg/kg/min", range: [0.05, 0.5], note: "Through a central line where possible; titrate to MAP ≥ 65." },
  { id: "adrenaline", name: "Adrenaline", amount: 4, amountUnit: "mg", volumeMl: 50, doseUnit: "mcg/kg/min", range: [0.05, 0.5], note: "Second vasopressor or for anaphylaxis refractory to IM doses." },
  { id: "dopamine", name: "Dopamine", amount: 200, amountUnit: "mg", volumeMl: 50, doseUnit: "mcg/kg/min", range: [5, 20], note: "More arrhythmias than noradrenaline in shock." },
  { id: "dobutamine", name: "Dobutamine", amount: 250, amountUnit: "mg", volumeMl: 50, doseUnit: "mcg/kg/min", range: [2.5, 20], note: "Inotrope for low cardiac output; may cause hypotension." },
  { id: "vasopressin", name: "Vasopressin", amount: 20, amountUnit: "units", volumeMl: 50, doseUnit: "units/min", range: [0.01, 0.04], note: "Fixed dose added to noradrenaline; not titrated up like a catecholamine." },
  { id: "ntg", name: "Nitroglycerin (GTN)", amount: 50, amountUnit: "mg", volumeMl: 50, doseUnit: "mcg/min", range: [5, 200], note: "Start low; watch for hypotension and headache." },
  { id: "labetalol", name: "Labetalol", amount: 50, amountUnit: "mg", volumeMl: 50, doseUnit: "mg/min", range: [0.5, 2], note: "Hypertensive emergency; avoid in asthma and heart block." },
  { id: "insulin", name: "Insulin (regular)", amount: 50, amountUnit: "units", volumeMl: 50, doseUnit: "units/kg/h", range: [0.05, 0.1], note: "DKA: fixed 0.1 units/kg/h; add dextrose when glucose < 250 mg/dL." },
  { id: "heparin", name: "Heparin (unfractionated)", amount: 25000, amountUnit: "units", volumeMl: 50, doseUnit: "units/kg/h", range: [12, 18], note: "Adjust to aPTT by the unit's nomogram." },
  { id: "midazolam", name: "Midazolam", amount: 50, amountUnit: "mg", volumeMl: 50, doseUnit: "mg/kg/h", range: [0.02, 0.1], note: "Accumulates in kidney and liver failure." },
  { id: "fentanyl", name: "Fentanyl", amount: 0.5, amountUnit: "mg", volumeMl: 50, doseUnit: "mcg/kg/h", range: [0.5, 2], note: "0.5 mg = 500 mcg in 50 mL (10 mcg/mL)." },
  { id: "propofol", name: "Propofol 1%", amount: 500, amountUnit: "mg", volumeMl: 50, doseUnit: "mg/kg/h", range: [0.5, 4], note: "Undiluted 10 mg/mL; watch triglycerides and propofol infusion syndrome above 4 mg/kg/h." },
];

const WEIGHTED = (u: DoseUnit) => u.includes("/kg/");
/** Concentration in the dose unit's mass per mL (mcg/mL, mg/mL or units/mL). */
export function concentration(p: Pick<InfusionPreset, "amount" | "amountUnit" | "volumeMl" | "doseUnit">): number {
  const perMl = p.amount / p.volumeMl; // mg/mL or units/mL
  return p.doseUnit.startsWith("mcg") ? perMl * 1000 : perMl;
}
const perHour = (u: DoseUnit) => (u.endsWith("/min") ? 60 : 1);

/** mL/h for a dose. Weight is required for per-kg units. */
export function rateFor(p: Pick<InfusionPreset, "amount" | "amountUnit" | "volumeMl" | "doseUnit">, dose: number, weightKg: number | null): number | null {
  if (!(dose >= 0) || !(p.volumeMl > 0) || !(p.amount > 0)) return null;
  if (WEIGHTED(p.doseUnit) && !(weightKg && weightKg > 0)) return null;
  const perHr = dose * (WEIGHTED(p.doseUnit) ? (weightKg as number) : 1) * perHour(p.doseUnit);
  return perHr / concentration(p);
}
/** The dose a rate in mL/h gives. */
export function doseFor(p: Pick<InfusionPreset, "amount" | "amountUnit" | "volumeMl" | "doseUnit">, rateMlH: number, weightKg: number | null): number | null {
  if (!(rateMlH >= 0) || !(p.volumeMl > 0) || !(p.amount > 0)) return null;
  if (WEIGHTED(p.doseUnit) && !(weightKg && weightKg > 0)) return null;
  return (rateMlH * concentration(p)) / perHour(p.doseUnit) / (WEIGHTED(p.doseUnit) ? (weightKg as number) : 1);
}
/** Drops a minute for a gravity set. */
export function dropsPerMin(volumeMl: number, hours: number, dropFactor: number): number | null {
  if (!(volumeMl > 0) || !(hours > 0) || !(dropFactor > 0)) return null;
  return (volumeMl * dropFactor) / (hours * 60);
}
/** Five to seven steps through the usual range, for a rate table. */
export function rangeSteps(range: [number, number]): number[] {
  const [lo, hi] = range;
  const raw = [lo, lo + (hi - lo) * 0.25, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.75, hi];
  return [...new Set(raw.map((x) => Number(x.toPrecision(2))))];
}
export const round = (x: number, dp = 1) => Math.round(x * 10 ** dp) / 10 ** dp;

/* ------------------------------------------------------------------ dose conversion */

/** Glucocorticoid equivalents (anti-inflammatory potency), mg equal to prednisolone 5 mg (BNF). */
export const STEROIDS: { id: string; name: string; mg: number; note: string }[] = [
  { id: "prednisolone", name: "Prednisolone", mg: 5, note: "Intermediate acting." },
  { id: "hydrocortisone", name: "Hydrocortisone", mg: 20, note: "Short acting; has mineralocorticoid effect." },
  { id: "methylprednisolone", name: "Methylprednisolone", mg: 4, note: "Intermediate acting." },
  { id: "dexamethasone", name: "Dexamethasone", mg: 0.75, note: "Long acting; no mineralocorticoid effect." },
  { id: "betamethasone", name: "Betamethasone", mg: 0.75, note: "Long acting." },
  { id: "triamcinolone", name: "Triamcinolone", mg: 4, note: "Intermediate acting." },
  { id: "deflazacort", name: "Deflazacort", mg: 6, note: "Intermediate acting." },
];
export function convertSteroid(fromId: string, mg: number, toId: string): number | null {
  const a = STEROIDS.find((s) => s.id === fromId), b = STEROIDS.find((s) => s.id === toId);
  if (!a || !b || !(mg >= 0)) return null;
  return (mg / a.mg) * b.mg;
}

/** Opioids as oral morphine equivalents (OME) per mg (per mcg/h for the patch, per day). Approximate. */
export const OPIOIDS: { id: string; name: string; unit: string; ome: number; note: string }[] = [
  { id: "morphine-oral", name: "Morphine, oral", unit: "mg/day", ome: 1, note: "Reference." },
  { id: "morphine-iv", name: "Morphine, IV or SC", unit: "mg/day", ome: 2, note: "Oral to parenteral is usually 2:1 (some use 3:1)." },
  { id: "oxycodone-oral", name: "Oxycodone, oral", unit: "mg/day", ome: 1.5, note: "" },
  { id: "hydromorphone-oral", name: "Hydromorphone, oral", unit: "mg/day", ome: 5, note: "Tables range from 4 to 7.5." },
  { id: "tapentadol-oral", name: "Tapentadol, oral", unit: "mg/day", ome: 0.4, note: "" },
  { id: "tramadol-oral", name: "Tramadol, oral", unit: "mg/day", ome: 0.1, note: "Some tables use 0.2." },
  { id: "codeine-oral", name: "Codeine, oral", unit: "mg/day", ome: 0.1, note: "" },
  { id: "fentanyl-patch", name: "Fentanyl patch", unit: "mcg/h", ome: 2.4, note: "Manufacturers' tables give 2.4 to 3.6 mg OME a day per mcg/h." },
];
export interface OpioidSwitch { ome: number; target: number; reduced: [number, number] }
/** Total daily dose of one opioid to another, with the usual 25–50% cut for incomplete cross-tolerance. */
export function convertOpioid(fromId: string, dose: number, toId: string): OpioidSwitch | null {
  const a = OPIOIDS.find((o) => o.id === fromId), b = OPIOIDS.find((o) => o.id === toId);
  if (!a || !b || !(dose >= 0) || a.id === b.id) return null;
  const ome = dose * a.ome;
  const target = ome / b.ome;
  return { ome, target, reduced: [target * 0.5, target * 0.75] };
}

/* ------------------------------------------------------------------ ABG */

export interface AbgInput { ph: number; pco2: number; hco3: number; na?: number | null; cl?: number | null; albumin?: number | null; pao2?: number | null; fio2?: number | null; lactate?: number | null }
export interface AbgStep { title: string; text: string; tone: "ok" | "warn" | "bad" }
export interface AbgResult { primary: string; steps: AbgStep[]; summary: string; causes: string[]; ag: number | null; correctedAg: number | null; delta: number | null; pf: number | null; aa: number | null }

const nz = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

export function interpretAbg(x: AbgInput): AbgResult | string {
  const { ph, pco2, hco3 } = x;
  if (!nz(ph) || ph < 6.5 || ph > 8) return "Enter a pH between 6.5 and 8.0";
  if (!nz(pco2) || pco2 < 5 || pco2 > 200) return "Enter pCO₂ in mmHg (5 to 200)";
  if (!nz(hco3) || hco3 < 2 || hco3 > 70) return "Enter HCO₃ in mmol/L (2 to 70)";
  const steps: AbgStep[] = [];
  const acid = ph < 7.35, alk = ph > 7.45;
  steps.push({ title: "pH", text: acid ? `${ph}: acidaemia` : alk ? `${ph}: alkalaemia` : `${ph}: in the normal range (7.35–7.45)`, tone: acid || alk ? "bad" : "ok" });

  let primary = "";
  const metAcid = hco3 < 22, metAlk = hco3 > 26, respAcid = pco2 > 45, respAlk = pco2 < 35;
  if (acid) primary = metAcid && respAcid ? "Mixed metabolic and respiratory acidosis" : metAcid ? "Metabolic acidosis" : respAcid ? "Respiratory acidosis" : "Acidaemia without a clear primary process";
  else if (alk) primary = metAlk && respAlk ? "Mixed metabolic and respiratory alkalosis" : metAlk ? "Metabolic alkalosis" : respAlk ? "Respiratory alkalosis" : "Alkalaemia without a clear primary process";
  else if (metAcid && respAlk) primary = "Mixed metabolic acidosis and respiratory alkalosis (normal pH)";
  else if (metAlk && respAcid) primary = "Mixed metabolic alkalosis and respiratory acidosis (normal pH)";
  else if (metAcid || metAlk || respAcid || respAlk) primary = "Abnormal values with a normal pH: a mixed or fully compensated disorder";
  else primary = "Normal acid–base status";
  steps.push({ title: "Primary process", text: `pCO₂ ${pco2} mmHg, HCO₃ ${hco3} mmol/L: ${primary.toLowerCase()}.`, tone: primary.startsWith("Normal") ? "ok" : "warn" });

  // Compensation
  if (primary === "Metabolic acidosis" || primary.startsWith("Mixed metabolic acidosis")) {
    const exp = 1.5 * hco3 + 8;
    const t = pco2 > exp + 2 ? `higher than expected: a respiratory acidosis as well` : pco2 < exp - 2 ? `lower than expected: a respiratory alkalosis as well` : "as expected: appropriate respiratory compensation";
    steps.push({ title: "Compensation (Winter's formula)", text: `Expected pCO₂ = 1.5 × ${hco3} + 8 = ${round(exp)} ± 2 mmHg. Measured ${pco2}: ${t}.`, tone: t.startsWith("as") ? "ok" : "warn" });
  } else if (primary === "Metabolic alkalosis") {
    const exp = 0.7 * (hco3 - 24) + 40;
    const t = pco2 > exp + 5 ? "higher than expected: a respiratory acidosis as well" : pco2 < exp - 5 ? "lower than expected: a respiratory alkalosis as well" : "as expected: appropriate compensation";
    steps.push({ title: "Compensation", text: `Expected pCO₂ = 40 + 0.7 × (${hco3} − 24) = ${round(exp)} ± 5 mmHg. Measured ${pco2}: ${t}.`, tone: t.startsWith("as") ? "ok" : "warn" });
  } else if (primary === "Respiratory acidosis") {
    const d = (pco2 - 40) / 10, acute = 24 + d, chronic = 24 + 3.5 * d;
    const t = hco3 < acute - 2 ? "below the acute range: a metabolic acidosis as well" : hco3 <= acute + 2 ? "fits an acute process" : hco3 <= chronic + 2 ? "between acute and chronic, or chronic: renal compensation under way" : "above the chronic range: a metabolic alkalosis as well";
    steps.push({ title: "Compensation", text: `Expected HCO₃: acute ${round(acute)}, chronic ${round(chronic)} mmol/L. Measured ${hco3}: ${t}.`, tone: t.includes("as well") ? "warn" : "ok" });
  } else if (primary === "Respiratory alkalosis") {
    const d = (40 - pco2) / 10, acute = 24 - 2 * d, chronic = 24 - 5 * d;
    const t = hco3 > acute + 2 ? "above the acute range: a metabolic alkalosis as well" : hco3 >= acute - 2 ? "fits an acute process" : hco3 >= chronic - 2 ? "between acute and chronic, or chronic" : "below the chronic range: a metabolic acidosis as well";
    steps.push({ title: "Compensation", text: `Expected HCO₃: acute ${round(acute)}, chronic ${round(chronic)} mmol/L. Measured ${hco3}: ${t}.`, tone: t.includes("as well") ? "warn" : "ok" });
  }

  // Anion gap
  let ag: number | null = null, correctedAg: number | null = null, delta: number | null = null;
  const causes: string[] = [];
  if (nz(x.na) && nz(x.cl)) {
    ag = x.na - (x.cl + hco3);
    correctedAg = nz(x.albumin) ? ag + 2.5 * (4 - x.albumin) : ag;
    const high = correctedAg > 12;
    steps.push({ title: "Anion gap", text: `Na ${x.na} − (Cl ${x.cl} + HCO₃ ${hco3}) = ${round(ag)}${nz(x.albumin) ? `; corrected for albumin ${x.albumin} g/dL: ${round(correctedAg)}` : ""} (normal about 8–12). ${high ? "High anion gap." : "Normal anion gap."}`, tone: high ? "bad" : "ok" });
    if (hco3 < 24 && high) {
      delta = (correctedAg - 12) / (24 - hco3);
      const t = delta < 0.4 ? "a normal-anion-gap (hyperchloraemic) acidosis dominates" : delta < 0.8 ? "high and normal anion gap acidoses together" : delta <= 2 ? "a pure high-anion-gap acidosis" : "a high-anion-gap acidosis with a metabolic alkalosis as well";
      steps.push({ title: "Delta ratio", text: `(${round(correctedAg)} − 12) ÷ (24 − ${hco3}) = ${round(delta, 2)}: ${t}.`, tone: delta >= 0.8 && delta <= 2 ? "ok" : "warn" });
    }
    if (metAcid) {
      if (high) causes.push("Lactic acidosis (sepsis, shock, hypoxia, metformin)", "Ketoacidosis (diabetic, alcoholic, starvation)", "Kidney failure (uraemia)", "Toxins: methanol, ethylene glycol, salicylates, paracetamol (5-oxoproline)");
      else causes.push("Diarrhoea or other GI bicarbonate loss", "Renal tubular acidosis", "Large volumes of 0.9% saline", "Acetazolamide, ureteric diversion");
    }
  } else if (metAcid) steps.push({ title: "Anion gap", text: "Add Na and Cl to work out the anion gap and narrow the causes.", tone: "warn" });
  if (primary.startsWith("Metabolic alkalosis")) causes.push("Vomiting or nasogastric suction (check urine chloride)", "Diuretics", "Hypokalaemia", "Mineralocorticoid excess (urine chloride high)");
  if (primary.startsWith("Respiratory acidosis") || primary.includes("respiratory acidosis")) causes.push("COPD or asthma exhaustion", "Sedatives or opioids", "Neuromuscular weakness (GBS, myasthenia, OP poisoning)", "Chest wall or obesity hypoventilation");
  if (primary.startsWith("Respiratory alkalosis") || primary.includes("respiratory alkalosis")) causes.push("Pain, anxiety or fever", "Hypoxia, PE or pneumonia", "Sepsis (early)", "Salicylate poisoning, liver failure, pregnancy");
  if (nz(x.lactate) && x.lactate > 2) steps.push({ title: "Lactate", text: `${x.lactate} mmol/L: raised${x.lactate >= 4 ? ", 4 or more: treat as septic shock until shown otherwise if infection is possible" : ""}.`, tone: x.lactate >= 4 ? "bad" : "warn" });

  // Oxygenation
  let pf: number | null = null, aa: number | null = null;
  if (nz(x.pao2) && nz(x.fio2) && x.fio2 >= 0.21 && x.fio2 <= 1) {
    pf = x.pao2 / x.fio2;
    aa = x.fio2 * 713 - pco2 / 0.8 - x.pao2;
    const t = pf < 100 ? "severe hypoxaemia (ARDS range < 100)" : pf < 200 ? "moderate (100–200)" : pf < 300 ? "mild (200–300)" : "normal (≥ 300)";
    steps.push({ title: "Oxygenation", text: `P/F ratio ${round(pf, 0)}: ${t}. A–a gradient ${round(aa, 0)} mmHg at sea level.`, tone: pf < 200 ? "bad" : pf < 300 ? "warn" : "ok" });
  }
  const summary = [primary, steps.find((s) => s.title.startsWith("Compensation"))?.text.split(": ").pop()?.replace(/\.$/, ""), correctedAg !== null && correctedAg > 12 && metAcid ? "high anion gap" : ""].filter(Boolean).join("; ");
  return { primary, steps, summary, causes, ag, correctedAg, delta, pf, aa };
}
