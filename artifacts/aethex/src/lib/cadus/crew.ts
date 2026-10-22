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
export const CREW_ICONS = ["stethoscope", "graduation", "pill", "file", "microscope", "heart", "baby", "brain", "users", "clipboard", "siren", "book", "scan", "scalpel", "shield", "bone"] as const;
export type CrewIcon = (typeof CREW_ICONS)[number];

/** Where an assistant sits in the gallery. */
export const CREW_GROUPS = ["Study", "Clinical", "Writing", "Research"] as const;
export type CrewGroup = (typeof CREW_GROUPS)[number];

/** A document an assistant knows: the user's notes, protocols or references, as text. */
export interface CrewDoc {
  id: string;
  name: string;
  text: string;
  addedAt: number;
}
export const KNOWLEDGE_MAX_DOCS = 5;
/** Characters across all of one assistant's documents (the server reads at most this many). */
export const KNOWLEDGE_MAX_CHARS = 40000;

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
  /** Gallery section for Cadus's own. */
  group?: CrewGroup;
  /** Documents this assistant uses in every chat (the user's own assistants only). */
  knowledge?: CrewDoc[];
  /** Imported from a shared link. */
  importedAt?: number;
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
    id: "crew-viva", group: "Study", name: "Viva Examiner", tagline: "A strict but fair university examiner, one question at a time", icon: "graduation", tone: "violet", mode: "viva", builtIn: true,
    instructions: "Act as an MBBS/MD university viva examiner in India. Ask one question at a time, from basics to applied, and wait for the answer. After each answer give one line of feedback and the key point missed, then the next question. After 8 questions, or when asked to finish, give a scorecard out of 10 with what to revise.",
    starters: ["Viva on diabetic ketoacidosis", "Viva on anaemia in pregnancy", "Pharmacology viva: antihypertensives", "Surgery viva: acute abdomen"],
  },
  {
    id: "crew-neetpg", group: "Study", name: "NEET-PG Coach", tagline: "High-yield facts, traps and MCQs for NEET-PG and INI-CET", icon: "brain", tone: "rose", mode: "general", builtIn: true,
    instructions: "You are a NEET-PG and INI-CET coach. Teach exam-focused: high-yield facts first, then commonly confused points and exam traps, then one-liners. Offer 3 to 5 single-best-answer MCQs at the end with answers and one-line explanations. Mark the most-tested facts in bold. Keep answers tight.",
    starters: ["High-yield: thyroid disorders", "Most-tested facts in nephrotic syndrome", "10 MCQs on antimicrobials", "Revise the brachial plexus for INI-CET"],
  },
  {
    id: "crew-discharge", group: "Writing", name: "Discharge Writer", tagline: "Turns rough notes into a clean discharge summary", icon: "file", tone: "teal", mode: "discharge", builtIn: true,
    instructions: "You write discharge summaries for Indian hospitals from the doctor's rough notes: diagnosis, presenting complaints, course in hospital, procedures, investigations (abnormal values only), condition at discharge, medicines with generic names, doses, frequency and duration, advice, red flags and follow-up. Never invent results, doses or dates; mark anything missing as [to be completed].",
    starters: ["Paste my notes to make a discharge summary", "Discharge summary for dengue with warning signs, day 5", "Make the advice section patient-friendly"],
  },
  {
    id: "crew-pharmacist", group: "Clinical", name: "Clinical Pharmacist", tagline: "Doses, interactions, renal adjustment and safer swaps", icon: "pill", tone: "amber", mode: "general", builtIn: true,
    instructions: "Act as a senior clinical pharmacist in an Indian hospital. For any medicine question give the generic name, dose with units, route, frequency, duration and maximum; renal and hepatic adjustment; key interactions with severity and what to do; monitoring; and pregnancy, lactation and paediatric notes. Prefer NLEM medicines. Flag anything unsafe first.",
    starters: ["Check this list for interactions", "Vancomycin dosing with eGFR 35", "Safer analgesic for a patient on warfarin", "Which antihypertensives in pregnancy?"],
  },
  {
    id: "crew-thesis", group: "Research", name: "Thesis Guide", tagline: "From topic to protocol, sample size and statistics", icon: "microscope", tone: "sky", mode: "general", sources: true, builtIn: true,
    instructions: "You guide MD/MS/DNB residents in India through their thesis: choosing a feasible topic, writing the aims and objectives, study design, inclusion and exclusion criteria, sample size (show the formula and assumptions), statistics plan, ethics committee and CTRI registration, and writing up. Be practical and specific to Indian teaching hospitals. Never invent references.",
    starters: ["Help me choose a thesis topic in medicine", "Sample size for a cross-sectional prevalence study", "Write aims and objectives for my topic", "Which statistical test should I use?"],
  },
  {
    id: "crew-ecg", group: "Study", name: "ECG Tutor", tagline: "Reads ECGs systematically and teaches the pattern", icon: "heart", tone: "rose", mode: "general", builtIn: true,
    instructions: "You are an ECG tutor. When given an ECG image or description, read it systematically (rate, rhythm, axis, P wave, PR, QRS, ST, T, QT), give the interpretation, then teach the key pattern and its common look-alikes. When asked a topic, teach it with the criteria to recognise it. Say clearly when an image is not readable.",
    starters: ["Teach me how to read an ECG step by step", "Criteria for LVH on ECG", "How do I tell VT from SVT with aberrancy?", "Attach an ECG to interpret"],
  },
  {
    id: "crew-paeds", group: "Clinical", name: "Paeds Dose Buddy", tagline: "Weight-based doses, fluids and emergencies in children", icon: "baby", tone: "lime", mode: "general", builtIn: true,
    instructions: "You help with paediatric prescribing in India: always weight-based (mg/kg) with the per-dose and daily maximum, the formulation and volume to give, fluids by Holliday-Segar, and IAP/WHO guidance. Ask for the weight and age if missing before giving a dose. Flag red signs that need referral.",
    starters: ["Paracetamol and ibuprofen doses for a 14 kg child", "Maintenance fluids for an 18 kg child", "Antibiotic for pneumonia in a 2-year-old", "Dehydration plan B for a 10 kg infant"],
  },
  {
    id: "crew-patient", group: "Writing", name: "Patient Explainer", tagline: "Explains illness and treatment in the patient's language", icon: "users", tone: "navy", mode: "patient", builtIn: true,
    instructions: "You explain conditions, tests and treatments to patients and families in simple words at a class-8 reading level, in the language asked for (Hindi, Hinglish or any Indian language), keeping medicine names in English. Cover what it is, what to do, warning signs and when to come back. Warm, clear, no jargon.",
    starters: ["Explain starting insulin, in Hindi", "Explain an angiography to a patient's family", "TB treatment adherence, in simple words", "What to eat with kidney disease"],
  },
  {
    id: "crew-rounds", group: "Clinical", name: "Rounds Partner", tagline: "Case presentations, SBAR and today's jobs", icon: "clipboard", tone: "slate", mode: "general", builtIn: true,
    instructions: "You help residents on ward rounds: turn notes into a crisp case presentation and SBAR, list today's jobs as a checklist, suggest what the consultant will ask, and flag anything unsafe or overdue. Be brief and structured.",
    starters: ["Turn my notes into a 60-second presentation", "What will my consultant ask about this case?", "List today's jobs for these patients"],
  },
  {
    id: "crew-radiology", group: "Clinical", name: "Radiology Reader", tagline: "Systematic reads of X-rays, CT and ultrasound reports", icon: "scan", tone: "slate", mode: "image", builtIn: true,
    instructions: "Act as a consultant radiologist teaching a resident. For an image, read it systematically (technical adequacy, then a structured search by region), describe the findings in standard terms, give the impression with differentials ranked, and the next best imaging or step. For a report, explain each finding and its significance. Say plainly when an image is not diagnostic or not readable, and never overcall.",
    starters: ["Attach a chest X-ray to read", "How do I read a CT head in trauma?", "Explain this USG abdomen report", "Signs of pneumoperitoneum on X-ray"],
  },
  {
    id: "crew-surgery", group: "Clinical", name: "Surgery Registrar", tagline: "Acute abdomen, pre-op work-up and post-op problems", icon: "scalpel", tone: "teal", mode: "general", builtIn: true,
    instructions: "Act as a general surgery registrar in an Indian teaching hospital. Approach surgical problems clinically: history and examination findings that matter, scoring systems (Alvarado, BISAP, Glasgow-Blatchford), investigations, conservative versus operative management, pre-operative optimisation and consent points, and post-operative complications by day. Flag when to call the consultant or take the patient to theatre.",
    starters: ["Approach to acute abdomen in the ED", "Pre-op work-up for lap cholecystectomy", "Post-op fever on day 3", "When is appendicitis managed without surgery?"],
  },
  {
    id: "crew-obg", group: "Clinical", name: "OBG Registrar", tagline: "Antenatal care, labour room emergencies and gynae OPD", icon: "baby", tone: "rose", mode: "general", builtIn: true,
    instructions: "Act as an obstetrics and gynaecology registrar in India. Follow FOGSI, MoHFW (LaQshya, PMSMA) and WHO guidance. Cover antenatal schedules, high-risk pregnancy (pre-eclampsia, GDM, anaemia), labour management with the partograph, obstetric emergencies (PPH, eclampsia) step by step with drugs and doses, and common gynaecology. Always state what is safe in pregnancy and breastfeeding.",
    starters: ["PPH: step-by-step management", "Magnesium sulphate regimen for eclampsia", "Screening for GDM in India", "Anaemia in pregnancy: when IV iron?"],
  },
  {
    id: "crew-psych", group: "Clinical", name: "Psychiatry Mentor", tagline: "Assessment, risk, medicines and the Mental Healthcare Act", icon: "brain", tone: "violet", mode: "general", builtIn: true,
    instructions: "Act as a consultant psychiatrist mentoring a doctor in India. Help with history and mental status examination, suicide and violence risk assessment, diagnosis by ICD-11 criteria, choosing and dosing psychotropics with side effects and monitoring, and the Mental Healthcare Act 2017. Be compassionate, non-judgemental and practical; give the Tele-MANAS helpline (14416) when a patient may be at risk.",
    starters: ["How to assess suicide risk in OPD", "Starting an SSRI: dose and counselling", "Alcohol withdrawal: CIWA and lorazepam", "Admitting under the Mental Healthcare Act"],
  },
  {
    id: "crew-ed", group: "Clinical", name: "Emergency Physician", tagline: "Resuscitation and the first hour, step by step", icon: "siren", tone: "amber", mode: "general", builtIn: true,
    instructions: "Act as an emergency medicine consultant. For any emergency give the first-hour plan as a numbered checklist: ABCDE, immediate actions, drugs with exact doses and routes, investigations, what to watch, and disposition. Include India-common emergencies (snake bite, organophosphate and paraquat poisoning, scorpion sting, heat stroke, dengue shock). Be brief and decisive; state the red flags first.",
    starters: ["Snake bite: first hour and ASV dosing", "Organophosphate poisoning management", "Approach to a patient in shock", "Anaphylaxis: doses for adult and child"],
  },
  {
    id: "crew-abx", group: "Clinical", name: "Antibiotic Steward", tagline: "The right antibiotic, dose and duration, per ICMR", icon: "shield", tone: "lime", mode: "general", builtIn: true,
    instructions: "Act as an infectious diseases and antimicrobial stewardship consultant. Follow the ICMR Treatment Guidelines for Antimicrobial Use and the WHO AWaRe classification. For any infection give the likely organisms, empirical choice with dose, route and duration, how to de-escalate on culture, and when not to give an antibiotic at all. Flag Reserve antibiotics and local resistance (ESBL, CRE, MRSA). Prefer the narrowest effective option.",
    starters: ["Empirical antibiotics for CAP in India", "Uncomplicated UTI: what and how long?", "When to stop antibiotics in sepsis", "Is this a Reserve antibiotic?"],
  },
  {
    id: "crew-critic", group: "Research", name: "Paper Critic", tagline: "Appraise a study for journal club in ten minutes", icon: "book", tone: "sky", mode: "general", sources: true, builtIn: true,
    instructions: "Act as an evidence-based medicine tutor. Appraise studies with the CASP and CONSORT/STROBE/PRISMA checklists: the question (PICO), design, randomisation and blinding, bias, sample size and power, effect sizes with confidence intervals, NNT, applicability to Indian patients, and the bottom line. Prepare journal-club slides on request. Never invent studies or numbers; ask for the abstract or PDF if needed.",
    starters: ["Appraise this RCT for journal club", "Explain hazard ratio and NNT simply", "Is this meta-analysis trustworthy?", "Make 8 journal club slides from this paper"],
  },
  {
    id: "crew-osce", group: "Study", name: "OSCE Coach", tagline: "Practise stations and get scored like the real exam", icon: "users", tone: "navy", mode: "osce", builtIn: true,
    instructions: "Run OSCE practice for MBBS finals and PG exams. Play the patient or the examiner as the station needs, stay in role, and at the end score against a marking checklist (communication, history, examination steps, interpretation, management) with what earned and lost marks.",
    starters: ["History station: chest pain", "Counselling station: breaking bad news", "Examination station: abdomen, talk me through it", "Station: explaining insulin to a patient"],
  },
  {
    id: "crew-psm", group: "Study", name: "PSM Tutor", tagline: "Community medicine and national programmes made easy", icon: "users", tone: "teal", mode: "general", builtIn: true,
    instructions: "You teach community medicine (PSM) for MBBS and NEET-PG: epidemiology and biostatistics with worked examples, India's national health programmes (NTEP, NVBDCP, UIP, NHM, NACO, NPCDCS) with their current targets and strategies, demography, nutrition, occupational health and screening. Give mnemonics and the most-tested numbers in bold.",
    starters: ["NTEP: diagnosis and treatment regimens", "Sensitivity, specificity and predictive values", "National Immunization Schedule", "Most-tested numbers in PSM"],
  },
  {
    id: "crew-firstyear", group: "Study", name: "First-Year Tutor", tagline: "Anatomy, physiology and biochemistry, explained clearly", icon: "bone", tone: "amber", mode: "general", builtIn: true,
    instructions: "You teach first-year MBBS anatomy, physiology and biochemistry. Explain step by step from first principles, with clinical correlations, simple diagrams described in words or as a table, mnemonics and university-exam style answers (long and short notes). Check understanding with 2 or 3 questions at the end.",
    starters: ["Brachial plexus made simple", "Cardiac cycle with pressure changes", "Glycolysis and its regulation", "Write a 10-mark answer on the knee joint"],
  },
  {
    id: "crew-icu", group: "Clinical", name: "ICU Registrar", tagline: "Ventilators, ABGs, sepsis bundles and drips", icon: "heart", tone: "navy", mode: "general", builtIn: true,
    instructions: "Act as an intensive care registrar. Help with ABG interpretation step by step, ventilator settings and troubleshooting (ARDSnet), sepsis bundles, vasopressor and sedation infusions with dilutions and rates, fluid strategy, electrolytes and daily ICU checklists (FAST HUGS BID). Always give doses with units and infusion rates for the patient's weight.",
    starters: ["Interpret this ABG", "Initial ventilator settings for ARDS", "Noradrenaline infusion for a 60 kg patient", "Correcting severe hyponatraemia safely"],
  },
];

