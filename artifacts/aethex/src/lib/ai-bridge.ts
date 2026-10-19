/**
 * Production has no Express API server, so legacy calls to `/api/ai/chat` are
 * routed to the `cadus` function on the Cloudflare Worker (Claude Haiku 5.5).
 * Response shape stays `{ message }`.
 */
import { invokeAi } from "@/lib/ai-functions";

let installed = false;

export function installAiBridge() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    let path = "";
    try {
      path = new URL(url, window.location.origin).pathname;
    } catch {
      return nativeFetch(input, init);
    }
    if (!path.endsWith("/api/ai/chat") || (init?.method ?? "GET").toUpperCase() !== "POST") {
      return nativeFetch(input, init);
    }
    let body: any = {};
    try {
      body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    } catch { /* ignore */ }
    const history = Array.isArray(body.conversationHistory) ? body.conversationHistory : Array.isArray(body.history) ? body.history : [];
    const { data, error } = await invokeAi("cadus", {
      body: { action: "chat", message: String(body.message ?? ""), history },
    });
    const payload = error ? { error: error.message, message: data?.error } : data;
    return new Response(JSON.stringify(payload ?? {}), {
      status: error ? 502 : 200,
      headers: { "content-type": "application/json" },
    });
  };
}
