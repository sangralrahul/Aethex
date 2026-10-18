/**
 * Calls the AI functions (Cadus, drug interactions, labs, symptoms, radiology).
 *
 * They run on the site's own Cloudflare Worker at POST /api/fn/<name>
 * (see worker/index.ts). Returns { data, error }.
 */

type InvokeError = Error & { context?: Response };

export async function invokeAi<T = any>(
  name: string,
  options: { body?: unknown } = {},
): Promise<{ data: T | null; error: InvokeError | null }> {
  try {
    const res = await fetch(`/api/fn/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(options.body ?? {}),
    });
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    if (res.status !== 404 && isJson) {
      const data = await res.json();
      if (res.ok) return { data: data as T, error: null };
      const error: InvokeError = new Error(data?.error || `Request failed (${res.status})`);
      error.context = new Response(JSON.stringify(data), { status: res.status, headers: { "content-type": "application/json" } });
      return { data: null, error };
    }
    const error: InvokeError = new Error(res.status === 404 || !isJson ? "The AI service isn't available here. Run the site with the Cloudflare Worker (npx wrangler dev)." : `Request failed (${res.status})`);
    return { data: null, error };
  } catch {
    return { data: null, error: new Error("Can't reach the AI service. Check your connection and try again.") };
  }
}
