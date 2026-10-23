// Cloudflare Worker for aethex.in and its subdomains: cadus.aethex.in (Cadus),
// auth.aethex.in (Cadus sign-in), login.aethex.in (store sign-in) and
// downloads.aethex.in (the Cadus download page, with the installers from R2).
//
// Serves the website (static files in ./dist), the AI endpoints at
// POST /api/fn/<name>:
//   cadus (Cadus), analyze-drug-interactions, interpret-labs,
//   predict-symptoms, analyze-radiology
// (the function code lives in supabase/functions for historical reasons and
// runs here unchanged), accounts, profiles and carts (worker/auth.ts) on D1, and
// the store: catalogue, orders (cash on delivery, or paid online through
// Razorpay), coupons, reviews, alerts, requests and admin (worker/store.ts).
//
// Secrets and variables (Workers & Pages > aethex > Settings > Variables and Secrets):
//   ANTHROPIC_API_KEY  Claude, which writes every Cadus answer
// Bindings (wrangler.jsonc): DB (D1), DOWNLOADS (R2), AI (Workers AI: Whisper for voice typing, POST /api/transcribe)
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   Google sign-in
//   BREVO_API_KEY, BREVO_FROM_EMAIL          sign-in codes, cart and order emails
//   ADMIN_EMAILS, STORE_EMAIL                 the store admin, and where orders are emailed
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET      online payments (off until both are set)
//   RAZORPAY_WEBHOOK_SECRET                   Razorpay's webhook to /api/store/razorpay/webhook (optional)
//   ELEVENLABS_API_KEY                        natural voices, Scribe and audio (worker/voice.ts; optional)
import { functionHandler, functionNames, useEnv } from "./deno-shim";
import { handleAuth, handleCart, handleProfile, runScheduled, type AuthEnv } from "./auth";
import { serveDownload, type R2Bucket } from "./downloads";
import { handleStore, runStoreScheduled, type StoreEnv } from "./store";
import { handleTranscribe, type AiBinding } from "./transcribe";
import { handleVoice, voiceEnabled, type VoiceEnv } from "./voice";
import "./names/cadus";
import "../supabase/functions/cadus/index.ts";
import "./names/analyze-drug-interactions";
import "../supabase/functions/analyze-drug-interactions/index.ts";
import "./names/interpret-labs";
import "../supabase/functions/interpret-labs/index.ts";
import "./names/predict-symptoms";
import "../supabase/functions/predict-symptoms/index.ts";
import "./names/analyze-radiology";
import "../supabase/functions/analyze-radiology/index.ts";

interface Env extends AuthEnv, StoreEnv, VoiceEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ANTHROPIC_API_KEY?: string;
  /** R2 bucket "aethex-downloads": the desktop installers. */
  DOWNLOADS?: R2Bucket;
  /** Workers AI: speech to text for voice typing. */
  AI?: AiBinding;
  [key: string]: unknown;
}

