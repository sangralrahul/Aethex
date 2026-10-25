/**
 * Update 38, on the device (no AI): hypertension in pregnancy and postpartum, kidney stones,
 * children's antibiotics by weight, opioid conversion and syringe drivers, cellulitis and
 * necrotising fasciitis, Kawasaki disease, infective endocarditis and Bell's palsy.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== hypertension in pregnancy */

export const SEVERE_HTN: Record<"labetalol" | "nifedipine" | "hydralazine", string[]> = {
  labetalol: [
    "Labetalol 20 mg IV over 2 minutes; recheck BP in 10 minutes.",
    "Still 160/110 or more: 40 mg IV, then 80 mg every 10 minutes (maximum 300 mg in total).",
    "Or an infusion: 20 mg/hour, doubled every 30 minutes to a maximum of 160 mg/hour (5 mg/ml solution).",
    "Avoid in asthma, heart failure and heart block; watch for neonatal bradycardia.",
  ],
  nifedipine: [
    "Nifedipine immediate-release 10 mg by mouth (swallowed, not sublingual); recheck in 20 minutes.",
    "Still severe: 20 mg, recheck in 20 minutes; then 20 mg again; if still severe, switch to IV labetalol or hydralazine.",
    "Useful when there is no IV access; can be given with magnesium sulphate.",
  ],
  hydralazine: [
    "Hydralazine 5–10 mg IV over 2 minutes; recheck in 20 minutes.",
    "Still severe: 10 mg IV; if still severe after 20 mg in total, switch to labetalol.",
    "Consider a 250–500 ml crystalloid bolus before the first dose to avoid sudden hypotension; watch fetal heart rate.",
  ],
};
export const ORAL_HTN = [
  "Labetalol 100–200 mg two or three times daily, up to 2.4 g a day (first choice unless asthma).",
  "Nifedipine modified-release 10–20 mg twice daily, up to 40 mg twice daily.",
  "Methyldopa 250 mg two or three times daily, up to 1 g three times daily (stop within 2 days after birth: depression).",
  "Target BP 135/85 or below in pregnancy (NICE).",
];
export function mgso4(regimen: "zuspan" | "pritchard"): string[] {
  return regimen === "zuspan"
    ? ["Loading: 4 g IV (20 ml of 20%) over 15–20 minutes.", "Maintenance: 1 g/hour IV infusion for 24 hours after birth or the last seizure, whichever is later.", "Recurrent seizure: a further 2 g IV over 5 minutes."]
    : ["Loading: 4 g IV (20 ml of 20%) over 15–20 minutes, plus 10 g IM (5 g of 50% in each buttock, with 1 ml of 2% lidocaine).", "Maintenance: 5 g IM (50%) every 4 hours into alternate buttocks, for 24 hours after birth or the last seizure.", "Recurrent seizure: a further 2 g IV over 5 minutes.", "Before each dose check: knee reflex present, breathing 16 or more a minute, urine 100 ml or more in the last 4 hours."];
}
export function mgToxicity(reflexes: boolean, rr: number, urineMlPerHour: number): { level: "ok" | "withhold" | "toxic"; steps: string[] } {
  if (rr > 0 && rr < 12) return { level: "toxic", steps: ["Stop magnesium; give calcium gluconate 10% 10 ml IV over 10 minutes; support breathing (bag and mask, intubate if needed); check magnesium level."] };
  if (!reflexes || (rr > 0 && rr < 16) || (urineMlPerHour > 0 && urineMlPerHour < 25)) return { level: "withhold", steps: ["Withhold or delay the next dose (or halve the infusion if urine is low but reflexes are present); check magnesium level and kidney function; keep calcium gluconate ready."] };
  return { level: "ok", steps: ["Continue: reflexes present, breathing 16 or more, urine over 25–30 ml/hour. Therapeutic level about 2–4 mmol/L (4–8 mg/dL)."] };
}
export function postpartumHtn(breastfeeding: boolean, onMethyldopa: boolean): string[] {
  return [
    "Measure BP daily for the first 2 days, at least once on days 3–5, and as needed after: BP often peaks on days 3–6.",
    onMethyldopa ? "Stop methyldopa within 2 days of birth and switch to another drug." : "Continue the antenatal drug and reduce it as BP settles (reduce if BP falls below 130/80).",
    breastfeeding ? "Breastfeeding-friendly: enalapril 5–20 mg once or twice daily, nifedipine, amlodipine 5–10 mg, labetalol or atenolol." : "Any standard antihypertensive can be used.",
    "Severe BP (160/110 or more), headache, visual changes or breathlessness postpartum: treat as postpartum pre-eclampsia, including magnesium if severe features.",
    "Review at 6–8 weeks; lifelong higher cardiovascular risk: yearly BP and risk checks; aspirin 75–150 mg from 12 weeks in the next pregnancy.",
  ];
}

