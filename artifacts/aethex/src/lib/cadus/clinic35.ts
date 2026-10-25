/**
 * Update 35, on the device (no AI): chest pain and ACS, children's fluids and dehydration,
 * agitation and rapid tranquillisation, suicide risk and safety planning, head injury CT rules,
 * the acute abdomen, febrile neutropenia, and meningitis and encephalitis.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ================================================================== chest pain & ACS */

export interface HeartInput { history: 0 | 1 | 2; ecg: 0 | 1 | 2; age: number; riskFactors: number; knownAthero: boolean; troponin: 0 | 1 | 2 }
export function heartScore(x: HeartInput): { score: number; band: "low" | "moderate" | "high"; mace: string; plan: string } {
  const age = x.age >= 65 ? 2 : x.age >= 45 ? 1 : 0;
  const risk = x.knownAthero || x.riskFactors >= 3 ? 2 : x.riskFactors >= 1 ? 1 : 0;
  const score = x.history + x.ecg + age + risk + x.troponin;
  if (score <= 3) return { score, band: "low", mace: "about 1–2% risk of a major cardiac event in 6 weeks", plan: "Low risk: if serial troponins (0 and 1–3 hours) are normal, discharge with outpatient follow-up and safety-netting." };
  if (score <= 6) return { score, band: "moderate", mace: "about 12–17% risk of a major cardiac event in 6 weeks", plan: "Moderate risk: admit or observe, serial troponins and ECGs, cardiology review and non-invasive testing or angiography." };
  return { score, band: "high", mace: "about 50–65% risk of a major cardiac event in 6 weeks", plan: "High risk: treat as NSTE-ACS now (loading antiplatelets, anticoagulation) and arrange early invasive strategy (angiography within 24 hours)." };
}
/** Tenecteplase by weight (single IV bolus); half dose from 75 years (STREAM-2, ESC). */
export function tnkDose(kg: number, age: number): { mg: number; text: string } {
  const full = kg < 60 ? 30 : kg < 70 ? 35 : kg < 80 ? 40 : kg < 90 ? 45 : 50;
  const mg = age >= 75 ? full / 2 : full;
  return { mg, text: `Tenecteplase ${mg} mg as a single IV bolus over 5–10 seconds${age >= 75 ? ` (half the ${full} mg weight dose because aged 75 or over)` : ""}` };
}
export function enoxAcs(kg: number, age: number, crcl: number | null, lysis: boolean): string {
  const k = kg > 0 ? kg : 70;
  if (crcl !== null && crcl < 30) return `Enoxaparin ${Math.round(k)} mg (1 mg/kg) SC once daily because CrCl is under 30 ml/min${lysis && age < 75 ? ", after a 30 mg IV bolus" : ""}; consider unfractionated heparin instead.`;
  if (lysis && age >= 75) return `Enoxaparin ${Math.min(75, Math.round(0.75 * k))} mg (0.75 mg/kg, no IV bolus) SC every 12 hours; first two doses at most 75 mg.`;
  if (lysis) return `Enoxaparin 30 mg IV bolus, then ${Math.min(100, Math.round(k))} mg (1 mg/kg) SC 15 minutes later and every 12 hours; first two doses at most 100 mg.`;
  return `Enoxaparin ${Math.round(k)} mg (1 mg/kg) SC every 12 hours (or fondaparinux 2.5 mg SC daily for NSTE-ACS managed medically).`;
}
export function acsLoading(age: number, lysis: boolean, pci: boolean): string[] {
  return [
    "Aspirin 300 mg chewed (if not already given), then 75–150 mg daily.",
    lysis ? (age >= 75 ? "Clopidogrel 75 mg (no loading dose at 75 or over with fibrinolysis), then 75 mg daily." : "Clopidogrel 300 mg loading with fibrinolysis, then 75 mg daily.")
      : pci ? "Ticagrelor 180 mg loading then 90 mg twice daily (or prasugrel 60 mg at PCI if under 75, over 60 kg and no previous stroke; or clopidogrel 600 mg if those are unavailable or bleeding risk is high)."
        : "Ticagrelor 180 mg then 90 mg twice daily, or clopidogrel 300–600 mg then 75 mg daily.",
    "Atorvastatin 80 mg (high intensity) whatever the cholesterol.",
    "Oxygen only if SpO2 is below 90%; GTN sublingual for pain unless hypotensive, right ventricular infarct or recent PDE-5 inhibitor; IV morphine sparingly.",
    "Beta-blocker within 24 hours if no heart failure, shock or bradycardia; ACE inhibitor if LVEF 40% or less, diabetes or hypertension.",
  ];
}
export const STEMI_ECG = [
  "New ST elevation at the J point in 2 contiguous leads: 1 mm or more in all leads except V2–V3.",
  "In V2–V3: 2 mm or more in men 40 and over, 2.5 mm in men under 40, 1.5 mm in women.",
  "Treat as STEMI too: new LBBB or paced rhythm with ongoing ischaemic symptoms (Sgarbossa criteria), posterior MI (ST depression V1–V3 with tall R; record V7–V9), and ST elevation in aVR with widespread ST depression (left main or multivessel).",
  "Record right-sided leads (V4R) in inferior STEMI: right ventricular infarct needs fluids and no nitrates.",
];
export const LYSIS_CI = [
  "Any previous intracranial haemorrhage",
  "Ischaemic stroke in the last 3 months",
  "Known cerebral vascular lesion or intracranial tumour",
  "Active bleeding or bleeding disorder (not menses)",
  "Suspected aortic dissection",
  "Significant head or facial trauma in the last 3 months",
  "Brain or spinal surgery in the last 2 months",
  "Severe uncontrolled hypertension (over 180/110) not responding to treatment",
];
export function stemiPath(minutesToPci: number | null, ciCount: number): { action: string; steps: string[] } {
  if (minutesToPci !== null && minutesToPci <= 120) return { action: "Primary PCI", steps: ["Transfer for primary PCI: aim for wire crossing within 120 minutes of diagnosis (90 minutes if presenting to a PCI centre).", "Give aspirin and the P2Y12 loading dose on the way; heparin at the cath lab."] };
  if (ciCount > 0) return { action: "Transfer for PCI (fibrinolysis contraindicated)", steps: ["Fibrinolysis is contraindicated: transfer for primary PCI however long it takes.", "Aspirin and clopidogrel loading; heparin."] };
  return { action: "Fibrinolysis now", steps: ["PCI cannot be done within 120 minutes: give fibrinolysis within 10 minutes of diagnosis (door-to-needle 30 minutes).", "Tenecteplase by weight (or streptokinase 1.5 million units in 100 ml over 60 minutes if that is what is available; do not repeat streptokinase).", "Then transfer to a PCI centre: angiography within 2–24 hours; rescue PCI at once if less than 50% ST resolution at 60–90 minutes, or ongoing pain or instability."] };
}

