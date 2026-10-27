/**
 * Update 46, on the device (no AI): chronic diarrhoea and IBS (Rome IV, calprotectin), sleep apnoea
 * (STOP-BANG, Epworth, AHI), unexplained weight loss, polyuria and diabetes insipidus, short stature
 * and growth, urinary incontinence in women (ICIQ-UI SF), dysmenorrhoea and endometriosis, groin
 * hernia and undescended testis, restless legs, Raynaud's phenomenon, scabies and head lice, and
 * peripheral neuropathy.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ================================================================== chronic diarrhoea and IBS */

export const BOWEL_FLAGS = [
  "New symptoms after age 50",
  "Rectal bleeding",
  "Unintended weight loss",
  "Waking at night to open bowels",
  "Iron-deficiency anaemia",
  "Family history of bowel cancer, IBD or coeliac disease",
  "Fever, or a mass on examination",
];
export interface RomeInput { painDaysPerWeek: number; months: number; defecation: boolean; frequency: boolean; form: boolean }
/** Rome IV IBS: pain on average 1 day a week or more in the last 3 months, with 2 or more of the 3 features, onset 6 months or more before. */
export function romeIV(x: RomeInput): { meets: boolean; features: number; text: string } {
  const features = [x.defecation, x.frequency, x.form].filter(Boolean).length;
  const meets = x.painDaysPerWeek >= 1 && x.months >= 6 && features >= 2;
  return {
    meets,
    features,
    text: meets
      ? "Meets Rome IV criteria for IBS (if there are no red flags and the basic tests are normal)."
      : x.months > 0 && x.months < 6 ? "Symptoms under 6 months: Rome IV needs onset at least 6 months ago." : "Does not meet Rome IV criteria yet: pain at least 1 day a week, and 2 of: related to defecation, change in frequency, change in form.",
  };
}
export function calprotectin(ugPerG: number): { band: "normal" | "borderline" | "raised"; text: string } {
  if (ugPerG < 50) return { band: "normal", text: "Under 50 µg/g: IBD unlikely; manage as IBS if there are no red flags." };
  if (ugPerG <= 200) return { band: "borderline", text: "50–200 µg/g: repeat in 4–6 weeks off NSAIDs and PPIs; refer if still raised or symptoms persist." };
  return { band: "raised", text: "Over 200 µg/g: refer for colonoscopy (likely IBD or other inflammation)." };
}
export function bowelPlan(subtype: "D" | "C" | "M", flags: boolean[]): { urgent: boolean; tests: string[]; treat: string[] } {
  const urgent = flags.some(Boolean);
  const tests = [
    "CBC, ESR or CRP, and tTG-IgA with total IgA for coeliac disease (while still eating gluten).",
    "Stool microscopy for ova, cysts and parasites (Giardia, amoeba) — common in India; stool culture if acute or travel.",
    "Faecal calprotectin when diarrhoea is the main symptom, to separate IBD from IBS.",
    "TSH if diarrhoea; HbA1c; consider HIV with consent if chronic diarrhoea with weight loss.",
  ];
  if (urgent) tests.unshift("Red flags: refer for colonoscopy (and upper endoscopy if anaemia or weight loss) rather than diagnosing IBS.");
  const treat = [
    "Explain IBS is real and common; regular meals, enough water, less caffeine, alcohol and fizzy drinks; regular exercise.",
    "If diet changes don't help: low-FODMAP diet for 4–6 weeks with a dietitian, then reintroduce foods.",
    "Pain or bloating: antispasmodic, e.g. mebeverine 135 mg three times daily before meals, or dicyclomine 10–20 mg up to three times daily.",
  ];
  if (subtype === "D" || subtype === "M") treat.push("Diarrhoea: loperamide 2 mg after each loose stool (max 16 mg/day); rifaximin 550 mg three times daily for 14 days if bloating and diarrhoea persist.");
  if (subtype === "C" || subtype === "M") treat.push("Constipation: soluble fibre (ispaghula 1–2 sachets daily, increase slowly; avoid bran); then PEG (macrogol); linaclotide if still no better.");
  treat.push("Ongoing pain after 3 months: low-dose amitriptyline 10 mg at night, increase by 10 mg every 2 weeks to 30 mg (an SSRI is second line); CBT or gut-directed hypnotherapy if available.");
  return { urgent, tests, treat };
}

/* ================================================================== sleep apnoea */

