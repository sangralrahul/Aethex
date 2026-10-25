/**
 * Update 33, on the device (no AI): heart failure therapy, atrial fibrillation, lipids and
 * cardiovascular risk, PE and DVT, HIV care, pre-eclampsia prevention, insomnia and sleep, and urticaria.
 */


/* ================================================================== heart failure */

export type Pillar = "raas" | "bb" | "mra" | "sglt2";
export const HF_STEPS: Record<Pillar, { name: string; steps: string[] }> = {
  raas: { name: "ARNI (sacubitril/valsartan) or ACE inhibitor/ARB", steps: ["Not started", "Sacubitril/valsartan 24/26 mg twice daily", "49/51 mg twice daily", "97/103 mg twice daily (target)"] },
  bb: { name: "Beta-blocker", steps: ["Not started", "Bisoprolol 1.25 mg daily (or carvedilol 3.125 mg twice daily, metoprolol succinate 12.5–25 mg)", "Bisoprolol 2.5 mg", "Bisoprolol 5 mg", "Bisoprolol 7.5 mg", "Bisoprolol 10 mg (target; carvedilol 25 mg twice daily, metoprolol succinate 200 mg)"] },
  mra: { name: "Mineralocorticoid receptor antagonist", steps: ["Not started", "Spironolactone 12.5–25 mg daily (or eplerenone 25 mg)", "Spironolactone 50 mg daily (target; eplerenone 50 mg)"] },
  sglt2: { name: "SGLT2 inhibitor", steps: ["Not started", "Dapagliflozin 10 mg or empagliflozin 10 mg once daily (target, no titration)"] },
};
export interface HfIn { ef: number; sbp: number; hr: number; k: number; egfr: number; congested: boolean; cur: Record<Pillar, number>; ironLow?: boolean; sinusHr70?: boolean }
export function hfPlan(i: HfIn): { type: string; actions: { pillar: string; action: string }[]; extra: string[] } {
  const type = i.ef <= 40 ? "HFrEF (EF 40% or less)" : i.ef < 50 ? "HFmrEF (EF 41–49%)" : "HFpEF (EF 50% or more)";
  const actions: { pillar: string; action: string }[] = [];
  const kHigh = i.k > 5.0, kVery = i.k > 5.5;
  const lowBp = i.sbp > 0 && i.sbp < 95;
  const sg = i.cur.sglt2;
  actions.push({ pillar: HF_STEPS.sglt2.name, action: sg >= 1 ? "Continue." : i.egfr >= 20 ? "Start now (any EF; little effect on BP or potassium; eGFR 20 or more)." : "eGFR under 20: not started (continue if already taking until dialysis)." });
  if (i.ef <= 40) {
    const r = i.cur.raas, b = i.cur.bb, m = i.cur.mra;
    const rMax = HF_STEPS.raas.steps.length - 1, bMax = HF_STEPS.bb.steps.length - 1, mMax = HF_STEPS.mra.steps.length - 1;
    actions.push({ pillar: HF_STEPS.raas.name, action: kVery ? "Potassium over 5.5: hold increases; check potassium and kidney function." : lowBp ? (r ? "SBP under 95: keep the dose; reduce diuretic first if euvolaemic." : "SBP under 95: start only the lowest dose (24/26 mg) if SBP is 90 or more and the patient has no symptoms of low BP.") : r >= rMax ? "At target dose." : `${r ? "Increase" : "Start"} to: ${HF_STEPS.raas.steps[r + 1]} (step up every 2–4 weeks; stop an ACE inhibitor 36 hours before starting sacubitril/valsartan; check creatinine and potassium in 1–2 weeks).` });
    actions.push({ pillar: HF_STEPS.bb.name, action: i.congested && !b ? "Congested: start once euvolaemic (or at the lowest dose if only mildly congested)." : i.hr > 0 && i.hr < 60 ? "Heart rate under 60: do not increase (reduce if symptomatic bradycardia)." : lowBp && b ? "SBP under 95: keep the dose." : b >= bMax ? "At target dose." : `${b ? "Increase" : "Start"} to: ${HF_STEPS.bb.steps[b + 1]} (double every 2–4 weeks if HR over 60 and no symptomatic low BP).` });
    actions.push({ pillar: HF_STEPS.mra.name, action: i.k > 6.0 ? "Potassium over 6.0: stop the MRA; treat hyperkalaemia." : kVery ? "Potassium 5.5–6.0: halve the dose." : (kHigh || i.egfr < 30) && !m ? "Do not start (potassium over 5.0 or eGFR under 30)." : m >= mMax ? "At target dose." : `${m ? "Increase" : "Start"} to: ${HF_STEPS.mra.steps[m + 1]} (potassium and creatinine at 1 week, 4 weeks, then every 3–4 months).` });
  } else if (i.ef < 50) {
    actions.push({ pillar: "Other drugs", action: "HFmrEF: SGLT2 inhibitor; consider ARNI or ACE inhibitor/ARB, beta-blocker and MRA (weaker evidence)." });
  } else {
    actions.push({ pillar: "Other drugs", action: "HFpEF: SGLT2 inhibitor; consider finerenone or spironolactone (EF 50–60%); treat BP, AF, obesity, ischaemia." });
  }
  const extra: string[] = [];
  extra.push(i.congested ? "Congested: loop diuretic (furosemide 40 mg once or twice daily, or twice the usual oral dose IV), daily weights, aim for 0.5–1 kg a day loss; reduce the diuretic once dry." : "Euvolaemic: lowest diuretic dose that keeps the weight steady; teach a flexible diuretic plan by weight.");
  extra.push("Accept a rise in creatinine up to 50% (or eGFR fall up to 30%) after starting or increasing RAAS drugs; above that, halve the dose and recheck.");
  if (i.ironLow) extra.push("Iron deficiency (ferritin under 100, or 100–299 with TSAT under 20%): IV ferric carboxymaltose.");
  if (i.ef <= 40 && i.sinusHr70) extra.push("Sinus rhythm with HR 70 or more on the maximum tolerated beta-blocker: add ivabradine 5 mg twice daily.");
  if (i.ef <= 35) extra.push("EF 35% or less after 3 months of optimal therapy: assess for ICD and CRT (QRS 150 ms or more with LBBB).");
  extra.push("Salt under 5 g a day; fluid 1.5–2 L only if hyponatraemic or very congested; influenza and pneumococcal vaccines; cardiac rehabilitation.");
  return { type, actions, extra };
}

