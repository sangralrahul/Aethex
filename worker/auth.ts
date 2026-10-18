// Aethex accounts, entirely on Cloudflare: D1 holds the accounts, sessions,
// Cadus profiles and store carts; the Worker signs people in.
//
//   POST /api/auth/signup        {name, email, password}  emails a code; the account
//                                exists once the code is entered (proves the address)
//   POST /api/auth/login         {email, password}
//   POST /api/auth/email/send    {email}              six-digit code by email (Brevo)
//   POST /api/auth/email/verify  {email, code, name?} signs in, or finishes a sign-up
//   GET  /api/auth/google?return=<url>&from=<url>     Google sign-in (OAuth code flow)
//   GET  /api/auth/google/callback
//   GET  /api/auth/me            the signed-in account, or 401
//   POST /api/auth/logout        ?all=1 ends every session of the account
//   GET|PUT|DELETE /api/profile  the Cadus profile of the signed-in account
//   PUT|DELETE /api/cart         the store cart, for the reminder email
//   scheduled()                  hourly: cart reminders and clean-up
//
// The session is an HttpOnly cookie. On aethex.in it is set for the whole
// domain, so aethex.in, cadus.aethex.in, auth.aethex.in and login.aethex.in
// all share one sign-in. Only the cookie token's SHA-256 is stored.
//
// Settings (Workers & Pages > aethex > Settings > Variables and Secrets):
//   DB                   D1 binding (wrangler.jsonc "d1_databases")
//   GOOGLE_CLIENT_ID     Google OAuth client (variable)
//   GOOGLE_CLIENT_SECRET Google OAuth client secret (secret)
//   BREVO_API_KEY        Brevo API key for the code and cart emails (secret)
//   BREVO_FROM_EMAIL     sender address, default noreply@aethex.in (variable)

export interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): D1Stmt } & D1Stmt;
}
interface D1Stmt {
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface AuthEnv {
  DB?: D1Like;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BREVO_API_KEY?: string;
  BREVO_FROM_EMAIL?: string;
}

type UserRow = { id: string; email: string; name: string; password_hash: string | null; google_sub: string | null; avatar: string | null; created_at: number };

const COOKIE = "aethex_sid";
const SESSION_DAYS = 60;
const PBKDF2_ITERATIONS = 100_000; // the most Workers allows
const CODE_MINUTES = 10;

const json = (payload: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store, private", ...headers } });

const enc = new TextEncoder();
const hex = (b: ArrayBuffer | Uint8Array) => Array.from(b instanceof Uint8Array ? b : new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));
export const sha256 = async (s: string) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));

/** Constant-time comparison of two strings. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function hashPassword(password: string, salt = random(16), iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return `pbkdf2$${iterations}$${b64u(salt)}$${b64u(new Uint8Array(bits))}`;
}
export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [kind, iter, salt, hash] = stored.split("$");
  if (kind !== "pbkdf2" || !iter || !salt || !hash) return false;
  const again = await hashPassword(password, fromB64u(salt), Number(iter));
  return same(again.split("$")[3], hash);
}

export const normEmail = (e: unknown) => (typeof e === "string" ? e.trim().toLowerCase() : "");
const validEmail = (e: string) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const cleanName = (n: unknown, email: string) => {
  const s = typeof n === "string" ? n.replace(/[\r\n<>]+/g, " ").trim().slice(0, 80) : "";
  if (s.length >= 2) return s;
  const local = email.split("@")[0] || "Doctor";
  return local.charAt(0).toUpperCase() + local.slice(1, 40);
};
const publicUser = (u: UserRow) => ({ id: u.id, email: u.email, name: u.name, avatar: u.avatar || undefined, createdAt: u.created_at });

/* ------------------------------------------------------------------ cookies and sessions */

const onAethex = (host: string) => host === "aethex.in" || host.endsWith(".aethex.in");
function sessionCookie(url: URL, token: string, maxAge: number) {
  const domain = onAethex(url.hostname) ? "; Domain=aethex.in" : "";
  const secure = url.protocol === "https:" || onAethex(url.hostname) ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${domain}${secure}`;
}
const readCookie = (request: Request) => {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{20,100})`).exec(request.headers.get("cookie") || "");
  return m ? m[1] : null;
};

