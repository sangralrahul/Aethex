/**
 * Update 37, on the device (no AI): hyperkalaemia, acute pancreatitis, paediatric sepsis (Phoenix),
 * upper airway emergencies, rhabdomyolysis, hypothermia and drowning, paediatric DKA and acute
 * urinary retention.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== hyperkalaemia */

export const HYPERK_ECG = ["Peaked T waves", "Flattened or absent P waves", "Prolonged PR", "Broad QRS", "Sine wave pattern", "Bradycardia or heart block", "VT or VF"];
export function hyperkLevel(k: number): "normal" | "mild" | "moderate" | "severe" {
  return k >= 6.5 ? "severe" : k >= 6 ? "moderate" : k >= 5.5 ? "mild" : "normal";
}
export function hyperkPlan(k: number, ecgChanges: boolean, kg: number, child: boolean, glucose: number | null, acidotic: boolean): string[] {
  const lvl = hyperkLevel(k);
  if (lvl === "normal") return ["Potassium is not raised."];
  const w = kg > 0 ? kg : child ? 20 : 70;
  const out = ["Exclude pseudohyperkalaemia (haemolysed sample, very high white cells or platelets, fist clenching): repeat on a blood gas, but do not delay treatment if the ECG is abnormal."];
  if (ecgChanges || lvl === "severe") out.push(child
    ? `Protect the heart: 10% calcium gluconate ${r1(cap(0.5 * w, 20))} ml (0.5 ml/kg, max 20 ml) IV over 5–10 minutes; repeat if ECG changes persist.`
    : "Protect the heart: 10% calcium gluconate 30 ml IV over 10 minutes (or 10% calcium chloride 10 ml via a large vein); repeat after 5–10 minutes if ECG changes persist, up to 90 ml.");
  if (lvl !== "mild" || ecgChanges) {
    out.push(child
      ? `Shift potassium: insulin ${r1(cap(0.1 * w, 10))} units (0.1 units/kg) with glucose ${r1(cap(0.5 * w, 25))} g (${Math.round(cap(5 * w, 250))} ml of 10% dextrose) over 30 minutes; check glucose every 30 minutes.`
      : `Shift potassium: 10 units soluble insulin in 25 g glucose (50 ml of 50% or 125 ml of 20%) IV over 15 minutes; check glucose at 0, 15, 30, 60, 90, 120, 180, 240, 300 and 360 minutes${glucose !== null && glucose < 126 ? "; glucose was under 126 mg/dL, so follow with 10% glucose 50 ml/hour for 5 hours" : ""}.`,
      child ? `Salbutamol ${w < 25 ? "2.5 mg" : "5 mg"} nebulised.` : lvl === "severe" ? "Add salbutamol 10–20 mg nebulised (avoid with tachyarrhythmia or ischaemic heart disease)." : "Salbutamol 10–20 mg nebulised can be added.",
    );
    if (acidotic) out.push("Metabolic acidosis: sodium bicarbonate can help (e.g. 1.26% 500 ml over 1 hour) if not fluid overloaded; discuss with renal team.");
  }
  out.push(
    "Remove potassium: sodium zirconium cyclosilicate 10 g three times daily for up to 72 hours (or patiromer, or calcium polystyrene sulfonate 15 g four times daily where those are not available).",
    "Stop potassium supplements, ACE inhibitors, ARBs, spironolactone, NSAIDs, trimethoprim and potassium-sparing diuretics; treat the cause (AKI, DKA, rhabdomyolysis, haemolysis).",
    lvl === "severe" ? "Recheck potassium 1, 2, 4, 6 and 24 hours after treatment; cardiac monitoring; call renal for dialysis if refractory, oliguric AKI or ESRD." : "Recheck potassium within 4–6 hours; cardiac monitoring if 6.0 or more.",
  );
  return out;
}

/* ================================================================== acute pancreatitis */