/* ================================================================== children's fluids */

/** Holliday–Segar maintenance: 100/50/20 ml per kg per day (4/2/1 ml/kg/hour). */
export function maintenance(kg: number): { perDay: number; perHour: number } {
  if (!(kg > 0)) return { perDay: 0, perHour: 0 };
  const perDay = Math.round(Math.min(kg, 10) * 100 + Math.max(0, Math.min(kg, 20) - 10) * 50 + Math.max(0, kg - 20) * 20);
  return { perDay, perHour: Math.round(perDay / 24) };
}
export const DEHYD_SEVERE = ["Lethargic or unconscious", "Sunken eyes", "Not able to drink or drinking poorly", "Skin pinch goes back very slowly (over 2 seconds)"];
export const DEHYD_SOME = ["Restless or irritable", "Sunken eyes", "Drinks eagerly, thirsty", "Skin pinch goes back slowly"];
/** WHO classification: two or more signs in a row. */
export function whoDehydration(severe: number, some: number): "severe" | "some" | "none" {
  if (severe >= 2) return "severe";
  if (some >= 2 || severe + some >= 2) return "some";
  return "none";
}
export function planA(ageYears: number): string[] {
  return [
    `After each loose stool give ORS: ${ageYears < 2 ? "50–100 ml" : ageYears < 10 ? "100–200 ml" : "as much as wanted"}.`,
    `Zinc for 14 days: ${ageYears < 0.5 ? "10 mg" : "20 mg"} once a day.`,
    "Continue breastfeeding and normal food; give extra fluids.",
    "Come back at once if: drinking poorly, blood in stool, getting sicker or fever.",
  ];
}
export function planB(kg: number): { ml: number; text: string } {
  const ml = Math.round(75 * kg);
  return { ml, text: `ORS ${ml} ml (75 ml/kg) over 4 hours, in small frequent sips by cup or spoon; reassess after 4 hours and reclassify.` };
}
export function planC(kg: number, ageYears: number): { first: string; second: string; total: number } {
  const infant = ageYears < 1;
  return {
    first: `Ringer's lactate (or normal saline) ${Math.round(30 * kg)} ml (30 ml/kg) over ${infant ? "1 hour" : "30 minutes"}`,
    second: `then ${Math.round(70 * kg)} ml (70 ml/kg) over ${infant ? "5 hours" : "2½ hours"}`,
    total: Math.round(100 * kg),
  };
}
export function deficit(kg: number, pct: number, hyperNa: boolean): { ml: number; hours: number; perHour: number } {
  const ml = Math.round(kg * pct * 10);
  const hours = hyperNa ? 48 : 24;
  return { ml, hours, perHour: Math.round(ml / hours) };
}
export function bolus(kg: number): string {
  return `Shock: ${Math.round(10 * kg)} ml (10 ml/kg) of 0.9% saline or balanced crystalloid over less than 10 minutes, then reassess; repeat up to 40–60 ml/kg, and call for critical care after 40 ml/kg. Use 10 ml/kg boluses (not 20) in heart disease, severe malnutrition and newborns.`;
}

