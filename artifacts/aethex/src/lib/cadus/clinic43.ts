/**
 * Update 43, on the device (no AI): leprosy (WHO MDT), tinea and dermatophytosis, acne, tetanus,
 * cervical cancer screening, the WHO Labour Care Guide, DMARD monitoring, tumour lysis syndrome,
 * BPH and LUTS (IPSS), haemorrhoids and anal fissure, psoriasis, and acute viral hepatitis A and E.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== leprosy */

export function leprosyClass(lesions: number, nerves: number, smearPos: boolean): { type: "PB" | "MB"; why: string } {
  if (smearPos) return { type: "MB", why: "skin smear positive (any number of lesions)" };
  if (lesions > 5) return { type: "MB", why: `${lesions} skin lesions (more than 5)` };
  if (nerves > 0) return { type: "MB", why: `${nerves} nerve${nerves === 1 ? "" : "s"} involved` };
  return { type: "PB", why: `${lesions || "1–5"} skin lesion${lesions === 1 ? "" : "s"}, no nerve involvement, smear negative` };
}
export function mdt(type: "PB" | "MB", age: number, kg: number): string[] {
  const months = type === "PB" ? "6 months (6 monthly packs, completed within 9 months)" : "12 months (12 monthly packs, completed within 18 months)";
  let doses: string;
  if (age >= 15) doses = "Rifampicin 600 mg and clofazimine 300 mg once a month (supervised), plus dapsone 100 mg and clofazimine 50 mg daily.";
  else if (age >= 10) doses = "Rifampicin 450 mg and clofazimine 150 mg once a month (supervised), plus dapsone 50 mg daily and clofazimine 50 mg on alternate days.";
  else doses = kg > 0 ? `Rifampicin ${Math.round(10 * kg)} mg (10 mg/kg) and clofazimine 100 mg once a month, plus dapsone ${Math.round(2 * kg)} mg (2 mg/kg) daily and clofazimine 50 mg twice a week.` : "Under 10 years: rifampicin 10 mg/kg and clofazimine 100 mg monthly, dapsone 2 mg/kg daily, clofazimine 50 mg twice a week (enter weight).";
  return [`${type === "PB" ? "Paucibacillary" : "Multibacillary"} leprosy: WHO 3-drug MDT for ${months}.`, doses, "Check for G6PD deficiency and anaemia (dapsone); warn about reddish-brown skin from clofazimine (fades after treatment) and red urine from rifampicin.", "Follow the National Leprosy Eradication Programme (NLEP) regimen and supply; MDT is free."];
}
export const LEPROSY_REACTIONS = [
  "Type 1 (reversal) reaction: existing patches become red, swollen and painful, with new nerve pain or weakness. Prednisolone 40 mg daily (about 0.5–1 mg/kg), tapering by 5 mg every 2 weeks over about 20 weeks; rest the limb.",
  "Type 2 reaction (ENL): crops of tender red nodules, fever, joint pain, neuritis, eye or testicular inflammation. Prednisolone 40–60 mg daily tapered over about 12 weeks; for recurrent ENL, clofazimine 300 mg daily for up to 3 months then tapered (specialist); thalidomide only under strict controls (never in women who could become pregnant).",
  "Continue MDT through any reaction. Check nerve function (voluntary muscle and sensory testing) at every visit; new weakness within 6 months is treated with steroids.",
  "Dapsone hypersensitivity syndrome (fever, rash, jaundice in the first 6 weeks): stop dapsone and refer.",
  "Self-care: daily inspection of anaesthetic hands and feet, soaking and oiling, protective footwear, eye care for lagophthalmos.",
];
export function sdrPep(age: number, kg: number): string {
  if (age < 2) return "Contacts under 2 years: no rifampicin prophylaxis; examine and follow up.";
  if (age >= 15) return "Single-dose rifampicin 600 mg for contacts aged 15 and over (exclude leprosy and TB first).";
  if (age >= 10) return "Single-dose rifampicin 450 mg for contacts aged 10–14 (exclude leprosy and TB first).";
  return kg > 0 ? `Single-dose rifampicin ${Math.round(cap(10 * kg, 300))}–${Math.round(cap(15 * kg, 300))} mg (10–15 mg/kg) for contacts aged 2–9 (exclude leprosy and TB first).` : "Single-dose rifampicin 10–15 mg/kg for contacts aged 2–9 (enter weight).";
}

/* ================================================================== tinea and dermatophytosis */

