/**
 * Aethex accounts, on Cloudflare (worker/auth.ts).
 *
 * The Worker keeps the session in an HttpOnly cookie that, on aethex.in, is
 * shared by aethex.in, cadus.aethex.in, auth.aethex.in and login.aethex.in.
 * So signing in once on auth.aethex.in (Cadus) or login.aethex.in (store)
 * signs you in everywhere; each site then asks /api/auth/me who you are.
 *
 * The browser keeps a copy of the account in localStorage ("aethex_user"),
 * with the local-only extras (plan, addresses, wishlist), so pages render at
 * once and offline. The copy is refreshed from the server on every load and
 * removed when the server says the session has ended.
 */
import { isAethexDomain, isAuthHost, isCadusHost, isLoginHost, isMainHost } from "./host";

export type AccountUser = { id: string; email: string; name: string; avatar?: string; createdAt?: number };
export type AuthResult = { ok: true; user: AccountUser } | { ok: false; error: string };

const USER_KEY = "aethex_user";
/** Fired on window whenever the signed-in account changes. */
export const AUTH_EVENT = "aethex-auth";
const LEGACY_KEYS = ["aethex_jwt", "cadus3.authKey", "aethex.firebaseToken", "aethex.handoffState", "aethex-supabase-auth", "aethex.signedOutAt"];

const OFFLINE = "Can't reach Aethex right now. Check your connection and try again.";

async function api(path: string, body?: unknown, method?: string): Promise<{ status: number; data: any }> {
  const r = await fetch(path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    keepalive: path === "/api/auth/logout",
  });
  const isJson = (r.headers.get("content-type") || "").includes("application/json");
  return { status: r.status, data: isJson ? await r.json().catch(() => null) : null };
}

const announce = () => { try { window.dispatchEvent(new Event(AUTH_EVENT)); } catch { /* no window */ } };

/** Whose account the per-person data on this device belongs to. */
const OWNER_KEY = "aethex.deviceOwner";
/** Per-person Cadus data that must not carry over to another account on a shared browser. */
const PERSONAL_KEYS = ["cadus3.profile", "cadus3.onboarded"];

/** Keeps the account in the local copy, with the local-only fields of the same account. */
export function storeAccount(u: AccountUser) {
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner && owner !== u.id) PERSONAL_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(OWNER_KEY, u.id);
  } catch { /* blocked */ }
  let prev: Record<string, unknown> = {};
  try { prev = JSON.parse(localStorage.getItem(USER_KEY) || "null") || {}; } catch { /* none */ }
  const same = prev.id === u.id;
  const next = {
    isPro: false, addresses: [], wishlist: [], cadusDailyCount: 0, cadusLastDate: "",
    ...(same ? prev : {}),
    id: u.id, email: u.email, name: u.name,
    ...(u.avatar ? { avatar: u.avatar } : {}),
  };
  try { localStorage.setItem(USER_KEY, JSON.stringify(next)); } catch { /* blocked */ }
  announce();
}

/** Adds local-only fields (e.g. role, college) to the signed-in account's copy on this device. */
export function patchLocalAccount(fields: Record<string, unknown>) {
  try {
    const cur = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    if (!cur) return;
    localStorage.setItem(USER_KEY, JSON.stringify({ ...cur, ...fields }));
  } catch { /* blocked */ }
  announce();
}

/** Forgets the account on this device. */
export function clearAccount() {
  try { [USER_KEY, ...LEGACY_KEYS].forEach((k) => localStorage.removeItem(k)); } catch { /* blocked */ }
  announce();
}

const result = (r: { status: number; data: any }, fallback: string): AuthResult => {
  if (r.data?.user?.id) {
    storeAccount(r.data.user);
    return { ok: true, user: r.data.user };
  }
  if (r.status === 503) return { ok: false, error: r.data?.error || "Accounts aren't switched on yet. Please try again later." };
  return { ok: false, error: r.data?.error || fallback };
};
const attempt = async (path: string, body: unknown, fallback: string): Promise<AuthResult> => {
  try { return result(await api(path, body), fallback); } catch { return { ok: false, error: OFFLINE }; }
};

/**
 * Starts a sign-up: the server emails a code, and the account exists once the
 * code is entered with verifyEmailCode (so nobody can claim someone else's address).
 */
