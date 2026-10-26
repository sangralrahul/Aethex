/**
 * Update 42, on the device (no AI): vertigo (HINTS), acute pulmonary oedema, arrhythmias (ACLS),
 * scorpion sting, pericarditis and myocarditis, PCOS, postnatal depression (EPDS), red eye and acute
 * glaucoma, cholecystitis and cholangitis (Tokyo 2018), thyroid nodules (ACR TI-RADS), VTE risk in
 * pregnancy (RCOG) and nephrotic syndrome in children.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);
const bsa = (cm: number, kg: number) => Math.sqrt((cm * kg) / 3600);

/* ================================================================== vertigo (HINTS) */

export interface HintsInput { impulse: "abnormal" | "normal" | "untested"; nystagmus: "unidirectional" | "changing" | "vertical" | "none"; skew: boolean; hearingLoss: boolean; cantWalk: boolean }
export function hints(x: HintsInput): { central: boolean; reasons: string[]; text: string } {
  const reasons: string[] = [];
  if (x.impulse === "normal") reasons.push("normal head impulse in a patient with continuous vertigo and nystagmus");
  if (x.nystagmus === "changing") reasons.push("direction-changing nystagmus on side gaze");
  if (x.nystagmus === "vertical") reasons.push("vertical or purely torsional nystagmus");
  if (x.skew) reasons.push("skew deviation on the cover test");
  if (x.hearingLoss) reasons.push("new hearing loss (AICA stroke can mimic a peripheral pattern)");
  if (x.cantWalk) reasons.push("cannot walk unaided");
  if (reasons.length) return { central: true, reasons, text: "Possible stroke (central cause): urgent MRI with diffusion (CT misses most posterior strokes) and the stroke pathway; do not discharge." };
  if (x.impulse === "abnormal" && x.nystagmus === "unidirectional") return { central: false, reasons, text: "Peripheral pattern (abnormal head impulse, unidirectional horizontal nystagmus, no skew): likely vestibular neuritis or labyrinthitis." };
  return { central: false, reasons, text: "HINTS is only valid in acute continuous vertigo with nystagmus. Complete the examination, or consider BPPV (positional) or vestibular migraine (episodic)." };
}
export const VERTIGO_TYPES: { id: string; name: string; how: string; treat: string }[] = [
  { id: "bppv", name: "BPPV", how: "Seconds of vertigo on turning in bed or looking up; Dix–Hallpike gives torsional upbeating nystagmus after a short delay that fades.", treat: "Epley manoeuvre (posterior canal), repeat if needed; no drugs; teach Brandt–Daroff or self-Epley." },
  { id: "neuritis", name: "Vestibular neuritis", how: "Continuous vertigo for days, nausea, no hearing loss, peripheral HINTS.", treat: "Prochlorperazine 5–10 mg or promethazine for up to 3 days only; walk early; vestibular rehabilitation exercises; prednisolone within 72 hours is optional." },
  { id: "labyrinthitis", name: "Labyrinthitis", how: "As neuritis plus hearing loss: check for otitis media; sudden hearing loss needs same-day ENT.", treat: "As neuritis; urgent audiology and ENT for steroid treatment of sudden sensorineural hearing loss." },
  { id: "menieres", name: "Ménière's disease", how: "Attacks of 20 minutes to 12 hours with low-frequency hearing loss, tinnitus and ear fullness.", treat: "Low-salt diet, betahistine is commonly used, prochlorperazine for attacks; ENT referral." },
  { id: "migraine", name: "Vestibular migraine", how: "Episodes of minutes to days with migraine features (headache, light sensitivity) in someone with migraine.", treat: "Treat as migraine: triggers, acute treatment and prevention." },
  { id: "central", name: "Posterior circulation stroke", how: "Central HINTS, ataxia, diplopia, dysarthria, numbness, sudden severe headache or neck pain (dissection).", treat: "Stroke pathway, MRI, thrombolysis or thrombectomy if eligible." },
];

/* ================================================================== acute pulmonary oedema */

