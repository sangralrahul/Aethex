/**
 * Guess the Diagnosis: a hidden case; ask yes/no questions (up to 20), order tests (free), and make
 * up to 3 guesses. Fewer questions and tests score higher.
 */
import { useState } from "react";
import { Dices, Flag, FlaskConical, Loader2, Save, Send } from "lucide-react";
import { checkGuess, findCrew, GUESS_AREAS, guessAnswerPrompt, guessCasePrompt, guessScore, parseGuessCase, readGuess, saveGuess, type CrewMember, type GuessCase, type GuessResult, type QuizLevel } from "@/lib/cadus/crew";

const MAX_Q = 20, MAX_GUESS = 3;
type Entry = { kind: "q" | "test" | "guess"; q: string; a: string };

export default function CrewGuessView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [area, setArea] = useState("Any");
  const [level, setLevel] = useState<QuizLevel>("exam");
  const [busy, setBusy] = useState(false);
  const [gc, setGc] = useState<GuessCase | null>(null);
  const [log, setLog] = useState<Entry[]>([]);
  const [question, setQuestion] = useState("");
  const [guess, setGuess] = useState("");
  const [state, setState] = useState<"play" | "won" | "lost">("play");
  const [hist, setHist] = useState<GuessResult[]>(readGuess);
  const coach = findCrew("crew-neetpg", mine);
  const nq = log.filter((e) => e.kind === "q").length, nt = log.filter((e) => e.kind === "test").length, wrong = log.filter((e) => e.kind === "guess" && e.a !== "Correct").length;
  const finish = (solved: boolean, entries: Entry[]) => {
    if (!gc) return;
    setState(solved ? "won" : "lost");
    const q = entries.filter((e) => e.kind === "q").length, t = entries.filter((e) => e.kind === "test").length, w = entries.filter((e) => e.kind === "guess" && e.a !== "Correct").length;
    const r: GuessResult = { at: Date.now(), diagnosis: gc.diagnosis, solved, score: guessScore(q, t, w, solved), questions: q };
    const h = [r, ...hist].slice(0, 50); setHist(h); saveGuess(h);
  };
  const start = async () => {
    if (!coach || !canAsk(1)) return;
    setBusy(true);
    try {
      const c = parseGuessCase(await ask(coach, guessCasePrompt(area, level)));
      if (!c) { toast("The case didn't come back in a usable form. Try again."); return; }
      setGc(c); setLog([]); setState("play"); setQuestion(""); setGuess("");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const askQ = async () => {
    const q = question.trim();
    if (!gc || !coach || !q || nq >= MAX_Q || state !== "play" || !canAsk(1)) return;
    setBusy(true);
    try {
      const a = (await ask(coach, guessAnswerPrompt(gc, log.filter((e) => e.kind === "q"), q))).trim().split("\n")[0].slice(0, 300);
      setLog((l) => [...l, { kind: "q", q, a: a || "Not known." }]); setQuestion("");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const order = (name: string) => {
    if (!gc || state !== "play" || log.some((e) => e.kind === "test" && e.q === name)) return;
    const t = gc.tests.find((x) => x.name === name);
    if (t) setLog((l) => [...l, { kind: "test", q: t.name, a: t.result }]);
  };
  const tryGuess = () => {
    const g = guess.trim();
    if (!gc || !g || state !== "play") return;
    const right = checkGuess(gc, g);
    const entries = [...log, { kind: "guess" as const, q: g, a: right ? "Correct" : "Not it" }];
    setLog(entries); setGuess("");
    if (right) finish(true, entries);
    else if (entries.filter((e) => e.kind === "guess").length >= MAX_GUESS) finish(false, entries);
  };
  const solved = hist.filter((h) => h.solved).length;
  return (
    <section className="cx-page cx-lab cx-guess">
      <header className="cx-page-h"><div><h1>Guess the Diagnosis</h1><p>A patient with a hidden diagnosis. Ask yes/no questions (up to {MAX_Q}), order tests, and name the diagnosis in {MAX_GUESS} guesses or fewer. Fewer questions and tests score higher.</p></div></header>
      {hist.length > 0 && <div className="cx-sim-stats"><div><b data-gs="played">{hist.length}</b><small>cases played</small></div><div><b>{solved}</b><small>solved</small></div><div><b>{Math.max(...hist.map((h) => h.score))}</b><small>best score</small></div></div>}
      {(!gc || state !== "play") && (
        <div className="cx-c23-row">
          <label className="cx-field"><span>Area</span><select className="cx-select" value={area} onChange={(e) => setArea(e.target.value)} data-gs="area">{GUESS_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
          <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as QuizLevel)} data-gs="level"><option value="easy">MBBS (classic)</option><option value="exam">NEET-PG</option><option value="hard">Hard</option></select></label>
        </div>
      )}
      {(!gc || state !== "play") && <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void start()} disabled={busy} data-gs="start">{busy ? <Loader2 size={14} className="cx-rot" /> : <Dices size={14} />} {busy ? "Making a case…" : gc ? "New case" : "Start a case"}</button></div>}
      {gc && (
        <div className="cx-gs" data-gs="game" data-state={state}>
          <div className="cx-gs-open"><b>Patient:</b> <span data-gs="opening">{gc.opening}</span></div>
          <div className="cx-gs-meta"><span data-gs="left">{MAX_Q - nq} questions left</span><span>{nt} test{nt === 1 ? "" : "s"}</span><span>{MAX_GUESS - log.filter((e) => e.kind === "guess").length} guesses left</span></div>
          <ol className="cx-gs-log" data-gs="log">{log.map((e, i) => <li key={i} className={`k-${e.kind} ${e.kind === "guess" ? (e.a === "Correct" ? "ok" : "no") : ""}`} data-gs-entry={e.kind}><b>{e.kind === "test" ? `Test: ${e.q}` : e.kind === "guess" ? `Guess: ${e.q}` : e.q}</b><span>{e.a}</span></li>)}</ol>
          {state === "play" ? (
            <>
              <div className="cx-gs-row"><input className="cx-input" value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 300))} onKeyDown={(e) => { if (e.key === "Enter") void askQ(); }} placeholder="Ask a yes/no question, e.g. Any recent travel?" disabled={busy || nq >= MAX_Q} data-gs="q" /><button className="cx-btn" onClick={() => void askQ()} disabled={busy || !question.trim() || nq >= MAX_Q} data-gs="ask">{busy ? <Loader2 size={14} className="cx-rot" /> : <Send size={14} />} Ask</button></div>
              {gc.tests.length > 0 && <div className="cx-crew-chips" data-gs="tests"><span className="cx-set-hint"><FlaskConical size={13} /> Order a test:</span>{gc.tests.map((t) => <button key={t.name} className={`cx-chip ${log.some((e) => e.kind === "test" && e.q === t.name) ? "on" : ""}`} onClick={() => order(t.name)} data-gs-test={t.name}>{t.name}</button>)}</div>}
              <div className="cx-gs-row"><input className="cx-input" value={guess} onChange={(e) => setGuess(e.target.value.slice(0, 160))} onKeyDown={(e) => { if (e.key === "Enter") tryGuess(); }} placeholder="Your diagnosis" data-gs="guess" /><button className="cx-btn primary" onClick={tryGuess} disabled={!guess.trim()} data-gs="go">Guess</button><button className="cx-btn" onClick={() => finish(false, log)} data-gs="giveup"><Flag size={14} /> Give up</button></div>
            </>
          ) : (
            <div className={`cx-cmp-out ${state === "won" ? "cx-ac-in" : "cx-ac-high"}`} data-gs="reveal">
              <h3 className="cx-lab-h3">{state === "won" ? `Solved! Score ${guessScore(nq, nt, wrong, true)}` : "The diagnosis was"}: <span data-gs="dx">{gc.diagnosis}</span></h3>
              {gc.teaching.length > 0 && <ul>{gc.teaching.map((t) => <li key={t}>{t}</li>)}</ul>}
              <details><summary>Full case record</summary><p className="cx-gs-profile">{gc.profile}</p></details>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { onNote("crew-neetpg", `## ${gc.diagnosis}\n\n**Presentation:** ${gc.opening}\n\n${gc.profile}\n\n**Tests:**\n${gc.tests.map((t) => `- ${t.name}: ${t.result}`).join("\n")}\n\n**Teaching points:**\n${gc.teaching.map((t) => `- ${t}`).join("\n")}`, `Case: ${gc.diagnosis}`); toast("Case saved to Crew notes"); }} data-gs="save"><Save size={14} /> Save case to notes</button></div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
