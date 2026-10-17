/**
 * Institution settings: the user's hospital or department, its local
 * protocols, formulary notes and antibiotic policy. Cadus follows them in
 * answers (the protocols that match a question are sent with it), and a
 * department can share them as a "team pack" file, with the department's
 * letterhead, so everyone on the team works from the same protocols.
 * Kept on this device; nothing here is patient data.
 */
import { cleanLetterhead, type Letterhead } from "./letterhead";

export interface Protocol {
  id: string;
  title: string;
  text: string;
  updatedAt: number;
}

export interface Institution {
  /** Apply to answers. */
  on: boolean;
  name: string;
  department: string;
  /** What is (and isn't) stocked, brands in use, restricted drugs. */
  formulary: string;
  /** Empirical antibiotic choices, restricted antibiotics, stewardship rules. */
  antibiotic: string;
  protocols: Protocol[];
  /** Where the protocols came from, e.g. "Team pack from Dept of Medicine, 12 Oct 2026". */
  source?: string;
}

export const INSTITUTION_KEY = "cadus3.institution";
export const MAX_PROTOCOLS = 30;
export const LIMITS = { name: 120, department: 120, formulary: 3000, antibiotic: 3000, title: 120, text: 12000 };

export const EMPTY_INSTITUTION: Institution = { on: true, name: "", department: "", formulary: "", antibiotic: "", protocols: [] };

