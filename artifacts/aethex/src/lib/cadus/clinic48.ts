/**
 * Update 48, on the device (no AI): dysphagia, tired all the time, fever of unknown origin, chronic
 * itch, early and late puberty, adnexal mass (RMI), pelvic organ prolapse (POP-Q), breast pain,
 * hoarseness, tinnitus, warts and molluscum, and paronychia and ingrown toenail.
 */

/* ================================================================== dysphagia */

export interface DysphagiaInput { oropharyngeal: boolean; solidsProgressive: boolean; solidsAndLiquids: boolean; intermittent: boolean; weightLoss: boolean; odynophagia: boolean; impaction: boolean; heartburn: boolean; atopy: boolean; age: number }
export function dysphagiaPlan(x: DysphagiaInput): { urgency: "emergency" | "urgent" | "soon"; likely: string; steps: string[] } {
  const steps: string[] = [];
  if (x.impaction) {
    steps.push("Food stuck now and cannot swallow saliva: emergency endoscopy (within 6 hours if completely obstructed, within 24 hours otherwise); nil by mouth; do not give meat tenderisers or barium. Take biopsies afterwards (eosinophilic oesophagitis is a common cause).");
    return { urgency: "emergency", likely: "Food bolus impaction", steps };
  }
  let likely = "Oesophageal dysphagia";
  if (x.oropharyngeal) likely = "Oropharyngeal dysphagia (neurological or muscular)";
  else if (x.solidsAndLiquids) likely = "Motility disorder (achalasia, spasm, scleroderma)";
  else if (x.solidsProgressive) likely = "Mechanical obstruction: stricture or cancer";
  else if (x.intermittent) likely = x.atopy ? "Eosinophilic oesophagitis (or ring or web)" : "Ring, web or eosinophilic oesophagitis";
  if (x.oropharyngeal) {
    steps.push("Trouble starting a swallow, coughing or choking, nasal regurgitation: oropharyngeal — speech and language therapy swallow assessment and videofluoroscopy; look for stroke, Parkinson's, myasthenia gravis, motor neurone disease, and check the neck.");
    steps.push("Until assessed: modified diet and thickened fluids as advised; watch for aspiration pneumonia and weight loss.");
  } else {
    steps.push(`Any new oesophageal dysphagia: upper GI endoscopy first (NICE: urgent suspected-cancer referral${x.age >= 55 && x.weightLoss ? " — age 55 or over with weight loss is very high risk" : ""}). Take oesophageal biopsies (at least 6, two levels) even if it looks normal, to look for eosinophilic oesophagitis.`);
    if (x.solidsProgressive) steps.push("Progressive solids then liquids: peptic stricture (long reflux history) or cancer (weight loss, older, smoker, alcohol) — endoscopy with biopsy, then CT staging if malignant.");
    if (x.solidsAndLiquids) steps.push("Solids and liquids from the start: motility — if endoscopy is normal, high-resolution manometry and timed barium swallow for achalasia (treat with pneumatic dilatation, Heller myotomy or POEM).");
    if (x.intermittent) steps.push("Intermittent solid-food sticking: Schatzki ring or web (dilatation), or eosinophilic oesophagitis (PPI high dose for 8 weeks, swallowed budesonide or fluticasone, elimination diet).");
    if (x.heartburn) steps.push("Reflux symptoms: PPI after biopsies; peptic stricture needs dilatation plus long-term PPI.");
  }
  if (x.odynophagia) steps.push("Painful swallowing: candida (HIV, inhaled steroids, diabetes), herpes or CMV, or pill oesophagitis (doxycycline, NSAIDs, bisphosphonates, potassium, iron) — take pills upright with a full glass of water.");
  if (x.weightLoss) steps.push("Weight loss: check nutrition and hydration; dietitian; consider early feeding support.");
  return { urgency: x.weightLoss || x.solidsProgressive || x.age >= 55 ? "urgent" : "soon", likely, steps };
}

/* ================================================================== tired all the time */

