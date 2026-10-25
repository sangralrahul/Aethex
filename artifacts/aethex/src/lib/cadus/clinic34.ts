/**
 * Update 34, on the device (no AI): anaphylaxis, the trauma primary survey, toxicology
 * (paracetamol and organophosphates), pneumothorax and chest drains, body fluid analysis,
 * adrenal crisis and steroid cover, refeeding risk, and back pain red flags.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ================================================================== anaphylaxis */

export function adrenalineIm(ageYears: number, kg?: number): { mcg: number; ml: number; text: string } {
  const byAge = ageYears >= 12 ? 500 : ageYears >= 6 ? 300 : ageYears >= 0.5 ? 150 : 100;
  const mcg = kg && kg > 0 && ageYears < 12 ? Math.min(byAge, Math.max(50, Math.round(kg) * 10)) : byAge;
  const ml = Math.round(mcg / 10) / 100;
  return { mcg, ml, text: `Adrenaline ${mcg} micrograms IM (${ml} ml of 1 mg/ml, 1:1,000) into the anterolateral thigh${ageYears < 0.5 ? " (under 6 months: 100–150 micrograms)" : ""}; repeat every 5 minutes if not better` };
}
export function anaphylaxisRefractory(kg: number, child: boolean): string[] {
  const k = kg > 0 ? kg : child ? 20 : 70;
  return [
    "After two IM doses without improvement: call for critical care help; continue IM adrenaline every 5 minutes until an infusion is running.",
    `Adrenaline infusion (1 mg in 100 ml = 10 micrograms/ml): start at 0.5–1 ml/kg/hour (${r1(0.5 * k)}–${r1(1 * k)} ml/hour), titrate to response with continuous monitoring.`,
    `Rapid fluid bolus: ${child ? `${Math.round(10 * k)} ml (10 ml/kg)` : "500–1,000 ml"} crystalloid, repeat as needed.`,
    "Bronchospasm: nebulised salbutamol (with ipratropium); airway obstruction: nebulised adrenaline and early airway expert.",
    `On beta-blockers and not responding: glucagon ${child ? `${Math.round(Math.min(1000, 20 * k))} micrograms (20 micrograms/kg)` : "1–2 mg"} IV.`,
    "Antihistamines and steroids are not first-line and must not delay adrenaline; a non-sedating oral antihistamine helps skin symptoms after stabilisation.",
  ];
}
export function anaphylaxisObserve(x: { doses: number; severe: boolean; asthma: boolean; lateOrBiphasic: boolean; remote: boolean; goodQuickResponse: boolean; hasKit: boolean }): string {
  if (x.doses >= 2 || x.severe || x.asthma || x.lateOrBiphasic || x.remote) return "Observe for at least 12 hours after symptoms resolve (two or more doses, severe reaction, severe asthma, previous biphasic reaction, late presentation or poor access to care).";
  if (x.doses === 1 && x.goodQuickResponse && x.hasKit) return "Fast-track discharge after at least 2 hours may be considered: good response within 5–10 minutes to one dose, complete resolution, adrenaline kit supplied and trained, and an adult with them.";
  return "Observe for at least 6 hours after symptoms resolve.";
}
export const ANAPHYLAXIS_AFTER = [
  "Mast cell tryptase: one sample as soon as possible after treatment, a second 1–2 hours after the start of symptoms, and a baseline after 24 hours.",
  "Prescribe two adrenaline auto-injectors (or a prefilled syringe kit with 1 mg/ml ampoules where auto-injectors are not available) and train the patient and family.",
  "Refer to an allergy specialist; write down the suspected trigger; avoid it, and check related drugs (NSAIDs, beta-lactams).",
  "Review beta-blockers and ACE inhibitors.",
];
export function allergyPlanMd(name: string, trigger: string, dose: string): string {
  return [
    `# Allergy action plan${name ? `: ${name}` : ""}`,
    "",
    `**Allergic to:** ${trigger || "________"}`,
    "",
    "## Mild to moderate reaction",
    "- Swelling of lips, face or eyes; hives or itchy rash; tummy pain or vomiting",
    "- Stay with the person; give a non-drowsy antihistamine; watch for signs of anaphylaxis",
    "",
    "## Anaphylaxis: look for ABC",
    "- **A**irway: throat tightness, hoarse voice, swollen tongue",
    "- **B**reathing: wheeze, persistent cough, difficult or noisy breathing",
    "- **C**irculation: pale, floppy, dizzy, collapse",
    "",
    "## If ANY of these",
    `1. Lie the person flat (sit up if breathing is hard; on the side if pregnant). Do not stand them up.`,
    `2. Give adrenaline into the outer thigh straight away: ${dose}`,
    "3. Call an ambulance (108 or 112) and say \"anaphylaxis\"",
    "4. If no better after 5 minutes, give a second adrenaline dose",
    "5. Start CPR if they stop breathing normally",
  ].join("\n");
}

