/**
 * PubMed records in Cadus: citations (Vancouver, as used by Indian and most
 * medical journals), RIS for reference managers (Zotero, Mendeley, EndNote),
 * the reading list, and the numbered record list Cadus summarises from.
 * The records themselves come from PubMed via the `literature` action.
 */

export interface AbstractPart {
  label?: string;
  text: string;
}

export interface Paper {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  journalFull?: string;
  year: string;
  month?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmcid?: string;
  types: string[];
  abstract: AbstractPart[];
}

export type PaperType = "any" | "sr" | "rct" | "guideline" | "review";

export interface LiteratureFilters {
  type: PaperType;
  years: 0 | 1 | 5 | 10;
  free: boolean;
  india: boolean;
  sort: "relevance" | "date";
}

export interface LiteratureResult {
  count: number;
  page: number;
  perPage: number;
  translation?: string;
  papers: Paper[];
}

export const DEFAULT_FILTERS: LiteratureFilters = { type: "any", years: 0, free: false, india: false, sort: "relevance" };

export const TYPE_OPTIONS: { id: PaperType; label: string }[] = [
  { id: "any", label: "All articles" },
  { id: "sr", label: "Systematic reviews and meta-analyses" },
  { id: "rct", label: "Randomised controlled trials" },
  { id: "guideline", label: "Guidelines" },
  { id: "review", label: "Reviews" },
];

export const pubmedUrl = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
export const doiUrl = (doi: string) => `https://doi.org/${doi}`;
export const pmcUrl = (pmcid: string) => `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`;

/** Short labels for the publication types that matter when weighing evidence. */
const BADGES: [RegExp, string, number][] = [
  [/^meta-analysis$/i, "Meta-analysis", 1],
  [/^systematic review$/i, "Systematic review", 2],
  [/^practice guideline$|^guideline$/i, "Guideline", 3],
  [/^randomized controlled trial$/i, "RCT", 4],
  [/^clinical trial/i, "Clinical trial", 5],
  [/^observational study$/i, "Observational", 6],
  [/^review$/i, "Review", 7],
  [/^case reports$/i, "Case report", 8],
  [/^comparative study$/i, "Comparative study", 9],
  [/^multicenter study$/i, "Multicentre", 10],
  [/^retracted publication$/i, "Retracted", 0],
];

export function typeBadges(types: string[]): string[] {
  const out: [string, number][] = [];
  for (const t of types) {
    const b = BADGES.find(([re]) => re.test(t.trim()));
    if (b && !out.some(([l]) => l === b[1])) out.push([b[1], b[2]]);
  }
  // "Clinical trial" adds nothing next to "RCT".
  const labels = out.sort((a, b) => a[1] - b[1]).map(([l]) => l);
  return labels.includes("RCT") ? labels.filter((l) => l !== "Clinical trial") : labels;
}

/** NLM page style: 1102-1113 becomes 1102-13. */
export function abbreviatePages(pages: string): string {
  const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(pages.trim());
  if (!m) return pages.trim();
  const [, a, b] = m;
  if (b.length !== a.length || Number(b) <= Number(a)) return `${a}-${b}`;
  let i = 0;
  while (i < a.length - 1 && a[i] === b[i]) i++;
  return `${a}-${b.slice(i)}`;
}

/** 11-7 means 11-17: the full last page, for reference managers. */
export function expandPages(pages: string): { start?: string; end?: string } {
  const m = /^(\w+)\s*[-–]\s*(\w+)$/.exec(pages.trim());
  if (!m) return pages.trim() ? { start: pages.trim() } : {};
  let [, a, b] = m;
  if (/^\d+$/.test(a) && /^\d+$/.test(b) && b.length < a.length) b = a.slice(0, a.length - b.length) + b;
  return { start: a, end: b };
}

/** A Vancouver (ICMJE / NLM "Citing Medicine") reference. */
export function vancouver(p: Paper): string {
  const authors = p.authors.length > 6 ? `${p.authors.slice(0, 6).join(", ")}, et al.` : p.authors.length ? `${p.authors.join(", ")}.` : "";
  const title = /[.?!]$/.test(p.title.trim()) ? p.title.trim() : `${p.title.trim()}.`;
  const journal = p.journal ? `${p.journal.replace(/\.$/, "")}.` : "";
  const where = `${p.year}${p.volume ? `;${p.volume}` : ""}${p.issue ? `(${p.issue})` : ""}${p.pages ? `:${abbreviatePages(p.pages)}` : ""}.`;
  return [authors, title, journal, where, p.doi ? `doi: ${p.doi}.` : "", `PMID: ${p.pmid}.`].filter(Boolean).join(" ").replace(/\s+/g, " ");
}

