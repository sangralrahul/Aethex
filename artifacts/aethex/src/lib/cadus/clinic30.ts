/**
 * Update 30, on the device (no AI): gestational diabetes, infant feeding, switching antidepressants,
 * eye and ENT triage, VTE prophylaxis, headache and migraine, skin infections, and gout.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ================================================================== gestational diabetes */

export type GdmCriteria = "dipsi" | "iadpsg";
export interface GdmDx { gdm: boolean; text: string }
/** DIPSI (India, MoHFW 2018): 75 g OGTT 2-hour value of 140 mg/dL or more, fasting or not. IADPSG: any of fasting 92, 1 h 180, 2 h 153. */
export function gdmDiagnose(c: GdmCriteria, v: { fasting?: number; h1?: number; h2?: number }): GdmDx | null {
  if (c === "dipsi") {
    if (!(v.h2! > 0)) return null;
    if (v.h2! >= 200) return { gdm: true, text: "2-hour value 200 mg/dL or more: possible overt (pre-existing) diabetes; check HbA1c and manage as diabetes in pregnancy" };
    return v.h2! >= 140 ? { gdm: true, text: `2-hour value ${v.h2} mg/dL: gestational diabetes (DIPSI, 140 or more)` } : { gdm: false, text: `2-hour value ${v.h2} mg/dL: normal. If tested before 24 weeks, repeat at 24–28 weeks` };
  }
  const hits = [v.fasting! >= 92 ? `fasting ${v.fasting}` : "", v.h1! >= 180 ? `1 h ${v.h1}` : "", v.h2! >= 153 ? `2 h ${v.h2}` : ""].filter(Boolean);
  if (!(v.fasting! > 0 || v.h1! > 0 || v.h2! > 0)) return null;
  if (v.fasting! >= 126) return { gdm: true, text: "Fasting 126 mg/dL or more: overt diabetes in pregnancy" };
  return hits.length ? { gdm: true, text: `Gestational diabetes (IADPSG): ${hits.join(", ")}` } : { gdm: false, text: "Below all IADPSG thresholds (92 / 180 / 153): normal" };
}
export interface GdmPlanIn { fastingAvg?: number; ppAvg?: number; weeksOnDiet: number; kg: number; onMetformin?: boolean; onInsulin?: boolean }
/** Targets fasting 95 or less and 2-hour post-meal 120 or less (MoHFW); medicine after 2 weeks of diet if not met. */
export function gdmPlan(i: GdmPlanIn): { onTarget: boolean; steps: string[] } {
  const fHigh = (i.fastingAvg ?? 0) > 95, pHigh = (i.ppAvg ?? 0) > 120;
  if (!fHigh && !pHigh) return { onTarget: true, steps: ["On target (fasting 95 or less, 2 hours after meals 120 or less): continue diet and activity; check fasting and post-meal glucose at least weekly (more often if on medicine)."] };
  const steps: string[] = [];
  if (i.weeksOnDiet < 2 && !i.onMetformin && !i.onInsulin) steps.push("Medical nutrition therapy for 2 weeks first: 3 meals and 2–3 snacks, carbohydrate spread through the day, a 30-minute walk after meals; recheck.");
  else {
    if (!i.onMetformin && !i.onInsulin) steps.push("Above target after 2 weeks of diet: start metformin 500 mg once or twice daily with meals (after 20 weeks), up to 2,000 mg a day, or insulin if metformin is not suitable or targets are far off.");
    if (fHigh) steps.push(`Fasting above 95: bedtime NPH insulin ${Math.max(2, Math.round(0.1 * i.kg))} units (0.1 unit/kg); increase by 2 units every 3 days until fasting is 95 or less.`);
    if (pHigh) steps.push("Post-meal above 120: regular (or rapid-acting) insulin 4 units before the meal(s) with high readings; increase by 2 units every 3 days to target.");
    if (i.onMetformin && !i.onInsulin) steps.push("On metformin and still above target: add insulin as above.");
  }
  steps.push("Fetal growth scans every 4 weeks from 28 weeks if on medicine; watch for polyhydramnios and macrosomia.");
  return { onTarget: false, steps };
}
export const GDM_DELIVERY = [
  "Diet alone, well controlled: deliver by 40+6 weeks (await spontaneous labour until then).",
  "On metformin or insulin, well controlled: plan delivery at 39+0 to 39+6 weeks.",
  "Poorly controlled or with complications: earlier, individualised delivery.",
  "In labour: capillary glucose hourly, keep 72–126 mg/dL; insulin-glucose infusion if needed.",
  "After delivery: stop metformin and insulin in GDM; check glucose for 24–48 hours; feed the baby within an hour and check the baby's glucose.",
  "75 g OGTT at 6–12 weeks after delivery, then every 1–3 years: high lifetime risk of type 2 diabetes.",
];

