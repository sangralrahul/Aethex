/**
 * Update 40, on the device (no AI): acute asthma in children (PRAM), DKA and HHS hour by hour,
 * antenatal steroids and tocolysis, iron/B12/folate replacement, therapeutic drug levels, contrast
 * safety, pressure injuries (Braden) and hyperemesis gravidarum (PUQE).
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== acute asthma in children (PRAM) */

export const PRAM_ITEMS: { label: string; options: [number, string][] }[] = [
  { label: "Suprasternal retractions", options: [[0, "Absent"], [2, "Present"]] },
  { label: "Scalene muscle contraction", options: [[0, "Absent"], [2, "Present"]] },
  { label: "Air entry", options: [[0, "Normal"], [1, "Decreased at the bases"], [2, "Widespread decrease"], [3, "Absent or minimal"]] },
  { label: "Wheezing", options: [[0, "Absent"], [1, "Expiratory only"], [2, "Inspiratory and expiratory"], [3, "Audible without stethoscope, or silent chest"]] },
  { label: "SpO2 on room air", options: [[0, "95% or more"], [1, "92–94%"], [2, "Under 92%"]] },
];
export function pram(scores: number[]): { total: number; band: "mild" | "moderate" | "severe" } {
  const total = scores.reduce((a, b) => a + b, 0);
  return { total, band: total >= 8 ? "severe" : total >= 4 ? "moderate" : "mild" };
}
export function paedAsthmaPlan(band: "mild" | "moderate" | "severe", kg: number): string[] {
  const big = kg >= 20;
  const k = kg > 0 ? kg : 15;
  const steroid = `Dexamethasone ${r1(cap(0.6 * k, 16))} mg by mouth once (0.6 mg/kg, max 16 mg), or prednisolone ${Math.round(cap(2 * k, 40))} mg (1–2 mg/kg, max 40 mg) daily for 3–5 days.`;
  if (band === "mild") return [
    `Salbutamol ${big ? 10 : 5} puffs (100 micrograms each) by spacer, every 20 minutes for up to 3 doses if needed.`,
    steroid,
    "Reassess after 1 hour: PRAM 3 or less and comfortable for 1–4 hours: home with a written action plan.",
  ];
  if (band === "moderate") return [
    `Salbutamol ${big ? 10 : 5} puffs by spacer (or ${big ? "5 mg" : "2.5 mg"} nebulised) every 20 minutes for 3 doses, with ipratropium ${big ? "8" : "4"} puffs (20 micrograms each) or ${big ? "500" : "250"} micrograms nebulised with the first 3 doses.`,
    steroid,
    "Oxygen to keep SpO2 94–98%.",
    "Reassess every 20–60 minutes; admit if PRAM still 4 or more after 4 hours, or needing salbutamol more often than every 2 hours.",
  ];
  return [
    `Back-to-back nebulised salbutamol ${big ? "5 mg" : "2.5 mg"} with ipratropium ${big ? "500" : "250"} micrograms every 20 minutes for 3 doses, driven by oxygen; then continuous or hourly salbutamol.`,
    steroid.replace("by mouth once", "by mouth or IV"),
    `Magnesium sulphate ${Math.round(cap(50 * k, 2000))} mg (40–50 mg/kg, max 2 g) IV over 20 minutes if not improving after the first hour.`,
    "Call the paediatric ICU team; blood gas; consider IV salbutamol or aminophylline only with senior advice; no sedation.",
  ];
}
export const PAED_ASTHMA_HOME = [
  "Well enough to go home: PRAM 3 or less, SpO2 92% or more on air, salbutamol needed no more often than every 3–4 hours, and able to drink.",
  "Written action plan; check spacer technique; salbutamol 4–6 hourly for 1–2 days then as needed; finish steroids.",
  "Start or step up a preventer (inhaled steroid) after a moderate or severe attack; review in 2 days by the family doctor.",
  "Under 2 years with first wheeze: think of bronchiolitis (salbutamol often does not help).",
];

/* ================================================================== DKA and HHS hour by hour */