/* ================================================================== atrial fibrillation */

export interface Cha2ds2vaIn { chf: boolean; htn: boolean; age: number; dm: boolean; stroke: boolean; vascular: boolean }
/** CHA2DS2-VA (ESC 2024: without the sex point). */
export function cha2ds2va(i: Cha2ds2vaIn): { score: number; text: string } {
  const s = (i.chf ? 1 : 0) + (i.htn ? 1 : 0) + (i.age >= 75 ? 2 : i.age >= 65 ? 1 : 0) + (i.dm ? 1 : 0) + (i.stroke ? 2 : 0) + (i.vascular ? 1 : 0);
  return { score: s, text: s >= 2 ? `CHA₂DS₂-VA ${s}: oral anticoagulation recommended` : s === 1 ? "CHA₂DS₂-VA 1: anticoagulation should be considered" : "CHA₂DS₂-VA 0: no anticoagulation for stroke prevention" };
}
export interface HasBledIn { htn: boolean; renal: boolean; liver: boolean; stroke: boolean; bleeding: boolean; labileInr: boolean; elderly: boolean; drugs: boolean; alcohol: boolean }
export function hasBled(i: HasBledIn): { score: number; text: string } {
  const s = Object.values(i).filter(Boolean).length;
  return { score: s, text: s >= 3 ? `HAS-BLED ${s}: high bleeding risk: correct what can be corrected (BP, NSAIDs/antiplatelets, alcohol, labile INR) and review more often; not a reason on its own to withhold anticoagulation` : `HAS-BLED ${s}: bleeding risk not high` };
}
export const AF_RATE = [
  "Target resting heart rate under 110 (lenient), lower if symptoms persist.",
  "Beta-blocker: metoprolol 25–100 mg twice daily or bisoprolol 2.5–10 mg daily (first choice, any EF).",
  "Diltiazem 60–120 mg 3 times a day or verapamil 40–120 mg 3 times a day: only if EF over 40%.",
  "Digoxin 62.5–250 micrograms daily: add in heart failure or sedentary patients; lower dose in CKD and the elderly; levels if toxicity suspected.",
  "Acute IV: metoprolol 2.5–5 mg over 2 minutes (repeat up to 3 times), diltiazem 0.25 mg/kg over 2 minutes (EF over 40%), or digoxin 0.5 mg then 0.25 mg; amiodarone 300 mg over 1 hour in heart failure or hypotension.",
];
export function afRhythm(hoursOnset: number | null, unstable: boolean, structural: boolean, anticoag3wk: boolean): string[] {
  if (unstable) return ["Haemodynamically unstable: synchronised DC cardioversion now (120–200 J biphasic), with heparin; do not wait for anticoagulation."];
  const out: string[] = [];
  if (hoursOnset !== null && hoursOnset < 24) out.push("Onset under 24 hours: early cardioversion is reasonable after starting anticoagulation (or wait-and-see: most revert within 48 hours).");
  else if (!anticoag3wk) out.push("Onset over 24 hours or unknown: 3 weeks of therapeutic anticoagulation first, or a TEE to exclude clot, before cardioversion.");
  else out.push("Anticoagulated for 3 weeks: elective cardioversion can be planned.");
  out.push(structural ? "Structural heart disease or heart failure: amiodarone (300 mg IV over 1 hour, then 900 mg over 24 hours; oral 200 mg 3 times a day for a week, then twice daily, then once daily)." : "No structural heart disease: flecainide 200–300 mg orally once (pill in the pocket), with a beta-blocker or calcium channel blocker to prevent fast flutter; or electrical cardioversion.");
  out.push("Continue anticoagulation for at least 4 weeks after cardioversion, then by CHA₂DS₂-VA long term.");
  out.push("Early rhythm control (within a year of diagnosis) and catheter ablation improve outcomes in selected patients: refer to cardiology.");
  return out;
}
export const AF_CAUSES = ["ECG, echo, TSH, electrolytes, renal and liver function, CBC", "Hypertension, valve disease (rheumatic mitral stenosis needs warfarin, not a DOAC), heart failure", "Alcohol, sleep apnoea, obesity, thyroid, infection, recent surgery"];

