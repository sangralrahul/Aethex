// PubMed search through NCBI E-utilities, for Cadus's evidence search.
// ESearch finds the PMIDs and EFetch returns the records (title, authors,
// journal, date, DOI, PMC id, publication types and the abstract), so every
// reference Cadus shows is a real PubMed record, never generated text.
// Without an API key NCBI allows 3 requests a second; set NCBI_API_KEY (a free
// key from an NCBI account) to raise that to 10.

export type PaperType = "any" | "sr" | "rct" | "guideline" | "review" | "key";

export interface PubmedQuery {
  q: string;
  type?: PaperType;
  /** Only papers from the last N calendar years (0 = any year). */
  years?: number;
  /** Only records added to PubMed in the last N days (Guideline Watch; 0 = no limit). */
  days?: number;
  free?: boolean;
  india?: boolean;
  sort?: "relevance" | "date";
  page?: number;
  perPage?: number;
}

export interface AbstractPart {
  label?: string;
  text: string;
}

export interface Paper {
  pmid: string;
  title: string;
  /** "Surname Initials" or a group name, in order. */
  authors: string[];
  /** NLM abbreviation, e.g. "N Engl J Med". */
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

export interface PubmedResult {
  count: number;
  page: number;
  perPage: number;
  translation?: string;
  papers: Paper[];
}

/** NCBI answered "too many requests". */
export class PubmedBusy extends Error {
  constructor() {
    super("PubMed is busy");
    this.name = "PubmedBusy";
  }
}

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TOOL = "cadus_aethex";

/** The PubMed query for a search and its filters. */
export function buildTerm(q: PubmedQuery, nowYear = new Date().getUTCFullYear()): string {
  const text = q.q.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
  const parts = [`(${text})`];
  if (q.type === "sr") parts.push("(systematic review[pt] OR meta-analysis[pt])");
  else if (q.type === "rct") parts.push("randomized controlled trial[pt]");
  else if (q.type === "guideline") parts.push("(guideline[pt] OR practice guideline[pt])");
  else if (q.type === "review") parts.push("review[pt]");
  // "key": the evidence that changes practice (guidelines, meta-analyses, systematic reviews, trials).
  else if (q.type === "key") parts.push("(guideline[pt] OR practice guideline[pt] OR meta-analysis[pt] OR systematic review[pt] OR randomized controlled trial[pt])");
  const years = Math.round(Number(q.years) || 0);
  if (years > 0) parts.push(`("${nowYear - years + 1}"[dp] : "3000"[dp])`);
  const days = Math.round(Number(q.days) || 0);
  if (days > 0) parts.push(`"last ${Math.min(days, 3650)} days"[edat]`);
  if (q.free) parts.push("free full text[sb]");
  if (q.india) parts.push("(India[tiab] OR Indian[tiab] OR India[ad])");
  return parts.join(" AND ");
}

/* ------------------------------------------------------------------ XML helpers */

const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'", nbsp: " " };

/** Text content of an XML fragment: tags removed, entities decoded, spaces tidied. */
export function xmlText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

const first = (block: string, re: RegExp): string | undefined => {
  const m = re.exec(block);
  return m ? m[1] : undefined;
};
const all = (block: string, re: RegExp): string[] => {
  const out: string[] = [];
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = g.exec(block))) out.push(m[1]);
  return out;
};

