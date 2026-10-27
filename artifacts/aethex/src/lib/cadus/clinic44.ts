/**
 * Update 44, on the device (no AI): lung nodules (Fleischner), ITP, Parkinson's disease medicines
 * (LEDD, nil by mouth), breast lump and screening (BI-RADS), childhood constipation and enuresis,
 * ADHD, infertility work-up (WHO 2021 semen values), knee and hip osteoarthritis, allergic rhinitis
 * and sinusitis, GERD, shoulder pain and carpal tunnel syndrome.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const cap = (n: number, max: number) => Math.min(max, n);

/* ================================================================== lung nodule (Fleischner 2017) */

export interface NoduleInput { type: "solid" | "ground" | "partsolid"; multiple: boolean; sizeMm: number; highRisk: boolean; solidMm: number }
export function fleischner(x: NoduleInput): { action: string; level: "none" | "follow" | "workup" } {
  const s = x.sizeMm;
  if (!(s > 0)) return { action: "Enter the average diameter (mm).", level: "none" };
  if (x.type === "solid") {
    if (s < 6) return x.highRisk ? { action: `${s} mm solid ${x.multiple ? "nodules" : "nodule"}, high risk: optional CT at 12 months.`, level: "follow" } : { action: `${s} mm solid ${x.multiple ? "nodules" : "nodule"}, low risk: no routine follow-up.`, level: "none" };
    if (s <= 8) return { action: x.multiple ? `6–8 mm solid nodules: CT at 3–6 months, then ${x.highRisk ? "CT at 18–24 months" : "consider CT at 18–24 months"}.` : `6–8 mm solid nodule: CT at 6–12 months, then ${x.highRisk ? "CT at 18–24 months" : "consider CT at 18–24 months"}.`, level: "follow" };
    return x.multiple ? { action: "Over 8 mm, multiple: CT at 3–6 months, then consider CT at 18–24 months.", level: "follow" } : { action: "Over 8 mm solid nodule: consider CT at 3 months, PET-CT or tissue sampling (estimate cancer risk, e.g. Brock model).", level: "workup" };
  }
  if (x.multiple) return s < 6 ? { action: "Multiple subsolid nodules under 6 mm: CT at 3–6 months; if stable, consider CT at 2 and 4 years.", level: "follow" } : { action: "Multiple subsolid nodules, one 6 mm or more: CT at 3–6 months; then manage by the most suspicious nodule.", level: "follow" };
  if (x.type === "ground") return s < 6 ? { action: "Pure ground-glass under 6 mm: no routine follow-up.", level: "none" } : { action: "Pure ground-glass 6 mm or more: CT at 6–12 months to confirm it persists, then every 2 years until 5 years.", level: "follow" };
  if (s < 6) return { action: "Part-solid under 6 mm: no routine follow-up.", level: "none" };
  if (x.solidMm >= 6) return { action: `Part-solid with a ${x.solidMm} mm solid component: highly suspicious; CT at 3–6 months to confirm persistence, then PET-CT, biopsy or resection.`, level: "workup" };
  return { action: "Part-solid 6 mm or more: CT at 3–6 months to confirm it persists; if unchanged and the solid part stays under 6 mm, yearly CT for 5 years.", level: "follow" };
}
export const NODULE_RISK = ["Heavy smoking history", "Lung cancer in a first-degree relative", "Upper lobe", "Spiculated margin", "Emphysema or pulmonary fibrosis", "Older age", "Asbestos or other carcinogen exposure"];
export const NODULE_NOTES = [
  "For incidental nodules in adults 35 and over; not for lung cancer screening (use Lung-RADS), known cancer or immunosuppression.",
  "Calcified (central, laminated, popcorn) nodules and those with fat are benign; in India healed TB granulomas are common.",
  "Use the average of long and short axis on thin-section CT; growth means at least 2 mm.",
];

/* ================================================================== ITP */

