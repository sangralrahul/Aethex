# AI function code

Aethex no longer uses Supabase. Everything runs on Cloudflare: the website,
accounts (D1, `worker/auth.ts`) and these AI functions, which the Worker
imports and serves at `POST /api/fn/<name>` (`worker/index.ts`).

- `functions/cadus` — Cadus (Anthropic Claude only)
- `functions/analyze-drug-interactions`, `interpret-labs`, `predict-symptoms`, `analyze-radiology`
- `functions/_shared` — Claude and PubMed helpers
