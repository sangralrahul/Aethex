// Turns source documents into the static, sharded Cadus Medical Library:
//   manifest.json, LICENSE.txt, articles/*.json.gz, terms/*.json.gz
// Retrieval is BM25 at article level (title and aliases boosted), pruned to the
// best postings per term so the whole index stays small enough to ship as
// static files and search in the browser.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ARTICLES_PER_SHARD,
  LIBRARY_FORMAT,
  TITLES_FILE,
  bigrams,
  TERM_SHARDS,
  articleShardFile,
  hashTerm,
  termShardFile,
  tokens,
} from "../../../artifacts/aethex/src/lib/medlib/text.ts";
import { chunkText, log, writeGzipJson } from "./util.mjs";

const K1 = 1.2;
const B = 0.5;
/** Postings kept per term (best-scoring articles). */
const POSTINGS_PER_TERM = 64;
/** Short definition-only sources should not crowd out full articles. */
const SOURCE_WEIGHT = { d: 0.55 };
const MAX_BODY_TOKENS = 6000;

/**
 * @typedef {{ source: string, title: string, url?: string|null, aliases?: string[],
 *   priority: number, sections: { h: string, t: string }[] }} SourceDoc
 */

function chunksOf(doc) {
  const out = [];
  for (const s of doc.sections) {
    for (const t of chunkText(s.t)) out.push([s.h, t]);
  }
  return out;
}

function termFreqs(doc) {
  const tf = new Map();
  const bump = (t, w) => tf.set(t, (tf.get(t) ?? 0) + w);
  const titleTerms = tokens(doc.title);
  for (const t of new Set(titleTerms)) bump(t, 8);
  for (const t of new Set(bigrams(titleTerms))) bump(t, 6);
  const aliasTerms = new Set();
  for (const a of (doc.aliases ?? []).slice(0, 25)) {
    const at = tokens(a);
    for (const t of at) aliasTerms.add(t);
    for (const t of bigrams(at)) aliasTerms.add(t);
  }
  for (const t of aliasTerms) bump(t, t.includes("_") ? 3 : 4);
  let body = 0;
  doc.chunks.forEach(([h, text], i) => {
    if (h && i > 0) for (const t of new Set(tokens(h))) bump(t, 2);
    if (body >= MAX_BODY_TOKENS) return;
    const w = i === 0 || /^(overview|summary)$/i.test(h) ? 1.5 : 1;
    for (const t of tokens(text)) {
      bump(t, w);
      if (++body >= MAX_BODY_TOKENS) break;
    }
  });
  return tf;
}

const keepTerm = (t) => !(/^\d{5,}$/.test(t) || (/\d/.test(t) && t.length > 12));

/**
 * @param {SourceDoc[]} docs
 * @param {string} outDir
 * @param {{ sources: Record<string, {name:string, license:string, url:string, note?:string}> }} meta
 */
