/**
 * /mock-test: a timed NEET-PG style paper from the question bank, balanced across subjects, marked +4 / −1.
 * Update 81: the invented scores, percentile, "analysis" and top scorers that were here are gone. Results are the
 * student's own: scored on the server from the answers (worker/study.ts), kept in the account with past attempts,
 * a percentile once enough students have taken tests, an analysis worked out from this paper, and a leaderboard of
 * students who chose to show their name. Wrong answers go to the revision deck.
 * Styles: src/shop.css (.st-*, .st-mock-*).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BarChart3, Brain, Clock, History, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { ALL_SUBJECTS, QUESTIONS } from "@/data/neetpgQuestions";
import { fromBank } from "@/lib/study/questions";
import { loginUrl } from "@/lib/host";
import { Runner, Report, useStudySync, type RunResult } from "@/components/study/StudyBits";
import { BoardSettings, Leaderboard } from "@/components/study/StudyBits2";

type Phase = "intro" | "exam" | "result";
const SIZES = [25, 50, 100];
interface Res { id: string; at: number; total: number; correct: number; wrong: number; skipped: number; marks: number; maxMarks: number; seconds: number; subjects: { subject: string; n: number; right: number; wrong: number }[] }
interface Mine { history: Res[]; percentile: number | null; takers: number; board: { name: string; city: string | null; show: boolean } | null }

/** A paper of n questions spread across subjects as evenly as the bank allows. */
function paper(n: number) {
  const by = new Map<string, typeof QUESTIONS>();
  for (const q of [...QUESTIONS].sort(() => Math.random() - 0.5)) { const l = by.get(q.subject) ?? []; l.push(q); by.set(q.subject, l); }
  const out: typeof QUESTIONS = [];
  while (out.length < Math.min(n, QUESTIONS.length)) {
    let added = false;
    for (const l of by.values()) { const x = l.shift(); if (x) { out.push(x); added = true; if (out.length >= n) break; } }
    if (!added) break;
  }
  return out.sort(() => Math.random() - 0.5);
}

