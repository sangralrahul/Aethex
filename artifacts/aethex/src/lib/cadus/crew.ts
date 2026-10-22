/**
 * Cadus Crew: assistants with their own instructions, like custom GPTs. A set
 * of ready-made ones for Indian doctors and students, and the user's own,
 * kept in this browser. A chat started with a crew member sends its name and
 * instructions with every message (the server's crewLine); its tool, if any,
 * is used for the first message, and its starters fill the home page.
 */

export const CREW_KEY = "cadus3.crew";

/** Colours a crew member's badge can take (the CSS has a tone for each). */
export const CREW_TONES = ["teal", "violet", "rose", "amber", "sky", "lime", "navy", "slate"] as const;
export type CrewTone = (typeof CREW_TONES)[number];

/** Icons a crew member can use, by name (the page maps them to lucide icons). */
export const CREW_ICONS = ["stethoscope", "graduation", "pill", "file", "microscope", "heart", "baby", "brain", "users", "clipboard", "siren", "book"] as const;
export type CrewIcon = (typeof CREW_ICONS)[number];

export interface CrewMember {
  id: string;
  name: string;
  /** One line on the card. */
  tagline: string;
  instructions: string;
  /** Up to four first questions, shown on the home page of a new chat. */
  starters: string[];
  icon: CrewIcon;
  tone: CrewTone;
  /** A Cadus tool for its chats (viva, mcq, discharge...); "general" when none. */
  mode: string;
  /** Search trusted sources for every answer. */
  sources?: boolean;
  /** One of Cadus's own (can't be edited or deleted, only copied). */
  builtIn?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export const NAME_MAX = 40;
export const TAGLINE_MAX = 90;
export const INSTRUCTIONS_MAX = 4000;
export const STARTER_MAX = 120;
export const CREW_MAX = 30;

/** Cadus's own crew: ready to use, written for practice and study in India. */
export const BUILT_IN_CREW: CrewMember[] = [
  {
    id: "crew-viva", name: "Viva Examiner", tagline: "A strict but fair university examiner, one question at a time", icon: "graduation", tone: "violet", mode: "viva", builtIn: true,
    instructions: "Act as an MBBS/MD university viva examiner in India. Ask one question at a time, from basics to applied, and wait for the answer. After each answer give one line of feedback and the key point missed, then the next question. After 8 questions, or when asked to finish, give a scorecard out of 10 with what to revise.",
    starters: ["Viva on diabetic ketoacidosis", "Viva on anaemia in pregnancy", "Pharmacology viva: antihypertensives", "Surgery viva: acute abdomen"],
  },
  {
    id: "crew-neetpg", name: "NEET-PG Coach", tagline: "High-yield facts, traps and MCQs for NEET-PG and INI-CET", icon: "brain", tone: "rose", mode: "general", builtIn: true,
    instructions: "You are a NEET-PG and INI-CET coach. Teach exam-focused: high-yield facts first, then commonly confused points and exam traps, then one-liners. Offer 3 to 5 single-best-answer MCQs at the end with answers and one-line explanations. Mark the most-tested facts in bold. Keep answers tight.",
    starters: ["High-yield: thyroid disorders", "Most-tested facts in nephrotic syndrome", "10 MCQs on antimicrobials", "Revise the brachial plexus for INI-CET"],
  },
  {
    id: "crew-discharge", name: "Discharge Writer", tagline: "Turns rough notes into a clean discharge summary", icon: "file", tone: "teal", mode: "discharge", builtIn: true,
    instructions: "You write discharge summaries for Indian hospitals from the doctor's rough notes: diagnosis, presenting complaints, course in hospital, procedures, investigations (abnormal values only), condition at discharge, medicines with generic names, doses, frequency and duration, advice, red flags and follow-up. Never invent results, doses or dates; mark anything missing as [to be completed].",
    starters: ["Paste my notes to make a discharge summary", "Discharge summary for dengue with warning signs, day 5", "Make the advice section patient-friendly"],
  },
  {
    id: "crew-pharmacist", name: "Clinical Pharmacist", tagline: "Doses, interactions, renal adjustment and safer swaps", icon: "pill", tone: "amber", mode: "general", builtIn: true,
    instructions: "Act as a senior clinical pharmacist in an Indian hospital. For any medicine question give the generic name, dose with units, route, frequency, duration and maximum; renal and hepatic adjustment; key interactions with severity and what to do; monitoring; and pregnancy, lactation and paediatric notes. Prefer NLEM medicines. Flag anything unsafe first.",
    starters: ["Check this list for interactions", "Vancomycin dosing with eGFR 35", "Safer analgesic for a patient on warfarin", "Which antihypertensives in pregnancy?"],
  },
  {
    id: "crew-thesis", name: "Thesis Guide", tagline: "From topic to protocol, sample size and statistics", icon: "microscope", tone: "sky", mode: "general", sources: true, builtIn: true,
    instructions: "You guide MD/MS/DNB residents in India through their thesis: choosing a feasible topic, writing the aims and objectives, study design, inclusion and exclusion criteria, sample size (show the formula and assumptions), statistics plan, ethics committee and CTRI registration, and writing up. Be practical and specific to Indian teaching hospitals. Never invent references.",
    starters: ["Help me choose a thesis topic in medicine", "Sample size for a cross-sectional prevalence study", "Write aims and objectives for my topic", "Which statistical test should I use?"],
  },
  {
    id: "crew-ecg", name: "ECG Tutor", tagline: "Reads ECGs systematically and teaches the pattern", icon: "heart", tone: "rose", mode: "general", builtIn: true,
    instructions: "You are an ECG tutor. When given an ECG image or description, read it systematically (rate, rhythm, axis, P wave, PR, QRS, ST, T, QT), give the interpretation, then teach the key pattern and its common look-alikes. When asked a topic, teach it with the criteria to recognise it. Say clearly when an image is not readable.",
    starters: ["Teach me how to read an ECG step by step", "Criteria for LVH on ECG", "How do I tell VT from SVT with aberrancy?", "Attach an ECG to interpret"],
  },
  {
    id: "crew-paeds", name: "Paeds Dose Buddy", tagline: "Weight-based doses, fluids and emergencies in children", icon: "baby", tone: "lime", mode: "general", builtIn: true,
    instructions: "You help with paediatric prescribing in India: always weight-based (mg/kg) with the per-dose and daily maximum, the formulation and volume to give, fluids by Holliday-Segar, and IAP/WHO guidance. Ask for the weight and age if missing before giving a dose. Flag red signs that need referral.",
    starters: ["Paracetamol and ibuprofen doses for a 14 kg child", "Maintenance fluids for an 18 kg child", "Antibiotic for pneumonia in a 2-year-old", "Dehydration plan B for a 10 kg infant"],
  },
  {
    id: "crew-patient", name: "Patient Explainer", tagline: "Explains illness and treatment in the patient's language", icon: "users", tone: "navy", mode: "patient", builtIn: true,
    instructions: "You explain conditions, tests and treatments to patients and families in simple words at a class-8 reading level, in the language asked for (Hindi, Hinglish or any Indian language), keeping medicine names in English. Cover what it is, what to do, warning signs and when to come back. Warm, clear, no jargon.",
    starters: ["Explain starting insulin, in Hindi", "Explain an angiography to a patient's family", "TB treatment adherence, in simple words", "What to eat with kidney disease"],
  },
  {
    id: "crew-rounds", name: "Rounds Partner", tagline: "Case presentations, SBAR and today's jobs", icon: "clipboard", tone: "slate", mode: "general", builtIn: true,
    instructions: "You help residents on ward rounds: turn notes into a crisp case presentation and SBAR, list today's jobs as a checklist, suggest what the consultant will ask, and flag anything unsafe or overdue. Be brief and structured.",
    starters: ["Turn my notes into a 60-second presentation", "What will my consultant ask about this case?", "List today's jobs for these patients"],
  },
];

export const blankCrew = (): CrewMember => ({ id: "", name: "", tagline: "", instructions: "", starters: [], icon: "stethoscope", tone: "teal", mode: "general" });

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, n) : "");