export function dkaFluidSchedule(sbp: number): { at: number; what: string }[] {
  const out: { at: number; what: string }[] = [];
  if (sbp > 0 && sbp < 90) out.push({ at: 0, what: "Shock (systolic under 90): 500 ml 0.9% saline over 10–15 minutes, repeat if still under 90; call senior and ICU." });
  out.push(
    { at: 0, what: "1 litre 0.9% saline over 1 hour." },
    { at: 1, what: "1 litre 0.9% saline with potassium over the next 2 hours." },
    { at: 3, what: "1 litre 0.9% saline with potassium over 2 hours." },
    { at: 5, what: "1 litre 0.9% saline with potassium over 4 hours." },
    { at: 9, what: "1 litre 0.9% saline with potassium over 4 hours." },
    { at: 13, what: "1 litre 0.9% saline with potassium over 6 hours; reassess fluid status (slower in elderly, heart or kidney failure, age 18–25)." },
  );
  return out;
}
export const fixedInsulin = (kg: number) => r1(0.1 * (kg > 0 ? kg : 70));
export function kclFor(k: number | null): string {
  if (k === null) return "Check potassium on the gas before adding any.";
  if (k > 5.5) return "Potassium over 5.5: no potassium in the fluids yet; recheck in 1–2 hours.";
  if (k >= 3.5) return "Potassium 3.5–5.5: 40 mmol/L potassium chloride in each litre.";
  return "Potassium under 3.5: senior review; extra potassium through a central line or in HDU, and do not start insulin until potassium is rising.";
}
export function dkaProgress(prev: { ketones: number; bicarb: number; glucose: number }, now: { ketones: number; bicarb: number; glucose: number }, hours: number): { onTrack: boolean; text: string } {
  if (!(hours > 0)) return { onTrack: true, text: "" };
  const kFall = (prev.ketones - now.ketones) / hours, bRise = (now.bicarb - prev.bicarb) / hours, gFall = (prev.glucose - now.glucose) / hours;
  const onTrack = prev.ketones > 0 ? kFall >= 0.5 : bRise >= 3 || gFall >= 54;
  return { onTrack, text: onTrack ? `On track: ketones falling ${r1(kFall)} mmol/L/hour, bicarbonate rising ${r1(bRise)}/hour, glucose falling ${Math.round(gFall)} mg/dL/hour.` : `Not on track (ketones should fall 0.5 mmol/L/hour, or bicarbonate rise 3 mmol/L/hour, or glucose fall 54 mg/dL/hour): check the pump and line, then increase insulin by 1 unit/hour.` };
}
export const DKA_GLUCOSE = "When glucose falls below 252 mg/dL (14 mmol/L): add 10% glucose at 125 ml/hour alongside the saline; keep the insulin running to clear ketones.";
export const DKA_RESOLVED = "Resolved when ketones are under 0.6 mmol/L and venous pH is over 7.3: if eating, give the usual subcutaneous insulin with a meal and stop the infusion 30–60 minutes later. Keep long-acting insulin going throughout.";
export function hhsPlan(kg: number, ketones: number | null): string[] {
  const k = kg > 0 ? kg : 70;
  return [
    "Hyperosmolar hyperglycaemic state: glucose usually 540 mg/dL or more, osmolality 320 or more, pH over 7.3 and ketones under 3.",
    "0.9% saline 1 litre over 1 hour, then guided by osmolality: aim for a fall of 3–8 mOsm/kg per hour and glucose no faster than 90 mg/dL per hour; replace about half the estimated deficit in 12 hours.",
    ketones !== null && ketones > 1 ? `Ketones over 1 mmol/L: start insulin now at ${r1(0.05 * k)} units/hour (0.05 units/kg/hour).` : `No insulin at first: start ${r1(0.05 * k)} units/hour (0.05 units/kg/hour) only once glucose stops falling with fluids alone.`,
    "A rising sodium is acceptable if osmolality is falling; recheck osmolality, sodium, glucose and potassium every hour for 6 hours.",
    "Prophylactic LMWH (high clot risk); check feet daily (pressure ulcers); look for the trigger (infection, MI, stroke).",
  ];
}

