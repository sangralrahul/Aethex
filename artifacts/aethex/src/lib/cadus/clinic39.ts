/**
 * Update 39, on the device (no AI): postpartum haemorrhage, neonatal sepsis, antibiotic dosing in
 * kidney disease, brain-stem death and organ donation (India), septic arthritis, neonatal
 * hypoglycaemia, altitude illness, and serotonin syndrome versus NMS.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== postpartum haemorrhage */

export function shockIndex(hr: number, sbp: number): { si: number; band: "normal" | "concern" | "urgent" | "critical" } {
  const si = sbp > 0 ? Math.round((hr / sbp) * 100) / 100 : 0;
  return { si, band: si >= 1.7 ? "critical" : si >= 1.4 ? "urgent" : si >= 0.9 ? "concern" : "normal" };
}
export function pphGrade(lossMl: number, caesarean: boolean, si: number): { grade: string; major: boolean } {
  const major = lossMl > 1000 || si >= 1;
  if (lossMl >= 2000) return { grade: "Massive PPH (2,000 ml or more): activate the massive haemorrhage protocol", major: true };
  if (major) return { grade: "Major PPH (over 1,000 ml or signs of shock)", major: true };
  if (lossMl >= (caesarean ? 1000 : 500)) return { grade: "Minor PPH (500–1,000 ml)", major: false };
  return { grade: "Within normal loss: keep weighing and watching", major: false };
}
export const PPH_TS = ["Tone: soft, boggy uterus (about 70%)", "Trauma: tears, haematoma, uterine rupture or inversion", "Tissue: retained placenta or membranes", "Thrombin: clotting problem (abruption, sepsis, pre-eclampsia/HELLP, anticoagulants)"];
export interface PphDrug { name: string; dose: string; avoid?: "asthma" | "hypertension" }
export const PPH_DRUGS: PphDrug[] = [
  { name: "Oxytocin", dose: "5 IU slow IV (or 10 IU IM), then infusion 40 IU in 500 ml at 125 ml/hour (10 IU/hour) for 4 hours." },
  { name: "Tranexamic acid", dose: "1 g IV over 10 minutes as soon as possible within 3 hours of birth; a second 1 g if bleeding continues after 30 minutes or restarts within 24 hours." },
  { name: "Ergometrine", dose: "0.2 mg IM or slow IV, repeat after 15 minutes if needed (max 1 mg).", avoid: "hypertension" },
  { name: "Carboprost", dose: "250 micrograms IM (deep), repeat every 15 minutes, max 8 doses (2 mg).", avoid: "asthma" },
  { name: "Misoprostol", dose: "800 micrograms sublingual (once)." },
];
export const pphDrugs = (asthma: boolean, htn: boolean) => PPH_DRUGS.map((d) => ({ ...d, blocked: (d.avoid === "asthma" && asthma) || (d.avoid === "hypertension" && htn) }));
export const PPH_STEPS = [
  "Call for help (senior obstetrician, anaesthetist, midwives, blood bank); one person records times and doses.",
  "Rub up the uterus and empty the bladder (catheter); bimanual compression if bleeding continues.",
  "Two large-bore cannulas; bloods (group and crossmatch 4 units, count, clotting, fibrinogen); warmed crystalloid up to 2 litres, then blood.",
  "Give the uterotonics and tranexamic acid below; examine for trauma and retained tissue in good light.",
  "Not stopping: intrauterine balloon tamponade (a condom catheter works), non-pneumatic anti-shock garment if available, then theatre: B-Lynch suture, uterine artery ligation, interventional radiology or hysterectomy.",
];
export const MASSIVE_TX = "Massive transfusion: give red cells and FFP early (about 4 FFP for every 6 red cell units); keep fibrinogen over 2 g/L (cryoprecipitate or fibrinogen concentrate) and platelets over 75,000; keep warm; check calcium and gas.";

/* ================================================================== neonatal sepsis */

