/**
 * Update 45, on the device (no AI): chronic cough, haematuria, abnormal LFTs (R factor, FIB-4),
 * lymphadenopathy, abnormal uterine bleeding (PALM-COEIN), amenorrhoea, vaginal discharge and STI
 * (NACO syndromic kits), UTI in children, high blood counts, peripheral arterial disease (ABPI),
 * hair loss and vitiligo.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== chronic cough */

export const COUGH_FLAGS = ["Coughing blood", "Weight loss", "Fever or night sweats", "Breathlessness", "Hoarseness over 3 weeks", "Smoker over 40 with a new or changed cough", "Abnormal chest examination", "Recurrent pneumonia"];
export interface CoughInput { weeks: number; child: boolean; flags: boolean[]; ace: boolean; smoker: boolean; sputum: boolean; wheeze: boolean; heartburn: boolean; postnasal: boolean }
export function coughPlan(x: CoughInput): { urgent: boolean; steps: string[] } {
  const chronic = x.child ? x.weeks >= 4 : x.weeks >= 8;
  const urgent = x.flags.some(Boolean);
  const steps: string[] = [];
  if (x.weeks >= 2) steps.push("Cough 2 weeks or more: presumptive TB under NTEP: sputum for CBNAAT/Truenat (two samples), and chest X-ray.");
  if (urgent) steps.push("Red flags: chest X-ray now and urgent referral (CT chest, bronchoscopy as needed) to exclude lung cancer, TB and other serious disease.");
  if (!chronic && !urgent) { steps.push(`${x.weeks || "Under"} weeks: ${x.child ? "under 4 weeks in a child" : "under 8 weeks"} is usually post-infectious; reassess at ${x.child ? "4" : "8"} weeks if it persists.`); return { urgent, steps }; }
  if (chronic && !urgent) steps.push("Chronic cough: chest X-ray and spirometry with bronchodilator reversibility (FeNO or blood eosinophils if available) for everyone.");
  if (x.ace) steps.push("On an ACE inhibitor: stop it and switch to an ARB; cough settles in 1–4 weeks (sometimes up to 3 months).");
  if (x.smoker) steps.push("Smoking: stop (cough often worsens briefly, then improves); assess for COPD.");
  if (x.wheeze) steps.push("Asthma or eosinophilic bronchitis likely: inhaled corticosteroid trial for 4 weeks (with spirometry or FeNO first).");
  if (x.postnasal) steps.push("Upper airway cough (post-nasal drip, throat clearing): intranasal corticosteroid with saline rinses for 4 weeks.");
  if (x.heartburn) steps.push("Reflux symptoms: PPI twice daily for 8 weeks with lifestyle measures (not useful without reflux symptoms).");
  if (x.sputum) steps.push("Daily sputum: send for culture and AFB; consider bronchiectasis (HRCT) if it persists.");
  if (chronic) steps.push(x.child ? "Children: wet cough over 4 weeks: amoxicillin–clavulanate for 2 weeks (protracted bacterial bronchitis); refer if no better, or if there are red flags (choking episode, failure to thrive, clubbing)." : "Still coughing after treating each cause: refer for refractory chronic cough (HRCT, ENT, speech therapy; specialists may use low-dose morphine or gabapentin).");
  return { urgent, steps };
}

/* ================================================================== haematuria */

