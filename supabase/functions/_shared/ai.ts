// Shared AI helper for all of Cadus's functions. Anthropic Claude only
// (ANTHROPIC_API_KEY):
//   - Drafting: Claude Haiku 5.5    (CADUS_MODEL overrides)
//   - Safety review: Claude Sonnet 5.5 (CADUS_REVIEW_MODEL overrides)
// When Claude is unavailable the caller gets the error (or, with
// onOutage: "report", the reason, so Cadus can switch to its offline library).
//
// IMPORTANT: Claude 5.5-family models reject non-default `temperature` / `top_p`
// (HTTP 400), so sampling parameters are never sent to Claude. Depth of reasoning
// is controlled with `output_config.effort` instead.
//
// Messages use the OpenAI shape ({role, content}); content may be a string or an
// array of {type:"text"} / {type:"image_url"} parts and is converted for Claude.
// Claude's own {type:"document"} parts (PDFs) pass through.
//
// Streaming: pass `onText` and Claude's answer is streamed, calling onText for
// every piece of text as it arrives (the result is the same as without it).

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const CLAUDE_DRAFT_MODEL = Deno.env.get("CADUS_MODEL") || "claude-haiku-5-5";
export const CLAUDE_REVIEW_MODEL = Deno.env.get("CADUS_REVIEW_MODEL") || "claude-sonnet-5-5";
/** @deprecated kept for older imports */
export const CLAUDE_MODEL = CLAUDE_DRAFT_MODEL;

/** Sites Cadus may search and cite when live sources are switched on. */
export const TRUSTED_MEDICAL_DOMAINS = [
  "who.int",
  "icmr.gov.in",
  "mohfw.gov.in",
  "ncdc.mohfw.gov.in",
  "cdsco.gov.in",
  "nice.org.uk",
  "nhs.uk",
  "cdc.gov",
  "nih.gov",
  "ncbi.nlm.nih.gov",
  "pubmed.ncbi.nlm.nih.gov",
  "medlineplus.gov",
  "dailymed.nlm.nih.gov",
  "fda.gov",
  "ema.europa.eu",
  "cochranelibrary.com",
  "nejm.org",
  "thelancet.com",
  "bmj.com",
  "jamanetwork.com",
  "ahajournals.org",
  "escardio.org",
  "idsociety.org",
  "kdigo.org",
  "diabetesjournals.org",
  "ginasthma.org",
  "goldcopd.org",
  "msdmanuals.com",
  "aiims.edu",
  // Indian programmes, regulators and professional bodies
  "tbcindia.gov.in",
  "naco.gov.in",
  "nhm.gov.in",
  "nmc.org.in",
  "ipc.gov.in",
  "nppaindia.nic.in",
  "iapindia.org",
  "fogsi.org",
];

export type Effort = "low" | "medium" | "high";
export interface Source { n: number; url: string; title: string }

type Msg = { role: "system" | "user" | "assistant"; content: unknown };

/**
 * Why Claude can't be used when retrying won't help: no credits (or a spend
 * limit reached), a rejected key, or no key at all. Callers that pass
 * onOutage: "report" get this back, so Cadus can switch to Library mode.
 */
export type ClaudeOutage = "credits" | "auth" | "missing";

export type AiResult =
  | {
      ok: true;
      content: string;
      provider: "claude";
      model: string;
      sources?: Source[];
      queries?: string[];
      fallbackReason?: string;
      raw?: unknown;
    }
  | { ok: false; status: number; error: string; detail?: string; outage?: ClaudeOutage };

/** Classify an Anthropic error response. Returns null for transient errors (overload, rate limit, 5xx). */
export function classifyClaudeFailure(status: number, detail: string): ClaudeOutage | null {
  const d = detail.toLowerCase();
  if (
    status === 402 ||
    /credit balance|purchase credits|plans (&|and) billing|billing_error|usage limits?|spend(ing)? limit|insufficient (credit|funds|quota)/.test(d)
  ) return "credits";
  if (status === 401 || status === 403 || /authentication_error|permission_error|invalid x-api-key/.test(d)) return "auth";
  return null;
}

export type CallOpts = {
  model?: string;
  messages: Msg[];
  jsonMode?: boolean;
  /** Not sent: Claude 5.5 models reject non-default sampling. Kept so callers needn't change. */
  temperature?: number;
  maxTokens?: number;
  /** Claude reasoning depth. */
  effort?: Effort;
  /** Let Claude search trusted medical sites and cite them. */
  webSearch?: boolean | { maxUses?: number };
  /**
   * What to do when Claude is out of credits or its key is missing/rejected:
   * "fallback" (default) returns the error; "report" also sets `outage` so the
   * caller can use the offline medical library instead.
   */
  onOutage?: "fallback" | "report";
  /** Stream the answer: called with each new piece of text as it arrives. */
  onText?: (text: string) => void;
  /** Called when text already streamed should be discarded. */
  onReset?: () => void;
  /** Cancels the request, for example when the browser has gone away. */
  signal?: AbortSignal;
};