export const NEO_RED = ["Suspected or confirmed infection in a co-twin", "Mother given IV antibiotics for suspected bacterial infection in labour or within 24 hours of birth", "Seizures", "Signs of shock", "Mechanical ventilation needed in a term baby", "Breathing difficulty starting more than 4 hours after birth"];
export const NEO_OTHER = ["Preterm birth after spontaneous labour", "Membranes ruptured over 18 hours (preterm) or 24 hours (term)", "Maternal fever over 38 °C in labour or chorioamnionitis", "Mother colonised with group B streptococcus", "Altered behaviour, tone or feeding", "Temperature under 36 °C or over 38 °C", "Apnoea or bradycardia", "Jaundice within 24 hours", "Low glucose or metabolic acidosis"];
export function neoSepsisAction(red: number, other: number): { action: "treat" | "observe" | "routine"; text: string } {
  if (red > 0 || other >= 2) return { action: "treat", text: "Blood culture, then antibiotics within 1 hour; CRP now and at 18–24 hours; LP if the culture is positive, CRP over 10 mg/L or signs of meningitis." };
  if (other === 1) return { action: "observe", text: "One risk factor or clinical indicator: observe for at least 12 hours (temperature, heart rate, breathing, feeding) and treat if any new sign." };
  return { action: "routine", text: "No risk factors: routine postnatal care." };
}
/** Gentamicin by gestational age and postnatal age (NeoFax-style intervals). */
export function gentNeo(kg: number, gaWeeks: number, pnaDays: number): { mg: number; every: number } {
  if (gaWeeks <= 29) return pnaDays <= 7 ? { mg: r1(5 * kg), every: 48 } : pnaDays <= 28 ? { mg: r1(4 * kg), every: 36 } : { mg: r1(4 * kg), every: 24 };
  if (gaWeeks <= 34) return pnaDays <= 7 ? { mg: r1(4.5 * kg), every: 36 } : { mg: r1(4 * kg), every: 24 };
  return { mg: r1(4 * kg), every: 24 };
}
export function ampNeo(kg: number, gaWeeks: number, pnaDays: number, meningitis: boolean): { mg: number; every: number } {
  const mg = Math.round((meningitis ? 100 : 50) * kg);
  if (gaWeeks <= 29) return { mg, every: pnaDays <= 28 ? 12 : 8 };
  if (gaWeeks <= 36) return { mg, every: pnaDays <= 14 ? 12 : 8 };
  return { mg, every: pnaDays <= 7 ? 12 : 8 };
}
export const NEO_DURATION = [
  "Blood culture negative at 36 hours, CRP normal and baby well: stop antibiotics.",
  "Culture-negative but clinically septic: usually 5–7 days.",
  "Culture-positive sepsis: 7–10 days (GBS 10 days).",
  "Meningitis: GBS 14 days; Gram-negative 21 days; cefotaxime with ampicillin.",
  "Late-onset or hospital-acquired sepsis: follow your NICU antibiogram (often piperacillin-tazobactam or a carbapenem with amikacin).",
];

/* ================================================================== antibiotics in kidney disease */

