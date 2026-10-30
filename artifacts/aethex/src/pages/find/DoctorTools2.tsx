/**
 * Update 79: more Aethex Doctors pieces.
 * - MedicineReminders (on a prescription): today's doses to tick off, each medicine's times (changeable), how many
 *   days, and one calendar file with a repeating reminder for every dose.
 * - WaitlistPanel (on a doctor's full day) and MyWaitlists (in My appointments).
 * - PracticeAnalytics (the doctor's dashboard): bookings by week, outcomes, busiest hours and days, new and returning
 *   patients, video share, how far ahead patients book, and ratings by month, all from real bookings.
 * Styles: src/site-hub.css (fd-med-*, fd-wait*, fd-an-*).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Bell, BellRing, CalendarPlus, Check, Clock, Pill, Plus, Trash2, X } from "lucide-react";
import { dateLabel, displayName, findApi, time12, type FindError, type Prescription } from "@/lib/find";
import { addDay, meds, medicinesIcs, planFor, useMeds } from "@/lib/medicines";

const todayIst = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

/* ---------------------------------------------------------------- medicine reminders */
export function MedicineReminders({ rx }: { rx: Prescription }) {
  const m = useMeds();
  const base = useMemo(() => planFor(rx), [rx]);
  const start = m.start[rx.id] ?? rx.date;
  const plans = base.map((p) => ({ ...p, times: m.times[p.key] ?? p.times }));
  const today = todayIst();
  const dayN = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
  const [editing, setEditing] = useState(""), [newTime, setNewTime] = useState("08:00");
  const doses = plans.flatMap((p) => (p.asNeeded || (p.days !== null && (dayN < 1 || dayN > p.days)) || dayN < 1 ? [] : p.times.map((t) => ({ p, t, key: `${p.key}@${today}T${t}` })))).sort((a, b) => a.t.localeCompare(b.t));
  const done = doses.filter((d) => m.taken[d.key]).length;
  const download = () => {
    const blob = new Blob([medicinesIcs(rx.id, start, plans, rx.patient.name)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `medicines-${rx.date}.ics`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  if (!plans.length) return null;
  const endOf = (days: number | null) => (days === null ? null : addDay(start, days - 1));
  return (
    <section className="fd-box fd-med no-print" data-find="medicines">
      <div className="fd-med-h"><h2><Pill size={18} /> Medicine reminders</h2>
        <label>Started on <input type="date" value={start} onChange={(e) => e.target.value && meds.setStart(rx.id, e.target.value)} /></label>
      </div>
      {doses.length > 0 ? (
        <div className="fd-med-today" data-find="today-doses">
          <b>Today · {done} of {doses.length} taken</b>
          <ul>{doses.map((d) => (
            <li key={d.key}><button type="button" className={m.taken[d.key] ? "on" : ""} onClick={() => meds.toggle(d.key)} aria-pressed={!!m.taken[d.key]} data-dose={d.key}>
              <span className="tick">{m.taken[d.key] ? <Check size={14} /> : null}</span><span className="t">{time12(d.t)}</span><span className="n">{d.p.name}{d.p.dose ? ` · ${d.p.dose}` : ""}</span>
            </button></li>
          ))}</ul>
        </div>
      ) : <p className="mu">{dayN < 1 ? "The course hasn't started yet." : "No doses due today."}</p>}
      <table className="fd-med-plan">
        <thead><tr><th>Medicine</th><th>Times</th><th>Until</th></tr></thead>
        <tbody>{plans.map((p) => (
          <tr key={p.key} data-plan={p.key}>
            <td><b>{p.name}</b><small>{rx.items[Number(p.key.split(":")[1])]?.frequency}{p.notes ? ` · ${p.notes}` : ""}</small></td>
            <td>{p.asNeeded ? <span className="mu">Only when needed</span> : (
              <span className="times">
                {p.times.map((t) => <em key={t}>{time12(t)}{editing === p.key && <button type="button" onClick={() => meds.setTimes(p.key, p.times.filter((x) => x !== t))} aria-label={`Remove ${time12(t)}`}><X size={11} /></button>}</em>)}
                {!p.times.length && <span className="warn">Set the times</span>}
                {editing === p.key ? <span className="add"><input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} aria-label="New time" /><button type="button" onClick={() => meds.setTimes(p.key, [...p.times, newTime])} data-find="add-time"><Plus size={13} /> Add</button><button type="button" onClick={() => setEditing("")}>Done</button></span>
                  : <button type="button" className="fd-link" onClick={() => setEditing(p.key)} data-find="edit-times"><Clock size={13} /> Change</button>}
              </span>
            )}</td>
            <td>{p.asNeeded ? "" : p.days === null ? <span className="mu">Ongoing</span> : dateLabel(endOf(p.days)!, { day: "numeric", month: "short" })}</td>
          </tr>
        ))}</tbody>
      </table>
      <div className="fd-med-acts">
        <button type="button" className="fd-btn" onClick={download} data-find="med-ics"><CalendarPlus size={16} /> Add all reminders to my calendar</button>
        <small>Your phone's calendar then reminds you at each time. Ticks are kept on this device.</small>
      </div>
      <p className="tiny">Check the times with your doctor or pharmacist, especially "before food" or "after food" medicines. Don't stop or change a medicine without asking your doctor.</p>
    </section>
  );
}

/* ---------------------------------------------------------------- waitlist */
export interface WaitItem { id: string; date: string; mode: string; notified: boolean; doctor: { slug: string; name: string; specialty: string } }
export const useWaitlist = (enabled: boolean) => useQuery({ enabled, queryKey: ["find", "waitlist"], queryFn: () => findApi<{ waitlist: WaitItem[] }>("/waitlist"), retry: false });

export function WaitlistPanel({ slug, date, mode, signedIn, signInHref }: { slug: string; date: string; mode: string; signedIn: boolean; signInHref: string }) {
  const qc = useQueryClient();
  const { data } = useWaitlist(signedIn);
  const on = data?.waitlist.find((w) => w.doctor.slug === slug && w.date === date);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const join = async () => {
    setBusy(true); setErr("");
    try { await findApi("/waitlist", { slug, date, mode }); void qc.invalidateQueries({ queryKey: ["find", "waitlist"] }); } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };
  return (
    <div className="fd-wait" data-find="waitlist">
      <BellRing size={20} />
      <div>
        <b>This day is fully booked</b>
        {on ? <p data-find="on-waitlist"><Check size={14} /> You're on the waitlist. We'll email you if a time opens up.</p> : <p>Join the waitlist: if someone cancels, we'll email you straight away so you can book.</p>}
        {err && <p className="fd-err">{err}</p>}
        {!on && (signedIn ? <button type="button" className="fd-btn sm" disabled={busy} onClick={() => void join()} data-find="join-waitlist"><Bell size={14} /> Join the waitlist</button> : <a className="fd-btn sm" href={signInHref}>Sign in to join the waitlist</a>)}
      </div>
    </div>
  );
}

export function MyWaitlists() {
  const qc = useQueryClient();
  const { data } = useWaitlist(true);
  if (!data?.waitlist.length) return null;
  const leave = async (id: string) => { await findApi(`/waitlist/${id}/delete`, {}).catch(() => null); void qc.invalidateQueries({ queryKey: ["find", "waitlist"] }); };
  return (
    <section className="fd-waits" data-find="my-waitlists">
      <h2 className="fd-h2"><BellRing size={18} /> Waitlists</h2>
      {data.waitlist.map((w) => (
        <div key={w.id} className="fd-waitrow" data-wait={w.id}>
          <span><b>{displayName(w.doctor.name)}</b><small>{w.doctor.specialty} · {dateLabel(w.date, { weekday: "long", day: "numeric", month: "short" })}</small></span>
          {w.notified ? <Link href={`/doctor/${w.doctor.slug}?date=${w.date}#book`} className="fd-btn sm">A time opened: book</Link> : <span className="pill booked">Waiting</span>}
          <button type="button" className="fd-icon" onClick={() => void leave(w.id)} aria-label="Leave the waitlist"><Trash2 size={14} /></button>
        </div>
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------- practice analytics */
interface Analytics {
  since: string; weeks: { week: string; booked: number; completed: number; noShow: number; cancelled: number }[]; status: Record<string, number>;
  hours: number[]; weekdays: number[]; video: number; clinic: number; newPatients: number; returning: number;
  noShowRate: number | null; cancelRate: number | null; leadDays: number | null; ratings: { month: string; avg: number; count: number }[];
}
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function PracticeAnalytics() {
  const { data, isLoading } = useQuery({ queryKey: ["find", "analytics"], queryFn: () => findApi<Analytics>("/practice/analytics"), retry: false });
  if (isLoading) return <section className="fd-box"><div className="fd-card sk" style={{ height: 160 }} /></section>;
  if (!data) return null;
  const total = data.weeks.reduce((s, w) => s + w.booked, 0);
  const maxW = Math.max(1, ...data.weeks.map((w) => w.booked));
  const hrs = data.hours.map((n, h) => ({ h, n })).filter((x) => x.n > 0);
  const maxH = Math.max(1, ...data.hours);
  const maxD = Math.max(1, ...data.weekdays);
  const seen = data.newPatients + data.returning;
  return (
    <section className="fd-box fd-an" data-find="analytics">
      <h2><BarChart3 size={18} /> Your practice, last 12 weeks</h2>
      {!total ? <p className="mu">Your charts appear here once patients start booking.</p> : <>
        <div className="fd-an-kpis">
          <div><b data-find="an-total">{total}</b><small>Bookings</small></div>
          <div><b>{data.status.completed ?? 0}</b><small>Seen</small></div>
          <div><b>{data.noShowRate === null ? "–" : `${data.noShowRate}%`}</b><small>No-shows</small></div>
          <div><b>{data.cancelRate === null ? "–" : `${data.cancelRate}%`}</b><small>Cancelled</small></div>
          <div><b>{seen ? `${Math.round((data.returning / seen) * 100)}%` : "–"}</b><small>Returning patients</small></div>
          <div><b>{data.leadDays === null ? "–" : `${data.leadDays} d`}</b><small>Booked ahead</small></div>
        </div>
        <h3>Bookings by week</h3>
        <div className="fd-an-weeks" role="img" aria-label="Bookings by week">
          {data.weeks.map((w) => (
            <span key={w.week} title={`Week of ${dateLabel(w.week, { day: "numeric", month: "short" })}: ${w.booked} booked, ${w.completed} seen, ${w.noShow} no-shows, ${w.cancelled} cancelled`}>
              <i style={{ height: `${(w.booked / maxW) * 100}%` }}><em className="c" style={{ height: `${w.booked ? (w.completed / w.booked) * 100 : 0}%` }} /></i>
              <small>{dateLabel(w.week, { day: "numeric", month: "short" })}</small>
            </span>
          ))}
        </div>
        <p className="fd-an-key"><span className="k1" /> Booked <span className="k2" /> Seen</p>
        <div className="fd-an-two">
          <div>
            <h3>Busiest hours</h3>
            <ul className="fd-an-bars">{hrs.map((x) => <li key={x.h}><span>{time12(`${String(x.h).padStart(2, "0")}:00`)}</span><i style={{ width: `${(x.n / maxH) * 100}%` }} /><em>{x.n}</em></li>)}</ul>
          </div>
          <div>
            <h3>Busiest days</h3>
            <ul className="fd-an-bars">{[1, 2, 3, 4, 5, 6, 0].map((d) => <li key={d}><span>{DAYS[d]}</span><i style={{ width: `${(data.weekdays[d]! / maxD) * 100}%` }} /><em>{data.weekdays[d]}</em></li>)}</ul>
          </div>
        </div>
        <div className="fd-an-two">
          <div><h3>New and returning</h3><div className="fd-an-split"><i style={{ width: `${seen ? (data.newPatients / seen) * 100 : 0}%` }} /></div><p className="mu">{data.newPatients} new · {data.returning} returning</p></div>
          <div><h3>Clinic and video</h3><div className="fd-an-split v"><i style={{ width: `${data.clinic + data.video ? (data.clinic / (data.clinic + data.video)) * 100 : 0}%` }} /></div><p className="mu">{data.clinic} in clinic · {data.video} video</p></div>
        </div>
      </>}
      {data.ratings.length > 0 && <>
        <h3>Patient rating by month</h3>
        <ul className="fd-an-bars">{data.ratings.map((r) => <li key={r.month}><span>{new Date(`${r.month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" })}</span><i style={{ width: `${(r.avg / 5) * 100}%` }} className="r" /><em>{r.avg.toFixed(1)} ({r.count})</em></li>)}</ul>
      </>}
    </section>
  );
}