export interface TineaInput { site: "body" | "scalp" | "nail-finger" | "nail-toe"; extensive: boolean; recurrent: boolean; child: boolean; kg: number }
export function tineaPlan(x: TineaInput): string[] {
  const out: string[] = [];
  if (x.site === "scalp") {
    out.push("Tinea capitis needs oral treatment; topical alone does not work.");
    out.push(x.kg > 0 ? `Griseofulvin ${Math.round(cap(25 * x.kg, 1000))} mg daily (20–25 mg/kg/day, microsize) with fatty food for 6–8 weeks, or terbinafine ${x.kg < 20 ? "62.5" : x.kg <= 40 ? "125" : "250"} mg daily for 4 weeks (Trichophyton).` : "Griseofulvin 20–25 mg/kg/day for 6–8 weeks, or terbinafine by weight (under 20 kg 62.5 mg, 20–40 kg 125 mg, over 40 kg 250 mg) for 4 weeks.");
    out.push("Ketoconazole 2% or selenium shampoo twice a week for the child and family to cut spread; check other children; kerion: add oral treatment, no incision.");
    return out;
  }
  if (x.site === "nail-finger" || x.site === "nail-toe") {
    const toe = x.site === "nail-toe";
    out.push("Confirm with KOH microscopy or culture before long courses.", `Terbinafine 250 mg daily for ${toe ? "12" : "6"} weeks, or itraconazole pulses: 200 mg twice daily for 1 week each month for ${toe ? "3" : "2"} months.`, "Check LFT before starting; mild single-nail disease: amorolfine 5% lacquer weekly for 6–12 months.");
    return out;
  }
  if (!x.extensive && !x.recurrent) {
    out.push("Limited tinea corporis, cruris or pedis: topical luliconazole 1% once daily, or sertaconazole 2%, terbinafine 1% or amorolfine cream twice daily, 2–3 cm beyond the edge, for at least 4 weeks and 2 weeks after it clears.");
  } else {
    out.push("Extensive, recurrent or chronic tinea: oral treatment plus topical.");
    out.push(x.child && x.kg > 0 ? `Child: itraconazole ${Math.round(cap(5 * x.kg, 200))} mg daily (5 mg/kg) with food for 2–4 weeks beyond cure, or terbinafine by weight.` : "Itraconazole 100 mg twice daily (or 200 mg once daily) with food for at least 4 weeks and 2 weeks beyond clinical cure; many patients in India need 6–8 weeks. Terbinafine resistance (T. indotineae) is common, so it is now second line.");
    out.push("Itraconazole: avoid in heart failure; check interactions (statins, some antiarrhythmics); LFT if more than a month.");
  }
  out.push("Stop steroid–antifungal combination creams: they spread the infection, cause steroid damage to the skin and make it chronic.", "Loose cotton clothes, dry skin folds well, separate towels, wash clothes in hot water and dry in the sun; treat affected family members at the same time.");
  return out;
}

/* ================================================================== acne */

export function acnePlan(grade: "comedonal" | "mild" | "moderate" | "severe", female: boolean, pregnant: boolean): string[] {
  if (pregnant) return ["Pregnancy: azelaic acid 15–20% twice daily, benzoyl peroxide 2.5–5%, and topical clindamycin or erythromycin with benzoyl peroxide are reasonable.", "Avoid all retinoids (topical and oral), tetracyclines (doxycycline, minocycline) and spironolactone.", "Severe inflammatory acne in pregnancy: oral erythromycin or azithromycin short course with dermatology advice."];
  const out: string[] = [];
  if (grade === "comedonal") out.push("Adapalene 0.1% gel at night (start alternate nights), with or without benzoyl peroxide 2.5% in the morning.");
  if (grade === "mild") out.push("Fixed combination of adapalene 0.1% with benzoyl peroxide 2.5% at night; or topical clindamycin 1% with benzoyl peroxide. Never a topical antibiotic alone.");
  if (grade === "moderate") out.push("Topical retinoid with benzoyl peroxide, plus doxycycline 100 mg daily (or minocycline 50–100 mg) for up to 3–4 months, then topical maintenance.", ...(female ? ["Women: a combined pill or spironolactone 50–100 mg daily (with contraception) are alternatives to antibiotics."] : []));
  if (grade === "severe") out.push("Nodular or scarring acne, or moderate acne that failed treatment: oral isotretinoin (dermatologist); see the dose below.", "Isotretinoin: pregnancy test before, monthly and 1 month after; two forms of contraception; LFT and lipids at baseline and 1–2 months; dry lips and skin; ask about mood at every visit; no blood donation; avoid with tetracyclines (raised pressure in the head).");
  out.push("Gentle cleanser twice daily, non-comedogenic moisturiser and sunscreen; results take 8–12 weeks; avoid picking (scars) and steroid creams.");
  return out;
}
export function isoDose(kg: number): string | null {
  if (!(kg > 0)) return null;
  const start = Math.max(10, Math.round((0.5 * kg) / 10) * 10);
  const low = Math.max(10, Math.round((0.25 * kg) / 10) * 10);
  return `Start isotretinoin about ${start} mg daily (0.5 mg/kg; a low dose of 0.25 mg/kg, about ${low} mg, is also used), aiming for a total course of ${r1((120 * kg) / 1000)}–${r1((150 * kg) / 1000)} g (120–150 mg/kg), usually over 6–9 months.`;
}