export function cockcroftGault(age: number, kg: number, creatMgDl: number, female: boolean): number {
  if (!(age > 0 && kg > 0 && creatMgDl > 0)) return 0;
  return Math.round(((140 - age) * kg * (female ? 0.85 : 1)) / (72 * creatMgDl));
}
type Band = [number, string];
interface RenalDrug { id: string; name: string; normal: string; bands: Band[]; hd: string; load?: string; note?: string }
/** Bands are [lower CrCl limit, dose], checked from the top. */
export const RENAL_ABX: RenalDrug[] = [
  { id: "amoxiclav", name: "Amoxicillin-clavulanate (oral)", normal: "625 mg 8-hourly", bands: [[30, "625 mg 8-hourly"], [10, "500/125 mg 12-hourly"], [0, "500/125 mg once daily"]], hd: "500/125 mg once daily, after dialysis" },
  { id: "piptaz", name: "Piperacillin-tazobactam", normal: "4.5 g 6-hourly", bands: [[40, "4.5 g 6-hourly"], [20, "4.5 g 8-hourly"], [0, "4.5 g 12-hourly"]], hd: "4.5 g 12-hourly (dose after dialysis)" },
  { id: "meropenem", name: "Meropenem", normal: "1 g 8-hourly", bands: [[50, "1 g 8-hourly"], [26, "1 g 12-hourly"], [10, "500 mg 12-hourly"], [0, "500 mg once daily"]], hd: "500 mg once daily, after dialysis" },
  { id: "ertapenem", name: "Ertapenem", normal: "1 g once daily", bands: [[31, "1 g once daily"], [0, "500 mg once daily"]], hd: "500 mg once daily, after dialysis" },
  { id: "ceftriaxone", name: "Ceftriaxone", normal: "1–2 g once daily", bands: [[0, "No change (max 2 g a day if liver disease too)"]], hd: "No change" },
  { id: "cefepime", name: "Cefepime", normal: "2 g 8-hourly", bands: [[60, "2 g 8-hourly"], [30, "2 g 12-hourly"], [11, "2 g once daily"], [0, "1 g once daily"]], hd: "1 g once daily, after dialysis", note: "Watch for neurotoxicity (confusion, myoclonus) in kidney failure." },
  { id: "cefazolin", name: "Cefazolin", normal: "2 g 8-hourly", bands: [[35, "2 g 8-hourly"], [11, "1 g 12-hourly"], [0, "1 g once daily"]], hd: "1–2 g after each dialysis" },
  { id: "ampicillin", name: "Ampicillin", normal: "1–2 g 6-hourly", bands: [[50, "1–2 g 6-hourly"], [10, "1–2 g 8-hourly"], [0, "1–2 g 12-hourly"]], hd: "1–2 g 12-hourly, dose after dialysis" },
  { id: "vancomycin", name: "Vancomycin", normal: "15–20 mg/kg 12-hourly", load: "Loading 25 mg/kg (max 3 g) whatever the kidney function", bands: [[50, "15 mg/kg 12-hourly"], [20, "15 mg/kg once daily"], [0, "Dose by levels (re-dose when level under 15–20 mg/L)"]], hd: "500–1,000 mg after each dialysis, by pre-dialysis level", note: "Target trough 15–20 mg/L (or AUC 400–600)." },
  { id: "gentamicin", name: "Gentamicin (once daily)", normal: "5–7 mg/kg once daily", bands: [[60, "5–7 mg/kg every 24 hours"], [40, "5–7 mg/kg every 36 hours"], [20, "5–7 mg/kg every 48 hours"], [0, "One dose, then by levels"]], hd: "1.5–2 mg/kg after each dialysis, by levels", note: "Avoid if possible in AKI; trough under 1 mg/L." },
  { id: "amikacin", name: "Amikacin (once daily)", normal: "15 mg/kg once daily", bands: [[60, "15 mg/kg every 24 hours"], [40, "15 mg/kg every 36 hours"], [20, "15 mg/kg every 48 hours"], [0, "One dose, then by levels"]], hd: "5–7.5 mg/kg after each dialysis, by levels" },
  { id: "cipro", name: "Ciprofloxacin (oral)", normal: "500 mg 12-hourly", bands: [[30, "500 mg 12-hourly"], [0, "500 mg once daily"]], hd: "250–500 mg once daily, after dialysis" },
  { id: "levo", name: "Levofloxacin", normal: "750 mg once daily", bands: [[50, "750 mg once daily"], [20, "750 mg every 48 hours"], [0, "750 mg once, then 500 mg every 48 hours"]], hd: "750 mg once, then 500 mg every 48 hours" },
  { id: "cotrim", name: "Co-trimoxazole", normal: "960 mg 12-hourly", bands: [[30, "960 mg 12-hourly"], [15, "Half the dose (480 mg 12-hourly)"], [0, "Avoid unless no alternative (then 50%, with monitoring)"]], hd: "Avoid, or 50% dose after dialysis", note: "Raises potassium and creatinine." },
  { id: "nitro", name: "Nitrofurantoin", normal: "100 mg MR 12-hourly", bands: [[45, "100 mg MR 12-hourly"], [30, "Short course only (3–7 days) with caution"], [0, "Avoid (ineffective and toxic)"]], hd: "Avoid" },
  { id: "fluconazole", name: "Fluconazole", normal: "400 mg once daily (after a loading dose)", load: "Full loading dose whatever the kidney function", bands: [[51, "Full dose"], [0, "Half the maintenance dose"]], hd: "Full dose after each dialysis" },
  { id: "aciclovir", name: "Aciclovir IV", normal: "10 mg/kg 8-hourly", bands: [[50, "10 mg/kg 8-hourly"], [25, "10 mg/kg 12-hourly"], [10, "10 mg/kg once daily"], [0, "5 mg/kg once daily"]], hd: "2.5–5 mg/kg once daily, after dialysis", note: "Hydrate well; dose on ideal body weight in obesity." },
  { id: "noadj", name: "Azithromycin, doxycycline, clindamycin, linezolid, metronidazole", normal: "Usual doses", bands: [[0, "No change in kidney disease"]], hd: "No change (metronidazole after dialysis)" },
];
export function renalAbx(id: string, crcl: number, hd: boolean): { name: string; dose: string; load?: string; note?: string } | null {
  const d = RENAL_ABX.find((x) => x.id === id);
  if (!d) return null;
  const dose = hd ? d.hd : (d.bands.find(([min]) => crcl >= min)?.[1] ?? d.normal);
  return { name: d.name, dose, ...(d.load ? { load: d.load } : {}), ...(d.note ? { note: d.note } : {}) };
}