export type Bleed = "none" | "skin" | "mucosal" | "severe";
export function itpPlan(child: boolean, plt: number, bleed: Bleed, kg: number): { action: "observe" | "treat" | "emergency"; steps: string[] } {
  if (bleed === "severe") return { action: "emergency", steps: [
    "Life-threatening bleeding (intracranial, GI with instability): platelet transfusion (repeated or continuous), IVIG 1 g/kg, IV methylprednisolone 1 g daily for 3 days (30 mg/kg in children), tranexamic acid; haematology now.",
    "Stop antiplatelets and anticoagulants; urgent CT head if headache or neurological signs.",
  ] };
  if (child) {
    if (bleed === "none" || bleed === "skin") return { action: "observe", steps: ["Newly diagnosed ITP in a child with no bleeding or skin-only bruising and petechiae: observe at home whatever the count (most recover within 6–12 months).", "Avoid NSAIDs, aspirin, IM injections and contact sports; give the family a plan for bleeding (nose or gum bleeding that won't stop, blood in urine or stool, severe headache)."] };
    return { action: "treat", steps: [
      kg > 0 ? `Mucosal bleeding: prednisolone ${Math.round(cap(2 * kg, 120))}–${Math.round(cap(4 * kg, 120))} mg a day (2–4 mg/kg/day, max 120 mg) for 5–7 days, or IVIG ${Math.round(0.8 * kg)}–${Math.round(kg)} g once (0.8–1 g/kg).` : "Mucosal bleeding: prednisolone 2–4 mg/kg/day (max 120 mg) for 5–7 days, or IVIG 0.8–1 g/kg once.",
      "Tranexamic acid for mouth or nose bleeding and heavy periods.",
    ] };
  }
  if (plt >= 30 && (bleed === "none" || bleed === "skin")) return { action: "observe", steps: [`Platelets ${plt} ×10³/µL with no or minor bleeding: observe; repeat count in 1–2 weeks, then less often if stable.`, "Treat before procedures: platelets 50 or more for most surgery, 80 or more for spinal or epidural anaesthesia."] };
  return { action: "treat", steps: [
    `${plt > 0 ? `Platelets ${plt}` : "Platelets under 30"}${bleed === "mucosal" ? " with mucosal bleeding" : ""}: corticosteroids — prednisolone ${kg > 0 ? `${Math.round(cap(kg, 80))} mg` : "1 mg/kg (max 80 mg)"} daily for up to 2–3 weeks then taper off by 6 weeks, or dexamethasone 40 mg daily for 4 days (repeat up to 3 cycles).`,
    `IVIG ${kg > 0 ? `${Math.round(kg)} g` : "1 g/kg"} (repeat on day 2 if needed) when a fast rise is needed: bleeding, before surgery or delivery.`,
    "Not responding or relapsing: thrombopoietin receptor agonist (eltrombopag, romiplostim), rituximab or fostamatinib; splenectomy only after 12 months.",
  ] };
}
export const ITP_EXCLUDE = ["Pseudothrombocytopenia (clumping in EDTA: repeat in citrate, look at the film)", "Dengue, malaria, sepsis", "HIV, hepatitis C (and H. pylori in adults)", "Drugs (heparin, quinine, valproate, linezolid, co-trimoxazole)", "Pregnancy (gestational thrombocytopenia, HELLP)", "SLE, antiphospholipid syndrome, thyroid disease", "Liver disease with splenomegaly", "Marrow disease: other cytopenias, blasts, age over 60 (marrow examination)"];

/* ================================================================== Parkinson's disease medicines */

