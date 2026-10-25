/**
 * Update 31, on the device (no AI): pneumonia and UTI antibiotics, CKD care, preterm labour,
 * epilepsy and first seizure, fever in children under 5, cirrhosis and ascites, dementia and memory,
 * and hypertensive emergencies.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ================================================================== pneumonia and UTI */

export interface CurbIn { confusion: boolean; urea?: number; ureaUnit: "mgdl" | "mmol" | "bun"; rr: number; sbp: number; dbp: number; age: number }
/** CURB-65 (CRB-65 when urea is not known). Urea over 7 mmol/L = urea over 42 mg/dL = BUN over 19 mg/dL. */
export function curb65(i: CurbIn): { score: number; crb: boolean; text: string; setting: "home" | "ward" | "icu" } {
  const ureaHigh = i.urea === undefined ? false : i.ureaUnit === "mmol" ? i.urea > 7 : i.ureaUnit === "mgdl" ? i.urea > 42 : i.urea > 19;
  const s = (i.confusion ? 1 : 0) + (ureaHigh ? 1 : 0) + (i.rr >= 30 ? 1 : 0) + ((i.sbp > 0 && i.sbp < 90) || (i.dbp > 0 && i.dbp <= 60) ? 1 : 0) + (i.age >= 65 ? 1 : 0);
  const crb = i.urea === undefined;
  if (crb) return s === 0 ? { score: s, crb, setting: "home", text: "CRB-65 0: low risk; home treatment usually suitable" } : s <= 2 ? { score: s, crb, setting: "ward", text: `CRB-65 ${s}: consider hospital assessment` } : { score: s, crb, setting: "icu", text: `CRB-65 ${s}: urgent hospital admission` };
  return s <= 1 ? { score: s, crb, setting: "home", text: `CURB-65 ${s}: low risk (under 3% mortality); home treatment usually suitable` } : s === 2 ? { score: s, crb, setting: "ward", text: "CURB-65 2: moderate risk (about 9%); short admission or close follow-up" } : { score: s, crb, setting: "icu", text: `CURB-65 ${s}: severe (15–40%); admit, assess for ICU especially at 4–5` };
}
export interface CapIn { setting: "home" | "ward" | "icu"; comorbid: boolean; pseudomonas: boolean; mrsa: boolean; penAllergy: boolean }
export function capAntibiotics(i: CapIn): string[] {
  const out: string[] = [];
  if (i.setting === "home") {
    if (i.penAllergy) out.push("Doxycycline 200 mg on day 1, then 100 mg once daily (or azithromycin 500 mg daily for 3 days)");
    else if (i.comorbid) out.push("Amoxicillin-clavulanate 625 mg 3 times a day plus azithromycin 500 mg daily for 3 days (or doxycycline 100 mg twice daily)");
    else out.push("Amoxicillin 1 g 3 times a day (or 500 mg 3 times a day for milder illness); add doxycycline or azithromycin if atypical infection is suspected");
    out.push("Duration 5 days if improving and afebrile for 48 hours");
  } else {
    out.push(i.penAllergy ? "IV levofloxacin 750 mg once daily (after sputum for TB: fluoroquinolones can mask TB) or as local policy" : `IV ceftriaxone ${i.setting === "icu" ? "2 g" : "1–2 g"} once daily (or amoxicillin-clavulanate 1.2 g 8-hourly) plus azithromycin 500 mg once daily`);
    if (i.pseudomonas) out.push("Pseudomonas risk (bronchiectasis, recent IV antibiotics, frequent COPD admissions): piperacillin-tazobactam 4.5 g 6–8-hourly instead of ceftriaxone, with azithromycin");
    if (i.mrsa) out.push("MRSA risk or necrotising pneumonia: add vancomycin (loading 25 mg/kg, then by levels) or linezolid 600 mg 12-hourly");
    out.push(`Duration 5–7 days if stable; switch to oral when afebrile 48 hours and eating${i.setting === "icu" ? "; add oseltamivir in the flu season" : ""}`);
  }
  out.push("Cough over 2 weeks, weight loss or haemoptysis: sputum CBNAAT/smear for TB before quinolones.");
  return out;
}
export type UtiType = "cystitis-f" | "cystitis-m" | "pyelo-out" | "pyelo-in" | "pregnancy" | "catheter" | "child";
export const UTI_TYPES: [UtiType, string][] = [["cystitis-f", "Cystitis, non-pregnant woman"], ["cystitis-m", "Lower UTI in a man"], ["pyelo-out", "Pyelonephritis, well enough for home"], ["pyelo-in", "Pyelonephritis or complicated UTI, admitted"], ["pregnancy", "UTI or asymptomatic bacteriuria in pregnancy"], ["catheter", "Catheter-associated UTI"], ["child", "Child (over 3 months)"]];
export function utiAntibiotics(t: UtiType, egfr: number | null, kg?: number, esbl?: boolean): string[] {
  const nitroOk = egfr === null || egfr >= 45;
  const nitro = nitroOk ? "nitrofurantoin 100 mg modified-release twice daily" : "";
  switch (t) {
    case "cystitis-f": return [nitroOk ? `First choice: ${nitro} for 5 days` : "Nitrofurantoin: avoid (eGFR under 45)", "Or fosfomycin 3 g single dose", "Cotrimoxazole or ciprofloxacin only if the culture shows sensitivity (high resistance in India)", "Culture if recurrent, failed treatment or atypical"];
    case "cystitis-m": return ["Send urine culture first", nitroOk ? `${nitro[0].toUpperCase() + nitro.slice(1)} for 7 days, or by culture` : "By culture (nitrofurantoin avoided with eGFR under 45)", "Fever, perineal pain or a tender prostate: prostatitis: a quinolone (by culture) for 2–4 weeks"];
    case "pyelo-out": return ["Culture before treatment", "One dose of IV ceftriaxone 1 g (or amikacin 15 mg/kg) in clinic, then oral by culture", "Oral options: cefixime 200 mg twice daily or amoxicillin-clavulanate 625 mg 3 times a day for 10–14 days; ciprofloxacin 500 mg twice daily for 7 days only if sensitive", "Review in 48 hours; admit if vomiting or not improving"];
    case "pyelo-in": return ["Blood and urine cultures; ultrasound for obstruction or abscess", esbl ? "ESBL risk (recent antibiotics or hospital, previous ESBL): ertapenem 1 g once daily or piperacillin-tazobactam 4.5 g 8-hourly" : "IV ceftriaxone 1–2 g once daily, or amikacin 15 mg/kg once daily (check creatinine)", "Step down by culture when afebrile 48 hours; 7–14 days in total", "Obstructed infected kidney: urgent decompression (urology)"];
    case "pregnancy": return ["Always treat, including asymptomatic bacteriuria; send culture first and after treatment (test of cure)", "Cephalexin 500 mg twice daily (or 4 times a day) for 7 days, or amoxicillin-clavulanate 625 mg 3 times a day", nitroOk ? "Nitrofurantoin 100 mg twice daily for 7 days (avoid from 36 weeks)" : "Nitrofurantoin avoided (eGFR under 45)", "Avoid quinolones and tetracyclines; avoid trimethoprim in the first trimester", "Pyelonephritis in pregnancy: admit for IV ceftriaxone"];
    case "catheter": return ["Treat only if symptomatic (fever, rigors, flank pain, delirium): not for a positive dipstick or culture alone", "Remove or change the catheter and take the culture from the new one", "Antibiotic as for pyelonephritis, guided by culture, for 7 days (10–14 if slow response)"];
    case "child": {
      const w = kg && kg > 0 ? kg : 10;
      return ["Under 3 months: refer and treat as possible sepsis", `Cefixime ${Math.round(4 * w)} mg twice daily (8 mg/kg/day) for 7–10 days, or by culture`, `Unwell or vomiting: IV ceftriaxone ${Math.round(Math.min(2000, 50 * w))} mg once daily (50 mg/kg)`, "Ultrasound after a first febrile UTI under 2 years or atypical UTI"];
    }
  }
}

