/**
 * Update 47, on the device (no AI): haemoptysis, leg swelling (Wells DVT), palpitations, tremor,
 * the limping child (Kocher), recurrent abdominal pain in children, recurrent miscarriage, mastitis
 * and breast abscess, epistaxis, mouth ulcers, heel pain and gynaecomastia.
 */

/* ================================================================== haemoptysis */

export interface HaemoptysisInput { mlPerDay: number; unstable: boolean; anticoag: boolean; age: number; smoker: boolean; tbHistory: boolean; fever: boolean; weightLoss: boolean; dvtSigns: boolean }
export function haemoptysisPlan(x: HaemoptysisInput): { level: "massive" | "moderate" | "mild"; steps: string[] } {
  const level = x.unstable || x.mlPerDay >= 200 ? "massive" : x.mlPerDay >= 30 ? "moderate" : "mild";
  const steps: string[] = [];
  if (level === "massive") {
    steps.push("Life-threatening haemoptysis (200 mL or more in 24 hours, or any amount with hypoxia, airway threat or shock): resuscitation bay, call senior, anaesthesia, chest physician and interventional radiology.");
    steps.push("Lie the patient bleeding side down if the side is known; high-flow oxygen; two large-bore cannulae; crossmatch; CBC, coagulation, creatinine, blood gas.");
    steps.push(`Tranexamic acid 1 g IV over 10 minutes, then every 8 hours (or nebulised 500 mg three times daily).${x.anticoag ? " Stop and reverse anticoagulants (vitamin K, prothrombin complex concentrate, or specific reversal agent)." : ""}`);
    steps.push("Intubate with a large tube (8.0 or more) if the airway is threatened; selective intubation of the non-bleeding lung if needed.");
    steps.push("CT pulmonary/bronchial angiography once stable, then bronchial artery embolisation (first-line in most centres); rigid bronchoscopy or surgery if embolisation fails.");
    return { level, steps };
  }
  steps.push("Confirm it is from the lungs (frothy, bright red, with cough, alkaline) and not from the nose, mouth or stomach.");
  steps.push("Chest X-ray, CBC, coagulation, creatinine, urine dipstick (blood and protein: pulmonary-renal syndrome), oxygen saturation.");
  steps.push("Sputum CBNAAT/Truenat for TB (two samples) and AFB smear for everyone — TB and post-TB bronchiectasis or aspergilloma are the commonest causes in India.");
  if (x.dvtSigns) steps.push("Leg swelling, pleuritic pain or tachycardia: assess for pulmonary embolism (Wells, CTPA).");
  if (x.fever) steps.push("Fever and purulent sputum: pneumonia or infected bronchiectasis — sputum culture, antibiotics.");
  if (x.age >= 40 || x.smoker || x.weightLoss) steps.push("Age 40 or over, smoker or weight loss: urgent CT chest with contrast (and bronchoscopy if CT is abnormal or bleeding persists) for lung cancer.");
  if (x.tbHistory) steps.push("Past TB: CT chest for bronchiectasis, cavity or aspergilloma (Aspergillus IgG); recurrent bleeds may need embolisation or surgery.");
  steps.push(level === "moderate" ? "Moderate bleeding (30–200 mL a day): admit, oral tranexamic acid 1 g three times daily, CT angiography; refer to chest medicine." : "Small streaks: outpatient work-up if stable; tranexamic acid 500 mg–1 g three times daily for a few days can help persistent streaking.");
  if (x.anticoag) steps.push("On anticoagulants: check INR/levels; bleeding on anticoagulants still needs a cause found.");
  return { level, steps };
}

/* ================================================================== leg swelling */

