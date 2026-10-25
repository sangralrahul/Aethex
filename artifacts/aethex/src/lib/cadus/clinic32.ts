/**
 * Update 32, on the device (no AI): upper GI bleeding and H. pylori, acute kidney injury,
 * hepatitis B and C, newborn resuscitation, pain relief, osteoporosis, menopause and HRT, and syncope.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== upper GI bleed */

export type UreaUnit = "mgdl" | "bun" | "mmol";
export const ureaToMmol = (v: number, u: UreaUnit) => (u === "mmol" ? v : u === "mgdl" ? v / 6.006 : v * 0.357);
export interface GbsIn { urea: number; unit: UreaUnit; hb: number; male: boolean; sbp: number; pulse100: boolean; melaena: boolean; syncope: boolean; liver: boolean; heartFailure: boolean }
/** Glasgow-Blatchford score. */
export function glasgowBlatchford(i: GbsIn): { score: number; text: string } {
  const u = ureaToMmol(i.urea, i.unit);
  let s = u >= 25 ? 6 : u >= 10 ? 4 : u >= 8 ? 3 : u >= 6.5 ? 2 : 0;
  if (i.male) s += i.hb < 10 ? 6 : i.hb < 12 ? 3 : i.hb < 13 ? 1 : 0;
  else s += i.hb < 10 ? 6 : i.hb < 12 ? 1 : 0;
  s += i.sbp > 0 ? (i.sbp < 90 ? 3 : i.sbp < 100 ? 2 : i.sbp < 110 ? 1 : 0) : 0;
  s += (i.pulse100 ? 1 : 0) + (i.melaena ? 1 : 0) + (i.syncope ? 2 : 0) + (i.liver ? 2 : 0) + (i.heartFailure ? 2 : 0);
  return { score: s, text: s <= 1 ? `GBS ${s}: very low risk: suitable for outpatient endoscopy and early discharge` : s >= 7 ? `GBS ${s}: high risk: likely to need endoscopic treatment or transfusion; admit, resuscitate, endoscopy within 24 hours (within 12 if unstable)` : `GBS ${s}: admit for endoscopy within 24 hours` };
}
export function ugibPlan(variceal: boolean, anticoag: boolean, cardiac: boolean): string[] {
  const out = [
    "Two large-bore cannulae; crystalloid to restore perfusion; group and cross-match; monitor urine output.",
    `Transfuse red cells if Hb under ${cardiac ? "8 (heart disease), target 10" : "7, target 7–9"}; platelets if under 50,000 and bleeding.`,
    "IV pantoprazole 80 mg before endoscopy is reasonable; erythromycin 250 mg IV 30–120 minutes before endoscopy improves the view.",
  ];
  if (anticoag) out.push("On warfarin: stop it; 4-factor PCC 25–50 IU/kg and IV vitamin K 5–10 mg if bleeding is serious. On a DOAC: stop; consider idarucizumab (dabigatran) or PCC for life-threatening bleeding.");
  if (variceal) out.push("Suspected variceal bleed (cirrhosis): terlipressin 2 mg IV 4-hourly, ceftriaxone 1 g daily for 7 days, endoscopy and band ligation within 12 hours; avoid over-transfusion (Hb 7–8).");
  out.push("After endoscopy, high-risk ulcer (active bleeding, visible vessel, adherent clot): high-dose IV PPI for 72 hours (80 mg then 8 mg/hour, or 40 mg twice daily), then oral PPI twice daily for 2 weeks and once daily to 8 weeks.");
  out.push("Test and treat H. pylori; stop NSAIDs; restart aspirin for secondary prevention within 3–5 days once haemostasis is secure.");
  return out;
}
export type HpRegimen = "bismuth" | "clarithro" | "levo";
export function hpylori(penAllergy: boolean, failedFirst: boolean): { regimen: string; lines: string[]; notes: string[] } {
  const notes = ["Test with a stool antigen or urea breath test: stop PPIs for 2 weeks and antibiotics for 4 weeks before (serology cannot show cure).", "Confirm cure with a breath or stool test at least 4 weeks after treatment.", "Clarithromycin and metronidazole resistance is high in India: bismuth quadruple therapy is preferred where available."];
  if (failedFirst) return { regimen: "Second line: levofloxacin triple (14 days)", lines: ["PPI (e.g. pantoprazole 40 mg) twice daily", "Amoxicillin 1 g twice daily", "Levofloxacin 500 mg once daily (or 250 mg twice daily)"], notes: [...notes, "Avoid repeating clarithromycin; consider culture-guided therapy after two failures."] };
  return { regimen: `Bismuth quadruple therapy (14 days)${penAllergy ? ": also suitable with penicillin allergy" : ""}`, lines: ["PPI (e.g. omeprazole 20 mg or pantoprazole 40 mg) twice daily", "Bismuth subcitrate 120 mg 4 times a day (or 240 mg twice daily)", "Tetracycline 500 mg 4 times a day (doxycycline is less effective)", "Metronidazole 400–500 mg 3–4 times a day (no alcohol)"], notes: [...notes, ...(penAllergy ? [] : ["If bismuth is unavailable: PPI + amoxicillin 1 g + clarithromycin 500 mg + metronidazole 500 mg, all twice daily for 14 days (concomitant therapy)."])] };
}