export const RANSON_ADMIT = ["Age over 55", "White cells over 16,000", "Glucose over 200 mg/dL", "LDH over 350 U/L", "AST over 250 U/L"];
export const RANSON_48 = ["Haematocrit fall over 10%", "Urea nitrogen rise over 5 mg/dL", "Calcium under 8 mg/dL", "PaO2 under 60 mmHg", "Base deficit over 4", "Fluid sequestration over 6 litres"];
export function ranson(n: number): string { return n >= 3 ? `Ranson ${n}: predicted severe pancreatitis.` : `Ranson ${n}: predicted mild.`; }
export function atlanta(organFailureHours: number, localComplications: boolean): { grade: "mild" | "moderately severe" | "severe"; text: string } {
  if (organFailureHours > 48) return { grade: "severe", text: "Severe (persistent organ failure over 48 hours): ICU, mortality 15–30%." };
  if (organFailureHours > 0 || localComplications) return { grade: "moderately severe", text: "Moderately severe (transient organ failure under 48 hours, or local or systemic complications)." };
  return { grade: "mild", text: "Mild (no organ failure, no complications): usually home within a few days." };
}
export function pancFluids(kg: number, hypovolaemic: boolean): string[] {
  const w = kg > 0 ? kg : 70;
  return [
    hypovolaemic ? `Bolus: Ringer's lactate ${Math.round(10 * w)} ml (10 ml/kg) over 1–2 hours.` : "No bolus needed if not hypovolaemic.",
    `Then Ringer's lactate ${Math.round(1.5 * w)} ml/hour (1.5 ml/kg/hour); reassess at 12, 24, 48 and 72 hours (urine output, haematocrit, urea) and slow down once improving; avoid over-filling (WATERFALL trial).`,
  ];
}
export const PANC_PLAN = [
  "Diagnose with 2 of 3: typical epigastric pain, lipase or amylase over 3 times normal, imaging; CT is not needed at admission if the diagnosis is clear.",
  "Analgesia: paracetamol plus opioids as needed; NSAIDs only if kidneys are fine.",
  "Feed early: oral diet within 24 hours as tolerated; nasogastric or nasojejunal feeding if not eating by 72 hours in severe disease; avoid parenteral nutrition unless enteral fails.",
  "No prophylactic antibiotics; treat infected necrosis (gas on CT or not improving after 7–10 days) or cholangitis.",
  "Gallstones: ultrasound; ERCP within 24 hours only with cholangitis; cholecystectomy in the same admission for mild biliary pancreatitis.",
  "Contrast CT after 72 hours if not improving; infected walled-off necrosis: step-up approach (drain first, necrosectomy after about 4 weeks).",
  "Alcohol: counselling and thiamine; check triglycerides (over 1,000 mg/dL causes pancreatitis) and calcium.",
];

/* ================================================================== paediatric sepsis (Phoenix 2024) */

