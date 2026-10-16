// Shared helpers for the Cadus Medical Library builder.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function log(...args) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args);
}

/**
 * GET a URL with retries, backoff and an optional on-disk cache (so an
 * interrupted build resumes quickly). Returns { status, text } and never throws
 * for 404, so callers can probe for files.
 */
export async function fetchText(url, { headers = {}, cacheDir, retries = 5, timeoutMs = 60_000, cacheMisses = true, validate } = {}) {
  const key = createHash("sha1").update(url).digest("hex");
  const file = cacheDir ? join(cacheDir, key.slice(0, 2), `${key}.txt`) : "";
  if (file && existsSync(file)) {
    const raw = readFileSync(file, "utf8");
    const nl = raw.indexOf("\n");
    return { status: Number(raw.slice(0, nl)), text: raw.slice(nl + 1), cached: true };
  }
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { headers, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        const wait = Number(res.headers.get("retry-after")) * 1000 || Math.min(60_000, 1500 * 2 ** attempt);
        lastErr = new Error(`HTTP ${res.status}`);
        await sleep(wait);
        continue;
      }
      const text = res.status === 200 ? await res.text() : "";
      const cacheable = res.status === 200 ? !validate || validate(text) : cacheMisses;
      if (file && cacheable) {
        mkdirSync(join(cacheDir, key.slice(0, 2)), { recursive: true });
        writeFileSync(file, `${res.status}\n${text}`);
      }
      return { status: res.status, text, cached: false };
    } catch (e) {
      lastErr = e;
      await sleep(Math.min(60_000, 1500 * 2 ** attempt));
    }
  }
  throw new Error(`GET ${url} failed: ${lastErr?.message ?? lastErr}`);
}

/** Run fn over items with a fixed number of workers, preserving order of results. */
export async function pool(items, concurrency, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Tidy plain text: collapse spaces, drop empty brackets and blank lines. */
export function tidy(text) {
  return String(text ?? "")
    .replace(/\r/g, "")
    .replace(/\(\s*[;,]?\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/[ \t ]+/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^[*\-•]\s*$/.test(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split long text into retrieval chunks of roughly `target` characters,
 * breaking at line ends, then sentence ends.
 */
export function chunkText(text, target = 1100, max = 1600) {
  const t = text.trim();
  if (t.length <= max) return t ? [t] : [];
  const pieces = [];
  for (const line of t.split("\n")) {
    if (line.length <= max) {
      pieces.push(line);
      continue;
    }
    const sentences = line.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [line];
    let buf = "";
    for (const s of sentences) {
      if (buf && (buf + s).length > max) {
        pieces.push(buf.trim());
        buf = "";
      }
      buf += s;
      while (buf.length > max) {
        pieces.push(buf.slice(0, max).trim());
        buf = buf.slice(max);
      }
    }
    if (buf.trim()) pieces.push(buf.trim());
  }
  const chunks = [];
  let cur = "";
  for (const p of pieces) {
    if (cur && cur.length + p.length + 1 > target && cur.length >= target * 0.5) {
      chunks.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n${p}` : p;
    if (cur.length >= max) {
      chunks.push(cur);
      cur = "";
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export function writeGzipJson(file, value) {
  const buf = gzipSync(Buffer.from(JSON.stringify(value)), { level: 9 });
  writeFileSync(file, buf);
  return buf.length;
}

export function parseArgs(argv) {
  const args = {};
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) args[m[1]] = m[2] ?? "true";
  }
  return args;
}