export const WELLS_DVT = [
  ["Active cancer (treatment within 6 months or palliative)", 1],
  ["Paralysis, paresis or recent plaster cast of the leg", 1],
  ["Bedridden 3 days or more, or major surgery in the last 12 weeks", 1],
  ["Tenderness along the deep veins", 1],
  ["Entire leg swollen", 1],
  ["Calf more than 3 cm bigger than the other side (10 cm below tibial tuberosity)", 1],
  ["Pitting oedema in the symptomatic leg only", 1],
  ["Collateral superficial (non-varicose) veins", 1],
  ["Previous DVT", 1],
  ["Another diagnosis at least as likely as DVT", -2],
] as const;
export function wellsDvt(ticks: boolean[]): { score: number; likely: boolean; plan: string } {
  const score = WELLS_DVT.reduce((s, [, p], i) => s + (ticks[i] ? p : 0), 0);
  const likely = score >= 2;
  return {
    score, likely,
    plan: likely
      ? `Wells ${score}: DVT likely — proximal leg vein ultrasound within 4 hours (if delayed, D-dimer and interim anticoagulation); if negative, D-dimer and repeat scan in 6–8 days if D-dimer positive.`
      : `Wells ${score}: DVT unlikely — D-dimer; if positive, proximal leg vein ultrasound within 4 hours; if negative, DVT is excluded.`,
  };
}
export interface SwellingInput { bilateral: boolean; breathless: boolean; frothyUrine: boolean; jaundice: boolean; drugs: boolean; pregnant: boolean; nonPitting: boolean; filarialArea: boolean; redHot: boolean }
export function swellingPlan(x: SwellingInput): string[] {
  const s: string[] = [];
  if (!x.bilateral) {
    s.push("One leg: DVT until proved otherwise — use the Wells score below.");
    if (x.redHot) s.push("Red, hot, tender with fever: cellulitis (look for tinea between toes as the entry point); DVT can coexist.");
    s.push("Other causes: ruptured Baker's cyst (sudden calf pain behind the knee), muscle tear, trauma, compartment syndrome (pain out of proportion — emergency), pelvic mass compressing veins or lymphatics.");
  } else {
    s.push("Both legs: look for a systemic cause — urine dipstick for protein, creatinine, albumin, LFT, TSH, CBC, ECG; BNP and echo if breathless or raised JVP.");
    if (x.breathless) s.push("Breathless, orthopnoea or raised JVP: heart failure (or pulmonary hypertension, e.g. sleep apnoea) — BNP and echocardiogram.");
    if (x.frothyUrine) s.push("Frothy urine or periorbital puffiness: nephrotic syndrome — urine protein:creatinine ratio, albumin, lipids.");
    if (x.jaundice) s.push("Jaundice, ascites or spider naevi: cirrhosis — LFT, INR, ultrasound.");
    if (x.drugs) s.push("Medicines: amlodipine and other calcium-channel blockers (dose related), NSAIDs, steroids, pioglitazone, gabapentin/pregabalin, oestrogens — review and switch if possible.");
    if (x.pregnant) s.push("Pregnant: mild ankle oedema is common; sudden swelling of face/hands with high BP or protein is pre-eclampsia.");
    s.push("No systemic cause: chronic venous insufficiency (varicose veins, skin changes) — leg elevation and compression after checking ABPI; also low albumin from malnutrition.");
  }
  if (x.nonPitting) s.push("Non-pitting, thick skin, swollen toes (Stemmer sign): lymphoedema or myxoedema — check TSH.");
  if (x.filarialArea) s.push("Endemic area (lymphatic filariasis): filarial antigen test (FTS) or night blood smear; DEC + albendazole (with ivermectin under the national programme) and limb hygiene for lymphoedema.");
  return s;
}

/* ================================================================== palpitations */