/* ================================================================== agitation & rapid tranquillisation */

export const BARS = [
  "1. Difficult or unable to rouse",
  "2. Asleep, responds normally to voice or touch",
  "3. Drowsy, appears sedated",
  "4. Quiet and awake (normal activity)",
  "5. Signs of overt activity, calms with instructions",
  "6. Extremely or continuously active, not needing restraint",
  "7. Violent, needs restraint",
];
export interface RtInput { bars: number; elderly: boolean; naive: boolean; cardiac: boolean; parkinson: boolean; alcohol: boolean; onBenzo: boolean }
export function rtPlan(x: RtInput): { level: "calm" | "oral" | "im"; steps: string[] } {
  const half = x.elderly;
  const avoidAp = x.cardiac || x.parkinson;
  if (x.bars <= 4) return { level: "calm", steps: ["No sedation needed. Check the cause (pain, hypoxia, low glucose, retention, withdrawal) and keep talking.", ...(x.bars <= 2 ? ["Over-sedated: airway, oxygen, monitor; flumazenil only for benzodiazepine over-sedation with respiratory depression."] : [])] };
  if (x.bars === 5) return {
    level: "oral",
    steps: [
      "De-escalate first: calm voice, space, one person talking, offer food or drink, reduce noise; find out what they want.",
      x.alcohol ? `Alcohol withdrawal likely: oral lorazepam ${half ? "0.5–1 mg" : "1–2 mg"} or diazepam 10–20 mg, and thiamine.` : avoidAp || x.naive ? `Oral lorazepam ${half ? "0.5–1 mg" : "1–2 mg"} or promethazine ${half ? "12.5–25 mg" : "25–50 mg"}.` : `Oral olanzapine ${half ? "2.5–5 mg" : "10 mg"} or risperidone ${half ? "0.5 mg" : "1–2 mg"}, or lorazepam ${half ? "0.5–1 mg" : "1–2 mg"}.`,
      "Offer it, don't force it; repeat after 45–60 minutes if needed.",
    ],
  };
  return {
    level: "im",
    steps: [
      "Safety first: enough trained staff, restraint only as a last resort and for the shortest time; document the reasons.",
      x.onBenzo || x.alcohol || avoidAp || x.naive
        ? `IM lorazepam ${half ? "0.5–1 mg" : "1–2 mg"} (or IM midazolam ${half ? "2.5 mg" : "5–7.5 mg"} in the emergency department).`
        : `IM haloperidol ${half ? "1–2.5 mg" : "5 mg"} with IM promethazine ${half ? "25 mg" : "50 mg"} (ECG first if possible; haloperidol max 20 mg in 24 hours), or IM lorazepam ${half ? "0.5–1 mg" : "1–2 mg"}.`,
      ...(avoidAp ? [x.parkinson ? "Parkinson's or Lewy body dementia: avoid haloperidol (severe rigidity and falls)." : "Heart disease, long QT or no ECG: avoid haloperidol."] : []),
      "Do not give IM olanzapine within 1 hour of IM lorazepam (respiratory depression).",
      "Repeat once after 30–60 minutes if not settled; then senior review. Ketamine 4 mg/kg IM only where airway skills and monitoring are present.",
      "Acute dystonia after an antipsychotic: procyclidine 5–10 mg IM (or promethazine).",
    ],
  };
}
export const RT_MONITOR = [
  "After any parenteral sedation: pulse, BP, respiratory rate, temperature, SpO2 and level of consciousness every 15 minutes for the first hour, then hourly until walking again.",
  "If asleep or unable to monitor BP: at least respiratory rate and SpO2.",
  "Have flumazenil, oxygen, suction and a bag-valve mask ready.",
  "Look for the cause: hypoglycaemia, hypoxia, sepsis, head injury, delirium, alcohol or drug intoxication or withdrawal, pain, urinary retention.",
  "Debrief the patient and staff afterwards; record why it was needed and what was given.",
];

