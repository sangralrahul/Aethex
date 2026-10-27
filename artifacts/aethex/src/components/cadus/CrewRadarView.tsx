/**
 * Weak Topic Radar: reads quiz battles, daily drills, MCQ practice, the mistakes notebook and
 * teach-back scores (all on this device), ranks topics weakest first, and turns them into revision.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Loader2, Play, Radar, Save, Sparkles } from "lucide-react";
import { crewForTopic, findCrew, radarPlanPrompt, radarTopics, readDrill, readMistakes, readQuizResults, readSpot, readTeach, revisePrompt, type CrewMember, type RadarItem } from "@/lib/cadus/crew";
import { readPractice } from "@/lib/cadus/practice";
import { MdBlock } from "./LiveAnswer";

export default function CrewRadarView({ mine, badge, ask, canAsk, friendlyError, toast, onRevise, onNote }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onRevise: (c: CrewMember, prompt: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const items = useMemo<RadarItem[]>(() => radarTopics({
    quiz: readQuizResults(),
    drill: readDrill().stats,
    mistakes: readMistakes(),
    teach: readTeach(),
    practice: readPractice().stats,
    spot: readSpot(),
  }), []);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState("");
  const weak = items.filter((i) => i.weak);
  const coach = findCrew("crew-neetpg", mine);
  const makePlan = async () => {
    if (!coach || !items.length || !canAsk(1)) return;
    setBusy(true);
    try { setPlan(await ask(coach, radarPlanPrompt(weak.length ? weak : items.slice(0, 6)))); }
    catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const band = (s: number) => (s < 50 ? "low" : s < 75 ? "mid" : "high");
  return (
    <section className="cx-page cx-lab cx-radar">
      <header className="cx-page-h"><div><h1>Weak Topic Radar</h1><p>Your quizzes, daily drills, MCQ practice, spot-the-error rounds, mistakes and teach-back scores, combined into one list of topics from weakest to strongest. Nothing leaves this device until you ask for a plan.</p></div></header>
      {!items.length ? (
        <p className="cx-set-hint" data-rdr="empty">Nothing to read yet. Play a Quiz Battle, do a daily drill or MCQ practice, or try a teach-back, and your radar fills in.</p>
      ) : (
        <>
          <div className="cx-sim-stats"><div><b data-rdr="count">{items.length}</b><small>topics tracked</small></div><div><b data-rdr="weak">{weak.length}</b><small>weak (under 60%)</small></div><div><b>{items[items.length - 1].topic.slice(0, 22)}</b><small>strongest</small></div></div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void makePlan()} disabled={busy} data-rdr="plan">{busy ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} {busy ? "Planning…" : plan ? "Make a new fix-it plan" : "Make a 7-day fix-it plan"}</button></div>
          {plan && (
            <div className="cx-cmp-out cx-rdr-plan" data-rdr="plan-out">
              <MdBlock text={plan} />
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { onNote("crew-neetpg", plan, "Fix-it plan from Weak Topic Radar"); toast("Plan saved to Crew notes"); }} data-rdr="save"><Save size={14} /> Save to notes</button></div>
            </div>
          )}
          <ul className="cx-rdr-list" data-rdr="list">{items.map((i) => {
            const c = crewForTopic(i.topic, mine);
            return (
              <li key={i.key} className={`cx-rdr ${i.weak ? "weak" : ""}`} data-rdr-item={i.topic} data-score={i.score}>
                <div className="cx-rdr-h">
                  <b>{i.topic}</b>{i.subject && i.subject.toLowerCase() !== i.topic.toLowerCase() && <span className="cx-chip">{i.subject}</span>}
                  <span className={`cx-rdr-score ${band(i.score)}`}>{i.score}%</span>
                </div>
                <span className={`cx-rdr-bar ${band(i.score)}`}><span style={{ width: `${Math.max(3, i.score)}%` }} /></span>
                <small>{[i.total ? `${i.correct}/${i.total} questions right` : "", i.mistakes ? `${i.mistakes} open mistake${i.mistakes === 1 ? "" : "s"}` : "", i.teachAvg !== null ? `teach-back ${i.teachAvg}/10` : ""].filter(Boolean).join(" · ")}</small>
                <button className="cx-btn sm" onClick={() => onRevise(c, revisePrompt(i))} data-rdr-revise={i.topic}>{badge(c, 16)} <Play size={12} /> <span>Revise with {c.name}</span></button>
              </li>
            );
          })}</ul>
        </>
      )}
      <p className="cx-rs-foot"><Radar size={13} /> Score = accuracy from questions, blended with teach-back (each attempt counts like 3 questions), minus 5 per open mistake. Weak = under 60% with at least 3 answers.</p>
    </section>
  );
}