export interface PdMeds { levodopaIR: number; levodopaCR: number; entacapone: boolean; opicapone: boolean; pramipexole: number; ropinirole: number; rotigotine: number; rasagiline: number; selegiline: number; amantadine: number }
/** Levodopa-equivalent daily dose (Tomlinson 2010 and the 2023 update). Pramipexole as the salt. */
export function ledd(m: PdMeds): { total: number; parts: [string, number][] } {
  const parts: [string, number][] = [];
  const add = (l: string, v: number) => { if (v > 0) parts.push([l, Math.round(v)]); };
  add("Levodopa (immediate release)", m.levodopaIR);
  add("Levodopa (controlled release ×0.75)", m.levodopaCR * 0.75);
  if (m.entacapone) add("Entacapone (+33% of levodopa)", (m.levodopaIR + m.levodopaCR * 0.75) * 0.33);
  if (m.opicapone) add("Opicapone (+50% of levodopa)", (m.levodopaIR + m.levodopaCR * 0.75) * 0.5);
  add("Pramipexole (×100)", m.pramipexole * 100);
  add("Ropinirole (×20)", m.ropinirole * 20);
  add("Rotigotine (×30)", m.rotigotine * 30);
  add("Rasagiline (×100)", m.rasagiline * 100);
  add("Selegiline oral (×10)", m.selegiline * 10);
  add("Amantadine (×1)", m.amantadine);
  return { total: parts.reduce((a, p) => a + p[1], 0), parts };
}
/** A rotigotine patch to cover nil by mouth (levodopa and dopamine agonist part of the LEDD ÷ 30, to the nearest 2 mg, max 16 mg). */
export function rotigotineNbm(m: PdMeds): number | null {
  const l = ledd({ ...m, rasagiline: 0, selegiline: 0, amantadine: 0 }).total;
  if (!l) return null;
  return Math.min(16, Math.max(2, Math.round(l / 30 / 2) * 2));
}
export const PD_AVOID: [string, string][] = [
  ["Metoclopramide, prochlorperazine", "use domperidone (check QT) or ondansetron for nausea (not ondansetron with apomorphine)"],
  ["Haloperidol and typical antipsychotics", "low-dose quetiapine or clozapine for psychosis or delirium; lorazepam if needed for agitation"],
  ["Risperidone, olanzapine", "worsen parkinsonism"],
  ["Pethidine, tramadol with MAO-B inhibitors", "serotonin syndrome risk"],
  ["Stopping levodopa suddenly", "risk of parkinsonism–hyperpyrexia syndrome (like NMS)"],
];
export const PD_NBM = [
  "Give Parkinson's medicines on time, every time (within 30 minutes): late doses cause rigidity, swallowing problems, falls and aspiration.",
  "Nil by mouth or unsafe swallow: nasogastric tube early and give dispersible levodopa (co-beneldopa dispersible) at the same doses and times; modified-release cannot be crushed: convert to the same total as immediate release split through the day.",
  "No enteral route: rotigotine patch (dose below), reduce if confused or elderly; check with the Parkinson's team.",
  "Restart usual tablets as soon as swallowing is safe; stop the patch when oral medicines restart.",
];

/* ================================================================== breast lump and screening */

export const BIRADS: { cat: string; name: string; action: string }[] = [
  { cat: "0", name: "Incomplete", action: "Needs more imaging (spot views, ultrasound) or comparison with old films." },
  { cat: "1", name: "Negative", action: "Routine screening." },
  { cat: "2", name: "Benign", action: "Routine screening." },
  { cat: "3", name: "Probably benign (cancer risk 2% or less)", action: "Short-interval follow-up: imaging at 6 months, then every 6–12 months for 2 years (biopsy if the woman prefers or follow-up is unreliable)." },
  { cat: "4", name: "Suspicious (2–95%)", action: "Image-guided core needle biopsy." },
  { cat: "5", name: "Highly suggestive of cancer (95% or more)", action: "Core needle biopsy and refer to the breast cancer team." },
  { cat: "6", name: "Biopsy-proven cancer", action: "Treatment planning with the multidisciplinary team." },
];
export const BREAST_FLAGS = ["Hard, fixed or irregular lump", "Skin dimpling, peau d'orange or ulceration", "New nipple retraction", "Bloody or single-duct nipple discharge", "Axillary lump", "Lump persisting after a period (age 30 or more)", "Male breast lump (not simple gynaecomastia)"];
export function breastLump(age: number, flags: boolean[]): string[] {
  const urgent = flags.some(Boolean);
  const imaging = age > 0 && age < 35 ? "Ultrasound first (dense breasts under 35); mammography too if the ultrasound is suspicious." : "Mammography with ultrasound.";
  return [
    urgent ? "Red flags present: urgent referral to a breast clinic (seen within 2 weeks) for triple assessment." : "Triple assessment in a breast clinic: examination, imaging and needle biopsy if anything is not clearly benign.",
    imaging,
    "Core needle biopsy (not FNAC alone) for any solid lump that is not clearly benign on imaging.",
    ...(age > 0 && age < 30 && !urgent ? ["Under 30 with a smooth mobile lump (likely fibroadenoma): ultrasound, and biopsy if it grows or is over 3 cm."] : []),
    "Breast abscess or mastitis that does not settle on antibiotics within 2 weeks: image to exclude inflammatory cancer.",
  ];
}
export function breastScreen(age: number, highRisk: boolean): string {
  if (highRisk) return "High risk (BRCA or other gene, strong family history, chest radiotherapy before 30): yearly MRI from 25–30 and yearly mammography from 30 (40 for some); genetic counselling; consider risk-reducing options.";
  if (age < 30) return "Under 30: breast awareness (know what is normal, report changes); no routine screening.";
  if (age < 40) return "30–39: clinical breast examination every 5 years in India's NP-NCD programme (30–65); no routine mammography unless high risk.";
  if (age <= 74) return `${age}: mammography every 2 years (USPSTF 2024: 40–74) where available, plus clinical breast examination; continue breast awareness.`;
  return "75 and over: decide individually based on health and life expectancy.";
}

