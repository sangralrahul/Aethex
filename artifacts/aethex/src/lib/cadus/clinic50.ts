/**
 * Update 50, on the device (no AI): lupus (SLE), PMR and giant cell arteritis, bronchiectasis,
 * hyperprolactinaemia, ankle sprain and foot injuries, trigger finger and De Quervain's, skin lumps,
 * phimosis and balanitis, erectile dysfunction, persistent hiccups, nocturnal leg cramps, and insect
 * bites and stings.
 */

export type Urgency = "emergency" | "urgent" | "routine";
const worse = (a: Urgency, b: Urgency): Urgency => (a === "emergency" || b === "emergency" ? "emergency" : a === "urgent" || b === "urgent" ? "urgent" : "routine");

/* ================================================================== lupus (2019 EULAR/ACR) */

/** Each criterion: [key, domain, weight, label]. Only the highest weight in a domain counts. */
export const SLE_CRITERIA: [string, string, number, string][] = [
  ["fever", "Constitutional", 2, "Fever over 38.3 °C"],
  ["leukopenia", "Haematological", 3, "Leukopenia under 4,000/mm³"],
  ["thrombocytopenia", "Haematological", 4, "Platelets under 1 lakh/mm³"],
  ["haemolysis", "Haematological", 4, "Autoimmune haemolysis"],
  ["delirium", "Neuropsychiatric", 2, "Delirium"],
  ["psychosis", "Neuropsychiatric", 3, "Psychosis"],
  ["seizure", "Neuropsychiatric", 5, "Seizure"],
  ["alopecia", "Mucocutaneous", 2, "Non-scarring alopecia"],
  ["oralUlcers", "Mucocutaneous", 2, "Oral ulcers"],
  ["discoid", "Mucocutaneous", 4, "Subacute cutaneous or discoid lupus"],
  ["acuteRash", "Mucocutaneous", 6, "Acute cutaneous lupus (malar rash)"],
  ["effusion", "Serosal", 5, "Pleural or pericardial effusion"],
  ["pericarditis", "Serosal", 6, "Acute pericarditis"],
  ["joints", "Musculoskeletal", 6, "Synovitis or tender joints (2 or more) with morning stiffness"],
  ["proteinuria", "Renal", 4, "Proteinuria over 0.5 g/24 h"],
  ["nephritisII_V", "Renal", 8, "Biopsy: class II or V lupus nephritis"],
  ["nephritisIII_IV", "Renal", 10, "Biopsy: class III or IV lupus nephritis"],
  ["apl", "Antiphospholipid antibodies", 2, "Anticardiolipin, anti-β2GP1 or lupus anticoagulant"],
  ["lowC3orC4", "Complement", 3, "Low C3 or low C4"],
  ["lowC3andC4", "Complement", 4, "Low C3 and low C4"],
  ["dsdnaSm", "SLE-specific antibodies", 6, "Anti-dsDNA or anti-Smith"],
];

export function sleScore(ana: boolean, picked: string[]): { score: number; classified: boolean; domains: Record<string, number> } {
  const domains: Record<string, number> = {};
  for (const [k, d, w] of SLE_CRITERIA) if (picked.includes(k)) domains[d] = Math.max(domains[d] ?? 0, w);
  const score = Object.values(domains).reduce((a, b) => a + b, 0);
  const clinical = ["Constitutional", "Haematological", "Neuropsychiatric", "Mucocutaneous", "Serosal", "Musculoskeletal", "Renal"].some((d) => domains[d]);
  return { score, classified: ana && score >= 10 && clinical, domains };
}

export interface SleInput { ana: boolean; picked: string[]; pregnantOrPlanning: boolean; onHcq: boolean; hcqYears: number; weightKg: number; fever: boolean }
export function slePlan(x: SleInput): { urgency: Urgency; score: number; classified: boolean; steps: string[] } {
  const r = sleScore(x.ana, x.picked);
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (!x.ana) s.push("ANA under 1:80 (on HEp-2 cells): the entry criterion is not met — SLE is unlikely; reconsider other causes (viral illness, drug reaction, other connective tissue disease).");
  else s.push(r.classified ? `Score ${r.score} (10 or more with ANA 1:80 or higher and at least one clinical criterion): meets 2019 EULAR/ACR classification for SLE.` : `Score ${r.score}: below the classification threshold of 10. Classification criteria are for research; a rheumatologist may still diagnose early lupus.`);
  if (x.picked.some((k) => k.startsWith("nephritis") || k === "proteinuria")) { urgency = "urgent"; s.push("Kidney involvement: urine ACR or PCR, urine microscopy for red cell casts, creatinine and BP — refer to nephrology for biopsy; lupus nephritis needs induction treatment (mycophenolate or cyclophosphamide with steroids)."); }
  if (x.picked.some((k) => ["seizure", "psychosis", "delirium", "thrombocytopenia", "haemolysis", "pericarditis"].includes(k))) { urgency = "urgent"; s.push("Major organ involvement (neuropsychiatric, severe cytopenia, serositis): same-week rheumatology review; severe flares may need IV methylprednisolone."); }
  if (x.fever) s.push("Fever in a lupus patient: rule out infection first (especially if on steroids or immunosuppressants) before calling it a flare.");
  const maxHcq = x.weightKg > 0 ? Math.min(400, Math.floor((5 * x.weightKg) / 50) * 50) : 0;
  s.push(`Hydroxychloroquine for everyone with SLE unless contraindicated: up to 5 mg/kg actual body weight a day${maxHcq ? ` (about ${maxHcq} mg a day for ${x.weightKg} kg)` : ""}, maximum 400 mg. It reduces flares, organ damage and clotting.`);
  s.push(x.onHcq && x.hcqYears >= 5 ? "On hydroxychloroquine for 5 years or more: annual retinal screening (OCT and visual fields)." : "Baseline eye examination within the first year of hydroxychloroquine, then yearly from 5 years (sooner with kidney disease or tamoxifen).");
  s.push("Steroids at the lowest dose and for the shortest time (aim under 7.5 mg prednisolone a day for maintenance); steroid-sparing drugs (azathioprine, mycophenolate, methotrexate) by the rheumatologist; bone protection, calcium and vitamin D.");
  s.push("Every visit: BP, urine dipstick and ACR, CBC, creatinine; C3, C4 and anti-dsDNA to track activity. Sun protection (SPF 50), stop smoking, vaccinate (influenza, pneumococcal; avoid live vaccines on immunosuppression), cardiovascular risk.");
  if (x.pregnantOrPlanning) s.push("Pregnancy: plan when disease has been quiet for 6 months; continue hydroxychloroquine; check anti-Ro/La (congenital heart block) and antiphospholipid antibodies (aspirin and heparin if positive); stop mycophenolate, methotrexate and cyclophosphamide well before conception; high-risk obstetric care.");
  return { urgency, score: r.score, classified: r.classified, steps: s };
}