async function startSession(env: AuthEnv & { DB: D1Like }, url: URL, userId: string): Promise<string> {
  const token = b64u(random(32));
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").bind(await sha256(token), userId, now, now + SESSION_DAYS * 86400_000).run();
  await env.DB.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(now, userId).run();
  return sessionCookie(url, token, SESSION_DAYS * 86400);
}

/** The signed-in account of this request, if any. */
export async function currentUser(request: Request, env: AuthEnv): Promise<UserRow | null> {
  const token = readCookie(request);
  if (!token || !env.DB) return null;
  const row = await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?").bind(await sha256(token), Date.now()).first<UserRow>();
  return row ?? null;
}

async function signedIn(env: AuthEnv & { DB: D1Like }, url: URL, user: UserRow, status = 200) {
  return json({ user: publicUser(user) }, status, { "set-cookie": await startSession(env, url, user.id) });
}

async function createUser(env: AuthEnv & { DB: D1Like }, f: { email: string; name: string; passwordHash?: string | null; googleSub?: string | null; avatar?: string | null }): Promise<UserRow> {
  const row: UserRow = { id: crypto.randomUUID(), email: f.email, name: f.name, password_hash: f.passwordHash ?? null, google_sub: f.googleSub ?? null, avatar: f.avatar ?? null, created_at: Date.now() };
  await env.DB.prepare("INSERT INTO users (id, email, name, password_hash, google_sub, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(row.id, row.email, row.name, row.password_hash, row.google_sub, row.avatar, row.created_at).run();
  return row;
}
const userByEmail = (env: AuthEnv & { DB: D1Like }, email: string) => env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();

/** Counts one use of `key` in a fixed window, atomically; false once the limit is passed. */
async function allow(env: AuthEnv & { DB: D1Like }, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const r = await env.DB.prepare("INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN ? - window_start < ? THEN count + 1 ELSE 1 END, window_start = CASE WHEN ? - window_start < ? THEN window_start ELSE ? END RETURNING count")
    .bind(key, now, now, windowMs, now, windowMs, now).first<{ count: number }>();
  return (r?.count ?? 0) <= limit;
}
const clientIp = (request: Request) => request.headers.get("cf-connecting-ip") || "unknown";

/** Checked when there is no account, so a wrong email takes as long as a wrong password. */
let dummyHash: Promise<string> | null = null;

/* ------------------------------------------------------------------ email (Brevo) */

const escapeHtml = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function sendEmail(env: AuthEnv, to: string, subject: string, html: string): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Aethex", email: env.BREVO_FROM_EMAIL || "noreply@aethex.in" }, to: [{ email: to }], subject, htmlContent: html }),
  });
  if (!r.ok) console.error("Brevo error", r.status, await r.text().catch(() => ""));
  return r.ok;
}

const shell = (body: string) => `<!DOCTYPE html><html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#F4F5F7;padding:24px;color:#14213D;">
<div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E3E6EB;">
<div style="padding:20px 28px;border-bottom:1px solid #E3E6EB;font-size:20px;font-weight:700;color:#1F3F7A;">Aethex</div>
<div style="padding:28px;">${body}</div></div></body></html>`;

const codeEmail = (code: string, signUp: boolean) => shell(`<h2 style="margin:0 0 8px;font-size:20px;">${signUp ? "Confirm your email" : "Your sign-in code"}</h2>
<p style="color:#4A5568;margin:0 0 20px;line-height:1.5;">${signUp ? "Enter this code to finish creating your Aethex account" : "Enter this code to sign in to Aethex and Cadus"}. It expires in ${CODE_MINUTES} minutes.</p>
<div style="background:#F0F4FA;border:1px solid #C9D6EA;border-radius:10px;padding:20px;text-align:center;font-size:36px;font-weight:700;letter-spacing:10px;color:#1F3F7A;font-family:monospace;">${code}</div>
<p style="color:#718096;font-size:12px;margin-top:20px;line-height:1.5;">If you didn't ask for this code, you can ignore this email; nobody can sign in without it.</p>`);

