/**
 * Update 41, on the device (no AI): bronchiolitis, ectopic and early pregnancy bleeding, febrile
 * seizures, testicular torsion (TWIST), myasthenic crisis and Guillain–Barré, hypercalcaemia,
 * deprescribing (STOPP/START with anticholinergic burden), acute limb ischaemia (Rutherford),
 * delirium (4AT), childhood rashes, sore throat and otitis media, and falls and hip fracture.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== bronchiolitis */

export interface BronchInput { ageMonths: number; rr: number; spo2: number; apnoea: boolean; grunting: boolean; recession: "none" | "mild" | "moderate" | "severe"; intakePct: number; dehydrated: boolean; risk: boolean }
export function bronchAssess(x: BronchInput): { level: "home" | "consider" | "admit"; reasons: string[] } {
  const admit: string[] = [];
  const consider: string[] = [];
  if (x.apnoea) admit.push("apnoea (observed or reported)");
  if (x.spo2 > 0 && x.spo2 < 92) admit.push(`SpO2 ${x.spo2}% (under 92% on air)`);
  if (x.rr > 70) admit.push(`respiratory rate ${x.rr} (over 70)`);
  if (x.grunting) admit.push("grunting");
  if (x.recession === "severe") admit.push("marked chest recession");
  if (x.intakePct > 0 && x.intakePct < 50) admit.push(`feeding ${x.intakePct}% of usual (under 50%)`);
  if (x.rr > 60 && x.rr <= 70) consider.push(`respiratory rate ${x.rr} (over 60)`);
  if (x.intakePct >= 50 && x.intakePct < 75) consider.push(`feeding ${x.intakePct}% of usual (50–75%)`);
  if (x.dehydrated) consider.push("clinical dehydration");
  if (x.recession === "moderate") consider.push("moderate chest recession");
  if (x.risk) consider.push("risk factor for severe disease");
  if (x.ageMonths > 0 && x.ageMonths < 3) consider.push("age under 3 months");
  if (admit.length) return { level: "admit", reasons: [...admit, ...consider] };
  if (consider.length) return { level: "consider", reasons: consider };
  return { level: "home", reasons: [] };
}
export const BRONCH_RISKS = ["Born before 32 weeks", "Chronic lung disease", "Significant congenital heart disease", "Immunodeficiency", "Neuromuscular disorder"];
export const BRONCH_DO = [
  "Oxygen if SpO2 is persistently under 92% (aim 92% or more).",
  "Nasal suction only if secretions are causing distress or feeding difficulty, or before feeds in apnoea.",
  "Small frequent feeds; nasogastric or orogastric feeds if the baby cannot take enough by mouth; isotonic IV fluids only if tube feeds are not tolerated.",
  "High-flow nasal oxygen or CPAP for impending respiratory failure; consider a blood gas if severe distress, exhaustion or SpO2 under 92% despite oxygen.",
];
export const BRONCH_DONT = ["Salbutamol or ipratropium", "Adrenaline nebulisers", "Hypertonic saline (outside trials or units that use it)", "Oral or inhaled steroids", "Antibiotics (unless a bacterial infection is suspected)", "Montelukast", "Chest physiotherapy (unless another indication)"];
export const BRONCH_HOME = [
  "The illness usually peaks on days 3–5; the cough may last up to 3 weeks.",
  "Come back at once if breathing becomes harder (grunting, sucking in below the ribs), there are pauses in breathing, the lips look blue, or the baby is very tired.",
  "Come back if the baby takes less than half of usual feeds over the last 2–3 feeds, or has had no wet nappy for 12 hours.",
  "Keep the baby away from smoke; paracetamol only for distress from fever.",
];

/* ================================================================== ectopic and early pregnancy */

