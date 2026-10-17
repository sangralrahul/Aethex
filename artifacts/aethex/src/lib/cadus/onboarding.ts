/**
 * First-run setup and practice preferences: the user's state, units and
 * formulary, specialty-specific shortcuts for the home page, and whether the
 * welcome and the guided tour have been seen. Kept on this device.
 */

export const ONBOARD_KEY = "cadus3.onboarded";
export const TOUR_KEY = "cadus3.tour";

/** Indian states and union territories, for local programmes and guidance. */
export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

/** Suggestions for the registering body (any text is accepted). */
export const COUNCILS = [
  "National Medical Commission",
  ...["Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jammu and Kashmir", "Jharkhand", "Karnataka", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
    "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map((s) => `${s} Medical Council`),
  "Travancore-Cochin Medical Council (Kerala)",
  "Indian Nursing Council",
  "State Nursing Council",
  "Pharmacy Council of India",
  "State Pharmacy Council",
];

export type Units = "conventional" | "si";

export function readFlag(key: string): boolean {
  try { return !!localStorage.getItem(key); } catch { return false; }
}

export function setFlag(key: string, on = true) {
  try {
    if (on) localStorage.setItem(key, String(Date.now()));
    else localStorage.removeItem(key);
  } catch { /* blocked */ }
}

/**
 * What the server needs to follow the user's practice preferences. Only sent
 * when it changes something, so the default needs no payload.
 */
export function practicePayload(p: { units?: Units; nlem?: boolean; state?: string }): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  if (p.units === "si") out.units = "si";
  if (p.nlem) out.nlem = true;
  if (p.state && STATES.includes(p.state)) out.state = p.state;
  return Object.keys(out).length ? out : undefined;
}

export interface Shortcut {
  /** A calculator id, or a Cadus tool (mode). */
  calc?: string;
  mode?: string;
  label: string;
}

/** Bedside tools that come up most in each specialty. */
export const SPECIALTY_TOOLS: Record<string, Shortcut[]> = {
  "General Medicine": [{ calc: "curb65", label: "CURB-65" }, { calc: "news2", label: "NEWS2" }, { calc: "egfr", label: "eGFR" }],
  "General Surgery": [{ calc: "alvarado", label: "Alvarado" }, { calc: "bisap", label: "BISAP" }, { calc: "burns", label: "Burns TBSA" }],
  "Paediatrics": [{ calc: "pedsdose", label: "Paediatric dose" }, { calc: "fluids", label: "Maintenance fluids" }, { calc: "apgar", label: "Apgar" }],
  "Obstetrics and Gynaecology": [{ calc: "edd", label: "Due date" }, { calc: "bishop", label: "Bishop score" }, { calc: "apgar", label: "Apgar" }],
  "Orthopaedics": [{ calc: "wellsdvt", label: "Wells DVT" }, { calc: "bmi", label: "BMI" }, { calc: "crcl", label: "CrCl" }],
  "Anaesthesiology": [{ calc: "ibw", label: "Ideal body weight" }, { calc: "map", label: "MAP" }, { calc: "sofa", label: "SOFA" }],
  "Emergency Medicine": [{ calc: "news2", label: "NEWS2" }, { calc: "heart", label: "HEART" }, { calc: "gcs", label: "GCS" }],
  "Family Medicine": [{ calc: "centor", label: "Centor" }, { calc: "chads", label: "CHA₂DS₂-VASc" }, { calc: "egfr", label: "eGFR" }],
  "Radiology": [{ calc: "egfr", label: "eGFR (contrast)" }, { calc: "wells", label: "Wells PE" }, { calc: "perc", label: "PERC" }],
  "Dermatology": [{ calc: "burns", label: "Burns TBSA" }, { calc: "bmi", label: "BMI" }, { mode: "image", label: "Image analysis" }],
  "Psychiatry": [{ calc: "qtc", label: "QTc" }, { mode: "drugs", label: "Interactions" }, { calc: "bmi", label: "BMI" }],
  "ENT": [{ calc: "centor", label: "Centor" }, { mode: "procedure", label: "Procedures" }, { calc: "pedsdose", label: "Paediatric dose" }],
  "Ophthalmology": [{ mode: "image", label: "Image analysis" }, { mode: "procedure", label: "Procedures" }, { mode: "drugs", label: "Interactions" }],
  "Cardiology": [{ calc: "heart", label: "HEART" }, { calc: "chads", label: "CHA₂DS₂-VASc" }, { calc: "qtc", label: "QTc" }],
  "Pulmonology": [{ calc: "curb65", label: "CURB-65" }, { calc: "aagrad", label: "A-a gradient" }, { calc: "wells", label: "Wells PE" }],
  "Nephrology": [{ calc: "egfr", label: "eGFR" }, { calc: "fwd", label: "Free water deficit" }, { calc: "adrogue", label: "Sodium change" }],
  "Neurology": [{ calc: "nihss", label: "NIHSS" }, { calc: "abcd2", label: "ABCD²" }, { calc: "gcs", label: "GCS" }],
  "Pathology": [{ calc: "rpi", label: "Reticulocyte index" }, { calc: "ldl", label: "LDL (Friedewald)" }, { mode: "labs", label: "Lab results" }],
  "Pharmacology": [{ mode: "drugs", label: "Interactions" }, { calc: "crcl", label: "CrCl" }, { mode: "dosage", label: "Dosing" }],
  "Community Medicine": [{ mode: "research", label: "Research" }, { calc: "bmi", label: "BMI" }, { mode: "patient", label: "Patient info" }],
  "Gastroenterology": [{ calc: "meldna", label: "MELD-Na" }, { calc: "gbs", label: "Glasgow-Blatchford" }, { calc: "fib4", label: "FIB-4" }],
  "Critical Care": [{ calc: "sofa", label: "SOFA" }, { calc: "news2", label: "NEWS2" }, { calc: "aagrad", label: "P/F ratio" }],
};

/** Shortcuts for a specialty (empty when there is none or it isn't listed). */
export function specialtyTools(specialty?: string): Shortcut[] {
  return (specialty && SPECIALTY_TOOLS[specialty]) || [];
}