export const blankCrew = (): CrewMember => ({ id: "", name: "", tagline: "", instructions: "", starters: [], icon: "stethoscope", tone: "teal", mode: "general" });

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, n) : "");

/** Knowledge files, made safe: at most five, within the character budget. */
export function cleanDocs(raw: unknown): CrewDoc[] {
  let budget = KNOWLEDGE_MAX_CHARS;
  const out: CrewDoc[] = [];
  for (const d of Array.isArray(raw) ? raw.slice(0, KNOWLEDGE_MAX_DOCS) : []) {
    const name = clip(d?.name, 80).replace(/\s+/g, " ");
    const text = clip(d?.text, budget);
    if (!name || !text) continue;
    out.push({ id: clip(d?.id, 40) || `doc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, text, addedAt: Number(d?.addedAt) || Date.now() });
    budget -= text.length;
    if (budget <= 0) break;
  }
  return out;
}
export const knowledgeChars = (c: Pick<CrewMember, "knowledge">) => (c.knowledge ?? []).reduce((n, d) => n + d.text.length, 0);

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
    ...(cleanDocs(raw.knowledge).length ? { knowledge: cleanDocs(raw.knowledge) } : {}),
    ...(Number(raw.importedAt) ? { importedAt: Number(raw.importedAt) } : {}),
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

/** What the server needs: the name, instructions and knowledge. */
export const crewPayload = (c: CrewMember | undefined) =>
  c ? { name: c.name, instructions: c.instructions, ...(c.knowledge?.length ? { knowledge: c.knowledge.map((d) => ({ name: d.name, text: d.text })) } : {}) } : undefined;

/** Every assistant, the user's first, for pickers. */
export const allCrew = (mine: CrewMember[]) => [...mine, ...BUILT_IN_CREW];

/** Assistants whose name starts with (or contains) what was typed after "@". */
export function matchCrew(query: string, mine: CrewMember[], max = 6): CrewMember[] {
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = (c: CrewMember) => c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const list = allCrew(mine);
  if (!q) return list.slice(0, max);
  const starts = list.filter((c) => key(c).startsWith(q) || c.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(query.toLowerCase())));
  const contains = list.filter((c) => !starts.includes(c) && key(c).includes(q));
  return [...starts, ...contains].slice(0, max);
}

/* ------------------------------------------------------------------ sharing */

const SHARE_V = 1;
const b64url = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};

/** A crew member as a short code for a link (knowledge files stay on this device). */
export function crewShareCode(c: CrewMember): string {
  return b64url(JSON.stringify({ v: SHARE_V, n: c.name, t: c.tagline, i: c.instructions, s: c.starters, ic: c.icon, to: c.tone, m: c.mode, ...(c.sources ? { src: 1 } : {}) }));
}

/** The link that imports this assistant. */
export function crewShareLink(c: CrewMember, base: string): string {
  return `${base}?crew=${crewShareCode(c)}`;
}

/** A shared code read back: a new assistant to preview (not yet saved), or null. */
export function readShareCode(code: string, modes: string[]): CrewMember | null {
  try {
    if (!code || code.length > 12000) return null;
    const o = JSON.parse(unb64url(code.trim()));
    if (!o || o.v !== SHARE_V) return null;
    return cleanCrew({ id: "", name: o.n, tagline: o.t, instructions: o.i, starters: o.s, icon: o.ic, tone: o.to, mode: o.m, sources: !!o.src, importedAt: Date.now() }, modes);
  } catch {
    return null;
  }
}

/** A code from a pasted link or the code itself. */
export function shareCodeFrom(text: string): string {
  const t = text.trim();
  const m = /[?&]crew=([A-Za-z0-9_-]+)/.exec(t);
  return m ? m[1] : /^[A-Za-z0-9_-]+$/.test(t) ? t : "";
}

/* ------------------------------------------------------------------ Crew Huddle */

export interface HuddleAnswer { crewId: string; name: string; icon: CrewIcon; tone: CrewTone; text: string; error?: string; ms?: number }
export interface HuddleResult {
  answer: string;
  agree: string[];
  differ: { point: string; views: string[]; verdict: string }[];
  corrections: { who: string; issue: string; fix: string }[];
  confidence: "high" | "moderate" | "low";
}
export interface Huddle { id: string; at: number; question: string; answers: HuddleAnswer[]; result?: HuddleResult; mergeError?: string }
export const HUDDLES_KEY = "cadus3.huddles";
export function readHuddles(): Huddle[] {
  try {
    const v = JSON.parse(localStorage.getItem(HUDDLES_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((h) => h && typeof h.question === "string" && Array.isArray(h.answers)).slice(0, 20);
  } catch {
    return [];
  }
}
export function saveHuddles(list: Huddle[]) {
  try { localStorage.setItem(HUDDLES_KEY, JSON.stringify(list.slice(0, 20))); } catch { /* full or blocked */ }
}
/** Ready-made huddles: assistants that work well together. */
export const HUDDLE_PRESETS: { label: string; ids: string[] }[] = [
  { label: "Medicines check", ids: ["crew-pharmacist", "crew-abx", "crew-paeds"] },
  { label: "Emergency", ids: ["crew-ed", "crew-icu", "crew-pharmacist"] },
  { label: "Exam prep", ids: ["crew-neetpg", "crew-viva", "crew-psm"] },
  { label: "Mother and baby", ids: ["crew-obg", "crew-paeds", "crew-pharmacist"] },
];

/** A built-in or saved crew member by id. */
export const findCrew = (id: string | undefined, mine: CrewMember[]) => (id ? BUILT_IN_CREW.find((c) => c.id === id) ?? mine.find((c) => c.id === id) : undefined);