/* ================================================================== tetanus */

export const TETANUS_PRONE = ["Deep penetrating wound or puncture", "Contaminated with soil, manure or rust", "Devitalised tissue, crush or compound fracture", "Burns, animal bite or frostbite", "More than 6 hours before surgical care", "Systemic sepsis"];
export function tetanusProphylaxis(doses: "unknown" | "lt3" | "ge3", yearsSince: number, prone: boolean): { vaccine: boolean; tig: boolean; text: string } {
  if (doses !== "ge3") return { vaccine: true, tig: prone, text: `${doses === "unknown" ? "Unknown history" : "Fewer than 3 doses"}: give Td now and complete the course (doses at 0, 1 and 6 months)${prone ? "; tetanus-prone wound: also human tetanus immunoglobulin 250 IU IM (500 IU if heavy contamination, burns or more than 24 hours), in a different site." : "."}` };
  const limit = prone ? 5 : 10;
  const vaccine = yearsSince >= limit;
  return { vaccine, tig: false, text: vaccine ? `3 or more doses, last ${yearsSince} years ago (${limit} or more for a ${prone ? "tetanus-prone" : "clean"} wound): give a Td booster. No immunoglobulin needed.` : `3 or more doses, last ${yearsSince} years ago: no vaccine or immunoglobulin needed now.` };
}
export function ablett(trismus: "mild" | "moderate" | "severe", dysphagia: boolean, spasms: boolean, respiratory: boolean, autonomic: boolean): { grade: 1 | 2 | 3 | 4; text: string } {
  if (autonomic && (respiratory || spasms)) return { grade: 4, text: "Ablett IV (very severe): grade III with autonomic storm (labile BP and pulse, sweating, arrhythmias)." };
  if (respiratory || (trismus === "severe" && spasms)) return { grade: 3, text: "Ablett III (severe): severe trismus, generalised spasticity, prolonged spasms, breathing difficulty or apnoeic spells." };
  if (dysphagia || spasms || trismus === "moderate") return { grade: 2, text: "Ablett II (moderate): trismus, dysphagia, rigidity, short spasms, mild breathing involvement." };
  return { grade: 1, text: "Ablett I (mild): mild trismus, general spasticity, no breathing problem or spasms, little or no dysphagia." };
}
export function tetanusCare(kg: number): string[] {
  const mg = kg > 0 ? `Magnesium sulphate loading ${r1(cap(0.04 * kg, 5))} g IV over 30 minutes (40 mg/kg), then ${kg < 45 ? "1.5" : "2"} g/hour, titrated to spasms, patellar reflex and serum magnesium 2–4 mmol/L.` : "Magnesium sulphate 40 mg/kg IV over 30 minutes, then 2 g/hour (1.5 g/hour if under 45 kg), titrated to spasms and reflexes.";
  return [
    "ICU or a quiet dark room; minimal handling; early airway plan (tracheostomy if prolonged ventilation is likely).",
    "Human tetanus immunoglobulin 3,000–6,000 IU IM once (500 IU IM may be as effective; intrathecal 500 IU in specialist centres).",
    "Wound debridement after immunoglobulin; metronidazole 500 mg IV every 8 hours (or 400 mg by mouth) for 7–10 days.",
    `Spasm control: diazepam or midazolam infusion; ${mg}`,
    "Autonomic instability: magnesium, labetalol or esmolol for hypertension (avoid beta blockers alone); fluids for hypotension.",
    "Nutrition early (nasogastric), DVT prophylaxis, pressure care; start Td immunisation (the disease does not give immunity).",
  ];
}

/* ================================================================== cervical cancer screening */