/* ================================================================== kidney stones */

export interface StoneIn { sizeMm: number; site: "renal" | "proximal" | "distal"; infected: boolean; aki: boolean; solitary: boolean; intractable: boolean; pregnant: boolean }
export function stonePlan(x: StoneIn): { urgent: boolean; steps: string[] } {
  if (x.infected || x.aki || x.solitary || x.intractable) return { urgent: true, steps: [
    "Emergency decompression: nephrostomy or ureteric (JJ) stent, today; do not treat the stone itself until infection has settled.",
    x.infected ? "Blood and urine cultures, then IV antibiotics (e.g. ceftriaxone, or piperacillin-tazobactam / meropenem if septic or ESBL is likely)." : "Urgent urology review.",
    "IV fluids, analgesia, monitor creatinine and urine output.",
  ] };
  const steps = [
    x.pregnant ? "Analgesia: paracetamol, then opioid if needed (avoid NSAIDs in pregnancy); imaging by ultrasound." : "Analgesia: NSAID first (diclofenac 75 mg IM or IV paracetamol if NSAID not suitable: eGFR under 30, ulcer, bleeding); opioid only if needed. Imaging: non-contrast CT KUB.",
  ];
  if (x.site === "renal") steps.push(x.sizeMm <= 5 ? "Small renal stone, no symptoms: can be watched with yearly imaging." : x.sizeMm <= 20 ? "Renal stone 5–20 mm: shock-wave lithotripsy or flexible ureteroscopy (RIRS)." : "Renal stone over 20 mm: percutaneous nephrolithotomy (PCNL).");
  else if (x.sizeMm <= 5) steps.push("Ureteric stone 5 mm or less: about 70–90% pass on their own; watch for up to 4–6 weeks with analgesia and fluids.");
  else if (x.sizeMm <= 10) steps.push(`Ureteric stone ${x.sizeMm} mm: ${x.site === "distal" && !x.pregnant ? "medical expulsive therapy with tamsulosin 400 micrograms daily for up to 4 weeks; " : ""}intervene (ureteroscopy or SWL) if not passed by 4–6 weeks, or with uncontrolled pain, infection or falling kidney function.`);
  else steps.push(`Ureteric stone ${x.sizeMm} mm: unlikely to pass; plan ureteroscopy (or SWL for proximal stones).`);
  steps.push("Strain the urine and send any stone for analysis; return at once with fever, rigors, vomiting or no urine.");
  return { urgent: false, steps };
}
export const STONE_PREVENT = [
  "Drink enough to pass 2–2.5 litres of urine a day (about 2.5–3 litres of fluid; more in hot weather or outdoor work).",
  "Salt under 5 g a day; normal dietary calcium (1–1.2 g a day: do not cut dairy); less animal protein.",
  "Calcium oxalate stones: limit very high-oxalate foods (spinach, nuts, tea in large amounts); lemon or citrus for citrate.",
  "Uric acid stones: potassium citrate to alkalinise urine; allopurinol if high uric acid.",
  "Recurrent, young or bilateral stones: metabolic work-up (calcium, uric acid, PTH, 24-hour urine).",
];

