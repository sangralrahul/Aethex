/**
 * Update 27 on the device: asthma (GINA) and COPD (GOLD) plans with an action plan, developmental
 * milestones, contraception eligibility (key WHO MEC rules) and the national basket, palliative care
 * (morphine titration and end-of-life symptoms), imaging decision rules (Ottawa, Canadian), adult IV
 * fluids, sick-day rules and typical lab reference ranges. No AI here.
 */

/* ------------------------------------------------------------------ asthma (GINA, age 12+) */

export type AsthmaSymptoms = "rare" | "monthly" | "most-days" | "daily-night";
export const GINA_STEPS: { step: number; treatment: string }[] = [
  { step: 1, treatment: "As-needed low-dose ICS-formoterol (budesonide-formoterol 200/6, 1 inhalation when needed)" },
  { step: 2, treatment: "As-needed low-dose ICS-formoterol (as step 1)" },
  { step: 3, treatment: "Low-dose maintenance and reliever therapy (MART): budesonide-formoterol 200/6, 1–2 inhalations twice daily plus 1 as needed" },
  { step: 4, treatment: "Medium-dose MART: budesonide-formoterol 200/6, 2 inhalations twice daily plus 1 as needed" },
  { step: 5, treatment: "Refer: add a long-acting muscarinic antagonist (tiotropium), phenotype (eosinophils, IgE) for biologics; consider high-dose ICS-formoterol" },
];
/** Starting step from symptoms (GINA track 1, adults and adolescents). */
export function ginaStart(s: AsthmaSymptoms, severeAttack = false): number {
  if (severeAttack) return 4;
  return s === "rare" ? 1 : s === "monthly" ? 2 : s === "most-days" ? 3 : 4;
}
/** GINA symptom control over the last 4 weeks: daytime symptoms or reliever use more than twice a week, any night waking, any activity limit. */
export function ginaControl(a: { dayMoreThan2: boolean; night: boolean; relieverMoreThan2: boolean; limited: boolean }): "well controlled" | "partly controlled" | "uncontrolled" {
  const n = [a.dayMoreThan2, a.night, a.relieverMoreThan2, a.limited].filter(Boolean).length;
  return n === 0 ? "well controlled" : n <= 2 ? "partly controlled" : "uncontrolled";
}
export function ginaNext(step: number, control: ReturnType<typeof ginaControl>): string {
  if (control === "well controlled") return step > 2 ? `Well controlled: keep step ${step}; after 3 months of good control, consider stepping down to step ${step - 1}.` : `Well controlled: keep step ${step}.`;
  const base = "Before stepping up: check inhaler technique and adherence, smoking, allergens, rhinitis and other diagnoses.";
  return step >= 5 ? `${base} Already at step 5: specialist care.` : `${base} Then step up to ${step + 1}: ${GINA_STEPS[step].treatment}.`;
}

/* ------------------------------------------------------------------ COPD (GOLD) */

export function goldGroup(a: { modExacerbations: number; hospitalised: number; mmrc: number; cat?: number }): "A" | "B" | "E" {
  if (a.modExacerbations >= 2 || a.hospitalised >= 1) return "E";
  return a.mmrc >= 2 || (a.cat ?? 0) >= 10 ? "B" : "A";
}
export function goldTreatment(g: "A" | "B" | "E", eos?: number): string[] {
  const always = ["Stop smoking (the single most effective step); influenza, pneumococcal and COVID vaccination.", "Pulmonary rehabilitation for groups B and E; check inhaler technique at every visit."];
  if (g === "A") return ["A bronchodilator: a long-acting one (tiotropium, a LAMA, or a LABA) preferred; short-acting as needed.", ...always];
  if (g === "B") return ["LABA + LAMA in one inhaler (for example glycopyrronium-formoterol or tiotropium-olodaterol).", ...always];
  return ["LABA + LAMA; consider LABA + LAMA + ICS if blood eosinophils are 300/µL or more" + (eos !== undefined ? ` (here ${eos}/µL: ${eos >= 300 ? "consider triple therapy" : "dual therapy"})` : "") + ".", "Avoid LABA + ICS without a LAMA in COPD.", ...always];
}