/* ================================================================== trauma */

export const TRAUMA_STEPS: { id: string; title: string; detail: string }[] = [
  { id: "c", title: "<C> Catastrophic haemorrhage", detail: "Direct pressure, wound packing, tourniquet high and tight on a limb (note the time)." },
  { id: "a", title: "A Airway with cervical spine protection", detail: "Jaw thrust, suction, airway adjuncts; definitive airway if GCS 8 or less, burns or failing airway; manual in-line stabilisation." },
  { id: "b", title: "B Breathing", detail: "Expose the chest, RR, SpO2, look for tension pneumothorax (needle decompression 4th–5th ICS just anterior to the mid-axillary line, then chest drain), open wounds (three-sided dressing), flail chest, massive haemothorax." },
  { id: "c2", title: "C Circulation and bleeding", detail: "Two large-bore IV or IO lines, bloods with cross-match and lactate; find the bleeding: chest, abdomen (FAST), pelvis (binder), long bones (splint), floor; permissive hypotension." },
  { id: "d", title: "D Disability", detail: "GCS, pupils, glucose, lateralising signs; protect the brain: avoid hypoxia and hypotension." },
  { id: "e", title: "E Exposure and environment", detail: "Log roll, full exposure, then warm blankets and warm fluids; prevent hypothermia." },
  { id: "adj", title: "Adjuncts", detail: "ECG, ABG, urinary catheter (not with blood at the meatus or a high-riding prostate), chest and pelvic X-ray, eFAST; decide on CT or theatre." },
];
export function shockClass(hr: number, sbp: number): { cls: string; loss: string; text: string } | null {
  if (!(hr > 0 && sbp > 0)) return null;
  if (hr > 140 || sbp < 70) return { cls: "IV", loss: "over 40%", text: "Class IV: over 40% blood loss: massive transfusion and immediate haemorrhage control (theatre or angioembolisation)" };
  if (hr > 120 || sbp < 90) return { cls: "III", loss: "31–40%", text: "Class III: 31–40% blood loss: blood products now, consider massive transfusion protocol" };
  if (hr >= 100) return { cls: "II", loss: "15–30%", text: "Class II: 15–30% blood loss: crystalloid up to 1 L, blood if not responding" };
  return { cls: "I", loss: "under 15%", text: "Class I: under 15% blood loss (vital signs can be normal: watch the trend)" };
}
export const abcScore = (x: { penetrating: boolean; sbp90: boolean; hr120: boolean; fastPos: boolean }) => Object.values(x).filter(Boolean).length;
export function gcs(e: number, v: number, m: number): { total: number; text: string } {
  const t = e + v + m;
  return { total: t, text: t <= 8 ? `GCS ${t}: severe; secure the airway` : t <= 12 ? `GCS ${t}: moderate head injury: CT head` : `GCS ${t}: mild` };
}
export function txaAdvice(hoursSince: number | null): string {
  if (hoursSince === null) return "Tranexamic acid 1 g IV over 10 minutes, then 1 g over 8 hours, if significant bleeding and within 3 hours of injury.";
  return hoursSince <= 3 ? `Within ${hoursSince} h of injury: give tranexamic acid 1 g IV over 10 minutes now, then 1 g over 8 hours.` : "More than 3 hours since injury: do not start tranexamic acid (harm outweighs benefit).";
}
export const TRAUMA_TARGETS = ["Limit crystalloid to 1 L; give blood products 1:1:1 (red cells, plasma, platelets) when bleeding", "Permissive hypotension: SBP 80–90 until bleeding is controlled (not in head injury: MAP 80 or more)", "Lethal triad: prevent hypothermia, acidosis and coagulopathy; give calcium with massive transfusion", "Time is the key: aim for definitive haemorrhage control within 60 minutes of injury"];