/* ================================================================== lipids */

export type LipidRisk = "extreme" | "very high" | "high" | "moderate" | "low";
export interface LipidRiskIn { ascvd: boolean; ascvdPlus: boolean; diabetes: boolean; diabetesTod: boolean; ckd: "none" | "3" | "4-5"; fh: boolean; ldl: number; riskFactors: number; lpaHigh: boolean }
/** Lipid Association of India risk category with LDL target (ESC targets in brackets). */
export function lipidRisk(i: LipidRiskIn): { risk: LipidRisk; target: number; esc: number; text: string } {
  if (i.ascvd && (i.ascvdPlus || i.diabetes || i.fh)) return { risk: "extreme", target: 50, esc: 55, text: "Extreme risk: ASCVD with diabetes, FH, recurrent events or polyvascular disease: LDL under 50 (consider under 30)" };
  if (i.ascvd || i.diabetesTod || i.ckd === "4-5" || (i.fh && i.ldl >= 190 && i.riskFactors > 0)) return { risk: "very high", target: 50, esc: 55, text: "Very high risk: established ASCVD, diabetes with organ damage or 3+ risk factors, CKD stage 4–5: LDL under 50" };
  if (i.diabetes || i.ckd === "3" || i.fh || i.ldl >= 190 || i.riskFactors >= 3 || i.lpaHigh) return { risk: "high", target: 70, esc: 70, text: "High risk: diabetes, CKD stage 3, FH, LDL 190 or more, 3 risk factors or high Lp(a): LDL under 70" };
  if (i.riskFactors >= 1) return { risk: "moderate", target: 100, esc: 100, text: "Moderate risk: 1–2 risk factors: LDL under 100" };
  return { risk: "low", target: 100, esc: 116, text: "Low risk: LDL under 100 with lifestyle" };
}
export function ldlPlan(ldl: number, target: number, onStatin: "none" | "moderate" | "high"): { needed: number; steps: string[] } {
  const needed = ldl > target ? Math.round((1 - target / ldl) * 100) : 0;
  const steps: string[] = [];
  if (!needed) return { needed, steps: ["At or below target: continue current treatment and lifestyle; recheck lipids yearly."] };
  let remaining = ldl;
  if (onStatin === "none") {
    if (needed > 30) { steps.push(`High-intensity statin (atorvastatin 40–80 mg or rosuvastatin 20–40 mg): lowers LDL by about 50%, to about ${Math.round(ldl * 0.5)}`); remaining = ldl * 0.5; }
    else { steps.push(`Moderate-intensity statin (atorvastatin 10–20 mg or rosuvastatin 5–10 mg): lowers LDL by about 30–40%, to about ${Math.round(ldl * 0.65)}`); remaining = ldl * 0.65; }
  } else if (onStatin === "moderate") { steps.push(`Increase to a high-intensity statin: LDL to about ${Math.round(ldl * 0.75)}`); remaining = ldl * 0.75; }
  else steps.push("Already on a high-intensity statin.");
  if (remaining > target) { steps.push(`Add ezetimibe 10 mg daily (a further 20–25%): LDL to about ${Math.round(remaining * 0.77)}`); remaining *= 0.77; }
  if (remaining > target) steps.push("Still above target: add a PCSK9 inhibitor (evolocumab, alirocumab) or inclisiran, or bempedoic acid if statin-intolerant (specialist).");
  steps.push("Recheck lipids 4–12 weeks after each change; ALT at baseline; CK only if muscle symptoms.");
  return { needed, steps };
}
export function trigPlan(tg: number): string {
  if (!(tg > 0)) return "";
  if (tg >= 1000) return `Triglycerides ${tg}: high pancreatitis risk: very low-fat diet, stop alcohol, control diabetes, fenofibrate 145–160 mg (with or without omega-3 4 g); check for secondary causes.`;
  if (tg >= 500) return `Triglycerides ${tg}: fenofibrate plus lifestyle to prevent pancreatitis; then treat LDL and non-HDL.`;
  if (tg >= 150) return `Triglycerides ${tg}: lifestyle (sugar, refined carbohydrate, alcohol, weight), treat diabetes; statin for LDL/non-HDL; icosapent ethyl in high-risk patients on a statin where available.`;
  return `Triglycerides ${tg}: normal.`;
}

