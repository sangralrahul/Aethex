/**
 * Clinical calculators for Cadus. Every result comes from the published formula
 * or score below, computed in the browser: no AI is involved, so the numbers are
 * exact and repeatable. Interpretation text follows the cited source.
 */

export type CalcValues = Record<string, number | boolean | string | undefined>;

export type CalcInput =
  | { id: string; kind: "number"; label: string; unit?: string; min?: number; max?: number; step?: number; optional?: boolean; hint?: string }
  | { id: string; kind: "toggle"; label: string; points: number; hint?: string }
  | { id: string; kind: "select"; label: string; options: { value: string; label: string }[] }
  | { id: string; kind: "date"; label: string; hint?: string };

export type CalcLevel = "ok" | "info" | "warn" | "danger";

export interface CalcResult {
  /** The headline number with unit, e.g. "62 mL/min". */
  value: string;
  /** What the number is, e.g. "Creatinine clearance". */
  label: string;
  /** The interpretation band, e.g. "Moderately reduced". */
  band: string;
  level: CalcLevel;
  /** Extra lines: secondary values or the recommended action. */
  details?: string[];
}

export type CalcGroup =
  | "Emergency and critical care"
  | "Cardiology"
  | "Neurology"
  | "Respiratory and blood gases"
  | "Kidney, liver and GI"
  | "Haematology"
  | "Obstetrics and paediatrics"
  | "Fluids and electrolytes"
  | "Body size";

export const CALC_GROUPS: CalcGroup[] = [
  "Emergency and critical care", "Cardiology", "Neurology", "Respiratory and blood gases", "Kidney, liver and GI",
  "Haematology", "Obstetrics and paediatrics", "Fluids and electrolytes", "Body size",
];

export interface Calculator {
  id: string;
  name: string;
  group: CalcGroup;
  desc: string;
  inputs: CalcInput[];
  formula: string;
  source: string;
  /** Words in a question that make this calculator worth suggesting (matched at the start of a word). */
  keywords: string[];
  /** Text that rules a suggestion out, e.g. "EGFR mutation" for the eGFR calculator. */
  exclude?: RegExp;
  compute: (v: CalcValues) => CalcResult | null;
}

const num = (v: CalcValues, id: string): number | null => {
  const x = v[id];
  const n = typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" ? Number(x) : NaN;
  return Number.isFinite(n) ? n : null;
};
const on = (v: CalcValues, id: string) => v[id] === true;
const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};
const fmt = (n: number, dp = 0) => round(n, dp).toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const SEX = { id: "sex", kind: "select" as const, label: "Sex", options: [{ value: "m", label: "Male" }, { value: "f", label: "Female" }] };
/** Sum of the points of the toggles that are on. */
const points = (inputs: CalcInput[], v: CalcValues) =>
  inputs.reduce((s, i) => (i.kind === "toggle" && on(v, i.id) ? s + i.points : s), 0);

