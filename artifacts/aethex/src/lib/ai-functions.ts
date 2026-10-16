/**
 * Calls the AI functions (Cadus, drug interactions, labs, symptoms, radiology).
 *
 * They run on the site's own Cloudflare Worker at POST /api/fn/<name>
 * (see worker/index.ts). If that endpoint isn't there, for example on the Vite
 * dev server, the call falls back to the Supabase Edge Function of the same
 * name. Returns the same { data, error } shape as supabase.functions.invoke.
 */
import { supabase } from "@/integrations/supabase/client";

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
  } catch {
    /* network problem or no Worker: try Supabase below */
  }
  const { data, error } = await supabase.functions.invoke(name, { body: options.body as Record<string, unknown> });
  return { data: (data ?? null) as T | null, error: (error ?? null) as InvokeError | null };
}