export function furosemideIv(oralDaily: number | null): string {
  if (!oralDaily) return "Furosemide 40 mg IV (20–40 mg if not on a diuretic before).";
  return `Furosemide ${Math.round(oralDaily)}–${Math.round(oralDaily * 2.5)} mg IV (1–2.5 times the usual daily oral dose of ${Math.round(oralDaily)} mg), as a bolus or split doses.`;
}
export function apoPlan(sbp: number, spo2: number, rr: number, oralDaily: number | null): { band: "hypertensive" | "normotensive" | "shock"; steps: string[] } {
  const steps: string[] = [];
  const band: "hypertensive" | "normotensive" | "shock" = sbp > 0 && sbp < 90 ? "shock" : sbp > 140 ? "hypertensive" : "normotensive";
  steps.push("Sit upright; continuous SpO2, ECG and BP; IV access; ECG and troponin now (exclude ACS), chest X-ray, echo, U&E, BNP.");
  if (spo2 > 0 && spo2 < 90) steps.push(`SpO2 ${spo2}%: oxygen to keep 94–98% (88–92% if CO2 retainer).`);
  if ((spo2 > 0 && spo2 < 90) || rr > 25) steps.push(`${rr > 25 ? `RR ${rr}` : "Hypoxaemia"}: start CPAP (5–10 cmH2O) or NIV early; intubate if exhausted or not improving.`);
  if (band === "shock") {
    steps.push(`SBP ${sbp}: cardiogenic shock. No nitrates; cautious or no diuretic until perfused; noradrenaline to MAP 65 and consider dobutamine; urgent echo and cardiology (revascularisation if ACS, mechanical support).`);
  } else {
    steps.push(furosemideIv(oralDaily));
    steps.push("Check response at 2 hours: urine output over 100–150 ml/hour or spot urine sodium over 50–70 mmol/L; if less, double the dose.");
    if (band === "hypertensive") steps.push(`SBP ${sbp}: GTN 400 micrograms sublingual (repeat every 5–10 minutes) then IV GTN 10–20 micrograms/minute, doubling every 5–10 minutes to 200 as BP allows (keep SBP over 100).`);
    else steps.push(`SBP ${sbp || "90–140"}: nitrates only if SBP stays over 110; watch BP after each step.`);
  }
  steps.push("Find the trigger: ACS, fast AF or other arrhythmia, hypertensive crisis, valve disease, kidney failure, infection, missed medicines, renal artery stenosis (flash oedema).", "Avoid routine morphine; fluid and salt restriction; daily weights; continue heart failure medicines unless shocked or AKI.");
  return { band, steps };
}

/* ================================================================== arrhythmias (ACLS) */

export interface ArrInput { rate: number; qrs: "narrow" | "broad"; rhythm: "regular" | "irregular"; unstable: boolean; preexcited: boolean; polymorphic: boolean }
export function acls(x: ArrInput): { kind: "brady" | "tachy" | "none"; title: string; steps: string[] } {
  if (x.rate > 0 && x.rate < 50) {
    return { kind: "brady", title: `Bradycardia ${x.rate}/min${x.unstable ? " with adverse features" : ""}`, steps: x.unstable ? [
      "Adverse features (shock, syncope, myocardial ischaemia, heart failure): treat now.",
      "Atropine 1 mg IV (AHA 2020; ERC uses 500 micrograms), repeat every 3–5 minutes up to 3 mg.",
      "Not responding: transcutaneous pacing (with analgesia and sedation), or adrenaline infusion 2–10 micrograms/minute, or dopamine 5–20 micrograms/kg/minute.",
      "Arrange transvenous pacing; look for causes: hyperkalaemia, drugs (beta blockers, calcium channel blockers, digoxin), inferior MI, hypothyroidism, raised intracranial pressure.",
    ] : [
      "No adverse features: observe on a monitor.",
      "Risk of asystole (Mobitz II, complete heart block with broad QRS, pause over 3 seconds, recent asystole): get expert help and prepare for pacing even if stable.",
      "Check potassium, drugs, thyroid function, ECG for ischaemia.",
    ] };
  }
  if (x.rate < 150 && !(x.rate > 100 && x.unstable)) return { kind: "none", title: x.rate ? `Rate ${x.rate}/min` : "Enter the rate", steps: ["Tachyarrhythmia is unlikely to cause instability under 150/min unless there is heart disease; look for a cause such as sepsis, pain, bleeding or fever (sinus tachycardia is treated by treating the cause)."] };
  if (x.unstable) {
    const joules = x.qrs === "broad" && x.rhythm === "irregular" ? "defibrillation dose (NOT synchronised) if polymorphic VT" : x.qrs === "narrow" && x.rhythm === "regular" ? "50–100 J" : x.qrs === "narrow" ? "120–200 J biphasic" : "100 J";
    return { kind: "tachy", title: `Unstable tachycardia ${x.rate}/min`, steps: [
      "Adverse features (shock, syncope, ischaemia, heart failure): synchronised DC cardioversion under sedation, up to 3 attempts.",
      `Starting energy: ${joules}; increase stepwise if unsuccessful.`,
      "Still in it: amiodarone 300 mg IV over 10–20 minutes, then repeat the shock; then amiodarone 900 mg over 24 hours.",
    ] };
  }
  if (x.qrs === "narrow" && x.rhythm === "regular") return { kind: "tachy", title: `Regular narrow-complex tachycardia ${x.rate}/min (likely SVT)`, steps: [
    "Vagal manoeuvres: modified Valsalva (blow into a 10 ml syringe for 15 seconds, then lie flat with legs raised).",
    "Adenosine 6 mg rapid IV push with a saline flush into a large vein; then 12 mg, and a further 12 mg (ERC 18 mg); warn about a brief sense of doom. Avoid in severe asthma.",
    "Not converting: verapamil 2.5–5 mg IV over 2 minutes or a beta blocker; flutter with 2:1 block shows a rate near 150: rate control and cardioversion.",
  ] };
  if (x.qrs === "narrow") return { kind: "tachy", title: `Irregular narrow-complex tachycardia ${x.rate}/min (likely AF)`, steps: [
    "Rate control: metoprolol 2.5–5 mg IV (or oral), or diltiazem; digoxin or amiodarone if heart failure or low BP.",
    "Onset under 48 hours and anticoagulated or low risk: consider cardioversion (electrical or flecainide if no structural heart disease).",
    "Assess stroke risk (CHA2DS2-VA) and start anticoagulation; look for triggers: sepsis, thyroid, alcohol, electrolytes.",
  ] };
  if (x.rhythm === "regular") return { kind: "tachy", title: `Regular broad-complex tachycardia ${x.rate}/min (treat as VT)`, steps: [
    "Assume VT, especially with heart disease.",
    "Amiodarone 300 mg IV over 20–60 minutes, then 900 mg over 24 hours (or procainamide where available); expert help.",
    "Adenosine only if previously confirmed SVT with bundle branch block and the rhythm is regular and monomorphic.",
    "Check potassium and magnesium; prepare for synchronised cardioversion if it deteriorates.",
  ] };
  const out = [
    x.polymorphic ? "Polymorphic VT (torsades de pointes): magnesium sulphate 2 g IV over 10 minutes; stop QT-prolonging drugs; correct potassium; defibrillate if unstable; overdrive pacing or isoprenaline for recurrent torsades." : "Irregular broad complex: usually AF with bundle branch block (treat as AF).",
  ];
  if (x.preexcited) out.push("Pre-excited AF (WPW): do NOT give adenosine, verapamil, diltiazem, digoxin or beta blockers; synchronised cardioversion, or procainamide/ibutilide; refer for ablation.");
  else out.push("If WPW is possible (very fast, varying broad QRS), avoid AV-nodal blockers and get expert help.");
  return { kind: "tachy", title: `Irregular broad-complex tachycardia ${x.rate}/min`, steps: out };
}

