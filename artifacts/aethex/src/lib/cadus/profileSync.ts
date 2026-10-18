/**
 * Keeps the Cadus profile with the account on Cloudflare (GET/PUT /api/profile,
 * worker/auth.ts), so the next sign-in on any device finds it. The account is
 * the session cookie; nothing else is sent.
 */
import type { MedicalProfile } from "./profile";

export type SyncResult = { ok: true; profile: MedicalProfile | null } | { ok: false; reason: "no-credential" | "not-set-up" | "unauthorised" | "offline" | "error"; message: string };

const call = async (method: "GET" | "PUT" | "DELETE", body?: unknown): Promise<SyncResult> => {
  try {
    const r = await fetch("/api/profile", { method, credentials: "same-origin", headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    const isJson = (r.headers.get("content-type") || "").includes("application/json");
    if (r.status === 503) return { ok: false, reason: "not-set-up", message: "Accounts aren't switched on yet; your profile is kept on this device" };
    if (r.status === 401 || r.status === 403) return { ok: false, reason: "unauthorised", message: "Sign in again to save your profile to your account" };
    if (!r.ok || !isJson) return { ok: false, reason: "error", message: `Profile store error (${r.status})` };
    const d = (await r.json()) as { profile?: MedicalProfile | null };
    return { ok: true, profile: d.profile ?? null };
  } catch {
    return { ok: false, reason: "offline", message: "Offline; your profile is kept on this device and will be saved later" };
  }
};

/** The profile saved on the server for this account, if any. */
export const fetchRemoteProfile = () => call("GET");
/** Saves the profile on the server for this account. */
export const pushRemoteProfile = (profile: MedicalProfile) => call("PUT", { profile });
/** Removes it from the server. */
export const deleteRemoteProfile = () => call("DELETE");