export interface PhoenixIn { ageYears: number; resp: 0 | 1 | 2 | 3; vasoactives: number; lactate: number | null; map: number | null; platelets: number | null; inr: number | null; ddimer: number | null; fibrinogen: number | null; gcs: number | null; fixedPupils: boolean }
function mapBands(age: number): [number, number] {
  // [1-point upper bound, 2-point upper bound]: MAP below the first scores 1, below the second scores 2.
  if (age < 1 / 12) return [31, 17];
  if (age < 1) return [39, 25];
  if (age < 2) return [44, 31];
  if (age < 5) return [45, 32];
  if (age < 12) return [49, 36];
  return [52, 38];
}
export function phoenix(x: PhoenixIn): { total: number; resp: number; cvs: number; coag: number; neuro: number; sepsis: boolean; shock: boolean } {
  const resp = x.resp;
  let cvs = x.vasoactives >= 2 ? 2 : x.vasoactives === 1 ? 1 : 0;
  if (x.lactate !== null) cvs += x.lactate >= 11 ? 2 : x.lactate >= 5 ? 1 : 0;
  if (x.map !== null) { const [one, two] = mapBands(x.ageYears); cvs += x.map < two ? 2 : x.map < one ? 1 : 0; }
  let coag = 0;
  if (x.platelets !== null && x.platelets < 100) coag++;
  if (x.inr !== null && x.inr > 1.3) coag++;
  if (x.ddimer !== null && x.ddimer > 2) coag++;
  if (x.fibrinogen !== null && x.fibrinogen < 100) coag++;
  coag = Math.min(2, coag);
  const neuro = x.fixedPupils ? 2 : x.gcs !== null && x.gcs <= 10 ? 1 : 0;
  const total = resp + cvs + coag + neuro;
  return { total, resp, cvs, coag, neuro, sepsis: total >= 2, shock: total >= 2 && cvs >= 1 };
}
export const PHOENIX_RESP = ["0: PaO2/FiO2 400 or more (SpO2/FiO2 292 or more)", "1: PaO2/FiO2 under 400 or SpO2/FiO2 under 292, on any respiratory support", "2: PaO2/FiO2 100–200 or SpO2/FiO2 148–220, on invasive ventilation", "3: PaO2/FiO2 under 100 or SpO2/FiO2 under 148, on invasive ventilation"];
export function paedSepsisPlan(kg: number, ageYears: number, shock: boolean, icu: boolean): string[] {
  const w = kg > 0 ? kg : 15;
  const neonate = ageYears < 1 / 12;
  return [
    `Antibiotics within ${shock ? "1 hour" : "3 hours (1 hour if shock develops)"}, after blood cultures: ${neonate ? `ampicillin ${Math.round(50 * w)} mg with gentamicin ${r1(5 * w)} mg (or cefotaxime ${Math.round(50 * w)} mg)` : `ceftriaxone ${Math.round(cap(80 * w, 4000))} mg (80 mg/kg, max 4 g) once daily`}${shock ? "; add vancomycin where MRSA or resistant pneumococcus is common" : ""}.`,
    icu ? `Fluids: ${Math.round(10 * w)}–${Math.round(20 * w)} ml (10–20 ml/kg) balanced crystalloid boluses, reassessing after each, up to 40–60 ml/kg in the first hour; stop if crackles, hepatomegaly or worse breathing.` : "No intensive care available and no hypotension: no fluid boluses (FEAST); give maintenance fluids and treat hypotension with 10–20 ml/kg boluses carefully.",
    `Shock after 40–60 ml/kg: adrenaline or noradrenaline 0.05–0.3 micrograms/kg/minute (${r1(0.3 * w)} mg in 50 ml: 1 ml/hour = 0.1 micrograms/kg/minute); peripheral or IO infusion is fine to start.`,
    `Catecholamine-resistant shock: hydrocortisone ${Math.round(cap(2 * w, 100))} mg (2 mg/kg, max 100 mg) IV.`,
    "Check glucose, calcium and lactate; correct hypoglycaemia (2 ml/kg 10% dextrose); target normal mental state, capillary refill under 3 seconds and urine over 1 ml/kg/hour.",
  ];
}

/* ================================================================== upper airway and stridor */

