// Update 85: study groups (join code, weekly board from each member's study record, a group test scored here),
// discussions under each question of the NEET-PG bank (signed in, moderated: reports hide a post, admins decide),
// and sectional tests (one subject, timed, scored here, with each subject's history). Tables created on first use.
// Routes under /api/study: /groups…, /comments…, /sectional.
import { allow, currentUser, escapeHtml, normEmail, sendEmail, shell, type AuthEnv, type D1Like } from "./auth";
import { QUESTIONS } from "../artifacts/aethex/src/data/neetpgQuestions";
import { blankStudy, type StudyState } from "../artifacts/aethex/src/lib/study/merge";

type Env = AuthEnv & { DB: D1Like; ADMIN_EMAILS?: string };
type User = { id: string; name?: string | null; email: string };
const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store, private" } });
const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const nid = (p: string) => `${p}${Date.now().toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 7)}`;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
const istDay = (at = Date.now()) => new Date(at + 330 * 60000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const admins = (env: Env) => String(env.ADMIN_EMAILS || "").split(/[,;\s]+/).map(normEmail).filter(Boolean);
const isAdmin = (env: Env, u: User | null) => !!u && admins(env).includes(normEmail(u.email));
export const GROUP_MAX_MEMBERS = 50, GROUP_MAX_PER_USER = 10;

let ready: Promise<void> | null = null;
function ensure(db: D1Like) {
  if (!ready) ready = (async () => {
    for (const sql of [
      `CREATE TABLE IF NOT EXISTS study_groups (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, owner_id TEXT NOT NULL, test TEXT, created_at INTEGER NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS study_group_members (group_id TEXT NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, joined_at INTEGER NOT NULL, PRIMARY KEY (group_id, user_id))`,
      "CREATE INDEX IF NOT EXISTS study_group_members_user ON study_group_members(user_id)",
      `CREATE TABLE IF NOT EXISTS study_group_results (group_id TEXT NOT NULL, test_id TEXT NOT NULL, user_id TEXT NOT NULL, total INTEGER NOT NULL, correct INTEGER NOT NULL, wrong INTEGER NOT NULL,
        marks INTEGER NOT NULL, max_marks INTEGER NOT NULL, seconds INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (group_id, test_id, user_id))`,
      `CREATE TABLE IF NOT EXISTS study_comments (id TEXT PRIMARY KEY, qkey TEXT NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL,
        hidden INTEGER, reports INTEGER NOT NULL DEFAULT 0, helpful INTEGER NOT NULL DEFAULT 0)`,
      "CREATE INDEX IF NOT EXISTS study_comments_q ON study_comments(qkey, created_at)",
      `CREATE TABLE IF NOT EXISTS study_comment_flags (comment_id TEXT NOT NULL, user_id TEXT NOT NULL, kind TEXT NOT NULL, reason TEXT, at INTEGER NOT NULL, PRIMARY KEY (comment_id, user_id, kind))`,
    ]) await db.prepare(sql).run();
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

/** Score a paper of bank question ids against the bank; null if it doesn't match it. */
function score(raw: unknown, onlySubject?: string, allowed?: Set<number>) {
  const answers = Array.isArray(raw) ? raw : [];
  const seen = new Set<number>();
  let correct = 0, wrong = 0;
  for (const a of answers.slice(0, 200) as { id?: unknown; choice?: unknown }[]) {
    const q = byId.get(Number(a?.id));
    if (!q || seen.has(q.id) || (onlySubject && q.subject !== onlySubject) || (allowed && !allowed.has(q.id))) return null;
    seen.add(q.id);
    const c = a.choice === null || a.choice === undefined ? null : Number(a.choice);
    if (c !== null && ![0, 1, 2, 3].includes(c)) return null;
    if (c === null) continue;
    if (c === q.correct) correct++; else wrong++;
  }
  const total = seen.size;
  return { total, correct, wrong, skipped: total - correct - wrong, marks: correct * 4 - wrong, maxMarks: total * 4 };
}

/* ------------------------------------------------------------------ study groups */

type GroupRow = { id: string; code: string; name: string; owner_id: string; test: string | null; created_at: number };
type GroupTest = { id: string; title: string; qids: number[]; at: number; until: number; by: string };
const parseTest = (t: string | null): GroupTest | null => { try { return t ? (JSON.parse(t) as GroupTest) : null; } catch { return null; } };

/** This week's questions (last 7 India days) and the current streak, from a member's study record. */
function weekOf(data: string | null, goalDefault = 30) {
  let s: StudyState = blankStudy();
  try { if (data) s = { ...blankStudy(), ...JSON.parse(data) }; } catch { /* blank */ }
  const today = istDay();
  let week = 0;
  for (let i = 0; i < 7; i++) week += Number(s.days?.[addDays(today, -i)] ?? 0);
  let streak = 0;
  for (let d = (s.days?.[today] ?? 0) > 0 ? today : addDays(today, -1); (s.days?.[d] ?? 0) > 0 && streak < 400; d = addDays(d, -1)) streak++;
  return { week, streak, today: Number(s.days?.[today] ?? 0), goal: s.goal || goalDefault };
}

async function groupView(env: Env, g: GroupRow, me: User) {
  const { results: mem } = await env.DB.prepare("SELECT m.user_id, m.name, m.joined_at, s.data FROM study_group_members m LEFT JOIN study_state s ON s.user_id = m.user_id WHERE m.group_id = ? ORDER BY m.joined_at").bind(g.id).all<{ user_id: string; name: string; joined_at: number; data: string | null }>();
  const since = Date.now() - 7 * 86400_000;
  const ids = mem.map((m) => m.user_id);
  const { results: mocks } = ids.length ? await env.DB.prepare(`SELECT user_id, MAX(CAST(marks AS REAL) / max_marks) AS best, COUNT(*) AS n FROM study_mock WHERE at >= ? AND section IS NULL AND user_id IN (${ids.map(() => "?").join(",")}) GROUP BY user_id`).bind(since, ...ids).all<{ user_id: string; best: number; n: number }>() : { results: [] };
  const mk = new Map(mocks.map((m) => [m.user_id, m]));
  const members = mem.map((m) => {
    const w = weekOf(m.data);
    const x = mk.get(m.user_id);
    return { id: m.user_id, name: m.name, you: m.user_id === me.id, owner: m.user_id === g.owner_id, week: w.week, streak: w.streak, today: w.today, tests: Number(x?.n ?? 0), best: x ? Math.round(Number(x.best) * 1000) / 10 : null, joinedAt: m.joined_at };
  }).sort((a, b) => b.week - a.week || b.streak - a.streak || a.joinedAt - b.joinedAt);
  const t = parseTest(g.test);
  let test = null;
  if (t) {
    const { results: rs } = await env.DB.prepare("SELECT r.*, m.name FROM study_group_results r LEFT JOIN study_group_members m ON m.group_id = r.group_id AND m.user_id = r.user_id WHERE r.group_id = ? AND r.test_id = ? ORDER BY r.marks DESC, r.seconds ASC").bind(g.id, t.id).all<{ user_id: string; name: string | null; total: number; correct: number; wrong: number; marks: number; max_marks: number; seconds: number; at: number }>();
    test = { id: t.id, title: t.title, qids: t.qids, count: t.qids.length, at: t.at, until: t.until, open: Date.now() < t.until, done: rs.some((r) => r.user_id === me.id),
      results: rs.map((r, i) => ({ rank: i + 1, name: r.name ?? "Former member", you: r.user_id === me.id, correct: r.correct, wrong: r.wrong, total: r.total, marks: r.marks, maxMarks: r.max_marks, seconds: r.seconds })) };
  }
  return { group: { id: g.id, name: g.name, code: g.code, owner: g.owner_id === me.id, createdAt: g.created_at, max: GROUP_MAX_MEMBERS }, members, test };
}

async function displayName(env: Env, user: User, asked: unknown) {
  const a = str(asked, 30);
  if (a.length >= 2) return a;
  const b = await env.DB.prepare("SELECT name FROM study_board WHERE user_id = ?").bind(user.id).first<{ name: string }>().catch(() => null);
  return b?.name || str(user.name ?? "", 30).split(" ")[0] || "Student";
}

async function groups(env: Env, request: Request, user: User, path: string): Promise<Response> {
  const method = request.method;
  const body = async () => { try { return (await request.json()) as Record<string, unknown>; } catch { return {}; } };
  if (path === "/groups" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT g.*, (SELECT COUNT(*) FROM study_group_members x WHERE x.group_id = g.id) AS n FROM study_groups g JOIN study_group_members m ON m.group_id = g.id AND m.user_id = ? ORDER BY m.joined_at DESC").bind(user.id).all<GroupRow & { n: number }>();
    return json({ groups: results.map((g) => ({ id: g.id, name: g.name, code: g.code, members: Number(g.n), owner: g.owner_id === user.id, test: !!parseTest(g.test) && Date.now() < (parseTest(g.test)?.until ?? 0) })) });
  }
  if ((path === "/groups" || path === "/groups/join") && method === "POST") {
    if (!(await allow(env, `study:group:${user.id}`, 20, 86400_000))) return json({ error: "That's a lot of groups for one day." }, 429);
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM study_group_members WHERE user_id = ?").bind(user.id).first<{ n: number }>();
    if (Number(n?.n) >= GROUP_MAX_PER_USER) return json({ error: `You can be in up to ${GROUP_MAX_PER_USER} groups. Leave one to join another.` }, 400);
    const b = await body();
    const name = await displayName(env, user, b.display);
    if (path === "/groups") {
      const gname = str(b.name, 50);
      if (gname.length < 2) return json({ error: "Name the group, e.g. \"AIIMS 2026 batch\".", field: "name" }, 400);
      let code = newCode();
      for (let i = 0; i < 5 && (await env.DB.prepare("SELECT 1 FROM study_groups WHERE code = ?").bind(code).first()); i++) code = newCode();
      const id = nid("g"), now = Date.now();
      await env.DB.prepare("INSERT INTO study_groups (id, code, name, owner_id, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, code, gname, user.id, now).run();
      await env.DB.prepare("INSERT INTO study_group_members (group_id, user_id, name, joined_at) VALUES (?, ?, ?, ?)").bind(id, user.id, name, now).run();
      return json(await groupView(env, (await env.DB.prepare("SELECT * FROM study_groups WHERE id = ?").bind(id).first<GroupRow>())!, user), 201);
    }
    const code = str(b.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const g = code.length === 6 ? await env.DB.prepare("SELECT * FROM study_groups WHERE code = ?").bind(code).first<GroupRow>() : null;
    if (!g) return json({ error: "No group has that code. Check it with whoever shared it.", field: "code" }, 404);
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM study_group_members WHERE group_id = ?").bind(g.id).first<{ n: number }>();
    const already = await env.DB.prepare("SELECT 1 FROM study_group_members WHERE group_id = ? AND user_id = ?").bind(g.id, user.id).first();
    if (!already && Number(count?.n) >= GROUP_MAX_MEMBERS) return json({ error: `This group is full (${GROUP_MAX_MEMBERS} members).` }, 400);
    if (!already) await env.DB.prepare("INSERT INTO study_group_members (group_id, user_id, name, joined_at) VALUES (?, ?, ?, ?)").bind(g.id, user.id, name, Date.now()).run();
    return json(await groupView(env, g, user));
  }
  const m = /^\/groups\/(g[a-z0-9]{6,30})(?:\/(leave|remove|test|answers|rename))?$/.exec(path);
  if (!m) return json({ error: "Not found" }, 404);
  const g = await env.DB.prepare("SELECT g.* FROM study_groups g JOIN study_group_members m ON m.group_id = g.id AND m.user_id = ? WHERE g.id = ?").bind(user.id, m[1]).first<GroupRow>();
  if (!g) return json({ error: "You're not in this group." }, 404);
  const act = m[2];
  if (!act && method === "GET") return json(await groupView(env, g, user));
  if (method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = await body();
  if (act === "leave") {
    await env.DB.prepare("DELETE FROM study_group_members WHERE group_id = ? AND user_id = ?").bind(g.id, user.id).run();
    const left = await env.DB.prepare("SELECT user_id FROM study_group_members WHERE group_id = ? ORDER BY joined_at LIMIT 1").bind(g.id).first<{ user_id: string }>();
    if (!left) { await env.DB.prepare("DELETE FROM study_groups WHERE id = ?").bind(g.id).run(); await env.DB.prepare("DELETE FROM study_group_results WHERE group_id = ?").bind(g.id).run(); }
    else if (g.owner_id === user.id) await env.DB.prepare("UPDATE study_groups SET owner_id = ? WHERE id = ?").bind(left.user_id, g.id).run();
    return json({ ok: true });
  }
  if (act === "remove") {
    if (g.owner_id !== user.id) return json({ error: "Only the person who runs the group can remove members." }, 403);
    const who = str(b.userId, 80);
    if (who === user.id) return json({ error: "Leave the group instead." }, 400);
    await env.DB.prepare("DELETE FROM study_group_members WHERE group_id = ? AND user_id = ?").bind(g.id, who).run();
    return json(await groupView(env, g, user));
  }
  if (act === "rename") {
    if (g.owner_id !== user.id) return json({ error: "Only the person who runs the group can rename it." }, 403);
    const gname = str(b.name, 50);
    if (gname.length < 2) return json({ error: "Name the group.", field: "name" }, 400);
    await env.DB.prepare("UPDATE study_groups SET name = ? WHERE id = ?").bind(gname, g.id).run();
    return json(await groupView(env, { ...g, name: gname }, user));
  }
  if (act === "test") {
    if (g.owner_id !== user.id) return json({ error: "Only the person who runs the group sets the group test." }, 403);
    const subjects = Array.isArray(b.subjects) ? b.subjects.map((x) => String(x)) : [];
    const pool = QUESTIONS.filter((q) => !subjects.length || subjects.includes(q.subject));
    const count = Math.max(5, Math.min(50, Math.round(Number(b.count) || 10)));
    if (pool.length < 5) return json({ error: "Choose subjects with at least 5 questions between them." }, 400);
    const pick = [...pool].map((q) => [crypto.getRandomValues(new Uint32Array(1))[0]!, q] as const).sort((a, c) => a[0] - c[0]).slice(0, count).map(([, q]) => q.id);
    const days = Math.max(1, Math.min(14, Math.round(Number(b.days) || 7)));
    const t: GroupTest = { id: nid("t"), title: str(b.title, 60) || (subjects.length === 1 ? `${subjects[0]} test` : "Group test"), qids: pick, at: Date.now(), until: Date.now() + days * 86400_000, by: user.id };
    await env.DB.prepare("UPDATE study_groups SET test = ? WHERE id = ?").bind(JSON.stringify(t), g.id).run();
    return json(await groupView(env, { ...g, test: JSON.stringify(t) }, user));
  }
  if (act === "answers") {
    const t = parseTest(g.test);
    if (!t) return json({ error: "There's no group test right now." }, 404);
    if (Date.now() > t.until) return json({ error: "This group test has closed." }, 400);
    if (await env.DB.prepare("SELECT 1 FROM study_group_results WHERE group_id = ? AND test_id = ? AND user_id = ?").bind(g.id, t.id, user.id).first()) return json({ error: "You've taken this test already." }, 409);
    const s = score(b.answers, undefined, new Set(t.qids));
    if (!s || s.total !== t.qids.length) return json({ error: "That paper doesn't match the group test." }, 400);
    const seconds = Math.max(0, Math.min(6 * 3600, Math.round(Number(b.seconds) || 0)));
    await env.DB.prepare("INSERT INTO study_group_results (group_id, test_id, user_id, total, correct, wrong, marks, max_marks, seconds, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(g.id, t.id, user.id, s.total, s.correct, s.wrong, s.marks, s.maxMarks, seconds, Date.now()).run();
    return json({ result: { ...s, seconds }, ...(await groupView(env, g, user)) });
  }
  return json({ error: "Not found" }, 404);
}

/* ------------------------------------------------------------------ discussions under questions */

const QKEY = /^neetpg:(\d{1,4})$/;
const REPORT_HIDE_AT = 3;
async function comments(env: Env, request: Request, user: User | null, path: string): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const out = (c: { id: string; user_id: string; name: string; body: string; created_at: number; helpful: number; hidden: number | null; reports: number }, mine: Set<string>) =>
    ({ id: c.id, name: c.name, body: c.body, at: c.created_at, helpful: c.helpful, you: !!user && c.user_id === user.id, votedHelpful: mine.has(c.id), hidden: !!c.hidden, reports: isAdmin(env, user) ? c.reports : undefined });
  if (path === "/comments" && method === "GET") {
    const q = str(url.searchParams.get("q"), 20);
    if (!QKEY.test(q)) return json({ comments: [] });
    const admin = isAdmin(env, user);
    const { results } = await env.DB.prepare(`SELECT * FROM study_comments WHERE qkey = ?${admin ? "" : " AND hidden IS NULL"} ORDER BY helpful DESC, created_at ASC LIMIT 100`).bind(q).all<{ id: string; user_id: string; name: string; body: string; created_at: number; helpful: number; hidden: number | null; reports: number }>();
    const mine = new Set<string>();
    if (user && results.length) {
      const { results: v } = await env.DB.prepare(`SELECT comment_id FROM study_comment_flags WHERE user_id = ? AND kind = 'helpful' AND comment_id IN (${results.map(() => "?").join(",")})`).bind(user.id, ...results.map((r) => r.id)).all<{ comment_id: string }>();
      v.forEach((x) => mine.add(x.comment_id));
    }
    return json({ comments: results.map((c) => out(c, mine)), admin, signedIn: !!user });
  }
  if (path === "/comments/reported" && method === "GET") {
    if (!isAdmin(env, user)) return json({ error: "Admins only." }, 403);
    const { results } = await env.DB.prepare("SELECT * FROM study_comments WHERE reports > 0 OR hidden IS NOT NULL ORDER BY created_at DESC LIMIT 200").all<{ id: string; qkey: string; user_id: string; name: string; body: string; created_at: number; helpful: number; hidden: number | null; reports: number }>();
    return json({ comments: results.map((c) => ({ ...out(c, new Set()), q: c.qkey, question: byId.get(Number(QKEY.exec(c.qkey)?.[1]))?.question ?? "" })) });
  }
  if (!user) return json({ error: "Sign in to join the discussion.", signIn: true }, 401);
  if (path === "/comments" && method === "POST") {
    let b: Record<string, unknown> = {};
    try { b = await request.json(); } catch { /* below */ }
    const q = str(b.q, 20), qm = QKEY.exec(q);
    if (!qm || !byId.has(Number(qm[1]))) return json({ error: "Discussions are for questions in the NEET-PG bank." }, 400);
    const text = typeof b.body === "string" ? b.body.replace(/\r/g, "").trim().slice(0, 800) : "";
    if (text.length < 3) return json({ error: "Write a little more.", field: "body" }, 400);
    if (/https?:\/\/|www\.|\b[\w.-]+\.(com|in|net|org|io|xyz)\b/i.test(text)) return json({ error: "Links aren't allowed in discussions. Name the book or source instead.", field: "body" }, 400);
    if (/(\+?91[\s-]?)?[6-9]\d{9}\b|@[a-z0-9-]+\.[a-z]/i.test(text)) return json({ error: "Please don't share phone numbers or emails here.", field: "body" }, 400);
    if (!(await allow(env, `study:comment:${user.id}`, 20, 86400_000))) return json({ error: "That's a lot of posts for one day. Please come back tomorrow." }, 429);
    const name = await displayName(env, user, b.name);
    const id = nid("c");
    await env.DB.prepare("INSERT INTO study_comments (id, qkey, user_id, name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, q, user.id, name, text, Date.now()).run();
    return json({ ok: true, id }, 201);
  }
  const cm = /^\/comments\/(c[a-z0-9]{6,30})\/(helpful|report|delete|restore|hide)$/.exec(path);
  if (!cm || method !== "POST") return json({ error: "Not found" }, 404);
  const c = await env.DB.prepare("SELECT * FROM study_comments WHERE id = ?").bind(cm[1]).first<{ id: string; user_id: string; qkey: string; body: string; reports: number; hidden: number | null }>();
  if (!c) return json({ error: "Post not found." }, 404);
  const act = cm[2];
  if (act === "helpful") {
    if (c.user_id === user.id) return json({ error: "You can't vote for your own post." }, 400);
    const had = await env.DB.prepare("SELECT 1 FROM study_comment_flags WHERE comment_id = ? AND user_id = ? AND kind = 'helpful'").bind(c.id, user.id).first();
    if (had) await env.DB.prepare("DELETE FROM study_comment_flags WHERE comment_id = ? AND user_id = ? AND kind = 'helpful'").bind(c.id, user.id).run();
    else await env.DB.prepare("INSERT INTO study_comment_flags (comment_id, user_id, kind, at) VALUES (?, ?, 'helpful', ?)").bind(c.id, user.id, Date.now()).run();
    await env.DB.prepare("UPDATE study_comments SET helpful = (SELECT COUNT(*) FROM study_comment_flags WHERE comment_id = ? AND kind = 'helpful') WHERE id = ?").bind(c.id, c.id).run();
    return json({ ok: true, voted: !had });
  }
  if (act === "report") {
    if (c.user_id === user.id) return json({ error: "Delete your own post instead." }, 400);
    try { await env.DB.prepare("INSERT INTO study_comment_flags (comment_id, user_id, kind, reason, at) VALUES (?, ?, 'report', ?, ?)").bind(c.id, user.id, str((await request.json().catch(() => ({})) as Record<string, unknown>).reason, 80) || null, Date.now()).run(); }
    catch { return json({ ok: true, already: true }); }
    const n = Number((await env.DB.prepare("SELECT COUNT(*) AS n FROM study_comment_flags WHERE comment_id = ? AND kind = 'report'").bind(c.id).first<{ n: number }>())?.n ?? 0);
    await env.DB.prepare(`UPDATE study_comments SET reports = ?${n >= REPORT_HIDE_AT ? ", hidden = COALESCE(hidden, ?)" : ""} WHERE id = ?`).bind(...(n >= REPORT_HIDE_AT ? [n, Date.now(), c.id] : [n, c.id])).run();
    if (n === 1 || n === REPORT_HIDE_AT) { const a = admins(env)[0]; if (a) await sendEmail(env, a, `A study discussion post was reported${n >= REPORT_HIDE_AT ? " and hidden" : ""}`, shell(`<p style="margin:0 0 8px;font-size:14px;">${escapeHtml(c.body.slice(0, 400))}</p><p style="margin:0;font-size:14px;"><a href="https://study.aethex.in/study-moderation">Review reported posts</a></p>`)).catch(() => false); }
    return json({ ok: true, hidden: n >= REPORT_HIDE_AT });
  }
  if (act === "delete") {
    if (c.user_id !== user.id && !isAdmin(env, user)) return json({ error: "You can delete only your own posts." }, 403);
    await env.DB.prepare("DELETE FROM study_comments WHERE id = ?").bind(c.id).run();
    await env.DB.prepare("DELETE FROM study_comment_flags WHERE comment_id = ?").bind(c.id).run();
    return json({ ok: true });
  }
  if (!isAdmin(env, user)) return json({ error: "Admins only." }, 403);
  await env.DB.prepare("UPDATE study_comments SET hidden = ?, reports = CASE WHEN ? IS NULL THEN 0 ELSE reports END WHERE id = ?").bind(act === "hide" ? Date.now() : null, act === "hide" ? Date.now() : null, c.id).run();
  if (act === "restore") await env.DB.prepare("DELETE FROM study_comment_flags WHERE comment_id = ? AND kind = 'report'").bind(c.id).run();
  return json({ ok: true });
}

/* ------------------------------------------------------------------ sectional tests */

async function sectional(env: Env, request: Request, user: User): Promise<Response> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT section, at, total, correct, wrong, skipped, marks, max_marks, seconds FROM study_mock WHERE user_id = ? AND section IS NOT NULL ORDER BY at DESC LIMIT 300").bind(user.id).all<{ section: string; at: number; total: number; correct: number; wrong: number; skipped: number; marks: number; max_marks: number; seconds: number }>();
    const by = new Map<string, { at: number; total: number; correct: number; wrong: number; skipped: number; marks: number; maxMarks: number; seconds: number; pct: number }[]>();
    for (const r of results) { const l = by.get(r.section) ?? []; if (l.length < 12) l.push({ at: r.at, total: r.total, correct: r.correct, wrong: r.wrong, skipped: r.skipped, marks: r.marks, maxMarks: r.max_marks, seconds: r.seconds, pct: Math.round((Math.max(0, r.marks) / r.max_marks) * 1000) / 10 }); by.set(r.section, l); }
    return json({ subjects: [...by.entries()].map(([subject, tests]) => ({ subject, tests, best: Math.max(...tests.map((t) => t.pct)), last: tests[0]!.pct })) });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await allow(env, `study:sectional:${user.id}`, 60, 86400_000))) return json({ error: "That's a lot of tests for one day. Please try again tomorrow." }, 429);
  let b: Record<string, unknown> = {};
  try { b = await request.json(); } catch { /* below */ }
  const subject = str(b.subject, 60);
  if (!QUESTIONS.some((q) => q.subject === subject)) return json({ error: "Choose a subject from the bank." }, 400);
  const s = score(b.answers, subject);
  if (!s || s.total < 5) return json({ error: "A sectional test has at least 5 questions from one subject." }, 400);
  const seconds = Math.max(0, Math.min(3 * 3600, Math.round(Number(b.seconds) || 0)));
  const id = nid("m"), at = Date.now();
  await env.DB.prepare("INSERT INTO study_mock (id, user_id, at, total, correct, wrong, skipped, marks, max_marks, seconds, subjects, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, user.id, at, s.total, s.correct, s.wrong, s.skipped, s.marks, s.maxMarks, seconds, JSON.stringify([{ subject, n: s.total, right: s.correct, wrong: s.wrong }]), subject).run();
  return json({ result: { id, at, subject, ...s, seconds } }, 201);
}

/** Update 85's routes; null when the path isn't one of them. */
export async function handleStudy2(request: Request, env: Env, path: string): Promise<Response | null> {
  if (!/^\/(groups|comments|sectional)(\/|$)/.test(path)) return null;
  await ensure(env.DB);
  const user = await currentUser(request, env).catch(() => null);
  if (path.startsWith("/comments")) return comments(env, request, user, path);
  if (!user) return json({ error: "Sign in to use this.", signIn: true }, 401);
  if (path.startsWith("/groups")) return groups(env, request, user, path);
  return sectional(env, request, user);
}