/* ------------------------------------------------------------------ return addresses */

/** Where a sign-in may send the browser back to: this site, or any aethex.in address over https. */
function safeReturn(raw: string | null, url: URL, fallback: string): string {
  if (!raw) return fallback;
  try {
    const u = new URL(raw, url.origin);
    if (u.origin === url.origin) return u.toString();
    if (u.protocol === "https:" && onAethex(u.hostname)) return u.toString();
  } catch { /* fall through */ }
  return fallback;
}

/* ------------------------------------------------------------------ handlers */

async function body(request: Request): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get("content-type") || "").includes("application/json")) return null;
  try { const b = await request.json(); return b && typeof b === "object" ? (b as Record<string, unknown>) : null; } catch { return null; }
}

export async function handleAuth(request: Request, env: AuthEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  if (!env.DB) return json({ error: "Accounts aren't set up on the server yet (D1 binding DB)." }, 503);
  const db = env as AuthEnv & { DB: D1Like };

  if (path === "/api/auth/me" && request.method === "GET") {
    const u = await currentUser(request, env);
    return u ? json({ user: publicUser(u) }) : json({ error: "Not signed in" }, 401);
  }

  if (path === "/api/auth/logout" && request.method === "POST") {
    const token = readCookie(request);
    if (token) {
      const id = await sha256(token);
      if (url.searchParams.get("all") === "1") {
        const s = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ?").bind(id).first<{ user_id: string }>();
        if (s) await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(s.user_id).run();
      }
      await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
    }
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(url, "", 0) });
  }

  if (path === "/api/auth/google" && request.method === "GET") {
    const fallback = `${url.origin}/`;
    const from = safeReturn(url.searchParams.get("from"), url, fallback);
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return Response.redirect(withParam(from, "auth_error", "google-not-set-up"), 302);
    if (!(await allow(db, `google-ip:${clientIp(request)}`, 60, 15 * 60_000))) return Response.redirect(withParam(from, "auth_error", "google-busy"), 302);
    const state = b64u(random(24));
    const verifier = b64u(random(32));
    await env.DB.prepare("INSERT INTO oauth_states (state, verifier, return_to, error_to, expires_at) VALUES (?, ?, ?, ?, ?)").bind(state, verifier, safeReturn(url.searchParams.get("return"), url, fallback), from, Date.now() + 10 * 60_000).run();
    const g = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    g.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
    g.searchParams.set("redirect_uri", `${url.origin}/api/auth/google/callback`);
    g.searchParams.set("response_type", "code");
    g.searchParams.set("scope", "openid email profile");
    g.searchParams.set("state", state);
    g.searchParams.set("prompt", "select_account");
    g.searchParams.set("code_challenge", b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(verifier)))));
    g.searchParams.set("code_challenge_method", "S256");
    // The state is also kept in this browser, so only the browser that started can finish.
    return new Response(null, { status: 302, headers: { location: g.toString(), "set-cookie": oauthCookie(url, state, 600), "cache-control": "no-store" } });
  }

  if (path === "/api/auth/google/callback" && request.method === "GET") {
    const state = url.searchParams.get("state") || "";
    const row = state ? await env.DB.prepare("DELETE FROM oauth_states WHERE state = ? RETURNING *").bind(state).first<{ verifier: string; return_to: string; error_to: string; expires_at: number }>() : null;
    const started = new RegExp(`(?:^|;\\s*)${OAUTH_COOKIE}=([A-Za-z0-9_-]+)`).exec(request.headers.get("cookie") || "")?.[1];
    const clear = oauthCookie(url, "", 0);
    const redirect = (to: string, extra: string[] = []) => {
      const h = new Headers({ location: to, "cache-control": "no-store" });
      for (const c of [clear, ...extra]) h.append("set-cookie", c);
      return new Response(null, { status: 302, headers: h });
    };
    if (!row || row.expires_at < Date.now()) return redirect(`${url.origin}/?auth_error=google-expired`);
    const fail = (why: string) => redirect(withParam(row.error_to, "auth_error", why));
    if (!started || !same(started, state)) return fail("google-expired"); // not started in this browser
    const code = url.searchParams.get("code");
    if (!code || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail("google-cancelled");
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: "authorization_code", code_verifier: row.verifier }),
    });
    if (!tr.ok) return fail("google-failed");
    const tok = (await tr.json()) as { id_token?: string };
    // The ID token came straight from Google's token endpoint over TLS, so its claims can be read directly.
    let claims: { iss?: string; aud?: string; sub?: string; email?: string; email_verified?: boolean | string; name?: string; picture?: string; exp?: number } = {};
    try { claims = JSON.parse(new TextDecoder().decode(fromB64u(String(tok.id_token).split(".")[1]))); } catch { return fail("google-failed"); }
    const verified = claims.email_verified === true || claims.email_verified === "true";
    if (!["accounts.google.com", "https://accounts.google.com"].includes(String(claims.iss)) || claims.aud !== env.GOOGLE_CLIENT_ID || !claims.sub || !claims.email || !verified || (claims.exp ?? 0) * 1000 < Date.now()) return fail("google-failed");
    const email = normEmail(claims.email);
    let user = await env.DB.prepare("SELECT * FROM users WHERE google_sub = ?").bind(claims.sub).first<UserRow>();
    if (!user) {
      user = await userByEmail(db, email);
      if (user?.google_sub && user.google_sub !== claims.sub) return fail("google-other-account");
      if (user) {
        // Every account's email is proven (by a code or by Google), so a verified Google email can join it.
        await env.DB.prepare("UPDATE users SET google_sub = ?, avatar = COALESCE(avatar, ?) WHERE id = ?").bind(claims.sub, claims.picture ?? null, user.id).run();
      } else {
        user = await createUser(db, { email, name: cleanName(claims.name, email), googleSub: claims.sub, avatar: claims.picture ?? null });
      }
    }
    return redirect(row.return_to, [await startSession(db, url, user.id)]);
  }

  // Everything below takes a JSON body.
  if (request.method !== "POST") return json({ error: "Not found" }, 404);
  const b = await body(request);
  if (!b) return json({ error: "Send JSON" }, 400);
  const email = normEmail(b.email);

  const ip = clientIp(request);

  if (path === "/api/auth/signup") {
    // The account is created when the emailed code is entered, so nobody can
    // claim an address that isn't theirs. The answer is the same whether or not
    // the address already has an account (the code then just signs in).
    const password = typeof b.password === "string" ? b.password : "";
    if (!validEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
    if (password.length < 8 || password.length > 200) return json({ error: "Use a password of at least 8 characters." }, 400);
    if (!(await allow(db, `signup-ip:${ip}`, 30, 3600_000))) return json({ error: "Too many sign-ups from this network. Try again in an hour." }, 429);
    // The waiting password belongs to this browser only (a cookie), so a sign-up
    // started by someone else can never attach their password to your address.
    const token = b64u(random(24));
    const res = await sendCode(db, request, email, { name: cleanName(b.name, email), passwordHash: await hashPassword(password), tokenHash: await sha256(token) });
    if (res.status === 200) res.headers.append("set-cookie", signupCookie(url, token, CODE_MINUTES * 60));
    return res;
  }

  if (path === "/api/auth/login") {
    const password = typeof b.password === "string" ? b.password : "";
    if (!validEmail(email) || !password || password.length > 200) return json({ error: "Enter your email and password." }, 400);
    if (!(await allow(db, `login-ip:${ip}`, 60, 15 * 60_000))) return json({ error: "Too many attempts from this network. Wait 15 minutes, or sign in with an email code." }, 429);
    if (!(await allow(db, `login:${email}`, 10, 15 * 60_000))) return json({ error: "Too many attempts. Wait 15 minutes, or sign in with an email code." }, 429);
    const user = await userByEmail(db, email);
    const ok = user?.password_hash ? await checkPassword(password, user.password_hash) : (await checkPassword(password, await (dummyHash ??= hashPassword("not-a-password"))), false);
    if (!ok || !user) return json({ error: "That email and password don't match. If you signed up with Google or an email code, use that instead." }, 401);
    await env.DB.prepare("DELETE FROM rate_limits WHERE key = ?").bind(`login:${email}`).run();
    return signedIn(db, url, user);
  }

  if (path === "/api/auth/email/send") {
    if (!validEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
    return sendCode(db, request, email, null);
  }

  if (path === "/api/auth/email/verify") {
    const code = typeof b.code === "string" ? b.code.replace(/\D/g, "") : "";
    if (!validEmail(email) || code.length !== 6) return json({ error: "Enter the six-digit code from the email." }, 400);
    if (!(await allow(db, `verify-ip:${ip}`, 60, 15 * 60_000))) return json({ error: "Too many attempts from this network. Wait 15 minutes." }, 429);
    // One atomic step counts the try, so parallel guesses can't pass the limit of five.
    const row = await env.DB.prepare("UPDATE email_codes SET attempts = attempts + 1 WHERE email = ? AND attempts < 5 AND expires_at > ? RETURNING code_hash, pending_name, pending_password, pending_token").bind(email, Date.now()).first<{ code_hash: string; pending_name: string | null; pending_password: string | null; pending_token: string | null }>();
    if (!row) return json({ error: "That code has expired. Ask for a new one." }, 400);
    if (!same(await sha256(`${email}:${code}`), row.code_hash)) return json({ error: "That code didn't match. Check it and try again." }, 400);
    const used = await env.DB.prepare("UPDATE email_codes SET expires_at = 0, pending_password = NULL, pending_token = NULL WHERE email = ? AND code_hash = ? AND expires_at > 0 RETURNING email").bind(email, row.code_hash).first();
    if (!used) return json({ error: "That code has expired. Ask for a new one." }, 400);
    // The sign-up's name and password apply only in the browser that started it.
    const mine = new RegExp(`(?:^|;\\s*)${SIGNUP_COOKIE}=([A-Za-z0-9_-]+)`).exec(request.headers.get("cookie") || "")?.[1];
    const ownSignup = !!(row.pending_token && mine && same(await sha256(mine), row.pending_token));
    const pendingName = ownSignup ? row.pending_name : null;
    const pendingPassword = ownSignup ? row.pending_password : null;
    let user = await userByEmail(db, email);
    if (!user) {
      user = await createUser(db, { email, name: pendingName || cleanName(b.name, email), passwordHash: pendingPassword });
    } else if (pendingPassword && !user.password_hash) {
      // A Google or code-only account adds the password chosen at sign-up; other sessions end.
      await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(pendingPassword, user.id).run();
      await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();
    }
    const res = await signedIn(db, url, user);
    if (mine) res.headers.append("set-cookie", signupCookie(url, "", 0));
    return res;
  }

  return json({ error: "Not found" }, 404);
}

/**
 * Emails a fresh six-digit code. A sign-up passes its name and password hash,
 * which wait with the code; a plain sign-in clears any that were waiting.
 */
async function sendCode(env: AuthEnv & { DB: D1Like }, request: Request, email: string, pending: { name: string; passwordHash: string; tokenHash: string } | null): Promise<Response> {
  if (!env.BREVO_API_KEY) return json({ error: pending ? "Creating an account needs email confirmation, which isn't switched on yet. Use Google for now." : "Email codes aren't switched on yet. Use a password or Google for now." }, 503);
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const prev = await env.DB.prepare("SELECT sent_at, sent_today, day FROM email_codes WHERE email = ?").bind(email).first<{ sent_at: number; sent_today: number; day: string }>();
  if (prev && now - prev.sent_at < 60_000) return json({ error: "A code was just sent. Wait a minute before asking for another." }, 429);
  const today = prev && prev.day === day ? prev.sent_today : 0;
  if (today >= 10) return json({ error: "Too many codes today for this address. Try again tomorrow, or use a password." }, 429);
  if (!(await allow(env, `send-ip:${clientIp(request)}`, 20, 3600_000))) return json({ error: "Too many codes from this network. Try again in an hour." }, 429);
  if (!(await allow(env, `send-all:${day}`, 3000, 86400_000))) return json({ error: "Email codes are busy right now. Please try again later, or use Google." }, 429);
  const n = new Uint32Array(1); crypto.getRandomValues(n);
  const code = String(n[0] % 1_000_000).padStart(6, "0");
  await env.DB.prepare("INSERT INTO email_codes (email, code_hash, expires_at, attempts, sent_at, sent_today, day, pending_name, pending_password, pending_token) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, sent_at = excluded.sent_at, sent_today = excluded.sent_today, day = excluded.day, pending_name = excluded.pending_name, pending_password = excluded.pending_password, pending_token = excluded.pending_token")
    .bind(email, await sha256(`${email}:${code}`), now + CODE_MINUTES * 60_000, now, today + 1, day, pending?.name ?? null, pending?.passwordHash ?? null, pending?.tokenHash ?? null).run();
  const sent = pending
    ? await sendEmail(env, email, `${code} is your Aethex confirmation code`, codeEmail(code, true))
    : await sendEmail(env, email, `${code} is your Aethex sign-in code`, codeEmail(code, false));
  if (!sent) return json({ error: "The code couldn't be sent. Please try again in a moment." }, 502);
  return json({ ok: true, verify: true });
}

const SIGNUP_COOKIE = "aethex_signup";
const signupCookie = (url: URL, token: string, maxAge: number) =>
  `${SIGNUP_COOKIE}=${token}; Path=/api/auth/email; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${url.protocol === "https:" || onAethex(url.hostname) ? "; Secure" : ""}`;

const OAUTH_COOKIE = "aethex_oauth";
const oauthCookie = (url: URL, state: string, maxAge: number) =>
  `${OAUTH_COOKIE}=${state}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${url.protocol === "https:" || onAethex(url.hostname) ? "; Secure" : ""}`;

function withParam(target: string, k: string, v: string) {
  try { const u = new URL(target); u.searchParams.set(k, v); return u.toString(); } catch { return target; }
}

/* ------------------------------------------------------------------ Cadus profile */

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

export async function handleProfile(request: Request, env: AuthEnv): Promise<Response> {
  if (!env.DB) return json({ error: "Accounts aren't set up on the server yet (D1 binding DB)." }, 503);
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Sign in first" }, 401);
  if (request.method === "GET") {
    const row = await env.DB.prepare("SELECT data, updated_at FROM profiles WHERE user_id = ?").bind(user.id).first<{ data: string; updated_at: number }>();
    let profile = null;
    try { profile = row ? JSON.parse(row.data) : null; } catch { /* corrupt row */ }
    return json({ profile, updatedAt: row?.updated_at ?? null });
  }
  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM profiles WHERE user_id = ?").bind(user.id).run();
    return json({ ok: true });
  }
  if (request.method !== "PUT") return json({ error: "Use GET, PUT or DELETE" }, 405);
  const b = await body(request);
  const profile = cleanProfile(b?.profile);
  if (!profile) return json({ error: "A profile with a role is required" }, 400);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").bind(user.id, JSON.stringify(profile), now).run();
  return json({ ok: true, updatedAt: now });
}