/* ================================================================== toxicology */

/** Paracetamol treatment line (mg/L) at a given time after a single acute ingestion: halves every 4 hours from 4 h. */
export function paraLine(hours: number, base: 100 | 150): number | null {
  if (hours < 4 || hours > 24) return null;
  return r1(base * 2 ** (-(hours - 4) / 4));
}
export function paraAssess(i: { hours: number | null; level?: number; unit: "mgL" | "umolL"; mgPerKg?: number; staggered: boolean; base: 100 | 150; altHigh: boolean }): { treat: boolean; text: string } {
  const mgL = i.level === undefined ? undefined : i.unit === "umolL" ? i.level / 6.62 : i.level;
  if (i.staggered || i.hours === null) return { treat: true, text: "Staggered or unknown-time ingestion: treat with acetylcysteine now; check paracetamol level, ALT, INR and creatinine; stop if level undetectable and ALT normal after treatment by local protocol." };
  if (i.hours > 24) return { treat: !!(i.altHigh || (mgL && mgL > 0)), text: i.altHigh || (mgL && mgL > 0) ? "Over 24 hours with raised ALT or detectable paracetamol: treat with acetylcysteine." : "Over 24 hours, ALT normal and paracetamol undetectable: no treatment needed." };
  if (i.hours < 4) return { treat: false, text: `Under 4 hours: a level is not interpretable yet; take it at 4 hours.${i.mgPerKg && i.mgPerKg >= 150 ? " Over 150 mg/kg: if the level will not be back by 8 hours, start acetylcysteine." : ""}` };
  const line = paraLine(i.hours, i.base)!;
  if (mgL === undefined) return { treat: (i.mgPerKg ?? 0) >= 150 && i.hours >= 8, text: `Treatment line at ${i.hours} h: ${line} mg/L (${Math.round(line * 6.62)} µmol/L). Send a level now; if over 8 hours since ingestion and over 150 mg/kg, start acetylcysteine while waiting.` };
  const above = mgL >= line;
  return { treat: above || i.altHigh, text: `Level ${r1(mgL)} mg/L at ${i.hours} h; treatment line ${line} mg/L: ${above ? "on or above the line: give acetylcysteine" : i.altHigh ? "below the line but ALT raised: give acetylcysteine" : "below the line: no acetylcysteine needed (if the time is reliable)"}.` };
}
export function nacDoses(kg: number): { bags: { dose: string; over: string; vol: string }[]; note: string } | null {
  if (!(kg > 0)) return null;
  const w = Math.min(110, kg);
  return {
    bags: [
      { dose: `${Math.round(150 * w)} mg (150 mg/kg)`, over: "1 hour", vol: "in 200 ml 5% glucose or 0.9% saline" },
      { dose: `${Math.round(50 * w)} mg (50 mg/kg)`, over: "4 hours", vol: "in 500 ml" },
      { dose: `${Math.round(100 * w)} mg (100 mg/kg)`, over: "16 hours", vol: "in 1,000 ml" },
    ],
    note: `${kg > 110 ? "Weight capped at 110 kg. " : ""}Children: same mg/kg with smaller volumes. The 12-hour SNAP regimen (100 mg/kg over 2 hours, then 200 mg/kg over 10 hours) is an alternative with fewer reactions. Recheck ALT, INR and paracetamol before stopping.`,
  };
}
export function atropinePlan(startMg: number, doubles: number, child: boolean, kg: number): { next: string; total: number; infusion: string } {
  const doses = Array.from({ length: doubles + 1 }, (_, i) => startMg * 2 ** i);
  const total = r1(doses.reduce((a, d) => a + d, 0));
  return {
    next: `Next dose: ${r1(startMg * 2 ** (doubles + 1))} mg IV in 5 minutes if not atropinised (dose doubles each time)${child ? ` (child: start ${r1(Math.max(0.1, 0.02 * kg))}–${r1(0.05 * kg)} mg)` : ""}`,
    total,
    infusion: `Once atropinised: infusion of ${r1(total * 0.1)}–${r1(total * 0.2)} mg/hour (10–20% of the total loading dose); reduce if confused, feverish or no bowel sounds (atropine toxicity); increase if secretions return.`,
  };
}
export const ATROPINISED = ["Clear chest on auscultation (no crackles or wheeze)", "Heart rate over 80", "Systolic BP over 80", "Dry axillae", "Pupils no longer pinpoint"];
export function pralidoxime(kg: number): string {
  const k = kg > 0 ? kg : 60;
  return `Pralidoxime (WHO regimen): ${Math.round(30 * k)} mg (30 mg/kg) IV over 30 minutes, then ${Math.round(8 * k)} mg/hour (8 mg/kg/hour) infusion; benefit is uncertain, so never delay atropine.`;
}
export const OP_CARE = ["Remove clothing and wash the skin (staff wear gloves); no gastric lavage once symptomatic unless very early and airway protected", "Airway and oxygen; intubate if GCS low or respiratory failure; avoid suxamethonium (prolonged paralysis)", "Watch for intermediate syndrome at 24–96 hours: neck-flexion and proximal weakness, cranial nerve palsies, respiratory failure", "Benzodiazepines for seizures or agitation"];
export const OTHER_POISONS: { name: string; care: string }[] = [
  { name: "Aluminium phosphide (celphos)", care: "No antidote; ICU early; treat shock with fluids and vasopressors; correct magnesium and acidosis; ECG monitoring; poor prognosis with shock." },
  { name: "Yellow oleander or digoxin", care: "Bradycardia and heart block: atropine, temporary pacing; anti-digoxin Fab if available; multiple-dose activated charcoal; check potassium." },
  { name: "Superwarfarin rodenticide", care: "INR at 24 and 48 hours; vitamin K1 high dose for weeks to months if INR rises; FFP or PCC for bleeding." },
  { name: "Kerosene and other hydrocarbons", care: "Do not induce vomiting or lavage; chest X-ray at 6 hours; watch for chemical pneumonitis." },
  { name: "Paraquat", care: "No antidote; early activated charcoal or Fuller's earth; avoid high-flow oxygen unless hypoxic; very poor prognosis after large ingestion." },
  { name: "Methanol (illicit liquor)", care: "Fomepizole or ethanol, sodium bicarbonate for acidosis, folinic acid, early haemodialysis; check visual symptoms." },
];
export const POISON_LINE = "National Poisons Information Centre, AIIMS New Delhi: 1800-116-117 (toll-free).";