/* ================================================================== AKI */

export interface AkiIn { baseline: number; current: number; within48h?: boolean; uoMlKgH?: number; uoHours?: number; rrt?: boolean }
/** KDIGO AKI stage from creatinine (mg/dL) and urine output. */
export function akiStage(i: AkiIn): { stage: 0 | 1 | 2 | 3; byCr: number; byUo: number; text: string } {
  const ratio = i.baseline > 0 && i.current > 0 ? i.current / i.baseline : 0;
  const rise = i.current - i.baseline;
  let cr = 0;
  if (i.rrt || ratio >= 3 || (i.current >= 4 && (rise >= 0.3 || ratio >= 1.5))) cr = 3;
  else if (ratio >= 2) cr = 2;
  else if (ratio >= 1.5 || (i.within48h && rise >= 0.3)) cr = 1;
  let uo = 0;
  const u = i.uoMlKgH, h = i.uoHours ?? 0;
  if (u !== undefined && u >= 0) {
    if ((u < 0.3 && h >= 24) || (u === 0 && h >= 12)) uo = 3;
    else if (u < 0.5 && h >= 12) uo = 2;
    else if (u < 0.5 && h >= 6) uo = 1;
  }
  const stage = Math.max(cr, uo) as 0 | 1 | 2 | 3;
  const text = stage === 0 ? "Does not meet KDIGO AKI criteria now; repeat creatinine in 24–48 hours if at risk" : `AKI stage ${stage}${cr && uo ? " (creatinine and urine output)" : cr ? " (by creatinine)" : " (by urine output)"}${ratio ? `: creatinine ${r1(ratio)}× baseline` : ""}`;
  return { stage, byCr: cr, byUo: uo, text };
}
export const AKI_CAUSES: { group: string; items: string[] }[] = [
  { group: "Before the kidney", items: ["Dehydration, vomiting, diarrhoea, bleeding", "Sepsis or shock", "Heart failure, cirrhosis", "ACE inhibitor, ARB, diuretic, NSAID"] },
  { group: "In the kidney", items: ["Prolonged low BP (ATN)", "Drugs: aminoglycosides, vancomycin, contrast, amphotericin, PPIs and antibiotics (interstitial nephritis)", "Blood and protein in urine (glomerulonephritis, vasculitis)", "Rhabdomyolysis, haemolysis", "Snakebite, leptospirosis, malaria, dengue"] },
  { group: "After the kidney", items: ["Urinary retention (prostate, drugs, clots)", "Stones, tumours, blocked catheter"] },
];
export function akiPlan(stage: number, x: { k?: number; ph?: number; overload?: boolean; uraemic?: boolean; toxin?: boolean }): { now: string[]; dialysis: string[] } {
  const now = [
    "Assess volume: if dry, 250–500 ml crystalloid and reassess; if overloaded, no more fluid (diuretic trial if passing urine).",
    "Stop or hold: NSAIDs, ACE inhibitor/ARB, diuretics, metformin, SGLT2 inhibitor, aminoglycosides; avoid contrast if possible; adjust all doses for current kidney function.",
    "Urine dipstick (blood, protein) and microscopy; bladder scan or catheter if retention; renal ultrasound within 24 hours if no clear cause or obstruction is possible.",
    `Monitor: fluid balance and hourly urine output${stage >= 2 ? " (catheter)" : ""}, daily weight, creatinine and potassium at least daily${stage >= 2 ? "; ABG/VBG" : ""}.`,
  ];
  if (stage >= 3) now.push("Stage 3: discuss with nephrology now.");
  if (x.k !== undefined && x.k >= 6.5) now.push(`Potassium ${x.k}: ECG; calcium gluconate 10% 30 ml IV over 10 minutes; insulin 10 units with 25 g glucose IV; salbutamol 10–20 mg nebulised; see Electrolyte Replacement.`);
  const dialysis: string[] = [];
  if (x.ph !== undefined && x.ph < 7.15) dialysis.push(`Acidosis (pH ${x.ph}) despite treatment`);
  if (x.k !== undefined && x.k >= 6.5) dialysis.push("Potassium 6.5 or more not responding to treatment");
  if (x.toxin) dialysis.push("Dialysable poison (lithium, methanol, ethylene glycol, salicylate)");
  if (x.overload) dialysis.push("Pulmonary oedema or overload not responding to diuretics");
  if (x.uraemic) dialysis.push("Uraemic complications: encephalopathy, pericarditis, bleeding");
  return { now, dialysis };
}