export function hcgTrend(h0: number, h48: number): { change: number; band: "rising" | "falling" | "suboptimal"; text: string } {
  const change = Math.round(((h48 - h0) / h0) * 100);
  if (change > 63) return { change, band: "rising", text: `hCG rose ${change}% in 48 hours (more than 63%): likely a developing intrauterine pregnancy, but ectopic is not excluded. Scan within 7–14 days, or sooner if hCG is 1,500 IU/L or more.` };
  if (change < -50) return { change, band: "falling", text: `hCG fell ${Math.abs(change)}% in 48 hours (more than 50%): likely a failing pregnancy. Urine pregnancy test after 2 weeks; come back if pain or bleeding.` };
  return { change, band: "suboptimal", text: `hCG changed ${change}% in 48 hours (between a 50% fall and a 63% rise): possible ectopic pregnancy. Clinical review in the early pregnancy unit within 24 hours.` };
}
export interface EctopicInput { unstable: boolean; pain: boolean; massMm: number; heartbeat: boolean; hcg: number; falling: boolean }
export function ectopicPlan(x: EctopicInput): { route: "surgery" | "methotrexate" | "choice" | "expectant"; steps: string[] } {
  if (x.unstable) return { route: "surgery", steps: ["Haemodynamically unstable or signs of rupture: resuscitate (two large-bore cannulas, crossmatch 4 units, major haemorrhage protocol) and take to theatre now.", "Laparoscopy where skilled and safe; laparotomy if shocked."] };
  if (x.pain || x.massMm >= 35 || x.heartbeat || x.hcg >= 5000) return {
    route: "surgery",
    steps: [`Surgery: ${[x.pain && "significant pain", x.massMm >= 35 && `adnexal mass ${x.massMm} mm (35 mm or more)`, x.heartbeat && "visible fetal heartbeat", x.hcg >= 5000 && `hCG ${x.hcg} IU/L (5,000 or more)`].filter(Boolean).join(", ")}.`, "Laparoscopic salpingectomy if the other tube is healthy; salpingotomy if the other tube is damaged (then hCG follow-up, as 1 in 5 need further treatment)."],
  };
  if (x.hcg > 0 && x.hcg < 1000 && x.falling && x.massMm < 35) return { route: "expectant", steps: ["Expectant management is an option: stable, pain-free, mass under 35 mm with no heartbeat, hCG under 1,000 IU/L and falling.", "hCG on days 2, 4 and 7, then weekly until negative; come back at once with pain or bleeding.", "Methotrexate is the alternative if she prefers."] };
  if (x.hcg > 0 && x.hcg < 1500) return { route: "methotrexate", steps: ["Methotrexate first line: no significant pain, mass under 35 mm with no heartbeat, hCG under 1,500 IU/L, no intrauterine pregnancy, and she can come back for follow-up.", "Surgery if she prefers."] };
  return { route: "choice", steps: ["hCG 1,500–5,000 IU/L, no pain, mass under 35 mm, no heartbeat: offer a choice of methotrexate or surgery.", "Methotrexate avoids surgery but about 1 in 4 need a second dose and some need surgery."] };
}
/** Body surface area (Mosteller) and methotrexate 50 mg/m². */
export function mtxDose(heightCm: number, kg: number): { bsa: number; mg: number } | null {
  if (!(heightCm > 0 && kg > 0)) return null;
  const bsa = Math.sqrt((heightCm * kg) / 3600);
  return { bsa: Math.round(bsa * 100) / 100, mg: Math.round(50 * bsa) };
}
export const MTX_FOLLOWUP = [
  "Check before giving: FBC, LFT, creatinine, blood group; not if breastfeeding, liver or kidney disease, blood dyscrasia, active peptic ulcer or immunodeficiency.",
  "hCG on day 4 and day 7: a fall of 15% or more from day 4 to day 7 means it is working; then weekly until negative.",
  "Less than a 15% fall: repeat the scan and consider a second dose or surgery.",
  "Avoid folic acid, NSAIDs, alcohol, sex and strenuous exercise during treatment; avoid pregnancy for 3 months after methotrexate.",
];
export const ANTI_D = "Rh-negative: NICE advises 250 IU (50 micrograms) anti-D within 72 hours for surgery for ectopic pregnancy or miscarriage; not needed for medical management alone, threatened or complete miscarriage, or a pregnancy of unknown location. Follow your unit's (FOGSI) policy, which is often broader.";

/* ================================================================== febrile seizures */

export interface FebSeizureInput { ageMonths: number; durationMin: number; focal: boolean; recur24: boolean; recovered: boolean; meningism: boolean; immunisedHibPneumo: boolean; onAntibiotics: boolean; ongoing: boolean }
export function febSeizure(x: FebSeizureInput): { type: "simple" | "complex" | "status" | "atypical"; steps: string[] } {
  const steps: string[] = [];
  const atypicalAge = x.ageMonths > 0 && (x.ageMonths < 6 || x.ageMonths > 60);
  const type: "simple" | "complex" | "status" | "atypical" = x.ongoing || x.durationMin >= 30 ? "status" : atypicalAge ? "atypical" : x.focal || x.durationMin >= 15 || x.recur24 || !x.recovered ? "complex" : "simple";
  if (x.ongoing) steps.push("Seizing now for 5 minutes or more: give a benzodiazepine (doses below), oxygen, check glucose; follow the status epilepticus pathway if it continues.");
  if (atypicalAge) steps.push(`Age ${x.ageMonths} months is outside the usual 6 months to 5 years: look harder for meningitis, encephalitis, metabolic causes or epilepsy.`);
  if (x.meningism) steps.push("Signs of meningitis: lumbar puncture (if safe) and start ceftriaxone without delay.");
  else if (x.ageMonths >= 6 && x.ageMonths <= 12 && !x.immunisedHibPneumo) steps.push("6–12 months and Hib or pneumococcal vaccines not up to date: consider lumbar puncture.");
  if (x.onAntibiotics && !x.meningism) steps.push("Already on antibiotics (may mask meningitis): consider lumbar puncture.");
  if (type === "simple") steps.push("Simple febrile seizure: no routine bloods (other than glucose if still drowsy), EEG or brain imaging; find and treat the cause of the fever.", "Most can go home once recovered and the cause of fever is clear; admit if parents are very anxious, the cause is unclear or the child is under 18 months with no clear source.");
  if (type === "complex") steps.push("Complex febrile seizure (focal, 15 minutes or more, repeated within 24 hours, or slow recovery): admit and observe; consider EEG and neuroimaging if focal features or slow recovery, and look for CNS infection.");
  steps.push("About 1 in 3 have another febrile seizure; paracetamol or ibuprofen ease discomfort but do not prevent seizures; long-term antiseizure medicine is not recommended.", "Teach parents: time it, put the child on the side, nothing in the mouth; call an ambulance if over 5 minutes; rescue buccal midazolam only if previous seizures were prolonged.");
  return { type, steps };
}
export function rescueDoses(kg: number): string[] {
  if (!(kg > 0)) return ["Enter the weight for doses."];
  return [
    `Buccal midazolam ${r1(cap(0.3 * kg, 10))} mg (0.3 mg/kg, max 10 mg).`,
    `Rectal diazepam ${r1(cap(0.5 * kg, 10))} mg (0.5 mg/kg, max 10 mg).`,
    `IV lorazepam ${r1(cap(0.1 * kg, 4))} mg (0.1 mg/kg, max 4 mg) if IV access; may repeat once after 5–10 minutes.`,
  ];
}

/* ================================================================== testicular torsion */