/** A YYYY-MM-DD string as a day number (UTC, so time zones and DST never shift it). */
const dayNumber = (s: unknown): number | null => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) return null;
  return Math.floor(t / 86_400_000);
};
const localToday = () => {
  const n = new Date();
  return Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 86_400_000);
};
const dayLabel = (day: number) =>
  new Date(day * 86_400_000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/* ------------------------------------------------------------------ inputs reused by scores */

const CURB65_IN: CalcInput[] = [
  { id: "c", kind: "toggle", label: "New confusion", points: 1 },
  { id: "u", kind: "toggle", label: "Urea above 7 mmol/L", points: 1, hint: "Blood urea above 42 mg/dL, or BUN above 19 mg/dL" },
  { id: "r", kind: "toggle", label: "Respiratory rate 30/min or more", points: 1 },
  { id: "b", kind: "toggle", label: "Systolic BP below 90 or diastolic 60 mmHg or less", points: 1 },
  { id: "a", kind: "toggle", label: "Age 65 or older", points: 1 },
];
const WELLS_IN: CalcInput[] = [
  { id: "dvt", kind: "toggle", label: "Clinical signs of DVT", points: 3 },
  { id: "likely", kind: "toggle", label: "PE is the most likely diagnosis", points: 3 },
  { id: "hr", kind: "toggle", label: "Heart rate above 100/min", points: 1.5 },
  { id: "imm", kind: "toggle", label: "Immobilisation 3+ days or surgery in the last 4 weeks", points: 1.5 },
  { id: "prev", kind: "toggle", label: "Previous DVT or PE", points: 1.5 },
  { id: "hae", kind: "toggle", label: "Haemoptysis", points: 1 },
  { id: "ca", kind: "toggle", label: "Active cancer (treated in the last 6 months or palliative)", points: 1 },
];
const CHADS_TOGGLES: CalcInput[] = [
  { id: "chf", kind: "toggle", label: "Heart failure or LV dysfunction", points: 1 },
  { id: "htn", kind: "toggle", label: "Hypertension", points: 1 },
  { id: "dm", kind: "toggle", label: "Diabetes", points: 1 },
  { id: "stroke", kind: "toggle", label: "Prior stroke, TIA or thromboembolism", points: 2 },
  { id: "vasc", kind: "toggle", label: "Vascular disease (MI, PAD or aortic plaque)", points: 1 },
];
const HASBLED_IN: CalcInput[] = [
  { id: "h", kind: "toggle", label: "Uncontrolled hypertension (systolic above 160)", points: 1 },
  { id: "renal", kind: "toggle", label: "Abnormal renal function (dialysis, transplant or creatinine 2.26 mg/dL or more)", points: 1 },
  { id: "liver", kind: "toggle", label: "Abnormal liver function (cirrhosis, or bilirubin over 2× and AST/ALT over 3× normal)", points: 1 },
  { id: "s", kind: "toggle", label: "Prior stroke", points: 1 },
  { id: "b", kind: "toggle", label: "Major bleeding history or predisposition", points: 1 },
  { id: "l", kind: "toggle", label: "Labile INR", points: 1 },
  { id: "e", kind: "toggle", label: "Age over 65", points: 1 },
  { id: "d", kind: "toggle", label: "Antiplatelets or NSAIDs", points: 1 },
  { id: "alc", kind: "toggle", label: "Alcohol 8 or more drinks a week", points: 1 },
];
const QSOFA_IN: CalcInput[] = [
  { id: "rr", kind: "toggle", label: "Respiratory rate 22/min or more", points: 1 },
  { id: "ms", kind: "toggle", label: "Altered mentation (GCS below 15)", points: 1 },
  { id: "sbp", kind: "toggle", label: "Systolic BP 100 mmHg or less", points: 1 },
];
const ALVARADO_IN: CalcInput[] = [
  { id: "mig", kind: "toggle", label: "Pain migrating to the right iliac fossa", points: 1 },
  { id: "ano", kind: "toggle", label: "Anorexia (or ketonuria)", points: 1 },
  { id: "nv", kind: "toggle", label: "Nausea or vomiting", points: 1 },
  { id: "rif", kind: "toggle", label: "Tenderness in the right iliac fossa", points: 2 },
  { id: "reb", kind: "toggle", label: "Rebound tenderness", points: 1 },
  { id: "temp", kind: "toggle", label: "Temperature 37.3 °C or more", points: 1 },
  { id: "wbc", kind: "toggle", label: "White cell count above 10,000/mm³", points: 2 },
  { id: "shift", kind: "toggle", label: "Neutrophils above 75% (shift to the left)", points: 1 },
];


const WELLS_DVT_IN: CalcInput[] = [
  { id: "ca", kind: "toggle", label: "Active cancer (treatment within 6 months, or palliative)", points: 1 },
  { id: "par", kind: "toggle", label: "Paralysis, paresis or a recent plaster cast on the leg", points: 1 },
  { id: "bed", kind: "toggle", label: "Bedridden 3 days or more, or major surgery within 12 weeks", points: 1 },
  { id: "tend", kind: "toggle", label: "Localised tenderness along the deep veins", points: 1 },
  { id: "leg", kind: "toggle", label: "Entire leg swollen", points: 1 },
  { id: "calf", kind: "toggle", label: "Calf 3 cm or more bigger than the other leg (10 cm below the tibial tuberosity)", points: 1 },
  { id: "pit", kind: "toggle", label: "Pitting oedema confined to the symptomatic leg", points: 1 },
  { id: "coll", kind: "toggle", label: "Collateral superficial (non-varicose) veins", points: 1 },
  { id: "prev", kind: "toggle", label: "Previously documented DVT", points: 1 },
  { id: "alt", kind: "toggle", label: "An alternative diagnosis is at least as likely", points: -2 },
];
const PERC_IN: CalcInput[] = [
  { id: "age", kind: "toggle", label: "Age 50 or older", points: 1 },
  { id: "hr", kind: "toggle", label: "Heart rate 100/min or more", points: 1 },
  { id: "sat", kind: "toggle", label: "SpO₂ below 95% on room air", points: 1 },
  { id: "leg", kind: "toggle", label: "Unilateral leg swelling", points: 1 },
  { id: "hae", kind: "toggle", label: "Haemoptysis", points: 1 },
  { id: "surg", kind: "toggle", label: "Surgery or trauma needing general anaesthesia in the last 4 weeks", points: 1 },
  { id: "prev", kind: "toggle", label: "Previous DVT or PE", points: 1 },
  { id: "horm", kind: "toggle", label: "Oestrogen use (oral contraceptive or HRT)", points: 1 },
];
const CENTOR_IN: CalcInput[] = [
  { id: "exu", kind: "toggle", label: "Tonsillar exudate or swelling", points: 1 },
  { id: "node", kind: "toggle", label: "Tender or swollen anterior cervical lymph nodes", points: 1 },
  { id: "fever", kind: "toggle", label: "Temperature above 38 °C", points: 1 },
  { id: "nocough", kind: "toggle", label: "No cough", points: 1 },
];
const BISAP_IN: CalcInput[] = [
  { id: "bun", kind: "toggle", label: "BUN above 25 mg/dL (blood urea above 53.5 mg/dL)", points: 1 },
  { id: "ms", kind: "toggle", label: "Impaired mental status (GCS below 15)", points: 1 },
  { id: "sirs", kind: "toggle", label: "SIRS (2 or more: temperature below 36 or above 38 °C, pulse above 90, RR above 20, WBC below 4,000 or above 12,000)", points: 1 },
  { id: "age", kind: "toggle", label: "Age above 60", points: 1 },
  { id: "pe", kind: "toggle", label: "Pleural effusion on imaging", points: 1 },
];
const GBS_FLAGS: CalcInput[] = [
  { id: "hr", kind: "toggle", label: "Pulse 100/min or more", points: 1 },
  { id: "mel", kind: "toggle", label: "Melaena", points: 1 },
  { id: "syn", kind: "toggle", label: "Syncope", points: 2 },
  { id: "hep", kind: "toggle", label: "Liver disease", points: 2 },
  { id: "hf", kind: "toggle", label: "Heart failure", points: 2 },
];
const sel = (id: string, label: string, opts: string[], un?: string): CalcInput => ({
  id, kind: "select", label,
  options: [...opts.map((o, i) => ({ value: String(i), label: `${i} ${o}` })), ...(un ? [{ value: "un", label: `UN ${un}` }] : [])],
});
const MOTOR_ARM = ["No drift for 10 seconds", "Drift", "Some effort against gravity", "No effort against gravity", "No movement"];
const MOTOR_LEG = ["No drift for 5 seconds", "Drift", "Some effort against gravity", "No effort against gravity", "No movement"];
const NIHSS_IN: CalcInput[] = [
  sel("loc", "1a Level of consciousness", ["Alert", "Not alert, roused by minor stimulation", "Not alert, needs repeated or painful stimulation", "Unresponsive or reflex responses only"]),
  sel("locq", "1b Questions (month, age)", ["Both correct", "One correct", "Neither correct"]),
  sel("locc", "1c Commands (open and close eyes, grip and release)", ["Both correct", "One correct", "Neither correct"]),
  sel("gaze", "2 Best gaze", ["Normal", "Partial gaze palsy", "Forced deviation"]),
  sel("vis", "3 Visual fields", ["No loss", "Partial hemianopia", "Complete hemianopia", "Bilateral hemianopia (including cortical blindness)"]),
  sel("face", "4 Facial palsy", ["Normal", "Minor", "Partial (lower face)", "Complete (upper and lower face)"]),
  sel("arml", "5a Motor, left arm", MOTOR_ARM, "Amputation or joint fusion (not scored)"),
  sel("armr", "5b Motor, right arm", MOTOR_ARM, "Amputation or joint fusion (not scored)"),
  sel("legl", "6a Motor, left leg", MOTOR_LEG, "Amputation or joint fusion (not scored)"),
  sel("legr", "6b Motor, right leg", MOTOR_LEG, "Amputation or joint fusion (not scored)"),
  sel("atax", "7 Limb ataxia", ["Absent", "Present in one limb", "Present in two limbs"], "Amputation or joint fusion (not scored)"),
  sel("sens", "8 Sensory", ["Normal", "Mild to moderate loss", "Severe or total loss"]),
  sel("lang", "9 Best language", ["No aphasia", "Mild to moderate aphasia", "Severe aphasia", "Mute or global aphasia"]),
  sel("dys", "10 Dysarthria", ["Normal", "Mild to moderate", "Severe (unintelligible or mute)"], "Intubated or other physical barrier (not scored)"),
  sel("ext", "11 Extinction and inattention", ["None", "In one sensory modality", "Profound, or in more than one modality"]),
];
const BURN_FRACTIONS = [
  { value: "0", label: "Not burned" }, { value: "0.25", label: "About a quarter" }, { value: "0.5", label: "About half" },
  { value: "0.75", label: "About three quarters" }, { value: "1", label: "All of it" },
];
/** Share of body surface by age group: under 1, 1-4, 5-9, 10-14, 15, adult (Lund and Browder). */
const BURN_REGIONS: { id: string; label: string; pct: number[] }[] = [
  { id: "head", label: "Head", pct: [19, 17, 13, 11, 9, 7] },
  { id: "neck", label: "Neck", pct: [2, 2, 2, 2, 2, 2] },
  { id: "atrunk", label: "Front of trunk", pct: [13, 13, 13, 13, 13, 13] },
  { id: "ptrunk", label: "Back of trunk", pct: [13, 13, 13, 13, 13, 13] },
  { id: "butt", label: "Buttocks (both)", pct: [5, 5, 5, 5, 5, 5] },
  { id: "gen", label: "Genitalia", pct: [1, 1, 1, 1, 1, 1] },
  { id: "uarm", label: "Upper arms (both)", pct: [8, 8, 8, 8, 8, 8] },
  { id: "farm", label: "Forearms (both)", pct: [6, 6, 6, 6, 6, 6] },
  { id: "hands", label: "Hands (both)", pct: [5, 5, 5, 5, 5, 5] },
  { id: "thighs", label: "Thighs (both)", pct: [11, 13, 16, 17, 18, 19] },
  { id: "legs", label: "Lower legs (both)", pct: [10, 10, 11, 12, 13, 14] },
  { id: "feet", label: "Feet (both)", pct: [7, 7, 7, 7, 7, 7] },
];
const TBW_GROUP: CalcInput = {
  id: "group", kind: "select", label: "Patient",
  options: [
    { value: "m", label: "Adult man (water 60% of weight)" }, { value: "f", label: "Adult woman (50%)" },
    { value: "em", label: "Man 65 or older (50%)" }, { value: "ef", label: "Woman 65 or older (45%)" }, { value: "c", label: "Child (60%)" },
  ],
};
const TBW_FACTOR: Record<string, number> = { m: 0.6, f: 0.5, em: 0.5, ef: 0.45, c: 0.6 };
const FLUIDS: Record<string, { na: number; k: number }> = {
  hts3: { na: 513, k: 0 }, ns: { na: 154, k: 0 }, dns: { na: 154, k: 0 }, rl: { na: 130, k: 4 }, half: { na: 77, k: 0 }, d5: { na: 0, k: 0 },
};

/* ------------------------------------------------------------------ calculators */

export const CALCULATORS: Calculator[] = [
  {
    id: "crcl",
    name: "Creatinine clearance",
    group: "Kidney, liver and GI",
    desc: "Cockcroft-Gault, for renal drug dosing",
    inputs: [
      { id: "age", kind: "number", label: "Age", unit: "years", min: 18, max: 120 },
      { id: "weight", kind: "number", label: "Weight", unit: "kg", min: 20, max: 300, step: 0.1 },
      SEX,
      { id: "scr", kind: "number", label: "Serum creatinine", unit: "mg/dL", min: 0.1, max: 20, step: 0.01 },
    ],
    formula: "CrCl = (140 − age) × weight (kg) ÷ (72 × creatinine mg/dL), × 0.85 if female",
    source: "Cockcroft DW, Gault MH. Nephron 1976;16:31-41",
    keywords: ["creatinine clearance", "crcl", "cockcroft", "renal dose", "renal dosing", "renal adjustment", "dose adjustment", "renally"],
    compute: (v) => {
      const age = num(v, "age"), wt = num(v, "weight"), scr = num(v, "scr");
      if (age === null || wt === null || scr === null || scr <= 0 || wt <= 0 || !v.sex) return null;
      const crcl = ((140 - age) * wt) / (72 * scr) * (v.sex === "f" ? 0.85 : 1);
      const band = crcl >= 60 ? "Normal or mildly reduced" : crcl >= 30 ? "Moderately reduced" : crcl >= 15 ? "Severely reduced" : "Kidney failure range";
      return {
        value: `${fmt(crcl)} mL/min`, label: "Creatinine clearance", band,
        level: crcl >= 60 ? "ok" : crcl >= 30 ? "warn" : "danger",
        details: ["Uses actual body weight. In obesity, many references use ideal or adjusted body weight instead.", "Check each drug's label for its CrCl dosing bands."],
      };
    },
  },
  {
    id: "egfr",
    name: "eGFR (CKD-EPI 2021)",
    group: "Kidney, liver and GI",
    desc: "Race-free eGFR and KDIGO stage",
    inputs: [
      { id: "age", kind: "number", label: "Age", unit: "years", min: 18, max: 120 },
      SEX,
      { id: "scr", kind: "number", label: "Serum creatinine", unit: "mg/dL", min: 0.1, max: 20, step: 0.01 },
    ],
    formula: "eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^age × 1.012 if female (κ 0.7 F / 0.9 M; α −0.241 F / −0.302 M)",
    source: "Inker LA et al. N Engl J Med 2021;385:1737-49; KDIGO 2024 CKD guideline",
    keywords: ["egfr", "ckd", "kidney function", "renal function", "chronic kidney"],
    exclude: /egfr[\s-]*(mutation|mutant|positive|negative|tki|inhibitor|exon|amplif)|nsclc|lung (cancer|adeno)|osimertinib|gefitinib|erlotinib|afatinib/i,
    compute: (v) => {
      const age = num(v, "age"), scr = num(v, "scr");
      if (age === null || scr === null || scr <= 0 || !v.sex) return null;
      const f = v.sex === "f";
      const k = f ? 0.7 : 0.9, a = f ? -0.241 : -0.302;
      const egfr = 142 * Math.min(scr / k, 1) ** a * Math.max(scr / k, 1) ** -1.2 * 0.9938 ** age * (f ? 1.012 : 1);
      const stage = egfr >= 90 ? "G1 (normal or high)" : egfr >= 60 ? "G2 (mildly decreased)" : egfr >= 45 ? "G3a (mildly to moderately decreased)" : egfr >= 30 ? "G3b (moderately to severely decreased)" : egfr >= 15 ? "G4 (severely decreased)" : "G5 (kidney failure)";
      return {
        value: `${fmt(egfr)} mL/min/1.73 m²`, label: "eGFR", band: `Stage ${stage}`,
        level: egfr >= 60 ? "ok" : egfr >= 30 ? "warn" : "danger",
        details: ["A CKD diagnosis needs reduced eGFR or kidney damage for more than 3 months. G1 and G2 count as CKD only with markers of damage such as albuminuria."],
      };
    },
  },
  {
    id: "childpugh",
    name: "Child-Pugh score",
    group: "Kidney, liver and GI",
    desc: "Severity of cirrhosis",
    inputs: [
      { id: "bili", kind: "number", label: "Total bilirubin", unit: "mg/dL", min: 0.1, max: 60, step: 0.1 },
      { id: "alb", kind: "number", label: "Albumin", unit: "g/dL", min: 0.5, max: 7, step: 0.1 },
      { id: "inr", kind: "number", label: "INR", min: 0.5, max: 15, step: 0.01 },
      { id: "asc", kind: "select", label: "Ascites", options: [{ value: "1", label: "None" }, { value: "2", label: "Mild or controlled" }, { value: "3", label: "Moderate to severe" }] },
      { id: "enc", kind: "select", label: "Encephalopathy", options: [{ value: "1", label: "None" }, { value: "2", label: "Grade 1-2 or controlled" }, { value: "3", label: "Grade 3-4" }] },
    ],
    formula: "Bilirubin <2 / 2-3 / >3 mg/dL; albumin >3.5 / 2.8-3.5 / <2.8 g/dL; INR <1.7 / 1.7-2.3 / >2.3; ascites and encephalopathy none / mild / severe. 1 to 3 points each; A 5-6, B 7-9, C 10-15",
    source: "Pugh RN et al. Br J Surg 1973;60:646-9",
    keywords: ["cirrhosis", "child-pugh", "child pugh", "chronic liver disease", "hepatic impairment", "decompensated liver", "liver cirrhosis"],
    compute: (v) => {
      const bili = num(v, "bili"), alb = num(v, "alb"), inr = num(v, "inr"), asc = num(v, "asc"), enc = num(v, "enc");
      if (bili === null || alb === null || inr === null || asc === null || enc === null) return null;
      const pb = bili < 2 ? 1 : bili <= 3 ? 2 : 3;
      const pa = alb > 3.5 ? 1 : alb >= 2.8 ? 2 : 3;
      const pi = inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3;
      const s = pb + pa + pi + asc + enc;
      const cls = s <= 6 ? "A" : s <= 9 ? "B" : "C";
      return {
        value: `${s} points`, label: "Child-Pugh", band: `Class ${cls} (${cls === "A" ? "well compensated" : cls === "B" ? "significant functional compromise" : "decompensated"})`,
        level: cls === "A" ? "ok" : cls === "B" ? "warn" : "danger",
        details: [
          `Points: bilirubin ${pb}, albumin ${pa}, INR ${pi}, ascites ${asc}, encephalopathy ${enc}`,
          "Commonly quoted 1-year survival: class A about 100%, B about 80%, C about 45%.",
          "In primary biliary cholangitis and sclerosing cholangitis, higher bilirubin bands are used (below 4, 4 to 10, above 10 mg/dL).",
        ],
      };
    },
  },
  {
    id: "bmi",
    name: "BMI and body surface area",
    group: "Body size",
    desc: "With Asian (WHO Asia-Pacific) cut-offs",
    inputs: [
      { id: "weight", kind: "number", label: "Weight", unit: "kg", min: 1, max: 350, step: 0.1 },
      { id: "height", kind: "number", label: "Height", unit: "cm", min: 40, max: 250, step: 0.1 },
    ],
    formula: "BMI = weight (kg) ÷ height (m)²; BSA (Mosteller) = √(height cm × weight kg ÷ 3600)",
    source: "WHO Expert Consultation, Lancet 2004;363:157-63; Mosteller RD, N Engl J Med 1987;317:1098",
    keywords: ["bmi", "body mass index", "obesity", "overweight", "bsa", "body surface area"],
    compute: (v) => {
      const wt = num(v, "weight"), ht = num(v, "height");
      if (wt === null || ht === null || ht <= 0 || wt <= 0) return null;
      const bmi = wt / (ht / 100) ** 2;
      const bsa = Math.sqrt((ht * wt) / 3600);
      const band = bmi < 18.5 ? "Underweight" : bmi < 23 ? "Normal (Asian cut-off)" : bmi < 25 ? "Overweight (Asian cut-off 23-24.9)" : bmi < 30 ? "Obese class I (Asian cut-off 25-29.9)" : "Obese class II (Asian cut-off 30 and above)";
      return {
        value: `${fmt(bmi, 1)} kg/m²`, label: "BMI", band,
        level: bmi < 18.5 ? "warn" : bmi < 23 ? "ok" : bmi < 25 ? "warn" : "danger",
        details: [`Body surface area ${fmt(bsa, 2)} m² (Mosteller)`],
      };
    },
  },
  {
    id: "gcs",
    name: "Glasgow Coma Scale",
    group: "Emergency and critical care",
    desc: "Eye, verbal and motor response",
    inputs: [
      { id: "e", kind: "select", label: "Eye opening", options: [
        { value: "4", label: "4 Spontaneous" }, { value: "3", label: "3 To sound" }, { value: "2", label: "2 To pressure" }, { value: "1", label: "1 None" }] },
      { id: "vb", kind: "select", label: "Verbal response", options: [
        { value: "5", label: "5 Oriented" }, { value: "4", label: "4 Confused" }, { value: "3", label: "3 Words" }, { value: "2", label: "2 Sounds" }, { value: "1", label: "1 None" }] },
      { id: "m", kind: "select", label: "Motor response", options: [
        { value: "6", label: "6 Obeys commands" }, { value: "5", label: "5 Localising" }, { value: "4", label: "4 Normal flexion" }, { value: "3", label: "3 Abnormal flexion" }, { value: "2", label: "2 Extension" }, { value: "1", label: "1 None" }] },
    ],
    formula: "GCS = E (1-4) + V (1-5) + M (1-6), total 3 to 15",
    source: "Teasdale G, Jennett B. Lancet 1974;2:81-4; Teasdale G et al. Lancet Neurol 2014",
    keywords: ["gcs", "glasgow", "head injury", "unconscious", "altered sensorium", "coma", "drowsy"],
    compute: (v) => {
      const e = num(v, "e"), vb = num(v, "vb"), m = num(v, "m");
      if (e === null || vb === null || m === null) return null;
      const total = e + vb + m;
      return {
        value: `${total} / 15`, label: `GCS (E${e} V${vb} M${m})`,
        band: total >= 13 ? "Mild (13-15)" : total >= 9 ? "Moderate (9-12)" : "Severe (8 or less)",
        level: total >= 13 ? "ok" : total >= 9 ? "warn" : "danger",
        details: total <= 8 ? ["GCS 8 or less: the airway is at risk. Consider securing it and get senior help."] : ["Report the components (E, V, M) as well as the total."],
      };
    },
  },
  {
    id: "curb65",
    name: "CURB-65",
    group: "Emergency and critical care",
    desc: "Severity of community-acquired pneumonia",
    inputs: CURB65_IN,
    formula: "One point each for Confusion, Urea > 7 mmol/L, Respiratory rate ≥ 30, low Blood pressure, age ≥ 65",
    source: "Lim WS et al. Thorax 2003;58:377-82; BTS and NICE NG138 pneumonia guidance",
    keywords: ["pneumonia", "curb", "community acquired", "community-acquired", "lrti"],
    compute: (v) => {
      const s = points(CURB65_IN, v);
      const band = s <= 1 ? "Low severity" : s === 2 ? "Moderate severity" : "High severity";
      const act = s <= 1 ? "Consider treatment at home, using clinical judgement." : s === 2 ? "Consider hospital-supervised treatment (short stay or admission)." : "Admit to hospital and assess for ICU care, especially with a score of 4 or 5.";
      return { value: `${s} / 5`, label: "CURB-65", band, level: s <= 1 ? "ok" : s === 2 ? "warn" : "danger", details: [act] };
    },
  },
  {
    id: "qsofa",
    name: "qSOFA",
    group: "Emergency and critical care",
    desc: "Bedside risk of poor outcome in infection",
    inputs: QSOFA_IN,
    formula: "One point each, total 0 to 3; 2 or more = high risk",
    source: "Singer M et al. JAMA 2016;315:801-10 (Sepsis-3); Surviving Sepsis Campaign 2021",
    keywords: ["sepsis", "septic shock", "qsofa"],
    compute: (v) => {
      const s = points(QSOFA_IN, v);
      return {
        value: `${s} / 3`, label: "qSOFA", band: s >= 2 ? "High risk of poor outcome" : "Not high risk by qSOFA",
        level: s >= 2 ? "danger" : "info",
        details: [s >= 2 ? "Assess for organ dysfunction (SOFA), take cultures and lactate, and start sepsis care without delay." : "qSOFA should not be used alone to rule out sepsis. Keep reassessing."],
      };
    },
  },
  {
    id: "wells",
    name: "Wells score for PE",
    group: "Emergency and critical care",
    desc: "Pre-test probability of pulmonary embolism",
    inputs: WELLS_IN,
    formula: "Sum of points; more than 4 = PE likely, 4 or less = PE unlikely",
    source: "Wells PS et al. Thromb Haemost 2000;83:416-20; NICE NG158",
    keywords: ["pulmonary embolism", "wells score", "wells criteria"],
    compute: (v) => {
      const s = points(WELLS_IN, v);
      const likely = s > 4;
      return {
        value: `${fmt(s, 1)} points`, label: "Wells (two-level)", band: likely ? "PE likely" : "PE unlikely",
        level: likely ? "danger" : "info",
        details: [likely
          ? "Arrange CT pulmonary angiography (or V/Q scan); consider interim anticoagulation if there is a delay."
          : "Do a D-dimer test. If it is negative, PE is unlikely; if positive, arrange CT pulmonary angiography."],
      };
    },
  },
  {
    id: "alvarado",
    name: "Alvarado score",
    group: "Emergency and critical care",
    desc: "Likelihood of acute appendicitis",
    inputs: ALVARADO_IN,
    formula: "MANTRELS: Migration 1, Anorexia 1, Nausea 1, Tenderness in RIF 2, Rebound 1, Elevated temperature 1, Leucocytosis 2, Shift to the left 1 (total 10)",
    source: "Alvarado A. Ann Emerg Med 1986;15:557-64; Ohle R et al. BMC Med 2011;9:139",
    keywords: ["appendicitis", "appendix", "alvarado", "right iliac fossa", "rif pain", "mcburney"],
    compute: (v) => {
      const s = points(ALVARADO_IN, v);
      const band = s <= 4 ? "Appendicitis unlikely" : s <= 6 ? "Possible (equivocal)" : s <= 8 ? "Probable" : "Very probable";
      const act = s <= 4
        ? "Low risk. Consider other causes, safety-net and review if symptoms persist."
        : s <= 6
          ? "Observe and reassess, and consider imaging (ultrasound first; CT in adults if still unclear)."
          : "High probability: arrange an early surgical review.";
      return {
        value: `${s} / 10`, label: "Alvarado (MANTRELS)", band,
        level: s <= 4 ? "ok" : s <= 6 ? "warn" : "danger",
        details: [act, "The score over-predicts appendicitis in women; use it with clinical judgement and imaging."],
      };
    },
  },
  {
    id: "chads",
    name: "CHA₂DS₂-VASc",
    group: "Cardiology",
    desc: "Stroke risk in atrial fibrillation",
    inputs: [
      { id: "age", kind: "select", label: "Age", options: [{ value: "0", label: "Under 65" }, { value: "1", label: "65-74" }, { value: "2", label: "75 or older" }] },
      SEX,
      ...CHADS_TOGGLES,
    ],
    formula: "C 1, H 1, A₂ (≥75) 2, D 1, S₂ 2, V 1, A (65-74) 1, Sc (female) 1",
    source: "Lip GY et al. Chest 2010;137:263-72; ESC AF guidelines 2020 and 2024",
    keywords: ["atrial fibrillation", "chads", "cha2ds2", "stroke risk", "anticoagulat"],
    compute: (v) => {
      const age = num(v, "age");
      if (age === null || !v.sex) return null;
      const female = v.sex === "f";
      const risk = points(CHADS_TOGGLES, v) + age; // the score without the sex point
      const s = risk + (female ? 1 : 0);
      const band = risk >= 2 ? "Anticoagulation recommended" : risk === 1 ? "Consider anticoagulation" : "Anticoagulation generally not recommended";
      return {
        value: `${s} / 9`, label: "CHA₂DS₂-VASc", band, level: risk >= 2 ? "danger" : risk === 1 ? "warn" : "ok",
        details: [
          "Thresholds: men 2 or more (women 3 or more) recommended; men 1 (women 2) consider.",
          "ESC 2024 uses CHA₂DS₂-VA, which drops the sex point; the recommendation above already ignores it.",
          "Weigh bleeding risk too (HAS-BLED).",
        ],
      };
    },
  },
  {
    id: "hasbled",
    name: "HAS-BLED",
    group: "Cardiology",
    desc: "Bleeding risk on anticoagulation",
    inputs: HASBLED_IN,
    formula: "One point each, total 0 to 9",
    source: "Pisters R et al. Chest 2010;138:1093-100",
    keywords: ["has-bled", "hasbled", "bleeding risk", "anticoagulat"],
    compute: (v) => {
      const s = points(HASBLED_IN, v);
      return {
        value: `${s} / 9`, label: "HAS-BLED", band: s >= 3 ? "High bleeding risk" : "Low to moderate bleeding risk",
        level: s >= 3 ? "warn" : "ok",
        details: ["A high score means correcting modifiable risks (blood pressure, NSAIDs, alcohol, labile INR) and closer review. On its own it is not a reason to withhold anticoagulation."],
      };
    },
  },
  {
    id: "qtc",
    name: "Corrected QT (QTc)",
    group: "Cardiology",
    desc: "Fridericia and Bazett",
    inputs: [
      { id: "qt", kind: "number", label: "QT interval", unit: "ms", min: 150, max: 800 },
      { id: "hr", kind: "number", label: "Heart rate", unit: "beats/min", min: 20, max: 250 },
      SEX,
    ],
    formula: "RR (s) = 60 ÷ HR; Bazett QTc = QT ÷ √RR; Fridericia QTc = QT ÷ ∛RR",
    source: "Bazett HC. Heart 1920;7:353-70; Fridericia LS 1920; AHA/ACCF/HRS 2009",
    keywords: ["qtc", "qt prolong", "qt interval", "torsade", "long qt"],
    compute: (v) => {
      const qt = num(v, "qt"), hr = num(v, "hr");
      if (qt === null || hr === null || hr <= 0 || !v.sex) return null;
      const rr = 60 / hr;
      const baz = qt / Math.sqrt(rr);
      const fri = qt / Math.cbrt(rr);
      const limit = v.sex === "f" ? 460 : 450;
      return {
        value: `${fmt(fri)} ms`, label: "QTc (Fridericia)",
        band: fri >= 500 ? "Markedly prolonged (500 ms or more)" : fri > limit ? "Prolonged" : "Normal",
        level: fri >= 500 ? "danger" : fri > limit ? "warn" : "ok",
        details: [`Bazett ${fmt(baz)} ms (overcorrects at fast heart rates)`, `Upper limit used: ${limit} ms for ${v.sex === "f" ? "women" : "men"}`],
      };
    },
  },
  {
    id: "edd",
    name: "Due date and gestational age",
    group: "Obstetrics and paediatrics",
    desc: "Naegele's rule from the last period",
    inputs: [
      { id: "lmp", kind: "date", label: "First day of the last menstrual period" },
      { id: "cycle", kind: "number", label: "Usual cycle length", unit: "days", min: 21, max: 45, optional: true, hint: "Leave blank for a 28-day cycle" },
    ],
    formula: "EDD = LMP + 280 days + (cycle length − 28) days; gestational age = days since the LMP",
    source: "Naegele's rule; ACOG Committee Opinion 700 (2017), Methods for estimating the due date",
    keywords: ["edd", "due date", "lmp", "gestational age", "naegele", "expected date of delivery", "period of gestation", "weeks pregnant", "pog"],
    compute: (v) => {
      const lmp = dayNumber(v.lmp);
      if (lmp === null) return null;
      const today = typeof v.today === "string" ? dayNumber(v.today) ?? localToday() : localToday();
      const cycle = num(v, "cycle");
      const adjust = cycle !== null && cycle >= 21 && cycle <= 45 ? Math.round(cycle) - 28 : 0;
      const ga = today - lmp - adjust;
      if (today < lmp) return null;
      const edd = lmp + 280 + adjust;
      const w = Math.floor(Math.max(ga, 0) / 7), d = Math.max(ga, 0) % 7;
      const overdue = ga > 294;
      const tri = ga < 98 ? "First trimester" : ga < 196 ? "Second trimester" : "Third trimester";
      return {
        value: dayLabel(edd), label: "Expected date of delivery",
        band: overdue ? `${w} weeks ${d} days: past 42 weeks, check the date` : `${w} weeks ${d} days today · ${tri}`,
        level: overdue ? "warn" : "info",
        details: [
          adjust ? `Adjusted by ${adjust > 0 ? "+" : ""}${adjust} days for a ${Math.round(cycle as number)}-day cycle.` : "Assumes a regular 28-day cycle.",
          "A first-trimester dating scan (crown-rump length) is more accurate: re-date by the scan if it differs from LMP dating by more than 5 days before 9 weeks or more than 7 days from 9 to 13⁶⁄₇ weeks.",
        ],
      };
    },
  },
  {
    id: "apgar",
    name: "Apgar score",
    group: "Obstetrics and paediatrics",
    desc: "Newborn condition at 1 and 5 minutes",
    inputs: [
      { id: "a", kind: "select", label: "Colour", options: [{ value: "0", label: "0 Blue or pale all over" }, { value: "1", label: "1 Pink body, blue hands and feet" }, { value: "2", label: "2 Pink all over" }] },
      { id: "p", kind: "select", label: "Heart rate", options: [{ value: "0", label: "0 Absent" }, { value: "1", label: "1 Below 100/min" }, { value: "2", label: "2 100/min or more" }] },
      { id: "g", kind: "select", label: "Reflex irritability", options: [{ value: "0", label: "0 No response" }, { value: "1", label: "1 Grimace" }, { value: "2", label: "2 Cry, cough or sneeze" }] },
      { id: "t", kind: "select", label: "Muscle tone", options: [{ value: "0", label: "0 Limp" }, { value: "1", label: "1 Some flexion" }, { value: "2", label: "2 Active movement" }] },
      { id: "r", kind: "select", label: "Breathing", options: [{ value: "0", label: "0 Absent" }, { value: "1", label: "1 Slow, irregular or weak cry" }, { value: "2", label: "2 Good, strong cry" }] },
    ],
    formula: "Appearance + Pulse + Grimace + Activity + Respiration, 0 to 2 each (total 0 to 10)",
    source: "Apgar V. Curr Res Anesth Analg 1953;32:260-7; AAP and ACOG Committee Opinion 644 (2015)",
    keywords: ["apgar", "newborn", "neonate at birth", "birth asphyxia", "perinatal asphyxia"],
    compute: (v) => {
      const ids = ["a", "p", "g", "t", "r"];
      const vals = ids.map((id) => num(v, id));
      if (vals.some((x) => x === null)) return null;
      const s = (vals as number[]).reduce((a, b) => a + b, 0);
      return {
        value: `${s} / 10`, label: "Apgar", band: s >= 7 ? "Reassuring (7 to 10)" : s >= 4 ? "Moderately abnormal (4 to 6)" : "Low (0 to 3)",
        level: s >= 7 ? "ok" : s >= 4 ? "warn" : "danger",
        details: [
          "Score at 1 and 5 minutes. If the 5-minute score is below 7, repeat it every 5 minutes up to 20 minutes.",
          "Never wait for the Apgar score to start resuscitation: follow the NRP or NSSK algorithm.",
        ],
      };
    },
  },
  {
    id: "pedsdose",
    name: "Paediatric weight-based dose",
    group: "Obstetrics and paediatrics",
    desc: "mg/kg to a dose, a daily total and mL",
    inputs: [
      { id: "weight", kind: "number", label: "Weight", unit: "kg", min: 0.3, max: 120, step: 0.1 },
      { id: "mgkg", kind: "number", label: "Dose", unit: "mg/kg per dose", min: 0.001, max: 200, step: 0.01, hint: "Take this from your formulary for the drug and indication" },
      { id: "freq", kind: "select", label: "Doses per day", options: ["1", "2", "3", "4", "6"].map((x) => ({ value: x, label: `${x}×` })) },
      { id: "max", kind: "number", label: "Maximum single dose", unit: "mg", min: 0, max: 10000, step: 0.1, optional: true },
      { id: "conc", kind: "number", label: "Strength of the liquid", unit: "mg per 5 mL", min: 0, max: 10000, step: 0.1, optional: true },
    ],
    formula: "Dose = mg/kg × weight, capped at the maximum single dose; volume = dose ÷ (strength per 5 mL) × 5",
    source: "Arithmetic only. Use doses from the National Formulary of India, the BNF for Children or IAP guidance.",
    keywords: ["mg/kg", "paediatric dose", "pediatric dose", "child dose", "syrup", "weight-based", "weight based"],
    compute: (v) => {
      const wt = num(v, "weight"), mgkg = num(v, "mgkg"), freq = num(v, "freq");
      if (wt === null || mgkg === null || freq === null || wt <= 0 || mgkg <= 0) return null;
      const max = num(v, "max"), conc = num(v, "conc");
      const raw = wt * mgkg;
      const capped = max !== null && max > 0 && raw > max;
      const dose = capped ? (max as number) : raw;
      const details = [`Daily total ${fmt(dose * freq, 1)} mg (${freq} doses)`];
      if (capped) details.unshift(`Capped at the maximum single dose (calculated ${fmt(raw, 1)} mg).`);
      if (conc !== null && conc > 0) details.push(`Volume ${fmt((dose / conc) * 5, 1)} mL per dose (${fmt(conc)} mg/5 mL)`);
      return { value: `${fmt(dose, 1)} mg per dose`, label: `${fmt(mgkg, 2)} mg/kg × ${fmt(wt, 1)} kg`, band: capped ? "Capped at the maximum" : "Calculated dose", level: capped ? "warn" : "info", details };
    },
  },
  {
    id: "fluids",
    name: "Maintenance fluids (4-2-1)",
    group: "Obstetrics and paediatrics",
    desc: "Holliday-Segar daily and hourly volume",
    inputs: [{ id: "weight", kind: "number", label: "Weight", unit: "kg", min: 0.5, max: 150, step: 0.1 }],
    formula: "100 mL/kg/day for the first 10 kg, 50 mL/kg/day for the next 10 kg, 20 mL/kg/day above 20 kg (4-2-1 mL/kg/h)",
    source: "Holliday MA, Segar WE. Pediatrics 1957;19:823-32; NICE NG29",
    keywords: ["maintenance fluid", "iv fluid", "holliday", "fluid requirement"],
    compute: (v) => {
      const wt = num(v, "weight");
      if (wt === null || wt <= 0) return null;
      const day = Math.min(wt, 10) * 100 + Math.min(Math.max(wt - 10, 0), 10) * 50 + Math.max(wt - 20, 0) * 20;
      return {
        value: `${fmt(day)} mL/day`, label: "Maintenance volume", band: `${fmt(day / 24, 1)} mL/hour`, level: "info",
        details: ["Use isotonic fluid with glucose for most children (NICE NG29) and adjust for losses, renal function and the risk of hyponatraemia. Adults often need less: about 25-30 mL/kg/day."],
      };
    },
  },
  {
    id: "parkland",
    name: "Parkland formula (burns)",
    group: "Fluids and electrolytes",
    desc: "Crystalloid in the first 24 hours",
    inputs: [
      { id: "weight", kind: "number", label: "Weight", unit: "kg", min: 1, max: 300, step: 0.1 },
      { id: "tbsa", kind: "number", label: "Burn area (partial and full thickness)", unit: "% TBSA", min: 1, max: 100, step: 0.5 },
    ],
    formula: "4 mL × weight (kg) × % TBSA of Ringer's lactate in 24 hours: half in the first 8 hours from the time of the burn, half over the next 16",
    source: "Baxter CR, Shires T. Ann N Y Acad Sci 1968; ISBI practice guidelines 2016",
    keywords: ["burn", "burns", "parkland", "tbsa"],
    compute: (v) => {
      const wt = num(v, "weight"), tbsa = num(v, "tbsa");
      if (wt === null || tbsa === null || wt <= 0 || tbsa <= 0) return null;
      const total = 4 * wt * tbsa;
      return {
        value: `${fmt(total)} mL in 24 h`, label: "Parkland total", band: `${fmt(total / 2)} mL in the first 8 h`, level: "info",
        details: [`Then ${fmt(total / 2)} mL over the next 16 h. Titrate to urine output (0.5 mL/kg/h in adults, 1 mL/kg/h in children). Children also need maintenance fluid.`],
      };
    },
  },
  {
    id: "ca",
    name: "Corrected calcium",
    group: "Fluids and electrolytes",
    desc: "Adjusts total calcium for albumin",
    inputs: [
      { id: "ca", kind: "number", label: "Total calcium", unit: "mg/dL", min: 1, max: 25, step: 0.1 },
      { id: "alb", kind: "number", label: "Albumin", unit: "g/dL", min: 0.5, max: 7, step: 0.1 },
    ],
    formula: "Corrected Ca = measured Ca + 0.8 × (4.0 − albumin g/dL)",
    source: "Payne RB et al. BMJ 1973;4:643-6",
    keywords: ["corrected calcium", "hypocalc", "hypercalc", "serum calcium", "low calcium", "high calcium", "calcium level"],
    compute: (v) => {
      const ca = num(v, "ca"), alb = num(v, "alb");
      if (ca === null || alb === null) return null;
      const c = ca + 0.8 * (4 - alb);
      return {
        value: `${fmt(c, 1)} mg/dL`, label: "Corrected calcium",
        band: c < 8.5 ? "Low" : c <= 10.5 ? "Within 8.5-10.5" : "High",
        level: c < 8.5 || c > 10.5 ? "warn" : "ok",
        details: ["Ionised calcium is more reliable in critical illness, acid-base disturbance and kidney failure."],
      };
    },
  },
  {
    id: "ag",
    name: "Anion gap",
    group: "Fluids and electrolytes",
    desc: "With optional albumin correction",
    inputs: [
      { id: "na", kind: "number", label: "Sodium", unit: "mmol/L", min: 90, max: 200 },
      { id: "cl", kind: "number", label: "Chloride", unit: "mmol/L", min: 50, max: 160 },
      { id: "hco3", kind: "number", label: "Bicarbonate", unit: "mmol/L", min: 1, max: 60 },
      { id: "alb", kind: "number", label: "Albumin", unit: "g/dL", min: 0.5, max: 7, step: 0.1, optional: true },
    ],
    formula: "AG = Na − (Cl + HCO₃); albumin-corrected AG = AG + 2.5 × (4.0 − albumin g/dL)",
    source: "Figge J et al. Crit Care Med 1998;26:1807-10",
    keywords: ["anion gap", "metabolic acidosis", "abg", "dka", "acidosis"],
    compute: (v) => {
      const na = num(v, "na"), cl = num(v, "cl"), hco3 = num(v, "hco3");
      if (na === null || cl === null || hco3 === null) return null;
      const ag = na - (cl + hco3);
      const alb = num(v, "alb");
      const corr = alb !== null ? ag + 2.5 * (4 - alb) : null;
      const use = corr ?? ag;
      return {
        value: `${fmt(ag, 1)} mmol/L`, label: "Anion gap",
        band: use > 12 ? "High anion gap" : use < 4 ? "Low anion gap" : "Normal (about 4-12)",
        level: use > 12 ? "warn" : "ok",
        details: [
          ...(corr !== null ? [`Albumin-corrected ${fmt(corr, 1)} mmol/L`] : []),
          "Reference ranges vary by laboratory. With a high gap, think of lactate, ketones, kidney failure and toxins (methanol, ethylene glycol, salicylates).",
        ],
      };
    },
  },
  {
    id: "na",
    name: "Corrected sodium",
    group: "Fluids and electrolytes",
    desc: "Sodium corrected for high glucose",
    inputs: [
      { id: "na", kind: "number", label: "Measured sodium", unit: "mmol/L", min: 90, max: 200 },
      { id: "glu", kind: "number", label: "Glucose", unit: "mg/dL", min: 20, max: 3000 },
    ],
    formula: "Corrected Na = Na + 1.6 × (glucose − 100) ÷ 100 (Katz); some use 2.4 (Hillier)",
    source: "Katz MA. N Engl J Med 1973;289:843-4; Hillier TA et al. Am J Med 1999",
    keywords: ["corrected sodium", "pseudohyponat", "hyperglycaemi", "hyperglycemi", "dka", "hhs"],
    compute: (v) => {
      const na = num(v, "na"), glu = num(v, "glu");
      if (na === null || glu === null) return null;
      const k = na + (1.6 * (glu - 100)) / 100;
      const h = na + (2.4 * (glu - 100)) / 100;
      return {
        value: `${fmt(k, 1)} mmol/L`, label: "Corrected sodium (Katz)",
        band: k < 135 ? "Low" : k <= 145 ? "Within 135-145" : "High",
        level: k < 135 || k > 145 ? "warn" : "ok",
        details: [`With the Hillier factor (2.4): ${fmt(h, 1)} mmol/L`],
      };
    },
  },
  /* ---------------------------------------------------------------- added in Cadus 3 */
  {
    id: "heart",
    name: "HEART score",
    group: "Cardiology",
    desc: "Chest pain: risk of a major cardiac event in 6 weeks",
    inputs: [
      { id: "h", kind: "select", label: "History", options: [{ value: "0", label: "0 Slightly suspicious" }, { value: "1", label: "1 Moderately suspicious" }, { value: "2", label: "2 Highly suspicious" }] },
      { id: "e", kind: "select", label: "ECG", options: [{ value: "0", label: "0 Normal" }, { value: "1", label: "1 Non-specific repolarisation change (LBBB, LVH, paced, digoxin)" }, { value: "2", label: "2 Significant ST deviation" }] },
      { id: "a", kind: "select", label: "Age", options: [{ value: "0", label: "0 Under 45" }, { value: "1", label: "1 45 to 64" }, { value: "2", label: "2 65 or older" }] },
      { id: "r", kind: "select", label: "Risk factors", options: [{ value: "0", label: "0 None known" }, { value: "1", label: "1 One or two" }, { value: "2", label: "2 Three or more, or known atherosclerotic disease" }] },
      { id: "t", kind: "select", label: "Initial troponin", options: [{ value: "0", label: "0 At or below the normal limit" }, { value: "1", label: "1 One to three times the normal limit" }, { value: "2", label: "2 More than three times the normal limit" }] },
    ],
    formula: "History + ECG + Age + Risk factors (hypertension, diabetes, high cholesterol, smoking, family history, obesity) + Troponin, 0 to 2 each; total 0 to 10",
    source: "Six AJ et al. Neth Heart J 2008;16:191-6; Backus BE et al. Int J Cardiol 2013;168:2153-8",
    keywords: ["chest pain", "heart score", "acs", "acute coronary", "nstemi", "unstable angina", "troponin"],
    compute: (v) => {
      const ids = ["h", "e", "a", "r", "t"];
      const vals = ids.map((id) => num(v, id));
      if (vals.some((x) => x === null)) return null;
      const s = vals.reduce((a, b) => a! + b!, 0)!;
      const band = s <= 3 ? "Low risk (MACE about 1-2% at 6 weeks)" : s <= 6 ? "Moderate risk (MACE about 12-17%)" : "High risk (MACE about 50-65%)";
      const act = s <= 3 ? "Consider early discharge with outpatient follow-up if serial troponins are normal." : s <= 6 ? "Admit for observation, serial troponins and non-invasive testing." : "Treat as acute coronary syndrome and plan an early invasive strategy.";
      return { value: `${s} / 10`, label: "HEART score", band, level: s <= 3 ? "ok" : s <= 6 ? "warn" : "danger", details: [act, "Not for patients with ST elevation, who need immediate reperfusion."] };
    },
  },
  {
    id: "wellsdvt",
    name: "Wells score for DVT",
    group: "Emergency and critical care",
    desc: "Pre-test probability of deep vein thrombosis",
    inputs: WELLS_DVT_IN,
    formula: "One point each for the clinical features listed; minus 2 if an alternative diagnosis is at least as likely",
    source: "Wells PS et al. N Engl J Med 2003;349:1227-35; NICE NG158 (2020)",
    keywords: ["dvt", "deep vein thrombosis", "deep venous thrombosis", "leg swelling", "calf swelling", "swollen leg"],
    compute: (v) => {
      const s = points(WELLS_DVT_IN, v);
      const likely = s >= 2;
      return {
        value: `${s} points`, label: "Wells DVT", band: likely ? "DVT likely" : "DVT unlikely",
        level: likely ? "danger" : "ok",
        details: [
          likely
            ? "Proximal leg vein ultrasound within 4 hours; if that isn't possible, do a D-dimer and give interim anticoagulation (NICE NG158)."
            : "Do a D-dimer. If it is positive, arrange a proximal leg vein ultrasound within 4 hours.",
          `Three-level reading: ${s <= 0 ? "low" : s <= 2 ? "moderate" : "high"} probability (0 or less low, 1-2 moderate, 3 or more high).`,
        ],
      };
    },
  },
  {
    id: "perc",
    name: "PERC rule",
    group: "Emergency and critical care",
    desc: "Rule out pulmonary embolism without testing (low pre-test probability)",
    inputs: PERC_IN,
    formula: "PERC negative only if none of the eight criteria is present",
    source: "Kline JA et al. J Thromb Haemost 2004;2:1247-55; J Thromb Haemost 2008;6:772-80",
    keywords: ["perc", "pe rule out", "pulmonary embolism rule"],
    compute: (v) => {
      const s = points(PERC_IN, v);
      return s === 0
        ? { value: "PERC negative", label: "PERC rule", band: "PE can be ruled out without further testing", level: "ok", details: ["Valid only when your clinical gestalt puts the pre-test probability below 15%."] }
        : { value: `${s} criteri${s === 1 ? "on" : "a"} positive`, label: "PERC rule", band: "PE not ruled out by PERC", level: "warn", details: ["Use the Wells score and a D-dimer or imaging as appropriate."] };
    },
  },
  {
    id: "sofa",
    name: "SOFA score",
    group: "Emergency and critical care",
    desc: "Organ dysfunction in sepsis and critical illness",
    inputs: [
      { id: "resp", kind: "select", label: "Respiration: PaO₂/FiO₂ (mmHg)", options: [{ value: "0", label: "0 400 or more" }, { value: "1", label: "1 Below 400" }, { value: "2", label: "2 Below 300" }, { value: "3", label: "3 Below 200 with respiratory support" }, { value: "4", label: "4 Below 100 with respiratory support" }] },
      { id: "coag", kind: "select", label: "Platelets (×10³/µL)", options: [{ value: "0", label: "0 150 or more" }, { value: "1", label: "1 Below 150" }, { value: "2", label: "2 Below 100" }, { value: "3", label: "3 Below 50" }, { value: "4", label: "4 Below 20" }] },
      { id: "liver", kind: "select", label: "Bilirubin (mg/dL)", options: [{ value: "0", label: "0 Below 1.2" }, { value: "1", label: "1 1.2 to 1.9" }, { value: "2", label: "2 2.0 to 5.9" }, { value: "3", label: "3 6.0 to 11.9" }, { value: "4", label: "4 12 or more" }] },
      { id: "cvs", kind: "select", label: "Cardiovascular (doses in µg/kg/min)", options: [{ value: "0", label: "0 MAP 70 mmHg or more" }, { value: "1", label: "1 MAP below 70 mmHg" }, { value: "2", label: "2 Dopamine 5 or less, or any dobutamine" }, { value: "3", label: "3 Dopamine above 5, or adrenaline or noradrenaline 0.1 or less" }, { value: "4", label: "4 Dopamine above 15, or adrenaline or noradrenaline above 0.1" }] },
      { id: "cns", kind: "select", label: "Glasgow Coma Scale", options: [{ value: "0", label: "0 15" }, { value: "1", label: "1 13 to 14" }, { value: "2", label: "2 10 to 12" }, { value: "3", label: "3 6 to 9" }, { value: "4", label: "4 Below 6" }] },
      { id: "renal", kind: "select", label: "Creatinine (mg/dL) or urine output", options: [{ value: "0", label: "0 Below 1.2" }, { value: "1", label: "1 1.2 to 1.9" }, { value: "2", label: "2 2.0 to 3.4" }, { value: "3", label: "3 3.5 to 4.9, or urine below 500 mL/day" }, { value: "4", label: "4 5.0 or more, or urine below 200 mL/day" }] },
    ],
    formula: "Six organ systems scored 0 to 4 each; total 0 to 24",
    source: "Vincent JL et al. Intensive Care Med 1996;22:707-10; Singer M et al. JAMA 2016;315:801-10 (Sepsis-3)",
    keywords: ["sofa", "sepsis", "septic", "organ failure", "organ dysfunction", "icu", "multi-organ"],
    compute: (v) => {
      const vals = ["resp", "coag", "liver", "cvs", "cns", "renal"].map((id) => num(v, id));
      if (vals.some((x) => x === null)) return null;
      const s = vals.reduce((a, b) => a! + b!, 0)!;
      const band = s <= 1 ? "Minimal organ dysfunction" : s <= 6 ? "Organ dysfunction" : s <= 11 ? "Severe organ dysfunction" : "Very severe organ dysfunction";
      return {
        value: `${s} / 24`, label: "SOFA", band, level: s <= 1 ? "ok" : s <= 6 ? "warn" : "danger",
        details: [
          "Sepsis-3: suspected infection with an acute rise in SOFA of 2 or more points; in-hospital mortality is about 10% or higher.",
          "Track the trend: a rising score over the first 48 hours carries a worse prognosis.",
        ],
      };
    },
  },
  {
    id: "meldna",
    name: "MELD-Na",
    group: "Kidney, liver and GI",
    desc: "Severity of end-stage liver disease (transplant listing)",
    inputs: [
      { id: "cr", kind: "number", label: "Creatinine", unit: "mg/dL", min: 0.1, max: 20, step: 0.01 },
      { id: "bili", kind: "number", label: "Total bilirubin", unit: "mg/dL", min: 0.1, max: 80, step: 0.1 },
      { id: "inr", kind: "number", label: "INR", min: 0.5, max: 20, step: 0.01 },
      { id: "na", kind: "number", label: "Sodium", unit: "mmol/L", min: 100, max: 180 },
      { id: "dial", kind: "toggle", label: "Dialysis twice or more, or 24 h of CVVHD, in the past week", points: 0 },
    ],
    formula: "MELD(i) = 0.957 ln(Cr) + 0.378 ln(bilirubin) + 1.120 ln(INR) + 0.643, rounded to one decimal and × 10; if above 11: MELD-Na = MELD + 1.32 (137 − Na) − 0.033 MELD (137 − Na). Values below 1 set to 1; creatinine capped at 4 (4 on dialysis); sodium bounded 125-137; maximum 40",
    source: "OPTN/UNOS policy (MELD-Na, January 2016); Kim WR et al. N Engl J Med 2008;359:1018-26; Wiesner R et al. Gastroenterology 2003;124:91-6",
    keywords: ["meld", "cirrhosis", "liver transplant", "end-stage liver", "decompensated", "chronic liver disease"],
    compute: (v) => {
      let cr = num(v, "cr"), bili = num(v, "bili"), inr = num(v, "inr"), na = num(v, "na");
      if (cr === null || bili === null || inr === null || na === null || cr <= 0 || bili <= 0 || inr <= 0) return null;
      cr = on(v, "dial") ? 4 : Math.min(4, Math.max(1, cr));
      bili = Math.max(1, bili);
      inr = Math.max(1, inr);
      na = Math.min(137, Math.max(125, na));
      const meldI = round(0.957 * Math.log(cr) + 0.378 * Math.log(bili) + 1.12 * Math.log(inr) + 0.643, 1) * 10;
      const meld = Math.min(40, meldI > 11 ? meldI + 1.32 * (137 - na) - 0.033 * meldI * (137 - na) : meldI);
      const s = Math.round(meld);
      const mort = s <= 9 ? "about 2%" : s <= 19 ? "about 6%" : s <= 29 ? "about 20%" : s <= 39 ? "about 53%" : "about 71%";
      return {
        value: `${s}`, label: "MELD-Na", band: `3-month mortality ${mort}`,
        level: s < 10 ? "ok" : s < 20 ? "warn" : "danger",
        details: [`MELD without sodium: ${Math.round(Math.min(40, meldI))}`, "Refer for liver transplant assessment, usually at MELD 15 or above, or earlier with complications.", "Mortality bands are approximate (Wiesner 2003, original MELD)."],
      };
    },
  },
  {
    id: "nihss",
    name: "NIH Stroke Scale",
    group: "Neurology",
    desc: "Stroke severity at the bedside",
    inputs: NIHSS_IN,
    formula: "Sum of 15 items (consciousness, gaze, visual fields, facial palsy, motor arms and legs, ataxia, sensation, language, dysarthria, extinction); 0 to 42. Untestable limbs (UN) score 0",
    source: "Brott T et al. Stroke 1989;20:864-70; NINDS NIH Stroke Scale; Powers WJ et al. Stroke 2019;50:e344-e418",
    keywords: ["nihss", "stroke", "cva", "hemiparesis", "hemiplegia", "thrombolysis", "thrombectomy", "aphasia", "facial droop"],
    compute: (v) => {
      if (NIHSS_IN.some((i) => v[i.id] === undefined || v[i.id] === "")) return null;
      const s = NIHSS_IN.reduce((a, i) => a + (num(v, i.id) ?? 0), 0);
      const band = s === 0 ? "No stroke symptoms" : s <= 4 ? "Minor stroke" : s <= 15 ? "Moderate stroke" : s <= 20 ? "Moderate to severe stroke" : "Severe stroke";
      return {
        value: `${s} / 42`, label: "NIHSS", band, level: s === 0 ? "ok" : s <= 4 ? "warn" : "danger",
        details: [
          "Decide on thrombolysis with the time since the patient was last known well; a disabling deficit can justify treatment even with a low score.",
          "Mechanical thrombectomy is usually considered for a large-vessel occlusion with NIHSS 6 or more (AHA/ASA 2019).",
        ],
      };
    },
  },
  {
    id: "gbs",
    name: "Glasgow-Blatchford score",
    group: "Kidney, liver and GI",
    desc: "Upper GI bleeding: who can safely go home",
    inputs: [
      { id: "urea", kind: "number", label: "Blood urea", unit: "mg/dL", min: 1, max: 600, hint: "Blood urea, not BUN (BUN × 2.14 = urea)" },
      { id: "hb", kind: "number", label: "Haemoglobin", unit: "g/dL", min: 1, max: 25, step: 0.1 },
      SEX,
      { id: "sbp", kind: "number", label: "Systolic BP", unit: "mmHg", min: 30, max: 300 },
      ...GBS_FLAGS,
    ],
    formula: "Urea (mmol/L = mg/dL ÷ 6.0): 6.5-8 → 2, 8-10 → 3, 10-25 → 4, 25 or more → 6; Hb men 12-13 → 1, 10-12 → 3, below 10 → 6; women 10-12 → 1, below 10 → 6; SBP 100-109 → 1, 90-99 → 2, below 90 → 3; plus the listed features",
    source: "Blatchford O et al. Lancet 2000;356:1318-21; Gralnek IM et al. Endoscopy 2021;53:300-32 (ESGE)",
    keywords: ["upper gi bleed", "ugib", "gi bleed", "haematemesis", "hematemesis", "melaena", "melena", "blatchford", "variceal bleed"],
    compute: (v) => {
      const urea = num(v, "urea"), hb = num(v, "hb"), sbp = num(v, "sbp");
      if (urea === null || hb === null || sbp === null || !v.sex) return null;
      const mmol = urea / 6.006;
      const pu = mmol < 6.5 ? 0 : mmol < 8 ? 2 : mmol < 10 ? 3 : mmol < 25 ? 4 : 6;
      const ph = v.sex === "m" ? (hb >= 13 ? 0 : hb >= 12 ? 1 : hb >= 10 ? 3 : 6) : (hb >= 12 ? 0 : hb >= 10 ? 1 : 6);
      const ps = sbp >= 110 ? 0 : sbp >= 100 ? 1 : sbp >= 90 ? 2 : 3;
      const s = pu + ph + ps + points(GBS_FLAGS, v);
      return {
        value: `${s}`, label: "Glasgow-Blatchford", band: s <= 1 ? "Low risk" : s <= 7 ? "Not low risk" : "High risk",
        level: s <= 1 ? "ok" : s <= 7 ? "warn" : "danger",
        details: [
          s <= 1 ? "A score of 0 or 1 identifies patients who can be considered for outpatient management (ESGE 2021)." : "Admit; endoscopy within 24 hours after resuscitation. Higher scores predict a greater need for transfusion or intervention.",
          `Points: urea ${pu}, haemoglobin ${ph}, systolic BP ${ps}`,
        ],
      };
    },
  },
  {
    id: "centor",
    name: "Centor score (McIsaac)",
    group: "Emergency and critical care",
    desc: "Sore throat: chance of streptococcal pharyngitis",
    inputs: [
      { id: "age", kind: "select", label: "Age", options: [{ value: "1", label: "3 to 14 years (+1)" }, { value: "0", label: "15 to 44 years (0)" }, { value: "-1", label: "45 years or older (−1)" }] },
      ...CENTOR_IN,
    ],
    formula: "One point each for tonsillar exudate or swelling, tender anterior neck nodes, fever above 38 °C and no cough; +1 if aged 3-14, −1 if 45 or older",
    source: "McIsaac WJ et al. CMAJ 1998;158:75-83; JAMA 2004;291:1587-95",
    keywords: ["sore throat", "pharyngitis", "tonsillitis", "strep throat", "centor", "mcisaac"],
    compute: (v) => {
      const age = num(v, "age");
      if (age === null) return null;
      const s = age + points(CENTOR_IN, v);
      const risk = s <= 0 ? "1-2.5%" : s === 1 ? "5-10%" : s === 2 ? "11-17%" : s === 3 ? "28-35%" : "51-53%";
      const act = s <= 1 ? "No throat swab or antibiotic needed." : s <= 3 ? "Do a rapid antigen test or throat culture; give antibiotics only if positive." : "Test, and consider empirical antibiotics (for example penicillin V or amoxicillin) if testing isn't available.";
      return { value: `${s}`, label: "McIsaac score", band: `Streptococcal infection about ${risk}`, level: s <= 1 ? "ok" : s <= 3 ? "warn" : "danger", details: [act] };
    },
  },
  {
    id: "bisap",
    name: "BISAP score",
    group: "Kidney, liver and GI",
    desc: "Acute pancreatitis: in-hospital mortality (first 24 hours)",
    inputs: BISAP_IN,
    formula: "One point each: BUN above 25 mg/dL (blood urea above 53.5 mg/dL), impaired mental status, SIRS, age above 60, pleural effusion",
    source: "Wu BU et al. Gut 2008;57:1698-703",
    keywords: ["pancreatitis", "bisap"],
    compute: (v) => {
      const s = points(BISAP_IN, v);
      const mort = ["below 1%", "below 1%", "about 2%", "about 4%", "about 7%", "about 10%"][s];
      return { value: `${s} / 5`, label: "BISAP", band: `In-hospital mortality ${mort}`, level: s <= 1 ? "ok" : s === 2 ? "warn" : "danger", details: [s >= 3 ? "A score of 3 or more marks a higher risk of organ failure and death: consider HDU or ICU care." : "Reassess at 24 to 48 hours, as pancreatitis can evolve."] };
    },
  },
  {
    id: "bishop",
    name: "Bishop score",
    group: "Obstetrics and paediatrics",
    desc: "Cervical readiness before induction of labour",
    inputs: [
      { id: "dil", kind: "select", label: "Dilatation", options: [{ value: "0", label: "0 Closed" }, { value: "1", label: "1 1-2 cm" }, { value: "2", label: "2 3-4 cm" }, { value: "3", label: "3 5 cm or more" }] },
      { id: "eff", kind: "select", label: "Effacement", options: [{ value: "0", label: "0 0-30%" }, { value: "1", label: "1 40-50%" }, { value: "2", label: "2 60-70%" }, { value: "3", label: "3 80% or more" }] },
      { id: "sta", kind: "select", label: "Station", options: [{ value: "0", label: "0 −3" }, { value: "1", label: "1 −2" }, { value: "2", label: "2 −1 or 0" }, { value: "3", label: "3 +1 or +2" }] },
      { id: "con", kind: "select", label: "Consistency", options: [{ value: "0", label: "0 Firm" }, { value: "1", label: "1 Medium" }, { value: "2", label: "2 Soft" }] },
      { id: "pos", kind: "select", label: "Position", options: [{ value: "0", label: "0 Posterior" }, { value: "1", label: "1 Mid" }, { value: "2", label: "2 Anterior" }] },
    ],
    formula: "Dilatation, effacement and station 0-3 each; consistency and position 0-2 each; total 0 to 13",
    source: "Bishop EH. Obstet Gynecol 1964;24:266-8; ACOG Practice Bulletin 107 (2009); NICE NG207 (2021)",
    keywords: ["bishop", "induction of labour", "induction of labor", "cervical ripening", "iol", "post-dates", "post dates"],
    compute: (v) => {
      const vals = ["dil", "eff", "sta", "con", "pos"].map((id) => num(v, id));
      if (vals.some((x) => x === null)) return null;
      const s = vals.reduce((a, b) => a! + b!, 0)!;
      return s >= 8
        ? { value: `${s} / 13`, label: "Bishop score", band: "Favourable cervix", level: "ok", details: ["Induction is likely to succeed; amniotomy and oxytocin can be used."] }
        : s >= 7
          ? { value: `${s} / 13`, label: "Bishop score", band: "Intermediate", level: "warn", details: ["Consider cervical ripening before oxytocin, according to local protocol."] }
          : { value: `${s} / 13`, label: "Bishop score", band: "Unfavourable cervix", level: "warn", details: ["Ripen the cervix first (for example dinoprostone, misoprostol or a balloon catheter), following local protocol."] };
    },
  },
  {
    id: "burns",
    name: "Burns: total body surface area",
    group: "Emergency and critical care",
    desc: "Lund and Browder chart, adjusted for age",
    inputs: [
      { id: "age", kind: "select", label: "Age", options: [{ value: "0", label: "Under 1 year" }, { value: "1", label: "1 to 4 years" }, { value: "2", label: "5 to 9 years" }, { value: "3", label: "10 to 14 years" }, { value: "4", label: "15 years" }, { value: "5", label: "Adult" }] },
      ...BURN_REGIONS.map((r) => ({ id: r.id, kind: "select" as const, label: r.label, options: BURN_FRACTIONS })),
    ],
    formula: "TBSA = Σ (fraction of each region burned × its share of body surface). Head, thighs and lower legs change with age (Lund and Browder); count partial- and full-thickness burns only",
    source: "Lund CC, Browder NC. Surg Gynecol Obstet 1944;79:352-8; ISBI Practice Guidelines for Burn Care, Burns 2016;42:953-1021",
    keywords: ["burn", "burns", "tbsa", "scald", "lund", "rule of nines"],
    compute: (v) => {
      const age = num(v, "age");
      if (age === null) return null;
      let t = 0;
      for (const r of BURN_REGIONS) t += (num(v, r.id) ?? 0) * r.pct[age];
      const s = round(t, 1);
      const child = age <= 3;
      return {
        value: `${fmt(s, 1)}% TBSA`, label: "Burn area (Lund and Browder)",
        band: s === 0 ? "No area entered" : s < (child ? 10 : 15) ? "Minor to moderate" : s < (child ? 20 : 25) ? "Major burn: formal fluid resuscitation" : "Major burn: burns centre care",
        level: s === 0 ? "info" : s < (child ? 10 : 15) ? "warn" : "danger",
        details: [
          `IV fluid resuscitation is usually needed above ${child ? "10" : "15"}% TBSA; use the Parkland calculator for volumes.`,
          "Don't count simple erythema (superficial burns). The patient's palm with fingers is about 1% of their body surface.",
        ],
      };
    },
  },
  {
    id: "news2",
    name: "NEWS2",
    group: "Emergency and critical care",
    desc: "National Early Warning Score for deterioration on the ward",
    inputs: [
      { id: "rr", kind: "number", label: "Respiratory rate", unit: "/min", min: 1, max: 80 },
      { id: "spo2", kind: "number", label: "SpO₂", unit: "%", min: 40, max: 100 },
      { id: "scale", kind: "select", label: "SpO₂ scale", options: [{ value: "1", label: "Scale 1 (most patients)" }, { value: "2", label: "Scale 2 (target 88-92%, hypercapnic respiratory failure)" }] },
      { id: "o2", kind: "toggle", label: "On supplemental oxygen", points: 2 },
      { id: "sbp", kind: "number", label: "Systolic BP", unit: "mmHg", min: 30, max: 300 },
      { id: "hr", kind: "number", label: "Pulse", unit: "/min", min: 10, max: 250 },
      { id: "cons", kind: "select", label: "Consciousness", options: [{ value: "a", label: "Alert" }, { value: "cvpu", label: "New confusion, or responds only to voice or pain, or unresponsive" }] },
      { id: "temp", kind: "number", label: "Temperature", unit: "°C or °F", min: 25, max: 110, step: 0.1, hint: "Values above 45 are read as °F" },
    ],
    formula: "Each vital sign scores 0-3 against the RCP NEWS2 chart, plus 2 for supplemental oxygen; total 0 to 20",
    source: "Royal College of Physicians. National Early Warning Score (NEWS) 2. London: RCP, 2017",
    keywords: ["news2", "news score", "early warning", "deteriorat", "track and trigger", "vitals"],
    compute: (v) => {
      const rr = num(v, "rr"), sp = num(v, "spo2"), sbp = num(v, "sbp"), hr = num(v, "hr");
      let t = num(v, "temp");
      if (rr === null || sp === null || sbp === null || hr === null || t === null || !v.cons || !v.scale) return null;
      if (t > 45) t = ((t - 32) * 5) / 9;
      const o2 = on(v, "o2");
      const pRR = rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3;
      const pSp = v.scale === "2"
        ? (sp <= 83 ? 3 : sp <= 85 ? 2 : sp <= 87 ? 1 : sp <= 92 || !o2 ? 0 : sp <= 94 ? 1 : sp <= 96 ? 2 : 3)
        : (sp <= 91 ? 3 : sp <= 93 ? 2 : sp <= 95 ? 1 : 0);
      const pO2 = o2 ? 2 : 0;
      const pBP = sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3;
      const pHR = hr <= 40 ? 3 : hr <= 50 ? 1 : hr <= 90 ? 0 : hr <= 110 ? 1 : hr <= 130 ? 2 : 3;
      const pC = v.cons === "cvpu" ? 3 : 0;
      const pT = t <= 35 ? 3 : t <= 36 ? 1 : t <= 38 ? 0 : t <= 39 ? 1 : 2;
      const parts = [pRR, pSp, pBP, pHR, pC, pT];
      const s = parts.reduce((a, b) => a + b, 0) + pO2;
      const red = parts.some((x) => x === 3);
      const band = s >= 7 ? "High clinical risk" : s >= 5 ? "Medium clinical risk" : red ? "Low-medium clinical risk (a single red score)" : "Low clinical risk";
      const act = s >= 7 ? "Emergency response: immediate assessment by a team with critical-care skills; continuous monitoring." : s >= 5 ? "Urgent response: urgent review by a clinician competent in acute illness; observations at least hourly." : red ? "Urgent ward-based review by a clinician; observations at least hourly." : s >= 1 ? "Ward-based response: assessment by a registered nurse; observations at least 4-6 hourly." : "Continue routine monitoring at least 12-hourly.";
      return {
        value: `${s}`, label: "NEWS2", band, level: s >= 7 ? "danger" : s >= 5 || red ? "warn" : s >= 1 ? "info" : "ok",
        details: [act, `Points: RR ${pRR}, SpO₂ ${pSp}, oxygen ${pO2}, BP ${pBP}, pulse ${pHR}, consciousness ${pC}, temperature ${pT} (${fmt(t, 1)} °C)`],
      };
    },
  },
  {
    id: "abcd2",
    name: "ABCD² score",
    group: "Neurology",
    desc: "Stroke risk in the 2 days after a TIA",
    inputs: [
      { id: "age", kind: "toggle", label: "Age 60 or older", points: 1 },
      { id: "bp", kind: "toggle", label: "BP 140/90 mmHg or higher at first assessment", points: 1 },
      { id: "clin", kind: "select", label: "Clinical features", options: [{ value: "0", label: "Other symptoms (0)" }, { value: "1", label: "Speech disturbance without weakness (1)" }, { value: "2", label: "Unilateral weakness (2)" }] },
      { id: "dur", kind: "select", label: "Duration", options: [{ value: "0", label: "Under 10 minutes (0)" }, { value: "1", label: "10 to 59 minutes (1)" }, { value: "2", label: "60 minutes or longer (2)" }] },
      { id: "dm", kind: "toggle", label: "Diabetes", points: 1 },
    ],
    formula: "Age ≥60 (1) + BP ≥140/90 (1) + clinical features (0-2) + duration (0-2) + diabetes (1); 0 to 7",
    source: "Johnston SC et al. Lancet 2007;369:283-92; NICE NG128 (2019)",
    keywords: ["tia", "transient ischaemic", "transient ischemic", "abcd2", "mini stroke"],
    compute: (v) => {
      const c = num(v, "clin"), d = num(v, "dur");
      if (c === null || d === null) return null;
      const s = c + d + (on(v, "age") ? 1 : 0) + (on(v, "bp") ? 1 : 0) + (on(v, "dm") ? 1 : 0);
      const band = s <= 3 ? "Low risk (2-day stroke risk about 1%)" : s <= 5 ? "Moderate risk (about 4%)" : "High risk (about 8%)";
      return {
        value: `${s} / 7`, label: "ABCD²", band, level: s <= 3 ? "warn" : "danger",
        details: ["NICE (NG128) advises against relying on a score: give aspirin 300 mg at once (unless contraindicated) and refer every suspected TIA for specialist assessment within 24 hours."],
      };
    },
  },
  {
    id: "fwd",
    name: "Free water deficit",
    group: "Fluids and electrolytes",
    desc: "Water needed to correct hypernatraemia",
    inputs: [
      { id: "weight", kind: "number", label: "Weight", unit: "kg", min: 1, max: 300, step: 0.1 },
      { id: "na", kind: "number", label: "Serum sodium", unit: "mmol/L", min: 100, max: 200 },
      TBW_GROUP,
    ],
    formula: "Total body water = weight × factor (0.6 adult men and children, 0.5 adult women and older men, 0.45 older women); deficit = TBW × (Na ÷ 140 − 1)",
    source: "Adrogué HJ, Madias NE. N Engl J Med 2000;342:1493-9",
    keywords: ["hypernatraemia", "hypernatremia", "free water", "water deficit"],
    compute: (v) => {
      const wt = num(v, "weight"), na = num(v, "na"), f = TBW_FACTOR[String(v.group)];
      if (wt === null || na === null || !f) return null;
      const tbw = wt * f;
      if (na <= 140) return { value: "None", label: "Free water deficit", band: "Sodium is not raised", level: "ok", details: [`Total body water ${fmt(tbw, 1)} L`] };
      const def = tbw * (na / 140 - 1);
      return {
        value: `${fmt(def, 1)} L`, label: "Free water deficit", band: na >= 160 ? "Severe hypernatraemia" : na > 145 ? "Hypernatraemia" : "High-normal sodium",
        level: na >= 160 ? "danger" : na > 145 ? "warn" : "info",
        details: [`Total body water ${fmt(tbw, 1)} L`, "Replace over 48 to 72 hours plus ongoing losses. In chronic hypernatraemia lower sodium by no more than 10-12 mmol/L in 24 hours (about 0.5 mmol/L per hour)."],
      };
    },
  },
  {
    id: "adrogue",
    name: "Sodium change per litre of fluid",
    group: "Fluids and electrolytes",
    desc: "Adrogué-Madias: expected change in serum sodium",
    inputs: [
      { id: "weight", kind: "number", label: "Weight", unit: "kg", min: 1, max: 300, step: 0.1 },
      { id: "na", kind: "number", label: "Serum sodium", unit: "mmol/L", min: 90, max: 200 },
      TBW_GROUP,
      { id: "fluid", kind: "select", label: "Fluid", options: [{ value: "hts3", label: "3% saline (Na 513)" }, { value: "ns", label: "0.9% saline (Na 154)" }, { value: "dns", label: "5% dextrose in 0.9% saline (Na 154)" }, { value: "rl", label: "Ringer's lactate (Na 130, K 4)" }, { value: "half", label: "0.45% saline (Na 77)" }, { value: "d5", label: "5% dextrose (Na 0)" }] },
      { id: "kadd", kind: "number", label: "Potassium added to each litre", unit: "mmol", min: 0, max: 80, optional: true },
    ],
    formula: "Change in serum Na per litre = (infusate Na + infusate K − serum Na) ÷ (total body water + 1)",
    source: "Adrogué HJ, Madias NE. N Engl J Med 2000;342:1581-9; Verbalis JG et al. Am J Med 2013;126:S1-42",
    keywords: ["hyponatraemia", "hyponatremia", "sodium correction", "hypertonic saline", "3% saline", "adrogue", "adrogué"],
    compute: (v) => {
      const wt = num(v, "weight"), na = num(v, "na"), f = TBW_FACTOR[String(v.group)], fl = FLUIDS[String(v.fluid)];
      if (wt === null || na === null || !f || !fl) return null;
      const tbw = wt * f;
      const d = (fl.na + fl.k + (num(v, "kadd") ?? 0) - na) / (tbw + 1);
      const per8 = d !== 0 ? Math.abs(8 / d) : Infinity;
      return {
        value: `${d >= 0 ? "+" : ""}${fmt(d, 1)} mmol/L`, label: "Change per litre", band: d > 0 ? "Sodium rises" : d < 0 ? "Sodium falls" : "No change",
        level: Math.abs(d) >= 8 ? "danger" : "info",
        details: [
          `Total body water ${fmt(tbw, 1)} L. ${Number.isFinite(per8) ? `About ${fmt(per8, 2)} L would change sodium by 8 mmol/L.` : ""}`.trim(),
          "Chronic hyponatraemia: raise sodium by no more than 8 mmol/L in 24 hours if the risk of osmotic demyelination is high (alcohol, malnutrition, hypokalaemia, liver disease), otherwise 10-12. The formula ignores urine and other losses: recheck sodium every 2 to 4 hours.",
        ],
      };
    },
  },
  {
    id: "aagrad",
    name: "A-a gradient and P/F ratio",
    group: "Respiratory and blood gases",
    desc: "Alveolar-arterial oxygen gradient from an ABG",
    inputs: [
      { id: "fio2", kind: "number", label: "FiO₂", unit: "%", min: 21, max: 100 },
      { id: "pao2", kind: "number", label: "PaO₂", unit: "mmHg", min: 10, max: 700 },
      { id: "paco2", kind: "number", label: "PaCO₂", unit: "mmHg", min: 5, max: 200 },
      { id: "age", kind: "number", label: "Age", unit: "years", min: 1, max: 120 },
      { id: "patm", kind: "number", label: "Atmospheric pressure", unit: "mmHg", min: 400, max: 800, optional: true, hint: "760 at sea level (default); lower at altitude" },
    ],
    formula: "PAO₂ = FiO₂ × (Patm − 47) − PaCO₂ ÷ 0.8; A-a gradient = PAO₂ − PaO₂; expected ≈ age ÷ 4 + 4; P/F = PaO₂ ÷ FiO₂",
    source: "West JB. Respiratory Physiology, 10th ed; ARDS Definition Task Force. JAMA 2012;307:2526-33",
    keywords: ["a-a gradient", "aa gradient", "alveolar-arterial", "hypoxaemia", "hypoxemia", "p/f ratio", "pf ratio", "ards", "abg"],
    compute: (v) => {
      const fio2 = num(v, "fio2"), pao2 = num(v, "pao2"), paco2 = num(v, "paco2"), age = num(v, "age");
      if (fio2 === null || pao2 === null || paco2 === null || age === null) return null;
      const patm = num(v, "patm") ?? 760;
      const f = fio2 / 100;
      const PA = f * (patm - 47) - paco2 / 0.8;
      const grad = PA - pao2;
      const exp = age / 4 + 4;
      const pf = pao2 / f;
      const ards = pf <= 100 ? "severe range (100 or less)" : pf <= 200 ? "moderate range (101-200)" : pf <= 300 ? "mild range (201-300)" : "above 300";
      return {
        value: `${fmt(grad)} mmHg`, label: "A-a gradient", band: grad <= exp ? "Normal for age" : "Raised",
        level: grad <= exp ? "ok" : "warn",
        details: [
          `Expected for age about ${fmt(exp)} mmHg (on room air). PAO₂ ${fmt(PA)} mmHg.`,
          grad <= exp ? "Hypoxaemia with a normal gradient points to hypoventilation or low inspired oxygen." : "A raised gradient points to V/Q mismatch, shunt or a diffusion problem.",
          `P/F ratio ${fmt(pf)}: ${ards}. ARDS (Berlin) also needs PEEP 5 cmH₂O or more, onset within a week and bilateral opacities not fully explained by heart failure.`,
        ],
      };
    },
  },
  {
    id: "osmgap",
    name: "Osmolal gap",
    group: "Fluids and electrolytes",
    desc: "Screen for toxic alcohols (methanol, ethylene glycol)",
    inputs: [
      { id: "meas", kind: "number", label: "Measured osmolality", unit: "mOsm/kg", min: 200, max: 500 },
      { id: "na", kind: "number", label: "Sodium", unit: "mmol/L", min: 90, max: 200 },
      { id: "glu", kind: "number", label: "Glucose", unit: "mg/dL", min: 10, max: 3000 },
      { id: "urea", kind: "number", label: "Blood urea", unit: "mg/dL", min: 1, max: 600 },
      { id: "etoh", kind: "number", label: "Ethanol", unit: "mg/dL", min: 0, max: 800, optional: true },
    ],
    formula: "Calculated osmolality = 2 Na + glucose ÷ 18 + urea ÷ 6 (+ ethanol ÷ 3.7); gap = measured − calculated",
    source: "Kraut JA, Xing SX. Am J Kidney Dis 2011;58:480-4",
    keywords: ["osmolal gap", "osmolar gap", "methanol", "ethylene glycol", "toxic alcohol", "hooch", "spurious liquor"],
    compute: (v) => {
      const meas = num(v, "meas"), na = num(v, "na"), glu = num(v, "glu"), urea = num(v, "urea");
      if (meas === null || na === null || glu === null || urea === null) return null;
      const calc = 2 * na + glu / 18 + urea / 6 + (num(v, "etoh") ?? 0) / 3.7;
      const gap = meas - calc;
      return {
        value: `${fmt(gap)} mOsm/kg`, label: "Osmolal gap", band: gap > 10 ? "Raised (above 10)" : "Normal (10 or less)",
        level: gap > 20 ? "danger" : gap > 10 ? "warn" : "ok",
        details: [`Calculated osmolality ${fmt(calc)} mOsm/kg`, "A raised gap with a high anion gap acidosis suggests methanol or ethylene glycol poisoning. A normal gap doesn't exclude late presentation, when the alcohol is already metabolised."],
      };
    },
  },
  {
    id: "map",
    name: "Mean arterial pressure",
    group: "Cardiology",
    desc: "MAP and pulse pressure",
    inputs: [
      { id: "sbp", kind: "number", label: "Systolic BP", unit: "mmHg", min: 30, max: 300 },
      { id: "dbp", kind: "number", label: "Diastolic BP", unit: "mmHg", min: 10, max: 200 },
    ],
    formula: "MAP = DBP + (SBP − DBP) ÷ 3",
    source: "Evans L et al. Surviving Sepsis Campaign guidelines 2021. Crit Care Med 2021;49:e1063-143",
    keywords: ["mean arterial pressure", "map target", "hypotension", "septic shock", "vasopressor"],
    compute: (v) => {
      const s = num(v, "sbp"), d = num(v, "dbp");
      if (s === null || d === null || d >= s) return null;
      const map = d + (s - d) / 3;
      return {
        value: `${fmt(map)} mmHg`, label: "MAP", band: map < 65 ? "Below 65 mmHg" : map <= 100 ? "65 to 100 mmHg" : "Above 100 mmHg",
        level: map < 65 ? "danger" : map <= 100 ? "ok" : "warn",
        details: [`Pulse pressure ${fmt(s - d)} mmHg`, "In septic shock the initial target is a MAP of 65 mmHg (Surviving Sepsis Campaign 2021)."],
      };
    },
  },
  {
    id: "ibw",
    name: "Ideal body weight and tidal volume",
    group: "Body size",
    desc: "Devine IBW, adjusted weight and lung-protective tidal volume",
    inputs: [
      { id: "height", kind: "number", label: "Height", unit: "cm", min: 100, max: 250, step: 0.1 },
      SEX,
      { id: "weight", kind: "number", label: "Actual weight", unit: "kg", min: 20, max: 300, step: 0.1, optional: true },
    ],
    formula: "IBW (Devine) = 50 (men) or 45.5 (women) + 0.91 × (height cm − 152.4); adjusted weight = IBW + 0.4 × (actual − IBW); tidal volume 6 mL/kg IBW (range 4-8)",
    source: "Devine BJ. Drug Intell Clin Pharm 1974;8:650-5; ARDS Network. N Engl J Med 2000;342:1301-8",
    keywords: ["ideal body weight", "ibw", "predicted body weight", "tidal volume", "adjusted body weight", "ventilator setting"],
    compute: (v) => {
      const h = num(v, "height");
      if (h === null || !v.sex) return null;
      const ibw = (v.sex === "m" ? 50 : 45.5) + 0.91 * (h - 152.4);
      if (ibw <= 0) return null;
      const wt = num(v, "weight");
      const adj = wt !== null && wt > 1.2 * ibw ? ibw + 0.4 * (wt - ibw) : null;
      return {
        value: `${fmt(ibw, 1)} kg`, label: "Ideal body weight", band: wt !== null ? `Actual weight is ${fmt((wt / ibw) * 100)}% of ideal` : "Devine formula",
        level: "info",
        details: [
          `Tidal volume at 6 mL/kg: ${fmt(ibw * 6)} mL (4-8 mL/kg: ${fmt(ibw * 4)}-${fmt(ibw * 8)} mL)`,
          ...(adj !== null ? [`Adjusted body weight ${fmt(adj, 1)} kg (used for some drug doses in obesity, such as aminoglycosides)`] : []),
          "Not reliable for heights below about 152 cm.",
        ],
      };
    },
  },
  {
    id: "rpi",
    name: "Reticulocyte production index",
    group: "Haematology",
    desc: "Is the marrow responding to anaemia?",
    inputs: [
      { id: "ret", kind: "number", label: "Reticulocytes", unit: "%", min: 0, max: 60, step: 0.1 },
      { id: "hct", kind: "number", label: "Haematocrit (PCV)", unit: "%", min: 5, max: 70, step: 0.1 },
    ],
    formula: "Corrected reticulocytes = retic % × Hct ÷ 45; RPI = corrected ÷ maturation time (1.0 for Hct 40% or more, 1.5 for 30-39, 2.0 for 20-29, 2.5 below 20)",
    source: "Hillman RS, Finch CA. Red Cell Manual, 7th ed. FA Davis, 1996",
    keywords: ["reticulocyte", "rpi", "haemolysis", "hemolysis", "anaemia workup", "anemia workup"],
    compute: (v) => {
      const r = num(v, "ret"), hct = num(v, "hct");
      if (r === null || hct === null) return null;
      const corr = (r * hct) / 45;
      const mt = hct >= 40 ? 1 : hct >= 30 ? 1.5 : hct >= 20 ? 2 : 2.5;
      const rpi = corr / mt;
      return {
        value: fmt(rpi, 2), label: "RPI",
        band: rpi < 2 ? "Inadequate marrow response" : rpi <= 3 ? "Borderline response" : "Adequate marrow response",
        level: rpi < 2 ? "warn" : "info",
        details: [
          `Corrected reticulocyte count ${fmt(corr, 1)}%; maturation time ${mt} days`,
          rpi < 2 ? "Hypoproliferative anaemia: think of iron, B12 or folate deficiency, CKD, inflammation or marrow failure." : "With anaemia this suggests haemolysis or blood loss.",
        ],
      };
    },
  },
  {
    id: "maddrey",
    name: "Maddrey discriminant function",
    group: "Kidney, liver and GI",
    desc: "Severity of alcohol-related hepatitis",
    inputs: [
      { id: "pt", kind: "number", label: "Prothrombin time", unit: "s", min: 5, max: 200, step: 0.1 },
      { id: "ctl", kind: "number", label: "Control prothrombin time", unit: "s", min: 5, max: 40, step: 0.1 },
      { id: "bili", kind: "number", label: "Total bilirubin", unit: "mg/dL", min: 0.1, max: 80, step: 0.1 },
    ],
    formula: "DF = 4.6 × (patient PT − control PT) + bilirubin (mg/dL)",
    source: "Maddrey WC et al. Gastroenterology 1978;75:193-9; Crabb DW et al. Hepatology 2020;71:306-33 (AASLD)",
    keywords: ["alcoholic hepatitis", "alcohol-related hepatitis", "maddrey", "discriminant function"],
    compute: (v) => {
      const pt = num(v, "pt"), ctl = num(v, "ctl"), b = num(v, "bili");
      if (pt === null || ctl === null || b === null) return null;
      const df = 4.6 * (pt - ctl) + b;
      return df >= 32
        ? { value: fmt(df, 1), label: "Maddrey DF", band: "Severe (32 or more)", level: "danger", details: ["Consider prednisolone 40 mg daily for 28 days if there is no contraindication (active infection, GI bleeding, kidney failure); reassess with the Lille score on day 7.", "Calculate MELD as well: a MELD above 20 also marks severe disease."] }
        : { value: fmt(df, 1), label: "Maddrey DF", band: "Not severe (below 32)", level: "warn", details: ["Supportive care, abstinence and nutrition; steroids are not indicated on this score."] };
    },
  },
  {
    id: "fib4",
    name: "FIB-4 index",
    group: "Kidney, liver and GI",
    desc: "Advanced liver fibrosis in fatty liver disease and hepatitis",
    inputs: [
      { id: "age", kind: "number", label: "Age", unit: "years", min: 18, max: 110 },
      { id: "ast", kind: "number", label: "AST (SGOT)", unit: "U/L", min: 1, max: 5000 },
      { id: "alt", kind: "number", label: "ALT (SGPT)", unit: "U/L", min: 1, max: 5000 },
      { id: "plt", kind: "number", label: "Platelets", unit: "×10³/µL", min: 1, max: 2000, hint: "1.5 lakh/µL = 150" },
    ],
    formula: "FIB-4 = age × AST ÷ (platelets [×10⁹/L] × √ALT)",
    source: "Sterling RK et al. Hepatology 2006;43:1317-25; McPherson S et al. Am J Gastroenterol 2017;112:740-51; Rinella ME et al. Hepatology 2023;77:1797-1835 (AASLD)",
    keywords: ["fib-4", "fib4", "fatty liver", "nafld", "masld", "nash", "mash", "liver fibrosis"],
    compute: (v) => {
      const age = num(v, "age"), ast = num(v, "ast"), alt = num(v, "alt"), plt = num(v, "plt");
      if (age === null || ast === null || alt === null || plt === null || plt <= 0 || alt <= 0) return null;
      const f = (age * ast) / (plt * Math.sqrt(alt));
      const low = age >= 65 ? 2.0 : 1.3;
      return {
        value: fmt(f, 2), label: "FIB-4",
        band: f < low ? "Low risk of advanced fibrosis" : f <= 2.67 ? "Indeterminate" : "High risk of advanced fibrosis",
        level: f < low ? "ok" : f <= 2.67 ? "warn" : "danger",
        details: [
          f < low ? "Repeat in 1 to 3 years if risk factors persist." : f <= 2.67 ? "Arrange liver stiffness measurement (transient elastography) or ELF testing." : "Refer to hepatology for assessment of advanced fibrosis or cirrhosis.",
          `Lower cut-off ${low}${age >= 65 ? " (age 65 or older)" : ""}; not validated below age 35.`,
        ],
      };
    },
  },
  {
    id: "ldl",
    name: "LDL cholesterol (Friedewald)",
    group: "Cardiology",
    desc: "Calculated LDL and non-HDL cholesterol",
    inputs: [
      { id: "tc", kind: "number", label: "Total cholesterol", unit: "mg/dL", min: 50, max: 1000 },
      { id: "hdl", kind: "number", label: "HDL cholesterol", unit: "mg/dL", min: 5, max: 200 },
      { id: "tg", kind: "number", label: "Triglycerides", unit: "mg/dL", min: 10, max: 5000 },
    ],
    formula: "LDL = total cholesterol − HDL − triglycerides ÷ 5 (mg/dL); not valid when triglycerides are 400 mg/dL or more",
    source: "Friedewald WT et al. Clin Chem 1972;18:499-502; Mach F et al. Eur Heart J 2020;41:111-88 (ESC/EAS)",
    keywords: ["ldl", "cholesterol", "lipid profile", "dyslipidaemia", "dyslipidemia", "statin"],
    compute: (v) => {
      const tc = num(v, "tc"), hdl = num(v, "hdl"), tg = num(v, "tg");
      if (tc === null || hdl === null || tg === null) return null;
      const nonhdl = tc - hdl;
      if (tg >= 400) return { value: "Not valid", label: "LDL (Friedewald)", band: "Triglycerides 400 mg/dL or more", level: "warn", details: [`Non-HDL cholesterol ${fmt(nonhdl)} mg/dL`, "Measure LDL directly."] };
      const ldl = tc - hdl - tg / 5;
      return {
        value: `${fmt(ldl)} mg/dL`, label: "LDL cholesterol",
        band: ldl < 100 ? "Optimal (below 100)" : ldl < 130 ? "Near optimal (100-129)" : ldl < 160 ? "Borderline high (130-159)" : ldl < 190 ? "High (160-189)" : "Very high (190 or more)",
        level: ldl < 100 ? "ok" : ldl < 160 ? "warn" : "danger",
        details: [`Non-HDL cholesterol ${fmt(nonhdl)} mg/dL`, "Treatment targets depend on cardiovascular risk: for example below 70 mg/dL at high risk and below 55 mg/dL at very high risk (ESC/EAS 2019); the Lipid Association of India sets similar or lower targets."],
      };
    },
  },
];

export const CALC_BY_ID = Object.fromEntries(CALCULATORS.map((c) => [c.id, c])) as Record<string, Calculator>;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const KEYWORD_RE = new Map(
  CALCULATORS.map((c) => [c.id, c.keywords.map((k) => new RegExp(`(^|[^a-z0-9])${escapeRe(k)}`, "i"))]),
);

/**
 * Calculators worth suggesting next to a question and its answer. A keyword in the
 * question counts double, so a passing mention in a long answer alone isn't enough.
 */
export function suggestCalculators(question: string, answer = "", max = 2): Calculator[] {
  const q = question.toLowerCase();
  const a = answer.toLowerCase();
  const scored = CALCULATORS.map((c) => {
    if (c.exclude && (c.exclude.test(q) || c.exclude.test(a))) return { c, n: 0 };
    const res = KEYWORD_RE.get(c.id) ?? [];
    const n = res.reduce((s, re) => s + (re.test(q) ? 2 : re.test(a) ? 1 : 0), 0);
    return { c, n };
  }).filter((x) => x.n >= 2);
  scored.sort((x, y) => y.n - x.n);
  return scored.slice(0, max).map((x) => x.c);
}

/** A one-line, copyable summary of a result. */
export function resultLine(c: Calculator, r: CalcResult): string {
  return `${c.name}: ${r.value} (${r.band}). ${r.label}.`;
}

/** A plain-text summary with the inputs, for copying into notes or asking Cadus about. */
export function resultSummary(c: Calculator, v: CalcValues, r: CalcResult): string {
  const parts = c.inputs.flatMap((i) => {
    const x = v[i.id];
    if (i.kind === "toggle") return x === true ? [i.label] : [];
    if (x === undefined || x === "") return [];
    if (i.kind === "select") return [`${i.label}: ${i.options.find((o) => o.value === x)?.label ?? x}`];
    if (i.kind === "date") return [`${i.label}: ${x}`];
    return [`${i.label}: ${x}${i.unit ? ` ${i.unit}` : ""}`];
  });
  return `${resultLine(c, r)}${parts.length ? ` Inputs: ${parts.join("; ")}.` : ""}`;
}