/* ================================================================== PMR and GCA */

export interface PmrInput { age: number; shoulders: boolean; hips: boolean; stiffness45: boolean; raisedEsrCrp: boolean; headache: boolean; scalp: boolean; jaw: boolean; visual: boolean; systemic: boolean; peripheralSynovitis: boolean; weightKg: number }
export function pmrPlan(x: PmrInput): { dx: "gca" | "pmr" | "possible" | "unlikely"; urgency: Urgency; steps: string[] } {
  const gcaFeatures = [x.headache, x.scalp, x.jaw, x.visual].filter(Boolean).length;
  const over50 = x.age >= 50;
  const s: string[] = [];
  let dx: "gca" | "pmr" | "possible" | "unlikely" = "unlikely";
  let urgency: Urgency = "routine";
  if (over50 && (gcaFeatures >= 1)) {
    dx = "gca";
    urgency = x.visual ? "emergency" : "urgent";
    s.push(`Possible giant cell arteritis (${[x.headache && "new headache", x.scalp && "scalp tenderness", x.jaw && "jaw claudication", x.visual && "visual symptoms"].filter(Boolean).join(", ")}): treat the same day — don't wait for tests.`);
    s.push(x.visual ? "Visual loss or amaurosis: IV methylprednisolone 500 mg–1 g daily for 3 days, then oral prednisolone 60 mg; same-day ophthalmology." : `No visual loss: prednisolone 40–60 mg once daily${x.weightKg ? ` (do not exceed 1 mg/kg — about ${Math.min(60, Math.round(x.weightKg / 5) * 5)} mg)` : ""}.`);
    s.push("ESR, CRP and CBC before the first dose; temporal artery ultrasound (halo sign) or biopsy within 1–2 weeks of starting steroids; refer to the fast-track GCA pathway or rheumatology.");
    s.push("Taper over 12–18 months guided by symptoms and CRP; tocilizumab for relapse or high steroid toxicity risk. Add a PPI and bone protection; watch glucose and BP.");
  }
  const pmrCore = over50 && x.shoulders && x.stiffness45 && x.raisedEsrCrp;
  if (pmrCore && dx !== "gca") { dx = "pmr"; s.push("Polymyalgia rheumatica likely: age 50 or over, bilateral shoulder (and often hip) aching, morning stiffness over 45 minutes, raised ESR or CRP."); }
  else if (over50 && x.shoulders && dx !== "gca") { dx = "possible"; s.push("Some PMR features: check ESR, CRP, CBC, U&E, LFT, calcium, TSH, CK, vitamin D, protein electrophoresis, urine dipstick and rheumatoid factor/anti-CCP to exclude mimics."); }
  if (!over50 && dx === "unlikely") s.push("Under 50: PMR and GCA are very unlikely — consider other causes (rotator cuff disease, inflammatory arthritis, hypothyroidism, myositis, statin myalgia).");
  if (dx === "pmr" || dx === "possible") {
    if (x.systemic) { urgency = worse(urgency, "urgent"); s.push("Weight loss, night sweats or fever: exclude cancer, infection (TB, endocarditis) and myeloma before starting steroids."); }
    if (x.peripheralSynovitis) s.push("Swollen small joints: consider elderly-onset rheumatoid arthritis — rheumatology referral.");
    s.push("Prednisolone 15 mg daily. Expect a big improvement within a week; if not, rethink the diagnosis.");
    s.push("Taper (BSR): 15 mg for 3 weeks, 12.5 mg for 3 weeks, 10 mg for 4–6 weeks, then reduce by 1 mg every 4–8 weeks. Treatment usually lasts 1–2 years.");
    s.push("Bone protection (calcium, vitamin D, bisphosphonate if needed), steroid card, glucose and BP checks. Warn about GCA symptoms: new headache, jaw pain or visual change means same-day review.");
  }
  return { dx, urgency, steps: s };
}

/* ================================================================== bronchiectasis */