/* ================================================================== antenatal steroids and tocolysis */

export function steroidPlan(gaWeeks: number, daysSinceCourse: number | null, diabetes: boolean): { give: boolean; steps: string[] } {
  const steps: string[] = [];
  let give = false;
  if (gaWeeks < 22) steps.push("Under 22 weeks: steroids are not recommended.");
  else if (gaWeeks < 24) { give = true; steps.push("22–23+6 weeks: give only if active neonatal care is planned, after discussion with the parents and neonatologists."); }
  else if (gaWeeks < 35) { give = true; steps.push("24–34+6 weeks with birth likely within 7 days (preterm labour, PPROM or planned preterm birth): give a course."); }
  else if (gaWeeks < 37) steps.push("35–36+6 weeks: only in selected cases (e.g. planned caesarean) where your unit's policy allows; benefit is small and neonatal hypoglycaemia is more common.");
  else steps.push("37 weeks or more: not indicated (consider for elective caesarean before 39 weeks only per local policy).");
  if (give) {
    steps.push("Betamethasone 12 mg IM, two doses 24 hours apart; or dexamethasone 6 mg IM every 12 hours for 4 doses.");
    steps.push("Most benefit if birth happens 24 hours to 7 days after the first dose; do not delay an indicated birth for steroids.");
    if (daysSinceCourse !== null) steps.push(daysSinceCourse >= 7 && gaWeeks < 34 ? "A single rescue course is reasonable: more than 7 days since the first course, under 34 weeks, and birth expected within 7 days." : "A repeat course is not recommended now.");
  }
  if (diabetes) steps.push("Diabetes: steroids raise glucose for about 72 hours: increase insulin or start a sliding-scale/variable-rate insulin with hourly glucose.");
  return { give, steps };
}
export const TOCO_CI = ["Chorioamnionitis or suspected infection", "Fetal distress or abnormal CTG", "Antepartum haemorrhage or abruption", "Fetal death or lethal anomaly", "Severe pre-eclampsia", "Advanced labour (cervix over 4 cm)", "Maternal heart disease (with nifedipine)"];
export function tocolysis(drug: "nifedipine" | "atosiban" | "indomethacin", gaWeeks: number): string[] {
  const head = gaWeeks >= 34 ? ["34 weeks or more: tocolysis is not recommended."] : ["Aim: delay birth up to 48 hours for steroids and in-utero transfer, between 24 and 33+6 weeks."];
  if (gaWeeks >= 34) return head;
  if (drug === "nifedipine") return [...head, "Nifedipine 20 mg by mouth, then 10–20 mg every 6–8 hours for up to 48 hours (max 160 mg a day).", "Check BP and pulse every 30 minutes for the first hour; avoid with magnesium in hypotension and heart disease."];
  if (drug === "atosiban") return [...head, "Atosiban 6.75 mg IV over 1 minute, then 18 mg/hour for 3 hours, then 6 mg/hour for up to 45 hours (48 hours in total).", "Few side effects; preferred with heart disease or twins."];
  return [...head, gaWeeks >= 32 ? "Indomethacin is not used after 32 weeks (ductus closure, oligohydramnios)." : "Indomethacin 50–100 mg by mouth or rectally, then 25 mg every 6 hours for up to 48 hours (under 32 weeks only)."];
}
export function mgNeuro(gaWeeks: number): string {
  if (gaWeeks < 30) return "Under 30 weeks: give magnesium sulphate for fetal neuroprotection when birth is expected within 24 hours: 4 g IV over 15 minutes, then 1 g/hour until birth or for 24 hours.";
  if (gaWeeks < 34) return "30–33+6 weeks: consider magnesium sulphate for neuroprotection (same regimen) per local policy.";
  return "34 weeks or more: magnesium for neuroprotection is not indicated.";
}

/* ================================================================== iron, B12 and folate */