/* ================================================================== PE and DVT */

export interface WellsPeIn { dvtSigns: boolean; peLikely: boolean; hr100: boolean; immobile: boolean; prevVte: boolean; haemoptysis: boolean; cancer: boolean }
export function wellsPe(i: WellsPeIn): { score: number; likely: boolean } {
  const s = (i.dvtSigns ? 3 : 0) + (i.peLikely ? 3 : 0) + (i.hr100 ? 1.5 : 0) + (i.immobile ? 1.5 : 0) + (i.prevVte ? 1.5 : 0) + (i.haemoptysis ? 1 : 0) + (i.cancer ? 1 : 0);
  return { score: s, likely: s > 4 };
}
export const PERC_ITEMS = ["Age 50 or over", "Heart rate 100 or more", "SpO2 under 95%", "Haemoptysis", "Oestrogen use", "Previous DVT or PE", "Unilateral leg swelling", "Surgery or trauma needing admission in the last 4 weeks"];
export const ageDdimer = (age: number) => (age > 50 ? age * 10 : 500);
export function yearsRule(items: number, ddimer: number): string {
  const cut = items === 0 ? 1000 : 500;
  return ddimer < cut ? `YEARS: ${items} item${items === 1 ? "" : "s"}, D-dimer ${ddimer} under ${cut}: PE excluded without imaging` : `YEARS: ${items} item${items === 1 ? "" : "s"}, D-dimer ${ddimer} (${cut} or more): CT pulmonary angiogram`;
}
export function peWorkup(w: { score: number; likely: boolean }, percNeg: boolean, ddimer: number | null, age: number): string {
  if (!w.likely && percNeg) return "Low pre-test probability and PERC negative: no further testing for PE.";
  if (!w.likely) return ddimer === null ? `PE unlikely: D-dimer (age-adjusted cut-off ${ageDdimer(age)} µg/L FEU); CTPA only if raised.` : ddimer < ageDdimer(age) ? `D-dimer ${ddimer} under ${ageDdimer(age)}: PE excluded.` : `D-dimer ${ddimer} raised: CT pulmonary angiogram (V/Q scan if contrast is contraindicated or pregnant).`;
  return "PE likely: CT pulmonary angiogram now; start anticoagulation while waiting if the scan will be delayed and bleeding risk is acceptable.";
}
export const WELLS_DVT: { id: string; label: string; pts: number }[] = [
  { id: "cancer", label: "Active cancer", pts: 1 }, { id: "paralysis", label: "Paralysis, paresis or recent leg cast", pts: 1 }, { id: "bedridden", label: "Bedridden 3 days or more, or major surgery within 12 weeks", pts: 1 },
  { id: "tender", label: "Tenderness along the deep veins", pts: 1 }, { id: "wholeLeg", label: "Whole leg swollen", pts: 1 }, { id: "calf3", label: "Calf swelling 3 cm more than the other side", pts: 1 },
  { id: "pitting", label: "Pitting oedema in the symptomatic leg", pts: 1 }, { id: "collateral", label: "Collateral superficial veins", pts: 1 }, { id: "prevDvt", label: "Previous DVT", pts: 1 },
  { id: "alt", label: "Another diagnosis at least as likely", pts: -2 },
];
export const wellsDvt = (sel: string[]) => WELLS_DVT.filter((w) => sel.includes(w.id)).reduce((a, w) => a + w.pts, 0);
export interface SpesiIn { age80: boolean; cancer: boolean; cardioPulm: boolean; hr110: boolean; sbp100: boolean; spo290: boolean }
export const spesi = (i: SpesiIn) => Object.values(i).filter(Boolean).length;
export function vteTreatment(kg: number, x: { cancer: boolean; pregnant: boolean; crcl: number | null; provoked: "major-transient" | "minor" | "unprovoked" | "persistent"; massive: boolean }): { drug: string[]; duration: string; lysis?: string } {
  const drug: string[] = [];
  if (x.pregnant) drug.push(`Pregnancy: enoxaparin ${Math.round(kg)} mg (1 mg/kg) twice daily through pregnancy and at least 6 weeks postpartum (3 months in total); no DOACs or warfarin in pregnancy.`);
  else if (x.crcl !== null && x.crcl < 30) drug.push(`CrCl under 30: unfractionated heparin or enoxaparin ${Math.round(kg)} mg once daily, then warfarin (INR 2–3, overlap at least 5 days and until INR is 2 or more for 24 hours).`);
  else {
    drug.push("Apixaban 10 mg twice daily for 7 days, then 5 mg twice daily; or rivaroxaban 15 mg twice daily for 21 days, then 20 mg once daily with food.");
    drug.push("Or 5 days of LMWH, then dabigatran 150 mg twice daily or edoxaban 60 mg once daily; or warfarin with LMWH overlap.");
    if (x.cancer) drug.push("Cancer: apixaban, edoxaban or rivaroxaban (avoid in GI or GU tumours with bleeding risk), or LMWH.");
  }
  const duration = x.provoked === "major-transient" ? "3 months (provoked by surgery or major trauma)" : x.provoked === "minor" ? "3 months; consider longer if the risk factor persists" : x.provoked === "persistent" || x.cancer ? "Long term while the risk factor or cancer is active; review every year" : "At least 3 months; unprovoked VTE: usually extended treatment (reduced-dose apixaban 2.5 mg twice daily or rivaroxaban 10 mg daily after 6 months) if bleeding risk is low";
  const lysis = x.massive ? "Massive PE (shock or SBP under 90 for 15 minutes): systemic thrombolysis: alteplase 100 mg over 2 hours (or 0.6 mg/kg, maximum 50 mg, over 15 minutes in cardiac arrest), with UFH; surgical or catheter embolectomy if lysis is contraindicated." : undefined;
  return { drug, duration, lysis };
}