/* ================================================================== pneumothorax */

export interface PtxIn { secondary: boolean; symptomatic: boolean; size: number | null; highRisk: string[]; tension: boolean }
export const PTX_HIGH_RISK = ["Haemodynamic compromise", "Significant hypoxia", "Bilateral pneumothorax", "Underlying lung disease", "Age 50 or over with a smoking history", "Haemopneumothorax"];
export function ptxPlan(i: PtxIn): { action: string; steps: string[] } {
  if (i.tension) return { action: "Tension pneumothorax: decompress now", steps: ["Needle decompression (14G cannula) in the 4th–5th intercostal space just anterior to the mid-axillary line (adults) or 2nd space mid-clavicular, or finger thoracostomy", "Then insert a chest drain", "Oxygen; do not wait for an X-ray"] };
  const large = i.size !== null && i.size >= 2;
  if (i.highRisk.length && i.symptomatic) return { action: "Chest drain", steps: ["Small-bore (12–14 F) Seldinger drain in the safe triangle", "Admit; respiratory team review; thoracic surgery referral if air leak persists 3–5 days", ...(i.secondary ? ["Secondary pneumothorax: admit for at least 24 hours even after successful treatment"] : [])] };
  if (!i.symptomatic) return { action: i.secondary ? "Admit and observe" : "Conservative care", steps: [i.secondary ? "Secondary pneumothorax with minimal symptoms: admit, oxygen if hypoxic (caution in CO2 retainers), repeat X-ray; drain if enlarging or breathless" : "Minimal symptoms: conservative care whatever the size; review with an X-ray in 2–4 days; safety-net advice to return if breathless", "No flying until a chest X-ray confirms resolution and at least a week has passed"] };
  return { action: "Needle aspiration or ambulatory device (or conservative care)", steps: [`Symptomatic without high-risk features${large ? " and large (2 cm or more at the hilum)" : ""}: needle aspiration (16–18G, up to 2.5 L) or an ambulatory device; conservative care is reasonable if symptoms allow`, "Repeat X-ray after aspiration; if it fails, insert a small-bore chest drain", ...(i.secondary ? ["Secondary pneumothorax: admit"] : ["Discharge with follow-up in 2–4 weeks if successful"])] };
}
export const DRAIN_STEPS = [
  "Consent, explain, check the X-ray side and clotting; analgesia; monitoring.",
  "Safe triangle: lateral border of pectoralis major, lateral border of latissimus dorsi, and a horizontal line at the level of the nipple (5th intercostal space), apex below the axilla; arm raised behind the head.",
  "Aseptic technique; local anaesthetic (lidocaine up to 3 mg/kg) down to the pleura; aspirate air or fluid to confirm before inserting.",
  "Go just above the upper border of the rib below (avoids the neurovascular bundle).",
  "Pneumothorax: 12–14 F Seldinger; trauma haemothorax: 28–32 F blunt dissection (smaller 14 F pigtails are increasingly used for simple pneumothorax).",
  "Secure with a stay suture and dressing; underwater seal below the chest; check swinging and bubbling; post-procedure X-ray.",
  "No routine suction; persistent air leak at 48 hours: low-pressure suction (−10 to −20 cmH₂O) and respiratory or thoracic review.",
  "Remove when the lung is re-expanded and bubbling has stopped (clamping is not routine), at end-expiration or during a Valsalva; X-ray if symptoms.",
];

