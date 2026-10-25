/**
 * Scheduled Check-ins: choose an assistant to give you a daily tip or a weekly study plan. When one
 * is due, opening this page fetches it (each costs one question). History stays on this device.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BellRing, Loader2, Plus, Trash2 } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { addEntry, allCrew, checkinPrompt, dateKey, dueCheckins, findCrew, newCheckin, type CheckIn, type CheckIns, type CrewMember } from "@/lib/cadus/crew";

export default function CrewCheckinsView({ mine, state, setState, who, badge, ask, canAsk, friendlyError, toast }: {
  mine: CrewMember[];
  state: CheckIns;
  setState: (f: (s: CheckIns) => CheckIns) => void;
  who?: string;
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [kind, setKind] = useState<"tip" | "plan">("tip");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const ran = useRef(false);
  const today = dateKey();
  const due = dueCheckins(state, today);

  const fetchDue = async (items: CheckIn[]) => {
    const ready = items.filter((i) => findCrew(i.crewId, mine));
    if (!ready.length || !canAsk(ready.length)) return;
    setBusy(true);
    for (const it of ready) {
      const c = findCrew(it.crewId, mine)!;
      try { const text = await ask(c, checkinPrompt(it, today, who)); setState((s) => addEntry(s, it, today, text)); }
      catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); break; }
    }
    setBusy(false);
  };
  useEffect(() => { if (!ran.current && due.length) { ran.current = true; void fetchDue(due); } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="cx-page cx-lab cx-checkins">
      <header className="cx-page-h"><div><h1>Crew Check-ins</h1><p>An assistant gives you a daily tip or a weekly study plan. When one is due, it arrives when you open this page.</p></div></header>
      {busy && <p className="cx-set-hint" data-ck="busy"><Loader2 size={13} className="cx-rot" /> Getting your check-ins…</p>}
      <h4><Plus size={14} /> New check-in</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-ck="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="cx-field"><span>What</span><select className="cx-select" value={kind} onChange={(e) => setKind(e.target.value as "tip" | "plan")} data-ck="kind"><option value="tip">Daily tip</option><option value="plan">Weekly study plan</option></select></label>
        <label className="cx-field"><span>Topic</span><input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 120))} placeholder="e.g. Pharmacology, NEET-PG, ECGs" data-ck="topic" /></label>
        <button className="cx-btn primary" disabled={state.items.length >= 6} onClick={() => { const it = newCheckin(crewId, kind, topic); setState((s) => ({ ...s, items: [...s.items, it] })); setTopic(""); toast("Check-in added"); }} data-ck="add"><BellRing size={14} /> Add</button>
      </div>
      {state.items.length > 0 && (
        <div className="cx-rm-list" data-ck="items">{state.items.map((it) => { const c = findCrew(it.crewId, mine); const isDue = due.some((d) => d.id === it.id); return (
          <div key={it.id} className="cx-rm-card" data-ck-item={it.id}>
            {c && badge(c, 24)}
            <span className="cx-rm-open"><b>{it.kind === "tip" ? "Daily tip" : "Weekly plan"}{it.topic ? `: ${it.topic}` : ""}</b><small>{c?.name ?? "Assistant"} · {it.enabled ? (isDue ? "due now" : "up to date") : "paused"}</small></span>
            <label className="cx-pa-mine"><input type="checkbox" checked={it.enabled} onChange={(e) => setState((s) => ({ ...s, items: s.items.map((x) => (x.id === it.id ? { ...x, enabled: e.target.checked } : x)) }))} data-ck-on={it.id} /> On</label>
            <button className="cx-ib" onClick={() => setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== it.id) }))} aria-label="Delete check-in"><Trash2 size={15} /></button>
          </div>); })}</div>
      )}
      {due.length > 0 && !busy && <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void fetchDue(due)} data-ck="fetch"><BellRing size={14} /> Get {due.length} due check-in{due.length === 1 ? "" : "s"}</button></div>}
      {state.history.length > 0 && <h4>Your check-ins</h4>}
      {state.history.slice(0, 10).map((h) => { const c = findCrew(h.crewId, mine); return (
        <div key={h.id} className="cx-cmp-out" data-ck-entry={h.date}>
          <div className="cx-so-h">{c && badge(c, 24)}<b>{c?.name}</b><small>&nbsp;{h.date}</small></div>
          <MdBlock text={h.text} />
        </div>); })}
    </section>
  );
}
