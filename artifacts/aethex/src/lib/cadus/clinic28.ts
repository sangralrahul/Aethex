/**
 * Update 28, on the device (no AI): burns, neonatal jaundice, stroke thrombolysis, the sepsis
 * hour-1 bundle and the DKA protocol, alcohol withdrawal (CIWA-Ar), the diabetic foot, heat
 * illness, and wound and suture care. Every number is a published rule, shown with its source.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/* ================================================================== burns */

export type BurnAge = "0" | "1" | "5" | "10" | "15" | "adult";
export const BURN_AGES: [BurnAge, string][] = [["0", "Under 1 year"], ["1", "1–4 years"], ["5", "5–9 years"], ["10", "10–14 years"], ["15", "15 years"], ["adult", "Adult"]];
const AGE_I: Record<BurnAge, number> = { "0": 0, "1": 1, "5": 2, "10": 3, "15": 4, adult: 5 };

/** Lund and Browder: percent of body surface for each region, by age (head, thighs and legs change). */
export const BURN_REGIONS: { id: string; label: string; pct: number[] }[] = [
  { id: "head", label: "Head", pct: [19, 17, 13, 11, 9, 7] },
  { id: "neck", label: "Neck", pct: [2, 2, 2, 2, 2, 2] },
  { id: "antTrunk", label: "Front of trunk", pct: [13, 13, 13, 13, 13, 13] },
  { id: "postTrunk", label: "Back of trunk", pct: [13, 13, 13, 13, 13, 13] },
  { id: "buttocks", label: "Buttocks (both)", pct: [5, 5, 5, 5, 5, 5] },
  { id: "genitalia", label: "Genitalia", pct: [1, 1, 1, 1, 1, 1] },
  { id: "rUpperArm", label: "Right upper arm", pct: [4, 4, 4, 4, 4, 4] },
  { id: "lUpperArm", label: "Left upper arm", pct: [4, 4, 4, 4, 4, 4] },
  { id: "rForearm", label: "Right forearm", pct: [3, 3, 3, 3, 3, 3] },
  { id: "lForearm", label: "Left forearm", pct: [3, 3, 3, 3, 3, 3] },
  { id: "rHand", label: "Right hand", pct: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5] },
  { id: "lHand", label: "Left hand", pct: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5] },
  { id: "rThigh", label: "Right thigh", pct: [5.5, 6.5, 8, 8.5, 9, 9.5] },
  { id: "lThigh", label: "Left thigh", pct: [5.5, 6.5, 8, 8.5, 9, 9.5] },
  { id: "rLeg", label: "Right lower leg", pct: [5, 5, 5.5, 6, 6.5, 7] },
  { id: "lLeg", label: "Left lower leg", pct: [5, 5, 5.5, 6, 6.5, 7] },
  { id: "rFoot", label: "Right foot", pct: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5] },
  { id: "lFoot", label: "Left foot", pct: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5] },
];
/** Special areas that need a burns centre whatever the size. */
export const BURN_SPECIAL = new Set(["head", "neck", "genitalia", "rHand", "lHand", "rFoot", "lFoot"]);

/** TBSA from the fraction (0–1) of each region with partial or full thickness burn (erythema alone does not count). */
export function burnTbsa(age: BurnAge, frac: Record<string, number>): number {
  const i = AGE_I[age];
  return r1(BURN_REGIONS.reduce((a, r) => a + r.pct[i] * Math.min(1, Math.max(0, frac[r.id] || 0)), 0));
}

/** Holliday–Segar maintenance (ml/hour). */
export const maintenanceMlH = (kg: number) => (kg <= 10 ? 4 * kg : kg <= 20 ? 40 + 2 * (kg - 10) : 60 + (kg - 20));

export interface BurnFluids {
  needed: boolean; total24: number; first8: number; next16: number;
  rateNow: number; rateLater: number; hoursLeftIn8: number;
  maintenance?: number; urineTarget: string; notes: string[];
}
/** Parkland (4 ml/kg/%TBSA Ringer's lactate; half in the first 8 hours from the burn), with fluid already given. */
export function burnFluids(kg: number, tbsa: number, opts: { child: boolean; hoursSince?: number; given?: number; electrical?: boolean; mlPerKg?: number }): BurnFluids | null {
  if (!(kg > 0) || !(tbsa > 0)) return null;
  const per = opts.mlPerKg ?? 4;
  const total24 = Math.round(per * kg * tbsa);
  const first8 = Math.round(total24 / 2);
  const since = Math.max(0, Math.min(24, opts.hoursSince ?? 0));
  const given = Math.max(0, opts.given ?? 0);
  const hoursLeftIn8 = Math.max(0, 8 - since);
  const rateNow = hoursLeftIn8 > 0 ? Math.round(Math.max(0, first8 - given) / hoursLeftIn8) : Math.round(Math.max(0, total24 - given) / Math.max(1, 24 - since));
  const rateLater = Math.round((total24 - first8) / 16);
  const needed = tbsa >= (opts.child ? 10 : 15);
  const child30 = opts.child && kg < 30;
  const notes = [
    "Ringer's lactate (Hartmann's). The formula is a starting point: titrate every hour to urine output, not to the formula.",
    hoursLeftIn8 === 0 && since > 0 ? "More than 8 hours since the burn: give what is left of the 24-hour volume over the remaining hours." : `Time runs from the burn, not from arrival: ${hoursLeftIn8} h left of the first 8.`,
    "If urine output is above target for 2 hours, cut the rate by a third; if below, increase by a third. Watch for over-resuscitation (fluid creep): abdominal and limb compartment syndrome.",
  ];
  if (!needed) notes.unshift(`Under ${opts.child ? 10 : 15}% TBSA: oral fluids are usually enough unless the patient is shocked, vomiting or cannot drink.`);
  if (opts.electrical) notes.push("Electrical injury or myoglobinuria (dark urine): aim for 1–1.5 ml/kg/hour until the urine clears; check CK and an ECG.");
  return {
    needed, total24, first8, next16: total24 - first8, rateNow, rateLater, hoursLeftIn8,
    maintenance: child30 ? Math.round(maintenanceMlH(kg)) : undefined,
    urineTarget: opts.electrical ? `${r1(kg)}–${r1(kg * 1.5)} ml/hour (1–1.5 ml/kg/hour)` : child30 ? `${r1(kg)} ml/hour (1 ml/kg/hour)` : `${Math.round(kg * 0.5)} ml/hour (0.5 ml/kg/hour, 30–50 ml/hour)`,
    notes,
  };
}