// The site's own pages: aethex.in and its subdomains over https, this Worker's
// workers.dev address (and its version previews), and local development.
const ALLOWED_ORIGIN = /^(?:https:\/\/(?:(?:www\.)?(?:[a-z0-9-]+\.)?aethex\.in|(?:[a-z0-9-]+-)?aethex\.[a-z0-9-]+\.workers\.dev)|http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?)$/i;

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default {
  async fetch(request: Request, env: Env, ctx?: { waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
    const url = new URL(request.url);

    // downloads.aethex.in: installers from R2; every other path is the download page.
    if (url.hostname === "downloads.aethex.in" && !url.pathname.startsWith("/api/")) {
      if (url.pathname.startsWith("/cadus/")) return serveDownload(request, env.DOWNLOADS, url.pathname.slice(1));
      return env.ASSETS.fetch(new Request(new URL("/", url), request));
    }

    // The download page lives at downloads.aethex.in. (/downloads/latest.json stays here for the desktop app.)
    if ((url.pathname === "/downloads" || url.pathname === "/downloads/") && /^(?:www\.|cadus\.)?aethex\.in$/.test(url.hostname)) {
      return new Response(null, { status: 301, headers: { location: "https://downloads.aethex.in/", "cache-control": "public, max-age=3600" } });
    }

    if (url.pathname === "/api/health" && url.searchParams.get("live") === "1") {
      // Tries the Anthropic and ElevenLabs keys for real (a one-token message and a voices list),
      // reporting only whether each works. Cached for 10 minutes so it can't be used to run up costs.
      return json(await liveKeyCheck(env));
    }
    if (url.pathname === "/api/health") {
      // Shows whether the keys are set (never their values), to check the setup.
      return json({ ok: true, functions: functionNames(), anthropic: !!env.ANTHROPIC_API_KEY, accounts: !!env.DB, google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), email: !!env.BREVO_API_KEY, downloads: !!env.DOWNLOADS, voiceTyping: !!env.AI || voiceEnabled(env), elevenlabs: voiceEnabled(env), storeAdmin: !!env.ADMIN_EMAILS, onlinePayments: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET), paymentWebhook: !!env.RAZORPAY_WEBHOOK_SECRET });
    }

    const account = url.pathname.startsWith("/api/auth/") || url.pathname === "/api/auth" ? handleAuth : url.pathname === "/api/profile" ? handleProfile : url.pathname === "/api/cart" ? handleCart : null;
    if (account) {
      // Accounts are only for this site's own pages: browsers send Origin on every
      // request that changes something, and it must be ours.
      const origin = request.headers.get("origin");
      if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: "Origin not allowed" }, 403);
      if (request.method !== "GET" && !origin) return json({ error: "Origin required" }, 403);
      try {
        return await account(request, env);
      } catch (e) {
        console.error(`${url.pathname} failed`, e);
        return json({ error: "The account service hit an unexpected error. Please try again." }, 500);
      }
    }

    if (url.pathname.startsWith("/api/store/")) {
      // Reading the catalogue is open to all; anything that changes something must come from our own pages,
      // except Razorpay's webhook, which comes from Razorpay's servers and is checked by its signature.
      if (url.pathname !== "/api/store/razorpay/webhook") {
        const origin = request.headers.get("origin");
        if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: "Origin not allowed" }, 403);
        if (request.method !== "GET" && request.method !== "HEAD" && !origin) return json({ error: "Origin required" }, 403);
      }
      try {
        return await handleStore(request, env, ctx);
      } catch (e) {
        console.error(`${url.pathname} failed`, e);
        return json({ error: "The store hit an unexpected error. Please try again." }, 500);
      }
    }

    // Voice typing: a short recording from Cadus to text. Only this site's pages may use it.
    if (url.pathname === "/api/transcribe") {
      const origin = request.headers.get("origin");
      if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: "Origin not allowed" }, 403);
      if (request.method === "POST" && !origin) return json({ error: "Origin required" }, 403);
      return handleTranscribe(request, env.AI, env);
    }

    // ElevenLabs: natural voices, Scribe and audio. Only this site's pages may use them.
    if (url.pathname.startsWith("/api/voice/")) {
      const origin = request.headers.get("origin");
      if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: "Origin not allowed" }, 403);
      if (request.method !== "GET" && !origin) return json({ error: "Origin required" }, 403);
      try {
        const r = await handleVoice(request, env);
        if (r) return r;
      } catch (e) {
        console.error(`${url.pathname} failed`, e);
        return json({ error: "The voice service hit an unexpected error. Please try again." }, 500);
      }
    }

    const match = /^\/api\/fn\/([a-z0-9-]+)\/?$/.exec(url.pathname);
    if (match) {
      // "groq-ai" is the old name of the Cadus function, still sent by pages opened before the rename.
      const name = match[1] === "groq-ai" ? "cadus" : match[1];
      const handler = functionHandler(name);
      if (!handler) return json({ error: `Unknown function: ${match[1]}` }, 404);
      if (request.method !== "POST" && request.method !== "OPTIONS") return json({ error: "Use POST" }, 405);
      // Only this site may call the AI from a browser (it spends your AI credits).
      const origin = request.headers.get("origin");
      if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: "Origin not allowed" }, 403);
      useEnv(env);
      try {
        return await handler(request);
      } catch (e) {
        console.error(`api/fn/${match[1]} failed`, e);
        return json({ error: "The AI service hit an unexpected error. Please try again." }, 500);
      }
    }

    // Everything else is the website, served exactly as before.
    return env.ASSETS.fetch(request);
  },

  // Hourly (wrangler.jsonc "triggers"): cart reminders and clean-up; online payments that never reported
  // back, unpaid online orders (cancelled after a day), and back-in-stock and price-drop alerts.
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    ctx.waitUntil(runScheduled(env).then((r) => console.log("scheduled", r), (e) => console.error("scheduled failed", e)));
    ctx.waitUntil(runStoreScheduled(env).then((r) => console.log("store scheduled", r), (e) => console.error("store scheduled failed", e)));
  },
};

