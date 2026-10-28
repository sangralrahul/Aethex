/**
 * Update 53, on the device (no AI): hyperthyroidism and Graves', pleural effusion, rheumatoid
 * arthritis, Cushing's and adrenal incidentaloma, scaphoid and wrist injuries, knee ligament and
 * meniscus injuries, diabetic retinopathy screening, hearing loss, vitamin D deficiency, acute
 * gastroenteritis in adults, anaemia in pregnancy and secondary hypertension.
 */

export type Urgency = "emergency" | "urgent" | "routine";
const worse = (a: Urgency, b: Urgency): Urgency => (a === "emergency" || b === "emergency" ? "emergency" : a === "urgent" || b === "urgent" ? "urgent" : "routine");
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== hyperthyroidism and Graves' */

export interface HyperInput { tshLow: boolean; ft4High: boolean; t3Only: boolean; diffuseGoitre: boolean; eyeSigns: boolean; nodular: boolean; painful: boolean; postpartum: boolean; amiodarone: boolean; trimester: 0 | 1 | 2 | 3; age: number; hr: number; af: boolean; stormSigns: boolean; heartFailure: boolean; asthma: boolean }
export function hyperCause(x: HyperInput): "subclinical" | "graves" | "toxic nodular" | "thyroiditis" | "amiodarone" | "unclear" | "none" {
  if (!x.tshLow) return "none";
  if (!x.ft4High && !x.t3Only) return "subclinical";
  if (x.amiodarone) return "amiodarone";
  if (x.painful || x.postpartum) return "thyroiditis";
  if (x.eyeSigns || x.diffuseGoitre) return "graves";
  if (x.nodular) return "toxic nodular";
  return "unclear";
}
export function hyperPlan(x: HyperInput): { cause: string; urgency: Urgency; steps: string[] } {
  const cause = hyperCause(x);
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (cause === "none") return { cause, urgency, steps: ["TSH is not suppressed: hyperthyroidism is unlikely. A high FT4 with a normal or high TSH suggests assay interference, a TSH-secreting adenoma or thyroid hormone resistance — discuss with the lab and endocrinology."] };
  if (x.stormSigns) { urgency = "emergency"; s.push("Fever, agitation or confusion, marked tachycardia, heart failure, vomiting or jaundice: possible thyroid storm — use the Thyroid Storm & Myxoedema Coma tool (Burch–Wartofsky), admit, propranolol, PTU or carbimazole, then iodine an hour later, hydrocortisone."); }
  if (x.af || x.heartFailure || x.hr >= 120) urgency = worse(urgency, "urgent");
  s.push({
    subclinical: "Subclinical hyperthyroidism (low TSH, normal FT4 and T3): repeat in 6–12 weeks; treat if TSH under 0.1 and age 65 or over, AF, osteoporosis or symptoms.",
    graves: "Graves' disease likely (diffuse goitre or eye signs). Confirm with TSH receptor antibodies (TRAb).",
    "toxic nodular": "Toxic nodular goitre likely. Technetium or radioiodine uptake scan shows hot nodule(s); antithyroid drugs control it but rarely cure — radioiodine or surgery is usually definitive.",
    thyroiditis: "Thyroiditis likely (painful thyroid after a viral illness, or within a year of childbirth): low uptake on scan. It is self-limiting — beta-blocker only; NO antithyroid drugs. Painful subacute thyroiditis: NSAID, or prednisolone 20–40 mg tapered over 4–6 weeks if severe. Check TSH every 4–6 weeks for the later hypothyroid phase.",
    amiodarone: "Amiodarone-induced thyrotoxicosis: type 1 (iodine-driven, underlying goitre) needs antithyroid drugs; type 2 (destructive thyroiditis) needs prednisolone. Often mixed — endocrinology and cardiology together; don't stop amiodarone without the cardiologist.",
    unclear: "Cause unclear: TRAb, and a technetium uptake scan (high = Graves' or nodules, low = thyroiditis or exogenous thyroxine).",
  }[cause]);
  s.push(x.asthma ? "Symptoms: asthma — use a cardioselective beta-blocker (atenolol 25–50 mg) cautiously, or diltiazem." : `Symptoms: propranolol 10–40 mg three or four times a day${x.af ? " (also controls AF rate; anticoagulate by CHA2DS2-VA)" : ""}.`);
  if (cause === "graves" || cause === "toxic nodular" || cause === "unclear") {
    if (x.trimester === 1) s.push("First trimester: propylthiouracil (PTU) 50–150 mg three times daily at the lowest dose that keeps FT4 at the upper end of normal; switch to carbimazole from the second trimester. Monitor FT4 every 4 weeks; TRAb at 20–24 weeks (fetal and neonatal thyrotoxicosis).");
    else if (x.trimester === 2 || x.trimester === 3) s.push("Pregnancy (2nd–3rd trimester): carbimazole at the lowest effective dose (no block-and-replace); aim FT4 at the top of the normal range; TRAb at 20–24 weeks; obstetric and endocrine care together.");
    else s.push("Carbimazole 20–40 mg once daily (15–20 mg if mild), then titrate every 4–6 weeks by FT4/T3 (TSH lags for months) to about 5–15 mg a day; continue 12–18 months for Graves'. Check CBC and LFT at baseline.");
    s.push("Warn in writing: sore throat, mouth ulcers or fever → stop the tablet and get an urgent blood count (agranulocytosis, usually in the first 3 months). Rash or itch: antihistamine or switch; jaundice: stop.");
    if (!x.trimester) s.push("Definitive options: radioiodine (avoid in pregnancy and breastfeeding, no pregnancy for 6 months; can worsen eye disease — steroid cover, avoid in active moderate-severe orbitopathy) or total thyroidectomy (large goitre, eye disease, suspicious nodule, pregnancy planned soon).");
  }
  if (x.eyeSigns) s.push("Thyroid eye disease: stop smoking (strongest risk), lubricants, selenium 100 µg twice daily for 6 months if mild; urgent ophthalmology for reduced vision, colour desaturation or exposure keratitis (optic neuropathy).");
  if (x.age >= 60 || x.af) s.push("Older patients and AF: thyrotoxicosis raises the risk of AF, heart failure and fractures — restore euthyroidism promptly; bone health check.");
  return { cause, urgency, steps: s };
}

/* ================================================================== pleural effusion */

