/**
 * Streaming answers from the Cadus endpoint (server-sent events), so text
 * appears as it is written, like ChatGPT and Claude. The server sends:
 *   start · delta {t} · reset (discard the text so far) · done {...} · error {error}
 * If streaming isn't available (no Worker, or an older server), callers fall
 * back to the normal request.
 */

export interface StreamDone {
  message?: string;
  provider?: string;
  model?: string;
  sources?: unknown[];
  queries?: string[];
  searched?: boolean;
  libraryMode?: boolean;
  reason?: string;
}

/** Thrown when the endpoint can't stream at all, so the caller should use the normal request. */
export class StreamUnavailable extends Error {
  constructor(why: string) {
    super(`Streaming unavailable: ${why}`);
    this.name = "StreamUnavailable";
  }
}

/** An incremental parser for server-sent events. Feed it text as it arrives. */
export function createSseParser(onEvent: (event: string, data: any) => void): (chunk: string) => void {
  let buf = "";
  return (chunk: string) => {
    buf += chunk.replace(/\r\n/g, "\n");
    let cut: number;
    while ((cut = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, cut);
      buf = buf.slice(cut + 2);
      let event = "message";
      const data: string[] = [];
      for (const line of raw.split("\n")) {
        if (!line || line.startsWith(":")) continue;
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
      }
      if (!data.length) continue;
      try {
        onEvent(event, JSON.parse(data.join("\n")));
      } catch { /* not JSON: ignore */ }
    }
  };
}

export async function streamCadus(
  body: Record<string, unknown>,
  handlers: { onDelta: (text: string) => void; onReset?: () => void; signal?: AbortSignal },
  url = "/api/fn/cadus",
): Promise<StreamDone> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, stream: true }),
      signal: handlers.signal,
    });
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") throw e;
    throw new StreamUnavailable("network");
  }
  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    // Answered without streaming: an error, or a server that doesn't stream yet.
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return (data ?? {}) as StreamDone;
  }
  if (!res.ok || !type.includes("text/event-stream") || !res.body) throw new StreamUnavailable(`status ${res.status} ${type}`);

  let done: StreamDone | null = null;
  let error = "";
  const feed = createSseParser((event, data) => {
    if (event === "delta" && typeof data?.t === "string") handlers.onDelta(data.t);
    else if (event === "reset") handlers.onReset?.();
    else if (event === "done") done = (data ?? {}) as StreamDone;
    else if (event === "error") error = String(data?.error || "Something went wrong. Please try again.");
  });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    feed(dec.decode(value, { stream: true }));
  }
  feed("\n\n");
  if (error) throw new Error(error);
  if (!done) throw new Error("The answer was cut off. Please try again.");
  return done;
}

/**
 * Markdown cut off mid-stream, made safe to show: an unfinished code block is
 * closed, and on the last line trailing asterisks are dropped and an unclosed
 * bold or inline code is closed, so half-written answers don't flash raw markup.
 */
export function closePartialMarkdown(md: string): string {
  if (((md.match(/^\s*```/gm) || []).length) % 2 === 1) return `${md}\n\`\`\``;
  const cut = md.lastIndexOf("\n") + 1;
  const head = md.slice(0, cut);
  let line = md.slice(cut).replace(/\*+$/, "");
  if (((line.match(/\*\*/g) || []).length) % 2 === 1) line += "**";
  if (((line.match(/`/g) || []).length) % 2 === 1) line += "`";
  return head + line;
}

/**
 * A tiny store for the answer being streamed, so only the streaming bubble
 * re-renders on each piece of text (not the whole workspace).
 */
export function createTextStore() {
  let text = "";
  const listeners = new Set<() => void>();
  let frame = 0;
  const notify = () => {
    frame = 0;
    listeners.forEach((l) => l());
  };
  return {
    get: () => text,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    append(t: string) {
      text += t;
      // At most one update per animation frame.
      if (!frame) frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame(notify) : (setTimeout(notify, 16) as unknown as number);
    },
    set(t: string) {
      text = t;
      if (!frame) frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame(notify) : (setTimeout(notify, 16) as unknown as number);
    },
  };
}