export function cxSchedule(age: number, hiv: boolean): string {
  const start = hiv ? 25 : 30;
  if (age > 0 && age < start) return `Age ${age}: screening starts at ${start}${hiv ? " for women living with HIV" : ""}. Offer HPV vaccination if 9–14 (Cervavac or Gardasil), and up to 26 where available.`;
  if (age > 65) return `Age ${age}: stop if previous screens were negative; screen if never screened.`;
  return hiv
    ? "Women living with HIV: HPV DNA test (preferred) every 3–5 years; if HPV positive, triage with VIA, colposcopy or cytology. VIA alone every 3 years if HPV testing is not available."
    : "HPV DNA test (self-collected sample is fine) every 5–10 years from 30; VIA every 5 years (India's national programme, age 30–65) where HPV testing is not available; cytology every 3 years where used.";
}
export function cxResult(test: "hpv" | "via" | "pap", result: string, hiv: boolean): string[] {
  const retest = hiv ? "3 years" : "5 years";
  const eligible = "Ablation eligible if the whole lesion and squamocolumnar junction are visible, the lesion covers under 75% of the cervix and there is no suspicion of cancer; otherwise LEEP or colposcopy.";
  if (test === "hpv") {
    if (result === "negative") return [`HPV negative: rescreen in ${hiv ? "3–5" : "5–10"} years.`];
    if (result === "1618") return ["HPV 16/18 positive: treat (thermal ablation or cryotherapy if eligible, otherwise LEEP) or go straight to colposcopy.", eligible, "HPV test 12 months after treatment."];
    return ["HPV positive (other types): triage with VIA (or colposcopy or cytology).", "Triage positive: treat as below; triage negative: repeat HPV test in 12–24 months.", eligible, "HPV test 12 months after treatment."];
  }
  if (test === "via") {
    if (result === "negative") return [`VIA negative: repeat in ${retest}.`];
    if (result === "suspicious") return ["Suspicious for cancer: refer the same week for colposcopy and biopsy; do not ablate."];
    return ["VIA positive: screen-and-treat at the same visit with thermal ablation (or cryotherapy) if eligible.", eligible, "Follow up with VIA or HPV test at 12 months."];
  }
  if (result === "nilm") return [`Cytology normal: repeat in 3 years${hiv ? " (yearly for women living with HIV if HPV testing is not available)" : ""}.`];
  if (result === "ascus") return ["ASC-US: HPV test (reflex) — colposcopy if positive; or repeat cytology in 12 months."];
  if (result === "lsil") return ["LSIL: colposcopy (or HPV test first where policy allows; HPV negative: repeat in 1 year)."];
  return ["HSIL, ASC-H or atypical glandular cells: colposcopy and biopsy promptly; endometrial sampling as well for AGC over 35 or with abnormal bleeding."];
}

/* ================================================================== WHO Labour Care Guide */

const CERVIX_LIMIT: Record<number, number> = { 5: 6, 6: 5, 7: 3, 8: 2.5, 9: 2 };
export function lcgCervix(cm: number, hours: number): { alert: boolean; text: string } {
  if (cm < 5) return { alert: false, text: "Under 5 cm is the latent first stage: no time limit for slow progress if mother and baby are well." };
  if (cm >= 10) return { alert: false, text: "Fully dilated: second stage (see below)." };
  const lim = CERVIX_LIMIT[Math.floor(cm)];
  return hours >= lim ? { alert: true, text: `Alert: ${hours} hours at ${Math.floor(cm)} cm (the limit is ${lim} hours). Reassess: contractions, position, caput and moulding, hydration and bladder; consider oxytocin augmentation if membranes are ruptured and no obstruction, or other action.` } : { alert: false, text: `${hours} hours at ${Math.floor(cm)} cm: within the ${lim}-hour limit.` };
}
export function lcgSecond(hours: number, nullip: boolean): { alert: boolean; text: string } {
  const lim = nullip ? 3 : 2;
  return hours >= lim ? { alert: true, text: `Alert: second stage ${hours} hours (limit ${lim} hours for a ${nullip ? "first" : "later"} birth). Assess for assisted vaginal birth or caesarean.` } : { alert: false, text: `Second stage ${hours} hours: within the ${lim}-hour limit.` };
}
export interface LcgVitals { fhr: number; decel: "none" | "early" | "late" | "variable"; pulse: number; sbp: number; dbp: number; temp: number; contractions: number; duration: number; liquor: "clear" | "meconium" | "blood" }
export function lcgAlerts(v: LcgVitals): string[] {
  const a: string[] = [];
  if (v.fhr > 0 && (v.fhr < 110 || v.fhr >= 160)) a.push(`Fetal heart ${v.fhr} (alert: under 110 or 160 and over)`);
  if (v.decel === "late") a.push("Late decelerations");
  if (v.liquor === "meconium") a.push("Thick meconium");
  if (v.liquor === "blood") a.push("Blood-stained liquor");
  if (v.pulse > 0 && (v.pulse < 60 || v.pulse >= 120)) a.push(`Maternal pulse ${v.pulse} (alert: under 60 or 120 and over)`);
  if (v.sbp > 0 && (v.sbp < 80 || v.sbp >= 140)) a.push(`Systolic ${v.sbp} (alert: under 80 or 140 and over)`);
  if (v.dbp >= 90) a.push(`Diastolic ${v.dbp} (alert: 90 and over)`);
  if (v.temp > 0 && (v.temp < 35 || v.temp >= 37.5)) a.push(`Temperature ${v.temp}°C (alert: under 35 or 37.5 and over)`);
  if (v.contractions > 0 && (v.contractions <= 2 || v.contractions > 5)) a.push(`${v.contractions} contractions in 10 minutes (alert: 2 or fewer, or more than 5)`);
  if (v.duration > 0 && (v.duration < 20 || v.duration > 60)) a.push(`Contractions last ${v.duration} seconds (alert: under 20 or over 60)`);
  return a;
}
export const LCG_SUPPORT = ["A companion of her choice", "Pain relief offered (non-drug and drug)", "Oral fluids and food", "Free to move and choose her position", "Urine passed at least every 2–4 hours", "Fetal heart every 30 minutes in the first stage, every 5 minutes in the second"];

