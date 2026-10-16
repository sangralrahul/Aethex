#!/usr/bin/env node
// Builds the offline Cadus Medical Library that Cadus answers from when the
// Anthropic API has no credits. Output is static files served with the website.
//
//   node build.mjs                          # full build: Wikipedia + NIH + Disease Ontology
//   node build.mjs --sources=medquad,do     # starter library (no Wikipedia)
//   node build.mjs --max-articles=5000      # cap the number of Wikipedia articles
//
// Options:
//   --sources=wikipedia,medquad,do   which sources to include (default: all three)
//   --projects=Medicine,Pharmacology WikiProjects to include (default: Medicine,Pharmacology,Anatomy,Physiology)
//   --max-articles=N                 cap Wikipedia articles, most important first (0 = no cap)
//   --out=PATH                       output folder (default: artifacts/aethex/public/library/v1)
//   --cache=PATH                     download cache so an interrupted build can resume (default: .cache)
//   --medquad-dir=PATH               use a local clone of github.com/abachaa/MedQuAD
//   --do-file=PATH                   use a local copy of doid.obo
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLibrary } from "./lib/indexer.mjs";
import { log, parseArgs } from "./lib/util.mjs";
import { collectDiseaseOntology } from "./sources/disease-ontology.mjs";
import { collectMedquad } from "./sources/medquad.mjs";
import { collectWikipedia } from "./sources/wikipedia.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const sources = (args.sources ?? "wikipedia,medquad,do").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const out = resolve(args.out ?? join(here, "../../artifacts/aethex/public/library/v1"));
const ctx = {
  cacheDir: resolve(args.cache ?? join(here, ".cache")),
  maxArticles: Number(args["max-articles"] ?? 0) || 0,
  projects: args.projects ? args.projects.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
  medquadDir: args["medquad-dir"] ? resolve(args["medquad-dir"]) : "",
  doFile: args["do-file"] ? resolve(args["do-file"]) : "",
  delayMs: Number(args["delay-ms"] ?? 60),
  verbose: args.verbose === "true",
};

const SOURCE_META = {
  w: {
    name: "Wikipedia (English) medical articles",
    license: "CC BY-SA 4.0",
    url: "https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Medicine",
    note: "Text by Wikipedia contributors; see each article's history for authors.",
  },
  m: {
    name: "NIH health information via MedQuAD (Ben Abacha & Demner-Fushman, BMC Bioinformatics 2019)",
    license: "CC BY 4.0",
    url: "https://github.com/abachaa/MedQuAD",
    note: "Answers from cancer.gov, GARD, Genetics Home Reference, MedlinePlus, NIDDK, NINDS, NIHSeniorHealth, NHLBI and CDC.",
  },
  d: {
    name: "Human Disease Ontology",
    license: "CC0 1.0",
    url: "https://disease-ontology.org",
  },
};

const started = Date.now();
mkdirSync(ctx.cacheDir, { recursive: true });
log(`Building the Cadus Medical Library from: ${sources.join(", ")}`);
log(`Output: ${out}`);

const docs = [];
const failures = [];
const run = async (name, fn) => {
  try {
    const d = await fn(ctx);
    docs.push(...d);
  } catch (e) {
    failures.push(name);
    log(`!! ${name} failed: ${e.message}`);
  }
};
if (sources.includes("wikipedia")) await run("Wikipedia", collectWikipedia);
if (sources.includes("medquad")) await run("MedQuAD", collectMedquad);
if (sources.includes("do")) await run("Disease Ontology", collectDiseaseOntology);

if (!docs.length || (failures.length && args["allow-partial"] !== "true")) {
  log(`Not updating the library: ${docs.length ? `missing ${failures.join(", ")}` : "no articles collected"}. The existing library was left unchanged.`);
  log("Re-run to resume (downloads are cached), or pass --allow-partial to publish what was collected.");
  process.exit(1);
}
// Build next to the live folder, then swap it in, so a failure never leaves a half-written library.
const staging = `${out}.building`;
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
const manifest = buildLibrary(docs, staging, { sources: SOURCE_META });
rmSync(out, { recursive: true, force: true });
renameSync(staging, out);
log(`Done in ${Math.round((Date.now() - started) / 1000)} s: ${manifest.articles} articles, ${(manifest.bytes / 1e6).toFixed(1)} MB.`);