export interface BronchInput { exacSymptoms: string[]; exacPerYear: number; pseudomonas: boolean; newPseudomonas: boolean; haemoptysisMassive: boolean; unwell: boolean; age: number; newlyDiagnosed: boolean }
export const BRONCH_EXAC_SYMPTOMS = ["Cough", "Sputum volume or thickness", "Sputum purulence", "Breathlessness", "Fatigue or malaise", "Haemoptysis"];
export function bronchPlan(x: BronchInput): { exacerbation: boolean; urgency: Urgency; steps: string[] } {
  const exacerbation = x.exacSymptoms.length >= 3;
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.haemoptysisMassive) { urgency = "emergency"; s.push("Massive haemoptysis (over 200 mL, or any amount with breathlessness or low oxygen): lie on the bleeding side, oxygen, IV access, tranexamic acid, emergency CT angiography and bronchial artery embolisation."); }
  if (exacerbation) {
    urgency = worse(urgency, x.unwell ? "emergency" : "urgent");
    s.push("Exacerbation (3 or more symptoms worse for 48 hours): send sputum for culture before antibiotics, then treat for 14 days.");
    s.push(x.pseudomonas ? "Known Pseudomonas: oral ciprofloxacin 500–750 mg twice daily for 14 days; IV anti-pseudomonal antibiotics if unwell or not responding." : "No Pseudomonas: amoxicillin 500 mg three times daily (or clarithromycin 500 mg twice daily if allergic) for 14 days; adjust to previous sputum results.");
    if (x.unwell) s.push("Unwell (low oxygen, hypotension, confusion, high fever): admit for IV antibiotics.");
  }
  if (x.newPseudomonas) s.push("First isolation of Pseudomonas: try eradication — ciprofloxacin for 2 weeks, then inhaled colistin or gentamicin for 3 months; IV antibiotics if ciprofloxacin fails.");
  if (x.exacPerYear >= 3) s.push("Three or more exacerbations a year despite airway clearance: long-term azithromycin (250 mg daily or 500 mg three times a week) after excluding non-tuberculous mycobacteria (3 sputum AFB cultures), with ECG for QTc and hearing check; inhaled colistin or gentamicin if Pseudomonas.");
  if (x.newlyDiagnosed) s.push(`Work-up: HRCT confirms the diagnosis; CBC, IgG/IgA/IgM, total IgE and Aspergillus-specific IgE (ABPA), sputum culture and AFB smear and culture (TB is a common cause in India), rheumatoid factor; ${x.age > 0 && x.age < 40 ? "under 40: sweat test or CF genetics and primary ciliary dyskinesia work-up; " : ""}alpha-1 antitrypsin if basal emphysema.`);
  s.push("Daily airway clearance taught by a physiotherapist (active cycle of breathing, oscillating PEP device), twice a day when producing sputum; hypertonic saline if sputum is thick.");
  s.push("Pulmonary rehabilitation if breathless; influenza vaccine yearly and pneumococcal vaccine; inhaled steroids only for co-existing asthma or COPD; stop smoking.");
  return { exacerbation, urgency, steps: s };
}

/* ================================================================== hyperprolactinaemia */

export const PRL_MIU_PER_NG = 21.2;
export function prlBand(value: number, unit: "ng/mL" | "mIU/L", sex: "female" | "male"): { ng: number; band: "normal" | "mild" | "moderate" | "high" | "very high" } {
  const ng = unit === "mIU/L" ? value / PRL_MIU_PER_NG : value;
  const upper = sex === "male" ? 20 : 25;
  const band = !(ng > upper) ? "normal" : ng <= 100 ? "mild" : ng <= 200 ? "moderate" : ng <= 500 ? "high" : "very high";
  return { ng: Math.round(ng * 10) / 10, band };
}
export interface PrlInput { value: number; unit: "ng/mL" | "mIU/L"; sex: "female" | "male"; drugs: boolean; pregnant: boolean; hypothyroid: boolean; ckd: boolean; symptoms: boolean; headacheVisual: boolean; largeMass: boolean }
export function prlPlan(x: PrlInput): { band: string; ng: number; urgency: Urgency; steps: string[] } {
  const { ng, band } = prlBand(x.value, x.unit, x.sex);
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (!(x.value > 0)) return { band: "none", ng: 0, urgency, steps: ["Enter a prolactin level."] };
  if (band === "normal") { s.push("Prolactin is within the normal range."); return { band, ng, urgency, steps: s }; }
  s.push(`Prolactin about ${ng} ng/mL (${Math.round(ng * PRL_MIU_PER_NG)} mIU/L): ${band === "mild" ? "mildly raised — stress, venepuncture, drugs, hypothyroidism, a microprolactinoma or stalk compression" : band === "moderate" ? "moderately raised — drugs or a microprolactinoma most likely" : band === "high" ? "high — a prolactinoma is likely (drugs rarely raise it this far)" : "very high — almost always a macroprolactinoma"}.`);
  if (band === "mild" && !x.symptoms) s.push("Mild and no symptoms: repeat a resting sample (cannulated, 30 minutes rest) and ask the lab to screen for macroprolactin — a big, inactive form that needs no treatment.");
  if (x.pregnant) s.push("Pregnancy and breastfeeding raise prolactin normally — a pregnancy test comes first in any woman of reproductive age.");
  if (x.drugs) s.push("Drug causes: antipsychotics (risperidone, amisulpride, haloperidol), metoclopramide, domperidone, some antidepressants, verapamil, methyldopa, opioids. Recheck off the drug if safe; for antipsychotics, discuss with the psychiatrist (switching to aripiprazole or adding low-dose aripiprazole often helps) — don't stop them yourself.");
  if (x.hypothyroid) s.push("Primary hypothyroidism raises prolactin: treat with levothyroxine and recheck.");
  if (x.ckd) s.push("Kidney failure reduces clearance of prolactin: mild rises are common.");
  s.push("Tests: TSH, free T4, pregnancy test, creatinine, LH/FSH, estradiol or testosterone; MRI pituitary when no drug or other cause explains it.");
  if (x.headacheVisual || x.largeMass || band === "very high") { urgency = "urgent"; s.push("Headache, visual field loss or a large tumour: urgent visual fields and endocrinology; check the rest of pituitary function (cortisol, IGF-1)."); }
  if (x.largeMass && band !== "high" && band !== "very high") s.push("A large pituitary mass with only a mildly raised prolactin: ask the lab to dilute the sample (hook effect) — otherwise it may be a non-functioning adenoma compressing the stalk.");
  s.push("Prolactinoma: cabergoline 0.25–0.5 mg once or twice a week, increased monthly by prolactin level; most tumours shrink. Echo before and periodically on higher doses; watch for impulse-control problems. Surgery if intolerant or resistant. Treat to restore periods, fertility, libido and bone health.");
  return { band, ng, urgency, steps: s };
}