export interface StopBangInput { snore: boolean; tired: boolean; observed: boolean; pressure: boolean; bmi: number; age: number; neckCm: number; male: boolean }
export function stopBang(x: StopBangInput): { score: number; level: "low" | "intermediate" | "high"; text: string } {
  const stop = [x.snore, x.tired, x.observed, x.pressure].filter(Boolean).length;
  const score = stop + (x.bmi > 35 ? 1 : 0) + (x.age > 50 ? 1 : 0) + (x.neckCm > 40 ? 1 : 0) + (x.male ? 1 : 0);
  const high = score >= 5 || (stop >= 2 && (x.male || x.bmi > 35 || x.neckCm > 40));
  const level = high ? "high" : score >= 3 ? "intermediate" : "low";
  return {
    score, level,
    text: level === "high" ? `STOP-BANG ${score}: high risk of moderate to severe OSA — arrange a sleep study.` : level === "intermediate" ? `STOP-BANG ${score}: intermediate risk — sleep study if symptomatic or before major surgery.` : `STOP-BANG ${score}: low risk of OSA.`,
  };
}
export function epworth(ess: number): { band: "normal" | "mild" | "moderate" | "severe"; text: string } {
  if (ess <= 10) return { band: "normal", text: `Epworth ${ess}: normal daytime sleepiness.` };
  if (ess <= 12) return { band: "mild", text: `Epworth ${ess}: mild excessive daytime sleepiness.` };
  if (ess <= 15) return { band: "moderate", text: `Epworth ${ess}: moderate excessive daytime sleepiness.` };
  return { band: "severe", text: `Epworth ${ess}: severe excessive daytime sleepiness — advise not to drive while sleepy.` };
}
export function ahiBand(ahi: number): { band: "normal" | "mild" | "moderate" | "severe"; plan: string } {
  if (ahi < 5) return { band: "normal", plan: "AHI under 5: no OSA; look for other causes of sleepiness (insufficient sleep, depression, drugs, hypothyroidism)." };
  if (ahi < 15) return { band: "mild", plan: "Mild OSA (AHI 5–14): weight loss, avoid alcohol and sedatives at night, sleep on the side; CPAP if sleepy or affecting quality of life; mandibular advancement device is an option." };
  if (ahi < 30) return { band: "moderate", plan: "Moderate OSA (AHI 15–29): CPAP, plus weight loss and sleep hygiene; review adherence (at least 4 hours a night)." };
  return { band: "severe", plan: "Severe OSA (AHI 30 or more): CPAP; urgent if sleepy driver or professional driver; check BP, glucose and AF." };
}

/* ================================================================== unexplained weight loss */

export function weightLossPct(before: number, now: number): number {
  return before > 0 && now > 0 && now < before ? r1(((before - now) / before) * 100) : 0;
}
export interface WeightLossInput { pct: number; months: number; age: number; cough: boolean; dysphagia: boolean; bowel: boolean; fever: boolean; polyuria: boolean; mood: boolean; heat: boolean }
export function weightLossPlan(x: WeightLossInput): { significant: boolean; steps: string[] } {
  const significant = x.pct >= 5 && x.months > 0 && x.months <= 12;
  const steps: string[] = [];
  steps.push(significant ? `${x.pct}% in ${x.months} months: clinically significant (5% or more in 6–12 months) — investigate.` : x.pct > 0 ? `${x.pct}% loss: below the 5% threshold — weigh again in 1–3 months.` : "Enter weights to check whether the loss is significant (5% or more in 6–12 months).");
  steps.push("History: appetite and intake, dentition and swallowing, mood, alcohol and tobacco, medicines (metformin, GLP-1, topiramate, levothyroxine excess, stimulants), money and food access.");
  steps.push("First tests for everyone: CBC, ESR/CRP, LFT, creatinine and electrolytes, calcium, glucose/HbA1c, TSH, urine routine, HIV (with consent), stool for occult blood, chest X-ray.");
  if (x.cough || x.fever) steps.push("Cough or fever/night sweats: sputum CBNAAT/Truenat for TB (two samples) — TB is the commonest cause in India; also blood cultures and peripheral smear for fever.");
  if (x.dysphagia) steps.push("Difficulty swallowing: urgent upper GI endoscopy (oesophageal or gastric cancer).");
  if (x.bowel) steps.push("Change in bowel habit or rectal bleeding: colonoscopy.");
  if (x.polyuria) steps.push("Thirst and polyuria: likely uncontrolled or new diabetes; check ketones if unwell.");
  if (x.heat) steps.push("Heat intolerance, tremor, palpitations: hyperthyroidism — TSH, free T4.");
  if (x.mood) steps.push("Low mood, poor sleep or loss of interest: screen for depression (PHQ-9); also consider dementia in older adults.");
  if (x.age >= 50) steps.push("Age 50 or over: low threshold for upper and lower GI endoscopy and CT chest/abdomen/pelvis if first tests do not explain it; breast, prostate and cervical screening as appropriate.");
  steps.push("If all tests are normal and no clue: watchful waiting with weight checks every 1–3 months for 6 months; most serious causes show up in the first tests or on follow-up.");
  return { significant, steps };
}