/* ================================================================== DMARD monitoring */

export const DMARDS: { id: string; name: string; start: string; monitor: string; notes: string }[] = [
  { id: "mtx", name: "Methotrexate", start: "7.5–15 mg ONCE A WEEK by mouth (or SC), increase to 20–25 mg weekly; folic acid 5 mg once a week on a different day (or 1 mg daily).", monitor: "Baseline FBC, LFT, creatinine, HBV/HCV/HIV, chest X-ray, pregnancy test. FBC, LFT, creatinine every 2 weeks until on a stable dose for 6 weeks, then monthly for 3 months, then every 12 weeks.", notes: "Never daily dosing (fatal errors). Avoid trimethoprim and co-trimoxazole; limit alcohol; stop 3 months before planned conception (both partners advised to check). Reduce dose in CKD; avoid if eGFR under 30." },
  { id: "hcq", name: "Hydroxychloroquine", start: "200–400 mg daily, no more than 5 mg/kg actual body weight a day.", monitor: "No routine blood tests. Baseline eye check within the first year; yearly retinal screening (OCT and visual fields) after 5 years, or after 1 year with risk factors (dose over 5 mg/kg, eGFR under 60, tamoxifen).", notes: "Safe in pregnancy and breastfeeding. Rare: retinopathy, cardiomyopathy, QT prolongation, hypoglycaemia." },
  { id: "ssz", name: "Sulfasalazine", start: "500 mg daily, increasing by 500 mg each week to 1 g twice daily (max 3 g/day).", monitor: "FBC, LFT, creatinine every 2 weeks until on a stable dose for 6 weeks, then monthly for 3 months, then every 12 weeks for the first year; then no routine monitoring.", notes: "Orange urine and tears (stains contact lenses); reversible low sperm count; safe in pregnancy with folic acid 5 mg; avoid in sulfa allergy." },
  { id: "lef", name: "Leflunomide", start: "10–20 mg daily (no loading dose usually).", monitor: "BP and weight at every visit; FBC and LFT every 2 weeks until stable for 6 weeks, then monthly for 3 months, then every 12 weeks.", notes: "Teratogenic with a very long half-life: reliable contraception; washout with colestyramine 8 g three times daily for 11 days before pregnancy. Stop if BP uncontrolled or weight loss over 10%." },
];
export interface DmardLabs { wbc: number; neut: number; plt: number; alt: number; mcv: number; creatRise: number; albumin: number }
export function dmardFlags(l: DmardLabs): string[] {
  const f: string[] = [];
  if (l.wbc > 0 && l.wbc < 3.5) f.push(`White cells ${l.wbc} ×10⁹/L (under 3.5)`);
  if (l.neut > 0 && l.neut < 1.6) f.push(`Neutrophils ${l.neut} ×10⁹/L (under 1.6)`);
  if (l.plt > 0 && l.plt < 140) f.push(`Platelets ${l.plt} ×10⁹/L (under 140)`);
  if (l.alt > 100) f.push(`ALT/AST ${l.alt} U/L (over 100)`);
  if (l.mcv > 105) f.push(`MCV ${l.mcv} fL (over 105: check B12, folate, thyroid)`);
  if (l.creatRise > 30) f.push(`Creatinine up ${l.creatRise}% within 12 months (over 30%)`);
  if (l.albumin > 0 && l.albumin < 3) f.push(`Unexplained albumin ${l.albumin} g/dL (under 3.0)`);
  return f;
}
export const hcqMax = (kg: number) => (kg > 0 ? Math.min(400, Math.floor((5 * kg) / 50) * 50) : 0);

