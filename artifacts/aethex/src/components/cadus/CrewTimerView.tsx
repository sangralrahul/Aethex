/**
 * Study Timer: a focus (pomodoro) timer tied to an assistant and a topic. When it ends, the
 * assistant quizzes you on what you studied. Sessions, today's minutes and streak stay on this device.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Coffee, Flame, Play, Square, Timer } from "lucide-react";
import { allCrew, findCrew, mmss, pomoQuizPrompt, pomoStats, type CrewMember, type PomoSession } from "@/lib/cadus/crew";

const RUN_KEY = "cadus3.crewPomoRun";
interface Run { start: number; end: number; crewId: string; topic: string; minutes: number; brk?: boolean }
const readRun = (): Run | null => { try { const r = JSON.parse(localStorage.getItem(RUN_KEY) || "null"); return r && r.end > 0 ? r : null; } catch { return null; } };
const saveRun = (r: Run | null) => { try { if (r) localStorage.setItem(RUN_KEY, JSON.stringify(r)); else localStorage.removeItem(RUN_KEY); } catch { /* blocked */ } };

export default function CrewTimerView({ mine, badge, list, setList, onQuiz, toast }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  list: PomoSession[];
  setList: (f: (l: PomoSession[]) => PomoSession[]) => void;
  onQuiz: (c: CrewMember, prompt: string) => void;
  toast: (t: string) => void;
}) {
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [run, setRun] = useState<Run | null>(readRun);
  const [done, setDone] = useState<PomoSession | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!run) return; const t = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(t); }, [run]);
  const finish = (r: Run, early: boolean) => {
    saveRun(null); setRun(null);
    if (r.brk) { toast("Break over: ready for the next session"); return; }
    const mins = early ? Math.max(1, Math.round((Date.now() - r.start) / 60000)) : r.minutes;
    const s: PomoSession = { at: Date.now(), crewId: r.crewId, topic: r.topic, minutes: mins };
    setList((l) => [s, ...l]);
    setDone(s);
    if (!early) { try { navigator.vibrate?.(300); } catch { /* not supported */ } }
    toast(`Session done: ${mins} minute${mins === 1 ? "" : "s"} on ${r.topic || "your topic"}`);
  };
  useEffect(() => { if (run && now >= run.end) finish(run, false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [now, run]);
  const start = (brk = false) => {
    if (!brk && !topic.trim()) { toast("What are you studying? Add a topic"); return; }
    const mins = brk ? 5 : minutes;
    const r: Run = { start: Date.now(), end: Date.now() + mins * 60000, crewId, topic: topic.trim().slice(0, 120), minutes: mins, brk };
    saveRun(r); setRun(r); setDone(null); setNow(Date.now());
  };
  const st = pomoStats(list, new Date());
  const c = findCrew(run?.crewId ?? done?.crewId ?? crewId, mine);
  const left = run ? run.end - now : minutes * 60000;
  const pct = run ? Math.min(100, ((now - run.start) / (run.end - run.start)) * 100) : 0;
  return (
    <section className="cx-page cx-lab cx-pomo">
      <header className="cx-page-h"><div><h1>Study Timer</h1><p>Focus on one topic for a set time; when the timer ends, your assistant quizzes you on it. Take a 5-minute break between sessions.</p></div></header>
      <div className="cx-sim-stats" data-pom="stats"><div><b data-pom="today">{st.todayMin}</b><small>minutes today</small></div><div><b>{st.todaySessions}</b><small>sessions today</small></div><div><b>{st.weekMin}</b><small>minutes this week</small></div><div><b data-pom="streak">{st.streak}</b><small><Flame size={11} /> day streak</small></div></div>
      {!run && (
        <div className="cx-c23-row">
          <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-pom="crew">{allCrew(mine).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Heart failure drugs" data-pom="topic" /></label>
          <label className="cx-field"><span>Minutes</span><select className="cx-select" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} data-pom="minutes">{[15, 25, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
        </div>
      )}
      <div className={`cx-pomo-clock ${run ? (run.brk ? "brk" : "on") : ""}`} data-pom="clock">
        <span className="cx-pomo-ring" style={{ ["--p" as string]: `${pct}%` }} />
        <b data-pom="time">{mmss(left)}</b>
        <small>{run ? (run.brk ? "Break" : `${run.topic}${c ? ` · ${c.name}` : ""}`) : "Ready"}</small>
      </div>
      <div className="cx-sc-acts">
        {!run && <button className="cx-btn primary" onClick={() => start(false)} data-pom="start"><Play size={14} /> Start {minutes}-minute session</button>}
        {!run && <button className="cx-btn" onClick={() => start(true)} data-pom="break"><Coffee size={14} /> 5-minute break</button>}
        {run && <button className="cx-btn" onClick={() => finish(run, true)} data-pom="end"><Square size={14} /> {run.brk ? "End break" : "End session now"}</button>}
      </div>
      {done && c && (
        <div className="cx-cmp-out cx-ac-in" data-pom="done"><p><b>Well done: {done.minutes} minute{done.minutes === 1 ? "" : "s"} on {done.topic}.</b> Test yourself now while it is fresh.</p>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onQuiz(c, pomoQuizPrompt(done.topic, done.minutes))} data-pom="quiz">{badge(c, 18)} Quiz me with {c.name}</button><button className="cx-btn" onClick={() => start(true)} data-pom="break2"><Coffee size={14} /> Take a break</button></div>
        </div>
      )}
      {list.length > 0 && <><h4><Timer size={14} /> Recent sessions</h4><ul className="cx-pomo-list" data-pom="list">{list.slice(0, 8).map((s, i) => <li key={s.at + i}><b>{s.topic || "Study"}</b> · {s.minutes} min · {findCrew(s.crewId, mine)?.name ?? "assistant"} · {new Date(s.at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</li>)}</ul></>}
    </section>
  );
}