/* ================================================================== childhood constipation and enuresis */

export function pegPlan(kg: number, phase: "disimpaction" | "maintenance"): string {
  if (!(kg > 0)) return phase === "disimpaction" ? "PEG 3350: 1–1.5 g/kg/day (max 100 g) for 3–6 days (enter weight)." : "PEG 3350: 0.4–0.8 g/kg/day (max 17 g), adjusted to a soft stool daily (enter weight).";
  if (phase === "disimpaction") return `Disimpaction: PEG 3350 ${Math.round(cap(kg, 100))}–${Math.round(cap(1.5 * kg, 100))} g a day (1–1.5 g/kg, max 100 g) for 3–6 days, until watery stool with no hard lumps; add senna if no result after 2 weeks.`;
  return `Maintenance: PEG 3350 ${r1(cap(0.4 * kg, 17))}–${r1(cap(0.8 * kg, 17))} g a day (0.4–0.8 g/kg, max 17 g), adjusted to one soft stool a day; continue for several weeks after a regular pattern, then wean slowly over months. Lactulose 1–2 ml/kg/day is an alternative.`;
}
export const CONSTIPATION_FLAGS = ["Constipation from birth or the first weeks", "Meconium passed after 48 hours", "Ribbon stools", "Abnormal legs, gait or reflexes", "Sacral dimple, tuft or naevus", "Distension with vomiting", "Faltering growth", "Blood in stool without a fissure"];
export const CONSTIPATION_CARE = ["Toilet sitting for 5 minutes after meals, feet supported; star chart for sitting, not for clean pants.", "Fluids and fibre (fruit, vegetables, whole grains) alongside, never instead of, laxatives.", "Don't stop laxatives suddenly; relapse is common."];
export function enuresisPlan(age: number, daytime: boolean, secondary: boolean): string[] {
  if (daytime || secondary) return [`${daytime ? "Daytime wetting" : "Wetting again after being dry for 6 months or more"}: look for a cause first: urine test (UTI, glucose), constipation, diabetes, urinary tract or spinal problems, emotional stress or abuse.`, "Refer if daytime symptoms persist, poor stream, or neurological signs."];
  if (age < 5) return ["Under 5: bedwetting is common and usually stops on its own; reassure, no treatment needed."];
  return [
    "Drinks spread through the day (6–8 drinks), avoid caffeine, pass urine before bed; rewards for agreed behaviours (drinking well, using the toilet before bed), never punishment.",
    "Enuresis alarm: first-line if the child and family are motivated; continue until 14 dry nights in a row; review at 4 weeks.",
    "Desmopressin: melt 120 micrograms (or tablet 200 micrograms) at bedtime, up to 240 micrograms melt (400 micrograms tablet) if partial response; no drinks from 1 hour before to 8 hours after (hyponatraemia); useful for sleepovers or camps; review at 4 weeks, stop for a week every 3 months.",
    "Treat constipation if present; refer if both treatments fail.",
  ];
}

/* ================================================================== ADHD in children */

