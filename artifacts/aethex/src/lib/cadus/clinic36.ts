/**
 * Update 36, on the device (no AI): status epilepticus, hyponatraemia, asthma and COPD attacks,
 * pre-op risk and anticoagulant bridging, oncology emergencies, spirometry, thyroid storm and
 * myxoedema coma, and sickle cell disease and thalassaemia.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== status epilepticus */

export interface SeStep { at: number; title: string; items: string[] }
/** The timed pathway (minutes from seizure onset), with doses for this weight. */
export function sePathway(kg: number, ageYears: number, iv: boolean): SeStep[] {
  const k = kg > 0 ? kg : ageYears >= 12 ? 70 : 20;
  const child = ageYears < 12;
  const lz = r1(cap(0.1 * k, 4));
  const midBuccal = r1(cap(0.3 * k, 10));
  const midIm = k > 40 ? 10 : k >= 13 ? 5 : r1(0.2 * k);
  return [
    { at: 0, title: "0–5 minutes: stabilise", items: [
      "Time the seizure; airway, high-flow oxygen, recovery position; do not put anything in the mouth.",
      `Check glucose: if low, ${child ? `10% dextrose ${Math.round(2 * k)} ml (2 ml/kg) IV` : "thiamine 250 mg IV (if alcohol or malnutrition), then 50 ml of 50% (or 150 ml of 10%) dextrose IV"}.`,
      "IV or IO access; bloods: glucose, sodium, calcium, magnesium, drug levels, blood gas.",
    ] },
    { at: 5, title: "5 minutes: first benzodiazepine", items: iv
      ? [`Lorazepam ${lz} mg IV (0.1 mg/kg, max 4 mg) over 1–2 minutes, or diazepam ${r1(cap(0.2 * k, 10))} mg IV (0.2 mg/kg, max 10 mg).`]
      : [`No IV: buccal midazolam ${midBuccal} mg (0.3 mg/kg, max 10 mg), or IM midazolam ${midIm} mg, or rectal diazepam ${r1(cap(0.5 * k, child ? 10 : 20))} mg (0.5 mg/kg).`] },
    { at: 15, title: "10–15 minutes: second benzodiazepine", items: [
      iv ? `Repeat lorazepam ${lz} mg IV once if still seizing.` : `Repeat once (IV lorazepam ${lz} mg if access is now available).`,
      "No more than two doses of benzodiazepine in total, including any given before arrival.",
    ] },
    { at: 20, title: "20 minutes: second-line (pick one)", items: [
      `Levetiracetam ${Math.round(cap(60 * k, 4500))} mg IV (60 mg/kg, max 4,500 mg) over 10 minutes.`,
      `Or fosphenytoin ${Math.round(cap(20 * k, 1500))} mg PE IV (20 mg PE/kg), or phenytoin ${Math.round(cap(20 * k, 2000))} mg IV (20 mg/kg) over at least 20 minutes (no faster than 50 mg/min${child ? " or 1 mg/kg/min" : ""}) with ECG monitoring.`,
      `Or sodium valproate ${Math.round(cap(40 * k, 3000))} mg IV (40 mg/kg, max 3,000 mg) over 10 minutes; avoid in pregnancy, women who could become pregnant, liver disease and suspected metabolic disease.`,
      ...(child ? [`Children: phenobarbitone ${Math.round(cap(20 * k, 1000))} mg IV (20 mg/kg) over 20 minutes is an alternative.`] : []),
    ] },
    { at: 40, title: "40 minutes: refractory status", items: [
      "Call anaesthesia and ICU: rapid sequence intubation with thiopental, propofol or midazolam infusion.",
      "Continuous EEG where available; look for the cause (CT, LP, toxicology, autoimmune encephalitis).",
      "A different second-line drug can be tried while anaesthesia is arranged.",
    ] },
  ];
}
export const SE_CAUSES = ["Low glucose or sodium", "Stopped or missed antiseizure medicine", "Alcohol withdrawal", "Meningitis, encephalitis, cerebral malaria", "Neurocysticercosis", "Head injury, stroke, bleed", "Eclampsia (after 20 weeks or postpartum: magnesium sulphate)", "Poisoning (isoniazid: pyridoxine; tricyclics; organophosphates)"];
export const seStepAt = (minutes: number, steps: SeStep[]) => steps.reduce((cur, s, i) => (minutes >= s.at ? i : cur), 0);

