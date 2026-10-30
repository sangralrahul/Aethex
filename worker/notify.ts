// Update 82: notifications for aethex.in's bell, gathered from what already happened on the five platforms (no
// separate event log): appointments confirmed, cancelled or completed, prescriptions, waitlist slots, answers to
// your questions, order updates, quotations, product answers, replacement requests, approvals of shared lists, and
// for doctors new bookings. Read state is one "seen up to" time per account. Routes: GET /api/notifications,
// POST /api/notifications/seen. A table that doesn't exist yet is simply skipped.
import { currentUser, normEmail, type AuthEnv, type D1Like } from "./auth";

type DB = AuthEnv & { DB: D1Like };
export interface Note { id: string; at: number; platform: "doctors" | "store" | "study" | "hospitals" | "medicalcolleges"; title: string; text: string; href: string }
const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store, private" } });
const D = "https://doctors.aethex.in", S = "https://store.aethex.in";
const nice = (date: string, time?: string) => {
  const d = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  if (!time) return d;
  const h = Number(time.slice(0, 2));
  return `${d}, ${((h + 11) % 12) + 1}:${time.slice(3)} ${h < 12 ? "AM" : "PM"}`;
};
let ready: Promise<void> | null = null;
const ensure = (db: D1Like) => (ready ??= db.prepare("CREATE TABLE IF NOT EXISTS notif_seen (user_id TEXT PRIMARY KEY, seen_at INTEGER NOT NULL)").run().then(() => undefined).catch((e) => { ready = null; throw e; }));
async function rows<T>(db: DB, sql: string, ...args: unknown[]): Promise<T[]> {
  try { return (await db.DB.prepare(sql).bind(...args).all<T>()).results; } catch { return []; }
}