/* ================================================================== children's antibiotics */

export interface PaedAbx { id: string; label: string; drug: string; mgPerKgDay: number; doses: number; maxPerDose: number; days: string; syrupMgPer5ml?: number; alt: string; note?: string }
export const PAED_ABX: PaedAbx[] = [
  { id: "aom", label: "Acute otitis media", drug: "Amoxicillin", mgPerKgDay: 90, doses: 2, maxPerDose: 1000, days: "5 days (10 days under 2 years or severe)", syrupMgPer5ml: 250, alt: "Penicillin allergy: azithromycin 10 mg/kg on day 1, then 5 mg/kg for 4 days." , note: "Over 6 months with mild symptoms: watchful waiting for 48–72 hours with analgesia is reasonable." },
  { id: "pharyngitis", label: "Streptococcal sore throat", drug: "Amoxicillin", mgPerKgDay: 50, doses: 1, maxPerDose: 1000, days: "10 days", syrupMgPer5ml: 250, alt: "Penicillin allergy: azithromycin 12 mg/kg once daily for 5 days." },
  { id: "pneumonia", label: "Pneumonia (not severe)", drug: "Amoxicillin", mgPerKgDay: 90, doses: 2, maxPerDose: 1000, days: "5 days", syrupMgPer5ml: 250, alt: "Severe (chest indrawing with danger signs, SpO2 under 90%): admit; ampicillin 50 mg/kg 6-hourly with gentamicin 7.5 mg/kg once daily, or ceftriaxone 50–100 mg/kg once daily." },
  { id: "uti", label: "UTI with fever", drug: "Cefixime", mgPerKgDay: 8, doses: 2, maxPerDose: 200, days: "7–10 days", syrupMgPer5ml: 100, alt: "Unwell, vomiting or under 3 months: IV ceftriaxone 75 mg/kg once daily, then oral by culture." },
  { id: "cellulitis", label: "Cellulitis or impetigo", drug: "Cephalexin", mgPerKgDay: 50, doses: 3, maxPerDose: 500, days: "5–7 days", syrupMgPer5ml: 250, alt: "MRSA common or penicillin allergy: clindamycin 30 mg/kg/day in 3 doses." },
  { id: "dysentery", label: "Dysentery (blood in stool)", drug: "Azithromycin", mgPerKgDay: 10, doses: 1, maxPerDose: 500, days: "3 days", syrupMgPer5ml: 200, alt: "Or ciprofloxacin 15 mg/kg twice daily for 3 days; plus ORS and zinc." },
  { id: "typhoid", label: "Enteric fever (uncomplicated)", drug: "Azithromycin", mgPerKgDay: 20, doses: 1, maxPerDose: 1000, days: "7 days", syrupMgPer5ml: 200, alt: "Complicated or not improving: IV ceftriaxone 75–100 mg/kg/day for 10–14 days; cefixime 20 mg/kg/day is an oral option (IAP 2022)." },
  { id: "scrub", label: "Scrub typhus", drug: "Doxycycline", mgPerKgDay: 4.5, doses: 2, maxPerDose: 100, days: "7 days", alt: "Or azithromycin 10 mg/kg/day once daily for 5 days (preferred in pregnancy and under 8 years by some)." },
  { id: "cholera", label: "Cholera", drug: "Azithromycin", mgPerKgDay: 20, doses: 1, maxPerDose: 1000, days: "single dose", syrupMgPer5ml: 200, alt: "Rehydration is the main treatment (plan B or C)." },
];
export function paedAbxDose(a: PaedAbx, kg: number): { perDose: number; ml: number | null; text: string } {
  const perDose = Math.round(cap((a.mgPerKgDay * kg) / a.doses, a.maxPerDose));
  const ml = a.syrupMgPer5ml ? r1((perDose / a.syrupMgPer5ml) * 5) : null;
  const freq = a.doses === 1 ? "once daily" : a.doses === 2 ? "twice daily" : a.doses === 3 ? "three times daily" : `${a.doses} times daily`;
  return { perDose, ml, text: `${a.drug} ${perDose} mg ${freq}${ml ? ` (${ml} ml of ${a.syrupMgPer5ml} mg/5 ml)` : ""} for ${a.days}` };
}
export const PAED_DANGER = ["Not able to drink or breastfeed", "Vomits everything", "Convulsions", "Lethargic or unconscious", "Chest indrawing or SpO2 under 90%", "Under 2 months with fever (admit, IV antibiotics)", "Non-blanching rash or neck stiffness"];