export const FATIGUE_FLAGS = ["Weight loss", "Fever or night sweats", "Swollen lymph nodes", "Breathlessness or chest pain", "Bleeding or bruising", "New symptoms after 50"];
export interface FatigueInput { weeks: number; flags: boolean[]; snore: boolean; poorSleep: boolean; lowMood: boolean; drugs: boolean; heavyPeriods: boolean; alcohol: boolean; postViral: boolean; worseAfterEffort: boolean }
export function fatiguePlan(x: FatigueInput): { urgent: boolean; steps: string[] } {
  const urgent = x.flags.some(Boolean);
  const steps: string[] = [];
  if (urgent) steps.push("Red flags: investigate promptly for infection (TB, HIV), cancer (lymphoma, leukaemia), heart failure or anaemia from blood loss.");
  steps.push("History first: sleep (amount, quality, snoring), mood (PHQ-2, then PHQ-9), work and caring load, alcohol, diet, shifts, screens, and how much they can still do.");
  if (x.snore) steps.push("Snoring, witnessed pauses or daytime sleepiness: sleep apnoea — STOP-BANG (see the Sleep Apnoea tool).");
  if (x.poorSleep) steps.push("Poor sleep: sleep hygiene and CBT for insomnia (see Insomnia & Sleep).");
  if (x.lowMood) steps.push("Low mood or anxiety: the commonest cause of persistent tiredness — PHQ-9, GAD-7, and treat (see Mental Health Screening).");
  if (x.drugs) steps.push("Medicines: beta-blockers, sedating antihistamines, antidepressants, antipsychotics, opioids, gabapentinoids, benzodiazepines, statins (myalgia) — review and simplify.");
  if (x.alcohol) steps.push("Alcohol: AUDIT-C; LFT, GGT, MCV.");
  steps.push(`First tests (about 2–4 weeks in, or sooner with flags): CBC, ferritin${x.heavyPeriods ? " (heavy periods: iron deficiency is likely)" : ""}, HbA1c, TSH, creatinine and electrolytes, calcium, LFT, ESR/CRP, urine dipstick; vitamin B12 and coeliac (tTG-IgA) if anaemia or GI symptoms; HIV if any risk; pregnancy test if relevant.`);
  if (x.postViral) steps.push("After a viral illness (including COVID and dengue): post-viral fatigue usually improves over weeks to months — pace activity, gradual return.");
  if (x.weeks >= 12 && x.worseAfterEffort) steps.push("Over 3 months with worsening after effort (post-exertional malaise), unrefreshing sleep and brain fog, with normal tests: consider ME/CFS (NICE NG206) — energy management and pacing, not fixed graded exercise; specialist service.");
  steps.push("Most people with normal tests improve: agree a plan for sleep, activity, diet and stress, and review in 4–6 weeks.");
  return { urgent, steps };
}

/* ================================================================== fever of unknown origin */

export type FuoCategory = "classic" | "hospital" | "neutropenic" | "hiv";
export interface FuoInput { weeks: number; category: FuoCategory; eschar: boolean; kalaAzarArea: boolean; animal: boolean; over50: boolean; arthritisRash: boolean; murmur: boolean; drugsNew: boolean }
export function fuoPlan(x: FuoInput): { fuo: boolean; steps: string[] } {
  const fuo = x.weeks >= 3;
  const steps: string[] = [];
  if (x.category === "neutropenic") { steps.push("Neutropenic fever: an emergency — broad-spectrum IV antibiotics within 1 hour (see Febrile Neutropenia)."); return { fuo, steps }; }
  steps.push(fuo ? "Fever 38.3 °C or more on several occasions for 3 weeks or more without a diagnosis after basic tests: fever of unknown origin." : "Under 3 weeks: not yet FUO — think of common tropical fevers first (malaria, dengue, typhoid, scrub typhus, leptospirosis).");
  steps.push("Confirm the fever (documented temperature chart); stop non-essential drugs; avoid empirical antibiotics and steroids if the patient is stable — they hide the diagnosis.");
  steps.push("Stage 1: CBC with peripheral smear, ESR, CRP, LFT, creatinine, LDH, ferritin, urine routine and culture, 3 sets of blood cultures before antibiotics, malaria smear or RDT, HIV, chest X-ray, ultrasound abdomen; ANA and RF. (Widal is not reliable — use blood culture.)");
  steps.push("Common causes in India: TB (extrapulmonary, disseminated), enteric fever, liver or other abscess, infective endocarditis, lymphoma, SLE and adult-onset Still's disease, drug fever.");
  if (x.eschar) steps.push("Eschar (black painless scab, look in groin, axilla, waist): scrub typhus — IgM ELISA; start doxycycline 100 mg twice daily.");
  if (x.kalaAzarArea) steps.push("From or visited Bihar, Jharkhand, West Bengal or UP with big spleen: visceral leishmaniasis — rK39 rapid test; bone marrow or splenic aspirate.");
  if (x.animal) steps.push("Animal, unpasteurised milk or farm exposure: brucellosis (Brucella serology, prolonged blood culture), leptospirosis (IgM), Q fever.");
  if (x.murmur) steps.push("Murmur, embolic signs or a prosthetic valve: echocardiogram (TOE if TTE is negative) — modified Duke criteria.");
  if (x.arthritisRash) steps.push("Rash, arthritis, sore throat with very high ferritin (often over 3,000): adult-onset Still's disease — a diagnosis of exclusion.");
  if (x.over50) steps.push("Over 50 with headache, jaw claudication, raised ESR: giant cell arteritis — urgent temporal artery ultrasound or biopsy.");
  if (x.drugsNew) steps.push("New drugs (beta-lactams, anticonvulsants, allopurinol, sulfonamides): drug fever — stop and watch for 72 hours.");
  steps.push("Stage 2 (no answer from stage 1): CT chest, abdomen and pelvis; bone marrow aspirate and biopsy with AFB and fungal culture (TB, lymphoma, leishmaniasis); PET-CT where available; biopsy of any accessible node or lesion.");
  if (x.category === "hiv") steps.push("HIV with fever: TB (including disseminated, urine LAM), MAC, cryptococcus (serum CrAg), histoplasmosis, PCP, lymphoma, IRIS after starting ART.");
  if (x.category === "hospital") steps.push("Hospital-acquired FUO: lines, catheters, C. difficile, sinusitis with NG tubes, drug fever, DVT/PE, acalculous cholecystitis.");
  return { fuo, steps };
}

