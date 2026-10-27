/**
 * Learning Paths: an assistant plans a 5, 7 or 10-day path for a topic; tick tasks as you go and
 * start each day's lesson in a chat.
 */
import { useState, type ReactNode } from "react";
import { Loader2, Play, Route, Trash2 } from "lucide-react";
import { allCrew, dayPrompt, findCrew, parsePath, pathPrompt, pathProgress, pathToday, type CrewMember, type LearningPath } from "@/lib/cadus/crew";

export default function CrewPathsView({ mine, badge, ask, canAsk, friendlyError, toast, paths, setPaths, onDay }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  paths: LearningPath[];
  setPaths: (f: (l: LearningPath[]) => LearningPath[]) => void;
  onDay: (c: CrewMember, prompt: string) => void;
}) {
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(paths[0]?.id ?? "");
  const make = async () => {
    const c = findCrew(crewId, mine);
    if (!c) return;
    if (!topic.trim()) { toast("Add a topic"); return; }
    if (paths.length >= 20) { toast("You can keep up to 20 paths: delete one first"); return; }
    if (!canAsk(1)) return;
    setBusy(true);
    try {
      const d = parsePath(await ask(c, pathPrompt(topic, days)), days);
      if (!d.length) { toast("The plan didn't come back in a usable form. Try again."); return; }
      const p: LearningPath = { id: `lp-${Date.now().toString(36)}`, crewId, topic: topic.trim().slice(0, 200), createdAt: Date.now(), days: d };
      setPaths((l) => [p, ...l]); setOpenId(p.id); setTopic("");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const toggle = (pid: string, di: number, ti: number) => setPaths((l) => l.map((p) => (p.id !== pid ? p : { ...p, days: p.days.map((d, i) => (i !== di ? d : { ...d, tasks: d.tasks.map((t, j) => (j !== ti ? t : { ...t, done: !t.done })) })) })));
  return (
    <section className="cx-page cx-lab cx-paths">
      <header className="cx-page-h"><div><h1>Learning Paths</h1><p>Pick a topic and an assistant plans a day-by-day path from basics to exam practice. Tick tasks off and start each day's lesson in a chat.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-lpth="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="e.g. Acid-base disorders" data-lpth="topic" /></label>
        <label className="cx-field"><span>Days</span><select className="cx-select" value={days} onChange={(e) => setDays(Number(e.target.value))} data-lpth="days">{[5, 7, 10].map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void make()} disabled={busy} data-lpth="make">{busy ? <Loader2 size={14} className="cx-rot" /> : <Route size={14} />} {busy ? "Planning…" : "Make my path"}</button></div>
      <div className="cx-lp-list" data-lpth="list">{paths.map((p) => {
        const c = findCrew(p.crewId, mine);
        const pr = pathProgress(p);
        const today = pathToday(p, new Date());
        return (
          <div key={p.id} className={`cx-lp ${openId === p.id ? "open" : ""}`} data-lpth-item={p.id}>
            <button className="cx-lp-h" onClick={() => setOpenId(openId === p.id ? "" : p.id)}>{c && badge(c, 22)}<span className="cx-lp-t"><b>{p.topic}</b><small>{p.days.length} days · {pr.done}/{pr.total} tasks · day {today + 1} today</small></span><span className="cx-goal-bar sm"><span style={{ width: `${pr.pct}%` }} /></span></button>
            {openId === p.id && (
              <div className="cx-lp-b">
                {p.days.map((d, di) => (
                  <div key={di} className={`cx-lp-day ${di === today ? "today" : ""}`} data-lpth-day={di}>
                    <div className="cx-lp-dh"><b>Day {di + 1}: {d.title}</b>{di === today && <em>Today</em>}{c && <button className="cx-btn sm" onClick={() => onDay(c, dayPrompt(p, di))} data-lpth-start={di}><Play size={12} /> Start</button>}</div>
                    {d.tasks.map((t, ti) => <label key={ti} className={`cx-pa-mine ${t.done ? "done" : ""}`}><input type="checkbox" checked={t.done} onChange={() => toggle(p.id, di, ti)} data-lpth-task={`${di}-${ti}`} /> {t.text}</label>)}
                  </div>
                ))}
                <div className="cx-sc-acts"><button className="cx-btn" onClick={() => setPaths((l) => l.filter((x) => x.id !== p.id))} data-lpth="delete"><Trash2 size={14} /> Delete path</button></div>
              </div>
            )}
          </div>
        );
      })}</div>
    </section>
  );
}