/* ================================================================== tumour lysis syndrome */

export interface TlsLabs { urate: number; k: number; phos: number; ca: number; child: boolean }
export function cairoBishop(l: TlsLabs, creatHigh: boolean, arrhythmia: boolean, seizure: boolean): { labCount: number; lab: boolean; clinical: boolean; items: string[] } {
  const items: string[] = [];
  if (l.urate >= 8) items.push(`Uric acid ${l.urate} mg/dL (8 or more)`);
  if (l.k >= 6) items.push(`Potassium ${l.k} (6.0 or more)`);
  if (l.phos >= (l.child ? 6.5 : 4.5)) items.push(`Phosphate ${l.phos} mg/dL (${l.child ? "6.5" : "4.5"} or more)`);
  if (l.ca > 0 && l.ca <= 7) items.push(`Calcium ${l.ca} mg/dL (7 or less)`);
  const lab = items.length >= 2;
  return { labCount: items.length, lab, clinical: lab && (creatHigh || arrhythmia || seizure), items };
}
export function tlsRisk(cancer: "burkitt" | "all" | "aml" | "dlbcl" | "cll" | "solid" | "myeloma", wbc: number, ldhHigh: boolean, kidney: boolean): "low" | "intermediate" | "high" {
  let r: "low" | "intermediate" | "high" = "low";
  if (cancer === "burkitt") r = "high";
  else if (cancer === "all") r = wbc >= 100 || ldhHigh ? "high" : "intermediate";
  else if (cancer === "aml") r = wbc >= 100 ? "high" : wbc >= 25 || ldhHigh ? "intermediate" : "low";
  else if (cancer === "dlbcl") r = ldhHigh ? "high" : "intermediate";
  else if (cancer === "cll") r = wbc >= 50 ? "intermediate" : "low";
  if (kidney && r === "intermediate") r = "high";
  else if (kidney && r === "low") r = "intermediate";
  return r;
}
export function tlsPlan(risk: "low" | "intermediate" | "high", kg: number, child: boolean): string[] {
  const allo = child ? (kg > 0 ? `allopurinol ${Math.round(cap(10 * kg, 800))} mg a day in 3 doses (10 mg/kg/day)` : "allopurinol 10 mg/kg/day in 3 doses") : "allopurinol 300 mg daily (up to 600 mg in divided doses; reduce in kidney impairment)";
  if (risk === "low") return ["Low risk: oral or IV hydration and monitoring; allopurinol is reasonable.", "Labs (urate, K, phosphate, calcium, creatinine) daily during the first chemotherapy cycle."];
  if (risk === "intermediate") return ["Intermediate risk: IV fluids 2–3 L/m²/day (aim urine output 80–100 ml/m²/hour), starting 24–48 hours before chemotherapy.", `Start ${allo}, 1–2 days before treatment, for 7 days.`, "Labs every 8–12 hours for the first 2–3 days; rasburicase if uric acid rises."];
  return [
    "High risk: IV fluids 2–3 L/m²/day (urine output 80–100 ml/m²/hour), HDU monitoring and cardiac monitor.",
    `Rasburicase ${kg > 0 ? `${r1(0.2 * kg)} mg` : "0.2 mg/kg"} IV over 30 minutes once daily (often 1 dose is enough; a single 3–6 mg dose is used in adults). Check G6PD first (haemolysis, methaemoglobinaemia); put samples for uric acid on ice.`,
    "Labs every 6 hours for the first 24–48 hours; no urine alkalinisation.",
    "Hyperkalaemia: standard treatment; phosphate: binders; calcium only for symptomatic hypocalcaemia (risk of calcium-phosphate deposits).",
    "Dialysis for refractory hyperkalaemia, fluid overload, severe acidosis or symptomatic hypocalcaemia with high phosphate.",
  ];
}

/* ================================================================== BPH and LUTS (IPSS) */