/* ================================================================== infant feeding */

const TERM_ML: number[] = [60, 60, 80, 100, 120, 140, 150, 150];
/** Milk volume (ml/kg/day) by day of life for a term baby on formula or expressed milk. */
export const termMlPerKg = (day: number) => (day >= 7 ? 150 : TERM_ML[Math.max(0, Math.min(7, Math.round(day)))]);
export interface FeedOut { mlPerKg: number; perDay: number; perFeed: number; scoops?: number; note: string }
export function feedVolume(kg: number, day: number, feeds: number, preterm: boolean, preDayMl?: number): FeedOut | null {
  if (!(kg > 0) || !(feeds > 0)) return null;
  const mlPerKg = preterm ? Math.min(180, preDayMl ?? 20) : termMlPerKg(day);
  const perDay = Math.round(mlPerKg * kg);
  const perFeed = Math.round(perDay / feeds);
  return {
    mlPerKg, perDay, perFeed, scoops: preterm ? undefined : r1(perFeed / 30),
    note: preterm ? "Preterm or very low birth weight: start 20 ml/kg/day of expressed breast milk (donor milk if none) and increase by 20–30 ml/kg/day as tolerated to 150–180; add a fortifier at 100 ml/kg/day if under 1.5 kg." : "Breastfed babies feed on demand (8–12 times a day): use these volumes for formula or expressed milk.",
  };
}
export function weightLoss(birthKg: number, nowKg: number): { pct: number; text: string } | null {
  if (!(birthKg > 0) || !(nowKg > 0)) return null;
  const pct = r1(((birthKg - nowKg) / birthKg) * 100);
  return { pct, text: pct >= 10 ? `${pct}% below birth weight: 10% or more needs a feeding assessment today (latch, milk transfer, jaundice, dehydration, sodium)` : pct >= 7 ? `${pct}% below birth weight: observe a breastfeed and review in 1–2 days` : pct > 0 ? `${pct}% below birth weight: within the expected range` : "At or above birth weight" };
}
export const FEEDING_OK = [
  "Wet nappies: 1 on day 1, 2 on day 2, 3 on day 3, then 6 or more heavy wet nappies a day from day 5",
  "Stools: changing from black meconium to yellow by day 4–5; 2 or more a day in the first weeks",
  "Weight: loses up to 7–10% in the first days, back to birth weight by 10–14 days, then gains 20–30 g a day for 3 months",
  "Feeds 8–12 times in 24 hours; audible swallowing; settles after most feeds",
];
export const COMPLEMENTARY: { age: string; what: string }[] = [
  { age: "0–6 months", what: "Breast milk only: no water, honey, ghutti or other feeds." },
  { age: "6–8 months", what: "Start mashed foods (dal-rice, khichdi, mashed banana, vegetables) 2–3 meals a day plus 1–2 snacks, alongside breastfeeding; half a katori (125 ml) each meal." },
  { age: "9–11 months", what: "Finely chopped or mashed family food 3–4 meals a day plus 1–2 snacks; half to three-quarters of a katori; add egg, fish or meat if eaten." },
  { age: "12–23 months", what: "Family food 3–4 meals plus 1–2 snacks, three-quarters to one katori; continue breastfeeding to 2 years or beyond." },
];

/* ================================================================== antidepressants */

