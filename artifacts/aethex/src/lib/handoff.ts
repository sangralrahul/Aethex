/**
 * Carrying a sign-in from the sign-in subdomains to the apps.
 *
 *   cadus.aethex.in  signs in at  auth.aethex.in
 *   aethex.in        signs in at  login.aethex.in
 *
 * Every subdomain has its own browser storage, so after a sign-in the session
 * is handed back once, in the URL fragment (never sent to a server):
 *
 * 1. The app makes a random state, keeps it, and opens the sign-in page with
 *    ?state=…&next=/path  (startSignIn).
 * 2. The sign-in page keeps the request (it survives the Google round trip),
 *    signs the person in, and returns to  <app><next>#aethex-handoff=<payload>
 *    carrying the account, the Supabase session or Firebase ID token and the
 *    profile-store key, with the state (completeSignIn). It then forgets the
 *    session itself, so the app holds the only copy.
 * 3. The app reads the fragment before React starts, removes it from the
 *    address bar, and accepts it only if the state matches the one it made
 *    in step 1 and it is less than ten minutes old (consumeHandoff).
 *
 * A sign-in page reached without a request (someone typed login.aethex.in)
 * signs in, then sends the person to the app with ?aethex-signin=1, which
 * starts step 1 and comes straight back, already signed in, for the hand-off.
 *
 * On any other address (localhost, workers.dev) none of this runs: sign-in is
 * on the same site.
 */
import { isAethexDomain, isAuthHost, isCadusHost, isLoginHost, isMainHost } from "./host";

const STATE_KEY = "aethex.handoffState";
const REQUEST_KEY = "aethex.handoffRequest";
export const FB_TOKEN_KEY = "aethex.firebaseToken";
const PREFIX = "#aethex-handoff=";
const MAX_AGE = 10 * 60 * 1000;

export type Target = "cadus" | "main";
type Payload = {
  v: 1;
  state: string;
  at: number;
  user: unknown;
  jwt?: string;
  authKey?: string;
  sb?: { access_token: string; refresh_token: string };
  fb?: { token: string; exp: number };
};

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* blocked */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* blocked */ } },
};

/** A path on this site: one leading slash, no scheme or host. */
export const safePath = (p: string | null | undefined): string => (p && /^\/(?![/\\])/.test(p) ? p : "/");

const origin = (t: Target) => (t === "cadus" ? "https://cadus.aethex.in" : "https://aethex.in");
const signInOrigin = (t: Target) => (t === "cadus" ? "https://auth.aethex.in" : "https://login.aethex.in");

const randomState = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");

const b64 = {
  encode: (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  decode: (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))),
};

/** True on the subdomains that sign people in and hand them back. */
export const onSignInHost = () => isAuthHost() || isLoginHost();
/** True where hand-offs are used at all. */
export const handoffEnabled = () => typeof window !== "undefined" && isAethexDomain();

/** Step 1, in the app: open the sign-in page with a fresh state. */
export function startSignIn(next = "/", page = "/") {
  const target: Target = isCadusHost() ? "cadus" : "main";
  const state = randomState();
  ls.set(STATE_KEY, JSON.stringify({ state, at: Date.now() }));
  const url = new URL(`${signInOrigin(target)}${page === "/signup" ? "/signup" : "/"}`);
  url.searchParams.set("state", state);
  url.searchParams.set("next", safePath(next));
  window.location.replace(url.toString());
}

/** The app's sign-in link: a same-site address that starts step 1 when followed. */
export const signInLink = (next = "/") => `/?aethex-signin=1&next=${encodeURIComponent(safePath(next))}`;

/** On the sign-in page: keep the app's request (it must survive the Google round trip). */
export function rememberRequest() {
  try {
    const q = new URLSearchParams(window.location.search);
    const state = q.get("state");
    if (state && /^[a-f0-9]{32}$/.test(state)) sessionStorage.setItem(REQUEST_KEY, JSON.stringify({ state, next: safePath(q.get("next")), at: Date.now() }));
  } catch { /* blocked */ }
}
function pendingRequest(): { state: string; next: string } | null {
  try {
    const r = JSON.parse(sessionStorage.getItem(REQUEST_KEY) || "null");
    if (r && typeof r.state === "string" && Date.now() - r.at < MAX_AGE) return { state: r.state, next: safePath(r.next) };
  } catch { /* none */ }
  return null;
}

/** Forget this site's copy of the session without revoking it (the app now holds it). */
async function forgetLocalSession() {
  ["aethex_user", "aethex_jwt", "cadus3.authKey", FB_TOKEN_KEY].forEach(ls.del);
  try { Object.keys(localStorage).filter((k) => k === "aethex-supabase-auth" || /^sb-.*-auth-token$/.test(k)).forEach(ls.del); } catch { /* blocked */ }
  try { const { auth } = await import("@/lib/firebase"); if (auth.currentUser) await auth.signOut(); } catch { /* not configured */ }
}