export const IPSS_Q = ["Incomplete emptying", "Frequency (again within 2 hours)", "Intermittency (stops and starts)", "Urgency", "Weak stream", "Straining", "Nocturia (times a night)"];
export function ipss(scores: number[]): { total: number; band: "mild" | "moderate" | "severe" } {
  const total = scores.reduce((a, b) => a + (b || 0), 0);
  return { total, band: total >= 20 ? "severe" : total >= 8 ? "moderate" : "mild" };
}
export interface LutsInput { band: "mild" | "moderate" | "severe"; prostateMl: number; storage: boolean; ed: boolean; pvr: number; nocturnalPolyuria: boolean }
export function lutsPlan(x: LutsInput): string[] {
  const out: string[] = [];
  if (x.band === "mild") out.push("Mild: watchful waiting with lifestyle advice: less fluid in the evening, cut caffeine and alcohol, double voiding, bladder training; review yearly.");
  else {
    out.push("Alpha blocker: tamsulosin 0.4 mg once daily (or silodosin 8 mg, alfuzosin 10 mg); works within days; warn about dizziness on standing and tell the eye surgeon before cataract surgery (floppy iris).");
    if (x.prostateMl > 30) out.push(`Prostate ${x.prostateMl} ml (over 30–40 ml): add a 5-alpha reductase inhibitor (finasteride 5 mg or dutasteride 0.5 mg daily); takes 6 months, shrinks the prostate and halves PSA (double PSA to interpret).`);
    if (x.storage) out.push(x.pvr >= 150 ? `Storage symptoms but post-void residual ${x.pvr} ml: avoid antimuscarinics (retention risk); urology review.` : "Storage symptoms (urgency, frequency): add mirabegron 25–50 mg daily or an antimuscarinic (solifenacin 5 mg; avoid in the frail elderly with cognitive problems).");
    if (x.ed) out.push("Erectile dysfunction too: tadalafil 5 mg daily helps both (not with nitrates).");
  }
  if (x.nocturnalPolyuria) out.push("Nocturnal polyuria (over a third of urine at night on a frequency–volume chart): treat oedema, sleep apnoea, evening fluids; desmopressin only with care in older men (check sodium).");
  out.push("Refer to urology: retention, haematuria, recurrent UTI, stones, raised creatinine, suspicious DRE or raised PSA, or symptoms despite medicines (TURP, HoLEP).");
  return out;
}

/* ================================================================== haemorrhoids and anal fissure */

export function haemPlan(grade: 1 | 2 | 3 | 4, thrombosedHours: number): string[] {
  const out = ["Everyone: fibre 25–30 g a day (isabgol), plenty of fluids, don't strain or sit long on the toilet, warm sitz baths; a short course of a soothing cream for symptoms (avoid steroid creams beyond 1 week)."];
  if (thrombosedHours > 0) out.push(thrombosedHours <= 72 ? `Thrombosed external haemorrhoid ${thrombosedHours} hours old: excision under local anaesthetic gives fastest relief.` : `Thrombosed external haemorrhoid ${thrombosedHours} hours old: conservative (analgesia, sitz baths, stool softener); it settles in 1–2 weeks.`);
  if (grade <= 2) out.push(`Grade ${grade === 1 ? "I (bleeds, no prolapse)" : "II (prolapses, goes back on its own)"}: rubber band ligation if symptoms persist (sclerotherapy or infrared coagulation are alternatives).`);
  if (grade === 3) out.push("Grade III (needs pushing back): rubber band ligation, or surgery (haemorrhoidectomy, stapled haemorrhoidopexy, Doppler-guided ligation) if bands fail.");
  if (grade === 4) out.push("Grade IV (cannot be pushed back): surgical haemorrhoidectomy; strangulated or gangrenous haemorrhoids need urgent surgical review.");
  out.push("Red flags needing colonoscopy: age over 50 with new bleeding, change in bowel habit, anaemia, weight loss, family history of bowel cancer, or dark blood mixed with stool.");
  return out;
}
export function fissurePlan(weeks: number, atypical: boolean): string[] {
  if (atypical) return ["Atypical fissure (lateral, multiple, painless, large or not healing): look for Crohn's disease, TB, HIV, syphilis, herpes or anal cancer; examination under anaesthesia and biopsy."];
  const chronic = weeks >= 6;
  const out = [
    "Stool softeners and fibre, plenty of fluid, warm sitz baths, lidocaine 5% ointment before stools.",
    "Glyceryl trinitrate 0.2% ointment twice daily for 6–8 weeks (headache is common), or diltiazem 2% ointment twice daily for 6–8 weeks (fewer headaches).",
  ];
  if (chronic) out.push(`Chronic fissure (${weeks} weeks: sentinel tag, exposed sphincter fibres): if not healed after 8 weeks of treatment, botulinum toxin injection or lateral internal sphincterotomy (most effective; small risk of incontinence).`);
  else out.push(`Acute fissure (${weeks || "under 6"} weeks): most heal with these measures.`);
  return out;
}

/* ================================================================== psoriasis */