/* ================================================================== polyuria and diabetes insipidus */

export interface PolyuriaInput { urineL: number; kg: number; glucoseHigh: boolean; uOsm: number; sNa: number }
export function polyuria(x: PolyuriaInput): { polyuric: boolean; kind: "none" | "glucose" | "solute" | "water"; steps: string[] } {
  const perKg = x.kg > 0 ? (x.urineL * 1000) / x.kg : 0;
  const polyuric = x.urineL > 3 || perKg > 50;
  const steps: string[] = [];
  if (!polyuric) return { polyuric, kind: "none", steps: ["Not polyuria (over 3 L/day in adults, over 50 mL/kg/day): consider frequency without high volume — UTI, overactive bladder, prostate, anxiety. Do a 24-hour urine volume or frequency–volume chart."] };
  if (x.glucoseHigh) return { polyuric, kind: "glucose", steps: ["High glucose: osmotic diuresis from diabetes — treat the diabetes; check ketones and HbA1c."] };
  if (x.uOsm >= 300) return { polyuric, kind: "solute", steps: ["Urine osmolality 300 or more: solute diuresis — diuretics, high-protein feeds, urea, mannitol, recovery from AKI or relief of obstruction; check urea and sodium."] };
  steps.push(x.uOsm > 0 ? `Urine osmolality ${x.uOsm}: dilute urine — water diuresis.` : "Measure urine and serum osmolality and sodium together.");
  steps.push("Check calcium and potassium (hypercalcaemia and hypokalaemia cause nephrogenic DI) and ask about lithium.");
  if (x.sNa > 0 && x.sNa < 136) steps.push(`Sodium ${x.sNa}: low-normal or low sodium points to primary polydipsia.`);
  else if (x.sNa > 145) steps.push(`Sodium ${x.sNa}: high sodium with dilute urine is diabetes insipidus until proved otherwise — do not restrict water; give desmopressin test in hospital.`);
  steps.push("Confirm with a water deprivation test (with desmopressin) or copeptin (hypertonic saline or arginine stimulated) in hospital.");
  return { polyuric, kind: "water", steps };
}
/** Water deprivation test: urine osmolality after deprivation and the % rise after desmopressin. */
export function waterDeprivation(uOsmAfter: number, uOsmDdavp: number): { dx: string; rise: number } {
  const rise = uOsmAfter > 0 && uOsmDdavp > 0 ? Math.round(((uOsmDdavp - uOsmAfter) / uOsmAfter) * 100) : 0;
  if (uOsmAfter > 800) return { rise, dx: "Concentrates normally (over 800 mOsm/kg): primary polydipsia — cut fluid gradually; look for psychiatric causes and drugs causing dry mouth." };
  if (uOsmAfter < 300) return { rise, dx: rise > 50 ? `Rise ${rise}% after desmopressin: central (cranial) DI — MRI pituitary; desmopressin, e.g. 0.1 mg orally at night, adjust to response; check sodium within a week (risk of hyponatraemia).` : `Rise ${rise}% after desmopressin: nephrogenic DI — stop lithium if possible, correct calcium and potassium; thiazide with low-salt, low-protein diet.` };
  return { rise, dx: rise > 9 ? `Partial picture (300–800) with ${rise}% rise: partial central DI likely — copeptin test helps.` : "Partial picture (300–800) with little rise: partial nephrogenic DI or primary polydipsia — copeptin test helps." };
}

/* ================================================================== short stature */

