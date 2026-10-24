/**
 * Update 29, on the device (no AI): warfarin and DOACs, tropical fevers (malaria, typhoid, scrub
 * typhus, leptospirosis), elderly care (frailty, 4AT, falls, deprescribing), quitting smoking,
 * croup and acute asthma in children, rheumatic fever, weight management and hypoglycaemia.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const half = (n: number) => Math.round(n * 2) / 2;

/* ================================================================== anticoagulation */

export const INR_TARGETS: { id: string; label: string; low: number; high: number }[] = [
  { id: "af", label: "AF, DVT/PE, bioprosthetic valve, rheumatic MS with AF", low: 2, high: 3 },
  { id: "mech-aortic", label: "Mechanical aortic valve (bileaflet, no risk factors)", low: 2, high: 3 },
  { id: "mech-mitral", label: "Mechanical mitral valve, or aortic with risk factors", low: 2.5, high: 3.5 },
  { id: "recurrent", label: "Recurrent VTE while on warfarin in range", low: 3, high: 4 },
];

export interface WarfarinOut { status: "low" | "in" | "high" | "danger"; change: number; newWeekly: number; hold: string; text: string; vitK?: string; schedule: string }
/** Split a weekly dose (mg) over 7 days in half-tablet steps: "5 mg on 5 days, 5.5 mg on 2 days". */
export function weeklySchedule(weekly: number): string {
  if (!(weekly > 0)) return "";
  const base = Math.floor((weekly / 7) * 2) / 2;
  const extra = Math.round((weekly - base * 7) / 0.5);
  if (extra <= 0) return `${base} mg every day`;
  if (extra >= 7) return `${base + 0.5} mg every day`;
  return `${base + 0.5} mg on ${extra} day${extra > 1 ? "s" : ""} (e.g. ${["Mon", "Wed", "Fri", "Sun", "Tue", "Thu", "Sat"].slice(0, extra).join(", ")}) and ${base} mg on the other ${7 - extra}`;
}
/** Maintenance warfarin (or acenocoumarol) change from the INR (ACCP/ACC-style nomogram) and over-anticoagulation. */
export function warfarinAdjust(inr: number, low: number, high: number, weekly: number, bleeding: "none" | "minor" | "major" = "none"): WarfarinOut | null {
  if (!(inr > 0) || !(weekly > 0)) return null;
  const mk = (status: WarfarinOut["status"], change: number, hold: string, text: string, vitK?: string): WarfarinOut => {
    const newWeekly = half(weekly * (1 + change / 100));
    return { status, change, newWeekly, hold, text, vitK, schedule: weeklySchedule(newWeekly) };
  };
  if (bleeding === "major") return mk("danger", -100, "Stop warfarin", "Major bleeding at any INR: stop warfarin, give IV vitamin K 5–10 mg slowly, and 4-factor prothrombin complex concentrate 25–50 IU/kg by INR (or FFP 15 ml/kg if PCC is not available); recheck INR 30 minutes after PCC.", "IV vitamin K 5–10 mg");
  if (inr >= 9) return mk("danger", -20, "Hold until INR is in range", "INR 9 or more, no bleeding: hold warfarin, oral vitamin K 2.5–5 mg, recheck INR in 24 hours; restart at a lower weekly dose.", "Oral vitamin K 2.5–5 mg");
  if (inr >= 5) return mk("high", -15, "Hold 1–2 doses", "INR 5–9, no bleeding: hold 1–2 doses, recheck in 24–48 hours, restart 10–20% lower when in range; oral vitamin K 1–2.5 mg if bleeding risk is high.", bleeding === "minor" ? "Oral vitamin K 1–2.5 mg (minor bleeding)" : undefined);
  if (inr > high + 1) return mk("high", -10, "Hold 1 dose", `INR ${inr} (target ${low}–${high}): hold one dose and reduce the weekly dose by 10%; recheck in 5–7 days.`);
  if (inr > high + 0.5) return mk("high", -10, "Hold 0–1 dose", `INR ${inr}: consider holding one dose; reduce the weekly dose by 10%; recheck in 1 week.`);
  if (inr > high) return mk("high", -5, "No dose held", `INR ${inr}, just above range: reduce the weekly dose by 5–10% (or no change if a single result after a missed-dose error or new drug); recheck in 1–2 weeks.`);
  if (inr >= low) return mk("in", 0, "", `INR ${inr} in range (${low}–${high}): no change; recheck in 4 weeks (up to 12 weeks if stable for months).`);
  if (inr >= low - 0.5) return mk("low", 5, "", `INR ${inr}, just below range: increase the weekly dose by 5–10% (or no change if a single result with a missed dose); recheck in 1–2 weeks.`);
  return mk("low", 15, "", `INR ${inr}, well below range: increase the weekly dose by 10–20%; check adherence and interacting drugs; recheck in 1 week. Consider bridging only if very high clot risk (mechanical mitral valve).`);
}

