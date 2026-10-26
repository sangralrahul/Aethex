/**
 * Mistake Notebook: every wrong Quiz Battle answer is kept here. Re-test until you get each one
 * right twice in a row, then it is mastered.
 */
import { useState, type ReactNode } from "react";
import { BookOpenCheck, Check, RotateCcw, Trash2, X } from "lucide-react";
import { dueMistakes, findCrew, retestMistake, type CrewMember, type Mistake } from "@/lib/cadus/crew";

export default function CrewMistakesView({ list, setList, mine, badge, onQuiz, toast }: {
  list: Mistake[];
  setList: (f: (l: Mistake[]) => Mistake[]) => void;
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  onQuiz: () => void;
  toast: (t: string) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [cur, setCur] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const due = dueMistakes(list);
  const mastered = list.filter((x) => x.mastered).length;
  const q = testing ? list.find((x) => x.id === cur) ?? null : null;
  const start = () => { if (!due.length) { toast("Nothing to re-test: well done"); return; } setTesting(true); setCur(due[0].id); setPicked(null); };
  const pick = (k: number) => { if (!q || picked !== null) return; setPicked(k); setList((l) => retestMistake(l, q.id, k === q.answer)); };
  const next = () => {
    const rest = dueMistakes(list).filter((x) => x.id !== cur);
    if (!rest.length) { setTesting(false); setCur(null); toast("Round finished"); return; }
    setCur(rest[0].id); setPicked(null);
  };
  const shown = showAll ? list : due;
  return (
    <section className="cx-page cx-lab cx-mistakes">
      <header className="cx-page-h"><div><h1>Mistake Notebook</h1><p>Questions you got wrong in Quiz Battle, saved on this device. Re-test them until you get each right twice in a row.</p></div></header>
      <div className="cx-sim-stats" data-mk="stats"><div><b data-mk="due">{due.length}</b><small>to re-test</small></div><div><b data-mk="mastered">{mastered}</b><small>mastered</small></div><div><b>{list.length}</b><small>in total</small></div></div>
      <div className="cx-sc-acts">
        <button className="cx-btn primary" onClick={start} disabled={!due.length} data-mk="start"><RotateCcw size={14} /> Re-test {Math.min(due.length, 99)} question{due.length === 1 ? "" : "s"}</button>
        <button className="cx-btn" onClick={onQuiz} data-mk="quiz"><BookOpenCheck size={14} /> New quiz</button>
        {mastered > 0 && <button className="cx-btn" onClick={() => setList((l) => l.filter((x) => !x.mastered))} data-mk="clear">Remove mastered</button>}
      </div>
      {q && (
        <div className="cx-cmp-out" data-mk="q">
          <h3 className="cx-lab-h3">{q.q}</h3>
          <div className="cx-qb-opts">{q.options.map((o, k) => (
            <button key={k} className={`cx-qb-opt ${picked !== null ? (k === q.answer ? "right" : k === picked ? "wrong" : "") : ""}`} onClick={() => pick(k)} disabled={picked !== null} data-mk-opt={k}>
              <span>{String.fromCharCode(65 + k)}</span>{o}{picked !== null && k === q.answer && <Check size={14} />}{picked === k && k !== q.answer && <X size={14} />}
            </button>
          ))}</div>
          {picked !== null && <div className={`cx-cmp-out ${picked === q.answer ? "cx-ac-in" : "cx-st-out"}`} data-mk="why"><p><b>{picked === q.answer ? ((list.find((x) => x.id === q.id)?.mastered) ? "Correct: mastered!" : "Correct: once more to master it.") : `Not yet. The answer is ${String.fromCharCode(65 + q.answer)}.`}</b> {q.why}</p><button className="cx-btn primary" onClick={next} data-mk="next">Next</button></div>}
        </div>
      )}
      <div className="cx-c23-row"><label className="cx-pa-mine"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} data-mk="all" /> Show mastered too</label></div>
      {!list.length && <p className="cx-set-hint" data-mk="empty">No mistakes yet. Wrong answers in Quiz Battle appear here automatically.</p>}
      <div className="cx-rm-list" data-mk="list">{shown.map((x) => { const c = findCrew(x.crewId, mine); return (
        <div key={x.id} className="cx-rm-card" data-mk-item={x.id}>
          {c && badge(c, 24)}
          <span className="cx-rm-open"><b>{x.q.length > 110 ? `${x.q.slice(0, 110)}…` : x.q}</b><small>{x.topic || c?.name || "Quiz"} · wrong {x.wrong} time{x.wrong === 1 ? "" : "s"}{x.mastered ? " · mastered" : x.streak ? " · 1 right" : ""}</small></span>
          <button className="cx-ib" aria-label="Delete" onClick={() => setList((l) => l.filter((y) => y.id !== x.id))}><Trash2 size={15} /></button>
        </div>); })}</div>
    </section>
  );
}
