/**
 * Update 90, Aethex Study: the question of the day. One NEET-PG bank question a day (India time), the same for
 * everyone. Answer it to see the explanation and how everyone else answered (signed-in answers are counted once per
 * day), then discuss it. On the Study home (compact) and at /question-of-the-day with yesterday's result and your last
 * 30 days. The answer also goes into your study record (progress, revision deck). Data: /api/study/qotd.
 * Styles: src/site-ws.css (.st-qotd*).
 */
import { lazy, Suspense, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarCheck, CheckCircle2, Loader2, MessageSquare, Sparkles, XCircle } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { loginUrl } from "@/lib/host";
import { QUESTIONS } from "@/data/neetpgQuestions";
import { fromBank } from "@/lib/study/questions";
import { study } from "@/lib/study/progress";

const Discussion = lazy(() => import("@/components/study/StudyBits3").then((m) => ({ default: m.Discussion })));

type Reveal = { choice: number; correct: boolean; answer: number; explanation: string };
type Stats = { answered: number; right: number; pct: number | null; picks: number[] };
type Qotd = {
  day: string; question: { id: number; key: string; subject: string; difficulty: string; question: string; options: string[] };
  you: Reveal | null; stats: Stats | null; signedIn: boolean; history: { day: string; correct: boolean }[];
  yesterday: { day: string; question: string; subject: string; key: string; answer: string } & Stats;
};
async function get(): Promise<Qotd> {
  const r = await fetch("/api/study/qotd", { credentials: "same-origin" });
  if (!r.ok) throw new Error("Couldn't load today's question.");
  return r.json();
}
const LETTERS = ["A", "B", "C", "D"];

export function QotdCard({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["study", "qotd"], queryFn: get, staleTime: 60_000, retry: false });
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [local, setLocal] = useState<{ you: Reveal; stats: Stats; counted: boolean } | null>(null);
  if (isLoading) return <section className="st-qotd load" aria-busy="true"><Loader2 size={16} className="spin" /> Loading today's question…</section>;
  if (isError || !data) return null;
  const you = data.you ?? local?.you ?? null, stats = data.stats ?? local?.stats ?? null;
  const answer = async (choice: number) => {
    if (busy || you) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/study/qotd", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: data.question.id, choice }) });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setErr(d?.error ?? "Something went wrong."); if (d?.stale) await qc.invalidateQueries({ queryKey: ["study", "qotd"] }); return; }
      setLocal({ you: d.you, stats: d.stats, counted: d.counted });
      const bank = QUESTIONS.find((x) => x.id === data.question.id);
      if (bank && !d.already) study.record(fromBank(bank), d.you.correct);
      if (d.counted) qc.setQueryData<Qotd>(["study", "qotd"], (o) => (o ? { ...o, you: d.you, stats: d.stats, history: [{ day: d.day, correct: d.you.correct }, ...o.history.filter((h) => h.day !== d.day)] } : o));
    } catch { setErr("You seem to be offline."); } finally { setBusy(false); }
  };
  const q = data.question;
  return (
    <section className={`st-qotd${compact ? " compact" : ""}`} data-study="qotd" aria-label="Question of the day">
      <div className="hd">
        <span className="tag"><Sparkles size={14} /> Question of the day</span>
        <small>{q.subject} · {q.difficulty}</small>
        {compact && <Link href="/question-of-the-day" className="more">Past days <ArrowRight size={13} /></Link>}
      </div>
      <p className="q">{q.question}</p>
      <ol className="opts">
        {q.options.map((o, i) => {
          const st = !you ? "" : i === you.answer ? "right" : i === you.choice ? "wrong" : "";
          const share = stats && stats.answered ? Math.round((stats.picks[i]! / stats.answered) * 100) : null;
          return (
            <li key={i}>
              <button type="button" className={st} disabled={!!you || busy} onClick={() => void answer(i)} data-opt={i} aria-pressed={you?.choice === i}>
                <b>{LETTERS[i]}</b><span>{o}</span>
                {you && share !== null && <em style={{ ["--w" as string]: `${share}%` }}>{share}%</em>}
              </button>
            </li>
          );
        })}
      </ol>
      {err && <p className="ax-form-err" role="alert">{err}</p>}
      {you && (
        <div className="res" data-study="qotd-result">
          <p className={you.correct ? "ok" : "no"}>{you.correct ? <><CheckCircle2 size={16} /> Correct.</> : <><XCircle size={16} /> Not this time: the answer is {LETTERS[you.answer]}.</>}
            {stats && stats.answered > 0 && <span> {stats.pct}% of {stats.answered} {stats.answered === 1 ? "student" : "students"} got it right today.</span>}</p>
          <p className="ex">{you.explanation}</p>
          {!data.signedIn && <p className="fine"><a href={loginUrl("/", { next: "/question-of-the-day" })}>Sign in</a> to have your answer counted and keep a record of your days.</p>}
          {compact ? <Link href="/question-of-the-day" className="ax-link"><MessageSquare size={14} /> Discuss this question</Link>
            : <Suspense fallback={null}><Discussion qkey={q.key} /></Suspense>}
        </div>
      )}
    </section>
  );
}

export default function QotdPage() {
  useSeo({ title: "Question of the day | Aethex Study", description: "One NEET-PG question a day for everyone: answer it, see the explanation and how other students answered, and discuss it.", path: "/question-of-the-day" });
  const { data } = useQuery({ queryKey: ["study", "qotd"], queryFn: get, staleTime: 60_000, retry: false });
  const right = data?.history.filter((h) => h.correct).length ?? 0;
  return (
    <div className="st-page" data-study="qotd-page">
      <div className="ax-wrap st-qotd-page">
        <h1>Question of the day</h1>
        <p className="lead">A new NEET-PG question every day at midnight, India time. Everyone gets the same one.</p>
        <QotdCard />
        {data && (
          <div className="st-qotd-side">
            <section className="st-card" data-study="qotd-yesterday">
              <h2>Yesterday</h2>
              <p className="yq">{data.yesterday.question}</p>
              <p>Answer: <b>{data.yesterday.answer}</b></p>
              <p className="fine">{data.yesterday.answered ? `${data.yesterday.pct}% of ${data.yesterday.answered} ${data.yesterday.answered === 1 ? "student" : "students"} got it right.` : "No signed-in answers were counted yesterday."}</p>
            </section>
            {data.signedIn && (
              <section className="st-card" data-study="qotd-history">
                <h2><CalendarCheck size={17} /> Your last 30 days</h2>
                {data.history.length ? <>
                  <p>{right} right out of {data.history.length} answered.</p>
                  <ol className="st-qotd-days">{data.history.slice().reverse().map((h) => <li key={h.day} className={h.correct ? "ok" : "no"} title={`${h.day}: ${h.correct ? "right" : "wrong"}`}>{h.day.slice(8)}</li>)}</ol>
                </> : <p className="fine">Answer today's question to start your record.</p>}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