/* ================================================================== suicide risk & safety plan */

export const CSSRS = [
  "In the past month, have you wished you were dead or wished you could go to sleep and not wake up?",
  "In the past month, have you had any actual thoughts of killing yourself?",
  "Have you been thinking about how you might do this?",
  "Have you had these thoughts and had some intention of acting on them?",
  "Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?",
  "Have you ever done anything, started to do anything, or prepared to do anything to end your life? (in the past 3 months)",
];
/** Columbia screener triage. Not a prediction tool: it decides how urgently to act. */
export function cssrs(yes: boolean[]): { level: "none" | "low" | "moderate" | "high"; actions: string[] } {
  const [q1, q2, q3, q4, q5, q6] = yes;
  if (q4 || q5 || q6) return { level: "high", actions: ["Do not leave the person alone; remove access to means (pesticides, medicines, ropes, weapons) now.", "Same-day emergency psychiatric assessment; admit if they cannot keep safe.", "Involve family or a trusted person (with consent where possible; safety comes first).", "Treat any medical cause or overdose; check for intoxication."] };
  if (q3) return { level: "moderate", actions: ["Mental health review today or within 24 hours.", "Make a safety plan together and reduce access to means.", "Agree a follow-up time and give crisis numbers."] };
  if (q1 || q2) return { level: "low", actions: ["Explore the thoughts, what keeps them going and what helps.", "Offer a safety plan and follow-up; treat depression, substance use or pain.", "Give crisis numbers and invite them to come back any time."] };
  return { level: "none", actions: ["No suicidal thoughts reported now. Ask again at future visits; it is safe to ask and does not put the idea in someone's head."] };
}
export const SUICIDE_FACTORS = [
  "Previous attempt or self-harm (the strongest factor)",
  "Depression, psychosis, bipolar disorder or personality disorder",
  "Alcohol or drug misuse",
  "Recent loss, debt, exam failure, relationship break-up or abuse",
  "Chronic pain or serious illness",
  "Access to pesticides, medicines or firearms",
  "Living alone, social isolation",
  "Family history of suicide",
];
export interface SafetyPlan { warning: string; coping: string; distraction: string; people: string; professionals: string; safe: string; reasons: string }
export const SAFETY_STEPS: { key: keyof SafetyPlan; label: string; hint: string }[] = [
  { key: "warning", label: "1. My warning signs", hint: "Thoughts, feelings or situations that tell me a crisis may be starting" },
  { key: "coping", label: "2. Things I can do on my own", hint: "Walk, music, prayer, breathing, a shower" },
  { key: "distraction", label: "3. People and places that take my mind off things", hint: "A friend's house, a temple, the park" },
  { key: "people", label: "4. People I can ask for help", hint: "Names and phone numbers" },
  { key: "professionals", label: "5. Professionals I can contact", hint: "My doctor or counsellor; Tele-MANAS 14416; emergency 112" },
  { key: "safe", label: "6. Making my surroundings safe", hint: "Who will keep my medicines, pesticides or other means away" },
  { key: "reasons", label: "My reasons for living", hint: "People, pets, plans, beliefs" },
];
export function safetyPlanMd(p: SafetyPlan): string {
  return [
    "# My safety plan",
    "",
    ...SAFETY_STEPS.flatMap((s) => [`## ${s.label}`, p[s.key].trim() || "_(to fill in)_", ""]),
    "## If I am in danger now",
    "- Call **112** (emergency) or **Tele-MANAS 14416** / 1-800-891-4416 (free, 24 hours, many languages).",
    "- Go to the nearest hospital emergency department.",
  ].join("\n");
}

