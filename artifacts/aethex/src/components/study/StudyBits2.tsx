/**
 * Update 81: more study pieces.
 * - MyFlashcards: cards made from your revision deck (wrong answers), bookmarked questions and your notes, reviewed
 *   with spaced repetition (Again, Hard, Good, Easy); due cards first, new cards ten a day.
 * - ExamPlan: pick the exam and its date; the weeks left are planned from your weak subjects (lowest accuracy and
 *   unpractised subjects first), with today's tasks and a daily target from your goal.
 * - Leaderboard: real mock-test results of students who chose to show their name; you choose your own name.
 * Styles: src/shop.css (.st-fc, .st-plan, .st-lb).
 */
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Eye, Layers, Medal, Target, Trophy } from "lucide-react";
import { ALL_SUBJECTS } from "@/data/neetpgQuestions";
import { addDay, bySubject, istDay, liveBookmarks, openWrong, study, useStudy, type StudyState } from "@/lib/study/progress";
import { useUserAuth } from "@/hooks/use-user-auth";
import { loginUrl } from "@/lib/host";

/* ---------------------------------------------------------------- flashcards */
export interface Flashcard { key: string; front: string; back: string; extra?: string; source: "Revision" | "Bookmark" | "Note"; subject?: string }
export function cardsFrom(s: StudyState): Flashcard[] {
  const out: Flashcard[] = [];
  for (const w of openWrong(s)) out.push({ key: `w:${w.q.key}`, front: w.q.question, back: w.q.options[w.q.correct] ?? "", extra: w.q.explanation, source: "Revision", subject: w.q.subject });
  for (const b of liveBookmarks(s)) {
    if (b.q && !out.some((c) => c.key === `w:${b.q!.key}`)) out.push({ key: `b:${b.key}`, front: b.q.question, back: b.q.options[b.q.correct] ?? "", extra: b.q.explanation, source: "Bookmark", subject: b.subject });
    if (b.note) out.push({ key: `n:${b.key}`, front: b.title, back: b.note, source: "Note", subject: b.subject });
  }
  return out;
}
const NEW_PER_DAY = 10;
export function dueCards(s: StudyState, today = istDay()) {
  const all = cardsFrom(s), sched = s.cards ?? {};
  const due = all.filter((c) => sched[c.key] && sched[c.key]!.due <= today).sort((a, b) => sched[a.key]!.due.localeCompare(sched[b.key]!.due));
  const fresh = all.filter((c) => !sched[c.key]);
  const newToday = Object.values(sched).filter((x) => x.reps <= 1 && x.lapses === 0 && new Date(x.updatedAt + 330 * 60000).toISOString().slice(0, 10) === today).length;
  return { all, due, fresh: fresh.slice(0, Math.max(0, NEW_PER_DAY - newToday)), freshTotal: fresh.length };
}