async function buildPayload(state: string): Promise<string> {
  const p: Payload = { v: 1, state, at: Date.now(), user: JSON.parse(ls.get("aethex_user") || "null") };
  const jwt = ls.get("aethex_jwt"); if (jwt) p.jwt = jwt;
  const key = ls.get("cadus3.authKey"); if (key) p.authKey = key;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    if (data.session) p.sb = { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
  } catch { /* not configured */ }
  try {
    const { auth } = await import("@/lib/firebase");
    const u = auth.currentUser;
    if (u) { const r = await u.getIdTokenResult(); p.fb = { token: r.token, exp: Date.parse(r.expirationTime) }; }
  } catch { /* not configured */ }
  return b64.encode(JSON.stringify(p));
}

/** Step 2, on the sign-in page once signed in: go back to the app with the session. */
let leaving = false;
/** `forceNext` overrides where the app asked to return (a new store account goes to onboarding). */
export async function completeSignIn(target: Target, fallbackNext = "/", forceNext?: string) {
  if (leaving) return; // the first caller (e.g. sign-up going to onboarding) wins
  leaving = true;
  const req = pendingRequest();
  if (!req) {
    // Reached directly: let the app make a state, then come back for the hand-off.
    window.location.href = `${origin(target)}${signInLink(forceNext ?? fallbackNext)}`;
    return;
  }
  const payload = await buildPayload(req.state);
  try { sessionStorage.removeItem(REQUEST_KEY); } catch { /* blocked */ }
  await forgetLocalSession();
  window.location.href = `${origin(target)}${forceNext ? safePath(forceNext) : req.next}${PREFIX}${payload}`;
}

let ready: Promise<void> = Promise.resolve();
/** Resolves once a handed-off Supabase session is in place. */
export const handoffReady = () => ready;

/** Step 3, in the app before React starts. Returns true when a sign-in was accepted. */
export function consumeHandoff(): boolean {
  if (typeof window === "undefined" || !window.location.hash.startsWith(PREFIX)) return false;
  const raw = window.location.hash.slice(PREFIX.length);
  history.replaceState(history.state, "", window.location.pathname + window.location.search);
  let want: { state?: string; at?: number } = {};
  try { want = JSON.parse(ls.get(STATE_KEY) || "{}"); } catch { /* none */ }
  ls.del(STATE_KEY);
  let p: Payload;
  try { p = JSON.parse(b64.decode(raw)); } catch { return false; }
  if (!p || p.v !== 1 || !want.state || p.state !== want.state || !want.at || Date.now() - want.at > MAX_AGE || Date.now() - p.at > MAX_AGE) return false;
  if (!p.user || typeof p.user !== "object") return false;
  ls.set("aethex_user", JSON.stringify(p.user));
  if (p.jwt) ls.set("aethex_jwt", p.jwt);
  if (p.authKey && p.authKey.startsWith("pk1.")) ls.set("cadus3.authKey", p.authKey); else ls.del("cadus3.authKey");
  if (p.fb?.token && p.fb.exp > Date.now()) ls.set(FB_TOKEN_KEY, JSON.stringify(p.fb)); else ls.del(FB_TOKEN_KEY);
  try { sessionStorage.removeItem("signedOut"); } catch { /* blocked */ }
  if (p.sb?.access_token && p.sb.refresh_token) {
    const sb = p.sb;
    ready = import("@/integrations/supabase/client").then(({ supabase }) => supabase.auth.setSession(sb)).then(() => undefined, () => undefined);
  }
  return true;
}

/**
 * Runs first in main.tsx. Returns true when the page is navigating away
 * (starting a sign-in), so the app need not render.
 */
export function bootHandoff(): boolean {
  if (!handoffEnabled()) return false;
  if (onSignInHost()) { rememberRequest(); return false; }
  consumeHandoff();
  const q = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (q.get("aethex-signin") === "1") { startSignIn(q.get("next") || "/"); return true; }
  // The old same-site sign-in addresses now go to the sign-in subdomain.
  if (isCadusHost() && (path === "/sign-in" || path === "/login")) { startSignIn(q.get("next") || "/"); return true; }
  if (isMainHost() && (path === "/login" || path === "/signup")) { startSignIn(q.get("next") || "/", path); return true; }
  if (isMainHost() && path === "/ai-assistant/sign-in") { window.location.replace(`https://cadus.aethex.in${signInLink(q.get("next") || "/")}`); return true; }
  return false;
}
