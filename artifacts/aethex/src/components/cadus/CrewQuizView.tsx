/**
 * Quiz Battle: a Crew assistant writes MCQs on any topic, then one player or two (pass the phone)
 * race through them with a timer, streak bonuses and explanations. Results and a leaderboard stay
 * on this device.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Crown, Loader2, RotateCcw, Swords, Timer, Trophy, X } from "lucide-react";
import { allCrew, findCrew, parseQuiz, quizLeaderboard, quizPoints, quizPrompt, readQuizResults, saveQuizResults, type CrewMember, type QuizLevel, type QuizQ, type QuizResult } from "@/lib/cadus/crew";

interface P { name: string; score: number; streak: number; correct: number; total: number }

export default function CrewQuizView({ mine, badge, ask, canAsk, friendlyError, toast, onMistake }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  /** Update 41: wrong answers go to the mistake notebook. */
  onMistake?: (m: { q: string; options: string[]; answer: number; why: string; crewId: string; topic: string }) => void;
}) {
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [topic, setTopic] = useState("");
  const [n, setN] = useState(5);
  const [level, setLevel] = useState<QuizLevel>("exam");
  const [limit, setLimit] = useState(30);
  const [two, setTwo] = useState(false);
  const [names, setNames] = useState(["You", "Friend"]);
  const [busy, setBusy] = useState(false);
  const [qs, setQs] = useState<QuizQ[]>([]);
  const [i, setI] = useState(0);
  const [players, setPlayers] = useState<P[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [log, setLog] = useState<{ q: number; who: number; pick: number | null }[]>([]);
  const [history, setHistory] = useState<QuizResult[]>(readQuizResults);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const turn = two ? i % 2 : 0;
  const c = findCrew(crewId, mine);

  const begin = (questions: QuizQ[]) => {
    setQs(questions); setI(0); setPicked(null); setLog([]); setDone(false);
    setPlayers((two ? names : [names[0]]).map((nm) => ({ name: nm.trim() || "Player", score: 0, streak: 0, correct: 0, total: 0 })));
    setLeft(limit);
  };
  const start = async () => {
    if (!c) return;
    if (!topic.trim()) { toast("Choose a topic first"); return; }
    if (!canAsk(1)) return;
    setBusy(true);
    try {
      const out = parseQuiz(await ask(c, quizPrompt(topic, n, level)));
      if (!out.length) { toast("The questions didn't come back in a usable form. Try again."); return; }
      begin(out);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const answer = (pick: number | null) => {
    if (picked !== null || !qs[i]) return;
    const right = pick === qs[i].answer;
    if (!right && onMistake) onMistake({ q: qs[i].q, options: qs[i].options, answer: qs[i].answer, why: qs[i].why, crewId, topic: topic.trim() });
    setPicked(pick ?? -1);
    setLog((l) => [...l, { q: i, who: turn, pick }]);
    setPlayers((ps) => ps.map((p, k) => (k !== turn ? p : { ...p, score: p.score + quizPoints(right, p.streak, left, limit), streak: right ? p.streak + 1 : 0, correct: p.correct + (right ? 1 : 0), total: p.total + 1 })));
  };
  const next = () => {
    if (i + 1 >= qs.length) {
      setDone(true);
      const r: QuizResult = { id: `qb-${Date.now().toString(36)}`, at: Date.now(), topic: topic.trim().slice(0, 120), level, crewId, players: players.map((p) => ({ name: p.name, score: p.score, correct: p.correct, total: p.total })) };
      const h = [r, ...history].slice(0, 40);
      setHistory(h); saveQuizResults(h);
      return;
    }
    setI(i + 1); setPicked(null); setLeft(limit);
  };
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!qs.length || done || picked !== null || !limit) return;
    timer.current = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [qs.length, i, picked, done, limit]);
  useEffect(() => { if (limit && qs.length && !done && picked === null && left <= 0) answer(null); /* time up */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const board = quizLeaderboard(history);
  const q = qs[i];
  const winner = done && players.length === 2 ? (players[0].score === players[1].score ? "It's a draw!" : `${(players[0].score > players[1].score ? players[0] : players[1]).name} wins!`) : "";

  return (
    <section className="cx-page cx-lab cx-quizb">
      <header className="cx-page-h"><div><h1>Quiz Battle</h1><p>An assistant writes exam-style MCQs on any topic. Play alone against the clock or challenge a friend on the same phone, with streak bonuses and an explanation for every answer.</p></div></header>
      {!qs.length && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Quizmaster</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-qb="crew">{allCrew(mine).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
            <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="e.g. Antiepileptic drugs, Brachial plexus, Dengue" data-qb="topic" /></label>
          </div>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Questions</span><select className="cx-select" value={n} onChange={(e) => setN(Number(e.target.value))} data-qb="n"><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option></select></label>
            <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as QuizLevel)} data-qb="level"><option value="easy">University exam</option><option value="exam">NEET-PG</option><option value="hard">Hard (INI-CET)</option></select></label>
            <label className="cx-field"><span>Timer per question</span><select className="cx-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))} data-qb="timer"><option value={0}>Off</option><option value={20}>20 seconds</option><option value={30}>30 seconds</option><option value={60}>60 seconds</option></select></label>
          </div>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={two} onChange={(e) => setTwo(e.target.checked)} data-qb="two" /> Two players (take turns on this device)</label>
            <label className="cx-field"><span>{two ? "Player 1" : "Your name"}</span><input className="cx-input" value={names[0]} onChange={(e) => setNames([e.target.value.slice(0, 20), names[1]])} data-qb="p1" /></label>
            {two && <label className="cx-field"><span>Player 2</span><input className="cx-input" value={names[1]} onChange={(e) => setNames([names[0], e.target.value.slice(0, 20)])} data-qb="p2" /></label>}
          </div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void start()} disabled={busy} data-qb="start">{busy ? <Loader2 size={14} className="cx-rot" /> : <Swords size={14} />} {busy ? "Writing questions…" : "Start the battle"}</button></div>
          {board.length > 0 && (
            <div className="cx-cmp-out" data-qb="board">
              <h3 className="cx-lab-h3"><Trophy size={16} /> Leaderboard</h3>
              <table className="cx-c23-table"><thead><tr><th>Player</th><th>Best</th><th>Games</th><th>Accuracy</th></tr></thead><tbody>{board.map((b, k) => <tr key={b.name}><td>{k === 0 && <Crown size={12} />} {b.name}</td><td>{b.best}</td><td>{b.games}</td><td>{b.accuracy}%</td></tr>)}</tbody></table>
              <h4>Recent battles</h4>
              <ul>{history.slice(0, 5).map((r) => <li key={r.id}>{r.topic}: {r.players.map((p) => `${p.name} ${p.score}`).join(" vs ")}</li>)}</ul>
            </div>
          )}
        </>
      )}
      {qs.length > 0 && !done && q && (
        <div data-qb="play">
          <div className="cx-qb-score">{players.map((p, k) => <span key={k} className={`cx-chip ${k === turn ? "on" : ""}`} data-qb-player={k}><b>{p.name}</b> {p.score}{p.streak >= 2 ? ` · ${p.streak} in a row` : ""}</span>)}{limit > 0 && <span className={`cx-chip ${left <= 5 ? "warn" : ""}`} data-qb="left"><Timer size={13} /> {Math.max(0, left)}s</span>}</div>
          <p className="cx-set-hint">Question {i + 1} of {qs.length}{two ? ` · ${players[turn]?.name === "You" ? "Your" : `${players[turn]?.name}'s`} turn` : ""}{c ? ` · set by ${c.name}` : ""}</p>
          <h3 className="cx-lab-h3" data-qb="q">{q.q}</h3>
          <div className="cx-qb-opts">{q.options.map((o, k) => (
            <button key={k} className={`cx-qb-opt ${picked !== null ? (k === q.answer ? "right" : k === picked ? "wrong" : "") : ""}`} onClick={() => answer(k)} disabled={picked !== null} data-qb-opt={k}>
              <span>{String.fromCharCode(65 + k)}</span>{o}{picked !== null && k === q.answer && <Check size={14} />}{picked === k && k !== q.answer && <X size={14} />}
            </button>
          ))}</div>
          {picked !== null && (
            <div className={`cx-cmp-out ${picked === q.answer ? "cx-ac-in" : "cx-st-out"}`} data-qb="why">
              <p><b>{picked === q.answer ? "Correct!" : picked === -1 ? `Time's up. The answer is ${String.fromCharCode(65 + q.answer)}.` : `Not quite. The answer is ${String.fromCharCode(65 + q.answer)}.`}</b> {q.why}</p>
              <div className="cx-sc-acts"><button className="cx-btn primary" onClick={next} data-qb="next">{i + 1 >= qs.length ? "See results" : "Next question"}</button></div>
            </div>
          )}
        </div>
      )}
      {done && (
        <div className="cx-cmp-out" data-qb="result">
          <h3 className="cx-lab-h3"><Trophy size={16} /> {winner || `${players[0]?.score ?? 0} points`}</h3>
          <div className="cx-sim-stats">{players.map((p) => <div key={p.name}><b>{p.score}</b><small>{p.name}: {p.correct}/{p.total} right</small></div>)}</div>
          <h4>Review</h4>
          <ol className="cx-c23-steps">{qs.map((x, k) => { const l = log.find((e) => e.q === k); return <li key={k}><b>{x.q}</b><br />Answer: {x.options[x.answer]}{l && l.pick !== x.answer ? ` (${players[l.who]?.name ?? ""} chose ${l.pick === null ? "nothing" : x.options[l.pick]})` : " ✓"}<br /><small>{x.why}</small></li>; })}</ol>
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => begin(qs)} data-qb="rematch"><RotateCcw size={14} /> Rematch (same questions)</button>
            <button className="cx-btn" onClick={() => { setQs([]); setDone(false); }} data-qb="new">New battle</button>
          </div>
          {c && <p className="cx-set-hint">{badge(c, 18)} Questions by {c.name}. AI-written questions can contain mistakes: check anything surprising in a textbook.</p>}
        </div>
      )}
    </section>
  );
}