export const TWIST_ITEMS: { label: string; pts: number }[] = [
  { label: "Testicular swelling", pts: 2 },
  { label: "Hard testis", pts: 2 },
  { label: "Absent cremasteric reflex", pts: 1 },
  { label: "Nausea or vomiting", pts: 1 },
  { label: "High-riding testis", pts: 1 },
];
export function twist(ticks: boolean[]): { score: number; band: "low" | "intermediate" | "high"; action: string } {
  const score = TWIST_ITEMS.reduce((a, it, i) => a + (ticks[i] ? it.pts : 0), 0);
  if (score >= 5) return { score, band: "high", action: "High risk of torsion: urgent scrotal exploration without waiting for an ultrasound." };
  if (score >= 3) return { score, band: "intermediate", action: "Intermediate risk: urgent colour Doppler ultrasound and urology review; explore if in doubt or ultrasound is delayed." };
  return { score, band: "low", action: "Low risk of torsion: consider epididymitis, torsion of the appendix testis or other causes; still review if pain is severe or getting worse." };
}
export function salvageNote(hours: number): string {
  if (!(hours > 0)) return "Time from onset matters: salvage is best within 6 hours.";
  if (hours <= 6) return `${hours} hours since onset: salvage is usually possible (about 90% or more within 6 hours). Theatre now.`;
  if (hours <= 12) return `${hours} hours since onset: salvage falls with every hour (roughly half by 12 hours). Theatre now.`;
  if (hours <= 24) return `${hours} hours since onset: salvage is much less likely, but still explore urgently.`;
  return `${hours} hours since onset: the testis may not be salvageable; still explore (and fix the other side).`;
}
export function epididymitisRx(age: number, enteric: boolean): string[] {
  if (age > 0 && age < 14) return ["Before puberty epididymitis is uncommon: rule out torsion first; check urine for infection and look for urinary tract anomalies; antibiotics only if the urine suggests infection."];
  const out = ["Ceftriaxone 500 mg IM once (1 g if 150 kg or more) plus doxycycline 100 mg twice daily for 10 days if gonorrhoea or chlamydia is possible."];
  if (enteric) out.push("Enteric organisms likely (over 35, recent urinary procedure, or insertive anal sex): levofloxacin 500 mg once daily for 10 days (with ceftriaxone if an STI is also possible).");
  out.push("Scrotal support, rest, analgesia; test and treat partners for STIs; review in 72 hours.");
  return out;
}

/* ================================================================== myasthenic crisis and GBS */

export function respRisk(kg: number, fvcL: number, nif: number, mep: number): { fvcPerKg: number | null; flags: string[]; action: string } {
  const flags: string[] = [];
  const fvcPerKg = kg > 0 && fvcL > 0 ? Math.round(((fvcL * 1000) / kg) * 10) / 10 : null;
  if (fvcPerKg !== null && fvcPerKg < 20) flags.push(`FVC ${fvcPerKg} ml/kg (under 20)`);
  if (nif < 0 && nif > -30) flags.push(`NIF ${nif} cmH2O (weaker than −30)`);
  if (mep > 0 && mep < 40) flags.push(`MEP ${mep} cmH2O (under 40)`);
  const action = flags.length ? "Meets the 20/30/40 rule: call ICU and anaesthesia now; plan elective intubation before exhaustion (avoid suxamethonium in GBS)." : "Below the 20/30/40 thresholds: measure FVC and NIF every 2–6 hours; a fall of 30% or more, poor cough, bulbar weakness or rising CO2 also need ICU.";
  return { fvcPerKg, flags, action };
}
export function ivigPlan(kg: number): string | null {
  if (!(kg > 0)) return null;
  return `IVIG 2 g/kg total = ${Math.round(2 * kg)} g, given as ${r1(0.4 * kg)} g a day for 5 days (check IgA, kidney function; hydrate; watch for thrombosis and aseptic meningitis).`;
}
export const GBS_STEPS = [
  "Treat if unable to walk 10 m unaided (GBS disability score 3 or more) within 2 weeks of onset: IVIG (above) or plasma exchange (5 exchanges over 1–2 weeks, up to 4 weeks from onset).",
  "Do not give steroids for GBS; do not combine IVIG straight after plasma exchange.",
  "Monitor autonomic function: continuous ECG (bradycardia, asystole with suction), BP swings, ileus, urinary retention.",
  "LMWH thromboprophylaxis, pressure care, neuropathic pain (gabapentin or amitriptyline), early physiotherapy.",
  "Check: nerve conduction studies, CSF (high protein, normal cells), and think of mimics (spinal cord compression, hypokalaemia, botulism, tick paralysis).",
];
export const MG_STEPS = [
  "Myasthenic crisis: IVIG 2 g/kg over 2–5 days, or plasma exchange (5 exchanges), which works faster.",
  "If intubated: pause pyridostigmine (reduces secretions and confusion with cholinergic crisis); restart at a lower dose before extubation.",
  "Start or continue steroids (prednisolone up to 1 mg/kg), ideally once ventilated or after IVIG/PLEX, as high doses can worsen weakness for 1–2 weeks.",
  "Look for the trigger: infection, surgery, recent drug change, thyroid disease, stopping treatment.",
];
export const MG_AVOID: [string, string][] = [
  ["Aminoglycosides (gentamicin, amikacin)", "avoid unless no alternative"],
  ["Fluoroquinolones (ciprofloxacin, levofloxacin)", "avoid"],
  ["Macrolides (azithromycin, erythromycin)", "avoid"],
  ["IV magnesium", "avoid; only for eclampsia with close monitoring"],
  ["Beta blockers (including eye drops)", "use with caution"],
  ["Quinine, chloroquine, hydroxychloroquine", "avoid"],
  ["Procainamide, quinidine", "avoid"],
  ["Neuromuscular blockers", "reduced doses of non-depolarising agents; sugammadex reversal"],
  ["Botulinum toxin, D-penicillamine, immune checkpoint inhibitors", "avoid"],
  ["Statins", "may worsen weakness; monitor"],
];