/* ================================================================== chronic itch */

export interface ItchInput { rash: boolean; elderlyDry: boolean; night: boolean; household: boolean; jaundice: boolean; kidney: boolean; pregnant: boolean; afterBath: boolean; nightSweats: boolean; drugs: boolean; localNeuro: boolean }
export function itchPlan(x: ItchInput): string[] {
  const s: string[] = [];
  if (x.household && x.night) s.push("Night itch with others at home itching: scabies until proved otherwise — look for burrows (see Scabies & Head Lice).");
  if (x.rash) s.push("Itch with a primary rash: treat the skin disease — eczema, urticaria, psoriasis, lichen planus, tinea (scrape), dermatitis herpetiformis (coeliac).");
  else s.push("Itch without a primary rash (only scratch marks): look for a systemic cause — CBC, ferritin, LFT with ALP and bilirubin, creatinine, TSH, glucose/HbA1c, ESR, HIV and hepatitis B and C; chest X-ray if older or with flags.");
  if (x.pregnant) s.push("Pregnant with itchy palms and soles, no rash: intrahepatic cholestasis of pregnancy — bile acids and LFT; ursodeoxycholic acid; obstetric review (fetal risk).");
  if (x.jaundice) s.push("Cholestatic itch (liver disease, PBC, obstruction): treat the cause; cholestyramine 4 g up to 4 times daily (2 hours apart from other drugs), then rifampicin, naltrexone or sertraline under specialist care.");
  if (x.kidney) s.push("CKD itch: optimise dialysis, phosphate and PTH; emollients; gabapentin 100 mg after each dialysis (or pregabalin 25 mg); difelikefalin where available.");
  if (x.afterBath || x.nightSweats) s.push(`${x.afterBath ? "Itch after a bath (aquagenic) suggests polycythaemia vera — CBC, JAK2. " : ""}${x.nightSweats ? "Night sweats or weight loss: lymphoma (especially Hodgkin) — examine nodes, CT if needed." : ""}`.trim());
  if (x.drugs) s.push("Medicines: opioids, chloroquine (common in Indian patients), ACE inhibitors, statins, hydroxyethyl starch — review.");
  if (x.localNeuro) s.push("Localised itch with no rash (upper back between shoulder blades, forearms): neuropathic — notalgia paraesthetica or brachioradial pruritus; capsaicin cream, gabapentin.");
  if (x.elderlyDry) s.push("Older adult with dry skin: xerosis — usually the answer once the blood tests are normal.");
  s.push("For everyone: emollient liberally twice daily and after washing, soap substitutes, lukewarm short baths, short nails, cotton clothes; menthol 1–2% in aqueous cream for relief.");
  s.push("Non-sedating antihistamines only help urticaria; a sedating antihistamine at night can help sleep (avoid in the elderly). Gabapentin, pregabalin or sertraline for chronic itch that resists treatment (specialist).");
  return s;
}

/* ================================================================== early and late puberty */