export function adhdDx(inattention: number, hyperactive: number, age: number, before12: boolean, settings: boolean, impairment: boolean): { meets: boolean; type: string; text: string } {
  const need = age >= 17 ? 5 : 6;
  const ia = inattention >= need, hy = hyperactive >= need;
  const type = ia && hy ? "combined" : ia ? "predominantly inattentive" : hy ? "predominantly hyperactive-impulsive" : "none";
  const meets = (ia || hy) && before12 && settings && impairment;
  const missing = [!before12 && "several symptoms before 12", !settings && "symptoms in 2 or more settings", !impairment && "clear impairment"].filter(Boolean);
  return { meets, type, text: meets ? `Meets DSM-5 criteria: ADHD, ${type} presentation (${inattention} inattentive, ${hyperactive} hyperactive-impulsive).` : (ia || hy) ? `Symptom count met (${type}), but also needs: ${missing.join(", ")}.` : `${inattention} inattentive and ${hyperactive} hyperactive-impulsive symptoms: below the ${need} needed in either domain.` };
}
export function adhdMeds(kg: number, age: number): string[] {
  if (age > 0 && age < 6) return ["Under 6: parent training (behavioural) programmes first; medicines only on specialist advice."];
  const atx = kg > 0 ? (kg < 70 ? `atomoxetine ${Math.round(0.5 * kg)} mg daily for 7 days, then ${Math.round(1.2 * kg)} mg daily (1.2 mg/kg; max 1.4 mg/kg or 100 mg)` : "atomoxetine 40 mg daily for 7 days, then 80 mg daily (max 100 mg)") : "atomoxetine 0.5 mg/kg for 7 days then 1.2 mg/kg daily";
  return [
    "Behavioural support and school adjustments for everyone; medicines when impairment persists (age 6 and over).",
    "Methylphenidate first line: 5 mg once or twice daily (immediate release), increasing by 5–10 mg a week to effect, max 60 mg a day (long-acting once daily preparations are easier at school).",
    `Second line or if stimulants unsuitable: ${atx}; warn about suicidal thoughts and liver injury.`,
    "Before starting: height, weight, heart rate, BP, cardiac history (syncope, palpitations, family sudden death: ECG and cardiology). Every 6 months: height and weight on a centile chart, BP, pulse, sleep and appetite.",
  ];
}

/* ================================================================== infertility */

export function whenToInvestigate(femaleAge: number, months: number, flags: boolean): string {
  if (flags) return "Investigate now: known cause or risk (irregular or absent periods, endometriosis, pelvic infection, previous surgery, chemotherapy, male factor).";
  if (femaleAge >= 40) return "Woman 40 or over: investigate now and refer early.";
  if (femaleAge >= 35) return months >= 6 ? `${months} months trying and woman 35 or over: investigate now.` : `Woman 35 or over: investigate after 6 months of regular unprotected sex (${months} so far).`;
  return months >= 12 ? `${months} months trying: investigate both partners now.` : `Investigate after 12 months of regular unprotected sex (${months} so far); sex every 2–3 days, folic acid, healthy weight, stop smoking and alcohol.`;
}
export const SEMEN_REF: { key: keyof SemenInput; label: string; low: number; unit: string }[] = [
  { key: "volume", label: "Volume", low: 1.4, unit: "ml" },
  { key: "concentration", label: "Concentration", low: 16, unit: "million/ml" },
  { key: "total", label: "Total sperm number", low: 39, unit: "million" },
  { key: "motility", label: "Total motility", low: 42, unit: "%" },
  { key: "progressive", label: "Progressive motility", low: 30, unit: "%" },
  { key: "morphology", label: "Normal forms", low: 4, unit: "%" },
  { key: "vitality", label: "Vitality", low: 54, unit: "%" },
];
export interface SemenInput { volume: number; concentration: number; total: number; motility: number; progressive: number; morphology: number; vitality: number }
export function semen(x: SemenInput): { flags: string[]; text: string } {
  const flags = SEMEN_REF.filter((r) => x[r.key] > 0 && x[r.key] < r.low).map((r) => `${r.label} ${x[r.key]} ${r.unit} (below ${r.low})`);
  const azoo = x.concentration === 0 && x.volume > 0;
  const text = azoo ? "No sperm seen: repeat with a centrifuged sample after 2–4 weeks; FSH, testosterone, karyotype and Y-microdeletion; urology referral." : flags.length ? "Below WHO 2021 lower reference limits: repeat in 3 months (or sooner if severe); look for varicocele, infection, smoking, heat, drugs (anabolic steroids); andrology or urology referral." : "Within WHO 2021 lower reference limits.";
  return { flags, text };
}
export const FEMALE_TESTS = [
  "Ovulation: mid-luteal progesterone (about 7 days before the expected period); over 3 ng/mL (about 10 nmol/L) confirms ovulation.",
  "Day 2–5: FSH, LH, oestradiol; ovarian reserve with AMH or antral follicle count on ultrasound.",
  "TSH and prolactin if cycles are irregular or there are symptoms; rubella immunity, HIV, hepatitis B and C.",
  "Transvaginal ultrasound (fibroids, polyps, PCOS, endometriomas, hydrosalpinx).",
  "Tubal patency: HSG or HyCoSy; laparoscopy with dye if past pelvic infection, endometriosis or surgery.",
];