/* ================================================================== brain-stem death and organ donation */

export const BSD_PRECONDITIONS = [
  "Known cause of irreversible brain damage (on CT or MRI)",
  "Deep coma on a ventilator, with no sedatives or paralysing drugs acting (allow for kidney and liver failure)",
  "Core temperature over 35 °C",
  "Systolic BP over 90 mmHg (MAP 60 or more), with support if needed",
  "No severe metabolic or endocrine cause (sodium, glucose, ammonia, thyroid)",
];
export const BSD_REFLEXES = [
  "Pupils fixed, no response to light",
  "No corneal reflex",
  "No oculocephalic (doll's eye) response",
  "No eye movement with 50 ml ice-cold water in each ear (look for 1 minute)",
  "No motor response in the face to painful stimulus anywhere",
  "No gag reflex",
  "No cough to deep tracheal suction",
];
export function apnoeaTest(baseline: number, end: number, effort: boolean, aborted: boolean): { result: "positive" | "negative" | "inconclusive"; text: string } {
  if (aborted) return { result: "inconclusive", text: "Test stopped for instability (SpO2 under 85%, systolic under 90 or arrhythmia): reconnect; use an ancillary test or repeat later." };
  if (effort) return { result: "negative", text: "Breathing effort seen: not brain-stem dead." };
  if (end >= 60 && end - baseline >= 20) return { result: "positive", text: `No breathing with PaCO2 ${end} mmHg (rise ${end - baseline}): apnoea confirmed.` };
  return { result: "inconclusive", text: `PaCO2 ${end} mmHg${end - baseline < 20 ? ` (rise only ${end - baseline})` : ""}: not high enough; continue longer if stable or repeat.` };
}
export const BSD_INDIA = [
  "Board of four doctors (Transplantation of Human Organs and Tissues Act): the registered medical practitioner in charge of the hospital; an independent practitioner nominated from the approved panel; a neurologist or neurosurgeon (or nominated specialist); and the doctor treating the patient. None may be part of the transplant team.",
  "Two sets of tests, at least 6 hours apart; record on Form 10 and sign.",
  "Hospitals must ask the family about donation (required request); consent by next of kin on the prescribed form; inform the regional or state organ transplant organisation (ROTTO/SOTTO, NOTTO).",
  "Medico-legal case: inform the police and the medical examiner before retrieval; post-mortem can follow retrieval.",
];
export const DONOR_TARGETS = [
  "MAP 65 mmHg or more; noradrenaline or vasopressin (1 unit bolus, then 0.5–2.4 units/hour) if needed after fluids.",
  "Urine 0.5–3 ml/kg/hour: diabetes insipidus (urine over 4 ml/kg/hour with sodium rising): desmopressin 1–4 micrograms IV.",
  "Sodium 135–150 mmol/L; glucose 140–180 mg/dL with insulin; potassium, calcium, magnesium and phosphate normal.",
  "Lung-protective ventilation (tidal volume 6–8 ml/kg, PEEP 8–10), SpO2 95% or more, recruitment after apnoea test.",
  "Temperature 36–37.5 °C; methylprednisolone 15 mg/kg after brain-stem death is commonly given; levothyroxine if unstable.",
  "Haemoglobin 7 g/dL or more; correct clotting if bleeding.",
];