export function microRisk(sex: "m" | "f", age: number, packYears: number, rbc: number): { level: "low" | "intermediate" | "high"; plan: string } {
  const high = age >= 60 || packYears > 30 || rbc > 25;
  const inter = (sex === "f" ? age >= 50 : age >= 40) || packYears >= 10 || rbc >= 11;
  if (high) return { level: "high", plan: "High risk: cystoscopy and CT urography (urology)." };
  if (inter) return { level: "intermediate", plan: "Intermediate risk: cystoscopy and renal ultrasound." };
  return { level: "low", plan: "Low risk: repeat urine microscopy in 6 months (or cystoscopy and ultrasound after discussion); evaluate if still present." };
}
export function haematuria(visible: boolean, age: number, uti: boolean, nephro: boolean): string[] {
  const out: string[] = ["Confirm it is real: exclude menstruation, beetroot, rifampicin, myoglobinuria; confirm non-visible haematuria by microscopy (3 or more red cells per high-power field)."];
  if (uti) out.push("Treat the UTI and repeat urine microscopy 6 weeks later; investigate if blood persists.");
  if (visible) out.push(age >= 45 || !uti ? "Visible haematuria (no infection, or persisting after treatment): urgent urology referral for cystoscopy and CT urography (bladder or kidney cancer, stones)." : "Visible haematuria with a UTI: treat, then urology if it persists.");
  if (nephro) out.push("Glomerular features (protein, ACR 30 mg/mmol or more, dysmorphic red cells or casts, raised creatinine, hypertension): nephrology for IgA nephropathy, other glomerulonephritis; urgent if creatinine is rising.");
  out.push("Also check: creatinine and eGFR, urine ACR, BP; urine cytology is not a substitute for cystoscopy.");
  return out;
}

/* ================================================================== abnormal LFTs */

export function rFactor(alt: number, altUln: number, alp: number, alpUln: number): { r: number; pattern: "hepatocellular" | "mixed" | "cholestatic" } | null {
  if (!(alt > 0 && altUln > 0 && alp > 0 && alpUln > 0)) return null;
  const r = r1((alt / altUln) / (alp / alpUln));
  return { r, pattern: r >= 5 ? "hepatocellular" : r <= 2 ? "cholestatic" : "mixed" };
}
export function fib4(age: number, ast: number, alt: number, plt: number): { score: number; band: "low" | "indeterminate" | "high"; text: string } | null {
  if (!(age > 0 && ast > 0 && alt > 0 && plt > 0)) return null;
  const score = r2((age * ast) / (plt * Math.sqrt(alt)));
  const low = age >= 65 ? 2.0 : 1.3;
  const band = score < low ? "low" : score > 2.67 ? "high" : "indeterminate";
  return { score, band, text: band === "low" ? `FIB-4 ${score}: advanced fibrosis unlikely; lifestyle, recheck in 2–3 years.` : band === "high" ? `FIB-4 ${score}: advanced fibrosis likely; refer to hepatology.` : `FIB-4 ${score}: indeterminate; elastography (FibroScan, cut-off 8 kPa) to decide.` };
}
export function lftNext(pattern: "hepatocellular" | "mixed" | "cholestatic", altHigh1000: boolean, under40: boolean): string[] {
  if (pattern === "cholestatic") return [
    "Ultrasound: dilated ducts → MRCP or ERCP (stones, stricture, pancreatic or biliary cancer).",
    "Non-dilated: check GGT (normal GGT with high ALP suggests bone), antimitochondrial antibody (PBC), MRCP for PSC (especially with IBD), drugs (amoxicillin–clavulanate, anabolic steroids), infiltration (TB, lymphoma, metastases).",
  ];
  const out = [
    "Hepatitis screen: HBsAg, anti-HCV, IgM anti-HAV and anti-HEV if acute.",
    "Alcohol history, BMI and metabolic risk (MASLD); medicines and herbal or Ayurvedic remedies (anti-TB drugs, methotrexate, statins rarely).",
    "Autoimmune: ANA, anti-smooth muscle antibody, IgG; iron studies (ferritin and transferrin saturation) for haemochromatosis.",
  ];
  if (under40) out.push("Under 40: caeruloplasmin for Wilson's disease.");
  if (altHigh1000) out.unshift("ALT over 1,000: acute viral hepatitis, ischaemic hepatitis (shock), paracetamol or other drug injury, or a passing common bile duct stone: check INR, glucose and paracetamol level; urgent if INR is raised.");
  if (pattern === "mixed") out.push("Mixed pattern: do both the hepatitis screen and an ultrasound.");
  return out;
}