/* ------------------------------------------------------------------ store cart and reminders */

export async function handleCart(request: Request, env: AuthEnv): Promise<Response> {
  if (!env.DB) return json({ error: "Accounts aren't set up on the server yet (D1 binding DB)." }, 503);
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Sign in first" }, 401);
  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM carts WHERE user_id = ?").bind(user.id).run();
    return json({ ok: true });
  }
  if (request.method !== "PUT") return json({ error: "Use PUT or DELETE" }, 405);
  const b = await body(request);
  const items = (Array.isArray(b?.items) ? b!.items : []).slice(0, 50).map((i: any) => ({
    productId: typeof i?.productId === "number" || typeof i?.productId === "string" ? String(i.productId).slice(0, 40) : "",
    name: typeof i?.name === "string" ? i.name.slice(0, 120) : "Item",
    price: Number.isFinite(Number(i?.price)) ? Number(i.price) : 0,
    quantity: Math.max(0, Math.min(999, Math.floor(Number(i?.quantity) || 0))),
  })).filter((i: { quantity: number }) => i.quantity > 0);
  const count = items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
  if (!count) {
    await env.DB.prepare("DELETE FROM carts WHERE user_id = ?").bind(user.id).run();
    return json({ ok: true });
  }
  const total = Number.isFinite(Number(b?.total)) ? Number(b!.total) : items.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0);
  await env.DB.prepare("INSERT INTO carts (user_id, email, items, item_count, total, updated_at, notified_at) VALUES (?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, items = excluded.items, item_count = excluded.item_count, total = excluded.total, updated_at = excluded.updated_at, notified_at = NULL")
    .bind(user.id, user.email, JSON.stringify(items), count, total, Date.now()).run();
  return json({ ok: true });
}