/* ================================================================== opioid conversion */

export interface Opioid { id: string; label: string; unit: string; factor: number }
/** Multiply the 24-hour dose by the factor to get oral morphine mg/24 h (PCF approximations). */
export const OPIOIDS: Opioid[] = [
  { id: "morphine-po", label: "Morphine (oral)", unit: "mg/24 h", factor: 1 },
  { id: "morphine-sc", label: "Morphine (SC/IV)", unit: "mg/24 h", factor: 2 },
  { id: "oxycodone-po", label: "Oxycodone (oral)", unit: "mg/24 h", factor: 1.5 },
  { id: "hydromorphone-po", label: "Hydromorphone (oral)", unit: "mg/24 h", factor: 5 },
  { id: "tapentadol-po", label: "Tapentadol (oral)", unit: "mg/24 h", factor: 0.4 },
  { id: "tramadol-po", label: "Tramadol (oral)", unit: "mg/24 h", factor: 0.1 },
  { id: "codeine-po", label: "Codeine (oral)", unit: "mg/24 h", factor: 0.1 },
  { id: "fentanyl-patch", label: "Fentanyl patch", unit: "micrograms/hour", factor: 2.4 },
  { id: "bup-patch", label: "Buprenorphine patch", unit: "micrograms/hour", factor: 2.4 },
];
export const toOme = (id: string, dose: number) => r1(dose * (OPIOIDS.find((o) => o.id === id)?.factor ?? 1));
export function convertOpioid(fromId: string, dose: number, toId: string, reducePct: number): { ome: number; target: number; unit: string; breakthrough: string; notes: string[] } {
  const ome = toOme(fromId, dose);
  const to = OPIOIDS.find((o) => o.id === toId) ?? OPIOIDS[0];
  const reduced = ome * (1 - reducePct / 100);
  const raw = reduced / to.factor;
  const patch = to.id.endsWith("patch");
  const sizes = to.id === "fentanyl-patch" ? [12, 25, 37, 50, 62, 75, 87, 100] : [5, 10, 15, 20, 35, 52, 70];
  const target = patch ? sizes.reduce((best, s) => (Math.abs(s - raw) < Math.abs(best - raw) ? s : best), sizes[0]) : r1(raw);
  const btMorphine = Math.round(ome / 6);
  const notes = [
    reducePct > 0 ? `Dose reduced by ${reducePct}% for incomplete cross-tolerance; titrate up with breakthrough doses.` : "No reduction applied: usual when switching for poor pain control without side effects.",
    ...(patch ? [`Patches take 12–24 hours to work: continue the previous long-acting opioid for ${to.id === "fentanyl-patch" ? "12 hours (one last 12-hourly dose with the patch)" : "the first 12–24 hours"}; avoid heat over the patch.`] : []),
    ...(fromId === "fentanyl-patch" ? ["After removing a fentanyl patch, levels fall slowly: start the new opioid 12 hours after removal (or use breakthrough doses first)."] : []),
    ...(toId === "tramadol-po" && target > 400 ? ["Tramadol maximum 400 mg a day: choose a strong opioid instead."] : []),
    ...(toId === "codeine-po" && target > 240 ? ["Codeine maximum 240 mg a day: choose a strong opioid instead."] : []),
  ];
  return { ome: r1(ome), target, unit: to.unit, breakthrough: `Breakthrough: oral morphine ${btMorphine} mg (one-sixth of the 24-hour dose) up to hourly as needed, or SC morphine ${Math.round(btMorphine / 2)} mg.`, notes };
}
export function syringeDriver(omePerDay: number, add: string[]): { lines: string[]; diluent: string } {
  const sc = Math.round(omePerDay / 2);
  const ADD: Record<string, string> = {
    agitation: "Midazolam 10–30 mg/24 h (start 10 mg); breakthrough 2.5–5 mg SC.",
    nausea: "Haloperidol 1.5–3 mg/24 h, or levomepromazine 6.25–12.5 mg/24 h.",
    secretions: "Glycopyrronium 0.6–1.2 mg/24 h, or hyoscine butylbromide 60–120 mg/24 h.",
    breathlessness: "Midazolam 5–10 mg/24 h with the opioid; fan and positioning.",
    cyclizine: "Cyclizine 150 mg/24 h (mix with water for injection only: precipitates in saline).",
  };
  return {
    lines: [`Morphine ${sc} mg SC over 24 hours (oral morphine ${Math.round(omePerDay)} mg ÷ 2)${omePerDay === 0 ? ": opioid-naive, start 5–10 mg/24 h" : ""}.`, ...add.map((a) => ADD[a]).filter(Boolean)],
    diluent: add.includes("cyclizine") ? "Dilute with water for injection." : "Dilute with water for injection (or 0.9% saline if all drugs are compatible) to the driver's volume; check compatibility for 3 or more drugs.",
  };
}