/* ================================================================== hypercalcaemia */

export const correctedCa = (ca: number, albumin: number) => r1(ca + 0.8 * (4 - albumin));
export function hcSeverity(cCa: number): { band: "normal" | "mild" | "moderate" | "severe"; text: string } {
  if (cCa <= 10.5) return { band: "normal", text: `Corrected calcium ${cCa} mg/dL: not raised.` };
  if (cCa < 12) return { band: "mild", text: `Corrected calcium ${cCa} mg/dL: mild hypercalcaemia (up to 12).` };
  if (cCa <= 14) return { band: "moderate", text: `Corrected calcium ${cCa} mg/dL: moderate (12–14); treat if symptomatic or rising.` };
  return { band: "severe", text: `Corrected calcium ${cCa} mg/dL: severe (over 14); treat urgently.` };
}
export function hcTreat(band: "normal" | "mild" | "moderate" | "severe", kg: number, egfr: number | null): string[] {
  if (band === "normal") return ["No treatment for calcium; recheck if symptoms."];
  if (band === "mild") return ["Mild and no symptoms: oral fluids 2–3 litres a day; stop thiazides, calcium and vitamin D supplements, lithium; avoid immobility.", "Work out the cause (below)."];
  const out = [
    "IV 0.9% saline: 200–300 ml/hour, adjusted to keep urine output 100–150 ml/hour; slower in heart or kidney failure.",
    egfr !== null && egfr < 30 ? "Bisphosphonate with eGFR under 30: specialist advice; denosumab 120 mg SC is an option (watch for hypocalcaemia)." : "Zoledronic acid 4 mg IV over at least 15 minutes (or pamidronate 30–90 mg) once rehydrated; works in 2–4 days.",
    kg > 0 ? `Calcitonin ${Math.round(4 * kg)} units (4 units/kg) SC or IM every 12 hours for up to 48 hours if calcium is very high or symptomatic, for a quick fall.` : "Calcitonin 4 units/kg SC or IM every 12 hours for up to 48 hours for a quick fall.",
    "Steroids (prednisolone 40–60 mg daily) if vitamin D–mediated: sarcoidosis, TB, lymphoma, vitamin D toxicity.",
    "Furosemide only for fluid overload after rehydration; dialysis if severe with kidney failure or confusion.",
    "ECG (short QT), monitor calcium, potassium, magnesium and creatinine daily.",
  ];
  return out;
}
export function hcWorkup(pth: "high" | "normal" | "low"): string[] {
  if (pth === "low") return ["PTH suppressed: not parathyroid. Check PTHrP (cancer), serum protein electrophoresis and free light chains (myeloma), 25-OH vitamin D (toxicity), 1,25-(OH)2 vitamin D (sarcoid, TB, lymphoma), TSH, chest X-ray; review drugs (vitamin D, calcium, thiazides, lithium, vitamin A)."];
  return [`PTH ${pth === "high" ? "high" : "inappropriately normal"}: PTH-dependent, usually primary hyperparathyroidism (or tertiary in CKD, or lithium).`, "24-hour urine calcium or calcium/creatinine clearance ratio: under 0.01 suggests familial hypocalciuric hypercalcaemia (no surgery).", "Parathyroid imaging (ultrasound, sestamibi) once surgery is planned; surgery if under 50, calcium over 11.5, kidney stones, osteoporosis or eGFR under 60."];
}

/* ================================================================== deprescribing (STOPP/START) */