/* ================================================================== hyponatraemia */

/** Sodium corrected for high glucose (Katz, 1.6 per 100 mg/dL above 100). */
export const correctedNa = (na: number, glucose: number) => r1(na + (1.6 * Math.max(0, glucose - 100)) / 100);
/** Calculated serum osmolality: 2 Na + glucose/18 + urea/6 (mg/dL). */
export const calcOsm = (na: number, glucose: number, urea: number) => Math.round(2 * na + glucose / 18 + urea / 6);
export interface NaWork { serumOsm: number; urineOsm?: number; urineNa?: number; volume: "low" | "normal" | "high" }
export function hypoNaCause(x: NaWork): { label: string; causes: string[] } {
  if (x.serumOsm > 295) return { label: "Hypertonic hyponatraemia", causes: ["High glucose (use the corrected sodium)", "Mannitol, glycine or contrast"] };
  if (x.serumOsm >= 275) return { label: "Isotonic (pseudo-) hyponatraemia", causes: ["Very high triglycerides or protein (myeloma); measure sodium on a blood gas (direct electrode)"] };
  if (x.urineOsm !== undefined && x.urineOsm <= 100) return { label: "Hypotonic, dilute urine", causes: ["Primary polydipsia", "Low solute intake (tea and toast, beer potomania)"] };
  if (x.urineNa === undefined) return { label: "Hypotonic hyponatraemia", causes: ["Send urine osmolality and urine sodium (before any fluids or diuretics) to find the cause"] };
  if (x.urineNa <= 30) return { label: "Hypotonic, low urine sodium (kidneys holding on to salt)", causes: x.volume === "high" ? ["Heart failure", "Cirrhosis", "Nephrotic syndrome"] : ["Vomiting, diarrhoea, burns, sweating (hypovolaemia)", "Third-space losses (pancreatitis, bowel obstruction)"] };
  return { label: "Hypotonic, high urine sodium", causes: x.volume === "low" ? ["Diuretics (especially thiazides)", "Adrenal insufficiency (check cortisol)", "Salt-wasting kidney disease or cerebral salt wasting", "Recent vomiting (urine sodium can be high with alkalosis)"] : ["SIADH (drugs: SSRIs, carbamazepine, oxcarbazepine; lung disease, CNS disease, pain, nausea, after surgery)", "Hypothyroidism", "Adrenal insufficiency (glucocorticoid deficiency)", "Diuretics or kidney disease"] };
}
export const INFUSATES: { id: string; label: string; na: number; k: number }[] = [
  { id: "3", label: "3% saline", na: 513, k: 0 },
  { id: "09", label: "0.9% saline", na: 154, k: 0 },
  { id: "rl", label: "Ringer's lactate", na: 130, k: 4 },
  { id: "045", label: "0.45% saline", na: 77, k: 0 },
  { id: "d5", label: "5% dextrose", na: 0, k: 0 },
];
export function tbw(kg: number, sex: "m" | "f", age: number): number {
  const f = age < 18 ? 0.6 : age >= 65 ? (sex === "m" ? 0.5 : 0.45) : sex === "m" ? 0.6 : 0.5;
  return r1(kg * f);
}
/** Adrogué–Madias: expected change in serum sodium from 1 litre of a fluid. */
export const naChangePerLitre = (serumNa: number, infNa: number, infK: number, water: number) => r1((infNa + infK - serumNa) / (water + 1));
/** Fluid restriction from the Furst ratio (urine Na + K) / serum Na. */
export function furst(urineNa: number, urineK: number, serumNa: number): { ratio: number; advice: string } {
  const ratio = Math.round(((urineNa + urineK) / serumNa) * 100) / 100;
  return { ratio, advice: ratio > 1 ? "Ratio over 1: fluid restriction alone will not work; add salt tablets or urea, or consider a vaptan with specialist advice." : ratio >= 0.5 ? "Ratio 0.5–1: restrict to 500 ml a day." : "Ratio under 0.5: restrict to 1 litre a day." };
}
export function naLimit(highRisk: boolean): string {
  return `Raise sodium by 4–6 mmol/L in the first hours, then by no more than ${highRisk ? "8" : "10"} mmol/L in 24 hours (and 8 mmol/L in each day after)${highRisk ? ": high risk of osmotic demyelination (sodium under 105, alcohol, malnutrition, low potassium, liver disease)" : ""}.`;
}
export const NA_OVERCORRECT = "If it rises too fast: stop the saline, give 5% dextrose (about 3 ml/kg/hour) and desmopressin 2 micrograms IV with senior advice, and recheck sodium every 1–2 hours.";