/** Mid-parental height: boys (father + mother + 13)/2, girls (father + mother − 13)/2; target ±8.5 cm. */
export function midParental(father: number, mother: number, boy: boolean): { mph: number; low: number; high: number } | null {
  if (!(father > 0 && mother > 0)) return null;
  const mph = r1((father + mother + (boy ? 13 : -13)) / 2);
  return { mph, low: r1(mph - 8.5), high: r1(mph + 8.5) };
}
export function growthVelocity(h1: number, h2: number, months: number): number {
  return h1 > 0 && h2 > h1 && months >= 4 ? r1(((h2 - h1) / months) * 12) : 0;
}
export interface GrowthInput { sds: number | null; velocity: number; ageYears: number; girl: boolean; belowTarget: boolean; disproportion: boolean; dysmorphic: boolean; chronicSymptoms: boolean; boneAge: "unknown" | "normal" | "delayed" }
export function growthAssess(x: GrowthInput): { level: "normal" | "watch" | "refer"; steps: string[] } {
  const steps: string[] = [];
  const short = x.sds !== null && x.sds < -2;
  const veryShort = x.sds !== null && x.sds < -2.5;
  const slow = x.velocity > 0 && x.ageYears >= 3 && x.velocity < 4;
  const refer = veryShort || slow || x.disproportion || x.dysmorphic || x.chronicSymptoms || (short && x.belowTarget);
  if (x.sds !== null) steps.push(x.sds < -2 ? `Height SDS ${x.sds}: short stature (below −2 SD, under the 3rd centile).` : `Height SDS ${x.sds}: within the normal range.`);
  if (x.velocity > 0) steps.push(slow ? `Growth velocity ${x.velocity} cm/year: slow (under 4 cm/year from age 3 to puberty) — pathological until proved otherwise.` : `Growth velocity ${x.velocity} cm/year.`);
  if (refer) {
    steps.push("Investigate and refer to paediatric endocrinology: CBC, ESR, creatinine and electrolytes, LFT, calcium, phosphate, ALP, TSH and free T4, tTG-IgA (coeliac), IGF-1, urine routine, stool examination, and bone age (X-ray left hand and wrist).");
    if (x.girl) steps.push("Every short girl without another explanation: karyotype for Turner syndrome.");
    if (x.disproportion) steps.push("Disproportion (short limbs or trunk): skeletal survey for skeletal dysplasia; check for rickets.");
  } else if (short) {
    steps.push("Short but growing normally and within the family target: likely familial short stature (bone age normal) or constitutional delay (bone age delayed, family history of late puberty).");
    steps.push("Measure again in 6 months to confirm a normal velocity; reassure if normal.");
  }
  if (x.boneAge === "delayed" && !refer) steps.push("Delayed bone age with normal velocity: constitutional delay of growth and puberty — final height is usually normal.");
  if (x.boneAge === "normal" && short && !refer) steps.push("Normal bone age with short parents: familial short stature — final height near the target range.");
  steps.push("Nutrition: check diet and weight-for-height; undernutrition is the commonest cause in India (IAP 2015 charts for Indian children).");
  return { level: refer ? "refer" : short ? "watch" : "normal", steps };
}

/* ================================================================== urinary incontinence (women) */

export function iciqScore(freq: number, amount: number, impact: number): { score: number; band: string } {
  const score = Math.max(0, Math.min(5, freq)) + Math.max(0, Math.min(6, amount)) + Math.max(0, Math.min(10, impact));
  const band = score === 0 ? "none" : score <= 5 ? "slight" : score <= 12 ? "moderate" : score <= 18 ? "severe" : "very severe";
  return { score, band };
}
export function incontinenceType(stress: boolean, urge: boolean): "stress" | "urge" | "mixed" | "unclear" {
  return stress && urge ? "mixed" : stress ? "stress" : urge ? "urge" : "unclear";
}
export function incontinencePlan(type: "stress" | "urge" | "mixed" | "unclear", flags: { haematuria: boolean; recurrentUti: boolean; voiding: boolean; mass: boolean; continuous: boolean }, bmi: number, frail: boolean): { refer: boolean; steps: string[] } {
  const refer = flags.haematuria || flags.recurrentUti || flags.voiding || flags.mass || flags.continuous;
  const steps = ["Urine dipstick (treat UTI first), 3-day bladder diary, vaginal examination for prolapse and atrophy, post-void residual if voiding symptoms."];
  if (refer) steps.push(`Refer to urology/urogynaecology: ${[flags.haematuria && "haematuria", flags.recurrentUti && "recurrent UTI", flags.voiding && "voiding difficulty or high residual", flags.mass && "pelvic mass or prolapse beyond the introitus", flags.continuous && "continuous leakage (fistula)"].filter(Boolean).join(", ")}.`);
  steps.push(`Lifestyle: ${bmi > 30 ? "weight loss (BMI over 30), " : ""}cut caffeine, drink 1.5–2 L a day (not much more or less), stop smoking, treat constipation.`);
  if (type === "stress" || type === "mixed") steps.push("Stress: supervised pelvic floor muscle training for at least 3 months (at least 8 contractions, 3 times a day); then surgery if it fails (colposuspension, autologous sling, bulking agents). Duloxetine only if surgery is not wanted.");
  if (type === "urge" || type === "mixed") {
    steps.push("Urge: bladder training for at least 6 weeks (stretch the time between voids).");
    steps.push(frail ? "Medicines: avoid oxybutynin in frail older women (confusion); mirabegron 25–50 mg once daily (check BP) or a low anticholinergic-burden option such as trospium." : "Medicines: solifenacin 5 mg once daily, tolterodine 2 mg twice daily, or oxybutynin 2.5–5 mg two to three times daily; mirabegron 25–50 mg once daily if anticholinergics are unsuitable. Review at 4 weeks.");
    steps.push("Topical vaginal oestrogen helps urgency in postmenopausal women with atrophy. Still no better: botulinum toxin or tibial nerve stimulation (specialist).");
  }
  if (type === "mixed") steps.push("Mixed: treat the more bothersome symptom first.");
  if (type === "unclear") steps.push("Unclear type: ask what happens just before the leak — cough, sneeze or exercise (stress) vs a sudden need to go (urge); use the bladder diary.");
  return { refer, steps };
}