export const PALP_FLAGS = [
  "Fainting or near-fainting with palpitations",
  "Palpitations during exercise",
  "Chest pain or breathlessness with them",
  "Family history of sudden death under 40 or inherited heart disease",
  "Known structural heart disease or heart failure",
  "Abnormal ECG (pre-excitation, long QT, Brugada, heart block, HCM pattern)",
];
export function qtcFlag(qtcMs: number, female: boolean): string {
  if (!qtcMs) return "";
  if (qtcMs >= 500) return `QTc ${qtcMs} ms: markedly prolonged — high risk of torsades; stop QT-prolonging drugs, check potassium and magnesium, cardiology now.`;
  if (qtcMs >= (female ? 470 : 460)) return `QTc ${qtcMs} ms: prolonged — review drugs and electrolytes; consider congenital long QT.`;
  if (qtcMs < 340) return `QTc ${qtcMs} ms: short — consider short QT syndrome; refer.`;
  return `QTc ${qtcMs} ms: normal.`;
}
export function palpPlan(flags: boolean[], freq: "daily" | "weekly" | "monthly" | "rare", triggers: boolean): { urgent: boolean; steps: string[] } {
  const urgent = flags.some(Boolean);
  const steps: string[] = [];
  if (urgent) steps.push("Red flags: same-day or urgent cardiology assessment — 12-lead ECG, echocardiogram, monitoring; avoid driving if fainting.");
  steps.push("12-lead ECG for everyone (during symptoms if possible; ask them to come in or record on a smartphone ECG during an episode).");
  steps.push("Bloods: CBC (anaemia), TSH, electrolytes including potassium and magnesium, calcium, glucose; pregnancy test if relevant.");
  steps.push(freq === "daily" ? "Daily symptoms: 24–48 hour Holter monitor." : freq === "weekly" ? "Weekly symptoms: 7–14 day patch monitor or event recorder." : freq === "monthly" ? "Monthly symptoms: external loop or event recorder, or a smartphone/watch ECG." : "Rare but troubling symptoms (especially with fainting): implantable loop recorder (cardiology).");
  if (triggers) steps.push("Common triggers: caffeine, energy drinks, alcohol, nicotine, cannabis, salbutamol, decongestants, excess levothyroxine, poor sleep, anxiety or panic.");
  steps.push("Echocardiogram if there is a murmur, abnormal ECG, heart failure signs or a family history of cardiomyopathy.");
  steps.push("Regular, sudden-onset and sudden-offset racing heart: likely SVT — teach the modified Valsalva manoeuvre; refer for ablation if recurrent. Irregular: think AF.");
  return { urgent, steps };
}

/* ================================================================== tremor */

export interface TremorInput { type: "rest" | "action" | "intention"; asymmetric: boolean; bradykinesia: boolean; familyHistory: boolean; alcoholHelps: boolean; headVoice: boolean; ataxia: boolean; age: number; drugs: boolean; thyroid: boolean; disabling: boolean }
export function tremorAssess(x: TremorInput): { likely: string; steps: string[] } {
  let likely = "Enhanced physiological tremor";
  if (x.type === "rest" || x.bradykinesia) likely = "Parkinsonian tremor";
  else if (x.type === "intention" || x.ataxia) likely = "Cerebellar tremor";
  else if (x.familyHistory || x.alcoholHelps || x.headVoice) likely = "Essential tremor";
  const steps: string[] = [];
  steps.push("Everyone: TSH, glucose, calcium, LFT, creatinine; review drugs (salbutamol, valproate, lithium, SSRIs, amiodarone, steroids, theophylline, metoclopramide, haloperidol) and caffeine; ask about alcohol withdrawal and anxiety.");
  if (x.age > 0 && x.age < 40) steps.push("Under 40: exclude Wilson's disease — serum ceruloplasmin, 24-hour urine copper, slit-lamp for Kayser–Fleischer rings.");
  if (x.thyroid) steps.push("Weight loss, heat intolerance, palpitations: hyperthyroidism — treat the cause (propranolol helps the tremor meanwhile).");
  if (likely === "Parkinsonian tremor") steps.push("Rest tremor with slowness or rigidity (often one side, pill-rolling): Parkinson's disease or drug-induced parkinsonism (antipsychotics, metoclopramide) — refer to neurology; no tests confirm it in clinic. See the Parkinson's Disease Medicines tool.");
  if (likely === "Cerebellar tremor") steps.push("Intention tremor with ataxia or nystagmus: cerebellar disease — MRI brain; consider alcohol, multiple sclerosis, stroke, drugs (phenytoin, lithium toxicity).");
  if (likely === "Essential tremor") {
    steps.push("Essential tremor: both hands on posture and action, often head or voice, family history, better with a little alcohol.");
    steps.push(x.disabling ? "Treat if it affects daily life: propranolol 10–20 mg twice daily, increasing to 40–80 mg twice daily (avoid in asthma) or primidone 25 mg at night, increasing slowly to 50–250 mg a day; topiramate is second line; deep brain stimulation or focused ultrasound if severe." : "Not disabling: reassure; no treatment needed; weighted cutlery, both-hand cups, and less caffeine help.");
  }
  if (likely === "Enhanced physiological tremor") steps.push("Fine, fast tremor of both hands with a trigger (drugs, thyroid, anxiety, caffeine, hypoglycaemia, withdrawal): remove the cause; propranolol as needed for anxiety-related tremor.");
  return { likely, steps };
}

