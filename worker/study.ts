// Update 77: a student's study record (daily goal and streak, answers by subject, the revision deck of wrong answers,
// bookmarks and notes), kept with the account so it follows them across devices. The site keeps a copy in the
// browser and merges the two (artifacts/aethex/src/lib/study/merge.ts); this side merges too, so two devices saving
// at once lose nothing. Table created on first use. Routes: GET and PUT /api/study/state.
import { currentUser, type AuthEnv, type D1Like } from "./auth";
import { blankStudy, mergeStates, type StudyState } from "../artifacts/aethex/src/lib/study/merge";

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store, private" } });
const MAX_BYTES = 900_000;
let ready: Promise<void> | null = null;
function ensure(db: D1Like) {
  if (!ready) ready = db.prepare("CREATE TABLE IF NOT EXISTS study_state (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)").run().then(() => undefined).catch((e) => { ready = null; throw e; });
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
  };
}

export async function handleStudy(request: Request, env: AuthEnv & { DB?: D1Like }): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/^\/api\/study/, "").replace(/\/+$/, "");
  if (path !== "/state") return json({ error: "Not found" }, 404);
  if (!env.DB) return json({ error: "The study record isn't switched on yet: the site's database isn't connected." }, 503);
  const user = await currentUser(request, env as AuthEnv & { DB: D1Like });
  if (!user) return json({ error: "Sign in to keep your study record in your account.", signIn: true }, 401);
  await ensure(env.DB);
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