/* ================================================================== lymphadenopathy */

export interface NodeInput { age: number; sizeCm: number; site: "cervical" | "supraclavicular" | "axillary" | "inguinal" | "epitrochlear"; weeks: number; hard: boolean; generalised: boolean; bSymptoms: boolean; infection: boolean }
export function nodeAssess(x: NodeInput): { level: "watch" | "investigate" | "urgent"; reasons: string[]; steps: string[] } {
  const big = x.site === "inguinal" ? 1.5 : x.site === "epitrochlear" ? 0.5 : 1;
  const reasons: string[] = [];
  if (x.site === "supraclavicular") reasons.push("supraclavicular node (always significant)");
  if (x.sizeCm > 2) reasons.push(`size ${x.sizeCm} cm`);
  if (x.hard) reasons.push("hard, fixed or matted");
  if (x.bSymptoms) reasons.push("fever, night sweats or weight loss");
  if (x.age >= 40 && x.sizeCm > big) reasons.push("age 40 or more");
  const investigate = x.generalised || (x.sizeCm > big && x.weeks >= 4) || x.weeks >= 6;
  const level = reasons.length ? "urgent" : investigate ? "investigate" : "watch";
  const steps = level === "watch" ? [
    `${x.sizeCm ? `${x.sizeCm} cm` : "Small"} ${x.site} node${x.infection ? " with a nearby infection" : ""}: treat any local cause and review in 2–4 weeks; investigate if not smaller.`,
  ] : [
    "Bloods: CBC and peripheral smear, ESR/CRP, HIV, LDH; chest X-ray; ultrasound of the node.",
    `FNAC of the node with CBNAAT and AFB on the aspirate (TB lymphadenitis is the commonest cause of persistent neck nodes in India)${x.generalised ? "; for generalised nodes also EBV/CMV serology, toxoplasma, ANA" : ""}.`,
    "Excision biopsy (not FNAC alone) if lymphoma is suspected: needs architecture for diagnosis.",
  ];
  if (level === "urgent") steps.unshift(`Concerning features (${reasons.join(", ")}): urgent work-up within 2 weeks for lymphoma, metastatic cancer or TB.`);
  if (x.site === "supraclavicular") steps.push("Left supraclavicular (Virchow's) node: look for abdominal and pelvic cancer; right: lung and oesophagus.");
  return { level, reasons, steps };
}

/* ================================================================== abnormal uterine bleeding */

export const PALM_COEIN: [string, string][] = [["Polyp", "Structural"], ["Adenomyosis", "Structural"], ["Leiomyoma (fibroid)", "Structural"], ["Malignancy and hyperplasia", "Structural"], ["Coagulopathy", "Non-structural"], ["Ovulatory dysfunction", "Non-structural"], ["Endometrial causes", "Non-structural"], ["Iatrogenic (drugs, IUD, anticoagulants)", "Non-structural"], ["Not yet classified", "Non-structural"]];
export interface AubInput { age: number; postmenopausal: boolean; unstable: boolean; risk: boolean; structural: boolean; contraception: boolean; fertility: boolean }
export function aubPlan(x: AubInput): { sample: boolean; steps: string[] } {
  if (x.unstable) return { sample: false, steps: ["Heavy bleeding with instability: resuscitate, crossmatch, IV tranexamic acid 1 g; high-dose oral progestin (norethisterone 5–10 mg three times daily) or combined pill regimen; uterine balloon or D&C if not controlled; check hCG and coagulation."] };
  if (x.postmenopausal) return { sample: true, steps: ["Postmenopausal bleeding: urgent gynaecology referral; transvaginal ultrasound: endometrial thickness over 4 mm needs endometrial biopsy or hysteroscopy (cancer until proved otherwise)."] };
  const sample = x.age >= 45 || x.risk;
  const steps = [
    "Pregnancy test first; CBC and ferritin; TSH if other symptoms; coagulation screen if heavy since menarche or family history; cervical screening if due.",
    "Transvaginal ultrasound for structural causes (polyp, fibroid, adenomyosis).",
  ];
  if (sample) steps.push(`Endometrial sampling (pipelle or hysteroscopy): ${x.age >= 45 ? "age 45 or over" : "risk factors (obesity, PCOS, unopposed oestrogen, tamoxifen, Lynch syndrome, persistent intermenstrual bleeding, failed treatment)"}.`);
  if (x.structural) steps.push("Structural cause: hysteroscopic polypectomy; fibroids: medical treatment, myomectomy or uterine artery embolisation; adenomyosis: LNG-IUS or GnRH analogues.");
  if (x.contraception || !x.fertility) steps.push("First-line medical treatment: levonorgestrel IUS 52 mg (reduces bleeding by about 90% over months) if no large distorting fibroid.");
  steps.push("Or during periods: tranexamic acid 1 g three to four times daily for up to 5 days, with or without mefenamic acid 500 mg three times daily; combined pill or cyclical norethisterone 5 mg three times daily (days 5–26).");
  if (x.fertility) steps.push("Wants pregnancy: tranexamic and mefenamic acid during periods (no hormones); treat any structural cause.");
  steps.push("Correct iron deficiency (oral iron, or IV if severe); surgery (ablation, hysterectomy) if medical treatment fails and family is complete.");
  return { sample, steps };
}