export function lights(pleuralProtein: number, serumProtein: number, pleuralLdh: number, serumLdh: number, serumLdhUln: number): { exudate: boolean; reasons: string[]; complete: boolean } {
  const reasons: string[] = [];
  let complete = false;
  if (pleuralProtein > 0 && serumProtein > 0) { complete = true; const r = pleuralProtein / serumProtein; if (r > 0.5) reasons.push(`protein ratio ${r2(r)} (over 0.5)`); }
  if (pleuralLdh > 0 && serumLdh > 0) { complete = true; const r = pleuralLdh / serumLdh; if (r > 0.6) reasons.push(`LDH ratio ${r2(r)} (over 0.6)`); }
  if (pleuralLdh > 0 && serumLdhUln > 0) { complete = true; if (pleuralLdh > (2 / 3) * serumLdhUln) reasons.push(`pleural LDH ${pleuralLdh} (over two-thirds of the upper limit, ${Math.round((2 / 3) * serumLdhUln)})`); }
  return { exudate: reasons.length > 0, reasons, complete };
}
export interface EffusionInput { pleuralProtein: number; serumProtein: number; pleuralLdh: number; serumLdh: number; serumLdhUln: number; ph: number; glucose: number; ada: number; lymphocytic: boolean; purulent: boolean; bilateral: boolean; heartFailure: boolean; cirrhosis: boolean; nephrotic: boolean; fever: boolean; cancer: boolean; breathless: boolean; large: boolean; onDiuretic: boolean }
export function effusionPlan(x: EffusionInput): { kind: "exudate" | "transudate" | "unknown"; urgency: Urgency; steps: string[] } {
  const L = lights(x.pleuralProtein, x.serumProtein, x.pleuralLdh, x.serumLdh, x.serumLdhUln);
  const s: string[] = [];
  let urgency: Urgency = x.breathless && x.large ? "urgent" : "routine";
  const typical = x.bilateral && (x.heartFailure || x.cirrhosis || x.nephrotic) && !x.fever;
  if (!L.complete) s.push(typical ? "Bilateral effusions with heart failure, cirrhosis or nephrotic syndrome and no fever or pleuritic pain: treat the cause first and tap only if atypical (unequal sides, fever, pain) or not improving." : "Unilateral or unexplained effusion: ultrasound-guided diagnostic tap — protein, LDH (with serum protein and LDH), pH, glucose, cell count, Gram stain and culture, AFB smear, Xpert MTB/RIF and culture, ADA, cytology.");
  else if (L.exudate) s.push(`Exudate by Light's criteria: ${L.reasons.join("; ")}.`);
  else s.push(`Transudate by Light's criteria${x.onDiuretic ? " — but diuretics can make a transudate look like an exudate; if borderline, a serum–pleural albumin gradient over 12 g/L supports a transudate" : ""}: heart failure, cirrhosis (hepatic hydrothorax), nephrotic syndrome, hypoalbuminaemia, peritoneal dialysis.`);
  if (x.purulent || (x.ph > 0 && x.ph < 7.2)) { urgency = worse(urgency, "urgent"); s.push(`${x.purulent ? "Frank pus (empyema)" : `pH ${x.ph} (under 7.2): complicated parapneumonic effusion`}: chest drain plus antibiotics (e.g. co-amoxiclav, or ceftriaxone with metronidazole) for at least 3 weeks; intrapleural tPA–DNase if poor drainage; thoracic surgery referral if not improving in 5–7 days.`); }
  else if (x.glucose > 0 && x.glucose < 60) s.push(`Low pleural glucose (${x.glucose} mg/dL): infection, TB, rheumatoid or malignant effusion.`);
  if (x.ada >= 40 || (x.lymphocytic && x.ada >= 30)) s.push(`ADA ${x.ada} U/L${x.lymphocytic ? " with lymphocytic fluid" : ""}: tuberculous pleuritis is likely in India (ADA over 40 has high sensitivity) — start ATT per NTEP after Xpert and culture are sent; pleural biopsy if doubt.`);
  if (x.cancer || (L.exudate && !x.fever && x.lymphocytic && x.ada > 0 && x.ada < 40)) s.push("Possible malignant effusion: cytology (two samples raise the yield), CT chest with contrast before draining completely, thoracoscopy and biopsy if negative. Recurrent: indwelling pleural catheter or talc pleurodesis.");
  if (x.large && x.breathless) s.push("Large effusion with breathlessness: therapeutic aspiration — remove no more than 1.5 L at a time (re-expansion pulmonary oedema).");
  s.push("Imaging: chest X-ray and bedside ultrasound (detects small effusions, septations, guides the tap); CT with contrast for exudates without a clear cause.");
  return { kind: L.complete ? (L.exudate ? "exudate" : "transudate") : "unknown", urgency, steps: s };
}

/* ================================================================== rheumatoid arthritis */