export interface BurnReferIn { tbsa: number; child: boolean; fullThickness: boolean; regions: string[]; inhalation: boolean; electrical: boolean; chemical: boolean; circumferential: boolean; comorbid: boolean; trauma: boolean; nai: boolean }
/** Referral to a burns unit (ABA / national burns referral criteria). */
export function burnReferral(i: BurnReferIn): string[] {
  const why: string[] = [];
  if (i.tbsa > 10) why.push("Partial-thickness burns over 10% TBSA");
  if (i.fullThickness) why.push("Any full-thickness burn");
  const special = i.regions.filter((r) => BURN_SPECIAL.has(r));
  if (special.length) why.push("Face, hands, feet, genitalia or perineum");
  if (i.circumferential) why.push("Circumferential burn of a limb, the chest or neck (escharotomy may be needed)");
  if (i.inhalation) why.push("Suspected inhalation injury: early senior airway assessment, consider early intubation");
  if (i.electrical) why.push("Electrical burn, including lightning");
  if (i.chemical) why.push("Chemical burn");
  if (i.comorbid) why.push("Pre-existing illness that could complicate care");
  if (i.trauma) why.push("Burn with other major injuries");
  if (i.nai) why.push("Concern about non-accidental injury: safeguarding referral");
  return why;
}
export const BURN_FIRST_AID = [
  "Stop the burning; cool the burn with cool running water for 20 minutes (useful up to 3 hours after); no ice, no butter or toothpaste.",
  "Keep the patient warm; remove jewellery and clothing that is not stuck.",
  "Cover with cling film laid on (not wrapped round) or a clean non-fluffy dressing.",
  "Analgesia: IV morphine 0.1 mg/kg titrated, or intranasal fentanyl in children.",
  "Airway: hoarse voice, stridor, soot in the mouth, singed nasal hair or a burn in an enclosed space mean inhalation injury.",
  "Tetanus prophylaxis by immunisation history; no routine antibiotics.",
  "Catheterise when the TBSA is 15% (10% in children) or more to measure urine output hourly.",
];

/* ================================================================== neonatal jaundice */

/** NICE CG98 threshold table for babies of 38 weeks or more (µmol/L): [hours, phototherapy, exchange]. */
export const NICE_TERM: [number, number, number][] = [
  [0, 100, 100], [6, 125, 150], [12, 150, 200], [18, 175, 250], [24, 200, 300], [30, 212, 350], [36, 225, 400], [42, 237, 450],
  [48, 250, 450], [54, 262, 450], [60, 275, 450], [66, 287, 450], [72, 300, 450], [78, 312, 450], [84, 325, 450], [90, 337, 450], [96, 350, 450],
];
const interp = (h: number, col: 1 | 2) => {
  if (h >= 96) return NICE_TERM[NICE_TERM.length - 1][col];
  const i = Math.floor(h / 6);
  const [h0, a] = [NICE_TERM[i][0], NICE_TERM[i][col]];
  const b = NICE_TERM[i + 1][col];
  return Math.round(a + ((b - a) * (h - h0)) / 6);
};
export const toUmol = (v: number, unit: "umol" | "mgdl") => (unit === "mgdl" ? v * 17.1 : v);
export const toMgdl = (umol: number) => r1(umol / 17.1);