export const AIRWAY_FEATURES = [
  "Sudden onset while eating or playing",
  "Fever, toxic, drooling, sitting forward",
  "Barking cough, coryza, hoarse voice",
  "Urticaria, wheeze or known allergen exposure",
  "Lip or tongue swelling without urticaria (on an ACE inhibitor or hereditary)",
  "Trismus, neck swelling, unable to open mouth or swallow",
  "Has a tracheostomy or laryngectomy",
  "Recently extubated",
] as const;
const CAUSES: { label: string; when: number[]; steps: string[] }[] = [
  { label: "Inhaled foreign body", when: [0], steps: ["Choking algorithm: effective cough, encourage coughing; ineffective and conscious, 5 back blows then 5 abdominal thrusts (chest thrusts under 1 year); unconscious, start CPR and look in the mouth before breaths.", "Stable with a partial obstruction: keep them calm and upright, oxygen, and arrange urgent rigid bronchoscopy; do not attempt blind finger sweeps."] },
  { label: "Epiglottitis or bacterial tracheitis", when: [1], steps: ["Do not examine the throat, lie them down or cannulate a distressed child; keep the parent close.", "Call the most senior anaesthetist and ENT surgeon; intubate in theatre with ENT ready for a surgical airway.", "Then ceftriaxone (50–80 mg/kg, adult 2 g) IV."] },
  { label: "Croup", when: [2], steps: ["Dexamethasone 0.15–0.6 mg/kg by mouth; severe: nebulised adrenaline 0.5 ml/kg of 1:1,000 (max 5 ml) and observe 2–4 hours (see the Croup tool)."] },
  { label: "Anaphylaxis", when: [3], steps: ["IM adrenaline now (0.5 mg adult; 10 micrograms/kg child), nebulised adrenaline for stridor, and call for airway help (see the Anaphylaxis tool)."] },
  { label: "Bradykinin angio-oedema (ACE inhibitor or hereditary)", when: [4], steps: ["Adrenaline and antihistamines usually do not work; stop the ACE inhibitor.", "Icatibant 30 mg SC or C1-esterase inhibitor; fresh frozen plasma if neither is available.", "Early fibreoptic assessment; awake fibreoptic intubation if the airway is threatened."] },
  { label: "Deep neck infection (Ludwig's angina, retropharyngeal or peritonsillar abscess)", when: [5, 1], steps: ["Sit up, oxygen, IV antibiotics (amoxicillin-clavulanate or ceftriaxone with metronidazole), dexamethasone may reduce swelling.", "CT neck if the airway allows; urgent ENT or maxillofacial drainage; awake fibreoptic intubation or tracheostomy under local anaesthetic."] },
  { label: "Tracheostomy or laryngectomy emergency", when: [6], steps: ["Call for help; high-flow oxygen to the face and the stoma.", "Remove speaking valve or cap and inner tube; pass a suction catheter: if it passes, the tube is patent.", "If not, deflate the cuff; if still not breathing, remove the tracheostomy tube.", "Laryngectomy: oxygenate and intubate via the stoma only. Others: oral oxygenation with the stoma covered, or stoma intubation with a small tube."] },
  { label: "Post-extubation stridor", when: [7], steps: ["Nebulised adrenaline 1 mg (adults; children 0.5 ml/kg of 1:1,000, max 5 ml), sit up, heliox if available.", "Dexamethasone 0.15 mg/kg (adults 4–8 mg) every 6 hours; re-intubate early with a smaller tube if worsening."] },
];
export function airwayCauses(ticked: number[]): { label: string; steps: string[] }[] {
  return CAUSES.map((c) => ({ c, s: c.when.filter((i) => ticked.includes(i)).length })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => ({ label: x.c.label, steps: x.c.steps }));
}
export const AIRWAY_GENERAL = [
  "Keep the patient calm and in the position they choose (usually sitting up); give oxygen without upsetting a child.",
  "Call early: senior anaesthetist and ENT; prepare difficult airway equipment and a front-of-neck access kit.",
  "Can't intubate, can't oxygenate: scalpel–bougie–tube cricothyroidotomy (DAS 2015) in adults; needle cricothyroidotomy in young children.",
];

/* ================================================================== rhabdomyolysis */

export interface McMahon { age: number; female: boolean; creatinine: number; calcium: number; ck: number; phosphate: number; bicarbonate: number; benignCause: boolean }
/** McMahon score: 6 or more predicts dialysis or death. Units: mg/dL, U/L, mmol/L. */
export function mcmahon(x: McMahon): { score: number; high: boolean } {
  let s = 0;
  s += x.age > 80 ? 3 : x.age > 70 ? 2.5 : x.age > 50 ? 1.5 : 0;
  if (x.female) s += 1;
  s += x.creatinine > 2.2 ? 3 : x.creatinine >= 1.4 ? 1.5 : 0;
  if (x.calcium < 7.5) s += 2;
  if (x.ck > 40000) s += 2;
  if (!x.benignCause) s += 3;
  s += x.phosphate > 5.4 ? 3 : x.phosphate >= 4 ? 1.5 : 0;
  if (x.bicarbonate < 19) s += 2;
  return { score: s, high: s >= 6 };
}
export function rhabdoPlan(kg: number, high: boolean): string[] {
  const w = kg > 0 ? kg : 70;
  return [
    `IV crystalloid early (0.9% saline or Ringer's lactate), e.g. 1–2 litres in the first hour, then about ${Math.round(Math.min(400, Math.max(200, 3 * w)))} ml/hour titrated to a urine output of 200–300 ml/hour (3 ml/kg/hour) until CK falls below about 5,000.`,
    "Watch for fluid overload in heart or kidney failure, and for compartment syndrome (pain on passive stretch, tense limb): urgent fasciotomy.",
    "Check potassium, calcium, phosphate and creatinine every 6–12 hours; treat high potassium; do not treat low calcium unless symptomatic or potassium is dangerous.",
    "No routine bicarbonate or mannitol (no proven benefit).",
    high ? "McMahon 6 or more: high risk of dialysis or death: involve nephrology early." : "Low risk score: usually recovers with fluids.",
  ];
}
export const RHABDO_CAUSES = ["Crush injury, long lie, prolonged immobility", "Exertion, heat stroke, seizures", "Drugs: statins with fibrates or macrolides, colchicine, alcohol, cocaine", "Snake (Russell's viper, sea snake) or wasp/hornet stings", "Infections: influenza, dengue, leptospirosis, Covid-19", "Electrolytes: low potassium or phosphate; hypothyroidism"];