/* ================================================================== cellulitis and necrotising fasciitis */

export interface Lrinec { crp: number; wbc: number; hb: number; na: number; creat: number; glucose: number }
/** LRINEC: CRP mg/L, WBC ×1000, Hb g/dL, Na mmol/L, creatinine mg/dL, glucose mg/dL. */
export function lrinec(x: Lrinec): { score: number; risk: "low" | "intermediate" | "high" } {
  const s = (x.crp >= 150 ? 4 : 0) + (x.wbc > 25 ? 2 : x.wbc >= 15 ? 1 : 0) + (x.hb < 11 ? 2 : x.hb <= 13.5 ? 1 : 0) + (x.na < 135 ? 2 : 0) + (x.creat > 1.6 ? 2 : 0) + (x.glucose > 180 ? 1 : 0);
  return { score: s, risk: s >= 8 ? "high" : s >= 6 ? "intermediate" : "low" };
}
export const NF_FLAGS = ["Pain out of proportion to the skin findings", "Rapid spread (over hours)", "Tense oedema beyond the redness", "Bullae, dusky or necrotic skin", "Crepitus or gas on imaging", "Numb skin", "Shock, confusion or organ failure"];
export function skinPlan(flags: number, lrinecRisk: "low" | "intermediate" | "high", severe: boolean, mrsa: boolean): { nf: boolean; steps: string[] } {
  const nf = flags > 0 || lrinecRisk === "high";
  if (nf) return { nf, steps: [
    "Suspected necrotising fasciitis: emergency surgical review for exploration and debridement now; a normal LRINEC does not rule it out.",
    "IV meropenem 1 g 8-hourly (or piperacillin-tazobactam 4.5 g 6-hourly) plus clindamycin 600–900 mg 8-hourly (toxin suppression), plus vancomycin or linezolid if MRSA is possible.",
    "Resuscitate (sepsis bundle), ICU; repeat debridement every 24–48 hours as needed.",
  ] };
  return { nf, steps: [
    severe ? "Severe or systemic features: IV cefazolin 1–2 g 8-hourly (or ceftriaxone 2 g daily); review at 48 hours." : `Oral cephalexin 500 mg four times daily (or flucloxacillin 500 mg–1 g four times daily) for 5–7 days${mrsa ? "; MRSA: clindamycin 300–450 mg three times daily or co-trimoxazole" : ""}.`,
    "Mark the edge with a pen, elevate the limb, analgesia; treat tinea between the toes and any oedema.",
    "Review at 48–72 hours: redness may look worse on day 1–2 even when the antibiotic works.",
    "Think of abscess (ultrasound and drain), DVT, gout or diabetic foot infection.",
  ] };
}