export interface JaundiceOut { photo: number | null; exchange: number | null; level: "none" | "recheck" | "photo" | "intensive" | "exchange" | "urgent"; text: string; actions: string[] }
/** Where a bilirubin sits against the NICE thresholds, with what to do. Preterm babies before 72 hours need the gestation-specific chart. */
export function jaundiceAssess(hours: number, sbrUmol: number, ga: number, opts: { riskFactors?: boolean; prevUmol?: number; prevHours?: number } = {}): JaundiceOut | null {
  if (!(hours >= 0) || !(sbrUmol > 0) || !(ga >= 23)) return null;
  const actions: string[] = [];
  let photo: number | null = null, exchange: number | null = null;
  if (ga >= 38) { photo = interp(hours, 1); exchange = interp(hours, 2); }
  else if (hours >= 72) { photo = ga * 10 - 100; exchange = ga * 10; }
  if (hours < 24) actions.push("Visible jaundice in the first 24 hours is pathological: measure the serum bilirubin within 2 hours and look for haemolysis (blood group, DAT), sepsis and G6PD deficiency.");
  let rate: number | null = null;
  if (opts.prevUmol && opts.prevHours !== undefined && hours > opts.prevHours) rate = r1((sbrUmol - opts.prevUmol) / (hours - opts.prevHours));
  if (rate !== null) actions.push(`Rate of rise ${rate} µmol/L per hour${rate >= 8.5 ? ": 8.5 or more is rapid, treat as for exchange-level jaundice (intensive phototherapy, senior review)" : ""}.`);
  if (photo === null || exchange === null) {
    return { photo, exchange, level: "none", text: `Under 38 weeks and under 72 hours old: plot ${Math.round(sbrUmol)} µmol/L on the NICE chart for ${ga} weeks.`, actions: [...actions, "From 72 hours, the NICE thresholds are (weeks × 10) − 100 for phototherapy and weeks × 10 for exchange."] };
  }
  let level: JaundiceOut["level"];
  let text: string;
  if (sbrUmol >= exchange) {
    level = "exchange"; text = `At or above the exchange transfusion threshold (${exchange} µmol/L)`;
    actions.push("Multiple (intensive) phototherapy now and prepare for an exchange transfusion; repeat the bilirubin in 4–6 hours; IV fluids if dehydrated; IVIG 500 mg/kg over 4 hours if Rh or ABO haemolysis and still rising.");
  } else if (sbrUmol >= exchange - 50 || (rate !== null && rate >= 8.5)) {
    level = "intensive"; text = `Within 50 µmol/L of the exchange threshold (${exchange})`;
    actions.push("Start multiple (intensive) phototherapy; repeat the bilirubin in 4–6 hours; involve the neonatologist.");
  } else if (sbrUmol >= photo) {
    level = "photo"; text = `Above the phototherapy threshold (${photo} µmol/L)`;
    actions.push("Single phototherapy; continue breastfeeding with short breaks (no more than 30 minutes) every 3 hours; repeat the bilirubin 4–6 hours after starting, then every 6–12 hours once stable or falling.", `Stop phototherapy when the bilirubin is 50 µmol/L or more below the threshold (under ${photo - 50}); check for rebound 12–18 hours after stopping.`);
  } else if (sbrUmol >= photo - 50) {
    level = "recheck"; text = `Below the phototherapy threshold (${photo}) but within 50 µmol/L of it`;
    actions.push(`Repeat the bilirubin in ${opts.riskFactors ? "6–12" : "12–18"} hours${opts.riskFactors ? " (risk factors present)" : ""}.`);
  } else {
    level = "none"; text = `Well below the phototherapy threshold (${photo} µmol/L)`;
    actions.push("No treatment; keep monitoring the baby and feeding; repeat if jaundice increases.");
  }
  if (hours > (ga >= 37 ? 14 : 21) * 24) actions.push("Jaundice beyond 14 days (21 in preterm): prolonged jaundice screen including the conjugated bilirubin and stool colour.");
  return { photo, exchange, level, text, actions };
}
export const JAUNDICE_RISK = ["Gestation under 38 weeks", "A sibling who needed phototherapy", "Mother intends to breastfeed exclusively", "Visible jaundice in the first 24 hours"];

/* ================================================================== stroke */

export const NIHSS_ITEMS: { id: string; label: string; options: string[] }[] = [
  { id: "1a", label: "1a Level of consciousness", options: ["Alert", "Drowsy, rousable by minor stimulation", "Needs repeated or painful stimulation", "Unresponsive or reflex responses only"] },
  { id: "1b", label: "1b Questions (month, age)", options: ["Both right", "One right", "Neither right"] },
  { id: "1c", label: "1c Commands (eyes, grip)", options: ["Both done", "One done", "Neither done"] },
  { id: "2", label: "2 Best gaze", options: ["Normal", "Partial gaze palsy", "Forced deviation"] },
  { id: "3", label: "3 Visual fields", options: ["No loss", "Partial hemianopia", "Complete hemianopia", "Bilateral (blind)"] },
  { id: "4", label: "4 Facial palsy", options: ["Normal", "Minor", "Partial (lower face)", "Complete"] },
  { id: "5a", label: "5a Left arm", options: ["No drift", "Drift", "Some effort against gravity", "No effort against gravity", "No movement"] },
  { id: "5b", label: "5b Right arm", options: ["No drift", "Drift", "Some effort against gravity", "No effort against gravity", "No movement"] },
  { id: "6a", label: "6a Left leg", options: ["No drift", "Drift", "Some effort against gravity", "No effort against gravity", "No movement"] },
  { id: "6b", label: "6b Right leg", options: ["No drift", "Drift", "Some effort against gravity", "No effort against gravity", "No movement"] },
  { id: "7", label: "7 Limb ataxia", options: ["Absent", "In one limb", "In two limbs"] },
  { id: "8", label: "8 Sensory", options: ["Normal", "Mild to moderate loss", "Severe or total loss"] },
  { id: "9", label: "9 Best language", options: ["Normal", "Mild to moderate aphasia", "Severe aphasia", "Mute, global aphasia"] },
  { id: "10", label: "10 Dysarthria", options: ["Normal", "Mild to moderate", "Severe, unintelligible"] },
  { id: "11", label: "11 Extinction and inattention", options: ["None", "In one modality", "Profound, in more than one modality"] },
];
export const nihssTotal = (v: Record<string, number>) => NIHSS_ITEMS.reduce((a, i) => a + (v[i.id] ?? 0), 0);
export const nihssBand = (s: number) => (s === 0 ? "No stroke symptoms" : s <= 4 ? "Minor stroke" : s <= 15 ? "Moderate stroke" : s <= 20 ? "Moderate to severe stroke" : "Severe stroke");

