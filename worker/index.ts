// Cloudflare Worker for aethex.in and cadus.aethex.in.
//
// Serves the website (static files in ./dist) and runs the AI endpoints that
// used to be Supabase Edge Functions, at POST /api/fn/<name>:
//   groq-ai (Cadus), analyze-drug-interactions, interpret-labs,
//   predict-symptoms, analyze-radiology
// The function code is shared with supabase/functions and runs unchanged.
//
// Secrets (Workers & Pages > aethex > Settings > Variables and Secrets):
//   ANTHROPIC_API_KEY  Claude (main AI)
//   GROQ_API_KEY       optional backup model, also writes Library-mode answers
// Login, OTP emails and the database stay on Supabase.
import { functionHandler, functionNames, useEnv } from "./deno-shim";
import "./names/groq-ai";
import "../supabase/functions/groq-ai/index.ts";
import "./names/analyze-drug-interactions";
import "../supabase/functions/analyze-drug-interactions/index.ts";
import "./names/interpret-labs";
import "../supabase/functions/interpret-labs/index.ts";
import "./names/predict-symptoms";
import "../supabase/functions/predict-symptoms/index.ts";
import "./names/analyze-radiology";
import "../supabase/functions/analyze-radiology/index.ts";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ANTHROPIC_API_KEY?: string;
  GROQ_API_KEY?: string;
  [key: string]: unknown;
}

const ALLOWED_ORIGIN = /^https?:\/\/(?:localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?|(?:[a-z0-9-]+\.)*aethex\.in|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.workers\.dev)$/i;

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      // Shows whether the keys are set (never their values), to check the setup.
      return json({ ok: true, functions: functionNames(), anthropic: !!env.ANTHROPIC_API_KEY, groq: !!env.GROQ_API_KEY });
    }

    const match = /^\/api\/fn\/([a-z0-9-]+)\/?$/.exec(url.pathname);
    if (match) {
      const handler = functionHandler(match[1]);
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
};