/* ================================================================== HIV */

export interface HivIn { kg: number; crcl: number | null; rifampicin: boolean; pregnant: boolean; cd4?: number; tbSymptoms: boolean; meningitis: boolean }
export function hivPlan(i: HivIn): { regimen: string[]; timing: string; baseline: string[]; prophylaxis: string[] } {
  const regimen: string[] = [];
  if (i.kg > 0 && i.kg < 30) regimen.push("Under 30 kg: weight-band paediatric regimen (abacavir + lamivudine with dolutegravir 10 mg dispersible or 50 mg if 20 kg or more): use the NACO paediatric chart.");
  else if (i.crcl !== null && i.crcl < 50) regimen.push("CrCl under 50: avoid tenofovir disoproxil: abacavir 600 mg + lamivudine 300 mg + dolutegravir 50 mg once daily (check HLA-B*5701 where available), or zidovudine-based if Hb allows.");
  else regimen.push("TLD: tenofovir 300 mg + lamivudine 300 mg + dolutegravir 50 mg, one tablet once daily (adults and adolescents 30 kg or more, including pregnancy and women who may become pregnant).");
  if (i.rifampicin) regimen.push("On rifampicin: add an extra dolutegravir 50 mg 12 hours after TLD (50 mg twice daily) during TB treatment and for 2 weeks after.");
  regimen.push("Take at the same time daily; separate dolutegravir from iron, calcium and antacids (take 2 hours before or 6 hours after).");
  const timing = i.meningitis ? "Suspected TB or cryptococcal meningitis: delay ART 4–6 weeks after starting meningitis treatment." : i.tbSymptoms ? "TB symptoms: investigate (CBNAAT); if TB, start ATT first and ART within 2 weeks." : "Treat all: start ART the same day or within 7 days of diagnosis once the patient is ready.";
  const baseline = ["Confirm with the three-test strategy (three different rapid tests)", "CD4 count, Hb, creatinine, ALT, HBsAg, anti-HCV, VDRL, urine pregnancy test", "TB four-symptom screen (cough, fever, night sweats, weight loss) and chest X-ray", ...(i.cd4 !== undefined && i.cd4 < 200 ? ["CD4 under 200: serum cryptococcal antigen (CrAg); pre-emptive fluconazole if positive and no meningitis"] : []), "Partner and family testing; counselling on adherence, condoms and U=U"];
  const prophylaxis: string[] = [];
  if (i.cd4 === undefined || i.cd4 <= 350) prophylaxis.push("Cotrimoxazole 960 mg once daily (CD4 350 or less, or WHO stage 3–4); stop when CD4 is over 350 on ART for 6 months.");
  prophylaxis.push("TB preventive therapy once active TB is excluded: isoniazid 300 mg + pyridoxine daily for 6 months, or weekly isoniazid + rifapentine (3HP) for 12 weeks.");
  prophylaxis.push("Viral load at 6 and 12 months, then every 12 months. Under 1,000 copies: suppressed. 1,000 or more: enhanced adherence counselling and repeat in 3 months; still 1,000 or more: refer to the SACEP for second line.");
  return { regimen, timing, baseline, prophylaxis };
}