export function MyFlashcards() {
  const s = useStudy();
  const { all, due, fresh, freshTotal } = useMemo(() => dueCards(s), [s]);
  const queue = [...due, ...fresh];
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  const card = queue[0];
  const grade = (g: "again" | "hard" | "good" | "easy") => { study.reviewCard(card!.key, g); setShown(false); setDone((n) => n + 1); };
  const sched = s.cards ?? {};
  const learned = Object.values(sched).filter((x) => x.interval >= 21).length;
  return (
    <section className="st-fc" data-study="flashcards">
      <div className="st-fc-stats">
        <span><b data-study="fc-due">{due.length}</b><small>Due today</small></span>
        <span><b>{freshTotal}</b><small>New</small></span>
        <span><b>{all.length}</b><small>Cards</small></span>
        <span><b>{learned}</b><small>Well learned</small></span>
      </div>
      {!all.length ? (
        <div className="st-empty"><Layers size={26} /><b>No cards yet</b><p>Cards are made for you from questions you got wrong, questions you bookmarked and your notes.</p><Link href="/custom-test" className="st-btn">Take a test</Link></div>
      ) : !card ? (
        <div className="st-empty" data-study="fc-done"><Check size={26} /><b>All done for today{done ? `: ${done} reviewed` : ""}</b><p>Cards come back just before you're likely to forget them. Come back tomorrow.</p></div>
      ) : (
        <div className="st-fc-card" data-study="fc-card" data-key={card.key}>
          <div className="meta"><span>{card.source}{card.subject ? ` · ${card.subject}` : ""}</span><span>{queue.length} left</span></div>
          <p className="front">{card.front}</p>
          {shown ? <>
            <div className="back" data-study="fc-back"><b>{card.back}</b>{card.extra && <p>{card.extra}</p>}</div>
            <div className="grades">
              <button type="button" className="again" onClick={() => grade("again")} data-grade="again">Again<small>today</small></button>
              <button type="button" className="hard" onClick={() => grade("hard")} data-grade="hard">Hard</button>
              <button type="button" className="good" onClick={() => grade("good")} data-grade="good">Good</button>
              <button type="button" className="easy" onClick={() => grade("easy")} data-grade="easy">Easy</button>
            </div>
          </> : <button type="button" className="st-btn lg" onClick={() => setShown(true)} data-study="fc-show"><Eye size={17} /> Show answer</button>}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- exam countdown plan */
export const EXAMS = ["NEET-PG", "INI-CET", "FMGE", "NExT", "University exam", "Other"];
export interface PlanWeek { start: string; end: string; focus: string[]; kind: "learn" | "revise" | "final" }
export function buildPlan(s: StudyState, examDate: string, today = istDay()) {
  const days = Math.round((Date.parse(`${examDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  const acc = new Map(bySubject(s).map((x) => [x.subject, x]));
  // weakest first: not practised yet, then lowest accuracy
  const order = [...ALL_SUBJECTS].sort((a, b) => {
    const x = acc.get(a), y = acc.get(b);
    const sa = x ? (x.attempted < 5 ? 40 : x.pct) : -1, sb = y ? (y.attempted < 5 ? 40 : y.pct) : -1;
    return sa - sb;
  });
  const weeks: PlanWeek[] = [];
  if (days > 0) {
    const nWeeks = Math.ceil(days / 7);
    const finalWeeks = nWeeks >= 4 ? Math.min(2, Math.floor(nWeeks / 4)) : 0;
    const learnWeeks = Math.max(1, nWeeks - finalWeeks);
    const perWeek = Math.max(1, Math.ceil(order.length / learnWeeks));
    for (let i = 0; i < nWeeks; i++) {
      const start = addDay(today, i * 7), end = i === nWeeks - 1 ? addDay(examDate, -1) : addDay(today, i * 7 + 6);
      if (i >= learnWeeks) { weeks.push({ start, end, focus: i === nWeeks - 1 ? ["Full mock tests", "Revision deck", "Flashcards"] : ["Mock tests", ...order.slice(0, 3)], kind: i === nWeeks - 1 ? "final" : "revise" }); continue; }
      const slice = order.slice((i * perWeek) % order.length, (i * perWeek) % order.length + perWeek);
      weeks.push({ start, end, focus: slice.length ? slice : order.slice(0, perWeek), kind: "learn" });
    }
  }
  return { days, weeks, order };
}

export function ExamPlan() {
  const s = useStudy();
  const today = istDay();
  const ex = s.exam && s.exam.date ? s.exam : null;
  const [name, setName] = useState(ex?.name || "NEET-PG"), [date, setDate] = useState(ex?.date ?? "");
  const [editing, setEditing] = useState(!ex);
  const plan = useMemo(() => (ex ? buildPlan(s, ex.date, today) : null), [s, ex, today]);
  const save = (e: FormEvent) => { e.preventDefault(); if (date > today) { study.setExam(name, date); setEditing(false); } };
  const thisWeek = plan?.weeks.find((w) => w.start <= today && today <= w.end) ?? plan?.weeks[0];
  const doneToday = s.days[today] ?? 0;
  const revise = openWrong(s).length;
  const fc = dueCards(s, today).due.length;
  return (
    <section className="st-plan" data-study="exam-plan">
      {editing || !ex ? (
        <form className="st-card st-plan-form" onSubmit={save}>
          <h2><CalendarDays size={18} /> Your exam</h2>
          <div className="st-two">
            <label>Exam<select value={name} onChange={(e) => setName(e.target.value)} data-study="exam-name">{EXAMS.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label>Exam date<input type="date" min={addDay(today, 1)} value={date} onChange={(e) => setDate(e.target.value)} required data-study="exam-date" /></label>
          </div>
          <p className="fine">Use the date from the official notice for your exam. We plan the weeks from your weakest subjects.</p>
          <div className="row"><button type="submit" className="st-btn" disabled={!date || date <= today} data-study="exam-save">Make my plan</button>{ex && <button type="button" className="st-btn ghost" onClick={() => setEditing(false)}>Cancel</button>}</div>
        </form>
      ) : plan && (
        <>
          <div className="st-countdown" data-study="countdown">
            <div><b data-study="days-left">{plan.days}</b><small>day{plan.days === 1 ? "" : "s"} to {ex.name}</small></div>
            <div className="txt"><span>{new Date(`${ex.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</span>
              <button type="button" className="st-link" onClick={() => setEditing(true)}>Change</button><button type="button" className="st-link" onClick={() => study.setExam("", null)}>Clear</button></div>
          </div>
          {thisWeek && <div className="st-card st-today-tasks" data-study="today-tasks">
            <h2><Target size={18} /> Today</h2>
            <ul>
              <li className={doneToday >= s.goal ? "ok" : ""}><Check size={15} /> Answer {s.goal} questions <em>{doneToday}/{s.goal}</em></li>
              {thisWeek.kind === "learn" && thisWeek.focus.slice(0, 2).map((sub) => <li key={sub}><Check size={15} /> {sub}: <Link href={`/study-hub/medical-knowledge-hub?q=${encodeURIComponent(sub)}`}>read a topic</Link> and <Link href="/custom-test">practise questions</Link></li>)}
              {thisWeek.kind !== "learn" && <li><Check size={15} /> Take a <Link href="/mock-test">full mock test</Link></li>}
              {revise > 0 && <li><Check size={15} /> Revise <Link href="/my-library?tab=revision">{revise} wrong answer{revise === 1 ? "" : "s"}</Link></li>}
              {fc > 0 && <li><Check size={15} /> Review <Link href="/my-library?tab=flashcards">{fc} flashcard{fc === 1 ? "" : "s"}</Link></li>}
            </ul>
          </div>}
          <div className="st-card">
            <h2>Week by week</h2>
            <ol className="st-weeks">{plan.weeks.map((w, i) => (
              <li key={w.start} className={`${w.kind}${thisWeek?.start === w.start ? " now" : ""}`} data-week={i + 1}>
                <span className="n">Week {i + 1}</span>
                <span className="d">{new Date(`${w.start}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })} – {new Date(`${w.end}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}</span>
                <span className="f">{w.kind === "learn" ? "Learn and practise: " : w.kind === "revise" ? "Revise: " : "Final week: "}{w.focus.join(", ")}</span>
              </li>
            ))}</ol>
            <p className="fine">Subjects you haven't practised and those with the lowest accuracy come first. The plan updates as your results change.</p>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- leaderboard */
interface Board { period: string; minQuestions: number; rows: { rank: number; name: string; city: string | null; best: number; tests: number; answered: number; you: boolean }[] }
export function Leaderboard({ compact }: { compact?: boolean }) {
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const { data, isLoading } = useQuery({ queryKey: ["study", "board", period], queryFn: async () => { const r = await fetch(`/api/study/leaderboard?period=${period}`); if (!r.ok) throw new Error("x"); return (await r.json()) as Board; }, retry: 0, staleTime: 60_000 });
  return (
    <section className={`st-lb${compact ? " compact" : ""}`} data-study="leaderboard">
      <div className="h"><h2><Trophy size={18} /> Leaderboard</h2>
        <div className="kh-tabs" role="tablist">{(["week", "month", "all"] as const).map((p) => <button key={p} type="button" role="tab" aria-selected={period === p} className={period === p ? "on" : ""} onClick={() => setPeriod(p)}>{p === "week" ? "This week" : p === "month" ? "30 days" : "All time"}</button>)}</div>
      </div>
      {isLoading ? <p className="mu">Loading…</p> : !data?.rows.length ? (
        <p className="mu" data-study="lb-empty">No one is on the board yet for this period. Take a mock test of {data?.minQuestions ?? 25}+ questions and choose to show your name.</p>
      ) : (
        <ol>{data.rows.map((r) => (
          <li key={r.rank} className={r.you ? "you" : ""} data-rank={r.rank}>
            <span className="rk">{r.rank <= 3 ? <Medal size={17} className={`m${r.rank}`} /> : r.rank}</span>
            <span className="nm"><b>{r.name}{r.you ? " (you)" : ""}</b>{r.city && <small>{r.city}</small>}</span>
            <span className="sc"><b>{r.best}%</b><small>{r.tests} test{r.tests === 1 ? "" : "s"} · {r.answered} Qs</small></span>
          </li>
        ))}</ol>
      )}
      <p className="fine">Best score in mock tests of {data?.minQuestions ?? 25} or more questions, scored +4 / −1 on Aethex. Only students who chose to show their name appear.</p>
    </section>
  );
}

export function BoardSettings({ current }: { current: { name: string; city: string | null; show: boolean } | null }) {
  const { isLoggedIn, user } = useUserAuth();
  const qc = useQueryClient();
  const [show, setShow] = useState(current?.show ?? false);
  const [name, setName] = useState(current?.name ?? (user?.name ? `${user.name.split(" ")[0]} ${user.name.split(" ")[1]?.[0] ?? ""}`.trim() : ""));
  const [city, setCity] = useState(current?.city ?? "");
  const [msg, setMsg] = useState("");
  if (!isLoggedIn) return <p className="fine"><a href={loginUrl("/", { next: "/mock-test" })}>Sign in</a> to save your results and appear on the leaderboard.</p>;
  const save = async () => {
    setMsg("");
    const r = await fetch("/api/study/board", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ show, name, city }) });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(b.error ?? "Couldn't save."); return; }
    setMsg(show ? "You're on the leaderboard." : "You're not shown on the leaderboard.");
    void qc.invalidateQueries({ queryKey: ["study", "board"] });
  };
  return (
    <div className="st-board-set" data-study="board-settings">
      <label className="sw"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} data-study="board-show" /> Show me on the leaderboard</label>
      {show && <div className="st-two"><label>Name to show<input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} data-study="board-name" /></label><label>City (optional)<input value={city} onChange={(e) => setCity(e.target.value)} maxLength={40} /></label></div>}
      <div className="row"><button type="button" className="st-btn sm" onClick={() => void save()} data-study="board-save">Save</button>{msg && <small>{msg}</small>}</div>
    </div>
  );
}

/** On the AI flashcard decks page: a way into the cards made from your own notes and wrong answers. */
export function MyCardsBanner() {
  const s = useStudy();
  const { all, due, fresh } = useMemo(() => dueCards(s), [s]);
  return (
    <div className="st-mycards" data-study="mycards-banner">
      <Layers size={20} />
      <span><b>Your own cards: {due.length + fresh.length} to review today</b><small>{all.length ? `${all.length} cards made from your wrong answers, bookmarked questions and notes, with spaced repetition.` : "Answer questions, bookmark them or write notes, and cards are made for you."}</small></span>
      <Link href="/my-library?tab=flashcards" className="st-btn sm">Review</Link>
    </div>
  );
}
