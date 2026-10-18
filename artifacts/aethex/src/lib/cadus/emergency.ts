/**
 * Emergency protocols as timed checklists, and the crash-cart drug card by
 * weight. Everything here is static reference content that works offline;
 * doses are usual adult and paediatric references from the standard
 * resuscitation and emergency texts, for the clinician to confirm.
 */

export interface ProtocolStep {
  id: string;
  text: string;
  /** Minutes from the start by which this should be done (0 = at once). */
  by?: number;
  /** A dose or detail line under the step. */
  detail?: string;
  /** Critical steps are shown in red. */
  critical?: boolean;
}

export interface Protocol {
  id: string;
  name: string;
  tagline: string;
  /** A one-line trigger that defines the emergency. */
  trigger: string;
  steps: ProtocolStep[];
  /** Things to hand over or document at the end. */
  handover: string[];
  source: string;
}

const S = (id: string, text: string, extra: Partial<ProtocolStep> = {}): ProtocolStep => ({ id, text, ...extra });

export const PROTOCOLS: Protocol[] = [
  {
    id: "sepsis", name: "Sepsis: first hour", tagline: "The hour-1 bundle", trigger: "Suspected infection with organ dysfunction (qSOFA 2 or more, lactate above 2, or hypotension).",
    steps: [
      S("s1", "Measure lactate; repeat in 2 to 4 hours if above 2 mmol/L", { by: 0 }),
      S("s2", "Two sets of blood cultures before antibiotics (do not delay antibiotics beyond 45 minutes for them)", { by: 0 }),
      S("s3", "Broad-spectrum IV antibiotics within the hour, per local antibiogram", { by: 60, critical: true, detail: "Community: ceftriaxone 2 g IV (± azithromycin); hospital-acquired or shock: piperacillin-tazobactam 4.5 g IV; add vancomycin if MRSA risk." }),
      S("s4", "Crystalloid 30 mL/kg IV for hypotension or lactate 4 or more", { by: 60, critical: true, detail: "Balanced crystalloid (Ringer lactate) preferred; reassess after each 500 mL." }),
      S("s5", "Noradrenaline if MAP below 65 mmHg during or after fluids", { by: 60, critical: true, detail: "Start 0.05 to 0.1 microgram/kg/min via a central line (peripheral large-bore for the first hours if needed)." }),
      S("s6", "Source control: find and drain, remove the line, relieve the obstruction", { by: 360 }),
      S("s7", "Urine output hourly (catheter), glucose, and a repeat examination", { by: 60 }),
      S("s8", "Reassess volume status and perfusion at 3 hours", { by: 180 }),
    ],
    handover: ["Time antibiotics given and which", "Fluid total and response", "Lactate values", "Vasopressor dose", "Source identified or pending"],
    source: "Surviving Sepsis Campaign 2021 hour-1 bundle",
  },
  {
    id: "stemi", name: "STEMI", tagline: "Door-to-balloon or door-to-needle", trigger: "Chest pain with ST elevation of 1 mm or more in two contiguous leads (in V2–V3: 2.5 mm in men under 40, 2 mm in men 40 or older, 1.5 mm in women), or new LBBB with a convincing story.",
    steps: [
      S("m1", "12-lead ECG within 10 minutes of arrival; right-sided leads if inferior", { by: 10, critical: true }),
      S("m2", "Aspirin 300 mg chewed", { by: 10, critical: true }),
      S("m3", "Second antiplatelet: ticagrelor 180 mg for PCI; with thrombolysis, clopidogrel 300 mg (75 mg with no loading dose if 75 or older)", { by: 10 }),
      S("m4", "Activate the cath lab; primary PCI if achievable within 120 minutes of first medical contact", { by: 10, critical: true }),
      S("m5", "If PCI cannot happen within 120 minutes: thrombolysis within 30 minutes of arrival, unless contraindicated", { by: 30, critical: true, detail: "Tenecteplase weight-based IV bolus (30 mg below 60 kg, 35 mg 60–69, 40 mg 70–79, 45 mg 80–89, 50 mg 90 kg or more; halve if 75 or older), or streptokinase 1.5 MU over 60 minutes. Then transfer for angiography within 2 to 24 hours." }),
      S("m6", "Anticoagulation with lysis: enoxaparin 30 mg IV bolus then 1 mg/kg SC every 12 h (max 100 mg for the first two doses); 75 or older: no bolus, 0.75 mg/kg SC every 12 h (max 75 mg); CrCl below 30: 1 mg/kg once daily. For PCI: unfractionated heparin 70–100 units/kg IV", { by: 30 }),
      S("m7", "Oxygen only if SpO₂ below 90%; morphine 2–4 mg IV for pain not relieved by nitrates", { by: 15 }),
      S("m8", "No nitrates if inferior/right ventricular infarction with hypotension or sildenafil in the last 24 hours", { by: 15, critical: true }),
      S("m9", "Beta-blocker orally within 24 hours if no heart failure, shock or bradycardia; high-intensity statin tonight", { by: 1440 }),
      S("m10", "Monitor rhythm continuously; defibrillator at the bedside", { by: 0 }),
    ],
    handover: ["Time of symptom onset, first ECG and first medical contact", "Antiplatelets and anticoagulant given with times", "Lytic given (time) or PCI activation time", "Contraindications checked", "Rhythm and haemodynamics now"],
    source: "ESC 2023 ACS guideline; ACC/AHA 2025",
  },
  {
    id: "dka", name: "Diabetic ketoacidosis", tagline: "Fluids, insulin, potassium", trigger: "Glucose above 250 mg/dL (or known diabetes), ketones positive (blood 3 or more), pH below 7.3 or bicarbonate below 18.",
    steps: [
      S("d1", "0.9% saline 1 L over the first hour (15–20 mL/kg); then 250–500 mL/h guided by volume status", { by: 60, critical: true }),
      S("d2", "Potassium before insulin: K below 3.5, hold insulin and give 10–20 mmol/h on a cardiac monitor; 3.5–5.0, add 20–30 mmol per litre of fluid; above 5.0, none and recheck 2-hourly", { by: 60, critical: true }),
      S("d3", "Fixed-rate IV insulin 0.1 unit/kg/h once K is 3.5 or more (no bolus needed in adults)", { by: 60, critical: true }),
      S("d4", "Hourly glucose; 2-hourly K, bicarbonate, anion gap, venous pH", { by: 60 }),
      S("d5", "When glucose falls below 250 mg/dL, change fluid to 5% dextrose with 0.45% saline; keep insulin going until the gap closes", { by: 240, critical: true }),
      S("d6", "Find and treat the precipitant: infection, missed insulin, MI, pancreatitis", { by: 120 }),
      S("d7", "Bicarbonate only if pH below 6.9 (100 mmol over 2 hours)", { by: 60 }),
      S("d8", "Resolution: glucose below 200 and two of bicarbonate 18 or more, venous pH above 7.3, anion gap 12 or less (or ketones below 0.6); give SC basal insulin 1–2 hours before stopping the infusion", { by: 1440 }),
      S("d9", "Children: slower fluids (deficit over 48 h), insulin 0.05–0.1 unit/kg/h started at least 1 hour after fluids, watch for cerebral oedema (headache, bradycardia, falling consciousness)", { by: 0 }),
    ],
    handover: ["Fluid and insulin started (times)", "Latest K, pH, gap", "Precipitant", "When dextrose was added", "Cerebral oedema signs checked (children)"],
    source: "ADA 2024 hyperglycaemic crises; ISPAD 2022 (children)",
  },
  {
    id: "anaphylaxis", name: "Anaphylaxis", tagline: "Adrenaline first, IM, thigh", trigger: "Sudden airway, breathing or circulation problem with skin or mucosal changes after a likely trigger.",
    steps: [
      S("a1", "Adrenaline 0.5 mg IM (1:1000, 0.5 mL) into the anterolateral thigh; repeat every 5 minutes if no improvement", { by: 0, critical: true, detail: "Children: 6–12 years 0.3 mg; 6 months to 6 years 0.15 mg; under 6 months 0.1–0.15 mg (10 microgram/kg)." }),
      S("a2", "Remove the trigger (stop the drug or infusion); call for help; lie flat with legs raised (sit up if breathless)", { by: 0, critical: true }),
      S("a3", "High-flow oxygen; airway: prepare for intubation early if stridor or swelling", { by: 2 }),
      S("a4", "IV crystalloid 500–1000 mL bolus (children 10 mL/kg) for hypotension", { by: 5 }),
      S("a5", "Refractory after 2 IM doses: adrenaline infusion 0.05–0.1 microgram/kg/min, in a monitored area", { by: 10, critical: true }),
      S("a6", "Salbutamol nebulised for bronchospasm. Chlorpheniramine 10 mg IV/IM only for persistent skin symptoms once stable; steroids are not routine (consider for refractory reactions or asthma)", { by: 10 }),
      S("a7", "Observe at least 6 hours (12–24 if severe or needed more than one dose); biphasic reactions happen", { by: 360 }),
      S("a8", "Before discharge: adrenaline auto-injector or pre-drawn syringe teaching, written plan, allergy referral, document the trigger", { by: 1440 }),
    ],
    handover: ["Trigger and time", "Adrenaline doses and times", "Response and observations", "Observation period planned", "Discharge plan and allergy referral"],
    source: "Resuscitation Council UK 2021; WAO 2020",
  },
  {
    id: "status", name: "Status epilepticus", tagline: "Benzodiazepine at 5 minutes", trigger: "Convulsive seizure lasting 5 minutes or more, or recurrent seizures without recovery between them.",
    steps: [
      S("e1", "ABC, lateral position, oxygen, glucose (give 25 g dextrose IV if low; thiamine 100 mg first if alcohol or malnourished)", { by: 0, critical: true }),
      S("e2", "First line at 5 minutes: lorazepam 0.1 mg/kg IV (max 4 mg), or midazolam 10 mg IM/buccal (5 mg if 13–40 kg), or diazepam 0.15–0.2 mg/kg IV/PR; repeat once at 5 minutes", { by: 5, critical: true }),
      S("e3", "Second line at 20 minutes: levetiracetam 60 mg/kg IV (max 4.5 g) over 10 minutes, or valproate 40 mg/kg (max 3 g), or fosphenytoin 20 mg PE/kg (phenytoin 20 mg/kg at 50 mg/min with ECG monitoring)", { by: 20, critical: true }),
      S("e4", "Still seizing at 40 minutes: refractory, call anaesthesia and ICU; midazolam, propofol or thiopentone infusion with intubation and EEG", { by: 40, critical: true }),
      S("e5", "Look for a cause: electrolytes, calcium, magnesium, drug levels, toxins, infection (CT and LP if new), pregnancy (eclampsia: magnesium)", { by: 30 }),
      S("e6", "Treat hyperthermia, monitor for rhabdomyolysis and aspiration", { by: 60 }),
    ],
    handover: ["Seizure onset time and total duration", "Drugs with doses and times", "Airway status", "Cause found or pending", "Maintenance antiepileptic plan"],
    source: "AES 2016 guideline; NICE NG217",
  },
  {
    id: "acls", name: "Cardiac arrest (adult)", tagline: "High-quality CPR, shock the shockables", trigger: "Unresponsive, not breathing normally, no pulse within 10 seconds.",
    steps: [
      S("c1", "Start CPR 30:2, 100–120/min, 5–6 cm deep, full recoil, minimal pauses; attach the defibrillator", { by: 0, critical: true }),
      S("c2", "Shockable (VF/pulseless VT): shock 200 J biphasic, then 2 minutes CPR, then rhythm check; repeat", { by: 2, critical: true }),
      S("c3", "Adrenaline 1 mg IV/IO every 3–5 minutes (after the 2nd shock if shockable; at once if non-shockable)", { by: 4, critical: true }),
      S("c4", "Amiodarone 300 mg IV after the 3rd shock, 150 mg after the 5th (or lidocaine 1–1.5 mg/kg)", { by: 8 }),
      S("c5", "Airway: bag-mask with oxygen; advanced airway without pausing compressions; waveform capnography (EtCO₂ above 10 mmHg)", { by: 4 }),
      S("c6", "Reversible causes: hypoxia, hypovolaemia, hypo/hyperkalaemia, hypothermia, thrombosis (coronary, pulmonary), tension pneumothorax, tamponade, toxins", { by: 6 }),
      S("c7", "Non-shockable (PEA/asystole): CPR and adrenaline every 3–5 minutes; rhythm check every 2 minutes", { by: 2 }),
      S("c8", "ROSC: 12-lead ECG, SpO₂ 92–98%, SBP above 90, treat the cause, targeted temperature management, ICU", { by: 30 }),
      S("c9", "Consider stopping after 20 minutes of asystole with no reversible cause, after team discussion", { by: 20 }),
    ],
    handover: ["Time of arrest and CPR start", "Rhythms and number of shocks", "Drugs with times", "Airway and EtCO₂", "ROSC time and post-arrest plan"],
    source: "AHA 2020 ACLS; ERC 2021",
  },
  {
    id: "pals", name: "Cardiac arrest (child)", tagline: "Airway and breathing first", trigger: "Unresponsive child not breathing normally; pulse absent or below 60 with poor perfusion.",
    steps: [
      S("p1", "5 rescue breaths, then CPR 15:2 (two rescuers), 100–120/min, one-third chest depth", { by: 0, critical: true }),
      S("p2", "Shockable rhythm: 4 J/kg, then 2 minutes CPR; repeat", { by: 2, critical: true }),
      S("p3", "Adrenaline 10 microgram/kg IV/IO (0.1 mL/kg of 1:10,000) every 3–5 minutes", { by: 4, critical: true }),
      S("p4", "Amiodarone 5 mg/kg after the 3rd and 5th shocks", { by: 8 }),
      S("p5", "Fluid bolus 10–20 mL/kg crystalloid if hypovolaemia is possible; glucose check and correct", { by: 6 }),
      S("p6", "Reversible causes (4 Hs and 4 Ts); in infants think of hypoglycaemia, sepsis, congenital heart disease", { by: 6 }),
      S("p7", "Bradycardia with poor perfusion despite oxygen and ventilation: start CPR if HR below 60; atropine 20 microgram/kg only for vagal or AV block", { by: 2 }),
    ],
    handover: ["Weight used for doses", "Times of CPR start, shocks and adrenaline", "Airway", "Cause considered", "ROSC and transfer plan"],
    source: "AHA 2020 PALS; ERC 2021",
  },
  {
    id: "stroke", name: "Acute stroke", tagline: "Time is brain", trigger: "Sudden focal deficit (FAST positive); note the exact last-known-well time.",
    steps: [
      S("t1", "Last known well time; glucose at once (treat if below 60 mg/dL); NIHSS", { by: 0, critical: true }),
      S("t2", "Non-contrast CT (and CT angiography) within 20 minutes of arrival", { by: 20, critical: true }),
      S("t3", "No haemorrhage and within 4.5 hours: alteplase 0.9 mg/kg (max 90 mg), 10% bolus then the rest over 60 minutes, or tenecteplase 0.25 mg/kg (max 25 mg) bolus, after contraindication checklist", { by: 60, critical: true }),
      S("t4", "Large vessel occlusion within 24 hours: refer for mechanical thrombectomy", { by: 60, critical: true }),
      S("t5", "BP: below 185/110 before lysis, below 180/105 for 24 hours after; otherwise treat only above 220/120", { by: 30 }),
      S("t6", "Aspirin 300 mg within 24–48 hours (after 24 hours if lysed); swallow screen before any oral intake", { by: 1440 }),
      S("t7", "Stroke unit, temperature and glucose control, DVT prophylaxis, early rehabilitation", { by: 1440 }),
    ],
    handover: ["Last known well and arrival times", "CT time and result", "Lytic given (time, dose) or reason not", "NIHSS before and after", "BP targets in place"],
    source: "AHA/ASA 2019 (2021 update); ESO 2021",
  },
  {
    id: "hyperk", name: "Hyperkalaemia", tagline: "Protect the heart, shift, remove", trigger: "K above 6.0 mmol/L, or 5.5 or more with ECG changes (peaked T, wide QRS, loss of P).",
    steps: [
      S("k1", "12-lead ECG and continuous monitoring; repeat K on a venous gas to exclude haemolysis", { by: 0, critical: true }),
      S("k2", "ECG changes or K 6.5 or more: calcium gluconate 10% 30 mL IV over 10 minutes (or calcium chloride 10 mL); repeat if ECG unchanged after 5 minutes", { by: 5, critical: true }),
      S("k3", "Shift: 10 units soluble insulin with 25 g dextrose IV over 15 minutes; if glucose was below 126 mg/dL (7 mmol/L) beforehand, follow with 10% dextrose at 50 mL/h for 5 hours; glucose hourly for 6 hours then up to 12 hours", { by: 15, critical: true }),
      S("k4", "Salbutamol 10–20 mg nebulised", { by: 15 }),
      S("k5", "Remove: stop the cause (ACE inhibitor, spironolactone, NSAID, K supplements); patiromer or sodium zirconium if available; loop diuretic if volume replete", { by: 30 }),
      S("k6", "Dialysis for K that does not fall, oliguric AKI, or ESRD", { by: 120, critical: true }),
      S("k7", "Repeat K at 1, 2, 4 and 6 hours; watch for rebound", { by: 60 }),
    ],
    handover: ["Peak K and ECG findings", "Calcium, insulin-dextrose and salbutamol times", "Cause and drugs stopped", "Renal function", "Dialysis decision"],
    source: "UK Kidney Association 2023",
  },
  {
    id: "snake", name: "Snakebite", tagline: "ASV for envenomation, not for every bite", trigger: "Bite with signs of envenomation: non-clotting blood (20WBCT), bleeding, ptosis, weakness, swelling spreading, dark urine.",
    steps: [
      S("v1", "Immobilise the limb, no tourniquet, no incision; reassure; remove rings", { by: 0 }),
      S("v2", "20-minute whole blood clotting test on arrival and every 6 hours", { by: 0, critical: true }),
      S("v3", "Envenomation: polyvalent anti-snake venom 10 vials in 500 mL saline over 1 hour (same dose for children); no test dose", { by: 30, critical: true, detail: "Repeat 10 vials if the 20WBCT is still non-clotting at 6 hours, or neurological signs progress after 1–2 hours." }),
      S("v4", "Adrenaline drawn up (0.5 mg IM) for ASV reactions; stop ASV, give adrenaline, antihistamine, hydrocortisone, then restart slowly", { by: 30, critical: true }),
      S("v5", "Neurotoxic (ptosis, bulbar, breathing): neostigmine 0.5 mg IV with atropine 0.6 mg every 30 minutes; prepare to intubate", { by: 30, critical: true }),
      S("v6", "Analgesia (paracetamol, not NSAIDs), tetanus toxoid, antibiotics only if local infection", { by: 60 }),
      S("v7", "Monitor urine output and colour, renal function, for compartment syndrome; do not fasciotomy without correcting coagulopathy", { by: 120 }),
    ],
    handover: ["Time of bite and species if known", "20WBCT results", "ASV vials and times", "Reactions and their treatment", "Neurological and renal status"],
    source: "India National Snakebite Management Protocol 2017; WHO SEARO 2016",
  },
  {
    id: "op", name: "Organophosphate poisoning", tagline: "Atropinise, then oximes", trigger: "Cholinergic toxidrome: miosis, salivation, bronchorrhoea, bradycardia, fasciculations, after exposure.",
    steps: [
      S("o1", "Protect yourself (gloves, ventilation); remove clothes, wash the skin; secure the airway and suction secretions", { by: 0, critical: true }),
      S("o2", "Atropine 1.2–3 mg IV; double the dose every 5 minutes until the chest is clear, HR above 80 and SBP above 80", { by: 5, critical: true }),
      S("o3", "Then atropine infusion at 10–20% of the total loading dose per hour; watch for toxicity (delirium, hyperthermia, ileus)", { by: 30, critical: true }),
      S("o4", "Pralidoxime 30 mg/kg IV over 20 minutes then 8 mg/kg/h (WHO regimen), if within 24 hours", { by: 30 }),
      S("o5", "Gastric lavage only if within 1 hour and airway protected; no charcoal benefit shown", { by: 60 }),
      S("o6", "Diazepam for seizures or agitation; ICU for ventilation (intermediate syndrome at 24–96 hours)", { by: 60 }),
    ],
    handover: ["Compound and time of exposure", "Total atropine and current infusion rate", "Pralidoxime started (time)", "Respiratory status", "Psychiatry referral if self-harm"],
    source: "Eddleston et al.; WHO",
  },
];