export interface PubertyInput { girl: boolean; age: number; started: boolean; rapid: boolean; neuro: boolean; cafeAuLait: boolean; pubicOnly: boolean; breastOnlyUnder3: boolean; anosmia: boolean; short: boolean; chronic: boolean; lowWeight: boolean }
export function pubertyAssess(x: PubertyInput): { type: "precocious" | "delayed" | "normal" | "variant"; steps: string[] } {
  const early = x.started && x.age > 0 && x.age < (x.girl ? 8 : 9);
  const late = !x.started && x.age >= (x.girl ? 13 : 14);
  const steps: string[] = [];
  if (early) {
    if (x.breastOnlyUnder3 && x.girl) { steps.push("Breast budding only, under 3 years, no growth spurt: premature thelarche — usually benign; review every 3–6 months for progression."); return { type: "variant", steps }; }
    if (x.pubicOnly) { steps.push("Pubic or axillary hair and body odour only, normal growth: premature adrenarche — check DHEAS and 17-OH progesterone (non-classic CAH), bone age; review for PCOS later in girls."); return { type: "variant", steps }; }
    steps.push(`Precocious puberty: ${x.girl ? "breast development before 8" : "testicular enlargement (4 mL or more) or virilisation before 9"} — refer to paediatric endocrinology.`);
    steps.push("Tests: bone age, basal LH (over 0.3 IU/L suggests central), FSH, oestradiol or testosterone, TSH, prolactin; pelvic ultrasound in girls; 17-OH progesterone, DHEAS and androstenedione if virilised; β-hCG in boys.");
    steps.push(`MRI brain for central precocious puberty in ${x.girl ? "girls under 6, rapid progression or any neurological sign" : "all boys"}${x.neuro ? " — urgent with headache or vision change" : ""}.`);
    if (x.cafeAuLait) steps.push("Café-au-lait patches: McCune–Albright syndrome or neurofibromatosis type 1.");
    if (!x.girl) steps.push("Boys: one large testis suggests a tumour (testicular ultrasound); small testes with virilisation suggest adrenal or hCG source.");
    steps.push("Central precocious puberty with rapid progression: GnRH agonist (e.g. leuprolide depot) by the specialist to protect adult height and for psychosocial reasons.");
    return { type: "precocious", steps };
  }
  if (late) {
    steps.push(`Delayed puberty: ${x.girl ? "no breast development by 13 (or no periods by 15)" : "no testicular enlargement by 14"}.`);
    steps.push("Tests: height and growth velocity, bone age, CBC, ESR, creatinine, LFT, TSH, tTG-IgA (coeliac), prolactin, LH, FSH, oestradiol or morning testosterone.");
    steps.push("High LH and FSH: primary gonadal failure — karyotype (Turner syndrome in girls, Klinefelter in boys). Low or normal LH and FSH: constitutional delay (commonest, especially boys with a family history) vs hypogonadotropic hypogonadism.");
    if (x.anosmia) steps.push("Poor sense of smell: Kallmann syndrome — MRI of olfactory bulbs and pituitary.");
    if (x.chronic || x.lowWeight) steps.push("Chronic illness, undernutrition, heavy exercise or an eating disorder delay puberty — treat the cause.");
    if (x.neuro) steps.push("Headache, vision change or other pituitary hormone problems: MRI pituitary (craniopharyngioma).");
    if (x.short && x.girl) steps.push("Short girl with delayed puberty: Turner syndrome until proved otherwise.");
    steps.push("Refer to paediatric endocrinology; short courses of low-dose testosterone (boys) or oestradiol (girls) can start puberty and help confidence.");
    return { type: "delayed", steps };
  }
  steps.push(x.age > 0 ? `Timing is within the normal range for a ${x.girl ? "girl (puberty starts 8–13)" : "boy (puberty starts 9–14)"}.` : "Enter age and whether puberty has started.");
  if (x.rapid) steps.push("Very rapid progression (a Tanner stage every 3–6 months) still needs review.");
  return { type: "normal", steps };
}

/* ================================================================== adnexal mass */

