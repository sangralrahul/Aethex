/** /appointments: the patient's bookings, with cancel and (after a completed visit) a review. */
import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarCheck, MapPin, Star, Video, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { dateLabel, displayName, findApi, signInHere, time12, useMyAppointments, type Appointment, type FindError } from "@/lib/find";
import { FindNav, SignInCard } from "./FindParts";

const LABEL: Record<Appointment["status"], string> = { booked: "Waiting for the doctor to confirm", confirmed: "Confirmed", completed: "Completed", "no-show": "Missed", cancelled: "Cancelled" };

function Review({ a, onDone }: { a: Appointment; onDone: () => void }) {
  const [open, setOpen] = useState(false), [rating, setRating] = useState(0), [text, setText] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  if (!open) return <button type="button" className="fd-btn sm ghost" onClick={() => setOpen(true)}><Star size={14} /> Review this visit</button>;
  return (
    <div className="fd-rev-form" data-find="review">
      <div className="fd-rate" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} className={n <= rating ? "on" : ""} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}><Star size={22} fill={n <= rating ? "currentColor" : "none"} /></button>)}</div>
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="How was your visit? (optional)" />
      {err && <p className="fd-err">{err}</p>}
      <button type="button" className="fd-btn sm" disabled={busy || !rating} onClick={async () => {
        setBusy(true); setErr("");
        try { await findApi("/reviews", { appointmentId: a.id, rating, text }); onDone(); } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
      }}>Post review</button>
    </div>
  );
}

export default function MyAppointments() {
  useSeo({ title: "My appointments | Aethex Find", description: "Your Aethex Find appointments.", path: "/appointments" });
  const qc = useQueryClient();
  const { data, isLoading, error } = useMyAppointments();
  const [err, setErr] = useState("");
  const refresh = () => void qc.invalidateQueries({ queryKey: ["find"] });
  const cancel = async (a: Appointment) => {
    if (!window.confirm(`Cancel your appointment with ${a.doctor ? displayName(a.doctor.name) : "the doctor"}?`)) return;
    try { await findApi(`/appointments/${a.id}/cancel`, {}); refresh(); } catch (x) { setErr((x as FindError).message); }
  };
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  const all = data?.appointments ?? [];
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
        <span className={`pill ${a.status}`}>{LABEL[a.status]}</span>
        {a.note && a.status === "cancelled" && <span className="mu">{a.note}</span>}
      </div>
      <div className="do">
        {["booked", "confirmed"].includes(a.status) && a.date >= today && <button type="button" className="fd-btn sm danger" onClick={() => void cancel(a)}><X size={14} /> Cancel</button>}
        {a.status === "completed" && !a.reviewed && <Review a={a} onDone={refresh} />}
        {a.status === "completed" && a.reviewed && <span className="mu">Thanks for your review</span>}
      </div>
    </article>
  );

  const fe = error as FindError | null;
  return (
    <div className="fd-page" data-find="mine">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <header className="fd-pagehead"><h1><CalendarCheck size={26} /> My appointments</h1></header>
        {isLoading ? <div className="fd-card sk" style={{ height: 200 }} />
          : fe?.status === 401 ? <SignInCard title="Sign in to see your appointments" text="Your bookings with doctors on Aethex Find appear here." href={signInHere()} />
          : fe ? <div className="fd-empty"><b>Couldn't load your appointments</b><p>{fe.message}</p></div>
          : !all.length ? <div className="fd-empty"><b>No appointments yet</b><p>Find a doctor and book a time that suits you.</p><Link href="/doctors" className="fd-btn">Find a doctor</Link></div>
          : <>
            {err && <p className="fd-err">{err}</p>}
            <h2 className="fd-h2">Upcoming</h2>
            {upcoming.length ? upcoming.map(row) : <p className="fd-none">No upcoming appointments. <Link href="/doctors">Book one</Link></p>}
            {past.length > 0 && <><h2 className="fd-h2">Past and cancelled</h2>{past.map(row)}</>}
          </>}
      </div>
    </div>
  );
}