export const DP_DRUGS: { id: string; name: string; acb: number }[] = [
  { id: "alprazolam", name: "Alprazolam / lorazepam", acb: 1 }, { id: "clonazepam", name: "Clonazepam / diazepam", acb: 1 }, { id: "zolpidem", name: "Zolpidem / zopiclone", acb: 0 },
  { id: "glibenclamide", name: "Glibenclamide", acb: 0 }, { id: "glimepiride", name: "Glimepiride", acb: 0 }, { id: "insulin", name: "Insulin", acb: 0 },
  { id: "nsaid", name: "NSAID (diclofenac, ibuprofen, etc.)", acb: 0 }, { id: "ppi", name: "PPI (pantoprazole, omeprazole)", acb: 0 }, { id: "aspirin", name: "Aspirin", acb: 0 },
  { id: "warfarin", name: "Warfarin / acenocoumarol", acb: 1 }, { id: "doac", name: "DOAC (apixaban, rivaroxaban, dabigatran)", acb: 0 }, { id: "digoxin", name: "Digoxin", acb: 1 },
  { id: "furosemide", name: "Furosemide / torsemide", acb: 1 }, { id: "metoprolol", name: "Metoprolol", acb: 1 }, { id: "statin", name: "Statin", acb: 0 },
  { id: "amitriptyline", name: "Amitriptyline / imipramine", acb: 3 }, { id: "paroxetine", name: "Paroxetine", acb: 3 }, { id: "chlorpheniramine", name: "Chlorpheniramine (incl. cold and cough syrups)", acb: 3 },
  { id: "promethazine", name: "Promethazine / hydroxyzine", acb: 3 }, { id: "oxybutynin", name: "Oxybutynin / tolterodine", acb: 3 }, { id: "trihexyphenidyl", name: "Trihexyphenidyl", acb: 3 },
  { id: "olanzapine", name: "Olanzapine", acb: 3 }, { id: "quetiapine", name: "Quetiapine", acb: 3 }, { id: "risperidone", name: "Risperidone", acb: 1 }, { id: "haloperidol", name: "Haloperidol", acb: 1 },
  { id: "tramadol", name: "Tramadol / tapentadol", acb: 0 }, { id: "codeine", name: "Codeine", acb: 1 }, { id: "pregabalin", name: "Pregabalin / gabapentin", acb: 0 },
  { id: "prednisolone", name: "Prednisolone (3 months or more)", acb: 1 }, { id: "laxative", name: "Laxative", acb: 0 },
];
export const DP_CONDS: { id: string; name: string }[] = [
  { id: "falls", name: "Falls in the past year" }, { id: "dementia", name: "Dementia or delirium" }, { id: "ckd30", name: "eGFR under 30" }, { id: "hf", name: "Heart failure" },
  { id: "gibleed", name: "Peptic ulcer or GI bleed" }, { id: "af", name: "Atrial fibrillation" }, { id: "cvd", name: "Heart attack, stroke or PAD" }, { id: "osteo", name: "Osteoporosis or fragility fracture" },
  { id: "constipation", name: "Chronic constipation" }, { id: "prostate", name: "Prostate enlargement or glaucoma" }, { id: "palliative", name: "Limited life expectancy (palliative)" },
];
export function deprescribe(drugs: string[], conds: string[]): { stop: string[]; start: string[]; acb: number; acbText: string } {
  const d = (x: string) => drugs.includes(x);
  const c = (x: string) => conds.includes(x);
  const any = (...xs: string[]) => xs.some(d);
  const stop: string[] = [];
  const start: string[] = [];
  if (any("alprazolam", "clonazepam", "zolpidem")) stop.push(`Benzodiazepine or Z-drug${c("falls") || c("dementia") ? ` with ${c("falls") ? "falls" : "dementia"}` : ""}: raises falls, fractures and confusion; taper by 10–25% every 2 weeks (slower near the end), with sleep hygiene or CBT-I.`);
  if (any("glibenclamide", "glimepiride")) stop.push("Long-acting sulfonylurea in an older adult: risk of prolonged hypoglycaemia; switch to gliclazide or another agent, or reduce if HbA1c is under 7%.");
  if ((any("insulin", "glibenclamide", "glimepiride")) && (c("falls") || c("dementia") || c("palliative"))) stop.push("Frail, falls or dementia on insulin or a sulfonylurea: relax the HbA1c target to 7.5–8.5% and avoid hypoglycaemia.");
  if (d("nsaid") && (c("ckd30") || c("hf") || c("gibleed") || any("warfarin", "doac", "aspirin"))) stop.push(`NSAID with ${[c("ckd30") && "eGFR under 30", c("hf") && "heart failure", c("gibleed") && "previous GI bleed", any("warfarin", "doac", "aspirin") && "an antithrombotic"].filter(Boolean).join(", ")}: stop; use paracetamol or topical NSAID.`);
  else if (d("nsaid")) stop.push("Regular NSAID: use the lowest dose for the shortest time, with a PPI; review need.");
  if (d("ppi") && !c("gibleed")) stop.push("PPI at full dose for more than 8 weeks without ongoing indication: step down to the lowest dose or on-demand, then stop.");
  if (d("aspirin") && !c("cvd") && !c("af")) stop.push("Aspirin for primary prevention (no heart attack, stroke or PAD): stop; bleeding risk outweighs benefit in older adults.");
  if (d("aspirin") && any("warfarin", "doac")) stop.push("Aspirin with an anticoagulant: stop aspirin unless there is a recent stent or acute coronary syndrome (cardiology advice).");
  if (d("digoxin") && c("ckd30")) stop.push("Digoxin with eGFR under 30: reduce to 62.5 micrograms a day or less and check a level.");
  if (d("doac") && c("ckd30")) stop.push("DOAC with eGFR under 30: check the dose for kidney function; avoid dabigatran under 30.");
  if (d("pregabalin") && c("ckd30")) stop.push("Pregabalin or gabapentin with eGFR under 30: reduce the dose (dizziness, sedation, falls).");
  else if (d("pregabalin") && c("falls")) stop.push("Pregabalin or gabapentin with falls: reduce or stop if possible; taper over at least 1 week.");
  if (d("amitriptyline") && (c("dementia") || c("constipation") || c("prostate") || c("falls"))) stop.push("Tricyclic with dementia, constipation, prostate/glaucoma or falls: switch (e.g. sertraline for depression, duloxetine or topical agents for pain).");
  if (any("chlorpheniramine", "promethazine")) stop.push("First-generation antihistamine: strongly anticholinergic and sedating; use a non-sedating one (fexofenadine, loratadine).");
  if (any("oxybutynin", "trihexyphenidyl") && c("dementia")) stop.push("Oxybutynin or trihexyphenidyl with dementia: worsens cognition; use mirabegron or bladder training, and review the need for trihexyphenidyl.");
  if (any("olanzapine", "quetiapine", "risperidone", "haloperidol") && c("dementia")) stop.push("Antipsychotic in dementia: only for severe distress or risk; review every 12 weeks and taper by 25–50% every 1–2 weeks if settled (stroke and death risk).");
  if (d("furosemide") && !c("hf")) stop.push("Loop diuretic without heart failure (e.g. for ankle swelling): stop; elevation and compression instead.");
  if (any("tramadol", "codeine") && c("falls")) stop.push("Opioid with falls: lowest dose, review need; tramadol also lowers the seizure threshold and causes hyponatraemia.");
  if (d("statin") && c("palliative")) stop.push("Statin with limited life expectancy: consider stopping; little benefit within a year.");
  if (c("af") && !any("warfarin", "doac")) start.push("Atrial fibrillation without an anticoagulant: assess CHA2DS2-VA and bleeding risk; start a DOAC unless clearly not appropriate.");
  if ((c("cvd")) && !d("statin") && !c("palliative")) start.push("Heart attack, stroke or PAD without a statin: start a high-intensity statin.");
  if ((c("osteo") || d("prednisolone")) ) start.push("Osteoporosis or long-term steroids: calcium and vitamin D with a bisphosphonate (alendronate weekly or zoledronate yearly).");
  if (any("tramadol", "codeine") && !d("laxative")) start.push("Regular opioid without a laxative: add a stimulant plus softener (senna with lactulose or PEG).");
  if (c("hf") && !d("metoprolol")) start.push("Heart failure with reduced EF: check for an evidence-based beta blocker, ACE inhibitor/ARB/ARNI, MRA and SGLT2 inhibitor.");
  const acb = DP_DRUGS.filter((x) => drugs.includes(x.id)).reduce((a, x) => a + x.acb, 0);
  const acbText = acb >= 3 ? `Anticholinergic burden ${acb}: 3 or more is linked to confusion, falls and higher mortality; reduce the drugs scoring 3.` : `Anticholinergic burden ${acb}.`;
  return { stop, start, acb, acbText };
}