/** Cockcroft–Gault creatinine clearance (ml/min) from creatinine in mg/dL. */
export function crcl(age: number, kg: number, creatMgdl: number, female: boolean): number | null {
  if (!(age > 0) || !(kg > 0) || !(creatMgdl > 0)) return null;
  return Math.round(((140 - age) * kg * (female ? 0.85 : 1)) / (72 * creatMgdl));
}
export interface DoacIn { age: number; kg: number; creat: number; female: boolean; verapamil?: boolean; bleedRisk?: boolean }
/** DOAC doses for AF by kidney function, age and weight (product labels/EHRA). */
export function doacDoses(i: DoacIn): { drug: string; dose: string; ok: boolean }[] {
  const c = crcl(i.age, i.kg, i.creat, i.female);
  if (c === null) return [];
  const apiReduce = [i.age >= 80, i.kg <= 60, i.creat >= 1.5].filter(Boolean).length >= 2;
  return [
    { drug: "Apixaban", ok: c >= 15, dose: c < 15 ? "Avoid (CrCl under 15)" : apiReduce || c < 30 ? "2.5 mg twice daily" + (apiReduce ? " (two of: age 80+, weight 60 kg or less, creatinine 1.5 mg/dL or more)" : " (CrCl 15–29)") : "5 mg twice daily" },
    { drug: "Rivaroxaban", ok: c >= 15, dose: c < 15 ? "Avoid (CrCl under 15)" : c < 50 ? "15 mg once daily with the evening meal (CrCl 15–49)" : "20 mg once daily with the evening meal" },
    { drug: "Dabigatran", ok: c >= 30, dose: c < 30 ? "Contraindicated (CrCl under 30)" : i.age >= 80 || i.verapamil ? "110 mg twice daily (age 80+ or on verapamil)" : (i.age >= 75 || c < 50) && i.bleedRisk ? "110 mg twice daily (consider: age 75–79 or CrCl 30–50 with high bleeding risk)" : "150 mg twice daily" },
    { drug: "Edoxaban", ok: c >= 15, dose: c < 15 ? "Avoid (CrCl under 15)" : c <= 50 || i.kg <= 60 ? "30 mg once daily (CrCl 15–50 or weight 60 kg or less)" : "60 mg once daily" },
  ];
}
export const doacCrcl = (i: DoacIn) => crcl(i.age, i.kg, i.creat, i.female);
/** When to stop before a procedure (PAUSE protocol) and when to restart. */
export function doacStop(drug: "apixaban" | "rivaroxaban" | "edoxaban" | "dabigatran" | "warfarin", highBleed: boolean, crclMl: number): { stop: string; restart: string } {
  if (drug === "warfarin") return { stop: "Last dose 6 days before (5 days without warfarin); check INR the day before: under 1.5 to proceed (oral vitamin K 1–2 mg if 1.5–1.9). Bridging with LMWH only for very high clot risk (mechanical mitral valve, stroke or VTE in the last 3 months).", restart: "Restart the evening of surgery or the next day at the usual dose if haemostasis is secure." };
  const days = drug === "dabigatran" ? (crclMl < 50 ? (highBleed ? 4 : 2) : highBleed ? 2 : 1) : highBleed ? 2 : 1;
  return {
    stop: `Omit ${days} full day${days > 1 ? "s" : ""} before the procedure (last dose ${days + 1} days before); no bridging.`,
    restart: highBleed ? "Restart 48–72 hours after a high-bleed-risk procedure." : "Restart about 24 hours after a low-bleed-risk procedure.",
  };
}

/* ================================================================== tropical fevers */