export interface LyticDose { drug: string; total: number; bolus?: number; infusion?: number; text: string }
/** Alteplase 0.9 mg/kg (max 90 mg; 10% bolus over 1 minute, the rest over 60 minutes) and tenecteplase 0.25 mg/kg (max 25 mg, single bolus). */
export function lyticDoses(kg: number): LyticDose[] {
  if (!(kg > 0)) return [];
  const alt = r1(Math.min(90, 0.9 * kg));
  const bolus = r1(alt / 10);
  const tnk = r1(Math.min(25, 0.25 * kg));
  return [
    { drug: "Alteplase", total: alt, bolus, infusion: r1(alt - bolus), text: `${alt} mg in total: ${bolus} mg IV bolus over 1 minute, then ${r1(alt - bolus)} mg over 60 minutes (1 mg/ml: ${r1(alt - bolus)} ml/hour)` },
    { drug: "Tenecteplase", total: tnk, text: `${tnk} mg as a single IV bolus over 5–10 seconds (0.25 mg/kg, maximum 25 mg); check the dose on your local product label` },
  ];
}
export interface StrokeClock { minutes: number; inWindow: boolean; windowEnds: string; text: string }
/** Minutes since last known well and the 4.5-hour thrombolysis window. */
export function strokeClock(lastWell: Date, now: Date = new Date()): StrokeClock {
  const minutes = Math.max(0, Math.round((now.getTime() - lastWell.getTime()) / 60000));
  const end = new Date(lastWell.getTime() + 270 * 60000);
  const left = 270 - minutes;
  return {
    minutes, inWindow: left > 0, windowEnds: hm(end),
    text: left > 0 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min since last known well; ${Math.floor(left / 60)} h ${left % 60} min left for IV thrombolysis (until ${hm(end)})` : `${Math.floor(minutes / 60)} h ${minutes % 60} min since last known well: outside the 4.5-hour window for IV thrombolysis; consider thrombectomy up to 24 hours if a large-vessel occlusion with salvageable brain on imaging`,
  };
}
export const LYSIS_EXCLUSIONS = [
  "Haemorrhage on CT, or a large area of established infarct",
  "Ischaemic stroke or serious head injury in the last 3 months",
  "Intracranial or spinal surgery in the last 3 months; previous intracranial haemorrhage",
  "Intra-axial intracranial tumour, aortic dissection, infective endocarditis",
  "GI bleeding or GI malignancy in the last 21 days; major surgery or trauma in the last 14 days",
  "Platelets under 100,000, INR over 1.7, aPTT over 40 s or PT over 15 s",
  "Treatment-dose low-molecular-weight heparin in the last 24 hours",
  "A DOAC in the last 48 hours (unless the relevant tests are normal)",
  "Blood pressure that cannot be brought below 185/110",
  "Blood glucose under 50 mg/dL (correct it and reassess)",
];
export const LYSIS_AFTER = [
  "Neuro observations and BP every 15 minutes for 2 hours, every 30 minutes for 6 hours, then hourly to 24 hours.",
  "Keep BP below 180/105 for 24 hours (labetalol 10–20 mg IV or a nicardipine infusion).",
  "No antiplatelets, anticoagulants, NG tube, arterial puncture or catheter for 24 hours if avoidable; CT or MRI at 24 hours before starting antiplatelets.",
  "New headache, vomiting, worse NIHSS or high BP: stop the infusion, urgent CT, check fibrinogen; cryoprecipitate 10 units and tranexamic acid 1 g IV for bleeding.",
  "Tongue or lip swelling: stop the infusion, give antihistamine and steroid, adrenaline if airway threatened (worse with ACE inhibitors).",
];
export const STROKE_TARGETS = ["Door to CT within 25 minutes, read within 45", "Door to needle within 60 minutes (aim for 45)", "Door to groin puncture within 90 minutes for thrombectomy"];

/* ================================================================== sepsis */

export interface SepsisStep { id: string; label: string; detail: string }
export function sepsisBundle(kg: number | undefined): SepsisStep[] {
  const vol = kg && kg > 0 ? `${Math.round(30 * kg)} ml` : "30 ml/kg";
  return [
    { id: "lactate", label: "Measure lactate", detail: "Remeasure within 2–4 hours if over 2 mmol/L." },
    { id: "cultures", label: "Blood cultures before antibiotics", detail: "Two sets; do not delay antibiotics by more than 45 minutes for cultures." },
    { id: "abx", label: "Broad-spectrum antibiotics", detail: "Within 1 hour of recognition in shock or probable sepsis; use the local antibiogram and source." },
    { id: "fluids", label: `${vol} crystalloid`, detail: "For hypotension or lactate 4 mmol/L or more: balanced crystalloid in boluses within 3 hours, reassessing after each." },
    { id: "pressors", label: "Vasopressors for MAP 65 or more", detail: "Noradrenaline if hypotensive during or after fluids; can start peripherally while central access is placed." },
  ];
}
export function qsofa(rr: number, sbp: number, altered: boolean) { const s = (rr >= 22 ? 1 : 0) + (sbp > 0 && sbp <= 100 ? 1 : 0) + (altered ? 1 : 0); return { score: s, text: s >= 2 ? `qSOFA ${s}: high risk of a poor outcome; look for organ dysfunction and escalate` : `qSOFA ${s}: does not rule out sepsis; use clinical judgement and NEWS2` }; }

/* ================================================================== DKA */

export const glucoseMmol = (v: number, unit: "mgdl" | "mmol") => (unit === "mgdl" ? v / 18 : v);
export interface DkaIn { glucose: number; unit: "mgdl" | "mmol"; ketones?: number; urineKetones2?: boolean; ph?: number; bicarb?: number; kg: number; k?: number; sbp?: number; frail?: boolean; knownDiabetes?: boolean }
export interface DkaOut { isDka: boolean; diagnosis: string; severe: string[]; insulin: string; insulinRate: number; potassium: string; fluids: { time: string; what: string }[]; targets: string[]; glucoseAdd: string; resolution: string }
/** Adult DKA (JBDS-IP 2023 / ADA 2024): diagnosis, severity, fixed-rate insulin, fluids with clock times and potassium. */
export function dkaPlan(i: DkaIn, start: Date = new Date()): DkaOut | null {
  if (!(i.kg > 0) || !(i.glucose > 0)) return null;
  const g = glucoseMmol(i.glucose, i.unit);
  const ketoneOk = (i.ketones ?? 0) >= 3 || !!i.urineKetones2;
  const acid = (i.ph !== undefined && i.ph < 7.3) || (i.bicarb !== undefined && i.bicarb < 15);
  const isDka = (g >= 11 || !!i.knownDiabetes) && ketoneOk && acid;
  const missing = [i.ketones === undefined && !i.urineKetones2 ? "ketones" : "", i.ph === undefined && i.bicarb === undefined ? "pH or bicarbonate" : ""].filter(Boolean);
  const diagnosis = isDka ? "Meets the criteria for DKA: glucose 11 mmol/L (200 mg/dL) or more or known diabetes, ketones 3 mmol/L or more (or urine 2+), and pH under 7.3 or bicarbonate under 15"
    : missing.length ? `Need ${missing.join(" and ")} to confirm DKA` : "Does not meet the DKA criteria; consider HHS if glucose is very high with osmolality over 320";
  const severe: string[] = [];
  if ((i.ketones ?? 0) > 6) severe.push("Ketones over 6 mmol/L");
  if (i.bicarb !== undefined && i.bicarb < 5) severe.push("Bicarbonate under 5");
  if (i.ph !== undefined && i.ph < 7.0) severe.push("pH under 7.0");
  if (i.k !== undefined && (i.k < 3.5 || i.k > 6)) severe.push("Potassium under 3.5 or over 6 on admission");
  if (i.sbp !== undefined && i.sbp < 90) severe.push("Systolic BP under 90");
  const rate = r1(Math.min(15, 0.1 * i.kg));
  const t = (h: number) => hm(new Date(start.getTime() + h * 3600000));
  const shocked = i.sbp !== undefined && i.sbp < 90;
  const slow = !!i.frail;
  const steps: [string, number][] = slow
    ? [["0.9% saline 1 L over 2 hours", 2], ["1 L over 4 hours", 4], ["1 L over 4 hours", 4], ["1 L over 6 hours", 6], ["1 L over 8 hours", 8]]
    : [["0.9% saline 1 L over 1 hour", 1], ["1 L over 2 hours", 2], ["1 L over 2 hours", 2], ["1 L over 4 hours", 4], ["1 L over 4 hours", 4], ["1 L over 6 hours", 6]];
  const fluids: { time: string; what: string }[] = [];
  if (shocked) fluids.push({ time: t(0), what: "Systolic under 90: 500 ml 0.9% saline over 10–15 minutes, repeat if still under 90, and call for senior help" });
  let h = 0;
  steps.forEach(([what, dur], k) => { fluids.push({ time: t(h), what: k === 0 ? what : `${what}, with potassium as below` }); h += dur; });
  const potassium = i.k === undefined ? "Potassium in each litre after the first, by the latest level: over 5.5: none; 3.5–5.5: 40 mmol per litre; under 3.5: senior review, more potassium needed (hold insulin if under 3.3)"
    : i.k > 5.5 ? `K ${i.k}: no potassium in the fluid yet; recheck in 1–2 hours`
    : i.k >= 3.5 ? `K ${i.k}: add 40 mmol potassium chloride to each litre of saline (not the first if it runs over an hour in shock)`
    : `K ${i.k}: under 3.5, senior review now; more potassium is needed${i.k < 3.3 ? " and insulin should wait until K is 3.3 or more (ADA)" : ""}; replace through a central line if over 20 mmol/hour`;
  return {
    isDka, diagnosis, severe,
    insulin: `Fixed-rate IV insulin 0.1 units/kg/hour: ${rate} units/hour (50 units soluble insulin in 50 ml 0.9% saline = ${rate} ml/hour). Continue the patient's long-acting basal insulin.`,
    insulinRate: rate, potassium, fluids,
    glucoseAdd: "When glucose falls under 14 mmol/L (250 mg/dL), add 10% glucose at 125 ml/hour alongside the saline; do not stop the insulin.",
    targets: [
      "Blood ketones fall by 0.5 mmol/L per hour or more (or bicarbonate rises by 3 per hour)",
      "Glucose falls by about 3 mmol/L (54 mg/dL) per hour",
      `If not, check the pump and line, then increase insulin by 1 unit/hour (to ${r1(rate + 1)})`,
      "Capillary glucose and ketones hourly; venous gas and potassium at 1 hour, 2 hours, then every 2 hours",
    ],
    resolution: "Resolved when pH is over 7.3 and ketones under 0.6 mmol/L (bicarbonate over 15): when eating, give the usual subcutaneous insulin with a meal and stop the IV insulin 30–60 minutes later.",
  };
}