export function ganzoniDeficit(kg: number, hb: number, target: number): number {
  if (!(kg > 0 && hb > 0)) return 0;
  const stores = kg >= 35 ? 500 : 15 * kg;
  return Math.round(kg * Math.max(0, target - hb) * 2.4 + stores);
}
export function ivIronPlan(deficit: number, product: "fcm" | "sucrose", kg: number): string[] {
  if (deficit <= 0) return [];
  if (product === "fcm") {
    const maxDose = Math.min(1000, Math.round(20 * (kg > 0 ? kg : 50)));
    const doses = Math.ceil(deficit / maxDose);
    return [`Ferric carboxymaltose: ${doses} dose${doses === 1 ? "" : "s"} of up to ${maxDose} mg (20 mg/kg, max 1,000 mg) in 100–250 ml saline over at least 15 minutes, at least 7 days apart.`, "Check phosphate if repeated doses (hypophosphataemia); allowed in the 2nd and 3rd trimester."];
  }
  const doses = Math.ceil(deficit / 200);
  return [`Iron sucrose: ${doses} doses of 200 mg (in 100–200 ml saline over 15–30 minutes), up to 3 times a week.`, "Observe for 30 minutes after each dose; have resuscitation equipment ready."];
}
export function oralIron(child: boolean, kg: number): string[] {
  return child
    ? [`Elemental iron ${Math.round(3 * (kg > 0 ? kg : 10))} mg once daily (3 mg/kg/day), between meals, with juice; continue 3 months after Hb is normal.`]
    : ["One iron tablet (about 60–100 mg elemental iron) once daily or on alternate days (absorbed better), on an empty stomach or with vitamin C; avoid tea, coffee, milk and calcium within 2 hours.", "Expect Hb to rise about 1–2 g/dL in 3–4 weeks; if not, check adherence, ongoing loss (worms, menorrhagia, GI bleed) and coeliac disease; switch to IV iron if intolerant or in late pregnancy.", "Continue for 3 months after Hb is normal to fill the stores (ferritin over 50)."];
}
export function b12Plan(neuro: boolean, malabsorption: boolean): string[] {
  return [
    neuro ? "Neurological signs: hydroxocobalamin 1 mg IM on alternate days until no further improvement (at least 2–3 weeks), then 1 mg every 2 months." : "Hydroxocobalamin 1 mg IM three times a week for 2 weeks (or cyanocobalamin 1,000 micrograms IM daily for 7 days, weekly for 4 weeks), then maintenance.",
    malabsorption ? "Maintenance for life: 1 mg IM every 3 months (pernicious anaemia, gastrectomy, ileal disease)." : "Dietary deficiency (common with vegetarian diets): oral cyanocobalamin 1,000 micrograms daily works, with diet advice (milk, curd, eggs, fortified foods).",
    "If folate is also low, start B12 first or together: folate alone can worsen nerve damage.",
    "Reticulocytes rise by day 5–7 and Hb by 1 g/dL a week; check potassium in severe anaemia in the first days (it can fall).",
  ];
}
export function folatePlan(context: "deficiency" | "prevention" | "high-risk"): string {
  if (context === "deficiency") return "Folic acid 5 mg daily for 4 months (longer if the cause continues, e.g. haemolysis, methotrexate, dialysis); check B12 first.";
  if (context === "high-risk") return "Folic acid 5 mg daily from before conception to 12 weeks: previous neural tube defect, epilepsy medicines, diabetes, BMI 30 or more, sickle cell or thalassaemia.";
  return "Folic acid 400 micrograms daily from at least 1 month before conception to 12 weeks of pregnancy (India: IFA tablets continue through pregnancy).";
}

/* ================================================================== therapeutic drug levels */