/* ================================================================== amenorrhoea */

export function amenType(age: number, menarche: boolean, breast: boolean, monthsNoPeriod: number, wasRegular: boolean): string {
  if (!menarche) {
    if (age >= 15 || (!breast && age >= 13)) return `Primary amenorrhoea (${!breast ? "no breast development by 13" : "no periods by 15"}): investigate.`;
    return "Not yet amenorrhoea: periods usually start within 3 years of breast development and by 15.";
  }
  const lim = wasRegular ? 3 : 6;
  return monthsNoPeriod >= lim ? `Secondary amenorrhoea (${monthsNoPeriod} months without a period; ${lim} months is the threshold${wasRegular ? " for regular cycles" : " for irregular cycles"}): investigate.` : `${monthsNoPeriod} months: not yet amenorrhoea by definition; pregnancy test if sexually active.`;
}
export interface AmenLabs { pregnant: boolean; prolactinHigh: boolean; tshHigh: boolean; fsh: number; estradiolLow: boolean; hyperandrogen: boolean; priorDandC: boolean; uterusAbsent: boolean; weightLoss: boolean }
export function amenCause(x: AmenLabs, age: number): string[] {
  if (x.pregnant) return ["Pregnant: the commonest cause; arrange antenatal care."];
  const out: string[] = [];
  if (x.uterusAbsent) out.push("Absent uterus: karyotype: 46,XX → Müllerian agenesis (MRKH); 46,XY → androgen insensitivity (gonadectomy timing with a specialist).");
  if (x.tshHigh) out.push("Raised TSH: hypothyroidism (can also raise prolactin); treat and recheck.");
  if (x.prolactinHigh) out.push("High prolactin: repeat unstressed; exclude drugs (antipsychotics, metoclopramide, domperidone) and hypothyroidism; MRI pituitary for prolactinoma; cabergoline.");
  if (x.fsh >= 25) out.push(`FSH ${x.fsh} IU/L (repeat after 4 weeks): ${age > 0 && age < 40 ? "premature ovarian insufficiency: karyotype (Turner, fragile X premutation), autoimmune screen; hormone replacement until 51 for bone and heart" : "menopause"}.`);
  else if (x.estradiolLow && x.fsh > 0) out.push(`Low or normal FSH with low oestradiol: hypothalamic amenorrhoea${x.weightLoss ? " (weight loss, exercise, stress, eating disorder)" : ""} or pituitary disease: MRI if unexplained or with headache or visual symptoms; bone density if prolonged.`);
  if (x.hyperandrogen) out.push("Hirsutism or acne with normal FSH: PCOS most likely (see PCOS tool); check testosterone and 17-OH progesterone.");
  if (x.priorDandC) out.push("Previous D&C or uterine infection with normal hormones: intrauterine adhesions (Asherman syndrome): hysteroscopy.");
  if (!out.length) out.push("Normal results: progestogen challenge (medroxyprogesterone 10 mg for 10 days): bleeding means oestrogen is present (often PCOS or hypothalamic); review weight, exercise and stress.");
  return out;
}