export const INHALER_TECHNIQUE = {
  mdi: ["Shake the inhaler and take the cap off.", "Fit it to the spacer; breathe out fully, away from the mouthpiece.", "Seal your lips round the spacer, press once, and breathe in slowly and deeply (or take 4–5 normal breaths).", "Hold your breath for 10 seconds (or as long as comfortable), then breathe out slowly.", "Wait 30 seconds before a second puff; rinse your mouth after a steroid inhaler."],
  dpi: ["Load the dose as the device shows (twist, click or insert a capsule).", "Breathe out fully, away from the mouthpiece.", "Seal your lips and breathe in fast and deep.", "Hold your breath for 10 seconds, then breathe out slowly.", "Rinse your mouth after a steroid inhaler; never breathe into the device."],
};

export function actionPlanMarkdown(o: { name?: string; maintenance: string; reliever: string; bestPef?: number }): string {
  const p = o.bestPef;
  return [
    "# Asthma action plan", o.name ? `**${o.name}**` : "",
    "", "## Green: doing well", `No cough, wheeze or breathlessness; sleeping well${p ? `; peak flow above ${Math.round(p * 0.8)} L/min` : ""}.`, `- Every day: ${o.maintenance || "as prescribed"}`, `- When needed: ${o.reliever}`,
    "", "## Yellow: getting worse", `Cough, wheeze or tight chest, waking at night, or needing the reliever more${p ? `; peak flow ${Math.round(p * 0.6)}–${Math.round(p * 0.8)} L/min` : ""}.`, `- Take the reliever: ${o.reliever}`, "- If on MART, take extra inhalations as needed (no more than 12 a day in total).", "- If not better in 2–3 days, or you need the reliever every few hours, see your doctor.",
    "", "## Red: emergency", `Very short of breath, can't speak in sentences, lips blue, the reliever isn't helping${p ? `, or peak flow under ${Math.round(p * 0.6)} L/min` : ""}.`, `- Take the reliever now and repeat as needed on the way.`, "- Go to the nearest hospital or call 108 at once.",
  ].filter((x) => x !== "").join("\n");
}

/* ------------------------------------------------------------------ developmental milestones */