/* ================================================================== alcohol withdrawal */

export const CIWA_ITEMS: { id: string; label: string; max: number; anchors: string }[] = [
  { id: "nausea", label: "Nausea and vomiting", max: 7, anchors: "0 none · 1 mild nausea · 4 intermittent nausea with dry heaves · 7 constant nausea, frequent vomiting" },
  { id: "tremor", label: "Tremor (arms extended, fingers spread)", max: 7, anchors: "0 none · 1 felt, not seen · 4 moderate, arms extended · 7 severe, even at rest" },
  { id: "sweats", label: "Paroxysmal sweats", max: 7, anchors: "0 none · 1 moist palms · 4 beads on the forehead · 7 drenching" },
  { id: "anxiety", label: "Anxiety", max: 7, anchors: "0 at ease · 1 mildly anxious · 4 moderately anxious or guarded · 7 acute panic" },
  { id: "agitation", label: "Agitation", max: 7, anchors: "0 normal activity · 1 somewhat more than normal · 4 fidgety and restless · 7 paces or thrashes about" },
  { id: "tactile", label: "Tactile disturbances (itching, pins and needles, crawling)", max: 7, anchors: "0 none · 1 very mild · 4 moderately severe hallucinations · 7 continuous hallucinations" },
  { id: "auditory", label: "Auditory disturbances", max: 7, anchors: "0 none · 1 very mild harshness · 4 moderately severe hallucinations · 7 continuous hallucinations" },
  { id: "visual", label: "Visual disturbances", max: 7, anchors: "0 none · 1 very mild sensitivity · 4 moderately severe hallucinations · 7 continuous hallucinations" },
  { id: "headache", label: "Headache, fullness in the head", max: 7, anchors: "0 none · 1 very mild · 4 moderately severe · 7 extremely severe" },
  { id: "orientation", label: "Orientation and clouding of sensorium", max: 4, anchors: "0 oriented, can do serial additions · 1 cannot add serially · 2 date wrong by up to 2 days · 3 by more than 2 days · 4 disoriented to place or person" },
];
export const ciwaTotal = (v: Record<string, number>) => CIWA_ITEMS.reduce((a, i) => a + Math.min(i.max, Math.max(0, v[i.id] ?? 0)), 0);
export function ciwaAction(score: number, opts: { liver?: boolean; elderly?: boolean } = {}): { band: string; action: string; next: string } {
  const lor = opts.liver || opts.elderly;
  const drug = lor ? "lorazepam 1–2 mg orally (liver disease or elderly)" : "chlordiazepoxide 25–50 mg orally (or diazepam 10–20 mg)";
  if (score < 8) return { band: "Minimal withdrawal", action: "No benzodiazepine needed for now; supportive care, fluids and thiamine.", next: "Reassess with CIWA-Ar every 4 hours for 72 hours." };
  if (score < 16) return { band: "Mild to moderate withdrawal", action: `Give ${drug}.`, next: "Reassess 1 hour after each dose; every 1–2 hours until under 8 on three readings, then every 4 hours." };
  return { band: score >= 20 ? "Severe withdrawal" : "Moderate to severe withdrawal", action: `Give ${lor ? "lorazepam 2–4 mg" : "chlordiazepoxide 50–100 mg (or diazepam 20 mg)"} and review by a doctor; consider a higher-dependency bed.`, next: "Reassess every hour; seizures, hallucinations or delirium need urgent senior review (delirium tremens: IV diazepam or lorazepam, ICU)." };
}
/** A reducing chlordiazepoxide course from a starting four-times-daily dose (rounded to 5 mg), usually over 7 days. */
export function chlordiazepoxideTaper(qdsMg: number): { day: number; doses: string; total: number }[] {
  if (!(qdsMg >= 10)) return [];
  const q = Math.min(50, qdsMg);
  const plan: [number, number][] = [[q, 4], [q, 4], [r5(q * 0.75), 4], [r5(q * 0.5), 4], [r5(q * 0.5), 2], [r5(q * 0.25), 2], [r5(q * 0.25), 1]];
  return plan.map(([d, n], i) => ({ day: i + 1, doses: n === 4 ? `${d} mg four times a day` : n === 2 ? `${d} mg twice a day` : `${d} mg at night`, total: d * n }));
}
export const ALCOHOL_THIAMINE = [
  "Everyone: thiamine before any glucose. Oral thiamine 100 mg three times a day if well nourished and no signs.",
  "At risk or suspected Wernicke's (confusion, ataxia, eye signs, or malnourished): IV thiamine 500 mg three times a day for 3–5 days (Pabrinex 2 pairs), then 250 mg daily.",
  "Correct magnesium, potassium and phosphate; watch for refeeding syndrome.",
  "Seizures: lorazepam or diazepam; no phenytoin for withdrawal seizures.",
];