/* ================================================================== hepatitis B and C */

export type Pos = "pos" | "neg" | "na";
export interface HbvPanel { hbsag: Pos; antiHbc: Pos; igmHbc: Pos; antiHbs: Pos }
export function hbvSerology(p: HbvPanel): { meaning: string; next: string } {
  const { hbsag: s, antiHbc: c, igmHbc: m, antiHbs: a } = p;
  if (s === "neg" && c === "neg" && a === "neg") return { meaning: "Never infected and not immune (susceptible)", next: "Vaccinate: 3 doses at 0, 1 and 6 months." };
  if (s === "neg" && c === "neg" && a === "pos") return { meaning: "Immune from vaccination", next: "No action; health workers need anti-HBs 10 IU/L or more once after vaccination." };
  if (s === "neg" && c === "pos" && a === "pos") return { meaning: "Past infection, now immune", next: "No treatment; risk of reactivation with rituximab or chemotherapy (monitor or give prophylaxis)." };
  if (s === "pos" && m === "pos") return { meaning: "Acute hepatitis B", next: "Supportive care; check INR and bilirubin (refer if INR over 1.5 or encephalopathy); test household and sexual contacts; repeat HBsAg at 6 months." };
  if (s === "pos" && c !== "neg") return { meaning: "Chronic hepatitis B (HBsAg positive, IgM anti-HBc negative)", next: "HBeAg, anti-HBe, HBV DNA, ALT, platelets, ultrasound and fibrosis assessment; screen family; decide on treatment below." };
  if (s === "pos") return { meaning: "HBsAg positive", next: "Check anti-HBc (IgM and total) to tell acute from chronic; repeat HBsAg to confirm." };
  if (s === "neg" && c === "pos" && a !== "pos") return { meaning: "Isolated anti-HBc: resolved infection, a false positive, occult infection or the window period of acute infection", next: "Check HBV DNA and IgM anti-HBc; reactivation risk with immunosuppression; vaccinate if DNA negative and no immunity." };
  return { meaning: "Pattern incomplete", next: "Send HBsAg, total anti-HBc and anti-HBs together." };
}
export const apri = (ast: number, astUln: number, plt: number) => (ast > 0 && astUln > 0 && plt > 0 ? r2(((ast / astUln) / plt) * 100) : null);
export interface HbvTreatIn { cirrhosis: boolean; dna?: number; alt?: number; altUln: number; hbeag: boolean; age: number; familyHcc: boolean; apri?: number | null; pregnant: boolean; ckd: boolean }
export function hbvTreat(i: HbvTreatIn): { treat: boolean; why: string; drug: string[] } {
  const altHigh = i.alt !== undefined && i.alt > i.altUln;
  const dna = i.dna ?? 0;
  let treat = false, why = "Does not meet treatment criteria now: monitor ALT and HBV DNA every 6–12 months (every 3 months if ALT rising).";
  if (i.cirrhosis && dna > 0) { treat = true; why = "Cirrhosis with detectable HBV DNA: treat"; }
  else if (i.cirrhosis) { treat = true; why = "Cirrhosis: treat (any HBV DNA level; decompensated: urgent hepatology)"; }
  else if (dna > 2000 && altHigh) { treat = true; why = "HBV DNA over 2,000 IU/ml with raised ALT: treat"; }
  else if (i.apri !== undefined && i.apri !== null && i.apri > 1.5) { treat = true; why = `APRI ${i.apri}: suggests significant fibrosis or cirrhosis: treat (confirm with elastography)`; }
  else if (dna > 20000 && i.hbeag && i.age > 30) { treat = true; why = "HBeAg-positive with high viral load over age 30: treat"; }
  else if (dna > 2000 && i.familyHcc) { treat = true; why = "Family history of liver cancer or cirrhosis with HBV DNA over 2,000: treat"; }
  const drug = treat ? [i.ckd ? "Entecavir 0.5 mg once daily on an empty stomach (adjust by CrCl), or tenofovir alafenamide 25 mg once daily (kidney or bone disease)" : "Tenofovir disoproxil fumarate 300 mg once daily (or entecavir 0.5 mg once daily on an empty stomach)", "Long-term, usually lifelong; check creatinine, phosphate and HBV DNA every 6–12 months", "Ultrasound every 6 months for liver cancer if cirrhosis, over 40, or family history"] : [];
  if (i.pregnant) drug.push("Pregnancy: tenofovir disoproxil from 24–28 weeks if HBV DNA over 200,000 IU/ml (or HBeAg positive) to prevent transmission; the baby gets hepatitis B vaccine and HBIG within 12 hours of birth.");
  return { treat, why, drug };
}
export const HCV = [
  "Anti-HCV positive: send HCV RNA (viral load) to confirm current infection; anti-HCV stays positive after cure.",
  "Before treatment: HBsAg and anti-HBc (HBV reactivation), LFT, creatinine, CBC, platelets and APRI or elastography for cirrhosis, pregnancy test, drug interactions.",
  "No cirrhosis: sofosbuvir 400 mg + daclatasvir 60 mg once daily for 12 weeks, or sofosbuvir/velpatasvir 400/100 mg once daily for 12 weeks (all genotypes).",
  "Compensated cirrhosis: sofosbuvir/velpatasvir for 12 weeks (or sofosbuvir + daclatasvir for 24 weeks). Decompensated: sofosbuvir/velpatasvir + ribavirin for 12 weeks under a specialist.",
  "Do not combine sofosbuvir with amiodarone (severe bradycardia); separate from antacids and PPIs as advised; not in pregnancy.",
  "Cure (SVR12): HCV RNA undetectable 12 weeks after the end of treatment; reinfection is possible.",
  "Treatment is free under the National Viral Hepatitis Control Programme (NVHCP).",
];
export const HBV_VACCINE = ["Adults: 20 micrograms IM at 0, 1 and 6 months (40 micrograms for dialysis or immunosuppression)", "Children: 10 micrograms at 0, 1 and 6 months; birth dose within 24 hours for every newborn", "Health workers: anti-HBs 1–2 months after the last dose; under 10 IU/L: repeat the full course once"];

