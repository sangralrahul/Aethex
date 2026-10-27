/**
 * Compare Two Conditions: a side-by-side table (e.g. Crohn's vs UC) with key differentiators and
 * exam traps; save as notes with flashcards, print or copy. Kept on this device.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Columns2, Copy, Loader2, Printer, Save, Trash2 } from "lucide-react";
import { allCrew, findCrew, parseVs, readVs, saveVs, vsMarkdown, vsPrompt, type CrewMember, type QuizLevel, type VsTable } from "@/lib/cadus/crew";
import { printMarkdown } from "@/lib/cadus/printdoc";

const PICKS: [string, string][] = [["Crohn's disease", "Ulcerative colitis"], ["Nephritic syndrome", "Nephrotic syndrome"], ["Type 1 respiratory failure", "Type 2 respiratory failure"], ["DKA", "HHS"], ["Hyperthyroidism", "Hypothyroidism"], ["Upper motor neuron lesion", "Lower motor neuron lesion"]];

export default function CrewVsView({ mine, badge, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string, cards: { front: string; back: string }[]) => void;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [level, setLevel] = useState<QuizLevel>("exam");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<VsTable[]>(readVs);
  const [openId, setOpenId] = useState(list[0]?.id ?? "");
  useEffect(() => saveVs(list), [list]);
  const make = async (x = a, y = b) => {
    const c = findCrew(crewId, mine);
    if (!x.trim() || !y.trim()) { toast("Name both conditions"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const v = parseVs(await ask(c, vsPrompt(x, y, level)), x.trim(), y.trim(), crewId);
      if (!v) { toast("The table didn't come back in a usable form. Try again."); return; }
      setList((l) => [v, ...l].slice(0, 30)); setOpenId(v.id); setA(""); setB("");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-vs">
      <header className="cx-page-h"><div><h1>Compare Two Conditions</h1><p>Two look-alike conditions side by side, with the few features that really tell them apart and the traps examiners love.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>First</span><input className="cx-input" value={a} onChange={(e) => setA(e.target.value.slice(0, 120))} placeholder="e.g. Crohn's disease" data-vs="a" /></label>
        <label className="cx-field"><span>Second</span><input className="cx-input" value={b} onChange={(e) => setB(e.target.value.slice(0, 120))} placeholder="e.g. Ulcerative colitis" data-vs="b" /></label>
      </div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-vs="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as QuizLevel)} data-vs="level"><option value="easy">MBBS</option><option value="exam">NEET-PG</option><option value="hard">Postgraduate</option></select></label>
      </div>
      <div className="cx-crew-chips" data-vs="picks"><span className="cx-set-hint">Try:</span>{PICKS.map(([x, y]) => <button key={x} className="cx-chip" onClick={() => { setA(x); setB(y); }} data-vs-pick={x}>{x} vs {y}</button>)}</div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void make()} disabled={busy} data-vs="make">{busy ? <Loader2 size={14} className="cx-rot" /> : <Columns2 size={14} />} {busy ? "Comparing…" : "Compare"}</button></div>
      <div className="cx-lp-list" data-vs="list">{list.map((v) => (
        <div key={v.id} className={`cx-lp ${openId === v.id ? "open" : ""}`} data-vs-item={`${v.a} vs ${v.b}`}>
          <button className="cx-lp-h" onClick={() => setOpenId(openId === v.id ? "" : v.id)}>{(() => { const c = findCrew(v.crewId, mine); return c ? badge(c, 22) : null; })()}<span className="cx-lp-t"><b>{v.a} vs {v.b}</b><small>{v.rows.length} features · {new Date(v.at).toLocaleDateString()}</small></span></button>
          {openId === v.id && (
            <div className="cx-lp-b">
              <div className="cx-vs-wrap"><table className="cx-vs-table" data-vs="table"><thead><tr><th /><th>{v.a}</th><th>{v.b}</th></tr></thead><tbody>{v.rows.map((r, i) => <tr key={i}><th scope="row">{r.aspect}</th><td>{r.a}</td><td>{r.b}</td></tr>)}</tbody></table></div>
              {v.key.length > 0 && <div className="cx-cmp-out cx-ac-in" data-vs="key"><h3 className="cx-lab-h3">Key differentiators</h3><ul>{v.key.map((k) => <li key={k}>{k}</li>)}</ul></div>}
              {v.traps.length > 0 && <div className="cx-cmp-out cx-ac-high" data-vs="traps"><h3 className="cx-lab-h3">Exam traps</h3><ul>{v.traps.map((k) => <li key={k}>{k}</li>)}</ul></div>}
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => { onNote(v.crewId, vsMarkdown(v), `${v.a} vs ${v.b}`, v.rows.map((r) => ({ front: `${v.a} vs ${v.b}: ${r.aspect}?`, back: `${v.a}: ${r.a}\n${v.b}: ${r.b}` }))); toast(`Saved with ${v.rows.length} flashcards`); }} data-vs="save"><Save size={14} /> Save with flashcards</button>
                <button className="cx-btn" onClick={() => void printMarkdown({ title: `${v.a} vs ${v.b}`, md: vsMarkdown(v), footer: "Comparison from Cadus Crew. Check doses against a current reference." })} data-vs="print"><Printer size={14} /> Print or PDF</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(vsMarkdown(v)); toast("Copied"); }} data-vs="copy"><Copy size={14} /> Copy</button>
                <button className="cx-btn" onClick={() => setList((l) => l.filter((x) => x.id !== v.id))} data-vs="delete"><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}</div>
    </section>
  );
}