/* ================================================================== scorpion sting */

export const SCORPION_GRADES: { grade: 1 | 2 | 3 | 4; name: string; signs: string }[] = [
  { grade: 1, name: "Local", signs: "Severe local pain, numbness, sweating at the sting site only" },
  { grade: 2, name: "Autonomic storm", signs: "Sweating, salivation, vomiting, cold extremities, priapism, high or low BP, fast or slow pulse" },
  { grade: 3, name: "Cardiovascular", signs: "Pulmonary oedema, hypotension or shock, myocarditis (raised troponin, low EF)" },
  { grade: 4, name: "Neurological / multi-organ", signs: "Confusion, seizures, coma, with grade 3 features" },
];
export function prazosinDose(kg: number, adult: boolean): string {
  if (adult || kg >= 40) return "Prazosin 500 micrograms (adults; some use 1 mg) by mouth or crushed via NG tube, every 3 hours until the extremities are warm and dry and BP settles, then every 6 hours; lie flat for an hour after the first dose (postural fall).";
  if (!(kg > 0)) return "Prazosin 30 micrograms/kg per dose by mouth every 3 hours (enter weight for the dose).";
  return `Prazosin ${Math.round(30 * kg)} micrograms (30 micrograms/kg) by mouth every 3 hours until warm, dry extremities, then every 6 hours; keep lying down after the first dose.`;
}
export function scorpionPlan(grade: 1 | 2 | 3 | 4, kg: number, adult: boolean): string[] {
  if (grade === 1) return ["Local anaesthetic: 2% lignocaine without adrenaline infiltrated at the site (or a digital block), and paracetamol.", "Observe for at least 6 hours (children under 5 for 12–24 hours): autonomic signs can start late.", "Tetanus prophylaxis as needed."];
  const out = [prazosinDose(kg, adult), "Scorpion antivenom with prazosin speeds recovery in grade 2 and above where available: give per the product leaflet.", "Avoid atropine (worsens the adrenergic storm), steroids, antihistamines and calcium (no benefit)."];
  if (grade >= 3) out.push("Pulmonary oedema: oxygen, CPAP, IV GTN or sodium nitroprusside if BP allows; small furosemide doses; dobutamine for low output; ICU.", "ECG, troponin and echo for myocarditis.");
  if (grade === 4) out.push("Seizures: benzodiazepines; check glucose; airway protection and ventilation as needed.");
  out.push("Admit to HDU for grade 2 and above; monitor BP, pulse, SpO2 and urine output hourly.");
  return out;
}

/* ================================================================== pericarditis and myocarditis */

