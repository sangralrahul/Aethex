// Update 77: a student's study record (daily goal and streak, answers by subject, the revision deck of wrong answers,
// bookmarks and notes), kept with the account so it follows them across devices. The site keeps a copy in the
// browser and merges the two (artifacts/aethex/src/lib/study/merge.ts); this side merges too, so two devices saving
// at once lose nothing. Table created on first use. Routes: GET and PUT /api/study/state.
import { allow, currentUser, type AuthEnv, type D1Like } from "./auth";
import { QUESTIONS } from "../artifacts/aethex/src/data/neetpgQuestions";
import { blankStudy, mergeStates, type StudyState } from "../artifacts/aethex/src/lib/study/merge";

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store, private" } });
const MAX_BYTES = 900_000;
let ready: Promise<void> | null = null;
function ensure(db: D1Like) {
  if (!ready) ready = (async () => {
    await db.prepare("CREATE TABLE IF NOT EXISTS study_state (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
    // update 81: mock test results (scored here, from the answers), and who shows on the leaderboard
    await db.prepare(`CREATE TABLE IF NOT EXISTS study_mock (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, at INTEGER NOT NULL, total INTEGER NOT NULL, correct INTEGER NOT NULL,
      wrong INTEGER NOT NULL, skipped INTEGER NOT NULL, marks INTEGER NOT NULL, max_marks INTEGER NOT NULL, seconds INTEGER NOT NULL, subjects TEXT NOT NULL)`).run();
    await db.prepare("CREATE INDEX IF NOT EXISTS study_mock_user ON study_mock(user_id, at)").run();
    await db.prepare("CREATE INDEX IF NOT EXISTS study_mock_at ON study_mock(at)").run();
    await db.prepare("CREATE TABLE IF NOT EXISTS study_board (user_id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, show INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)").run();
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

/** Keeps only the fields and shapes the site writes. */
function clean(raw: unknown): StudyState | null {
  const s = raw as Partial<StudyState> | null;
  if (!s || typeof s !== "object" || s.v !== 1) return null;
  const obj = (x: unknown) => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
  const days: Record<string, number> = {};
  for (const [d, n] of Object.entries(obj(s.days))) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Number(n))) days[d] = Math.max(0, Math.min(5000, Math.round(Number(n))));
  return {
    ...blankStudy(),
    goal: Math.max(5, Math.min(500, Math.round(Number(s.goal) || 30))), goalAt: Number(s.goalAt) || 0, days,
    attempts: Array.isArray(s.attempts) ? s.attempts.filter((a) => a && typeof a.key === "string" && typeof a.at === "number").map((a) => ({ key: String(a.key).slice(0, 120), subject: String(a.subject ?? "").slice(0, 60), correct: !!a.correct, at: a.at })) : [],
    wrong: obj(s.wrong) as StudyState["wrong"], bookmarks: obj(s.bookmarks) as StudyState["bookmarks"], updatedAt: Number(s.updatedAt) || 0,
    cards: obj(s.cards) as NonNullable<StudyState["cards"]>,
    exam: s.exam && typeof s.exam === "object" && /^(\d{4}-\d{2}-\d{2})?$/.test(String(s.exam.date ?? "")) ? { name: String(s.exam.name ?? "").slice(0, 40), date: String(s.exam.date ?? ""), at: Number(s.exam.at) || 0 } : null,
  };
}

export async function handleStudy(request: Request, env: AuthEnv & { DB?: D1Like }): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/^\/api\/study/, "").replace(/\/+$/, "");
  if (!["/state", "/mock", "/leaderboard", "/board"].includes(path)) return json({ error: "Not found" }, 404);
  if (!env.DB) return json({ error: "The study record isn't switched on yet: the site's database isn't connected." }, 503);
  await ensure(env.DB);
  if (path === "/leaderboard" && request.method === "GET") return leaderboard(env as AuthEnv & { DB: D1Like }, request);
  const user = await currentUser(request, env as AuthEnv & { DB: D1Like });
  if (!user) return json({ error: "Sign in to keep your study record in your account.", signIn: true }, 401);
  if (path === "/mock") return mock(env as AuthEnv & { DB: D1Like }, request, user);
  if (path === "/board") return board(env as AuthEnv & { DB: D1Like }, request, user);
  const row = await env.DB.prepare("SELECT data FROM study_state WHERE user_id = ?").bind(user.id).first<{ data: string }>();
  const stored = row ? clean(JSON.parse(row.data)) : null;
  if (request.method === "GET") return json({ state: stored });
  if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "Your study record is too large to save. Clear some answered revision questions." }, 413);
  let incoming: StudyState | null = null;
  try { incoming = clean(JSON.parse(text)); } catch { /* bad JSON */ }
  if (!incoming) return json({ error: "That isn't a study record." }, 400);
  const merged = stored ? mergeStates(stored, incoming) : incoming;
  const out = JSON.stringify(merged);
  if (out.length > MAX_BYTES) return json({ error: "Your study record is too large to save." }, 413);
  await env.DB.prepare("INSERT INTO study_state (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").bind(user.id, out, Date.now()).run();
  return json({ ok: true, state: merged });
}