/* ================================================================== acute limb ischaemia */

export interface AliInput { sensory: "none" | "toes" | "more" | "profound"; motor: "none" | "mild" | "paralysis"; arterial: boolean; venous: boolean }
export function rutherford(x: AliInput): { cls: "I" | "IIa" | "IIb" | "III"; name: string; action: string } {
  if (x.motor === "paralysis" || x.sensory === "profound" || (!x.venous && !x.arterial)) return { cls: "III", name: "Irreversible", action: "Profound sensory loss, paralysis or rigor, no venous signal: major tissue loss or amputation is likely; senior vascular decision on primary amputation or palliation (revascularisation risks reperfusion injury)." };
  if (x.sensory === "more" || x.motor === "mild") return { cls: "IIb", name: "Immediately threatened", action: "Sensory loss beyond the toes or any weakness: salvageable with immediate revascularisation (surgical embolectomy or bypass); do not delay for imaging if it would hold up theatre." };
  if (x.sensory === "toes" || !x.arterial) return { cls: "IIa", name: "Marginally threatened", action: "Minimal sensory loss and no weakness: salvageable if treated promptly; urgent CT angiography and revascularisation (endovascular or surgical) within hours." };
  return { cls: "I", name: "Viable", action: "No sensory loss or weakness, arterial Doppler signal audible: not immediately threatened; heparin and urgent vascular imaging and review." };
}
export function aliHeparin(kg: number): string {
  const inf = kg > 0 ? `${Math.round(18 * kg)} units/hour (18 units/kg/hour)` : "18 units/kg/hour";
  return `Unfractionated heparin 5,000 units IV bolus (or 80 units/kg), then ${inf}, adjusted to APTT 1.5–2.5 times control (unless contraindicated).`;
}
export const ALI_STEPS = [
  "The 6 Ps: pain, pallor, pulselessness, perishing cold, paraesthesia, paralysis. Paraesthesia and paralysis mean the limb is threatened.",
  "Analgesia (IV opioid), oxygen if hypoxic, IV fluids; keep the limb dependent and warm (not heated).",
  "Bloods: FBC, U&E, CK, lactate, coagulation, group and save; ECG for atrial fibrillation (embolic source); echo later.",
  "Embolus (sudden, AF, normal other leg pulses) vs thrombosis (claudication history, absent pulses on the other side): affects the approach.",
  "After revascularisation watch for reperfusion: compartment syndrome (fasciotomy), hyperkalaemia, acidosis, myoglobinuria and AKI.",
  "Afterwards: long-term anticoagulation if embolic (AF); antiplatelet and statin if atherosclerotic.",
];

/* ================================================================== delirium (4AT) */

export function fourAT(alert: 0 | 4, amt: 0 | 1 | 2, attention: 0 | 1 | 2, acute: 0 | 4): { score: number; text: string } {
  const score = alert + amt + attention + acute;
  if (score >= 4) return { score, text: `4AT ${score}: possible delirium (with or without cognitive impairment). Look for causes and treat.` };
  if (score >= 1) return { score, text: `4AT ${score}: possible cognitive impairment; more detailed testing and history from family.` };
  return { score, text: "4AT 0: delirium or severe cognitive impairment unlikely (but delirium is still possible if information is incomplete)." };
}
export const DELIRIUM_CAUSES: [string, string][] = [
  ["Pain", "untreated pain, fractures, urinary retention"],
  ["Infection", "urine, chest, skin, lines; sepsis"],
  ["Nutrition", "dehydration, poor intake, thiamine deficiency"],
  ["Constipation", "and urinary retention (bladder scan)"],
  ["Hydration and electrolytes", "sodium, calcium, glucose, kidney and liver function"],
  ["Medication", "new or stopped drugs: anticholinergics, opioids, benzodiazepines, steroids; alcohol or drug withdrawal"],
  ["Environment", "new ward, no glasses or hearing aids, sleep loss, restraints, catheters"],
  ["Hypoxia and other", "low oxygen, stroke, heart attack, raised CO2"],
];
export const DELIRIUM_CARE = [
  "Non-drug measures first: a familiar person, glasses and hearing aids, clock and calendar, lights on by day and off at night, mobilise, avoid moving beds and avoid restraints.",
  "Haloperidol only for severe distress or danger to self or others: 0.5 mg orally or IM, repeat after 2 hours if needed (max usually 2 mg in 24 hours in older adults), for the shortest time (usually up to a week).",
  "Avoid haloperidol in Parkinson's disease or Lewy body dementia: specialist advice (low-dose quetiapine is sometimes used).",
  "Benzodiazepines only for alcohol or benzodiazepine withdrawal (they worsen other delirium).",
  "Tell the family it is common and usually improves; screen again daily with the 4AT.",
];

