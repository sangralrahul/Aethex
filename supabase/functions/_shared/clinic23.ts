// Cadus update 23 (1.0.3): diet charts, ICD-10 coding, bilingual consent forms and medico-legal
// injury reports. Prompts and output checks only (no network), tested on their own.
import { line, list, text } from "./labs.ts";

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

/* ------------------------------------------------------------------ Diet chart */

export const DIET_TYPES = ["vegetarian", "eggetarian", "non-vegetarian", "jain", "vegan"] as const;
export const DIET_SYSTEM = `You are Cadus, a clinical dietitian in India writing a one-day diet chart for a patient, to be handed over by their doctor.
Use everyday Indian foods from the region given, in household measures (katori, cup, glass, roti, teaspoon, palm-sized piece), within the calories and protein given, and suited to every condition listed (for example: diabetes, low glycaemic load and spread evenly, no fruit juice; CKD, the protein given, potassium and phosphorus limited, salt under 5 g; heart disease and hypertension, low salt, no trans fats; pregnancy, iron, folate, calcium and protein; weight loss, high fibre and protein). Respect the diet type strictly (Jain: no root vegetables, onion or garlic; vegan: no dairy). Keep it affordable and practical.
Reply ONLY as JSON (no code fences):
{"title": "", "kcal": number, "protein": number in grams, "meals": [{"time": "e.g. 7:00 am", "name": "Early morning" | "Breakfast" | "Mid-morning" | "Lunch" | "Evening" | "Dinner" | "Bedtime", "items": ["food with its measure"]}], "prefer": [foods to choose], "limit": [foods to limit or avoid], "swaps": [easy swaps, e.g. "white rice → brown rice or millets"], "tips": [short practical tips], "local": the whole chart in the patient's language in its own script as markdown (empty if English)}`;

export interface DietChart { title: string; kcal: number; protein: number; meals: { time: string; name: string; items: string[] }[]; prefer: string[]; limit: string[]; swaps: string[]; tips: string[]; local: string }
export function dietChart(raw: any): DietChart | null {
  const meals = (Array.isArray(raw?.meals) ? raw.meals : []).slice(0, 9).map((m: any) => ({ time: line(m?.time, 30), name: line(m?.name, 40), items: list(m?.items, 10, 160) })).filter((m: { name: string; items: string[] }) => m.name && m.items.length);
  if (meals.length < 3) return null;
  const n = (v: unknown, lo: number, hi: number) => { const x = Math.round(Number(v)); return Number.isFinite(x) && x >= lo && x <= hi ? x : 0; };
  return {
    title: line(raw.title, 120) || "Diet chart", kcal: n(raw.kcal, 600, 5000), protein: n(raw.protein, 10, 250), meals,
    prefer: list(raw.prefer, 12, 160), limit: list(raw.limit, 12, 160), swaps: list(raw.swaps, 8, 160), tips: list(raw.tips, 8, 200), local: text(raw.local, 8000),
  };
}

/* ------------------------------------------------------------------ ICD-10 coding */

export const ICD_ROLES = ["principal", "secondary", "complication", "external cause", "symptom", "history"] as const;
export const ICD_SYSTEM = `You are Cadus, a clinical coder in an Indian hospital coding with WHO ICD-10 (the version used in India for medical records, mortality and insurance claims, including PM-JAY). From the diagnoses or the discharge summary given, choose the codes a careful coder would assign: the principal diagnosis (the condition chiefly responsible for the admission or visit) first, then secondary diagnoses and comorbidities that affected care, complications, and external causes (V01–Y98) for injuries and poisonings. Use the most specific valid code (a fourth character where ICD-10 has one). Don't code symptoms when a related confirmed diagnosis is coded. Don't code anything that is not documented; list what is missing from the documentation that would change or sharpen the codes (laterality, type of diabetes and its complications, the organism, acute or chronic, the cause of an injury).
Reply ONLY as JSON (no code fences):
{"codes": [{"code": "e.g. E11.2", "title": "the ICD-10 title", "role": "principal" | "secondary" | "complication" | "external cause" | "symptom" | "history", "why": "the words in the document that support it", "confidence": "high" | "medium" | "low"}], "missing": [documentation gaps], "note": "one line on sequencing or conventions used"}`;