export type Domain = "Gross motor" | "Fine motor" | "Language" | "Social";
export interface Milestone { months: number; domain: Domain; text: string; flag?: number }
/** Typical age (months) for each milestone and, for key ones, the age by which not achieving it is a red flag. */
export const MILESTONES: Milestone[] = [
  { months: 3, domain: "Gross motor", text: "Holds the head steady", flag: 4 }, { months: 5, domain: "Gross motor", text: "Rolls over" }, { months: 6, domain: "Gross motor", text: "Sits with support (tripod)" },
  { months: 8, domain: "Gross motor", text: "Sits without support", flag: 9 }, { months: 9, domain: "Gross motor", text: "Crawls; stands holding on" }, { months: 12, domain: "Gross motor", text: "Walks holding on; stands alone" },
  { months: 15, domain: "Gross motor", text: "Walks alone", flag: 18 }, { months: 18, domain: "Gross motor", text: "Runs; climbs stairs with help" }, { months: 24, domain: "Gross motor", text: "Goes up and down stairs, two feet a step; kicks a ball" },
  { months: 36, domain: "Gross motor", text: "Rides a tricycle; climbs stairs one foot a step" }, { months: 48, domain: "Gross motor", text: "Hops on one foot" }, { months: 60, domain: "Gross motor", text: "Skips" },
  { months: 4, domain: "Fine motor", text: "Brings hands together; holds a rattle" }, { months: 6, domain: "Fine motor", text: "Reaches with one hand; passes objects hand to hand" }, { months: 9, domain: "Fine motor", text: "Immature pincer grasp" },
  { months: 12, domain: "Fine motor", text: "Neat pincer grasp; lets go on request" }, { months: 15, domain: "Fine motor", text: "Tower of 2 cubes; scribbles" }, { months: 18, domain: "Fine motor", text: "Tower of 3 cubes; turns several pages at a time" },
  { months: 24, domain: "Fine motor", text: "Tower of 6 cubes; turns single pages; copies a vertical line" }, { months: 36, domain: "Fine motor", text: "Tower of 9 cubes; copies a circle" }, { months: 48, domain: "Fine motor", text: "Copies a cross" }, { months: 60, domain: "Fine motor", text: "Copies a triangle" },
  { months: 1, domain: "Language", text: "Startles or quietens to sounds" }, { months: 3, domain: "Language", text: "Coos" }, { months: 4, domain: "Language", text: "Laughs aloud" },
  { months: 6, domain: "Language", text: "Babbles single syllables" }, { months: 9, domain: "Language", text: "Says 'mama', 'dada' (not specific)" }, { months: 12, domain: "Language", text: "1–2 words with meaning; responds to name", flag: 16 },
  { months: 18, domain: "Language", text: "About 10 words; points to show interest", flag: 18 }, { months: 24, domain: "Language", text: "Two-word phrases; about 50 words", flag: 24 }, { months: 36, domain: "Language", text: "Short sentences; says name and gender" },
  { months: 48, domain: "Language", text: "Tells a story; asks many questions" }, { months: 60, domain: "Language", text: "Asks the meaning of words; speech fully understandable" },
  { months: 2, domain: "Social", text: "Social smile", flag: 3 }, { months: 3, domain: "Social", text: "Recognises the mother" }, { months: 7, domain: "Social", text: "Stranger anxiety" },
  { months: 9, domain: "Social", text: "Waves bye-bye; plays peek-a-boo" }, { months: 12, domain: "Social", text: "Plays a simple ball game; shows affection" }, { months: 18, domain: "Social", text: "Copies parents in household tasks" },
  { months: 24, domain: "Social", text: "Parallel play; asks for food, drink and the toilet" }, { months: 36, domain: "Social", text: "Shares toys; knows own gender" }, { months: 48, domain: "Social", text: "Plays with others; uses the toilet alone" }, { months: 60, domain: "Social", text: "Dresses and undresses; helps at home" },
];
export const RED_FLAGS_ANY = ["Loss of any skill already learned, at any age", "Hand preference before 18 months", "No response to name or no eye contact by 12 months", "No pointing by 14 months; repetitive behaviours or unusual reactions to sounds and textures (screen for autism)", "Not hearing or not looking at faces", "Persistent primitive reflexes after 6 months, or stiffness or floppiness"];
/** Corrected age for babies born before 37 weeks, used until 24 months. */
export function correctedMonths(ageMonths: number, gestationWeeks?: number): number {
  if (!gestationWeeks || gestationWeeks >= 37 || ageMonths > 24) return ageMonths;
  return Math.max(0, Math.round((ageMonths - (40 - gestationWeeks) / 4.345) * 10) / 10);
}
export const expectedBy = (ageMonths: number) => MILESTONES.filter((m) => m.months <= ageMonths).sort((a, b) => a.months - b.months);
export const nextUp = (ageMonths: number) => MILESTONES.filter((m) => m.months > ageMonths).sort((a, b) => a.months - b.months).slice(0, 6);
/** Missed milestones that are red flags at this age (past the flag age), or more than 3 months overdue. */
export function milestoneConcerns(ageMonths: number, achieved: Set<string>): Milestone[] {
  return MILESTONES.filter((m) => !achieved.has(m.text) && ((m.flag !== undefined && ageMonths >= m.flag) || ageMonths >= m.months + 3));
}

/* ------------------------------------------------------------------ contraception */

