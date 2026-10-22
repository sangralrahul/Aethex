/**
 * Flashcards: decks made by Cadus from an answer, your notes or a topic, reviewed with
 * spaced repetition (Again, Hard, Good, Easy) and exported for Anki. Kept on this device.
 */
import { useEffect, useMemo, useState } from "react";
import { Download, Layers, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { ankiText, dueCards, newCard, nextLabel, readDecks, saveDecks, schedule, sid, type Deck, type Grade } from "@/lib/cadus/studio";

const GRADES: { id: Grade; label: string; key: string }[] = [
  { id: "again", label: "Again", key: "1" },
  { id: "hard", label: "Hard", key: "2" },
  { id: "good", label: "Good", key: "3" },
  { id: "easy", label: "Easy", key: "4" },
];

export default function FlashcardsView({ generate, friendlyError, toast, seed, onSeedUsed }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  /** Text sent from an answer ("Make flashcards"), turned into a deck on arrival. */
  seed?: { title: string; text: string } | null;
  onSeedUsed: () => void;
}) {
  const [decks, setDecks] = useState<Deck[]>(readDecks);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(12);
  const [busy, setBusy] = useState(false);
  const [studying, setStudying] = useState<string>("");
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState<string>("");
  const [, tick] = useState(0);
  useEffect(() => saveDecks(decks), [decks]);

  const make = async (body: { topic?: string; text?: string; title?: string }) => {
    setBusy(true);
    try {
      const r = await generate({ action: "flashcards", count, ...body });
      if (!r?.cards?.length) throw new Error("No cards came back");
      const d: Deck = { id: sid(), title: body.title || r.title || "Flashcards", cards: r.cards.map((c: { front: string; back: string; tag?: string }) => newCard(c)), createdAt: Date.now(), ...(body.title ? { source: body.title } : {}) };
      setDecks((l) => [d, ...l]);
      setTopic(""); setNotes("");
      toast(`${d.cards.length} cards ready in "${d.title}"`);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  // A deck from an answer, made as soon as the page opens.
  useEffect(() => {
    if (!seed) return;
    onSeedUsed();
    void make({ text: seed.text, title: seed.title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const deck = decks.find((d) => d.id === studying) ?? null;
  const queue = useMemo(() => (deck ? dueCards(deck).sort((a, b) => a.due - b.due) : []), [deck]);
  const card = queue[0];
  const totalDue = decks.reduce((n, d) => n + dueCards(d).length, 0);

  const grade = (g: Grade) => {
    if (!deck || !card) return;
    setDecks((l) => l.map((d) => (d.id === deck.id ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? schedule(c, g) : c)) } : d)));
    setFlipped(false);
    tick((x) => x + 1);
  };

  useEffect(() => {
    if (!deck) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); return; }
      const g = GRADES.find((x) => x.key === e.key);
      if (g && flipped) grade(g.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const exportAnki = (d: Deck) => {
    const blob = new Blob([ankiText(d)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.title.replace(/[^\w-]+/g, "-").toLowerCase() || "cadus"}-anki.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Saved. In Anki: File → Import, and pick this file");
  };

  if (deck) {
    const done = !card;
    return (
      <section className="cx-page cx-fc">
        <div className="cx-pw-head">
          <button className="cx-ib" onClick={() => { setStudying(""); setFlipped(false); }} aria-label="All decks"><X size={17} /></button>
          <div><h1>{deck.title}</h1><p>{queue.length} due · {deck.cards.length} cards</p></div>
        </div>
        {done ? (
          <div className="cx-empty-state" data-fc="done"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>All done for now</h3><p>Cards you got right come back in a few days; the ones you missed, sooner.</p>
            <button className="cx-btn" onClick={() => setDecks((l) => l.map((d) => (d.id === deck.id ? { ...d, cards: d.cards.map((c) => ({ ...c, due: Date.now() })) } : d)))}><RotateCcw size={14} /> Review all again</button>
          </div>
        ) : (
          <>
            <button className={`cx-fc-card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)} data-fc="card" aria-label={flipped ? "Answer shown" : "Show the answer"}>
              <span className="cx-fc-tag">{card.tag || "card"}</span>
              <span className="cx-fc-front">{card.front}</span>
              {flipped ? <span className="cx-fc-back" data-fc="back">{card.back}</span> : <small>Tap or press Space to show the answer</small>}
            </button>
            {flipped && (
              <div className="cx-fc-grades" data-fc="grades">
                {GRADES.map((g) => <button key={g.id} className={`cx-btn g-${g.id}`} onClick={() => grade(g.id)}><b>{g.label}</b><small>{nextLabel(card, g.id)}</small></button>)}
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <section className="cx-page cx-fc">
      <header className="cx-page-h">
        <div><h1>Flashcards</h1><p>Cards made from any answer, your notes or a topic, reviewed at the right time so they stick. Export any deck to Anki.</p></div>
      </header>
      <div className="cx-fc-make">
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Nephrotic syndrome, Brachial plexus, Antiepileptics" maxLength={200} data-fc="topic" /></label>
        <label className="cx-field"><span>Or paste notes</span><textarea className="cx-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste your notes or a passage to turn into cards" maxLength={30000} /></label>
        <div className="cx-fc-make-f">
          <label className="cx-field inline"><span>Cards</span><select className="cx-select" value={count} onChange={(e) => setCount(Number(e.target.value))}>{[8, 12, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <button className="cx-btn primary" onClick={() => void make({ topic: topic.trim(), text: notes.trim() })} disabled={busy || (!topic.trim() && !notes.trim())} data-fc="make"><Plus size={14} /> {busy ? "Making cards…" : "Make a deck"}</button>
        </div>
        <p className="cx-rs-foot">Tip: under any answer, open ⋯ and choose <b>Make flashcards</b>.</p>
      </div>
      {totalDue > 0 && <p className="cx-fc-due"><Layers size={14} /> {totalDue} card{totalDue === 1 ? "" : "s"} due today</p>}
      {busy && <div className="cx-hd-wait"><span className="cx-sim-dots"><i /><i /><i /></span> Making cards…</div>}
      {decks.length === 0 && !busy ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Layers size={20} /></span><h3>No decks yet</h3><p>Make one from a topic above, or from any answer in a chat.</p></div>
      ) : (
        <div className="cx-fc-decks">
          {decks.map((d) => {
            const due = dueCards(d).length;
            return (
              <article key={d.id} className="cx-fc-deck" data-fc-deck={d.title}>
                {editing === d.id ? (
                  <input className="cx-input" autoFocus defaultValue={d.title} maxLength={80} onBlur={(e) => { const t = e.target.value.trim(); setDecks((l) => l.map((x) => (x.id === d.id ? { ...x, title: t || x.title } : x))); setEditing(""); }} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} aria-label="Deck name" />
                ) : <h3>{d.title}</h3>}
                <p>{d.cards.length} cards · <b className={due ? "due" : ""}>{due} due</b></p>
                <div className="cx-sc-acts">
                  <button className="cx-btn primary sm" onClick={() => { setStudying(d.id); setFlipped(false); }} data-fc="study">{due ? "Study" : "Open"}</button>
                  <button className="cx-btn sm" onClick={() => exportAnki(d)} data-fc="anki"><Download size={13} /> Anki</button>
                  <button className="cx-ib" onClick={() => setEditing(d.id)} aria-label="Rename"><Pencil size={14} /></button>
                  <button className="cx-ib" onClick={() => setDecks((l) => l.filter((x) => x.id !== d.id))} aria-label="Delete deck"><Trash2 size={14} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