/* ================================================================== head injury */

export const HI_1H = ["GCS under 13 on first assessment", "GCS under 15 two hours after the injury", "Suspected open or depressed skull fracture", "Signs of basal skull fracture (panda eyes, Battle's sign, CSF leak, haemotympanum)", "Post-traumatic seizure", "Focal neurological deficit", "More than one episode of vomiting"];
export const HI_8H = [ // index 0 counts alone
 "On anticoagulants", "Age 65 or over", "Bleeding or clotting disorder", "Dangerous mechanism (pedestrian or cyclist hit by a vehicle, ejected, fall from over 1 metre or 5 stairs)", "More than 30 minutes of amnesia before the injury"];
/** NICE NG232 adult CT head rule. */
export function adultCt(oneHour: number, eight: number[], locOrAmnesia: boolean): { ct: "1h" | "8h" | "none"; text: string } {
  if (oneHour > 0) return { ct: "1h", text: "CT head within 1 hour (and a radiology report within 1 hour of the scan)." };
  // Anticoagulants alone are enough; the others count with loss of consciousness or amnesia.
  if (eight.includes(0) || (locOrAmnesia && eight.length > 0)) return { ct: "8h", text: "CT head within 8 hours of the injury (at once if they present more than 8 hours after it)." };
  return { ct: "none", text: "CT not needed now. Discharge with a responsible adult and written head injury advice." };
}
export const PECARN_HIGH_U2 = ["GCS 14 or altered mental status", "Palpable skull fracture"];
export const PECARN_MID_U2 = ["Scalp haematoma (not frontal)", "Loss of consciousness 5 seconds or more", "Severe mechanism", "Not acting normally per the parents"];
export const PECARN_HIGH_2 = ["GCS 14 or altered mental status", "Signs of basal skull fracture"];
export const PECARN_MID_2 = ["Any loss of consciousness", "Vomiting", "Severe mechanism", "Severe headache"];
export function pecarn(under2: boolean, high: number, mid: number): { level: "ct" | "observe" | "none"; text: string } {
  if (high > 0) return { level: "ct", text: `CT recommended (about ${under2 ? "4.4%" : "4.3%"} risk of clinically important brain injury).` };
  if (mid > 0) return { level: "observe", text: "Observation or CT (about 0.9% risk): decide on clinician experience, several findings, worsening on observation, age under 3 months and parental preference." };
  return { level: "none", text: "CT not recommended (under 0.05% risk). Discharge with advice." };
}
export const HI_ADVICE = [
  "Come back at once with: drowsiness, worsening headache, repeated vomiting, confusion, seizure, weakness, blurred vision, clear fluid from the nose or ears, or unequal pupils.",
  "A responsible adult should stay for the first 24 hours.",
  "No alcohol, sedatives or contact sport; rest from screens and work as needed, then return gradually.",
  "Paracetamol for headache; avoid aspirin and NSAIDs in the first day.",
];

/* ================================================================== acute abdomen */