export type Method = "coc" | "pop" | "dmpa" | "centchroman" | "iud" | "condom" | "sterilisation";
export const METHODS: { id: Method; name: string; how: string; start: string }[] = [
  { id: "coc", name: "Combined pill (Mala-N)", how: "1 pill daily; 21 active + 7 iron pills", start: "Within 5 days of the period starting: no back-up needed. Any other time if reasonably sure she isn't pregnant: condoms for 7 days." },
  { id: "pop", name: "Progestogen-only pill", how: "1 pill daily at the same time (within 3 hours)", start: "Within 5 days of the period starting, or from 6 weeks after delivery if breastfeeding; otherwise condoms for 2 days." },
  { id: "dmpa", name: "Injectable (Antara, DMPA 150 mg IM)", how: "Every 3 months (13 weeks); can be given up to 2 weeks early or 4 weeks late", start: "Within 7 days of the period starting; otherwise condoms for 7 days. From 6 weeks after delivery if breastfeeding." },
  { id: "centchroman", name: "Centchroman (Chhaya)", how: "30 mg twice a week for 3 months, then once a week", start: "First tablet on the first day of the period. Non-hormonal; may delay periods." },
  { id: "iud", name: "Copper IUCD (Cu 380A or 375; also PPIUCD after delivery)", how: "Lasts 10 years (Cu 380A) or 5 years (Cu 375)", start: "Within 12 days of the period starting, or any time if reasonably sure she isn't pregnant; within 48 hours of delivery (PPIUCD) or from 4 weeks after. Also emergency contraception up to 5 days after sex." },
  { id: "condom", name: "Condoms", how: "Every time; the only method that also protects against STIs", start: "Any time." },
  { id: "sterilisation", name: "Sterilisation (tubectomy or vasectomy)", how: "Permanent", start: "After counselling and written consent; vasectomy needs condoms until semen analysis shows no sperm (about 3 months)." },
];
export interface MecIn { age?: number; smoker15?: boolean; bpHigh?: "none" | "140" | "160"; vte?: boolean; migraineAura?: boolean; breastCancer?: boolean; ihdStroke?: boolean; diabetesVascular?: boolean; liverSevere?: boolean; postpartumWeeks?: number; breastfeeding?: boolean; pid?: boolean; unexplainedBleeding?: boolean; sle_aPL?: boolean; pcos?: boolean; recentJaundice?: boolean }
export type MecCat = 1 | 3 | 4;
/** Key WHO MEC (5th edition) categories for the common situations; anything not covered is "check". */
export function mec(i: MecIn): Record<Method, { cat: MecCat; why: string[] }> {
  const r = Object.fromEntries(METHODS.map((m) => [m.id, { cat: 1 as MecCat, why: [] as string[] }])) as Record<Method, { cat: MecCat; why: string[] }>;
  const set = (m: Method, cat: MecCat, why: string) => { if (cat > r[m].cat) r[m].cat = cat; r[m].why.push(why); };
  const hormonal: Method[] = ["coc", "pop", "dmpa"];
  if ((i.age ?? 0) >= 35 && i.smoker15) set("coc", 4, "Age 35 or over and smoking 15 or more a day");
  if (i.bpHigh === "160") { set("coc", 4, "BP 160/100 or more"); set("dmpa", 3, "BP 160/100 or more"); }
  else if (i.bpHigh === "140") set("coc", 3, "BP 140–159/90–99");
  if (i.vte) { set("coc", 4, "Past or current DVT/PE"); set("pop", 3, "Current DVT/PE (past DVT: generally fine)"); set("dmpa", 3, "Current DVT/PE (past DVT: generally fine)"); }
  if (i.migraineAura) set("coc", 4, "Migraine with aura");
  if (i.breastCancer) for (const m of hormonal) set(m, 4, "Current breast cancer");
  if (i.ihdStroke) { set("coc", 4, "Heart disease or stroke"); set("dmpa", 3, "Heart disease or stroke"); }
  if (i.diabetesVascular) { set("coc", 3, "Diabetes with vascular disease (3 or 4)"); set("dmpa", 3, "Diabetes with vascular disease"); }
  if (i.liverSevere) { for (const m of hormonal) set(m, m === "coc" ? 4 : 3, "Severe cirrhosis or liver tumour"); set("centchroman", 4, "Liver disease"); }
  if (i.sle_aPL) { set("coc", 4, "SLE with antiphospholipid antibodies"); set("pop", 3, "SLE with antiphospholipid antibodies"); set("dmpa", 3, "SLE with antiphospholipid antibodies"); }
  const pw = i.postpartumWeeks;
  if (pw !== undefined) {
    if (i.breastfeeding && pw < 6) { set("coc", 4, "Breastfeeding, under 6 weeks after delivery"); set("dmpa", 3, "Breastfeeding, under 6 weeks after delivery"); }
    else if (i.breastfeeding && pw < 26) set("coc", 3, "Breastfeeding, 6 weeks to 6 months after delivery");
    else if (!i.breastfeeding && pw < 3) set("coc", 4, "Under 3 weeks after delivery");
    if (pw >= 0.3 && pw < 4) set("iud", 3, "48 hours to 4 weeks after delivery (insert within 48 hours or after 4 weeks)");
  }
  if (i.pid) set("iud", 4, "Current PID, purulent cervicitis, gonorrhoea or chlamydia (starting)");
  if (i.unexplainedBleeding) { set("iud", 4, "Unexplained vaginal bleeding: evaluate first"); set("dmpa", 3, "Unexplained vaginal bleeding: evaluate first"); }
  if (i.pcos) set("centchroman", 4, "PCOS (Chhaya not advised)");
  if (i.recentJaundice) set("centchroman", 4, "Recent jaundice or liver disease");
  return r;
}
export const MEC_LABEL: Record<MecCat, string> = { 1: "Can use", 3: "Usually not recommended", 4: "Don't use" };
export const EMERGENCY_CONTRACEPTION = ["Levonorgestrel 1.5 mg as one dose, as soon as possible and within 72 hours (works less well up to 120 hours).", "A copper IUCD within 5 days is the most effective emergency method and continues as contraception.", "Start or continue regular contraception straight after; a pregnancy test if the next period is more than a week late."];