export function buildLibrary(docs, outDir, meta) {
  docs.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  docs.forEach((d, i) => {
    d.id = i;
    d.chunks = chunksOf(d);
  });
  const N = docs.length;
  log(`Indexing ${N} articles…`);

  // pass 1: document frequencies and lengths
  const df = new Map();
  const lens = new Float64Array(N);
  let total = 0;
  for (const d of docs) {
    const tf = termFreqs(d);
    let len = 0;
    for (const [t, w] of tf) {
      len += w;
      df.set(t, (df.get(t) ?? 0) + 1);
    }
    lens[d.id] = len;
    total += len;
  }
  const avg = total / Math.max(1, N);

  // pass 2: BM25 weights, pruned to the best postings per term
  const postings = new Map();
  let maxW = 0;
  const prune = (arr) => {
    const pairs = [];
    for (let i = 0; i < arr.length; i += 2) pairs.push([arr[i], arr[i + 1]]);
    pairs.sort((a, b) => b[1] - a[1]);
    return pairs.slice(0, POSTINGS_PER_TERM).flat();
  };
  for (const d of docs) {
    const tf = termFreqs(d);
    const norm = K1 * (1 - B + (B * lens[d.id]) / avg);
    for (const [t, f] of tf) {
      const n = df.get(t);
      if (!keepTerm(t)) continue;
      if (n === 1 && f <= 1) continue; // a single passing mention: noise
      if (n > 400 && f < 2) continue; // common word mentioned once: never in the top postings
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const w = ((idf * f * (K1 + 1)) / (f + norm)) * (SOURCE_WEIGHT[d.source] ?? 1);
      if (w > maxW) maxW = w;
      let arr = postings.get(t);
      if (!arr) postings.set(t, (arr = []));
      arr.push(d.id, w);
      if (arr.length > POSTINGS_PER_TERM * 2 * 8) postings.set(t, prune(arr));
    }
  }

  // write
  rmSync(join(outDir, "articles"), { recursive: true, force: true });
  rmSync(join(outDir, "terms"), { recursive: true, force: true });
  mkdirSync(join(outDir, "articles"), { recursive: true });
  mkdirSync(join(outDir, "terms"), { recursive: true });

  let articleBytes = 0;
  let sectionCount = 0;
  const shardCount = Math.ceil(N / ARTICLES_PER_SHARD);
  for (let s = 0; s < shardCount; s++) {
    const slice = docs.slice(s * ARTICLES_PER_SHARD, (s + 1) * ARTICLES_PER_SHARD);
    sectionCount += slice.reduce((n, d) => n + d.chunks.length, 0);
    articleBytes += writeGzipJson(join(outDir, articleShardFile(s)), {
      v: LIBRARY_FORMAT,
      a: slice.map((d) => [d.id, d.title, d.source, d.url ?? null, d.chunks]),
    });
  }

  articleBytes += writeGzipJson(join(outDir, TITLES_FILE), { v: LIBRARY_FORMAT, t: docs.map((d) => `${d.source}${d.title}`) });

  const shards = Array.from({ length: TERM_SHARDS }, () => ({}));
  let termCount = 0;
  let postingCount = 0;
  for (const [t, arr0] of postings) {
    const arr = prune(arr0);
    const q = [];
    for (let i = 0; i < arr.length; i += 2) q.push(arr[i], Math.max(1, Math.round((arr[i + 1] / maxW) * 1000)));
    shards[hashTerm(t)][t] = q;
    termCount++;
    postingCount += q.length / 2;
  }
  let termBytes = 0;
  shards.forEach((t, i) => {
    termBytes += writeGzipJson(join(outDir, termShardFile(i)), { v: LIBRARY_FORMAT, t });
  });

  const counts = {};
  for (const d of docs) counts[d.source] = (counts[d.source] ?? 0) + 1;
  const manifest = {
    format: LIBRARY_FORMAT,
    name: "Cadus Medical Library",
    builtAt: new Date().toISOString(),
    articles: N,
    sections: sectionCount,
    terms: termCount,
    postings: postingCount,
    termShards: TERM_SHARDS,
    articleShards: shardCount,
    articlesPerShard: ARTICLES_PER_SHARD,
    bytes: articleBytes + termBytes,
    sources: Object.fromEntries(
      Object.entries(meta.sources)
        .filter(([k]) => counts[k])
        .map(([k, v]) => [k, { ...v, articles: counts[k] }]),
    ),
  };
  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(outDir, "LICENSE.txt"), licenseText(manifest));
  log(
    `Wrote ${N} articles in ${shardCount} shards (${(articleBytes / 1e6).toFixed(1)} MB) and ` +
      `${termCount} terms (${(termBytes / 1e6).toFixed(1)} MB).`,
  );
  return manifest;
}

function licenseText(m) {
  const lines = [
    "Cadus Medical Library",
    "=====================",
    "",
    "This folder is generated by tools/medical-library. It is a derived collection of openly licensed",
    "medical reference text, converted to plain text, shortened and split into sections. As a whole it is",
    "distributed under the Creative Commons Attribution-ShareAlike 4.0 licence",
    "(https://creativecommons.org/licenses/by-sa/4.0/).",
    "",
    "Sources",
    "-------",
  ];
  for (const s of Object.values(m.sources)) {
    lines.push(`* ${s.name}: ${s.articles} articles. Licence: ${s.license}. ${s.url}`);
    if (s.note) lines.push(`  ${s.note}`);
  }
  lines.push("", `Built ${m.builtAt}.`, "");
  return lines.join("\n");
}
