/**
 * Update 77: the study pieces used across Aethex Study: bookmark and note buttons, the "Today" card (daily goal and
 * streak), the year heat-map, and the question runner shared by the custom test and the revision deck, with its
 * score report. Styles: src/shop.css (.st-*).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Bookmark as BookmarkIcon, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, Flame, NotebookPen, RotateCcw, Target, Trophy, XCircle } from "lucide-react";
import { GOALS, addDay, istDay, openWrong, streakOf, study, syncStudy, useStudy, type Bookmark, type QSnap, type StudyState } from "@/lib/study/progress";
import { useUserAuth } from "@/hooks/use-user-auth";

/** Signed in: bring the account's study record into this browser once per page load. */
let synced = false;
export function useStudySync() {
  const { isLoggedIn } = useUserAuth();
  useEffect(() => { if (isLoggedIn && !synced) { synced = true; void syncStudy(); } }, [isLoggedIn]);
}

/* ---------------------------------------------------------------- bookmarks and notes */
export function BookmarkButton({ item, label = true }: { item: Omit<Bookmark, "at" | "updatedAt">; label?: boolean }) {
  const s = useStudy();
  const on = !!s.bookmarks[item.key] && !s.bookmarks[item.key]!.removed;
  return (
    <button type="button" className={`st-bm${on ? " on" : ""}`} aria-pressed={on} onClick={() => study.toggleBookmark(item)} data-study="bookmark" title={on ? "Remove bookmark" : "Bookmark"}>
      {on ? <BookmarkCheck size={16} /> : <BookmarkIcon size={16} />}{label && <span>{on ? "Bookmarked" : "Bookmark"}</span>}
    </button>
  );
}