/* ================================================================== newborn resuscitation */

export const SPO2_TARGET: [number, string][] = [[1, "60–65%"], [2, "65–70%"], [3, "70–75%"], [4, "75–80%"], [5, "80–85%"], [10, "85–95%"]];
export function spo2Target(seconds: number): string {
  const m = seconds / 60;
  if (m < 1) return "Not yet: target from 1 minute (60–65%)";
  const row = [...SPO2_TARGET].reverse().find(([min]) => m >= min);
  return row ? row[1] : SPO2_TARGET[0][1];
}
export function nrpDoses(kg: number, gaWeeks: number): { ett: string; depth: string; adrIv: string; adrEtt: string; volume: string; glucose: string; o2: string } | null {
  if (!(kg > 0)) return null;
  const ett = kg < 1 || gaWeeks < 28 ? "2.5" : kg < 2 || gaWeeks < 34 ? "3.0" : "3.5";
  return {
    ett: `${ett} mm uncuffed`,
    depth: `${r1(6 + kg)} cm at the lip (6 + weight in kg)`,
    adrIv: `Adrenaline 1:10,000 (0.1 mg/ml) IV/UVC ${r2(0.1 * kg)}–${r2(0.3 * kg)} ml (0.01–0.03 mg/kg; ${r2(0.2 * kg)} ml = 0.02 mg/kg), flush with 3 ml saline; repeat every 3–5 minutes`,
    adrEtt: `Via ET tube while access is obtained: ${r2(0.5 * kg)}–${r2(1 * kg)} ml of 1:10,000 (0.05–0.1 mg/kg)`,
    volume: `Normal saline ${Math.round(10 * kg)} ml (10 ml/kg) over 5–10 minutes if blood loss or poor response (O-negative blood if available)`,
    glucose: `10% dextrose ${r1(2 * kg)} ml (2 ml/kg) if hypoglycaemic after resuscitation`,
    o2: gaWeeks >= 35 ? "Start PPV in air (21%)" : "Start PPV with 21–30% oxygen (under 35 weeks)",
  };
}
export type NrpPhase = "birth" | "initial" | "ppv" | "mrsopa" | "compressions" | "adrenaline" | "post";
export const NRP_STEPS: { id: NrpPhase; title: string; detail: string }[] = [
  { id: "birth", title: "Birth", detail: "Term? Good tone? Breathing or crying? If yes: dry, skin-to-skin, delay cord clamping 30–60 seconds, keep warm." },
  { id: "initial", title: "Initial steps (first 30 seconds)", detail: "Warm and dry on a radiant warmer, head in sniffing position, clear secretions only if obstructing, stimulate by rubbing the back." },
  { id: "ppv", title: "Not breathing or HR under 100: PPV (Golden Minute)", detail: "Bag and mask at 40–60 breaths a minute; pulse oximeter on the right hand; check heart rate after 15 seconds; is the chest moving?" },
  { id: "mrsopa", title: "No chest rise: MR SOPA", detail: "Mask adjustment, Reposition airway, Suction, Open mouth, Pressure up, Airway alternative (ET tube or laryngeal mask)." },
  { id: "compressions", title: "HR under 60 after 30 seconds of effective ventilation", detail: "Intubate (or LMA), 100% oxygen, chest compressions two-thumb technique, 3 compressions to 1 breath (90:30 a minute); recheck HR every 60 seconds; umbilical venous catheter." },
  { id: "adrenaline", title: "HR still under 60 after 60 seconds of compressions", detail: "Adrenaline IV (preferred) or via ET tube; consider volume and pneumothorax; check the ventilation again." },
  { id: "post", title: "HR over 60, then over 100", detail: "Stop compressions when HR is over 60; continue PPV until breathing and HR over 100; wean oxygen to SpO2 targets; post-resuscitation care: temperature, glucose, NICU." },
];