export const ICD_RE = /^[A-Z][0-9]{2}(?:\.[0-9A-Z]{1,2})?$/;
export interface IcdResult { codes: { code: string; title: string; role: (typeof ICD_ROLES)[number]; why: string; confidence: "high" | "medium" | "low" }[]; missing: string[]; note: string }
export function icdResult(raw: any): IcdResult | null {
  const seen = new Set<string>();
  const codes = (Array.isArray(raw?.codes) ? raw.codes : []).slice(0, 25).map((c: any) => {
    let code = String(c?.code ?? "").toUpperCase().replace(/\s+/g, "").replace(/\.$/, "");
    if (/^[A-Z][0-9]{3,4}$/.test(code)) code = `${code.slice(0, 3)}.${code.slice(3)}`;
    return { code, title: line(c?.title, 200), role: pick(c?.role, ICD_ROLES, "secondary"), why: line(c?.why, 300), confidence: pick(c?.confidence, ["high", "medium", "low"] as const, "medium") };
  }).filter((c: { code: string; title: string }) => ICD_RE.test(c.code) && c.title && !seen.has(c.code) && (seen.add(c.code), true));
  if (!codes.length) return null;
  // Exactly one principal diagnosis, and it comes first.
  let p = codes.findIndex((c: { role: string }) => c.role === "principal");
  if (p < 0) { p = 0; codes[0].role = "principal"; }
  codes.forEach((c: { role: string }, i: number) => { if (i !== p && c.role === "principal") c.role = "secondary"; });
  codes.unshift(...codes.splice(p, 1));
  return { codes, missing: list(raw.missing, 10, 240), note: line(raw.note, 300) };
}

/* ------------------------------------------------------------------ Consent form */

export const CONSENT_KINDS = ["surgery", "anaesthesia", "procedure", "transfusion", "high-risk", "refusal", "other"] as const;
export const CONSENT_SYSTEM = `You write informed-consent forms for Indian hospitals that meet Indian law and practice (the NMC code of ethics; Samira Kohli v. Prabha Manchanda: consent must be real, informed and specific to the procedure; a separate consent for anaesthesia when it is significant; a guardian for a minor or a patient who lacks capacity; an LAMA or refusal form when treatment is refused).
Write the form for the procedure and the patient details given (never invent names or numbers: use blank lines such as "________"). Include: a patient block with blanks (name, age and sex, UHID or IP number, ward and bed, date and time); the procedure, site and side, in plain words, and why it is advised; what will be done and the anaesthesia; the expected benefits; the material risks with a rough frequency ("common, about 1 in 10", "rare, about 1 in 1,000"), including risks specific to this patient from the details given; alternatives including no treatment and what would happen then; that another procedure may be needed if unexpected findings arise; blood transfusion, photographs for records and the use of removed tissue, each with its own yes/no line; that no result is guaranteed; that trainees may take part under supervision; the right to ask questions, to a second opinion and to withdraw; a declaration that it was explained in the language named; then signatures as a markdown table: patient or guardian (name, relation, signature or thumb impression, date and time), witness, interpreter if used, and the doctor's declaration (name, registration number, signature, date and time). For a high-risk consent, state the specific risk to life plainly. For a refusal, record what was advised, the risks of refusing, and that the patient may come back at any time.
Write it in English, and the same form in the patient's language in its own script (keep medical terms understandable, with the English term in brackets where useful). Also give the doctor a short checklist for the consent conversation.
Reply ONLY as JSON (no code fences): {"title": "", "english": markdown, "local": markdown in the patient's language (empty if English), "risks": [{"risk": "", "frequency": ""}], "checklist": [""]}`;