/* ================================================================== limping child */

/** Kocher criteria (non-weight-bearing, fever over 38.5 °C, ESR over 40, WBC over 12,000): predicted probability of septic arthritis. */
export function kocher(nwb: boolean, fever: boolean, esr: number, wbc: number): { count: number; pct: string } {
  const count = [nwb, fever, esr > 40, wbc > 12].filter(Boolean).length;
  const pct = ["under 0.2%", "3%", "40%", "93%", "99.6%"][count];
  return { count, pct };
}
export interface LimpInput { ageYears: number; fever: boolean; nwb: boolean; esr: number; wbc: number; crp: number; nightPain: boolean; obese: boolean; bruising: boolean; weeks: number }
export function limpPlan(x: LimpInput): { urgent: boolean; steps: string[] } {
  const k = kocher(x.nwb, x.fever, x.esr, x.wbc);
  const urgent = x.fever || x.nwb || k.count >= 2 || x.crp > 20 || x.nightPain || x.bruising || (x.ageYears >= 9 && x.obese);
  const steps: string[] = [];
  steps.push(`Kocher ${k.count}/4: probability of septic arthritis ${k.pct}${x.crp > 20 ? "; CRP over 20 mg/L adds to the risk" : ""}.`);
  if (k.count >= 2 || (x.fever && x.crp > 20)) steps.push("Septic arthritis likely: urgent orthopaedics — hip ultrasound for effusion, aspiration (Gram stain, culture), IV antibiotics after aspiration (e.g. ceftriaxone, or cefazolin/cloxacillin), washout.");
  if (x.ageYears > 0 && x.ageYears < 3) steps.push("Under 3: toddler's fracture (X-ray tibia), developmental dysplasia of the hip, septic arthritis; any unexplained injury — think of non-accidental injury.");
  if (x.ageYears >= 3 && x.ageYears <= 10) steps.push("Age 3–10: transient synovitis is commonest (afebrile, well, recent viral illness, can bear some weight) — rest and ibuprofen, review in 24–48 hours; Perthes disease (ages 4–8, boys) if limp persists beyond 2 weeks — hip X-ray (AP and frog-leg).");
  if (x.ageYears >= 9) steps.push(`Age 9–16: slipped capital femoral epiphysis${x.obese ? " (obese child — high risk)" : ""} — hip and knee pain, limited internal rotation; urgent frog-leg lateral X-ray of both hips; no weight-bearing until seen.`);
  if (x.nightPain || x.bruising) steps.push("Night pain, bone pain, bruising, pallor or weight loss: CBC with blood film, LDH — leukaemia or bone tumour.");
  if (!urgent) steps.push(x.weeks >= 2 ? "Limp over 2 weeks: X-ray and orthopaedic review even if well." : "Well, afebrile, bearing weight: likely minor injury or transient synovitis — safety-net advice and review in 48 hours.");
  steps.push("Always examine the spine, abdomen, testes and the whole limb — hip pain is often felt in the knee.");
  return { urgent, steps };
}

/* ================================================================== recurrent abdominal pain in children */

export const RAP_FLAGS = [
  "Weight loss or slowing growth",
  "Blood in stool or vomit",
  "Persistent vomiting or chronic diarrhoea",
  "Pain away from the umbilicus (right upper or lower) or waking from sleep",
  "Unexplained fever",
  "Family history of IBD or coeliac disease",
  "Mouth ulcers, joint pain, perianal disease or delayed puberty",
  "Painful or difficult swallowing",
];
export function rapPlan(flags: boolean[], months: number, perMonth: number, constipation: boolean): { functional: boolean; steps: string[] } {
  const red = flags.some(Boolean);
  const functional = !red && months >= 2 && perMonth >= 4;
  const steps: string[] = [];
  if (red) steps.push("Alarm features: investigate and refer to paediatric gastroenterology — CBC, ESR/CRP, LFT, tTG-IgA, urine routine and culture, stool for occult blood and calprotectin, ultrasound abdomen.");
  else steps.push("No alarm features: limited tests only — CBC, ESR/CRP, tTG-IgA (coeliac), urine routine and culture, stool for ova, cysts and Giardia. More tests add worry, not answers.");
  if (functional) steps.push("Fits Rome IV functional abdominal pain (at least 4 episodes a month for 2 months, normal growth and examination): functional dyspepsia, IBS, abdominal migraine or functional abdominal pain.");
  if (constipation) steps.push("Constipation is the commonest organic cause: PEG (macrogol) daily, toilet sitting after meals, fluids and fibre — see Constipation & Enuresis (Children).");
  steps.push("Explain the gut–brain link; the pain is real but not dangerous; keep school attendance and normal activities; avoid rewarding pain behaviour.");
  steps.push("Look for stress: school, bullying, family conflict, exams; CBT, relaxation or gut-directed hypnotherapy work best; peppermint oil capsules can help IBS in older children.");
  steps.push("H. pylori testing only if there are peptic ulcer features or a family history of gastric cancer; avoid long PPI courses without a diagnosis.");
  return { functional, steps };
}

