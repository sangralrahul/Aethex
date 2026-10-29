// Aethex Find (find.aethex.in, and /find on aethex.in): doctors list their own practice, patients find
// them by city and specialty and book a time. Only real, self-listed doctors appear, and only after an
// admin (ADMIN_EMAILS) has checked the profile and its medical registration number. Reviews come only
// from patients whose appointment the doctor marked as completed.
//
// Tables are created on first use (also in migrations/0006_find.sql). Every route is under /api/find/.
import { allow, clientIp, currentUser, escapeHtml, normEmail, sendEmail, shell, type AuthEnv, type D1Like } from "./auth";

export interface FindEnv extends AuthEnv { ADMIN_EMAILS?: string }
type DBEnv = FindEnv & { DB: D1Like };

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store, private" } });

export const FIND_TABLES = [
  `CREATE TABLE IF NOT EXISTS find_doctors (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending',
    name TEXT NOT NULL, gender TEXT, specialty TEXT NOT NULL, qualifications TEXT NOT NULL,
    reg_no TEXT NOT NULL, reg_council TEXT NOT NULL, experience INTEGER NOT NULL DEFAULT 0,
    clinic TEXT NOT NULL, address TEXT NOT NULL, locality TEXT, city TEXT NOT NULL, pincode TEXT NOT NULL,
    fee INTEGER NOT NULL, video INTEGER NOT NULL DEFAULT 0, video_fee INTEGER, languages TEXT, about TEXT, services TEXT,
    hours TEXT NOT NULL, admin_note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS find_appointments (
    id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL, user_id TEXT NOT NULL, patient_name TEXT NOT NULL, patient_phone TEXT NOT NULL,
    patient_email TEXT, patient_age INTEGER, date TEXT NOT NULL, time TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'clinic',
    reason TEXT, status TEXT NOT NULL DEFAULT 'booked', link TEXT, note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS find_reviews (
    id TEXT PRIMARY KEY, doctor_id TEXT NOT NULL, appointment_id TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL,
    rating INTEGER NOT NULL, text TEXT, name TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS find_doctors_search ON find_doctors(status, city, specialty)",
  "CREATE UNIQUE INDEX IF NOT EXISTS find_appt_slot ON find_appointments(doctor_id, date, time) WHERE status != 'cancelled'",
  "CREATE INDEX IF NOT EXISTS find_appt_user ON find_appointments(user_id, date)",
  "CREATE INDEX IF NOT EXISTS find_reviews_doctor ON find_reviews(doctor_id, created_at)",
];
let ready: Promise<void> | null = null;
function ensure(db: D1Like) {
  if (!ready) ready = (async () => { for (const sql of FIND_TABLES) await db.prepare(sql).run(); })().catch((e) => { ready = null; throw e; });
  return ready;
}

/* ------------------------------------------------------------------ values */

export const SPECIALTIES = [
  "General Physician", "Family Physician", "Paediatrician", "Gynaecologist / Obstetrician", "Dermatologist", "Dentist",
  "Orthopaedic Surgeon", "ENT Specialist", "Ophthalmologist", "Cardiologist", "Psychiatrist", "Psychologist",
  "Neurologist", "Pulmonologist", "Gastroenterologist", "Endocrinologist", "Diabetologist", "Nephrologist", "Urologist",
  "General Surgeon", "Oncologist", "Rheumatologist", "Physiotherapist", "Dietitian / Nutritionist", "Homoeopath", "Ayurveda",
];
const DAYS = [0, 1, 2, 3, 4, 5, 6];
type Hours = { days: number[]; sessions: { start: string; end: string }[]; slot: number };
type DoctorRow = {
  id: string; user_id: string; slug: string; status: string; name: string; gender: string | null; specialty: string; qualifications: string;
  reg_no: string; reg_council: string; experience: number; clinic: string; address: string; locality: string | null; city: string; pincode: string;
  fee: number; video: number; video_fee: number | null; languages: string | null; about: string | null; services: string | null; hours: string;
  admin_note: string | null; created_at: number; updated_at: number;
};
type ApptRow = {
  id: string; doctor_id: string; user_id: string; patient_name: string; patient_phone: string; patient_email: string | null; patient_age: number | null;
  date: string; time: string; mode: string; reason: string | null; status: string; link: string | null; note: string | null; created_at: number; updated_at: number;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const longStr = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "");
const int = (v: unknown, min: number, max: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
const hhmm = (v: unknown) => (typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null);
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const id = (p: string) => `${p}${Date.now().toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 7)}`;
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export function parseHours(raw: unknown): Hours | null {
  const h = (typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw) as Partial<Hours> | null;
  if (!h || !Array.isArray(h.days) || !Array.isArray(h.sessions)) return null;
  const days = Array.from(new Set(h.days.map(Number).filter((d) => DAYS.includes(d)))).sort();
  const slot = [10, 15, 20, 30, 45, 60].includes(Number(h.slot)) ? Number(h.slot) : 15;
  const sessions = h.sessions.slice(0, 3).map((s) => ({ start: hhmm(s?.start), end: hhmm(s?.end) }))
    .filter((s): s is { start: string; end: string } => !!s.start && !!s.end && mins(s.end) - mins(s.start) >= slot);
  if (!days.length || !sessions.length) return null;
  return { days, sessions, slot };
}

/** Every bookable time of one day for these hours ("HH:MM"). */
export function daySlots(h: Hours, date: string): string[] {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (!h.days.includes(d)) return [];
  const out: string[] = [];
  for (const s of h.sessions) for (let m = mins(s.start); m + h.slot <= mins(s.end); m += h.slot) out.push(fmt(m));
  return out;
}

/** India time now, as a date ("YYYY-MM-DD") and minutes since midnight. */
function istNow(at = Date.now()) {
  const d = new Date(at + 330 * 60000);
  return { date: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const BOOK_AHEAD_DAYS = 30;

function publicDoctor(d: DoctorRow, rating?: { avg: number; count: number }) {
  return {
    slug: d.slug, name: d.name, gender: d.gender, specialty: d.specialty, qualifications: d.qualifications,
    regNo: d.reg_no, regCouncil: d.reg_council, experience: d.experience, clinic: d.clinic, address: d.address,
    locality: d.locality, city: d.city, pincode: d.pincode, fee: d.fee, video: !!d.video, videoFee: d.video_fee,
    languages: d.languages ? d.languages.split(",").map((s) => s.trim()).filter(Boolean) : [], about: d.about,
    services: d.services ? d.services.split(",").map((s) => s.trim()).filter(Boolean) : [], hours: parseHours(d.hours),
    rating: rating && rating.count ? rating : null,
  };
}
const ownDoctor = (d: DoctorRow) => ({ ...publicDoctor(d), id: d.id, status: d.status, adminNote: d.admin_note, createdAt: d.created_at, updatedAt: d.updated_at });
const apptOut = (a: ApptRow, doctor?: { slug: string; name: string; specialty: string; clinic: string; address: string; city: string }) => ({
  id: a.id, date: a.date, time: a.time, mode: a.mode, reason: a.reason, status: a.status, link: a.link, note: a.note,
  patient: { name: a.patient_name, phone: a.patient_phone, email: a.patient_email, age: a.patient_age }, createdAt: a.created_at, doctor,
});

async function body(request: Request): Promise<Record<string, unknown>> {
  try { const b = await request.json(); return b && typeof b === "object" ? (b as Record<string, unknown>) : {}; } catch { return {}; }
}
const adminEmails = (env: FindEnv) => String(env.ADMIN_EMAILS || "").split(/[,;\s]+/).map(normEmail).filter(Boolean);

/** Reads and checks a profile from the form; returns the fields or an error message. */
function readProfile(b: Record<string, unknown>): { error: string } | Omit<DoctorRow, "id" | "user_id" | "slug" | "status" | "admin_note" | "created_at" | "updated_at"> {
  const name = str(b.name, 80), specialty = str(b.specialty, 60), qualifications = str(b.qualifications, 160);
  const reg_no = str(b.regNo, 40), reg_council = str(b.regCouncil, 80), clinic = str(b.clinic, 120), address = str(b.address, 240);
  const city = str(b.city, 60), pincode = str(b.pincode, 6), locality = str(b.locality, 80);
  const fee = int(b.fee, 0, 100000), experience = int(b.experience ?? 0, 0, 70);
  const video = b.video === true || b.video === 1 || b.video === "1";
  const video_fee = video ? int(b.videoFee ?? b.fee, 0, 100000) : null;
  const hours = parseHours(b.hours);
  if (name.length < 3) return { error: "Enter your full name." };
  if (!SPECIALTIES.includes(specialty)) return { error: "Choose your specialty from the list." };
  if (qualifications.length < 2) return { error: "Enter your qualifications, for example MBBS, MD (Medicine)." };
  if (!/^[A-Za-z0-9/.\- ]{3,40}$/.test(reg_no)) return { error: "Enter your medical registration number." };
  if (reg_council.length < 3) return { error: "Enter the council you are registered with." };
  if (clinic.length < 2 || address.length < 8) return { error: "Enter your clinic's name and full address." };
  if (city.length < 2) return { error: "Enter your city." };
  if (!/^[1-9]\d{5}$/.test(pincode)) return { error: "Enter a 6-digit PIN code." };
  if (fee === null) return { error: "Enter your consultation fee in rupees (0 if free)." };
  if (experience === null) return { error: "Enter your years of experience." };
  if (!hours) return { error: "Add at least one day and one session of consulting hours." };
  const gender = ["female", "male", "other"].includes(String(b.gender)) ? String(b.gender) : null;
  const list = (v: unknown, n: number) => (Array.isArray(v) ? v : String(v ?? "").split(",")).map((s) => str(s, 40)).filter(Boolean).slice(0, n).join(", ");
  return {
    name, gender, specialty, qualifications, reg_no, reg_council, experience, clinic, address, locality: locality || null, city, pincode,
    fee, video: video ? 1 : 0, video_fee, languages: list(b.languages, 8) || null, about: longStr(b.about, 1200) || null,
    services: list(b.services, 15) || null, hours: JSON.stringify(hours),
  };
}

async function ratings(env: DBEnv, ids: string[]) {
  const map = new Map<string, { avg: number; count: number }>();
  if (!ids.length) return map;
  const { results } = await env.DB.prepare(`SELECT doctor_id, AVG(rating) AS avg, COUNT(*) AS n FROM find_reviews WHERE doctor_id IN (${ids.map(() => "?").join(",")}) GROUP BY doctor_id`).bind(...ids).all<{ doctor_id: string; avg: number; n: number }>();
  for (const r of results) map.set(r.doctor_id, { avg: Math.round(Number(r.avg) * 10) / 10, count: Number(r.n) });
  return map;
}

function apptEmail(title: string, lines: [string, string][], foot: string) {
  return shell(`<h2 style="margin:0 0 12px;font-size:20px;">${escapeHtml(title)}</h2>
    <table style="border-collapse:collapse;font-size:14px;">${lines.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#667085;">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`).join("")}</table>
    <p style="margin:16px 0 0;font-size:14px;color:#475467;">${escapeHtml(foot)}</p>`);
}
const nice = (date: string, time: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  const h = Number(time.slice(0, 2)), m = time.slice(3);
  return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}, ${((h + 11) % 12) + 1}:${m} ${h < 12 ? "AM" : "PM"}`;
};