export interface RaClass { joints: 0 | 1 | 2 | 3 | 5; serology: 0 | 2 | 3; acutePhase: 0 | 1; sixWeeks: boolean }
export function raScore(x: RaClass): { score: number; ra: boolean } {
  const score = x.joints + x.serology + x.acutePhase + (x.sixWeeks ? 1 : 0);
  return { score, ra: score >= 6 };
}
export function das28(tender: number, swollen: number, esr: number, globalHealth: number): { das: number; band: "remission" | "low" | "moderate" | "high" } | null {
  if (!(esr > 0) || tender < 0 || swollen < 0 || tender > 28 || swollen > 28 || globalHealth < 0 || globalHealth > 100) return null;
  const das = 0.56 * Math.sqrt(tender) + 0.28 * Math.sqrt(swollen) + 0.7 * Math.log(esr) + 0.014 * globalHealth;
  const d = r2(das);
  return { das: d, band: d < 2.6 ? "remission" : d <= 3.2 ? "low" : d <= 5.1 ? "moderate" : "high" };
}
export interface RaInput extends RaClass { tender: number; swollen: number; esr: number; gh: number; onMtx: boolean; pregnant: boolean; liver: boolean; ckd: boolean; lung: boolean; weeksOnCurrent: number }
export function raPlan(x: RaInput): { score: number; ra: boolean; das: ReturnType<typeof das28>; steps: string[] } {
  const c = raScore(x);
  const d = das28(x.tender, x.swollen, x.esr, x.gh);
  const s: string[] = [];
  s.push(c.ra ? `ACR/EULAR 2010 score ${c.score}/10: classifies as rheumatoid arthritis (6 or more).` : `ACR/EULAR 2010 score ${c.score}/10: below 6 — not classified yet; recheck as features evolve, and consider other causes (viral arthritis, psoriatic, gout, SLE, hypothyroidism).`);
  if (d) s.push(`DAS28-ESR ${d.das}: ${d.band === "remission" ? "remission (under 2.6)" : d.band === "low" ? "low activity (2.6–3.2)" : d.band === "moderate" ? "moderate activity (3.2–5.1)" : "high activity (over 5.1)"}.`);
  s.push("Refer early to rheumatology (within weeks): the first 3–6 months are the window of opportunity. Baseline: CBC, LFT, creatinine, ESR, CRP, RF, anti-CCP, hepatitis B and C, HIV, chest X-ray, X-ray hands and feet.");
  if (x.pregnant) s.push("Pregnant or planning: methotrexate and leflunomide are contraindicated (stop methotrexate 1–3 months before conception; leflunomide needs a washout). Hydroxychloroquine, sulfasalazine (with folic acid 5 mg) and low-dose prednisolone are compatible.");
  else if (!x.onMtx) s.push(`Start methotrexate 7.5–15 mg ONCE A WEEK (write the day), increasing by 2.5–5 mg every 2–4 weeks to 20–25 mg weekly; folic acid 5 mg once a week on a different day.${x.liver ? " Liver disease or heavy alcohol: avoid methotrexate — use sulfasalazine or hydroxychloroquine." : ""}${x.ckd ? " Kidney impairment: reduce the dose (avoid if eGFR under 30)." : ""}${x.lung ? " Pre-existing lung disease: baseline lung function and caution." : ""}`);
  s.push("Bridging: a short course of prednisolone (e.g. 7.5–15 mg tapered over 8–12 weeks) or IM methylprednisolone 120 mg while DMARDs take effect. NSAIDs with a PPI for symptoms only.");
  if (d && d.band !== "remission" && d.band !== "low" && x.onMtx && x.weeksOnCurrent >= 12) s.push("Not at target after 3 months on methotrexate: escalate — triple therapy (methotrexate + sulfasalazine + hydroxychloroquine) or, if poor prognostic factors (high RF/anti-CCP, erosions, high activity), a biologic or JAK inhibitor via rheumatology after TB screening (IGRA or Mantoux and chest X-ray) and hepatitis B screening.");
  else s.push("Treat to target: review every 1–3 months while active, aim for remission or low activity within 6 months; once stable, review every 3–6 months.");
  s.push("Monitoring (methotrexate): CBC, LFT, creatinine every 2 weeks until the dose is stable for 6 weeks, then monthly for 3 months, then every 3 months — see DMARD Monitoring. Vaccinate (influenza, pneumococcal, hepatitis B); cardiovascular risk and bone health checks; stop smoking.");
  return { score: c.score, ra: c.ra, das: d, steps: s };
}

/* ================================================================== Cushing's and adrenal incidentaloma */

export interface AdrenalInput { mode: "cushing" | "incidentaloma"; steroids: boolean; features: string[]; dstCortisol: number; dstUnit: "nmol/L" | "ug/dL"; sizeCm: number; hu: number; hypertension: boolean; hypoK: boolean; growing: boolean; bilateral: boolean; age: number; cancerHistory: boolean }
export const CUSHING_FEATURES = ["Easy bruising", "Facial plethora", "Proximal muscle weakness", "Wide purple striae", "Weight gain with thin skin", "New diabetes or hypertension at a young age", "Osteoporosis at a young age", "Child: weight up, height down"];
export function dstBand(value: number, unit: "nmol/L" | "ug/dL"): "normal" | "possible" | "autonomous" | "none" {
  if (!(value > 0)) return "none";
  const n = unit === "ug/dL" ? value * 27.6 : value;
  return n <= 50 ? "normal" : n <= 138 ? "possible" : "autonomous";
}
export function adrenalPlan(x: AdrenalInput): { urgency: Urgency; steps: string[]; benign: boolean } {
  const s: string[] = [];
  let urgency: Urgency = "routine";
  const b = dstBand(x.dstCortisol, x.dstUnit);
  let benign = false;
  if (x.mode === "cushing") {
    if (x.steroids) s.push("Exogenous steroids are the commonest cause: ask about oral, inhaled, topical (skin-lightening creams), injected (joint, epidural) steroids and 'herbal' or ayurvedic powders that may contain hidden steroids. Never stop suddenly — taper, and give steroid cover when ill (adrenal suppression).");
    s.push(x.features.length >= 2 ? `Features suggesting Cushing's (${x.features.join(", ").toLowerCase()}): screen with TWO of — overnight 1 mg dexamethasone suppression test (1 mg at 11 pm, cortisol at 8–9 am), 24-hour urinary free cortisol (twice), late-night salivary cortisol (twice).` : "Few specific features: screening is only worthwhile with several of easy bruising, facial plethora, proximal weakness and wide purple striae, or unusual features for age.");
    if (b !== "none") s.push(b === "normal" ? "1 mg DST cortisol 50 nmol/L (1.8 µg/dL) or less: Cushing's is very unlikely." : "1 mg DST cortisol over 50 nmol/L: not suppressed — exclude false positives (oral oestrogen raises binding globulin; enzyme inducers such as phenytoin, carbamazepine, rifampicin speed dexamethasone clearance; depression, alcohol, obesity) and confirm with a second test; then ACTH to tell ACTH-dependent (pituitary, ectopic) from adrenal; refer to endocrinology.");
  } else {
    if (!(x.sizeCm > 0)) s.push("Enter the size and attenuation (HU) from the unenhanced CT.");
    else {
      benign = x.hu > -100 && x.hu <= 10 && x.sizeCm < 4 && !x.growing;
      if (x.hu >= 999) s.push("Add the unenhanced CT attenuation (HU): 10 or less means a lipid-rich benign adenoma.");
      else if (x.hu <= 10 && x.hu > -100) s.push(`Unenhanced CT ${x.hu} HU (10 or less): lipid-rich, benign adenoma.${x.sizeCm < 4 ? " Homogeneous and under 4 cm: no further imaging needed (ESE 2023)." : " But 4 cm or more: discuss in an adrenal MDT."}`);
      else { urgency = "urgent"; s.push(`Over 10 HU${x.sizeCm >= 4 ? " and 4 cm or more" : ""}: indeterminate — adrenal MDT; options are contrast washout CT, MRI chemical shift or FDG-PET, or repeat imaging in 6–12 months${x.sizeCm >= 4 ? "; surgery is often advised" : ""}.`); }
      if (x.growing) { urgency = "urgent"; s.push("Growing lesion: concern for adrenocortical carcinoma — MDT and surgery."); }
      if (x.bilateral) s.push("Bilateral lesions: also consider congenital adrenal hyperplasia (17-OHP), bilateral macronodular hyperplasia, metastases, infection (TB, histoplasmosis) and haemorrhage; check for adrenal insufficiency.");
      if (x.cancerHistory) s.push("History of cancer: an indeterminate lesion may be a metastasis — FDG-PET and MDT.");
    }
    s.push("Every incidentaloma: 1 mg overnight dexamethasone suppression test (mild autonomous cortisol secretion if over 50 nmol/L — screen for diabetes, hypertension, osteoporosis) and plasma or urinary metanephrines when HU is over 10 (phaeochromocytoma must be excluded before any biopsy or surgery).");
    if (x.hypertension || x.hypoK) s.push("Hypertension or low potassium: aldosterone-to-renin ratio (correct potassium first; note interfering drugs) for primary aldosteronism.");
    if (b === "autonomous" || b === "possible") s.push(`DST cortisol ${b === "autonomous" ? "over 138 nmol/L (5 µg/dL): autonomous cortisol secretion" : "51–138 nmol/L: possible autonomous cortisol secretion"} — endocrinology; adrenalectomy is considered if there are related conditions (diabetes, hypertension, osteoporosis). Give steroid cover after any adrenalectomy.`);
    if (x.age > 0 && x.age < 40) s.push("Under 40: an incidentaloma is less often a simple adenoma — lower threshold for MRI or surgery.");
  }
  return { urgency, steps: s, benign };
}