/* ================================================================== recurrent miscarriage */

export interface RmInput { losses: number; secondTrimester: boolean; age: number; bleedingNow: boolean; aps: boolean; tshHigh: boolean; uterineAnomaly: boolean; smoker: boolean; bmi: number }
export function rmPlan(x: RmInput): { recurrent: boolean; steps: string[] } {
  const recurrent = x.losses >= 2 || x.secondTrimester;
  const steps: string[] = [];
  steps.push(recurrent ? `${x.losses} losses: recurrent pregnancy loss (2 or more by ESHRE 2022; RCOG 2023 offers full tests after 3, and after 1 second-trimester loss).` : "One loss: usually chromosomal and chance; no tests needed — offer support and early pregnancy scan next time.");
  if (recurrent) {
    steps.push("Tests: antiphospholipid antibodies (lupus anticoagulant, anticardiolipin and anti-β2-glycoprotein I), repeated after 12 weeks if positive; TSH and TPO antibodies; HbA1c; pelvic ultrasound (3D) for uterine anomalies; cytogenetics of pregnancy tissue from the third and later losses.");
    steps.push("Parental karyotype only if the pregnancy tissue shows an unbalanced translocation. Inherited thrombophilia testing only for second-trimester losses.");
    if (x.secondTrimester) steps.push("Second-trimester loss: assess for cervical weakness (transvaginal cervical length scans from 14–16 weeks next pregnancy; cerclage if short).");
  }
  if (x.aps) steps.push("Antiphospholipid syndrome: low-dose aspirin 75–150 mg daily from a positive pregnancy test plus prophylactic LMWH (e.g. enoxaparin 40 mg daily) from the fetal heartbeat until 6 weeks after birth.");
  if (x.bleedingNow) steps.push("Bleeding in this pregnancy with a previous miscarriage: vaginal micronised progesterone 400 mg twice daily until 16 weeks (PRISM).");
  if (x.tshHigh) steps.push("Subclinical hypothyroidism (TSH over 4) with TPO antibodies: levothyroxine 25–50 µg daily, aim TSH under 2.5 before and in early pregnancy.");
  if (x.uterineAnomaly) steps.push("Septate uterus: hysteroscopic septum resection can be discussed (evidence mixed); fibroids distorting the cavity: myomectomy.");
  steps.push(`Lifestyle: stop smoking${x.smoker ? " (applies here)" : ""}, alcohol none, caffeine under 200 mg a day, folic acid 400 µg (5 mg if BMI over 30 or diabetes)${x.bmi >= 30 ? ", weight loss towards BMI under 30" : ""}.`);
  if (x.age >= 40) steps.push("Age 40 or over: miscarriage risk rises steeply with age (chromosomal); discuss options early, including fertility referral.");
  steps.push("Unexplained recurrent loss still has a good outlook (about 2 in 3 have a live birth next time); supportive care in an early pregnancy unit improves outcomes. Do not use steroids, IVIG, hCG or heparin without APS.");
  return { recurrent, steps };
}

/* ================================================================== mastitis and breast abscess */