/* ================================================================== pain relief */

export interface PainIn { child: boolean; kg: number; type: "acute" | "chronic" | "neuropathic"; severity: "mild" | "moderate" | "severe"; egfr?: number; giRisk: boolean; cardiac: boolean; anticoag: boolean; pregnant: boolean; elderly: boolean; liver: boolean; asthmaNsaid: boolean }
export function painPlan(i: PainIn): { give: string[]; avoid: string[] } {
  const give: string[] = [], avoid: string[] = [];
  const kg = i.kg > 0 ? i.kg : i.child ? 20 : 60;
  const lowPara = i.liver || (!i.child && kg < 50);
  if (i.child) give.push(`Paracetamol ${Math.round(15 * kg)} mg (15 mg/kg) every 6 hours, maximum 60 mg/kg/day`);
  else give.push(`Paracetamol ${lowPara ? `${Math.min(1000, Math.round(15 * kg))} mg every 6 hours, maximum ${i.liver ? "2–3 g" : "3 g"} a day (low weight or liver disease)` : "1 g every 6 hours, maximum 4 g a day"}`);
  const renalBad = i.egfr !== undefined && i.egfr < 30;
  const nsaidNo = renalBad || i.cardiac || i.anticoag || i.asthmaNsaid || (i.pregnant) || i.liver;
  if (nsaidNo) avoid.push(`NSAIDs: ${[renalBad ? "eGFR under 30" : "", i.cardiac ? "heart failure or heart disease" : "", i.anticoag ? "anticoagulant" : "", i.asthmaNsaid ? "NSAID-sensitive asthma" : "", i.pregnant ? "pregnancy (avoid, especially from 20 weeks)" : "", i.liver ? "liver disease" : ""].filter(Boolean).join(", ")}`);
  else if (i.type !== "neuropathic") give.push(i.child ? `Ibuprofen ${Math.round(10 * kg)} mg (10 mg/kg) every 8 hours with food` : `Ibuprofen 400 mg 3 times a day or naproxen 500 mg twice daily with food, shortest time${i.giRisk || i.elderly ? ", with a PPI (GI risk or over 65)" : ""}${i.egfr !== undefined && i.egfr < 60 ? "; check creatinine (eGFR under 60)" : ""}`);
  if (i.severity !== "mild" && i.type !== "neuropathic") {
    if (i.child) avoid.push("Codeine and tramadol under 12 years (and after tonsillectomy under 18)");
    else {
      give.push(`Weak opioid if needed: tramadol 50–100 mg every 6 hours (maximum ${i.elderly ? "300" : "400"} mg a day${renalBad ? "; every 12 hours, maximum 200 mg, with eGFR under 30" : ""}); avoid with seizures or serotonergic drugs`);
      if (i.severity === "severe") give.push(renalBad ? "Strong opioid: avoid morphine with eGFR under 30 (metabolites accumulate); use low-dose oxycodone or fentanyl with specialist advice" : "Strong opioid for severe acute pain: oral morphine 5–10 mg every 4 hours as needed (2.5–5 mg if elderly), with a laxative and an antiemetic; see Palliative Care Helper");
    }
  }
  if (i.type === "neuropathic") {
    give.push(i.elderly ? "Amitriptyline 10 mg at night (caution over 65: falls, confusion), or duloxetine 30–60 mg daily" : "Amitriptyline 10–25 mg at night, increasing to 50–75 mg, or duloxetine 60 mg daily");
    const prega = i.egfr === undefined || i.egfr >= 60 ? "pregabalin 75 mg twice daily, up to 300 mg twice daily" : i.egfr >= 30 ? "pregabalin 25–75 mg twice daily (maximum 150 mg twice daily; eGFR 30–59)" : "pregabalin 25–75 mg once daily (maximum; eGFR under 30)";
    give.push(`Or ${prega}; or gabapentin 300 mg at night, building up to 600–1,200 mg 3 times a day`);
    give.push("Review at 4–8 weeks; stop if no meaningful benefit");
  }
  if (i.type === "chronic") give.push("Chronic pain: exercise and physiotherapy, sleep, mood and activity pacing matter more than medicines; avoid long-term opioids.");
  if (i.pregnant) avoid.push("Codeine in breastfeeding; opioids near delivery (neonatal respiratory depression)");
  return { give, avoid };
}