/* ================================================================== dysmenorrhoea and endometriosis */

export interface DysmenInput { sinceMenarche: boolean; dyspareunia: boolean; chronicPain: boolean; infertility: boolean; heavy: boolean; dyschezia: boolean; irregularBleeding: boolean; mass: boolean; wantsPregnancy: boolean; nsaidFailed: boolean }
export function dysmenPlan(x: DysmenInput): { type: "primary" | "secondary"; refer: boolean; steps: string[] } {
  const secondary = !x.sinceMenarche || x.dyspareunia || x.chronicPain || x.infertility || x.dyschezia || x.irregularBleeding || x.mass || x.nsaidFailed;
  const refer = x.mass || x.infertility || (x.wantsPregnancy && secondary) || (secondary && x.nsaidFailed);
  const steps: string[] = [];
  if (!secondary) {
    steps.push("Primary dysmenorrhoea: NSAID started 1–2 days before or at the start of the period and taken regularly for 2–3 days — mefenamic acid 500 mg three times daily or ibuprofen 400 mg three times daily with food.");
    steps.push("Heat pad, exercise; combined oral contraceptive (or continuous use) if contraception is also wanted, or LNG-IUS.");
    steps.push("No better after 3–6 months of NSAID plus hormones: think secondary causes (endometriosis, adenomyosis).");
    return { type: "primary", refer, steps };
  }
  steps.push("Features of secondary dysmenorrhoea: think endometriosis, adenomyosis, fibroids, PID or an IUD.");
  steps.push("Pelvic examination; transvaginal ultrasound (endometrioma, adenomyosis, fibroids; a normal scan does not exclude endometriosis); STI tests if at risk; pregnancy test.");
  if (x.irregularBleeding) steps.push("Intermenstrual or postcoital bleeding: speculum examination and cervical screening.");
  steps.push("Treat suspected endometriosis empirically: NSAID plus hormonal suppression — combined pill (continuous), dienogest 2 mg daily, or LNG-IUS; review in 3 months.");
  if (x.wantsPregnancy || x.infertility) steps.push("Trying to conceive: avoid hormonal suppression; refer to gynaecology/fertility for laparoscopy and fertility assessment.");
  if (refer) steps.push("Refer to gynaecology: laparoscopy for diagnosis and excision; endometrioma, deep disease (pain on defecation, nodules) or bowel/bladder symptoms need a specialist centre.");
  return { type: "secondary", refer, steps };
}

/* ================================================================== hernia and undescended testis */