/* ------------------------------------------------------------------ palliative care */

export interface MorphinePlan { regular: string; breakthrough: string; total24: number; sc24: number; notes: string[] }
/** Oral morphine: start 2.5–5 mg every 4 hours (2.5 mg and less often in the elderly, frail or with kidney impairment); then regular = last 24 h total ÷ 6, breakthrough = 1/6 of the daily total. */
export function morphinePlan(o: { last24Mg?: number; naive?: boolean; frail?: boolean; renal?: boolean }): MorphinePlan {
  const notes = ["Always prescribe a laxative (senna with lactulose) with regular morphine.", "Anti-sickness for the first week if needed (haloperidol 0.5–1.5 mg at night).", "Warn about drowsiness in the first days; it usually settles. Review every 24–48 hours.", "Oral morphine is available through Recognised Medical Institutions under the NDPS (Amendment) Act, 2014."];
  if (o.renal) notes.unshift("Kidney impairment: morphine metabolites build up; use the lowest dose less often, or switch to fentanyl or low-dose oxycodone.");
  if (o.naive || !o.last24Mg) {
    const d = o.frail || o.renal ? 2.5 : 5;
    const every = o.frail || o.renal ? 6 : 4;
    const total = (d * 24) / every;
    return { regular: `${d} mg oral immediate-release morphine every ${every} hours`, breakthrough: `${d} mg as needed, up to hourly`, total24: total, sc24: total / 2, notes };
  }
  const t = o.last24Mg;
  const reg = Math.round((t / 6) * 2) / 2;
  return { regular: `${reg} mg every 4 hours (or ${Math.round(t / 2)} mg twice daily as slow-release)`, breakthrough: `${Math.round((t / 6) * 2) / 2} mg as needed, up to hourly`, total24: t, sc24: Math.round(t / 2), notes };
}
export const EOL_SYMPTOMS: { symptom: string; steps: string[] }[] = [
  { symptom: "Breathlessness", steps: ["A fan to the face, sitting up, calm presence; oxygen only if hypoxic.", "Oral morphine 2.5 mg every 4 hours as needed (opioid-naive), or 25% more than the breakthrough dose if already on morphine.", "Lorazepam 0.5 mg under the tongue for panic."] },
  { symptom: "Nausea and vomiting", steps: ["Chemical (drugs, kidney failure, high calcium): haloperidol 0.5–1.5 mg at night or twice daily.", "Gastric stasis: metoclopramide 10 mg three times daily (not with colicky bowel obstruction).", "Raised intracranial pressure: dexamethasone; vestibular: cyclizine or promethazine."] },
  { symptom: "Noisy breathing (secretions)", steps: ["Reposition on the side; explain to the family that it isn't distressing to the patient.", "Hyoscine butylbromide 20 mg SC every 4 hours as needed (maximum 120 mg a day), or glycopyrronium 200 microgram SC."] },
  { symptom: "Agitation and delirium", steps: ["Look for pain, a full bladder, constipation, hypoxia or drugs.", "Haloperidol 0.5–1.5 mg SC or orally for delirium.", "Terminal agitation: midazolam 2.5–5 mg SC as needed."] },
  { symptom: "Constipation", steps: ["Senna 7.5–15 mg at night with lactulose 10–20 ml twice daily; a suppository if no stool for 3 days.", "Not bulk laxatives in the frail or bed-bound."] },
  { symptom: "Mouth care", steps: ["Moist swabs, lip balm, treat thrush (nystatin or fluconazole); small sips or ice chips."] },
];