/* ================================================================== hypothermia and drowning */

export function hypoStage(temp: number | null, conscious: boolean, shivering: boolean, vitals: boolean): { stage: string; plan: string[] } {
  const t = temp ?? (vitals ? (conscious ? (shivering ? 33 : 30) : 26) : 22);
  if (temp !== null && temp >= 35 && vitals) return { stage: "Not hypothermic", plan: ["Temperature 35 °C or more: keep warm and treat the cause."] };
  if (!vitals || t < 24) return { stage: "HT IV (no vital signs)", plan: ["Start CPR; check for signs of life for up to 1 minute.", t < 30 ? "Below 30 °C: up to 3 shocks, then no more shocks or adrenaline until above 30 °C." : "30–35 °C: double the interval between adrenaline doses.", "Transfer to a centre with ECMO or cardiopulmonary bypass for rewarming; keep CPR going (mechanical CPR helps).", "Prognosis can be good: nobody is dead until warm and dead (unless obvious lethal injury or potassium over 12)."] };
  if (t < 28 || !conscious) return { stage: "HT III (24–28 °C, unconscious)", plan: ["Handle gently and keep horizontal (rough handling can trigger VF).", "Active external and minimally invasive rewarming (forced warm air, warmed IV fluids at 38–42 °C); ICU.", "If unstable (systolic under 90, ventricular arrhythmia): transfer to an ECMO centre."] };
  if (t < 32 || !shivering) return { stage: "HT II (28–32 °C, drowsy, not shivering)", plan: ["Keep horizontal, insulate, active external rewarming (forced warm air, heat packs to the trunk), warmed IV fluids.", "Cardiac monitoring: arrhythmias are common; check glucose and potassium."] };
  if (t < 35) return { stage: "HT I (32–35 °C, alert, shivering)", plan: ["Warm environment, remove wet clothes, insulate, warm sweet drinks if able to swallow, encourage movement once dry."] };
  return { stage: "Not hypothermic", plan: ["Temperature 35 °C or more: keep warm and treat the cause."] };
}
export const DROWNING = [
  "Start with 5 rescue breaths, then CPR (30:2, or 15:2 for children by healthcare staff); oxygen as soon as possible.",
  "Only immobilise the spine if diving, water-slide, trauma or alcohol suggest a neck injury.",
  "Any cough, breathlessness, low SpO2 or abnormal chest sounds: hospital, oxygen, chest X-ray, CPAP or ventilation with PEEP for pulmonary oedema.",
  "Well with normal breathing and SpO2: can go home after 4–6 hours of normal observation with advice to return.",
  "No routine antibiotics or steroids; treat pneumonia if it develops (contaminated water).",
];

/* ================================================================== paediatric DKA (BSPED 2021) */