/* ================================================================== CKD */

/** CKD-EPI 2021 (race-free) eGFR from creatinine in mg/dL. */
export function ckdEpi2021(creat: number, age: number, female: boolean): number | null {
  if (!(creat > 0) || !(age >= 18)) return null;
  const k = female ? 0.7 : 0.9, a = female ? -0.241 : -0.302;
  const v = 142 * Math.min(creat / k, 1) ** a * Math.max(creat / k, 1) ** -1.2 * 0.9938 ** age * (female ? 1.012 : 1);
  return Math.round(v);
}
export const gStage = (e: number) => (e >= 90 ? "G1" : e >= 60 ? "G2" : e >= 45 ? "G3a" : e >= 30 ? "G3b" : e >= 15 ? "G4" : "G5");
export const aStage = (acr: number) => (acr < 30 ? "A1" : acr <= 300 ? "A2" : "A3");
/** KDIGO risk (heat map) and monitoring visits a year. */
export function kdigoRisk(e: number, acr: number): { g: string; a: string; risk: "low" | "moderate" | "high" | "very high"; perYear: string } {
  const g = gStage(e), a = aStage(acr);
  const gi = ["G1", "G2", "G3a", "G3b", "G4", "G5"].indexOf(g), ai = ["A1", "A2", "A3"].indexOf(a);
  const score = Math.max(0, gi - 1) + ai;
  const risk = gi >= 4 ? "very high" : score === 0 ? "low" : score === 1 ? "moderate" : score === 2 ? "high" : "very high";
  const perYear = gi === 5 ? "4 or more times a year" : risk === "very high" ? "3 or more times a year" : risk === "high" ? "2 times a year" : "Once a year";
  return { g, a, risk, perYear };
}
export interface CkdIn { egfr: number; acr: number; diabetes: boolean; k?: number; sbp?: number; age: number; hb?: number; bicarb?: number; declineFast?: boolean }
export function ckdPlan(i: CkdIn): { treat: string[]; checks: string[]; refer: string[] } {
  const treat: string[] = [];
  if (i.acr >= 30) treat.push("ACE inhibitor or ARB at the highest tolerated dose (not both); check creatinine and potassium 2–4 weeks after starting or raising (accept a rise of up to 30%).");
  else if (i.sbp && i.sbp >= 130) treat.push("Blood pressure: ACE inhibitor, ARB, calcium channel blocker or thiazide-like diuretic.");
  if (i.egfr >= 20) treat.push("SGLT2 inhibitor (dapagliflozin 10 mg or empagliflozin 10 mg once daily) for CKD with eGFR 20 or more, with or without diabetes; continue until dialysis.");
  if (i.diabetes && i.acr >= 30 && (i.k === undefined || i.k <= 4.8) && i.egfr >= 25) treat.push("Type 2 diabetes with albuminuria: consider finerenone 10–20 mg daily (potassium 4.8 or less).");
  if (i.age >= 50 || i.diabetes) treat.push("Statin (atorvastatin 10–20 mg; no dose change for kidney function).");
  treat.push(`BP target: systolic under 120 if tolerated (KDIGO 2021), otherwise under 130/80${i.sbp ? `; now ${i.sbp}` : ""}.`);
  treat.push("Avoid NSAIDs and nephrotoxins; adjust drug doses (see Kidney Dose Adjuster); sick-day rules for ACE inhibitor, ARB, SGLT2 inhibitor, metformin and diuretics.");
  if (i.diabetes) treat.push(`Metformin: ${i.egfr < 30 ? "stop (eGFR under 30)" : i.egfr < 45 ? "maximum 1,000 mg a day (eGFR 30–44)" : "usual dose; review if eGFR falls under 45"}.`);
  const checks = ["eGFR and urine ACR at the frequency above; potassium"];
  if (i.egfr < 60) checks.push("Hb (treat iron deficiency first; ESA if Hb under 10 after iron)", "Calcium, phosphate, PTH and vitamin D from G3a", "Bicarbonate: oral sodium bicarbonate if under 18 mmol/L");
  if (i.hb !== undefined && i.hb < 10) checks.push(`Hb ${i.hb}: check iron studies (ferritin, TSAT) and B12/folate`);
  if (i.bicarb !== undefined && i.bicarb < 18) checks.push(`Bicarbonate ${i.bicarb}: start sodium bicarbonate 500 mg 2–3 times a day`);
  checks.push("Vaccinate: hepatitis B (if heading for dialysis), influenza, pneumococcal");
  const refer: string[] = [];
  if (i.egfr < 30) refer.push("eGFR under 30");
  if (i.acr > 300) refer.push("ACR over 300 mg/g (or over 70 mg/mmol)");
  if (i.declineFast) refer.push("Rapid decline (more than 5 ml/min a year, or a 25% drop with a change of stage)");
  if (i.k !== undefined && i.k > 5.5) refer.push("Persistent potassium over 5.5");
  if (i.egfr < 20) refer.push("eGFR under 20: plan for kidney replacement (fistula 6 months ahead, transplant work-up, or conservative care)");
  return { treat, checks, refer };
}

