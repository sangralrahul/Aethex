/**
 * Revision Notes: high-yield notes on any topic for NEET-PG, INI-CET or university exams (short
 * notes, one-page tables or rapid-revision facts), with flashcards and three questions, kept on this
 * device and brought back for revision after 1, 3, 7, 21 and 45 days.
 */
import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus, CalendarClock, Check, Loader2, NotebookPen, Printer, RotateCcw, Search, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { SUBJECTS } from "@/lib/cadus/practice";
import { newCard, readDecks, saveDecks, sid, type Deck } from "@/lib/cadus/studio";
import { dueRev, markRevised, newRev, readRev, saveRev, type RevItem } from "@/lib/cadus/clinic22";

const STYLES = [{ id: "short", label: "Short notes" }, { id: "table", label: "One-page tables" }, { id: "rapid", label: "Rapid revision" }];
const IDEAS = ["Nephrotic vs nephritic syndrome", "Thyroid carcinoma types", "Antitubercular drugs", "Brachial plexus", "Hepatitis B serology", "Pre-eclampsia", "Neonatal jaundice", "Glaucoma drugs"];

export default function RevNotesView({ generate, friendlyError, toast, onPrint, defaultExam }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  defaultExam: string;
}) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState("short");
  const [exam, setExam] = useState(defaultExam || "NEET-PG");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<RevItem[]>(readRev);
  const [openId, setOpenId] = useState("");
  const [q, setQ] = useState("");
  const [picks, setPicks] = useState<(number | null)[]>([]);
  useEffect(() => saveRev(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;
  const due = useMemo(() => dueRev(list), [list]);
  const shown = list.filter((x) => !q.trim() || `${x.title} ${x.subject} ${x.topic}`.toLowerCase().includes(q.trim().toLowerCase()));

  const make = async (t = topic) => {
    if (t.trim().length < 3) { toast("Give a topic"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "rev-note", topic: t.trim(), style, exam, subject });
      if (!r?.result) throw new Error("No note came back");
      const item = newRev({ topic: t.trim(), subject, title: r.result.title, note: r.result.note, cards: r.result.cards ?? [], mcqs: r.result.mcqs ?? [] });
      setList((l) => [item, ...l]);
      setOpenId(item.id); setPicks(item.mcqs.map(() => null)); setTopic("");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const toCards = (x: RevItem) => {
    const decks = readDecks();
    const title = `Revision: ${x.subject || "notes"}`;
    const deck: Deck = decks.find((d) => d.title === title) ?? { id: sid(), title, cards: [], createdAt: Date.now(), source: "Revision Notes" };
    const have = new Set(deck.cards.map((c) => c.front));
    const added = x.cards.filter((c) => !have.has(c.front));
    saveDecks([{ ...deck, cards: [...deck.cards, ...added.map((c) => newCard({ ...c, tag: x.title }))] }, ...decks.filter((d) => d.id !== deck.id)]);
    toast(`${added.length} flashcards added to "${title}"`);
  };
  const days = (t: number) => Math.round((t - Date.now()) / 86400000);

  if (open) {
    return (
      <section className="cx-page cx-lab cx-rev">
        <header className="cx-page-h"><div><h1>{open.title}</h1><p>{[open.subject, `revised ${open.revisions.length} time${open.revisions.length === 1 ? "" : "s"}`, `next ${days(open.nextDue) <= 0 ? "today" : `in ${days(open.nextDue)} day${days(open.nextDue) === 1 ? "" : "s"}`}`].filter(Boolean).join(" · ")}</p></div><button className="cx-ib" onClick={() => setOpenId("")} aria-label="Close"><X size={18} /></button></header>
        <div className="cx-sc-note cx-rev-note" data-rev="note"><MdBlock text={open.note} /></div>
        {open.mcqs.length > 0 && (
          <ol className="cx-daily-qs" data-rev="mcqs">{open.mcqs.map((m, qi) => { const a = picks[qi] ?? null; return (
            <li key={qi}><p className="cx-daily-q"><b>Q{qi + 1}.</b> {m.q}</p><div className="cx-daily-opts">{m.options.map((o, oi) => <button key={oi} className={a === null ? "" : oi === m.answer ? "right" : oi === a ? "wrong" : "dim"} disabled={a !== null} onClick={() => setPicks(picks.map((p, k) => (k === qi ? oi : p)))}><span>{"ABCD"[oi]}</span>{o}</button>)}</div>{a !== null && <p className={`cx-daily-ex ${a === m.answer ? "ok" : "no"}`}>{m.explain}</p>}</li>
          ); })}</ol>
        )}
        <div className="cx-sc-acts">
          <button className="cx-btn primary" onClick={() => { setList((l) => l.map((x) => (x.id === open.id ? markRevised(x) : x))); toast("Revised. It comes back for the next revision."); }} data-rev="revised"><Check size={14} /> I've revised this</button>
          {open.cards.length > 0 && <button className="cx-btn" onClick={() => toCards(open)} data-rev="cards"><BookmarkPlus size={14} /> {open.cards.length} flashcards</button>}
          <button className="cx-btn" onClick={() => onPrint(open.title, open.note)}><Printer size={14} /> Print</button>
          <button className="cx-ib" onClick={() => { setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
        </div>
      </section>
    );
  }
  return (
    <section className="cx-page cx-lab cx-rev">
      <header className="cx-page-h"><div><h1>Revision Notes</h1><p>Topper-style high-yield notes on any topic, with flashcards and questions. Each note comes back for revision after 1, 3, 7, 21 and 45 days, so you don't forget it before the exam.</p></div></header>
      {due.length > 0 && (
        <div className="cx-rev-due" data-rev="due"><b><CalendarClock size={15} /> Revise today ({due.length})</b>{due.slice(0, 8).map((x) => <button key={x.id} onClick={() => { setOpenId(x.id); setPicks(x.mcqs.map(() => null)); }}><RotateCcw size={12} /> {x.title}</button>)}</div>
      )}
      <form className="cx-alib-custom" onSubmit={(e) => { e.preventDefault(); void make(); }}>
        <input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="Topic, e.g. Hepatitis B serology" aria-label="Topic" data-rev="topic" />
        <button className="cx-btn primary" type="submit" disabled={busy || topic.trim().length < 3} data-rev="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <NotebookPen size={14} />} Make notes</button>
      </form>
      <div className="cx-field"><span>Style</span><div className="cx-seg" style={{ alignSelf: "flex-start" }}>{STYLES.map((s) => <button key={s.id} className={style === s.id ? "on" : ""} onClick={() => setStyle(s.id)} data-rev-style={s.id}>{s.label}</button>)}</div></div>
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Subject</span><select className="cx-select" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Any</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="cx-field"><span>Exam</span><select className="cx-select" value={exam} onChange={(e) => setExam(e.target.value)}>{["NEET-PG", "INI-CET", "FMGE", "NExT", "University exam"].map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      {!topic && <div className="cx-cb-ideas">{IDEAS.map((i) => <button key={i} onClick={() => void make(i)} disabled={busy}>{i}</button>)}</div>}
      {list.length > 0 ? (
        <div className="cx-lf-saved">
          <div className="cx-ltv-bar"><p className="cx-gl" style={{ flex: 1 }}><span>Your notes ({list.length})</span></p><label className="cx-search"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search notes" /></label></div>
          {shown.map((x) => <button key={x.id} className="cx-sc-row" onClick={() => { setOpenId(x.id); setPicks(x.mcqs.map(() => null)); }}><b><NotebookPen size={13} /> {x.title}</b><small>{[x.subject, `revised ${x.revisions.length}×`, days(x.nextDue) <= 0 ? "due today" : `next in ${days(x.nextDue)} d`].filter(Boolean).join(" · ")}</small></button>)}
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Your first note</h3><p>Pick a topic above. Notes stay on this device.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Written by Cadus: check anything you will rely on against your standard textbook.</p>
    </section>
  );
}