export function psoriasisSeverity(bsa: number, special: boolean, dlqi: number): { band: "mild" | "moderate" | "severe"; text: string } {
  const band: "mild" | "moderate" | "severe" = bsa > 10 || dlqi > 10 ? "severe" : bsa >= 3 || special ? "moderate" : "mild";
  return { band, text: `BSA ${bsa}% (patient's palm about 1%)${special ? ", special site (face, scalp, genitals, palms/soles or nails)" : ""}${dlqi ? `, DLQI ${dlqi}` : ""}: ${band}.` };
}
export function psoriasisPlan(band: "mild" | "moderate" | "severe", kg: number, female: boolean): string[] {
  const out = [
    "Body and limbs: calcipotriol with betamethasone (gel or ointment) once daily for up to 4 weeks, then twice weekly to maintain; emollients daily.",
    "Face, flexures and genitals: mild steroid (hydrocortisone 1%) short course or tacrolimus 0.1% ointment; scalp: coal tar or ketoconazole shampoo, salicylic acid to lift scale, then calcipotriol–betamethasone gel.",
  ];
  if (band !== "mild") out.push("Phototherapy: narrowband UVB 2–3 times a week where available.");
  if (band === "severe") {
    out.push(`Systemic: methotrexate 7.5–25 mg ONCE A WEEK with folic acid (first line in India; see DMARD Monitoring); or ciclosporin ${kg > 0 ? `${Math.round(2.5 * kg)}–${Math.round(5 * kg)} mg` : "2.5–5 mg/kg"} a day for up to a year (BP and creatinine); acitretin ${kg > 0 ? `${Math.round(0.3 * kg)}–${Math.round(0.5 * kg)} mg` : "0.3–0.5 mg/kg"} daily${female ? " (avoid in women who could become pregnant: pregnancy must be avoided for 3 years after)" : ""}; apremilast.`);
    out.push("Biologics (adalimumab biosimilars, secukinumab, itolizumab) if systemics fail; screen for TB, hepatitis B and C before starting.");
  }
  out.push("Avoid oral steroids (rebound and pustular flares); check joints for psoriatic arthritis, and BP, weight, lipids and glucose (higher heart risk); stop smoking, limit alcohol.");
  return out;
}

/* ================================================================== acute viral hepatitis A and E */

export const HEP_FLAGS = ["Confusion, drowsiness or behaviour change", "INR 1.5 or more", "Persistent vomiting, cannot keep fluids down", "Bilirubin still rising after 2 weeks or over 15 mg/dL", "Low blood glucose", "Pregnant (especially with hepatitis E)", "Age over 50 or known liver disease", "Shrinking liver or ascites"];
export function hepTriage(flags: boolean[]): { level: "home" | "admit" | "alf"; text: string } {
  if (flags[0] && flags[1]) return { level: "alf", text: "Encephalopathy with INR 1.5 or more: acute liver failure. ICU, N-acetylcysteine is reasonable (non-paracetamol ALF in adults), avoid sedatives, and contact a liver transplant centre now (King's College criteria)." };
  if (flags.some(Boolean)) return { level: "admit", text: "Admit: daily INR, glucose, bilirubin, creatinine and mental status; IV dextrose if not eating; pregnant women with hepatitis E need obstetric and hepatology care (high risk of liver failure in the third trimester)." };
  return { level: "home", text: "Home care: rest as needed, oral fluids, normal balanced diet (no need to avoid oil, turmeric or protein), no alcohol, paracetamol up to 2 g a day only, avoid herbal or unprescribed medicines; check LFT and INR in 1 week." };
}
export function hepMarkers(igmHav: boolean, igmHev: boolean, hbsag: boolean, igmHbc: boolean, antiHcv: boolean): string {
  const f: string[] = [];
  if (igmHav) f.push("acute hepatitis A");
  if (igmHev) f.push("acute hepatitis E");
  if (hbsag && igmHbc) f.push("acute hepatitis B");
  else if (hbsag) f.push("hepatitis B (acute or a flare of chronic infection: check IgM anti-HBc and HBV DNA)");
  if (antiHcv) f.push("hepatitis C exposure (confirm with HCV RNA)");
  if (!f.length) return "No viral marker positive: think of drugs and herbal remedies (including anti-TB drugs), alcohol, autoimmune hepatitis, Wilson's disease (under 40), leptospirosis, malaria, dengue, ischaemia or biliary obstruction.";
  return `Consistent with ${f.join(" and ")}.`;
}
export const HEP_PREVENT = [
  "Hepatitis A: spreads by contaminated food and water; infectious from 2 weeks before to 1 week after jaundice; back to school or work 7 days after jaundice starts; hepatitis A vaccine for contacts who are not immune (within 2 weeks).",
  "Hepatitis E: waterborne; outbreaks after monsoon; no vaccine available in India; safe drinking water and sanitation; extra caution in pregnancy.",
  "Both usually recover fully in 4–8 weeks; neither becomes chronic in healthy people (hepatitis E can in the immunosuppressed).",
];