export async function signUp(name: string, email: string, password: string): Promise<{ ok: true; verify: true } | { ok: false; error: string }> {
  try {
    const r = await api("/api/auth/signup", { name, email, password });
    if (r.status === 200 && r.data?.verify) return { ok: true, verify: true };
    return { ok: false, error: r.data?.error || "The account couldn't be created. Please try again." };
  } catch { return { ok: false, error: OFFLINE }; }
}
export const signIn = (email: string, password: string) => attempt("/api/auth/login", { email, password }, "That didn't work. Please try again.");
export const verifyEmailCode = (email: string, code: string, name?: string) => attempt("/api/auth/email/verify", { email, code, name }, "That code didn't work. Please try again.");
export async function sendEmailCode(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await api("/api/auth/email/send", { email });
    return r.status === 200 ? { ok: true } : { ok: false, error: r.data?.error || "The code couldn't be sent. Please try again." };
  } catch { return { ok: false, error: OFFLINE }; }
}

/** Ends the session on the server (every aethex.in site) and on this device. */
export async function signOut() {
  // End the session on the server first, so no page sees it again, then forget it here.
  try { await Promise.race([api("/api/auth/logout", {}), new Promise((r) => setTimeout(r, 3000))]); } catch { /* offline: still forget it here */ }
  clearAccount();
}

/** The address that starts Google sign-in; Google returns to `returnTo`. */
export function googleSignInHref(returnTo: string): string {
  return `/api/auth/google?return=${encodeURIComponent(returnTo)}&from=${encodeURIComponent(window.location.href)}`;
}

/** A message for ?auth_error= after a failed Google sign-in, or "". */
export function authErrorMessage(): string {
  let code = "";
  try { code = new URLSearchParams(window.location.search).get("auth_error") || ""; } catch { /* none */ }
  return ({
    "google-not-set-up": "Google sign-in isn't switched on yet. Use your email instead.",
    "google-cancelled": "Google sign-in was cancelled.",
    "google-expired": "That Google sign-in took too long. Please try again.",
    "google-failed": "Google sign-in didn't work. Please try again, or use your email.",
    "google-other-account": "This email is already linked to a different Google account. Sign in with that one, or use your email.",
    "google-busy": "Too many sign-in attempts from this network. Please wait a few minutes.",
  } as Record<string, string>)[code] || "";
}

/** A path on this site: one leading slash, no scheme or host. */
export const safePath = (p: string | null | undefined): string => (p && /^\/(?![/\\])/.test(p) ? p : "/");
const nextParam = () => { try { return safePath(new URLSearchParams(window.location.search).get("next")); } catch { return "/"; } };

/**
 * Where a sign-in page sends people once signed in: from auth.aethex.in to
 * Cadus, from login.aethex.in to aethex.in, or null on other hosts (the page
 * stays on this site).
 */
export function signedInDestination(path = nextParam()): string | null {
  if (isAuthHost()) return `https://cadus.aethex.in${safePath(path)}`;
  if (isLoginHost()) return `https://aethex.in${safePath(path)}`;
  return null;
}

/** Asks the server who is signed in and updates the local copy. */
export async function refreshAccount(): Promise<void> {
  let r: { status: number; data: any };
  try { r = await api("/api/auth/me"); } catch { return; } // offline: keep the copy
  if (r.status === 200 && r.data?.user?.id) storeAccount(r.data.user);
  else if (r.status === 401 && r.data) { if (localStorage.getItem(USER_KEY)) clearAccount(); }
  // anything else (no Worker, 404, 503): leave the copy as it is
}

/**
 * Runs first in main.tsx. Sends the old sign-in addresses to the sign-in
 * subdomains (returns "leaving"), then checks the session: when this device
 * has no copy of the account yet (just signed in on another subdomain) the
 * app waits for the answer, briefly, so it opens signed in.
 */
export function bootAccount(): { leaving: boolean; ready: Promise<void> } {
  if (typeof window === "undefined") return { leaving: false, ready: Promise.resolve() };
  try { LEGACY_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* blocked */ }
  if (isAethexDomain()) {
    const q = new URLSearchParams(window.location.search);
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const next = encodeURIComponent(safePath(q.get("next")));
    const go = (to: string) => { window.location.replace(to); return { leaving: true, ready: Promise.resolve() }; };
    if (isCadusHost() && (path === "/sign-in" || path === "/login")) return go(`https://auth.aethex.in/?next=${next}`);
    if (isMainHost() && path === "/ai-assistant/sign-in") return go(`https://auth.aethex.in/?next=${next}`);
    if (isMainHost() && path === "/login") return go(`https://login.aethex.in/?next=${next}`);
    if (isMainHost() && path === "/signup") return go(`https://login.aethex.in/signup?next=${next}`);
  }
  const check = refreshAccount();
  let cached = false;
  try { cached = !!localStorage.getItem(USER_KEY); } catch { /* blocked */ }
  return { leaving: false, ready: cached ? Promise.resolve() : Promise.race([check, new Promise<void>((r) => setTimeout(r, 4000))]) };
}