/* ================================================================== ankle sprain and foot injuries (Ottawa) */

export interface AnkleInput { malleolarPain: boolean; lateralTip: boolean; medialTip: boolean; midfootPain: boolean; fifthMetBase: boolean; navicular: boolean; cantBearWeight: boolean; deformity: boolean; neurovascular: boolean; open: boolean; achilles: boolean; highAnkle: boolean; grade: 0 | 1 | 2 | 3 }
export function ottawa(x: AnkleInput): { ankleXray: boolean; footXray: boolean } {
  return {
    ankleXray: x.malleolarPain && (x.lateralTip || x.medialTip || x.cantBearWeight),
    footXray: x.midfootPain && (x.fifthMetBase || x.navicular || x.cantBearWeight),
  };
}
export function anklePlan(x: AnkleInput): { urgency: Urgency; ankleXray: boolean; footXray: boolean; steps: string[] } {
  const o = ottawa(x);
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.open || x.neurovascular || x.deformity) { urgency = "emergency"; s.push(`${x.open ? "Open wound over a possible fracture: IV antibiotics, tetanus, sterile dressing, orthopaedics now. " : ""}${x.deformity ? "Obvious deformity: dislocation or fracture-dislocation — reduce urgently if the foot is pale or numb, then X-ray. " : ""}${x.neurovascular ? "Pale, cold, pulseless or numb foot: emergency reduction and orthopaedic review." : ""}`.trim()); }
  s.push(o.ankleXray ? "Ottawa ankle rule positive: X-ray the ankle (AP, lateral, mortise)." : "Ottawa ankle rule negative: an ankle X-ray is not needed (rule out fracture with about 98% sensitivity).");
  s.push(o.footXray ? "Ottawa foot rule positive: X-ray the foot (base of 5th metatarsal, navicular)." : x.midfootPain ? "Ottawa foot rule negative: a foot X-ray is not needed." : "No midfoot pain: the foot rule doesn't apply.");
  if (x.achilles) { urgency = worse(urgency, "urgent"); s.push("Possible Achilles tendon rupture (a 'kick' in the calf, gap, positive Simmonds/Thompson squeeze test): equinus boot or cast and orthopaedic review within 24–48 hours."); }
  if (x.highAnkle) s.push("Pain above the ankle with a positive squeeze test or pain on external rotation: high (syndesmotic) ankle sprain — slower recovery; X-ray (fibula), and refer if the mortise is widened.");
  if (x.grade) s.push(`Grade ${x.grade} sprain (${x.grade === 1 ? "stretch, little swelling, can walk" : x.grade === 2 ? "partial tear, bruising, painful walking" : "complete tear, marked swelling, unstable, can't bear weight"}).`);
  s.push("First days: protect, elevate, ice for 15–20 minutes every 2–3 hours, compression; paracetamol or a short NSAID course (avoid NSAIDs in the first 48 hours if bleeding risk). Walk as pain allows — early weight bearing heals faster.");
  s.push(x.grade >= 2 ? "Grade 2–3: lace-up brace or semi-rigid ankle support for 4–6 weeks; crutches briefly if needed; physiotherapy for range, strength and balance (wobble board)." : "Grade 1: elastic support only if comfortable; range-of-motion and balance exercises from day 2–3.");
  s.push("Most sprains recover in 2–6 weeks (grade 3 up to 12). Review if still painful or giving way after 6 weeks: missed fracture (talar dome, 5th metatarsal, anterior process of calcaneum), chronic instability — consider MRI and sports or orthopaedic referral.");
  return { urgency, ankleXray: o.ankleXray, footXray: o.footXray, steps: s };
}

/* ================================================================== trigger finger and De Quervain's */

