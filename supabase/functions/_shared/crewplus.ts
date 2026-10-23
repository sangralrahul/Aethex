// Cadus Crew, update 16: the Assistant Builder and Crew Debate. Prompts and output checks
// (pure functions, no network), tested on their own.
import { line, list, text } from "./labs.ts";

/** Must match CREW_ICONS and CREW_TONES in the app (lib/cadus/crew.ts). */
export const CREW_ICONS = ["stethoscope", "graduation", "pill", "file", "microscope", "heart", "baby", "brain", "users", "clipboard", "siren", "book", "scan", "scalpel", "shield", "bone", "eye", "ear", "droplets", "zap", "syringe", "globe", "sun"] as const;
export const CREW_TONES = ["teal", "violet", "rose", "amber", "sky", "lime", "navy", "slate"] as const;

/* ------------------------------------------------------------------ Assistant Builder */

export const BUILD_SYSTEM = `You design assistants for Cadus Crew, a clinical AI app for doctors and medical students in India. Each assistant is a set of instructions that shapes how Cadus answers in its chats, like a custom GPT.
From the user's one-line description, write a complete assistant:
- "name": 2 to 4 words, like a job title ("Pharmacology Examiner", "Night Shift Buddy"). No emoji, no "AI", no "GPT".
- "tagline": one line under 90 characters saying what it does.
- "instructions": 80 to 220 words, second person ("You are… / Act as…"): the role and audience; what it does step by step; the output format (bullets, tables, one question at a time, word limits); the standards it follows (Indian guidelines such as ICMR, NMC, MoHFW, FOGSI, IAP, NTEP where relevant, and international ones); what it must never do (invent doses, references or results); when to ask for missing details (weight, age, eGFR). Specific, practical, safe. Never ask it to ignore Cadus's safety standards.
- "starters": exactly 4 first questions a user would type, each under 70 characters, varied.
- "icon": one of ${CREW_ICONS.join(", ")}.
- "tone": one of ${CREW_TONES.join(", ")}.
- "mode": the id of the best Cadus tool from the list given, or "general".
- "sources": true if every answer should cite trusted sources (research, guidelines), else false.
Reply ONLY as JSON (no code fences) with exactly these keys.`;

export interface BuiltAssistant { name: string; tagline: string; instructions: string; starters: string[]; icon: string; tone: string; mode: string; sources: boolean }
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => ((allowed as readonly string[]).includes(String(v)) ? (String(v) as T) : fallback);
export function builtAssistant(raw: any, modes: string[]): BuiltAssistant | null {
  if (!raw || typeof raw !== "object") return null;
  const name = line(raw.name, 40).replace(/[<>`"]/g, "").replace(/\b(AI|GPT)\b/g, "").replace(/\s{2,}/g, " ").trim();
  const instructions = text(raw.instructions, 4000);
  if (!name || instructions.length < 40) return null;
  const starters = list(raw.starters, 4, 120);
  return {
    name, tagline: line(raw.tagline, 90), instructions, starters,
    icon: pick(raw.icon, CREW_ICONS, "stethoscope"), tone: pick(raw.tone, CREW_TONES, "teal"),
    mode: modes.includes(String(raw.mode)) ? String(raw.mode) : "general",
    sources: raw.sources === true,
  };
}

/* ------------------------------------------------------------------ Crew Debate */

export const DEBATE_SYSTEM = `You are taking part in a Crew Debate in Cadus, a clinical AI app for doctors and medical students in India: two Cadus Crew assistants argue opposite positions on a clinical question so the user can see the strongest case for each before a neutral judge decides.
Argue your assigned position as well as the evidence honestly allows. Use real evidence only: guidelines (Indian and international, with body and year), trials by name, physiology and the patient's details. Never invent a study, number or guideline. Concede a point when the evidence is against you; say what would change your mind.
Keep to 150 to 250 words, in markdown: a one-line claim in bold, then 3 to 5 numbered arguments. In a rebuttal, answer the other side's strongest points directly first.`;

export function debatePrompt(o: { question: string; position: string; other: string; round: 1 | 2; opponent: string; opponentName: string }): string {
  return [
    `QUESTION: ${o.question}`,
    `YOUR POSITION: ${o.position}`,
    `THE OTHER SIDE ARGUES: ${o.other}`,
    o.round === 1 ? "ROUND 1: give your opening argument." : `ROUND 2: rebut. Here is ${o.opponentName}'s opening argument:\n<opponent>\n${o.opponent}\n</opponent>\nAnswer its strongest points, then restate your case in one line.`,
  ].join("\n");
}

export const JUDGE_SYSTEM = `You are Cadus, the neutral judge of a Crew Debate: two Cadus Crew assistants argued opposite positions on a clinical question for a doctor or medical student in India. You have both openings and both rebuttals.
Judge on the evidence, not on rhetoric. Check every claim against current evidence and Indian and international guidelines; call out anything wrong, unsafe or invented. Often the right answer is "it depends": then say exactly on what.
Reply ONLY as JSON (no code fences):
{"winner": "a" | "b" | "draw" | "depends",
 "bottomLine": one or two sentences: what to actually do,
 "verdict": markdown, 120 to 250 words: why, weighing the strongest points of each side, and when the other side would be right,
 "strongest": {"a": the single strongest point for side A, "b": the same for side B},
 "errors": [{"who": assistant name, "issue": what was wrong, unsafe or unsupported, "fix": the correct information}] (empty if none),
 "evidence": [the key guidelines or trials that decide it, with body or trial name and year] (1 to 5),
 "confidence": "high" | "moderate" | "low"}`;

export interface DebateVerdict { winner: "a" | "b" | "draw" | "depends"; bottomLine: string; verdict: string; strongest: { a: string; b: string }; errors: { who: string; issue: string; fix: string }[]; evidence: string[]; confidence: "high" | "moderate" | "low" }
export function debateVerdict(raw: any): DebateVerdict | null {
  if (!raw || typeof raw !== "object") return null;
  const bottomLine = line(raw.bottomLine, 500);
  const verdict = text(raw.verdict, 6000);
  if (!bottomLine || !verdict) return null;
  const s = raw.strongest && typeof raw.strongest === "object" ? raw.strongest : {};
  return {
    winner: pick(raw.winner, ["a", "b", "draw", "depends"] as const, "depends"), bottomLine, verdict,
    strongest: { a: line(s.a, 300), b: line(s.b, 300) },
    errors: (Array.isArray(raw.errors) ? raw.errors : []).slice(0, 6).map((e: any) => ({ who: line(e?.who, 60), issue: line(e?.issue, 300), fix: line(e?.fix, 300) })).filter((e: { issue: string }) => e.issue),
    evidence: list(raw.evidence, 5, 200),
    confidence: pick(raw.confidence, ["high", "moderate", "low"] as const, "moderate"),
  };
}