export const ALVARADO: { label: string; pts: number }[] = [
  { label: "Pain migrating to the right iliac fossa", pts: 1 },
  { label: "Anorexia", pts: 1 },
  { label: "Nausea or vomiting", pts: 1 },
  { label: "Tenderness in the right iliac fossa", pts: 2 },
  { label: "Rebound tenderness", pts: 1 },
  { label: "Temperature 37.3 °C or over", pts: 1 },
  { label: "White cells over 10,000", pts: 2 },
  { label: "Neutrophils over 75%", pts: 1 },
];
export function alvarado(ticked: number[]): { score: number; band: string } {
  const score = ticked.reduce((n, i) => n + (ALVARADO[i]?.pts ?? 0), 0);
  const band = score <= 4 ? "Appendicitis unlikely: consider other causes, safety-net" : score <= 6 ? "Possible: observe and image (ultrasound; CT in adults if unclear)" : score <= 8 ? "Probable: surgical review" : "Very probable: surgical review now";
  return { score, band };
}
export const PAS: { label: string; pts: number }[] = [
  { label: "Pain on coughing, hopping or percussion", pts: 2 },
  { label: "Tenderness in the right iliac fossa", pts: 2 },
  { label: "Anorexia", pts: 1 },
  { label: "Fever 38 °C or over", pts: 1 },
  { label: "Nausea or vomiting", pts: 1 },
  { label: "Pain migrating to the right iliac fossa", pts: 1 },
  { label: "White cells over 10,000", pts: 1 },
  { label: "Neutrophils over 7,500", pts: 1 },
];
export function pas(ticked: number[]): { score: number; band: string } {
  const score = ticked.reduce((n, i) => n + (PAS[i]?.pts ?? 0), 0);
  return { score, band: score <= 3 ? "Low risk: discharge with clear advice or observe" : score <= 6 ? "Intermediate: ultrasound and surgical review" : "High risk: paediatric surgical review" };
}
export const BISAP = ["Urea nitrogen over 25 mg/dL (urea over 53 mg/dL)", "Impaired mental status", "SIRS (2 or more criteria)", "Age over 60", "Pleural effusion"];
export function bisap(n: number): string {
  return n >= 3 ? `BISAP ${n}: high risk of severe pancreatitis (mortality over 5%): HDU or ICU, goal-directed fluids, early enteral feeding.` : `BISAP ${n}: lower risk (mortality under 2%); moderate fluids (Ringer's lactate 1.5 ml/kg/hour after any bolus), analgesia, early oral feeding.`;
}
export const ABDO_RED = [
  "Peritonitis: rigid abdomen, guarding, pain on movement",
  "Shock or unexplained hypotension: think ruptured AAA, ectopic pregnancy, perforation",
  "Woman of reproductive age: pregnancy test in everyone",
  "Pain out of proportion to the examination, with AF: mesenteric ischaemia (lactate, CT angiography)",
  "Vomiting, distension and no flatus: bowel obstruction (check hernial orifices)",
  "Boy or young man with lower abdominal pain: examine the testes (torsion)",
  "Over 50 with new abdominal or back pain: aortic aneurysm until shown otherwise",
  "Diabetes: DKA can cause abdominal pain; check glucose and ketones",
];

/* ================================================================== febrile neutropenia */

export function anc(wbc: number, neutPct: number, bandPct = 0): number {
  return Math.round(wbc * (neutPct + bandPct) / 100);
}
export interface MasccInput { burden: "none" | "moderate" | "severe"; sbp90: boolean; copd: boolean; solidOrNoFungal: boolean; dehydrated: boolean; outpatient: boolean; age: number }
export function mascc(x: MasccInput): { score: number; low: boolean } {
  const score = (x.burden === "none" ? 5 : x.burden === "moderate" ? 3 : 0) + (x.sbp90 ? 5 : 0) + (x.copd ? 0 : 4) + (x.solidOrNoFungal ? 4 : 0) + (x.dehydrated ? 0 : 3) + (x.outpatient ? 3 : 0) + (x.age < 60 ? 2 : 0);
  return { score, low: score >= 21 };
}
export function fnPlan(low: boolean, x: { shock: boolean; esbl: boolean; line: boolean; pneumonia: boolean; mrsa: boolean; penAllergy: boolean }): string[] {
  const out: string[] = ["Antibiotics within 1 hour of arrival: take blood cultures (peripheral and from every line) first, but do not wait for results."];
  if (low && !x.shock) out.push(`Low risk (MASCC 21 or more): oral ciprofloxacin 750 mg twice daily with ${x.penAllergy ? "clindamycin 300 mg four times daily" : "amoxicillin-clavulanate 625 mg three times daily"}, if they can swallow, live near the hospital and have a carer and phone; review within 24 hours.`);
  else if (x.shock || x.esbl) out.push("Meropenem 1 g IV every 8 hours (septic shock, known ESBL or carbapenem-sparing not safe locally); add amikacin 15 mg/kg once daily in shock.");
  else out.push(x.penAllergy ? "Penicillin allergy: aztreonam 2 g IV every 8 hours or meropenem (if not severe allergy), with vancomycin." : "Piperacillin-tazobactam 4.5 g IV every 6 hours (or cefepime 2 g IV every 8 hours).");
  if (x.line || x.pneumonia || x.mrsa || x.shock) out.push("Add vancomycin 15–20 mg/kg IV every 8–12 hours (line infection, skin infection, pneumonia, MRSA or instability); stop at 48–72 hours if cultures are negative.");
  out.push("Fever persisting 4–7 days on antibiotics: CT chest and start antifungal cover (e.g. voriconazole or liposomal amphotericin B) per haematology.");
  out.push("Use your hospital antibiogram: in many Indian centres ESBL and carbapenem-resistant organisms are common.");
  return out;
}