export type Antidep = "fluoxetine" | "sertraline" | "escitalopram" | "citalopram" | "paroxetine" | "venlafaxine" | "duloxetine" | "desvenlafaxine" | "mirtazapine" | "amitriptyline" | "imipramine" | "bupropion" | "maoi";
export const ANTIDEPS: { id: Antidep; name: string; cls: "ssri" | "snri" | "nassa" | "tca" | "ndri" | "maoi"; start: string; range: string; note: string }[] = [
  { id: "fluoxetine", name: "Fluoxetine", cls: "ssri", start: "20 mg in the morning", range: "20–60 mg", note: "Very long half-life: few withdrawal symptoms; many interactions (CYP2D6)." },
  { id: "sertraline", name: "Sertraline", cls: "ssri", start: "50 mg daily", range: "50–200 mg", note: "Safe after a heart attack; preferred in pregnancy and breastfeeding with paroxetine avoided." },
  { id: "escitalopram", name: "Escitalopram", cls: "ssri", start: "10 mg daily (5 mg if elderly or anxious)", range: "10–20 mg (maximum 10 mg over 65)", note: "QT prolongation at higher doses." },
  { id: "citalopram", name: "Citalopram", cls: "ssri", start: "20 mg daily", range: "20–40 mg (maximum 20 mg over 65)", note: "Dose-related QT prolongation." },
  { id: "paroxetine", name: "Paroxetine", cls: "ssri", start: "20 mg daily", range: "20–50 mg", note: "Most withdrawal symptoms of the SSRIs; avoid in pregnancy." },
  { id: "venlafaxine", name: "Venlafaxine XR", cls: "snri", start: "75 mg daily (37.5 mg for 4–7 days if anxious)", range: "75–225 mg", note: "Raises BP at higher doses; marked withdrawal." },
  { id: "duloxetine", name: "Duloxetine", cls: "snri", start: "30 mg for a week, then 60 mg", range: "60–120 mg", note: "Also for neuropathic pain; avoid in liver disease or heavy drinking." },
  { id: "desvenlafaxine", name: "Desvenlafaxine", cls: "snri", start: "50 mg daily", range: "50–100 mg", note: "Reduce in kidney impairment." },
  { id: "mirtazapine", name: "Mirtazapine", cls: "nassa", start: "15 mg at night", range: "15–45 mg", note: "Sedation and weight gain; little sexual dysfunction." },
  { id: "amitriptyline", name: "Amitriptyline", cls: "tca", start: "25 mg at night", range: "75–150 mg for depression", note: "Dangerous in overdose; anticholinergic; avoid after MI and in the elderly." },
  { id: "imipramine", name: "Imipramine", cls: "tca", start: "25 mg at night", range: "75–150 mg", note: "As amitriptyline." },
  { id: "bupropion", name: "Bupropion", cls: "ndri", start: "150 mg in the morning", range: "150–300 mg", note: "Lowers the seizure threshold; no sexual dysfunction." },
  { id: "maoi", name: "MAO inhibitor (phenelzine, tranylcypromine, moclobemide)", cls: "maoi", start: "Specialist only", range: "Specialist only", note: "Dietary and drug interactions." },
];
/** How to switch between two antidepressants (general principles as in the Maudsley guidelines). */
export function switchPlan(from: Antidep, to: Antidep): { method: string; steps: string[]; caution: string[] } {
  const A = ANTIDEPS.find((d) => d.id === from)!, B = ANTIDEPS.find((d) => d.id === to)!;
  const caution = ["Watch for serotonin syndrome (agitation, tremor, clonus, hyperreflexia, sweating, fever) during any overlap.", "Explain discontinuation symptoms (dizziness, 'electric shocks', irritability) versus relapse."];
  if (from === to) return { method: "Same drug", steps: ["No switch needed: review dose, adherence and duration (4–6 weeks at a therapeutic dose before judging)."], caution: [] };
  if (A.cls === "maoi" || B.cls === "maoi") return { method: "Washout (specialist)", steps: [from === "fluoxetine" ? "Stop fluoxetine and wait 5 weeks before starting an MAO inhibitor." : A.cls === "maoi" ? "Stop the MAO inhibitor and wait 2 weeks (24 hours after moclobemide) before starting the new antidepressant." : "Stop the antidepressant and wait at least 1–2 weeks (5 weeks after fluoxetine) before starting the MAO inhibitor."], caution: ["Never combine an MAO inhibitor with another antidepressant: fatal serotonin syndrome or hypertensive crisis."] };
  if (from === "fluoxetine") {
    const steps = ["Stop fluoxetine (no taper needed from 20 mg; from higher doses drop to 20 mg for a week first).", `Wait 4–7 days, then start ${B.name} at a low dose (${B.cls === "tca" ? "25 mg, increasing slowly: fluoxetine raises TCA levels for weeks" : B.start}).`];
    return { method: "Stop, short gap, start low", steps, caution };
  }
  if (A.cls === "ssri" && B.cls === "ssri") return { method: "Direct switch", steps: [`Stop ${A.name} and start ${B.name} at its starting dose the next day (${B.start}).`, ...(from === "paroxetine" ? ["From paroxetine over 20 mg, reduce to 20 mg first."] : []), "Review in 1–2 weeks."], caution };
  if ((A.cls === "ssri" && B.cls === "snri") || (A.cls === "snri" && B.cls === "ssri") || (A.cls === "snri" && B.cls === "snri")) return { method: "Direct switch or brief cross-taper", steps: [`Reduce ${A.name} to its lowest dose for a week, then stop it and start ${B.name} at a low dose (${B.start}) the next day.`, "Increase to the usual dose over 1–2 weeks."], caution };
  if (B.cls === "nassa" || A.cls === "nassa") return { method: "Cross-taper", steps: [`Start ${B.name} at ${B.start}.`, `Reduce ${A.name} by about a quarter to a half each week and stop over 2–4 weeks while increasing ${B.name}.`], caution };
  if (B.cls === "tca" || A.cls === "tca") return { method: "Slow cross-taper", steps: [`Start ${B.name} at a low dose (${B.cls === "tca" ? "25 mg at night" : B.start}).`, `Reduce ${A.name} gradually over 2–4 weeks as ${B.name} is increased.`, ...(from === "paroxetine" ? ["Paroxetine raises TCA levels (CYP2D6): keep the TCA dose low until paroxetine is stopped."] : [])], caution };
  return { method: "Cross-taper", steps: [`Start ${B.name} at ${B.start}.`, `Reduce and stop ${A.name} over 1–2 weeks.`], caution: [...caution, ...(B.id === "bupropion" ? ["Bupropion lowers the seizure threshold and raises levels of drugs cleared by CYP2D6."] : [])] };
}
export function stopPlan(drug: Antidep): string[] {
  if (drug === "fluoxetine") return ["From 20 mg it can be stopped directly; from higher doses reduce to 20 mg for 1–2 weeks first."];
  const hard = drug === "paroxetine" || drug === "venlafaxine" || drug === "desvenlafaxine" || drug === "duloxetine";
  return [`Reduce over at least 4 weeks${hard ? " (often 2–3 months: this drug causes marked withdrawal)" : ""}: cut the dose by about a quarter to a half every 1–4 weeks, slower near the end (liquid or smaller tablets).`, "If withdrawal symptoms are troublesome, go back to the last dose that was tolerated and reduce more slowly.", "Continue for at least 6–12 months after recovery from a first episode, 2 years or more after recurrent episodes, before stopping."];
}