/* ================================================================== septic arthritis */

export const KOCHER = ["Not bearing weight", "Fever over 38.5 °C", "ESR over 40 mm/h", "White cells over 12,000"];
export function kocher(n: number, crpOver20: boolean): { pct: string; advice: string } {
  const pct = n >= 4 ? "about 99%" : n === 3 ? "about 93%" : n === 2 ? "about 40%" : n === 1 ? "about 3%" : "under 0.2%";
  const high = n >= 3 || (n >= 2 && crpOver20);
  return { pct, advice: high ? "High probability: urgent orthopaedic review, joint aspiration (ultrasound-guided for the hip) and washout; blood cultures; IV antibiotics after aspiration." : n === 2 ? "Intermediate: ultrasound of the hip for effusion and aspirate if present; repeat bloods; observe closely." : "Low probability (think transient synovitis): rest, NSAID, review in 24–48 hours with clear return advice." };
}
export function septicArthritisPlan(child: boolean, kg: number, gono: boolean, mrsa: boolean, prosthetic: boolean): string[] {
  const k = kg > 0 ? kg : child ? 20 : 70;
  const out = ["Aspirate the joint before antibiotics (unless septic shock): Gram stain, culture, cell count (over 50,000 white cells suggests infection) and crystals; blood cultures."];
  if (prosthetic) out.push("Prosthetic joint: no antibiotics before aspiration if stable; urgent orthopaedic team (DAIR or revision); vancomycin with a broad Gram-negative agent after samples.");
  else if (child) out.push(`Cefazolin ${Math.round(cap(50 * k, 2000))} mg (50 mg/kg) IV 8-hourly (or ceftriaxone ${Math.round(cap(80 * k, 2000))} mg once daily under 5 years for Kingella and Hib)${mrsa ? `; MRSA: clindamycin ${Math.round(cap(10 * k, 600))} mg 8-hourly or vancomycin` : ""}; switch to oral when improving (CRP falling) for about 3 weeks in total.`);
  else if (gono) out.push("Sexually active with suspected gonococcal arthritis: ceftriaxone 1 g IV daily, plus azithromycin 1 g once (or doxycycline); test for other STIs; treat partners.");
  else out.push(`Flucloxacillin 2 g IV 6-hourly (or cefazolin 2 g 8-hourly)${mrsa ? "; MRSA risk: vancomycin 15–20 mg/kg 12-hourly" : ""}; add a Gram-negative agent (ceftriaxone) in older or immunocompromised patients and IV drug users; usually 2 weeks IV then oral to 4–6 weeks.`);
  out.push("Urgent joint washout (arthroscopic or open), repeated as needed; splint briefly, then early mobilisation.");
  return out;
}

/* ================================================================== neonatal hypoglycaemia */