/* ------------------------------------------------------------------ imaging decision rules */

export function ottawaAnkle(a: { malleolarPain: boolean; lateralTender: boolean; medialTender: boolean; midfootPain: boolean; fifthMetTender: boolean; navicularTender: boolean; cantBearWeight: boolean }) {
  const ankle = a.malleolarPain && (a.lateralTender || a.medialTender || a.cantBearWeight);
  const foot = a.midfootPain && (a.fifthMetTender || a.navicularTender || a.cantBearWeight);
  return { ankle, foot, text: ankle || foot ? `X-ray ${[ankle && "the ankle", foot && "the foot"].filter(Boolean).join(" and ")}.` : "No X-ray needed by the Ottawa rules (sensitivity close to 100% for fractures)." };
}
export function ottawaKnee(a: { age55: boolean; patellaOnly: boolean; fibularHead: boolean; cantFlex90: boolean; cantBearWeight: boolean }) {
  const xray = a.age55 || a.patellaOnly || a.fibularHead || a.cantFlex90 || a.cantBearWeight;
  return { xray, text: xray ? "X-ray the knee." : "No X-ray needed by the Ottawa knee rule." };
}
export function canadianCtHead(a: { gcsUnder15At2h: boolean; openOrDepressed: boolean; basalSkull: boolean; vomiting2: boolean; age65: boolean; amnesia30: boolean; dangerous: boolean }) {
  const high = a.gcsUnder15At2h || a.openOrDepressed || a.basalSkull || a.vomiting2 || a.age65;
  const medium = a.amnesia30 || a.dangerous;
  return { ct: high || medium, text: high ? "CT head: high risk for needing neurosurgery." : medium ? "CT head: medium risk (brain injury on CT)." : "No CT needed by the Canadian CT Head Rule (for GCS 13–15 with loss of consciousness, amnesia or disorientation; not for anticoagulated patients, seizures or age under 16)." };
}
export function canadianCSpine(a: { age65: boolean; dangerous: boolean; paraesthesia: boolean; lowRiskFactor: boolean; canRotate45: boolean }) {
  if (a.age65 || a.dangerous || a.paraesthesia) return { image: true, text: "Image the cervical spine (high-risk factor)." };
  if (!a.lowRiskFactor) return { image: true, text: "Image: no low-risk factor allows a safe range-of-motion test." };
  return a.canRotate45 ? { image: false, text: "No imaging needed: the neck rotates 45° left and right." } : { image: true, text: "Image: can't rotate the neck 45° both ways." };
}

/* ------------------------------------------------------------------ adult IV fluids */

