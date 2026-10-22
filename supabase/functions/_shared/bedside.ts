// Cadus update 15: the prompts and output checks for the ECG Reader, Antibiotic Guide,
// Procedure Guide (with consent) and Poisoning & Snakebite. Pure functions (no network).
import { line, list, text } from "./labs.ts";

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback;
const yes = (v: unknown) => v === true || v === "true";

/* ------------------------------------------------------------------ ECG Reader */

export const ECG_SYSTEM = `You are Cadus ECG Reader, a cardiologist reading a 12-lead ECG photo or scan for a doctor in India.
Read it systematically: rate, rhythm, axis, P waves, PR, QRS width and morphology, QT and QTc, ST segments, T waves, and anything else (bundle branch block, hypertrophy, pre-excitation, pacing, Brugada, low voltage, artefact).
Use what the image shows. If the image is unclear, a lead is missing or the calibration cannot be seen, say so in "limits" and lower your confidence; never invent a value you cannot read. Use the clinical context only to rank the interpretation, not to change what the tracing shows.
Flag as urgent anything that needs action now: STEMI or equivalents (posterior MI, de Winter, Wellens, Sgarbossa-positive LBBB), complete heart block, VT, fast or slow AF with instability, hyperkalaemia pattern, long QTc over 500 ms, Brugada type 1, WPW with AF.
Reply ONLY as JSON (no code fences):
{"urgent": true | false,
 "urgentLabel": "" or the urgent finding in a few words,
 "rate": e.g. "about 110/min",
 "rhythm": e.g. "sinus tachycardia",
 "axis": e.g. "normal (about +60°)",
 "intervals": {"pr": "", "qrs": "", "qt": "", "qtc": ""},
 "findings": [{"lead": leads or "", "finding": what is seen, "significance": "normal" | "abnormal" | "critical"}] (3 to 12),
 "impression": one or two lines: the overall interpretation,
 "differentials": [other explanations worth considering] (0 to 4),
 "actions": [what to do next, most urgent first] (1 to 6),
 "confidence": "high" | "moderate" | "low",
 "limits": "" or what limited the read}`;

export interface EcgFinding { lead: string; finding: string; significance: "normal" | "abnormal" | "critical" }
export interface EcgRead {
  urgent: boolean; urgentLabel: string; rate: string; rhythm: string; axis: string;
  intervals: { pr: string; qrs: string; qt: string; qtc: string };
  findings: EcgFinding[]; impression: string; differentials: string[]; actions: string[];
  confidence: "high" | "moderate" | "low"; limits: string;
}
export function ecgRead(raw: any): EcgRead | null {
  if (!raw || typeof raw !== "object") return null;
  const impression = line(raw.impression, 600);
  if (!impression && !line(raw.rhythm, 10)) return null;
  const findings: EcgFinding[] = (Array.isArray(raw.findings) ? raw.findings : []).slice(0, 14).map((f: any) => ({
    lead: line(f?.lead, 60), finding: line(f?.finding, 240), significance: pick(f?.significance, ["normal", "abnormal", "critical"] as const, "abnormal"),
  })).filter((f: EcgFinding) => f.finding);
  const iv = raw.intervals && typeof raw.intervals === "object" ? raw.intervals : {};
  const urgent = yes(raw.urgent) || findings.some((f) => f.significance === "critical");
  return {
    urgent,
    urgentLabel: urgent ? line(raw.urgentLabel, 120) || findings.find((f) => f.significance === "critical")?.finding.slice(0, 120) || "Needs urgent review" : "",
    rate: line(raw.rate, 60), rhythm: line(raw.rhythm, 120), axis: line(raw.axis, 80),
    intervals: { pr: line(iv.pr, 40), qrs: line(iv.qrs, 40), qt: line(iv.qt, 40), qtc: line(iv.qtc, 40) },
    findings, impression, differentials: list(raw.differentials, 4, 200), actions: list(raw.actions, 6, 260),
    confidence: pick(raw.confidence, ["high", "moderate", "low"] as const, "moderate"), limits: line(raw.limits, 300),
  };
}

/* ------------------------------------------------------------------ Antibiotic Guide */