export async function gather(db: DB, user: { id: string; email: string }, since = Date.now() - 30 * 86400_000): Promise<Note[]> {
  const email = normEmail(user.email);
  const out: Note[] = [];
  // patient appointments
  for (const a of await rows<{ id: string; status: string; date: string; time: string; updated_at: number; created_at: number; note: string | null; d_name: string }>(db,
    "SELECT a.id, a.status, a.date, a.time, a.updated_at, a.created_at, a.note, d.name AS d_name FROM find_appointments a JOIN find_doctors d ON d.id = a.doctor_id WHERE a.user_id = ? AND a.updated_at >= ? AND a.status IN ('confirmed', 'cancelled', 'completed')", user.id, since)) {
    if (a.updated_at - a.created_at < 1000) continue;
    const t = a.status === "confirmed" ? "Appointment confirmed" : a.status === "completed" ? "Visit completed" : "Appointment cancelled";
    if (a.status === "cancelled" && a.note === "Cancelled by the patient") continue;
    out.push({ id: `fa:${a.id}:${a.status}`, at: a.updated_at, platform: "doctors", title: t, text: `${a.d_name}, ${nice(a.date, a.time)}`, href: `${D}/appointments` });
  }
  for (const p of await rows<{ id: string; created_at: number; d_name: string }>(db, "SELECT p.id, p.created_at, d.name AS d_name FROM find_prescriptions p JOIN find_doctors d ON d.id = p.doctor_id WHERE p.user_id = ? AND p.created_at >= ?", user.id, since))
    out.push({ id: `rx:${p.id}`, at: p.created_at, platform: "doctors", title: "Prescription ready", text: `From ${p.d_name}. Medicine reminders are on it.`, href: `${D}/prescription/${p.id}` });
  for (const w of await rows<{ id: string; date: string; notified_at: number; slug: string; name: string }>(db, "SELECT w.id, w.date, w.notified_at, d.slug, d.name FROM find_waitlist w JOIN find_doctors d ON d.id = w.doctor_id WHERE w.user_id = ? AND w.notified_at >= ?", user.id, since))
    out.push({ id: `wl:${w.id}`, at: w.notified_at, platform: "doctors", title: "A slot opened", text: `${w.name}, ${nice(w.date)}`, href: `${D}/doctor/${w.slug}?date=${w.date}#book` });
  for (const q of await rows<{ id: string; title: string; at: number }>(db, "SELECT q.id, q.title, MAX(a.created_at) AS at FROM find_questions q JOIN find_answers a ON a.question_id = q.id WHERE q.user_id = ? AND a.created_at >= ? GROUP BY q.id", user.id, since))
    out.push({ id: `fq:${q.id}:${q.at}`, at: Number(q.at), platform: "doctors", title: "A doctor answered", text: q.title, href: `${D}/ask/${q.id}` });
  // the doctor's own practice
  for (const a of await rows<{ id: string; patient_name: string; date: string; time: string; created_at: number }>(db,
    "SELECT a.id, a.patient_name, a.date, a.time, a.created_at FROM find_appointments a JOIN find_doctors d ON d.id = a.doctor_id WHERE d.user_id = ? AND a.created_at >= ? AND a.status = 'booked'", user.id, since))
    out.push({ id: `nb:${a.id}`, at: a.created_at, platform: "doctors", title: "New booking to confirm", text: `${a.patient_name}, ${nice(a.date, a.time)}`, href: `${D}/practice` });
  // store orders
  for (const o of await rows<{ id: string; history: string }>(db, "SELECT id, history FROM store_orders WHERE (user_id = ? OR email = ?) AND updated_at >= ?", user.id, email, since)) {
    let h: { status: string; at: number; note?: string }[] = [];
    try { h = JSON.parse(o.history); } catch { /* bad */ }
    for (const e of h) if (e.at >= since && ["confirmed", "shipped", "delivered", "cancelled"].includes(e.status))
      out.push({ id: `so:${o.id}:${e.status}`, at: e.at, platform: "store", title: `Order ${e.status}`, text: `${o.id}${e.note ? `: ${e.note}` : ""}`, href: `${S}/orders` });
  }
  for (const r of await rows<{ id: string; status: string; order_id: string; updated_at: number; created_at: number }>(db,
    "SELECT x.id, x.status, x.order_id, x.updated_at, x.created_at FROM store_replacements x JOIN store_orders o ON o.id = x.order_id WHERE (o.user_id = ? OR o.email = ?) AND x.updated_at >= ? AND x.status != 'requested'", user.id, email, since))
    out.push({ id: `rp:${r.id}:${r.status}`, at: r.updated_at, platform: "store", title: "Replacement update", text: `Order ${r.order_id}: ${r.status.replace("-", " ")}`, href: `${S}/orders` });
  for (const q of await rows<{ id: string; product_id: number; answered_at: number; question: string }>(db, "SELECT id, product_id, answered_at, question FROM store_questions WHERE user_id = ? AND status = 'answered' AND answered_at >= ?", user.id, since))
    out.push({ id: `pq:${q.id}`, at: q.answered_at, platform: "store", title: "Your product question was answered", text: q.question.slice(0, 90), href: `${S}/products/${q.product_id}#questions` });
  // institutions
  for (const b of await rows<{ id: string; status: string; segment: string; institution: string; updated_at: number; customer_note: string | null }>(db,
    "SELECT id, status, segment, institution, updated_at, customer_note FROM store_bulk_requests WHERE (user_id = ? OR email = ?) AND updated_at >= ? AND status != 'new'", user.id, email, since)) {
    const p = b.segment === "college" ? "medicalcolleges" : "hospitals";
    out.push({ id: `bq:${b.id}:${b.status}`, at: b.updated_at, platform: p, title: b.status === "quoted" ? "Quotation sent" : `Quotation request ${b.status}`, text: `${b.institution}${b.customer_note ? `: ${b.customer_note.slice(0, 80)}` : ""}`, href: `https://${p}.aethex.in/account/quotations` });
  }
  for (const a of await rows<{ id: string; name: string; status: string; segment: string; decided_at: number; approver_name: string | null }>(db,
    "SELECT id, name, status, segment, decided_at, approver_name FROM store_approvals WHERE user_id = ? AND decided_at >= ?", user.id, since)) {
    const p = a.segment === "college" ? "medicalcolleges" : "hospitals";
    out.push({ id: `ap:${a.id}:${a.status}`, at: a.decided_at, platform: p, title: a.status === "approved" ? "List approved" : a.status === "changes" ? "Changes asked for" : "List not approved", text: `${a.name}${a.approver_name ? ` · ${a.approver_name}` : ""}`, href: `https://${p}.aethex.in/approvals` });
  }
  return out.sort((x, y) => y.at - x.at).slice(0, 40);
}

export async function handleNotifications(request: Request, env: AuthEnv & { DB?: D1Like }): Promise<Response> {
  if (!env.DB) return json({ items: [], unread: 0 });
  const db = env as DB;
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to see notifications.", signIn: true }, 401);
  await ensure(db.DB);
  const path = new URL(request.url).pathname;
  if (path.endsWith("/seen") && request.method === "POST") {
    await db.DB.prepare("INSERT INTO notif_seen (user_id, seen_at) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET seen_at = excluded.seen_at").bind(user.id, Date.now()).run();
    return json({ ok: true });
  }
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const seen = (await db.DB.prepare("SELECT seen_at FROM notif_seen WHERE user_id = ?").bind(user.id).first<{ seen_at: number }>())?.seen_at ?? 0;
  const items = await gather(db, user);
  return json({ items: items.map((n) => ({ ...n, unread: n.at > seen })), unread: items.filter((n) => n.at > seen).length, seenAt: seen });
}