/* ================================================================== asthma and COPD attacks */

export interface AsthmaInput { child: boolean; ageYears: number; pefPct: number | null; rr: number; hr: number; spo2: number; cantTalk: boolean; lifeSigns: number; highCo2: boolean }
export const ASTHMA_LIFE = ["Silent chest", "Cyanosis", "Poor respiratory effort", "Exhaustion or altered consciousness", "Arrhythmia or hypotension"];
export function asthmaSeverity(x: AsthmaInput): "near-fatal" | "life-threatening" | "severe" | "moderate" {
  if (x.highCo2) return "near-fatal";
  if (x.lifeSigns > 0 || (x.pefPct !== null && x.pefPct < 33) || x.spo2 < 92) return "life-threatening";
  const fastRr = x.child ? (x.ageYears <= 5 ? x.rr > 40 : x.rr > 30) : x.rr >= 25;
  const fastHr = x.child ? (x.ageYears <= 5 ? x.hr > 140 : x.hr > 125) : x.hr >= 110;
  if (x.cantTalk || fastRr || fastHr || (x.pefPct !== null && x.pefPct <= 50)) return "severe";
  return "moderate";
}
export function asthmaPlan(level: ReturnType<typeof asthmaSeverity>, child: boolean, ageYears: number, kg: number): string[] {
  const k = kg > 0 ? kg : child ? 15 : 70;
  const salb = child ? (ageYears <= 5 ? "2.5 mg" : "5 mg") : "5 mg";
  const out = [
    "Oxygen to keep SpO2 94–98%.",
    `Salbutamol ${salb} nebulised with oxygen (or 4–10 puffs by spacer), repeat every 15–30 minutes or back-to-back if severe.`,
    child ? `Prednisolone ${ageYears <= 5 ? "20 mg" : "30–40 mg"} by mouth for 3 days (or IV hydrocortisone 4 mg/kg if vomiting).` : "Prednisolone 40–50 mg by mouth daily for at least 5 days (or hydrocortisone 100 mg IV 6-hourly if unable to swallow).",
  ];
  if (level !== "moderate") out.push(`Add ipratropium ${child ? "250 micrograms" : "500 micrograms"} nebulised every 4–6 hours.`);
  if (level === "severe" || level === "life-threatening" || level === "near-fatal") out.push(`Not responding: magnesium sulphate ${child ? `${Math.round(cap(40 * k, 2000))} mg (40 mg/kg, max 2 g)` : "1.2–2 g"} IV over 20 minutes.`);
  if (level === "life-threatening" || level === "near-fatal") out.push("Call ICU and anaesthesia now; blood gas; chest X-ray (pneumothorax); IV aminophylline only on senior advice; no sedatives.");
  if (level === "near-fatal") out.push("Rising CO2 means exhaustion: prepare for intubation.");
  return out;
}
export const COPD_ANTHONISEN = ["More breathless", "More sputum", "Sputum more purulent (green or yellow)"];
export function copdPlan(x: { anthonisen: number; purulent: boolean; ph: number | null; paco2: number | null; rr: number }): { niv: boolean; steps: string[] } {
  const niv = x.ph !== null && x.paco2 !== null && x.ph < 7.35 && x.paco2 > 45;
  const steps = [
    "Controlled oxygen to SpO2 88–92% (24–28% Venturi) and a blood gas within 1 hour.",
    "Salbutamol 2.5–5 mg with ipratropium 500 micrograms nebulised (driven by air if CO2 is high; oxygen by nasal cannula alongside).",
    "Prednisolone 30–40 mg daily for 5 days.",
    x.purulent && x.anthonisen >= 2 ? "Antibiotic for 5 days (purulent sputum with another cardinal symptom): amoxicillin 500 mg three times daily, or doxycycline 200 mg then 100 mg daily, or per local guidance." : "No antibiotic needed unless sputum is purulent with another cardinal symptom, or pneumonia.",
  ];
  if (niv) steps.push(`NIV now: pH ${x.ph} with PaCO2 ${x.paco2} mmHg despite treatment (start IPAP 15, EPAP 4–5 cmH2O, titrate IPAP to 20–30); ICU if pH under 7.25 or not improving in 1–2 hours.`);
  else if (x.ph !== null && x.ph < 7.25) steps.push("pH under 7.25: ICU review for NIV or intubation.");
  return { niv, steps };
}
export const ATTACK_DISCHARGE = [
  "Check inhaler technique and give a written action plan.",
  "Finish the steroid course; start or step up preventer (inhaled steroid) treatment.",
  "Review within 2 working days (GP or clinic) and with the specialist within a month after a severe attack.",
  "Stop smoking support; influenza and pneumococcal vaccines; pulmonary rehabilitation for COPD.",
  "Find and treat the trigger (infection, allergens, missed preventer, smoke, biomass fuel).",
];