export function pericarditis(crit: boolean[], highRisk: boolean[], troponin: boolean): { criteria: number; diagnosis: boolean; admit: boolean; myo: boolean } {
  const criteria = crit.filter(Boolean).length;
  return { criteria, diagnosis: criteria >= 2, admit: highRisk.some(Boolean) || troponin, myo: troponin };
}
export const PERI_CRITERIA = ["Pericarditic chest pain (sharp, better sitting forward)", "Pericardial friction rub", "New widespread ST elevation or PR depression", "New or worse pericardial effusion"];
export const PERI_HIGH_RISK = ["Fever over 38°C", "Subacute onset over days or weeks", "Large effusion (over 20 mm) or tamponade", "No response to NSAID after 1 week", "Immunosuppressed", "On anticoagulants", "After trauma"];
export function periPlan(kg: number, myo: boolean, recurrent: boolean): string[] {
  const colch = kg > 0 && kg < 70 ? "0.5 mg once daily" : kg >= 70 ? "0.5 mg twice daily" : "0.5 mg once daily if under 70 kg, twice daily if 70 kg or more";
  const out = [
    myo ? "Myopericarditis (raised troponin): lower NSAID doses, rest; ECG monitoring; echo and cardiac MRI." : "Aspirin 750–1,000 mg every 8 hours, or ibuprofen 600 mg every 8 hours, for 1–2 weeks, then taper over 2–4 weeks; with a PPI.",
    `Colchicine ${colch} for ${recurrent ? "6 months" : "3 months"} (reduces recurrence by half); check kidney function and drug interactions (clarithromycin, statins).`,
    "Stop strenuous exercise until symptoms and CRP settle (athletes: at least 3 months; myocarditis: 3–6 months).",
    "Steroids only if NSAIDs are contraindicated or fail: low dose prednisolone 0.2–0.5 mg/kg/day with slow taper (higher doses increase recurrence).",
    "Look for TB in India (large effusion, constitutional symptoms): pericardial fluid ADA, and treat TB pericarditis per NTEP.",
  ];
  return out;
}

/* ================================================================== PCOS */

export interface PcosInput { adolescent: boolean; irregular: boolean; hyperandrogen: boolean; pcom: boolean }
export function pcosDx(x: PcosInput): { meets: boolean; text: string } {
  if (x.adolescent) {
    const meets = x.irregular && x.hyperandrogen;
    return { meets, text: meets ? "Adolescent (under 8 years after menarche): irregular cycles AND hyperandrogenism: PCOS. Ultrasound is not used at this age." : "Adolescent: both irregular cycles and hyperandrogenism are needed; if only one, call it 'at risk' and reassess at 8 years after menarche." };
  }
  const n = [x.irregular, x.hyperandrogen, x.pcom].filter(Boolean).length;
  return { meets: n >= 2, text: n >= 2 ? `Rotterdam criteria met (${n} of 3), once other causes are excluded.` : `${n} of 3 Rotterdam criteria: not PCOS on current findings.` };
}
export const PCOS_EXCLUDE = ["Pregnancy (hCG)", "TSH (thyroid disease)", "Prolactin", "17-hydroxyprogesterone (non-classic CAH)", "Total testosterone; if very high or rapid virilisation, look for an androgen-secreting tumour or Cushing's"];
export function pcosPlan(goal: "cycles" | "hirsutism" | "fertility" | "weight"): string[] {
  const common = ["Screen at diagnosis: 75 g OGTT (or HbA1c), lipids, BP; repeat glucose every 1–3 years; screen for depression, anxiety, eating disorders and sleep apnoea.", "Lifestyle: even 5% weight loss improves cycles; use Asian BMI cut-offs (overweight 23, obese 25)."];
  if (goal === "cycles") return ["Combined oral contraceptive pill (e.g. ethinylestradiol 20–30 micrograms with a progestin) first line for irregular cycles.", "If the pill is not suitable: cyclical progestogen (medroxyprogesterone 10 mg for 10–14 days every 1–3 months) to protect the endometrium if fewer than 4 periods a year.", "Metformin 500 mg daily rising to 1,500–2,000 mg a day helps cycles and metabolism, especially with BMI 25 or more.", ...common];
  if (goal === "hirsutism") return ["Combined pill for at least 6 months; add spironolactone 50–100 mg daily (with reliable contraception) if not enough.", "Laser or electrolysis, eflornithine cream for facial hair.", ...common];
  if (goal === "fertility") return ["Stop the pill; check tubal patency and semen analysis before ovulation induction.", "Letrozole first line: 2.5 mg daily on days 3–7, increasing by 2.5 mg each cycle to 7.5 mg if no ovulation (follicle tracking); clomiphene with or without metformin is second line.", "Then gonadotrophins or laparoscopic ovarian drilling; IVF if other measures fail.", "Folic acid; optimise weight and glucose before pregnancy (higher risk of gestational diabetes).", ...common];
  return ["Structured diet and 150–300 minutes of activity a week; metformin can add modest weight loss.", "GLP-1 agonists or anti-obesity medicines where appropriate and affordable; bariatric referral for BMI 35 or more with comorbidities (Asian thresholds lower).", ...common];
}

/* ================================================================== postnatal depression (EPDS) */