export interface MastitisInput { lactating: boolean; hours: number; unwell: boolean; fluctuant: boolean; allergy: boolean; notSettling: boolean; smoker: boolean; mrsa: boolean }
export function mastitisPlan(x: MastitisInput): { level: "conservative" | "antibiotics" | "abscess" | "refer"; steps: string[] } {
  const steps: string[] = [];
  if (x.fluctuant) {
    steps.push("Fluctuant or persistent lump: breast abscess — ultrasound, then needle aspiration (repeat every 2–3 days as needed) or incision and drainage; send pus for culture.");
    steps.push(x.lactating ? "Keep breastfeeding from both breasts (or express the affected side if the wound is near the nipple); antibiotics as below." : "Non-lactating abscess: refer to the breast team (periductal mastitis in smokers, recurrence is common).");
  }
  if (x.lactating) {
    steps.push("Keep feeding normally — do not stop; avoid over-pumping and deep massage (2022 ABM guidance); cold packs, well-fitting bra, ibuprofen 400 mg three times daily and paracetamol.");
    const abx = x.unwell || x.hours >= 24 || x.fluctuant;
    if (abx) {
      steps.push(x.allergy ? "Antibiotics (penicillin allergy): clarithromycin 500 mg twice daily or clindamycin 300 mg four times daily for 10–14 days." : `Antibiotics: ${x.mrsa ? "MRSA risk — clindamycin 300 mg four times daily or co-trimoxazole (avoid if baby is under 1 month or jaundiced)" : "cloxacillin or flucloxacillin 500 mg four times daily, or cephalexin 500 mg four times daily"} for 10–14 days; all are compatible with breastfeeding.`);
      steps.push("Milk culture if severe, recurrent, hospital-acquired or not improving after 48 hours.");
    } else steps.push("Under 24 hours and well: conservative measures first; start antibiotics if no better in 12–24 hours or she becomes unwell.");
    if (x.unwell) steps.push("Fever with rigors, tachycardia or hypotension: admit for IV antibiotics (sepsis screen).");
  } else if (!x.fluctuant) {
    steps.push(`Non-lactating mastitis: ${x.smoker ? "periductal mastitis is linked to smoking — stop smoking; " : ""}co-amoxiclav 625 mg three times daily (or clarithromycin plus metronidazole if allergic) for 7–14 days; refer to the breast clinic.`);
  }
  if (x.notSettling) steps.push("Not settling after a week of antibiotics, or no lump resolution: urgent triple assessment to exclude inflammatory breast cancer.");
  const level = x.notSettling ? "refer" : x.fluctuant ? "abscess" : x.unwell || x.hours >= 24 || !x.lactating ? "antibiotics" : "conservative";
  return { level, steps };
}

/* ================================================================== epistaxis (mine) */

export interface EpistaxisInput { active: boolean; minutesPressure: number; posterior: boolean; unstable: boolean; anticoag: boolean; recurrent: boolean; adolescentMale: boolean; telangiectasia: boolean; child: boolean }
export function epistaxisPlan(x: EpistaxisInput): { level: "first-aid" | "treat" | "admit"; steps: string[] } {
  const steps: string[] = [];
  const admit = x.unstable || x.posterior;
  if (x.unstable) steps.push("Shock or heavy ongoing bleeding: ABC, IV access, CBC, group and crossmatch, coagulation; ENT emergency.");
  steps.push("First aid: sit up, lean forward, mouth open; pinch the soft part of the nose firmly for 10–15 minutes without letting go; ice to the mouth or neck.");
  if (x.active && x.minutesPressure >= 10) {
    steps.push("Still bleeding after 10–15 minutes of pressure: clear clots, look with a headlight; vasoconstrictor and local anaesthetic spray or soaked pledget (e.g. xylometazoline with lidocaine).");
    steps.push("Visible anterior bleeding point: silver nitrate cautery (one side of the septum at a time, never both sides at once).");
    steps.push("Not controlled: anterior nasal pack (Merocel or Rapid Rhino) — admit or ENT review; topical tranexamic acid on a pledget can help.");
  }
  if (x.posterior) steps.push("Posterior bleed (bleeding into the throat from both sides, not controlled by anterior pack): admit under ENT — posterior pack or balloon, consider sphenopalatine artery ligation or embolisation.");
  if (x.anticoag) steps.push("On anticoagulants or antiplatelets: check INR or level; do not stop routinely for a minor bleed — discuss with the prescriber if bleeding is heavy or recurrent.");
  steps.push("Check blood pressure (do not lower it acutely just because of the nosebleed; treat hypertension long-term).");
  steps.push(`After it stops: ${x.child ? "chlorhexidine–neomycin cream (Naseptin; contains arachis oil — not with peanut allergy) twice daily for 2 weeks or petroleum jelly" : "chlorhexidine–neomycin cream (Naseptin) four times daily for 10 days or petroleum jelly"}; no nose blowing, picking, hot drinks, alcohol or heavy lifting for 24–48 hours.`);
  if (x.recurrent) steps.push("Recurrent: CBC and coagulation; ENT for cautery under vision; look at the septum (perforation, tumour).");
  if (x.adolescentMale) steps.push("Teenage boy with recurrent one-sided bleeds and nasal blockage: juvenile nasopharyngeal angiofibroma — urgent ENT; no biopsy in clinic.");
  if (x.telangiectasia) steps.push("Telangiectasia on lips, tongue or fingers with recurrent nosebleeds: hereditary haemorrhagic telangiectasia — refer; screen for lung and brain AVMs.");
  return { level: admit ? "admit" : x.active && x.minutesPressure >= 10 ? "treat" : "first-aid", steps };
}