/* ------------------------------------------------------------------ crash-cart card */

export interface CrashDrug {
  name: string;
  indication: string;
  /** Adult dose text. */
  adult: string;
  /** Dose per kg for children, with a unit and a maximum, or null if adult only. */
  child: { perKg: number; unit: string; max?: number; min?: number; note?: string } | null;
}

export const CRASH_DRUGS: CrashDrug[] = [
  { name: "Adrenaline (arrest)", indication: "Cardiac arrest", adult: "1 mg IV/IO every 3–5 min", child: { perKg: 0.01, unit: "mg", max: 1, note: "0.1 mL/kg of 1:10,000" } },
  { name: "Adrenaline (anaphylaxis)", indication: "Anaphylaxis, IM thigh", adult: "0.5 mg IM, repeat 5-minutely", child: { perKg: 0, unit: "mg", note: "by age: under 6 months 0.1–0.15 mg; 6 months to 6 years 0.15 mg; 6–12 years 0.3 mg; over 12 years 0.5 mg (1:1000 IM)" } },
  { name: "Amiodarone", indication: "Refractory VF/VT", adult: "300 mg IV, then 150 mg", child: { perKg: 5, unit: "mg", max: 300 } },
  { name: "Atropine", indication: "Symptomatic bradycardia", adult: "0.5–1 mg IV, max 3 mg", child: { perKg: 0.02, unit: "mg", max: 0.5, min: 0.1, note: "minimum 0.1 mg" } },
  { name: "Adenosine", indication: "SVT", adult: "6 mg, then 12 mg rapid IV", child: { perKg: 0.1, unit: "mg", max: 6, note: "second dose 0.2 mg/kg (max 12)" } },
  { name: "Calcium gluconate 10%", indication: "Hyperkalaemia, hypocalcaemia", adult: "30 mL IV over 10 min", child: { perKg: 0.5, unit: "mL", max: 20 } },
  { name: "Dextrose", indication: "Hypoglycaemia", adult: "25 g (50 mL of 50%, or 125 mL of 20%)", child: { perKg: 2, unit: "mL of 10%", note: "0.2 g/kg" } },
  { name: "Lorazepam", indication: "Seizure", adult: "4 mg IV", child: { perKg: 0.1, unit: "mg", max: 4 } },
  { name: "Midazolam", indication: "Seizure (IM/buccal), sedation", adult: "10 mg IM/buccal", child: { perKg: 0.2, unit: "mg", max: 10, note: "0.3 mg/kg buccal" } },
  { name: "Naloxone", indication: "Opioid overdose", adult: "0.4 mg IV/IM, repeat to 2 mg", child: { perKg: 0.01, unit: "mg", max: 0.4, note: "then 0.1 mg/kg if no response" } },
  { name: "Hydrocortisone", indication: "Adrenal crisis, severe asthma, after adrenaline in anaphylaxis", adult: "100–200 mg IV", child: { perKg: 4, unit: "mg", max: 100 } },
  { name: "Salbutamol nebulised", indication: "Acute asthma, hyperkalaemia", adult: "5 mg (10–20 mg for hyperkalaemia)", child: { perKg: 0.15, unit: "mg", max: 5, min: 2.5, note: "minimum 2.5 mg" } },
  { name: "Magnesium sulfate", indication: "Severe asthma, torsades, eclampsia", adult: "2 g IV over 20 min (4 g eclampsia)", child: { perKg: 40, unit: "mg", max: 2000 } },
  { name: "Ketamine (induction)", indication: "RSI induction", adult: "1–2 mg/kg IV", child: { perKg: 1.5, unit: "mg" } },
  { name: "Rocuronium", indication: "RSI paralysis", adult: "1.2 mg/kg IV", child: { perKg: 1.2, unit: "mg" } },
  { name: "Crystalloid bolus", indication: "Shock", adult: "500–1000 mL", child: { perKg: 10, unit: "mL", note: "20 mL/kg if no cardiac concern; reassess after each" } },
  { name: "Defibrillation", indication: "VF / pulseless VT", adult: "200 J biphasic", child: { perKg: 4, unit: "J", max: 200 } },
  { name: "Synchronised cardioversion", indication: "Unstable tachyarrhythmia", adult: "100–200 J", child: { perKg: 1, unit: "J", note: "then 2 J/kg" } },
  { name: "Endotracheal tube", indication: "Intubation size", adult: "7.0–7.5 (women), 8.0 (men)", child: { perKg: 0, unit: "", note: "1–12 years: uncuffed age/4 + 4, cuffed age/4 + 3.5; term infant 3.5, preterm 3.0" } },
];