/* ================================================================== scaphoid and wrist injuries */

export interface WristInput { snuffbox: boolean; tubercle: boolean; axialThumb: boolean; deformity: boolean; neuro: boolean; open: boolean; xray: "not done" | "normal" | "scaphoid fracture" | "distal radius fracture"; displaced: boolean; proximalPole: boolean; age: number; fallStanding: boolean; daysSince: number }
export function wristPlan(x: WristInput): { suspectedScaphoid: boolean; urgency: Urgency; steps: string[] } {
  const signs = [x.snuffbox, x.tubercle, x.axialThumb].filter(Boolean).length;
  const suspected = signs >= 1;
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.open || x.neuro || x.deformity) { urgency = "emergency"; s.push(`${x.open ? "Open fracture: IV antibiotics, tetanus, orthopaedics now. " : ""}${x.deformity ? "Deformed wrist: reduce under haematoma block or regional anaesthesia, back-slab, check X-ray after. " : ""}${x.neuro ? "Numbness in the median nerve area or poor perfusion: urgent reduction and orthopaedic review (acute carpal tunnel)." : ""}`.trim()); }
  if (x.xray === "not done") s.push(suspected ? `Scaphoid tenderness (${signs} of 3: snuffbox, scaphoid tubercle, axial thumb compression): scaphoid series X-ray (4 views) and a wrist X-ray.` : "X-ray the wrist if there is bony tenderness, swelling or loss of movement after a fall on the outstretched hand.");
  if (suspected && (x.xray === "normal" || x.xray === "not done")) s.push("Clinically suspected scaphoid fracture with a normal X-ray: immobilise in a removable splint or thumb-spica and get an MRI (best within 1 week); if MRI isn't available, repeat X-ray in 10–14 days. Up to 1 in 5 scaphoid fractures are missed on the first X-ray.");
  if (x.xray === "scaphoid fracture") {
    urgency = worse(urgency, "urgent");
    s.push(x.displaced || x.proximalPole ? `${x.displaced ? "Displaced (over 1 mm)" : "Proximal pole"} scaphoid fracture: high risk of non-union and avascular necrosis — orthopaedic hand surgeon within a week for fixation.` : "Undisplaced waist or distal scaphoid fracture: below-elbow cast or splint for 6–8 weeks (distal pole 4–6 weeks), fracture clinic within a week, CT at 6–12 weeks to confirm union.");
  }
  if (x.xray === "distal radius fracture") {
    urgency = worse(urgency, "urgent");
    s.push("Distal radius fracture: check alignment (dorsal tilt, radial height and inclination, step in the joint). Undisplaced or stable: splint or cast 4–6 weeks. Displaced: reduce; unstable, intra-articular or unacceptable after reduction → surgery. Fracture clinic within a week; X-ray again at 1–2 weeks for slippage.");
    if (x.age >= 50 && x.fallStanding) s.push("Fragility fracture (age 50 or over, fall from standing): assess for osteoporosis — FRAX, DXA, vitamin D, calcium, and fall prevention (see Osteoporosis & Bone Health).");
  }
  if (x.daysSince > 28 && suspected) s.push("Presenting late (over 4 weeks): a scaphoid fracture may already be heading for non-union — CT and hand surgery referral.");
  s.push("Advice: elevate, move the fingers and elbow, return if fingers become numb, cold or swollen in the cast. Most wrist sprains settle in 2–6 weeks — but 'sprained wrist' is a diagnosis made only after a scaphoid fracture has been excluded.");
  return { suspectedScaphoid: suspected, urgency, steps: s };
}

/* ================================================================== knee ligament and meniscus */

