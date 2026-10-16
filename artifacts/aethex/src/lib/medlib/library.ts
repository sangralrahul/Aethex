/**
 * Cadus Medical Library: offline search over the static library in /library/v1/
 * (built by tools/medical-library). Used only when the AI has no credits:
 * find the most relevant articles, pick the best passages, and either hand them
 * to the backup model or quote them directly.
 */
import { TITLES_FILE, articleShardFile, bigrams, fold, hashTerm, queryTerms, termShardFile, tokens } from "./text";

export interface LibrarySource {
  name: string;
  license: string;
  url: string;
  articles: number;
  note?: string;
}

export interface LibraryManifest {
  format: number;
  name: string;
  builtAt: string;
  articles: number;
  sections: number;
  termShards: number;
  articleShards: number;
  articlesPerShard: number;
  bytes: number;
  sources: Record<string, LibrarySource>;
}

export interface LibraryArticle {
  id: number;
  title: string;
  source: string;
  url: string;
  score: number;
  /** Citation number used in answers (1-based, by rank). */
  n: number;
}

export interface LibraryPassage {
  n: number;
  articleId: number;
  title: string;
  heading: string;
  text: string;
  url: string;
  source: string;
  score: number;
}

export interface LibraryResult {
  terms: string[];
  articles: LibraryArticle[];
  passages: LibraryPassage[];
  /** Question terms that no chosen passage mentions (shown so gaps are honest). */
  missing: string[];
}

type Loader = (path: string) => Promise<unknown>;
type ArticleRow = [number, string, string, string | null, [string, string][]];

export const LIBRARY_BASE = "/library/v1/";
/** Postings kept per term by the builder; a list this long marks a common word. */
const COMMON_POSTINGS = 60;

export const SOURCE_SHORT: Record<string, string> = { w: "Wikipedia", m: "NIH", d: "Disease Ontology" };

/** Fetch a library file; transparently gunzips .gz files and rejects the SPA's HTML fallback. */
async function fetchLibraryFile(path: string): Promise<unknown> {
  const res = await fetch(LIBRARY_BASE + path, { cache: "force-cache" });
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!bytes.length) return null;
  let text: string;
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    text = await new Response(stream).text();
  } else {
    text = new TextDecoder().decode(bytes);
  }
  const head = text.trimStart()[0];
  if (head !== "{" && head !== "[") return null;
  return JSON.parse(text);
}

