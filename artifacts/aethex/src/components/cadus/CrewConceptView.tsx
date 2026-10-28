/**
 * Concept Map (update 50): a topic as a map — the topic in the centre, branches for causes, features,
 * tests, treatment and complications, and the links between them. Save to notes or print.
 */
import { useState } from "react";
import { Copy, Loader2, Network, Printer, Save } from "lucide-react";
import { allCrew, conceptMarkdown, conceptPrompt, findCrew, parseConcept, type ConceptMap, type CrewMember } from "@/lib/cadus/crew";
import { printMarkdown } from "@/lib/cadus/printdoc";
import { readLetterhead } from "@/lib/cadus/letterhead";

const TONES = ["teal", "sky", "violet", "amber", "rose", "lime", "teal", "sky"];

export default function CrewConceptView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
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
  const [map, setMap] = useState<ConceptMap | null>(null);
  const go = async () => {
    const c = findCrew(crewId, mine);
    if (!topic.trim()) { toast("Add a topic"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const m = parseConcept(await ask(c, conceptPrompt(topic)));
      if (!m) { toast("The map didn't come back in a usable form. Try again."); return; }
      setMap(m);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-cmap">
      <header className="cx-page-h"><div><h1>Concept Map</h1><p>See a topic as a whole: the condition in the centre, branches for causes, mechanism, features, tests, treatment and complications, and how they connect.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} onKeyDown={(e) => { if (e.key === "Enter") void go(); }} placeholder="e.g. Nephrotic syndrome" data-cm="topic" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-cm="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-cm="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Network size={14} />} {busy ? "Mapping…" : "Make the map"}</button></div>
      {map && (
        <div className="cx-cmap-out" data-cm="out">
          <div className="cx-cmap-c" data-cm="center">{map.center}</div>
          <div className="cx-cmap-grid">
            {map.branches.map((b, i) => (
              <div key={b.label} className={`cx-cmap-b tone-${TONES[i]}`} data-cm="branch">
                <h4>{b.label}</h4>
                <ul>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>
              </div>
            ))}
          </div>
          {map.links.length > 0 && <div className="cx-cmap-links" data-cm="links"><h4>Connections</h4><ul>{map.links.map((l) => <li key={l}>{l}</li>)}</ul></div>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { onNote(crewId, conceptMarkdown(map), `${map.center}: concept map`); toast("Saved to Crew notes"); }} data-cm="save"><Save size={14} /> Save to notes</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(conceptMarkdown(map)); toast("Copied"); }} data-cm="copy"><Copy size={14} /> Copy</button>
            <button className="cx-btn" onClick={() => void printMarkdown({ title: `${map.center}: concept map`, md: conceptMarkdown(map), letterhead: readLetterhead(), footer: "Concept map made with Cadus Crew by Aethex. Check facts against your textbook." })} data-cm="print"><Printer size={14} /> Print / PDF</button>
          </div>
        </div>
      )}
    </section>
  );
}