/** A numbered Vancouver reference list. */
export function vancouverList(papers: Paper[]): string {
  return papers.map((p, i) => `${i + 1}. ${vancouver(p)}`).join("\n");
}

const abstractText = (p: Paper) => p.abstract.map((a) => (a.label ? `${a.label}: ${a.text}` : a.text)).join(" ");

/** RIS for Zotero, Mendeley, EndNote and other reference managers. */
export function ris(papers: Paper[]): string {
  return papers
    .map((p) => {
      const lines = ["TY  - JOUR"];
      for (const a of p.authors) {
        const m = /^(.+?)\s+([A-Z]{1,4})$/.exec(a);
        lines.push(`AU  - ${m ? `${m[1]}, ${m[2]}` : a}`);
      }
      lines.push(`TI  - ${p.title}`);
      if (p.journalFull) lines.push(`T2  - ${p.journalFull}`);
      if (p.journal) lines.push(`JO  - ${p.journal}`);
      if (p.year) lines.push(`PY  - ${p.year}`);
      if (p.volume) lines.push(`VL  - ${p.volume}`);
      if (p.issue) lines.push(`IS  - ${p.issue}`);
      const pg = p.pages ? expandPages(p.pages) : {};
      if (pg.start) lines.push(`SP  - ${pg.start}`);
      if (pg.end) lines.push(`EP  - ${pg.end}`);
      if (p.doi) lines.push(`DO  - ${p.doi}`);
      lines.push(`UR  - ${pubmedUrl(p.pmid)}`);
      lines.push(`AN  - ${p.pmid}`);
      lines.push(`DB  - PubMed`);
      const ab = abstractText(p);
      if (ab) lines.push(`AB  - ${ab}`);
      lines.push("ER  - ");
      return lines.join("\r\n");
    })
    .join("\r\n\r\n") + "\r\n";
}

/**
 * The numbered records Cadus summarises from, attached as a text file. The
 * same numbers become the citation badges under the answer.
 */
export function evidenceRecords(query: string, papers: Paper[], date = new Date()): string {
  const when = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const head = `PubMed records for: "${query}" (searched ${when}). Cite them as [1], [2] and so on; use nothing else.`;
  const body = papers.map((p, i) => {
    const types = typeBadges(p.types);
    const ab = abstractText(p);
    return `[${i + 1}] ${vancouver(p)}${types.length ? ` Type: ${types.join(", ")}.` : ""}\n${ab ? `Abstract: ${ab}` : "(No abstract in PubMed.)"}`;
  });
  return [head, ...body].join("\n\n");
}

/** Citation badges under the summary link to each record on PubMed. */
export function evidenceSources(papers: Paper[]): { n: number; url: string; title: string }[] {
  return papers.map((p, i) => ({
    n: i + 1,
    url: pubmedUrl(p.pmid),
    title: `${p.title.replace(/\.$/, "")} · ${p.journal} ${p.year}`.slice(0, 200),
  }));
}

/* ------------------------------------------------------------------ reading list (this device) */

export interface SavedPaper extends Paper {
  savedAt: number;
  note?: string;
}

export const READING_KEY = "cadus3.papers";
export const READING_MAX = 500;

export function readReading(): SavedPaper[] {
  try {
    const raw = JSON.parse(localStorage.getItem(READING_KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter((p) => p && typeof p.pmid === "string" && typeof p.title === "string").map((p) => ({
        ...p,
        authors: Array.isArray(p.authors) ? p.authors : [],
        types: Array.isArray(p.types) ? p.types : [],
        abstract: Array.isArray(p.abstract) ? p.abstract : [],
      }))
      : [];
  } catch {
    return [];
  }
}

export function saveReading(list: SavedPaper[]) {
  try {
    localStorage.setItem(READING_KEY, JSON.stringify(list.slice(0, READING_MAX)));
  } catch { /* storage full */ }
}

/** "Anker SD, Butler J, et al." */
export function shortAuthors(authors: string[], n = 3): string {
  if (!authors.length) return "No authors listed";
  return authors.length > n ? `${authors.slice(0, n).join(", ")}, et al.` : authors.join(", ");
}