export const EPDS: { q: string; opts: [number, string][] }[] = [
  { q: "Able to laugh and see the funny side of things", opts: [[0, "As much as I always could"], [1, "Not quite so much now"], [2, "Definitely not so much now"], [3, "Not at all"]] },
  { q: "Looked forward with enjoyment to things", opts: [[0, "As much as I ever did"], [1, "Rather less than I used to"], [2, "Definitely less than I used to"], [3, "Hardly at all"]] },
  { q: "Blamed myself unnecessarily when things went wrong", opts: [[3, "Yes, most of the time"], [2, "Yes, some of the time"], [1, "Not very often"], [0, "No, never"]] },
  { q: "Anxious or worried for no good reason", opts: [[0, "No, not at all"], [1, "Hardly ever"], [2, "Yes, sometimes"], [3, "Yes, very often"]] },
  { q: "Scared or panicky for no very good reason", opts: [[3, "Yes, quite a lot"], [2, "Yes, sometimes"], [1, "No, not much"], [0, "No, not at all"]] },
  { q: "Things have been getting on top of me", opts: [[3, "Most of the time I haven't been able to cope"], [2, "Sometimes I haven't been coping as well as usual"], [1, "Most of the time I have coped quite well"], [0, "I have been coping as well as ever"]] },
  { q: "So unhappy that I have had difficulty sleeping", opts: [[3, "Yes, most of the time"], [2, "Yes, sometimes"], [1, "Not very often"], [0, "No, not at all"]] },
  { q: "Felt sad or miserable", opts: [[3, "Yes, most of the time"], [2, "Yes, quite often"], [1, "Not very often"], [0, "No, not at all"]] },
  { q: "So unhappy that I have been crying", opts: [[3, "Yes, most of the time"], [2, "Yes, quite often"], [1, "Only occasionally"], [0, "No, never"]] },
  { q: "The thought of harming myself has occurred to me", opts: [[3, "Yes, quite often"], [2, "Sometimes"], [1, "Hardly ever"], [0, "Never"]] },
];
export function epds(scores: number[]): { total: number; band: "low" | "possible" | "probable"; selfHarm: boolean; text: string } {
  const total = scores.reduce((a, b) => a + (b || 0), 0);
  const selfHarm = (scores[9] ?? 0) > 0;
  const band = total >= 13 ? "probable" : total >= 10 ? "possible" : "low";
  const text = band === "probable" ? `EPDS ${total}: probable depression; clinical assessment and treatment.` : band === "possible" ? `EPDS ${total}: possible depression; assess clinically and repeat in 2 weeks.` : `EPDS ${total}: depression unlikely now; repeat if concerns.`;
  return { total, band, selfHarm, text };
}
export const EPDS_CARE = [
  "Mild to moderate: listening visits, psychological therapy (CBT or interpersonal therapy), sleep support, family involvement.",
  "Moderate to severe or not improving: an SSRI. Sertraline (start 25–50 mg daily) is preferred in breastfeeding; paroxetine also has low milk levels; watch the baby for sleepiness or poor feeding.",
  "Continue antidepressants for at least 6 months after recovery; review contraception and plans for future pregnancy.",
  "Postpartum psychosis (confusion, hallucinations, mania, odd beliefs, usually in the first 2 weeks): psychiatric emergency; admit, ideally to a mother-and-baby unit.",
  "Tele-MANAS (14416) for support; screen at 6 weeks postnatally and at immunisation visits.",
];

/* ================================================================== red eye and acute glaucoma */

export const RED_EYE_FLAGS = ["Reduced vision", "Severe eye pain or headache with vomiting", "Photophobia", "Fixed, mid-dilated or irregular pupil", "Corneal haze, white spot or ulcer", "Contact lens wearer", "Chemical splash or penetrating injury", "Recent eye surgery", "Newborn (first 4 weeks)", "Vesicles on the nose tip or forehead (shingles)"];
export function redEyeTriage(flags: boolean[]): { level: "emergency" | "same-day" | "routine"; text: string } {
  if (flags[6]) return { level: "emergency", text: "Chemical injury or penetrating injury: irrigate now (chemical: at least 30 minutes until pH 7–7.5); shield a penetrating injury, no pressure; emergency ophthalmology." };
  if (flags[1] && flags[3]) return { level: "emergency", text: "Pain with vomiting and a mid-dilated pupil: acute angle-closure glaucoma until proved otherwise; start treatment and call ophthalmology now." };
  if (flags.some(Boolean)) return { level: "same-day", text: "Red flags present: same-day ophthalmology review (keratitis, uveitis, scleritis, glaucoma, herpes zoster ophthalmicus, neonatal conjunctivitis)." };
  return { level: "routine", text: "No red flags: likely conjunctivitis, subconjunctival haemorrhage or episcleritis; treat in primary care and review if worse." };
}
export const GLAUCOMA_FIRST_AID = [
  "Lie the patient flat (face up); analgesia and an antiemetic.",
  "Acetazolamide 500 mg IV (or by mouth), then 250 mg four times daily; avoid in sulfonamide allergy, sickle cell disease, severe kidney failure, low potassium.",
  "Timolol 0.5% one drop, apraclonidine 1% one drop, prednisolone acetate 1% one drop.",
  "Pilocarpine 2% (1% in light irises) one drop to the affected eye once IOP starts to fall (about 1 hour), and 1% to the other eye to prevent an attack.",
  "Emergency ophthalmology: laser peripheral iridotomy to both eyes once the attack settles.",
];
export const RED_EYE_TABLE: [string, string, string][] = [
  ["Bacterial conjunctivitis", "Sticky discharge, normal vision", "Usually settles in a week; moxifloxacin or chloramphenicol drops if severe or not settling"],
  ["Viral conjunctivitis", "Watery, gritty, often one eye then the other, tender preauricular node", "Hygiene, cold compresses, artificial tears; very contagious for 2 weeks"],
  ["Allergic conjunctivitis", "Itching, both eyes, seasonal", "Olopatadine or ketotifen drops, cold compresses"],
  ["Ophthalmia neonatorum", "Discharge in the first 4 weeks", "Urgent: swab for gonorrhoea and chlamydia; gonococcal: ceftriaxone 25–50 mg/kg (max 125 mg) IM once"],
  ["Keratitis", "Pain, photophobia, white spot, contact lenses", "Same-day ophthalmology; no steroids; fungal keratitis is common in India after vegetable-matter injury"],
  ["Anterior uveitis", "Ache, photophobia, small pupil, ciliary flush", "Same-day ophthalmology; associated with HLA-B27 conditions, TB, sarcoid"],
  ["Subconjunctival haemorrhage", "Painless red patch, normal vision", "Reassure; check BP and INR if on warfarin or recurrent"],
];

