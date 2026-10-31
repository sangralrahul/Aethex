// Update 86: email preferences, one place for the whole of Aethex (aethex.in/email-preferences). Each kind of
// reminder email can be switched off; emails about something the person did (an order, a booking, a sign-in code,
// a reply to them) always go. The reminder jobs ask emailOk() before sending and carry a link here.
// Table email_prefs, created on first use. Routes: GET and POST /api/notifications/prefs (worker/notify.ts).
import type { D1Like } from "./auth";

export const EMAIL_KINDS = {
  appointments: "Appointment reminders (the day before) and follow-up reminders",
  cart: "Reminders about items left in your cart",
  reorder: "Reorder reminders you set on products",
  alerts: "Price-drop and back-in-stock alerts you asked for",
  equipment: "Equipment service, calibration and warranty reminders",
} as const;
export type EmailKind = keyof typeof EMAIL_KINDS;
export type EmailPrefs = Record<EmailKind, boolean>;
const ALL = Object.keys(EMAIL_KINDS) as EmailKind[];
export const defaultPrefs = (): EmailPrefs => Object.fromEntries(ALL.map((k) => [k, true])) as EmailPrefs;

let ready: Promise<void> | null = null;
export function ensurePrefs(db: D1Like) {
  if (!ready) ready = db.prepare("CREATE TABLE IF NOT EXISTS email_prefs (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)").run().then(() => undefined).catch((e) => { ready = null; throw e; });
  return ready;
}
export async function readPrefs(db: D1Like, userId: string): Promise<EmailPrefs> {
  await ensurePrefs(db);
  const r = await db.prepare("SELECT data FROM email_prefs WHERE user_id = ?").bind(userId).first<{ data: string }>();
  const out = defaultPrefs();
  try { const v = r ? JSON.parse(r.data) : {}; for (const k of ALL) if (v[k] === false) out[k] = false; } catch { /* defaults */ }
  return out;
}
export async function savePrefs(db: D1Like, userId: string, raw: unknown): Promise<EmailPrefs> {
  const cur = await readPrefs(db, userId);
  const v = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  for (const k of ALL) if (typeof v[k] === "boolean") cur[k] = v[k] as boolean;
  await db.prepare("INSERT INTO email_prefs (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").bind(userId, JSON.stringify(cur), Date.now()).run();
  return cur;
}
/** May this kind of email go to this account (by id) or address (by email)? Unknown people: yes. Errors: yes. */
export async function emailOk(db: D1Like | undefined, who: { userId?: string | null; email?: string | null }, kind: EmailKind): Promise<boolean> {
  if (!db) return true;
  try {
    await ensurePrefs(db);
    let id = who.userId ?? null;
    if (!id && who.email) id = (await db.prepare("SELECT id FROM users WHERE email = ?").bind(String(who.email).trim().toLowerCase()).first<{ id: string }>())?.id ?? null;
    if (!id) return true;
    return (await readPrefs(db, id))[kind];
  } catch { return true; }
}
/** The line at the bottom of a reminder email. */
export const withPrefsLink = (html: string) => html.replace(/<\/body>/, `<p style="text-align:center;font-size:12px;color:#718096;margin:14px 0 0;">Don't want these reminders? <a href="https://aethex.in/email-preferences" style="color:#718096;">Change your email preferences</a></p></body>`);
