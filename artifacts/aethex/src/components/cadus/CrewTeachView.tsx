/**
 * Teach-back Mode: explain a topic in your own words; an assistant grades it out of 10, lists what
 * you got right, what you missed and any errors, and gives a model explanation.
 */
import { useState, type ReactNode } from "react";
import { GraduationCap, Loader2, RotateCcw, StickyNote } from "lucide-react";
import { allCrew, findCrew, parseTeach, teachPrompt, type CrewMember, type TeachAttempt, type TeachResult } from "@/lib/cadus/crew";

export default function CrewTeachView({ mine, badge, ask, canAsk, friendlyError, toast, history, setHistory, onNote }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  history: TeachAttempt[];
  setHistory: (f: (l: TeachAttempt[]) => TeachAttempt[]) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [crewId, setCrewId] = useState("crew-viva");
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<TeachResult | null>(null);
  const c = findCrew(crewId, mine);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const run = async () => {
    if (!c) return;
    if (!topic.trim()) { toast("Add the topic you are explaining"); return; }
    if (words < 20) { toast("Write at least a few sentences (20 words or more)"); return; }
    if (!canAsk(1)) return;
    setBusy(true); setRes(null);
    try {
      const r = parseTeach(await ask(c, teachPrompt(topic, text)));
      if (!r) { toast("The grading didn't come back in a usable form. Try again."); return; }
      setRes(r);
      setHistory((l) => [{ at: Date.now(), crewId, topic: topic.trim().slice(0, 200), score: r.score }, ...l]);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const avg = history.length ? Math.round((history.slice(0, 10).reduce((a, x) => a + x.score, 0) / Math.min(10, history.length)) * 10) / 10 : 0;
  const tone = res ? (res.score >= 8 ? "good" : res.score >= 5 ? "mid" : "low") : "";
  return (
    <section className="cx-page cx-lab cx-teach">
      <header className="cx-page-h"><div><h1>Teach-back</h1><p>The fastest way to find gaps: explain a topic in your own words as if teaching a junior. An assistant grades it, shows what you missed and gives a model answer.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Examiner</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-tch="crew">{allCrew(mine).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="e.g. Pathophysiology of heart failure" data-tch="topic" /></label>
      </div>
      <label className="cx-field"><span>Your explanation <span className="opt">({words} words)</span></span><textarea className="cx-input" rows={7} value={text} onChange={(e) => setText(e.target.value.slice(0, 6000))} placeholder="Explain it as you would to a final-year student: definition, mechanism, features, management…" data-tch="text" /></label>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy} data-tch="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <GraduationCap size={14} />} {busy ? "Grading…" : "Grade my explanation"}</button>{history.length > 0 && <span className="cx-set-hint" data-tch="avg">Average of last {Math.min(10, history.length)}: {avg}/10</span>}</div>
      {res && (
        <div className="cx-cmp-out cx-teach-out" data-tch="out">
          <div className="cx-teach-head"><span className={`cx-teach-score ${tone}`} data-tch="score">{res.score}<small>/10</small></span><div>{c && badge(c, 20)}<p><b>{res.verdict}</b></p></div></div>
          {res.strengths.length > 0 && <><h4>What you got right</h4><ul data-tch="strengths">{res.strengths.map((s) => <li key={s}>{s}</li>)}</ul></>}
          {res.gaps.length > 0 && <><h4>What you missed</h4><ul data-tch="gaps">{res.gaps.map((s) => <li key={s}>{s}</li>)}</ul></>}
          {res.errors.length > 0 && <><h4>Corrections</h4><ul className="cx-teach-err" data-tch="errors">{res.errors.map((s) => <li key={s}>{s}</li>)}</ul></>}
          {res.model && <><h4>Model explanation</h4><p data-tch="model">{res.model}</p></>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { setRes(null); }} data-tch="again"><RotateCcw size={14} /> Improve and try again</button>
            <button className="cx-btn" onClick={() => { onNote(crewId, [`Score ${res.score}/10: ${res.verdict}`, res.gaps.length ? `Missed:\n- ${res.gaps.join("\n- ")}` : "", res.errors.length ? `Corrections:\n- ${res.errors.join("\n- ")}` : "", res.model ? `Model: ${res.model}` : ""].filter(Boolean).join("\n\n"), `Teach-back: ${topic}`); toast("Saved to Crew notes"); }} data-tch="save"><StickyNote size={14} /> Save to notes</button>
          </div>
        </div>
      )}
      {history.length > 0 && <><h4>Recent teach-backs</h4><ul className="cx-pomo-list" data-tch="history">{history.slice(0, 8).map((h, i) => <li key={h.at + i}><b>{h.topic}</b> · {h.score}/10 · {new Date(h.at).toLocaleDateString()}</li>)}</ul></>}
    </section>
  );
}
