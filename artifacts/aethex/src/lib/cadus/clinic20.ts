/**
 * Update 20 on the device: the Prescription Writer's hand-off to the prescriber, lab report rows to
 * Lab Trends text, the Daily Clinical Case store and streak, letters, the PvPI ADR form and the MCCD
 * as markdown, and the brand-to-generic finder over the Cadus formulary (no AI for what's in it).
 */
import { DRUG_DATABASE, type Drug } from "@/data/drugDatabase";
import { newCard, readDecks, saveDecks, sid, type Deck } from "./studio";
import { DOSING_BY_ID, NLEM_IDS, newPrescription, newRxItem, searchDrugs, type Dosing, type Prescription } from "./formulary";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const load = <T,>(key: string, fallback: T): T => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } };
const keep = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };

/* ------------------------------------------------------------------ Prescription Writer */

export interface RxDraftItem { generic: string; strength: string; form: string; dose: string; route: string; frequency: string; duration: string; instructions: string; why: string }
export interface RxDraft { diagnosis: string; items: RxDraftItem[]; advice: string; adviceLocal: string; followUp: string; tests: string[]; redFlags: string[]; check: string[]; notes: string }

/** The formulary entry a drafted medicine matches, with its reference doses (null when it isn't there). */
export function formularyMatch(generic: string): { drug: Drug; dosing?: Dosing } | null {
  const base = generic.replace(/\(.*?\)/g, "").replace(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b/gi, "").trim();
  const hit = searchDrugs(base, 3).find((h) => h.score >= 75);
  return hit ? { drug: hit.drug, dosing: hit.dosing } : null;
}

/** The draft as a prescription for the prescriber (Drugs › Prescriber), where it is edited and printed. */
export function draftToPrescription(d: RxDraft, patient: string): Prescription {
  const advice = [d.advice.trim(), d.redFlags.length ? `Come back at once if: ${d.redFlags.join("; ")}.` : "", d.adviceLocal.trim()].filter(Boolean).join("\n\n");
  return newPrescription({
    patient: patient.slice(0, 60),
    diagnosis: d.diagnosis,
    items: d.items.map((i) => newRxItem({ drugId: formularyMatch(i.generic)?.drug.id, name: i.generic, strength: i.strength, form: i.form, dose: i.dose, route: i.route, frequency: i.frequency, duration: i.duration, instructions: i.instructions })),
    advice: advice.slice(0, 1000),
    followUp: [d.followUp, d.tests.length ? `with ${d.tests.join(", ")}` : ""].filter(Boolean).join(" ").slice(0, 120),
  });
}

/* ------------------------------------------------------------------ Lab Trends */

