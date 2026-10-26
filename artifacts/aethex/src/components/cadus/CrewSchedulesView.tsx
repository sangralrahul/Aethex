/**
 * Assistant Schedules: reminders inside Crew, e.g. "Ask me 3 viva questions every weekday at 8 pm".
 * Due ones show on the Crew page; starting one opens a chat with the prompt ready.
 */
import { useState, type ReactNode } from "react";
import { AlarmClock, Play, Plus, Trash2 } from "lucide-react";
import { allCrew, DAY_NAMES, findCrew, newSchedule, nextRun, SCHEDULE_IDEAS, SCHEDULE_MAX, type CrewMember, type CrewSchedule } from "@/lib/cadus/crew";

export default function CrewSchedulesView({ mine, list, setList, badge, onStart, toast }: {
  mine: CrewMember[];
  list: CrewSchedule[];
  setList: (f: (l: CrewSchedule[]) => CrewSchedule[]) => void;
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  onStart: (s: CrewSchedule) => void;
  toast: (t: string) => void;
}) {
  const [crewId, setCrewId] = useState("crew-viva");
  const [prompt, setPrompt] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [time, setTime] = useState("20:00");
  const add = (c: string, p: string, d: number[], t: string) => {
    if (list.length >= SCHEDULE_MAX) { toast(`You can keep up to ${SCHEDULE_MAX} schedules`); return; }
    const s = newSchedule(c, p, d, t);
    if (!s) { toast("Add a prompt, at least one day and a time"); return; }
    setList((l) => [...l, s]); setPrompt(""); toast("Schedule added");
  };
  const now = new Date();
  return (
    <section className="cx-page cx-lab cx-schedules">
      <header className="cx-page-h"><div><h1>Assistant Schedules</h1><p>Set an assistant to quiz or teach you at a regular time. When one is due it appears on the Crew page; start it and the chat opens with the prompt ready.</p></div></header>
      <div className="cx-crew-chips"><span className="cx-set-hint">Ideas:</span>{SCHEDULE_IDEAS.map((x) => <button key={x.label} className="cx-chip" onClick={() => add(x.crewId, x.prompt, x.days, x.time)} data-sch-idea={x.label}><AlarmClock size={12} /> {x.label}</button>)}</div>
      <h4><Plus size={14} /> New schedule</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-sch="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="cx-field"><span>Time</span><input type="time" className="cx-input" value={time} onChange={(e) => setTime(e.target.value)} data-sch="time" /></label>
      </div>
      <label className="cx-field"><span>What should it do?</span><textarea className="cx-input" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, 1000))} placeholder="e.g. Ask me 3 viva questions on today's ward topic, one at a time" data-sch="prompt" /></label>
      <div className="cx-crew-chips" data-sch="days">{DAY_NAMES.map((d, i) => <button key={d} className={`cx-chip ${days.includes(i) ? "on" : ""}`} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])} data-sch-day={i}>{d}</button>)}</div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => add(crewId, prompt, days, time)} data-sch="add"><Plus size={14} /> Add schedule</button></div>
      {list.length > 0 && <h4>Your schedules</h4>}
      <div className="cx-rm-list" data-sch="list">{list.map((x) => { const c = findCrew(x.crewId, mine); const nx = nextRun(x, now); return (
        <div key={x.id} className="cx-rm-card" data-sch-item={x.id}>
          {c && badge(c, 24)}
          <span className="cx-rm-open"><b>{x.prompt.slice(0, 80)}{x.prompt.length > 80 ? "…" : ""}</b><small>{c?.name} · {x.days.map((d) => DAY_NAMES[d]).join(", ")} at {x.time} · {nx === "Due now" || nx === "Paused" ? "" : "next "}<span data-sch-next={x.id}>{nx}</span></small></span>
          {nx === "Due now" && <button className="cx-btn sm primary" onClick={() => onStart(x)} data-sch-start={x.id}><Play size={13} /> Start</button>}
          <label className="cx-pa-mine"><input type="checkbox" checked={x.enabled} onChange={(e) => setList((l) => l.map((y) => (y.id === x.id ? { ...y, enabled: e.target.checked } : y)))} data-sch-on={x.id} /> On</label>
          <button className="cx-ib" aria-label="Delete schedule" onClick={() => setList((l) => l.filter((y) => y.id !== x.id))}><Trash2 size={15} /></button>
        </div>); })}</div>
      <p className="cx-set-hint">Schedules show while Cadus is open on this device; they do not send phone notifications.</p>
    </section>
  );
}
