/**
 * Daily Smart Review: one short session mixing due flashcards, open mistakes and glossary terms,
 * with a daily streak. Everything stays on this device.
 */
import { useState } from "react";
import { Brain, Check, Eye, Flame, RotateCcw, X } from "lucide-react";
import { dateKey, readSmart, retestMistake, reviewCard, saveSmart, smartQueue, smartStreak, type CrewNotes, type GlossTerm, type Mistake, type SmartItem } from "@/lib/cadus/crew";

export default function CrewSmartView({ notes, setNotes, mistakes, setMistakes, glossary, setGlossary }: {
  notes: CrewNotes;
  setNotes: (f: (n: CrewNotes) => CrewNotes) => void;
  mistakes: Mistake[];
  setMistakes: (f: (l: Mistake[]) => Mistake[]) => void;
  glossary: GlossTerm[];
  setGlossary: (f: (l: GlossTerm[]) => GlossTerm[]) => void;
}) {
  const today = dateKey();
  const [queue, setQueue] = useState<SmartItem[]>(() => smartQueue(notes, mistakes, glossary, today));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [days, setDays] = useState(readSmart);
  const cur = queue[i];
  const record = (ok: boolean) => {
    const r = right + (ok ? 1 : 0);
    setRight(r);
    const d = { ...days, [today]: { done: i + 1, right: r, total: queue.length } };
    setDays(d); saveSmart(d);
  };
  const next = () => { setI(i + 1); setShown(false); setPicked(null); };
  const grade = (knew: boolean) => {
    if (!cur) return;
    if (cur.kind === "card") setNotes((n) => ({ ...n, notes: n.notes.map((x) => (x.id !== cur.noteId ? x : { ...x, cards: (x.cards ?? []).map((c, k) => (k === cur.idx ? reviewCard(c, knew, today) : c)) })) }));
    if (cur.kind === "term") setGlossary((l) => l.map((g) => (g.id === cur.id ? { ...g, at: Date.now() } : g)));
    record(knew); next();
  };
  const pick = (k: number) => {
    if (!cur || cur.kind !== "mistake" || picked !== null) return;
    setPicked(k);
    const ok = k === cur.answer;
    setMistakes((l) => retestMistake(l, cur.id, ok));
    record(ok);
  };
  const streak = smartStreak(days, today);
  const restart = () => { setQueue(smartQueue(notes, mistakes, glossary, today)); setI(0); setRight(0); setShown(false); setPicked(null); };
  return (
    <section className="cx-page cx-lab cx-smart">
      <header className="cx-page-h"><div><h1>Daily Smart Review</h1><p>About 10 minutes a day: your due flashcards, the questions you got wrong, and a few glossary terms — mixed into one session.</p></div></header>
      <div className="cx-sim-stats"><div><b data-smart="total">{queue.length}</b><small>items today</small></div><div><b data-smart="streak">{streak}</b><small>day streak <Flame size={11} /></small></div><div><b>{queue.filter((q) => q.kind === "card").length}/{queue.filter((q) => q.kind === "mistake").length}/{queue.filter((q) => q.kind === "term").length}</b><small>cards / mistakes / terms</small></div></div>
      {!queue.length ? (
        <p className="cx-set-hint" data-smart="empty">Nothing due today. Make flashcards from your notes, play a quiz (wrong answers go to Mistakes), or add glossary terms — they will show up here.</p>
      ) : cur ? (
        <div className="cx-smart-card" data-smart="card" data-kind={cur.kind}>
          <div className="cx-smart-top"><span className={`cx-smart-tag k-${cur.kind}`}>{cur.kind === "card" ? "Flashcard" : cur.kind === "mistake" ? "Mistake re-test" : "Glossary"}</span><small>{i + 1} of {queue.length}</small></div>
          <span className="cx-goal-bar sm"><span style={{ width: `${Math.round((100 * i) / queue.length)}%` }} /></span>
          {cur.kind === "mistake" ? (
            <>
              <b className="cx-smart-q" data-smart="q">{cur.q}</b>
              <div className="cx-smart-opts">{cur.options.map((o, k) => <button key={k} className={`cx-btn ${picked === null ? "" : k === cur.answer ? "ok" : picked === k ? "no" : ""}`} onClick={() => pick(k)} disabled={picked !== null} data-smart-opt={k}>{o}</button>)}</div>
              {picked !== null && <><p className="cx-set-hint" data-smart="why">{picked === cur.answer ? "Right. " : "Not quite. "}{cur.why}</p><div className="cx-sc-acts"><button className="cx-btn primary" onClick={next} data-smart="next">Next</button></div></>}
            </>
          ) : (
            <>
              <b className="cx-smart-q" data-smart="q">{cur.kind === "card" ? cur.front : cur.term}</b>
              {shown ? <p className="cx-smart-a" data-smart="a">{cur.kind === "card" ? cur.back : cur.def}</p> : <button className="cx-btn" onClick={() => setShown(true)} data-smart="show"><Eye size={14} /> Show answer</button>}
              {shown && <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => grade(true)} data-smart="knew"><Check size={14} /> Knew it</button><button className="cx-btn" onClick={() => grade(false)} data-smart="didnt"><X size={14} /> Didn't</button></div>}
            </>
          )}
        </div>
      ) : (
        <div className="cx-cmp-out cx-ac-in" data-smart="done"><h3 className="cx-lab-h3"><Brain size={16} /> Done for today: {right} of {queue.length} right</h3><p>Come back tomorrow to keep your streak going.</p><div className="cx-sc-acts"><button className="cx-btn" onClick={restart} data-smart="again"><RotateCcw size={14} /> Check for more</button></div></div>
      )}
    </section>
  );
}