export const RMI_FEATURES = ["Multilocular cyst", "Solid areas", "Bilateral lesions", "Ascites", "Signs of spread (metastases)"];
/** Risk of Malignancy Index 1 = U × M × CA-125 (U: 0, 1 or 3 by ultrasound features; M: 1 premenopausal, 3 postmenopausal). */
export function rmi(features: number, postmenopausal: boolean, ca125: number): { u: number; m: number; score: number; band: "low" | "moderate" | "high" } {
  const u = features === 0 ? 0 : features === 1 ? 1 : 3;
  const m = postmenopausal ? 3 : 1;
  const score = Math.round(u * m * Math.max(0, ca125));
  return { u, m, score, band: score >= 200 ? "high" : score >= 25 ? "moderate" : "low" };
}
export interface AdnexalInput { postmenopausal: boolean; age: number; sizeCm: number; simple: boolean; features: number; ca125: number; acutePain: boolean }
export function adnexalPlan(x: AdnexalInput): { refer: boolean; steps: string[] } {
  const steps: string[] = [];
  if (x.acutePain) steps.push("Sudden severe pain: torsion, rupture, haemorrhage or ectopic pregnancy — pregnancy test, urgent gynaecology review (torsion needs surgery to save the ovary).");
  const r = x.ca125 > 0 ? rmi(x.features, x.postmenopausal, x.ca125) : null;
  if (r) steps.push(`RMI ${r.score} (U ${r.u} × M ${r.m} × CA-125 ${x.ca125}): ${r.band === "high" ? "200 or more — refer to gynaecological oncology" : r.band === "moderate" ? "25–199 — moderate risk, gynaecology review" : "under 25 — low risk"}.`);
  const refer = (r?.band === "high") || (!x.simple && x.features >= 2) || (x.postmenopausal && !x.simple);
  if (!x.postmenopausal) {
    if (x.simple) steps.push(x.sizeCm < 5 ? "Premenopausal simple cyst under 5 cm: usually functional — no follow-up needed." : x.sizeCm <= 7 ? "Simple cyst 5–7 cm: yearly ultrasound." : "Simple cyst over 7 cm: MRI or surgical review (torsion risk, harder to assess).");
    else steps.push("Complex cyst: features of dermoid or endometrioma are common and benign-looking (O-RADS); otherwise gynaecology review with CA-125. CA-125 is not needed for simple cysts in premenopausal women.");
    if (x.age > 0 && x.age < 40 && !x.simple) steps.push("Under 40 with a complex mass: AFP, β-hCG and LDH for germ cell tumours.");
  } else {
    steps.push("Postmenopausal: CA-125 and transvaginal ultrasound for every adnexal cyst.");
    steps.push(x.simple && x.sizeCm < 5 && x.ca125 > 0 && x.ca125 < 35 ? "Simple cyst under 5 cm with normal CA-125: repeat ultrasound and CA-125 in 4–6 months; discharge if unchanged or resolved at 1 year." : "Not simple, 5 cm or more, or raised CA-125: refer to gynaecology (oncology if RMI 200 or more).");
  }
  steps.push("Cancer symptoms to ask about: persistent bloating, early fullness, pelvic or abdominal pain, urinary urgency, change in bowel habit, weight loss (NICE NG12).");
  return { refer, steps };
}

/* ================================================================== pelvic organ prolapse */

/** Simplified POP-Q stage from the leading edge (cm relative to the hymen; negative = above). */
export function popStage(edgeCm: number | null, complete: boolean): number {
  if (complete) return 4;
  if (edgeCm === null) return 0;
  if (edgeCm < -1) return 1;
  if (edgeCm <= 1) return 2;
  return 3;
}
export interface ProlapseInput { stage: number; symptomatic: boolean; wantsSurgery: boolean; frail: boolean; sexuallyActive: boolean; retention: boolean; ulcer: boolean; futurePregnancy: boolean; atrophy: boolean }
export function prolapsePlan(x: ProlapseInput): string[] {
  const s: string[] = [];
  s.push(`POP-Q stage ${x.stage}${x.stage >= 3 ? ": beyond the hymen" : x.stage === 2 ? ": at the hymen" : x.stage === 1 ? ": above the hymen" : ""}.`);
  if (x.retention || x.stage === 4) s.push("Check bladder emptying (post-void residual) and kidney ultrasound: severe prolapse can kink the ureters and cause hydronephrosis or retention.");
  if (x.ulcer) s.push("Ulcerated prolapse: vaginal oestrogen, push back and keep reduced (pessary or packing), biopsy if it does not heal.");
  if (!x.symptomatic && x.stage <= 2) s.push("No bothersome symptoms: no treatment needed — lifestyle advice and review if symptoms appear.");
  s.push("Everyone: supervised pelvic floor muscle training for at least 16 weeks, weight loss if overweight, treat constipation and chronic cough, avoid heavy lifting.");
  if (x.atrophy) s.push("Vaginal atrophy: vaginal oestrogen (estriol cream or pessary) — improves comfort and pessary tolerance.");
  if (x.symptomatic) {
    s.push("Vaginal pessary (ring, or Gellhorn for advanced prolapse): try for anyone, especially if surgery is not wanted or not yet (future pregnancy); change or clean every 3–6 months; check for erosion and discharge.");
    if (x.wantsSurgery && !x.futurePregnancy) s.push(x.frail && !x.sexuallyActive ? "Frail and not sexually active: colpocleisis (vaginal closure) is quick with low recurrence." : "Surgery by compartment: anterior or posterior repair; uterine prolapse — vaginal hysterectomy with vault support (sacrospinous fixation) or uterus-sparing hysteropexy; vault prolapse — sacrocolpopexy. Avoid transvaginal mesh for primary repair.");
    if (x.futurePregnancy) s.push("Wants a future pregnancy: pessary and pelvic floor training; delay surgery until the family is complete.");
  }
  return s;
}