export interface MalariaIn { species: "vivax" | "falciparum" | "mixed"; kg: number; ageYears: number; pregnant?: "no" | "t1" | "t2-3"; severe?: boolean; northeast?: boolean; g6pdDeficient?: boolean }
export interface MalariaOut { regimen: string; lines: string[]; notes: string[] }
const tabs = (mg: number, per: number) => r1(mg / per);
/** India NVBDCP treatment by species, weight, age, pregnancy and region. */
export function malariaPlan(i: MalariaIn): MalariaOut | null {
  if (!(i.kg > 0)) return null;
  const notes: string[] = [];
  const noPq = i.pregnant && i.pregnant !== "no" ? "pregnancy" : i.ageYears < 1 ? "infants under 1 year" : i.g6pdDeficient ? "G6PD deficiency (or give 0.75 mg/kg once a week for 8 weeks under supervision)" : "";
  if (i.severe) {
    const per = i.kg < 20 ? 3 : 2.4;
    const dose = r1(per * i.kg);
    return {
      regimen: "Severe malaria: IV artesunate",
      lines: [`Artesunate ${dose} mg IV (${per} mg/kg) at 0, 12 and 24 hours, then once daily until the patient can take tablets (at least 24 hours)`, "Then a full 3-day oral ACT course"],
      notes: ["Check glucose every 4 hours; treat convulsions; transfuse if Hb under 7 g/dL; watch for AKI, ARDS and bleeding.", "If IV artesunate is unavailable: IM artemether 3.2 mg/kg then 1.6 mg/kg daily, or IV quinine 20 mg/kg loading then 10 mg/kg 8-hourly.", "Check for delayed haemolysis 7, 14 and 28 days after artesunate."],
    };
  }
  const cq = (f: number, cap: number) => Math.round(Math.min(cap, f * i.kg));
  const pqDaily = r2(Math.min(15, 0.25 * i.kg));
  if (i.species === "vivax") {
    return {
      regimen: "P. vivax: chloroquine + primaquine",
      lines: [`Chloroquine (base): day 1 ${cq(10, 600)} mg, day 2 ${cq(10, 600)} mg, day 3 ${cq(5, 300)} mg (25 mg/kg in total; 150 mg base per tablet: ${tabs(cq(10, 600), 150)}, ${tabs(cq(10, 600), 150)}, ${tabs(cq(5, 300), 150)} tablets)`, noPq ? `No primaquine (${noPq})${i.pregnant && i.pregnant !== "no" ? "; chloroquine 300 mg base weekly until delivery, then primaquine after breastfeeding ends" : ""}` : `Primaquine ${pqDaily} mg once daily for 14 days (0.25 mg/kg)`],
      notes: ["Chloroquine with food; repeat the dose if vomited within 30 minutes."],
    };
  }
  const t1 = i.pregnant === "t1";
  const lines: string[] = [];
  let regimen: string;
  if (t1) {
    regimen = "P. falciparum, first trimester: quinine + clindamycin";
    lines.push(`Quinine ${Math.round(10 * Math.min(i.kg, 60))} mg (10 mg/kg) three times a day for 7 days, with clindamycin ${Math.round(10 * Math.min(i.kg, 60))} mg (10 mg/kg) twice daily for 7 days`);
    notes.push("WHO 2022 also allows artemether-lumefantrine in the first trimester; follow the state programme.");
  } else if (i.northeast) {
    regimen = "P. falciparum, North-eastern states: artemether-lumefantrine";
    const t = i.kg < 15 ? 1 : i.kg < 25 ? 2 : i.kg < 35 ? 3 : 4;
    lines.push(`Artemether-lumefantrine (20/120 mg): ${t} tablet${t > 1 ? "s" : ""} per dose, 6 doses at 0, 8, 24, 36, 48 and 60 hours, with fatty food or milk`);
  } else {
    regimen = "P. falciparum: artesunate + sulfadoxine-pyrimethamine (ACT-SP)";
    const as = Math.round(Math.min(200, 4 * i.kg));
    const sp = Math.round(Math.min(1500, 25 * i.kg));
    lines.push(`Artesunate ${as} mg once daily for 3 days (4 mg/kg; 50 mg tablets: ${tabs(as, 50)})`, `Sulfadoxine-pyrimethamine on day 1: sulfadoxine ${sp} mg (25 mg/kg; 500/25 mg tablets: ${tabs(sp, 500)})`);
    if (i.ageYears < 1 || i.kg < 5) notes.push("Infants under 5 kg: discuss with a specialist; SP is not used in the first weeks of life.");
  }
  if (i.species === "mixed") lines.push(noPq ? `No primaquine (${noPq})` : `Primaquine ${pqDaily} mg once daily for 14 days (for the vivax)`);
  else lines.push(noPq ? `No single-dose primaquine (${noPq})` : `Primaquine ${r1(Math.min(45, 0.75 * i.kg))} mg once on day 2 (0.75 mg/kg, to stop transmission)`);
  notes.push("Recheck if fever persists after 3 days or the patient worsens; treatment failure needs the alternative ACT.");
  return { regimen, lines, notes };
}
export const SEVERE_MALARIA = ["Impaired consciousness or convulsions", "Prostration (cannot sit or stand)", "Respiratory distress or acidosis", "Shock (SBP under 80, or cold peripheries)", "Jaundice with parasitaemia", "Bleeding, or Hb under 7 g/dL (5 in children)", "Glucose under 40 mg/dL", "Creatinine over 3 mg/dL or urine under 400 ml/day", "Parasitaemia over 5%", "Dark (cola-coloured) urine"];