export type GroinKind = "inguinal" | "umbilical" | "hydrocele" | "femoral" | "udt";
export interface GroinInput { child: boolean; kind: GroinKind; ageMonths: number; irreducible: boolean; tender: boolean; symptomatic: boolean; bilateralImpalpable: boolean; premature: boolean }
export function groinPlan(x: GroinInput): { urgency: "emergency" | "urgent" | "routine" | "watch"; steps: string[] } {
  if (x.kind !== "udt" && x.kind !== "hydrocele" && (x.irreducible || x.tender)) {
    return { urgency: "emergency", steps: ["Irreducible or tender: incarcerated or strangulated hernia — emergency surgical review; nil by mouth, IV access, analgesia. In children, try gentle reduction under analgesia by a surgeon, then repair within 24–48 hours."] };
  }
  if (x.kind === "femoral") return { urgency: "urgent", steps: ["Femoral hernia (below and lateral to the pubic tubercle, commoner in women): high strangulation risk — urgent surgical referral for repair, even if symptom-free."] };
  if (x.kind === "udt") {
    if (x.bilateralImpalpable && x.ageMonths < 3) return { urgency: "emergency", steps: ["Newborn with both testes impalpable: urgent assessment for a difference of sex development (congenital adrenal hyperplasia can be life-threatening) — electrolytes, 17-OH progesterone, karyotype, pelvic ultrasound."] };
    const steps = ["Examine warm and relaxed (squatting or cross-legged); retractile testes come down fully and stay — annual check only."];
    if (x.ageMonths < 6) steps.push("Under 6 months (corrected age): many descend by 3–6 months; re-examine at 3 and 6 months.");
    steps.push(x.ageMonths >= 6 ? "Still undescended at 6 months: refer to paediatric surgery now; orchidopexy between 6 and 18 months (ideally before 12 months) for fertility and cancer risk." : "Refer by 6 months if still undescended.");
    steps.push("Impalpable testis: no ultrasound needed — diagnostic laparoscopy by the surgeon.");
    return { urgency: x.ageMonths >= 6 ? "urgent" : "watch", steps };
  }
  if (x.kind === "hydrocele") {
    return x.child
      ? { urgency: "watch", steps: ["Infant hydrocele (transilluminates, can get above it): most resolve by 12–24 months; refer if still present after 2 years, if it changes size during the day (communicating), or if a hernia cannot be excluded."] }
      : { urgency: "routine", steps: ["Adult hydrocele: scrotal ultrasound to exclude a testicular tumour or epididymitis; surgery if large or uncomfortable."] };
  }
  if (x.kind === "umbilical") {
    return x.child
      ? { urgency: "watch", steps: ["Umbilical hernia in a child: most close by 4–5 years; refer for repair if still present after age 4–5, if very large, or if it ever becomes stuck or painful."] }
      : { urgency: x.symptomatic ? "routine" : "watch", steps: ["Adult umbilical or paraumbilical hernia: elective repair if symptomatic or enlarging; warn about signs of strangulation."] };
  }
  if (x.child) return { urgency: "urgent", steps: [x.premature || x.ageMonths < 12 ? "Inguinal hernia in an infant: high risk of incarceration — refer to paediatric surgery for repair within 2 weeks (premature babies often before discharge)." : "Inguinal hernia in a child: refer for elective herniotomy within weeks; it does not resolve by itself.", "Teach parents the signs of a stuck hernia: hard, tender lump, crying, vomiting — come straight to hospital."] };
  return { urgency: x.symptomatic ? "routine" : "watch", steps: [x.symptomatic ? "Symptomatic adult inguinal hernia: elective mesh repair (Lichtenstein open or laparoscopic TEP/TAPP)." : "Minimal symptoms in an adult man: watchful waiting is safe (most later choose repair); repair if symptoms develop.", "Women with groin hernias: repair (femoral hernia is easily missed); laparoscopic repair is preferred.", "Advise on signs of strangulation: painful, irreducible lump, vomiting — emergency."] };
}

/* ================================================================== restless legs (mine) */

export const RLS_CRITERIA = [
  "An urge to move the legs, usually with unpleasant sensations",
  "Starts or gets worse at rest (sitting or lying)",
  "Relieved by movement (walking, stretching), at least while moving",
  "Worse in the evening or at night",
  "Not explained by another condition (cramps, positional discomfort, arthritis, oedema, neuropathy)",
];
export interface RlsInput { criteria: boolean[]; ferritin: number; tsat: number; pregnant: boolean; ckd: boolean; daily: boolean; elderly: boolean }
export function rlsPlan(x: RlsInput): { meets: boolean; steps: string[] } {
  const meets = x.criteria.length === 5 && x.criteria.every(Boolean);
  const steps: string[] = [];
  if (!meets) steps.push("All 5 IRLSSG criteria are needed for the diagnosis; review the mimics (cramps, neuropathy, akathisia).");
  steps.push("Remove triggers: antihistamines (sedating), antidepressants (SSRIs, SNRIs, mirtazapine), antipsychotics, metoclopramide; less caffeine, alcohol and nicotine; regular sleep and exercise.");
  const lowIron = x.ferritin > 0 && (x.ferritin <= 75 || (x.tsat > 0 && x.tsat < 20));
  if (x.ferritin === 0) steps.push("Check ferritin and transferrin saturation (morning, fasting) in everyone.");
  else if (lowIron) steps.push(`Ferritin ${x.ferritin}${x.tsat ? `, TSAT ${x.tsat}%` : ""}: replace iron (target ferritin over 75) — oral ferrous sulphate 325 mg (65 mg elemental) once daily or on alternate days with vitamin C; IV iron (ferric carboxymaltose) if ferritin under 100 and oral fails or is not tolerated.`);
  else if (x.ferritin < 100) steps.push(`Ferritin ${x.ferritin}: IV iron can still help if symptoms persist (ferritin under 100).`);
  if (x.pregnant) { steps.push("Pregnancy: iron if ferritin under 75; usually settles after delivery; avoid most drugs — specialist advice for severe cases."); return { meets, steps }; }
  if (x.daily) {
    steps.push(`Daily symptoms: alpha-2-delta ligand first line — gabapentin ${x.elderly || x.ckd ? "100" : "300"} mg 1–2 hours before bed (increase slowly) or pregabalin ${x.elderly || x.ckd ? "50" : "75"} mg at night${x.ckd ? "; reduce doses in CKD" : ""}.`);
    steps.push("Dopamine agonists (pramipexole, ropinirole, rotigotine) are no longer advised for routine use — they cause augmentation (symptoms earlier and worse). Refractory cases: specialist, low-dose opioid.");
  } else steps.push("Intermittent symptoms: non-drug measures; a single dose of gabapentin on bad nights.");
  if (x.ckd) steps.push("CKD/dialysis: correct anaemia and iron; IV iron helps.");
  return { meets, steps };
}