/** A dose for a weight: rounded sensibly, capped at the maximum. */
export function childDose(d: CrashDrug, kg: number): string {
  if (!d.child) return "Adult only";
  if (!d.child.perKg) return d.child.note ?? "";
  let v = d.child.perKg * kg;
  if (d.child.max !== undefined) v = Math.min(v, d.child.max);
  if (d.child.min !== undefined) v = Math.max(v, d.child.min);
  const rounded = v >= 10 ? Math.round(v) : v >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
  return `${rounded} ${d.child.unit}${d.child.note ? ` (${d.child.note})` : ""}`;
}

/** An estimated weight from age, for when there is no time to weigh (APLS). */
export function estimatedWeight(ageYears: number): number {
  if (ageYears < 1) return Math.round((ageYears * 12 * 0.5 + 4) * 10) / 10;
  if (ageYears <= 5) return 2 * ageYears + 8;
  if (ageYears <= 12) return 3 * ageYears + 7;
  return 50;
}

/* ------------------------------------------------------------------ a running protocol (kept on the device) */

export interface ProtocolRun {
  protocolId: string;
  startedAt: number;
  done: Record<string, number>;
  notes: string;
}

export const RUN_KEY = "cadus3.emergency.run";

export function readRun(): ProtocolRun | null {
  try {
    const r = JSON.parse(localStorage.getItem(RUN_KEY) || "null");
    return r && typeof r.protocolId === "string" && PROTOCOLS.some((p) => p.id === r.protocolId) && Number.isFinite(r.startedAt) ? { protocolId: r.protocolId, startedAt: r.startedAt, done: r.done && typeof r.done === "object" ? r.done : {}, notes: typeof r.notes === "string" ? r.notes : "" } : null;
  } catch { return null; }
}
export function saveRun(r: ProtocolRun | null) {
  try { if (r) localStorage.setItem(RUN_KEY, JSON.stringify(r)); else localStorage.removeItem(RUN_KEY); } catch { /* blocked */ }
}

/** The run as a handover text. */
export function runSummary(r: ProtocolRun, now = Date.now()): string {
  const p = PROTOCOLS.find((x) => x.id === r.protocolId)!;
  const mm = (t: number) => `${Math.floor((t - r.startedAt) / 60000)} min`;
  const lines = [`${p.name} started ${new Date(r.startedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} (${mm(now)} ago)`, ""];
  for (const s of p.steps) lines.push(`${r.done[s.id] ? `[x] ${mm(r.done[s.id])}` : "[ ]"} ${s.text}`);
  if (r.notes.trim()) lines.push("", `Notes: ${r.notes.trim()}`);
  lines.push("", "Handover: " + p.handover.join("; "));
  return lines.join("\n");
}