/* ================================================================== pre-op risk and anticoagulant bridging */

export const RCRI = ["High-risk surgery (inside the abdomen or chest, or vascular above the groin)", "Ischaemic heart disease", "Heart failure", "Stroke or TIA", "Diabetes on insulin", "Creatinine over 2 mg/dL"];
export function rcriRisk(n: number): string {
  const pct = n === 0 ? "3.9%" : n === 1 ? "6.0%" : n === 2 ? "10.1%" : "15%";
  return `RCRI ${n}: about ${pct} risk of death, heart attack or cardiac arrest within 30 days (CCS 2017 estimates).`;
}
export type Doac = "apixaban" | "rivaroxaban" | "edoxaban" | "dabigatran";
export function doacPlan(drug: Doac, crcl: number, highBleed: boolean): { holdDays: number; text: string; restart: string } {
  let hold = highBleed ? 2 : 1;
  if (drug === "dabigatran" && crcl < 50) hold = highBleed ? 4 : 2;
  return {
    holdDays: hold,
    text: `Last dose ${hold + 1} days before surgery (no doses for ${hold} full day${hold === 1 ? "" : "s"} before). No bridging with heparin.`,
    restart: highBleed ? "Restart 48–72 hours after surgery once bleeding is controlled (prophylactic-dose heparin before that if needed)." : "Restart 24 hours after surgery.",
  };
}
export const HIGH_THROMBO = ["Mechanical mitral valve", "Older mechanical aortic valve (caged-ball, tilting disc)", "Mechanical valve with stroke in the last 6 months", "Stroke or TIA in the last 3 months", "VTE in the last 3 months", "Severe thrombophilia (antiphospholipid, protein C/S or antithrombin deficiency)", "AF with CHA2DS2-VASc 7 or more"];
export function warfarinPlan(highThrombo: boolean, highBleed: boolean, kg: number): string[] {
  const k = kg > 0 ? kg : 70;
  const out = ["Stop warfarin 5 days before surgery (last dose on day −6); check INR the day before: if over 1.5, give vitamin K 1–2 mg by mouth."];
  if (highThrombo) out.push(
    `Bridge: enoxaparin ${Math.round(k)} mg (1 mg/kg) SC twice daily from day −3; last dose 24 hours before surgery (give half the daily dose).`,
    `Restart enoxaparin ${highBleed ? "48–72 hours" : "24 hours"} after surgery and continue until the INR is in range for 2 days.`,
  );
  else out.push("No bridging: for most AF and old VTE, bridging adds bleeding without preventing clots (BRIDGE trial).");
  out.push("Restart warfarin at the usual dose the evening of surgery or the next day if bleeding allows.");
  return out;
}
export const ANTIPLATELETS: { id: string; label: string; stop: string }[] = [
  { id: "aspirin", label: "Aspirin", stop: "Continue for most surgery; stop 7 days before only for intracranial, spinal canal, posterior eye or prostate surgery." },
  { id: "clopidogrel", label: "Clopidogrel", stop: "Stop 5 days before." },
  { id: "ticagrelor", label: "Ticagrelor", stop: "Stop 3–5 days before." },
  { id: "prasugrel", label: "Prasugrel", stop: "Stop 7 days before." },
];
export function stentAdvice(monthsSince: number | null, acs: boolean): string {
  if (monthsSince === null) return "";
  const minMonths = acs ? 12 : 6;
  if (monthsSince < 1) return "Stent under a month ago: postpone any surgery that can wait; never stop both antiplatelets without the cardiologist.";
  if (monthsSince < minMonths) return `Stent ${monthsSince} months ago: delay elective surgery until ${minMonths} months if possible${acs ? " (stent for ACS)" : ""}; if it cannot wait, continue aspirin and discuss the P2Y12 drug with the cardiologist.`;
  return "Dual antiplatelet period complete: continue aspirin; stopping the second drug before surgery is usually safe.";
}

