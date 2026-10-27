/**
 * Cheat Sheet Maker: one printable page of key facts, numbers, doses and traps for a topic, built
 * from the notes you pick (or standard facts if you pick none). Kept on this device.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Copy, FileText, Loader2, Printer, Save, Search, Trash2 } from "lucide-react";
import { allCrew, cheatPrompt, findCrew, type CheatSheet, type CrewMember, type CrewNote } from "@/lib/cadus/crew";
import { printMarkdown } from "@/lib/cadus/printdoc";
import { MdBlock } from "./LiveAnswer";

export default function CrewCheatView({ mine, badge, ask, canAsk, friendlyError, toast, notes, cheats, setCheats, onNote }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  notes: CrewNote[];
  cheats: CheatSheet[];
  setCheats: (f: (l: CheatSheet[]) => CheatSheet[]) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(cheats[0]?.id ?? "");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return notes.filter((n) => !t || n.title.toLowerCase().includes(t) || n.text.toLowerCase().includes(t)).slice(0, 40);
  }, [notes, q]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 8 ? (toast("Pick up to 8 notes"), p) : [...p, id]));
  const make = async () => {
    const c = findCrew(crewId, mine);
    if (!c) return;
    const src = notes.filter((n) => picked.includes(n.id));
    const title = topic.trim() || src[0]?.title || "";
    if (!title) { toast("Add a topic or pick some notes"); return; }
    if (!canAsk(1)) return;
    setBusy(true);
    try {
      const md = (await ask(c, cheatPrompt(title, src.map((n) => ({ title: n.title, text: n.text }))))).trim();
      if (!md) { toast("Nothing came back. Try again."); return; }
      const s: CheatSheet = { id: `cs-${Date.now().toString(36)}`, title: title.slice(0, 120), crewId, md, at: Date.now() };
      setCheats((l) => [s, ...l].slice(0, 30)); setOpenId(s.id); setTopic(""); setPicked([]);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-cheat">
      <header className="cx-page-h"><div><h1>Cheat Sheet Maker</h1><p>One page of the facts that matter: numbers, doses, steps and exam traps. Pick notes you saved to build it from them, or just type a topic.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="e.g. Heart failure drugs" data-cht="topic" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-cht="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      {notes.length > 0 && (
        <div className="cx-cht-notes">
          <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 80))} placeholder={`Search your ${notes.length} notes`} data-cht="q" /></label>
          <div className="cx-cht-pick" data-cht="notes">{list.map((n) => { const c = findCrew(n.crewId, mine); return <label key={n.id} className={`cx-pa-mine ${picked.includes(n.id) ? "on" : ""}`}><input type="checkbox" checked={picked.includes(n.id)} onChange={() => toggle(n.id)} data-cht-note={n.title} /> {c && badge(c, 16)} {n.title}</label>; })}</div>
          <small className="cx-set-hint">{picked.length ? `${picked.length} note${picked.length === 1 ? "" : "s"} picked` : "No notes picked: standard facts will be used."}</small>
        </div>
      )}
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void make()} disabled={busy} data-cht="make">{busy ? <Loader2 size={14} className="cx-rot" /> : <FileText size={14} />} {busy ? "Writing…" : "Make cheat sheet"}</button></div>
      <div className="cx-lp-list" data-cht="list">{cheats.map((s) => (
        <div key={s.id} className={`cx-lp ${openId === s.id ? "open" : ""}`} data-cht-item={s.title}>
          <button className="cx-lp-h" onClick={() => setOpenId(openId === s.id ? "" : s.id)}>{(() => { const c = findCrew(s.crewId, mine); return c ? badge(c, 22) : null; })()}<span className="cx-lp-t"><b>{s.title}</b><small>{new Date(s.at).toLocaleDateString()}</small></span></button>
          {openId === s.id && (
            <div className="cx-lp-b">
              <div className="cx-cht-page" data-cht="sheet"><MdBlock text={s.md} /></div>
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => void printMarkdown({ title: `Cheat sheet: ${s.title}`, md: s.md, footer: "Cheat sheet from Cadus Crew. Check doses against a current reference." })} data-cht="print"><Printer size={14} /> Print or PDF</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(s.md); toast("Copied"); }} data-cht="copy"><Copy size={14} /> Copy</button>
                <button className="cx-btn" onClick={() => { onNote(s.crewId, s.md, `Cheat sheet: ${s.title}`); toast("Saved to Crew notes"); }} data-cht="save"><Save size={14} /> Save to notes</button>
                <button className="cx-btn" onClick={() => setCheats((l) => l.filter((x) => x.id !== s.id))} data-cht="delete"><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}</div>
    </section>
  );
}