export const articleUrl = (title: string, source: string, url: string | null) =>
  url || (source === "w" ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}` : "");

/** Query words that say what kind of answer is wanted, mapped to the section headings that hold it. */
const INTENTS: [RegExp, RegExp][] = [
  [/\b(treat|manag|therap|cure|first[- ]line|drug of choice|medication)/i, /treatment|management|therapy|medical use|medication|surgery|first aid/i],
  [/\b(diagnos|test|investigat|work-?up|criteria|lab|imaging|screen)/i, /diagnos|test|investigation|screening|criteria|exam/i],
  [/\b(symptom|sign|present|feature|clinical)/i, /sign|symptom|presentation|clinical/i],
  [/\b(cause|etiolog|aetiolog|risk|why)/i, /cause|etiolog|risk|genetic|inherit/i],
  [/\b(mechanism|pathophys|how does|work)/i, /mechanism|pathophysiology|pharmacology|pharmacodynamic/i],
  [/\b(side[- ]effect|adverse|toxic|overdose|safe)/i, /side effect|adverse|toxicity|overdose|contraindication|warning/i],
  [/\binteract/i, /interaction/i],
  [/\b(dose|dosage|dosing|mg|how much)/i, /dos(e|age|ing)|administration|medical use|pharmacokinetic/i],
  [/\b(prognos|outlook|surviv|mortality)/i, /prognosis|outlook|survival/i],
  [/\b(prevent|vaccin|prophyla)/i, /prevention|vaccin|prophyla/i],
  [/\b(epidemiolog|prevalen|incidence|how common|frequency)/i, /epidemiology|frequency|how common/i],
  [/\bcomplicat/i, /complication/i],
];

/** Generic question words that need not appear in an answer. */
const QUESTION_FILLER = new Set(
  tokens(
    "treatment treat symptoms signs causes diagnosis diagnose test tests meaning mean management manage differential differentials " +
      "next step best common type role use patient adult child children year years old male female man woman interaction interactions " +
      "dose dosage complications prognosis prevention risk factors approach overview investigation investigations " +
      "treated managed caused diagnosed happen happens work works",
  ),
);

export const isDoseQuestion = (q: string) => /\b(dose|dosage|dosing|mg\/kg|how much|regimen)\b/i.test(q);

export class MedicalLibrary {
  private load: Loader;
  private manifestP: Promise<LibraryManifest | null> | null = null;
  private files = new Map<string, Promise<unknown>>();

  constructor(loader: Loader = fetchLibraryFile) {
    this.load = loader;
  }

  private file(path: string): Promise<unknown> {
    let p = this.files.get(path);
    if (!p) {
      p = this.load(path).catch(() => null);
      this.files.set(path, p);
    }
    return p;
  }

  /** The library's manifest, or null when no library is installed. */
  manifest(): Promise<LibraryManifest | null> {
    if (!this.manifestP) {
      this.manifestP = this.load("manifest.json")
        .then((m) => (m && typeof (m as LibraryManifest).articles === "number" && (m as LibraryManifest).articles > 0 ? (m as LibraryManifest) : null))
        .catch(() => null);
      void this.manifestP.then((m) => {
        if (!m) this.manifestP = null; // allow a retry later
      });
    }
    return this.manifestP;
  }

  private async articles(ids: number[], perShard: number): Promise<Map<number, ArticleRow>> {
    const shards = [...new Set(ids.map((id) => Math.floor(id / perShard)))];
    const rows = new Map<number, ArticleRow>();
    const files = await Promise.all(shards.map((s) => this.file(articleShardFile(s))));
    for (const f of files) {
      const list = (f as { a?: ArticleRow[] } | null)?.a ?? [];
      for (const row of list) if (ids.includes(row[0])) rows.set(row[0], row);
    }
    return rows;
  }

  /**
   * Find the best passages for a question.
   * @param context earlier conversation text, used with a lower weight for follow-ups.
   */
  async search(question: string, opts: { context?: string; maxArticles?: number; maxPassages?: number } = {}): Promise<LibraryResult> {
    const m = await this.manifest();
    if (!m) throw new Error("The Cadus Medical Library is not installed.");
    const maxArticles = opts.maxArticles ?? 6;
    const maxPassages = opts.maxPassages ?? 8;
    const main = queryTerms(question);
    const extra = opts.context ? queryTerms(opts.context, 10).filter((t) => !main.includes(t)) : [];
    const pairs = bigrams(main);
    const all = [...main, ...pairs, ...extra];
    if (!main.length) return { terms: [], articles: [], passages: [], missing: [] };

    // 1. article scores from the term index
    const shardOf = new Map(all.map((t) => [t, hashTerm(t, m.termShards)]));
    const shardFiles = new Map<number, Record<string, number[]>>();
    await Promise.all(
      [...new Set(shardOf.values())].map(async (s) => {
        const f = (await this.file(termShardFile(s))) as { t?: Record<string, number[]> } | null;
        shardFiles.set(s, f?.t ?? {});
      }),
    );
    const scores = new Map<number, { s: number; hits: number }>();
    for (const t of all) {
      const post = shardFiles.get(shardOf.get(t)!)?.[t];
      if (!post) continue;
      // A full posting list means a common word: its best articles are fairly arbitrary,
      // so it adds a little score but doesn't count as matching the question's topic.
      const common = post.length >= COMMON_POSTINGS * 2;
      const qw = (extra.includes(t) ? 0.35 : 1) * (common ? 0.5 : 1);
      const hit = extra.includes(t) ? 0.35 : common ? 0.15 : 1;
      for (let i = 0; i < post.length; i += 2) {
        const cur = scores.get(post[i]) ?? { s: 0, hits: 0 };
        cur.s += post[i + 1] * qw;
        cur.hits += hit;
        scores.set(post[i], cur);
      }
    }
    const pool = [...scores.entries()]
      .map(([id, v]) => ({ id, score: v.s * (1 + 0.6 * Math.max(0, v.hits - 1)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxArticles * 4);
    if (!pool.length) return { terms: main, articles: [], passages: [], missing: main };

    // 2. rank candidates by title (whole title named in the question, near-duplicates), then load the winners
    const titles = ((await this.file(TITLES_FILE)) as { t?: string[] } | null)?.t ?? [];
    const asked = new Set(main);
    const meta = (id: number) => {
      const t = titles[id] ?? "";
      return { source: t.slice(0, 1), title: t.slice(1) };
    };
    for (const r of pool) {
      const tt = queryTerms(meta(r.id).title);
      const covered = tt.filter((t) => asked.has(t)).length;
      if (tt.length && covered === tt.length) r.score *= 1.8;
      else if (tt.length >= 2 && covered / tt.length >= 0.6) r.score *= 1.25;
    }
    pool.sort((a, b) => b.score - a.score);
    const fullTitles = new Set(pool.filter((r) => meta(r.id).source && meta(r.id).source !== "d").map((r) => fold(meta(r.id).title)));
    const titleCount = new Map<string, number>();
    const ranked = pool
      .filter((r) => {
        const { source, title } = meta(r.id);
        if (!title) return true;
        const key = fold(title);
        if (source === "d" && fullTitles.has(key)) return false;
        const n = (titleCount.get(key) ?? 0) + 1;
        titleCount.set(key, n);
        return n <= 2;
      })
      .slice(0, maxArticles);
    const rows = await this.articles(ranked.map((r) => r.id), m.articlesPerShard);
    const best = ranked[0].score;
    const intents = INTENTS.filter(([q]) => q.test(question)).map(([, h]) => h);
    const mainSet = new Set(main);
    const extraSet = new Set(extra);
    type Cand = LibraryPassage & { order: number; rel: number };
    const cands: Cand[] = [];
    const articles: LibraryArticle[] = [];
    for (const r of ranked) {
      const row = rows.get(r.id);
      if (!row) continue;
      const [id, title, source, url, chunks] = row;
      const art = { id, title, source, url: articleUrl(title, source, url), score: r.score, n: 0 };
      articles.push(art);
      const artNorm = r.score / best;
      chunks.forEach(([heading, text], ci) => {
        const toks = tokens(`${heading} ${text}`);
        const tf = new Map<string, number>();
        for (const t of toks) if (mainSet.has(t) || extraSet.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1);
        let rel = 0;
        for (const [t, f] of tf) {
          const w = mainSet.has(t) ? 1 : 0.35;
          rel += (w * f * 2.2) / (f + 1.2 * (0.25 + (0.75 * toks.length) / 180));
        }
        const intent = intents.some((h) => h.test(heading)) ? 1.6 : 0;
        const lead = ci === 0 ? 0.8 : 0;
        cands.push({
          n: 0, articleId: id, title, heading, text, url: art.url, source,
          score: 2 * artNorm + rel + intent + lead, order: ci, rel: rel + intent,
        });
      });
    }

    // 3. choose passages: the top article's overview, then the best sections, at most 3 per article
    cands.sort((a, b) => b.score - a.score);
    const chosen: Cand[] = [];
    const perArticle = new Map<number, number>();
    const take = (c: Cand) => {
      chosen.push(c);
      perArticle.set(c.articleId, (perArticle.get(c.articleId) ?? 0) + 1);
    };
    const topLead = cands.find((c) => c.articleId === articles[0]?.id && c.order === 0);
    if (topLead) take(topLead);
    for (const c of cands) {
      if (chosen.length >= maxPassages) break;
      if (chosen.includes(c) || (perArticle.get(c.articleId) ?? 0) >= 3) continue;
      if (c.order !== 0 && c.rel <= 0) continue;
      take(c);
    }

    // 4. number sources by article rank, order passages for reading
    const used = articles.filter((a) => perArticle.has(a.id));
    used.forEach((a, i) => (a.n = i + 1));
    const nOf = new Map(used.map((a) => [a.id, a.n]));
    const passages = chosen
      .map((c) => ({ ...c, n: nOf.get(c.articleId)! }))
      .sort((a, b) => a.n - b.n || a.order - b.order)
      .map(({ order: _o, rel: _r, ...p }) => p);
    const covered = new Set(tokens(passages.map((p) => `${p.title} ${p.heading} ${p.text}`).join(" ")));
    const missing = main.filter((t) => !covered.has(t) && !QUESTION_FILLER.has(t));
    return { terms: main, articles: used, passages, missing };
  }
}

/** Shared instance for the app. */
export const medicalLibrary = new MedicalLibrary();

const sentences = (t: string, n: number) => {
  const flat = t.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const parts = flat.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) ?? [flat];
  return parts.slice(0, n).join(" ").trim();
};

/** Lines of a passage with list markers normalised to "- ". */
const passageLines = (t: string) =>
  t
    .split("\n")
    .map((l) => l.trim().replace(/^[*•]\s+/, "- "))
    .filter(Boolean);

/** A short summary of a passage: its first real paragraph, or its first list items. */
function gist(t: string, n = 2): string {
  const lines = passageLines(t).filter((l) => !/:$/.test(l) && !/^key points:?$/i.test(l));
  const para = lines.find((l) => !l.startsWith("- ") && l.length >= 60);
  if (para) return sentences(para, n);
  return sentences(lines.map((l) => l.replace(/^- /, "")).slice(0, n).join(" "), n);
}

/** Passage text as markdown blocks: paragraphs and lists separated by blank lines. */
function blocks(t: string, max: number): string {
  const text = t.length > max ? `${t.slice(0, max).replace(/\s+\S*$/, "")}…` : t;
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(list.join("\n"));
    list = [];
  };
  for (const l of passageLines(text)) {
    if (l.startsWith("- ")) list.push(l);
    else {
      flush();
      out.push(l);
    }
  }
  flush();
  return out.join("\n\n");
}

/** Answer by quoting the library directly (used when no backup model is available). */
export function composeFromLibrary(question: string, r: LibraryResult): string {
  if (!r.passages.length) return libraryNotFound(question);
  const top = r.articles[0];
  const mine = r.passages.filter((p) => p.n === top.n);
  const lead = mine[0];
  const out: string[] = [`**Bottom line:** ${gist(lead.text)} [${lead.n}]`, "", `## ${top.title}`, ""];
  let lastHeading = "";
  for (const p of mine) {
    if (p.heading !== lastHeading) out.push(`**${p.heading}**`, "");
    lastHeading = p.heading;
    out.push(`${blocks(p.text, 900)} [${p.n}]`, "");
  }
  const others = r.articles.filter((a) => a.n !== top.n);
  if (others.length) {
    out.push("## Related topics in the library", "");
    for (const a of others) {
      const p = r.passages.find((x) => x.n === a.n);
      if (p) out.push(`- **${a.title}** (${SOURCE_SHORT[a.source] ?? "Library"}): ${gist(p.text)} [${a.n}]`);
    }
    out.push("");
  }
  if (r.missing.length) {
    out.push(`> **Not covered in the library:** ${r.missing.map((t) => t.replace(/_/g, " ")).join(", ")}. The passages above may only partly answer the question.`, "");
  }
  if (isDoseQuestion(question)) {
    out.push("> **Doses:** encyclopedia text is not a dosing reference. Confirm doses in the NFI or BNF, the product label or your local protocol.", "");
  }
  return out.join("\n").trim();
}

export function libraryNotFound(question: string): string {
  return [
    `**Bottom line:** The Cadus Medical Library has no article that matches "${question.slice(0, 120)}".`,
    "",
    "- Try the name of the condition, drug or test (for example \"asthma\", \"warfarin\" or \"HbA1c\").",
    "- Full AI answers return as soon as AI credits are topped up.",
  ].join("\n");
}

/** Footnote appended to every library-mode answer (also kept in copies and PDF exports). */
export function libraryFootnote(mode: "llm" | "extract", sources: string[]): string {
  const from = sources.length ? sources.join(", ") : "the Cadus Medical Library";
  return mode === "llm"
    ? `> **Library mode.** The main AI is unavailable (no AI credits), so this answer was written by the backup model using only passages from ${from}. It has not been through the safety review. Verify clinical decisions against current guidelines.`
    : `> **Library mode.** The main AI is unavailable (no AI credits), so this answer is quoted from ${from} without AI reasoning or the safety review. Verify clinical decisions against current guidelines.`;
}