/* ================================================================== eye and ENT */

export const EYE_RED_FLAGS = ["Reduced vision", "Moderate to severe eye pain (not grittiness)", "Photophobia", "Corneal opacity, ulcer or white spot", "Irregular, fixed or unreactive pupil", "Contact lens wearer with a painful red eye", "Chemical splash", "Penetrating or high-velocity injury", "Shingles of the forehead or nose tip (Hutchinson's sign)", "Newborn with sticky eye in the first month"];
export const EYE_COMMON: { name: string; clues: string; treat: string }[] = [
  { name: "Bacterial conjunctivitis", clues: "Sticky yellow discharge, lids stuck in the morning, normal vision", treat: "Clean lids; chloramphenicol 0.5% or moxifloxacin 0.5% drops 4 times a day for 5–7 days; hand hygiene." },
  { name: "Viral conjunctivitis", clues: "Watery, gritty, often both eyes after a cold, tender pre-auricular node", treat: "Lubricant drops, cold compresses; very contagious for 2 weeks; no antibiotic or steroid drops." },
  { name: "Allergic conjunctivitis", clues: "Itching, both eyes, seasonal, atopy", treat: "Olopatadine or ketotifen drops twice daily; oral antihistamine; avoid rubbing." },
  { name: "Subconjunctival haemorrhage", clues: "Bright red patch, painless, vision normal", treat: "Reassure; clears in 2–3 weeks; check BP and INR if recurrent or on warfarin." },
  { name: "Acute angle-closure glaucoma", clues: "Severe pain, haloes, vomiting, hazy cornea, mid-dilated pupil", treat: "Emergency: acetazolamide 500 mg IV/oral, pilocarpine 2% and timolol drops, same-hour ophthalmology." },
];
export const CHEMICAL_EYE = "Chemical splash: irrigate at once with 1–2 litres of saline or clean water for at least 20–30 minutes (topical anaesthetic first), sweep the fornices, check pH until 7.0–7.5, then urgent ophthalmology. Alkali is worse than acid.";
export const EPISTAXIS = [
  "Sit up, lean forward, spit out blood; pinch the soft part of the nose firmly for 10–15 minutes without letting go; ice to the neck or mouth.",
  "Check pulse, BP and anticoagulants; FBC, coagulation and group-and-save if heavy or recurrent.",
  "If bleeding continues: clear clots, topical anaesthetic with adrenaline (or xylometazoline) on cotton for 10 minutes, look for an anterior bleeding point.",
  "Visible anterior vessel: silver nitrate cautery to one side of the septum only, for no more than 10 seconds; then antiseptic cream (Naseptin; avoid if peanut allergy) twice daily for 2 weeks.",
  "Still bleeding: anterior nasal pack (Merocel or Rapid Rhino) for 24–48 hours; topical tranexamic acid can help; admit or refer to ENT.",
  "Bleeding from behind the pack or down the throat (posterior): resuscitate, ENT now; posterior pack or Foley catheter.",
];
export const EAR: { name: string; treat: string }[] = [
  { name: "Acute otitis media", treat: "Paracetamol or ibuprofen; most settle in 3 days. Amoxicillin 40–90 mg/kg/day in 2–3 doses for 5–7 days if under 2 years with both ears, ear discharge, systemically unwell, or no better after 2–3 days." },
  { name: "Otitis externa", treat: "Clean the canal; antibiotic-steroid ear drops (ciprofloxacin-dexamethasone) for 7 days; keep water out; wick if the canal is swollen shut." },
  { name: "Wax", treat: "Olive oil or sodium bicarbonate drops for 1–2 weeks; irrigation or microsuction if still blocked; not with a perforation or grommets." },
  { name: "Foreign body or insect", treat: "Drown an insect with oil; remove under direct vision; button batteries in the ear or nose are emergencies." },
];
export const EAR_RED_FLAGS = ["Swelling, redness or tenderness behind the ear (mastoiditis)", "Facial weakness", "Sudden hearing loss in one ear (steroids within 24 hours; same-day ENT)", "Severe headache, neck stiffness or confusion", "Vertigo with neurological signs", "Persistent discharge in a diabetic or immunosuppressed adult (necrotising otitis externa)"];
export interface CentorIn { fever: boolean; noCough: boolean; nodes: boolean; exudate: boolean; age: number }
/** McIsaac-modified Centor score and what to do. */
export function centor(i: CentorIn): { score: number; text: string } {
  const s = (i.fever ? 1 : 0) + (i.noCough ? 1 : 0) + (i.nodes ? 1 : 0) + (i.exudate ? 1 : 0) + (i.age >= 3 && i.age <= 14 ? 1 : i.age >= 45 ? -1 : 0);
  const kid = i.age >= 3 && i.age <= 15;
  const text = s <= 1 ? "0–1: streptococcal infection unlikely: no antibiotic; analgesia, salt-water gargles." : s <= 3 ? `2–3: test (rapid antigen or throat swab) if available, or a delayed antibiotic${kid ? "; in India, children 5–15 with a score of 2 or more are often treated to prevent rheumatic fever" : ""}.` : "4–5: likely streptococcal: penicillin V 500 mg 4 times a day (child 15 mg/kg 3 times) or amoxicillin 50 mg/kg once daily (max 1 g) for 10 days, or one dose of benzathine penicillin.";
  return { score: s, text };
}
export const THROAT_RED_FLAGS = ["Drooling, cannot swallow saliva, muffled voice", "Trismus or a bulging tonsil pushing the uvula over (quinsy)", "Stridor or breathing difficulty", "Neck swelling or stiffness", "Grey membrane (diphtheria): isolate, notify"];

