// Shared Groq helper for all edge functions.
// Uses the user's GROQ_API_KEY and Groq's OpenAI-compatible API.

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

type Msg = { role: "system" | "user" | "assistant"; content: unknown };

export async function callGroq(opts: {
  model?: string;
  messages: Msg[];
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    return {
      ok: false as const,
      status: 500,
      error: "GROQ_API_KEY not configured. Add it in project settings.",
    };
  }

  const body: Record<string, unknown> = {
    model: opts.model ?? GROQ_TEXT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return {
      ok: false as const,
      status: resp.status === 429 ? 429 : resp.status === 402 ? 402 : 502,
      error:
        resp.status === 429
          ? "Groq is rate-limited, please retry in a moment."
          : resp.status === 401
            ? "Groq API key is invalid."
            : `Groq upstream error ${resp.status}`,
      detail: detail.slice(0, 400),
    };
  }

  const data = await resp.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  return { ok: true as const, content, raw: data };
}

export function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