/* ================================================================== preterm labour */

export interface PretermIn { weeks: number; days: number; pprom: boolean; inLabour: boolean; infection: boolean; gbsUnknown: boolean; tocoContra: boolean }
export function pretermPlan(i: PretermIn): { steroids: string; magnesium: string; tocolysis: string; antibiotics: string[]; delivery: string } {
  const ga = i.weeks + i.days / 7;
  const steroids = ga >= 24 && ga < 35 ? "Antenatal corticosteroids: dexamethasone 6 mg IM every 12 hours for 4 doses (or betamethasone 12 mg IM, 2 doses 24 hours apart) if birth is likely within 7 days." : ga < 24 ? "Under 24 weeks: discuss steroids with the neonatal team (22–23 weeks only if active care is planned)." : "34 weeks or more: steroids not routinely given (WHO); consider for planned caesarean before 39 weeks per local policy.";
  const magnesium = ga < 32 ? "Magnesium sulphate for fetal neuroprotection: 4 g IV over 20–30 minutes, then 1 g/hour until birth or for 24 hours (monitor reflexes, breathing, urine output)." : "Magnesium for neuroprotection: not indicated at 32 weeks or more.";
  const tocolysis = i.pprom ? "Tocolysis: not recommended with ruptured membranes (PPROM)." : i.infection || i.tocoContra ? "Tocolysis: not appropriate (infection, bleeding, fetal compromise or another contraindication)." : ga >= 24 && ga < 34 ? "Tocolysis to allow steroids and transfer: nifedipine 20 mg orally, then 10–20 mg every 6–8 hours for up to 48 hours (not with hypotension or cardiac disease)." : "Tocolysis: not indicated at this gestation.";
  const antibiotics: string[] = [];
  if (i.pprom) antibiotics.push("PPROM: erythromycin 250 mg 4 times a day for 10 days or until labour (avoid amoxicillin-clavulanate: necrotising enterocolitis)");
  if (i.inLabour && i.gbsUnknown) antibiotics.push("Preterm labour with unknown GBS status: IV benzylpenicillin 3 g (5 million units), then 1.5 g (2.5–3 million units) every 4 hours until birth (or ampicillin 2 g then 1 g 4-hourly)");
  if (i.infection) antibiotics.push("Chorioamnionitis (fever, tachycardia, uterine tenderness, offensive liquor): IV ampicillin + gentamicin (+ metronidazole if caesarean) and expedite birth");
  const delivery = i.infection ? "Infection: deliver regardless of gestation." : i.pprom ? (ga < 34 ? "PPROM without infection: expectant care with daily observations; deliver at 37 weeks (or 34 weeks per local policy)." : "PPROM at 34 weeks or more: offer delivery or expectant care to 37 weeks.") : "Transfer in utero to a centre with a NICU if under 32–34 weeks; cord clamping delayed 60 seconds if the baby is stable.";
  return { steroids, magnesium, tocolysis, antibiotics, delivery };
}