export interface FeverTests { tests: string[]; think: string[] }
/** Acute undifferentiated fever in India: which tests by the day of fever and the exposures. */
export function feverWorkup(day: number, x: { eschar?: boolean; water?: boolean; rash?: boolean; jaundice?: boolean; travel?: boolean }): FeverTests {
  const tests = ["CBC with platelets", "Malaria rapid test and smear (every fever in an endemic area)"];
  const think: string[] = [];
  if (day <= 5) tests.push("Dengue NS1 antigen (days 1–5)"); else tests.push("Dengue IgM (from day 5)");
  if (day >= 5) tests.push("Blood culture before antibiotics (best in week 1, still worth it later)", "Scrub typhus IgM ELISA (from day 5)", "Leptospira IgM ELISA (from day 5)");
  else tests.push("Blood culture if typhoid is suspected");
  tests.push("Urine routine; LFT and creatinine if unwell");
  if (x.eschar) think.push("Eschar: scrub typhus is likely; start doxycycline without waiting for the test.");
  if (x.water) think.push("Flood water, farm or sewage exposure: leptospirosis; check creatinine, bilirubin and CK.");
  if (x.jaundice) think.push("Fever with jaundice: leptospirosis, malaria, hepatitis A/E, scrub typhus or severe dengue.");
  if (x.rash) think.push("Rash: dengue, chikungunya, measles, rickettsial fever, drug reaction.");
  if (day >= 7) think.push("Fever over a week: typhoid, TB, brucellosis, endocarditis, abscess, lymphoma; Widal is unreliable, use culture.");
  return { tests, think };
}
export const OTHER_FEVERS: { name: string; clues: string; test: string; treat: string[] }[] = [
  { name: "Typhoid (enteric fever)", clues: "Step-ladder fever, headache, abdominal pain, relative bradycardia, coated tongue", test: "Blood culture in week 1 (Widal not reliable)", treat: ["Uncomplicated: azithromycin 20 mg/kg/day (adult 500 mg–1 g) once daily for 7 days, or cefixime 20 mg/kg/day in 2 doses (adult 200 mg twice daily) for 14 days", "Complicated or unable to take tablets: ceftriaxone 2 g IV daily (child 75–100 mg/kg/day) for 10–14 days ± azithromycin", "Avoid ciprofloxacin as first choice (widespread resistance in India)"] },
  { name: "Scrub typhus", clues: "Eschar (armpit, groin, waist), lymph nodes, rural or bush exposure", test: "IgM ELISA from day 5; PCR of the eschar", treat: ["Doxycycline 100 mg twice daily for 7 days (child 2.2 mg/kg twice daily)", "Pregnancy or children: azithromycin 500 mg daily for 5 days (child 10 mg/kg)", "Severe (organ failure): IV doxycycline plus IV azithromycin together (INTREST trial)"] },
  { name: "Leptospirosis", clues: "Flood or field water, calf pain, conjunctival suffusion, jaundice, AKI", test: "IgM ELISA from day 5; MAT", treat: ["Mild: doxycycline 100 mg twice daily for 7 days (or amoxicillin)", "Severe: IV penicillin G 1.5 million units 6-hourly or ceftriaxone 1 g daily for 7 days", "Prophylaxis during flood exposure: doxycycline 200 mg once a week"] },
];

/* ================================================================== elderly care */

export const CFS: { score: number; label: string; text: string }[] = [
  { score: 1, label: "Very fit", text: "Robust, active, energetic; exercises regularly." },
  { score: 2, label: "Fit", text: "No active disease symptoms; exercises occasionally." },
  { score: 3, label: "Managing well", text: "Medical problems well controlled; not regularly active beyond walking." },
  { score: 4, label: "Living with very mild frailty", text: "Not dependent, but symptoms limit activities; 'slowed up' or tired in the day." },
  { score: 5, label: "Living with mild frailty", text: "Needs help with higher-order tasks: finances, transport, heavy housework." },
  { score: 6, label: "Living with moderate frailty", text: "Needs help with all outside activities and housekeeping; help with bathing; trouble with stairs." },
  { score: 7, label: "Living with severe frailty", text: "Completely dependent for personal care, but stable." },
  { score: 8, label: "Living with very severe frailty", text: "Completely dependent and approaching the end of life." },
  { score: 9, label: "Terminally ill", text: "Life expectancy under 6 months, not otherwise frail." },
];
export interface FourAtIn { alert: 0 | 4; amt4: 0 | 1 | 2; months: 0 | 1 | 2; acute: 0 | 4 }
export function fourAt(i: FourAtIn): { score: number; text: string } {
  const s = i.alert + i.amt4 + i.months + i.acute;
  return { score: s, text: s >= 4 ? "4 or more: possible delirium with or without cognitive impairment; look for causes (infection, drugs, retention, constipation, pain, dehydration, hypoxia, glucose, sodium)" : s >= 1 ? "1–3: possible cognitive impairment; assess further" : "0: delirium or severe cognitive impairment unlikely (delirium still possible if the history suggests it)" };
}
export function orthostatic(lyingSys: number, lyingDia: number, standSys: number, standDia: number): { drop: string; positive: boolean } | null {
  if (!(lyingSys > 0 && standSys > 0)) return null;
  const ds = lyingSys - standSys, dd = (lyingDia || 0) - (standDia || 0);
  const positive = ds >= 20 || dd >= 10 || (standSys < 90 && lyingSys >= 90);
  return { drop: `Systolic drop ${ds}, diastolic drop ${dd} mmHg`, positive };
}
export function fallsRisk(fell: boolean, unsteady: boolean, worried: boolean, tugSeconds?: number): { high: boolean; text: string } {
  const screen = fell || unsteady || worried;
  const slow = tugSeconds !== undefined && tugSeconds >= 12;
  return screen || slow
    ? { high: true, text: "At risk of falls: do a multifactorial assessment (medicines, lying and standing BP, vision, feet and footwear, continence, cognition, home hazards, vitamin D and bone health) and refer for strength and balance exercise." }
    : { high: false, text: "Low risk now: advise exercise and rescreen yearly." };
}
export const DEPRESCRIBE: { id: string; label: string; why: string }[] = [
  { id: "benzo", label: "Benzodiazepines or Z-drugs (alprazolam, clonazepam, zolpidem)", why: "Falls, fractures, delirium; taper slowly (10–25% every 2 weeks)." },
  { id: "anticholinergic", label: "Anticholinergics (amitriptyline, chlorpheniramine, oxybutynin, promethazine)", why: "Confusion, constipation, urinary retention, falls; choose alternatives." },
  { id: "ppi", label: "PPI for more than 8 weeks without a clear reason", why: "C. difficile, fractures, low B12 and magnesium; step down or stop." },
  { id: "nsaid", label: "NSAIDs (diclofenac, ibuprofen) regularly", why: "GI bleed, AKI, heart failure, high BP; avoid with eGFR under 50 or with anticoagulants." },
  { id: "su", label: "Glibenclamide or other long-acting sulfonylureas", why: "Prolonged hypoglycaemia; switch to a safer agent; relax targets in the frail (HbA1c 7.5–8.5%)." },
  { id: "antipsychotic", label: "Antipsychotics for behaviour in dementia", why: "Stroke and death; review every 6–12 weeks and try to stop." },
  { id: "aspirin", label: "Aspirin for primary prevention", why: "Bleeding outweighs benefit over 70 without vascular disease." },
  { id: "alpha", label: "Alpha-blockers or several BP drugs with dizziness", why: "Orthostatic hypotension and falls; check lying and standing BP; relax the target." },
  { id: "opioid", label: "Opioids without a laxative", why: "Constipation and delirium; prescribe a regular laxative." },
  { id: "statin", label: "Statin in the last year of life", why: "Little benefit near the end of life; reasonable to stop." },
];