/* ================================================================== body fluids */

export function lightCriteria(pProt: number, sProt: number, pLdh: number, sLdh: number, ldhUln: number): { exudate: boolean; text: string } | null {
  if (!(pProt > 0 && sProt > 0 && pLdh > 0 && sLdh > 0)) return null;
  const a = pProt / sProt > 0.5, b = pLdh / sLdh > 0.6, c = ldhUln > 0 ? pLdh > (2 / 3) * ldhUln : false;
  const ex = a || b || c;
  return { exudate: ex, text: `${ex ? "Exudate" : "Transudate"} by Light's criteria (protein ratio ${r1(pProt / sProt * 100) / 100}, LDH ratio ${r1(pLdh / sLdh * 100) / 100}${ldhUln ? `, pleural LDH ${pLdh} vs 2/3 of ULN ${Math.round((2 / 3) * ldhUln)}` : ""})` };
}
export function pleuralExtras(ada?: number, lymph?: boolean, ph?: number, glucose?: number): string[] {
  const out: string[] = [];
  if (ada !== undefined && ada > 0) out.push(ada >= 40 ? `ADA ${ada}: 40 U/L or more${lymph ? " with lymphocytes" : ""}: tuberculous effusion is likely in India (consider pleural biopsy if uncertain)` : `ADA ${ada}: under 40: TB less likely`);
  if (ph !== undefined && ph > 0 && ph < 7.2) out.push(`pH ${ph}: under 7.2: complicated parapneumonic effusion or empyema: chest drain`);
  if (glucose !== undefined && glucose > 0 && glucose < 60) out.push(`Glucose ${glucose} mg/dL: under 60: empyema, TB, rheumatoid or malignancy`);
  return out;
}
export function saag(serumAlb: number, asciticAlb: number, asciticProt?: number): string | null {
  if (!(serumAlb > 0 && asciticAlb >= 0)) return null;
  const g = r1(serumAlb - asciticAlb);
  if (g >= 1.1) return `SAAG ${g} g/dL (1.1 or more): portal hypertension${asciticProt !== undefined ? asciticProt < 2.5 ? " with low protein: cirrhosis" : " with high protein (2.5 or more): cardiac ascites or Budd-Chiari" : ""}`;
  return `SAAG ${g} g/dL (under 1.1): not portal hypertension: TB peritonitis, malignancy, pancreatitis, nephrotic syndrome`;
}
export interface CsfIn { wbc: number; neutPct: number; rbc?: number; bloodWbc?: number; bloodRbc?: number; csfGlu: number; bloodGlu: number; protein: number; ada?: number }
export function csfPattern(i: CsfIn): { pattern: string; corrected: number; notes: string[] } {
  let corrected = i.wbc;
  if (i.rbc && i.rbc > 0) corrected = Math.max(0, Math.round(i.wbc - (i.bloodWbc && i.bloodRbc ? (i.rbc * i.bloodWbc) / i.bloodRbc : i.rbc / 700)));
  const ratio = i.bloodGlu > 0 ? i.csfGlu / i.bloodGlu : 1;
  const notes: string[] = [];
  if (i.rbc && i.rbc > 0) notes.push(`Corrected for a traumatic tap: about ${corrected} white cells.`);
  notes.push(`CSF/blood glucose ratio ${r1(ratio * 100) / 100}${ratio < 0.4 ? " (low)" : ""}; protein ${i.protein} mg/dL.`);
  let pattern = "Normal or near-normal CSF";
  if (corrected >= 5) {
    if (i.neutPct >= 50 && ratio < 0.4) pattern = "Bacterial meningitis pattern: neutrophils with low glucose and high protein: IV ceftriaxone 2 g 12-hourly (plus ampicillin over 50 or immunosuppressed) and dexamethasone";
    else if (i.neutPct < 50 && ratio < 0.5 && i.protein > 100) pattern = "Tuberculous (or fungal) meningitis pattern: lymphocytes, low glucose, protein over 100: CSF CBNAAT, ADA, cryptococcal antigen; start ATT if likely";
    else if (i.neutPct < 50) pattern = "Viral (aseptic) meningitis pattern: lymphocytes, normal glucose: acyclovir if encephalitis is possible; HSV PCR";
    else pattern = "Mixed or partially treated picture: treat as bacterial until cultures are back";
  }
  if (i.ada !== undefined && i.ada > 10) notes.push(`CSF ADA ${i.ada}: over 10 supports TB meningitis.`);
  return { pattern, corrected, notes };
}
export function synovial(wbc: number): string {
  if (!(wbc >= 0)) return "";
  if (wbc > 50000) return `${wbc}/mm³: septic arthritis likely until proven otherwise (crystals can coexist): Gram stain and culture, IV antibiotics, orthopaedic washout`;
  if (wbc >= 2000) return `${wbc}/mm³: inflammatory: gout, pseudogout (polarised microscopy), rheumatoid, reactive or early septic`;
  return `${wbc}/mm³: non-inflammatory: osteoarthritis, trauma`;
}