/* ------------------------------------------------------------------ routes */

export async function handleFind(request: Request, env: FindEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/find/, "").replace(/\/+$/, "") || "/";
  const method = request.method;
  if (path === "/specialties") return json({ specialties: SPECIALTIES });
  if (!env.DB) return json({ error: "Find a doctor isn't switched on yet: the site's database isn't connected.", setup: true }, 503);
  const db = env as DBEnv;
  await ensure(db.DB);

  /* search: live doctors only */
  if (path === "/doctors" && method === "GET") {
    const q = str(url.searchParams.get("q"), 60).toLowerCase(), city = str(url.searchParams.get("city"), 60).toLowerCase();
    const specialty = str(url.searchParams.get("specialty"), 60), video = url.searchParams.get("video") === "1";
    const where = ["status = 'live'"], args: unknown[] = [];
    if (city) { where.push("LOWER(city) = ?"); args.push(city); }
    if (specialty) { where.push("specialty = ?"); args.push(specialty); }
    if (video) where.push("video = 1");
    if (q) { where.push("(LOWER(name) LIKE ? OR LOWER(specialty) LIKE ? OR LOWER(clinic) LIKE ? OR LOWER(locality) LIKE ? OR LOWER(services) LIKE ?)"); const like = `%${q.replace(/[%_]/g, "")}%`; args.push(like, like, like, like, like); }
    const { results } = await db.DB.prepare(`SELECT * FROM find_doctors WHERE ${where.join(" AND ")} ORDER BY experience DESC, created_at ASC LIMIT 60`).bind(...args).all<DoctorRow>();
    const r = await ratings(db, results.map((d) => d.id));
    const { results: cities } = await db.DB.prepare("SELECT city, COUNT(*) AS n FROM find_doctors WHERE status = 'live' GROUP BY LOWER(city) ORDER BY n DESC LIMIT 40").all<{ city: string; n: number }>();
    return json({ doctors: results.map((d) => publicDoctor(d, r.get(d.id))), cities: cities.map((c) => ({ city: c.city, count: Number(c.n) })) });
  }

  /* one doctor, with the times already taken */
  const one = /^\/doctors\/([a-z0-9-]{3,80})$/.exec(path);
  if (one && method === "GET") {
    const d = await db.DB.prepare("SELECT * FROM find_doctors WHERE slug = ?").bind(one[1]).first<DoctorRow>();
    const user = await currentUser(request, env);
    if (!d || (d.status !== "live" && d.user_id !== user?.id)) return json({ error: "This doctor isn't listed." }, 404);
    const today = istNow().date;
    const { results: taken } = await db.DB.prepare("SELECT date, time FROM find_appointments WHERE doctor_id = ? AND status != 'cancelled' AND date >= ? AND date <= ?").bind(d.id, today, addDays(today, BOOK_AHEAD_DAYS)).all<{ date: string; time: string }>();
    const { results: reviews } = await db.DB.prepare("SELECT rating, text, name, created_at FROM find_reviews WHERE doctor_id = ? ORDER BY created_at DESC LIMIT 20").bind(d.id).all<{ rating: number; text: string | null; name: string; created_at: number }>();
    const r = await ratings(db, [d.id]);
    return json({ doctor: publicDoctor(d, r.get(d.id)), preview: d.status !== "live", taken: taken.map((t) => `${t.date} ${t.time}`), today, now: istNow().min, aheadDays: BOOK_AHEAD_DAYS,
      reviews: reviews.map((x) => ({ rating: x.rating, text: x.text, name: x.name.split(" ")[0], at: x.created_at })) });
  }

  /* everything below needs an account */
  const user = await currentUser(request, env);
  const signIn = () => json({ error: "Sign in to continue.", signIn: true }, 401);

  /* the doctor's own profile */
  if (path === "/me") {
    if (!user) return signIn();
    const mine = await db.DB.prepare("SELECT * FROM find_doctors WHERE user_id = ?").bind(user.id).first<DoctorRow>();
    if (method === "GET") return json({ doctor: mine ? ownDoctor(mine) : null, email: user.email, name: user.name });
    if (method !== "POST") return json({ error: "Use GET or POST" }, 405);
    if (!(await allow(db, `find-me:${user.id}`, 30, 3600_000))) return json({ error: "Too many changes. Try again in an hour." }, 429);
    const p = readProfile(await body(request));
    if ("error" in p) return json(p, 400);
    const now = Date.now();
    if (mine) {
      const regChanged = mine.reg_no !== p.reg_no || mine.reg_council !== p.reg_council || mine.name !== p.name;
      const status = mine.status === "rejected" || (regChanged && mine.status !== "pending") ? "pending" : mine.status;
      await db.DB.prepare(`UPDATE find_doctors SET name=?, gender=?, specialty=?, qualifications=?, reg_no=?, reg_council=?, experience=?, clinic=?, address=?, locality=?, city=?, pincode=?, fee=?, video=?, video_fee=?, languages=?, about=?, services=?, hours=?, status=?, updated_at=? WHERE id=?`)
        .bind(p.name, p.gender, p.specialty, p.qualifications, p.reg_no, p.reg_council, p.experience, p.clinic, p.address, p.locality, p.city, p.pincode, p.fee, p.video, p.video_fee, p.languages, p.about, p.services, p.hours, status, now, mine.id).run();
    } else {
      const slug = `${slugify(`dr-${p.name.replace(/^dr\.?\s+/i, "")}-${p.specialty.split(" ")[0]}-${p.city}`)}-${Math.random().toString(36).slice(2, 6)}`;
      await db.DB.prepare(`INSERT INTO find_doctors (id, user_id, slug, status, name, gender, specialty, qualifications, reg_no, reg_council, experience, clinic, address, locality, city, pincode, fee, video, video_fee, languages, about, services, hours, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id("d"), user.id, slug, p.name, p.gender, p.specialty, p.qualifications, p.reg_no, p.reg_council, p.experience, p.clinic, p.address, p.locality, p.city, p.pincode, p.fee, p.video, p.video_fee, p.languages, p.about, p.services, p.hours, now, now).run();
      for (const to of adminEmails(env).slice(0, 3)) await sendEmail(env, to, `New doctor to check: ${p.name}`, apptEmail("A doctor listed their practice", [["Name", p.name], ["Specialty", p.specialty], ["Registration", `${p.reg_no} (${p.reg_council})`], ["City", p.city]], "Check the registration number on the NMC register, then approve it at aethex.in/admin/doctors.")).catch(() => false);
    }
    const saved = await db.DB.prepare("SELECT * FROM find_doctors WHERE user_id = ?").bind(user.id).first<DoctorRow>();
    return json({ doctor: ownDoctor(saved!) });
  }
  if (path === "/me/status" && method === "POST") {
    if (!user) return signIn();
    const want = String((await body(request)).status);
    const mine = await db.DB.prepare("SELECT * FROM find_doctors WHERE user_id = ?").bind(user.id).first<DoctorRow>();
    if (!mine) return json({ error: "List your practice first." }, 404);
    if (!["live", "paused"].includes(want) || !["live", "paused"].includes(mine.status)) return json({ error: "Your profile can be paused or shown again once it has been approved." }, 400);
    await db.DB.prepare("UPDATE find_doctors SET status = ?, updated_at = ? WHERE id = ?").bind(want, Date.now(), mine.id).run();
    return json({ ok: true, status: want });
  }

  /* booking */
  if (path === "/appointments" && method === "POST") {
    if (!user) return signIn();
    if (!(await allow(db, `find-book:${user.id}`, 10, 86400_000)) || !(await allow(db, `find-book-ip:${clientIp(request)}`, 20, 86400_000))) return json({ error: "That's a lot of bookings for one day. Try again tomorrow." }, 429);
    const b = await body(request);
    const d = await db.DB.prepare("SELECT * FROM find_doctors WHERE slug = ? AND status = 'live'").bind(str(b.slug, 80)).first<DoctorRow>();
    if (!d) return json({ error: "This doctor isn't taking bookings right now." }, 404);
    if (d.user_id === user.id) return json({ error: "You can't book an appointment with yourself." }, 400);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : "", time = hhmm(b.time);
    const mode = b.mode === "video" && d.video ? "video" : "clinic";
    const name = str(b.name, 80), phone = String(b.phone ?? "").replace(/\D/g, "").slice(-10), email = normEmail(b.email) || user.email;
    const age = b.age === "" || b.age == null ? null : int(b.age, 0, 120);
    const h = parseHours(d.hours), now = istNow();
    if (!date || !time || !h) return json({ error: "Choose a date and a time." }, 400);
    if (date < now.date || date > addDays(now.date, BOOK_AHEAD_DAYS) || (date === now.date && mins(time) <= now.min + 30)) return json({ error: "Choose a time at least 30 minutes from now, within the next 30 days." }, 400);
    if (!daySlots(h, date).includes(time)) return json({ error: "The doctor doesn't see patients at that time." }, 400);
    if (name.length < 2) return json({ error: "Enter the patient's name." }, 400);
    if (!/^[6-9]\d{9}$/.test(phone)) return json({ error: "Enter a 10-digit mobile number." }, 400);
    const mineSameDay = await db.DB.prepare("SELECT COUNT(*) AS n FROM find_appointments WHERE user_id = ? AND doctor_id = ? AND date = ? AND status != 'cancelled'").bind(user.id, d.id, date).first<{ n: number }>();
    if (Number(mineSameDay?.n) >= 2) return json({ error: "You already have bookings with this doctor that day." }, 400);
    const aid = id("a"), at = Date.now();
    try {
      await db.DB.prepare("INSERT INTO find_appointments (id, doctor_id, user_id, patient_name, patient_phone, patient_email, patient_age, date, time, mode, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', ?, ?)")
        .bind(aid, d.id, user.id, name, phone, email || null, age, date, time, mode, longStr(b.reason, 400) || null, at, at).run();
    } catch (e) {
      if (/unique|constraint/i.test(String((e as Error)?.message ?? e))) return json({ error: "Someone just booked that time. Please choose another.", taken: true }, 409);
      throw e;
    }
    const when = nice(date, time);
    const where = mode === "video" ? "Video consultation" : `${d.clinic}, ${d.address}, ${d.city}`;
    if (email) await sendEmail(env, email, `Appointment booked: ${d.name}, ${when}`, apptEmail("Your appointment is booked", [["Doctor", `${d.name}, ${d.specialty}`], ["When", when], ["Where", where], ["Patient", name]], "The doctor will confirm it. You can see or cancel it in My appointments on find.aethex.in.")).catch(() => false);
    const owner = await db.DB.prepare("SELECT email FROM users WHERE id = ?").bind(d.user_id).first<{ email: string }>();
    if (owner?.email) await sendEmail(env, owner.email, `New appointment: ${name}, ${when}`, apptEmail("A patient booked an appointment", [["Patient", `${name}${age != null ? `, ${age} y` : ""}`], ["Mobile", phone], ["When", when], ["Type", mode === "video" ? "Video" : "In clinic"], ["Reason", longStr(b.reason, 400) || "Not given"]], "Confirm it in your practice dashboard at find.aethex.in/practice.")).catch(() => false);
    const a = await db.DB.prepare("SELECT * FROM find_appointments WHERE id = ?").bind(aid).first<ApptRow>();
    return json({ appointment: apptOut(a!, { slug: d.slug, name: d.name, specialty: d.specialty, clinic: d.clinic, address: d.address, city: d.city }) });
  }
  if (path === "/appointments" && method === "GET") {
    if (!user) return signIn();
    const { results } = await db.DB.prepare("SELECT a.*, d.slug AS d_slug, d.name AS d_name, d.specialty AS d_specialty, d.clinic AS d_clinic, d.address AS d_address, d.city AS d_city, (SELECT COUNT(*) FROM find_reviews r WHERE r.appointment_id = a.id) AS reviewed FROM find_appointments a JOIN find_doctors d ON d.id = a.doctor_id WHERE a.user_id = ? ORDER BY a.date DESC, a.time DESC LIMIT 200").bind(user.id).all<ApptRow & Record<string, string | number>>();
    return json({ appointments: results.map((a) => ({ ...apptOut(a, { slug: String(a.d_slug), name: String(a.d_name), specialty: String(a.d_specialty), clinic: String(a.d_clinic), address: String(a.d_address), city: String(a.d_city) }), reviewed: Number(a.reviewed) > 0 })) });
  }
  const cancel = /^\/appointments\/([a-z0-9]{6,40})\/cancel$/.exec(path);
  if (cancel && method === "POST") {
    if (!user) return signIn();
    const a = await db.DB.prepare("SELECT a.*, d.user_id AS doctor_user FROM find_appointments a JOIN find_doctors d ON d.id = a.doctor_id WHERE a.id = ?").bind(cancel[1]).first<ApptRow & { doctor_user: string }>();
    if (!a || (a.user_id !== user.id && a.doctor_user !== user.id)) return json({ error: "Appointment not found." }, 404);
    if (!["booked", "confirmed"].includes(a.status)) return json({ error: "This appointment can't be cancelled now." }, 400);
    await db.DB.prepare("UPDATE find_appointments SET status = 'cancelled', note = COALESCE(note, ?), updated_at = ? WHERE id = ?").bind(a.user_id === user.id ? "Cancelled by the patient" : "Cancelled by the doctor", Date.now(), a.id).run();
    return json({ ok: true });
  }
  if (path === "/reviews" && method === "POST") {
    if (!user) return signIn();
    const b = await body(request);
    const a = await db.DB.prepare("SELECT * FROM find_appointments WHERE id = ? AND user_id = ?").bind(str(b.appointmentId, 40), user.id).first<ApptRow>();
    if (!a) return json({ error: "Appointment not found." }, 404);
    if (a.status !== "completed") return json({ error: "You can review a doctor after the doctor marks your visit as completed." }, 400);
    const rating = int(b.rating, 1, 5);
    if (!rating) return json({ error: "Choose 1 to 5 stars." }, 400);
    try {
      await db.DB.prepare("INSERT INTO find_reviews (id, doctor_id, appointment_id, user_id, rating, text, name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id("r"), a.doctor_id, a.id, user.id, rating, longStr(b.text, 800) || null, a.patient_name, Date.now()).run();
    } catch { return json({ error: "You have already reviewed this visit." }, 409); }
    return json({ ok: true });
  }

  /* the doctor's practice dashboard */
  if (path === "/practice/appointments" && method === "GET") {
    if (!user) return signIn();
    const mine = await db.DB.prepare("SELECT * FROM find_doctors WHERE user_id = ?").bind(user.id).first<DoctorRow>();
    if (!mine) return json({ error: "List your practice first.", noProfile: true }, 404);
    const from = /^\d{4}-\d{2}-\d{2}$/.test(String(url.searchParams.get("from"))) ? String(url.searchParams.get("from")) : addDays(istNow().date, -30);
    const { results } = await db.DB.prepare("SELECT * FROM find_appointments WHERE doctor_id = ? AND date >= ? ORDER BY date ASC, time ASC LIMIT 500").bind(mine.id, from).all<ApptRow>();
    const r = await ratings(db, [mine.id]);
    return json({ doctor: ownDoctor(mine), rating: r.get(mine.id) ?? null, today: istNow().date, appointments: results.map((a) => apptOut(a)) });
  }
  const upd = /^\/practice\/appointments\/([a-z0-9]{6,40})$/.exec(path);
  if (upd && method === "POST") {
    if (!user) return signIn();
    const a = await db.DB.prepare("SELECT a.*, d.user_id AS doctor_user, d.name AS d_name FROM find_appointments a JOIN find_doctors d ON d.id = a.doctor_id WHERE a.id = ?").bind(upd[1]).first<ApptRow & { doctor_user: string; d_name: string }>();
    if (!a || a.doctor_user !== user.id) return json({ error: "Appointment not found." }, 404);
    const b = await body(request);
    const status = ["confirmed", "completed", "no-show", "cancelled"].includes(String(b.status)) ? String(b.status) : a.status;
    const link = typeof b.link === "string" ? (/^https:\/\/[^\s<>"]{4,300}$/.test(b.link.trim()) ? b.link.trim() : b.link.trim() === "" ? null : undefined) : a.link;
    if (link === undefined) return json({ error: "The video link must start with https://" }, 400);
    const note = typeof b.note === "string" ? longStr(b.note, 400) || null : a.note;
    await db.DB.prepare("UPDATE find_appointments SET status = ?, link = ?, note = ?, updated_at = ? WHERE id = ?").bind(status, link, note, Date.now(), a.id).run();
    if (status === "confirmed" && a.status !== "confirmed" && a.patient_email) {
      await sendEmail(env, a.patient_email, `Confirmed: ${a.d_name}, ${nice(a.date, a.time)}`, apptEmail("Your appointment is confirmed", [["Doctor", a.d_name], ["When", nice(a.date, a.time)], ...(link ? [["Video link", link] as [string, string]] : [])], "See it in My appointments on find.aethex.in.")).catch(() => false);
    }
    return json({ ok: true });
  }

  /* admin: check and approve doctors */
  if (path === "/admin/doctors" || /^\/admin\/doctors\/[a-z0-9]+$/.test(path)) {
    if (!user) return signIn();
    const admins = adminEmails(env);
    if (!admins.length) return json({ error: "Admin isn't switched on yet. Add your account's email to the ADMIN_EMAILS variable in Cloudflare.", setup: true }, 403);
    if (!admins.includes(normEmail(user.email))) return json({ error: "This account can't approve doctors." }, 403);
    if (path === "/admin/doctors" && method === "GET") {
      const status = ["pending", "live", "paused", "rejected"].includes(String(url.searchParams.get("status"))) ? String(url.searchParams.get("status")) : "pending";
      const { results } = await db.DB.prepare("SELECT d.*, u.email AS email FROM find_doctors d LEFT JOIN users u ON u.id = d.user_id WHERE d.status = ? ORDER BY d.updated_at DESC LIMIT 200").bind(status).all<DoctorRow & { email: string }>();
      const { results: counts } = await db.DB.prepare("SELECT status, COUNT(*) AS n FROM find_doctors GROUP BY status").all<{ status: string; n: number }>();
      return json({ doctors: results.map((d) => ({ ...ownDoctor(d), email: d.email })), counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.n)])) });
    }
    if (method === "POST") {
      const did = path.split("/").pop()!;
      const b = await body(request);
      const status = ["live", "rejected", "pending", "paused"].includes(String(b.status)) ? String(b.status) : null;
      if (!status) return json({ error: "Choose approve or reject." }, 400);
      const d = await db.DB.prepare("SELECT d.*, u.email AS email FROM find_doctors d LEFT JOIN users u ON u.id = d.user_id WHERE d.id = ?").bind(did).first<DoctorRow & { email: string }>();
      if (!d) return json({ error: "Doctor not found." }, 404);
      await db.DB.prepare("UPDATE find_doctors SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?").bind(status, longStr(b.note, 400) || null, Date.now(), d.id).run();
      if (d.email && (status === "live" || status === "rejected")) {
        await sendEmail(env, d.email, status === "live" ? "Your practice is now listed on Aethex Find" : "About your Aethex Find listing", apptEmail(status === "live" ? "You're listed" : "We couldn't list your practice yet", [["Doctor", d.name], ["Specialty", d.specialty], ...(longStr(b.note, 400) ? [["Note", longStr(b.note, 400)] as [string, string]] : [])], status === "live" ? "Patients can now find you and book appointments. Manage them at find.aethex.in/practice." : "Update your details at find.aethex.in/list-your-practice and we'll check them again.")).catch(() => false);
      }
      return json({ ok: true });
    }
  }
  return json({ error: "Not found" }, 404);
}