/* ================================================================== smoking */

export interface FtndIn { firstCig: 0 | 1 | 2 | 3; forbidden: 0 | 1; hateFirst: 0 | 1; perDay: 0 | 1 | 2 | 3; morning: 0 | 1; ill: 0 | 1 }
export function ftnd(i: FtndIn): { score: number; level: string } {
  const s = i.firstCig + i.forbidden + i.hateFirst + i.perDay + i.morning + i.ill;
  return { score: s, level: s <= 2 ? "Very low dependence" : s <= 4 ? "Low dependence" : s === 5 ? "Medium dependence" : s <= 7 ? "High dependence" : "Very high dependence" };
}
export function nrtPlan(perDay: number, firstWithin30: boolean): { patch: string[]; short: string[] } {
  const heavy = perDay > 10;
  return {
    patch: heavy ? ["21 mg/24 h patch for 6 weeks", "14 mg/24 h for 2 weeks", "7 mg/24 h for 2 weeks"] : ["14 mg/24 h patch for 6 weeks", "7 mg/24 h for 2 weeks"],
    short: [`Gum or lozenge ${firstWithin30 ? "4 mg" : "2 mg"} (first cigarette ${firstWithin30 ? "within" : "after"} 30 minutes of waking)`, "Weeks 1–6: one every 1–2 hours (at least 9 a day, no more than 24)", "Weeks 7–9: one every 2–4 hours", "Weeks 10–12: one every 4–8 hours", "Chew until tingling, then park between cheek and gum ('chew and park'); no food or drink 15 minutes before"],
  };
}
export const VARENICLINE = ["Start 1–2 weeks before the quit date", "Days 1–3: 0.5 mg once daily", "Days 4–7: 0.5 mg twice daily", "Day 8 to week 12: 1 mg twice daily (with food and water)", "CrCl under 30: 0.5 mg once daily, up to 0.5 mg twice daily", "Nausea is common; vivid dreams; check availability (supply in India has been interrupted)"];
export const BUPROPION = ["Start 1–2 weeks before the quit date", "150 mg once daily for 3 days, then 150 mg twice daily for 7–12 weeks", "Not with seizures, eating disorders, bipolar disorder, MAO inhibitors or abrupt alcohol/benzodiazepine withdrawal"];
export function quitPlanMd(quitDate: string, tobacco: string, nrt: string[]): string {
  return [
    "# Your plan to quit tobacco",
    "",
    `**Quit date:** ${quitDate}`,
    `**What you use now:** ${tobacco}`,
    "",
    "## Before the quit date",
    "- Tell your family and friends; ask them not to offer you tobacco.",
    "- Remove cigarettes, bidis, gutka, lighters and ashtrays from home, work and vehicle.",
    "- Note when and why you use tobacco, and plan what you will do instead.",
    "",
    "## Your medicine",
    ...nrt.map((n) => `- ${n}`),
    "",
    "## When the urge comes",
    "- It passes in 5–10 minutes: delay, drink water, take deep breaths, walk, chew saunf or sugar-free gum.",
    "- Avoid alcohol and the places where you used to smoke for the first weeks.",
    "- Not even one puff. If you slip, do not give up: set a new date.",
    "",
    "## Free help",
    "- National Tobacco Quitline: 1800-112-356 (toll-free)",
    "- mCessation: give a missed call to 011-22901701",
  ].join("\n");
}

/* ================================================================== croup and paediatric asthma */