/* ================================================================== cholecystitis and cholangitis (Tokyo 2018) */

export const TG_ORGAN = ["Hypotension needing vasopressors", "Reduced consciousness", "PaO2/FiO2 under 300", "Oliguria or creatinine over 2.0 mg/dL", "INR over 1.5", "Platelets under 1,00,000"];
export function cholecystitis(a: boolean[], b: boolean[], imaging: boolean, organ: boolean[], g2: boolean[]): { dx: "none" | "suspected" | "definite"; grade: 1 | 2 | 3; plan: string[] } {
  const A = a.some(Boolean), B = b.some(Boolean);
  const dx = A && B && imaging ? "definite" : A && B ? "suspected" : "none";
  const grade: 1 | 2 | 3 = organ.some(Boolean) ? 3 : g2.some(Boolean) ? 2 : 1;
  const plan = grade === 3 ? ["Grade III (severe): organ support and antibiotics (piperacillin–tazobactam); early cholecystectomy only at an advanced centre if the patient is fit and organ failure reverses quickly, otherwise percutaneous cholecystostomy and later surgery."]
    : grade === 2 ? ["Grade II (moderate): antibiotics (ceftriaxone with metronidazole); early laparoscopic cholecystectomy by an experienced surgeon, or drainage (cholecystostomy) if high surgical risk."]
    : ["Grade I (mild): antibiotics (ceftriaxone, or amoxicillin–clavulanate), analgesia; early laparoscopic cholecystectomy within 72 hours (and within 7 days) of onset."];
  plan.push("Blood cultures in grade II–III; stop antibiotics within 24 hours of cholecystectomy unless complicated (gangrene, perforation: 4–7 days).");
  return { dx, grade, plan };
}
export const TG_CHOLE_A = ["Murphy's sign", "Right upper quadrant mass, pain or tenderness"];
export const TG_CHOLE_B = ["Fever", "Raised CRP", "Raised white cell count"];
export const TG_CHOLE_G2 = ["White cells over 18,000", "Palpable tender RUQ mass", "Symptoms for more than 72 hours", "Marked local inflammation (gangrene, abscess, emphysematous)"];
export function cholangitis(a: boolean[], b: boolean[], imaging: boolean, organ: boolean[], g2: boolean[]): { dx: "none" | "suspected" | "definite"; grade: 1 | 2 | 3; plan: string[] } {
  const A = a.some(Boolean), B = b.some(Boolean);
  const dx = A && B && imaging ? "definite" : A && (B || imaging) ? "suspected" : "none";
  const grade: 1 | 2 | 3 = organ.some(Boolean) ? 3 : g2.filter(Boolean).length >= 2 ? 2 : 1;
  const plan = grade === 3 ? ["Grade III (severe): resuscitation and organ support, piperacillin–tazobactam (or meropenem if ESBL risk), urgent biliary drainage (ERCP, or PTBD) as soon as stable."]
    : grade === 2 ? ["Grade II (moderate): antibiotics and early biliary drainage (ERCP within 24–48 hours); treat the cause (stones) once settled."]
    : ["Grade I (mild): antibiotics (ceftriaxone with metronidazole); drainage if no response within 24 hours; treat the cause."];
  plan.push("Blood cultures before antibiotics; continue 4–7 days after source control (2 weeks if Enterococcus or Streptococcus bacteraemia).");
  return { dx, grade, plan };
}
export const TG_CHOL_A = ["Fever over 38°C or shaking chills", "White cells under 4,000 or over 10,000, or CRP raised"];
export const TG_CHOL_B = ["Bilirubin 2 mg/dL or more", "ALP, GGT, AST or ALT over 1.5 times normal"];
export const TG_CHOL_G2 = ["White cells over 12,000 or under 4,000", "Fever 39°C or more", "Age 75 or more", "Bilirubin 5 mg/dL or more", "Low albumin (under 0.7 times normal)"];