/* ------------------------------------------------------------------ update 81: mock tests and the leaderboard */

type DB = AuthEnv & { DB: D1Like };
type User = { id: string; name?: string | null; email: string };
const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
const MIN_FOR_BOARD = 25;
const MIN_TAKERS_FOR_PERCENTILE = 20;
const rid = () => `m${Date.now().toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(36)).join("").slice(0, 6)}`;

/** Each person's best score (as % of the maximum marks) in a period, papers of 25+ questions only. */
async function bests(db: DB, since: number) {
  const { results } = await db.DB.prepare(`SELECT user_id, MAX(CAST(marks AS REAL) / max_marks) AS best, COUNT(*) AS n FROM study_mock WHERE at >= ? AND total >= ? GROUP BY user_id`).bind(since, MIN_FOR_BOARD).all<{ user_id: string; best: number; n: number }>();
  return results.map((r) => ({ user: r.user_id, best: Number(r.best), n: Number(r.n) }));
}
/** The share of other people in the last 90 days whose best is below this score; null until enough people have taken tests. */
async function percentile(db: DB, userId: string, pct: number) {
  const all = (await bests(db, Date.now() - 90 * 86400_000)).filter((x) => x.user !== userId);
  if (all.length < MIN_TAKERS_FOR_PERCENTILE) return { percentile: null as number | null, takers: all.length + 1 };
  const below = all.filter((x) => x.best < pct).length;
  return { percentile: Math.round((below / all.length) * 100), takers: all.length + 1 };
}

