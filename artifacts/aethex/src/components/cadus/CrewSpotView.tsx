/**
 * Spot the Error: an assistant writes a short teaching answer with hidden mistakes; tap the sentences
 * you think are wrong, then check. Rounds count towards the Weak Topic Radar.
 */
import { useState, type ReactNode } from "react";
import { Check, Loader2, RotateCcw, Save, SearchCheck } from "lucide-react";
import { allCrew, findCrew, parseSpot, readSpot, saveSpot, splitSentences, spotCheck, spotPrompt, spotSentenceOf, type CrewMember, type QuizLevel, type SpotAttempt, type SpotSet } from "@/lib/cadus/crew";

export default function CrewSpotView({ mine, badge, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [topic, setTopic] = useState("");
  const [n, setN] = useState(3);
  const [level, setLevel] = useState<QuizLevel>("exam");
  const [busy, setBusy] = useState(false);
  const [set, setSet] = useState<SpotSet | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [hist, setHist] = useState<SpotAttempt[]>(readSpot);
  const c = findCrew(crewId, mine);
  const sentences = set ? splitSentences(set.text) : [];
  const res = set && checked ? spotCheck(sentences, picked, set.errors) : null;
  const errAt = set ? set.errors.map((e) => spotSentenceOf(sentences, e)) : [];
  const start = async () => {
    if (!c) return;
    if (!topic.trim()) { toast("Add a topic"); return; }
    if (!canAsk(1)) return;
    setBusy(true);
    try {
      const s = parseSpot(await ask(c, spotPrompt(topic, n, level)), topic);
      if (!s) { toast("That round didn't come back in a usable form. Try again."); return; }
      setSet(s); setPicked([]); setChecked(false);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const check = () => {
    if (!set) return;
    setChecked(true);
    const r = spotCheck(sentences, picked, set.errors);
    const a: SpotAttempt = { at: Date.now(), topic: set.topic, crewId, found: r.found.length, total: set.errors.length, falsePicks: r.falsePicks.length };
    const h = [a, ...hist].slice(0, 100);
    setHist(h); saveSpot(h);
  };
  const avg = hist.length ? Math.round((100 * hist.reduce((s, x) => s + x.found, 0)) / Math.max(1, hist.reduce((s, x) => s + x.total, 0))) : 0;
  return (
    <section className="cx-page cx-lab cx-spot">
      <header className="cx-page-h"><div><h1>Spot the Error</h1><p>An assistant writes a short answer with a few deliberate mistakes. Tap every sentence you think is wrong, then check. Great practice for reading answers critically.</p></div></header>
      {hist.length > 0 && <div className="cx-sim-stats"><div><b data-spot="rounds">{hist.length}</b><small>rounds</small></div><div><b>{avg}%</b><small>errors found</small></div></div>}
      <div className="cx-c23-row">
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-spot="crew">{allCrew(mine).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="e.g. Absence seizures" data-spot="topic" /></label>
        <label className="cx-field"><span>Hidden errors</span><select className="cx-select" value={n} onChange={(e) => setN(Number(e.target.value))} data-spot="n">{[2, 3, 4].map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
        <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as QuizLevel)} data-spot="level"><option value="easy">MBBS</option><option value="exam">NEET-PG</option><option value="hard">Hard</option></select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void start()} disabled={busy} data-spot="start">{busy ? <Loader2 size={14} className="cx-rot" /> : <SearchCheck size={14} />} {busy ? "Writing…" : set ? "New round" : "Start a round"}</button></div>
      {set && (
        <div className="cx-spot-card" data-spot="card">
          <div className="cx-crew-dh">{c && badge(c, 24)}<b>{set.topic}</b><small>{set.errors.length} errors hidden · {picked.length} picked</small></div>
          <p className="cx-spot-text">{sentences.map((s, i) => {
            const st = !checked ? (picked.includes(i) ? "on" : "") : errAt.includes(i) ? (picked.includes(i) ? "found" : "missed") : picked.includes(i) ? "false" : "";
            return <button key={i} type="button" className={`cx-spot-s ${st}`} aria-pressed={picked.includes(i)} disabled={checked} onClick={() => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))} data-spot-s={i}>{s}</button>;
          })}</p>
          {!checked ? (
            <div className="cx-sc-acts"><button className="cx-btn primary" onClick={check} disabled={!picked.length} data-spot="check"><Check size={14} /> Check my picks</button></div>
          ) : res && (
            <div className={`cx-cmp-out ${res.score >= 80 ? "cx-ac-in" : res.score >= 50 ? "cx-ac-high" : "cx-st-out"}`} data-spot="result" data-found={res.found.length} data-false={res.falsePicks.length}>
              <h3 className="cx-lab-h3">Found {res.found.length} of {set.errors.length}{res.falsePicks.length ? ` · ${res.falsePicks.length} correct sentence${res.falsePicks.length === 1 ? "" : "s"} flagged` : ""} · score {res.score}</h3>
              <ol className="cx-c23-steps">{set.errors.map((e, i) => <li key={i} data-spot-fix={i}><b>{res.found.includes(i) ? "Found" : "Missed"}:</b> “{e.wrong}” → {e.fix}{e.why ? `. ${e.why}` : ""}</li>)}</ol>
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => { onNote(crewId, `## Spot the error: ${set.topic}\n\n${set.errors.map((e) => `- Wrong: ${e.wrong}\n  - Correct: ${e.fix}${e.why ? ` (${e.why})` : ""}`).join("\n")}`, `Spot the error: ${set.topic}`); toast("Corrections saved to Crew notes"); }} data-spot="save"><Save size={14} /> Save corrections</button>
                <button className="cx-btn" onClick={() => void start()} disabled={busy} data-spot="again"><RotateCcw size={14} /> Another round</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
