/**
 * Quiz from My Notes: pick saved notes and turn them into MCQs, played in Quiz Battle.
 */
import { useMemo, useState, type ReactNode } from "react";
import { BookOpenCheck, Loader2, Search } from "lucide-react";
import { findCrew, notesQuizPrompt, parseQuiz, type CrewMember, type CrewNote, type QuizLevel, type QuizQ } from "@/lib/cadus/crew";

export default function CrewNotesQuizView({ mine, badge, ask, canAsk, friendlyError, toast, notes, onStart }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  notes: CrewNote[];
  onStart: (topic: string, qs: QuizQ[], crewId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [n, setN] = useState(5);
  const [level, setLevel] = useState<QuizLevel>("exam");
  const [busy, setBusy] = useState(false);
  const list = useMemo(() => { const t = q.trim().toLowerCase(); return notes.filter((x) => !t || x.title.toLowerCase().includes(t) || x.text.toLowerCase().includes(t)).slice(0, 60); }, [notes, q]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 10 ? (toast("Pick up to 10 notes"), p) : [...p, id]));
  const make = async () => {
    const src = notes.filter((x) => picked.includes(x.id));
    if (!src.length) { toast("Pick at least one note"); return; }
    const c = findCrew(src[0].crewId, mine) ?? findCrew("crew-neetpg", mine);
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const qs = parseQuiz(await ask(c, notesQuizPrompt(src.map((x) => ({ title: x.title, text: x.text })), n, level)));
      if (!qs.length) { toast("The questions didn't come back in a usable form. Try again."); return; }
      onStart(src.length === 1 ? src[0].title : `My notes: ${src[0].title} and ${src.length - 1} more`, qs, c.id);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-nq">
      <header className="cx-page-h"><div><h1>Quiz from My Notes</h1><p>Pick notes you saved and get MCQs that test exactly what is in them, played in Quiz Battle. Wrong answers go to your mistakes notebook.</p></div></header>
      {!notes.length ? <p className="cx-set-hint" data-nq="empty">No notes yet. Save answers from assistant chats (the note button under an answer) and come back.</p> : (
        <>
          <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 80))} placeholder={`Search your ${notes.length} notes`} data-nq="q" /></label>
          <div className="cx-cht-pick" data-nq="notes">{list.map((x) => { const c = findCrew(x.crewId, mine); return <label key={x.id} className={`cx-pa-mine ${picked.includes(x.id) ? "on" : ""}`}><input type="checkbox" checked={picked.includes(x.id)} onChange={() => toggle(x.id)} data-nq-note={x.title} /> {c && badge(c, 16)} {x.title}</label>; })}</div>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Questions</span><select className="cx-select" value={n} onChange={(e) => setN(Number(e.target.value))} data-nq="n">{[5, 10, 15].map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
            <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as QuizLevel)} data-nq="level"><option value="easy">MBBS</option><option value="exam">NEET-PG</option><option value="hard">Hard</option></select></label>
          </div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void make()} disabled={busy || !picked.length} data-nq="make">{busy ? <Loader2 size={14} className="cx-rot" /> : <BookOpenCheck size={14} />} {busy ? "Writing questions…" : `Quiz me on ${picked.length || "the"} note${picked.length === 1 ? "" : "s"}`}</button></div>
        </>
      )}
    </section>
  );
}