/* ================================================================== VTE prophylaxis */

export const PADUA: { id: string; label: string; pts: number }[] = [
  { id: "cancer", label: "Active cancer", pts: 3 },
  { id: "prevVte", label: "Previous VTE (not superficial)", pts: 3 },
  { id: "immobile", label: "Reduced mobility (bed rest with bathroom privileges) for 3 days or more", pts: 3 },
  { id: "thrombophilia", label: "Known thrombophilia", pts: 3 },
  { id: "trauma", label: "Recent trauma or surgery (1 month or less)", pts: 2 },
  { id: "age70", label: "Age 70 or over", pts: 1 },
  { id: "hfResp", label: "Heart or respiratory failure", pts: 1 },
  { id: "miStroke", label: "Acute MI or ischaemic stroke", pts: 1 },
  { id: "infection", label: "Acute infection or rheumatological disorder", pts: 1 },
  { id: "obese", label: "Obesity (BMI 30 or more)", pts: 1 },
  { id: "hormones", label: "Ongoing hormonal treatment", pts: 1 },
];
export const paduaScore = (sel: string[]) => PADUA.filter((p) => sel.includes(p.id)).reduce((a, p) => a + p.pts, 0);
export const VTE_BLEED = ["Active bleeding", "Platelets under 50,000", "Acquired or inherited bleeding disorder, INR over 1.5 untreated", "Recent intracranial bleed, or neurosurgery, eye surgery or spinal procedure", "Lumbar puncture or epidural in the last 4 hours or expected in the next 12", "Uncontrolled hypertension (230/120 or more)", "Active peptic ulcer"];
export function enoxaparin(kg: number, crclMl: number | null, purpose: "prophylaxis" | "treatment"): string[] {
  if (!(kg > 0)) return [];
  const low = crclMl !== null && crclMl < 30;
  if (purpose === "treatment") {
    const d = Math.round(kg);
    return [low ? `Enoxaparin ${d} mg (1 mg/kg) once daily (CrCl under 30)` : `Enoxaparin ${d} mg (1 mg/kg) twice daily, or ${Math.round(1.5 * kg)} mg (1.5 mg/kg) once daily in uncomplicated VTE`, "Check platelets at baseline and at days 5–7 (HIT)", ...(kg > 150 ? ["Over 150 kg: anti-Xa levels"] : [])];
  }
  const dose = low ? "20 mg once daily (CrCl under 30), or UFH 5,000 units 12-hourly" : kg >= 150 ? "40 mg twice daily (weight 150 kg or more)" : kg > 100 ? "40 mg twice daily may be used (over 100 kg; follow local policy)" : kg < 50 ? "20–40 mg once daily (under 50 kg: consider 20 mg)" : "40 mg once daily";
  return [`Enoxaparin ${dose} SC`, "Alternatives: fondaparinux 2.5 mg once daily (not if CrCl under 30); UFH 5,000 units 8–12-hourly", "Continue until fully mobile (usually 7–14 days); mechanical prophylaxis (stockings or IPC) if anticoagulation is contraindicated, not in stroke (IPC instead) or limb ischaemia"];
}

