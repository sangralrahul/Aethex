# AI function code

Aethex no longer uses Supabase. Everything runs on Cloudflare: the website,
accounts (D1, `worker/auth.ts`) and these AI functions, which the Worker
imports and serves at `POST /api/fn/<name>` (`worker/index.ts`).

The folder keeps its old name so the imports stay put:

- `functions/groq-ai` — Cadus
- `functions/analyze-drug-interactions`, `interpret-labs`, `predict-symptoms`, `analyze-radiology`
- `functions/_shared` — model and PubMed helpers
