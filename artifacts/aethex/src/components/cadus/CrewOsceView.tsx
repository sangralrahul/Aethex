/**
 * OSCE Station Practice (update 53): a station for any subject — door instructions, a timer, then the
 * examiner's checklist. Tick what you did, or type your attempt for the assistant to mark.
 */
import { useEffect, useState } from "react";
import { ClipboardCheck, Eye, Loader2, Play, RotateCcw, Save, Timer } from "lucide-react";
import { allCrew, findCrew, OSCE_TYPES, osceMarkdown, osceMarkPrompt, oscePrompt, osceScore, parseOsce, parseOsceMark, type CrewMember, type OsceStation } from "@/lib/cadus/crew";
import SubjectSelect from "./SubjectSelect";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function CrewOsceView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [subject, setSubject] = useState("Medicine");
  const [type, setType] = useState<string>(OSCE_TYPES[0]);
  const [topic, setTopic] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [busy, setBusy] = useState<"" | "make" | "mark">("");
  const [st, setSt] = useState<OsceStation | null>(null);
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [attempt, setAttempt] = useState("");
  const [phase, setPhase] = useState<"task" | "mark">("task");
  const [done, setDone] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const [showScenario, setShowScenario] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setLeft((s) => { if (s <= 1) { setRunning(false); setPhase("mark"); return 0; } return s - 1; }), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  const make = async () => {
    const c = findCrew(crewId, mine);
    if (!c || !canAsk(1)) return;
    setBusy("make");
    try {
      const s = parseOsce(await ask(c, oscePrompt(subject, type, topic)));
      if (!s) { toast("The station didn't come back in a usable form. Try again."); return; }
      setSt(s); setLeft(s.minutes * 60); setRunning(false); setPhase("task"); setDone([]); setFeedback(""); setAttempt(""); setShowScenario(false);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(""); }
  };
  const aiMark = async () => {
    const c = findCrew(crewId, mine);
    if (!st || !attempt.trim() || !c || !canAsk(1)) return;
    setBusy("mark");
    try {
      const m = parseOsceMark(await ask(c, osceMarkPrompt(st, attempt)), st.checklist.length);
      if (!m) { toast("The marking didn't come back in a usable form. Try again."); return; }
      setDone(m.done); setFeedback(m.feedback); setPhase("mark");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(""); }
  };
  const sc = st ? osceScore(st, done) : null;
  return (
    <section className="cx-page cx-lab cx-osce">
      <header className="cx-page-h"><div><h1>OSCE Station Practice</h1><p>A timed station for any subject, then the examiner's checklist. Practise aloud and tick what you did, or type your attempt and have it marked.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Subject</span><SubjectSelect value={subject} onChange={setSubject} data="osce" /></label>
        <label className="cx-field"><span>Station type</span><select className="cx-select" value={type} onChange={(e) => setType(e.target.value)} data-osce="type">{OSCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      </div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Topic (optional)</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 160))} placeholder="e.g. Chest pain history" data-osce="topic" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-osce="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void make()} disabled={!!busy} data-osce="make">{busy === "make" ? <Loader2 size={14} className="cx-rot" /> : <ClipboardCheck size={14} />} {busy === "make" ? "Setting up…" : st ? "New station" : "Make a station"}</button></div>
      {st && (
        <div className="cx-osce-out" data-osce="out">
          <div className="cx-osce-door">
            <div className="cx-osce-top"><h2>{st.title}</h2><span className={`cx-osce-time ${left <= 60 && running ? "low" : ""}`} data-osce="time"><Timer size={15} /> {mmss(left)}</span></div>
            <p className="cx-osce-task" data-osce="task">{st.task}</p>
            <div className="cx-sc-acts">
              {phase === "task" && <button className="cx-btn primary" onClick={() => setRunning((r) => !r)} data-osce="start"><Play size={14} /> {running ? "Pause" : left < st.minutes * 60 ? "Resume" : "Start the timer"}</button>}
              {phase === "task" && <button className="cx-btn" onClick={() => { setRunning(false); setPhase("mark"); }} data-osce="finish">Finish and mark</button>}
              <button className="cx-btn" onClick={() => setShowScenario((v) => !v)} data-osce="scenario-btn"><Eye size={14} /> {showScenario ? "Hide" : "Show"} the patient's script</button>
            </div>
            {showScenario && <p className="cx-osce-scn" data-osce="scenario">{st.scenario}</p>}
          </div>
          {phase === "task" && (
            <label className="cx-field"><span>Type what you would say and do (optional — for AI marking)</span><textarea className="cx-input" rows={5} value={attempt} onChange={(e) => setAttempt(e.target.value)} placeholder="Introduce yourself, confirm identity, consent…" data-osce="attempt" /></label>
          )}
          {phase === "mark" && sc && (
            <div className="cx-osce-mark" data-osce="mark">
              <div className="cx-osce-score"><b data-osce="score" data-got={sc.got} data-total={sc.total}>{sc.got}/{sc.total}</b><span>{sc.pct}%{sc.pct >= 60 ? " · pass mark reached" : " · below a typical 60% pass mark"}</span></div>
              {attempt.trim() && <div className="cx-sc-acts"><button className="cx-btn" onClick={() => void aiMark()} disabled={!!busy} data-osce="ai-mark">{busy === "mark" ? <Loader2 size={14} className="cx-rot" /> : <ClipboardCheck size={14} />} Mark my typed attempt</button></div>}
              {feedback && <p className="cx-osce-fb" data-osce="feedback">{feedback}</p>}
              <ul className="cx-osce-list">{st.checklist.map((c, i) => (
                <li key={i}><label className="cx-pa-mine"><input type="checkbox" checked={done.includes(i)} onChange={(e) => setDone((d) => (e.target.checked ? [...d, i] : d.filter((x) => x !== i)))} data-osce="item" /> {c.item}</label><small>{c.marks}</small></li>
              ))}</ul>
              <details className="cx-osce-model"><summary>Model performance and pitfalls</summary><p>{st.examinerNotes}</p>{st.pitfalls.length > 0 && <ul>{st.pitfalls.map((p) => <li key={p}>{p}</li>)}</ul>}</details>
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => { onNote(crewId, osceMarkdown(st, done), `OSCE: ${st.title}`); toast("Saved to Crew notes"); }} data-osce="save"><Save size={14} /> Save to notes</button>
                <button className="cx-btn" onClick={() => { setLeft(st.minutes * 60); setPhase("task"); setDone([]); setFeedback(""); }} data-osce="again"><RotateCcw size={14} /> Try this station again</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