/* ================================================================== epilepsy */

export type SeizureType = "focal" | "gtc" | "absence" | "myoclonic" | "unknown";
export interface AsmIn { type: SeizureType; childbearing: boolean; pregnant: boolean; elderly: boolean; renal: boolean; liver: boolean; depression: boolean }
export function asmChoice(i: AsmIn): { first: string[]; avoid: string[] } {
  const first: string[] = [], avoid: string[] = [];
  const noVpa = i.childbearing || i.pregnant || i.liver;
  if (i.type === "focal") first.push("Lamotrigine", "Levetiracetam", ...(i.pregnant || i.elderly ? [] : ["Carbamazepine (test HLA-B*1502 first in South Asian patients where available)"]));
  else if (i.type === "absence") first.push(...(noVpa ? [] : ["Sodium valproate"]), "Ethosuximide", "Lamotrigine");
  else if (i.type === "myoclonic") first.push(...(noVpa ? [] : ["Sodium valproate"]), "Levetiracetam");
  else first.push(...(noVpa ? [] : ["Sodium valproate"]), "Lamotrigine", "Levetiracetam");
  if (noVpa) avoid.push(i.liver ? "Valproate: liver disease" : "Valproate: major birth defects and developmental harm (Pregnancy Prevention Programme)");
  if (i.childbearing || i.pregnant) avoid.push("Topiramate in women who could become pregnant");
  if (i.type === "absence" || i.type === "myoclonic") avoid.push("Carbamazepine, oxcarbazepine, phenytoin, gabapentin, pregabalin: can worsen absence and myoclonic seizures");
  if (i.elderly) avoid.push("Enzyme inducers (carbamazepine, phenytoin) in the elderly: interactions, bone loss, hyponatraemia");
  if (i.depression) avoid.push("Levetiracetam: watch mood and irritability (depression, suicidal thoughts)");
  if (i.renal) avoid.push("Levetiracetam: reduce the dose by CrCl");
  return { first, avoid };
}
export const ASM_DOSES: Record<string, string> = {
  Lamotrigine: "25 mg daily for 2 weeks, 50 mg daily for 2 weeks, then up by 50–100 mg every 1–2 weeks to 100–200 mg a day (half these doses with valproate); stop at once with any rash",
  Levetiracetam: "250 mg twice daily, up to 500 mg twice daily after 2 weeks; maximum 1,500 mg twice daily",
  "Sodium valproate": "300 mg twice daily, up by 300 mg every 3 days to 500–1,000 mg twice daily (20–30 mg/kg/day)",
  Ethosuximide: "250 mg twice daily (child 10–15 mg/kg/day), up slowly to effect",
  Carbamazepine: "100–200 mg once or twice daily, up by 100–200 mg every 2 weeks to 400 mg twice daily (modified-release)",
};
export const FIRST_SEIZURE = [
  "Witness account (video on a phone helps), tongue biting, incontinence, post-ictal confusion; exclude syncope, non-epileptic attacks and cardiac causes.",
  "Glucose, sodium, calcium, magnesium, CBC, renal and liver function; ECG (QT, Brugada, heart block) in everyone.",
  "CT brain today if focal signs, head injury, anticoagulants, persistent confusion, headache or immunosuppression; otherwise MRI and EEG within weeks.",
  "Look for provoking causes: alcohol withdrawal, drugs, sleep deprivation, hypoglycaemia, eclampsia, neurocysticercosis (common in India: CT/MRI).",
  "After a single unprovoked seizure, medicine is usually started only if recurrence risk is high (abnormal EEG, brain lesion, nocturnal seizure, neurological deficit) or the patient prefers.",
];
export const SEIZURE_SAFETY = [
  "No driving until seizure-free for the period the transport authority requires (commonly 12 months for private vehicles); never for heavy or commercial vehicles without specialist clearance.",
  "Shower rather than bath; never swim alone; avoid heights and working near fire or machinery; use the back burners and a microwave when cooking.",
  "Women: folic acid 5 mg daily before and during pregnancy; plan pregnancy with the doctor; several medicines reduce pill effectiveness.",
  "Family: recovery position, time the seizure, nothing in the mouth; call for help if over 5 minutes (buccal or nasal midazolam if prescribed).",
];