/* ================================================================== steroids and the adrenal */

export const STEROID_EQUIV: { id: string; name: string; per5mgPred: number }[] = [
  { id: "pred", name: "Prednisolone", per5mgPred: 5 },
  { id: "hc", name: "Hydrocortisone", per5mgPred: 20 },
  { id: "mp", name: "Methylprednisolone", per5mgPred: 4 },
  { id: "dexa", name: "Dexamethasone", per5mgPred: 0.75 },
  { id: "deflaz", name: "Deflazacort", per5mgPred: 6 },
];
export const toPredEq = (drug: string, mg: number) => { const d = STEROID_EQUIV.find((x) => x.id === drug); return d ? r1((mg / d.per5mgPred) * 5) : 0; };
export function steroidCover(predEq: number, weeks: number, knownAi: boolean, procedure: "none" | "minor" | "moderate" | "major" | "labour"): { atRisk: boolean; plan: string[] } {
  const atRisk = knownAi || (predEq >= 5 && weeks >= 4);
  if (!atRisk) return { atRisk, plan: ["Low risk of adrenal suppression: no extra steroid cover needed; continue the usual dose."] };
  const plan: string[] = [];
  switch (procedure) {
    case "none": plan.push("At risk of adrenal insufficiency: carry a steroid card; double the dose during fever or illness (sick-day rules); injectable hydrocortisone for vomiting."); break;
    case "minor": plan.push("Minor procedure under local anaesthetic: usual morning dose; double the dose for 24 hours if there is pain or delay."); break;
    case "moderate":
    case "major": plan.push("Hydrocortisone 100 mg IV at induction, then 200 mg over 24 hours by continuous infusion (or 50 mg IV/IM 6-hourly) until eating and drinking", `Then double the usual oral dose for ${procedure === "major" ? "up to a week" : "48 hours"}, then return to the usual dose`); break;
    case "labour": plan.push("Labour: hydrocortisone 100 mg IM/IV at the onset of labour, then 200 mg over 24 hours (or 50 mg 6-hourly) until delivery, then double oral dose for 24–48 hours"); break;
  }
  return { atRisk, plan };
}
export function adrenalCrisis(ageYears: number, kg?: number): string[] {
  const hc = ageYears >= 6 ? 100 : ageYears >= 1 ? 50 : 25;
  const fluid = ageYears >= 16 ? "0.9% saline 1 L over the first hour, then by response" : `0.9% saline ${kg ? `${Math.round(20 * kg)} ml` : "20 ml/kg"} bolus, repeat as needed`;
  return [
    `Hydrocortisone ${hc} mg IV or IM immediately${ageYears < 16 ? " (child: under 1 year 25 mg, 1–5 years 50 mg, 6 years or more 100 mg)" : ""}: do not wait for the cortisol result`,
    `Then ${ageYears >= 16 ? "200 mg over 24 hours by infusion (or 50 mg 6-hourly)" : "2 mg/kg 6-hourly"}`,
    fluid,
    "Check glucose (give 10% dextrose if low), sodium and potassium; find the trigger (infection, vomiting, missed doses)",
    "Once stable: double oral dose for 48 hours, then the usual dose; education, steroid card and an emergency injection kit",
  ];
}