async function mock(db: DB, request: Request, user: User): Promise<Response> {
  if (request.method === "GET") {
    const { results } = await db.DB.prepare("SELECT * FROM study_mock WHERE user_id = ? ORDER BY at DESC LIMIT 30").bind(user.id).all<Record<string, number | string>>();
    const history = results.map((r) => ({ id: r.id, at: Number(r.at), total: Number(r.total), correct: Number(r.correct), wrong: Number(r.wrong), skipped: Number(r.skipped), marks: Number(r.marks), maxMarks: Number(r.max_marks), seconds: Number(r.seconds), subjects: JSON.parse(String(r.subjects)) }));
    const last = history[0];
    const pc = last && last.total >= MIN_FOR_BOARD ? await percentile(db, user.id, last.marks / last.maxMarks) : { percentile: null, takers: 0 };
    const b = await db.DB.prepare("SELECT name, city, show FROM study_board WHERE user_id = ?").bind(user.id).first<{ name: string; city: string | null; show: number }>();
    return json({ history, ...pc, board: b ? { name: b.name, city: b.city, show: !!b.show } : null });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await allow(db, `study:mock:${user.id}`, 40, 86400_000))) return json({ error: "That's a lot of tests for one day. Please try again tomorrow." }, 429);
  let b: { answers?: { id: number; choice: number | null }[]; seconds?: number } = {};
  try { b = await request.json(); } catch { /* below */ }
  const answers = Array.isArray(b.answers) ? b.answers : [];
  const seen = new Set<number>();
  const scored: { subject: string; ok: boolean | null }[] = [];
  for (const a of answers.slice(0, 200)) {
    const q = byId.get(Number(a?.id));
    if (!q || seen.has(q.id)) return json({ error: "That paper doesn't match the question bank." }, 400);
    seen.add(q.id);
    const c = a.choice === null || a.choice === undefined ? null : Number(a.choice);
    if (c !== null && ![0, 1, 2, 3].includes(c)) return json({ error: "That paper doesn't match the question bank." }, 400);
    scored.push({ subject: q.subject, ok: c === null ? null : c === q.correct });
  }
  if (scored.length < 10) return json({ error: "A mock test has at least 10 questions." }, 400);
  const correct = scored.filter((x) => x.ok === true).length, wrong = scored.filter((x) => x.ok === false).length, skipped = scored.length - correct - wrong;
  const marks = correct * 4 - wrong, maxMarks = scored.length * 4;
  const seconds = Math.max(0, Math.min(6 * 3600, Math.round(Number(b.seconds) || 0)));
  const subj = new Map<string, { subject: string; n: number; right: number; wrong: number }>();
  for (const x of scored) { const v = subj.get(x.subject) ?? { subject: x.subject, n: 0, right: 0, wrong: 0 }; v.n++; if (x.ok === true) v.right++; if (x.ok === false) v.wrong++; subj.set(x.subject, v); }
  const subjects = [...subj.values()];
  const id = rid(), at = Date.now();
  await db.DB.prepare("INSERT INTO study_mock (id, user_id, at, total, correct, wrong, skipped, marks, max_marks, seconds, subjects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, user.id, at, scored.length, correct, wrong, skipped, marks, maxMarks, seconds, JSON.stringify(subjects)).run();
  const pc = scored.length >= MIN_FOR_BOARD ? await percentile(db, user.id, marks / maxMarks) : { percentile: null, takers: 0 };
  return json({ result: { id, at, total: scored.length, correct, wrong, skipped, marks, maxMarks, seconds, subjects }, ...pc });
}

async function board(db: DB, request: Request, user: User): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let b: { show?: unknown; name?: unknown; city?: unknown } = {};
  try { b = await request.json(); } catch { /* below */ }
  const name = String(b.name ?? "").replace(/\s+/g, " ").trim().slice(0, 30);
  const city = String(b.city ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  const show = b.show === true;
  if (show && name.length < 2) return json({ error: "Choose the name to show, like \"Asha K.\"", field: "name" }, 400);
  await db.DB.prepare("INSERT INTO study_board (user_id, name, city, show, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET name = excluded.name, city = excluded.city, show = excluded.show, updated_at = excluded.updated_at")
    .bind(user.id, name || "Student", city || null, show ? 1 : 0, Date.now()).run();
  return json({ ok: true, board: { name: name || "Student", city: city || null, show } });
}

async function leaderboard(db: DB, request: Request): Promise<Response> {
  const period = new URL(request.url).searchParams.get("period");
  const days = period === "month" ? 30 : period === "all" ? 3650 : 7;
  const since = Date.now() - days * 86400_000;
  const { results } = await db.DB.prepare(`SELECT b.name, b.city, m.user_id, MAX(CAST(m.marks AS REAL) / m.max_marks) AS best, COUNT(*) AS tests, SUM(m.total) AS answered
    FROM study_mock m JOIN study_board b ON b.user_id = m.user_id AND b.show = 1
    WHERE m.at >= ? AND m.total >= ? GROUP BY m.user_id ORDER BY best DESC, answered DESC LIMIT 20`).bind(since, MIN_FOR_BOARD).all<{ name: string; city: string | null; user_id: string; best: number; tests: number; answered: number }>();
  const me = await currentUser(request, db).catch(() => null);
  return json({
    period: days === 7 ? "week" : days === 30 ? "month" : "all", minQuestions: MIN_FOR_BOARD,
    rows: results.map((r, i) => ({ rank: i + 1, name: r.name, city: r.city, best: Math.round(Number(r.best) * 1000) / 10, tests: Number(r.tests), answered: Number(r.answered), you: !!me && me.id === r.user_id })),
  });
}