/* ================================================================== osteoporosis */

export const tCategory = (t: number) => (t <= -2.5 ? "Osteoporosis" : t < -1 ? "Osteopenia (low bone mass)" : "Normal bone density");
export interface BoneIn { t?: number; fragilityFracture: boolean; vertebralMultiple: boolean; frax10Major?: number; frax10Hip?: number; steroids: boolean; age: number; crcl?: number; dental: boolean }
export function bonePlan(i: BoneIn): { treat: boolean; why: string; drugs: string[]; general: string[] } {
  const veryHigh = i.vertebralMultiple || (i.t !== undefined && i.t <= -3) || (i.fragilityFracture && i.t !== undefined && i.t <= -2.5);
  let treat = false, why = "Treatment not indicated now: calcium, vitamin D, exercise; repeat DXA in 2–5 years.";
  if (i.fragilityFracture) { treat = true; why = "Hip or vertebral fragility fracture: treat (DXA not needed to start)"; }
  else if (i.t !== undefined && i.t <= -2.5) { treat = true; why = `T-score ${i.t}: osteoporosis: treat`; }
  else if ((i.frax10Major ?? 0) >= 20 || (i.frax10Hip ?? 0) >= 3) { treat = true; why = "Osteopenia with high FRAX risk (major fracture 20% or more, or hip 3% or more): treat"; }
  else if (i.steroids && (i.age >= 70 || (i.t !== undefined && i.t <= -1.5))) { treat = true; why = "Long-term steroids (prednisolone 7.5 mg or more for 3 months) with age 70+ or T-score −1.5 or lower: bone protection"; }
  const drugs: string[] = [];
  if (treat) {
    if (veryHigh) drugs.push("Very high risk (multiple vertebral fractures or T-score −3 or lower): consider an anabolic first (teriparatide 20 micrograms SC daily for up to 2 years) via a specialist, then a bisphosphonate or denosumab");
    if (i.crcl === undefined || i.crcl >= 35) drugs.push("Alendronate 70 mg once a week (or risedronate 35 mg weekly): on waking, with a full glass of water, stay upright and fasting for 30 minutes; review after 5 years", "Zoledronic acid 5 mg IV once a year if tablets are not tolerated (check calcium, vitamin D and CrCl 35 or more; flu-like reaction after the first dose); review after 3 years");
    else drugs.push("CrCl under 35: avoid bisphosphonates; denosumab is an option (check calcium; give vitamin D)");
    drugs.push("Denosumab 60 mg SC every 6 months: never stop without following with a bisphosphonate (rebound vertebral fractures); watch for low calcium");
  }
  const general = ["Calcium 1,000–1,200 mg a day in total (dairy, ragi, sesame; supplement the gap)", "Vitamin D3 800–1,000 IU daily, or 60,000 IU once a week for 8 weeks then monthly if deficient", "Weight-bearing and balance exercise; stop smoking; limit alcohol; falls prevention (see Elderly Care)", "Look for secondary causes: vitamin D deficiency, thyroid, hyperparathyroidism, coeliac disease, myeloma, hypogonadism, steroids"];
  if (i.dental && treat) general.push("Dental check before starting antiresorptives; jaw osteonecrosis and atypical femur fractures are rare");
  return { treat, why, drugs, general };
}