export interface Tdm { id: string; name: string; unit: string; low: number; high: number; toxic: number; sample: string; note: string }
export const TDM: Tdm[] = [
  { id: "digoxin", name: "Digoxin", unit: "ng/mL", low: 0.5, high: 0.9, toxic: 2, sample: "At least 6 hours after a dose (ideally 8–12 hours).", note: "Heart failure target 0.5–0.9; AF may tolerate up to 2. Low potassium, magnesium, amiodarone and kidney disease raise toxicity." },
  { id: "lithium", name: "Lithium", unit: "mmol/L", low: 0.4, high: 1.0, toxic: 1.5, sample: "12 hours after the last dose; 5–7 days after any change, then every 3 months.", note: "Maintenance 0.4–0.8 (0.8–1.0 for acute mania). NSAIDs, ACE inhibitors, thiazides and dehydration raise levels." },
  { id: "phenytoin", name: "Phenytoin", unit: "mg/L", low: 10, high: 20, toxic: 25, sample: "Trough (before a dose); 5–7 days after a change (non-linear kinetics).", note: "Correct for low albumin (below). Nystagmus over 20, ataxia over 30." },
  { id: "valproate", name: "Valproate", unit: "mg/L", low: 50, high: 100, toxic: 150, sample: "Trough.", note: "Levels guide adherence and toxicity more than dose; check ammonia if drowsy." },
  { id: "carbamazepine", name: "Carbamazepine", unit: "mg/L", low: 4, high: 12, toxic: 15, sample: "Trough, 2–4 weeks after starting (auto-induction).", note: "Watch sodium; many interactions (it induces liver enzymes)." },
  { id: "theophylline", name: "Theophylline", unit: "mg/L", low: 10, high: 20, toxic: 20, sample: "4–6 hours after a slow-release dose.", note: "Smoking lowers levels; ciprofloxacin, clarithromycin and heart failure raise them." },
  { id: "vancomycin", name: "Vancomycin (trough)", unit: "mg/L", low: 10, high: 20, toxic: 25, sample: "Trough before the 4th dose.", note: "15–20 for serious infections (or AUC 400–600 where available)." },
  { id: "gentamicin", name: "Gentamicin (once-daily trough)", unit: "mg/L", low: 0, high: 1, toxic: 2, sample: "Trough before the next dose (or 6–14 hours post-dose for the Hartford nomogram).", note: "Trough over 1: extend the interval; check kidney function." },
  { id: "tacrolimus", name: "Tacrolimus", unit: "ng/mL", low: 5, high: 15, toxic: 20, sample: "12-hour trough.", note: "Target depends on organ and time since transplant; azoles, macrolides and diltiazem raise levels." },
];
/** Phenytoin corrected for albumin (Winter–Tozer). */
export function phenytoinCorrected(measured: number, albuminGdl: number, esrd: boolean): number {
  return r1(measured / ((esrd ? 0.1 : 0.2) * albuminGdl + 0.1));
}
export function interpretLevel(id: string, level: number): { band: "low" | "therapeutic" | "high" | "toxic"; text: string } {
  const d = TDM.find((x) => x.id === id);
  if (!d) return { band: "therapeutic", text: "" };
  if (level >= d.toxic) return { band: "toxic", text: `${level} ${d.unit}: in the toxic range (${d.toxic} or more): withhold doses, check for symptoms and ECG where relevant, recheck.` };
  if (level > d.high) return { band: "high", text: `${level} ${d.unit}: above the usual range (${d.low}–${d.high}): reduce the dose or extend the interval and recheck.` };
  if (level < d.low) return { band: "low", text: `${level} ${d.unit}: below the usual range (${d.low}–${d.high}): check adherence and timing before increasing.` };
  return { band: "therapeutic", text: `${level} ${d.unit}: within the usual range (${d.low}–${d.high}).` };
}

/* ================================================================== contrast safety */

