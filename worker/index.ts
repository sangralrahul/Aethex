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
// the store: catalogue, cash-on-delivery orders, requests and admin (worker/store.ts).
//
// Secrets and variables (Workers & Pages > aethex > Settings > Variables and Secrets):
//   ANTHROPIC_API_KEY  Claude, the only AI Cadus uses
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   Google sign-in
//   BREVO_API_KEY, BREVO_FROM_EMAIL          sign-in codes, cart and order emails
//   ADMIN_EMAILS, STORE_EMAIL                 the store admin, and where orders are emailed
import { functionHandler, functionNames, useEnv } from "./deno-shim";
import { handleAuth, handleCart, handleProfile, runScheduled, type AuthEnv } from "./auth";
import { serveDownload, type R2Bucket } from "./downloads";
import { handleStore, type StoreEnv } from "./store";
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

interface Env extends AuthEnv, StoreEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ANTHROPIC_API_KEY?: string;
  /** R2 bucket "aethex-downloads": the desktop installers. */
  DOWNLOADS?: R2Bucket;
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
  async fetch(request: Request, env: Env): Promise<Response> {
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

    if (url.pathname === "/api/health") {
      // Shows whether the keys are set (never their values), to check the setup.
      return json({ ok: true, functions: functionNames(), anthropic: !!env.ANTHROPIC_API_KEY, accounts: !!env.DB, google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), email: !!env.BREVO_API_KEY, downloads: !!env.DOWNLOADS, storeAdmin: !!env.ADMIN_EMAILS });
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
      // Reading the catalogue is open to all; anything that changes something must come from our own pages.
      const origin = request.headers.get("origin");
      if (origin && !ALLOWED_ORIGIN.test(origin)) return json({ error: "Origin not allowed" }, 403);
      if (request.method !== "GET" && request.method !== "HEAD" && !origin) return json({ error: "Origin required" }, 403);
      try {
        return await handleStore(request, env);
      } catch (e) {
        console.error(`${url.pathname} failed`, e);
        return json({ error: "The store hit an unexpected error. Please try again." }, 500);
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

  // Hourly (wrangler.jsonc "triggers"): store cart reminders and clean-up.
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    ctx.waitUntil(runScheduled(env).then((r) => console.log("scheduled", r), (e) => console.error("scheduled failed", e)));
  },
};