export interface LabRow { date: string; test: string; value: string; unit: string }
const dateKey = (s: string): number => {
  const m = /(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/.exec(s);
  if (m) { const y = Number(m[3].length === 2 ? `20${m[3]}` : m[3]); return Date.UTC(y, Number(m[2]) - 1, Number(m[1])); }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
};
/** Rows read from reports as Lab Trends text: one line per report date, oldest first. */
export function rowsToLabText(rows: LabRow[]): string {
  const byDate = new Map<string, string[]>();
  for (const r of rows) {
    const d = r.date || "Report";
    const unit = /µmol|umol|mmol\/mol|×10|x10|\/cumm|\/µl|\/ul|lakh/i.test(r.unit) ? ` ${r.unit}` : "";
    byDate.set(d, [...(byDate.get(d) ?? []), `${r.test} ${r.value}${unit}`]);
  }
  return [...byDate.entries()].sort((a, b) => dateKey(a[0]) - dateKey(b[0])).map(([d, v]) => `${d.replace(/:/g, ".")}: ${v.join(", ")}`).join("\n");
}

export interface LabSet { id: string; label: string; text: string; at: number }
export const LABSETS_KEY = "cadus3.labsets";
export const readLabSets = (): LabSet[] => (load<LabSet[]>(LABSETS_KEY, []) || []).filter((x) => x && typeof x.text === "string").slice(0, 40);
export const saveLabSets = (l: LabSet[]) => keep(LABSETS_KEY, l.slice(0, 40));
export const newLabSet = (label: string, text: string): LabSet => ({ id: uid(), label: label.slice(0, 40), text: text.slice(0, 20000), at: Date.now() });

/* ------------------------------------------------------------------ Daily Clinical Case */

export interface DailyCase { title: string; specialty: string; stem: string; questions: { q: string; options: string[]; answer: number; explain: string }[]; pearl: string }
export interface DailyDay { date: string; level: string; c: DailyCase; answers: (number | null)[] }
export const DAILY_KEY = "cadus3.daily";
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const readDaily = (): DailyDay[] => (load<DailyDay[]>(DAILY_KEY, []) || []).filter((x) => x && x.c && Array.isArray(x.answers)).slice(0, 60);
export const saveDaily = (l: DailyDay[]) => keep(DAILY_KEY, l.slice(0, 60));
export const dayDone = (d: DailyDay) => d.answers.length === d.c.questions.length && d.answers.every((a) => a !== null);
export const dayScore = (d: DailyDay) => d.answers.filter((a, i) => a === d.c.questions[i]?.answer).length;
const prevDay = (key: string) => { const [y, m, d] = key.split("-").map(Number); return todayKey(new Date(y, m - 1, d - 1)); };
/** Days in a row with the case finished, up to today (or yesterday, while today's is still open). */
export function streak(days: DailyDay[], today = todayKey()): number {
  const done = new Set(days.filter(dayDone).map((d) => d.date));
  let k = done.has(today) ? today : prevDay(today);
  let n = 0;
  while (done.has(k)) { n++; k = prevDay(k); }
  return n;
}
export function shareText(d: DailyDay, n: number): string {
  const marks = d.answers.map((a, i) => (a === d.c.questions[i]?.answer ? "✓" : "✗")).join(" ");
  return `Cadus Daily Case, ${d.date}: ${d.c.title}\n${marks}  ${dayScore(d)}/${d.c.questions.length}${n > 1 ? ` · ${n}-day streak` : ""}\nTry today's case: https://cadus.aethex.in/`;
}

/* ------------------------------------------------------------------ letters, ADR and MCCD */

export type DocKind = "referral" | "fitness" | "leave" | "insurance" | "other" | "adr" | "mccd";
export interface SavedDoc { id: string; at: number; kind: DocKind; label: string; title: string; md: string }
export const DOCS_KEY = "cadus3.docs20";
export const readDocs = (): SavedDoc[] => (load<SavedDoc[]>(DOCS_KEY, []) || []).filter((x) => x && typeof x.md === "string").slice(0, 80);
export const saveDocs = (l: SavedDoc[]) => keep(DOCS_KEY, l.slice(0, 80));
export const newDoc = (kind: DocKind, label: string, title: string, md: string): SavedDoc => ({ id: uid(), at: Date.now(), kind, label: label.slice(0, 40), title: title.slice(0, 120), md });

export interface AdrReport {
  patient: { initials: string; age: string; sex: string; weight: string };
  reaction: { description: string; onset: string; stopped: string };
  suspects: { drug: string; dose: string; route: string; frequency: string; started: string; stopped: string; indication: string }[];
  concomitant: string[]; dechallenge: string; rechallenge: string; seriousness: string; outcome: string;
  causality: { category: string; reason: string }; relevant: string; management: string; missing: string[];
}
const cell = (s: string) => (s || "—").replace(/\|/g, "/");
export function adrMarkdown(a: AdrReport): string {
  const p = a.patient;
  return [
    "# Suspected Adverse Drug Reaction Report (PvPI)",
    "",
    `**Patient:** ${[p.initials && `Initials ${p.initials}`, p.age && `Age ${p.age}`, p.sex, p.weight && `Weight ${p.weight}`].filter(Boolean).join(" · ") || "—"}`,
    "",
    "## Suspected adverse reaction",
    a.reaction.description,
    "",
    `**Onset:** ${a.reaction.onset || "—"}  \n**Reaction stopped:** ${a.reaction.stopped || "—"}`,
    "",
    "## Suspected medicine(s)",
    "| Medicine | Dose | Route | Frequency | Started | Stopped | Indication |",
    "|---|---|---|---|---|---|---|",
    ...a.suspects.map((s) => `| ${cell(s.drug)} | ${cell(s.dose)} | ${cell(s.route)} | ${cell(s.frequency)} | ${cell(s.started)} | ${cell(s.stopped)} | ${cell(s.indication)} |`),
    "",
    a.concomitant.length ? `**Other medicines:** ${a.concomitant.join(", ")}\n` : "",
    `**Dechallenge (improved on stopping):** ${a.dechallenge}  \n**Rechallenge (recurred on restarting):** ${a.rechallenge}`,
    "",
    `**Seriousness:** ${a.seriousness}  \n**Outcome:** ${a.outcome}`,
    "",
    a.relevant ? `## Relevant history and investigations\n${a.relevant}\n` : "",
    "## Causality (WHO-UMC)",
    `**${a.causality.category[0]?.toUpperCase()}${a.causality.category.slice(1)}.** ${a.causality.reason}`,
    "",
    a.management ? `## Management\n${a.management}\n` : "",
    "## Reporter",
    "Name, qualification, address, phone and signature: ______________________  Date: __________",
  ].filter((x) => x !== "").join("\n").trim();
}

export interface Mccd { partI: { line: string; cause: string; interval: string }[]; partII: { cause: string; interval: string }[]; underlying: string; icd10: string; manner: string; medicolegal: boolean; warnings: string[]; explanation: string }
export function mccdMarkdown(m: Mccd): string {
  const linesLabel: Record<string, string> = { a: "(a) Immediate cause", b: "(b) due to", c: "(c) due to", d: "(d) due to" };
  return [
    "# Cause of death (for the MCCD)",
    "",
    "## Part I",
    "| | Disease or condition | Interval between onset and death |",
    "|---|---|---|",
    ...m.partI.map((x) => `| ${linesLabel[x.line] ?? x.line} | ${cell(x.cause)} | ${cell(x.interval)} |`),
    "",
    m.partII.length ? "## Part II: other significant conditions contributing to death\n" + m.partII.map((x) => `- ${x.cause}${x.interval ? ` (${x.interval})` : ""}`).join("\n") + "\n" : "",
    `**Underlying cause:** ${m.underlying}${m.icd10 ? ` (ICD-10 ${m.icd10})` : ""}  \n**Manner of death:** ${m.manner}`,
    "",
    m.explanation,
  ].filter((x) => x !== "").join("\n").trim();
}

/* ------------------------------------------------------------------ brand to generic */

export interface GenericRow { input: string; brand: string; drug: Drug | null; nlem: boolean; dosing?: Dosing; brands: string[]; others: Drug[] }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const FORM_WORDS = /^(tab|tabs|tablet|cap|caps|capsule|syp|syr|syrup|susp|inj|injection|oint|cream|gel|drops?|lotion|sachet|neb|inh|inhaler|rotacap)\.?\s+/i;
/** The brand name in a prescription line: "Tab. Pan-D 40 1-0-0 x 5 days" → "Pan-D". */
export function brandOf(line: string): string {
  let s = line.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim().replace(FORM_WORDS, "");
  s = s.split(/\s+(?=\d+(\.\d+)?\s*(mg|mcg|g|ml|iu)\b)|\s+\d[\d-]*\s*-\s*\d|\s+(x|for|od|bd|tds|qid|hs|sos|stat)\b/i)[0] ?? s;
  return s.replace(/\s+\d+(\.\d+)?$/, "").replace(/[,;]+$/, "").trim().slice(0, 60);
}
/** Each line or comma-separated item matched to the formulary: generic, NLEM, other brands of the same salt. */
export function findGenerics(input: string): GenericRow[] {
  const parts = input.split(/\n|;|,(?![^(]*\))/).map((x) => x.trim()).filter((x) => x.length > 1).slice(0, 40);
  return parts.map((p) => {
    const brand = brandOf(p);
    const b = norm(brand);
    const drug = DRUG_DATABASE.find((d) => d.brandName.split(/\s*\/\s*/).some((x) => norm(x) === b))
      ?? DRUG_DATABASE.find((d) => d.brandName.split(/\s*\/\s*/).some((x) => norm(x).split(" ")[0] === b.split(" ")[0] && b.length >= 4))
      ?? DRUG_DATABASE.find((d) => norm(d.genericName) === b) ?? null;
    const others = drug ? DRUG_DATABASE.filter((d) => d.id !== drug.id && norm(d.saltName) === norm(drug.saltName)).slice(0, 6) : [];
    const brands = drug ? drug.brandName.split(/\s*\/\s*/).filter((x) => norm(x) !== b && norm(x).split(" ")[0] !== b.split(" ")[0]) : [];
    return { input: p, brand, drug, nlem: !!drug && NLEM_IDS.has(drug.id), dosing: drug ? DOSING_BY_ID[drug.id] : undefined, brands, others };
  });
}

/* ------------------------------------------------------------------ mnemonics to flashcards */

/** Adds cards to the "Mnemonics" flashcard deck (made if it isn't there). */
export function addToMnemonicDeck(cards: { front: string; back: string }[]) {
  const decks = readDecks();
  const deck: Deck = decks.find((d) => d.title === "Mnemonics") ?? { id: sid(), title: "Mnemonics", cards: [], createdAt: Date.now(), source: "Mnemonic Maker" };
  const have = new Set(deck.cards.map((c) => c.front));
  const next = { ...deck, cards: [...deck.cards, ...cards.filter((c) => !have.has(c.front)).map((c) => newCard({ ...c, tag: "mnemonic" }))] };
  saveDecks([next, ...decks.filter((d) => d.id !== deck.id)]);
}
