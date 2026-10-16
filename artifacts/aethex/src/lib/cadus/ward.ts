/**
 * Ward actions: one click turns the case being discussed into the document a
 * doctor needs next (a rounds presentation, a referral letter, a discharge
 * summary or a patient explanation in the patient's language).
 */

export type WardActionId = "rounds" | "referral" | "discharge" | "patient";

export interface WardAction {
  id: WardActionId;
  label: string;
  /** The Cadus tool the request runs in. */
  mode: "handover" | "referral" | "discharge" | "patient";
  prompt: (language: string) => string;
}

export const WARD_ACTIONS: WardAction[] = [
  {
    id: "rounds",
    label: "Present on rounds",
    mode: "handover",
    prompt: () => "Turn this case into an SBAR presentation I can give on ward rounds, with a 60-second spoken version.",
  },
  {
    id: "referral",
    label: "Referral letter",
    mode: "referral",
    prompt: () => "Write a referral letter for this patient from our discussion so far.",
  },
  {
    id: "discharge",
    label: "Discharge summary",
    mode: "discharge",
    prompt: () => "Draft a discharge summary for this patient from our discussion so far.",
  },
  {
    id: "patient",
    label: "Explain to the patient",
    mode: "patient",
    prompt: (language) =>
      `Explain this case to the patient and their family in simple ${language || "English"}: what is going on, what we will do next, the warning signs to come back for, and the questions they may ask.`,
  },
];

/** Tools whose answers are about a patient, so the ward actions make sense under them. */
export const CASE_MODES = new Set(["ddx", "labs", "image", "drugs", "dosage", "soap", "handover", "referral", "discharge"]);

/** Whether a free-text question describes a patient (age and sex, "presents with" and so on). */
export function looksLikeCase(text: string): boolean {
  // "54M" or "32/F" (capitals only, so "5 m" stays a distance)
  if (/\b\d{1,3}\s*\/?\s*[MF]\b/.test(text)) return true;
  return /\b\d{1,3}\s*-?\s*(?:years?|yrs?|yr|y)\s*-?\s*(?:old|\/o)\b|\b\d{1,3}\s*(?:yo|y\/o)\b|\b(?:presents?|presented|presenting)\s+with\b|\bc\/o\b|\bcomplain(?:s|ing|ed)?\s+of\b|\bon examination\b|\bo\/e\b|\bvitals?\b/i.test(text);
}