/* ================================================================== Kawasaki disease */

export const KD_CRITERIA = ["Both eyes red, no discharge", "Red cracked lips, strawberry tongue or red mouth", "Rash (any type except vesicles)", "Red or swollen hands or feet (peeling later)", "Neck lymph node 1.5 cm or more, usually one side"];
export const KD_LABS = ["Albumin 3 g/dL or less", "Anaemia for age", "ALT raised", "Platelets 450,000 or more after day 7", "White cells 15,000 or more", "Urine 10 or more white cells per field"];
export function kawasaki(feverDays: number, criteria: number, crpMgDl: number | null, esr: number | null, labs: number, echoPositive: boolean): { result: "complete" | "incomplete-treat" | "evaluate" | "unlikely"; text: string } {
  if (feverDays >= 5 && criteria >= 4) return { result: "complete", text: "Complete Kawasaki disease: treat now." };
  if (feverDays >= 5 && criteria >= 2) {
    const inflamed = (crpMgDl !== null && crpMgDl >= 3) || (esr !== null && esr >= 40);
    if (!inflamed) return { result: "evaluate", text: "Incomplete criteria with low CRP and ESR: review daily; echo if peeling develops; reassess if fever continues." };
    if (labs >= 3 || echoPositive) return { result: "incomplete-treat", text: "Incomplete Kawasaki disease (3 or more supplementary labs or a positive echo): treat." };
    return { result: "evaluate", text: "Incomplete criteria with raised CRP/ESR but fewer than 3 supplementary labs: get an echo now; treat if positive." };
  }
  if (criteria >= 4 && feverDays >= 4) return { result: "complete", text: "4 or more criteria: experienced clinicians may treat on day 4 of fever." };
  return { result: "unlikely", text: "Does not meet criteria now: think of other causes (viral exanthem, scarlet fever, drug reaction, MIS-C); review if fever continues." };
}
export function kdTreatment(kg: number): string[] {
  const k = kg > 0 ? kg : 15;
  return [
    `IVIG ${r1(2 * k)} g (2 g/kg) as a single infusion over 10–12 hours, ideally within 10 days of fever onset.`,
    `Aspirin ${Math.round(30 * k)}–${Math.round(50 * k)} mg a day (30–50 mg/kg/day in 4 doses) until afebrile for 48 hours, then ${Math.round(cap(5 * k, 100))} mg once daily (3–5 mg/kg) until the 6–8 week echo is normal.`,
    "High risk (coronary changes at diagnosis, under 6 months, Asian children with high scores): consider adding steroids with specialist advice.",
    "Fever 36 hours after IVIG: a second IVIG dose, or steroids or infliximab (IVIG resistance).",
    "Echocardiogram at diagnosis, at 1–2 weeks and at 4–6 weeks; avoid live vaccines (MMR, varicella) for 11 months after IVIG; yearly influenza vaccine while on aspirin; avoid ibuprofen with aspirin.",
  ];
}

/* ================================================================== infective endocarditis */