/* ================================================================== headache and migraine */

export const HEADACHE_RED: { id: string; label: string; urgent?: boolean }[] = [
  { id: "thunder", label: "Sudden 'worst ever' headache reaching maximum within a minute (thunderclap)", urgent: true },
  { id: "fever", label: "Fever, neck stiffness, rash, or immunosuppression", urgent: true },
  { id: "neuro", label: "New focal neurological deficit, confusion, seizure or reduced consciousness", urgent: true },
  { id: "papill", label: "Papilloedema", urgent: true },
  { id: "age50", label: "New headache over 50 (think giant cell arteritis: jaw claudication, scalp tenderness, ESR)" },
  { id: "pattern", label: "Change in pattern, or progressively worsening over weeks" },
  { id: "valsalva", label: "Worse on coughing, straining, lying down, or waking from sleep" },
  { id: "positional", label: "Better lying down, worse standing (low pressure)" },
  { id: "cancer", label: "History of cancer, or HIV" },
  { id: "pregnancy", label: "Pregnancy or postpartum (venous sinus thrombosis, pre-eclampsia)" },
  { id: "trauma", label: "After head injury, or on anticoagulants" },
];
export function headacheRedFlags(sel: string[]): { level: "none" | "soon" | "urgent"; text: string } {
  const flags = HEADACHE_RED.filter((r) => sel.includes(r.id));
  if (!flags.length) return { level: "none", text: "No red flags ticked: a primary headache (migraine, tension-type, cluster) is likely." };
  if (flags.some((f) => f.urgent)) return { level: "urgent", text: sel.includes("thunder") ? "Thunderclap headache: same-day CT brain (within 6 hours of onset is most sensitive for subarachnoid haemorrhage); if normal and more than 6 hours, LP at 12 hours for xanthochromia." : "Urgent assessment and imaging today; consider meningitis (antibiotics before imaging if suspected), stroke, raised intracranial pressure." };
  return { level: "soon", text: "Red flag present: investigate (imaging, ESR/CRP if over 50) and review within days, sooner if worsening." };
}
export interface MigraineIn { daysPerMonth: number; analgesicDays: number; triptanDays: number; asthma: boolean; pregnancy: boolean; cad: boolean; depression: boolean; obese: boolean; childbearing: boolean }
export function migrainePlan(i: MigraineIn): { acute: string[]; moh?: string; prophylaxis: string[] } {
  const acute = ["Early in the attack: paracetamol 1 g, aspirin 900 mg or ibuprofen 400–600 mg (naproxen 500 mg), with metoclopramide 10 mg or domperidone 10 mg for nausea.",
    i.cad || i.pregnancy ? "Triptans: avoid (coronary or vascular disease; limited data in pregnancy: paracetamol first)." : "Triptan if simple analgesics fail: sumatriptan 50–100 mg (repeat once after 2 hours if it returns; maximum 300 mg a day); combine with an NSAID for better effect."];
  const moh = i.analgesicDays >= 15 || i.triptanDays >= 10 ? `Medication-overuse headache likely (${i.analgesicDays >= 15 ? "simple analgesics on 15 or more days" : "triptans on 10 or more days"} a month): stop the overused drug (abruptly for analgesics and triptans), expect worse headache for 1–2 weeks, and start prophylaxis.` : undefined;
  const prophylaxis: string[] = [];
  if (i.daysPerMonth >= 4 || moh) {
    if (!i.asthma && !i.pregnancy) prophylaxis.push("Propranolol 40 mg twice daily, up to 80 mg twice daily (not in asthma, heart block or with verapamil).");
    if (!i.pregnancy) prophylaxis.push(`Amitriptyline 10 mg at night, increasing by 10 mg every 1–2 weeks to 25–50 mg${i.depression ? " (helps sleep and low mood)" : ""}.`);
    if (!i.pregnancy && !(i.childbearing)) prophylaxis.push(`Topiramate 25 mg at night, increasing by 25 mg a week to 50 mg twice daily${i.obese ? " (may help weight loss)" : ""}.`);
    else if (i.childbearing && !i.pregnancy) prophylaxis.push("Topiramate only with highly effective contraception (it is teratogenic and reduces pill effectiveness); avoid valproate.");
    if (!i.pregnancy) prophylaxis.push("Flunarizine 5–10 mg at night (avoid with depression or parkinsonism).");
    if (i.pregnancy) prophylaxis.push("In pregnancy: lifestyle and trigger management first; low-dose propranolol or amitriptyline only with specialist advice.");
    prophylaxis.push("Give each for 8–12 weeks at a tolerated dose before judging; keep a headache diary.");
  }
  return { acute, moh, prophylaxis };
}
export const OTHER_HEADACHE = [
  "Tension-type: paracetamol or an NSAID on no more than 2–3 days a week; amitriptyline for chronic tension-type headache.",
  "Cluster: 100% oxygen 12–15 L/min by non-rebreather for 15 minutes and sumatriptan 6 mg SC (or nasal); verapamil prophylaxis via neurology (ECG monitoring).",
  "Giant cell arteritis suspected: prednisolone 40–60 mg today (60 mg with visual symptoms), ESR/CRP, same-day referral.",
];