export interface KneeInput { age: number; patella: boolean; fibularHead: boolean; cantFlex90: boolean; cantBearWeight: boolean; pop: boolean; rapidSwelling: boolean; givingWay: boolean; locked: boolean; jointLinePain: boolean; mcmurray: boolean; lachman: boolean; valgusLax: boolean; dislocatedPatella: boolean; hot: boolean; neurovascular: boolean }
export function ottawaKnee(x: KneeInput): boolean {
  return x.age >= 55 || x.patella || x.fibularHead || x.cantFlex90 || x.cantBearWeight;
}
export function kneePlan(x: KneeInput): { xray: boolean; likely: string[]; urgency: Urgency; steps: string[] } {
  const xray = ottawaKnee(x);
  const likely: string[] = [];
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.neurovascular) { urgency = "emergency"; s.push("Cold, pale or pulseless foot after a knee injury: possible knee dislocation with popliteal artery injury — emergency vascular and orthopaedic review, ABPI or CT angiography, even if the knee has relocated."); }
  if (x.hot) { urgency = worse(urgency, "urgent"); s.push("Hot, swollen knee without clear injury or with fever: aspirate to exclude septic arthritis and crystals (see Septic Arthritis & Hot Joint)."); }
  s.push(xray ? "Ottawa knee rule positive: X-ray the knee (AP and lateral; skyline if patellar)." : "Ottawa knee rule negative: X-ray not needed.");
  if (x.pop || x.rapidSwelling || x.lachman || x.givingWay) likely.push("ACL tear");
  if (x.locked || x.jointLinePain || x.mcmurray) likely.push("meniscal tear");
  if (x.valgusLax) likely.push("MCL injury");
  if (x.dislocatedPatella) likely.push("patellar dislocation");
  if (likely.length) s.push(`Likely: ${likely.join(", ")}.`);
  if (x.rapidSwelling) s.push("Swelling within 2 hours of injury = haemarthrosis: ACL tear, fracture (look for a Segond fracture or lipohaemarthrosis on X-ray) or patellar dislocation in most cases.");
  if (x.locked) { urgency = worse(urgency, "urgent"); s.push("True locking (can't fully straighten the knee): displaced bucket-handle meniscal tear — urgent MRI and orthopaedic referral within 1–2 weeks for repair."); }
  if (likely.includes("ACL tear")) s.push("Suspected ACL tear: knee brace or crutches as needed, early physiotherapy to regain full extension and quadriceps control; MRI and sports/orthopaedic referral. Reconstruction for active people who want to return to pivoting sports or have ongoing giving way.");
  if (likely.includes("MCL injury") && !likely.includes("ACL tear")) s.push("Isolated MCL injury: hinged brace and physiotherapy — heals without surgery in most cases (grade 1–2 in 2–6 weeks).");
  if (likely.includes("meniscal tear") && !x.locked) s.push(`Meniscal tear without locking: physiotherapy for 6–12 weeks first${x.age >= 45 ? "; in people over 45 degenerative tears do as well with exercise as with arthroscopy — avoid routine surgery" : "; MRI and referral if mechanical symptoms persist"}.`);
  if (x.dislocatedPatella) s.push("Patellar dislocation (relocated): X-ray for osteochondral fragments, brace briefly, physiotherapy (VMO strengthening); refer if a loose body or recurrent dislocation.");
  s.push("First days: protect, ice 15–20 minutes every 2–3 hours, compression, elevation, paracetamol or a short NSAID course; weight bear as comfortable. Review if still unstable or swollen after 1–2 weeks.");
  return { xray, likely, urgency, steps: s };
}

/* ================================================================== diabetic retinopathy screening */

export type DrGrade = "none" | "mild" | "moderate" | "severe" | "proliferative";
export interface DrInput { grade: DrGrade; dme: "none" | "non-central" | "central"; suddenLoss: boolean; type: 1 | 2; yearsSince: number; pregnant: boolean; hba1c: number; sbp: number; ungradable: boolean }
export function drPlan(x: DrInput): { urgency: Urgency; next: string; steps: string[] } {
  const s: string[] = [];
  let urgency: Urgency = "routine";
  let next = "";
  if (x.suddenLoss) { urgency = "emergency"; s.push("Sudden loss of vision, floaters or a curtain: same-day ophthalmology (vitreous haemorrhage, retinal detachment, central retinal vein or artery occlusion)."); }
  if (x.ungradable) { s.push("Ungradable photographs (cataract, small pupils): dilate and re-image, or refer for slit-lamp examination within 1 month."); next = "within 1 month"; }
  else {
    const g = {
      none: ["No retinopathy", "re-screen in 1–2 years (yearly if HbA1c or BP poorly controlled)", "routine"],
      mild: ["Mild non-proliferative (microaneurysms only)", "re-screen in 1 year", "routine"],
      moderate: ["Moderate non-proliferative", "review in 3–6 months; ophthalmology review", "routine"],
      severe: ["Severe non-proliferative (4-2-1 rule)", "refer to ophthalmology within 1 month — consider pan-retinal photocoagulation", "urgent"],
      proliferative: ["Proliferative retinopathy", "urgent ophthalmology within 1–2 weeks for laser or anti-VEGF", "urgent"],
    }[x.grade] as [string, string, Urgency];
    s.push(`${g[0]}: ${g[1]}.`);
    next = g[1];
    urgency = worse(urgency, g[2]);
    if (x.dme === "central") { urgency = worse(urgency, "urgent"); s.push("Centre-involving diabetic macular oedema: refer within 1 month for anti-VEGF injections (or laser)."); next = "refer within 1 month"; }
    else if (x.dme === "non-central") s.push("Macular oedema not involving the centre: ophthalmology review in 3 months.");
  }
  if (x.type === 1 && x.yearsSince < 5 && !x.pregnant) s.push("Type 1 diabetes: start screening 5 years after diagnosis (or at puberty), then yearly.");
  if (x.type === 2) s.push("Type 2 diabetes: screen at diagnosis (retinopathy may already be present), then by the result above.");
  if (x.pregnant) s.push("Pregnancy with pre-existing diabetes: examine in the first trimester and every trimester (retinopathy can progress quickly); gestational diabetes alone needs no retinal screening.");
  if (x.hba1c > 7 || x.sbp > 130) s.push(`Risk factors to improve: ${x.hba1c > 7 ? `HbA1c ${x.hba1c}% (lower gradually — a rapid fall can transiently worsen retinopathy)` : ""}${x.hba1c > 7 && x.sbp > 130 ? "; " : ""}${x.sbp > 130 ? `systolic BP ${x.sbp} (aim under 130)` : ""}; lipids (fenofibrate may slow progression), stop smoking.`);
  s.push("Also check for cataract and glaucoma (more common in diabetes), and visual acuity each visit.");
  return { urgency, next, steps: s };
}

/* ================================================================== hearing loss */

