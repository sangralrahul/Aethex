/**
 * My Glossary: medical terms saved from "select to explain" or added by hand; search, define with
 * AI, revise them like flashcards, copy, or turn them into a flashcard deck.
 */
import { useMemo, useState } from "react";
import { BookA, Copy, Eye, Layers, Loader2, Plus, Search, Shuffle, Sparkles, Trash2 } from "lucide-react";
import { addTerm, definePrompt, findCrew, glossaryMarkdown, glossarySorted, type CrewMember, type GlossTerm } from "@/lib/cadus/crew";

export default function CrewGlossaryView({ mine, ask, canAsk, friendlyError, toast, glossary, setGlossary, onCards }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  glossary: GlossTerm[];
  setGlossary: (f: (l: GlossTerm[]) => GlossTerm[]) => void;
  onCards: (terms: GlossTerm[]) => void;
}) {
  const [term, setTerm] = useState("");
  const [def, setDef] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [rev, setRev] = useState<{ order: string[]; i: number; show: boolean } | null>(null);
  const list = useMemo(() => { const t = q.trim().toLowerCase(); return glossarySorted(glossary).filter((x) => !t || x.term.toLowerCase().includes(t) || x.def.toLowerCase().includes(t)); }, [glossary, q]);
  const define = async () => {
    const c = findCrew("crew-neetpg", mine);
    if (!term.trim()) { toast("Type a term first"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try { setDef((await ask(c, definePrompt(term))).trim().slice(0, 2000)); }
    catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const add = () => {
    if (!term.trim() || !def.trim()) { toast("Add a term and its meaning"); return; }
    setGlossary((l) => addTerm(l, term, def)); setTerm(""); setDef(""); toast("Added to your glossary");
  };
  const startRev = () => {
    const ids = glossary.map((x) => x.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    setRev({ order: ids, i: 0, show: false });
  };
  const cur = rev ? glossary.find((x) => x.id === rev.order[rev.i]) : null;
  return (
    <section className="cx-page cx-lab cx-gloss">
      <header className="cx-page-h"><div><h1>My Glossary</h1><p>Terms you looked up with "select to explain" (use "Add to glossary"), or add your own. Search them, revise them, or turn them into flashcards.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Term</span><input className="cx-input" value={term} onChange={(e) => setTerm(e.target.value.slice(0, 120))} placeholder="e.g. Anion gap" data-gls="term" /></label>
      </div>
      <label className="cx-field"><span>Meaning</span><textarea className="cx-input" rows={3} value={def} onChange={(e) => setDef(e.target.value.slice(0, 2000))} placeholder="Write it in your own words, or define it with AI" data-gls="def" /></label>
      <div className="cx-sc-acts">
        <button className="cx-btn" onClick={() => void define()} disabled={busy} data-gls="define">{busy ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} Define with AI</button>
        <button className="cx-btn primary" onClick={add} data-gls="add"><Plus size={14} /> Add</button>
      </div>
      {glossary.length > 0 && (
        <>
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={startRev} data-gls="revise"><Shuffle size={14} /> Revise ({glossary.length})</button>
            <button className="cx-btn" onClick={() => { onCards(glossary); toast(`${glossary.length} flashcards added to Crew notes`); }} data-gls="cards"><Layers size={14} /> Make flashcards</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(glossaryMarkdown(glossary)); toast("Glossary copied"); }} data-gls="copy"><Copy size={14} /> Copy all</button>
          </div>
          {rev && cur && (
            <div className="cx-gls-card" data-gls="card">
              <small>{rev.i + 1} of {rev.order.length}</small>
              <b data-gls="card-term">{cur.term}</b>
              {rev.show ? <p data-gls="card-def">{cur.def}</p> : <button className="cx-btn sm" onClick={() => setRev({ ...rev, show: true })} data-gls="show"><Eye size={12} /> Show meaning</button>}
              <div className="cx-sc-acts">{rev.i + 1 < rev.order.length ? <button className="cx-btn" onClick={() => setRev({ ...rev, i: rev.i + 1, show: false })} data-gls="next">Next</button> : <button className="cx-btn" onClick={() => setRev(null)} data-gls="done">Done</button>}</div>
            </div>
          )}
          <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 80))} placeholder={`Search ${glossary.length} terms`} data-gls="q" /></label>
          <dl className="cx-gls-list" data-gls="list">{list.map((x, i) => {
            const L = x.term[0]?.toUpperCase() ?? "";
            const head = i === 0 || (list[i - 1].term[0]?.toUpperCase() ?? "") !== L;
            return (
              <div key={x.id} className="cx-gls-item" data-gls-item={x.term}>
                {head && <span className="cx-gls-letter">{L}</span>}
                <dt>{x.term}<button className="cx-ib" onClick={() => setGlossary((l) => l.filter((y) => y.id !== x.id))} aria-label={`Delete ${x.term}`} data-gls-del={x.term}><Trash2 size={13} /></button></dt>
                <dd>{x.def}</dd>
              </div>
            );
          })}</dl>
        </>
      )}
      {!glossary.length && <p className="cx-set-hint" data-gls="empty"><BookA size={13} /> No terms yet.</p>}
    </section>
  );
}
