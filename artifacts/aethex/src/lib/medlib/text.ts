/**
 * Cadus Medical Library: text normalisation shared by the app (search) and
 * tools/medical-library (index builder). Both sides MUST tokenise identically,
 * so keep this file dependency-free and use only erasable TypeScript syntax
 * (Node runs it directly with type stripping).
 */

/** Bump when the on-disk format or tokeniser changes; the app reads /library/v{N}/. */
export const LIBRARY_FORMAT = 1;
/** Number of term-index shards. Terms are routed with hashTerm(). */
export const TERM_SHARDS = 256;
/** Articles per article shard (shard = floor(id / ARTICLES_PER_SHARD)). */
export const ARTICLES_PER_SHARD = 64;

const STOPWORDS = new Set(
  (
    "a about above after again against all also am an and any are aren as at be because been before being below between both but by " +
    "can cannot could couldn did didn do does doesn doing don down during each etc eg ie few for from further had hadn has hasn have " +
    "haven having he her here hers herself him himself his how however i if in into is isn it its itself just may me might more most " +
    "much must my myself no nor not now of off often on once one only or other our ours ourselves out over own per same shall she " +
    "should shouldn so some such than that the their theirs them themselves then there these they this those through thus to too " +
    "under until up upon us usually very via was wasn we were weren what when where whether which while who whom whose why will with " +
    "within without won would wouldn you your yours yourself yourselves al et vs"
  ).split(" "),
);

/** Extra words that carry no topic in a question (search side only). */
const QUESTION_WORDS = new Set(
  "please tell explain describe give list show know want need help question answer briefly detail detailed short summary summarise summarize".split(" "),
);

/** British to American medical spellings, so "anaemia" finds "anemia". */
const SPELLINGS: [RegExp, string][] = [
  [/aemia/g, "emia"],
  [/haem/g, "hem"],
  [/oedema/g, "edema"],
  [/oesoph/g, "esoph"],
  [/oestr/g, "estr"],
  [/paed/g, "ped"],
  [/anaes/g, "anes"],
  [/foet/g, "fet"],
  [/diarrhoea/g, "diarrhea"],
  [/gynaec/g, "gynec"],
  [/ischaem/g, "ischem"],
  [/leukaem/g, "leukem"],
  [/coeliac/g, "celiac"],
  [/caec/g, "cec"],
  [/dyspnoea/g, "dyspnea"],
  [/apnoea/g, "apnea"],
  [/orthopaed/g, "orthoped"],
  [/tumour/g, "tumor"],
  [/behaviour/g, "behavior"],
  [/colour/g, "color"],
  [/fibre/g, "fiber"],
  [/centre/g, "center"],
  [/litre/g, "liter"],
  [/sulph/g, "sulf"],
  [/isation/g, "ization"],
  [/ise$/g, "ize"],
  [/ised$/g, "ized"],
];

/** Lowercase and strip accents. */
export function fold(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** A deliberately light stemmer: plurals and -ing only (medical words are fragile). */
export function stem(w: string): string {
  if (w.length < 4 || /\d/.test(w)) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/(ss|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  if (w.length > 6 && w.endsWith("ing")) return w.slice(0, -3);
  return w;
}

function normaliseWord(raw: string): string {
  let w = raw;
  if (w.length > 4) for (const [re, rep] of SPELLINGS) if (w.search(re) !== -1) w = w.replace(re, rep);
  return stem(w);
}

/** Split text into normalised search terms (stop words removed). */
export function tokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of fold(text).split(/[^a-z0-9]+/)) {
    if (!raw || raw.length > 30) continue;
    if (raw.length < 2 && !/\d/.test(raw)) continue;
    if (STOPWORDS.has(raw)) continue;
    const w = normaliseWord(raw);
    if (!w || STOPWORDS.has(w)) continue;
    out.push(w);
  }
  return out;
}

/** Terms for a user question: like tokens() but also drops question filler, deduplicated. */
export function queryTerms(text: string, max = 18): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens(text)) {
    if (QUESTION_WORDS.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** Adjacent-term pairs ("acute_lymphoblastic"), indexed for titles and aliases so multi-word names rank first. */
export function bigrams(terms: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i + 1 < terms.length; i++) out.push(`${terms[i]}_${terms[i + 1]}`);
  return out;
}

/** 32-bit FNV-1a hash of a term, mapped to a shard number. */
export function hashTerm(term: string, buckets: number = TERM_SHARDS): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < term.length; i++) {
    h ^= term.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % buckets;
}

/** Shard file names, shared by builder and app. */
export const termShardFile = (n: number) => `terms/${n.toString(16).padStart(2, "0")}.json.gz`;
export const articleShardFile = (n: number) => `articles/${n.toString(36).padStart(3, "0")}.json.gz`;
/** Every article's source code and title, by id ("wAsthma"), for fast ranking before full articles load. */
export const TITLES_FILE = "titles.json.gz";