export const DUKE_MAJOR = ["Typical organism in 2 separate blood cultures (or persistently positive cultures)", "Echo evidence: vegetation, abscess or new valve dehiscence, or new regurgitation"];
export const DUKE_MINOR = ["Predisposition: heart lesion, prosthetic valve or IV drug use", "Fever 38 °C or more", "Vascular signs: emboli, mycotic aneurysm, Janeway lesions, intracranial bleed", "Immunological signs: glomerulonephritis, Osler nodes, Roth spots, rheumatoid factor", "Positive culture not meeting a major criterion"];
export function duke(major: number, minor: number): "definite" | "possible" | "rejected" {
  if (major >= 2 || (major === 1 && minor >= 3) || minor >= 5) return "definite";
  if ((major === 1 && minor >= 1) || minor >= 3) return "possible";
  return "rejected";
}
export function ieEmpiric(kind: "native" | "early-prosthetic" | "late-prosthetic", penAllergy: boolean, kg: number): string[] {
  const k = kg > 0 ? kg : 70;
  const gent = `gentamicin ${Math.round(3 * k)} mg (3 mg/kg) IV once daily`;
  const vanc = `vancomycin ${Math.round(cap(15 * k, 2000))} mg (15 mg/kg) IV 12-hourly, to trough 15–20 mg/L`;
  const out = ["Three sets of blood cultures from separate sites 30 minutes apart before antibiotics (if the patient is stable)."];
  if (kind === "early-prosthetic") out.push(`Prosthetic valve under 12 months: ${vanc} plus ${gent} plus rifampicin 900–1,200 mg a day in 2–3 doses (start rifampicin 3–5 days after the others).`);
  else if (penAllergy) out.push(`Penicillin allergy: ${vanc} plus ${gent}.`);
  else out.push(`Ampicillin 2 g IV 4-hourly plus (flu)cloxacillin 2 g IV 4-hourly plus ${gent}${kind === "late-prosthetic" ? " (late prosthetic valve: same as native)" : ""}.`);
  out.push(
    "Narrow by organism once cultures grow; usual course 4–6 weeks (2 weeks for selected uncomplicated streptococcal native-valve cases).",
    "Transthoracic echo now; transoesophageal echo if prosthetic valve, device or TTE is negative but suspicion high.",
    "Urgent cardiac surgery review: heart failure, abscess or heart block, fungal or resistant organism, persistent bacteraemia after 7 days, vegetation over 10 mm with embolism.",
    "Endocarditis team: cardiology, cardiac surgery, infectious diseases, microbiology; dental review for the source.",
  );
  return out;
}

/* ================================================================== Bell's palsy */

export const BELL_RED = ["Forehead spared (suggests a central cause: stroke)", "Other cranial nerves, limb weakness or ataxia", "Vesicles in the ear or mouth (Ramsay Hunt)", "Both sides affected", "Slow onset over more than 72 hours or recurrent on the same side", "Parotid lump, ear discharge or hearing loss", "History of cancer"];
export function bellPlan(hours: number, redFlags: number, ramsayHunt: boolean, child: boolean, kg: number): string[] {
  if (redFlags > 0 && !ramsayHunt) return ["Red flag present: not Bell's palsy until proven otherwise: urgent same-day assessment (stroke pathway if forehead sparing with other signs; ENT for parotid or ear causes)."];
  const out: string[] = [];
  if (hours <= 72) out.push(child ? `Prednisolone ${Math.round(cap(kg > 0 ? kg : 20, 50))} mg once daily (1 mg/kg, max 50 mg) for 10 days.` : "Prednisolone 50 mg once daily for 10 days (or 60 mg for 5 days, then reduce by 10 mg a day).");
  else out.push("Over 72 hours from onset: steroids are unlikely to help; focus on eye care and follow-up.");
  if (ramsayHunt) out.push("Ramsay Hunt: add valaciclovir 1 g three times daily for 7 days; ENT review (hearing, vertigo).");
  out.push(
    "Eye care: lubricating drops by day, ointment and taping the eyelid shut at night; sunglasses outside; urgent eye review if the eye is red or painful.",
    "Most recover in 3 weeks to 3 months; refer to ENT or neurology if no improvement by 3 weeks or incomplete recovery at 3 months.",
    "Check BP and glucose; in pregnancy, steroids can still be used (watch glucose).",
  );
  return out;
}
export const HOUSE_BRACKMANN = ["I: normal", "II: slight weakness, eye closes fully with little effort", "III: obvious weakness, eye closes fully with effort", "IV: obvious weakness, eye does not close fully", "V: barely perceptible movement", "VI: no movement"];