/* ================================================================== oncology emergencies */

export const correctedCa = (ca: number, albumin: number) => r1(ca + 0.8 * (4 - albumin));
export function hypercalcaemia(cCa: number, crcl: number | null): { level: string; steps: string[] } {
  const level = cCa > 14 ? "Severe" : cCa >= 12 ? "Moderate" : cCa > 10.5 ? "Mild" : "Normal";
  if (level === "Normal") return { level, steps: ["Corrected calcium is normal."] };
  const steps = [
    "IV 0.9% saline 200–300 ml/hour, aiming for urine output 100–150 ml/hour (less in heart failure or kidney failure); furosemide only for fluid overload.",
    crcl !== null && crcl < 30 ? "CrCl under 30: avoid zoledronic acid; use denosumab 120 mg SC (watch for low calcium)." : `Zoledronic acid 4 mg IV over at least 15 minutes${crcl !== null && crcl < 60 ? " (reduce the dose for CrCl 30–60)" : ""}, or pamidronate 60–90 mg; effect after 2–4 days.`,
    "Stop calcium, vitamin D, thiazides and lithium; check PTH (should be suppressed), PTHrP and vitamin D if no known cancer.",
  ];
  if (level === "Severe") steps.splice(1, 0, "Severe: also calcitonin 4 units/kg SC or IM 12-hourly for 48 hours (works within hours); ECG; dialysis if kidney failure or confusion.");
  return { level, steps };
}
export interface TlsLab { uricAcid: number | null; k: number | null; phosphate: number | null; ca: number | null; child: boolean }
export function cairoBishop(x: TlsLab): { count: number; items: string[] } {
  const items: string[] = [];
  if (x.uricAcid !== null && x.uricAcid >= 8) items.push(`Uric acid ${x.uricAcid}`);
  if (x.k !== null && x.k >= 6) items.push(`Potassium ${x.k}`);
  if (x.phosphate !== null && x.phosphate >= (x.child ? 6.5 : 4.5)) items.push(`Phosphate ${x.phosphate}`);
  if (x.ca !== null && x.ca <= 7) items.push(`Calcium ${x.ca}`);
  return { count: items.length, items };
}
export function tlsPlan(risk: "low" | "intermediate" | "high", g6pd: boolean, kg: number): string[] {
  const k = kg > 0 ? kg : 70;
  if (risk === "low") return ["Monitor: fluids by mouth, daily labs; allopurinol if other risk factors."];
  const out = ["IV fluids 2–3 litres/m² a day (urine output over 100 ml/hour in adults); no potassium in the fluids; labs every 6–12 hours."];
  if (risk === "high" && !g6pd) out.push(`Rasburicase ${r1(0.2 * k)} mg (0.2 mg/kg) IV once (repeat only if uric acid rises); keep blood samples on ice for uric acid.`);
  else out.push(`Allopurinol 100–300 mg by mouth 8-hourly (max 800 mg a day; reduce in kidney failure)${risk === "high" && g6pd ? ": rasburicase is contraindicated in G6PD deficiency (haemolysis, methaemoglobinaemia)" : ""}.`);
  out.push("Established TLS: treat high potassium urgently, avoid treating low calcium unless symptomatic, and call nephrology early for dialysis.");
  return out;
}
export const MSCC = [
  "Suspect it in anyone with cancer and new back pain, especially thoracic, at night or on coughing, or any leg weakness, numbness or bladder change.",
  "Dexamethasone 16 mg by mouth or IV daily with a proton pump inhibitor; check glucose.",
  "MRI of the whole spine within 24 hours (at once if neurological signs).",
  "Lie flat with log-rolling if pain suggests instability; urgent oncology, spinal surgery and radiotherapy decision the same day.",
];
export const SVCO = [
  "Face and arm swelling, breathlessness, dilated chest veins, worse lying down.",
  "Sit up, oxygen; CT chest with contrast; get tissue before steroids if lymphoma is possible.",
  "Stridor or airway compromise: dexamethasone and urgent stenting or radiotherapy.",
  "Small-cell lung cancer and lymphoma respond to chemotherapy; others usually need a stent.",
];