/* ================================================================== thyroid nodule (ACR TI-RADS) */

export const TIRADS = {
  composition: [[0, "Cystic or almost completely cystic"], [0, "Spongiform"], [1, "Mixed cystic and solid"], [2, "Solid or almost completely solid"]] as [number, string][],
  echo: [[0, "Anechoic"], [1, "Hyperechoic or isoechoic"], [2, "Hypoechoic"], [3, "Very hypoechoic"]] as [number, string][],
  shape: [[0, "Wider than tall"], [3, "Taller than wide"]] as [number, string][],
  margin: [[0, "Smooth or ill-defined"], [2, "Lobulated or irregular"], [3, "Extra-thyroidal extension"]] as [number, string][],
  foci: [[1, "Macrocalcifications"], [2, "Peripheral (rim) calcifications"], [3, "Punctate echogenic foci"]] as [number, string][],
};
export function tirads(comp: number, echo: number, shape: number, margin: number, foci: number[], sizeCm: number): { points: number; tr: 1 | 2 | 3 | 4 | 5; label: string; action: string } {
  const points = comp + echo + shape + margin + foci.reduce((a, b) => a + b, 0);
  const tr: 1 | 2 | 3 | 4 | 5 = points === 0 ? 1 : points <= 2 ? 2 : points === 3 ? 3 : points <= 6 ? 4 : 5;
  const label = ["", "TR1 benign", "TR2 not suspicious", "TR3 mildly suspicious", "TR4 moderately suspicious", "TR5 highly suspicious"][tr];
  const rule: Record<number, [number, number, string] | null> = { 1: null, 2: null, 3: [2.5, 1.5, "ultrasound at 1, 3 and 5 years"], 4: [1.5, 1.0, "ultrasound at 1, 2, 3 and 5 years"], 5: [1.0, 0.5, "ultrasound every year for 5 years"] };
  const r = rule[tr];
  let action = "No FNA and no follow-up needed.";
  if (r) {
    if (!(sizeCm > 0)) action = `FNA if ${r[0]} cm or more; follow up if ${r[1]} cm or more (${r[2]}).`;
    else if (sizeCm >= r[0]) action = `${sizeCm} cm: FNA (threshold ${r[0]} cm).`;
    else if (sizeCm >= r[1]) action = `${sizeCm} cm: no FNA now; follow up with ${r[2]} (FNA if it grows 20% and 2 mm in two dimensions).`;
    else action = `${sizeCm} cm: below the follow-up size; no FNA or follow-up needed.`;
  }
  return { points, tr, label, action };
}

/* ================================================================== VTE risk in pregnancy (RCOG) */

export const PV_ITEMS: { label: string; pts: number; when: "both" | "ante" | "post" }[] = [
  { label: "Previous VTE provoked by major surgery", pts: 3, when: "both" },
  { label: "Known high-risk thrombophilia", pts: 3, when: "both" },
  { label: "Medical comorbidity (cancer, heart failure, active SLE, IBD, nephrotic syndrome, type 1 diabetes with nephropathy, sickle cell, IV drug use)", pts: 3, when: "both" },
  { label: "Family history of unprovoked or oestrogen-related VTE (first-degree relative)", pts: 1, when: "both" },
  { label: "Known low-risk thrombophilia (no VTE)", pts: 1, when: "both" },
  { label: "Age over 35", pts: 1, when: "both" },
  { label: "BMI 30–39", pts: 1, when: "both" },
  { label: "BMI 40 or more", pts: 2, when: "both" },
  { label: "Parity 3 or more", pts: 1, when: "both" },
  { label: "Smoker", pts: 1, when: "both" },
  { label: "Gross varicose veins", pts: 1, when: "both" },
  { label: "Pre-eclampsia in this pregnancy", pts: 1, when: "both" },
  { label: "IVF / assisted reproduction (antenatal only)", pts: 1, when: "ante" },
  { label: "Multiple pregnancy", pts: 1, when: "both" },
  { label: "Caesarean section in labour", pts: 2, when: "post" },
  { label: "Elective caesarean section", pts: 1, when: "post" },
  { label: "Mid-cavity or rotational operative delivery", pts: 1, when: "post" },
  { label: "Prolonged labour (over 24 hours)", pts: 1, when: "post" },
  { label: "PPH over 1 litre or transfusion", pts: 1, when: "post" },
  { label: "Preterm birth (under 37 weeks) in this pregnancy", pts: 1, when: "post" },
  { label: "Stillbirth in this pregnancy", pts: 1, when: "post" },
  { label: "Surgery in pregnancy or the puerperium (not immediate perineal repair)", pts: 3, when: "both" },
  { label: "Hyperemesis", pts: 3, when: "ante" },
  { label: "Ovarian hyperstimulation syndrome (first trimester)", pts: 4, when: "ante" },
  { label: "Current systemic infection", pts: 1, when: "both" },
  { label: "Immobility or dehydration", pts: 1, when: "both" },
];
export function pregVte(ticks: boolean[], previousVte: boolean): { ante: number; post: number; anteText: string; postText: string } {
  const t = [...ticks];
  if (t[6] && t[7]) t[6] = false;
  const sum = (w: "ante" | "post") => PV_ITEMS.reduce((a, it, i) => a + (t[i] && (it.when === "both" || it.when === w) ? it.pts : 0), 0);
  const ante = sum("ante");
  const post = sum("post");
  if (previousVte) return { ante, post, anteText: "Previous VTE (not after major surgery): high risk. LMWH from the first trimester (refer to a specialist; consider thrombophilia testing).", postText: "Postnatal: LMWH for 6 weeks." };
  const anteText = ante >= 4 ? `Antenatal score ${ante}: LMWH from the first trimester.` : ante === 3 ? `Antenatal score ${ante}: LMWH from 28 weeks.` : `Antenatal score ${ante}: no antenatal LMWH; mobilise, avoid dehydration; reassess if admitted or new risks.`;
  const postText = post >= 3 ? `Postnatal score ${post}: LMWH for at least 10 days; extend to 6 weeks if risks persist or 3 or more risk factors.` : post >= 2 ? `Postnatal score ${post}: LMWH for at least 10 days after delivery.` : `Postnatal score ${post}: early mobilisation and avoid dehydration.`;
  return { ante, post, anteText, postText };
}
export function enoxaparinProphylaxis(kg: number): string | null {
  if (!(kg > 0)) return null;
  const dose = kg < 50 ? "20 mg" : kg <= 90 ? "40 mg" : kg <= 130 ? "60 mg" : kg <= 170 ? "80 mg" : `${Math.round(0.6 * kg)} mg (0.6 mg/kg)`;
  return `Enoxaparin ${dose} SC once daily for a booking weight of ${kg} kg (prophylactic dose).`;
}