/* ================================================================== refeeding */

export interface RefeedIn { bmi: number; lossPct: number; daysLittle: number; lowLytes: boolean; alcohol: boolean }
export function refeedRisk(i: RefeedIn): { level: "low" | "high" | "very high"; startKcal: number; reason: string } {
  if (i.bmi > 0 && i.bmi < 14 || i.daysLittle > 15) return { level: "very high", startKcal: 5, reason: "BMI under 14 or almost no intake for over 15 days" };
  const major = [i.bmi > 0 && i.bmi < 16, i.lossPct > 15, i.daysLittle > 10, i.lowLytes].filter(Boolean).length;
  const minor = [i.bmi > 0 && i.bmi < 18.5, i.lossPct > 10, i.daysLittle > 5, i.alcohol].filter(Boolean).length;
  if (major >= 1 || minor >= 2) return { level: "high", startKcal: 10, reason: major ? "One major criterion (BMI under 16, weight loss over 15%, little intake over 10 days, or low potassium, phosphate or magnesium)" : "Two minor criteria (BMI under 18.5, weight loss over 10%, little intake over 5 days, alcohol or certain drugs)" };
  return { level: "low", startKcal: 25, reason: "No NICE criteria met" };
}
export function refeedRamp(kg: number, startKcal: number, target = 30): { day: number; kcal: number; perKg: number }[] {
  if (!(kg > 0)) return [];
  const days = startKcal >= 25 ? 1 : 7;
  return Array.from({ length: days }, (_, d) => { const perKg = d === days - 1 ? target : Math.round(startKcal + ((target - startKcal) * d) / (days - 1)); return { day: d + 1, perKg, kcal: Math.round(perKg * kg) }; });
}
export const REFEED_CARE = ["Thiamine 200–300 mg daily orally (or IV Pabrinex) before feeding and for the first 10 days, plus a vitamin B complex and a multivitamin", "Potassium, phosphate, magnesium and calcium before feeding and daily for the first week; replace before and during feeding (do not delay feeding to correct them)", "Fluid balance and daily weight; watch for oedema and heart failure; cardiac monitoring if very high risk", "Protein 1.2–1.5 g/kg/day; fluid about 30–35 ml/kg/day"];