/* ================================================================== spirometry */

export interface Spiro { fev1: number; fvc: number; fev1Pct: number; fvcPct: number; postFev1: number | null }
export function spirometry(x: Spiro): { ratio: number; pattern: string; severity: string; reversible: string; notes: string[] } {
  const ratio = x.fvc > 0 ? Math.round((x.fev1 / x.fvc) * 100) / 100 : 0;
  const obstr = ratio < 0.7, lowFvc = x.fvcPct < 80;
  const pattern = obstr && lowFvc ? "Mixed or severe obstruction with air trapping" : obstr ? "Obstruction" : lowFvc ? "Possible restriction" : "Normal";
  const severity = obstr ? (x.fev1Pct >= 80 ? "GOLD 1 (mild)" : x.fev1Pct >= 50 ? "GOLD 2 (moderate)" : x.fev1Pct >= 30 ? "GOLD 3 (severe)" : "GOLD 4 (very severe)") : "";
  let reversible = "";
  if (x.postFev1 !== null && x.postFev1 > 0) {
    const d = x.postFev1 - x.fev1, pct = (d / x.fev1) * 100;
    reversible = d >= 0.2 && pct >= 12 ? `Significant reversibility: +${Math.round(d * 1000)} ml (${Math.round(pct)}%), supports asthma.` : `No significant reversibility: +${Math.round(d * 1000)} ml (${Math.round(pct)}%).`;
  }
  const notes: string[] = [];
  if (lowFvc && !obstr) notes.push("A low FVC with a normal ratio needs full lung volumes (TLC) to confirm restriction: think interstitial lung disease, obesity, chest wall or neuromuscular disease.");
  if (obstr && lowFvc) notes.push("A low FVC with obstruction is often air trapping; lung volumes separate it from true mixed disease.");
  if (obstr && x.postFev1 !== null && x.postFev1 / x.fvc >= 0.7) notes.push("The ratio normalises after bronchodilator: this goes against COPD.");
  notes.push("Older adults: the fixed 0.70 cut-off over-diagnoses obstruction; use the lower limit of normal (z-score under −1.645) where your machine reports it (ATS/ERS 2022).");
  return { ratio, pattern, severity, reversible, notes };
}

/* ================================================================== thyroid storm and myxoedema coma */

export interface BwInput { tempC: number; cns: 0 | 10 | 20 | 30; gi: 0 | 10 | 20; hr: number; hf: 0 | 5 | 10 | 15; af: boolean; precipitant: boolean }
export function burchWartofsky(x: BwInput): { score: number; band: string } {
  const t = x.tempC < 37.2 ? 0 : x.tempC < 37.8 ? 5 : x.tempC < 38.3 ? 10 : x.tempC < 38.9 ? 15 : x.tempC < 39.4 ? 20 : x.tempC < 40 ? 25 : 30;
  const h = x.hr < 90 ? 0 : x.hr < 110 ? 5 : x.hr < 120 ? 10 : x.hr < 130 ? 15 : x.hr < 140 ? 20 : 25;
  const score = t + x.cns + x.gi + h + x.hf + (x.af ? 10 : 0) + (x.precipitant ? 10 : 0);
  return { score, band: score >= 45 ? "Thyroid storm highly likely: treat now in ICU" : score >= 25 ? "Impending storm: treat and watch closely" : "Storm unlikely" };
}
export const STORM_PLAN = [
  "Propranolol 60–80 mg by mouth every 4 hours (or esmolol infusion in ICU; caution in heart failure).",
  "Propylthiouracil 500–1,000 mg loading, then 250 mg every 4 hours (or methimazole/carbimazole 60–80 mg a day).",
  "At least 1 hour after the thionamide: iodine (Lugol's iodine 8–10 drops, or SSKI 5 drops, every 6 hours).",
  "Hydrocortisone 300 mg IV loading, then 100 mg every 8 hours.",
  "Cooling and paracetamol (no aspirin); fluids; treat the trigger (infection, surgery, iodine contrast, stopping antithyroid drugs, childbirth).",
];
export function myxoedemaPlan(kg: number, frailOrCardiac: boolean): string[] {
  const k = kg > 0 ? kg : 60;
  return [
    "Hydrocortisone 100 mg IV every 8 hours first (adrenal insufficiency may coexist), until cortisol is known.",
    `Levothyroxine ${frailOrCardiac ? "100–200" : "200–400"} micrograms IV loading${frailOrCardiac ? " (lower for older or cardiac patients)" : ""}, then about ${Math.round(1.6 * k * 0.75)} micrograms IV daily (1.6 micrograms/kg × 0.75), switching to oral when awake.`,
    "Passive rewarming only; treat low glucose, low sodium (fluid restriction or hypertonic saline if severe) and hypoventilation (ventilate if CO2 is rising).",
    "Look for the trigger: infection, cold, sedatives, stroke, stopping thyroxine.",
  ];
}

