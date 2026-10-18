/**
 * Learn: today's set, spaced repetition on what you got wrong, timed mock
 * tests with per-subject analytics, and a syllabus tracker, with the subject
 * practice (and viva and OSCE) from PracticeView. Questions are written by
 * Cadus; scheduling and scoring happen on this device.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, Brain, Check, CheckCircle2, Clock3, Flame, Layers, ListChecks, Target, Timer, TrendingUp, X } from "lucide-react";
import PracticeView from "./PracticeView";
import { accuracy, recordAnswer, streak, type PracticeQuestion, type PracticeState } from "@/lib/cadus/practice";
import { type MedicalProfile, practiceExam } from "@/lib/cadus/profile";
import {
  addCard, analyseMock, BOX_DAYS, cardStats, dailySubjects, dueCards, EXAMS, localDay, MOCK_PRESETS, mockSubjects, mockTrend, recordMock,
  retireKnown, reviewCard, SYLLABUS, syllabusProgress, toggleTopic, type Card, type LearnState, type MockAnswer, type MockResult,
} from "@/lib/cadus/learn";
import { SUBJECTS } from "@/lib/cadus/practice";

type Tab = "today" | "mock" | "syllabus" | "subjects";
interface MockQ extends PracticeQuestion { subject: string }
interface MockRun { preset: (typeof MOCK_PRESETS)[number]; items: MockQ[]; index: number; picks: (number | null)[]; secs: number[]; startedAt: number; endsAt: number; submitted?: MockResult }

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export default function LearnView({ profile, practice, setPractice, learn, setLearn, generate, onChat, onEditProfile, friendlyError, toast, initialTab = "today", canMock = true, onLocked }: {
  profile: MedicalProfile | null;
  practice: PracticeState;
  setPractice: (fn: (s: PracticeState) => PracticeState) => void;
  learn: LearnState;
  setLearn: (fn: (s: LearnState) => LearnState) => void;
  generate: (body: Record<string, unknown>) => Promise<{ questions?: PracticeQuestion[] }>;
  onChat: (text: string, mode: "viva" | "osce" | "general", title?: string) => void;
  onEditProfile: () => void;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  initialTab?: Tab;
  /** Timed mocks are part of Core and above. */
  canMock?: boolean;
  onLocked?: (feature: "mocks") => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const exam = practiceExam(profile) || "NEET-PG";
  const today = localDay();
  const acc = (s: string) => accuracy(practice.stats[s]);
  const stats = cardStats(learn, today);
  const due = useMemo(() => dueCards(learn, today), [learn, today]);
  const run = streak(practice.days);

  /* ------------------------------------------------------------ daily set and reviews (one quiz component) */
  type QuizItem = (PracticeQuestion & { subject: string; cardId?: string });
  const [quiz, setQuiz] = useState<{ title: string; items: QuizItem[]; index: number; picks: (number | null)[]; status: "loading" | "ready" | "error"; error?: string; daily?: boolean } | null>(null);

  const startDaily = async () => {
    const subjects = learn.daily?.day === today && learn.daily.subjects.length ? learn.daily.subjects : dailySubjects(acc, today);
    setLearn((s) => ({ ...s, daily: { day: today, finished: false, subjects } }));
    setQuiz({ title: "Today's set", items: [], index: 0, picks: [], status: "loading", daily: true });
    try {
      const sets = await Promise.all(subjects.map((subject) => generate({ action: "practice-mcqs", subject, count: 3, exam }).then((d) => (d.questions ?? []).map((q) => ({ ...q, subject })))));
      const items = sets.flat();
      if (!items.length) throw new Error("Could not write today's questions. Please try again.");
      setQuiz({ title: "Today's set", items, index: 0, picks: items.map(() => null), status: "ready", daily: true });
    } catch (e) {
      setQuiz({ title: "Today's set", items: [], index: 0, picks: [], status: "error", error: friendlyError(e instanceof Error ? e.message : String(e)), daily: true });
    }
  };
  const startReview = () => {
    const items = due.map((c) => ({ ...c.q, subject: c.subject, cardId: c.id }));
    if (!items.length) return;
    setQuiz({ title: "Review", items, index: 0, picks: items.map(() => null), status: "ready" });
  };
  const pick = (i: number) => {
    if (!quiz || quiz.picks[quiz.index] !== null) return;
    const item = quiz.items[quiz.index];
    const correct = i === item.answer;
    setQuiz({ ...quiz, picks: quiz.picks.map((p, k) => (k === quiz.index ? i : p)) });
    setPractice((s) => recordAnswer(s, item.subject, item, i));
    setLearn((s) => (item.cardId ? reviewCard(s, item.cardId, correct, today) : correct ? s : addCard(s, item.subject, item, today)));
  };
  const finishQuiz = () => {
    if (quiz?.daily) setLearn((s) => ({ ...s, daily: { day: today, finished: true, subjects: s.daily?.subjects ?? [] } }));
    setQuiz(null);
  };

  /* ------------------------------------------------------------ mock test */
  /** A running paper is kept on this device, so a refresh or a wrong tap does not lose it. */
  const MOCK_RUN_KEY = "cadus3.learn.mock";
  const [mock, setMockState] = useState<MockRun | null>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(MOCK_RUN_KEY) || "null");
      if (!raw || !Array.isArray(raw.items) || !raw.items.length || raw.submitted || !Number.isFinite(raw.endsAt)) return null;
      const preset = MOCK_PRESETS.find((p) => p.id === raw.preset?.id);
      if (!preset) return null;
      return { ...raw, preset } as MockRun;
    } catch { return null; }
  });
  const setMock = (m: MockRun | null) => {
    setMockState(m);
    try { if (m && !m.submitted) localStorage.setItem(MOCK_RUN_KEY, JSON.stringify(m)); else localStorage.removeItem(MOCK_RUN_KEY); } catch { /* full or blocked */ }
  };
  const [mockLoading, setMockLoading] = useState<string>("");
  const [now, setNow] = useState(Date.now());
  const tick = useRef<number>(0);
  useEffect(() => {
    if (!mock || mock.submitted) return;
    tick.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick.current);
  }, [mock]);
  const left = mock ? Math.max(0, Math.round((mock.endsAt - now) / 1000)) : 0;

  const lastSwitch = useRef(Date.now());
  const startMock = async (preset: (typeof MOCK_PRESETS)[number]) => {
    if (!canMock) { onLocked?.("mocks"); return; }
    setMockLoading(preset.id);
    try {
      const subjects = mockSubjects(preset.subjects);
      const per = Math.ceil(preset.questions / subjects.length);
      const sets = await Promise.all(subjects.map((subject) => generate({ action: "practice-mcqs", subject, count: Math.min(10, per), exam }).then((d) => (d.questions ?? []).map((q) => ({ ...q, subject })))));
      // Interleave subjects as a paper does.
      const items: MockQ[] = [];
      for (let k = 0; items.length < preset.questions; k++) {
        let added = false;
        for (const set of sets) if (set[k]) { items.push(set[k]); added = true; if (items.length >= preset.questions) break; }
        if (!added) break;
      }
      if (items.length < Math.min(10, preset.questions)) throw new Error("Could not write enough questions. Please try again.");
      const startedAt = Date.now();
      lastSwitch.current = startedAt;
      setMock({ preset, items, index: 0, picks: items.map(() => null), secs: items.map(() => 0), startedAt, endsAt: startedAt + preset.minutes * 60_000 });
      setNow(startedAt);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setMockLoading(""); }
  };
  const goTo = (i: number) => {
    if (!mock) return;
    const spent = Math.round((Date.now() - lastSwitch.current) / 1000);
    lastSwitch.current = Date.now();
    setMock({ ...mock, secs: mock.secs.map((s, k) => (k === mock.index ? s + spent : s)), index: Math.max(0, Math.min(mock.items.length - 1, i)) });
  };
  const submitMock = (m: MockRun = mock!) => {
    const spent = Math.round((Date.now() - lastSwitch.current) / 1000);
    const secs = m.secs.map((s, k) => (k === m.index ? s + spent : s));
    const answers: MockAnswer[] = m.items.map((q, k) => ({ subject: q.subject, correct: m.picks[k] === q.answer, secs: secs[k], ...(m.picks[k] === null ? { skipped: true } : {}) }));
    const result: MockResult = { id: uid(), exam, at: Date.now(), questions: m.items.length, allowedSecs: m.preset.minutes * 60, usedSecs: Math.min(m.preset.minutes * 60, Math.round((Date.now() - m.startedAt) / 1000)), answers };
    setLearn((s) => { let next = recordMock(s, result); m.items.forEach((q, k) => { if (m.picks[k] !== null && m.picks[k] !== q.answer) next = addCard(next, q.subject, q, today); }); return next; });
    setPractice((s) => m.items.reduce((acc0, q, k) => (m.picks[k] === null ? acc0 : recordAnswer(acc0, q.subject, q, m.picks[k]!)), s));
    setMock({ ...m, secs, submitted: result });
  };
  useEffect(() => { if (mock && !mock.submitted && left === 0 && now >= mock.endsAt) submitMock(mock); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ render: quiz */
  if (quiz) {
    const back = <button className="cx-back" onClick={finishQuiz}><ArrowLeft size={15} /> Learn</button>;
    if (quiz.status !== "ready") {
      return <section className="cx-page cx-pr">{back}<div className="cx-qz-card loading">{quiz.status === "loading" ? <div className="cx-step on"><i className="cx-spin" /> Writing today's questions from your weakest subjects…</div> : <p className="cx-ln-err">{quiz.error}</p>}</div></section>;
    }
    const item = quiz.items[quiz.index];
    const chosen = quiz.picks[quiz.index];
    const answered = chosen !== null;
    const doneAll = quiz.picks.every((p) => p !== null);
    const right = quiz.picks.filter((p, k) => p === quiz.items[k].answer).length;
    return (
      <section className="cx-page cx-pr">
        {back}
        <div className="cx-qz-card">
          <div className="cx-qz-f"><span className="cx-badge">{quiz.title} · {item.subject}</span><span>{quiz.index + 1} of {quiz.items.length}</span></div>
          <p className="cx-qz-q">{item.question}</p>
          <div className="cx-qz-opts" role="radiogroup" aria-label="Options">
            {item.options.map((o, i) => {
              const state = !answered ? "" : i === item.answer ? "right" : i === chosen ? "wrong" : "dim";
              return <button key={i} role="radio" aria-checked={chosen === i} className={`cx-qz-opt ${state}`} onClick={() => pick(i)} disabled={answered}><span className="l">{"ABCD"[i] ?? i + 1}</span><span className="t">{o}</span>{state === "right" && <Check size={16} className="ic" />}{state === "wrong" && <X size={16} className="ic" />}</button>;
            })}
          </div>
          {answered && <div className={`cx-qz-exp ${chosen === item.answer ? "ok" : "bad"}`}><b>{chosen === item.answer ? <><CheckCircle2 size={15} /> Correct</> : <><X size={15} /> Not quite</>}{item.cardId ? (chosen === item.answer ? " · moves up a box" : " · back to box 1") : chosen === item.answer ? "" : " · added to your reviews"}</b><p>{item.explanation}</p></div>}
          <div className="cx-qz-f">
            <span>{right} right so far</span>
            {doneAll ? <button className="cx-btn primary" onClick={finishQuiz}>Finish <ArrowRight size={14} /></button> : <button className="cx-btn primary" disabled={!answered} onClick={() => setQuiz({ ...quiz, index: Math.min(quiz.items.length - 1, quiz.index + 1) })}>Next <ArrowRight size={14} /></button>}
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------ render: mock */
  if (mock) {
    if (mock.submitted) {
      const a = analyseMock(mock.submitted);
      return (
        <section className="cx-page cx-pr cx-ln">
          <button className="cx-back" onClick={() => setMock(null)}><ArrowLeft size={15} /> Learn</button>
          <div className="cx-qz-res">
            <div className={`cx-qz-score ${a.pct >= 70 ? "ok" : a.pct >= 50 ? "mid" : "low"}`}><b>{a.pct}%</b><small>{a.score} of {a.total}</small></div>
            <div className="cx-ln-resb">
              <h2>{mock.preset.label} · {exam}</h2>
              <p><b>{a.marks}</b> of {a.maxMarks} marks (+4 / −1) · {mmss(mock.submitted.usedSecs)} used of {mmss(mock.submitted.allowedSecs)} · {a.avgSecs} s per question · {mock.submitted.answers.filter((x) => x.skipped).length} skipped</p>
              {a.weakest.length > 0 && <p>Weakest: <b>{a.weakest.join(", ")}</b>{a.slowest.length ? <> · slowest: {a.slowest.join(", ")}</> : null}. Wrong answers are now in your reviews.</p>}
            </div>
          </div>
          <div className="cx-ln-sub">
            <h3>By subject</h3>
            <ul>{a.bySubject.map((b) => <li key={b.subject}><span>{b.subject}</span><i><em style={{ width: `${b.pct}%` }} className={b.pct >= 70 ? "ok" : b.pct >= 50 ? "mid" : "low"} /></i><b>{b.pct}%</b><small>{b.correct}/{b.attempted}</small></li>)}</ul>
          </div>
          <div className="cx-ln-review">
            <h3>Answers</h3>
            <ol>{mock.items.map((q, k) => <li key={k} className={mock.picks[k] === null ? "skip" : mock.picks[k] === q.answer ? "ok" : "bad"}><span>{k + 1}</span><div><b>{q.subject}</b> {q.question}<small>{mock.picks[k] === null ? "Skipped. " : ""}Answer: {q.options[q.answer]}{mock.picks[k] !== null && mock.picks[k] !== q.answer ? ` (you chose ${q.options[mock.picks[k]!]})` : ""}</small></div></li>)}</ol>
          </div>
        </section>
      );
    }
    const q = mock.items[mock.index];
    const answeredN = mock.picks.filter((p) => p !== null).length;
    return (
      <section className="cx-page cx-pr cx-ln cx-ln-mock">
        <div className="cx-ln-mockbar">
          <span className="cx-badge">{mock.preset.label} · {exam}</span>
          <span className={`cx-ln-timer ${left < 120 ? "low" : ""}`}><Timer size={14} /> {mmss(left)}</span>
          <span>{answeredN} of {mock.items.length} answered</span>
          <button className="cx-btn primary" onClick={() => submitMock()}>Submit</button>
        </div>
        <div className="cx-ln-mocklayout">
          <div className="cx-qz-card">
            <div className="cx-qz-f"><span className="cx-badge">{q.subject}</span><span>{mock.index + 1} of {mock.items.length}</span></div>
            <p className="cx-qz-q">{q.question}</p>
            <div className="cx-qz-opts" role="radiogroup" aria-label="Options">
              {q.options.map((o, i) => <button key={i} role="radio" aria-checked={mock.picks[mock.index] === i} className={`cx-qz-opt ${mock.picks[mock.index] === i ? "picked" : ""}`} onClick={() => setMock({ ...mock, picks: mock.picks.map((p, k) => (k === mock.index ? (p === i ? null : i) : p)) })}><span className="l">{"ABCD"[i] ?? i + 1}</span><span className="t">{o}</span></button>)}
            </div>
            <div className="cx-qz-f">
              <button className="cx-btn" disabled={mock.index === 0} onClick={() => goTo(mock.index - 1)}><ArrowLeft size={14} /> Previous</button>
              <button className="cx-btn" disabled={mock.index === mock.items.length - 1} onClick={() => goTo(mock.index + 1)}>Next <ArrowRight size={14} /></button>
            </div>
          </div>
          <nav className="cx-ln-grid" aria-label="Questions">{mock.items.map((_, k) => <button key={k} className={`${k === mock.index ? "on" : ""} ${mock.picks[k] !== null ? "done" : ""}`} onClick={() => goTo(k)} aria-label={`Question ${k + 1}`}>{k + 1}</button>)}</nav>
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------ render: hub */
  if (tab === "subjects") {
    return (
      <div className="cx-ln-wrap">
        <div className="cx-page cx-ln-tabsrow"><nav className="cx-tabs" role="tablist">{(["today", "mock", "syllabus", "subjects"] as Tab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{{ today: "Today", mock: "Mock tests", syllabus: "Syllabus", subjects: "By subject" }[t]}</button>)}</nav></div>
        <PracticeView profile={profile} practice={practice} setPractice={setPractice} generate={generate} onChat={onChat} onEditProfile={onEditProfile} friendlyError={friendlyError} />
      </div>
    );
  }
  const prog = syllabusProgress(learn, exam);
  const trend = mockTrend(learn);
  return (
    <section className="cx-page cx-ln">
      <header className="cx-page-h">
        <div><h1>Learn</h1><p>A daily set from your weakest subjects, spaced repetition on what you got wrong, timed mocks with analytics and a syllabus tracker for {exam}. Questions are written by Cadus; your progress stays on this device.</p></div>
        <nav className="cx-tabs" role="tablist">{(["today", "mock", "syllabus", "subjects"] as Tab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{{ today: "Today", mock: "Mock tests", syllabus: "Syllabus", subjects: "By subject" }[t]}</button>)}</nav>
      </header>
      <div className="cx-pr-stats cx-ln-stats">
        <div><span><Flame size={14} /> Streak</span><b>{run} day{run === 1 ? "" : "s"}</b></div>
        <div><span><Layers size={14} /> Reviews due</span><b>{stats.due}</b></div>
        <div><span><Brain size={14} /> Cards known</span><b>{stats.known}<small> / {stats.total}</small></b></div>
        <div><span><ListChecks size={14} /> Syllabus</span><b>{prog.pct}%</b></div>
      </div>

      {tab === "today" && (
        <div className="cx-ln-cols">
          <div className="cx-ln-card hero">
            <h2><Target size={16} /> Today's set</h2>
            <p>{learn.daily?.day === today && learn.daily.finished ? "Done for today. Come back tomorrow, or review your cards." : `Nine questions from ${(learn.daily?.day === today && learn.daily.subjects.length ? learn.daily.subjects : dailySubjects(acc, today)).join(", ")}: your weakest subjects plus one more.`}</p>
            <button className="cx-btn primary" onClick={startDaily}>{learn.daily?.day === today && learn.daily.finished ? "Do it again" : learn.daily?.day === today ? "Continue" : "Start"} <ArrowRight size={14} /></button>
          </div>
          <div className="cx-ln-card">
            <h2><Layers size={16} /> Spaced repetition</h2>
            <p>{stats.total ? `${stats.due} card${stats.due === 1 ? "" : "s"} due today. A card you get right moves up a box (${BOX_DAYS.slice(1).join(", ")} days); one you miss comes back tomorrow.` : "Questions you get wrong become cards that come back after 1, 3, 7, 14 and 30 days until you know them."}</p>
            <div className="cx-ln-boxes" aria-label="Cards by box">{BOX_DAYS.map((d, i) => <span key={i} title={i ? `Due again after ${d} days` : "New or missed"}><b>{learn.cards.filter((c) => c.box === i).length}</b><small>{i ? `${d}d` : "new"}</small></span>)}</div>
            <div className="cx-ln-acts"><button className="cx-btn primary" disabled={!due.length} onClick={startReview}>Review {due.length ? due.length : ""} <ArrowRight size={14} /></button>{stats.known > 0 && <button className="cx-btn" onClick={() => { setLearn(retireKnown); toast("Known cards retired"); }}>Retire known cards</button>}</div>
          </div>
          <div className="cx-ln-card">
            <h2><TrendingUp size={16} /> Mock scores</h2>
            {trend.length ? (
              <div className="cx-ln-trend" role="img" aria-label={`Mock scores: ${trend.map((t) => `${t.pct}%`).join(", ")}`}>
                {trend.slice(-10).map((t, i) => <span key={i} title={`${t.label}: ${t.pct}%`}><i style={{ height: `${Math.max(4, t.pct)}%` }} className={t.pct >= 70 ? "ok" : t.pct >= 50 ? "mid" : "low"} /><small>{t.pct}</small></span>)}
              </div>
            ) : <p>No mocks yet. A timed paper shows where marks are lost: by subject and by speed.</p>}
            <button className="cx-btn" onClick={() => setTab("mock")}>Mock tests <ArrowRight size={14} /></button>
          </div>
        </div>
      )}

      {tab === "mock" && (
        <div className="cx-ln-cols">
          {MOCK_PRESETS.map((p) => (
            <div key={p.id} className="cx-ln-card">
              <h2><Clock3 size={16} /> {p.label}</h2>
              <p>{p.questions} questions across {p.subjects} subjects in {p.minutes} minutes, scored +4 / −1 like {exam}. Wrong answers go to your reviews.</p>
              <button className="cx-btn primary" disabled={!!mockLoading} onClick={() => startMock(p)}>{mockLoading === p.id ? "Writing the paper…" : "Start"} <ArrowRight size={14} /></button>
            </div>
          ))}
          {learn.mocks.length > 0 && (
            <div className="cx-ln-card wide">
              <h2><TrendingUp size={16} /> Past mocks</h2>
              <table className="cx-ln-table"><thead><tr><th>When</th><th>Paper</th><th>Score</th><th>Marks</th><th>Weakest</th></tr></thead><tbody>
                {learn.mocks.slice(0, 10).map((m) => { const a = analyseMock(m); return <tr key={m.id}><td>{new Date(m.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td><td>{m.questions} q · {m.exam}</td><td><b>{a.pct}%</b></td><td>{a.marks}/{a.maxMarks}</td><td>{a.weakest.join(", ") || "–"}</td></tr>; })}
              </tbody></table>
            </div>
          )}
        </div>
      )}

      {tab === "syllabus" && (
        <div className="cx-ln-syl">
          <div className="cx-ln-sylh">
            <div className="cx-seg">{EXAMS.map((e) => <button key={e} className={exam === e ? "on" : ""} onClick={() => { if (exam !== e) onEditProfile(); }} title={exam === e ? "Your exam" : "Change your exam in your profile"}>{e}</button>)}</div>
            <span>{prog.done} of {prog.total} high-yield topics · <b>{prog.pct}%</b></span>
          </div>
          <div className="cx-ln-sylgrid">
            {SUBJECTS.map((subject) => {
              const done = new Set(learn.done[exam] ?? []);
              const topics = SYLLABUS[subject] ?? [];
              const n = topics.filter((t) => done.has(`${subject} › ${t}`)).length;
              return (
                <details key={subject} className="cx-ln-sylsub">
                  <summary><BookOpenCheck size={14} /><b>{subject}</b><i><em style={{ width: `${topics.length ? (100 * n) / topics.length : 0}%` }} /></i><small>{n}/{topics.length}</small></summary>
                  <ul>{topics.map((t) => { const k = `${subject} › ${t}`; const on = done.has(k); return <li key={t}><button type="button" className={`cx-tg ${on ? "on" : ""}`} role="checkbox" aria-checked={on} onClick={() => setLearn((s) => toggleTopic(s, exam, subject, t))}><span className="cx-tg-box" aria-hidden /><span className="cx-tg-l">{t}</span></button><button className="cx-ln-ask" onClick={() => onChat(`Teach me ${t} (${subject}) for ${exam}: high-yield points, the classic question patterns, and three practice questions.`, "general", `${t} for ${exam}`)}>Learn</button></li>; })}</ul>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