const money = (n: number) => `&#8377;${Number(n || 0).toLocaleString("en-IN")}`;
const cartEmail = (count: number, total: number, items: { name: string; quantity: number; price: number }[]) => shell(`<h2 style="margin:0 0 8px;font-size:20px;">You left ${count} item${count === 1 ? "" : "s"} in your cart</h2>
<p style="color:#4A5568;margin:0 0 18px;line-height:1.5;">Your selection is saved. Complete your order whenever you're ready.</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">${items.slice(0, 4).map((it) => `<tr><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;">${escapeHtml(it.name || "Item")}</td><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;color:#718096;text-align:center;">&times;${it.quantity || 1}</td><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;text-align:right;">${money(it.price)}</td></tr>`).join("")}</table>
<p style="text-align:right;font-size:15px;font-weight:700;margin:0 0 20px;">Total ${money(total)}</p>
<p style="text-align:center;margin:0;"><a href="https://aethex.in/cart" style="display:inline-block;background:#1F3F7A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;">Return to your cart</a></p>
<p style="color:#718096;font-size:12px;margin-top:22px;text-align:center;">If you've already ordered, please ignore this email.</p>`);

/** Hourly: remind carts left for over an hour (at most once a week per account), and clear expired rows. */
export async function runScheduled(env: AuthEnv): Promise<{ sent: number; scanned: number }> {
  if (!env.DB) return { sent: 0, scanned: 0 };
  const now = Date.now();
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run();
  await env.DB.prepare("DELETE FROM oauth_states WHERE expires_at < ?").bind(now).run();
  await env.DB.prepare("DELETE FROM email_codes WHERE expires_at < ? AND sent_at < ?").bind(now, now - 86400_000).run();
  await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 2 * 86400_000).run();
  if (!env.BREVO_API_KEY) return { sent: 0, scanned: 0 };
  const { results } = await env.DB.prepare("SELECT user_id, email, items, item_count, total FROM carts WHERE item_count > 0 AND updated_at < ? AND notified_at IS NULL AND (last_reminded_at IS NULL OR last_reminded_at < ?) LIMIT 50").bind(now - 3600_000, now - 7 * 86400_000).all<{ user_id: string; email: string; items: string; item_count: number; total: number }>();
  let sent = 0;
  for (const c of results) {
    let items: { name: string; quantity: number; price: number }[] = [];
    try { items = JSON.parse(c.items); } catch { /* empty */ }
    const ok = await sendEmail(env, c.email, `You left ${c.item_count} item${c.item_count === 1 ? "" : "s"} in your Aethex cart`, cartEmail(c.item_count, c.total, items));
    if (ok) { await env.DB.prepare("UPDATE carts SET notified_at = ?, last_reminded_at = ? WHERE user_id = ?").bind(now, now, c.user_id).run(); sent++; }
  }
  return { sent, scanned: results.length };
}