/* ================================================================== child fever (NICE traffic light) */

export const FEVER_SIGNS: { id: string; label: string; level: "amber" | "red" }[] = [
  { id: "mottled", label: "Pale, mottled, ashen or blue", level: "red" },
  { id: "noResponse", label: "No response to social cues; looks ill to a professional", level: "red" },
  { id: "unrousable", label: "Does not wake, or does not stay awake if roused", level: "red" },
  { id: "cry", label: "Weak, high-pitched or continuous cry", level: "red" },
  { id: "grunting", label: "Grunting, RR over 60, or moderate–severe chest indrawing", level: "red" },
  { id: "turgor", label: "Reduced skin turgor", level: "red" },
  { id: "under3m", label: "Under 3 months with temperature 38 °C or more", level: "red" },
  { id: "rash", label: "Non-blanching rash", level: "red" },
  { id: "fontanelle", label: "Bulging fontanelle, neck stiffness", level: "red" },
  { id: "seizure", label: "Status epilepticus, focal seizures or focal neurological signs", level: "red" },
  { id: "pallor", label: "Pallor reported by parent", level: "amber" },
  { id: "lessActive", label: "Not responding normally, no smile, wakes only with prolonged stimulation, less active", level: "amber" },
  { id: "flaring", label: "Nasal flaring, SpO2 95% or less, crackles", level: "amber" },
  { id: "fastRR", label: "RR over 50 (6–12 months) or over 40 (over 12 months)", level: "amber" },
  { id: "tachy", label: "HR over 160 (under 1 year), 150 (1–2 years), 140 (2–5 years)", level: "amber" },
  { id: "crt", label: "Capillary refill 3 seconds or more", level: "amber" },
  { id: "dry", label: "Dry mucous membranes, poor feeding, reduced urine", level: "amber" },
  { id: "3to6m", label: "Age 3–6 months with temperature 39 °C or more", level: "amber" },
  { id: "5days", label: "Fever for 5 days or more", level: "amber" },
  { id: "rigors", label: "Rigors", level: "amber" },
  { id: "limb", label: "Swelling of a limb or joint, or not bearing weight", level: "amber" },
];
export function feverTraffic(sel: string[]): { level: "green" | "amber" | "red"; text: string } {
  const s = FEVER_SIGNS.filter((f) => sel.includes(f.id));
  if (s.some((f) => f.level === "red")) return { level: "red", text: "Red: high risk of serious illness. Refer urgently to hospital (emergency transfer if unwell); under 3 months: blood culture, CBC, CRP, urine, LP if indicated, and IV cefotaxime (plus ampicillin under 1 month)." };
  if (s.length) return { level: "amber", text: "Amber: intermediate risk. Face-to-face assessment today; urine test; consider bloods; give a clear safety-net plan or admit if no follow-up is possible." };
  return { level: "green", text: "Green: low risk. Home care with advice: fluids, antipyretics for distress, and when to return." };
}
export function antipyretics(kg: number, months: number): string[] {
  if (!(kg > 0)) return [];
  const out = [`Paracetamol ${Math.round(15 * kg)} mg (15 mg/kg) every 4–6 hours, no more than 4 doses (60 mg/kg) in 24 hours`];
  out.push(months >= 3 && kg >= 5 ? `Ibuprofen ${Math.round(10 * kg)} mg (10 mg/kg) every 6–8 hours with food (avoid in dehydration, dengue or chickenpox)` : "Ibuprofen: not under 3 months or 5 kg");
  out.push("Use for distress, not to bring the number down; do not alternate both routinely; no tepid sponging; aspirin never under 16.");
  return out;
}