const str = (v: unknown, max: number, oneLine = false) => {
  if (typeof v !== "string") return "";
  const s = oneLine ? v.replace(/[\r\n]+/g, " ") : v.replace(/\r\n/g, "\n");
  return s.slice(0, max);
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function cleanInstitution(raw: unknown): Institution {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const protocols = Array.isArray(r.protocols) ? r.protocols : [];
  return {
    on: r.on !== false,
    name: str(r.name, LIMITS.name, true).trim(),
    department: str(r.department, LIMITS.department, true).trim(),
    formulary: str(r.formulary, LIMITS.formulary),
    antibiotic: str(r.antibiotic, LIMITS.antibiotic),
    protocols: protocols
      .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
      .map((p) => ({
        id: typeof p.id === "string" && p.id ? p.id.slice(0, 40) : uid(),
        title: str(p.title, LIMITS.title, true).trim(),
        text: str(p.text, LIMITS.text).trim(),
        updatedAt: Number.isFinite(p.updatedAt) ? Number(p.updatedAt) : Date.now(),
      }))
      .filter((p) => p.title && p.text)
      .slice(0, MAX_PROTOCOLS),
    ...(typeof r.source === "string" && r.source.trim() ? { source: str(r.source, 160, true).trim() } : {}),
  };
}

export function readInstitution(): Institution {
  try {
    const raw = localStorage.getItem(INSTITUTION_KEY);
    return raw ? cleanInstitution(JSON.parse(raw)) : { ...EMPTY_INSTITUTION };
  } catch {
    return { ...EMPTY_INSTITUTION };
  }
}

export function saveInstitution(i: Institution) {
  try { localStorage.setItem(INSTITUTION_KEY, JSON.stringify(i)); } catch { /* full or blocked */ }
}

export const hasInstitution = (i: Institution) =>
  !!(i.name || i.department || i.formulary.trim() || i.antibiotic.trim() || i.protocols.length);

/* ------------------------------------------------------------------ which protocols go with a question */

const STOP = new Set(
  ("a an and are as at be by for from has have how i in is it its of on or that the this to was what when which with who why " +
    "patient patients management treatment protocol guideline guidelines dose doses about should can do does my our your ward hospital").split(" "),
);
/** Clinical words that mean the same thing for matching ("septic" finds the sepsis protocol). */
const SAME: Record<string, string> = {
  septic: "sepsis", septicaemia: "sepsis", septicemia: "sepsis", diabetic: "diabetes", ketoacidosis: "dka", asthmatic: "asthma",
  envenomation: "snakebite", snake: "snakebite", hypoglycaemic: "hypoglycaemia", hypoglycemia: "hypoglycaemia", anaphylactic: "anaphylaxis",
  seizure: "seizures", fits: "seizures", convulsion: "seizures", convulsions: "seizures", epileptic: "seizures", mi: "acs", stemi: "acs", nstemi: "acs",
  infarction: "acs", haemorrhage: "bleeding", hemorrhage: "bleeding", pph: "bleeding", pneumonic: "pneumonia", cap: "pneumonia",
  stroke: "stroke", cva: "stroke", dengue: "dengue", malarial: "malaria", eclampsia: "eclampsia", preeclampsia: "eclampsia",
};
/** Lower case, without common plurals, mapped to a shared word. */
const norm = (w: string) => {
  const base = w.length > 4 && w.endsWith("s") && !/(ss|is|us)$/.test(w) ? w.slice(0, -1) : w;
  return SAME[w] ?? SAME[base] ?? base;
};
const words = (s: string): string[] => (s.toLowerCase().match(/[a-z0-9]+/g) ?? ([] as string[])).filter((w) => (w.length > 2 || SAME[w]) && !STOP.has(w)).map(norm);

/** How many meaningful words a question has (a short follow-up such as "and the dose?" has none). */
export const contentWords = (q: string) => words(q).length;

/** How well a protocol matches a question: title words count most. */
export function protocolScore(p: Protocol, question: string): number {
  const q = new Set(words(question));
  if (!q.size) return 0;
  let score = 0;
  for (const w of new Set(words(p.title))) if (q.has(w) || [...q].some((x) => x.length > 4 && (x.startsWith(w) || w.startsWith(x)))) score += 3;
  const body = new Set(words(p.text.slice(0, 4000)));
  for (const w of q) if (body.has(w)) score += 1;
  return score;
}

/** The protocols that match a question best (at most three), most relevant first. */
export function matchProtocols(i: Institution, question: string, max = 3): Protocol[] {
  return i.protocols
    .map((p) => ({ p, s: protocolScore(p, question) }))
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((x) => x.p);
}

/**
 * What the server needs: the institution, its formulary and antibiotic notes,
 * and the protocols that match this question (clipped). Undefined when off or empty.
 */
export function institutionPayload(i: Institution, question: string): { payload: Record<string, unknown>; titles: string[] } | undefined {
  if (!i.on || !hasInstitution(i)) return undefined;
  const matched = matchProtocols(i, question);
  const payload: Record<string, unknown> = {};
  if (i.name) payload.name = i.name;
  if (i.department) payload.department = i.department;
  if (i.formulary.trim()) payload.formulary = i.formulary.trim().slice(0, 1500);
  if (i.antibiotic.trim()) payload.antibiotic = i.antibiotic.trim().slice(0, 1500);
  if (matched.length) payload.protocols = matched.map((p) => ({ title: p.title, text: p.text.slice(0, 2500) }));
  return Object.keys(payload).length ? { payload, titles: matched.map((p) => p.title) } : undefined;
}

/** "Dept of Medicine, City General Hospital" */
export const institutionLabel = (i: Institution) => [i.department, i.name].filter(Boolean).join(", ");

/* ------------------------------------------------------------------ team packs */

export const PACK_TYPE = "cadus-team-pack";

/**
 * The department's identity from a letterhead: hospital, address and logo.
 * Never anyone's name, registration, designation, phone or email.
 */
export function departmentLetterhead(l: Letterhead): Partial<Letterhead> | undefined {
  const out: Partial<Letterhead> = {};
  if (l.hospital) out.hospital = l.hospital;
  if (l.address) out.address = l.address;
  if (l.logo) out.logo = l.logo;
  return out.hospital ? out : undefined;
}

/** A team pack as JSON text: the institution's protocols and notes, and optionally its letterhead. */
export function exportPack(i: Institution, letterhead?: Letterhead | null): string {
  const { on: _on, source: _source, ...inst } = i;
  const lh = letterhead ? departmentLetterhead(letterhead) : undefined;
  return JSON.stringify({ type: PACK_TYPE, version: 1, exportedAt: new Date().toISOString(), institution: inst, ...(lh ? { letterhead: lh } : {}) }, null, 2);
}

export interface Pack {
  institution: Institution;
  letterhead?: Partial<Letterhead>;
  exportedAt?: string;
}

/** Reads a team pack. Throws a readable error if it isn't one. */
export function parsePack(text: string): Pack {
  let raw: any;
  try { raw = JSON.parse(text); } catch { throw new Error("That file isn't a Cadus team pack."); }
  if (!raw || raw.type !== PACK_TYPE || typeof raw.institution !== "object") throw new Error("That file isn't a Cadus team pack.");
  const institution = cleanInstitution({ ...raw.institution, on: true });
  if (!hasInstitution(institution)) throw new Error("This team pack is empty.");
  let letterhead: Partial<Letterhead> | undefined;
  if (raw.letterhead && typeof raw.letterhead === "object") {
    const l = cleanLetterhead(raw.letterhead);
    letterhead = departmentLetterhead(l);
  }
  return { institution, ...(letterhead ? { letterhead } : {}), ...(typeof raw.exportedAt === "string" ? { exportedAt: raw.exportedAt.slice(0, 40) } : {}) };
}

/** Applies a pack: its protocols replace or join the current ones; the department letterhead fills the letterhead. */
export function applyPack(current: Institution, pack: Pack, how: "replace" | "merge", when = new Date()): Institution {
  const label = institutionLabel(pack.institution) || "your team";
  const date = when.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const source = `Team pack from ${label}, ${date}`;
  // Fresh ids, so a pack imported twice never gives two protocols the same id.
  const incoming = pack.institution.protocols.map((p) => ({ ...p, id: uid() }));
  if (how === "replace") return { ...pack.institution, protocols: incoming, on: true, source };
  const titles = new Set(incoming.map((p) => p.title.toLowerCase()));
  return {
    on: current.on,
    name: pack.institution.name || current.name,
    department: pack.institution.department || current.department,
    formulary: pack.institution.formulary || current.formulary,
    antibiotic: pack.institution.antibiotic || current.antibiotic,
    protocols: [...incoming, ...current.protocols.filter((p) => !titles.has(p.title.toLowerCase()))].slice(0, MAX_PROTOCOLS),
    source,
  };
}

/** A protocol from a text or markdown file: its first heading (or the file name) is the title. */
export function protocolFromFile(name: string, text: string): Protocol {
  const clean = text.replace(/\r\n/g, "\n").trim();
  const heading = /^#{1,3}\s+(.+)$/m.exec(clean)?.[1];
  const title = (heading || name.replace(/\.(txt|md|markdown)$/i, "").replace(/[-_]+/g, " ")).trim().slice(0, LIMITS.title);
  return { id: uid(), title: title || "Protocol", text: clean.slice(0, LIMITS.text), updatedAt: Date.now() };
}

export const newProtocol = (title = "", text = ""): Protocol => ({ id: uid(), title, text, updatedAt: Date.now() });