/* ================================================================== diabetic foot */

export interface FootInfIn { signs: number; erythemaOver2cm: boolean; deep: boolean; sirs: number; probeBone: boolean }
/** IWGDF/IDSA infection severity from local signs (swelling, erythema 0.5 cm or more, tenderness, warmth, pus), depth and SIRS. */
export function footInfection(i: FootInfIn): { grade: string; level: 1 | 2 | 3 | 4; plan: string[] } {
  const osteo = i.probeBone ? ["Probe-to-bone positive: likely osteomyelitis; X-ray (repeat in 2–3 weeks if normal) or MRI; bone biopsy for culture if possible; usually 6 weeks of antibiotics, or 3 weeks after resection."] : [];
  if (i.signs < 2) return { grade: "Uninfected (IWGDF 1)", level: 1, plan: ["No antibiotics; do not swab an uninfected ulcer.", ...osteo] };
  if (i.sirs >= 2) return { grade: "Severe infection (IWGDF 4)", level: 4, plan: ["Admit; urgent surgical review for abscess, gas or necrotising infection.", "IV piperacillin-tazobactam (or a carbapenem) plus vancomycin or linezolid if MRSA is likely; narrow with tissue culture.", "Check glucose, renal function and for sepsis; 2–4 weeks of treatment for soft tissue.", ...osteo] };
  if (i.erythemaOver2cm || i.deep) return { grade: "Moderate infection (IWGDF 3)", level: 3, plan: ["Usually oral or IV amoxicillin-clavulanate (or clindamycin plus ciprofloxacin in penicillin allergy); add MRSA cover if likely.", "Take a tissue sample (curettage or biopsy) after debridement, not a swab; 2–4 weeks of treatment.", "Consider admission if ischaemic, poor control or unable to offload.", ...osteo] };
  return { grade: "Mild infection (IWGDF 2)", level: 2, plan: ["Oral antibiotics against staphylococci and streptococci: cephalexin or amoxicillin-clavulanate (clindamycin in penicillin allergy) for 1–2 weeks.", "Debride, offload and review in 2–3 days.", ...osteo] };
}
export const WAGNER = ["0: No open lesion; may have deformity or cellulitis", "1: Superficial ulcer", "2: Deep ulcer to tendon, capsule or bone", "3: Deep ulcer with abscess, osteomyelitis or joint sepsis", "4: Localised gangrene (forefoot or heel)", "5: Gangrene of the whole foot"];
export interface FootRiskIn { lops: boolean; pad: boolean; deformity: boolean; history: boolean }
/** IWGDF 2023 risk of ulceration and the screening interval. */
export function footRisk(i: FootRiskIn): { cat: 0 | 1 | 2 | 3; text: string; interval: string } {
  if ((i.lops || i.pad) && i.history) return { cat: 3, text: "Very high risk: loss of protective sensation or PAD with a previous ulcer, amputation or end-stage kidney disease", interval: "Every 1–3 months" };
  if ((i.lops && i.pad) || ((i.lops || i.pad) && i.deformity)) return { cat: 2, text: "High risk", interval: "Every 3–6 months" };
  if (i.lops || i.pad) return { cat: 1, text: "Moderate risk", interval: "Every 6–12 months" };
  return { cat: 0, text: "Very low risk", interval: "Once a year" };
}
export const abiText = (abi: number) => (abi > 1.3 ? "Over 1.3: arteries non-compressible (calcified); use toe pressures or TBI" : abi >= 0.9 ? "0.9–1.3: no significant PAD (but does not exclude it in diabetes)" : abi >= 0.5 ? "0.5–0.9: peripheral arterial disease; vascular referral if an ulcer does not heal" : "Under 0.5: severe ischaemia; urgent vascular referral");
export const FOOT_CARE_MD = [
  "# Looking after your feet",
  "",
  "- Look at both feet every day, including between the toes and the soles (use a mirror or ask someone).",
  "- Wash daily in lukewarm water (test it with your elbow); dry well between the toes.",
  "- Moisturise dry skin but not between the toes.",
  "- Never walk barefoot, even at home or in a temple; wear soft, well-fitting footwear with socks.",
  "- Check inside your shoes for stones before wearing them.",
  "- Cut nails straight across; do not cut corns yourself or use corn plasters.",
  "- Keep your sugar, blood pressure and cholesterol under control; stop smoking.",
  "",
  "## Come to the clinic the same day if",
  "- A cut, blister, sore or crack does not start healing in 2 days",
  "- Redness, swelling, warmth, pus or a bad smell",
  "- The foot changes shape or colour, or becomes painful",
].join("\n");