// ---------------------------------------------------------------- Claude

function dataUrlToClaudeImage(url: string) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(url);
  if (m) return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
  return { type: "image", source: { type: "url", url } };
}

function toClaudeContent(content: unknown): unknown {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");
  return content.map((part: any) => {
    if (part?.type === "image_url") {
      const url = typeof part.image_url === "string" ? part.image_url : part.image_url?.url;
      return dataUrlToClaudeImage(String(url || ""));
    }
    if (part?.type === "text") return { type: "text", text: String(part.text ?? "") };
    return part;
  });
}

/** Turn Claude content blocks into text with [n] citation markers + a numbered source list. */
export function extractClaudeAnswer(blocks: any[]): { text: string; sources: Source[]; queries: string[] } {
  const sources: Source[] = [];
  const byUrl = new Map<string, number>();
  const queries: string[] = [];
  let text = "";
  for (const b of blocks) {
    if (b?.type === "server_tool_use" && b?.input?.query) queries.push(String(b.input.query));
    if (b?.type !== "text") continue;
    let t = String(b.text ?? "");
    if (Array.isArray(b.citations) && b.citations.length) {
      const nums: number[] = [];
      for (const c of b.citations) {
        const url = typeof c?.url === "string" ? c.url : "";
        if (!url) continue;
        let n = byUrl.get(url);
        if (!n) {
          n = sources.length + 1;
          byUrl.set(url, n);
          sources.push({ n, url, title: String(c.title || url).slice(0, 200) });
        }
        if (!nums.includes(n)) nums.push(n);
      }
      if (nums.length) {
        const trailing = (/\s*$/.exec(t) ?? [""])[0];
        t = `${t.slice(0, t.length - trailing.length)} ${nums.map((n) => `[${n}]`).join("")}${trailing}`;
      }
    }
    text += t;
  }
  return { text: text.trim(), sources, queries };
}

/**
 * Read a streamed Claude response (server-sent events) back into content blocks,
 * calling onText for each piece of answer text as it arrives.
 */
export async function readClaudeStream(
  resp: Response,
  onText: (text: string) => void,
): Promise<{ blocks: any[]; stopReason: string; error: string }> {
  const blocks: any[] = [];
  const partialJson: Record<number, string> = {};
  let stopReason = "";
  let error = "";
  const handle = (ev: any) => {
    switch (ev?.type) {
      case "content_block_start": {
        const b = { ...(ev.content_block ?? {}) };
        if (b.type === "text" && typeof b.text !== "string") b.text = "";
        blocks[ev.index] = b;
        if (b.type === "text" && b.text) onText(b.text);
        break;
      }
      case "content_block_delta": {
        const b = blocks[ev.index] ?? (blocks[ev.index] = { type: "text", text: "" });
        const d = ev.delta ?? {};
        if (d.type === "text_delta" && typeof d.text === "string") {
          b.text = (b.text ?? "") + d.text;
          if (d.text) onText(d.text);
        } else if (d.type === "citations_delta" && d.citation) {
          (b.citations ??= []).push(d.citation);
        } else if (d.type === "input_json_delta") {
          partialJson[ev.index] = (partialJson[ev.index] ?? "") + String(d.partial_json ?? "");
        }
        break;
      }
      case "content_block_stop":
        if (partialJson[ev.index] !== undefined && blocks[ev.index]) {
          try { blocks[ev.index].input = JSON.parse(partialJson[ev.index] || "{}"); } catch { /* keep partial */ }
        }
        break;
      case "message_delta":
        if (ev.delta?.stop_reason) stopReason = String(ev.delta.stop_reason);
        break;
      case "error":
        error = String(ev.error?.message || ev.error?.type || "The AI stream failed.");
        break;
    }
  };
  const reader = resp.body?.getReader();
  if (!reader) return { blocks, stopReason, error: "The AI returned no stream." };
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let cut: number;
    while ((cut = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, cut);
      buf = buf.slice(cut + 2);
      const data = raw.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
      if (!data) continue;
      try { handle(JSON.parse(data)); } catch { /* not JSON: ignore */ }
    }
  }
  return { blocks: blocks.filter(Boolean), stopReason, error };
}

