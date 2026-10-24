// Cadus update 25: kidney dose adjustment for medicines not in the on-device table. Prompt and
// output check only (no network), tested on its own.
import { line, list } from "./labs.ts";

export const RENAL_SYSTEM = `You are Cadus, a clinical pharmacist advising a doctor in India on dosing in reduced kidney function.
For each medicine, give the usual adult dose and the dose for creatinine clearance (Cockcroft-Gault) over 50, 30–50, 10–30 and under 10 ml/min, and on haemodialysis (when to give it relative to dialysis), following the product label, the BNF and standard renal dosing references. Say "no change" where none is needed and "avoid" where the medicine shouldn't be used, with a safer alternative. Add what to monitor (levels, potassium, glucose, sedation). Never invent precision: give ranges where references give ranges, and say when evidence is limited.
Reply ONLY as JSON (no code fences):
{"items": [{"drug": "", "usual": "", "gt50": "", "b30_50": "", "b10_30": "", "lt10": "", "hd": "", "avoidBelow": "a CrCl below which to avoid, or empty", "alternative": "", "monitor": ""}], "note": "one line"}`;

export interface RenalAi { drug: string; usual: string; gt50: string; b30_50: string; b10_30: string; lt10: string; hd: string; avoidBelow: string; alternative: string; monitor: string }
export function renalAi(raw: any): { items: RenalAi[]; note: string } | null {
  const items = (Array.isArray(raw?.items) ? raw.items : []).slice(0, 10).map((i: any) => ({
    drug: line(i?.drug, 100), usual: line(i?.usual, 160), gt50: line(i?.gt50, 160) || "No change", b30_50: line(i?.b30_50, 200), b10_30: line(i?.b10_30, 200), lt10: line(i?.lt10, 200), hd: line(i?.hd, 200),
    avoidBelow: line(i?.avoidBelow, 40), alternative: line(i?.alternative, 160), monitor: line(i?.monitor, 200),
  })).filter((i: RenalAi) => i.drug && i.usual && (i.b30_50 || i.b10_30 || i.lt10));
  if (!items.length) return null;
  return { items, note: line(raw.note, 300) };
}
export const renalDrugs = (v: unknown) => list(Array.isArray(v) ? v : String(v ?? "").split(/\n|,/), 10, 100);