/* ================================================================== meningitis & encephalitis */

export const CT_BEFORE_LP = ["Immunocompromised (HIV, transplant, chemotherapy)", "Known CNS disease (mass, stroke, shunt)", "New seizure in the last week", "Papilloedema", "Reduced consciousness (GCS under 10 or falling)", "Focal neurological deficit"];
export interface Drug { name: string; dose: string }
/** IDSA empirical therapy by age, with doses for weight (children) or adult doses. */
export function meningitisEmpiric(ageYears: number, kg: number, encephalitis: boolean): { drugs: Drug[]; dexa: string } {
  const k = kg > 0 ? kg : 70;
  const adult = ageYears >= 12;
  const capd = (perKg: number, max: number) => `${Math.min(max, Math.round(perKg * k))} mg`;
  const drugs: Drug[] = [];
  if (ageYears < 1 / 12) {
    drugs.push({ name: "Ampicillin", dose: `${capd(50, 2000)} (50 mg/kg) IV every 6–8 hours` });
    drugs.push({ name: "Cefotaxime", dose: `${capd(50, 2000)} (50 mg/kg) IV every 6–8 hours (or gentamicin)` });
  } else {
    drugs.push({ name: "Ceftriaxone", dose: adult ? "2 g IV every 12 hours" : `${capd(50, 2000)} (50 mg/kg) IV every 12 hours (max 4 g a day)` });
    drugs.push({ name: "Vancomycin", dose: `${capd(15, 2000)} (15 mg/kg) IV every ${adult ? "8–12" : "6"} hours (where pneumococcal resistance is a concern; target trough 15–20 mg/L)` });
    if (ageYears >= 50) drugs.push({ name: "Ampicillin (for Listeria)", dose: "2 g IV every 4 hours" });
  }
  if (encephalitis) drugs.push({ name: "Acyclovir", dose: `${capd(ageYears < 1 / 12 ? 20 : 10, 1000)} (${ageYears < 1 / 12 ? 20 : 10} mg/kg) IV every 8 hours, adjusted to kidney function` });
  const dexa = ageYears < 1 / 12 ? "No dexamethasone in newborns." : adult ? "Dexamethasone 10 mg IV every 6 hours for 4 days, starting with or just before the first antibiotic dose (continue only if pneumococcal or bacterial meningitis is likely)." : `Dexamethasone ${r1(Math.min(10, 0.15 * k))} mg (0.15 mg/kg) IV every 6 hours for 2–4 days, with or before the first antibiotic dose (H. influenzae, pneumococcus).`;
  return { drugs, dexa };
}
export const MENINGO_PROPHYLAXIS = [
  "Close contacts of meningococcal disease (household, kissing contacts, healthcare workers exposed to airway secretions without a mask):",
  "Ciprofloxacin 500 mg once (adults; children 20 mg/kg, max 500 mg), or rifampicin 600 mg twice daily for 2 days (children 10 mg/kg, under 1 month 5 mg/kg), or ceftriaxone 250 mg IM once (under 15 years 125 mg; preferred in pregnancy).",
  "Notify the district surveillance officer (IDSP).",
];
export const MENINGITIS_FIRST = [
  "Suspect it with fever plus headache, neck stiffness, confusion, rash (non-blanching), seizures; infants may only be irritable, feeding poorly or have a bulging fontanelle.",
  "Give antibiotics within 1 hour; in the community, benzylpenicillin IM or ceftriaxone before transfer.",
  "Blood cultures, glucose, lactate; LP if safe (do not let it delay antibiotics).",
  "Treat shock and raised pressure; watch for seizures, hyponatraemia and hypoglycaemia.",
  "Japanese encephalitis, scrub typhus, cerebral malaria and TB meningitis are common in India: test for them by region and season.",
];