/* ================================================================== sickle cell and thalassaemia */

export function hydroxyurea(kg: number, child: boolean): { start: number; max: number; text: string } {
  const k = kg > 0 ? kg : child ? 20 : 60;
  const start = Math.round((child ? 20 : 15) * k / 50) * 50;
  const max = Math.round(35 * k / 50) * 50;
  return { start, max, text: `Start ${start} mg once daily (${child ? 20 : 15} mg/kg, to the nearest 50 mg); increase by 5 mg/kg every 8 weeks to the maximum tolerated dose (up to ${max} mg, 35 mg/kg), keeping neutrophils over 2,000 and platelets over 80,000. Blood count every 2–4 weeks while adjusting.` };
}
export const VOC = [
  "Analgesia within 30 minutes of arrival: paracetamol, an NSAID if kidneys and stomach allow, and morphine 0.1 mg/kg IV (max 10 mg) or oral, reassessing every 30 minutes.",
  "Fluids by mouth (IV if dehydrated or vomiting); oxygen only if SpO2 is under 95%; incentive spirometry every 2 hours while awake.",
  "Fever: blood cultures and IV ceftriaxone (risk of overwhelming infection after splenic loss).",
];
export const SICKLE_DANGER = [
  "Acute chest syndrome: new infiltrate with fever, chest pain or low oxygen: ceftriaxone with azithromycin, oxygen, transfusion or exchange, involve ICU.",
  "Stroke or sudden weakness: urgent exchange transfusion.",
  "Sudden pallor with a large spleen (sequestration) or low reticulocytes (aplastic crisis, parvovirus): transfuse.",
  "Priapism over 4 hours: urology emergency.",
];
export function transfusionVolume(kg: number, current: number, target: number): { ml: number; text: string } {
  const raw = Math.max(0, (target - current) * kg * 4);
  const ml = Math.round(cap(raw, 20 * kg) / 10) * 10;
  return { ml, text: `About ${ml} ml of packed red cells (rise × weight × 4${raw > 20 * kg ? ", capped at 20 ml/kg; give the rest later" : ""}), over 3–4 hours.` };
}
export function chelation(kg: number, ferritin: number, transfusions: number): string[] {
  const k = kg > 0 ? kg : 30;
  if (ferritin < 1000 && transfusions < 10) return ["Not yet: start chelation when ferritin is over 1,000 ng/ml or after 10–20 transfusions."];
  return [
    `Deferasirox film-coated tablets ${Math.round(14 * k)} mg once daily (14 mg/kg; dispersible tablets 20 mg/kg); adjust by ferritin every 3 months; check creatinine and liver tests monthly.`,
    `Or deferiprone ${Math.round(75 * k)} mg a day (75 mg/kg) in 3 doses: weekly neutrophil count (agranulocytosis).`,
    `Or desferrioxamine ${Math.round(cap(40 * k, 2000))} mg (20–40 mg/kg) SC over 8–12 hours, 5–7 nights a week; combine drugs for heavy cardiac iron.`,
    "Ferritin every 3 months; cardiac T2* MRI and liver iron yearly from about age 10; eye and hearing checks on deferasirox and desferrioxamine.",
  ];
}
export const THAL_TARGETS = [
  "Transfuse every 2–4 weeks to keep the pre-transfusion haemoglobin at 9.5–10.5 g/dL (11–12 g/dL with heart disease).",
  "Leucodepleted, matched blood; hepatitis B vaccine; check HIV, hepatitis B and C yearly.",
  "Folic acid; vitamin D and calcium; endocrine checks (growth, puberty, diabetes, thyroid) yearly.",
  "Screen siblings and counsel the family: carrier testing and prenatal diagnosis for future pregnancies.",
];
