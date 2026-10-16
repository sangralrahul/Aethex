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
  | "Kidney and liver"
  | "Cardiology"
  | "Emergency and scores"
  | "Obstetrics and paediatrics"
  | "Fluids and electrolytes"
  | "Body size";

export const CALC_GROUPS: CalcGroup[] = [
  "Emergency and scores", "Kidney and liver", "Cardiology", "Obstetrics and paediatrics", "Fluids and electrolytes", "Body size",
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

/* ------------------------------------------------------------------ calculators */

export const CALCULATORS: Calculator[] = [
  {
    id: "crcl",
    name: "Creatinine clearance",
    group: "Kidney and liver",
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
    group: "Kidney and liver",
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
    group: "Kidney and liver",
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
    group: "Emergency and scores",
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
    group: "Emergency and scores",
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
    group: "Emergency and scores",
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
    group: "Emergency and scores",
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
    group: "Emergency and scores",
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