async function callClaude(apiKey: string, opts: CallOpts): Promise<AiResult> {
  const systemParts: string[] = [];
  const messages: { role: "user" | "assistant"; content: unknown }[] = [];
  for (const m of opts.messages) {
    if (m.role === "system") {
      systemParts.push(typeof m.content === "string" ? m.content : JSON.stringify(m.content));
      continue;
    }
    const content = toClaudeContent(m.content);
    const last = messages[messages.length - 1];
    // Claude needs alternating roles: merge consecutive same-role text turns.
    if (last && last.role === m.role && typeof last.content === "string" && typeof content === "string") {
      last.content = `${last.content}\n\n${content}`;
    } else {
      messages.push({ role: m.role as "user" | "assistant", content });
    }
  }
  if (messages.length === 0 || messages[0].role !== "user") messages.unshift({ role: "user", content: "Hello" });
  if (opts.jsonMode) systemParts.push("Respond with valid JSON only. No prose and no markdown code fences.");

  const model = opts.model && opts.model.startsWith("claude") ? opts.model : CLAUDE_DRAFT_MODEL;
  const body: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens ?? 16000,
    messages,
  };
  if (systemParts.length) {
    // Cache the stable system prompt to cut input cost on repeat calls.
    body.system = [{ type: "text", text: systemParts.join("\n\n"), cache_control: { type: "ephemeral" } }];
  }
  if (opts.effort) body.output_config = { effort: opts.effort };
  if (opts.webSearch) {
    const maxUses = typeof opts.webSearch === "object" && opts.webSearch.maxUses ? opts.webSearch.maxUses : 3;
    body.tools = [{
      type: "web_search_20250305",
      name: "web_search",
      max_uses: maxUses,
      allowed_domains: TRUSTED_MEDICAL_DOMAINS,
      user_location: { type: "approximate", country: "IN", timezone: "Asia/Kolkata" },
    }];
  }

  const streaming = typeof opts.onText === "function";
  if (streaming) body.stream = true;
  const collected: any[] = [];
  for (let turn = 0; turn < 3; turn++) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error(`Claude ${model} error ${resp.status}: ${detail.slice(0, 500)}`);
      const outage = classifyClaudeFailure(resp.status, detail);
      return {
        ok: false,
        status: outage === "credits" ? 402 : resp.status === 429 || resp.status === 529 ? 429 : resp.status === 401 ? 401 : resp.status === 400 ? 400 : 502,
        error:
          outage === "credits"
            ? "The AI service has no credits left."
            : resp.status === 429 || resp.status === 529
              ? "Cadus is busy right now, please retry in a moment."
              : resp.status === 401
                ? "The AI service key is invalid."
                : `The AI service returned an error (${resp.status}).`,
        detail: detail.slice(0, 400),
        ...(outage ? { outage } : {}),
      };
    }
    let blocks: any[] = [];
    let stopReason = "";
    if (streaming) {
      const r = await readClaudeStream(resp, opts.onText as (t: string) => void);
      if (r.error) {
        console.error(`Claude ${model} stream error: ${r.error}`);
        return { ok: false, status: 502, error: "The AI service was interrupted. Please try again.", detail: r.error.slice(0, 400) };
      }
      blocks = r.blocks;
      stopReason = r.stopReason;
    } else {
      const data = await resp.json();
      blocks = Array.isArray(data?.content) ? data.content : [];
      stopReason = String(data?.stop_reason ?? "");
    }
    collected.push(...blocks);
    // Long server-side tool turns can pause; send the partial turn back to continue.
    if (stopReason === "pause_turn") {
      messages.push({ role: "assistant", content: blocks });
      continue;
    }
    break;
  }

  const { text, sources, queries } = extractClaudeAnswer(collected);
  if (!text) return { ok: false, status: 502, error: "The AI returned an empty answer. Please try again." };
  return {
    ok: true,
    content: text,
    provider: "claude",
    model,
    sources: sources.length ? sources : undefined,
    queries: queries.length ? queries : undefined,
  };
}

// ---------------------------------------------------------------- public

export async function callAI(opts: CallOpts): Promise<AiResult> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    if (opts.onOutage === "report") return { ok: false, status: 503, outage: "missing", error: "No AI key is configured." };
    return {
      ok: false,
      status: 500,
      error: "No AI key configured. Add ANTHROPIC_API_KEY as a secret in Cloudflare: Workers & Pages → aethex → Settings → Variables and Secrets.",
    };
  }
  return callClaude(anthropicKey, opts);
}

/** Strip ``` fences and parse the first JSON object/array in a model reply. */
export function parseJsonLoose<T = unknown>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[\[{]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