export type Fork = "midline" | "left" | "right";
export function tuningFork(weber: Fork, rinneLeft: "positive" | "negative", rinneRight: "positive" | "negative"): string {
  const ear = (side: "left" | "right") => {
    const rinne = side === "left" ? rinneLeft : rinneRight;
    if (rinne === "negative" && weber === side) return `${side} ear: conductive loss (Rinne negative, Weber lateralises to it)`;
    if (rinne === "positive" && weber !== "midline" && weber !== side) return `${side} ear: sensorineural loss (Weber goes to the other ear, Rinne positive)`;
    if (rinne === "negative" && weber !== side) return `${side} ear: Rinne negative with Weber to the other side — consider a dead ear (false negative Rinne from cross-hearing); audiometry`;
    return `${side} ear: normal by tuning forks`;
  };
  return `${ear("left")}; ${ear("right")}.`;
}
export interface HearingInput { onsetHours: number; sudden: boolean; oneSided: boolean; tinnitusOneSided: boolean; vertigo: boolean; pain: boolean; discharge: boolean; wax: boolean; child: boolean; age: number; ototoxic: boolean; noise: boolean; neuro: boolean; weber: Fork; rinneLeft: "positive" | "negative"; rinneRight: "positive" | "negative"; diabetes: boolean }
export function hearingPlan(x: HearingInput): { urgency: Urgency; forks: string; steps: string[] } {
  const s: string[] = [];
  let urgency: Urgency = "routine";
  const forks = tuningFork(x.weber, x.rinneLeft, x.rinneRight);
  const snhl = /sensorineural/.test(forks);
  if (x.neuro) { urgency = "emergency"; s.push("Hearing loss with facial weakness, double vision, ataxia or other new neurological signs: stroke (AICA) or other brainstem lesion — emergency assessment and imaging."); }
  if (x.sudden) {
    urgency = worse(urgency, "urgent");
    s.push(`Sudden hearing loss over less than 72 hours${snhl ? " that is sensorineural by tuning forks" : ""}: treat as sudden sensorineural hearing loss until proven otherwise — ENT and audiometry within 24 hours. Don't put it down to wax or a cold without examining the ear.`);
    s.push(`Steroids work best within 2 weeks: oral prednisolone 1 mg/kg a day (maximum 60 mg) for 7 days then taper over a week${x.diabetes ? " (monitor glucose closely; intratympanic steroid is an alternative in diabetes)" : ""}; intratympanic steroid as salvage. MRI internal auditory meatus to exclude vestibular schwannoma.`);
  }
  if (x.oneSided || x.tinnitusOneSided) s.push("One-sided hearing loss or one-sided tinnitus: MRI of the internal auditory meatus (vestibular schwannoma) after audiometry confirms asymmetry.");
  if (x.wax) s.push("Wax: softening drops (olive oil or sodium bicarbonate) for 1–2 weeks, then irrigation or microsuction; recheck hearing afterwards.");
  if (x.pain || x.discharge) s.push("Pain or discharge: otitis externa or media, perforation or cholesteatoma — examine; foul, persistent discharge with hearing loss needs ENT (cholesteatoma).");
  if (x.child) s.push("Child: glue ear (otitis media with effusion) is the commonest cause — tympanometry and audiometry; watchful waiting 3 months, grommets or hearing aids if persistent with significant loss or speech delay. Any parental concern about hearing warrants a hearing test.");
  if (x.ototoxic) s.push("Ototoxic drugs (aminoglycosides, cisplatin, high-dose loop diuretics, quinine, high-dose aspirin): stop or change if possible; baseline and serial audiometry for aminoglycosides and cisplatin.");
  if (x.noise) s.push("Noise exposure: audiometric notch at 4 kHz; hearing protection, limit exposure; occupational follow-up.");
  if (x.age >= 60 && !x.sudden) s.push("Gradual, both ears, over 60: presbycusis — audiometry and hearing aids (hearing loss is a major modifiable risk factor for dementia); free aids may be available under government schemes (e.g. ADIP).");
  if (x.vertigo) s.push("With vertigo: Ménière's (episodic vertigo, fluctuating low-tone loss, tinnitus, fullness) or labyrinthitis — see Vertigo & HINTS.");
  return { urgency, forks, steps: s };
}

/* ================================================================== vitamin D deficiency (mine) */

export function vitDBand(value: number, unit: "ng/mL" | "nmol/L"): { ng: number; band: "deficient" | "insufficient" | "sufficient" | "high" | "toxic" | "none" } {
  if (!(value > 0)) return { ng: 0, band: "none" };
  const ng = unit === "nmol/L" ? value / 2.5 : value;
  return { ng: r1(ng), band: ng < 12 ? "deficient" : ng < 20 ? "insufficient" : ng <= 100 ? "sufficient" : ng <= 150 ? "high" : "toxic" };
}
export interface VitDInput { value: number; unit: "ng/mL" | "nmol/L"; child: boolean; pregnant: boolean; symptoms: boolean; ckd: boolean; malabsorption: boolean; calciumHigh: boolean; osteoporosis: boolean }
export function vitDPlan(x: VitDInput): { band: string; ng: number; steps: string[] } {
  const v = vitDBand(x.value, x.unit);
  const s: string[] = [];
  if (v.band === "none") return { band: v.band, ng: 0, steps: ["Enter a 25-hydroxyvitamin D level. Don't test everyone: test with symptoms (bone pain, proximal weakness), osteoporosis, malabsorption, CKD, high-risk groups, or before starting bone-active drugs."] };
  s.push(`25(OH)D ${v.ng} ng/mL (${Math.round(v.ng * 2.5)} nmol/L): ${v.band === "deficient" ? "deficient (under 12 ng/mL)" : v.band === "insufficient" ? "insufficient (12–20 ng/mL)" : v.band === "sufficient" ? "sufficient" : v.band === "high" ? "higher than needed — stop high-dose supplements" : "potentially toxic (over 150 ng/mL) — stop vitamin D, check calcium urgently"}.`);
  if (x.calciumHigh) s.push("High calcium: do NOT give vitamin D until the cause is found — primary hyperparathyroidism, sarcoidosis, TB, lymphoma and excess vitamin D (see Hypercalcaemia).");
  else if (v.band === "deficient" || (v.band === "insufficient" && (x.symptoms || x.osteoporosis))) {
    s.push(x.child ? "Child: cholecalciferol 2000 IU daily or 60,000 IU once a week for 6 weeks (age over 1 year), then 400–600 IU daily maintenance; infants 2000 IU daily for 6–12 weeks under paediatric guidance. Ensure calcium intake; rickets needs X-ray, ALP and PTH." : x.pregnant ? "Pregnancy: cholecalciferol 1000–2000 IU daily (higher loading under specialist advice); ensure calcium 1 g a day." : "Adult: cholecalciferol 60,000 IU once a week for 8 weeks (loading), then 60,000 IU once a month or 1000–2000 IU daily for maintenance. Take with a fatty meal.");
    s.push("Check corrected calcium before and about 1 month after loading (unmasked hyperparathyroidism); recheck 25(OH)D after 3 months only if symptoms persist or malabsorption.");
  } else if (v.band === "insufficient") s.push("Insufficient without symptoms: maintenance cholecalciferol 1000 IU daily (or 60,000 IU monthly), 15–30 minutes of sunlight on arms and face most days, dietary calcium.");
  if (x.ckd) s.push("CKD stage 4–5: cholecalciferol for 25(OH)D, but active vitamin D (calcitriol, alfacalcidol) only for secondary hyperparathyroidism under nephrology.");
  if (x.malabsorption) s.push("Malabsorption (coeliac, bariatric surgery, pancreatic insufficiency): higher doses (e.g. 3000–6000 IU daily) and monitoring.");
  s.push("Don't prescribe 600,000 IU 'stoss' injections routinely — oral treatment is as effective and safer; avoid repeated megadoses (toxicity cases are rising in India).");
  return { band: v.band, ng: v.ng, steps: s };
}

