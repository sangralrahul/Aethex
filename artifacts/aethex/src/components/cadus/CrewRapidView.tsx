/**
 * Rapid Fire: a 60-second true-or-false round on a topic; beat your best score. Wrong answers can go
 * to the Mistakes notebook.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, NotebookPen, Timer, X, Zap } from "lucide-react";
import { findCrew, parseRapid, rapidPrompt, rapidScore, readRapid, recordRapid, saveRapid, type CrewMember, type QuizLevel, type RapidBest, type RapidQ } from "@/lib/cadus/crew";

const SECONDS = 60;

export default function CrewRapidView({ mine, ask, canAsk, friendlyError, toast, onMistake }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onMistake: (m: { q: string; options: string[]; answer: number; why: string; crewId: string; topic: string }) => void;
}) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<QuizLevel>("exam");
  const [busy, setBusy] = useState(false);
  const [qs, setQs] = useState<RapidQ[]>([]);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [left, setLeft] = useState(SECONDS);
  const [state, setState] = useState<"setup" | "play" | "done">("setup");
  const [bests, setBests] = useState<RapidBest[]>(readRapid);
  const [newBest, setNewBest] = useState(false);
  const tick = useRef<number | null>(null);
  const finish = (a: boolean[]) => {
    if (tick.current) window.clearInterval(tick.current);
    tick.current = null;
    setState("done");
    const r = recordRapid(bests, topic, rapidScore(a).score);
    setNewBest(r.best); setBests(r.list); saveRapid(r.list);
  };
  useEffect(() => () => { if (tick.current) window.clearInterval(tick.current); }, []);
  useEffect(() => { if (state === "play" && left <= 0) finish(answers); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = async () => {
    const c = findCrew("crew-neetpg", mine);
    if (!topic.trim()) { toast("Add a topic"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const q = parseRapid(await ask(c, rapidPrompt(topic, level)));
      if (q.length < 5) { toast("The round didn't come back in a usable form. Try again."); return; }
      setQs(q); setAnswers([]); setLeft(SECONDS); setState("play"); setNewBest(false);
      tick.current = window.setInterval(() => setLeft((s) => s - 1), 1000);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const answer = (v: boolean) => {
    if (state !== "play") return;
    const i = answers.length;
    const a = [...answers, qs[i].t === v];
    setAnswers(a);
    if (a.length >= qs.length) finish(a);
  };
  const r = rapidScore(answers);
  const cur = qs[answers.length];
  const best = bests.find((b) => b.topic.toLowerCase() === topic.trim().toLowerCase());
  return (
    <section className="cx-page cx-lab cx-rapid">
      <header className="cx-page-h"><div><h1>Rapid Fire</h1><p>True or false, as fast as you can, for 60 seconds. 10 points a right answer, bonus for streaks, minus 5 for a wrong one.</p></div></header>
      {state !== "play" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="e.g. Antiarrhythmic drugs" data-rf="topic" /></label>
            <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as QuizLevel)} data-rf="level"><option value="easy">MBBS</option><option value="exam">NEET-PG</option><option value="hard">Hard</option></select></label>
          </div>
          {best && <p className="cx-set-hint" data-rf="best">Your best on this topic: <b>{best.score}</b></p>}
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void start()} disabled={busy} data-rf="start">{busy ? <Loader2 size={14} className="cx-rot" /> : <Zap size={14} />} {busy ? "Loading statements…" : state === "done" ? "Play again" : "Start"}</button></div>
        </>
      )}
      {state === "play" && cur && (
        <div className="cx-rf-card" data-rf="play">
          <div className="cx-rf-top"><span className={`cx-rf-time ${left <= 10 ? "low" : ""}`} data-rf="time"><Timer size={14} /> {left}s</span><span data-rf="score">{r.score} pts</span><small>{answers.length + 1}/{qs.length}</small></div>
          <p className="cx-rf-s" data-rf="s">{cur.s}</p>
          <div className="cx-rf-btns"><button className="cx-btn ok" onClick={() => answer(true)} data-rf="true"><Check size={16} /> True</button><button className="cx-btn no" onClick={() => answer(false)} data-rf="false"><X size={16} /> False</button></div>
        </div>
      )}
      {state === "done" && (
        <div className={`cx-cmp-out ${newBest ? "cx-ac-in" : "cx-ac-high"}`} data-rf="result" data-score={r.score}>
          <h3 className="cx-lab-h3">{r.score} points · {r.right} right, {r.wrong} wrong · best streak {r.bestStreak}{newBest ? " · new best!" : ""}</h3>
          {r.wrong > 0 && (
            <>
              <ul className="cx-rf-wrong" data-rf="wrong">{answers.map((ok, i) => (ok ? null : <li key={i}><b>{qs[i].s}</b> — {qs[i].t ? "True" : "False"}. {qs[i].why}</li>))}</ul>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { answers.forEach((ok, i) => { if (!ok) onMistake({ q: `True or false: ${qs[i].s}`, options: ["True", "False"], answer: qs[i].t ? 0 : 1, why: qs[i].why, crewId: "crew-neetpg", topic: topic.trim() }); }); toast(`${r.wrong} added to Mistakes`); }} data-rf="mistakes"><NotebookPen size={14} /> Add wrong ones to Mistakes</button></div>
            </>
          )}
        </div>
      )}
      {bests.length > 0 && state !== "play" && <details className="cx-rf-bests"><summary>Best scores</summary><ol>{bests.slice(0, 10).map((b) => <li key={b.topic}>{b.topic}: <b>{b.score}</b></li>)}</ol></details>}
    </section>
  );
}