/** NICE CG174 style: maintenance 25–30 ml/kg/day water, 1 mmol/kg/day each of sodium, potassium and chloride, 50–100 g glucose. */
export function ivFluids(weightKg: number, o: { frail?: boolean; heartFailure?: boolean; obese?: boolean; heightCm?: number } = {}) {
  if (!(weightKg >= 20 && weightKg <= 300)) return null;
  const w = o.obese && o.heightCm ? Math.min(weightKg, Math.round((o.heightCm - 100) * 0.9 + 10)) : weightKg;
  const per = o.frail || o.heartFailure ? 20 : 25;
  const water = Math.round(w * per), waterHi = Math.round(w * (o.frail || o.heartFailure ? 25 : 30));
  return {
    water: `${water}–${waterHi} ml a day (about ${Math.round(water / 24)}–${Math.round(waterHi / 24)} ml/hour)`,
    electrolytes: `About ${Math.round(w)} mmol each of sodium, potassium and chloride a day`, glucose: "50–100 g glucose a day to limit starvation ketosis",
    example: `For example: about ${Math.round(waterHi / 100) / 10} L of 5% dextrose with 0.18% saline over 24 hours, with KCl added to give about ${Math.round(w)} mmol potassium in total`,
    bolus: o.heartFailure || o.frail ? "Resuscitation: 250 ml crystalloid over 15 minutes, then reassess (frail or heart failure)" : "Resuscitation: 500 ml crystalloid (Ringer's lactate or 0.9% saline) over under 15 minutes, then reassess; up to 2 L before senior review",
    weightUsed: w,
  };
}

/* ------------------------------------------------------------------ sick-day rules */

