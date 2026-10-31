/** /appointments: the patient's bookings, with cancel and (after a completed visit) a review. */
import { MyWaitlists } from "./DoctorTools2";
import { QueueStatus, ShareRecords } from "./DoctorTools3";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Building2, CalendarCheck, CalendarClock, FileText, MapPin, Star, ThumbsDown, ThumbsUp, Video, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { WAITS, addDays, dateLabel, displayName, findApi, freeSlots, signInHere, time12, useDoctor, useFamily, useMyAppointments, type Appointment, type FindError } from "@/lib/find";
import { CalendarButtons } from "./DoctorTools";
import { FindNav, SignInCard } from "./FindParts";

const LABEL: Record<Appointment["status"], string> = { booked: "Waiting for the doctor to confirm", confirmed: "Confirmed", completed: "Completed", "no-show": "Missed", cancelled: "Cancelled" };

function Review({ a, onDone }: { a: Appointment; onDone: () => void }) {
  const [rec, setRec] = useState<boolean | null>(null), [wait, setWait] = useState("");
  const [open, setOpen] = useState(false), [rating, setRating] = useState(0), [text, setText] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  if (!open) return <button type="button" className="fd-btn sm ghost" onClick={() => setOpen(true)}><Star size={14} /> Review this visit</button>;
  return (
    <div className="fd-rev-form" data-find="review">
      <div className="fd-rate" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} className={n <= rating ? "on" : ""} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}><Star size={22} fill={n <= rating ? "currentColor" : "none"} /></button>)}</div>
      <div className="fd-yn"><span>Would you recommend the doctor?</span><button type="button" className={rec === true ? "on" : ""} onClick={() => setRec(true)}><ThumbsUp size={14} /> Yes</button><button type="button" className={rec === false ? "on" : ""} onClick={() => setRec(false)}><ThumbsDown size={14} /> No</button></div>
      <select value={wait} onChange={(e) => setWait(e.target.value)} aria-label="Waiting time"><option value="">How long did you wait?</option>{WAITS.map((w) => <option key={w}>{w}</option>)}</select>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your experience: how the doctor listened, explained and treated you. (optional)" />
      {err && <p className="fd-err">{err}</p>}
      <button type="button" className="fd-btn sm" disabled={busy || !rating} onClick={async () => {
        setBusy(true); setErr("");
        try { await findApi("/reviews", { appointmentId: a.id, rating, text, recommend: rec, wait }); onDone(); } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
      }}>Post story</button>
    </div>
  );
}

/** Move an upcoming booking to another free time of the same doctor. */
function Reschedule({ a, onDone }: { a: Appointment; onDone: () => void }) {
  const { data } = useDoctor(a.doctor?.slug ?? "");
  const [date, setDate] = useState(""), [time, setTime] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const days = useMemo(() => {
    if (!data?.doctor.hours) return [];
    const taken = new Set(data.taken);
    return Array.from({ length: 14 }, (_, i) => addDays(data.today, i)).map((day) => ({ day, slots: freeSlots(data.doctor.hours!, day, taken, data.today, data.now, data.doctor.timeOff) })).filter((x) => x.slots.length);
  }, [data]);
  const slots = days.find((x) => x.day === date)?.slots ?? [];
  return (
    <div className="fd-resched" data-find="reschedule">
      <div className="fd-days">{days.map(({ day, slots: s2 }) => <button key={day} type="button" className={day === date ? "on" : ""} onClick={() => { setDate(day); setTime(""); }}><b>{dateLabel(day, { weekday: "short" })}</b><span>{dateLabel(day, { day: "numeric", month: "short" })}</span><small>{s2.length} slots</small></button>)}</div>
      {date && <div className="fd-slots"><div className="grid">{slots.map((t) => <button key={t} type="button" className={t === time ? "on" : ""} onClick={() => setTime(t)}>{time12(t)}</button>)}</div></div>}
      {err && <p className="fd-err">{err}</p>}
      <button type="button" className="fd-btn sm" disabled={!time || busy} onClick={async () => {
        setBusy(true); setErr("");
        try { await findApi(`/appointments/${a.id}/reschedule`, { date, time }); onDone(); } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
      }}>Move to {date && time ? `${dateLabel(date)}, ${time12(time)}` : "the new time"}</button>
    </div>
  );
}

