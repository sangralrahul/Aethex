/**
 * Explain at 3 Levels: the same topic explained simply (for a patient or a child), for an MBBS
 * student, and for a specialist.
 */
import { useState } from "react";
import { Copy, Layers2, Loader2, Save } from "lucide-react";
import { allCrew, findCrew, levelsMarkdown, levelsPrompt, parseLevels, type CrewMember, type ThreeLevels } from "@/lib/cadus/crew";
import { MdBlock } from "./LiveAnswer";

const TABS: [keyof ThreeLevels, string][] = [["simple", "Simply put"], ["student", "MBBS student"], ["expert", "Specialist"]];

export default function CrewLevelsView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
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
  const [out, setOut] = useState<{ topic: string; l: ThreeLevels } | null>(null);
  const [tab, setTab] = useState<keyof ThreeLevels>("simple");
  const go = async () => {
    const c = findCrew(crewId, mine);
    if (!topic.trim()) { toast("Add a topic"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const l = parseLevels(await ask(c, levelsPrompt(topic)));
      if (!l) { toast("The explanations didn't come back in a usable form. Try again."); return; }
      setOut({ topic: topic.trim(), l }); setTab("simple");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-levels">
      <header className="cx-page-h"><div><h1>Explain at 3 Levels</h1><p>One topic, three depths: simply (for a patient), for an MBBS student, and for a specialist. Great for building understanding layer by layer — and for explaining to patients.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} onKeyDown={(e) => { if (e.key === "Enter") void go(); }} placeholder="e.g. Heart failure" data-lv="topic" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-lv="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-lv="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Layers2 size={14} />} {busy ? "Explaining…" : "Explain"}</button></div>
      {out && (
        <div className="cx-lv-out" data-lv="out">
          <h2>{out.topic}</h2>
          <div className="cx-seg" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-lv-tab={k}>{l}</button>)}</div>
          <div className="cx-cht-page" data-lv="text"><MdBlock text={out.l[tab]} /></div>
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { onNote(crewId, levelsMarkdown(out.topic, out.l), `${out.topic} at 3 levels`); toast("Saved to Crew notes"); }} data-lv="save"><Save size={14} /> Save all three to notes</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out.l[tab]); toast("Copied"); }} data-lv="copy"><Copy size={14} /> Copy this level</button>
          </div>
        </div>
      )}
    </section>
  );
}
