/**
 * Revision Sprint (update 53): 25 minutes on one topic in any subject — key points (10 min), quick
 * questions (10 min), recap (5 min). Wrong answers go to the Mistake Notebook.
 */
import { useEffect, useState } from "react";
import { Check, Loader2, Rocket, Save, Timer, X } from "lucide-react";
import { allCrew, findCrew, parseSprint, sprintMarkdown, sprintPrompt, SPRINT_PHASES, type CrewMember, type Sprint } from "@/lib/cadus/crew";
import SubjectSelect from "./SubjectSelect";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function CrewSprintView({ mine, ask, canAsk, friendlyError, toast, onNote, onMistake }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
  onMistake: (m: { q: string; options: string[]; answer: number; why: string; crewId: string; topic: string }) => void;
}) {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [busy, setBusy] = useState(false);
  const [sp, setSp] = useState<Sprint | null>(null);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(SPRINT_PHASES[0][1] * 60);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (!sp || finished) return;
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [sp, finished]);
  const right = sp ? sp.questions.filter((q, i) => picks[i] === q.answer).length : 0;
  const go = async () => {
    const c = findCrew(crewId, mine);
    if (!topic.trim()) { toast("Add a topic"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const s = parseSprint(await ask(c, sprintPrompt(subject, topic)), topic.trim());
      if (!s) { toast("The sprint didn't come back in a usable form. Try again."); return; }
      setSp(s); setPhase(0); setLeft(SPRINT_PHASES[0][1] * 60); setPicks({}); setFinished(false);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const next = () => {
    if (!sp) return;
    if (phase === 1) sp.questions.forEach((q, i) => { if (picks[i] !== undefined && picks[i] !== q.answer) onMistake({ q: q.q, options: q.options, answer: q.answer, why: q.why, crewId, topic: sp.topic }); });
    if (phase < 2) { setPhase(phase + 1); setLeft(SPRINT_PHASES[phase + 1][1] * 60); }
    else setFinished(true);
  };
  return (
    <section className="cx-page cx-lab cx-sprint">
      <header className="cx-page-h"><div><h1>Revision Sprint</h1><p>25 focused minutes on one topic from any subject: read the key points, answer quick questions, then a recap of what's most likely to be asked.</p></div></header>
      {!sp || finished ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Subject</span><SubjectSelect value={subject} onChange={setSubject} data="sp" /></label>
            <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 160))} onKeyDown={(e) => { if (e.key === "Enter") void go(); }} placeholder="e.g. Brachial plexus" data-sp="topic" /></label>
            <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-sp="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-sp="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Rocket size={14} />} {busy ? "Preparing…" : finished ? "Start another sprint" : "Start a 25-minute sprint"}</button></div>
        </>
      ) : null}
      {sp && (
        <div className="cx-sp-out" data-sp="out">
          <ol className="cx-sp-phases">{SPRINT_PHASES.map(([l, m], i) => <li key={l} className={finished || i < phase ? "done" : i === phase ? "on" : ""}><b>{l}</b><small>{m} min</small></li>)}</ol>
          {!finished && <div className="cx-sp-time" data-sp="time"><Timer size={15} /> {mmss(left)} {left === 0 && <em>Time's up — move on</em>}</div>}
          {!finished && phase === 0 && <ul className="cx-sp-kp" data-sp="points">{sp.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul>}
          {!finished && phase === 1 && (
            <ol className="cx-sp-qs" data-sp="questions">{sp.questions.map((q, i) => (
              <li key={i}><p>{q.q}</p>
                <div className="cx-smart-opts">{q.options.map((o, j) => {
                  const picked = picks[i]; const show = picked !== undefined;
                  return <button key={j} className={`cx-btn ${show && j === q.answer ? "ok" : show && j === picked ? "no" : ""}`} disabled={show} onClick={() => setPicks((p) => ({ ...p, [i]: j }))} data-sp="opt">{show && j === q.answer ? <Check size={13} /> : show && j === picked ? <X size={13} /> : null} {o}</button>;
                })}</div>
                {picks[i] !== undefined && <small className="cx-sp-why">{q.why}</small>}
              </li>
            ))}</ol>
          )}
          {!finished && phase === 2 && <ul className="cx-sp-kp recap" data-sp="recap">{sp.recap.map((k) => <li key={k}>{k}</li>)}</ul>}
          {!finished && <div className="cx-sc-acts"><button className="cx-btn primary" onClick={next} data-sp="next">{phase < 2 ? `Next: ${SPRINT_PHASES[phase + 1][0]}` : "Finish the sprint"}</button></div>}
          {finished && (
            <div className="cx-sp-done" data-sp="done" data-right={right}>
              <h3>Sprint done: {right}/{sp.questions.length} right</h3>
              <p>{right === sp.questions.length ? "Perfect round." : "The ones you missed are in your Mistake Notebook for re-testing."}</p>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { onNote(crewId, sprintMarkdown(sp, right), `Sprint: ${sp.topic}`); toast("Saved to Crew notes"); }} data-sp="save"><Save size={14} /> Save points and recap</button></div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
