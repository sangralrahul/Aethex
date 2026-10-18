/**
 * Keeps the sign-in profile on Cloudflare (GET/PUT /api/profile), so the next
 * sign-in on any device finds it. The call carries the credential of the
 * sign-in in use: a Supabase session, a Firebase ID token, or, for accounts
 * that exist only on the device, a key derived from the email and password.
 */
import type { MedicalProfile } from "./profile";
import { FB_TOKEN_KEY, handoffReady } from "@/lib/handoff";

export const AUTH_KEY_KEY = "cadus3.authKey";

/** The key for a password account: pk1.<email>.<sha256(email:password)>. Stored at sign-in, cleared at sign-out. */
export async function passwordKey(email: string, password: string): Promise<string> {
  const e = email.trim().toLowerCase();
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${e}:${password}`));
  return `pk1.${e}.${Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
export function rememberPasswordKey(key: string | null) {
  try { if (key) localStorage.setItem(AUTH_KEY_KEY, key); else localStorage.removeItem(AUTH_KEY_KEY); } catch { /* blocked */ }
}

export type Credential = { provider: "supabase" | "firebase" | "password"; token: string };

/** The credential of the current sign-in, or null when there is none. */
export async function credential(): Promise<Credential | null> {
  await handoffReady();
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return { provider: "supabase", token: data.session.access_token };
  } catch { /* not configured */ }
  try {
    const { auth } = await import("@/lib/firebase");
    const u = auth.currentUser;
    if (u) return { provider: "firebase", token: await u.getIdToken() };
  } catch { /* not configured */ }
  try {
    // A phone sign-in handed over from auth.aethex.in: its ID token, while it lasts.
    const fb = JSON.parse(localStorage.getItem(FB_TOKEN_KEY) || "null") as { token?: string; exp?: number } | null;
    if (fb?.token && (fb.exp ?? 0) > Date.now() + 60_000) return { provider: "firebase", token: fb.token };
  } catch { /* none */ }
  try {
    const k = localStorage.getItem(AUTH_KEY_KEY);
    if (k && k.startsWith("pk1.")) return { provider: "password", token: k };
  } catch { /* blocked */ }
  return null;
}

export type SyncResult = { ok: true; profile: MedicalProfile | null } | { ok: false; reason: "no-credential" | "not-set-up" | "unauthorised" | "offline" | "error"; message: string };

const call = async (method: "GET" | "PUT" | "DELETE", body?: unknown): Promise<SyncResult> => {
  const cred = await credential();
  if (!cred) return { ok: false, reason: "no-credential", message: "No sign-in credential for the profile store" };
  try {
    const r = await fetch("/api/profile", { method, headers: { authorization: `Bearer ${cred.token}`, "x-cadus-auth": cred.provider, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 503) return { ok: false, reason: "not-set-up", message: "The profile store isn't switched on yet; your profile is kept on this device" };
    if (r.status === 401 || r.status === 403) return { ok: false, reason: "unauthorised", message: "Sign in again to sync your profile" };
    if (!r.ok) return { ok: false, reason: "error", message: `Profile store error (${r.status})` };
    const d = (await r.json()) as { profile?: MedicalProfile | null };
    return { ok: true, profile: d.profile ?? null };
  } catch {
    return { ok: false, reason: "offline", message: "Offline; your profile is kept on this device and will sync later" };
  }
};

/** The profile saved on the server for this account, if any. */
export const fetchRemoteProfile = () => call("GET");
/** Saves the profile on the server for this account. */
export const pushRemoteProfile = (profile: MedicalProfile) => call("PUT", { profile });
/** Removes it from the server. */
export const deleteRemoteProfile = () => call("DELETE");