export function contrastKidney(egfr: number | null, aki: boolean, dialysis: boolean, onMetformin: boolean): string[] {
  const out: string[] = [];
  if (dialysis) out.push("On dialysis: contrast can be given; no need to arrange extra dialysis unless fluid overload is a concern.");
  else if (aki || (egfr !== null && egfr < 30)) out.push("High risk of contrast-associated AKI (eGFR under 30 or AKI): use contrast only if the benefit is clear; lowest dose; IV 0.9% saline 1 ml/kg/hour for 6–12 hours before and after (or 3 ml/kg/hour for 1 hour before and 1 ml/kg/hour for 6 hours after) if fluid status allows; stop NSAIDs and avoid repeat contrast within 48–72 hours; recheck creatinine at 48–72 hours.");
  else if (egfr !== null && egfr < 45) out.push("eGFR 30–44: risk is low; consider IV fluids if other risk factors (diabetes, heart failure, dehydration).");
  else out.push("eGFR 45 or more: no special kidney precautions needed for IV contrast.");
  if (onMetformin) out.push(aki || (egfr !== null && egfr < 30) ? "Metformin: stop at the time of contrast and for 48 hours; restart when creatinine is stable." : "Metformin: no need to stop (eGFR 30 or more without AKI).");
  out.push("N-acetylcysteine and bicarbonate do not prevent contrast AKI; gadolinium (MRI): avoid group I agents when eGFR is under 30 (NSF risk).");
  return out;
}
export function premedication(urgent: boolean, previousSevere: boolean): string[] {
  if (previousSevere) return ["Previous severe (anaphylactic) reaction: avoid iodinated contrast if any alternative exists; if essential, use a different agent with premedication and an anaesthetist present."];
  return urgent
    ? ["Urgent premedication: hydrocortisone 200 mg IV 5 hours and 1 hour before, plus chlorphenamine 10 mg (or diphenhydramine 50 mg) IV 1 hour before.", "Use a different contrast agent from the one that caused the reaction."]
    : ["Elective premedication: prednisolone 50 mg by mouth 13, 7 and 1 hour before, plus an antihistamine (chlorphenamine 4 mg or cetirizine 10 mg) 1 hour before.", "Use a different contrast agent; premedication reduces but does not abolish risk."];
}
export const CONTRAST_REACTIONS = [
  "Mild (urticaria, itching): observe 30 minutes; oral antihistamine.",
  "Bronchospasm: oxygen, salbutamol; IM adrenaline 0.5 mg if severe.",
  "Anaphylaxis (hypotension with tachycardia, stridor): IM adrenaline 0.5 mg (0.01 mg/kg in children), oxygen, IV fluids; call for help.",
  "Vasovagal (hypotension with bradycardia): legs up, IV fluids, atropine 0.6–1 mg IV.",
  "Extravasation: stop, elevate the limb, cold packs; surgical review if blistering, pain or compartment signs.",
  "Pregnancy: iodinated contrast can be used when needed (check the baby's thyroid after birth); breastfeeding can continue.",
];

/* ================================================================== pressure injuries (Braden) */