/* ================================================================== nephrotic syndrome in children */

export function nsDoses(heightCm: number, kg: number): { bsa: number; daily: number; alternate: number } | null {
  if (!(heightCm > 0 && kg > 0)) return null;
  const b = bsa(heightCm, kg);
  return { bsa: Math.round(b * 100) / 100, daily: Math.round(cap(60 * b, 60)), alternate: Math.round(cap(40 * b, 40)) };
}
export function nsPlan(phase: "first" | "relapse", d: { daily: number; alternate: number } | null): string[] {
  const daily = d ? `${d.daily} mg` : "60 mg/m² (max 60 mg)";
  const alt = d ? `${d.alternate} mg` : "40 mg/m² (max 40 mg)";
  if (phase === "first") return [`Prednisolone ${daily} once daily for 6 weeks (60 mg/m²/day, or 2 mg/kg/day, max 60 mg).`, `Then ${alt} on alternate days for 6 weeks (40 mg/m², or 1.5 mg/kg, max 40 mg), then stop (no long taper).`, "Remission: urine dipstick nil or trace for 3 days in a row (most remit within 2 weeks)."];
  return [`Relapse: prednisolone ${daily} daily until urine is nil or trace for 3 days in a row.`, `Then ${alt} on alternate days for 4 weeks, then stop.`, "Treat infections first: a relapse may settle on its own with an infection."];
}
export function nsClassify(x: { noRemission4w: boolean; relapses6m: number; relapses12m: number; relapseOnSteroids: boolean }): { label: string; text: string } {
  if (x.noRemission4w) return { label: "Steroid-resistant", text: "No remission after 4 weeks of daily prednisolone: refer to paediatric nephrology for kidney biopsy and genetic testing; calcineurin inhibitors and ACE inhibitor." };
  if (x.relapseOnSteroids) return { label: "Steroid-dependent", text: "Two relapses in a row during alternate-day prednisolone or within 14 days of stopping: steroid-sparing treatment (levamisole, MMF, tacrolimus, cyclophosphamide or rituximab) with a nephrologist." };
  if (x.relapses6m >= 2 || x.relapses12m >= 4) return { label: "Frequently relapsing", text: "2 or more relapses within 6 months of the first response, or 4 or more in 12 months: long-term low-dose alternate-day prednisolone or a steroid-sparing agent (levamisole, MMF)." };
  return { label: "Steroid-sensitive", text: "Steroid-sensitive nephrotic syndrome: home urine dipstick monitoring, start relapse treatment when 3+ (or more) for 3 days." };
}
export const NS_CARE = [
  "Oedema: salt restriction; no fluid restriction unless severe. Severe oedema with good BP and no hypovolaemia: 20% albumin 0.5–1 g/kg over 4 hours with IV furosemide 1–2 mg/kg in the middle and at the end.",
  "Hypovolaemia (abdominal pain, cold peripheries, high haematocrit, low urine sodium): albumin or saline; do not give diuretics.",
  "Infections: peritonitis (cefotaxime or ceftriaxone), cellulitis; pneumococcal and varicella vaccines once off high-dose steroids; treat TB exposure promptly.",
  "Thrombosis risk: mobilise, avoid dehydration and femoral lines.",
  "Refer for biopsy if onset under 1 year, persistent hypertension, gross haematuria, low C3, kidney failure not due to low volume, or steroid resistance.",
];
