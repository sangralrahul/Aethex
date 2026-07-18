import { useState, useMemo, useEffect, useRef } from "react";
import { PageHero } from "@/components/PageHero";
import { Search, Calculator, Heart, Brain, Activity, Stethoscope, Flame, Wind, Baby, Zap, Droplets, Scale, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface CalcField {
  id: string;
  label: string;
  unit?: string;
  type: "number" | "select";
  options?: { label: string; value: number }[];
  min?: number;
  max?: number;
  step?: number;
}

interface Calculator {
  id: string;
  name: string;
  shortName: string;
  category: string;
  icon: any;
  color: string;
  description: string;
  reference: string;
  fields: CalcField[];
  calculate: (vals: Record<string, number>) => { result: number | string; unit?: string; interpretation: string; severity: "normal" | "warning" | "danger" | "info" };
}

const calculators: Calculator[] = [
  {
    id: "bmi",
    name: "Body Mass Index (BMI)",
    shortName: "BMI",
    category: "General",
    icon: Scale,
    color: "#007AFF",
    description: "Calculate BMI using weight and height",
    reference: "WHO classification",
    fields: [
      { id: "weight", label: "Weight", unit: "kg", type: "number", min: 1, max: 300 },
      { id: "height", label: "Height", unit: "cm", type: "number", min: 50, max: 250 },
    ],
    calculate: ({ weight, height }) => {
      const h = height / 100;
      const bmi = weight / (h * h);
      const r = parseFloat(bmi.toFixed(1));
      let interpretation = "", severity: any = "normal";
      if (bmi < 18.5) { interpretation = "Underweight"; severity = "warning"; }
      else if (bmi < 25) { interpretation = "Normal weight"; severity = "normal"; }
      else if (bmi < 30) { interpretation = "Overweight"; severity = "warning"; }
      else { interpretation = "Obese"; severity = "danger"; }
      return { result: r, unit: "kg/m²", interpretation, severity };
    },
  },
  {
    id: "egfr-ckd-epi",
    name: "eGFR (CKD-EPI 2021)",
    shortName: "eGFR",
    category: "Nephrology",
    icon: Droplets,
    color: "#06B6D4",
    description: "Estimated Glomerular Filtration Rate — CKD-EPI 2021 (race-free)",
    reference: "KDIGO 2022",
    fields: [
      { id: "creatinine", label: "Serum Creatinine", unit: "mg/dL", type: "number", min: 0.1, max: 20, step: 0.1 },
      { id: "age", label: "Age", unit: "years", type: "number", min: 18, max: 110 },
      { id: "sex", label: "Sex", type: "select", options: [{ label: "Male", value: 1 }, { label: "Female", value: 0 }] },
    ],
    calculate: ({ creatinine, age, sex }) => {
      const kappa = sex === 0 ? 0.7 : 0.9;
      const alpha = sex === 0 ? -0.241 : -0.302;
      const scr = creatinine / kappa;
      const min_val = Math.min(scr, 1);
      const max_val = Math.max(scr, 1);
      const gfr = 142 * Math.pow(min_val, alpha) * Math.pow(max_val, -1.200) * Math.pow(0.9938, age) * (sex === 0 ? 1.012 : 1);
      const r = Math.round(gfr);
      let interpretation = "", severity: any = "normal";
      if (r >= 90) { interpretation = "G1 — Normal or high (≥90 mL/min)"; severity = "normal"; }
      else if (r >= 60) { interpretation = "G2 — Mildly decreased (60–89)"; severity = "normal"; }
      else if (r >= 45) { interpretation = "G3a — Mildly-moderately decreased"; severity = "warning"; }
      else if (r >= 30) { interpretation = "G3b — Moderately-severely decreased"; severity = "warning"; }
      else if (r >= 15) { interpretation = "G4 — Severely decreased"; severity = "danger"; }
      else { interpretation = "G5 — Kidney failure (<15)"; severity = "danger"; }
      return { result: r, unit: "mL/min/1.73m²", interpretation, severity };
    },
  },
  {
    id: "curb65",
    name: "CURB-65 Pneumonia Severity",
    shortName: "CURB-65",
    category: "Pulmonology",
    icon: Wind,
    color: "#10B981",
    description: "Assess pneumonia severity for hospital admission decision",
    reference: "BTS Guidelines",
    fields: [
      { id: "confusion", label: "Confusion (new onset)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "urea", label: "Urea > 7 mmol/L (BUN > 19 mg/dL)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "rr", label: "Respiratory Rate ≥ 30/min", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "bp", label: "BP < 90 systolic or ≤ 60 diastolic", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "age65", label: "Age ≥ 65 years", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    ],
    calculate: (vals) => {
      const score = vals.confusion + vals.urea + vals.rr + vals.bp + vals.age65;
      let interpretation = "", severity: any = "normal";
      if (score <= 1) { interpretation = "Low severity — Consider home treatment"; severity = "normal"; }
      else if (score === 2) { interpretation = "Moderate severity — Consider hospital admission"; severity = "warning"; }
      else { interpretation = "High severity — Consider ICU admission (30-day mortality ~17–57%)"; severity = "danger"; }
      return { result: score, unit: "/ 5", interpretation, severity };
    },
  },
  {
    id: "sofa",
    name: "SOFA Score (ICU)",
    shortName: "SOFA",
    category: "Critical Care",
    icon: Activity,
    color: "#EF4444",
    description: "Sequential Organ Failure Assessment — ICU mortality predictor",
    reference: "JAMA 1996",
    fields: [
      { id: "pao2_fio2", label: "PaO2/FiO2 ratio", type: "select", options: [{ label: "≥400", value: 0 }, { label: "300–399", value: 1 }, { label: "200–299", value: 2 }, { label: "100–199 (ventilated)", value: 3 }, { label: "<100 (ventilated)", value: 4 }] },
      { id: "platelets", label: "Platelets (×10³/μL)", type: "select", options: [{ label: "≥150", value: 0 }, { label: "100–149", value: 1 }, { label: "50–99", value: 2 }, { label: "20–49", value: 3 }, { label: "<20", value: 4 }] },
      { id: "bilirubin", label: "Bilirubin (mg/dL)", type: "select", options: [{ label: "<1.2", value: 0 }, { label: "1.2–1.9", value: 1 }, { label: "2.0–5.9", value: 2 }, { label: "6.0–11.9", value: 3 }, { label: "≥12.0", value: 4 }] },
      { id: "cardiovascular", label: "Cardiovascular", type: "select", options: [{ label: "MAP ≥70 mmHg", value: 0 }, { label: "MAP <70 mmHg", value: 1 }, { label: "Dopamine ≤5 or dobutamine", value: 2 }, { label: "Dopamine >5 or NE ≤0.1", value: 3 }, { label: "Dopamine >15 or NE >0.1", value: 4 }] },
      { id: "gcs", label: "Glasgow Coma Scale", type: "select", options: [{ label: "15", value: 0 }, { label: "13–14", value: 1 }, { label: "10–12", value: 2 }, { label: "6–9", value: 3 }, { label: "<6", value: 4 }] },
      { id: "creatinine_sofa", label: "Creatinine (mg/dL) or Urine Output", type: "select", options: [{ label: "<1.2", value: 0 }, { label: "1.2–1.9", value: 1 }, { label: "2.0–3.4", value: 2 }, { label: "3.5–4.9 or UO <500mL/d", value: 3 }, { label: ">5.0 or UO <200mL/d", value: 4 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score < 6) { interpretation = "Low risk — Mortality <10%"; severity = "normal"; }
      else if (score < 10) { interpretation = "Moderate risk — Mortality 15–20%"; severity = "warning"; }
      else if (score < 13) { interpretation = "High risk — Mortality 40–50%"; severity = "danger"; }
      else { interpretation = "Very high risk — Mortality >80%"; severity = "danger"; }
      return { result: score, unit: "/ 24", interpretation, severity };
    },
  },
  {
    id: "cha2ds2-vasc",
    name: "CHA₂DS₂-VASc Score",
    shortName: "CHA₂DS₂-VASc",
    category: "Cardiology",
    icon: Heart,
    color: "#F43F5E",
    description: "Stroke risk in non-valvular atrial fibrillation",
    reference: "ESC Guidelines 2020",
    fields: [
      { id: "chf", label: "Congestive Heart Failure", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "hypertension", label: "Hypertension", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "age_75", label: "Age ≥ 75 years", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 2 }] },
      { id: "diabetes", label: "Diabetes Mellitus", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "stroke", label: "Prior Stroke/TIA/Thromboembolism", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 2 }] },
      { id: "vascular", label: "Vascular Disease (MI, PAD, Aortic plaque)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "age_65", label: "Age 65–74 years", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "female", label: "Female Sex", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      const strokeRates = [0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.8, 9.6, 12.5, 15.2];
      const rate = strokeRates[Math.min(score, 9)];
      let interpretation = "", severity: any = "normal";
      if (score === 0) { interpretation = "Low risk — No anticoagulation recommended"; severity = "normal"; }
      else if (score === 1) { interpretation = `Intermediate risk — Annual stroke rate ~${rate}%`; severity = "warning"; }
      else { interpretation = `High risk — Annual stroke rate ~${rate}% — Anticoagulation recommended`; severity = "danger"; }
      return { result: score, unit: "/ 9", interpretation, severity };
    },
  },
  {
    id: "child-pugh",
    name: "Child-Pugh Score",
    shortName: "Child-Pugh",
    category: "Gastroenterology",
    icon: Activity,
    color: "#F59E0B",
    description: "Liver disease severity and prognosis",
    reference: "Child & Turcotte 1964",
    fields: [
      { id: "bilirubin_cp", label: "Bilirubin (mg/dL)", type: "select", options: [{ label: "<2 (1 pt)", value: 1 }, { label: "2–3 (2 pts)", value: 2 }, { label: ">3 (3 pts)", value: 3 }] },
      { id: "albumin", label: "Albumin (g/dL)", type: "select", options: [{ label: ">3.5 (1 pt)", value: 1 }, { label: "2.8–3.5 (2 pts)", value: 2 }, { label: "<2.8 (3 pts)", value: 3 }] },
      { id: "inr", label: "INR / Prothrombin Time", type: "select", options: [{ label: "<1.7 / <4s (1 pt)", value: 1 }, { label: "1.7–2.3 / 4–6s (2 pts)", value: 2 }, { label: ">2.3 / >6s (3 pts)", value: 3 }] },
      { id: "ascites", label: "Ascites", type: "select", options: [{ label: "None (1 pt)", value: 1 }, { label: "Mild (2 pts)", value: 2 }, { label: "Moderate-Severe (3 pts)", value: 3 }] },
      { id: "encephalopathy", label: "Hepatic Encephalopathy", type: "select", options: [{ label: "None (1 pt)", value: 1 }, { label: "Grade I–II (2 pts)", value: 2 }, { label: "Grade III–IV (3 pts)", value: 3 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score <= 6) { interpretation = "Class A (5–6) — Well-compensated disease. 1-yr survival ~100%"; severity = "normal"; }
      else if (score <= 9) { interpretation = "Class B (7–9) — Significant functional compromise. 1-yr survival ~80%"; severity = "warning"; }
      else { interpretation = "Class C (10–15) — Decompensated disease. 1-yr survival ~45%"; severity = "danger"; }
      return { result: score, unit: "/ 15", interpretation, severity };
    },
  },
  {
    id: "wells-dvt",
    name: "Wells Score for DVT",
    shortName: "Wells DVT",
    category: "Haematology",
    icon: Activity,
    color: "#8B5CF6",
    description: "Pre-test probability for deep vein thrombosis",
    reference: "Wells et al. Lancet 1997",
    fields: [
      { id: "cancer", label: "Active cancer (treatment within 6 months)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "paralysis", label: "Paralysis, paresis, or immobilisation of leg", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "bedridden", label: "Bedridden >3 days or major surgery <12 weeks", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "tenderness", label: "Localised tenderness along deep vein system", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "swelling", label: "Entire leg swollen", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "calf_3cm", label: "Calf swelling >3 cm compared to other leg", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "pitting", label: "Pitting oedema confined to symptomatic leg", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "collateral_veins", label: "Collateral superficial veins", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "alt_diagnosis", label: "Alternative diagnosis at least as likely", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes (subtract 2)", value: -2 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score <= 0) { interpretation = "Low probability DVT (~5%). D-dimer if clinically indicated."; severity = "normal"; }
      else if (score <= 2) { interpretation = "Moderate probability DVT (~17%). D-dimer + USS."; severity = "warning"; }
      else { interpretation = "High probability DVT (~53%). Duplex USS recommended."; severity = "danger"; }
      return { result: score, interpretation, severity };
    },
  },
  {
    id: "gcs",
    name: "Glasgow Coma Scale (GCS)",
    shortName: "GCS",
    category: "Neurology",
    icon: Brain,
    color: "#6366F1",
    description: "Level of consciousness after traumatic brain injury",
    reference: "Teasdale & Jennett 1974",
    fields: [
      { id: "eye", label: "Eye Opening", type: "select", options: [{ label: "Spontaneous (4)", value: 4 }, { label: "To voice (3)", value: 3 }, { label: "To pain (2)", value: 2 }, { label: "None (1)", value: 1 }] },
      { id: "verbal", label: "Verbal Response", type: "select", options: [{ label: "Oriented (5)", value: 5 }, { label: "Confused (4)", value: 4 }, { label: "Inappropriate words (3)", value: 3 }, { label: "Incomprehensible (2)", value: 2 }, { label: "None (1)", value: 1 }] },
      { id: "motor", label: "Motor Response", type: "select", options: [{ label: "Obeys commands (6)", value: 6 }, { label: "Localises pain (5)", value: 5 }, { label: "Withdraws (4)", value: 4 }, { label: "Flexion (3)", value: 3 }, { label: "Extension (2)", value: 2 }, { label: "None (1)", value: 1 }] },
    ],
    calculate: ({ eye, verbal, motor }) => {
      const score = eye + verbal + motor;
      let interpretation = "", severity: any = "normal";
      if (score >= 13) { interpretation = "Mild TBI (13–15) — GCS ≥ 13"; severity = "normal"; }
      else if (score >= 9) { interpretation = "Moderate TBI (9–12) — Monitor closely"; severity = "warning"; }
      else { interpretation = "Severe TBI (3–8) — Critical, consider intubation"; severity = "danger"; }
      return { result: score, unit: "/ 15", interpretation, severity };
    },
  },
  {
    id: "apgar",
    name: "APGAR Score",
    shortName: "APGAR",
    category: "Paediatrics",
    icon: Baby,
    color: "#EC4899",
    description: "Neonatal wellbeing at 1 and 5 minutes",
    reference: "Apgar 1953",
    fields: [
      { id: "appearance", label: "Appearance (Skin Colour)", type: "select", options: [{ label: "Blue/pale all over (0)", value: 0 }, { label: "Blue extremities, pink body (1)", value: 1 }, { label: "Pink all over (2)", value: 2 }] },
      { id: "pulse", label: "Pulse (Heart Rate)", type: "select", options: [{ label: "Absent (0)", value: 0 }, { label: "<100 bpm (1)", value: 1 }, { label: "≥100 bpm (2)", value: 2 }] },
      { id: "grimace", label: "Grimace (Reflex Irritability)", type: "select", options: [{ label: "No response (0)", value: 0 }, { label: "Facial grimace (1)", value: 1 }, { label: "Cough/sneeze/cry (2)", value: 2 }] },
      { id: "activity", label: "Activity (Muscle Tone)", type: "select", options: [{ label: "Limp (0)", value: 0 }, { label: "Some flexion (1)", value: 1 }, { label: "Active motion (2)", value: 2 }] },
      { id: "respiration", label: "Respiration", type: "select", options: [{ label: "Absent (0)", value: 0 }, { label: "Weak/irregular (1)", value: 1 }, { label: "Strong cry (2)", value: 2 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score >= 7) { interpretation = "Normal newborn — Routine care"; severity = "normal"; }
      else if (score >= 4) { interpretation = "Moderate concern — May need stimulation/O₂"; severity = "warning"; }
      else { interpretation = "Critical — Immediate resuscitation required"; severity = "danger"; }
      return { result: score, unit: "/ 10", interpretation, severity };
    },
  },
  {
    id: "qtc",
    name: "Corrected QT Interval (QTc)",
    shortName: "QTc",
    category: "Cardiology",
    icon: Zap,
    color: "#EF4444",
    description: "Bazett's formula for QT interval correction",
    reference: "Bazett 1920",
    fields: [
      { id: "qt", label: "QT interval", unit: "ms", type: "number", min: 200, max: 700 },
      { id: "rr", label: "RR interval", unit: "ms", type: "number", min: 300, max: 2000 },
    ],
    calculate: ({ qt, rr }) => {
      const qtc = qt / Math.sqrt(rr / 1000);
      const r = Math.round(qtc);
      let interpretation = "", severity: any = "normal";
      if (r <= 440) { interpretation = "Normal QTc ≤440 ms (male) / ≤460 ms (female)"; severity = "normal"; }
      else if (r <= 500) { interpretation = "Borderline prolonged — Review medications"; severity = "warning"; }
      else { interpretation = "Prolonged QTc — High risk of Torsades de Pointes"; severity = "danger"; }
      return { result: r, unit: "ms", interpretation, severity };
    },
  },
  {
    id: "anion-gap",
    name: "Anion Gap",
    shortName: "Anion Gap",
    category: "Biochemistry",
    icon: Droplets,
    color: "#0EA5E9",
    description: "Calculate anion gap with albumin correction",
    reference: "Winters Formula",
    fields: [
      { id: "sodium", label: "Sodium (Na⁺)", unit: "mEq/L", type: "number", min: 100, max: 180 },
      { id: "chloride", label: "Chloride (Cl⁻)", unit: "mEq/L", type: "number", min: 60, max: 130 },
      { id: "bicarbonate", label: "Bicarbonate (HCO₃⁻)", unit: "mEq/L", type: "number", min: 5, max: 50 },
      { id: "albumin_ag", label: "Albumin (for correction)", unit: "g/dL", type: "number", min: 0.5, max: 6, step: 0.1 },
    ],
    calculate: ({ sodium, chloride, bicarbonate, albumin_ag }) => {
      const ag = sodium - (chloride + bicarbonate);
      const corrected = ag + 2.5 * (4.0 - albumin_ag);
      const r = parseFloat(corrected.toFixed(1));
      let interpretation = "", severity: any = "normal";
      if (corrected <= 12) { interpretation = "Normal anion gap (≤12 mEq/L) — Non-AG acidosis"; severity = "normal"; }
      else if (corrected <= 20) { interpretation = "Mildly elevated — Consider causes (lactic, DKA, renal)"; severity = "warning"; }
      else { interpretation = "High anion gap — MUDPILES: Methanol, Uraemia, DKA, Propylene glycol, Isoniazid, Lactic acidosis, Ethylene glycol, Salicylates"; severity = "danger"; }
      return { result: r, unit: "mEq/L (albumin-corrected)", interpretation, severity };
    },
  },
  {
    id: "grace",
    name: "GRACE Score (ACS)",
    shortName: "GRACE",
    category: "Cardiology",
    icon: Heart,
    color: "#F43F5E",
    description: "In-hospital mortality risk in acute coronary syndrome",
    reference: "Eagle et al. 2004",
    fields: [
      { id: "age_grace", label: "Age (years)", type: "number", min: 18, max: 120 },
      { id: "hr", label: "Heart Rate (bpm)", type: "number", min: 20, max: 250 },
      { id: "sbp", label: "Systolic BP (mmHg)", type: "number", min: 40, max: 280 },
      { id: "creatinine_grace", label: "Creatinine (mg/dL)", type: "number", min: 0.1, max: 15, step: 0.1 },
      { id: "killip", label: "Killip Class", type: "select", options: [{ label: "I — No heart failure (0)", value: 0 }, { label: "II — Rales, JVP elevated (20)", value: 20 }, { label: "III — Pulmonary oedema (39)", value: 39 }, { label: "IV — Cardiogenic shock (59)", value: 59 }] },
      { id: "cardiac_arrest", label: "Cardiac Arrest at Admission", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes (+43)", value: 43 }] },
      { id: "st_deviation", label: "ST Deviation on ECG", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes (+30)", value: 30 }] },
      { id: "enzymes", label: "Elevated Cardiac Enzymes/Markers", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes (+15)", value: 15 }] },
    ],
    calculate: ({ age_grace, hr, sbp, creatinine_grace, killip, cardiac_arrest, st_deviation, enzymes }) => {
      const ageScore = age_grace < 30 ? 0 : age_grace < 40 ? 8 : age_grace < 50 ? 25 : age_grace < 60 ? 41 : age_grace < 70 ? 58 : age_grace < 80 ? 75 : 91;
      const hrScore = hr < 50 ? 0 : hr < 70 ? 3 : hr < 90 ? 9 : hr < 110 ? 15 : hr < 150 ? 24 : hr < 200 ? 38 : 46;
      const sbpScore = sbp < 80 ? 63 : sbp < 100 ? 58 : sbp < 120 ? 47 : sbp < 140 ? 37 : sbp < 160 ? 26 : sbp < 200 ? 11 : 0;
      const crScore = creatinine_grace < 0.4 ? 2 : creatinine_grace < 0.8 ? 5 : creatinine_grace < 1.2 ? 8 : creatinine_grace < 1.6 ? 11 : creatinine_grace < 2.0 ? 14 : creatinine_grace < 4.0 ? 23 : 31;
      const total = ageScore + hrScore + sbpScore + crScore + killip + cardiac_arrest + st_deviation + enzymes;
      let interpretation = "", severity: any = "normal";
      if (total < 109) { interpretation = "Low risk — In-hospital mortality <1%"; severity = "normal"; }
      else if (total < 140) { interpretation = "Intermediate risk — Mortality 1–3%"; severity = "warning"; }
      else { interpretation = "High risk — In-hospital mortality >3%"; severity = "danger"; }
      return { result: total, interpretation, severity };
    },
  },
  {
    id: "heart-score",
    name: "HEART Score (Chest Pain)",
    shortName: "HEART",
    category: "Cardiology",
    icon: Heart,
    color: "#F43F5E",
    description: "Risk stratification for chest pain — MACE prediction",
    reference: "Six et al. 2008",
    fields: [
      { id: "history_heart", label: "History", type: "select", options: [{ label: "Slightly suspicious (0)", value: 0 }, { label: "Moderately suspicious (1)", value: 1 }, { label: "Highly suspicious (2)", value: 2 }] },
      { id: "ecg_heart", label: "ECG", type: "select", options: [{ label: "Normal (0)", value: 0 }, { label: "Non-specific repolarisation (1)", value: 1 }, { label: "Significant ST deviation (2)", value: 2 }] },
      { id: "age_heart", label: "Age", type: "select", options: [{ label: "<45 years (0)", value: 0 }, { label: "45–64 years (1)", value: 1 }, { label: "≥65 years (2)", value: 2 }] },
      { id: "risk_heart", label: "Risk Factors (HTN, DM, hypercholesterolaemia, obesity, smoking, family Hx)", type: "select", options: [{ label: "No known risk factors (0)", value: 0 }, { label: "1–2 risk factors (1)", value: 1 }, { label: "≥3 risk factors or history of atherosclerotic disease (2)", value: 2 }] },
      { id: "troponin", label: "Troponin", type: "select", options: [{ label: "≤ normal limit (0)", value: 0 }, { label: "1–3× normal limit (1)", value: 1 }, { label: ">3× normal limit (2)", value: 2 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score <= 3) { interpretation = "Low risk (0–3) — 1.7% MACE. Early discharge may be safe."; severity = "normal"; }
      else if (score <= 6) { interpretation = "Moderate risk (4–6) — 12% MACE. Observe, consider stress testing."; severity = "warning"; }
      else { interpretation = "High risk (7–10) — 65% MACE. Early invasive strategy recommended."; severity = "danger"; }
      return { result: score, unit: "/ 10", interpretation, severity };
    },
  },
  {
    id: "centor",
    name: "Centor Score (Sore Throat)",
    shortName: "Centor",
    category: "General",
    icon: Stethoscope,
    color: "#10B981",
    description: "Probability of Group A strep pharyngitis",
    reference: "Centor et al. 1981",
    fields: [
      { id: "exudate", label: "Tonsillar exudate", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "tender_nodes", label: "Tender anterior cervical lymphadenopathy", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "fever_centor", label: "Fever >38°C (history or documented)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "no_cough", label: "Absence of cough", type: "select", options: [{ label: "Cough present", value: 0 }, { label: "No cough (+1)", value: 1 }] },
      { id: "age_centor", label: "Age", type: "select", options: [{ label: "≥45 years (−1)", value: -1 }, { label: "15–44 years (0)", value: 0 }, { label: "3–14 years (+1)", value: 1 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score <= 0) { interpretation = "Low risk (<10% strep) — No antibiotics, no culture needed"; severity = "normal"; }
      else if (score <= 2) { interpretation = "Moderate risk (11–35% strep) — Consider rapid antigen test"; severity = "warning"; }
      else { interpretation = "High risk (>50% strep) — Empiric antibiotics or RADT"; severity = "danger"; }
      return { result: score, interpretation, severity };
    },
  },
  {
    id: "parkland",
    name: "Parkland Formula (Burns)",
    shortName: "Parkland",
    category: "Surgery",
    icon: Flame,
    color: "#F97316",
    description: "IV fluid resuscitation in burns — 24-hour requirement",
    reference: "Baxter 1968",
    fields: [
      { id: "weight_burns", label: "Patient Weight", unit: "kg", type: "number", min: 1, max: 300 },
      { id: "tbsa", label: "Total Body Surface Area Burned", unit: "%", type: "number", min: 1, max: 100 },
    ],
    calculate: ({ weight_burns, tbsa }) => {
      const total = 4 * weight_burns * tbsa;
      const first8h = total / 2;
      const next16h = total / 2;
      return {
        result: Math.round(total),
        unit: "mL in 24h",
        interpretation: `Give ${Math.round(first8h)} mL in first 8h, then ${Math.round(next16h)} mL over next 16h. Use Ringer's Lactate. Clock starts at TIME OF BURN, not admission.`,
        severity: tbsa > 50 ? "danger" : tbsa > 20 ? "warning" : "info",
      };
    },
  },
  {
    id: "nihss",
    name: "NIH Stroke Scale (NIHSS)",
    shortName: "NIHSS",
    category: "Neurology",
    icon: Brain,
    color: "#6366F1",
    description: "Quantify stroke severity for treatment decisions",
    reference: "Brott et al. 1989",
    fields: [
      { id: "consciousness", label: "Level of Consciousness", type: "select", options: [{ label: "Alert (0)", value: 0 }, { label: "Drowsy (1)", value: 1 }, { label: "Stuporous (2)", value: 2 }, { label: "Coma (3)", value: 3 }] },
      { id: "questions", label: "LOC Questions (month, age)", type: "select", options: [{ label: "Both correct (0)", value: 0 }, { label: "One correct (1)", value: 1 }, { label: "Neither (2)", value: 2 }] },
      { id: "commands", label: "LOC Commands (grip, blink)", type: "select", options: [{ label: "Both (0)", value: 0 }, { label: "One (1)", value: 1 }, { label: "Neither (2)", value: 2 }] },
      { id: "gaze", label: "Best Gaze", type: "select", options: [{ label: "Normal (0)", value: 0 }, { label: "Partial palsy (1)", value: 1 }, { label: "Total palsy (2)", value: 2 }] },
      { id: "visual", label: "Visual Fields", type: "select", options: [{ label: "No loss (0)", value: 0 }, { label: "Partial hemianopia (1)", value: 1 }, { label: "Complete hemianopia (2)", value: 2 }, { label: "Bilateral (3)", value: 3 }] },
      { id: "facial_palsy", label: "Facial Palsy", type: "select", options: [{ label: "Normal (0)", value: 0 }, { label: "Minor palsy (1)", value: 1 }, { label: "Partial palsy (2)", value: 2 }, { label: "Complete palsy (3)", value: 3 }] },
      { id: "motor_arm", label: "Motor — Arm (worst side)", type: "select", options: [{ label: "No drift (0)", value: 0 }, { label: "Drift (1)", value: 1 }, { label: "Can't resist gravity (2)", value: 2 }, { label: "No effort against gravity (3)", value: 3 }, { label: "No movement (4)", value: 4 }] },
      { id: "motor_leg", label: "Motor — Leg (worst side)", type: "select", options: [{ label: "No drift (0)", value: 0 }, { label: "Drift (1)", value: 1 }, { label: "Can't resist gravity (2)", value: 2 }, { label: "No effort (3)", value: 3 }, { label: "No movement (4)", value: 4 }] },
      { id: "ataxia", label: "Limb Ataxia", type: "select", options: [{ label: "Absent (0)", value: 0 }, { label: "One limb (1)", value: 1 }, { label: "Two limbs (2)", value: 2 }] },
      { id: "sensory", label: "Sensory", type: "select", options: [{ label: "Normal (0)", value: 0 }, { label: "Partial loss (1)", value: 1 }, { label: "Dense loss (2)", value: 2 }] },
      { id: "language", label: "Best Language", type: "select", options: [{ label: "Normal (0)", value: 0 }, { label: "Mild aphasia (1)", value: 1 }, { label: "Severe aphasia (2)", value: 2 }, { label: "Mute/global aphasia (3)", value: 3 }] },
      { id: "dysarthria", label: "Dysarthria", type: "select", options: [{ label: "Normal (0)", value: 0 }, { label: "Mild-moderate (1)", value: 1 }, { label: "Severe/unintelligible (2)", value: 2 }] },
      { id: "extinction", label: "Extinction and Inattention", type: "select", options: [{ label: "Normal (0)", value: 0 }, { label: "Inattention (1)", value: 1 }, { label: "Hemi-inattention (2)", value: 2 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score === 0) { interpretation = "No stroke symptoms"; severity = "normal"; }
      else if (score <= 4) { interpretation = "Minor stroke (1–4) — May not need thrombolysis"; severity = "normal"; }
      else if (score <= 15) { interpretation = "Moderate stroke (5–15)"; severity = "warning"; }
      else if (score <= 20) { interpretation = "Moderate-severe stroke (16–20)"; severity = "danger"; }
      else { interpretation = "Severe stroke (21–42) — High mortality"; severity = "danger"; }
      return { result: score, unit: "/ 42", interpretation, severity };
    },
  },
  {
    id: "bsa",
    name: "Body Surface Area (BSA)",
    shortName: "BSA",
    category: "General",
    icon: Scale,
    color: "#007AFF",
    description: "Mosteller formula — used for chemotherapy dosing",
    reference: "Mosteller 1987",
    fields: [
      { id: "weight_bsa", label: "Weight", unit: "kg", type: "number", min: 1, max: 300 },
      { id: "height_bsa", label: "Height", unit: "cm", type: "number", min: 50, max: 250 },
    ],
    calculate: ({ weight_bsa, height_bsa }) => {
      const bsa = Math.sqrt((weight_bsa * height_bsa) / 3600);
      const r = parseFloat(bsa.toFixed(2));
      const normal_min = 1.5, normal_max = 2.0;
      let interpretation = "", severity: any = "normal";
      if (r < normal_min) { interpretation = `BSA ${r} m² — Below typical adult range (1.5–2.0 m²)`; severity = "warning"; }
      else if (r <= normal_max) { interpretation = `BSA ${r} m² — Within normal adult range`; severity = "normal"; }
      else { interpretation = `BSA ${r} m² — Above typical adult range`; severity = "info"; }
      return { result: r, unit: "m²", interpretation, severity };
    },
  },
  {
    id: "iv-fluid",
    name: "Maintenance IV Fluid (Holliday-Segar)",
    shortName: "IV Fluid",
    category: "Paediatrics",
    icon: Droplets,
    color: "#0EA5E9",
    description: "Maintenance fluid rate for paediatric patients",
    reference: "Holliday & Segar 1957",
    fields: [
      { id: "weight_iv", label: "Body Weight", unit: "kg", type: "number", min: 0.5, max: 150, step: 0.1 },
    ],
    calculate: ({ weight_iv }) => {
      let ml_per_day = 0;
      if (weight_iv <= 10) ml_per_day = weight_iv * 100;
      else if (weight_iv <= 20) ml_per_day = 1000 + (weight_iv - 10) * 50;
      else ml_per_day = 1500 + (weight_iv - 20) * 20;
      const ml_per_hr = ml_per_day / 24;
      return {
        result: Math.round(ml_per_hr),
        unit: "mL/hr",
        interpretation: `Total: ${Math.round(ml_per_day)} mL/day (${Math.round(ml_per_hr)} mL/hr). Note: Max 2400 mL/day for adolescents. Use 0.9% NaCl + 5% dextrose.`,
        severity: "info",
      };
    },
  },
  {
    id: "osmolality",
    name: "Serum Osmolality",
    shortName: "Osmolality",
    category: "Biochemistry",
    icon: Droplets,
    color: "#0EA5E9",
    description: "Calculate serum osmolality and osmol gap",
    reference: "Clinical Chemistry reference",
    fields: [
      { id: "sodium_osm", label: "Sodium (Na⁺)", unit: "mEq/L", type: "number", min: 100, max: 180 },
      { id: "glucose", label: "Glucose", unit: "mg/dL", type: "number", min: 40, max: 2000 },
      { id: "bun", label: "BUN (Blood Urea Nitrogen)", unit: "mg/dL", type: "number", min: 1, max: 200 },
    ],
    calculate: ({ sodium_osm, glucose, bun }) => {
      const calc = 2 * sodium_osm + (glucose / 18) + (bun / 2.8);
      const r = Math.round(calc);
      let interpretation = "", severity: any = "normal";
      if (r < 275) { interpretation = "Hypo-osmolar state (<275 mOsm/kg)"; severity = "warning"; }
      else if (r <= 295) { interpretation = "Normal (275–295 mOsm/kg)"; severity = "normal"; }
      else if (r <= 320) { interpretation = "Hyperosmolar (296–320) — Check osmol gap"; severity = "warning"; }
      else { interpretation = "Severely hyperosmolar (>320) — Toxic ingestion/DKA?"; severity = "danger"; }
      return { result: r, unit: "mOsm/kg", interpretation, severity };
    },
  },
  {
    id: "psi-port",
    name: "PSI / PORT Score (Pneumonia)",
    shortName: "PSI/PORT",
    category: "Pulmonology",
    icon: Wind,
    color: "#10B981",
    description: "Pneumonia Severity Index — 30-day mortality prediction",
    reference: "Fine et al. NEJM 1997",
    fields: [
      { id: "age_psi", label: "Age (years)", type: "number", min: 18, max: 120 },
      { id: "sex_psi", label: "Sex", type: "select", options: [{ label: "Male", value: 1 }, { label: "Female (−10 pts)", value: 0 }] },
      { id: "nursing_home", label: "Nursing home resident (+10)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 10 }] },
      { id: "neoplasm", label: "Active neoplasm (+30)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 30 }] },
      { id: "liver_psi", label: "Liver disease (+20)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 20 }] },
      { id: "chf_psi", label: "CHF (+10)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 10 }] },
      { id: "stroke_psi", label: "Cerebrovascular disease (+10)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 10 }] },
      { id: "renal_psi", label: "Renal disease (+10)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 10 }] },
      { id: "altered_ms", label: "Altered mental status (+20)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 20 }] },
      { id: "rr_psi", label: "Respiratory rate ≥30 (+20)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 20 }] },
      { id: "sbp_psi", label: "SBP <90 mmHg (+20)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 20 }] },
    ],
    calculate: ({ age_psi, sex_psi, nursing_home, neoplasm, liver_psi, chf_psi, stroke_psi, renal_psi, altered_ms, rr_psi, sbp_psi }) => {
      const femaleDeduction = sex_psi === 0 ? -10 : 0;
      const total = age_psi + femaleDeduction + nursing_home + neoplasm + liver_psi + chf_psi + stroke_psi + renal_psi + altered_ms + rr_psi + sbp_psi;
      let interpretation = "", severity: any = "normal";
      if (total <= 70) { interpretation = "Class I–II (≤70) — Mortality <1%. Outpatient treatment."; severity = "normal"; }
      else if (total <= 90) { interpretation = "Class III (71–90) — Mortality 0.6–2.8%. Short stay."; severity = "warning"; }
      else if (total <= 130) { interpretation = "Class IV (91–130) — Mortality 8.2–9.3%. Inpatient."; severity = "danger"; }
      else { interpretation = "Class V (>130) — Mortality 27–31%. Inpatient/ICU."; severity = "danger"; }
      return { result: total, interpretation, severity };
    },
  },
  {
    id: "wells-pe",
    name: "Wells Score for PE",
    shortName: "Wells PE",
    category: "Pulmonology",
    icon: Wind,
    color: "#10B981",
    description: "Clinical pre-test probability for pulmonary embolism",
    reference: "Wells et al. Thromb Haemost 2000",
    fields: [
      { id: "dvt_sx", label: "Clinical signs/symptoms of DVT (+3)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 3 }] },
      { id: "alt_dx_pe", label: "PE most likely diagnosis (+3)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 3 }] },
      { id: "hr_pe", label: "Heart rate >100 bpm (+1.5)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1.5 }] },
      { id: "immob", label: "Immobilisation ≥3 days / surgery in last 4 weeks (+1.5)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1.5 }] },
      { id: "prev_dvt_pe", label: "Previous DVT/PE (+1.5)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1.5 }] },
      { id: "haemoptysis", label: "Haemoptysis (+1)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
      { id: "malignancy", label: "Malignancy (treated within 6 months) (+1)", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    ],
    calculate: (vals) => {
      const score = Object.values(vals).reduce((a, b) => a + b, 0);
      let interpretation = "", severity: any = "normal";
      if (score < 2) { interpretation = "Low probability PE (~3.6%). D-dimer to rule out."; severity = "normal"; }
      else if (score <= 6) { interpretation = "Moderate probability PE (~20.5%). CTPA recommended."; severity = "warning"; }
      else { interpretation = "High probability PE (~66.7%). Immediate CTPA or empiric treatment."; severity = "danger"; }
      return { result: score, interpretation, severity };
    },
  },
];

const categories = ["All", ...Array.from(new Set(calculators.map(c => c.category))).sort()];
const severityColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  normal: { bg: "#F0FDF4", border: "#86EFAC", text: "#15803D", badge: "#22C55E" },
  warning: { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", badge: "#F59E0B" },
  danger: { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", badge: "#EF4444" },
  info: { bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8", badge: "#3B82F6" },
};

function CalcCard({ calc, initialOpen }: { calc: Calculator; initialOpen?: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<Calculator["calculate"]> | null>(null);
  const [open, setOpen] = useState(initialOpen ?? false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialOpen && cardRef.current) {
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }
  }, [initialOpen]);

  const allFilled = calc.fields.every(f => values[f.id] !== undefined && values[f.id] !== "");

  const handleCalculate = () => {
    const nums: Record<string, number> = {};
    for (const f of calc.fields) nums[f.id] = parseFloat(values[f.id]);
    try { setResult(calc.calculate(nums)); } catch {}
  };

  const handleReset = () => { setValues({}); setResult(null); };

  const Icon = calc.icon;

  return (
    <div ref={cardRef} className="rounded-2xl overflow-hidden transition-all duration-200" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)", boxShadow: initialOpen ? "0 0 0 2px #007AFF40, 0 4px 16px rgba(0,0,0,0.1)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
      <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-black/[0.02] transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${calc.color}14`, border: `1px solid ${calc.color}25` }}>
          <Icon className="w-5 h-5" style={{ color: calc.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#1C1C1E" }}>{calc.name}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: "#AEAEB2" }}>{calc.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${calc.color}14`, color: calc.color }}>{calc.category}</span>
          {open ? <ChevronUp className="w-4 h-4" style={{ color: "#AEAEB2" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#AEAEB2" }} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(60,60,67,0.08)" }}>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {calc.fields.map(f => (
              <div key={f.id}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#636366" }}>
                  {f.label}{f.unit && <span className="ml-1" style={{ color: "#AEAEB2" }}>({f.unit})</span>}
                </label>
                {f.type === "select" ? (
                  <select
                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F3EE", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }}
                    value={values[f.id] ?? ""}
                    onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  >
                    <option value="" disabled>Select…</option>
                    {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={f.min} max={f.max} step={f.step ?? 1}
                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F3EE", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }}
                    value={values[f.id] ?? ""}
                    onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCalculate}
              disabled={!allFilled}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: calc.color, color: "#FFFFFF" }}
            >
              Calculate
            </button>
            <button onClick={handleReset} className="p-2.5 rounded-xl transition-all hover:bg-black/5" style={{ color: "#636366", border: "1px solid rgba(60,60,67,0.15)" }}>
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {result && (
            <div className="mt-4 rounded-xl p-4" style={{ background: severityColors[result.severity].bg, border: `1px solid ${severityColors[result.severity].border}` }}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: severityColors[result.severity].text }}>{result.result}</span>
                {result.unit && <span className="text-sm font-medium" style={{ color: severityColors[result.severity].text }}>{result.unit}</span>}
              </div>
              <p className="text-sm font-medium" style={{ color: severityColors[result.severity].text }}>{result.interpretation}</p>
              <p className="text-[11px] mt-2" style={{ color: "#AEAEB2" }}>Ref: {calc.reference} · Cadus AI assists, not replaces, clinical decision-making.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const activeId = useMemo(() => new URLSearchParams(window.location.search).get("id") ?? "", []);

  const filtered = useMemo(() => {
    if (activeId && !search && category === "All") {
      const match = calculators.find(c => c.id === activeId);
      return match ? [match] : calculators;
    }
    return calculators.filter(c =>
      (category === "All" || c.category === category) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.shortName.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, category, activeId]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Clinical Calculators"
        title="Medical Calculator Suite"
        subtitle={`${calculators.length} validated calculators — CURB-65, SOFA, GRACE, Wells, GCS, CHA₂DS₂-VASc & more`}
        icon={<Activity className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search calculators…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: category === cat ? "#007AFF" : "#FFFFFF",
                  color: category === cat ? "#FFFFFF" : "#636366",
                  border: category === cat ? "1px solid #007AFF" : "1px solid rgba(60,60,67,0.15)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {activeId && !search && category === "All" ? (
          <div className="flex items-center justify-between mb-4 px-4 py-2.5 rounded-xl" style={{ background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.12)" }}>
            <p className="text-sm font-medium" style={{ color: "#007AFF" }}>Viewing a specific calculator</p>
            <a href="/calculator" className="text-xs font-semibold px-3 py-1 rounded-lg transition-all hover:bg-[#007AFF] hover:text-white" style={{ border: "1px solid rgba(0,122,255,0.4)", color: "#007AFF" }}>
              ← View all 21 calculators
            </a>
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: "#636366" }}>
            Showing <strong style={{ color: "#1C1C1E" }}>{filtered.length}</strong> of {calculators.length} calculators
          </p>
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <Calculator className="w-12 h-12 mx-auto mb-3" style={{ color: "#AEAEB2" }} />
              <p className="text-sm font-semibold" style={{ color: "#636366" }}>No calculators found for "{search}"</p>
            </div>
          ) : (
            filtered.map(c => <CalcCard key={c.id} calc={c} initialOpen={!!activeId && c.id === activeId} />)
          )}
        </div>
      </div>
    </div>
  );
}