/* ================================================================== mouth ulcers (mine) */

export interface MouthUlcerInput { weeks: number; single: boolean; tobacco: boolean; indurated: boolean; recurrent: boolean; genital: boolean; eye: boolean; gut: boolean; vesicles: boolean; child: boolean; kg: number }
export function mouthUlcerPlan(x: MouthUlcerInput): { urgent: boolean; steps: string[] } {
  const urgent = (x.single && x.weeks >= 3) || x.indurated;
  const steps: string[] = [];
  if (urgent) steps.push(`A single ulcer for 3 weeks or more${x.indurated ? ", or a hard, raised, or fixed ulcer" : ""}: urgent referral (oral and maxillofacial or ENT) for biopsy to exclude oral cancer${x.tobacco ? " — high risk with tobacco, gutka, areca nut or betel quid" : ""}. Also look for leukoplakia and erythroplakia.`);
  if (x.vesicles) steps.push(x.child ? `Vesicles with fever and swollen gums: herpetic gingivostomatitis — aciclovir ${x.kg ? `${Math.min(200, Math.round(x.kg * 15))} mg` : "15 mg/kg (max 200 mg)"} five times daily for 7 days if within 72 hours of onset; fluids and paracetamol; watch for dehydration.` : "Vesicles: herpes simplex (aciclovir 400 mg three times daily for 5–7 days if early); hand-foot-and-mouth disease in children.");
  if (x.recurrent) steps.push("Recurrent ulcers: CBC, ferritin, vitamin B12, folate, tTG-IgA (coeliac); review drugs (nicorandil, NSAIDs, methotrexate, beta-blockers); HIV if risk factors.");
  if (x.genital || x.eye) steps.push("Genital ulcers or red, painful eyes as well: Behçet's disease (or reactive arthritis, SLE) — refer to rheumatology; urgent ophthalmology if vision is affected.");
  if (x.gut) steps.push("Abdominal pain, diarrhoea or weight loss: Crohn's disease or coeliac disease — investigate.");
  steps.push("Recurrent aphthous ulcers: chlorhexidine 0.2% mouthwash twice daily; benzydamine spray or rinse for pain; topical steroid — triamcinolone 0.1% in Orabase up to four times daily, or betamethasone 500 µg soluble tablet in 20 mL water as a mouthwash (not swallowed) up to four times daily, from the first tingle.");
  steps.push("Avoid toothpaste with sodium lauryl sulphate, sharp or spicy food, and trauma (sharp teeth, ill-fitting dentures — dental review).");
  return { urgent, steps };
}

/* ================================================================== heel pain (mine) */