/* ================================================================== Raynaud's (mine) */

export const RAYNAUD_FLAGS = [
  "Onset after age 30",
  "Attacks in one hand only, or asymmetric",
  "Digital ulcers, pitting scars or gangrene",
  "Skin thickening, puffy fingers or calcinosis",
  "Rash, joint pain, dry eyes or mouth, swallowing difficulty",
  "Abnormal nailfold capillaries",
  "Positive ANA",
];
export function raynaudPlan(flags: boolean[], ulcer: boolean, smoker: boolean): { secondary: boolean; steps: string[] } {
  const secondary = flags.some(Boolean);
  const steps: string[] = [];
  if (ulcer) steps.push("Digital ulcer or critical ischaemia (persistent pain, colour change not recovering): same-day referral to rheumatology/vascular — may need IV iloprost.");
  steps.push(secondary ? "Features of secondary Raynaud's: ANA, anti-centromere, anti-Scl-70, CBC, ESR/CRP, creatinine, urine dipstick, TSH; nailfold capillaroscopy; refer to rheumatology (systemic sclerosis, lupus, Sjögren's)." : "Likely primary Raynaud's: young, symmetrical, no ulcers, normal nailfold capillaries — usually no tests beyond CBC, ESR and ANA.");
  steps.push(`Keep the whole body warm (gloves, layers, warm drinks), avoid sudden cold; ${smoker ? "stop smoking (essential), " : ""}avoid beta-blockers, ergotamine and decongestants if possible.`);
  steps.push("Drug treatment if attacks disrupt life: nifedipine modified-release 10 mg twice daily, increasing to 20–30 mg twice daily (or amlodipine 5–10 mg once daily); watch for ankle swelling, flushing, headache.");
  steps.push("Second line (specialist): sildenafil 20 mg three times daily, losartan 25–50 mg daily or fluoxetine 20 mg daily; seasonal treatment over winter is reasonable.");
  return { secondary, steps };
}

/* ================================================================== scabies and lice (mine) */

/** Ivermectin 200 µg/kg, rounded to the nearest 3 mg tablet. */
export function ivermectinMg(kg: number, ugPerKg = 200): number {
  return kg > 0 ? Math.max(3, Math.round((kg * ugPerKg) / 1000 / 3) * 3) : 0;
}
export interface ScabiesInput { kg: number; ageMonths: number; pregnant: boolean; crusted: boolean }
export function scabiesPlan(x: ScabiesInput): string[] {
  const steps: string[] = [];
  const ivOk = x.kg >= 15 && !x.pregnant;
  if (x.crusted) {
    steps.push("Crusted (Norwegian) scabies: highly contagious — isolate, admit or specialist care; contact precautions.");
    steps.push(ivOk ? `Oral ivermectin ${ivermectinMg(x.kg)} mg (200 µg/kg) with food on days 1, 2, 8, 9 and 15 (more doses if severe), plus permethrin 5% every 2–3 days for 1–2 weeks and keratolytic for crusts.` : "Permethrin 5% repeatedly with keratolytics under specialist care (ivermectin is not used under 15 kg or in pregnancy).");
    return steps;
  }
  steps.push(`Permethrin 5% cream: apply to the whole body from the neck down${x.ageMonths < 24 || x.ageMonths > 65 * 12 ? " — include the scalp, face and ears (infant or elderly)" : ""}, including between fingers and toes, under nails and genitals; wash off after 8–14 hours; repeat after 7 days. About 30 g for an adult.`);
  if (x.ageMonths > 0 && x.ageMonths < 2) steps.push("Under 2 months: permethrin under medical supervision (or 5–10% sulphur ointment for 3 nights).");
  steps.push(ivOk ? `Alternative (or mass treatment): oral ivermectin ${ivermectinMg(x.kg)} mg (200 µg/kg) with food, repeat after 7–14 days.` : x.pregnant ? "Pregnancy and breastfeeding: permethrin is safe; avoid oral ivermectin." : "Under 15 kg: topical treatment only (no oral ivermectin).");
  steps.push("Treat all household and close contacts on the same day, even without itching.");
  steps.push("Wash clothes, towels and bedding used in the last 3 days in hot water and dry in the sun, or seal in a bag for 72 hours.");
  steps.push("Itch can continue for 2–4 weeks after successful treatment: antihistamine at night and emollient; it is not treatment failure unless new burrows appear.");
  steps.push("Secondary impetigo: treat the skin infection too (risk of post-streptococcal glomerulonephritis).");
  return steps;
}
export function liceSteps(kg: number): string[] {
  return [
    "Treat only if live lice are found (wet combing with a fine-toothed detection comb).",
    "Dimeticone 4% lotion: apply to dry hair, leave 8 hours (or overnight), wash out; repeat after 7 days. Physical action, so no resistance.",
    "Or wet combing with conditioner every 3–4 days for at least 2 weeks (Bug Busting), until no lice are seen on 3 sessions.",
    "Permethrin 1% works less well now (resistance); malathion 0.5% is an option.",
    kg >= 15 ? `Resistant cases: oral ivermectin ${ivermectinMg(kg, 400)} mg (400 µg/kg), repeat after 7 days.` : "Under 15 kg: topical treatment or wet combing only.",
    "Check all household members and treat those with live lice on the same day; no need to wash everything or keep children off school.",
  ];
}

