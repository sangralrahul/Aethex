// Cadus update 24: teleconsultation notes under India's Telemedicine Practice Guidelines (2020).
// Prompts and output checks only (no network), tested on their own.
import { line, list, text } from "./labs.ts";

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;

export const TELE_MODES = ["video", "audio", "text"] as const;
export const TELE_KINDS = ["first", "follow-up"] as const;
export const TELE_LISTS = ["O", "A", "B", "prohibited", "unclear"] as const;
export type TeleMode = (typeof TELE_MODES)[number];
export type TeleKind = (typeof TELE_KINDS)[number];
export type TeleList = (typeof TELE_LISTS)[number];

export const TELECONSULT_SYSTEM = `You are Cadus, writing the record of a teleconsultation by an Indian registered medical practitioner, following the Telemedicine Practice Guidelines (Board of Governors in supersession of MCI, March 2020, part of the professional conduct regulations).
From the doctor's notes, write the consultation record with: date and time [to be completed if not given]; mode (video, audio or text) and whether it is a first consultation or a follow-up; who initiated it; how the patient's identity was confirmed (name, age, and address or ID as stated; write [to be confirmed] if not stated) and, if a caregiver spoke, their name and relationship; consent (implied when the patient initiated; explicit and recorded when the doctor or a health worker initiated); the history and what the patient reported or showed on video (say clearly what could not be examined); the provisional diagnosis; the advice; the prescription; when to seek in-person care or emergency care; follow-up. Never invent findings, vitals or results.
Classify every medicine under the guidelines: "O" (over-the-counter and safe, e.g. paracetamol, ORS, antacids: any mode), "A" (relatively safe medicines with low abuse potential: a first consultation only by video, and re-fills in follow-up), "B" (added at a follow-up to optimise an existing condition already diagnosed in person or by video), "prohibited" (Schedule X drugs and narcotic or psychotropic substances under the NDPS Act: never by telemedicine), or "unclear". If the situation is an emergency, the record must say to give first aid advice and refer immediately.
Reply ONLY as JSON (no code fences):
{"note": the consultation record in markdown (no prescription table; the doctor's registration line as [Name, qualification, registration number]), "diagnosis": "", "rx": [{"drug": "generic name and strength", "dose": "", "frequency": "", "duration": "", "list": "O" | "A" | "B" | "prohibited" | "unclear", "why": "one line on the classification"}], "advice": [plain-language advice], "redFlags": [when to go to a hospital at once], "followUp": "", "emergency": true | false, "inPerson": true if the patient needs to be seen in person, "gaps": [what is missing from the record]}`;

/** Under the guidelines: List O any mode; List A at a first consultation only by video (and as a
 * re-fill at a follow-up); List B only at a follow-up; prohibited never. */
export function teleAllowed(list: TeleList, mode: TeleMode, kind: TeleKind): { ok: boolean; why: string } {
  if (list === "prohibited") return { ok: false, why: "Schedule X or NDPS: can't be prescribed by telemedicine" };
  if (list === "O") return { ok: true, why: "List O: any mode" };
  if (list === "A") return kind === "first" && mode !== "video" ? { ok: false, why: "List A at a first consultation needs a video consultation" } : { ok: true, why: kind === "first" ? "List A: first consultation by video" : "List A: re-fill at a follow-up" };
  if (list === "B") return kind === "follow-up" ? { ok: true, why: "List B: added at a follow-up" } : { ok: false, why: "List B only at a follow-up for a condition already diagnosed" };
  return { ok: false, why: "Classification unclear: check before prescribing" };
}

export interface TeleRx { drug: string; dose: string; frequency: string; duration: string; list: TeleList; why: string; allowed: boolean; rule: string }
export interface Teleconsult { note: string; diagnosis: string; rx: TeleRx[]; advice: string[]; redFlags: string[]; followUp: string; emergency: boolean; inPerson: boolean; gaps: string[] }
export function teleconsult(raw: any, mode: TeleMode, kind: TeleKind): Teleconsult | null {
  const note = text(raw?.note, 12000);
  if (note.length < 120) return null;
  const rx = (Array.isArray(raw.rx) ? raw.rx : []).slice(0, 20).map((r: any) => {
    const l = pick(String(r?.list ?? "").replace(/^list\s*/i, "").trim().replace(/^o$/, "O").replace(/^a$/, "A").replace(/^b$/, "B"), TELE_LISTS, "unclear");
    const rule = teleAllowed(l, mode, kind);
    return { drug: line(r?.drug, 120), dose: line(r?.dose, 80), frequency: line(r?.frequency, 80), duration: line(r?.duration, 60), list: l, why: line(r?.why, 200), allowed: rule.ok, rule: rule.why };
  }).filter((r: { drug: string }) => r.drug);
  return { note, diagnosis: line(raw.diagnosis, 200), rx, advice: list(raw.advice, 10, 240), redFlags: list(raw.redFlags, 8, 200), followUp: line(raw.followUp, 200), emergency: raw.emergency === true, inPerson: raw.inPerson === true || raw.emergency === true, gaps: list(raw.gaps, 8, 200) };
}