/* ================================================================== vaginal discharge and STI */

export const NACO_KITS: { kit: number; colour: string; syndrome: string; drugs: string }[] = [
  { kit: 1, colour: "Grey", syndrome: "Urethral discharge, cervicitis, anorectal discharge", drugs: "Azithromycin 1 g + cefixime 400 mg, single dose" },
  { kit: 2, colour: "Green", syndrome: "Vaginal discharge (vaginitis)", drugs: "Secnidazole 2 g + fluconazole 150 mg, single dose" },
  { kit: 3, colour: "White", syndrome: "Genital ulcer, non-herpetic", drugs: "Benzathine penicillin 2.4 million units IM + azithromycin 1 g" },
  { kit: 4, colour: "Blue", syndrome: "Genital ulcer, non-herpetic, penicillin allergy", drugs: "Doxycycline 100 mg twice daily for 15 days + azithromycin 1 g" },
  { kit: 5, colour: "Red", syndrome: "Genital ulcer, herpetic", drugs: "Acyclovir 400 mg three times daily for 7 days" },
  { kit: 6, colour: "Yellow", syndrome: "Lower abdominal pain (PID)", drugs: "Cefixime 400 mg once + metronidazole 400 mg twice daily for 14 days + doxycycline 100 mg twice daily for 14 days" },
  { kit: 7, colour: "Black", syndrome: "Inguinal bubo", drugs: "Doxycycline 100 mg twice daily for 21 days + azithromycin 1 g" },
];
export interface DischargeInput { itch: boolean; curdy: boolean; fishy: boolean; frothy: boolean; ph: number; cervicitis: boolean; pain: boolean; pregnant: boolean }
export function dischargeDx(x: DischargeInput): { likely: string[]; steps: string[] } {
  const likely: string[] = [];
  if (x.curdy || (x.itch && x.ph > 0 && x.ph <= 4.5)) likely.push("Candida");
  if (x.fishy || (x.ph > 4.5 && !x.frothy)) likely.push("Bacterial vaginosis");
  if (x.frothy) likely.push("Trichomonas");
  if (x.cervicitis) likely.push("Cervicitis (gonorrhoea, chlamydia)");
  if (x.pain) likely.push("Pelvic inflammatory disease");
  const steps: string[] = [];
  if (likely.includes("Pelvic inflammatory disease")) steps.push("PID: NACO kit 6 (yellow); admit if pregnant, very unwell, tubo-ovarian abscess or not improving in 72 hours; exclude ectopic pregnancy.");
  if (likely.includes("Cervicitis (gonorrhoea, chlamydia)")) steps.push("Cervicitis: NACO kit 1 (grey): azithromycin 1 g + cefixime 400 mg; treat partners.");
  if (likely.includes("Bacterial vaginosis") || likely.includes("Trichomonas")) steps.push(`${likely.includes("Trichomonas") ? "Trichomonas" : "BV"}: metronidazole 400–500 mg twice daily for 7 days${likely.includes("Trichomonas") ? " (treat partners)" : ""}; avoid alcohol.${x.pregnant ? " Safe in pregnancy." : ""}`);
  if (likely.includes("Candida")) steps.push(x.pregnant ? "Candida in pregnancy: clotrimazole 500 mg pessary or 100 mg nightly for 7 days (no oral fluconazole)." : "Candida: fluconazole 150 mg single dose or clotrimazole 500 mg pessary; recurrent (4 or more a year): check glucose, longer course.");
  if (!steps.length) steps.push("No microscopy available: syndromic treatment with NACO kit 2 (green); add kit 1 if cervicitis or partner has urethral discharge.");
  if (x.pregnant) steps.push("Pregnancy: avoid secnidazole, doxycycline and fluconazole; use metronidazole and topical azoles.");
  steps.push("Offer HIV, syphilis (RPR/VDRL) and hepatitis B testing; condoms; partner notification; follow-up in 1–2 weeks.");
  return { likely, steps };
}