/* ================================================================== menopause and HRT */

export interface HrtIn { age: number; monthsSinceLmp: number; uterus: boolean; contraindicated: boolean; vteRisk: boolean; obese: boolean; migraineAura: boolean; onlyVaginal: boolean }
export function hrtPlan(i: HrtIn): { regimen: string[]; notes: string[] } {
  const notes: string[] = [];
  if (i.age < 40) notes.push("Under 40: premature ovarian insufficiency if FSH is raised twice 4–6 weeks apart; HRT (or the combined pill) is advised until about 51, for bone and heart health.");
  else if (i.age < 45) notes.push("40–45: consider FSH to support the diagnosis; over 45 with symptoms, no blood test is needed.");
  if (i.onlyVaginal) return { regimen: ["Vaginal oestrogen (estriol cream or oestradiol pessary) daily for 2 weeks, then twice a week; no progestogen needed; can be used long term and alongside systemic HRT"], notes: [...notes, "Non-hormonal: vaginal moisturisers and lubricants."] };
  if (i.contraindicated) return { regimen: ["HRT not suitable: non-hormonal options for hot flushes: venlafaxine 37.5–75 mg daily, escitalopram 10–20 mg, gabapentin 300–900 mg at night, or clonidine 50–75 micrograms twice daily", "Avoid paroxetine and fluoxetine with tamoxifen", "Vaginal symptoms after breast cancer: non-hormonal first; vaginal oestrogen only with the oncologist's agreement"], notes };
  const transdermal = i.vteRisk || i.obese || i.migraineAura;
  const oest = transdermal ? "Transdermal oestradiol: gel 1–2 measures daily or a 50 microgram patch twice a week" : "Oral oestradiol 1 mg daily (or conjugated oestrogens 0.625 mg), or transdermal gel or patch";
  const regimen = [oest + (transdermal ? ` (transdermal preferred: ${[i.vteRisk ? "VTE risk" : "", i.obese ? "BMI over 30" : "", i.migraineAura ? "migraine with aura" : ""].filter(Boolean).join(", ")}; no added clot risk)` : "")];
  if (i.uterus) regimen.push(i.monthsSinceLmp < 12 ? "With a uterus, periods within the last 12 months: cyclical progestogen: micronised progesterone 200 mg at night on days 1–12 of each month (or dydrogesterone 10 mg days 15–28), or a levonorgestrel IUS" : "With a uterus, over 12 months since the last period: continuous combined: micronised progesterone 100 mg every night, or a levonorgestrel IUS (also contraceptive)");
  else regimen.push("No uterus: oestrogen alone (no progestogen needed)");
  regimen.push("Tibolone 2.5 mg daily is an alternative over 12 months after the last period (not under 60 with stroke risk)");
  notes.push("Review at 3 months, then yearly; adjust dose to symptoms; unscheduled bleeding after 6 months needs assessment.", "Risks: a small rise in breast cancer with combined HRT that grows with duration; oral oestrogen raises clot and stroke risk slightly; benefits include symptom relief and bone protection.", `Contraception is still needed until ${i.age < 50 ? "2 years" : "1 year"} after the last period (HRT is not contraception).`);
  return { regimen, notes };
}
export const HRT_CONTRA = ["Current or past breast cancer, or another oestrogen-dependent cancer", "Undiagnosed vaginal bleeding", "Active or recent VTE (unless specialist advice) or recent MI or stroke", "Active liver disease with abnormal LFTs", "Pregnancy"];