/* ================================================================== back pain */

export const BACK_CES = ["New urinary retention, difficulty starting or incontinence", "Numbness in the saddle area (perineum, buttocks, inner thighs)", "Sciatica in both legs", "Faecal incontinence or loss of anal tone", "New sexual dysfunction"];
export const BACK_RED = ["History of cancer, or unexplained weight loss", "Age over 50 with new pain, or under 16", "Fever, IV drug use, immunosuppression, or TB contact (Pott's spine)", "Significant trauma, osteoporosis or long-term steroids", "Progressive leg weakness or foot drop", "Constant, worsening night pain not relieved by lying down", "Thoracic pain"];
export function backPlan(ces: number, red: number, sciatica: boolean): { level: "emergency" | "urgent" | "routine"; steps: string[] } {
  if (ces) return { level: "emergency", steps: ["Suspected cauda equina syndrome: emergency MRI of the lumbosacral spine the same day and immediate spinal surgery referral", "Document perianal sensation, anal tone and post-void residual (bladder scan)", "Do not wait for symptoms to worsen: outcome depends on time to decompression"] };
  if (red) return { level: "urgent", steps: ["Red flag present: MRI (urgent if neurological deficit, infection or cancer suspected), ESR/CRP, CBC, X-ray for fracture", "Spinal TB is common in India: look for gibbus, constitutional symptoms; MRI and biopsy before treatment", "Refer to spine surgery, oncology or infectious disease as appropriate"] };
  return { level: "routine", steps: ["Non-specific low back pain: reassure, stay active, avoid bed rest; no imaging needed", "Short course of an NSAID (with a PPI if at risk) if needed; avoid opioids for chronic pain; paracetamol alone is not recommended", "Exercise programme and physiotherapy; heat; psychological support if distress", ...(sciatica ? ["Sciatica: most improve in 6–12 weeks; neuropathic agents have limited benefit; refer for epidural or surgery if severe, persistent or with deficit"] : []), "Review in 2–4 weeks; safety-net the cauda equina symptoms"] };
}