/* ================================================================== cirrhosis */

export interface ChildPughIn { bili: number; albumin: number; inr: number; ascites: 1 | 2 | 3; enceph: 1 | 2 | 3 }
export function childPugh(i: ChildPughIn): { score: number; cls: "A" | "B" | "C" } | null {
  if (!(i.bili > 0 && i.albumin > 0 && i.inr > 0)) return null;
  const b = i.bili < 2 ? 1 : i.bili <= 3 ? 2 : 3;
  const a = i.albumin > 3.5 ? 1 : i.albumin >= 2.8 ? 2 : 3;
  const n = i.inr < 1.7 ? 1 : i.inr <= 2.3 ? 2 : 3;
  const s = b + a + n + i.ascites + i.enceph;
  return { score: s, cls: s <= 6 ? "A" : s <= 9 ? "B" : "C" };
}
/** MELD (UNOS, with MELD-Na when MELD is over 11). Bilirubin and creatinine in mg/dL. */
export function meldNa(bili: number, inr: number, creat: number, na: number, dialysis = false): { meld: number; meldNa: number } | null {
  if (!(bili > 0 && inr > 0 && creat > 0)) return null;
  const c = dialysis ? 4 : Math.min(4, Math.max(1, creat));
  const m = 10 * (0.957 * Math.log(c) + 0.378 * Math.log(Math.max(1, bili)) + 1.12 * Math.log(Math.max(1, inr)) + 0.643);
  const meld = Math.round(m);
  const s = Math.min(137, Math.max(125, na || 137));
  const mn = meld > 11 ? Math.round(m + 1.32 * (137 - s) - 0.033 * m * (137 - s)) : meld;
  return { meld, meldNa: mn };
}
export function sbpCheck(pmn: number, kg: number): string[] {
  if (!(pmn >= 0)) return [];
  if (pmn < 250) return ["Ascitic neutrophils under 250/mm³: no SBP. Send albumin (SAAG), protein, culture in blood bottles at the bedside."];
  const k = kg > 0 ? kg : 60;
  return [`SBP (neutrophils ${pmn}/mm³): IV cefotaxime 2 g 8-hourly or ceftriaxone 1–2 g daily for 5–7 days (piperacillin-tazobactam or a carbapenem if hospital-acquired)`, `Albumin ${Math.round(1.5 * k)} g (1.5 g/kg) on day 1 and ${Math.round(k)} g (1 g/kg) on day 3 to prevent kidney failure`, "Stop beta-blockers if hypotensive; repeat tap at 48 hours if not improving; long-term norfloxacin or ciprofloxacin prophylaxis after recovery"];
}
export const lvpAlbumin = (litres: number) => (litres > 5 ? `${Math.round(litres * 8)} g of 20% albumin (8 g per litre removed: ${Math.round((litres * 8) / 20)} bottles of 100 ml)` : litres > 0 ? "5 litres or less: albumin usually not needed" : "");
export const CIRRHOSIS_CARE = [
  "Ascites: salt 5 g a day (no added salt, avoid pickles and papad); spironolactone 100 mg + furosemide 40 mg each morning, increased together every 3–5 days to 400 mg + 160 mg; weight loss 0.5 kg a day (1 kg with leg oedema). Fluid restriction only if sodium under 125.",
  "Hepatic encephalopathy: find the trigger (infection, bleeding, constipation, sedatives, electrolytes); lactulose 20–30 ml 2–3 times a day to 2–3 soft stools; add rifaximin 550 mg twice daily after recurrence.",
  "Variceal bleed: terlipressin 2 mg IV 4-hourly, ceftriaxone 1 g daily for 7 days, transfuse to Hb 7–8 (not higher), endoscopy and band ligation within 12 hours.",
  "Prevent first bleed (medium/large varices or CSPH): carvedilol 6.25 mg daily, then twice daily if BP allows.",
  "HCC surveillance: ultrasound with or without AFP every 6 months.",
  "Kidney injury (HRS-AKI): stop diuretics and nephrotoxins, albumin 1 g/kg for 2 days; terlipressin with albumin if no response.",
  "Avoid NSAIDs, sedatives and aminoglycosides; vaccinate (hepatitis A and B, pneumococcal, influenza); stop alcohol completely.",
];

