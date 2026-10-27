/**
 * Weekly Study Goals: targets for study-timer minutes, quiz questions, notes, assistant chats and
 * teach-backs, with this week's progress (Monday to Sunday).
 */
import { useState } from "react";
import { Target, Trash2 } from "lucide-react";
import { GOAL_DEFAULTS, GOAL_LABELS, type StudyGoals } from "@/lib/cadus/crew";

export default function CrewGoalsView({ goals, setGoals, progress, toast }: {
  goals: StudyGoals | null;
  setGoals: (g: StudyGoals | null) => void;
  progress: { key: keyof StudyGoals; label: string; unit: string; done: number; target: number; pct: number }[];
  toast: (t: string) => void;
}) {
  const [draft, setDraft] = useState<StudyGoals>(goals ?? GOAL_DEFAULTS);
  const met = progress.filter((p) => p.pct >= 100).length;
  return (
    <section className="cx-page cx-lab cx-goals">
      <header className="cx-page-h"><div><h1>Weekly Study Goals</h1><p>Set targets for the week; progress fills in automatically from the Study Timer, Quiz Battle, Crew notes, assistant chats and teach-backs. Weeks start on Monday.</p></div></header>
      {goals && progress.length > 0 && (
        <>
          <div className="cx-cmp-out cx-ac-in" data-gl="summary"><p><b>{met} of {progress.length} goals met this week.</b> {met === progress.length ? "Excellent work." : "Keep going."}</p></div>
          <div className="cx-goal-list">{progress.map((p) => (
            <div key={p.key} className={`cx-goal ${p.pct >= 100 ? "done" : ""}`} data-gl-p={p.key} data-pct={p.pct}>
              <div className="cx-goal-h"><b>{p.label}</b><span>{p.done} / {p.target} {p.unit}</span></div>
              <div className="cx-goal-bar"><span style={{ width: `${p.pct}%` }} /></div>
            </div>
          ))}</div>
        </>
      )}
      <h4><Target size={14} /> {goals ? "Change targets" : "Set your targets"}</h4>
      <div className="cx-nihss">{GOAL_LABELS.map(([k, l, u]) => <label key={k} className="cx-field"><span>{l} ({u}, 0 to skip)</span><input className="cx-input" inputMode="numeric" value={draft[k] || ""} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || 0 })} placeholder="0" data-gl-t={k} /></label>)}</div>
      <div className="cx-sc-acts">
        <button className="cx-btn primary" onClick={() => { if (!GOAL_LABELS.some(([k]) => draft[k] > 0)) { toast("Set at least one target"); return; } setGoals(draft); toast("Goals saved"); }} data-gl="save"><Target size={14} /> Save goals</button>
        {goals && <button className="cx-btn" onClick={() => { setGoals(null); toast("Goals removed"); }} data-gl="clear"><Trash2 size={14} /> Remove goals</button>}
      </div>
    </section>
  );
}
