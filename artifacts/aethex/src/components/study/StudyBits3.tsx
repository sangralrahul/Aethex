/**
 * Update 85, Aethex Study:
 * - Discussion: under each NEET-PG bank question (in test reports): posts by signed-in students, "helpful" votes,
 *   reports (3 hide a post until an admin looks), and the author or an admin can delete. No links, phone numbers
 *   or emails. Data: /api/study/comments (worker/study2.ts).
 * - StudyGroups (/study-groups): make a group or join with a 6-letter code; this week's questions and streaks from each
 *   member's study record; a group test the organiser sets, scored on the server, with a results board.
 * - Sectional (/sectional-tests): a timed test on one subject, scored on the server, with each subject's history.
 * - LibraryPrint (/my-library/print): bookmarks, notes and the revision deck as a page to print or save as PDF.
 * - Moderation (/study-moderation): reported posts, for admins.
 * Styles: src/shop.css (.st-disc*, .st-grp*, .st-sec*, .st-print*).
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, Copy, Crown, Flag, Flame, Loader2, LogOut, MessageSquare, Plus, Printer, Target, ThumbsUp, Timer, Trash2, Trophy, UserMinus, Users } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { PageHero } from "@/components/PageHero";
import { loginUrl } from "@/lib/host";
import { ALL_SUBJECTS, QUESTIONS } from "@/data/neetpgQuestions";
import { fromBank } from "@/lib/study/questions";
import { liveBookmarks, openWrong, useStudy } from "@/lib/study/progress";
import { Report, Runner, useStudySync, type RunResult } from "@/components/study/StudyBits";

class StudyErr extends Error { status: number; constructor(m: string, s: number) { super(m); this.status = s; } }
async function sapi<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`/api/study${path}`, body === undefined ? { credentials: "same-origin" } : { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let d: any = null;
  try { d = await r.json(); } catch { /* not JSON */ }
  if (!r.ok) throw new StudyErr(d?.error ?? `Something went wrong (${r.status}).`, r.status);
  return d as T;
}
const ago = (ms: number) => { const m = Math.round((Date.now() - ms) / 60000); if (m < 60) return `${Math.max(1, m)} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const d = Math.round(h / 24); return d < 30 ? `${d} d ago` : new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };
const signInHref = (next: string) => loginUrl("/", { next });

/* ---------------------------------------------------------------- discussion */
type Post = { id: string; name: string; body: string; at: number; helpful: number; you: boolean; votedHelpful: boolean; hidden: boolean; reports?: number };
export function Discussion({ qkey }: { qkey: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({ enabled: open, queryKey: ["study", "comments", qkey], queryFn: () => sapi<{ comments: Post[]; admin: boolean; signedIn: boolean }>(`/comments?q=${encodeURIComponent(qkey)}`), retry: false });
  const [text, setText] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [flagged, setFlagged] = useState<string[]>([]);
  if (!/^neetpg:\d+$/.test(qkey)) return null;
  const reload = () => qc.invalidateQueries({ queryKey: ["study", "comments", qkey] });
  const post = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await sapi("/comments", { q: qkey, body: text }); setText(""); await reload(); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const act = async (id: string, a: string) => { try { await sapi(`/comments/${id}/${a}`, {}); if (a === "report") setFlagged((f) => [...f, id]); await reload(); } catch (x) { setErr((x as Error).message); } };
  return (
    <div className="st-disc" data-study="discussion">
      <button type="button" className="st-disc-toggle" onClick={() => setOpen(!open)} aria-expanded={open} data-study="disc-toggle"><MessageSquare size={14} /> Discussion{data ? ` (${data.comments.filter((c) => !c.hidden).length})` : ""}</button>
      {open && data && (
        <div className="st-disc-body">
          {data.comments.length ? <ul>{data.comments.map((c) => (
            <li key={c.id} className={c.hidden ? "hid" : ""} data-post={c.id}>
              <div className="hd"><b>{c.name}</b><small>{ago(c.at)}</small>{c.hidden && <em>Hidden{c.reports ? ` · ${c.reports} reports` : ""}</em>}</div>
              <p>{c.body}</p>
              <div className="acts">
                {!c.you && data.signedIn && <button type="button" className={c.votedHelpful ? "on" : ""} onClick={() => void act(c.id, "helpful")} data-study="helpful"><ThumbsUp size={13} /> Helpful{c.helpful ? ` · ${c.helpful}` : ""}</button>}
                {c.you && c.helpful > 0 && <span className="mu"><ThumbsUp size={13} /> {c.helpful}</span>}
                {!c.you && data.signedIn && !flagged.includes(c.id) && <button type="button" onClick={() => void act(c.id, "report")} data-study="report-post"><Flag size={13} /> Report</button>}
                {flagged.includes(c.id) && <span className="mu">Reported. Thanks.</span>}
                {(c.you || data.admin) && <button type="button" onClick={() => { if (window.confirm("Delete this post?")) void act(c.id, "delete"); }} data-study="delete-post"><Trash2 size={13} /> Delete</button>}
                {data.admin && <button type="button" onClick={() => void act(c.id, c.hidden ? "restore" : "hide")}>{c.hidden ? "Show again" : "Hide"}</button>}
              </div>
            </li>
          ))}</ul> : <p className="mu">No posts yet. Explain how you'd remember it, or ask what's unclear.</p>}
          {data.signedIn ? (
            <form onSubmit={post} className="st-disc-form">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={800} placeholder="Add to the discussion: a mnemonic, a source, or a question" aria-label="Your post" data-study="disc-input" />
              <button type="submit" className="st-btn" disabled={busy || text.trim().length < 3} data-study="disc-post">{busy ? "Posting…" : "Post"}</button>
            </form>
          ) : <p className="mu"><a href={signInHref(window.location.pathname)}>Sign in</a> to join the discussion.</p>}
          <p className="tiny">Be kind and stick to the question. No links, phone numbers or emails. Posts reported by 3 students are hidden until we look.</p>
          {err && <p className="st-err" role="alert">{err}</p>}
        </div>
      )}
    </div>
  );
}

/** Admins: posts that were reported or hidden. */
export function Moderation() {
  useSeo({ title: "Discussion moderation | Aethex Study", description: "Reported discussion posts.", path: "/study-moderation" });
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["study", "moderation"], queryFn: () => sapi<{ comments: (Post & { q: string; question: string })[] }>("/comments/reported"), retry: false });
  const act = async (id: string, a: string) => { await sapi(`/comments/${id}/${a}`, {}); await qc.invalidateQueries({ queryKey: ["study", "moderation"] }); };
  return (
    <div className="ax-wrap st-page st-mod" data-study="moderation">
      <h1>Reported discussion posts</h1>
      {error ? <p className="st-err">{(error as Error).message}</p> : !data ? <p className="mu"><Loader2 size={16} className="spin" /> Loading…</p> : !data.comments.length ? <p className="mu">Nothing reported.</p> : (
        <ul className="st-list">{data.comments.map((c) => (
          <li key={c.id} data-mod={c.id}><div><small>{c.question.slice(0, 120)}</small><b>{c.name}: {c.body}</b><small>{c.reports ?? 0} reports{c.hidden ? " · hidden" : ""}</small></div>
            <div className="acts">{c.hidden ? <button type="button" className="st-btn ghost" onClick={() => void act(c.id, "restore")}>Show again</button> : <button type="button" className="st-btn ghost" onClick={() => void act(c.id, "hide")}>Hide</button>}<button type="button" className="st-btn ghost" onClick={() => void act(c.id, "delete")}>Delete</button></div></li>
        ))}</ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- study groups */
type GroupSum = { id: string; name: string; code: string; members: number; owner: boolean; test: boolean };
type Member = { id: string; name: string; you: boolean; owner: boolean; week: number; streak: number; today: number; tests: number; best: number | null };
type GTest = { id: string; title: string; qids: number[]; count: number; at: number; until: number; open: boolean; done: boolean; results: { rank: number; name: string; you: boolean; correct: number; wrong: number; total: number; marks: number; maxMarks: number; seconds: number }[] };
type GroupFull = { group: { id: string; name: string; code: string; owner: boolean; max: number }; members: Member[]; test: GTest | null; result?: unknown };
const bankById = new Map(QUESTIONS.map((q) => [q.id, q]));

function GroupView({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["study", "group", id], queryFn: () => sapi<GroupFull>(`/groups/${id}`), retry: false, refetchInterval: 60_000 });
  const [setting, setSetting] = useState(false), [subs, setSubs] = useState<string[]>([]), [count, setCount] = useState(10), [days, setDays] = useState(7);
  const [run, setRun] = useState(false), [res, setRes] = useState<RunResult | null>(null), [err, setErr] = useState(""), [copied, setCopied] = useState(false);
  const set = (d: GroupFull) => qc.setQueryData(["study", "group", id], d);
  if (error) return <div className="st-card"><p className="st-err">{(error as Error).message}</p><button type="button" className="st-btn ghost" onClick={onBack}><ArrowLeft size={15} /> Your groups</button></div>;
  if (!data) return <p className="mu"><Loader2 size={16} className="spin" /> Loading…</p>;
  const { group: g, members, test } = data;
  const qs = test ? test.qids.map((x) => bankById.get(x)).filter((q): q is NonNullable<typeof q> => !!q).map(fromBank) : [];
  if (run && test) return <Runner questions={qs} mode="exam" minutes={qs.length} title={test.title} onQuit={() => setRun(false)} onDone={async (r) => {
    setRun(false); setRes(r); setErr("");
    try { set(await sapi<GroupFull>(`/groups/${id}/answers`, { answers: qs.map((q, k) => ({ id: Number(q.key.split(":")[1]), choice: r.answers[k] ?? null })), seconds: r.seconds })); }
    catch (x) { setErr((x as Error).message); }
  }} />;
  if (res) return <><Report r={res} onAgain={() => setRes(null)} again="Back to the group" />{err && <p className="st-err">{err}</p>}</>;
  const share = `${window.location.origin}/study-groups?join=${g.code}`;
  return (
    <div className="st-grp" data-study="group" data-group={g.id}>
      <button type="button" className="st-link" onClick={onBack}><ArrowLeft size={15} /> Your groups</button>
      <section className="st-card st-grp-head">
        <div><h2>{g.name}</h2><p className="mu">{members.length} of {g.max} members{g.owner ? " · you run this group" : ""}</p></div>
        <div className="code"><small>Join code</small><b data-study="group-code">{g.code}</b><button type="button" className="st-btn ghost" onClick={() => { void navigator.clipboard?.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 1600); }}><Copy size={14} /> {copied ? "Link copied" : "Copy invite link"}</button></div>
      </section>

      <section className="st-card">
        <h3><Trophy size={17} /> This week</h3>
        <ol className="st-grp-board" data-study="group-board">{members.map((m, i) => (
          <li key={m.id} className={m.you ? "you" : ""} data-member={m.name}>
            <span className="rk">{i + 1}</span>
            <span className="nm"><b>{m.name}{m.you ? " (you)" : ""}</b>{m.owner && <Crown size={12} aria-label="Runs the group" />}</span>
            <span className="st"><b data-study="member-week">{m.week}</b><small>questions</small></span>
            <span className="st"><b><Flame size={13} /> {m.streak}</b><small>day streak</small></span>
            <span className="st"><b>{m.best != null ? `${m.best}%` : "–"}</b><small>best mock</small></span>
            {g.owner && !m.you && <button type="button" className="st-icon" onClick={async () => { if (window.confirm(`Remove ${m.name} from the group?`)) set(await sapi<GroupFull>(`/groups/${id}/remove`, { userId: m.id })); }} aria-label={`Remove ${m.name}`}><UserMinus size={14} /></button>}
          </li>
        ))}</ol>
        <p className="tiny">From each member&apos;s study record on Aethex: questions answered in the last 7 days, their daily streak and their best mock test this week. Keep studying signed in to show up.</p>
      </section>

      <section className="st-card" data-study="group-test">
        <h3><Target size={17} /> Group test</h3>
        {test ? <>
          <p><b>{test.title}</b> · {test.count} questions · {test.open ? `open until ${new Date(test.until).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}` : "closed"}</p>
          {test.open && !test.done && <button type="button" className="st-btn" onClick={() => setRun(true)} data-study="take-group-test"><Timer size={15} /> Take it ({test.count} min)</button>}
          {test.done && <p className="mu">You&apos;ve taken it. Everyone sees the same questions; one try each.</p>}
          {test.results.length > 0 && <table className="st-grp-res" data-study="group-results"><thead><tr><th>#</th><th>Name</th><th>Marks</th><th>Right</th><th>Time</th></tr></thead><tbody>{test.results.map((x) => <tr key={x.rank} className={x.you ? "you" : ""}><td>{x.rank}</td><td>{x.name}</td><td>{x.marks}/{x.maxMarks}</td><td>{x.correct}/{x.total}</td><td>{Math.floor(x.seconds / 60)}m {x.seconds % 60}s</td></tr>)}</tbody></table>}
        </> : <p className="mu">{g.owner ? "Set a test for everyone in the group: same questions, one try each, +4 for right and −1 for wrong." : "No group test yet. The person who runs the group can set one."}</p>}
        {g.owner && (setting ? (
          <div className="st-grp-set">
            <div className="st-chips">{ALL_SUBJECTS.filter((s) => QUESTIONS.some((q) => q.subject === s)).map((s) => <button key={s} type="button" className={subs.includes(s) ? "on" : ""} onClick={() => setSubs(subs.includes(s) ? subs.filter((x) => x !== s) : [...subs, s])}>{s}</button>)}</div>
            <div className="row"><label>Questions<select value={count} onChange={(e) => setCount(Number(e.target.value))} data-study="gt-count">{[5, 10, 20, 30].map((n) => <option key={n}>{n}</option>)}</select></label><label>Open for<select value={days} onChange={(e) => setDays(Number(e.target.value))}>{[1, 3, 7, 14].map((n) => <option key={n} value={n}>{n} day{n === 1 ? "" : "s"}</option>)}</select></label></div>
            <div className="row"><button type="button" className="st-btn" onClick={async () => { try { set(await sapi<GroupFull>(`/groups/${id}/test`, { subjects: subs, count, days })); setSetting(false); } catch (x) { setErr((x as Error).message); } }} data-study="gt-save">Set the test</button><button type="button" className="st-btn ghost" onClick={() => setSetting(false)}>Cancel</button></div>
            <p className="tiny">{subs.length ? subs.join(", ") : "All subjects"}. A new test replaces the current one.</p>
          </div>
        ) : <button type="button" className="st-btn ghost" onClick={() => setSetting(true)} data-study="set-group-test"><Plus size={15} /> {test ? "Set a new test" : "Set a test"}</button>)}
        {err && <p className="st-err" role="alert">{err}</p>}
      </section>
      <button type="button" className="st-link danger" onClick={async () => { if (window.confirm(`Leave ${g.name}?`)) { await sapi(`/groups/${id}/leave`, {}); void qc.invalidateQueries({ queryKey: ["study", "groups"] }); onBack(); } }} data-study="leave-group"><LogOut size={14} /> Leave the group</button>
    </div>
  );
}

export function StudyGroups() {
  useSeo({ title: "Study groups | Aethex Study", description: "Study with friends: a weekly board of questions answered and streaks, and group tests.", path: "/study-groups" });
  useStudySync();
  const { isLoggedIn } = useUserAuth();
  const [, go] = useLocation();
  const qc = useQueryClient();
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const [code, setCode] = useState(params.get("join")?.toUpperCase() ?? ""), [name, setName] = useState(""), [display, setDisplay] = useState("");
  const [openId, setOpenId] = useState(params.get("g") ?? ""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const { data } = useQuery({ enabled: isLoggedIn, queryKey: ["study", "groups"], queryFn: () => sapi<{ groups: GroupSum[] }>("/groups").then((r) => r.groups), retry: false });
  const open = (id: string) => { setOpenId(id); go(`/study-groups?g=${id}`, { replace: true }); };
  const create = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setErr(""); try { const r = await sapi<GroupFull>("/groups", { name, display }); void qc.invalidateQueries({ queryKey: ["study", "groups"] }); open(r.group.id); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); } };
  const join = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setErr(""); try { const r = await sapi<GroupFull>("/groups/join", { code, display }); void qc.invalidateQueries({ queryKey: ["study", "groups"] }); open(r.group.id); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); } };
  return (
    <div className="st-page" data-study="groups">
      <PageHero tag="Study groups" title="Study together" subtitle="Make a group with friends or your batch, see who studied most this week, and take the same test." icon={<Users className="w-7 h-7" />} />
      <div className="ax-wrap st-lib">
        {!isLoggedIn ? <div className="st-empty"><Users size={26} /><b>Sign in to make or join a group</b><p>Groups use your study record, so they need an account.</p><a className="st-btn" href={signInHref(`/study-groups${code ? `?join=${code}` : ""}`)}>Sign in</a></div>
          : openId ? <GroupView id={openId} onBack={() => { setOpenId(""); go("/study-groups", { replace: true }); }} />
          : <>
            {data && data.length > 0 && <section className="st-card"><h2>Your groups</h2><ul className="st-grp-list">{data.map((g) => <li key={g.id}><button type="button" onClick={() => open(g.id)} data-open-group={g.code}><b>{g.name}</b><small>{g.members} member{g.members === 1 ? "" : "s"} · code {g.code}{g.owner ? " · you run it" : ""}{g.test ? " · a test is open" : ""}</small></button></li>)}</ul></section>}
            <div className="st-grp-forms">
              <form className="st-card" onSubmit={join} data-study="join-form"><h2>Join a group</h2><label>Code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="6 letters, e.g. K7PQ2M" required /></label><label>Your name in the group <em>(optional)</em><input value={display} onChange={(e) => setDisplay(e.target.value)} maxLength={30} placeholder="e.g. Asha K." /></label><button type="submit" className="st-btn" disabled={busy || code.length !== 6}>Join</button></form>
              <form className="st-card" onSubmit={create} data-study="create-form"><h2>Make a group</h2><label>Group name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="e.g. AIIMS 2026 batch" required /></label><label>Your name in the group <em>(optional)</em><input value={display} onChange={(e) => setDisplay(e.target.value)} maxLength={30} placeholder="e.g. Asha K." /></label><button type="submit" className="st-btn" disabled={busy || name.trim().length < 2}><Plus size={15} /> Make it</button></form>
            </div>
            {err && <p className="st-err" role="alert">{err}</p>}
            <p className="tiny">Members see each other&apos;s name, questions this week, streak and best mock score, never your email. Up to 50 people a group.</p>
          </>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sectional tests */
type SecHist = { subject: string; tests: { at: number; total: number; correct: number; wrong: number; marks: number; maxMarks: number; seconds: number; pct: number }[]; best: number; last: number };
export function Sectional() {
  useSeo({ title: "Sectional tests: one subject, timed | Aethex Study", description: "Timed NEET-PG sectional tests by subject, with your score history for each.", path: "/sectional-tests" });
  useStudySync();
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const subjects = useMemo(() => ALL_SUBJECTS.map((s) => ({ subject: s, n: QUESTIONS.filter((q) => q.subject === s).length })).filter((x) => x.n >= 5), []);
  const { data: hist } = useQuery({ enabled: isLoggedIn, queryKey: ["study", "sectional"], queryFn: () => sapi<{ subjects: SecHist[] }>("/sectional").then((r) => r.subjects), retry: false });
  const [pick, setPick] = useState(""), [count, setCount] = useState(10), [pace, setPace] = useState<60 | 45>(60);
  const [run, setRun] = useState<ReturnType<typeof fromBank>[] | null>(null), [res, setRes] = useState<RunResult | null>(null), [saved, setSaved] = useState(""), [err, setErr] = useState("");
  const avail = subjects.find((x) => x.subject === pick)?.n ?? 0;
  useEffect(() => { if (avail) setCount((c) => Math.min(c, avail)); }, [avail]);
  const h = (s: string) => hist?.find((x) => x.subject === s);
  if (run) return <div className="ax-wrap st-lib"><Runner questions={run} mode="exam" minutes={Math.max(1, Math.ceil((run.length * pace) / 60))} title={`${pick}: sectional test`} onQuit={() => setRun(null)} onDone={async (r) => {
    setRun(null); setRes(r); setSaved(""); setErr("");
    if (isLoggedIn) {
      try { await sapi("/sectional", { subject: pick, answers: run.map((q, k) => ({ id: Number(q.key.split(":")[1]), choice: r.answers[k] ?? null })), seconds: r.seconds }); setSaved("Saved to your sectional history."); void qc.invalidateQueries({ queryKey: ["study", "sectional"] }); }
      catch (x) { setErr((x as Error).message); }
    }
  }} /></div>;
  if (res) {
    const sh = h(pick);
    return (
      <div className="ax-wrap st-lib" data-study="sectional-result">
        <Report r={res} onAgain={() => setRes(null)} again="Another sectional test" />
        {saved && <p className="st-sync on">{saved}</p>}{err && <p className="st-err">{err}</p>}
        {!isLoggedIn && <p className="st-sync"><a href={signInHref("/sectional-tests")}>Sign in</a> to keep your sectional scores.</p>}
        {sh && sh.tests.length > 1 && <section className="st-card"><h3>{pick}: your last {sh.tests.length} tests</h3><div className="st-sec-bars">{[...sh.tests].reverse().map((t, i) => <span key={i} style={{ height: `${Math.max(4, t.pct)}%` }} title={`${t.pct}%`} className={t.pct >= 70 ? "good" : t.pct >= 50 ? "mid" : "low"} />)}</div></section>}
      </div>
    );
  }
  return (
    <div className="st-page" data-study="sectional">
      <PageHero tag="Sectional tests" title="One subject, against the clock" subtitle="A timed test on a single subject, marked +4 and −1 like the exam, with your history for each subject." icon={<Timer className="w-7 h-7" />} />
      <div className="ax-wrap st-lib">
        <div className="st-sec-grid">{subjects.map((s) => { const x = h(s.subject); return (
          <button key={s.subject} type="button" className={`st-sec${pick === s.subject ? " on" : ""}`} onClick={() => setPick(s.subject)} data-subject={s.subject}>
            <b>{s.subject}</b><small>{s.n} questions</small>
            {x ? <span className="sc"><em>Last {x.last}%</em><em>Best {x.best}%</em></span> : <span className="sc"><em>Not taken yet</em></span>}
          </button>); })}</div>
        {pick && (
          <section className="st-card st-sec-go" data-study="sectional-setup">
            <h2>{pick}</h2>
            <div className="row">
              <label>Questions<select value={count} onChange={(e) => setCount(Number(e.target.value))} data-study="sec-count">{[5, 10, 15, 20, 30].filter((n) => n <= avail).concat(avail > 30 || [5, 10, 15, 20, 30].includes(avail) ? [] : [avail]).map((n) => <option key={n} value={n}>{n === avail ? `${n} (all)` : n}</option>)}</select></label>
              <label>Pace<select value={pace} onChange={(e) => setPace(Number(e.target.value) as 60 | 45)}><option value={60}>1 minute a question</option><option value={45}>45 seconds (faster than the exam)</option></select></label>
            </div>
            <p className="mu"><Clock size={14} /> {Math.ceil((count * pace) / 60)} minutes. It ends on its own when the time is up.</p>
            <button type="button" className="st-btn" onClick={() => { const pool = QUESTIONS.filter((q) => q.subject === pick); const qs = [...pool].sort(() => Math.random() - 0.5).slice(0, count).map(fromBank); setRun(qs); }} data-study="sec-start"><Timer size={15} /> Start</button>
          </section>
        )}
        {!isLoggedIn && <p className="st-sync"><a href={signInHref("/sectional-tests")}>Sign in</a> to keep a history for each subject.</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- printable library */
export function LibraryPrint() {
  useSeo({ title: "My notes and bookmarks (print) | Aethex Study", description: "Your bookmarks, notes and revision questions to print or save as PDF.", path: "/my-library/print" });
  useStudySync();
  const s = useStudy();
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const [parts, setParts] = useState({ bm: params.get("only") !== "revision", wrong: params.get("only") !== "bookmarks", answers: true });
  const bms = liveBookmarks(s), wrong = openWrong(s);
  const day = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="st-print" data-study="print">
      <div className="st-print-bar no-print">
        <Link href="/my-library" className="st-link"><ArrowLeft size={15} /> My library</Link>
        <label><input type="checkbox" checked={parts.bm} onChange={(e) => setParts({ ...parts, bm: e.target.checked })} /> Bookmarks and notes</label>
        <label><input type="checkbox" checked={parts.wrong} onChange={(e) => setParts({ ...parts, wrong: e.target.checked })} /> Revision deck</label>
        <label><input type="checkbox" checked={parts.answers} onChange={(e) => setParts({ ...parts, answers: e.target.checked })} /> Answers and explanations</label>
        <button type="button" className="st-btn" onClick={() => window.print()} data-study="print-now"><Printer size={15} /> Print or save as PDF</button>
      </div>
      <article className="st-print-doc">
        <header><h1>My study notes</h1><p>Aethex Study · {day} · {bms.length} bookmarks · {wrong.length} questions to revise</p></header>
        {parts.bm && <section data-study="print-bookmarks"><h2>Bookmarks and notes</h2>{bms.length ? bms.map((b) => (
          <div key={b.key} className="it"><small>{b.kind === "question" ? "Question" : b.kind[0]!.toUpperCase() + b.kind.slice(1)}{b.subject ? ` · ${b.subject}` : ""}</small><b>{b.q ? b.q.question : b.title}</b>
            {b.q && parts.answers && <><ol type="A">{b.q.options.map((o, i) => <li key={i} className={i === b.q!.correct ? "ok" : ""}>{o}</li>)}</ol><p className="ex">{b.q.explanation}</p></>}
            {b.note && <p className="note">Note: {b.note}</p>}</div>
        )) : <p>No bookmarks yet.</p>}</section>}
        {parts.wrong && <section data-study="print-revision"><h2>Revision deck</h2>{wrong.length ? wrong.map((w, k) => (
          <div key={w.q.key} className="it"><small>{k + 1}. {w.q.subject}{w.q.topic ? ` · ${w.q.topic}` : ""} · wrong {w.tries}×</small><b>{w.q.question}</b>
            <ol type="A">{w.q.options.map((o, i) => <li key={i} className={parts.answers && i === w.q.correct ? "ok" : ""}>{o}</li>)}</ol>
            {parts.answers && <p className="ex">{w.q.explanation}</p>}</div>
        )) : <p>Nothing to revise.</p>}</section>}
      </article>
    </div>
  );
}