/* ================================================================== UTI in children */

export function utiChildRx(ageMonths: number, upper: boolean, unwell: boolean, kg: number): string[] {
  if (ageMonths > 0 && ageMonths < 3) return ["Under 3 months: refer to paediatrics immediately; IV cefotaxime or ceftriaxone (with ampicillin under 1 month for Listeria/Enterococcus); blood and urine cultures."];
  if (unwell) return [kg > 0 ? `Unwell or vomiting: IV ceftriaxone ${Math.round(cap(75 * kg, 2000))} mg once daily (50–75 mg/kg), switch to oral when better; total 7–10 days.` : "Unwell or vomiting: IV ceftriaxone 50–75 mg/kg once daily, switch to oral when better; total 7–10 days."];
  if (upper) return [kg > 0 ? `Upper UTI (fever 38°C or loin pain): oral cefixime ${Math.round(cap(8 * kg, 400))} mg once daily (8 mg/kg/day) for 7–10 days, or amoxicillin–clavulanate ${Math.round((45 * kg) / 2)} mg (amoxicillin part) twice daily.` : "Upper UTI: oral cefixime 8 mg/kg/day for 7–10 days, or amoxicillin–clavulanate 45 mg/kg/day in 2 doses.", "Review in 48 hours; change to the culture result."];
  return [kg > 0 ? `Lower UTI (cystitis): nitrofurantoin ${r1(cap(0.75 * kg, 50))} mg four times daily, or cefalexin ${Math.round(cap(12.5 * kg, 500))} mg four times daily, for 3 days.` : "Lower UTI: nitrofurantoin 0.75 mg/kg four times daily or cefalexin 12.5 mg/kg four times daily for 3 days.", "Send a clean-catch culture before antibiotics; avoid bag samples for culture."];
}
export function utiChildImaging(ageMonths: number, atypical: boolean, recurrent: boolean): string[] {
  const out: string[] = [];
  if (ageMonths < 6) {
    out.push(atypical || recurrent ? "Ultrasound during the infection." : "Ultrasound within 6 weeks (typical UTI responding to treatment).");
    if (atypical || recurrent) out.push("DMSA scan 4–6 months after the infection, and MCUG.");
  } else if (ageMonths < 36) {
    if (atypical) out.push("Ultrasound during the infection.");
    if (atypical || recurrent) out.push("DMSA scan 4–6 months later; MCUG only if the ultrasound shows dilatation, poor urine flow, non-E. coli infection or family history of VUR.");
    if (!atypical && !recurrent) out.push("First typical UTI that responds: no routine imaging.");
  } else {
    if (atypical) out.push("Ultrasound during the infection.");
    if (recurrent) out.push("Ultrasound within 6 weeks and DMSA scan 4–6 months later.");
    if (!atypical && !recurrent) out.push("First typical UTI that responds: no routine imaging.");
  }
  out.push("Atypical: seriously ill, poor urine flow, abdominal or bladder mass, raised creatinine, sepsis, no response within 48 hours, or non-E. coli organism. Recurrent: 2 or more upper, 1 upper with 1 or more lower, or 3 or more lower UTIs.");
  return out;
}

/* ================================================================== high blood counts */