/* ================================================================== peripheral neuropathy (mine) */

export interface NeuroInput { weeks: number; asymmetric: boolean; motor: boolean; proximal: boolean; autonomic: boolean; thickNerves: boolean; diabetes: boolean; alcohol: boolean; drugs: boolean; age: number }
export function neuropathyAssess(x: NeuroInput): { level: "emergency" | "atypical" | "typical"; steps: string[] } {
  const acute = x.weeks > 0 && x.weeks <= 4 && (x.motor || x.proximal);
  const atypical = x.asymmetric || x.motor || x.proximal || x.autonomic || x.thickNerves || (x.weeks > 0 && x.weeks < 8);
  const steps: string[] = [];
  if (acute) {
    steps.push("Rapidly progressive weakness (days to 4 weeks): treat as Guillain–Barré syndrome until proved otherwise — admit, monitor vital capacity, swallowing and autonomic function.");
    return { level: "emergency", steps };
  }
  steps.push("First tests (highest yield): fasting glucose/HbA1c (or 2-hour OGTT if HbA1c is normal), vitamin B12, serum protein electrophoresis with immunofixation (especially over 50), CBC, creatinine, LFT, TSH.");
  steps.push("Also by risk: HIV, VDRL, hepatitis B and C, folate; urine for Bence Jones protein if myeloma suspected.");
  if (x.thickNerves) steps.push("Thickened nerves or hypopigmented, numb patches: leprosy — slit-skin smear, nerve palpation (ulnar, common peroneal), MDT under NLEP.");
  if (x.alcohol) steps.push("Alcohol: thiamine 100 mg three times daily and B-complex; stop alcohol; check nutrition.");
  if (x.drugs) steps.push("Drug-induced: isoniazid (give pyridoxine 10 mg daily routinely, 50–100 mg for neuropathy), metronidazole, nitrofurantoin, phenytoin, amiodarone, chemotherapy (vincristine, platinum, taxanes), HIV drugs — review and stop if possible.");
  if (x.diabetes) steps.push("Diabetes: improve glucose control; annual foot check with monofilament, daily foot care, proper footwear (high-risk foot clinic if ulcer or deformity).");
  steps.push(atypical ? "Atypical (asymmetric, motor, proximal, autonomic or fast): nerve conduction studies and neurology referral; consider CIDP, vasculitis, paraproteinaemia." : "Typical length-dependent sensory neuropathy with an obvious cause: nerve conduction studies are usually not needed.");
  steps.push(`Neuropathic pain: amitriptyline 10 mg at night, increase to 25–75 mg${x.age >= 65 ? " (caution over 65: falls, urinary retention)" : ""}; or duloxetine 30 mg once daily, then 60 mg; or pregabalin 75 mg twice daily, up to 150–300 mg twice daily (adjust for kidney function). Switch if no benefit at a tolerated dose; capsaicin 0.075% cream for localised pain.`);
  return { level: atypical ? "atypical" : "typical", steps };
}
