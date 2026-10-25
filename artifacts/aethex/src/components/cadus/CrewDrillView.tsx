/**
 * Daily Drill: five questions a day from a chosen coach on your topics, weakest topic first, with
 * a streak, a 4-week calendar and your weak spots. Stays on this device.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Check, Flame, Loader2, Play, Target, X } from "lucide-react";
import { allCrew, bestStreak, dateKey, DRILL_N, drillCalendar, drillStreak, findCrew, parseQuiz, pickTopic, quizPrompt, readDrill, recordDrill, saveDrill, weakTopics, type CrewMember, type DrillState, type QuizLevel, type QuizQ } from "@/lib/cadus/crew";

const SUGGESTED = ["Cardiology", "Pharmacology", "Paediatrics", "Obstetrics", "Microbiology", "Anatomy", "Pathology", "PSM", "Surgery", "Medicine", "ECG", "Antibiotics"];

export default function CrewDrillView({ mine, badge, ask, canAsk, friendlyError, toast }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [d, setD] = useState<DrillState>(readDrill);
  const [topicText, setTopicText] = useState("");
  const [qs, setQs] = useState<QuizQ[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState("");
  useEffect(() => saveDrill(d), [d]);
  const today = dateKey();
  const done = d.days[today];
  const streak = drillStreak(d.days, today);
  const coach = findCrew(d.crewId, mine);
  const next = pickTopic(d, today);
  const addTopic = (t: string) => { const v = t.trim().slice(0, 60); if (v && !d.topics.includes(v) && d.topics.length < 20) setD({ ...d, topics: [...d.topics, v] }); };

  const start = async () => {
    if (!coach || !next) { toast("Add at least one topic"); return; }
    if (!canAsk(1)) return;
    setBusy(true);
    try {
      const q = parseQuiz(await ask(coach, quizPrompt(next, DRILL_N, d.level)));
      if (!q.length) { toast("The questions didn't come back in a usable form. Try again."); return; }
      setQs(q); setI(0); setPicked(null); setRight(0); setTopic(next);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const answer = (k: number) => { if (picked !== null) return; setPicked(k); if (k === qs[i].answer) setRight((r) => r + 1); };
  const go = () => {
    if (i + 1 < qs.length) { setI(i + 1); setPicked(null); return; }
    setD((s) => recordDrill(s, today, topic, right, qs.length));
    setQs([]);
    toast(`Drill done: ${right}/${qs.length}. Streak ${drillStreak({ ...d.days, [today]: { topic, correct: right, total: qs.length } }, today)} day(s)!`);
  };
  const q = qs[i];

  return (
    <section className="cx-page cx-lab cx-drill">
      <header className="cx-page-h"><div><h1>Daily Drill</h1><p>Five questions a day on your topics, weakest first. Keep the streak going and watch your weak spots shrink.</p></div></header>
      <div className="cx-sim-stats" data-dr="stats">
        <div><b data-dr="streak"><Flame size={18} /> {streak}</b><small>day streak (best {bestStreak(d.days)})</small></div>
        <div><b>{Object.keys(d.days).length}</b><small>drills done</small></div>
        <div><b>{Object.values(d.stats).reduce((n, s) => n + s.t, 0)}</b><small>questions answered</small></div>
      </div>
      <div className="cx-dr-cal" data-dr="cal" aria-label="Last 4 weeks">{drillCalendar(d, today).map((c) => <span key={c.key} className={c.day ? (c.day.correct / c.day.total >= 0.8 ? "hi" : "on") : ""} title={c.day ? `${c.key}: ${c.day.topic} ${c.day.correct}/${c.day.total}` : c.key} />)}</div>
      {!qs.length && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Coach</span><select className="cx-select" value={d.crewId} onChange={(e) => setD({ ...d, crewId: e.target.value })} data-dr="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="cx-field"><span>Level</span><select className="cx-select" value={d.level} onChange={(e) => setD({ ...d, level: e.target.value as QuizLevel })} data-dr="level"><option value="easy">University exam</option><option value="exam">NEET-PG</option><option value="hard">Hard</option></select></label>
            <label className="cx-field"><span>Add a topic</span><input className="cx-input" value={topicText} onChange={(e) => setTopicText(e.target.value.slice(0, 60))} onKeyDown={(e) => { if (e.key === "Enter") { addTopic(topicText); setTopicText(""); } }} placeholder="e.g. Antiepileptic drugs" data-dr="topic" /></label>
            <button className="cx-btn" onClick={() => { addTopic(topicText); setTopicText(""); }} disabled={!topicText.trim()} data-dr="add">Add</button>
          </div>
          <div className="cx-crew-chips" data-dr="topics">{d.topics.map((t) => <span key={t} className="cx-chip on">{t} <button className="cx-ib" aria-label={`Remove ${t}`} onClick={() => setD({ ...d, topics: d.topics.filter((x) => x !== t) })}><X size={12} /></button></span>)}{SUGGESTED.filter((t) => !d.topics.includes(t)).slice(0, 8).map((t) => <button key={t} className="cx-chip" onClick={() => addTopic(t)} data-dr-sug={t}>+ {t}</button>)}</div>
          {done ? (
            <div className="cx-cmp-out cx-ac-in" data-dr="done"><p><b><Check size={14} /> Today's drill is done: {done.topic}, {done.correct}/{done.total}.</b> Come back tomorrow to keep your {streak}-day streak.</p><button className="cx-btn" onClick={() => void start()} disabled={busy || !next} data-dr="extra">{busy ? <Loader2 size={14} className="cx-rot" /> : <Play size={14} />} Extra practice ({next})</button></div>
          ) : (
            <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void start()} disabled={busy || !next} data-dr="start">{busy ? <Loader2 size={14} className="cx-rot" /> : <Play size={14} />} {next ? `Start today's drill: ${next}` : "Add a topic to start"}</button>{coach && <span className="cx-set-hint">{badge(coach, 18)} by {coach.name}</span>}</div>
          )}
          {weakTopics(d).length > 0 && <><h4><Target size={14} /> Weak spots</h4><ul data-dr="weak">{weakTopics(d).map((w) => <li key={w.topic}>{w.topic}: {w.pct}% of {w.answered}</li>)}</ul></>}
        </>
      )}
      {q && (
        <div data-dr="play">
          <p className="cx-set-hint">{topic} · question {i + 1} of {qs.length}</p>
          <h3 className="cx-lab-h3" data-dr="q">{q.q}</h3>
          <div className="cx-qb-opts">{q.options.map((o, k) => <button key={k} className={`cx-qb-opt ${picked !== null ? (k === q.answer ? "right" : k === picked ? "wrong" : "") : ""}`} disabled={picked !== null} onClick={() => answer(k)} data-dr-opt={k}><span>{String.fromCharCode(65 + k)}</span>{o}</button>)}</div>
          {picked !== null && <div className={`cx-cmp-out ${picked === q.answer ? "cx-ac-in" : "cx-st-out"}`} data-dr="why"><p><b>{picked === q.answer ? "Correct!" : `The answer is ${String.fromCharCode(65 + q.answer)}.`}</b> {q.why}</p><div className="cx-sc-acts"><button className="cx-btn primary" onClick={go} data-dr="next">{i + 1 < qs.length ? "Next" : "Finish"}</button></div></div>}
        </div>
      )}
    </section>
  );
}