/* ================================================================== pre-eclampsia */

export const PE_HIGH = ["Hypertensive disease in a previous pregnancy", "Chronic kidney disease", "Autoimmune disease (SLE, antiphospholipid syndrome)", "Type 1 or type 2 diabetes", "Chronic hypertension"];
export const PE_MOD = ["First pregnancy", "Age 40 or over", "Pregnancy interval over 10 years", "BMI 35 or more at booking", "Family history of pre-eclampsia", "Multiple pregnancy", "IVF pregnancy"];
export function aspirinAdvice(high: number, mod: number, weeks: number): { give: boolean; text: string } {
  const give = high >= 1 || mod >= 2;
  if (!give) return { give, text: "Not at increased risk by these factors: no aspirin; routine BP and urine checks at every visit." };
  const late = weeks > 16;
  return { give, text: `At high risk of pre-eclampsia: aspirin 150 mg at night from 12 weeks${late ? " (start now; benefit is greatest when started before 16 weeks)" : ""} until 36 weeks; calcium 1–1.5 g a day if dietary intake is low; home BP if available.` };
}
export interface PeDxIn { sbp: number; dbp: number; weeks: number; proteinuria: boolean; plt?: number; creat?: number; altDouble: boolean; neuro: boolean; pulmOedema: boolean; fgr: boolean }
export function preEclampsiaDx(i: PeDxIn): { level: "none" | "gh" | "pe" | "severe"; text: string; plan: string[] } {
  const htn = i.sbp >= 140 || i.dbp >= 90;
  const severeBp = i.sbp >= 160 || i.dbp >= 110;
  const organ = (i.plt !== undefined && i.plt < 100) || (i.creat !== undefined && i.creat > 1.1) || i.altDouble || i.neuro || i.pulmOedema || i.fgr;
  if (!htn) return { level: "none", text: "BP under 140/90", plan: ["Routine antenatal care; recheck at each visit."] };
  if (i.weeks < 20) return { level: "gh", text: "Hypertension before 20 weeks: chronic hypertension", plan: ["Labetalol, nifedipine or methyldopa; target about 135/85; aspirin 150 mg from 12 weeks; stop ACE inhibitors, ARBs and statins."] };
  if (!i.proteinuria && !organ) return { level: "gh", text: "Gestational hypertension (BP 140/90 or more after 20 weeks, no proteinuria or organ dysfunction)", plan: ["Treat if 140/90 or more: labetalol 100–200 mg 2–3 times a day (maximum 2.4 g), nifedipine extended-release 10–30 mg twice daily, or methyldopa 250–500 mg 3 times a day; target about 135/85.", "Weekly BP, urine protein, and bloods (platelets, creatinine, ALT) every 2 weeks; fetal growth scans.", "Deliver at 37 weeks if BP is controlled."] };
  const severe = severeBp || organ;
  if (severe) return { level: "severe", text: `Pre-eclampsia with severe features${severeBp ? " (BP 160/110 or more)" : ""}${organ ? " (organ dysfunction)" : ""}`, plan: ["Admit; lower BP to under 160/110 within an hour (see Hypertensive Emergency or Obstetric Emergencies).", "Magnesium sulphate to prevent eclampsia (Pritchard or Zuspan).", "Steroids if under 34+6 weeks (see Preterm Labour).", "Deliver after stabilising at 34 weeks or more; earlier if HELLP, eclampsia, abruption, worsening organ function or fetal compromise."] };
  return { level: "pe", text: "Pre-eclampsia (hypertension with proteinuria after 20 weeks)", plan: ["Admit for assessment; treat BP to about 135/85; bloods twice a week; fetal monitoring and growth scans.", "Deliver at 37 weeks (earlier for severe features).", "After delivery: BP checks for 6 weeks; most come off treatment; higher lifelong cardiovascular risk: yearly BP."] };
}