/* ================================================================== acute gastroenteritis in adults (mine) */

export interface GeInput { days: number; blood: boolean; fever: boolean; severePain: boolean; dehydration: "none" | "some" | "severe"; elderly: boolean; immuno: boolean; ricewater: boolean; travel: boolean; recentAbx: boolean; foodHandler: boolean; pregnant: boolean; ckd: boolean }
export function gePlan(x: GeInput): { urgency: Urgency; steps: string[] } {
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (x.dehydration === "severe") { urgency = "emergency"; s.push("Severe dehydration (lethargy, sunken eyes, very slow skin pinch, low BP, little urine): IV Ringer's lactate or normal saline 30 mL/kg in the first 30 minutes then 70 mL/kg over 2.5 hours (WHO plan C for adults), with U&E, glucose and potassium."); }
  else if (x.dehydration === "some") s.push("Some dehydration: oral rehydration solution (low-osmolarity ORS) about 75 mL/kg over 4 hours, then replace each loose stool (200–400 mL); IV fluids if vomiting prevents oral intake.");
  else s.push("No dehydration: ORS or fluids after each loose stool, normal diet as tolerated (rice, dal, curd, banana); no need to starve.");
  if (x.ricewater) { urgency = worse(urgency, "urgent"); s.push("Profuse rice-water stools: possible cholera — aggressive rehydration, stool culture, single-dose doxycycline 300 mg (or azithromycin 1 g); notify under IDSP."); }
  if (x.blood || (x.fever && x.severePain)) { urgency = worse(urgency, "urgent"); s.push("Bloody diarrhoea (dysentery) or high fever with severe pain: stool microscopy and culture; azithromycin 500 mg daily for 3 days (or 1 g single dose) — fluoroquinolone resistance is common in India. Bloody diarrhoea with low platelets or kidney injury: think HUS — avoid antibiotics and antimotility drugs, urgent admission."); }
  if (x.recentAbx) s.push("Antibiotics in the last 3 months or recent admission: test stool for Clostridioides difficile toxin; stop the culprit antibiotic; oral vancomycin or fidaxomicin if positive.");
  if (x.elderly || x.immuno || x.ckd || x.pregnant) urgency = worse(urgency, x.dehydration === "none" ? "routine" : "urgent");
  if (x.elderly || x.immuno) s.push("Elderly or immunosuppressed: lower threshold to admit, check kidney function and electrolytes, hold diuretics, ACE inhibitors, metformin and SGLT2 inhibitors while dehydrated (sick-day rules).");
  s.push(x.blood || x.fever ? "Avoid loperamide with blood in the stool or high fever." : "Loperamide 4 mg then 2 mg after each loose stool (max 16 mg a day) can be used for watery diarrhoea in adults without blood or fever; ondansetron 4–8 mg for vomiting.");
  if (x.days >= 7) s.push("Over 7 days: stool microscopy for Giardia, amoeba and Cryptosporidium (metronidazole or tinidazole if found), stool culture; over 4 weeks see Chronic Diarrhoea & IBS.");
  if (x.travel) s.push("Traveller's diarrhoea: mostly self-limiting; azithromycin if moderate to severe or dysentery.");
  if (x.foodHandler) s.push("Food handlers, healthcare and childcare workers: off work until 48 hours after the last episode; hand hygiene.");
  s.push("Return if: blood in stool, unable to keep fluids down, passing little urine, confusion, high fever, or not better in 3–4 days. Probiotics and antibiotics are not needed for routine watery diarrhoea.");
  return { urgency, steps: s };
}

/* ================================================================== anaemia in pregnancy (mine) */