export const gir = (dextrosePct: number, mlPerKgDay: number) => r1((dextrosePct * mlPerKgDay) / 144);
export const NEO_HYPO_RISK = ["Preterm (under 37 weeks)", "Small for gestational age (under 2nd centile) or birth weight under 2.5 kg", "Mother with diabetes", "Mother on beta-blockers (e.g. labetalol)", "Hypothermia, sepsis or perinatal asphyxia", "Large for gestational age"];
export function neoHypo(glucoseMgDl: number, signs: boolean, kg: number): { level: "iv" | "gel" | "feed" | "ok"; steps: string[] } {
  const k = kg > 0 ? kg : 3;
  if (glucoseMgDl < 18 || (signs && glucoseMgDl < 45)) return { level: "iv", steps: [
    `IV 10% dextrose ${Math.round(2 * k)} ml (2 ml/kg) over a few minutes, then an infusion of 10% dextrose at ${Math.round(60 * k / 24 * 10) / 10}–${Math.round(90 * k / 24 * 10) / 10} ml/hour (60–90 ml/kg/day, GIR ${gir(10, 60)}–${gir(10, 90)} mg/kg/minute).`,
    "Recheck glucose in 30 minutes and then hourly; continue breastfeeding if possible.",
    "Needing a GIR over 8 mg/kg/minute: take a hypoglycaemia screen when low (insulin, cortisol, growth hormone, ketones) and involve a paediatric endocrinologist (hyperinsulinism).",
  ] };
  if (glucoseMgDl < 36) return { level: "gel", steps: [
    `40% dextrose gel ${r1(0.5 * k)} ml (200 mg/kg) rubbed into the inside of the cheek, and a breastfeed (or expressed or formula milk 10 ml/kg if unable).`,
    "Recheck before the next feed (within 1 hour); a second gel dose is allowed; if still low, start IV dextrose.",
  ] };
  if (glucoseMgDl < 45) return { level: "feed", steps: ["Feed now (breast, or expressed milk), keep warm and skin-to-skin; recheck before the next feed. Persistent values under 45 mg/dL beyond 48 hours need investigation."] };
  return { level: "ok", steps: ["Glucose acceptable: continue 3-hourly feeds and pre-feed checks for at-risk babies for at least 24 hours (until 3 normal values)."] };
}

/* ================================================================== altitude illness */

export const LAKE_LOUISE = ["Headache", "Nausea, vomiting or poor appetite", "Fatigue or weakness", "Dizziness or light-headedness"];
export function lakeLouise(scores: number[]): { total: number; ams: boolean; band: string } {
  const total = scores.reduce((a, b) => a + b, 0);
  const ams = scores[0] >= 1 && total >= 3;
  return { total, ams, band: !ams ? "No AMS" : total >= 10 ? "Severe AMS" : total >= 6 ? "Moderate AMS" : "Mild AMS" };
}
export function altitudePlan(kind: "prevent" | "ams" | "hace" | "hape", child: boolean, kg: number, severe: boolean): string[] {
  const k = kg > 0 ? kg : 20;
  const acz = (dose: number) => child ? `${Math.round(cap(dose * k, 125))} mg (${dose} mg/kg, max 125 mg)` : `${dose === 2.5 ? 125 : 250} mg`;
  if (kind === "prevent") return [
    "Go up slowly: above 3,000 m, sleep no more than 500 m higher each night, with a rest day every 3–4 days. Leh/Ladakh by air: rest 48 hours in Leh before going higher.",
    `Acetazolamide ${child ? acz(1.25) : "125 mg"} twice daily, starting the day before ascent, for high-risk trips; dexamethasone 2 mg 6-hourly or 4 mg 12-hourly if acetazolamide cannot be taken (adults).`,
    "Drink to thirst, no alcohol or sleeping pills in the first days; know the warning signs.",
  ];
  if (kind === "ams") return [
    "Stop going up; rest at the same height until symptoms go (usually 1–2 days); paracetamol or ibuprofen for headache.",
    `Acetazolamide ${child ? acz(2.5) : "250 mg"} twice daily.`,
    severe ? "Moderate to severe or getting worse: descend 300–1,000 m; dexamethasone 4 mg 6-hourly (children 0.15 mg/kg); oxygen if available." : "Descend if not better in 24 hours or getting worse.",
  ];
  if (kind === "hace") return [
    "High-altitude cerebral oedema (confusion, ataxia, drowsiness): descend now (at least 1,000 m), with someone else making the decisions.",
    `Dexamethasone ${child ? `${r1(cap(0.15 * k, 4))} mg (0.15 mg/kg) 6-hourly` : "8 mg once, then 4 mg 6-hourly"}; oxygen to SpO2 over 90%; portable hyperbaric bag if descent is delayed.`,
  ];
  return [
    "High-altitude pulmonary oedema (breathless at rest, cough, low SpO2): descend now; oxygen to SpO2 over 90%; keep warm and minimise exertion.",
    "Nifedipine modified-release 30 mg 12-hourly (or 20 mg 8-hourly) if descent or oxygen is not possible; tadalafil 10 mg twice daily as an alternative.",
    "Treat as HACE too if confused; hospital review after descent.",
  ];
}