export default function MockTest() {
  useSeo({ title: "Mock tests: timed NEET-PG practice exams | Aethex Study", description: "Timed NEET-PG style mock tests marked +4 / −1, with your own results by subject, past attempts and a leaderboard.", path: "/mock-test" });
  useStudySync();
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("intro");
  const [size, setSize] = useState(25);
  const [qs, setQs] = useState<ReturnType<typeof paper>>([]);
  const [run, setRun] = useState<RunResult | null>(null);
  const [saved, setSaved] = useState<{ result: Res; percentile: number | null; takers: number } | null>(null);
  const [saveErr, setSaveErr] = useState("");
  const mine = useQuery({ queryKey: ["study", "mock"], enabled: isLoggedIn, retry: 0, queryFn: async () => { const r = await fetch("/api/study/mock"); if (!r.ok) throw new Error("x"); return (await r.json()) as Mine; } });

  const start = () => { setQs(paper(size)); setRun(null); setSaved(null); setSaveErr(""); setPhase("exam"); };
  const finish = async (r: RunResult) => {
    setRun(r); setPhase("result");
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/study/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seconds: r.seconds, answers: qs.map((q, k) => ({ id: q.id, choice: r.answers[k] ?? null })) }) });
      const b = await res.json();
      if (!res.ok) throw new Error(b.error ?? "Couldn't save your result.");
      setSaved(b); void qc.invalidateQueries({ queryKey: ["study"] });
    } catch (e) { setSaveErr((e as Error).message); }
  };

  const local = useMemo(() => {
    if (!run) return null;
    const right = run.questions.filter((q, k) => run.answers[k] === q.correct).length;
    const skipped = run.answers.filter((x) => x === null).length, wrong = run.questions.length - right - skipped;
    return { right, wrong, skipped, marks: right * 4 - wrong, max: run.questions.length * 4 };
  }, [run]);

  if (phase === "exam") return <div className="st-page"><div className="ax-wrap"><Runner questions={qs.map(fromBank)} mode="exam" minutes={qs.length} title={`NEET-PG mock · ${qs.length} questions`} onDone={(r) => void finish(r)} onQuit={() => setPhase("intro")} /></div></div>;

  if (phase === "result" && run && local) {
    const prev = mine.data?.history.filter((h) => h.id !== saved?.result.id) ?? [];
    const last = prev[0];
    const pct = Math.round((local.marks / local.max) * 100);
    const subs = saved?.result.subjects ?? [];
    const weakest = [...subs].filter((x) => x.n >= 2).sort((a, b) => a.right / a.n - b.right / b.n)[0];
    const negative = local.wrong;
    const perQ = Math.round(run.seconds / Math.max(1, run.questions.length));
    return (
      <div className="st-page" data-study="mock-result">
        <div className="ax-wrap st-mock-res">
          <section className="st-mock-score">
            <div><small>Your marks</small><b data-study="mock-marks">{local.marks} / {local.max}</b><span>{pct}% · {local.right} right, {local.wrong} wrong, {local.skipped} skipped</span></div>
            <div className="pc" data-study="mock-percentile">{saved?.percentile != null ? <><b>{saved.percentile}th</b><small>percentile among {saved.takers} students in the last 90 days</small></> : isLoggedIn ? <small>{saved ? `Your percentile appears once 20 students have taken tests (now ${saved.takers}).` : saveErr || "Saving your result…"}</small> : <small><a href={loginUrl("/", { next: "/mock-test" })}>Sign in</a> to save results and see your percentile.</small>}</div>
            {last && <div className="vs"><TrendingUp size={16} /> {local.marks - last.marks >= 0 ? "+" : ""}{local.marks - last.marks} marks vs your last test</div>}
          </section>
          <section className="st-card st-mock-an" data-study="mock-analysis">
            <h2><Sparkles size={17} /> What this paper shows</h2>
            <ul>
              {weakest && <li>Weakest subject in this paper: <b>{weakest.subject}</b> ({weakest.right}/{weakest.n}). <Link href="/custom-test">Practise it</Link>.</li>}
              {negative > 0 && <li>Negative marking cost you <b>{negative} mark{negative === 1 ? "" : "s"}</b>. If you can rule out only one option, skipping is often safer.</li>}
              <li>You spent about <b>{perQ} seconds</b> a question{perQ > 60 ? ": aim for under a minute" : ""}.</li>
              {local.wrong > 0 && <li>Your {local.wrong} wrong answer{local.wrong === 1 ? " is" : "s are"} now in your <Link href="/my-library?tab=revision">revision deck</Link> and flashcards.</li>}
            </ul>
          </section>
          <Report r={run} onAgain={() => setPhase("intro")} again="Take another mock test" />
          {isLoggedIn && <section className="st-card"><h2><Trophy size={17} /> Leaderboard</h2><BoardSettings current={mine.data?.board ?? null} /></section>}
          <Leaderboard compact />
        </div>
      </div>
    );
  }

  const hist = mine.data?.history ?? [];
  const maxH = Math.max(1, ...hist.map((h) => h.maxMarks));
  return (
    <div className="st-page" data-study="mock">
      <div className="ax-wrap st-mock-intro">
        <section className="st-card st-mock-start">
          <span className="ic"><Brain size={28} /></span>
          <h1>NEET-PG mock test</h1>
          <p>A timed paper from {QUESTIONS.length} questions across {ALL_SUBJECTS.length} subjects, one minute a question, marked +4 for right and −1 for wrong. Review every answer at the end.</p>
          <div className="kh-tabs" role="tablist">{SIZES.map((n) => <button key={n} type="button" role="tab" aria-selected={size === n} className={size === n ? "on" : ""} onClick={() => setSize(n)} data-size={n}>{n} questions · {n} min</button>)}</div>
          <ul className="rules"><li><AlertCircle size={14} /> The test submits itself when time runs out.</li><li><Clock size={14} /> You can mark questions for review and come back.</li><li><BarChart3 size={14} /> {isLoggedIn ? "Your result is saved to your account." : "Sign in to save results and see your percentile."}</li></ul>
          <button type="button" className="st-btn lg" onClick={start} data-study="mock-start">Start the {size}-question test</button>
        </section>
        <aside>
          {hist.length > 0 && <section className="st-card" data-study="mock-history">
            <h2><History size={17} /> Your past tests</h2>
            <div className="st-mock-bars">{[...hist].reverse().slice(-12).map((h) => <span key={h.id} title={`${new Date(h.at).toLocaleDateString("en-IN")}: ${h.marks}/${h.maxMarks}`}><i style={{ height: `${Math.max(3, (Math.max(0, h.marks) / maxH) * 100)}%` }} /><small>{Math.round((h.marks / h.maxMarks) * 100)}%</small></span>)}</div>
            <p className="fine">Best: {Math.max(...hist.map((h) => Math.round((h.marks / h.maxMarks) * 100)))}% · {hist.length} test{hist.length === 1 ? "" : "s"}</p>
          </section>}
          <Leaderboard compact />
        </aside>
      </div>
    </div>
  );
}