export interface HandInput { condition: "trigger" | "dequervain"; grade: 1 | 2 | 3 | 4; diabetes: boolean; injections: number; months: number; postpartum: boolean; pregnant: boolean; multiple: boolean }
export const TRIGGER_GRADES: [number, string][] = [[1, "Pain or tenderness at the A1 pulley, no catching"], [2, "Catching, but the finger straightens actively"], [3, "Locks; needs the other hand to straighten it"], [4, "Fixed flexion — can't straighten"]];
export function handPlan(x: HandInput): { steps: string[]; surgery: boolean } {
  const s: string[] = [];
  let surgery = false;
  if (x.condition === "trigger") {
    s.push(`Trigger finger, grade ${x.grade}: ${TRIGGER_GRADES[x.grade - 1][1].toLowerCase()}.`);
    if (x.grade === 4) { surgery = true; s.push("Fixed flexion: surgical release (open A1 pulley release, or percutaneous for suitable fingers)."); }
    else {
      if (x.grade <= 2 && x.months < 3) s.push("Early and mild: rest from repetitive gripping, night splint holding the finger straight (MCP joint in extension) for 6 weeks, NSAID if needed.");
      s.push(`Steroid injection into the tendon sheath at the A1 pulley (e.g. triamcinolone 10–20 mg or methylprednisolone 20–40 mg with lignocaine): about 60–70% respond${x.diabetes ? "; less effective in diabetes and may raise glucose for a few days — warn about monitoring" : ""}.`);
      if (x.injections >= 2 || (x.grade === 3 && x.injections >= 1)) { surgery = true; s.push("Not settled after injections: refer for surgical release (high success, quick recovery)."); }
    }
    if (x.multiple || x.diabetes) s.push("Several fingers or diabetes: check HbA1c; consider rheumatoid arthritis, hypothyroidism, amyloid (dialysis) when many digits are affected.");
  } else {
    s.push("De Quervain's tenosynovitis: pain over the radial styloid, worse on gripping and lifting; Finkelstein's test (thumb in fist, ulnar deviation) reproduces it. Exclude thumb base arthritis (grind test) and scaphoid injury.");
    if (x.postpartum || x.pregnant) s.push("Pregnancy and after childbirth (lifting the baby): common and often settles after breastfeeding stops; teach lifting with palms up and wrist straight.");
    s.push("Thumb spica splint (wrist and thumb) for 3–6 weeks, activity change, ice, short NSAID course.");
    s.push(`Steroid injection into the first dorsal compartment: about 70–80% respond${x.pregnant ? " (can be used in pregnancy if needed)" : ""}; warn about skin thinning and depigmentation.`);
    if (x.injections >= 2 || x.months >= 6) { surgery = true; s.push("Persistent after 1–2 injections or 6 months: surgical release of the first dorsal compartment (protect the superficial radial nerve)."); }
  }
  return { steps: s, surgery };
}

/* ================================================================== skin lumps (lipoma and epidermoid cyst) */

export interface LumpInput { sizeCm: number; growing: boolean; hard: boolean; fixed: boolean; deep: boolean; painful: boolean; punctum: boolean; inflamed: boolean; fluctuant: boolean; recurrent: boolean; multiple: boolean; site: "trunk" | "limb" | "scalp" | "face" | "neck" | "breast" | "groin" }
export function lumpPlan(x: LumpInput): { kind: "sarcoma risk" | "cyst" | "lipoma" | "unclear"; urgency: Urgency; steps: string[] } {
  const s: string[] = [];
  const flags = [x.sizeCm > 5 && "over 5 cm", x.growing && "getting bigger", x.deep && "deep to the fascia", x.fixed && "fixed", x.hard && "hard", x.painful && !x.inflamed && "painful", x.recurrent && "came back after excision"].filter(Boolean) as string[];
  let kind: "sarcoma risk" | "cyst" | "lipoma" | "unclear" = "unclear";
  let urgency: Urgency = "routine";
  if (flags.length >= 2 || (x.sizeCm > 5 && x.deep)) {
    kind = "sarcoma risk"; urgency = "urgent";
    s.push(`Worrying features (${flags.join(", ")}): possible soft tissue sarcoma — urgent ultrasound within 2 weeks, then MRI and a sarcoma centre before any biopsy or excision. Never 'shell out' a suspicious lump.`);
  } else if (x.punctum || x.inflamed || x.fluctuant) {
    kind = "cyst";
    if (x.inflamed || x.fluctuant) s.push(x.fluctuant ? "Infected or ruptured cyst with a fluctuant collection: incision and drainage, curette the contents, pack if large; antibiotics only with spreading cellulitis or in diabetes/immunosuppression." : "Inflamed cyst (often a sterile rupture reaction, not infection): warm compresses; intralesional triamcinolone can settle it; antibiotics only if cellulitis.");
    s.push("Epidermoid (sebaceous) cyst with a punctum: no treatment needed if small and quiet. Excise when bothersome — do it when NOT inflamed, removing the whole capsule (elliptical excision including the punctum) to stop it coming back.");
  } else {
    kind = "lipoma";
    s.push("Soft, mobile, painless, slow-growing, under 5 cm, under the skin: lipoma most likely — reassurance; ultrasound if unsure.");
    s.push("Excise if symptomatic, growing or for cosmetic reasons (under local anaesthetic; liposuction for large ones). Send excised tissue for histology.");
  }
  if (x.multiple && kind === "lipoma") s.push("Many lipomas: familial multiple lipomatosis; painful ones may be angiolipomas.");
  if (x.site === "breast") s.push("Breast lump: use the Breast Lump & Screening tool — triple assessment.");
  if (x.site === "neck") s.push("Neck lump in an adult (especially a smoker, or over 3 weeks): head and neck referral and ultrasound — think thyroid, lymph node, salivary gland.");
  if (x.site === "groin") s.push("Groin lump: check for a hernia (cough impulse, reducible) and lymph nodes before calling it a lipoma.");
  if (x.site === "scalp" && x.punctum === false && kind !== "sarcoma risk") s.push("Scalp: smooth, firm, no punctum, often multiple and familial — likely a pilar (trichilemmal) cyst; excise if wanted.");
  if (x.site === "face") s.push("Face: excision needs good cosmetic technique; consider dermatology or plastics; midline lumps near the nose in children may be dermoids with intracranial extension — image first.");
  return { kind, urgency, steps: s };
}

/* ================================================================== phimosis and balanitis */