export interface WestleyIn { conscious: 0 | 5; cyanosis: 0 | 4 | 5; stridor: 0 | 1 | 2; air: 0 | 1 | 2; retractions: 0 | 1 | 2 | 3 }
export function westley(i: WestleyIn): { score: number; band: string; plan: string[] } {
  const s = i.conscious + i.cyanosis + i.stridor + i.air + i.retractions;
  const band = s <= 2 ? "Mild croup" : s <= 5 ? "Moderate croup" : s <= 11 ? "Severe croup" : "Impending respiratory failure";
  const plan = s <= 2 ? ["Oral dexamethasone 0.15 mg/kg once (or prednisolone 1 mg/kg)", "Home with advice if feeding and well; return if stridor at rest"]
    : s <= 5 ? ["Oral dexamethasone 0.15–0.6 mg/kg once", "Nebulised adrenaline if stridor at rest is marked; observe for 2–4 hours afterwards", "Keep the child calm on the parent's lap; no throat examination"]
    : ["Nebulised adrenaline 1:1000, 0.5 ml/kg (maximum 5 ml), repeat if needed", "Dexamethasone 0.6 mg/kg oral or IV (or nebulised budesonide 2 mg)", "Oxygen; call the senior, anaesthetist and ENT; prepare for intubation with a smaller tube"];
  return { score: s, band, plan };
}
export function croupDoses(kg: number): { dexLow: number; dexHigh: number; pred: number; adr: number } | null {
  if (!(kg > 0)) return null;
  return { dexLow: r1(Math.min(16, 0.15 * kg)), dexHigh: r1(Math.min(16, 0.6 * kg)), pred: r1(Math.min(40, kg)), adr: r1(Math.min(5, 0.5 * kg)) };
}
export interface PaedAsthmaIn { age: number; spo2: number; hr: number; rr: number; cantTalk: boolean; accessory: boolean; silentChest: boolean; exhausted: boolean; confused: boolean }
/** Acute asthma severity in children (BTS/SIGN), ages 2–5 and over 5. */
export function paedAsthma(i: PaedAsthmaIn): { level: "moderate" | "severe" | "life"; text: string } {
  const young = i.age < 5;
  const severe = (i.spo2 > 0 && i.spo2 < 92) || i.cantTalk || i.accessory || i.hr > (young ? 140 : 125) || i.rr > (young ? 40 : 30);
  if (i.silentChest || i.exhausted || i.confused) return { level: "life", text: "Life-threatening: silent chest, poor effort, exhaustion, confusion or cyanosis" };
  if (severe) return { level: "severe", text: `Severe: SpO2 under 92%, too breathless to talk or feed, HR over ${young ? 140 : 125} or RR over ${young ? 40 : 30}, or using accessory muscles` };
  return { level: "moderate", text: "Moderate: SpO2 92% or more, able to talk, no severe features" };
}
export function paedAsthmaDoses(kg: number, age: number): string[] {
  if (!(kg > 0)) return [];
  const pred = age < 5 ? 20 : Math.min(40, Math.round(Math.max(30, kg)));
  return [
    `Salbutamol by MDI and spacer: 2–10 puffs, one at a time, inhaling 5 breaths each; repeat every 20–30 minutes`,
    `Nebulised salbutamol ${age < 5 ? "2.5" : "5"} mg with oxygen if severe (back-to-back if life-threatening)`,
    "Nebulised ipratropium 250 micrograms with each salbutamol in the first 2 hours if not responding",
    `Prednisolone ${pred} mg once daily for 3 days (${age < 5 ? "2–5 years: 20 mg" : "over 5 years: 30–40 mg"}); IV hydrocortisone ${Math.round(Math.min(100, 4 * kg))} mg 6-hourly if unable to swallow`,
    `IV magnesium sulphate ${Math.round(Math.min(2000, 40 * kg))} mg (40 mg/kg, maximum 2 g) over 20 minutes if severe and not responding`,
  ];
}

/* ================================================================== rheumatic fever */