export default function MyAppointments() {
  useSeo({ title: "My appointments | Aethex Doctors", description: "Your Aethex Doctors appointments.", path: "/appointments" });
  const qc = useQueryClient();
  const { data, isLoading, error } = useMyAppointments();
  const [err, setErr] = useState(""), [moving, setMoving] = useState("");
  const refresh = () => void qc.invalidateQueries({ queryKey: ["find"] });
  const cancel = async (a: Appointment) => {
    if (!window.confirm(`Cancel your appointment with ${a.doctor ? displayName(a.doctor.name) : "the doctor"}?`)) return;
    try { await findApi(`/appointments/${a.id}/cancel`, {}); refresh(); } catch (x) { setErr((x as FindError).message); }
  };
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  // update 75: filter by family member
  const fam = useFamily(!error);
  const [forWho, setForWho] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("for") ?? ""));
  const people = fam.data?.members ?? [];
  const nameOf = (a: Appointment) => (a.familyId ? people.find((m) => m.id === a.familyId)?.name ?? a.patient.name : "You");
  const everyone = data?.appointments ?? [];
  const all = forWho === "" ? everyone : everyone.filter((a) => (forWho === "me" ? !a.familyId : a.familyId === forWho));
  const upcoming = all.filter((a) => a.date >= today && ["booked", "confirmed"].includes(a.status)).reverse();
  const past = all.filter((a) => !upcoming.includes(a));

  const row = (a: Appointment) => (
    <article key={a.id} className={`fd-myappt ${a.status}`} data-appt={a.id}>
      <div className="when"><b>{dateLabel(a.date, { day: "numeric" })}</b><small>{dateLabel(a.date, { month: "short" })}</small></div>
      <div className="txt">
        <Link href={`/doctor/${a.doctor?.slug}`}><b>{a.doctor ? displayName(a.doctor.name) : "Doctor"}</b></Link>
        <span>{a.doctor?.specialty}</span>
        <span className="mu">{dateLabel(a.date, { weekday: "long" })}, {time12(a.time)} · {a.mode === "video" ? <><Video size={13} /> Video consult</> : <><Building2 size={13} /> {a.doctor?.clinic}</>}</span>
        {a.mode === "clinic" && a.doctor && <span className="mu"><MapPin size={13} /> {a.doctor.address}, {a.doctor.city}</span>}
        {a.mode === "video" && a.link && a.status === "confirmed" && <a className="fd-btn sm" href={a.link} target="_blank" rel="noopener noreferrer"><Video size={14} /> Join video consult</a>}
        {people.length > 0 && <span className="fd-for"><Users size={13} /> For {nameOf(a)}</span>}
        <span className={`pill ${a.status}`}>{LABEL[a.status]}</span>
        {a.note && a.status === "cancelled" && <span className="mu">{a.note}</span>}
        <QueueStatus a={a} />
      </div>
      <div className="do">
        {["booked", "confirmed"].includes(a.status) && a.date >= today && <CalendarButtons a={a} />}
        {a.prescription && <Link href={`/prescription/${a.prescription}`} className="fd-btn sm"><FileText size={14} /> Prescription</Link>}
        {["booked", "confirmed"].includes(a.status) && a.date >= today && <button type="button" className="fd-btn sm ghost" onClick={() => setMoving(moving === a.id ? "" : a.id)}><CalendarClock size={14} /> Reschedule</button>}
        {["booked", "confirmed"].includes(a.status) && a.date >= today && <button type="button" className="fd-btn sm danger" onClick={() => void cancel(a)}><X size={14} /> Cancel</button>}
        <ShareRecords a={a} />
        {moving === a.id && <Reschedule a={a} onDone={() => { setMoving(""); refresh(); }} />}
        {a.status === "completed" && !a.reviewed && <Review a={a} onDone={refresh} />}
        {a.status === "completed" && a.reviewed && <span className="mu">Thanks for your review</span>}
        {a.status === "completed" && a.followUp && a.followUp >= today && a.doctor && !all.some((x) => x.doctor?.slug === a.doctor!.slug && ["booked", "confirmed"].includes(x.status) && x.date >= today) && (
          <Link href={`/doctor/${a.doctor.slug}?date=${a.followUp}#book`} className="fd-btn sm" data-find="book-followup"><CalendarClock size={14} /> Book follow-up · {dateLabel(a.followUp)}</Link>
        )}
      </div>
    </article>
  );

  const fe = error as FindError | null;
  return (
    <div className="fd-page" data-find="mine">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <header className="fd-pagehead"><h1><CalendarCheck size={26} /> My appointments</h1><Link href="/family" className="fd-btn sm ghost"><Users size={15} /> Family members</Link></header>
        {people.length > 0 && (
          <div className="kh-tabs fd-tabs2" role="tablist" aria-label="Whose appointments" data-find="for-filter">
            {[["", "Everyone"], ["me", "Me"], ...people.map((m) => [m.id, m.name])].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={forWho === k} className={forWho === k ? "on" : ""} onClick={() => setForWho(k!)}>{l}</button>)}
          </div>
        )}
        {isLoading ? <div className="fd-card sk" style={{ height: 200 }} />
          : fe?.status === 401 ? <SignInCard title="Sign in to see your appointments" text="Your bookings with doctors on Aethex Doctors appear here." href={signInHere()} />
          : fe ? <div className="fd-empty"><b>Couldn't load your appointments</b><p>{fe.message}</p></div>
          : !all.length ? <div className="fd-empty"><b>{forWho ? "No appointments for this person" : "No appointments yet"}</b><p>Find a doctor and book a time that suits you.</p><Link href="/doctors" className="fd-btn">Find a doctor</Link></div>
          : <>
            {err && <p className="fd-err">{err}</p>}
            <MyWaitlists />
            <h2 className="fd-h2">Upcoming</h2>
            {upcoming.length ? upcoming.map(row) : <p className="fd-none">No upcoming appointments. <Link href="/doctors">Book one</Link></p>}
            {past.length > 0 && <><h2 className="fd-h2">Past and cancelled</h2>{past.map(row)}</>}
          </>}
      </div>
    </div>
  );
}
