/**
 * Appointments: the clinic's appointment book on this device: slots from your hours, booking,
 * WhatsApp reminders, arrived (straight into the OPD queue), seen, no-show and cancelled.
 */
import { useMemo, useState } from "react";
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, LogIn, MessageCircle, Plus, Settings2, UserX, X } from "lucide-react";
import { apptReminder, apptStats, arriveToOpd, daySlots, newAppt, nextFreeSlot, readAppts, saveAppts, ymd, type Appt, type ApptState, type ApptStatus } from "@/lib/cadus/clinic25";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const shift = (d: string, n: number) => { const x = new Date(`${d}T00:00:00`); x.setDate(x.getDate() + n); return ymd(x); };

export default function AppointmentsView({ toast, clinic, onOpenOpd }: { toast: (t: string) => void; clinic: string; onOpenOpd: () => void }) {
  const [s, setS] = useState<ApptState>(readAppts);
  const [date, setDate] = useState(ymd(new Date()));
  const [setup, setSetup] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", reason: "", age: "", sex: "" as Appt["sex"], time: "" });
  const put = (n: ApptState) => { setS(n); saveAppts(n); };
  const slots = useMemo(() => daySlots(s, date), [s, date]);
  const st = apptStats(s, date);
  const time = f.time && slots.some((x) => x.time === f.time && x.free > 0) ? f.time : nextFreeSlot(s, date);
  const label = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const set = (a: Appt, status: ApptStatus) => put({ ...s, appts: s.appts.map((x) => (x.id === a.id ? { ...x, status } : x)) });
  const book = () => {
    if (!f.name.trim()) { toast("Add the patient's name"); return; }
    if (!time) { toast("No free slot that day"); return; }
    const a = newAppt({ date, time, name: f.name.trim().slice(0, 60), phone: f.phone.trim().slice(0, 15), reason: f.reason.trim().slice(0, 120), age: f.age, sex: f.sex });
    put({ ...s, appts: [...s.appts, a] });
    setF({ name: "", phone: "", reason: "", age: "", sex: "", time: "" });
    toast(`Booked for ${a.time}`);
  };
  const extra = s.appts.filter((a) => a.date === date && a.status !== "cancelled" && !slots.some((x) => x.time === a.time));

  return (
    <section className="cx-page cx-lab cx-appt">
      <header className="cx-page-h"><div><h1>Appointments</h1><p>Your appointment book: slots from your clinic hours, WhatsApp reminders, and patients who arrive go straight into the OPD queue. Kept on this device.</p></div></header>
      <div className="cx-appt-nav">
        <button className="cx-ib" onClick={() => setDate(shift(date, -1))} aria-label="Previous day"><ChevronLeft size={16} /></button>
        <label className="cx-vax-dob"><CalendarDays size={14} /><input className="cx-input" type="date" value={date} onChange={(e) => setDate(e.target.value || ymd(new Date()))} aria-label="Date" data-appt="date" /></label>
        <button className="cx-ib" onClick={() => setDate(shift(date, 1))} aria-label="Next day"><ChevronRight size={16} /></button>
        <b>{label}</b>
        <button className="cx-btn" onClick={() => setSetup(!setup)} data-appt="setup"><Settings2 size={14} /> Clinic hours</button>
      </div>
      {setup && (
        <div className="cx-rec-visit" data-appt="hours">
          <div className="cx-c23-row">
            {([["start", "Opens"], ["end", "Closes"], ["breakStart", "Break from"], ["breakEnd", "Break to"]] as const).map(([k, l]) => <label key={k} className="cx-field"><span>{l}</span><input className="cx-input" type="time" value={s.settings[k]} onChange={(e) => put({ ...s, settings: { ...s.settings, [k]: e.target.value } })} data-appt-set={k} /></label>)}
            <label className="cx-field"><span>Minutes per slot</span><input className="cx-input" inputMode="numeric" value={s.settings.slot} onChange={(e) => put({ ...s, settings: { ...s.settings, slot: Number(e.target.value.replace(/\D/g, "")) || 15 } })} data-appt-set="slot" /></label>
            <label className="cx-field"><span>Patients per slot</span><input className="cx-input" inputMode="numeric" value={s.settings.perSlot} onChange={(e) => put({ ...s, settings: { ...s.settings, perSlot: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) } })} /></label>
          </div>
          <div className="cx-oncall-calls" role="group" aria-label="Closed on">{DAYS.map((d, i) => <button key={d} aria-pressed={s.settings.closed.includes(i)} className={s.settings.closed.includes(i) ? "on" : ""} onClick={() => put({ ...s, settings: { ...s.settings, closed: s.settings.closed.includes(i) ? s.settings.closed.filter((x) => x !== i) : [...s.settings.closed, i] } })}>Closed {d}</button>)}</div>
        </div>
      )}
      <div className="cx-sim-stats" data-appt="stats">
        <div><b>{st.total}</b><small>booked</small></div><div><b>{st.arrived}</b><small>arrived</small></div><div><b>{st.noShow}</b><small>no-show</small></div>
      </div>
      <form className="cx-opd-add" onSubmit={(e) => { e.preventDefault(); book(); }}>
        <input className="cx-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Patient's name" aria-label="Patient's name" data-appt="name" />
        <input className="cx-input sm" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d+ ]/g, "") })} placeholder="Phone" aria-label="Phone" data-appt="phone" />
        <input className="cx-input sm" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="Age" aria-label="Age" inputMode="numeric" />
        <input className="cx-input" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Reason, e.g. BP review" aria-label="Reason" data-appt="reason" />
        <select className="cx-select sm" value={time} onChange={(e) => setF({ ...f, time: e.target.value })} aria-label="Time" data-appt="time">{slots.filter((x) => x.free > 0).map((x) => <option key={x.time} value={x.time}>{x.time}</option>)}{!slots.some((x) => x.free > 0) && <option value="">No free slot</option>}</select>
        <button className="cx-btn primary" type="submit" disabled={!time} data-appt="book"><Plus size={14} /> Book</button>
      </form>
      {slots.length ? (
        <ul className="cx-appt-list" data-appt="slots">
          {[...slots.map((x) => ({ time: x.time, booked: x.booked, free: x.free })), ...extra.map((a) => ({ time: a.time, booked: [a], free: 0 }))].sort((a, b) => a.time.localeCompare(b.time)).map((x) => (
            <li key={x.time + x.booked.map((b) => b.id).join()} className={x.booked.length ? "taken" : "free"} data-appt-slot={x.time}>
              <span className="cx-appt-t">{x.time}</span>
              {x.booked.length ? x.booked.map((a) => (
                <div key={a.id} className={`cx-appt-b s-${a.status}`} data-appt-name={a.name}>
                  <span><b>{a.name}</b>{(a.age || a.reason) && <small>{[a.age && `${a.age}y`, a.reason].filter(Boolean).join(" · ")}</small>}</span>
                  <em>{a.status}</em>
                  {a.status === "booked" && <>
                    <button className="cx-ib" onClick={() => { const t = arriveToOpd(a); set(a, "arrived"); toast(`In the OPD queue: token ${t}`); }} aria-label="Arrived: add to the OPD queue" title="Arrived" data-appt="arrive"><LogIn size={15} /></button>
                    {a.phone && <a className="cx-ib" href={`https://wa.me/${a.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(apptReminder(a, clinic))}`} target="_blank" rel="noopener noreferrer" aria-label="Send a WhatsApp reminder" title="WhatsApp reminder"><MessageCircle size={15} /></a>}
                    <button className="cx-ib" onClick={() => set(a, "no-show")} aria-label="No-show" title="No-show"><UserX size={15} /></button>
                    <button className="cx-ib" onClick={() => set(a, "cancelled")} aria-label="Cancel" title="Cancel"><X size={15} /></button>
                  </>}
                </div>
              )) : <button className="cx-appt-free" onClick={() => setF({ ...f, time: x.time })} aria-label={`Book ${x.time}`}>Free</button>}
            </li>
          ))}
        </ul>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><CalendarClock size={20} /></span><h3>The clinic is closed this day</h3><p>Change the clinic hours or choose another day.</p></div>}
      {st.arrived > 0 && <div className="cx-sc-acts"><button className="cx-btn" onClick={onOpenOpd}><LogIn size={14} /> Open the OPD queue</button></div>}
      <p className="cx-rs-foot"><CalendarClock size={13} /> Names and phone numbers stay in this browser only; the OPD queue gets initials.</p>
    </section>
  );
}