/* ================================================================== childhood rashes */

export const RASH_FEATURES = [
  "Cough, runny nose and red eyes before the rash",
  "White spots inside the cheeks (Koplik)",
  "Itchy blisters in crops (spots at different stages)",
  "Spots on palms, soles and in the mouth",
  "Sandpaper rash with sore throat",
  "Bright red cheeks (slapped cheek)",
  "Rash appears as a high fever settles",
  "Swollen glands behind the ears or neck",
  "Non-blanching spots (do not fade under a glass)",
];
export const RASHES: { id: string; name: string; features: number[]; notes: string }[] = [
  { id: "measles", name: "Measles", features: [0, 1], notes: "Fever and 3 Cs for 2–4 days, then a red rash from the face downwards. Infectious from 4 days before to 4 days after the rash; isolate and notify. Vitamin A for every child (dose below). Watch for pneumonia, diarrhoea, encephalitis; check contacts' MR vaccination." },
  { id: "chickenpox", name: "Chickenpox", features: [2], notes: "Infectious until all spots have crusted (about 5 days). Avoid NSAIDs (severe skin infections) and aspirin. Aciclovir within 24 hours for those over 12, adults, pregnant women, the immunocompromised, or severe disease; contacts who are pregnant or immunocompromised need advice on VZIG." },
  { id: "hfmd", name: "Hand, foot and mouth disease", features: [3], notes: "Coxsackie virus; fluids and paracetamol; watch for dehydration from mouth ulcers; rarely brainstem encephalitis (EV71): twitching, drowsiness, fast breathing need admission." },
  { id: "scarlet", name: "Scarlet fever", features: [4], notes: "Group A strep: sandpaper rash, strawberry tongue, flushed face with pale mouth area. Treat with penicillin V or amoxicillin for 10 days; back to school 24 hours after starting antibiotics; notifiable in some places." },
  { id: "parvo", name: "Slapped cheek (parvovirus B19)", features: [5], notes: "No longer infectious once the rash appears. Risk to pregnant contacts (fetal anaemia, hydrops before 20 weeks) and people with sickle cell or thalassaemia (aplastic crisis): check FBC if pale or tired." },
  { id: "roseola", name: "Roseola (HHV-6)", features: [6], notes: "High fever for 3–5 days in a well-looking infant, then a pink rash as the fever settles. A common cause of febrile seizures. No treatment needed." },
  { id: "rubella", name: "Rubella", features: [7], notes: "Mild illness, rash from the face down with nodes behind the ears. Isolate for 7 days after the rash; keep away from pregnant women (congenital rubella); notify." },
  { id: "meningococcal", name: "Meningococcal disease", features: [8], notes: "Non-blanching rash with fever is meningococcal disease until proved otherwise: ceftriaxone 80 mg/kg IV/IM immediately (benzylpenicillin IM in the community), fluids, senior help; prophylaxis for close contacts." },
];
export function rashMatch(ticks: number[]): { id: string; name: string; hits: number; notes: string }[] {
  if (!ticks.length) return [];
  return RASHES.map((r) => ({ id: r.id, name: r.name, notes: r.notes, hits: r.features.filter((f) => ticks.includes(f)).length })).filter((r) => r.hits > 0).sort((a, b) => (b.id === "meningococcal" ? 1 : 0) - (a.id === "meningococcal" ? 1 : 0) || b.hits - a.hits);
}
export function measlesVitA(ageMonths: number): string {
  const iu = ageMonths < 6 ? "50,000" : ageMonths < 12 ? "1,00,000" : "2,00,000";
  return `Vitamin A ${iu} IU by mouth on day 1 and day 2 (age ${ageMonths < 6 ? "under 6 months" : ageMonths < 12 ? "6–11 months" : "12 months or more"}); a third dose 2–4 weeks later if there are eye signs of vitamin A deficiency.`;
}

/* ================================================================== sore throat and otitis media */