/** A crew member as typed or loaded, made safe: lengths capped, icon and colour from the lists. */
export function cleanCrew(raw: Partial<CrewMember>, modes: string[]): CrewMember | null {
  const name = clip(raw.name, NAME_MAX).replace(/\s+/g, " ");
  const instructions = clip(raw.instructions, INSTRUCTIONS_MAX);
  if (!name || !instructions) return null;
  return {
    id: clip(raw.id, 60) || `crew-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    tagline: clip(raw.tagline, TAGLINE_MAX).replace(/\s+/g, " "),
    instructions,
    starters: (Array.isArray(raw.starters) ? raw.starters : []).map((x) => clip(x, STARTER_MAX).replace(/\s+/g, " ")).filter(Boolean).slice(0, 4),
    icon: (CREW_ICONS as readonly string[]).includes(String(raw.icon)) ? (raw.icon as CrewIcon) : "stethoscope",
    tone: (CREW_TONES as readonly string[]).includes(String(raw.tone)) ? (raw.tone as CrewTone) : "teal",
    mode: modes.includes(String(raw.mode)) ? String(raw.mode) : "general",
    ...(raw.sources ? { sources: true } : {}),
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Date.now(),
  };
}

export function readCrew(modes: string[]): CrewMember[] {
  try {
    const v = JSON.parse(localStorage.getItem(CREW_KEY) || "[]");
    return (Array.isArray(v) ? v : [])
      .map((x): CrewMember | null => { const c = cleanCrew(x, modes); return c ? { ...c, updatedAt: Number(x?.updatedAt) || c.updatedAt } : null; })
      .filter((x): x is CrewMember => !!x)
      .slice(0, CREW_MAX);
  } catch {
    return [];
  }
}
export function saveCrew(list: CrewMember[]) {
  try { localStorage.setItem(CREW_KEY, JSON.stringify(list.filter((x) => !x.builtIn).slice(0, CREW_MAX))); } catch { /* storage full or blocked */ }
}

/** What the server needs: the name and instructions. */
export const crewPayload = (c: CrewMember | undefined) => (c ? { name: c.name, instructions: c.instructions } : undefined);

/** A built-in or saved crew member by id. */
export const findCrew = (id: string | undefined, mine: CrewMember[]) => (id ? BUILT_IN_CREW.find((c) => c.id === id) ?? mine.find((c) => c.id === id) : undefined);
