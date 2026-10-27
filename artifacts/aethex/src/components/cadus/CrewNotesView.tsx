/**
 * Crew Notes & Flashcards: answers saved from assistant chats, grouped by assistant, turned into
 * flashcards and reviewed with spaced repetition (Leitner boxes). Stays on this device.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Layers, Loader2, RotateCcw, Search, Share2, Trash2, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { canCompress, dateKey, deckShareCode, deleteNote, dueCards, findCrew, flashcardPrompt, parseCards, reviewCard, type CrewMember, type CrewNotes, type Flashcard } from "@/lib/cadus/crew";

export default function CrewNotesView({ mine, notes, setNotes, badge, ask, canAsk, friendlyError, toast }: {
  mine: CrewMember[];
  notes: CrewNotes;
  setNotes: (f: (n: CrewNotes) => CrewNotes) => void;
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [q, setQ] = useState("");
  const [who, setWho] = useState("");
  const [openId, setOpenId] = useState("");
  const [busy, setBusy] = useState("");
  const [review, setReview] = useState<{ noteId: string; idx: number }[] | null>(null);
  const [flip, setFlip] = useState(false);
  /** Update 45: a shareable link for one note's flashcards. */
  const [deckLink, setDeckLink] = useState<{ id: string; link: string } | null>(null);
  const shareDeck = async (id: string) => {
    const n = notes.notes.find((x) => x.id === id);
    if (!n?.cards?.length) return;
    if (!canCompress()) { toast("Sharing decks isn't supported in this browser"); return; }
    try {
      const code = await deckShareCode({ title: n.title, crewId: n.crewId, cards: n.cards.map((c) => ({ front: c.front, back: c.back })) });
      setDeckLink({ id, link: `${window.location.origin}${window.location.pathname}?deck=${code}` });
    } catch { toast("Couldn't make a link for this deck"); }
  };
  const today = dateKey();
  const list = useMemo(() => notes.notes.filter((n) => (!who || n.crewId === who) && (!q.trim() || `${n.title} ${n.text}`.toLowerCase().includes(q.trim().toLowerCase()))), [notes, q, who]);
  const crewIds = [...new Set(notes.notes.map((n) => n.crewId))];
  const open = notes.notes.find((n) => n.id === openId);
  const due = dueCards(notes, today);

  const makeCards = async (id: string) => {
    const n = notes.notes.find((x) => x.id === id);
    const c = n ? findCrew(n.crewId, mine) : undefined;
    if (!n || !c || !canAsk(1)) return;
    setBusy(id);
    try {
      const cards = parseCards(await ask(c, flashcardPrompt(n.text)), today);
      if (!cards.length) { toast("No flashcards came back. Try again."); return; }
      setNotes((s) => ({ ...s, notes: s.notes.map((x) => (x.id === id ? { ...x, cards } : x)) }));
      toast(`${cards.length} flashcards made`);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(""); }
  };
  const startReview = (only?: string) => {
    const q2: { noteId: string; idx: number }[] = [];
    for (const n of notes.notes) if (!only || n.id === only) (n.cards ?? []).forEach((c, i) => { if (c.due <= today) q2.push({ noteId: n.id, idx: i }); });
    if (!q2.length) { toast("No cards due today"); return; }
    setReview(q2); setFlip(false);
  };
  const cur = review?.[0];
  const card: Flashcard | undefined = cur ? notes.notes.find((n) => n.id === cur.noteId)?.cards?.[cur.idx] : undefined;
  const answer = (knew: boolean) => {
    if (!cur || !card) return;
    setNotes((s) => ({ reviewed: s.reviewed + 1, notes: s.notes.map((n) => (n.id !== cur.noteId ? n : { ...n, cards: (n.cards ?? []).map((c, i) => (i === cur.idx ? reviewCard(c, knew, today) : c)) })) }));
    setReview((r) => { const rest = (r ?? []).slice(1); return knew ? rest : [...rest, cur]; });
    setFlip(false);
  };

  if (review) return (
    <section className="cx-page cx-lab cx-crewnotes">
      <header className="cx-page-h"><div><h1>Flashcard review</h1><p>{review.length} card{review.length === 1 ? "" : "s"} left today. Cards you know come back later; cards you miss come back today.</p></div></header>
      {card ? (
        <div className="cx-fc" data-cn="card">
          <button className={`cx-fc-card ${flip ? "flip" : ""}`} onClick={() => setFlip((f) => !f)} data-cn="flip"><span>{flip ? card.back : card.front}</span><small>{flip ? "Answer" : "Tap to see the answer"} · box {card.box}</small></button>
          {flip && <div className="cx-sc-acts"><button className="cx-btn" onClick={() => answer(false)} data-cn="missed"><X size={14} /> Missed</button><button className="cx-btn primary" onClick={() => answer(true)} data-cn="knew"><Check size={14} /> Knew it</button></div>}
        </div>
      ) : <div className="cx-cmp-out cx-ac-in" data-cn="done"><p><b>All done for today.</b> {notes.reviewed} cards reviewed so far.</p></div>}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => setReview(null)} data-cn="end">Back to notes</button></div>
    </section>
  );

  return (
    <section className="cx-page cx-lab cx-crewnotes">
      <header className="cx-page-h"><div><h1>Crew Notes &amp; Flashcards</h1><p>Answers you saved from assistant chats (use the note button under any assistant answer), grouped by assistant. Turn a note into flashcards and review them with spaced repetition.</p></div></header>
      <div className="cx-sim-stats"><div><b>{notes.notes.length}</b><small>notes</small></div><div><b>{notes.notes.reduce((k, n) => k + (n.cards?.length ?? 0), 0)}</b><small>flashcards</small></div><div><b data-cn="due">{due}</b><small>due today</small></div></div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => startReview()} disabled={!due} data-cn="review"><Layers size={14} /> Review {due} due card{due === 1 ? "" : "s"}</button></div>
      <div className="cx-c23-row">
        <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 80))} placeholder="Search notes" data-cn="q" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={who} onChange={(e) => setWho(e.target.value)} data-cn="who"><option value="">All</option>{crewIds.map((id) => <option key={id} value={id}>{findCrew(id, mine)?.name ?? id}</option>)}</select></label>
      </div>
      {!notes.notes.length && <p className="cx-set-hint">No notes yet. In a chat with an assistant, press the note button under an answer to save it here.</p>}
      <div className="cx-cn-list" data-cn="list">{list.map((n) => { const c = findCrew(n.crewId, mine); return (
        <div key={n.id} className={`cx-cn-item ${openId === n.id ? "open" : ""}`} data-cn-note={n.title}>
          <button className="cx-rm-open" onClick={() => setOpenId(openId === n.id ? "" : n.id)}><span className="cx-cn-h">{c && badge(c, 20)}<b>{n.title}</b></span><small>{c?.name ?? "Assistant"} · {new Date(n.at).toLocaleDateString()}{n.cards?.length ? ` · ${n.cards.length} cards` : ""}</small></button>
          {openId === n.id && open && (
            <div className="cx-cn-body">
              <MdBlock text={open.text} />
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => void makeCards(n.id)} disabled={busy === n.id} data-cn="cards">{busy === n.id ? <Loader2 size={14} className="cx-rot" /> : <Layers size={14} />} {n.cards?.length ? "Remake flashcards" : "Make flashcards"}</button>
                {n.cards?.length ? <button className="cx-btn" onClick={() => startReview(n.id)} data-cn="review-one"><RotateCcw size={14} /> Review this note</button> : null}
                {n.cards?.length ? <button className="cx-btn" onClick={() => void shareDeck(n.id)} data-cn="share-deck"><Share2 size={14} /> Share deck</button> : null}
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(n.text); toast("Copied"); }}><Copy size={14} /> Copy</button>
                <button className="cx-btn" onClick={() => { setNotes((s) => deleteNote(s, n.id)); setOpenId(""); }} data-cn="delete"><Trash2 size={14} /> Delete</button>
              </div>
              {deckLink?.id === n.id && (
                <div className="cx-qb-share" data-cn="deck-box">
                  <input className="cx-input" readOnly value={deckLink.link} onFocus={(e) => e.currentTarget.select()} aria-label="Deck link" data-cn="deck-link" />
                  <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(deckLink.link); toast("Deck link copied"); }} data-cn="deck-copy"><Copy size={14} /> Copy</button>
                  <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(`${n.cards?.length ?? 0} flashcards on "${n.title}" for Cadus: ${deckLink.link}`.slice(0, 3800))}`} target="_blank" rel="noopener noreferrer" data-cn="deck-wa">WhatsApp</a>
                </div>
              )}
            </div>
          )}
        </div>); })}</div>
    </section>
  );
}
