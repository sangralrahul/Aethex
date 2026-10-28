/**
 * Socratic Tutor (update 50): the assistant teaches by asking — one question at a time, feedback on
 * each answer, building from mechanism to the patient, then a summary and a reasoning score.
 */
import { useState } from "react";
import { Loader2, MessageCircleQuestion, RotateCcw, Save, Send } from "lucide-react";
import { allCrew, findCrew, parseSocratic, socraticMarkdown, socraticPrompt, SOCRATIC_MAX, type CrewMember, type SocraticTurn } from "@/lib/cadus/crew";
import { MdBlock } from "./LiveAnswer";

const LEVELS = ["an MBBS student", "an intern", "a postgraduate resident"];

export default function CrewSocraticView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<SocraticTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [summary, setSummary] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [started, setStarted] = useState("");
  const step = async (history: SocraticTurn[]) => {
    const c = findCrew(crewId, mine);
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const r = parseSocratic(await ask(c, socraticPrompt(started || topic, level, history)));
      if (!r) { toast("The tutor's reply didn't come back in a usable form. Try again."); return; }
      const next = history.length ? history.map((t, i) => (i === history.length - 1 ? { ...t, feedback: r.feedback } : t)) : history;
      setTurns(next);
      if (r.done) { setSummary(r.summary); setScore(r.score); setQuestion(""); }
      else setQuestion(r.question);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const start = () => {
    if (!topic.trim()) { toast("Add a topic"); return; }
    setStarted(topic.trim()); setTurns([]); setSummary(""); setScore(null); setAnswer("");
    void (async () => { await step([]); })();
  };
  const reply = () => {
    const h = [...turns, { q: question, a: answer.trim().slice(0, 2000) }];
    setAnswer(""); setTurns(h); setQuestion("");
    void step(h);
  };
  const finished = score !== null;
  return (
    <section className="cx-page cx-lab cx-soc">
      <header className="cx-page-h"><div><h1>Socratic Tutor</h1><p>Learn by thinking, not reading. The tutor asks one question at a time, corrects you gently, and leads you from mechanism to the patient in {SOCRATIC_MAX} steps.</p></div></header>
      {!started || finished ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} onKeyDown={(e) => { if (e.key === "Enter") start(); }} placeholder="e.g. Why does septic shock cause lactic acidosis?" data-soc="topic" /></label>
            <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value)} data-soc="level">{LEVELS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}</select></label>
            <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-soc="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={start} disabled={busy} data-soc="start">{busy ? <Loader2 size={14} className="cx-rot" /> : <MessageCircleQuestion size={14} />} {finished ? "Start a new session" : "Start"}</button></div>
        </>
      ) : null}
      {started && (
        <div className="cx-soc-out" data-soc="out">
          <div className="cx-soc-prog" aria-label="Progress"><span style={{ width: `${Math.min(100, Math.round((100 * turns.length) / SOCRATIC_MAX))}%` }} /></div>
          {turns.map((t, i) => (
            <div key={i} className="cx-soc-turn" data-soc="turn">
              <p className="cx-soc-q"><b>Q{i + 1}.</b> {t.q}</p>
              <p className="cx-soc-a">{t.a || <i>No answer</i>}</p>
              {t.feedback && <div className="cx-soc-fb" data-soc="feedback"><MdBlock text={t.feedback} /></div>}
            </div>
          ))}
          {busy && <p className="cx-set-hint"><Loader2 size={14} className="cx-rot" /> Thinking…</p>}
          {question && !busy && (
            <div className="cx-soc-ask">
              <p className="cx-soc-q" data-soc="question"><b>Q{turns.length + 1}.</b> {question}</p>
              <textarea className="cx-input" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) reply(); }} placeholder="Think it through, then answer in your own words…" data-soc="answer" />
              <div className="cx-sc-acts"><button className="cx-btn primary" onClick={reply} data-soc="send"><Send size={14} /> {answer.trim() ? "Answer" : "I'm stuck — give me a hint"}</button></div>
            </div>
          )}
          {finished && (
            <div className="cx-soc-sum" data-soc="summary" data-score={score}>
              <h4>Reasoning score: {score}/10</h4>
              <MdBlock text={summary} />
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => { onNote(crewId, socraticMarkdown(started, turns, summary), `${started}: Socratic session`); toast("Saved to Crew notes"); }} data-soc="save"><Save size={14} /> Save the session</button>
                <button className="cx-btn" onClick={() => { setStarted(""); setTurns([]); setScore(null); setSummary(""); }} data-soc="again"><RotateCcw size={14} /> New topic</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