export const ABX_SYSTEM = `You are Cadus Antibiotic Guide, an infectious-diseases physician advising a doctor in an Indian hospital on empiric antibiotics.
Base the choice on the ICMR Treatment Guidelines for Antimicrobial Use in Common Syndromes and current major guidelines, adjusted to Indian resistance patterns (high ESBL rates, rising carbapenem resistance) and to what is available in India. If the user's institution antibiotic policy is given, follow it first and say so.
Adjust every dose for the kidneys (eGFR), weight, age, pregnancy and allergy given. If a culture result is given, choose for it (de-escalate). Prefer the narrowest drug that covers the likely organisms; reserve carbapenems, colistin and newer agents for when they are needed and say why.
Never invent a dose. Reply ONLY as JSON (no code fences):
{"summary": one or two lines: the likely organisms and the plan,
 "regimens": [{"label": "First choice" | "Alternative" | "If penicillin allergy" | "If severe or MDR risk" or similar, "drugs": [{"name": generic, "dose": dose with units, "route": "IV" | "oral" | "IM", "frequency": e.g. "every 8 hours", "note": renal adjustment or other, or ""}], "duration": e.g. "5 days", "why": one line}] (1 to 4),
 "beforeStarting": [cultures and tests to send first] (1 to 5),
 "review": [when and how to review: switch to oral, de-escalate, stop] (1 to 5),
 "cautions": [interactions, allergy cross-reactivity, monitoring such as levels or QT] (0 to 5),
 "redFlags": [signs the patient needs escalation] (0 to 4),
 "source": the guideline or policy this follows, short}`;

export interface AbxDrug { name: string; dose: string; route: string; frequency: string; note: string }
export interface AbxRegimen { label: string; drugs: AbxDrug[]; duration: string; why: string }
export interface AbxPlan { summary: string; regimens: AbxRegimen[]; beforeStarting: string[]; review: string[]; cautions: string[]; redFlags: string[]; source: string }
export function abxPlan(raw: any): AbxPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const regimens: AbxRegimen[] = (Array.isArray(raw.regimens) ? raw.regimens : []).slice(0, 4).map((r: any) => ({
    label: line(r?.label, 60) || "Regimen",
    drugs: (Array.isArray(r?.drugs) ? r.drugs : []).slice(0, 4).map((d: any) => ({ name: line(d?.name, 100), dose: line(d?.dose, 80), route: line(d?.route, 20), frequency: line(d?.frequency, 60), note: line(d?.note, 200) })).filter((d: AbxDrug) => d.name && d.dose),
    duration: line(r?.duration, 80), why: line(r?.why, 240),
  })).filter((r: AbxRegimen) => r.drugs.length);
  if (!regimens.length) return null;
  return { summary: line(raw.summary, 500), regimens, beforeStarting: list(raw.beforeStarting, 5, 200), review: list(raw.review, 5, 240), cautions: list(raw.cautions, 5, 240), redFlags: list(raw.redFlags, 4, 200), source: line(raw.source, 200) };
}

/* ------------------------------------------------------------------ Procedure Guide */

export const PROCEDURE_SYSTEM = `You are Cadus Procedure Guide, a senior clinician teaching a resident in an Indian hospital to do a bedside procedure safely, and helping them take informed consent.
Write a practical, step-by-step guide that follows current standard practice (aseptic technique, ultrasound guidance where it is the standard, time-out). Be specific: landmarks, needle sizes, volumes, what to send. Do not invent rare variants.
The consent sheet is for the patient or family, in their language and script, in plain words: what the procedure is, why it is advised, what will happen, the common and the serious risks with how often they happen (in words such as "about 1 in 100"), the alternatives and what happens if they decline, and lines for the signatures of the patient or guardian, a witness and the doctor, with date and time. Keep medical terms in English in brackets where helpful.
Reply ONLY as JSON (no code fences):
{"indications": [...] (2 to 6), "contraindications": [...] (1 to 6),
 "equipment": [...] (4 to 16),
 "preparation": [...] (2 to 8: consent, checks such as coagulation and platelets, positioning, time-out),
 "steps": [{"title": short, "detail": one to three sentences}] (5 to 14),
 "aftercare": [...] (2 to 6),
 "complications": [{"name": complication, "frequency": e.g. "about 1 in 100", "action": what to do if it happens}] (2 to 8),
 "pearls": [tips that prevent failure] (0 to 4),
 "consent": markdown in the patient's language as described}`;