/* ================================================================== heat illness */

/** Heat index (NOAA, Rothfusz) from air temperature in °C and relative humidity in %. */
export function heatIndexC(tc: number, rh: number): number | null {
  if (!(rh >= 0 && rh <= 100) || !Number.isFinite(tc)) return null;
  const T = tc * 9 / 5 + 32;
  let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094);
  if ((hi + T) / 2 >= 80) {
    hi = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 0.00683783 * T * T - 0.05481717 * rh * rh + 0.00122874 * T * T * rh + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
    if (rh < 13 && T >= 80 && T <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    else if (rh > 85 && T >= 80 && T <= 87) hi += ((rh - 85) / 10) * ((87 - T) / 5);
  }
  return r1((hi - 32) * 5 / 9);
}
export const heatBand = (c: number) => (c >= 54 ? "Extreme danger: heat stroke likely" : c >= 41 ? "Danger: heat cramps and exhaustion likely, heat stroke possible with activity" : c >= 32 ? "Extreme caution: cramps and exhaustion possible" : c >= 27 ? "Caution: fatigue with prolonged exposure or activity" : "Lower risk");

export interface HeatIn { tempC: number; cns: boolean; vomiting: boolean; cramps: boolean; sweating: boolean }
export function heatIllness(i: HeatIn): { dx: string; level: 1 | 2 | 3; plan: string[] } {
  if (i.cns && i.tempC >= 40) return { dx: "Heat stroke", level: 3, plan: [
    "Cool first, transport second: start cooling within minutes, at the scene.",
    "Cold or ice-water immersion up to the neck is best; otherwise strip, spray with water and fan continuously, with ice packs to the neck, armpits and groin.",
    "Stop active cooling at 38.5–39 °C to avoid overshoot; check core (rectal) temperature every 5–10 minutes.",
    "Airway, oxygen; check glucose. IV 0.9% saline 1–2 L, then by BP and urine output; avoid overload.",
    "No paracetamol or aspirin (they do not work and can harm); benzodiazepine for shivering or seizures.",
    "Bloods: electrolytes, creatinine, CK, LFT, coagulation (DIC), ABG; watch for rhabdomyolysis, AKI and liver failure; admit to ICU or HDU.",
  ] };
  if (i.cns) return { dx: "Possible heat stroke (confusion with a high temperature)", level: 3, plan: ["Treat as heat stroke until proven otherwise: start rapid cooling now and recheck the core temperature (oral and axillary readings underestimate it).", "Look for other causes: sepsis, meningitis, malaria, drugs (anticholinergics, stimulants), thyroid storm."] };
  if (i.tempC >= 37.5 || i.vomiting) return { dx: "Heat exhaustion", level: 2, plan: ["Move to a cool, shaded place; lie down with the legs raised; remove extra clothing.", "Oral ORS or cool water in sips; IV 0.9% saline if vomiting or unable to drink.", "Cool with water spray and fanning; recheck temperature and mental state every 15–30 minutes.", "Admit if not better in 30–60 minutes, elderly, or with heart or kidney disease."] };
  if (i.cramps) return { dx: "Heat cramps", level: 1, plan: ["Rest in the shade; stretch and massage the muscle.", "ORS or a salt-and-sugar drink; avoid strenuous work for some hours."] };
  return { dx: "Heat stress", level: 1, plan: ["Rest in the shade, cool water or ORS, loose light clothing."] };
}
export const HEAT_PREVENT_MD = [
  "# Staying safe in the heat",
  "",
  "- Drink water often even if you are not thirsty; carry water when you go out.",
  "- Take ORS, lassi, nimbu pani or buttermilk with a little salt; avoid alcohol, tea, coffee and fizzy drinks in the heat.",
  "- Stay indoors between 12 noon and 3 pm; keep curtains closed in the day and windows open at night.",
  "- Wear light, loose cotton clothes, a hat or umbrella; never leave children or animals in a parked vehicle.",
  "- Outdoor work: rest in the shade often and do heavy work in the cooler hours.",
  "- Older people, small children, pregnant women and people with heart, kidney or mental illness need extra care.",
  "",
  "## Get help at once if",
  "- Confusion, fainting, fits, or very hot dry skin",
  "- Vomiting, not passing urine, or a fast heartbeat that does not settle with rest",
].join("\n");