/* ================================================================== knee and hip osteoarthritis */

export function oaDx(age: number, activityPain: boolean, stiffMin: number): { clinical: boolean; text: string } {
  const clinical = age >= 45 && activityPain && stiffMin <= 30;
  return { clinical, text: clinical ? "Clinical diagnosis of osteoarthritis (45 or over, pain with activity, morning stiffness 30 minutes or less): no X-ray or blood tests needed." : "Not a typical picture: consider X-ray and other causes (inflammatory arthritis if long morning stiffness, gout, referred pain from the hip or back)." };
}
export function oaPlan(joint: "knee" | "hip", bmi: number, nsaidRisk: boolean, flare: boolean, severe: boolean): string[] {
  const out = [
    "Exercise for everyone: strengthening and aerobic activity (physiotherapy-guided, 3 or more times a week); it works as well as medicines.",
    ...(bmi >= 25 ? [`BMI ${bmi}: weight loss of 5–10% reduces pain${joint === "knee" ? " (each kg lost takes about 4 kg of load off the knee)" : ""}.`] : []),
    "Education, pacing, good footwear, walking stick in the opposite hand.",
    joint === "knee" ? "Topical NSAID (diclofenac gel) first for knee pain." : "Topical NSAIDs help less for the hip.",
    nsaidRisk ? "Oral NSAIDs: avoid or use with great care (kidney disease, heart failure, GI bleeding, anticoagulants, older age)." : "Oral NSAID at the lowest dose for the shortest time, with a PPI if 45 or over; paracetamol alone and weak opioids are not routinely recommended (little benefit).",
  ];
  if (flare) out.push("Flare: intra-articular corticosteroid injection gives short-term relief (no more than every 3 months); hyaluronic acid and PRP are not recommended.");
  out.push("Not recommended: glucosamine, chondroitin, strong opioids long term, arthroscopic washout for knee OA.");
  out.push(severe ? `Joint symptoms substantially affect quality of life despite non-surgical care: refer for ${joint} replacement assessment (age, weight or X-ray severity alone are not barriers).` : "Refer for joint replacement if symptoms substantially affect quality of life despite non-surgical care.");
  out.push("Red flags: hot swollen joint (septic arthritis), rapidly worsening pain, locking, weight loss or night pain: assess urgently.");
  return out;
}

/* ================================================================== allergic rhinitis and sinusitis */