export function ancHbBand(hb: number): "none" | "normal" | "mild" | "moderate" | "severe" | "very severe" {
  if (!(hb > 0)) return "none";
  return hb >= 11 ? "normal" : hb >= 10 ? "mild" : hb >= 7 ? "moderate" : hb >= 4 ? "severe" : "very severe";
}
export interface AncAnaemiaInput { hb: number; weeks: number; ferritin: number; mcvLow: boolean; heartFailure: boolean; breathlessRest: boolean; notResponding: boolean; intolerant: boolean; thalTrait: boolean; weightKg: number }
export function ancAnaemiaPlan(x: AncAnaemiaInput): { band: string; urgency: Urgency; steps: string[] } {
  const band = ancHbBand(x.hb);
  const s: string[] = [];
  let urgency: Urgency = "routine";
  if (band === "none") return { band, urgency, steps: ["Enter the haemoglobin (g/dL)."] };
  if (band === "normal") s.push(`Hb ${x.hb} g/dL: not anaemic (pregnancy cut-off 11 g/dL). Prophylaxis: 1 IFA tablet (60 mg elemental iron + 500 µg folic acid) daily from the second trimester for at least 180 days and 180 days after delivery (Anaemia Mukt Bharat); calcium separately; folic acid 400 µg from before conception through the first trimester.`);
  else {
    s.push(`Hb ${x.hb} g/dL: ${band} anaemia in pregnancy (mild 10–10.9, moderate 7–9.9, severe under 7).`);
    if (band === "severe" || band === "very severe" || x.heartFailure || x.breathlessRest) {
      urgency = band === "very severe" || x.heartFailure || x.breathlessRest ? "emergency" : "urgent";
      s.push("Severe anaemia: admit to a facility with blood bank (FRU); look for heart failure. Transfusion (packed cells, slowly, with furosemide if failing) if Hb under 5 g/dL at any time, under 7 g/dL at 34 weeks or more, or with heart failure, infection or ongoing bleeding; otherwise IV iron.");
    }
    if (band === "mild" || band === "moderate") {
      const needIv = x.weeks >= 30 || x.notResponding || x.intolerant || band === "moderate";
      s.push("Oral: 2 IFA tablets daily (or 1 twice daily) — take on an empty stomach or with vitamin C, away from tea, milk and calcium; treat for at least 3 months, then prophylaxis.");
      if (needIv && x.weeks >= 13) {
        const dose = x.weightKg > 0 ? Math.min(1000, Math.round((x.weightKg * (11 - x.hb) * 2.4 + 500) / 100) * 100) : 0;
        s.push(`IV iron (second or third trimester${x.weeks >= 30 ? " — little time for oral iron to work" : ""}${x.notResponding ? ", not responding" : ""}${x.intolerant ? ", intolerant of oral iron" : ""}): ferric carboxymaltose up to 1000 mg in one infusion (20 mg/kg max), or iron sucrose 200 mg on alternate days${dose ? `; Ganzoni deficit about ${dose} mg (target Hb 11)` : ""}. Not in the first trimester.`);
      }
    }
    s.push("Work-up: peripheral smear, red cell indices, serum ferritin (under 30 µg/L confirms iron deficiency; can be falsely normal with infection); stool for ova; malaria test in endemic areas; HPLC for haemoglobinopathies (thalassaemia trait: microcytosis with normal ferritin) and test the partner if positive.");
    if (x.thalTrait || (x.mcvLow && x.ferritin >= 30)) s.push("Microcytosis with normal ferritin: thalassaemia trait likely — avoid long-term iron without deficiency; folic acid 5 mg daily; partner screening and prenatal diagnosis counselling (CVS at 11–13 weeks) if both are carriers.");
    s.push("Albendazole 400 mg single dose after the first trimester (deworming). Recheck Hb in 3–4 weeks — expect a rise of about 1 g/dL; if not, check adherence, absorption, blood loss and other causes (B12/folate deficiency, haemoglobinopathy).");
  }
  if (x.weeks >= 36 && band !== "normal") s.push("Near term with anaemia: plan delivery at a facility with blood available; active management of the third stage of labour (PPH risk).");
  return { band, urgency, steps: s };
}

/* ================================================================== secondary hypertension (mine) */

export interface SecHtnInput { age: number; resistant: boolean; hypoK: boolean; episodes: boolean; snoring: boolean; renalBruit: boolean; flashOedema: boolean; creatRise: boolean; ckd: boolean; radialFemoralDelay: boolean; cushingoid: boolean; drugs: boolean; thyroid: boolean; suddenOnset: boolean; organDamage: boolean }
export function secHtnPlan(x: SecHtnInput): { suspicion: number; tests: string[]; steps: string[] } {
  const s: string[] = [];
  const tests: string[] = [];
  const add = (t: string) => { if (!tests.includes(t)) tests.push(t); };
  let suspicion = 0;
  s.push("First confirm the diagnosis: home BP (2 readings morning and evening for 7 days) or 24-hour ambulatory BP — exclude white-coat hypertension and check adherence before a big work-up.");
  if (x.age > 0 && x.age < 30) { suspicion++; s.push("Under 30 (especially without obesity or family history): screen for a secondary cause."); }
  if (x.resistant) { suspicion++; s.push("Resistant hypertension (above target on 3 drugs including a diuretic at good doses): about 1 in 5 has primary aldosteronism."); add("Aldosterone-to-renin ratio"); }
  if (x.hypoK) { suspicion++; s.push("Low potassium (spontaneous or diuretic-induced): primary aldosteronism — aldosterone-to-renin ratio after correcting potassium (beta-blockers, ACE inhibitors and diuretics interfere; spironolactone must be stopped 4–6 weeks before)."); add("Aldosterone-to-renin ratio"); }
  if (x.episodes) { suspicion++; s.push("Episodic headache, palpitations and sweating: phaeochromocytoma — plasma free or 24-hour urinary metanephrines."); add("Plasma or urinary metanephrines"); }
  if (x.snoring) { suspicion++; s.push("Snoring, witnessed apnoeas, daytime sleepiness: obstructive sleep apnoea — STOP-BANG and a sleep study (see Sleep Apnoea)."); add("Sleep study"); }
  if (x.renalBruit || x.flashOedema || x.creatRise) { suspicion++; s.push(`Renovascular disease (${[x.renalBruit && "abdominal bruit", x.flashOedema && "flash pulmonary oedema", x.creatRise && "creatinine up over 30% after ACE inhibitor or ARB"].filter(Boolean).join(", ")}): renal artery Doppler or CT/MR angiography; young women — fibromuscular dysplasia; Takayasu arteritis in young Indian patients with pulse asymmetry.`); add("Renal artery Doppler or CT angiography"); }
  if (x.ckd) { suspicion++; s.push("Kidney disease is the commonest secondary cause: urine ACR, eGFR, renal ultrasound."); }
  if (x.radialFemoralDelay) { suspicion++; s.push("Radio-femoral delay or arm–leg BP difference: coarctation of the aorta — echocardiogram and CT/MR aortography."); add("Echocardiogram"); }
  if (x.cushingoid) { suspicion++; s.push("Cushingoid features: overnight dexamethasone suppression test (see Cushing's & Adrenal Incidentaloma)."); add("1 mg dexamethasone suppression test"); }
  if (x.thyroid) { suspicion++; s.push("Thyroid symptoms: TSH (hyper- and hypothyroidism both raise BP); calcium for hyperparathyroidism."); add("TSH"); }
  if (x.drugs) { suspicion++; s.push("Medicines and substances: NSAIDs, oral contraceptives, steroids, decongestants, SNRIs, ciclosporin, erythropoietin, licorice, alcohol, cocaine, some herbal products — stop or change and recheck."); }
  if (x.suddenOnset || x.organDamage) { suspicion++; s.push("Sudden onset, rapid worsening, or organ damage out of proportion to the duration: investigate promptly."); }
  ["Urea, creatinine, electrolytes", "Urine dipstick and ACR", "ECG", "Fasting glucose and lipids", "TSH"].forEach(add);
  s.push(`Tests: ${tests.join("; ")}.`);
  s.push(suspicion >= 2 ? "Several pointers: refer to a hypertension clinic, endocrinology or nephrology as appropriate." : suspicion === 1 ? "One pointer: do the targeted test above; refer if positive." : "No pointers to a secondary cause: essential hypertension is likely — treat to target and recheck yearly.");
  return { suspicion, tests, steps: s };
}
