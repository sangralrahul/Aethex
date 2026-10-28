/**
 * High-Yield One-Liners (update 50): the exam's favourite facts on a topic as cue → answer. Cover the
 * answers to test yourself, mark the ones you missed, save them to notes.
 */
import { useState } from "react";
import { Copy, Eye, EyeOff, ListOrdered, Loader2, Save, X, Check } from "lucide-react";
import { allCrew, findCrew, onelinerPrompt, onelinersMarkdown, parseOneliners, type CrewMember, type OneLiner } from "@/lib/cadus/crew";

export default function CrewOnelinersView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<OneLiner[]>([]);
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [hide, setHide] = useState(true);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [got, setGot] = useState<Set<number>>(new Set());
  const [done, setDone] = useState("");
  const go = async () => {
    const c = findCrew(crewId, mine);
    if (!topic.trim()) { toast("Add a topic"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const l = parseOneliners(await ask(c, onelinerPrompt(topic, 20)));
      if (!l.length) { toast("The one-liners didn't come back in a usable form. Try again."); return; }
      setList(l); setShown(new Set()); setMissed(new Set()); setGot(new Set()); setDone(topic.trim());
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const mark = (i: number, ok: boolean) => {
    setShown((s) => new Set(s).add(i));
    setGot((s) => { const n = new Set(s); if (ok) n.add(i); else n.delete(i); return n; });
    setMissed((s) => { const n = new Set(s); if (!ok) n.add(i); else n.delete(i); return n; });
  };
  const missedList = list.filter((_, i) => missed.has(i));
  return (
    <section className="cx-page cx-lab cx-ol">
      <header className="cx-page-h"><div><h1>High-Yield One-Liners</h1><p>The most-tested facts on a topic, the way toppers revise. Cover the answers, recall, reveal, and keep the ones you missed.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} onKeyDown={(e) => { if (e.key === "Enter") void go(); }} placeholder="e.g. Antiepileptic drugs" data-ol="topic" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-ol="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-ol="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <ListOrdered size={14} />} {busy ? "Collecting…" : "Get one-liners"}</button></div>
      {list.length > 0 && (
        <div className="cx-ol-out" data-ol="out">
          <div className="cx-ol-bar">
            <span data-ol="tally" data-got={got.size} data-missed={missed.size}><b>{list.length}</b> one-liners · {got.size} known · {missed.size} missed</span>
            <button className="cx-btn" onClick={() => setHide((h) => !h)} data-ol="hide">{hide ? <Eye size={14} /> : <EyeOff size={14} />} {hide ? "Show all answers" : "Cover answers"}</button>
          </div>
          <ol className="cx-ol-list">
            {list.map((x, i) => {
              const open = !hide || shown.has(i);
              return (
                <li key={x.q} className={missed.has(i) ? "miss" : got.has(i) ? "got" : ""} data-ol="item">
                  <span className="cx-ol-q">{x.q}</span>
                  {open ? <span className="cx-ol-a" data-ol="answer">{x.a}</span> : <button className="cx-ol-reveal" onClick={() => setShown((s) => new Set(s).add(i))} data-ol="reveal">Reveal</button>}
                  <span className="cx-ol-m">
                    <button className="cx-ib" aria-label="I knew it" onClick={() => mark(i, true)} data-ol="knew"><Check size={15} /></button>
                    <button className="cx-ib" aria-label="I missed it" onClick={() => mark(i, false)} data-ol="miss"><X size={15} /></button>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="cx-sc-acts">
            <button className="cx-btn" disabled={!missedList.length} onClick={() => { onNote(crewId, onelinersMarkdown(done, missedList, "One-liners to revise"), `${done}: one-liners I missed`); toast("Missed one-liners saved to notes"); }} data-ol="save-missed"><Save size={14} /> Save the {missedList.length || ""} I missed</button>
            <button className="cx-btn" onClick={() => { onNote(crewId, onelinersMarkdown(done, list), `${done}: one-liners`); toast("Saved to Crew notes"); }} data-ol="save"><Save size={14} /> Save all</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(onelinersMarkdown(done, list)); toast("Copied"); }} data-ol="copy"><Copy size={14} /> Copy</button>
          </div>
        </div>
      )}
    </section>
  );
}