/* ================================================================== breast pain */

export interface MastalgiaInput { cyclical: boolean; lump: boolean; skin: boolean; discharge: boolean; focal: boolean; age: number; hormones: boolean; chestWall: boolean }
export function mastalgiaPlan(x: MastalgiaInput): { refer: boolean; steps: string[] } {
  const refer = x.lump || x.skin || x.discharge;
  const s: string[] = [];
  if (refer) s.push(`${[x.lump && "a lump", x.skin && "skin changes or nipple retraction", x.discharge && "nipple discharge (especially bloody or one duct)"].filter(Boolean).join(", ")}: refer to the breast clinic for triple assessment (examination, imaging, biopsy) — NICE suspected cancer pathway if 30 or over with a lump.`);
  if (x.chestWall) s.push("Pain on pressing the ribs or costal cartilage: chest wall pain (costochondritis) — NSAID gel, reassurance; Tietze's if swollen.");
  if (x.cyclical) s.push("Cyclical pain (both breasts, worse before periods): hormonal and benign — very common; keep a pain chart for 2 cycles.");
  else s.push(`Non-cyclical${x.focal ? ", focal and persistent" : ""} pain: usually benign (cysts, duct ectasia, chest wall)${x.focal ? `; image the painful area — ultrasound under 35 (mammogram plus ultrasound if 35 or over${x.age >= 35 ? ", which applies here" : ""})` : ""}.`);
  s.push("Pain alone is rarely cancer: reassure clearly. A well-fitted supportive bra (sports bra for exercise and at night) helps most women.");
  s.push("Topical NSAID (diclofenac gel) first line; paracetamol or ibuprofen; reduce caffeine if she finds it helps. Evening primrose oil and vitamin E are not effective.");
  if (x.hormones) s.push("On HRT or the combined pill: a lower dose or a different preparation can help.");
  s.push("Severe pain over 6 months despite this: specialist — tamoxifen 10 mg daily for 3–6 months (off-label, contraception needed) can be considered.");
  return { refer, steps: s };
}

/* ================================================================== hoarseness (mine) */

export interface HoarseInput { weeks: number; smoker: boolean; age: number; stridor: boolean; dysphagia: boolean; neckLump: boolean; haemoptysis: boolean; surgery: boolean; voiceUse: boolean; inhaler: boolean; reflux: boolean }
export function hoarsePlan(x: HoarseInput): { urgency: "emergency" | "urgent" | "routine"; steps: string[] } {
  if (x.stridor) return { urgency: "emergency", steps: ["Stridor or breathing difficulty: emergency — sit up, oxygen, call ENT and anaesthesia; nebulised adrenaline and IV dexamethasone while waiting."] };
  const urgent = x.weeks >= 3 && (x.smoker || x.age >= 45 || x.dysphagia || x.neckLump || x.haemoptysis);
  const s: string[] = [];
  if (urgent) s.push("Hoarseness 3 weeks or more with risk factors (smoker, 45 or over, alcohol), or with swallowing problems, a neck lump, ear pain or coughing blood: urgent ENT laryngoscopy for laryngeal cancer; chest X-ray (lung apex tumour).");
  else if (x.weeks >= 3) s.push("Hoarseness 3 weeks or more: ENT laryngoscopy to see the vocal cords — every persistent hoarse voice needs the cords looked at.");
  else s.push("Under 3 weeks with a cold: viral laryngitis — voice rest (no whispering), steam, fluids, stop smoking; review if not better by 3 weeks.");
  if (x.surgery) s.push("After thyroid, neck or chest surgery (or a chest tumour): recurrent laryngeal nerve palsy — laryngoscopy and CT neck/chest if no surgical explanation.");
  if (x.voiceUse) s.push("Heavy voice users (teachers, singers, vendors): vocal nodules or polyps — voice therapy with a speech therapist first.");
  if (x.inhaler) s.push("Inhaled steroids: rinse the mouth after use, use a spacer; check for laryngeal candida.");
  if (x.reflux) s.push("Throat clearing, globus and heartburn: laryngopharyngeal reflux — lifestyle measures; a PPI trial only with typical reflux symptoms.");
  s.push("Also consider hypothyroidism (TSH), smoking-related Reinke's oedema, and neurological causes (Parkinson's, myasthenia, stroke) if there is slurred speech or swallowing trouble.");
  return { urgency: urgent ? "urgent" : "routine", steps: s };
}