/* ================================================================== insomnia and sleep */

export const STOPBANG = ["Snores loudly", "Tired or sleepy in the day", "Observed to stop breathing in sleep", "High blood pressure", "BMI over 35", "Age over 50", "Neck over 40 cm", "Male"];
export const stopBangRisk = (n: number) => (n >= 5 ? "High risk of obstructive sleep apnoea: sleep study" : n >= 3 ? "Intermediate risk: sleep study if symptomatic or with other risks" : "Low risk of obstructive sleep apnoea");
export function sleepWindow(totalSleepH: number, timeInBedH: number, wake: string): { efficiency: number; tib: number; bedtime: string; text: string } | null {
  if (!(totalSleepH > 0 && timeInBedH > 0)) return null;
  const eff = Math.round((totalSleepH / timeInBedH) * 100);
  const tib = Math.max(5, Math.round(totalSleepH * 4) / 4);
  const m = /^(\d{1,2}):(\d{2})$/.exec(wake);
  let bedtime = "";
  if (m) { let mins = Number(m[1]) * 60 + Number(m[2]) - tib * 60; mins = ((mins % 1440) + 1440) % 1440; bedtime = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(Math.round(mins % 60)).padStart(2, "0")}`; }
  return { efficiency: eff, tib, bedtime, text: `Sleep efficiency ${eff}%. Sleep restriction: time in bed ${tib} hours${bedtime ? `, from ${bedtime} to ${wake}` : ""}; add 15 minutes each week while efficiency stays 85% or more; cut 15 minutes if under 80%.` };
}
export const INSOMNIA_DRUGS = [
  "CBT for insomnia (CBT-I) is first line for chronic insomnia, including digital CBT-I.",
  "Short-term only (2–4 weeks, lowest dose): zolpidem 5 mg (elderly and women) to 10 mg, or zopiclone 3.75–7.5 mg at bedtime.",
  "Over 55: melatonin prolonged-release 2 mg 1–2 hours before bed for up to 13 weeks.",
  "With depression: mirtazapine 7.5–15 mg or trazodone 25–50 mg at night (off-label for insomnia).",
  "Avoid long-term benzodiazepines and sedating antihistamines (especially in older people: falls, confusion).",
];
export const SLEEP_HYGIENE_MD = [
  "# Sleeping better",
  "",
  "- Get up at the same time every day, including weekends, even after a bad night.",
  "- Go to bed only when sleepy; if awake for more than 20 minutes, get up and do something calm in dim light, then return.",
  "- Use the bed only for sleep (no phone, TV or work in bed).",
  "- No tea, coffee or cola after 2 pm; no alcohol or heavy meal within 3 hours of bed; avoid smoking at night.",
  "- No daytime naps, or a short one (under 30 minutes) before 3 pm.",
  "- Get daylight in the morning and exercise during the day (not late in the evening).",
  "- Keep the bedroom dark, quiet and cool; put screens away an hour before bed.",
  "- Worries: write them down earlier in the evening with a plan for tomorrow.",
].join("\n");

/* ================================================================== urticaria */

export const uas7Band = (n: number) => (n === 0 ? "Urticaria-free" : n <= 6 ? "Well controlled" : n <= 15 ? "Mild activity" : n <= 27 ? "Moderate activity" : "Severe activity");
export function urticariaPlan(chronic: boolean, step: number, ageYears: number, kg: number): string[] {
  if (ageYears < 12) {
    const d = ageYears < 2 ? "cetirizine 2.5 mg once daily (6 months–2 years)" : ageYears < 6 ? "cetirizine 2.5 mg twice daily (2–6 years)" : "cetirizine 5 mg twice daily (6–12 years)";
    return [`Second-generation antihistamine: ${d}; or levocetirizine by age`, ...(chronic ? ["Not controlled after 2–4 weeks: specialist advice on up-dosing; omalizumab from 12 years"] : []), `Severe acute urticaria: prednisolone ${Math.round(Math.min(40, kg > 0 ? kg : 20))} mg (1 mg/kg, maximum 40) once daily for 3 days`];
  }
  if (!chronic) return ["Cetirizine 10 mg, levocetirizine 5 mg, fexofenadine 180 mg or bilastine 20 mg once daily until 2 weeks free of hives", "Severe or with angioedema: prednisolone 40 mg once daily for 3–5 days", "Look for a trigger (infection, drug, food) but most acute urticaria has no cause found"];
  const steps = [
    "Step 1: a second-generation antihistamine daily (cetirizine 10 mg, levocetirizine 5 mg, fexofenadine 180 mg, bilastine 20 mg), not just when itchy",
    "Step 2 (after 2–4 weeks): increase the same antihistamine up to 4 times the standard dose (e.g. cetirizine 20 mg twice daily)",
    "Step 3 (after 2–4 more weeks): add omalizumab 300 mg SC every 4 weeks (specialist)",
    "Step 4: cyclosporine 3.5–5 mg/kg/day (specialist; BP and creatinine monitoring)",
  ];
  return [...steps.slice(Math.max(0, step), step + 2), "Short steroid courses only for flares (up to 10 days); avoid NSAIDs and codeine if they worsen hives; CBC, ESR or CRP, and TSH if symptoms suggest"];
}
export const ANGIOEDEMA_FLAGS = ["Swelling without hives: think ACE inhibitor (stop it, also ARBs with caution) or hereditary/acquired angioedema (check C4)", "Bradykinin angioedema does not respond to antihistamines, steroids or adrenaline: icatibant or C1-inhibitor; protect the airway", "Tongue, throat or voice involvement, stridor, or breathing difficulty: treat as anaphylaxis: adrenaline 0.5 mg IM (0.01 mg/kg in children) and call for help", "Prescribe an adrenaline auto-injector after anaphylaxis, with a written plan"];