export interface CountInput { hb: number; male: boolean; plt: number; wbc: number; eos: number; lymph: number; age: number; blasts: boolean }
export function highCounts(x: CountInput): string[] {
  const out: string[] = [];
  if (x.blasts || x.wbc >= 50) out.push(`${x.blasts ? "Blasts on the film" : `White cells ${x.wbc} ×10⁹/L`}: same-day haematology (acute leukaemia, CML); watch for leukostasis (breathlessness, confusion) and tumour lysis.`);
  if (x.hb > (x.male ? 16.5 : 16)) out.push(`Hb ${x.hb} g/dL (over ${x.male ? "16.5" : "16"}): repeat with haematocrit; exclude dehydration, smoking, COPD or sleep apnoea, testosterone, SGLT2 inhibitors, altitude, kidney or liver tumours; JAK2 V617F and serum EPO (low in polycythaemia vera). In PV: venesection to haematocrit under 45% and aspirin 75 mg.`);
  if (x.plt > 450) out.push(`Platelets ${x.plt} ×10⁹/L: most often reactive (iron deficiency, infection, inflammation, bleeding, cancer, after splenectomy): check ferritin and CRP, treat the cause, repeat in 4–6 weeks. Persistent without a cause: JAK2, CALR, MPL (essential thrombocythaemia).${x.plt > 1000 ? " Over 1,000: bleeding risk (acquired von Willebrand) as well as clots: urgent haematology." : ""}`);
  if (x.wbc > 11 && x.wbc < 50 && !x.blasts) out.push(`White cells ${x.wbc}: look at the differential: neutrophilia (infection, steroids, smoking, stress, pregnancy), lymphocytosis (viral; over 5 persisting in someone over 50: flow cytometry for CLL), monocytosis, basophilia (CML).`);
  if (x.eos > 0.5) out.push(`Eosinophils ${x.eos} ×10⁹/L: worms (stool microscopy; empirical albendazole 400 mg is common in India), allergy and asthma, drugs (DRESS), Strongyloides before steroids, vasculitis.${x.eos > 1.5 ? " Over 1.5: hypereosinophilia: check heart (troponin, echo), lungs and skin; haematology." : ""}`);
  if (x.lymph > 5 && x.age >= 50) out.push(`Lymphocytes ${x.lymph} in someone ${x.age}: peripheral smear and flow cytometry for CLL.`);
  if (!out.length) out.push("Enter the counts to interpret.");
  return out;
}

/* ================================================================== peripheral arterial disease (ABPI) */

export function abpi(ankle: number, arm: number): { value: number; band: "noncompressible" | "normal" | "borderline" | "pad" | "severe"; text: string } | null {
  if (!(ankle > 0 && arm > 0)) return null;
  const value = r2(ankle / arm);
  if (value > 1.4) return { value, band: "noncompressible", text: `ABPI ${value}: non-compressible (calcified) arteries, common in diabetes and CKD: use toe pressures (TBI under 0.7 is abnormal) or duplex.` };
  if (value >= 1.0) return { value, band: "normal", text: `ABPI ${value}: normal.` };
  if (value > 0.9) return { value, band: "borderline", text: `ABPI ${value}: borderline; exercise ABPI if symptoms suggest claudication.` };
  if (value >= 0.5) return { value, band: "pad", text: `ABPI ${value}: peripheral arterial disease.` };
  return { value, band: "severe", text: `ABPI ${value}: severe disease; with rest pain, ulcer or gangrene this is chronic limb-threatening ischaemia: urgent vascular referral.` };
}
export const PAD_CARE = [
  "Stop smoking (the single most important step); supervised exercise: walking to near-maximal pain, 30–60 minutes 3 times a week for 3 months.",
  "High-intensity statin (atorvastatin 40–80 mg) and an antiplatelet: clopidogrel 75 mg (or aspirin 75 mg) if symptomatic; low-dose rivaroxaban 2.5 mg twice daily with aspirin in selected high-risk patients.",
  "BP and diabetes control; foot care and footwear; check feet at every visit.",
  "Cilostazol 100 mg twice daily can improve walking distance (avoid in heart failure); stop if no benefit after 3 months.",
  "Refer: rest pain, ulcers, gangrene (urgent); lifestyle-limiting claudication despite 3 months of exercise. Compression stockings are unsafe if ABPI is under 0.8.",
];