export interface JonesIn { highRisk: boolean; gasEvidence: boolean; recurrence: boolean; carditis: boolean; arthritisPoly: boolean; arthritisMono: boolean; polyarthralgia: boolean; chorea: boolean; erythema: boolean; nodules: boolean; monoarthralgia: boolean; fever: boolean; esrCrp: boolean; prolongedPr: boolean }
/** Revised Jones criteria (AHA 2015) for low and moderate/high-risk populations. */
export function jones(i: JonesIn): { majors: string[]; minors: string[]; dx: boolean; text: string } {
  const majors: string[] = [];
  const minors: string[] = [];
  if (i.carditis) majors.push("Carditis (clinical or on echo)");
  if (i.arthritisPoly || (i.highRisk && (i.arthritisMono || i.polyarthralgia))) majors.push(i.highRisk ? "Arthritis (mono or poly) or polyarthralgia" : "Polyarthritis");
  if (i.chorea) majors.push("Chorea");
  if (i.erythema) majors.push("Erythema marginatum");
  if (i.nodules) majors.push("Subcutaneous nodules");
  if (i.highRisk ? i.monoarthralgia : i.polyarthralgia) minors.push(i.highRisk ? "Monoarthralgia" : "Polyarthralgia");
  if (i.fever) minors.push(i.highRisk ? "Fever 38 °C or more" : "Fever 38.5 °C or more");
  if (i.esrCrp) minors.push(i.highRisk ? "ESR 30 or more and/or CRP 3 mg/dL or more" : "ESR 60 or more and/or CRP 3 mg/dL or more");
  if (i.prolongedPr && !i.carditis) minors.push("Prolonged PR interval for age");
  const M = majors.length, m = minors.length;
  const meets = i.recurrence ? M >= 2 || (M >= 1 && m >= 2) || m >= 3 : M >= 2 || (M >= 1 && m >= 2);
  const dx = meets && i.gasEvidence;
  const text = !i.gasEvidence ? "Evidence of a preceding group A streptococcal infection (raised ASO or anti-DNase B, positive throat culture or rapid test) is needed" : dx ? `Meets the Jones criteria for ${i.recurrence ? "recurrent" : "initial"} acute rheumatic fever` : "Does not meet the criteria now; consider echo, repeat ESR/CRP and review (chorea alone is enough once other causes are excluded)";
  return { majors, minors, dx, text };
}
export function rfProphylaxis(kg: number, category: "no-carditis" | "carditis-healed" | "valve-disease", ageAtAttack: number, attackYear: number): { drug: string; until: string; alternatives: string[] } {
  const bpg = kg > 0 && kg < 30 ? "Benzathine penicillin G 600,000 units (6 lakh) deep IM every 3 weeks" : "Benzathine penicillin G 1.2 million units (12 lakh) deep IM every 3 weeks";
  const [yrs, age] = category === "no-carditis" ? [5, 21] : category === "carditis-healed" ? [10, 21] : [10, 40];
  const byYears = attackYear + yrs;
  const byAge = attackYear + Math.max(0, age - ageAtAttack);
  const until = `${Math.max(byYears, byAge)}: ${yrs} years after the last attack or until age ${age}, whichever is longer${category === "valve-disease" ? "; sometimes lifelong in severe valve disease or after valve surgery" : ""}`;
  return { drug: bpg, until, alternatives: ["Penicillin V 250 mg twice daily if injections are refused (less effective)", "Penicillin allergy: erythromycin 250 mg twice daily (or azithromycin)", "Test dose and observation for 30 minutes per local policy; keep adrenaline ready"] };
}
export const RF_ACUTE = [
  "Eradicate streptococci: one dose of benzathine penicillin (or amoxicillin 50 mg/kg once daily, maximum 1 g, for 10 days), then start prophylaxis.",
  "Arthritis and fever: aspirin 50–60 mg/kg/day in 4 doses (up to 80–100) or naproxen 10–20 mg/kg/day; avoid NSAIDs until the diagnosis is clear if arthritis is the only feature.",
  "Carditis with heart failure: bed rest, diuretics, ACE inhibitor; consider prednisolone 1–2 mg/kg/day (maximum 80 mg) for severe carditis.",
  "Chorea: usually self-limiting; valproate or carbamazepine if disabling.",
  "Echo for every patient; register for secondary prophylaxis and dental care.",
];

/* ================================================================== weight management */

export function bmiAsian(kg: number, cm: number): { bmi: number; asian: string; intl: string } | null {
  if (!(kg > 0) || !(cm > 0)) return null;
  const bmi = r1(kg / (cm / 100) ** 2);
  const asian = bmi < 18.5 ? "Underweight" : bmi < 23 ? "Normal" : bmi < 25 ? "Overweight" : bmi < 30 ? "Obesity class I (Asian)" : "Obesity class II (Asian)";
  const intl = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : bmi < 35 ? "Obesity class I" : bmi < 40 ? "Obesity class II" : "Obesity class III";
  return { bmi, asian, intl };
}
export const healthyRange = (cm: number) => (cm > 0 ? [r1(18.5 * (cm / 100) ** 2), r1(22.9 * (cm / 100) ** 2)] : null);
export const waistRisk = (cm: number, female: boolean) => (cm >= (female ? 80 : 90) ? `Abdominal obesity (Asian Indian cut-off ${female ? 80 : 90} cm)` : "Waist within the Asian Indian cut-off");
const ACT = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 } as const;
export type Activity = keyof typeof ACT;
/** Mifflin–St Jeor BMR × activity, and a 500–750 kcal/day deficit with a floor. */
export function energyTarget(kg: number, cm: number, age: number, female: boolean, act: Activity): { bmr: number; tdee: number; target: number } | null {
  if (!(kg > 0 && cm > 0 && age > 0)) return null;
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * age + (female ? -161 : 5));
  const tdee = Math.round(bmr * ACT[act]);
  const target = Math.max(female ? 1200 : 1500, Math.round((tdee - 600) / 50) * 50);
  return { bmr, tdee, target };
}
export function weightOptions(bmi: number, comorbid: boolean): string[] {
  const o = ["Lifestyle for everyone: diet (portion plate: half vegetables, quarter protein, quarter millets or whole grains), 150–300 minutes a week of activity plus strength work twice a week, sleep and stress."];
  if (bmi >= 27.5 || (bmi >= 25 && comorbid)) o.push("Medicines can be added (Asian thresholds, 2.5 below international): orlistat, or a GLP-1 receptor agonist such as semaglutide where available; review at 12 weeks and stop if under 5% loss.");
  if (bmi >= 37.5 || (bmi >= 32.5 && comorbid)) o.push("Refer for a bariatric surgery opinion (Asian thresholds: BMI 37.5 or more, or 32.5 with type 2 diabetes, sleep apnoea or hypertension).");
  o.push("Goal: 5–10% of body weight over 6 months, about 0.5 kg a week; screen for diabetes, BP, lipids, fatty liver and sleep apnoea.");
  return o;
}