/** One <PubmedArticle> as a Paper, or null if it has no PMID or title. */
function parseArticle(block: string): Paper | null {
  const pmid = first(block, /<PMID[^>]*>(\d+)<\/PMID>/);
  const article = first(block, /<Article(?:\s[^>]*)?>([\s\S]*?)<\/Article>/) ?? "";
  const title = xmlText(first(article, /<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/) ?? first(article, /<VernacularTitle[^>]*>([\s\S]*?)<\/VernacularTitle>/) ?? "");
  if (!pmid || !title) return null;
  const journalBlock = first(article, /<Journal>([\s\S]*?)<\/Journal>/) ?? "";
  const issue = first(journalBlock, /<JournalIssue[^>]*>([\s\S]*?)<\/JournalIssue>/) ?? "";
  const pubDate = first(issue, /<PubDate>([\s\S]*?)<\/PubDate>/) ?? "";
  const medlineDate = first(pubDate, /<MedlineDate>([\s\S]*?)<\/MedlineDate>/);
  const articleDate = first(article, /<ArticleDate[^>]*>([\s\S]*?)<\/ArticleDate>/) ?? "";
  const year = first(pubDate, /<Year>(\d{4})<\/Year>/) ?? (medlineDate ? /\d{4}/.exec(medlineDate)?.[0] : undefined) ?? first(articleDate, /<Year>(\d{4})<\/Year>/) ?? "";
  const month = first(pubDate, /<Month>([^<]+)<\/Month>/) ?? (medlineDate ? /\d{4}\s+([A-Za-z]{3})/.exec(medlineDate)?.[1] : undefined);
  const journal = xmlText(first(journalBlock, /<ISOAbbreviation>([\s\S]*?)<\/ISOAbbreviation>/) ?? first(block, /<MedlineTA>([\s\S]*?)<\/MedlineTA>/) ?? first(journalBlock, /<Title>([\s\S]*?)<\/Title>/) ?? "");
  const journalFull = xmlText(first(journalBlock, /<Title>([\s\S]*?)<\/Title>/) ?? "") || undefined;

  const pagination = first(article, /<Pagination>([\s\S]*?)<\/Pagination>/) ?? "";
  const medlinePgn = first(pagination, /<MedlinePgn>([\s\S]*?)<\/MedlinePgn>/);
  const start = first(pagination, /<StartPage>([\s\S]*?)<\/StartPage>/);
  const end = first(pagination, /<EndPage>([\s\S]*?)<\/EndPage>/);
  const pages = (medlinePgn && xmlText(medlinePgn)) || (start ? `${xmlText(start)}${end ? `-${xmlText(end)}` : ""}` : undefined);

  // The article's own ids come first in PubmedData; its ReferenceList has ids of the papers it cites.
  const pubmedData = first(block, /<PubmedData>([\s\S]*?)<\/PubmedData>/) ?? "";
  const ownIds = first(pubmedData, /<ArticleIdList>([\s\S]*?)<\/ArticleIdList>/) ?? "";
  const doi = first(ownIds, /<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/) ?? first(article, /<ELocationID EIdType="doi"[^>]*>([\s\S]*?)<\/ELocationID>/);
  const pmc = first(ownIds, /<ArticleId IdType="pmc">([\s\S]*?)<\/ArticleId>/);

  const authorList = first(article, /<AuthorList[^>]*>([\s\S]*?)<\/AuthorList>/) ?? "";
  const authors = all(authorList, /<Author(?:\s[^>]*)?>([\s\S]*?)<\/Author>/)
    .map((a) => {
      const group = first(a, /<CollectiveName>([\s\S]*?)<\/CollectiveName>/);
      if (group) return xmlText(group);
      const last = first(a, /<LastName>([\s\S]*?)<\/LastName>/);
      const ini = first(a, /<Initials>([\s\S]*?)<\/Initials>/);
      return last ? `${xmlText(last)}${ini ? ` ${xmlText(ini)}` : ""}` : "";
    })
    .filter(Boolean);

  const abstractBlock = first(article, /<Abstract(?:\s[^>]*)?>([\s\S]*?)<\/Abstract>/) ?? "";
  const abstract: AbstractPart[] = [];
  const re = /<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(abstractBlock))) {
    const text = xmlText(m[2]);
    if (!text) continue;
    const label = /Label="([^"]*)"/.exec(m[1])?.[1];
    abstract.push(label ? { label: xmlText(label), text } : { text });
  }

  const types = all(article, /<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/).map(xmlText).filter(Boolean);
  const volume = first(issue, /<Volume>([\s\S]*?)<\/Volume>/);
  const iss = first(issue, /<Issue>([\s\S]*?)<\/Issue>/);
  return {
    pmid,
    title,
    authors,
    journal,
    ...(journalFull && journalFull !== journal ? { journalFull } : {}),
    year,
    ...(month ? { month: xmlText(month) } : {}),
    ...(volume ? { volume: xmlText(volume) } : {}),
    ...(iss ? { issue: xmlText(iss) } : {}),
    ...(pages ? { pages } : {}),
    ...(doi ? { doi: xmlText(doi) } : {}),
    ...(pmc ? { pmcid: xmlText(pmc) } : {}),
    types,
    abstract,
  };
}

/** The records in an EFetch PubmedArticleSet, in document order. */
export function parsePubmedXml(xml: string): Paper[] {
  return all(xml, /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/).map(parseArticle).filter((p): p is Paper => !!p);
}

/** Count, PMIDs and PubMed's reading of the query from an ESearch JSON reply. */
export function parseEsearch(json: any): { count: number; ids: string[]; translation?: string } {
  const r = json?.esearchresult ?? {};
  const ids = Array.isArray(r.idlist) ? r.idlist.filter((x: unknown) => typeof x === "string" && /^\d+$/.test(x)) : [];
  const count = Number(r.count);
  return { count: Number.isFinite(count) ? count : ids.length, ids, ...(typeof r.querytranslation === "string" ? { translation: r.querytranslation } : {}) };
}

/* ------------------------------------------------------------------ search */

async function get(url: string, fetcher: typeof fetch, signal?: AbortSignal): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetcher(url, { headers: { accept: "*/*" }, signal });
    if (res.status === 429 && attempt < 1) {
      await new Promise((r) => setTimeout(r, 700));
      continue;
    }
    if (res.status === 429) throw new PubmedBusy();
    if (!res.ok) throw new Error(`PubMed returned ${res.status}`);
    return res;
  }
}

export async function searchPubMed(
  q: PubmedQuery,
  opts: { apiKey?: string; fetcher?: typeof fetch; signal?: AbortSignal; nowYear?: number } = {},
): Promise<PubmedResult> {
  const fetcher = opts.fetcher ?? fetch;
  const perPage = Math.max(1, Math.min(50, Math.round(q.perPage ?? 20)));
  const page = Math.max(1, Math.min(50, Math.round(q.page ?? 1)));
  const key = opts.apiKey ? `&api_key=${encodeURIComponent(opts.apiKey)}` : "";
  const term = buildTerm(q, opts.nowYear);
  const sort = q.sort === "date" ? "pub_date" : "relevance";
  const search = await get(
    `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&retmax=${perPage}&retstart=${(page - 1) * perPage}&sort=${sort}&term=${encodeURIComponent(term)}&tool=${TOOL}${key}`,
    fetcher,
    opts.signal,
  );
  const found = parseEsearch(await search.json().catch(() => ({})));
  if (!found.ids.length) return { count: found.count, page, perPage, translation: found.translation, papers: [] };
  const records = await get(
    `${EUTILS}/efetch.fcgi?db=pubmed&retmode=xml&id=${found.ids.join(",")}&tool=${TOOL}${key}`,
    fetcher,
    opts.signal,
  );
  const papers = parsePubmedXml(await records.text());
  // Keep PubMed's ranking.
  const rank = new Map(found.ids.map((id, i) => [id, i]));
  papers.sort((a, b) => (rank.get(a.pmid) ?? 999) - (rank.get(b.pmid) ?? 999));
  return { count: found.count, page, perPage, translation: found.translation, papers };
}