/* ================================================================== serotonin syndrome vs NMS */

export const HUNTER = [
  "Spontaneous clonus",
  "Inducible clonus with agitation or sweating",
  "Ocular clonus with agitation or sweating",
  "Tremor with brisk reflexes",
  "Rigidity with temperature over 38 °C and ocular or inducible clonus",
];
export const NMS_FEATURES = ["On an antipsychotic or recently stopped levodopa/dopamine agonist", "Generalised 'lead-pipe' rigidity", "Temperature over 38 °C", "Fluctuating BP, fast pulse or sweating", "Confusion or reduced consciousness", "CK raised (often very high)", "Developed over days rather than hours"];
export function serotoninVsNms(serotonergic: boolean, hunter: number, nms: number): { dx: "serotonin" | "nms" | "both" | "neither"; text: string } {
  const ss = serotonergic && hunter > 0, n = nms >= 4;
  if (ss && n) return { dx: "both", text: "Features of both: treat the dangerous ones (temperature, rigidity) in a monitored bed; stop all serotonergic and antipsychotic drugs; benzodiazepines help both." };
  if (ss) return { dx: "serotonin", text: "Meets Hunter criteria: serotonin syndrome." };
  if (n) return { dx: "nms", text: "Picture fits neuroleptic malignant syndrome." };
  return { dx: "neither", text: "Does not meet either: think of anticholinergic toxicity (dry hot skin, no sweating), sepsis, heat stroke, malignant hyperthermia or alcohol withdrawal." };
}
export const SS_PLAN = [
  "Stop all serotonergic drugs (SSRIs, SNRIs, tramadol, linezolid, ondansetron, MAOIs, triptans, St John's wort).",
  "Benzodiazepines for agitation and tremor; IV fluids; external cooling; no physical restraint.",
  "Cyproheptadine 12 mg by mouth or NG, then 2 mg every 2 hours while symptoms continue (max 32 mg a day).",
  "Temperature over 41 °C or rising rigidity: sedate, paralyse with a non-depolarising agent, intubate (antipyretics do not work: the heat is muscular).",
  "Usually settles within 24 hours of stopping the drugs.",
];
export const NMS_PLAN = [
  "Stop the antipsychotic (or restart the dopaminergic drug if it was stopped); ICU or high-dependency care.",
  "IV fluids (rhabdomyolysis), active cooling, benzodiazepines for agitation.",
  "Bromocriptine 2.5 mg three times daily by mouth or NG (up to 40 mg a day); dantrolene 1–2.5 mg/kg IV for severe rigidity and hyperthermia (max 10 mg/kg a day).",
  "Check CK, kidney function and potassium daily; watch for aspiration and DVT.",
  "Restart antipsychotics only after at least 2 weeks of recovery, at a low dose, preferably a low-potency drug.",
];