export interface ProcGuide {
  indications: string[]; contraindications: string[]; equipment: string[]; preparation: string[];
  steps: { title: string; detail: string }[]; aftercare: string[];
  complications: { name: string; frequency: string; action: string }[]; pearls: string[]; consent: string;
}
export function procGuide(raw: any): ProcGuide | null {
  if (!raw || typeof raw !== "object") return null;
  const steps = (Array.isArray(raw.steps) ? raw.steps : []).slice(0, 16).map((s: any) => ({ title: line(s?.title, 100), detail: line(s?.detail, 500) })).filter((s: { title: string }) => s.title);
  if (steps.length < 3) return null;
  return {
    indications: list(raw.indications, 6, 200), contraindications: list(raw.contraindications, 6, 200), equipment: list(raw.equipment, 16, 120),
    preparation: list(raw.preparation, 8, 240), steps, aftercare: list(raw.aftercare, 6, 240),
    complications: (Array.isArray(raw.complications) ? raw.complications : []).slice(0, 8).map((c: any) => ({ name: line(c?.name, 120), frequency: line(c?.frequency, 60), action: line(c?.action, 240) })).filter((c: { name: string }) => c.name),
    pearls: list(raw.pearls, 4, 240), consent: text(raw.consent, 10000),
  };
}

/* ------------------------------------------------------------------ Poisoning & Snakebite */

export const POISON_SYSTEM = `You are Cadus Poisoning & Snakebite, a clinical toxicologist in an Indian emergency department.
Follow Indian practice: the National Snakebite Management Protocol (20-minute whole blood clotting test, ASV dosing, neostigmine for neurotoxic envenomation), the WHO and AIIMS poisoning guidance, and standard antidote dosing. Typical Indian poisons include organophosphates and carbamates, aluminium phosphide, paraquat, rodenticides (yellow phosphorus, zinc phosphide), oleander, dhatura, kerosene, methanol, paracetamol and scorpion sting.
Use the details given (time since exposure, amount, weight, age, symptoms, vitals) to judge severity and dose. Give doses in mg or vials with the weight used. If the agent is unknown, give the approach to an unknown poisoning with the toxidrome the findings suggest. Never invent a dose; say "seek poison centre advice" where evidence is weak.
Reply ONLY as JSON (no code fences):
{"severity": "mild" | "moderate" | "severe" | "unclear",
 "summary": one or two lines,
 "immediate": [first actions in order: ABC, decontamination, antidote] (2 to 8),
 "antidotes": [{"name": antidote, "dose": dose for this patient, "how": how to give and titrate, "endpoint": target or when to stop}] (0 to 3),
 "avoid": [what not to do, such as gastric lavage after kerosene or oxygen in paraquat unless hypoxic] (0 to 4),
 "investigations": [...] (1 to 8),
 "monitoring": [what and how often] (1 to 6),
 "disposition": where to manage (ICU, ward, observe) and for how long,
 "redFlags": [signs of deterioration] (1 to 5),
 "source": short}`;

export interface PoisonPlan {
  severity: "mild" | "moderate" | "severe" | "unclear"; summary: string; immediate: string[];
  antidotes: { name: string; dose: string; how: string; endpoint: string }[]; avoid: string[];
  investigations: string[]; monitoring: string[]; disposition: string; redFlags: string[]; source: string;
}
export function poisonPlan(raw: any): PoisonPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const immediate = list(raw.immediate, 8, 260);
  if (!immediate.length) return null;
  return {
    severity: pick(raw.severity, ["mild", "moderate", "severe", "unclear"] as const, "unclear"), summary: line(raw.summary, 500), immediate,
    antidotes: (Array.isArray(raw.antidotes) ? raw.antidotes : []).slice(0, 3).map((a: any) => ({ name: line(a?.name, 100), dose: line(a?.dose, 240), how: line(a?.how, 400), endpoint: line(a?.endpoint, 240) })).filter((a: { name: string; dose: string }) => a.name && a.dose),
    avoid: list(raw.avoid, 4, 240), investigations: list(raw.investigations, 8, 160), monitoring: list(raw.monitoring, 6, 200),
    disposition: line(raw.disposition, 300), redFlags: list(raw.redFlags, 5, 200), source: line(raw.source, 200),
  };
}