/* ================================================================== hair loss */

export function alopeciaPlan(type: "male" | "female" | "telogen" | "areata" | "scarring" | "tinea"): string[] {
  const tests = "Check CBC, ferritin, TSH (and vitamin D if low intake).";
  switch (type) {
    case "male": return ["Male pattern hair loss (temples and crown): minoxidil 5% solution or foam twice daily (shedding for the first 4–6 weeks is normal), and/or finasteride 1 mg daily (may lower libido; halves PSA).", "Low-dose oral minoxidil (1.25–2.5 mg daily) is an option under supervision (fluid retention, palpitations, facial hair).", "Results take 6–12 months; stopping leads to loss over months; hair transplant for stable loss."];
    case "female": return ["Female pattern hair loss (widened parting, crown): minoxidil 2–5% daily; low-dose oral minoxidil under supervision.", "With irregular periods, acne or hirsutism: check testosterone and treat PCOS; spironolactone 50–100 mg (with contraception).", tests];
    case "telogen": return ["Telogen effluvium (diffuse shedding 2–3 months after illness, fever such as dengue or COVID, childbirth, surgery, crash diet or stress): reassure; it settles in 6–12 months.", tests, "Correct iron deficiency (aim ferritin over 40) and a balanced protein intake; review new medicines (retinoids, anticoagulants, antithyroid drugs)."];
    case "areata": return ["Alopecia areata (smooth round patches, exclamation-mark hairs): often regrows in 6–12 months.", "Limited patches: potent topical steroid (clobetasol) or intralesional triamcinolone 2.5–10 mg/ml every 4–6 weeks.", "Extensive or rapidly progressive: dermatology (oral JAK inhibitors such as baricitinib, contact immunotherapy); check thyroid; support for appearance."];
    case "scarring": return ["Scarring alopecia (shiny skin, no follicles, redness or scale at the edge): urgent dermatology and scalp biopsy (lichen planopilaris, discoid lupus); early treatment prevents permanent loss."];
    default: return ["Scaly patches with broken hairs in a child: tinea capitis: oral treatment (see Tinea & Dermatophytosis tool), ketoconazole shampoo for the family."];
  }
}

/* ================================================================== vitiligo */

export interface VitiligoInput { bsa: number; face: boolean; active: boolean; segmental: boolean; stableMonths: number; child: boolean }
export function vitiligoPlan(x: VitiligoInput): string[] {
  const out = ["Confirm with Wood's lamp; check TSH and thyroid antibodies (autoimmune thyroid disease is common); B12, glucose if symptoms."];
  if (x.active) out.push(`Active, spreading disease: oral mini-pulse steroids (${x.child ? "betamethasone or dexamethasone 2.5 mg" : "betamethasone or dexamethasone 5 mg"} on 2 consecutive days a week for 3–6 months, dermatology-supervised) to halt spread, with phototherapy.`);
  if (x.bsa < 10) out.push(`Limited (${x.bsa || "under 10"}% BSA): ${x.face ? "face, neck and folds: tacrolimus 0.1% ointment twice daily" : "body: potent topical steroid (mometasone or clobetasol) once daily, in cycles (e.g. 2 weeks on, 1 week off)"}; ruxolitinib cream where available; review every 3 months.`);
  else out.push(`Extensive (${x.bsa}% BSA): narrowband UVB 2–3 times a week for at least 6–12 months, with topical treatment for key areas.`);
  if (x.segmental || x.stableMonths >= 12) out.push(`${x.segmental ? "Segmental vitiligo" : "Stable for 12 months or more"}: surgical options (punch, blister-roof or melanocyte-keratinocyte transplant) for patches that don't respond.`);
  out.push("Sunscreen and camouflage make-up; it is not infectious and not caused by food (milk, fish or sour foods are safe to eat); offer psychological support.");
  return out;
}