/* ================================================================== dementia */

export function miniCog(words: 0 | 1 | 2 | 3, clockNormal: boolean): { score: number; positive: boolean; text: string } {
  const s = words + (clockNormal ? 2 : 0);
  return { score: s, positive: s < 3, text: s < 3 ? `Mini-Cog ${s}/5: positive screen: assess further (MoCA or full cognitive assessment), history from a family member, and look for reversible causes` : `Mini-Cog ${s}/5: negative screen; re-test if concerns persist` };
}
export const REVERSIBLE = ["B12 and folate", "TSH", "Glucose and HbA1c", "Sodium and calcium", "Renal and liver function", "CBC", "Syphilis and HIV (if risk)", "CT or MRI brain (tumour, subdural, normal-pressure hydrocephalus, strokes)", "Depression screen (PHQ-9 or GDS)", "Medicines: anticholinergics, benzodiazepines, opioids", "Hearing and vision", "Delirium (4AT) and sleep apnoea"];
export function dementiaDrugs(stage: "mild" | "moderate" | "severe", egfr: number | null, bradycardia: boolean): string[] {
  const out: string[] = [];
  if (stage !== "severe" && !bradycardia) out.push("Donepezil 5 mg at night, increase to 10 mg after 4–6 weeks (or rivastigmine patch 4.6 mg/24 h, increasing to 9.5 mg after 4 weeks; galantamine)");
  if (bradycardia) out.push("Cholinesterase inhibitors: caution or avoid with bradycardia, heart block or unexplained syncope (ECG first)");
  if (stage !== "mild") out.push(`Memantine 5 mg daily, increase by 5 mg each week to ${egfr !== null && egfr < 30 ? "10 mg (eGFR under 30)" : "20 mg"} once daily; can be added to donepezil in moderate–severe disease`);
  out.push("Behaviour and sleep: find pain, constipation, infection and environmental triggers first; antipsychotics only for severe distress or risk, lowest dose, short term, reviewed every 6 weeks.");
  out.push("Plan: capacity, power of attorney, advance wishes, driving, finances, carer support and respite; home safety (gas, wandering, falls).");
  return out;
}

/* ================================================================== hypertensive emergency */

