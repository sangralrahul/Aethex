// Cadus update 27: a patient handout (action plan, sick-day rules, milestones) translated into
// the patient's language. Prompt and output check only (no network), tested on their own.
import { text } from "./labs.ts";

export const TRANSLATE_DOC_SYSTEM = `You translate a patient handout written by an Indian doctor into the language asked, in its own script, for a patient or family who may not read well.
Keep the markdown structure (headings, lists, bold). Keep every medicine name, dose, number, time and phone number exactly as written (medicine names may stay in English in brackets). Use plain, respectful everyday words, not literary language. Never add or leave out advice.
Reply ONLY as JSON (no code fences): {"text": the translated markdown}`;

/** The translation must keep every number from the original (doses, times, phone numbers). */
export function translatedDoc(raw: any, original: string): { text: string; missingNumbers: string[] } | null {
  const t = text(raw?.text, 20000);
  if (t.length < 20) return null;
  const nums = [...new Set(original.match(/\d+(?:[.,]\d+)?/g) ?? [])];
  const western = t.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d))).replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/[੦-੯]/g, (d) => String("੦੧੨੩੪੫੬੭੮੯".indexOf(d))).replace(/[૦-૯]/g, (d) => String("૦૧૨૩૪૫૬૭૮૯".indexOf(d)));
  return { text: t, missingNumbers: nums.filter((n) => !western.includes(n)).slice(0, 10) };
}
