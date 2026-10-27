// Cadus without an account (update 49): anyone can chat, like ChatGPT, but only plain text chat in
// the general mode, a few messages a day. Images and files, Crew assistants, tools, Deep Dive and
// every other AI function need a free account. The page enforces the same rules; this is the real
// check, because the API spends AI credits.
//
// Optional variables: CADUS_GUEST_DAILY (messages a day per guest browser, default 5) and
// CADUS_GUEST_IP_DAILY (per network address, default 40: colleges and hospitals share one address).
import { allow, clientIp, currentUser, type AuthEnv, type D1Like } from "./auth";

const GUEST_COOKIE = "cadus_guest";
/** What a guest chat may ask for: the answer, and the small calls the chat page makes around it. */
const GUEST_ACTIONS = new Set(["chat", "title", "followups", "review"]);

const json = (payload: unknown, status: number) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
const signIn = (what: string, status = 401) => json({ error: `Sign in to ${what}. It's free, and Cadus keeps working without one for simple chat.`, code: "sign_in" }, status);
const num = (v: unknown, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d; };
const onAethex = (host: string) => host === "aethex.in" || host.endsWith(".aethex.in");

function guestCookie(url: URL, id: string) {
  const domain = onAethex(url.hostname) ? "; Domain=aethex.in" : "";
  const secure = url.protocol === "https:" || onAethex(url.hostname) ? "; Secure" : "";
  return `${GUEST_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${400 * 86400}${domain}${secure}`;
}
const readGuest = (request: Request) => /(?:^|;\s*)cadus_guest=([A-Za-z0-9_-]{16,64})/.exec(request.headers.get("cookie") || "")?.[1] ?? null;
const newId = () => { const b = new Uint8Array(16); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };

export interface GuestResult { request: Request; setCookie?: string; response?: Response; guest: boolean }

/** Lets signed-in requests through untouched; checks and trims guest requests, or answers them with "sign in". */
export async function guestGate(request: Request, env: AuthEnv & Record<string, unknown>, fn: string): Promise<GuestResult> {
  if (!env.DB || request.method !== "POST") return { request, guest: false };
  const user = await currentUser(request, env).catch(() => null);
  if (user) return { request, guest: false };
  const db = env as AuthEnv & { DB: D1Like };
  if (fn !== "cadus") return { request, guest: true, response: signIn("use this tool") };
  let body: Record<string, unknown>;
  try { body = JSON.parse(await request.text() || "{}"); } catch { return { request, guest: true, response: json({ error: "Bad request" }, 400) }; }
  if (!body || typeof body !== "object" || Array.isArray(body)) return { request, guest: true, response: json({ error: "Bad request" }, 400) };
  const action = String(body.action || "chat");
  if (!GUEST_ACTIONS.has(action)) return { request, guest: true, response: signIn("use this feature") };
  if (action === "chat") {
    if ((Array.isArray(body.files) && body.files.length) || (typeof body.image === "string" && body.image)) return { request, guest: true, response: signIn("upload images and files") };
    if (body.crew) return { request, guest: true, response: signIn("chat with Cadus Crew assistants") };
    if (body.mode && body.mode !== "general") return { request, guest: true, response: signIn("use specialist modes") };
    if (String(body.message || "").length > 2000) return { request, guest: true, response: signIn("send longer messages", 413) };
  }
  const url = new URL(request.url);
  let id = readGuest(request);
  let setCookie: string | undefined;
  if (!id) { id = newId(); setCookie = guestCookie(url, id); }
  const day = 86400_000;
  if (action === "chat") {
    const perGuest = num(env.CADUS_GUEST_DAILY, 5);
    const perIp = num(env.CADUS_GUEST_IP_DAILY, 40);
    const ok = await allow(db, `guest:id:${id}`, perGuest, day).catch(() => true) && await allow(db, `guest:ip:${clientIp(request)}`, perIp, day).catch(() => true);
    if (!ok) {
      const res = json({ error: `Sign in to keep chatting today. Without an account Cadus answers ${perGuest} messages a day; a free account gets many more, plus images, tools and Cadus Crew.`, code: "guest_limit" }, 429);
      if (setCookie) res.headers.append("set-cookie", setCookie);
      return { request, guest: true, response: res, setCookie };
    }
  } else if (!(await allow(db, `guest:aux:${clientIp(request)}`, 300, day).catch(() => true))) {
    return { request, guest: true, response: json({ error: "Too many requests. Please try again later.", code: "guest_limit" }, 429) };
  }
  // Guests get the standard answer: no live search, no model choice, no personal context, a short history.
  const history = Array.isArray(body.history) ? body.history.slice(-8).map((m: unknown) => (m && typeof m === "object" ? { ...(m as Record<string, unknown>), content: String((m as { content?: unknown }).content ?? "").slice(0, 4000) } : m)) : [];
  const clean = { ...body, history, search: false, model: undefined, crew: undefined, files: undefined, image: undefined, personal: undefined, institution: undefined };
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return { request: new Request(request.url, { method: "POST", headers, body: JSON.stringify(clean) }), setCookie, guest: true };
}

/** Voice typing (Workers AI) is for accounts only. */
export async function requireAccount(request: Request, env: AuthEnv): Promise<Response | null> {
  if (!env.DB || request.method !== "POST") return null;
  const user = await currentUser(request, env).catch(() => null);
  return user ? null : signIn("use voice typing");
}