export function arPlan(persistent: boolean, troublesome: boolean, age: number, asthma: boolean): { severity: string; steps: string[] } {
  const severity = `${persistent ? "Persistent" : "Intermittent"}, ${troublesome ? "moderate–severe" : "mild"}`;
  const child = age > 0 && age < 12;
  const steps = [
    "Allergen avoidance (dust mite covers, wash bedding hot weekly, avoid smoke), saline nasal rinses.",
    troublesome || persistent ? `Intranasal corticosteroid first line: mometasone 50 micrograms ${child ? "1 spray each nostril daily (age 3–11)" : "2 sprays each nostril daily"} or fluticasone furoate; correct technique (aim away from the septum); takes 1–2 weeks for full effect.` : `Non-sedating oral antihistamine as needed: ${child ? (age < 6 ? "cetirizine 2.5 mg twice daily (age 2–5)" : "cetirizine 5 mg twice daily or 10 mg once daily (6–11)") : "cetirizine 10 mg, levocetirizine 5 mg or fexofenadine 120–180 mg daily"}.`,
  ];
  if (troublesome) steps.push("Severe or not controlled: azelastine–fluticasone nasal spray combination; short oral steroid only rarely.");
  if (asthma) steps.push("With asthma: treat both; montelukast can help both (warn about mood and sleep effects).");
  steps.push("Avoid decongestant drops beyond 5 days (rebound congestion); refer for allergy testing and immunotherapy if symptoms stay uncontrolled.");
  return { severity, steps };
}
export function sinusitis(days: number, severe: boolean, double: boolean, child: boolean, kg: number, allergy: boolean, redFlag: boolean): { bacterial: boolean; steps: string[] } {
  if (redFlag) return { bacterial: true, steps: ["Red flags (swelling or redness around the eye, double or reduced vision, displaced eye, severe frontal headache, neurological signs, meningism): same-day ENT and IV antibiotics; CT of sinuses and brain."] };
  const bacterial = days >= 10 || severe || double;
  const steps = ["Saline rinses, paracetamol or ibuprofen, intranasal corticosteroid (mometasone) for 2 weeks; steam is fine."];
  if (!bacterial) steps.push(`${days ? `${days} days` : "Under 10 days"} and improving: likely viral; antibiotics don't help.`);
  else if (allergy) steps.push(child ? "Penicillin allergy (child): cefpodoxime or clindamycin with specialist advice." : "Penicillin allergy: doxycycline 200 mg on day 1 then 100 mg daily for 5 days total.");
  else steps.push(child ? (kg > 0 ? `Bacterial sinusitis likely: amoxicillin–clavulanate ${Math.round((45 * kg) / 2)} mg (amoxicillin part) twice daily (45 mg/kg/day; 90 mg/kg/day if high risk) for 10 days.` : "Bacterial sinusitis likely: amoxicillin–clavulanate 45 mg/kg/day in 2 doses for 10 days.") : "Bacterial sinusitis likely (10 days or more, severe onset, or worsening after improving): amoxicillin 500 mg three times daily, or amoxicillin–clavulanate 625 mg three times daily, for 5–7 days.");
  steps.push("Symptoms over 12 weeks: chronic rhinosinusitis: nasal steroid and saline long term, ENT referral (polyps, dental source, fungal disease).");
  return { bacterial, steps };
}

/* ================================================================== GERD */

export const GERD_ALARM = ["Difficulty or pain swallowing", "Weight loss", "GI bleeding or iron deficiency anaemia", "Persistent vomiting", "New symptoms at 60 or over", "Family history of upper GI cancer", "Epigastric mass"];
export function gerdPlan(alarm: boolean[], weeks: number, response: "none" | "partial" | "full"): string[] {
  if (alarm.some(Boolean)) return ["Alarm features: upper GI endoscopy (urgent if dysphagia, bleeding or weight loss); don't delay with long PPI trials."];
  const out = ["Lifestyle: weight loss if overweight, no meals 2–3 hours before bed, raise the head of the bed for night symptoms, stop smoking; avoid only the foods that trigger symptoms for her or him."];
  if (weeks < 8 || response === "none" && weeks === 0) out.push("Empirical PPI once daily 30–60 minutes before breakfast for 8 weeks: omeprazole 20 mg, pantoprazole 40 mg or esomeprazole 40 mg.");
  else if (response === "full") out.push("Good response at 8 weeks: try stopping or step down to the lowest effective dose or on-demand use; long-term PPI only if needed (risks: B12 and magnesium deficiency, fractures, C. difficile).");
  else if (response === "partial") out.push("Partial response: check timing and adherence, then twice daily PPI or switch PPI for 8 more weeks; alginate (Gaviscon) after meals and at bedtime.");
  else out.push("No response to 8 weeks of correctly taken PPI: endoscopy, then oesophageal pH monitoring off PPI; consider functional heartburn, eosinophilic oesophagitis, gastroparesis, cardiac pain.");
  out.push("Dyspepsia under 60 without alarm features: test and treat H. pylori (common in India) with a urea breath or stool antigen test, off PPI for 2 weeks.");
  return out;
}