/* ================================================================== syncope */

export const SYNCOPE_HIGH = ["New chest pain, breathlessness, abdominal pain or headache", "Syncope during exertion or lying down", "Sudden palpitations just before", "Known severe structural or coronary heart disease, or heart failure", "Family history of sudden death under 40", "No warning, or injury from the fall", "Systolic BP under 90 that persists", "Signs of bleeding (melaena, low Hb)"];
export const SYNCOPE_ECG = ["Acute ischaemia", "Mobitz II or complete heart block, or HR under 40 awake", "Pauses over 3 seconds awake", "Sustained or non-sustained VT", "QTc over 460 ms, or short QT", "Brugada type 1 pattern", "LBBB, bifascicular block, or QRS 120 ms or more", "Pre-excitation (WPW)", "Pacemaker or ICD malfunction"];
export const SYNCOPE_LOW = ["Warning symptoms typical of a faint (light-headed, warm, sweating, nausea, tunnel vision)", "Triggered by pain, fear, blood, a sight, sound or smell", "After prolonged standing, in a hot crowded place, or after a meal", "During coughing, passing urine or defecating", "On standing up from lying or sitting (orthostatic)", "Long history of similar episodes, normal heart"];
export function syncopeRisk(high: number, ecg: number, low: number): { level: "high" | "low" | "intermediate"; text: string } {
  if (high + ecg > 0) return { level: "high", text: "High risk: admit or assess urgently in the emergency department with ECG monitoring, echo, troponin and Hb; cardiology review." };
  if (low > 0) return { level: "low", text: "Low risk (reflex or orthostatic syncope likely): discharge with explanation, fluids and salt if no contraindication, counter-pressure manoeuvres, and review medicines that lower BP." };
  return { level: "intermediate", text: "Neither: observe with ECG monitoring; consider ambulatory ECG (Holter or loop recorder) and echo as an outpatient." };
}
