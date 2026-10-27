/**
 * Lecture to Notes: paste lecture text (or load a .txt file) and get structured revision notes, key
 * points and flashcards, saved to Crew notes.
 */
import { useState, type ReactNode } from "react";
import { Copy, FileUp, Loader2, NotebookText, Printer, Save } from "lucide-react";
import { allCrew, findCrew, lectureMarkdown, lecturePrompt, parseLecture, type CrewMember, type LectureNotes } from "@/lib/cadus/crew";
import { printMarkdown } from "@/lib/cadus/printdoc";
import { MdBlock } from "./LiveAnswer";

export default function CrewLectureView({ mine, ask, canAsk, friendlyError, toast, onSave }: {
  mine: CrewMember[];
  badge?: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onSave: (crewId: string, md: string, title: string, cards: { front: string; back: string }[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [n, setN] = useState(10);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<LectureNotes | null>(null);
  const load = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 400_000) { toast("That file is too large: paste the part you need"); return; }
    const r = new FileReader();
    r.onload = () => { setText(String(r.result ?? "").slice(0, 20000)); if (!title) setTitle(f.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 120)); };
    r.readAsText(f);
  };
  const make = async () => {
    const c = findCrew(crewId, mine);
    if (text.trim().length < 200) { toast("Paste at least a paragraph or two of the lecture"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const l = parseLecture(await ask(c, lecturePrompt(title, text, n)), title);
      if (!l) { toast("The notes didn't come back in a usable form. Try again."); return; }
      setOut(l);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-lecture">
      <header className="cx-page-h"><div><h1>Lecture to Notes</h1><p>Paste a lecture transcript, slides text or class notes. Get clean revision notes, the key points and flashcards, all saved to Crew notes.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Title (optional)</span><input className="cx-input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} placeholder="e.g. Heart failure lecture" data-lec="title" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-lec="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="cx-field"><span>Flashcards</span><select className="cx-select" value={n} onChange={(e) => setN(Number(e.target.value))} data-lec="n">{[5, 10, 15, 20].map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
      </div>
      <label className="cx-field"><span>Lecture text ({text.length.toLocaleString("en-IN")} / 20,000 characters)</span><textarea className="cx-input" rows={9} value={text} onChange={(e) => setText(e.target.value.slice(0, 20000))} placeholder="Paste the lecture here…" data-lec="text" /></label>
      <div className="cx-sc-acts">
        <label className="cx-btn"><FileUp size={14} /> Load a .txt file<input type="file" accept=".txt,.md,text/plain" hidden onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} data-lec="file" /></label>
        <button className="cx-btn primary" onClick={() => void make()} disabled={busy} data-lec="make">{busy ? <Loader2 size={14} className="cx-rot" /> : <NotebookText size={14} />} {busy ? "Making notes…" : "Make notes"}</button>
      </div>
      {out && (
        <div className="cx-lec-out" data-lec="out">
          <h2 data-lec="out-title">{out.title}</h2>
          {out.keyPoints.length > 0 && <div className="cx-cmp-out cx-ac-in" data-lec="key"><h3 className="cx-lab-h3">Key points</h3><ul>{out.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul></div>}
          <div className="cx-cht-page" data-lec="notes"><MdBlock text={out.notes} /></div>
          {out.cards.length > 0 && <details className="cx-lec-cards"><summary data-lec="cards">{out.cards.length} flashcards</summary><ol>{out.cards.map((c, i) => <li key={i}><b>{c.front}</b><br /><small>{c.back}</small></li>)}</ol></details>}
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => { onSave(crewId, lectureMarkdown(out), out.title, out.cards); toast(`Saved to Crew notes with ${out.cards.length} flashcards`); }} data-lec="save"><Save size={14} /> Save notes and flashcards</button>
            <button className="cx-btn" onClick={() => void printMarkdown({ title: out.title, md: lectureMarkdown(out), footer: "Notes made by Cadus Crew from a lecture. Check doses against a current reference." })} data-lec="print"><Printer size={14} /> Print or PDF</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(lectureMarkdown(out)); toast("Copied"); }} data-lec="copy"><Copy size={14} /> Copy</button>
          </div>
        </div>
      )}
    </section>
  );
}