export function paedDkaSeverity(ph: number, bicarb: number | null): "mild" | "moderate" | "severe" {
  if (ph < 7.1 || (bicarb !== null && bicarb < 5)) return "severe";
  if (ph < 7.2 || (bicarb !== null && bicarb < 10)) return "moderate";
  return "mild";
}
export function paedDka(kg: number, ph: number, bicarb: number | null, shocked: boolean): { severity: string; deficitPct: number; bolus: string; hourly: number; insulin: string; steps: string[] } {
  const w = cap(kg > 0 ? kg : 30, 75);
  const severity = paedDkaSeverity(ph, bicarb);
  const deficitPct = severity === "severe" ? 10 : 5;
  const deficit = deficitPct * w * 10;
  const maint = Math.min(w, 10) * 100 + Math.max(0, Math.min(w, 20) - 10) * 50 + Math.max(0, w - 20) * 20;
  // BSPED 2021: boluses are not subtracted from the deficit (shocked children beyond 20 ml/kg: senior review).
  const hourly = Math.round(deficit / 48 + maint / 24);
  return {
    severity, deficitPct,
    bolus: shocked ? `Shocked: 0.9% saline ${Math.round(20 * w)} ml (20 ml/kg) over 15 minutes, reassess; call PICU.` : `Not shocked: 0.9% saline ${Math.round(10 * w)} ml (10 ml/kg) over 60 minutes (not subtracted from the deficit).`,
    hourly,
    insulin: `Insulin infusion ${r1(0.05 * w)}–${r1(0.1 * w)} units/hour (0.05–0.1 units/kg/hour), starting 1–2 hours after IV fluids; no insulin bolus; continue long-acting insulin if already on it.`,
    steps: [
      `Deficit ${deficitPct}% (${Math.round(deficit)} ml) over 48 hours plus maintenance ${Math.round(maint)} ml/day: about ${hourly} ml/hour of 0.9% saline with 40 mmol/L potassium chloride (weight capped at 75 kg).`,
      "When glucose falls below 252 mg/dL (14 mmol/L), add 5% glucose to the fluids; increase to 10% if it keeps falling below 108 mg/dL (6 mmol/L).",
      "Hourly glucose, neuro observations and fluid balance; blood gas, sodium, potassium every 2–4 hours; corrected sodium should rise as glucose falls.",
      "Cerebral oedema (headache, falling heart rate, rising BP, confusion): 3% saline 3–5 ml/kg or 20% mannitol 2.5–5 ml/kg over 10–15 minutes, raise the head, slow fluids, call PICU.",
    ],
  };
}

/* ================================================================== acute urinary retention */

export function retentionPlan(residualMl: number | null, male: boolean, clots: boolean, failedCath: boolean): string[] {
  const out: string[] = [];
  out.push(failedCath ? "Catheter won't pass: do not force; one attempt with a 12 Fr Coudé tip and plenty of lubricant gel; then urology for suprapubic catheter or flexible cystoscopy." : `Catheterise with ${clots ? "a 3-way 20–22 Fr catheter for bladder washouts and irrigation (clot retention)" : male ? "a 12–14 Fr catheter" : "a 12 Fr catheter"} under aseptic technique with lidocaine gel; record the residual volume.`);
  if (residualMl !== null) {
    if (residualMl > 1000) out.push(`Residual ${residualMl} ml (over 1 litre): likely chronic retention; check creatinine; watch for post-obstructive diuresis (urine over 200 ml/hour for 2 hours: replace about half with IV fluids, check electrolytes); urology review before a trial without catheter.`);
    else if (residualMl > 400) out.push(`Residual ${residualMl} ml confirms retention.`);
    else out.push(`Residual ${residualMl} ml: check for another cause of the symptoms (pain, infection); retention is unlikely under about 300–400 ml.`);
  }
  if (male) out.push("Start tamsulosin 400 micrograms daily and try without the catheter (TWOC) after 2–3 days; if it fails, urology for prostate assessment.");
  out.push("Look for causes: prostate enlargement, constipation, drugs (anticholinergics, opioids, antihistamines, decongestants, alcohol), UTI, post-operative pain, clots, urethral stricture, and neurological causes (cauda equina, spinal cord compression, MS).");
  out.push("Red flags needing emergency imaging: back pain with saddle numbness or leg weakness (cauda equina), known cancer (cord compression).");
  return out;
}