export interface PhimosisInput { age: number; retracts: boolean; ballooning: boolean; scarring: boolean; recurrentBalanitis: boolean; recurrentUti: boolean; paraphimosis: boolean; retention: boolean; balanitis: boolean; candidaLook: boolean; diabetes: boolean; weeks: number; lesion: boolean }
export function phimosisPlan(x: PhimosisInput): { urgency: Urgency; steps: string[] } {
  const s: string[] = [];
  let urgency: Urgency = "routine";
  const child = x.age > 0 && x.age < 16;
  if (x.paraphimosis) { urgency = "emergency"; s.push("Paraphimosis (foreskin stuck behind the glans): emergency — analgesia (penile block), reduce oedema with firm compression or ice wrapped in a glove for 5–10 minutes, then push the glans back while pulling the foreskin forward; urology if it fails (dorsal slit). Advise circumcision later if recurrent."); }
  if (x.retention) { urgency = "emergency"; s.push("Can't pass urine: urgent catheterisation or urology review (meatal or preputial stenosis)."); }
  if (!x.retracts) {
    if (x.scarring) { urgency = worse(urgency, "urgent"); s.push("White scarred ring at the tip of the foreskin: lichen sclerosus (BXO) — potent topical steroid (clobetasol 0.05%) once daily for 1–3 months may help, but most need circumcision; refer to urology. Long-term follow-up (small cancer risk)."); }
    else if (child) {
      s.push(`Non-retractile foreskin at ${x.age} years without scarring is normal (physiological phimosis): most retract by age 10 and nearly all by 16–17. Don't force retraction — it causes scarring.${x.ballooning ? " Ballooning while passing urine is common and harmless if the stream is good." : ""}`);
      s.push("Treat only if it bothers the child or causes balanitis or UTIs: topical steroid (betamethasone 0.05–0.1% or hydrocortisone 1%) twice daily to the tip of the foreskin for 4–8 weeks with gentle retraction in the bath — about 80% respond.");
    } else s.push("Adult with a tight foreskin: topical potent steroid twice daily for 4–8 weeks with gentle stretching; check glucose; circumcision or preputioplasty if it fails, causes pain with erections, or is scarred.");
  } else s.push("Foreskin retracts: no phimosis.");
  if (x.recurrentBalanitis || x.recurrentUti) s.push(`Recurrent ${x.recurrentUti ? "UTIs" : "balanoposthitis"}: an indication for circumcision${child && x.recurrentUti ? " (and renal ultrasound in children with febrile UTIs)" : ""}.`);
  if (x.balanitis) {
    s.push("Balanitis: wash daily with warm water or saline, dry gently, avoid soaps and bubble baths; emollient as a soap substitute.");
    s.push(x.candidaLook ? "Candida (red, itchy, white patches or satellite spots): clotrimazole 1% cream twice daily for 2 weeks (add hydrocortisone 1% if very inflamed); oral fluconazole 150 mg stat if severe; treat the partner if recurrent." : "Bacterial (pain, discharge, swelling): swab; streptococcal or anaerobic — oral flucloxacillin or co-amoxiclav, or metronidazole for anaerobes; screen for STI if sexually active.");
    if (x.diabetes || (!child && x.age >= 16)) s.push("Check blood glucose or HbA1c — candidal balanitis is often the first sign of diabetes (also SGLT2 inhibitors).");
    if (x.weeks >= 4 || x.lesion) { urgency = worse(urgency, "urgent"); s.push("Persistent over 4 weeks, or a patch, ulcer or lump: refer for biopsy — lichen sclerosus, Zoon's balanitis, psoriasis, penile intraepithelial neoplasia or penile cancer."); }
  }
  return { urgency, steps: s };
}

/* ================================================================== erectile dysfunction (mine) */

export function iief5(answers: number[]): { score: number; band: string } | null {
  if (answers.length !== 5 || answers.some((a) => !(a >= 1 && a <= 5))) return null;
  const score = answers.reduce((a, b) => a + b, 0);
  const band = score >= 22 ? "No erectile dysfunction" : score >= 17 ? "Mild" : score >= 12 ? "Mild to moderate" : score >= 8 ? "Moderate" : "Severe";
  return { score, band };
}
export interface EdInput { answers: number[]; nitrates: boolean; unstableHeart: boolean; morningErections: boolean; sudden: boolean; lowLibido: boolean; diabetes: boolean; smoker: boolean; alphaBlocker: boolean; meds: boolean; age: number; curvature: boolean }
export function edPlan(x: EdInput): { score: number | null; band: string; urgency: Urgency; steps: string[] } {
  const r = iief5(x.answers);
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (r) s.push(`IIEF-5 ${r.score}/25: ${r.band.toLowerCase()}.`);
  if (x.unstableHeart) { urgency = "urgent"; s.push("Chest pain, recent MI or stroke, uncontrolled arrhythmia or severe heart failure: sexual activity and PDE5 inhibitors should wait until the heart is assessed and stable (Princeton high-risk)."); }
  if (x.sudden || x.morningErections) s.push("Sudden onset, situational, with normal morning erections: a psychological cause is likely (performance anxiety, relationship issues, depression) — counselling or sex therapy, often with a PDE5 inhibitor short term.");
  s.push("ED is an early warning of heart disease (10–15 years older blood vessels): check BP, HbA1c/fasting glucose, lipids, BMI; calculate cardiovascular risk.");
  if (x.lowLibido) s.push("Low libido, tiredness, loss of morning erections: morning total testosterone (repeat if low), with LH, FSH and prolactin.");
  if (x.meds) s.push("Medicines that cause ED: thiazides, beta-blockers (older ones), SSRIs, antipsychotics, finasteride, spironolactone, opioids — consider switching.");
  if (x.curvature) s.push("Penile curvature or a hard plaque: Peyronie's disease — urology referral.");
  if (x.nitrates) { s.push("Takes nitrates (GTN, isosorbide) or nicorandil: PDE5 inhibitors are CONTRAINDICATED (severe hypotension). Options: vacuum device, intracavernosal alprostadil, urology referral."); }
  else {
    s.push("First line: sildenafil 50 mg about 1 hour before sex (25–100 mg; delayed by a fatty meal) or tadalafil 10 mg (5–20 mg, works up to 36 hours) or tadalafil 5 mg daily for frequent use. Try at least 6 attempts at the best dose before calling it a failure; sexual stimulation is needed.");
    if (x.alphaBlocker) s.push("On an alpha-blocker (tamsulosin, doxazosin): start the PDE5 inhibitor at the lowest dose and separate the doses — risk of low BP.");
    s.push("Side effects: headache, flushing, blocked nose, indigestion, back pain (tadalafil). Seek help for an erection lasting over 4 hours, or sudden loss of vision or hearing.");
  }
  s.push("Lifestyle helps: lose weight, exercise, stop smoking, cut alcohol, treat sleep apnoea. Second line: vacuum erection device, alprostadil (intracavernosal or intraurethral); penile prosthesis via urology.");
  if (x.smoker) s.push("Smoking doubles the risk of ED — use the Quit Smoking Helper.");
  return { score: r?.score ?? null, band: r?.band ?? "", urgency, steps: s };
}

