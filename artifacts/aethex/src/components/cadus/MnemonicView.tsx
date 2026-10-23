/**
 * Mnemonic Maker: a topic or a list to remember, turned into classic or new mnemonics with what each
 * letter stands for, a memory story and the high-yield facts; saved to a flashcard deck in one tap.
 */
import { useEffect, useState } from "react";
import { BookmarkPlus, Brain, Lightbulb, Loader2, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { addToMnemonicDeck } from "@/lib/cadus/clinic20";

interface Result { topic: string; mnemonics: { mnemonic: string; kind: "classic" | "new"; parts: { key: string; stands: string }[]; note: string }[]; story: string; facts: string[] }
interface Saved extends Result { id: string; at: number }
const KEY = "cadus3.mnemonics";
const IDEAS = ["Causes of pancreatitis", "Cranial nerves", "Drugs causing gynaecomastia", "Branches of the external carotid artery", "Features of tetralogy of Fallot", "Causes of microcytic anaemia", "Contents of the cubital fossa", "Side effects of amiodarone"];
const read = (): Saved[] => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.slice(0, 60) : []; } catch { return []; } };

export default function MnemonicView({ generate, friendlyError, toast }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Saved[]>(read);
  const [openId, setOpenId] = useState("");
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 60))); } catch { /* full */ } }, [list]);
  const open = list.find((x) => x.id === openId) ?? null;

  const run = async (t = topic) => {
    if (t.trim().length < 3) { toast("Give a topic or a list"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "mnemonic", topic: t.trim() });
      if (!r?.result) throw new Error("No mnemonic came back");
      const s: Saved = { ...r.result, topic: r.result.topic || t.trim(), id: Math.random().toString(36).slice(2), at: Date.now() };
      setList((l) => [s, ...l]);
      setOpenId(s.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  return (
    <section className="cx-page cx-lab cx-mnem">
      <header className="cx-page-h"><div><h1>Mnemonic Maker</h1><p>Type a topic or paste a list you can't remember. Cadus gives the classic mnemonic if there is one, or makes a new one, with a memory story and the facts examiners ask.</p></div></header>
      <form className="cx-alib-custom" onSubmit={(e) => { e.preventDefault(); void run(); }}>
        <input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 1500))} placeholder="e.g. Causes of pancreatitis, or paste a list" aria-label="Topic" data-mnem="topic" />
        <button className="cx-btn primary" type="submit" disabled={busy || topic.trim().length < 3} data-mnem="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Brain size={14} />} Make</button>
      </form>
      {!topic && !open && <div className="cx-cb-ideas">{IDEAS.map((i) => <button key={i} onClick={() => { setTopic(i); void run(i); }} disabled={busy}>{i}</button>)}</div>}
      {open && (
        <div className="cx-mnem-out" data-mnem="out">
          <h2>{open.topic}</h2>
          {open.mnemonics.map((m, i) => (
            <div key={i} className="cx-mnem-card" data-mnem-card={i}>
              <div className="cx-mnem-h"><b>{m.mnemonic}</b><span className={`cx-mnem-kind ${m.kind}`}>{m.kind === "classic" ? "Classic" : "New"}</span></div>
              <ul>{m.parts.map((p, k) => <li key={k}><b>{p.key}</b> {p.stands}</li>)}</ul>
              {m.note && <small>{m.note}</small>}
            </div>
          ))}
          {open.story && <p className="cx-daily-pearl"><Lightbulb size={14} /> {open.story}</p>}
          {open.facts.length > 0 && <div className="cx-sim-card"><h3>High-yield</h3><ul>{open.facts.map((f) => <li key={f}>{f}</li>)}</ul></div>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { addToMnemonicDeck(open.mnemonics.map((m) => ({ front: `${open.topic}: mnemonic "${m.mnemonic}"`, back: m.parts.map((p) => `${p.key}: ${p.stands}`).join("\n") }))); toast("Added to your Mnemonics flashcard deck"); }} data-mnem="cards"><BookmarkPlus size={14} /> Add to flashcards</button>
            <button className="cx-ib" onClick={() => { setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      )}
      {list.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Your mnemonics</span></p>
          {list.slice(0, 20).map((x) => <button key={x.id} className={`cx-sc-row ${x.id === openId ? "on" : ""}`} onClick={() => setOpenId(x.id)}><b><Sparkles size={13} /> {x.topic}</b><small>{x.mnemonics.map((m) => m.mnemonic).join(" · ")}</small></button>)}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Check new mnemonics against your textbook before you rely on them.</p>
    </section>
  );
}