export const FEVERPAIN = ["Fever in the past 24 hours", "Pus on the tonsils", "Attended within 3 days of onset", "Inflamed tonsils", "No cough or runny nose"];
export function feverPain(ticks: boolean[]): { score: number; text: string } {
  const score = ticks.filter(Boolean).length;
  if (score >= 4) return { score, text: `FeverPAIN ${score}: about 60% chance of strep; immediate antibiotic, or a back-up prescription if mild.` };
  if (score >= 2) return { score, text: `FeverPAIN ${score}: about 35–40% chance of strep; no antibiotic or a back-up (delayed) prescription.` };
  return { score, text: `FeverPAIN ${score}: 13–18% chance of strep; no antibiotic, symptom relief.` };
}
export function pharyngitisRx(kg: number, child: boolean, allergy: boolean): string[] {
  if (allergy) return [child && kg > 0 ? `Penicillin allergy: azithromycin ${Math.round(cap(12 * kg, 500))} mg once daily for 5 days (12 mg/kg, max 500 mg).` : "Penicillin allergy: azithromycin 500 mg once daily for 5 days, or clarithromycin 250–500 mg twice daily for 5 days."];
  if (child) return [
    kg > 0 ? `Amoxicillin ${Math.round(cap(50 * kg, 1000))} mg once daily (50 mg/kg, max 1 g) for 10 days, or penicillin V for 10 days.` : "Amoxicillin 50 mg/kg once daily (max 1 g) for 10 days.",
    `Or a single benzathine penicillin injection ${kg > 0 && kg < 27 ? "600,000 units" : "1.2 million units"} IM (preferred where adherence is uncertain; prevents rheumatic fever).`,
    "A full 10-day course matters in India because it prevents rheumatic fever.",
  ];
  return ["Penicillin V 500 mg four times daily, or amoxicillin 500 mg three times daily, for 10 days; or benzathine penicillin 1.2 million units IM once.", "Paracetamol or ibuprofen and warm salt-water gargles for symptoms."];
}
export function aomPlan(ageMonths: number, bilateral: boolean, severe: boolean, otorrhoea: boolean, kg: number, recentAmox: boolean): { immediate: boolean; steps: string[] } {
  const immediate = ageMonths < 6 || severe || otorrhoea || (ageMonths < 24 && bilateral);
  const days = ageMonths < 24 ? 10 : ageMonths < 72 ? 7 : 5;
  const steps: string[] = [];
  steps.push(immediate ? `Antibiotic now: ${[ageMonths < 6 && "under 6 months", severe && "severe (fever 39°C or more, moderate–severe pain, or pain for 48 hours)", otorrhoea && "ear discharge", ageMonths < 24 && bilateral && "both ears under 2 years"].filter(Boolean).join(", ")}.` : "Watchful waiting for 48–72 hours with pain relief is reasonable; give a back-up prescription and review if not better or worse.");
  const mgDay = recentAmox ? 90 : 85;
  const dose = kg > 0 ? `${Math.round(cap((mgDay * kg) / 2, 2000))} mg twice daily` : `${mgDay} mg/kg/day in 2 doses`;
  steps.push(recentAmox ? `Co-amoxiclav (amoxicillin component) ${dose} for ${days} days (amoxicillin in the past 30 days, or with conjunctivitis).` : `Amoxicillin ${dose} (80–90 mg/kg/day, max 2 g a dose) for ${days} days.`);
  steps.push("Paracetamol or ibuprofen for pain; no decongestants or antihistamines.", "Red flags: swelling or redness behind the ear (mastoiditis), facial weakness, severe headache or drowsiness: urgent ENT referral.");
  return { immediate, steps };
}

/* ================================================================== falls and hip fracture */

export function orthostatic(lyingSys: number, lyingDia: number, standSys: number, standDia: number): { positive: boolean; text: string } | null {
  if (!(lyingSys > 0 && standSys > 0)) return null;
  const ds = lyingSys - standSys;
  const dd = lyingDia > 0 && standDia > 0 ? lyingDia - standDia : 0;
  const positive = ds >= 20 || dd >= 10 || standSys < 90;
  return { positive, text: positive ? `Orthostatic hypotension: systolic fall ${ds}, diastolic fall ${dd} mmHg. Review antihypertensives, diuretics, alpha blockers and nitrates; fluids, compression stockings, rise slowly.` : `No orthostatic hypotension (systolic fall ${ds}, diastolic fall ${dd} mmHg).` };
}
export function tug(seconds: number): string {
  if (!(seconds > 0)) return "Timed Up and Go: rise from a chair, walk 3 metres, turn, walk back, sit.";
  return seconds >= 12 ? `Timed Up and Go ${seconds} seconds (12 or more): high falls risk; refer for strength and balance training and a full falls assessment.` : `Timed Up and Go ${seconds} seconds: gait speed reassuring.`;
}
export const NHFS_ITEMS: { label: string; pts: number }[] = [
  { label: "Age 66–85", pts: 3 }, { label: "Age 86 or more", pts: 4 }, { label: "Male", pts: 1 }, { label: "Admission Hb 10 g/dL or less", pts: 1 },
  { label: "Abbreviated mental test 6/10 or less", pts: 1 }, { label: "Living in a care home", pts: 1 }, { label: "More than one comorbidity", pts: 1 }, { label: "Cancer in the past 20 years", pts: 1 },
];
export function nhfs(ticks: boolean[]): { score: number; text: string } {
  const t = [...ticks];
  if (t[0] && t[1]) t[0] = false;
  const score = NHFS_ITEMS.reduce((a, it, i) => a + (t[i] ? it.pts : 0), 0);
  return { score, text: score >= 5 ? `Nottingham Hip Fracture Score ${score}: high 30-day mortality risk; involve orthogeriatrics early, discuss goals of care, plan level of post-op care.` : `Nottingham Hip Fracture Score ${score}: lower 30-day mortality risk.` };
}
export const HIP_STEPS = [
  "Analgesia on arrival: paracetamol and an opioid if needed, plus a fascia iliaca or femoral nerve block; avoid NSAIDs.",
  "Surgery on the day of, or the day after, admission (within 36 hours); correct only what can be fixed quickly (anticoagulation reversal, severe anaemia, fluid deficit).",
  "Orthogeriatric review, delirium screening (4AT), pressure area care, VTE prophylaxis.",
  "Mobilise the day after surgery with full weight bearing as tolerated.",
  "Before discharge: bone protection (vitamin D, then a bisphosphonate such as zoledronate), falls assessment and home safety.",
];
export const FALLS_STEPS = [
  "Multifactorial assessment: falls history, gait and balance, vision, feet and footwear, continence, cognition, home hazards, and medicines (use the Deprescribing tool).",
  "Strength and balance exercise (e.g. Otago) is the most effective single intervention.",
  "Check: lying and standing BP, ECG, glucose, vitamin D, FBC, U&E; consider syncope if blackouts.",
  "Treat cataracts, review glasses (avoid multifocals when walking outdoors), remove trip hazards, grab rails and night lighting.",
];