/* ================================================================== skin infections */

export function scabiesPlan(kg: number, pregnant: boolean, infant: boolean): string[] {
  const iv = kg >= 15 && !pregnant ? `Ivermectin ${Math.round(0.2 * kg * 10) / 10} mg (200 micrograms/kg) on day 1 and day 8 (3 mg tablets: ${Math.round((0.2 * kg) / 3 * 2) / 2})` : "Ivermectin not used (under 15 kg or pregnant)";
  return [
    `Permethrin 5% cream on cool dry skin from the neck down${infant ? " including the scalp, face and ears in infants" : ""}, under the nails; wash off after 8–14 hours; repeat after 7 days.`,
    iv + "; useful for crusted scabies, outbreaks or when cream is impractical.",
    "Treat everyone in the household and close contacts on the same day, even without itch.",
    "Wash clothes, towels and bedding in hot water (or seal in a bag for 3 days) on the day of treatment.",
    "Itch can last 2–4 weeks after successful treatment: antihistamine at night and moisturiser; retreat only if new burrows appear.",
  ];
}
export const TINEA = [
  "Stop all steroid combination creams (clobetasol or betamethasone mixtures make tinea worse and widespread).",
  "Limited, first episode: topical luliconazole, sertaconazole or terbinafine once or twice daily for 4 weeks, and 2 weeks beyond clearing.",
  "Extensive, recurrent or involving the groin and body widely: oral itraconazole 100–200 mg daily (with food) for at least 4–6 weeks, or terbinafine 250–500 mg daily; continue 2 weeks beyond clinical cure.",
  "Check family members and treat together; loose cotton clothes; dry well after bathing; do not share towels; wash clothes daily.",
  "Itraconazole interacts with many drugs (statins, some calcium channel blockers); check LFT if long courses.",
];
export function impetigoPlan(kg: number, adult: boolean): string[] {
  return ["Few lesions: remove crusts gently; mupirocin 2% or fusidic acid cream 3 times a day for 5 days.", adult ? "Widespread or bullous: cephalexin 500 mg 4 times a day (or cloxacillin 500 mg 4 times a day) for 7 days." : `Widespread or bullous: cephalexin ${Math.round(12.5 * kg)} mg 4 times a day (50 mg/kg/day) for 7 days.`, "Keep off school until crusted or 48 hours after starting antibiotics; separate towels."];
}
export const CELLULITIS = [
  "Mark the edge with a pen and date it; elevate the limb; look for and treat tinea between the toes.",
  "Mild (no systemic features): cephalexin 500 mg 4 times a day or cloxacillin 500 mg 4 times a day for 5–7 days (clindamycin 300 mg 3 times a day if penicillin-allergic).",
  "Systemically unwell, spreading fast or failed oral treatment: IV cefazolin 1–2 g 8-hourly (or ceftriaxone); add MRSA cover if abscess or known MRSA.",
  "Necrotising fasciitis red flags: pain out of proportion, rapid spread, bullae, skin necrosis, crepitus, numbness, shock: urgent surgical exploration, IV broad-spectrum antibiotics with clindamycin.",
  "Abscess: incision and drainage is the main treatment.",
];
export const ZOSTER = [
  "Within 72 hours of the rash (or later if new lesions, over 50, immunosuppressed or eye involvement): acyclovir 800 mg 5 times a day for 7 days, or valacyclovir 1 g 3 times a day.",
  "Pain: paracetamol or NSAID; amitriptyline or pregabalin for neuropathic pain or post-herpetic neuralgia.",
  "Forehead or nose-tip rash (ophthalmic zoster): same-day eye review.",
  "Infectious to people who have not had chickenpox (pregnant women, newborns) until lesions crust.",
];