/* ================================================================== persistent hiccups (mine) */

export interface HiccupInput { hours: number; neuro: boolean; postOp: boolean; reflux: boolean; ckd: boolean; drugs: boolean; chestPain: boolean; cancer: boolean; sleepAffected: boolean; elderly: boolean }
export function hiccupPlan(x: HiccupInput): { kind: "acute" | "persistent" | "intractable"; urgency: Urgency; steps: string[] } {
  const kind = x.hours >= 24 * 30 ? "intractable" : x.hours >= 48 ? "persistent" : "acute";
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.neuro) { urgency = "emergency"; s.push("Hiccups with new neurological signs (vertigo, double vision, dysarthria, ataxia, numbness): brainstem stroke (lateral medullary) or MS — urgent MRI."); }
  if (x.chestPain) { urgency = worse(urgency, "urgent"); s.push("With chest pain or breathlessness: ECG and troponin (inferior MI), chest X-ray (pneumonia, pericarditis, mediastinal mass)."); }
  s.push(kind === "acute" ? "Acute hiccups (under 48 hours): usually after a big meal, fizzy drinks, alcohol or excitement — they stop on their own." : `${kind === "persistent" ? "Persistent (over 48 hours)" : "Intractable (over a month)"}: look for a cause.`);
  if (kind === "acute") s.push("Try: hold the breath, sip ice-cold water, swallow granulated sugar, pull the knees to the chest, or lean forward to compress the chest. Avoid eyeball pressure and carotid massage.");
  else {
    s.push("Tests: U&E and creatinine, sodium, calcium, glucose, LFT, CBC; ECG; chest X-ray. Endoscopy if reflux symptoms; CT chest/abdomen or MRI brain if no cause and they persist.");
    const causes = [x.reflux && "reflux, hiatus hernia or gastric distension", x.ckd && "uraemia", x.drugs && "medicines (dexamethasone and other steroids, benzodiazepines, opioids, chemotherapy, levodopa)", x.postOp && "recent surgery or anaesthesia (diaphragm or phrenic irritation)", x.cancer && "a tumour pressing on the phrenic or vagus nerve, or the brain"].filter(Boolean);
    if (causes.length) s.push(`Likely causes here: ${causes.join("; ")}.`);
    s.push(x.reflux ? "Start with a PPI (omeprazole 20–40 mg daily) for 2–4 weeks — reflux is the commonest treatable cause." : "Treat any cause found; a PPI trial is reasonable even without reflux symptoms.");
    s.push(`If they continue: baclofen 5–10 mg three times daily${x.ckd ? " (avoid or use very low doses in kidney failure — risk of confusion)" : ""}, or gabapentin 300 mg up to three times daily, or metoclopramide 10 mg three times daily. Chlorpromazine 25–50 mg is licensed but sedating and drops BP${x.elderly ? " — avoid in the elderly" : ""}.`);
    if (x.sleepAffected) s.push("Disturbing sleep and eating: treat promptly; watch weight and hydration.");
  }
  return { kind, urgency, steps: s };
}

/* ================================================================== nocturnal leg cramps (mine) */

