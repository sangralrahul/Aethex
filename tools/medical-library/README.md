# Cadus Medical Library builder

Cadus normally answers with Claude. If the Anthropic API key has no credits left
(or the key is missing or rejected), Cadus switches to **Library mode** and
answers from an offline medical library that ships with the website in
`artifacts/aethex/public/library/v1/`:

- the backup model (Llama 3.3 on Groq, if `GROQ_API_KEY` is set) writes the
  answer using only the library passages it is given, with numbered citations;
- with no backup model, Cadus quotes the most relevant library sections directly.

Library-mode answers are clearly labelled and are not safety-reviewed.

## Sources

| Source | What | Licence |
| --- | --- | --- |
| English Wikipedia | every article assessed by WikiProject Medicine, Pharmacology, Anatomy and Physiology | CC BY-SA 4.0 |
| MedQuAD | NIH and CDC health answers (cancer.gov, GARD, Genetics Home Reference, MedlinePlus, NIDDK, NINDS, NHLBI, CDC) | CC BY 4.0 |
| Human Disease Ontology | definitions, synonyms and codes for about 10,000 diseases | CC0 |

The built library is distributed under CC BY-SA 4.0 (see `LICENSE.txt` in the
output folder). Answers link every passage back to its source.

## Build it

The easiest way is GitHub: **Actions → Build Cadus medical library → Run
workflow**. It downloads about 60,000 Wikipedia articles (1 to 2 hours), builds
the library and commits it. Cloudflare then deploys it with the site. Run
`git pull` before your next push.

Locally (Node 22.18 or newer):

```
cd tools/medical-library
npm install
node build.mjs                          # everything
node build.mjs --sources=medquad,do     # starter library without Wikipedia
node build.mjs --max-articles=10000     # only the 10,000 most important Wikipedia articles
npm test                                # offline tests
```

Downloads are cached in `.cache/`, so an interrupted build resumes quickly. If a
source fails, the existing library is left untouched.

## Format

- `manifest.json`: counts, sources and build date.
- `terms/xx.json.gz`: 256 shards of a pruned BM25 index (term → best articles).
- `articles/xxx.json.gz`: articles, 128 per shard, split into sections.

The tokenizer is shared with the app (`artifacts/aethex/src/lib/medlib/text.ts`),
so the browser searches exactly what was indexed.
