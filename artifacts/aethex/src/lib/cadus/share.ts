/**
 * Sharing without a server: an answer or a case is compressed into the link
 * itself (the part after #, which browsers never send to a server), so a
 * colleague opens it in Cadus read-only. Everything is passed through the
 * privacy guard first. Comments on a shared item stay on the device that made
 * them.
 */
import { deidentify } from "./deidentify";

export interface SharedAnswer {
  kind: "answer";
  title: string;
  question: string;
  answer: string;
  sources?: { n: number; url: string; title: string }[];
  reviewed?: boolean;
  /** Who shared it (a first name or role, typed by the sharer; optional). */
  from?: string;
  at: number;
}

export interface SharedCase {
  kind: "case";
  title: string;
  summary: string;
  from?: string;
  at: number;
}

export type Shared = SharedAnswer | SharedCase;

const bytesToUrl = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const urlToBytes = (s: string) => { const t = s.replace(/-/g, "+").replace(/_/g, "/"); const pad = t + "=".repeat((4 - (t.length % 4)) % 4); return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0)); };

async function deflate(text: string): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate-raw");
  const w = cs.writable.getWriter();
  void w.write(new TextEncoder().encode(text));
  void w.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}
async function inflate(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream("deflate-raw");
  const w = ds.writable.getWriter();
  void w.write(new Uint8Array(bytes) as Uint8Array<ArrayBuffer>);
  void w.close();
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
}

/** The privacy guard, applied once more to everything that leaves the device. */
const guard = (t: string) => deidentify(t).text;

/** The item with identifiers hidden in every field that leaves the device: the link, the text file, WhatsApp and email all use this. */
export function guardShared(item: Shared): Shared {
  const from = item.from ? { from: guard(item.from).slice(0, 40) } : {};
  if (item.kind === "answer") {
    return { ...item, title: guard(item.title), question: guard(item.question), answer: guard(item.answer), ...(item.sources ? { sources: item.sources.map((s) => ({ ...s, title: guard(s.title) })) } : {}), ...from };
  }
  return { ...item, title: guard(item.title), summary: guard(item.summary), ...from };
}

/** Encodes a shared item as the fragment of a link (about 1 character per 2–3 of text). */
export async function encodeShare(item: Shared): Promise<string> {
  return `s1.${bytesToUrl(await deflate(JSON.stringify(guardShared(item))))}`;
}

export async function decodeShare(fragment: string): Promise<Shared | null> {
  const m = /^#?s1\.([A-Za-z0-9_-]+)$/.exec(fragment.trim());
  if (!m) return null;
  try {
    const raw = JSON.parse(await inflate(urlToBytes(m[1])));
    if (!raw || typeof raw !== "object") return null;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
    const at = Number.isFinite(raw.at) ? Number(raw.at) : Date.now();
    const from = str(raw.from, 40) || undefined;
    if (raw.kind === "answer") {
      const sources = Array.isArray(raw.sources) ? raw.sources.filter((s: any) => s && typeof s.url === "string" && /^https?:\/\//.test(s.url)).slice(0, 20).map((s: any) => ({ n: Number(s.n) || 0, url: String(s.url).slice(0, 500), title: str(s.title, 200) })) : undefined;
      const answer = str(raw.answer, 40000);
      if (!answer) return null;
      return { kind: "answer", title: str(raw.title, 120) || "Shared answer", question: str(raw.question, 2000), answer, ...(sources?.length ? { sources } : {}), ...(raw.reviewed === true ? { reviewed: true } : {}), ...(from ? { from } : {}), at };
    }
    if (raw.kind === "case") {
      const summary = str(raw.summary, 20000);
      if (!summary) return null;
      return { kind: "case", title: str(raw.title, 120) || "Shared case", summary, ...(from ? { from } : {}), at };
    }
    return null;
  } catch {
    return null;
  }
}

/** The link for a fragment, on the Cadus host when there is one. */
export function shareUrl(fragment: string, origin = window.location.origin, cadusHost = false): string {
  return `${origin}${cadusHost ? "/shared" : "/ai-assistant/shared"}#${fragment}`;
}

/* ------------------------------------------------------------------ comments (kept on this device) */

export interface Comment {
  id: string;
  /** A hash of the shared item, so comments stay with it. */
  key: string;
  by: string;
  text: string;
  at: number;
}

export const COMMENTS_KEY = "cadus3.comments";
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** A short, stable key for a shared item (FNV-1a over its text). */
export function shareKey(item: Shared): string {
  const text = item.kind === "answer" ? item.answer : item.summary;
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

export function readComments(key: string): Comment[] {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
    return (Array.isArray(all) ? all : []).filter((c: any) => c && c.key === key && typeof c.text === "string").map((c: any) => ({ id: String(c.id), key, by: String(c.by || "").slice(0, 40), text: String(c.text).slice(0, 2000), at: Number(c.at) || 0 }));
  } catch { return []; }
}

export function addComment(key: string, by: string, text: string): Comment {
  const c: Comment = { id: uid(), key, by: by.trim().slice(0, 40), text: text.trim().slice(0, 2000), at: Date.now() };
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
    localStorage.setItem(COMMENTS_KEY, JSON.stringify([...(Array.isArray(all) ? all : []), c].slice(-500)));
  } catch { /* full or blocked */ }
  return c;
}

export function removeComment(id: string) {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
    localStorage.setItem(COMMENTS_KEY, JSON.stringify((Array.isArray(all) ? all : []).filter((c: any) => c?.id !== id)));
  } catch { /* blocked */ }
}

/** Shared items as a plain file, for WhatsApp or email when a link is too long. Guarded like the link. */
export function shareAsText(raw: Shared): string {
  const item = guardShared(raw);
  const head = `${item.title}\nShared from Cadus${item.from ? ` by ${item.from}` : ""} on ${new Date(item.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. De-identified. Decision support only: verify before acting.\n\n`;
  if (item.kind === "case") return head + item.summary;
  return head + (item.question ? `Question: ${item.question}\n\n` : "") + item.answer + (item.sources?.length ? `\n\nSources:\n${item.sources.map((s) => `[${s.n}] ${s.title} - ${s.url}`).join("\n")}` : "");
}