export interface ConsentForm { title: string; english: string; local: string; risks: { risk: string; frequency: string }[]; checklist: string[] }
export function consentForm(raw: any): ConsentForm | null {
  const english = text(raw?.english, 16000);
  if (english.length < 300 || !/signature/i.test(english)) return null;
  return {
    title: line(raw.title, 160) || "Informed consent", english, local: text(raw.local, 20000),
    risks: (Array.isArray(raw.risks) ? raw.risks : []).slice(0, 20).map((r: any) => ({ risk: line(r?.risk, 200), frequency: line(r?.frequency, 80) })).filter((r: { risk: string }) => r.risk),
    checklist: list(raw.checklist, 10, 200),
  };
}

/* ------------------------------------------------------------------ Medico-legal injury report */

export const INJURY_TYPES = ["abrasion", "contusion", "laceration", "incised", "stab", "chop", "firearm", "burn", "fracture", "bite", "other"] as const;
export const NATURE = ["simple", "grievous", "dangerous to life", "under observation"] as const;
export const MLC_SYSTEM = `You are Cadus, helping a casualty medical officer in India write the injury report of a medico-legal case (MLC) from their own examination notes. The doctor examines and gives the opinion; you organise and word it the way Indian courts expect, from what the notes say only.
For each injury: the type (abrasion, contusion, laceration, incised wound, stab wound, chop wound, firearm wound, burn, fracture, bite, other), its size in cm (length × breadth × depth as noted, "depth not probed" if not given), the exact site with distances from fixed anatomical landmarks as noted, colour, margins, edges, bleeding or scab, the probable age of the injury from those features, and the kind of weapon or force (blunt, sharp, sharp-pointed, firearm, thermal, chemical). Then the nature of each injury: "simple", "grievous" (only when it fits the definition of grievous hurt in Section 116 of the Bharatiya Nyaya Sanhita, 2023, which replaced Section 320 IPC: name the clause), "dangerous to life", or "under observation" when an X-ray, CT or specialist opinion is awaited (say what is awaited). Never invent an injury, a size, a time or a history; write "________" for anything the doctor still has to fill in. Note samples to preserve (clothes, swabs, blood or urine for alcohol), that the police were informed, and anything inconsistent between the history and the injuries.
Reply ONLY as JSON (no code fences):
{"injuries": [{"no": 1, "type": "", "description": "the full description", "site": "", "size": "", "age": "", "weapon": "", "nature": "simple" | "grievous" | "dangerous to life" | "under observation", "why": "the reason for the nature, with the clause where grievous", "awaiting": ""}], "report": the full injury report in markdown with blanks for the case details and the doctor's signature, "samples": [""], "flags": [inconsistencies or things to check before signing]}`;

export interface MlcReport { injuries: { no: number; type: (typeof INJURY_TYPES)[number]; description: string; site: string; size: string; age: string; weapon: string; nature: (typeof NATURE)[number]; why: string; awaiting: string }[]; report: string; samples: string[]; flags: string[] }
export function mlcReport(raw: any): MlcReport | null {
  const report = text(raw?.report, 16000);
  const injuries = (Array.isArray(raw?.injuries) ? raw.injuries : []).slice(0, 40).map((i: any, k: number) => {
    const t0 = String(i?.type ?? "").toLowerCase().replace(/\s*(?:wound|injury)s?$/, "").trim();
    const type = ({ lacerated: "laceration", "lacerated cut": "laceration", contused: "contusion", bruise: "contusion", abraded: "abrasion", "incised cut": "incised", "punctured": "stab", "gunshot": "firearm" } as Record<string, string>)[t0] ?? t0;
    const nature = pick(String(i?.nature ?? "").toLowerCase(), NATURE, "under observation");
    const awaiting = line(i?.awaiting, 200);
    return {
      no: k + 1, type: pick(type, INJURY_TYPES, "other"), description: text(i?.description, 800), site: line(i?.site, 200), size: line(i?.size, 80), age: line(i?.age, 120), weapon: line(i?.weapon, 120),
      // An opinion that waits on an investigation can't be final yet.
      nature: awaiting && nature !== "dangerous to life" ? "under observation" as const : nature, why: line(i?.why, 400), awaiting,
    };
  }).filter((i: { description: string }) => i.description);
  if (!injuries.length || report.length < 100) return null;
  return { injuries, report, samples: list(raw.samples, 10, 200), flags: list(raw.flags, 10, 240) };
}