export const BRADEN: { label: string; max: number; options: string[] }[] = [
  { label: "Sensory perception", max: 4, options: ["1 Completely limited", "2 Very limited", "3 Slightly limited", "4 No impairment"] },
  { label: "Moisture", max: 4, options: ["1 Constantly moist", "2 Very moist", "3 Occasionally moist", "4 Rarely moist"] },
  { label: "Activity", max: 4, options: ["1 Bedfast", "2 Chairfast", "3 Walks occasionally", "4 Walks frequently"] },
  { label: "Mobility", max: 4, options: ["1 Completely immobile", "2 Very limited", "3 Slightly limited", "4 No limitation"] },
  { label: "Nutrition", max: 4, options: ["1 Very poor", "2 Probably inadequate", "3 Adequate", "4 Excellent"] },
  { label: "Friction and shear", max: 3, options: ["1 Problem", "2 Potential problem", "3 No apparent problem"] },
];
export function braden(scores: number[]): { total: number; risk: string; plan: string[] } {
  const total = scores.reduce((a, b) => a + b, 0);
  const risk = total <= 9 ? "very high risk" : total <= 12 ? "high risk" : total <= 14 ? "moderate risk" : total <= 18 ? "at risk" : "no specific risk";
  const plan = total > 18 ? ["Usual care; reassess on any change in condition."] : [
    `Reposition every ${total <= 12 ? "2" : "2–4"} hours (30° tilt, document on a chart); ${total <= 12 ? "pressure-redistributing (air) mattress" : "high-specification foam mattress"}.`,
    "Float the heels off the bed (pillow under the calves); avoid lying directly on the hip bone; limit head-of-bed elevation to 30° if possible.",
    "Keep skin clean and dry; barrier cream for incontinence; check skin over bony points at least daily.",
    "Nutrition: dietitian review if poor intake; protein about 1.25–1.5 g/kg a day with enough calories and fluids.",
  ];
  return { total, risk, plan };
}
export const PI_STAGES: { stage: string; desc: string; care: string }[] = [
  { stage: "Stage 1", desc: "Intact skin with non-blanchable redness", care: "Offload completely; protect with a film or foam dressing; reassess daily." },
  { stage: "Stage 2", desc: "Partial-thickness skin loss (shallow open ulcer or blister)", care: "Moist wound healing (hydrocolloid or foam); keep blisters intact; offload." },
  { stage: "Stage 3", desc: "Full-thickness skin loss; fat visible, no bone or tendon", care: "Debride slough, manage exudate (foam, alginate), treat infection; nutrition; tissue viability review." },
  { stage: "Stage 4", desc: "Full-thickness tissue loss with exposed bone, tendon or muscle", care: "Surgical or plastics review; consider osteomyelitis (X-ray/MRI, bone biopsy); negative pressure therapy where suitable." },
  { stage: "Unstageable", desc: "Base covered by slough or eschar", care: "Debride to stage (except stable dry heel eschar: leave intact)." },
  { stage: "Deep tissue injury", desc: "Purple or maroon intact skin, or blood-filled blister", care: "Offload; may evolve rapidly; document and monitor." },
];

/* ================================================================== hyperemesis gravidarum (PUQE) */

export const PUQE: { label: string; options: string[] }[] = [
  { label: "Hours feeling nauseated in the last 24 hours", options: ["Not at all", "1 hour or less", "2–3 hours", "4–6 hours", "More than 6 hours"] },
  { label: "Vomiting episodes in the last 24 hours", options: ["None", "1–2", "3–4", "5–6", "7 or more"] },
  { label: "Retching or dry heaves in the last 24 hours", options: ["None", "1–2", "3–4", "5–6", "7 or more"] },
];
export function puqe(a: number, b: number, c: number): { score: number; band: "mild" | "moderate" | "severe" } {
  const score = a + b + c;
  return { score, band: score >= 12 ? "severe" : score >= 7 ? "moderate" : "mild" };
}
export function hgPlan(band: "mild" | "moderate" | "severe", ketones: boolean, weightLossPct: number): { admit: boolean; steps: string[] } {
  const admit = band === "severe" && (ketones || weightLossPct >= 5);
  const steps = [
    "First line: doxylamine–pyridoxine (10/10 mg, 2 at night, up to 4 a day), or cyclizine 50 mg three times daily, promethazine 25 mg at night, or prochlorperazine 5–10 mg three times daily.",
    "Second line: ondansetron 4–8 mg up to three times daily (small possible cleft risk in the first trimester: discuss), or metoclopramide 10 mg three times daily (max 5 days).",
  ];
  if (band !== "mild") steps.push("Unable to keep fluids down: day-unit IV 0.9% saline with potassium chloride (not dextrose before thiamine), IV antiemetic, and thiamine 100 mg orally three times daily (or IV Pabrinex if vomiting is prolonged).");
  if (band === "severe") steps.push("Refractory: hydrocortisone 100 mg IV twice daily, then prednisolone 40–50 mg daily tapered to the lowest effective dose (specialist decision).");
  steps.push("Admitted: thromboprophylaxis with LMWH, check urea, electrolytes, liver and thyroid tests, urine ketones; consider molar or multiple pregnancy on ultrasound.", "Small frequent dry meals, ginger can help; emotional support: hyperemesis is not 'just morning sickness'.");
  return { admit, steps };
}