export const SICK_DAY: { drug: string; examples: string; rule: string }[] = [
  { drug: "Sulfonylureas", examples: "glimepiride, gliclazide", rule: "Stop if not eating; check sugar more often (risk of low sugar)." },
  { drug: "ACE inhibitors", examples: "ramipril, enalapril", rule: "Stop during vomiting, diarrhoea or fever with sweating; restart 24–48 hours after eating and drinking normally." },
  { drug: "Diuretics", examples: "furosemide, torsemide, hydrochlorothiazide, spironolactone", rule: "Stop while dehydrated; restart when better (call if weight rises or breathlessness)." },
  { drug: "Metformin", examples: "metformin", rule: "Stop while vomiting, with diarrhoea or dehydration; restart when eating normally." },
  { drug: "ARBs", examples: "telmisartan, losartan, olmesartan", rule: "Stop during the illness as for ACE inhibitors." },
  { drug: "NSAIDs", examples: "ibuprofen, diclofenac, aceclofenac", rule: "Don't take; use paracetamol instead." },
  { drug: "SGLT2 inhibitors", examples: "dapagliflozin, empagliflozin", rule: "Stop when unwell or not eating (risk of ketoacidosis, even with normal sugar)." },
];
export const STEROID_SICK_DAY = ["On long-term steroids (prednisolone 5 mg or more for over 4 weeks, or hydrocortisone for adrenal insufficiency): double the daily dose with fever over 38 °C or an illness needing bed rest, for its duration.", "If vomiting and can't keep tablets down: an injection of hydrocortisone 100 mg IM and go to hospital.", "Never stop steroids suddenly; carry a steroid card."];
export const INSULIN_SICK_DAY = ["Never stop insulin, even if not eating; check sugar every 4 hours (and ketones if type 1).", "Drink 100–200 ml of sugar-free fluid every hour; if not eating, sip sweet drinks.", "Go to hospital with vomiting that won't stop, sugar over 300 mg/dL that won't come down, ketones, drowsiness or breathlessness."];
export function sickDayMarkdown(selected: string[], steroid: boolean, insulin: boolean): string {
  const rows = SICK_DAY.filter((r) => selected.includes(r.drug));
  return ["# When you are unwell: your medicines", "If you have vomiting, diarrhoea, or a fever with sweating and shaking:", "", ...rows.map((r) => `- **${r.drug}** (${r.examples}): ${r.rule}`), steroid ? `\n## Steroids\n${STEROID_SICK_DAY.map((s) => `- ${s}`).join("\n")}` : "", insulin ? `\n## Insulin\n${INSULIN_SICK_DAY.map((s) => `- ${s}`).join("\n")}` : "", "\nRestart the stopped medicines 24–48 hours after you are eating and drinking normally. Call your doctor if you are not better in 2 days."].filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ lab reference ranges (typical adult) */

export const LAB_RANGES: { group: string; test: string; range: string; unit: string }[] = [
  { group: "Blood count", test: "Haemoglobin", range: "Men 13–17; women 12–15", unit: "g/dL" }, { group: "Blood count", test: "Total leucocyte count", range: "4,000–11,000", unit: "/µL" },
  { group: "Blood count", test: "Platelets", range: "1.5–4.5 lakh", unit: "/µL" }, { group: "Blood count", test: "MCV", range: "80–100", unit: "fL" }, { group: "Blood count", test: "ESR", range: "Men 0–15; women 0–20", unit: "mm/hour" },
  { group: "Kidney and electrolytes", test: "Urea", range: "15–40", unit: "mg/dL" }, { group: "Kidney and electrolytes", test: "Creatinine", range: "Men 0.7–1.3; women 0.6–1.1", unit: "mg/dL" },
  { group: "Kidney and electrolytes", test: "Sodium", range: "135–145", unit: "mmol/L" }, { group: "Kidney and electrolytes", test: "Potassium", range: "3.5–5.0", unit: "mmol/L" }, { group: "Kidney and electrolytes", test: "Chloride", range: "98–107", unit: "mmol/L" },
  { group: "Kidney and electrolytes", test: "Bicarbonate", range: "22–28", unit: "mmol/L" }, { group: "Kidney and electrolytes", test: "Calcium (total)", range: "8.5–10.5", unit: "mg/dL" }, { group: "Kidney and electrolytes", test: "Magnesium", range: "1.7–2.4", unit: "mg/dL" },
  { group: "Kidney and electrolytes", test: "Phosphate", range: "2.5–4.5", unit: "mg/dL" }, { group: "Kidney and electrolytes", test: "Uric acid", range: "Men 3.5–7.2; women 2.6–6.0", unit: "mg/dL" },
  { group: "Liver", test: "Bilirubin (total)", range: "0.3–1.2", unit: "mg/dL" }, { group: "Liver", test: "ALT (SGPT)", range: "Up to 40", unit: "U/L" }, { group: "Liver", test: "AST (SGOT)", range: "Up to 40", unit: "U/L" },
  { group: "Liver", test: "Alkaline phosphatase", range: "40–130", unit: "U/L" }, { group: "Liver", test: "Albumin", range: "3.5–5.0", unit: "g/dL" }, { group: "Liver", test: "INR", range: "0.9–1.2", unit: "" },
  { group: "Sugar and lipids", test: "Fasting glucose", range: "70–99 (diabetes 126 or more)", unit: "mg/dL" }, { group: "Sugar and lipids", test: "2-hour glucose (75 g)", range: "Under 140 (diabetes 200 or more)", unit: "mg/dL" },
  { group: "Sugar and lipids", test: "HbA1c", range: "Under 5.7% (diabetes 6.5% or more)", unit: "%" }, { group: "Sugar and lipids", test: "LDL cholesterol", range: "Under 100 (target varies by risk)", unit: "mg/dL" },
  { group: "Sugar and lipids", test: "HDL cholesterol", range: "Men over 40; women over 50", unit: "mg/dL" }, { group: "Sugar and lipids", test: "Triglycerides", range: "Under 150", unit: "mg/dL" },
  { group: "Thyroid and others", test: "TSH", range: "0.4–4.5", unit: "mIU/L" }, { group: "Thyroid and others", test: "Free T4", range: "0.8–1.8", unit: "ng/dL" }, { group: "Thyroid and others", test: "Ferritin", range: "Men 30–400; women 15–150", unit: "ng/mL" },
  { group: "Thyroid and others", test: "Vitamin B12", range: "200–900", unit: "pg/mL" }, { group: "Thyroid and others", test: "25-OH vitamin D", range: "30–100 (deficient under 20)", unit: "ng/mL" }, { group: "Thyroid and others", test: "CRP", range: "Under 5", unit: "mg/L" },
  { group: "Blood gas", test: "pH", range: "7.35–7.45", unit: "" }, { group: "Blood gas", test: "PaCO₂", range: "35–45", unit: "mmHg" }, { group: "Blood gas", test: "PaO₂ (room air)", range: "80–100", unit: "mmHg" }, { group: "Blood gas", test: "Lactate", range: "Under 2", unit: "mmol/L" },
];
export const findLab = (q: string) => { const t = q.trim().toLowerCase(); return t ? LAB_RANGES.filter((r) => `${r.test} ${r.group}`.toLowerCase().includes(t)) : LAB_RANGES; };