export interface HeelInput { firstStep: boolean; posterior: boolean; nightPain: boolean; inflammatory: boolean; numbness: boolean; squeeze: boolean; months: number; bmi: number }
export function heelPlan(x: HeelInput): { dx: string; refer: boolean; steps: string[] } {
  const refer = x.nightPain || x.inflammatory || x.squeeze;
  let dx = x.posterior ? "Achilles tendinopathy or insertional heel pain" : x.firstStep ? "Plantar fasciitis (plantar heel pain)" : "Heel pain, cause not clear";
  if (x.squeeze) dx = "Possible calcaneal stress fracture";
  if (x.numbness) dx = "Possible tarsal tunnel syndrome or nerve entrapment";
  const steps: string[] = [];
  if (x.squeeze) steps.push("Pain on squeezing the heel from the sides (runners, osteoporosis): calcaneal stress fracture — X-ray (MRI if normal); offload.");
  if (x.nightPain) steps.push("Pain at night or at rest: exclude infection, tumour or fracture — X-ray, ESR/CRP.");
  if (x.inflammatory) steps.push("Both heels with back stiffness, other swollen joints, psoriasis, uveitis or bowel disease: spondyloarthritis (enthesitis) — ESR/CRP, HLA-B27, rheumatology.");
  if (x.numbness) steps.push("Burning, tingling or numbness in the sole: tarsal tunnel syndrome or neuropathy — check sensation, Tinel's behind the medial malleolus; nerve conduction if persistent.");
  if (x.posterior) steps.push("Achilles: eccentric calf (heel-drop) exercises daily for 12 weeks, heel raise in shoes, avoid steroid injection into the tendon (rupture risk); sudden snap with weakness = rupture (Simmonds' test) — same-day referral.");
  else {
    steps.push("Plantar fasciitis: calf and plantar fascia stretches 3 times a day (and before the first steps in the morning), cushioned heel cups or insoles, supportive shoes, no barefoot walking on hard floors.");
    steps.push(`Ice massage (rolling a frozen bottle) 10 minutes after activity; short NSAID course if no contraindication${x.bmi >= 30 ? "; weight loss helps (BMI over 30)" : ""}.`);
    steps.push(x.months >= 6 ? "Over 6 months despite this: night splints, extracorporeal shockwave therapy, or a single steroid injection (risk of fat pad atrophy and fascia rupture); refer to orthopaedics or podiatry." : "Most cases settle within 6–12 months with these measures; review at 6–8 weeks.");
  }
  return { dx, refer, steps };
}

/* ================================================================== gynaecomastia (mine) */

export interface GynaeInput { age: number; hardEccentric: boolean; testicularMass: boolean; drugs: boolean; liver: boolean; kidney: boolean; painfulMonths: number; rapid: boolean }
export function gynaePlan(x: GynaeInput): { urgent: boolean; steps: string[] } {
  const urgent = x.hardEccentric || x.testicularMass || x.rapid;
  const pubertal = x.age >= 10 && x.age <= 18;
  const steps: string[] = [];
  steps.push("Confirm true gynaecomastia: a firm, rubbery disc of tissue under and around the nipple (pinch test), not just fat (pseudogynaecomastia).");
  if (x.hardEccentric) steps.push("Hard, eccentric, fixed lump, skin or nipple changes, nipple discharge or axillary nodes: urgent breast clinic (triple assessment) — male breast cancer.");
  if (x.testicularMass || x.rapid) steps.push("Testicular lump or rapidly growing breasts: testicular ultrasound and β-hCG, AFP, oestradiol urgently — germ cell or Leydig cell tumour.");
  if (pubertal && !urgent) steps.push("Pubertal gynaecomastia (common, often one side first, tender): reassure; most settle in 6 months to 2 years; check testes and for anabolic steroid or cannabis use; review in 6 months.");
  if (x.drugs) steps.push("Medicines: spironolactone (switch to eplerenone), finasteride/dutasteride, cimetidine, ketoconazole, digoxin, anabolic steroids, antipsychotics (prolactin), efavirenz, alcohol and cannabis — stop or switch if possible; it may regress in 1–3 months.");
  if (x.liver) steps.push("Cirrhosis or heavy alcohol: common cause — LFT.");
  if (x.kidney) steps.push("CKD or dialysis: common — creatinine.");
  if (!pubertal || urgent) steps.push("Adults without a clear drug cause: LFT, creatinine, TSH, morning testosterone, LH, FSH, oestradiol, prolactin, β-hCG; testicular ultrasound if hormones are abnormal. Low testosterone with high LH in a young man: Klinefelter syndrome (karyotype).");
  if (x.painfulMonths > 0 && x.painfulMonths <= 24) steps.push("Painful, recent (under 1–2 years) and persistent: tamoxifen 10–20 mg daily for 3 months (specialist, off-label) can shrink it.");
  else if (x.painfulMonths > 24) steps.push("Long-standing (over 2 years): fibrous, unlikely to respond to drugs — surgery (subcutaneous mastectomy, liposuction) if it bothers him.");
  return { urgent, steps };
}