export function NoteButton({ item }: { item: Omit<Bookmark, "at" | "updatedAt" | "note"> }) {
  const s = useStudy();
  const cur = s.bookmarks[item.key];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(cur?.note ?? "");
  useEffect(() => { if (!open) setText(cur?.note ?? ""); }, [cur?.note, open]);
  return (
    <span className="st-note-wrap">
      <button type="button" className={`st-bm${cur?.note && !cur.removed ? " on" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} data-study="note">
        <NotebookPen size={16} /><span>{cur?.note && !cur.removed ? "My note" : "Add a note"}</span>
      </button>
      {open && (
        <div className="st-note-pop" role="dialog" aria-label="My note">
          <textarea autoFocus rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Mnemonics, what to remember, where you went wrong…" maxLength={5000} />
          <div className="row"><small>Saved in My library</small><button type="button" className="st-btn sm" onClick={() => { study.setNote(item, text); setOpen(false); }} data-study="save-note">Save note</button></div>
        </div>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- today: goal and streak */
export function TodayCard({ compact }: { compact?: boolean }) {
  useStudySync();
  const s = useStudy();
  const today = istDay();
  const done = s.days[today] ?? 0;
  const st = streakOf(s, today);
  const revise = openWrong(s).length;
  const pct = Math.min(100, Math.round((done / s.goal) * 100));
  const R = 34, C = 2 * Math.PI * R;
  return (
    <section className={`st-today${compact ? " compact" : ""}`} data-study="today" aria-label="Today's study">
      <div className="ring" aria-label={`${done} of ${s.goal} questions today`}>
        <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r={R} className="bg" /><circle cx="40" cy="40" r={R} className="fg" strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} /></svg>
        <span><b>{done}</b><small>/ {s.goal}</small></span>
      </div>
      <div className="txt">
        <small>Today's goal</small>
        <b>{st.todayDone ? "Goal reached. Well done!" : done ? `${s.goal - done} more question${s.goal - done === 1 ? "" : "s"} to go` : `Answer ${s.goal} questions today`}</b>
        <span className="facts">
          <span className="fl" data-study="streak"><Flame size={15} /> {st.current} day{st.current === 1 ? "" : "s"} streak</span>
          <span><Trophy size={14} /> Best {st.best}</span>
          {revise > 0 && <Link href="/my-library?tab=revision"><RotateCcw size={14} /> {revise} to revise</Link>}
        </span>
      </div>
      <div className="acts">
        <Link href="/custom-test" className="st-btn">Start a test</Link>
        {!compact && <Link href="/my-library?tab=progress" className="st-btn ghost">My progress</Link>}
      </div>
    </section>
  );
}

export function GoalPicker() {
  const s = useStudy();
  return (
    <label className="st-goal" data-study="goal">
      <Target size={16} /> Daily goal
      <select value={s.goal} onChange={(e) => study.setGoal(Number(e.target.value))} aria-label="Questions a day">
        {[...new Set([...GOALS, s.goal])].sort((a, b) => a - b).map((g) => <option key={g} value={g}>{g} questions</option>)}
      </select>
    </label>
  );
}

/** The last 26 weeks, a square a day, darker for more questions; ringed when the goal was met. */
export function Heatmap({ s }: { s: StudyState }) {
  const today = istDay();
  const cells = useMemo(() => {
    const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
    const start = addDay(today, -(25 * 7 + dow));
    return Array.from({ length: 26 * 7 }, (_, i) => addDay(start, i)).filter((d) => d <= today);
  }, [today]);
  const max = Math.max(s.goal, ...cells.map((d) => s.days[d] ?? 0));
  const level = (n: number) => (n === 0 ? 0 : n >= max * 0.75 ? 4 : n >= max * 0.5 ? 3 : n >= max * 0.25 ? 2 : 1);
  const active = cells.filter((d) => (s.days[d] ?? 0) > 0).length;
  return (
    <div className="st-heat" data-study="heatmap">
      <div className="grid" role="img" aria-label={`Studied on ${active} of the last ${cells.length} days`}>
        {cells.map((d) => { const n = s.days[d] ?? 0; return <i key={d} className={`l${level(n)}${n >= s.goal ? " goal" : ""}`} title={`${new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}: ${n} question${n === 1 ? "" : "s"}`} />; })}
      </div>
      <div className="key"><span>{active} days studied in 6 months</span><span className="lg">Less <i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /> More</span></div>
    </div>
  );
}

/* ---------------------------------------------------------------- the question runner */
export type RunMode = "exam" | "practice" | "revision";
export interface RunResult { questions: QSnap[]; answers: (number | null)[]; seconds: number; mode: RunMode }

export function Runner({ questions, mode, minutes, title, onDone, onQuit }: { questions: QSnap[]; mode: RunMode; minutes?: number | null; title: string; onDone: (r: RunResult) => void; onQuit: () => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [flags, setFlags] = useState<boolean[]>(() => questions.map(() => false));
  const [secs, setSecs] = useState(0);
  const finished = useRef(false);
  const limit = minutes ? minutes * 60 : null;
  const finish = (a = answers) => {
    if (finished.current) return;
    finished.current = true;
    if (mode === "exam") questions.forEach((q, k) => { if (a[k] !== null) study.record(q, a[k] === q.correct); });
    onDone({ questions, answers: a, seconds: secs, mode });
  };
  useEffect(() => { const t = window.setInterval(() => setSecs((x) => x + 1), 1000); return () => window.clearInterval(t); }, []);
  useEffect(() => { if (limit && secs >= limit) finish(); }, [secs]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = questions[i]!;
  const chosen = answers[i] ?? null;
  const reveal = mode !== "exam" && chosen !== null;
  const pick = (o: number) => {
    if (reveal) return;
    const a = answers.map((x, k) => (k === i ? o : x));
    setAnswers(a);
    if (mode === "practice") study.record(q, o === q.correct);
    if (mode === "revision") study.revised(q, o === q.correct);
  };
  const left = limit ? Math.max(0, limit - secs) : null;
  const clock = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  const answeredN = answers.filter((x) => x !== null).length;
  return (
    <div className="st-run" data-study="runner" data-mode={mode}>
      <header>
        <div><small>{title}</small><b>Question {i + 1} of {questions.length}</b></div>
        <span className={`clock${left !== null && left < 60 ? " low" : ""}`}><Clock size={15} /> {left !== null ? `${clock(left)} left` : clock(secs)}</span>
        <button type="button" className="st-btn ghost sm" onClick={onQuit}>Quit</button>
      </header>
      <div className="bar"><i style={{ width: `${(answeredN / questions.length) * 100}%` }} /></div>
      <div className="body">
        <div className="qcol">
          <div className="qmeta"><span>{q.subject}{q.topic ? ` · ${q.topic}` : ""}</span><BookmarkButton item={{ key: q.key, kind: "question", title: q.question.slice(0, 140), subject: q.subject, q }} label={false} /></div>
          <p className="q" data-study="question">{q.question}</p>
          <ol className="opts">
            {q.options.map((o, k) => {
              const cls = reveal ? (k === q.correct ? "right" : k === chosen ? "wrong" : "") : k === chosen ? "on" : "";
              return <li key={k}><button type="button" className={cls} onClick={() => pick(k)} disabled={reveal} data-opt={k}><em>{String.fromCharCode(65 + k)}</em> {o}{reveal && k === q.correct && <CheckCircle2 size={17} />}{reveal && k === chosen && k !== q.correct && <XCircle size={17} />}</button></li>;
            })}
          </ol>
          {reveal && <div className={`expl ${chosen === q.correct ? "ok" : "no"}`} data-study="explanation"><b>{chosen === q.correct ? (mode === "revision" ? "Right: it leaves your revision deck." : "Correct.") : "Not quite."}</b> {q.explanation}</div>}
          <div className="nav">
            <button type="button" className="st-btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft size={16} /> Back</button>
            {mode === "exam" && <button type="button" className={`st-btn ghost${flags[i] ? " flag" : ""}`} onClick={() => setFlags(flags.map((f, k) => (k === i ? !f : f)))}><Flag size={15} /> {flags[i] ? "Marked" : "Mark for review"}</button>}
            {i + 1 < questions.length
              ? <button type="button" className="st-btn" onClick={() => setI(i + 1)} data-study="next">Next <ChevronRight size={16} /></button>
              : <button type="button" className="st-btn" onClick={() => finish()} data-study="submit">{mode === "exam" ? "Submit test" : "Finish"}</button>}
          </div>
        </div>
        {questions.length > 1 && (
          <aside className="pal" aria-label="Questions">
            <b>{answeredN} of {questions.length} answered</b>
            <div>{questions.map((x, k) => <button key={x.key + k} type="button" className={`${k === i ? "cur " : ""}${answers[k] !== null ? (mode === "exam" ? "done" : answers[k] === x.correct ? "right" : "wrong") : ""}${flags[k] ? " flag" : ""}`} onClick={() => setI(k)} aria-label={`Question ${k + 1}`}>{k + 1}</button>)}</div>
            {mode === "exam" && <button type="button" className="st-btn full" onClick={() => finish()}>Submit test</button>}
          </aside>
        )}
      </div>
    </div>
  );
}

export function Report({ r, onAgain, again = "Take another test" }: { r: RunResult; onAgain: () => void; again?: string }) {
  const right = r.questions.filter((q, k) => r.answers[k] === q.correct).length;
  const skipped = r.answers.filter((x) => x === null).length;
  const pct = Math.round((right / r.questions.length) * 100);
  const subs = useMemo(() => {
    const m = new Map<string, { n: number; right: number }>();
    r.questions.forEach((q, k) => { const x = m.get(q.subject) ?? { n: 0, right: 0 }; x.n++; if (r.answers[k] === q.correct) x.right++; m.set(q.subject, x); });
    return [...m.entries()].map(([subject, x]) => ({ subject, ...x, pct: Math.round((x.right / x.n) * 100) })).sort((a, b) => a.pct - b.pct);
  }, [r]);
  const weak = subs.filter((x) => x.pct < 60);
  const [show, setShow] = useState<"all" | "wrong">("wrong");
  const list = r.questions.map((q, k) => ({ q, a: r.answers[k] ?? null })).filter((x) => show === "all" || x.a !== x.q.correct);
  return (
    <div className="st-report" data-study="report">
      <section className="score">
        <div className={`big ${pct >= 70 ? "good" : pct >= 50 ? "mid" : "low"}`} data-study="score"><b>{right}/{r.questions.length}</b><small>{pct}%</small></div>
        <dl>
          <div><dt>Correct</dt><dd>{right}</dd></div>
          <div><dt>Wrong</dt><dd>{r.questions.length - right - skipped}</dd></div>
          <div><dt>Skipped</dt><dd>{skipped}</dd></div>
          <div><dt>Time</dt><dd>{Math.floor(r.seconds / 60)}m {r.seconds % 60}s</dd></div>
        </dl>
        <div className="acts"><button type="button" className="st-btn" onClick={onAgain}>{again}</button><Link href="/my-library?tab=revision" className="st-btn ghost">Revise wrong answers</Link></div>
      </section>
      <section className="subj">
        <h3>By subject</h3>
        <ul>{subs.map((x) => <li key={x.subject}><span>{x.subject}</span><span className="b"><i style={{ width: `${x.pct}%` }} className={x.pct >= 70 ? "good" : x.pct >= 50 ? "mid" : "low"} /></span><em>{x.right}/{x.n}</em></li>)}</ul>
        {weak.length > 0 ? <p className="weak" data-study="weak"><b>Work on:</b> {weak.map((w) => w.subject).join(", ")}. Wrong answers are in your revision deck.</p> : <p className="weak ok">No weak subjects in this test.</p>}
      </section>
      <section className="review">
        <div className="h"><h3>Review answers</h3><div className="kh-tabs" role="tablist"><button type="button" role="tab" aria-selected={show === "wrong"} className={show === "wrong" ? "on" : ""} onClick={() => setShow("wrong")}>Wrong and skipped</button><button type="button" role="tab" aria-selected={show === "all"} className={show === "all" ? "on" : ""} onClick={() => setShow("all")}>All</button></div></div>
        {list.length ? list.map(({ q, a }) => (
          <article key={q.key} className="st-rq">
            <div className="qmeta"><span>{q.subject}</span><BookmarkButton item={{ key: q.key, kind: "question", title: q.question.slice(0, 140), subject: q.subject, q }} label={false} /></div>
            <p className="q">{q.question}</p>
            <p className="ans">{a === null ? <span className="skip">Skipped.</span> : a === q.correct ? <span className="ok">Your answer: {q.options[a]}</span> : <><span className="no">Your answer: {q.options[a]}</span> · </>}{a !== q.correct && <span className="ok">Correct: {q.options[q.correct]}</span>}</p>
            <p className="ex">{q.explanation}</p>
          </article>
        )) : <p className="mu">All correct. Nothing to review.</p>}
      </section>
    </div>
  );
}
