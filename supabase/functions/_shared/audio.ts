// Cadus update 18: scripts for spoken audio (ElevenLabs voices): patient instructions read aloud,
// and two-voice revision podcasts. Pure functions (no network), tested on their own.
import { line, text } from "./labs.ts";

export const SPOKEN_SYSTEM = `You turn written patient instructions from an Indian hospital or clinic into a script that will be read aloud to the patient and family by a natural voice, for patients who may not read well.
Write in the language asked for, in its own script, in warm, simple, spoken words (respectful "aap" forms where the language has them), as a doctor or nurse would explain at the bedside. Keep medicine names in English, said clearly.
Turn tables and lists into sentences: for each medicine, what it is for, when to take it (morning, afternoon, night; before or after food) and for how long. Say the warning signs that need an urgent return, and the follow-up date if given. Repeat the most important instruction once at the end.
Use ONLY what is in the instructions; never add a medicine, dose or advice. No markdown, no symbols, no headings, no emoji, no stage directions. Under 2,200 characters. Reply with the script only.`;

export function spokenScript(raw: unknown): string {
  return text(raw, 2400).replace(/[*#_`|>]/g, " ").replace(/^\s*[-•]\s*/gm, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export const PODCAST_SYSTEM = `You write short revision podcasts for medical students and doctors preparing for NEET-PG, INI-CET, FMGE and university exams in India. Two voices: a teacher (an experienced, friendly professor) and a student (curious, sometimes wrong in the ways students usually are, so the teacher can correct the common mistake).
Make it sound like a real conversation, not a lecture read out: short turns, natural reactions, a quick recap at the end. Teach the high-yield, exam-relevant points of the topic accurately, with the numbers, criteria, drugs and doses examiners ask about, the classic traps, and one mnemonic if a good one exists. Indian context and guidelines where relevant. Never invent facts or numbers.
Write for the ear: no markdown, no lists, no symbols, no abbreviations that sound odd aloud (say "milligrams", "per kilogram"). Language: as asked (for Hinglish, natural Hindi-English mix in Latin script).
Reply ONLY as JSON (no code fences):
{"title": short title, "summary": one line, "lines": [{"who": "teacher" | "student", "text": one turn, 1 to 4 sentences}] }`;

export interface PodcastScript { title: string; summary: string; lines: { who: "teacher" | "student"; text: string }[] }
export function podcastScript(raw: any, maxLines = 60): PodcastScript | null {
  if (!raw || typeof raw !== "object") return null;
  const lines = (Array.isArray(raw.lines) ? raw.lines : []).slice(0, maxLines)
    .map((l: any) => ({ who: l?.who === "student" ? "student" as const : "teacher" as const, text: line(l?.text, 900).replace(/[*#_`]/g, "") }))
    .filter((l: { text: string }) => l.text.length > 1);
  if (lines.length < 4) return null;
  return { title: line(raw.title, 100) || "Revision podcast", summary: line(raw.summary, 200), lines };
}
/** Words for a podcast of this length (about 150 spoken words a minute). */
export const podcastWords = (minutes: number) => Math.round(Math.max(2, Math.min(10, minutes)) * 150);