/* ================================================================== shoulder pain */

export interface ShoulderInput { age: number; painfulArc: boolean; erLoss: boolean; weakness: boolean; trauma: boolean; diabetes: boolean; redFlag: boolean }
export function shoulder(x: ShoulderInput): { dx: string; steps: string[] } {
  if (x.redFlag) return { dx: "Red flags", steps: ["Fever or hot joint (septic arthritis), unreduced dislocation, mass, deformity, weight loss, or pain that may be referred (heart, lung apex tumour, gallbladder, diaphragm): urgent assessment."] };
  if (x.trauma && x.weakness) return { dx: "Possible acute rotator cuff tear", steps: ["Injury with new weakness (can't lift the arm, drop-arm sign): ultrasound or MRI and orthopaedic review within 2 weeks; early repair gives the best results.", "X-ray to exclude fracture or dislocation."] };
  if (x.erLoss) return { dx: "Frozen shoulder (adhesive capsulitis) or glenohumeral arthritis", steps: [
    "Loss of passive external rotation: X-ray to exclude arthritis or a missed posterior dislocation.",
    "Frozen shoulder runs 1–3 years (freezing, frozen, thawing): analgesia, gentle stretching within pain, physiotherapy.",
    "Intra-articular steroid injection early helps pain and movement; hydrodilatation, manipulation or capsular release if severe and persistent.",
    `${x.diabetes ? "Diabetes: common association; check control (HbA1c)." : "Check HbA1c and thyroid function (common associations)."}`,
  ] };
  return { dx: x.weakness ? "Rotator cuff tendinopathy with possible degenerative tear" : "Rotator cuff tendinopathy (subacromial pain)", steps: [
    "Painful arc (60–120°) with preserved passive movement: rotator cuff-related shoulder pain.",
    "Relative rest from aggravating overhead activity, analgesia or NSAID, physiotherapy-led progressive loading for 6–12 weeks.",
    "Subacromial steroid injection if pain prevents rehabilitation (not more than 2–3 times).",
    `${x.weakness ? "Persistent weakness: ultrasound for a full-thickness tear; refer if young or active." : "Refer to orthopaedics if no better after 3–6 months of good rehabilitation."}`,
    ...(x.age >= 40 ? [] : ["Under 40: consider instability (previous dislocation) and refer if recurrent."]),
  ] };
}

/* ================================================================== carpal tunnel syndrome */

export function ctsPlan(severity: "mild" | "moderate" | "severe", pregnant: boolean, months: number): string[] {
  const out = ["Check for causes: hypothyroidism (TSH), diabetes (HbA1c), rheumatoid arthritis, pregnancy, obesity, acromegaly, wrist fracture."];
  if (pregnant) { out.push("In pregnancy: night wrist splint; usually settles after delivery; injection if severe."); return out; }
  if (severity === "severe") out.push("Constant numbness, thenar wasting or weakness: nerve conduction studies and refer for surgical carpal tunnel release (soon, to prevent permanent damage).");
  else {
    out.push("Wrist splint in neutral at night for 6–8 weeks; avoid prolonged wrist flexion and vibrating tools.");
    out.push("Steroid injection into the carpal tunnel if splinting is not enough (relief often lasts months).");
    if (severity === "moderate" || months >= 3) out.push(`${months ? `${months} months of symptoms` : "Persistent symptoms"} despite splint and injection: nerve conduction studies and surgical referral.`);
  }
  out.push("Mimics: cervical radiculopathy (C6–7: neck pain, reflex change), pronator syndrome, peripheral neuropathy.");
  return out;
}
export const CTS_SIGNS = ["Numbness or tingling in thumb, index and middle fingers", "Worse at night, wakes from sleep", "Shaking the hand relieves it (flick sign)", "Positive Phalen's or Tinel's test", "Weak grip or dropping things", "Thenar muscle wasting"];