/* ================================================================== tinnitus (mine) */

export interface TinnitusInput { pulsatile: boolean; unilateral: boolean; suddenHearingLoss: boolean; vertigo: boolean; neuro: boolean; distress: boolean; wax: boolean; drugs: boolean; noise: boolean }
export function tinnitusPlan(x: TinnitusInput): { urgency: "emergency" | "urgent" | "routine"; steps: string[] } {
  const s: string[] = [];
  let urgency: "emergency" | "urgent" | "routine" = "routine";
  if (x.neuro) { urgency = "emergency"; s.push("With facial weakness, sudden severe headache or other neurological signs: same-day assessment (stroke, haemorrhage, tumour)."); }
  if (x.distress) { urgency = "emergency"; s.push("Thoughts of self-harm or severe distress: same-day mental health assessment."); }
  if (x.suddenHearingLoss) { if (urgency === "routine") urgency = "urgent"; s.push("Sudden hearing loss (within 3 days): ENT within 24 hours — check with a tuning fork (Weber goes to the good ear in sensorineural loss); oral prednisolone 1 mg/kg (max 60 mg) for 7 days if started within 2 weeks, ideally within 72 hours."); }
  if (x.pulsatile) { if (urgency === "routine") urgency = "urgent"; s.push("Pulsatile tinnitus (in time with the pulse): urgent imaging (CT or MR angiography) for vascular causes — dural AV fistula, carotid stenosis, paraganglioma; check BP, Hb, TSH; consider raised intracranial pressure (headache, obesity, visual symptoms)."); }
  if (x.unilateral) s.push("One ear only, or with asymmetric hearing loss: audiogram and MRI of the internal auditory meatus (vestibular schwannoma).");
  if (x.vertigo) s.push("With episodic vertigo and fluctuating hearing: Ménière's disease — ENT; low-salt diet; betahistine for attacks.");
  if (x.wax) s.push("Wax: olive oil drops for 2–3 weeks, then irrigation or microsuction if still blocked.");
  if (x.drugs) s.push("Ototoxic drugs: high-dose aspirin, aminoglycosides, loop diuretics, quinine, chloroquine, cisplatin — review.");
  if (x.noise) s.push("Noise exposure: ear protection, avoid loud music and earphones at high volume.");
  s.push("Everyone: otoscopy and audiometry. Explain that tinnitus is common and rarely serious; most people habituate.");
  s.push("Hearing aids if there is hearing loss; sound enrichment (fan, soft music) especially at night; CBT for tinnitus; treat insomnia, anxiety and depression. No drug cures tinnitus (betahistine, ginkgo and zinc do not work for tinnitus alone).");
  return { urgency, steps: s };
}

/* ================================================================== warts and molluscum (mine) */

export type WartKind = "common" | "plantar" | "facial" | "genital";
export function wartPlan(kind: WartKind, child: boolean, pregnant: boolean, immunosuppressed: boolean): string[] {
  const s: string[] = [];
  if (kind === "genital") {
    s.push("Anogenital warts: screen for other STIs (HIV, syphilis, chlamydia, gonorrhoea); treat partners' symptoms; condoms. In a child, consider sexual abuse (also possible from non-sexual spread) — safeguarding assessment.");
    s.push(pregnant ? "Pregnancy: cryotherapy (avoid podophyllotoxin and imiquimod); warts often grow in pregnancy and settle after." : "Soft, non-keratinised: podophyllotoxin 0.5% solution or 0.15% cream twice daily for 3 days, then 4 days off, up to 4 cycles; keratinised: cryotherapy every 1–2 weeks; or imiquimod 5% cream 3 nights a week for up to 16 weeks.");
    s.push("HPV vaccination protects against the commonest types (types 6 and 11).");
    return s;
  }
  s.push(child ? "In children, most warts go away on their own (about two-thirds within 2 years); treatment is optional if they are not painful or bothersome." : "Many warts resolve without treatment in 1–2 years; treat if painful, spreading or bothersome.");
  if (kind === "facial") s.push("Face: avoid salicylic acid and harsh cryotherapy (scarring); gentle cryotherapy or curettage by a doctor; flat warts — topical retinoid at night.");
  else s.push(`Salicylic acid 15–26% (with lactic acid) daily: soak 5 minutes, file the surface, apply, cover — for up to 12 weeks${kind === "plantar" ? "; plantar warts need 26% and patience, padding for pain" : ""}. Avoid in diabetes or poor circulation.`);
  if (kind !== "facial") s.push(child ? "Cryotherapy is painful for young children — use only if they can tolerate it." : "Cryotherapy every 2–3 weeks, up to 4 sessions; can combine with salicylic acid.");
  if (immunosuppressed) s.push("Immunosuppressed (transplant, HIV): many or stubborn warts — dermatology; check for skin cancer.");
  s.push("Don't share towels or shoes; keep feet dry; cover warts when swimming.");
  return s;
}
export function molluscumPlan(adult: boolean, genital: boolean, widespread: boolean, eyelid: boolean, eczema: boolean): string[] {
  const s = ["Molluscum contagiosum (small pearly dome-shaped papules with a central dimple): harmless and self-limiting, usually gone in 6–18 months (sometimes longer). Children can go to school and swim."];
  s.push("Don't squeeze or scratch; don't share towels or baths; a red, inflamed spot is usually the start of healing, not infection.");
  if (eczema) s.push("Eczema around the spots (molluscum dermatitis): emollients and a mild topical steroid.");
  s.push("Treat only if bothersome: potassium hydroxide 5–10% solution once or twice daily, cryotherapy or curettage in older children and adults (may scar).");
  if (eyelid) s.push("Lesions on the eyelid margin with a red eye: ophthalmology (conjunctivitis).");
  if (adult && genital) s.push("Genital molluscum in adults: screen for other STIs.");
  if (adult && widespread) s.push("Many or large lesions in an adult: test for HIV and look for immunosuppression.");
  return s;
}