/* ================================================================== gout */

export function goutFlare(crcl: number | null, i: { onStatinMacrolide?: boolean; pepticUlcer?: boolean; diabetes?: boolean }): string[] {
  const out: string[] = [];
  const colchOk = (crcl === null || crcl >= 30) && !i.onStatinMacrolide;
  if (colchOk) out.push(`Colchicine 1 mg, then 0.5 mg an hour later, then 0.5 mg ${crcl !== null && crcl < 60 ? "once" : "twice or three times"} daily until the flare settles (start within 12 hours if possible).`);
  else out.push("Colchicine: avoid (CrCl under 30, or with clarithromycin, cyclosporine or other strong CYP3A4/P-gp inhibitors).");
  if (!i.pepticUlcer && (crcl === null || crcl >= 30)) out.push("NSAID: naproxen 500 mg twice daily or etoricoxib 120 mg once daily for 5–7 days, with a PPI.");
  out.push(`Prednisolone 30–35 mg once daily for 5 days${i.diabetes ? " (monitor glucose)" : ""}, or an intra-articular steroid for a single large joint.`);
  out.push("Rest and ice the joint; do not stop allopurinol during a flare if already taking it.");
  return out;
}
export const ULT_INDICATIONS = ["2 or more flares a year", "Tophi", "Gouty arthritis on X-ray", "Kidney stones", "First flare with age under 40, urate over 8 mg/dL, CKD, heart failure or hypertension"];
/** Allopurinol start-low, go-slow titration to the target urate. */
export function allopurinolPlan(egfr: number, currentUrate: number, tophi: boolean): { start: string; steps: string[]; target: string } {
  const target = tophi ? 5 : 6;
  const startDose = egfr < 30 ? 50 : egfr < 60 ? 50 : 100;
  const step = egfr < 60 ? 50 : 100;
  return {
    start: `Allopurinol ${startDose} mg daily${egfr < 30 ? " (every other day is an option)" : ""}, with colchicine 0.5 mg once or twice daily (or a low-dose NSAID) for the first 3–6 months to prevent flares.`,
    steps: [`Check urate every 2–4 weeks and increase by ${step} mg each time until urate is under ${target} mg/dL${currentUrate ? ` (now ${currentUrate})` : ""}; doses up to 800–900 mg are possible, also in CKD with monitoring.`, "Stop at once and seek help if a rash appears (allopurinol hypersensitivity); HLA-B*5801 testing before starting in people of Han Chinese, Thai or Korean origin, especially with CKD.", "Alternative: febuxostat 40 mg, up to 80–120 mg (caution with established cardiovascular disease)."],
    target: tophi ? "Target serum urate under 5 mg/dL until the tophi dissolve, then under 6 mg/dL, for life." : "Target serum urate under 6 mg/dL, for life.",
  };
}
export const GOUT_LIFESTYLE = ["Limit beer and spirits, sugary drinks and fructose; moderate red meat, organ meat and shellfish; dairy, coffee and cherries may help.", "Lose weight gradually; drink 2 litres of water a day.", "Review drugs that raise urate: thiazide and loop diuretics, low-dose aspirin, pyrazinamide; losartan and fenofibrate lower urate."];