export type HtnCondition = "urgency" | "general" | "dissection" | "ischaemic-stroke" | "lysis" | "ich" | "acs" | "apo" | "eclampsia" | "sympathetic";
export const HTN_CONDITIONS: [HtnCondition, string][] = [["urgency", "Severe BP without acute organ damage (urgency)"], ["general", "Emergency: encephalopathy, AKI, malignant hypertension"], ["dissection", "Aortic dissection"], ["ischaemic-stroke", "Ischaemic stroke, no thrombolysis"], ["lysis", "Ischaemic stroke, thrombolysis candidate"], ["ich", "Intracerebral haemorrhage"], ["acs", "Acute coronary syndrome"], ["apo", "Acute pulmonary oedema"], ["eclampsia", "Severe pre-eclampsia or eclampsia"], ["sympathetic", "Phaeochromocytoma, cocaine or amphetamine"]];
export const mapOf = (sbp: number, dbp: number) => Math.round(dbp + (sbp - dbp) / 3);
export function htnPlan(c: HtnCondition, sbp: number, dbp: number): { target: string; drugs: string[] } {
  const map = sbp > 0 && dbp > 0 ? mapOf(sbp, dbp) : 0;
  const t25 = map ? ` (MAP ${map} → about ${Math.round(map * 0.75)})` : "";
  switch (c) {
    case "urgency": return { target: "Lower gradually over 24–48 hours with oral medicines; rapid lowering causes stroke and MI.", drugs: ["Restart or increase usual medicines; amlodipine 5–10 mg, or labetalol 100–200 mg orally, or extended-release nifedipine 10–20 mg", "Never sublingual or immediate-release nifedipine capsules", "Rest in a quiet room for 30 minutes and recheck; review within 1–7 days"] };
    case "general": return { target: `Reduce MAP by no more than 25% in the first hour${t25}, then to 160/100 over the next 2–6 hours, then to normal over 24–48 hours.`, drugs: ["Labetalol 20 mg IV over 2 minutes, then 20–80 mg every 10 minutes (maximum 300 mg) or infusion 1–2 mg/min", "Nicardipine infusion 5 mg/hour, increase by 2.5 mg/hour every 5–15 minutes to a maximum of 15 mg/hour", "Sodium nitroprusside 0.3–10 micrograms/kg/min (ICU, arterial line; cyanide toxicity with prolonged use)"] };
    case "dissection": return { target: "Systolic under 120 and heart rate under 60 within 20 minutes.", drugs: ["Beta-blocker first: esmolol 0.5–1 mg/kg bolus then 50–300 micrograms/kg/min, or labetalol IV", "Then a vasodilator if needed: nicardipine or nitroprusside (never without the beta-blocker first)", "Opioid analgesia; urgent CT angiography and cardiothoracic surgery (type A)"] };
    case "ischaemic-stroke": return { target: "Treat only if over 220/120: reduce by about 15% in the first 24 hours; otherwise do not lower.", drugs: ["Labetalol 10–20 mg IV or nicardipine infusion", "Keep the usual antihypertensives on hold for the first 24–48 hours unless BP is very high"] };
    case "lysis": return { target: "Below 185/110 before thrombolysis and below 180/105 for 24 hours after.", drugs: ["Labetalol 10–20 mg IV over 1–2 minutes, may repeat once", "Nicardipine 5 mg/hour, up by 2.5 mg/hour every 5–15 minutes (max 15)", "If BP cannot be kept below 185/110, do not give the thrombolytic"] };
    case "ich": return { target: "Systolic to about 140 (range 130–150) within an hour, avoiding drops over 70 mmHg; do not go under 130.", drugs: ["Labetalol IV boluses or infusion, or nicardipine infusion", "Reverse anticoagulants; neurosurgery opinion"] };
    case "acs": return { target: "Systolic under 140 while relieving ischaemia.", drugs: ["Nitroglycerin infusion 5 micrograms/min, up by 5–10 every 3–5 minutes (not with sildenafil in 24–48 hours or RV infarct)", "Beta-blocker (labetalol or metoprolol) if no heart failure", "Antiplatelets and the ACS pathway"] };
    case "apo": return { target: "Systolic under 140 within the first hour.", drugs: ["Nitroglycerin: sublingual 400 micrograms, then infusion up to 200 micrograms/min (high doses work in hypertensive pulmonary oedema)", "Furosemide 40–80 mg IV; CPAP or BiPAP", "Avoid beta-blockers acutely"] };
    case "eclampsia": return { target: "Below 160/110, aiming for about 140–150/90–100; magnesium sulphate for seizures.", drugs: ["Labetalol 20 mg IV, then 40, 80, 80 mg every 10 minutes (maximum 300 mg)", "Or nifedipine 10 mg oral (tablet, not capsule) repeated after 20–30 minutes", "Or hydralazine 5 mg IV, then 5–10 mg every 20 minutes (maximum 20 mg)", "Magnesium sulphate (see Obstetric Emergencies); plan delivery"] };
    case "sympathetic": return { target: "Reduce as for a general emergency.", drugs: ["Benzodiazepines first for cocaine or amphetamines", "Phentolamine 5 mg IV, repeat every 10 minutes as needed", "No beta-blocker alone (unopposed alpha effect); add one only after alpha blockade"] };
  }
}
