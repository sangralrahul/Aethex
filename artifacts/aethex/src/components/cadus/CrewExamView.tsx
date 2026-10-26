/**
 * Exam Countdown: set the exam and date, tick subjects as you finish them, and get a pace, the
 * revision window and the next subject with the assistant to study it with.
 */
import { useState, type ReactNode } from "react";
import { CalendarClock, MessageSquare, Trash2 } from "lucide-react";
import { dateKey, EXAM_SUBJECTS, examPlan, EXAMS, findCrew, type CrewMember, type ExamState } from "@/lib/cadus/crew";

export default function CrewExamView({ state, setState, mine, badge, onChat, mistakesDue, onMistakes, toast }: {
  state: ExamState | null;
  setState: (s: ExamState | null) => void;
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  onChat: (c: CrewMember, prompt: string) => void;
  mistakesDue: number;
  onMistakes: () => void;
  toast: (t: string) => void;
}) {
  const [exam, setExam] = useState(state?.exam ?? "neetpg");
  const [name, setName] = useState(state?.name ?? "");
  const [date, setDate] = useState(state?.date ?? "");
  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast("Pick the exam date"); return; }
    setState({ exam, name: name.trim().slice(0, 60), date, done: state?.done ?? [] });
    toast("Exam saved");
  };
  const plan = state ? examPlan(state, dateKey()) : null;
  const nextCrew = plan?.next ? findCrew(plan.next[1], mine) : undefined;
  return (
    <section className="cx-page cx-lab cx-exam">
      <header className="cx-page-h"><div><h1>Exam Countdown</h1><p>Set your exam date, tick off subjects as you finish them, and Cadus works out your pace, keeps the last stretch for revision and suggests what to study next.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Exam</span><select className="cx-select" value={exam} onChange={(e) => setExam(e.target.value)} data-ex="exam">{EXAMS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        {exam === "custom" && <label className="cx-field"><span>Name</span><input className="cx-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MD Medicine final" data-ex="name" /></label>}
        <label className="cx-field"><span>Date</span><input type="date" className="cx-input" value={date} onChange={(e) => setDate(e.target.value)} data-ex="date" /></label>
        <button className="cx-btn primary" onClick={save} data-ex="save"><CalendarClock size={14} /> {state ? "Update" : "Start countdown"}</button>
      </div>
      {state && plan && (
        <>
          <div className="cx-sim-stats" data-ex="stats"><div><b data-ex="days">{Math.max(0, plan.daysLeft)}</b><small>days left</small></div><div><b data-ex="left">{plan.remaining.length}</b><small>subjects left</small></div><div><b>{plan.daysPerSubject ?? "–"}</b><small>days per subject</small></div><div><b>{mistakesDue}</b><small>mistakes to re-test</small></div></div>
          <div className={`cx-cmp-out ${plan.phase === "revision" ? "cx-ac-high" : "cx-ac-in"}`} data-ex="plan" data-phase={plan.phase}><p><b>{plan.text}</b></p>
            <div className="cx-sc-acts">
              {plan.next && nextCrew && <button className="cx-btn primary" onClick={() => onChat(nextCrew, `I'm preparing for my exam. Make me a high-yield revision plan for ${plan.next![0]} for the next ${plan.daysPerSubject ? Math.max(1, Math.round(plan.daysPerSubject)) : 2} days, then quiz me with 5 MCQs.`)} data-ex="go">{badge(nextCrew, 18)} Study {plan.next[0]} with {nextCrew.name}</button>}
              {mistakesDue > 0 && <button className="cx-btn" onClick={onMistakes} data-ex="mistakes"><MessageSquare size={14} /> Re-test mistakes</button>}
            </div>
          </div>
          <h4>Subjects ({state.done.length}/{EXAM_SUBJECTS.length} done)</h4>
          <div className="cx-crew-chips" data-ex="subjects">{EXAM_SUBJECTS.map(([s]) => <button key={s} className={`cx-chip ${state.done.includes(s) ? "on" : ""}`} aria-pressed={state.done.includes(s)} onClick={() => setState({ ...state, done: state.done.includes(s) ? state.done.filter((x) => x !== s) : [...state.done, s] })} data-ex-sub={s}>{s}</button>)}</div>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { setState(null); setDate(""); toast("Countdown removed"); }} data-ex="remove"><Trash2 size={14} /> Remove countdown</button></div>
        </>
      )}
    </section>
  );
}