/* ================================================================== hypoglycaemia */

export type HypoGroup = "adult" | "child" | "newborn";
export const toMgdlGlucose = (v: number, unit: "mgdl" | "mmol") => (unit === "mmol" ? v * 18 : v);
export interface HypoIn { group: HypoGroup; kg: number; glucose: number; unit: "mgdl" | "mmol"; canSwallow: boolean; ivAccess: boolean; sulfonylurea?: boolean; symptomatic?: boolean }
export function hypoPlan(i: HypoIn): { low: boolean; steps: string[]; after: string[] } | null {
  const g = toMgdlGlucose(i.glucose, i.unit);
  if (!(g > 0)) return null;
  if (i.group === "newborn") {
    const low = g < 47;
    if (!low) return { low, steps: ["Glucose 47 mg/dL (2.6 mmol/L) or more: continue feeds every 3 hours and the monitoring plan."], after: [] };
    const kg = i.kg > 0 ? i.kg : 3;
    const steps = g < 25 || i.symptomatic || !i.canSwallow
      ? [`IV 10% dextrose ${r1(2 * kg)} ml (2 ml/kg) over 5–10 minutes`, `Then 10% dextrose infusion ${r1((60 * kg) / 24)}–${r1((90 * kg) / 24)} ml/hour (60–90 ml/kg/day; GIR about 4–6 mg/kg/min)`, "Recheck glucose 30 minutes after the bolus, then hourly until stable"]
      : [`Buccal 40% dextrose gel ${r1(0.5 * kg)} ml (200 mg/kg), rubbed into the inside of the cheek`, "Then breastfeed (or give expressed milk or formula) at once", "Recheck 30 minutes after the feed; repeat gel once if still low, then IV dextrose"];
    return { low, steps, after: ["Look for causes: prematurity, small for dates, infant of a diabetic mother, sepsis, hypothermia; persistent or recurrent low glucose needs investigation (hyperinsulinism)."] };
  }
  const low = g < 70;
  if (!low) return { low, steps: ["Glucose 70 mg/dL (4 mmol/L) or more: not hypoglycaemic; if symptoms persist look for another cause."], after: [] };
  if (i.group === "child") {
    const kg = i.kg > 0 ? i.kg : 20;
    const steps = i.canSwallow
      ? [`Oral fast-acting glucose ${r1(0.3 * kg)} g (0.3 g/kg): glucose tablets, juice or sugar in water`, "Recheck in 15 minutes; repeat if still under 70 mg/dL", "Then a snack with slower carbohydrate (biscuits, roti) or the next meal"]
      : i.ivAccess
        ? [`IV 10% dextrose ${r1(2 * kg)} ml (2 ml/kg, 0.2 g/kg) over a few minutes`, `Then 10% dextrose infusion; recheck every 15–30 minutes`]
        : [`Glucagon ${kg < 25 ? "0.5 mg" : "1 mg"} IM or SC (${kg < 25 ? "under 25 kg" : "25 kg or more"}), then oral glucose once awake`];
    return { low, steps, after: ["Find the cause: missed meal, extra exercise, insulin dose; adjust the plan; check ketones if unwell."] };
  }
  const steps = i.canSwallow
    ? ["15–20 g fast-acting carbohydrate: 4–5 glucose tablets, 150–200 ml fruit juice, or 3–4 teaspoons of sugar in water", "Recheck after 10–15 minutes; repeat up to 3 times while under 70 mg/dL", "Then 20 g of slower carbohydrate (2 biscuits, a slice of bread or roti) or the next meal"]
    : i.ivAccess
      ? ["IV 10% glucose 150–200 ml over 15 minutes (or 20% glucose 75–100 ml); 25% dextrose 50–100 ml if that is what is available (use a large vein)", "Recheck after 10 minutes; repeat if still under 70 mg/dL", "Then 10% glucose infusion 100 ml/hour if on a sulfonylurea or long-acting insulin"]
      : ["Glucagon 1 mg IM (may not work after alcohol, starvation or a sulfonylurea overdose)", "Recovery position; get IV access; oral glucose once awake"];
  const after = ["Do not omit the next insulin dose in type 1 diabetes; review the dose and the cause.", "Hypoglycaemia on a sulfonylurea can last 24–72 hours: admit, run a glucose infusion and monitor hourly; consider octreotide 50 micrograms SC 6-hourly if recurrent."];
  if (i.sulfonylurea) after.reverse();
  return { low, steps, after };
}
export const gir = (dextrosePct: number, mlPerKgPerDay: number) => r1((dextrosePct * mlPerKgPerDay) / 144);