/* ================================================================== wounds */

export const SUTURE_SITES: { site: string; size: string; removal: string }[] = [
  { site: "Face", size: "5-0 or 6-0 non-absorbable (nylon, polypropylene)", removal: "3–5 days" },
  { site: "Scalp", size: "3-0 or 4-0, or staples", removal: "7–10 days" },
  { site: "Ear, eyelid, lip", size: "6-0 (5-0 absorbable on the lip mucosa)", removal: "3–5 days" },
  { site: "Neck", size: "4-0 or 5-0", removal: "5–7 days" },
  { site: "Chest and abdomen", size: "3-0 or 4-0", removal: "7–10 days" },
  { site: "Back", size: "3-0 or 4-0", removal: "10–14 days" },
  { site: "Arm", size: "4-0", removal: "7–10 days" },
  { site: "Hand and fingers", size: "4-0 or 5-0", removal: "7–10 days" },
  { site: "Leg", size: "3-0 or 4-0", removal: "10–14 days" },
  { site: "Foot", size: "3-0 or 4-0", removal: "10–14 days" },
  { site: "Over a joint", size: "4-0", removal: "10–14 days" },
];
export interface TetanusIn { doses: "0-2" | "3+"; yearsSinceLast?: number; dirty: boolean }
/** Tetanus prophylaxis by wound and immunisation (CDC/ACIP table; Td in India). */
export function tetanusPlan(i: TetanusIn): { td: boolean; tig: boolean; text: string } {
  if (i.doses === "0-2") return { td: true, tig: i.dirty, text: i.dirty ? "Td now and complete the primary course, plus tetanus immunoglobulin 250 IU IM at a different site" : "Td now and complete the primary course (0, 1 and 6 months); no immunoglobulin for a clean minor wound" };
  const y = i.yearsSinceLast ?? 99;
  const limit = i.dirty ? 5 : 10;
  return y >= limit ? { td: true, tig: false, text: `Three or more doses, last ${y >= 99 ? "unknown" : `${y} years`} ago (${limit} years or more for a ${i.dirty ? "tetanus-prone" : "clean"} wound): one Td booster` } : { td: false, tig: false, text: `Three or more doses, last ${y} years ago: no tetanus vaccine needed now` };
}
export interface LaIn { kg: number; drug: "lidocaine" | "lidocaine-adr" | "bupivacaine"; percent: number }
/** Maximum local anaesthetic in mg and ml (lidocaine 3 mg/kg max 200 mg; with adrenaline 7 mg/kg max 500 mg; bupivacaine 2 mg/kg max 150 mg). */
export function laMax(i: LaIn): { mg: number; ml: number; text: string } | null {
  if (!(i.kg > 0) || !(i.percent > 0)) return null;
  const [perKg, cap, name] = i.drug === "lidocaine" ? [3, 200, "Lidocaine"] : i.drug === "lidocaine-adr" ? [7, 500, "Lidocaine with adrenaline"] : [2, 150, "Bupivacaine"];
  const mg = Math.round(Math.min(cap, perKg * i.kg));
  const ml = r1(mg / (i.percent * 10));
  return { mg, ml, text: `${name} ${i.percent}%: up to ${mg} mg = ${ml} ml (${perKg} mg/kg, maximum ${cap} mg)` };
}
export const WOUND_ABX = [
  "Bites (human, dog, cat): amoxicillin-clavulanate for 3–5 days; leave open or close loosely, except on the face.",
  "Heavily contaminated, crushed or devitalised wounds, and wounds over 8–12 hours old needing closure.",
  "Open fractures, wounds into a joint or tendon, and deep hand wounds.",
  "Diabetes, immunosuppression, lymphoedema or a prosthetic joint or valve nearby.",
];
export const WOUND_CLOSE = [
  "Irrigate well with tap water or saline under pressure (at least 100 ml per cm of wound); explore under good light for foreign bodies and tendon damage.",
  "Close most clean wounds within 6–8 hours (up to 24 hours on the face and scalp); otherwise delayed primary closure at 3–5 days.",
  "Tissue glue or strips for clean, straight, low-tension wounds under 5 cm, away from joints, hands and hair.",
  "Absorbable deep sutures (3-0 or 4-0 polyglactin) to close dead space in deep wounds; check sensation and movement distal to the wound before anaesthetic.",
  "X-ray glass injuries; refer tendon, nerve or vessel injuries, and complex facial or eyelid wounds.",
];
export function woundCareMd(site: string, removal: string, absorbable: boolean): string {
  return [
    "# Caring for your wound",
    "",
    "- Keep the dressing clean and dry for 48 hours; after that you may shower and pat dry.",
    "- Take paracetamol for pain if needed.",
    "- Keep the part raised for the first day to reduce swelling.",
    absorbable ? "- Your stitches dissolve on their own; no need to remove them." : `- Stitches out in ${removal} (${site.toLowerCase()}). Book a visit with the clinic or your nurse.`,
    "- After the stitches are out, protect the scar from the sun for a year.",
    "",
    "## Come back the same day if",
    "- Redness spreading, more pain or swelling, pus or a bad smell",
    "- Fever",
    "- The wound opens up, or numbness or weakness beyond the wound",
  ].join("\n");
}