export interface CrampInput { perWeek: number; pregnant: boolean; diuretic: boolean; statin: boolean; betaAgonist: boolean; ckd: boolean; diabetes: boolean; claudication: boolean; urgeToMove: boolean; weakness: boolean; swelling: boolean; elderly: boolean }
export function crampPlan(x: CrampInput): { urgency: Urgency; steps: string[] } {
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.swelling) { urgency = "urgent"; s.push("One calf swollen, tender or warm: rule out DVT (Wells score, D-dimer or Doppler) — it is not a cramp."); }
  if (x.urgeToMove) s.push("An urge to move the legs at rest, relieved by moving, without a hard muscle spasm: that is restless legs syndrome — see the RLS tool.");
  if (x.claudication) s.push("Calf pain on walking that settles with rest: claudication from peripheral arterial disease — check pulses and ABPI.");
  if (x.weakness) { urgency = worse(urgency, "urgent"); s.push("Muscle weakness, wasting or twitching (fasciculations): neurology review — motor neurone disease, neuropathy or myopathy."); }
  s.push("Night cramps: sudden, painful tightening of the calf or foot muscles, lasting seconds to minutes; common over 50 and in pregnancy, usually without a cause.");
  const drugs = [x.diuretic && "diuretics", x.statin && "statins", x.betaAgonist && "salbutamol and other beta-agonists"].filter(Boolean);
  if (drugs.length) s.push(`Medicines that cause cramps: ${drugs.join(", ")} — review dose or timing; check CK if on a statin with muscle pain or weakness.`);
  s.push(`Tests if frequent: U&E, potassium, magnesium, calcium, glucose${x.diabetes ? " (neuropathy screen)" : ""}, TSH${x.ckd ? "; kidney disease and dialysis commonly cause cramps" : ""}.`);
  s.push("During a cramp: stand on the leg, or pull the toes up towards the knee and massage the calf. Prevention: calf stretches 3 times a day and before bed (hold 30 seconds), keep bedclothes loose, avoid pointing the toes in bed, stay hydrated, limit alcohol.");
  if (x.pregnant) s.push("Pregnancy: stretching first; magnesium has weak evidence and is safe to try. Quinine must not be used in pregnancy.");
  else if (x.perWeek >= 4) s.push(`Very frequent and disturbing sleep despite stretching: quinine sulfate 200–300 mg at night may be tried after explaining the risks (blood disorders, arrhythmias, interactions), assessed after 4 weeks and stopped if no benefit${x.elderly ? "; use with care in the elderly" : ""}. It is not for routine use.`);
  return { urgency, steps: s };
}

/* ================================================================== insect bites and stings (mine) */

export interface BiteInput { kind: "bee" | "wasp" | "ant" | "mosquito" | "bedbug" | "tick" | "spider" | "caterpillar"; anaphylaxis: boolean; previousSystemic: boolean; mouthThroat: boolean; largeLocal: boolean; many: boolean; infected: boolean; child: boolean; weightKg: number; rash: boolean; fever: boolean }
export function bitePlan(x: BiteInput): { urgency: Urgency; steps: string[] } {
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.anaphylaxis) {
    urgency = "emergency";
    const dose = x.child && x.weightKg > 0 ? `${Math.min(0.5, Math.round(0.01 * x.weightKg * 100) / 100)} mg (0.01 mg/kg)` : "0.5 mg (0.5 mL of 1 mg/mL)";
    s.push(`Anaphylaxis (breathing difficulty, wheeze, throat swelling, faintness, widespread hives with collapse): IM adrenaline ${dose} into the outer thigh now, repeat after 5 minutes if no better; lie flat with legs raised, oxygen, IV fluids — see Anaphylaxis & Allergy Plan.`);
  }
  if (x.mouthThroat) { urgency = worse(urgency, "urgent"); s.push("Sting in the mouth or throat: risk of airway swelling — observe in hospital, give antihistamine, steroid, and adrenaline if stridor."); }
  if (x.many) { urgency = worse(urgency, "emergency"); s.push("Many stings (dozens of bees, wasps or hornets): venom toxicity — admit; CK, U&E, urine for myoglobin, CBC, LFT; watch for rhabdomyolysis, kidney injury and haemolysis over 24–48 hours."); }
  if (x.kind === "bee") s.push("Bee sting: remove the sting as quickly as possible — scraping it out with a fingernail or card is fine; speed matters more than the method.");
  s.push("Local reaction: wash, cold compress for 10 minutes, raise the limb; oral non-sedating antihistamine (cetirizine 10 mg; 5 mg for 2–6 years) for itch; mild topical steroid (hydrocortisone 1%) twice daily for a few days; paracetamol for pain. Don't scratch.");
  if (x.largeLocal) s.push("Large local reaction (swelling over 10 cm, peaks at 24–48 hours, lasts up to a week): this is allergy, not infection — antihistamine, cold, elevation; a short course of prednisolone (e.g. 30 mg for 3 days) if severe. Antibiotics are not needed.");
  if (x.infected) s.push("Infection (increasing pain, spreading redness after 48 hours, pus, fever): treat as cellulitis — oral flucloxacillin or cefalexin.");
  if (x.previousSystemic || x.anaphylaxis) s.push("After any systemic reaction: refer to an allergy specialist for venom-specific IgE and venom immunotherapy (very effective for bee and wasp), and prescribe two adrenaline auto-injectors with training.");
  if (x.kind === "tick") s.push(`Tick: remove with fine tweezers close to the skin, pull straight up steadily; clean. Watch for 30 days: fever with an eschar (black scab) and rash suggests scrub typhus or spotted fever — doxycycline${x.fever || x.rash ? " now: this patient has fever or rash — see Tropical Fevers" : ""}.`);
  if (x.kind === "bedbug") s.push("Bedbugs: itchy bites in lines or clusters on exposed skin; treat the itch; the home needs pest control (mattress seams, bed frames), hot wash bedding at 60 °C.");
  if (x.kind === "mosquito" && (x.fever || x.rash)) s.push("Fever after mosquito bites: test for dengue, malaria and chikungunya — see Dengue Helper and Tropical Fevers.");
  if (x.kind === "spider") s.push("Spider bites in India are rarely serious; a spreading necrotic ulcer or severe muscle cramps with sweating needs hospital review.");
  if (x.kind === "caterpillar") s.push("Caterpillar hairs: remove with sticky tape, wash; antihistamine and topical steroid for the itchy rash; eye exposure needs ophthalmology.");
  if (x.kind === "ant") s.push("Ant stings: the burning pustules of fire ants are sterile — don't open them.");
  s.push("Scorpion stings: use the Scorpion Sting tool (prazosin).");
  return { urgency, steps: s };
}