/* ------------------------------------------------------------------ live key check (/api/health?live=1) */

interface KeyCheck { set: boolean; ok: boolean; status?: number; note: string }
let lastCheck: { at: number; result: { checkedAt: string; anthropic: KeyCheck; elevenlabs: KeyCheck } } | null = null;
const why = (status: number, body: string) =>
  status === 401 ? "The key was rejected: it is wrong, revoked or has a typo. Put it again with wrangler secret put."
  : status === 403 ? "The key works but lacks a permission this needs."
  : status === 429 ? "Rate-limited right now; try again in a minute."
  : /credit|balance|billing|quota/i.test(body) ? "The account is out of credit or over its quota."
  : `Unexpected reply (HTTP ${status}).`;

export async function liveKeyCheck(env: Env): Promise<{ checkedAt: string; anthropic: KeyCheck; elevenlabs: KeyCheck }> {
  if (lastCheck && Date.now() - lastCheck.at < 10 * 60000) return lastCheck.result;
  const anthropic = async (): Promise<KeyCheck> => {
    if (!env.ANTHROPIC_API_KEY) return { set: false, ok: false, note: "ANTHROPIC_API_KEY is not set." };
    const h = { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };
    try {
      const m = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: h });
      if (!m.ok) return { set: true, ok: false, status: m.status, note: why(m.status, await m.text().catch(() => "")) };
      const model = ((await m.json().catch(() => ({}))) as { data?: { id?: string }[] }).data?.[0]?.id;
      if (!model) return { set: true, ok: true, status: 200, note: "The key is valid (no model listed to test a reply)." };
      // A one-token reply shows the account has credit, not just a valid key.
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: h, body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "Hi" }] }) });
      return r.ok ? { set: true, ok: true, status: 200, note: "The key works and the account can answer." } : { set: true, ok: false, status: r.status, note: why(r.status, await r.text().catch(() => "")) };
    } catch { return { set: true, ok: false, note: "Couldn't reach Anthropic from the Worker." }; }
  };
  const eleven = async (): Promise<KeyCheck> => {
    if (!voiceEnabled(env)) return { set: false, ok: false, note: "ELEVENLABS_API_KEY is not set: voices fall back to the browser." };
    try {
      const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": String((env as { ELEVENLABS_API_KEY?: string }).ELEVENLABS_API_KEY) } });
      return r.ok ? { set: true, ok: true, status: 200, note: "The key works (voices can be listed)." } : { set: true, ok: false, status: r.status, note: why(r.status, await r.text().catch(() => "")) };
    } catch { return { set: true, ok: false, note: "Couldn't reach ElevenLabs from the Worker." }; }
  };
  const [a, e] = await Promise.all([anthropic(), eleven()]);
  const result = { checkedAt: new Date().toISOString(), anthropic: a, elevenlabs: e };
  lastCheck = { at: Date.now(), result };
  return result;
}
