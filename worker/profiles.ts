// Cadus profiles on Cloudflare KV: GET and PUT /api/profile.
//
// The caller proves who they are with the sign-in they used:
//   Authorization: Bearer <token>   and   X-Cadus-Auth: supabase | firebase | password
//   supabase  the Supabase access token (email code or Google sign-in); checked
//             against the Supabase auth API, so no JWT secret is needed here.
//   firebase  the Firebase ID token (phone sign-in); checked against Google's
//             Identity Toolkit with the public web API key.
//   password  accounts that exist only on the device: the token is a key the
//             app derives from the email and password (SHA-256); the first save
//             fixes the key's hash on the record, later calls must match it.
// Records live under u:<provider>:<id>, at most 24 KB, and hold only what the
// profile form collects. Nothing clinical is stored here.

export interface ProfileEnv {
  CADUS_PROFILES?: { get: (k: string, type: "json") => Promise<any>; put: (k: string, v: string, o?: { metadata?: unknown }) => Promise<void>; delete: (k: string) => Promise<void> };
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  FIREBASE_API_KEY?: string;
}

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store, private" } });

const sha256 = async (s: string) => {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
};

const PROFILE_FIELDS = ["fullName", "role", "year", "exam", "examDate", "specialty", "institution", "city", "state", "registration", "council", "declared", "phone", "languagePref", "completedAt"] as const;

/** Keeps only the known fields, as short strings (booleans for declared, number for completedAt). */
export function cleanProfile(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of PROFILE_FIELDS) {
    const v = r[k];
    if (k === "declared") { if (v === true) out[k] = true; continue; }
    if (k === "completedAt") { if (Number.isFinite(v)) out[k] = Number(v); continue; }
    if (typeof v === "string" && v.trim()) out[k] = v.replace(/[\r\n]+/g, " ").trim().slice(0, k === "institution" ? 160 : 80);
  }
  return typeof out.role === "string" ? out : null;
}

type Identity = { provider: "supabase" | "firebase" | "password"; id: string; email?: string; keyHash?: string };

async function identify(request: Request, env: ProfileEnv): Promise<Identity | { error: string; status: number }> {
  const auth = request.headers.get("authorization") || "";
  const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim();
  const provider = (request.headers.get("x-cadus-auth") || "").toLowerCase();
  if (!token || token.length > 4096) return { error: "Sign in first", status: 401 };
  if (provider === "supabase") {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return { error: "Supabase is not configured on the server", status: 503 };
    const r = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, { headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` } });
    if (!r.ok) return { error: "Your sign-in has expired; sign in again", status: 401 };
    const u = (await r.json()) as { id?: string; email?: string };
    if (!u.id) return { error: "Your sign-in has expired; sign in again", status: 401 };
    return { provider: "supabase", id: u.id, email: u.email };
  }
  if (provider === "firebase") {
    if (!env.FIREBASE_API_KEY) return { error: "Firebase is not configured on the server", status: 503 };
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token }) });
    if (!r.ok) return { error: "Your sign-in has expired; sign in again", status: 401 };
    const d = (await r.json()) as { users?: { localId?: string; email?: string; phoneNumber?: string }[] };
    const u = d.users?.[0];
    if (!u?.localId) return { error: "Your sign-in has expired; sign in again", status: 401 };
    return { provider: "firebase", id: u.localId, email: u.email || u.phoneNumber };
  }
  if (provider === "password") {
    // pk1.<email>.<hex key>: the key proves the password; the email names the record.
    const m = /^pk1\.([^.\s]+@[^.\s]+\.[^.\s]+(?:\.[^.\s]+)*)\.([a-f0-9]{64})$/i.exec(token);
    if (!m) return { error: "Sign in first", status: 401 };
    const email = m[1].toLowerCase();
    return { provider: "password", id: email, email, keyHash: await sha256(m[2]) };
  }
  return { error: "Unknown sign-in method", status: 401 };
}

export async function handleProfile(request: Request, env: ProfileEnv): Promise<Response> {
  if (!env.CADUS_PROFILES) return json({ error: "Profiles are not set up on the server yet (CADUS_PROFILES KV binding)" }, 503);
  if (request.method !== "GET" && request.method !== "PUT" && request.method !== "DELETE") return json({ error: "Use GET, PUT or DELETE" }, 405);
  const who = await identify(request, env);
  if ("error" in who) return json({ error: who.error }, who.status);
  const key = `u:${who.provider}:${who.id}`;
  const existing = (await env.CADUS_PROFILES.get(key, "json")) as { keyHash?: string; profile?: Record<string, unknown>; updatedAt?: number } | null;
  if (who.provider === "password" && existing?.keyHash && existing.keyHash !== who.keyHash) return json({ error: "Incorrect password for this account" }, 403);

  if (request.method === "GET") {
    return json({ profile: existing?.profile ?? null, updatedAt: existing?.updatedAt ?? null });
  }
  if (request.method === "DELETE") {
    await env.CADUS_PROFILES.delete(key);
    return json({ ok: true });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Send JSON" }, 400); }
  const profile = cleanProfile((body as { profile?: unknown })?.profile);
  if (!profile) return json({ error: "A profile with a role is required" }, 400);
  const record = { profile, updatedAt: Date.now(), email: who.email, ...(who.provider === "password" ? { keyHash: who.keyHash } : {}) };
  const text = JSON.stringify(record);
  if (text.length > 24_000) return json({ error: "Profile too large" }, 413);
  await env.CADUS_PROFILES.put(key, text);
  return json({ ok: true, updatedAt: record.updatedAt });
}