/* ================================================================== paronychia and ingrown toenail (mine) */

export interface ParonychiaInput { chronic: boolean; abscess: boolean; cellulitis: boolean; vesicles: boolean; wetWork: boolean; nailBiter: boolean }
export function paronychiaPlan(x: ParonychiaInput): string[] {
  const s: string[] = [];
  if (x.vesicles) { s.push("Grouped vesicles on the fingertip: herpetic whitlow — do not incise; oral aciclovir 400 mg three times daily for 5–7 days if early; keep covered."); return s; }
  if (x.chronic) {
    s.push("Chronic paronychia (6 weeks or more, often several fingers, no cuticle): irritant and candida from wet work — keep hands dry, cotton-lined rubber gloves, emollient, stop cuticle trimming.");
    s.push("Potent topical steroid (e.g. betamethasone valerate 0.1%) twice daily for 2–3 weeks, with a topical antifungal (clotrimazole or miconazole) if candida is suspected.");
    if (x.wetWork) s.push("Wet work (cooks, cleaners, bartenders, homemakers washing dishes) is the key trigger — change habits for lasting cure.");
    return s;
  }
  s.push("Acute paronychia: warm water soaks 3–4 times a day; keep the finger elevated.");
  if (x.abscess) s.push("Pus collected under the nail fold: drain (digital block, lift the eponychium or incise along the nail fold); partial nail removal if pus under the nail.");
  if (x.cellulitis || x.abscess) s.push(x.nailBiter ? "Nail biting or finger sucking (mouth flora): co-amoxiclav 625 mg three times daily for 5–7 days." : "Antibiotic if cellulitis or after drainage: cloxacillin or flucloxacillin 500 mg four times daily, or cephalexin 500 mg four times daily, for 5–7 days.");
  s.push("Not improving in 48 hours, spreading redness, or tendon sheath signs (Kanavel): urgent hand surgery review.");
  return s;
}
export function toenailPlan(stage: 1 | 2 | 3, diabetes: boolean, recurrent: boolean): string[] {
  const s: string[] = [];
  if (diabetes) s.push("Diabetes or poor circulation: podiatry or foot clinic early — avoid home surgery; check pulses and sensation.");
  if (stage === 1) {
    s.push("Stage 1 (redness, swelling, pain, no pus): warm soapy soaks twice daily, lift the nail edge with a small cotton wisp or dental floss, wide-toed shoes, cut nails straight across (not short at the corners).");
  } else {
    s.push(stage === 2 ? "Stage 2 (pus or drainage): soaks; partial nail avulsion of the ingrown edge under digital block." : "Stage 3 (granulation tissue, chronic): partial nail avulsion with phenolisation of the matrix (chemical matrixectomy) — lowest recurrence.");
    s.push("Antibiotics only if there is spreading cellulitis (cloxacillin or cephalexin 500 mg four times daily for 5–7 days); antibiotics alone don't fix the nail.");
  }
  if (recurrent) s.push("Recurrent: partial nail avulsion with phenol matrixectomy.");
  s.push("Aftercare: soaks and dressings for 1–2 weeks; return if increasing pain, redness or fever.");
  return s;
}
