/**
 * Follow-ups: patients to review on a date (initials, what for, what to check), grouped as
 * overdue, today, this week and later. Shown on Today. Kept on this device.
 */
import { useEffect, useState } from "react";
import { CalendarClock, Check, Plus, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { dueIn, FOLLOWUP_IN, followUpGroups, isoToday, readFollowUps, rid, saveFollowUps, type FollowUp } from "@/lib/cadus/records";

const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export default function FollowUpView({ toast }: { toast: (t: string) => void }) {
  const [list, setList] = useState<FollowUp[]>(readFollowUps);
  const [label, setLabel] = useState("");
  const [reason, setReason] = useState("");
  const [review, setReview] = useState("");
  const [due, setDue] = useState(() => dueIn(7));
  useEffect(() => saveFollowUps(list), [list]);
  const g = followUpGroups(list);

  const add = () => {
    if (!label.trim() || !reason.trim()) { toast("Add who (initials or bed) and what for"); return; }
    setList((l) => [{ id: rid(), label: deidentify(label).text.slice(0, 40), reason: deidentify(reason).text.slice(0, 160), review: deidentify(review).text.slice(0, 200), due, done: false, at: Date.now() }, ...l]);
    setLabel(""); setReason(""); setReview("");
    toast(`Follow-up on ${fmt(due)}`);
  };
  const set = (id: string, p: Partial<FollowUp>) => setList((l) => l.map((f) => (f.id === id ? { ...f, ...p, at: Date.now() } : f)));
  const Row = ({ f }: { f: FollowUp }) => (
    <li className={f.done ? "done" : ""} data-fu={f.id}>
      <button className="cx-fu-tick" onClick={() => set(f.id, { done: !f.done })} aria-label={f.done ? "Not done" : "Seen"} data-fu-done={f.label}>{f.done ? <RotateCcw size={14} /> : <Check size={14} />}</button>
      <div><b>{f.label}</b> <span>{f.reason}</span>{f.review && <small>Check: {f.review}</small>}</div>
      <em>{fmt(f.due)}</em>
      {!f.done && <select className="cx-select" value="" onChange={(e) => { if (e.target.value) set(f.id, { due: dueIn(Number(e.target.value)) }); }} aria-label="Move to"><option value="">Move…</option>{FOLLOWUP_IN.map((o) => <option key={o.days} value={o.days}>In {o.label}</option>)}</select>}
      <button className="cx-ib" onClick={() => setList((l) => l.filter((x) => x.id !== f.id))} aria-label="Delete"><Trash2 size={14} /></button>
    </li>
  );
  const Group = ({ title, items, tone }: { title: string; items: FollowUp[]; tone?: string }) => (items.length ? <div className={`cx-fu-g ${tone ?? ""}`} data-fu-group={title}><p className="cx-gl"><span>{title} ({items.length})</span></p><ul className="cx-fu-list">{items.map((f) => <Row key={f.id} f={f} />)}</ul></div> : null);

  return (
    <section className="cx-page cx-bs cx-fu">
      <header className="cx-page-h"><div><h1>Follow-ups</h1><p>Patients to review on a date and what to check then. Due ones show on Today. Initials or bed numbers only.</p></div></header>
      <div className="cx-log-grid" data-fu="add">
        <label className="cx-field"><span>Who</span><input className="cx-input" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 40))} placeholder="e.g. 58M, bed 12, R.K." data-fu="label" /></label>
        <label className="cx-field"><span>What for</span><input className="cx-input" value={reason} onChange={(e) => setReason(e.target.value.slice(0, 160))} placeholder="e.g. BP after starting amlodipine" data-fu="reason" /></label>
        <label className="cx-field"><span>Check then</span><input className="cx-input" value={review} onChange={(e) => setReview(e.target.value.slice(0, 200))} placeholder="e.g. K⁺, creatinine" data-fu="review" /></label>
        <label className="cx-field"><span>On</span><input className="cx-input" type="date" value={due} min={isoToday()} onChange={(e) => setDue(e.target.value)} data-fu="due" /></label>
      </div>
      <div className="cx-bs-chips">{FOLLOWUP_IN.map((o) => <button key={o.days} className={due === dueIn(o.days) ? "on" : ""} onClick={() => setDue(dueIn(o.days))}>In {o.label}</button>)}<button className="cx-btn primary sm" onClick={add} disabled={!label.trim() || !reason.trim()} data-fu="go"><Plus size={14} /> Add</button></div>
      <Group title="Overdue" items={g.overdue} tone="bad" />
      <Group title="Today" items={g.today} tone="warn" />
      <Group title="This week" items={g.week} />
      <Group title="Later" items={g.later} />
      {!g.overdue.length && !g.today.length && !g.week.length && !g.later.length && <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><CalendarClock size={20} /></span><h3>No follow-ups due</h3><p>Add one above when you ask a patient to come back.</p></div>}
      <Group title="Seen" items={g.done.slice(0, 10)} />
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Kept on this device only. Names and numbers typed here are hidden.</p>
    </section>
  );
}
