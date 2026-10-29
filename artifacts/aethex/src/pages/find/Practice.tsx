/** /practice: the doctor's dashboard: today's and upcoming appointments, confirm, complete, video links. */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, Check, CheckCheck, Eye, LayoutDashboard, Pause, Pencil, Phone, Play, Star, UserX, Video, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { addDays, dateLabel, displayName, findApi, signInHere, time12, usePractice, type Appointment, type FindError } from "@/lib/find";
import { FindNav, SignInCard } from "./FindParts";
import { STATUS_TEXT } from "./ListPractice";

const TABS = [["today", "Today"], ["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"]] as const;
const LABEL: Record<Appointment["status"], string> = { booked: "New", confirmed: "Confirmed", completed: "Completed", "no-show": "No-show", cancelled: "Cancelled" };

export default function Practice() {
  useSeo({ title: "Practice dashboard | Aethex Find", description: "Manage your Aethex Find appointments.", path: "/practice" });
  const qc = useQueryClient();
  const { data, isLoading, error } = usePractice();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("today");
  const [busy, setBusy] = useState(""), [err, setErr] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});

  const lists = useMemo(() => {
    const a = data?.appointments ?? [], today = data?.today ?? "";
    const active = (x: Appointment) => x.status !== "cancelled";
    return {
      today: a.filter((x) => x.date === today && active(x)),
      upcoming: a.filter((x) => x.date > today && active(x)),
      past: a.filter((x) => x.date < today && active(x)).reverse(),
      cancelled: a.filter((x) => !active(x)).reverse(),
    };
  }, [data]);

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusy(id); setErr("");
    try { await findApi(`/practice/appointments/${id}`, body); await qc.invalidateQueries({ queryKey: ["find", "practice"] }); }
    catch (x) { setErr((x as FindError).message); } finally { setBusy(""); }
  };
  const pause = async (status: "live" | "paused") => {
    setBusy("status"); setErr("");
    try { await findApi("/me/status", { status }); await qc.invalidateQueries({ queryKey: ["find"] }); }
    catch (x) { setErr((x as FindError).message); } finally { setBusy(""); }
  };

  const fe = error as FindError | null;
  if (isLoading) return <div className="fd-page"><FindNav /><div className="ax-wrap fd-dash"><div className="fd-card sk" style={{ height: 300 }} /></div></div>;
  if (fe?.status === 401) return <div className="fd-page"><FindNav /><div className="ax-wrap fd-narrow"><SignInCard title="Sign in to your practice dashboard" text="See and manage the appointments patients book with you." href={signInHere()} /></div></div>;
  if (fe && (fe as unknown as { noProfile?: boolean }).noProfile) return (
    <div className="fd-page"><FindNav /><div className="ax-wrap fd-narrow"><div className="fd-empty" data-find="no-profile"><b>List your practice first</b><p>Add your clinic, fees and consulting hours, and patients can book you here.</p><Link href="/list-your-practice" className="fd-btn">List your practice</Link></div></div></div>
  );
  if (fe || !data) return <div className="fd-page"><FindNav /><div className="ax-wrap fd-narrow"><div className="fd-empty"><b>Couldn't open the dashboard</b><p>{fe?.message}</p></div></div></div>;

  const d = data.doctor, rows = lists[tab];
  const week = data.appointments.filter((x) => x.status !== "cancelled" && x.date >= data.today && x.date <= addDays(data.today, 6)).length;

  return (
    <div className="fd-page" data-find="practice">
      <FindNav />
      <div className="ax-wrap fd-dash">
        <header className="fd-dash-head">
          <div>
            <h1><LayoutDashboard size={24} /> {displayName(d.name)}</h1>
            <p>{d.specialty} · {d.clinic}, {d.city}</p>
          </div>
          <div className="acts">
            <Link href={`/doctor/${d.slug}`} className="fd-btn ghost"><Eye size={15} /> View profile</Link>
            <Link href="/list-your-practice" className="fd-btn ghost"><Pencil size={15} /> Edit profile</Link>
            {d.status === "live" && <button type="button" className="fd-btn ghost" disabled={busy === "status"} onClick={() => void pause("paused")}><Pause size={15} /> Pause bookings</button>}
            {d.status === "paused" && <button type="button" className="fd-btn" disabled={busy === "status"} onClick={() => void pause("live")}><Play size={15} /> Take bookings again</button>}
          </div>
        </header>
        <div className={`fd-status ${d.status}`}><b>{STATUS_TEXT[d.status][0]}</b><span>{STATUS_TEXT[d.status][1]}</span>{d.adminNote && <em>Note from Aethex: {d.adminNote}</em>}</div>
        <div className="fd-stats">
          <div><CalendarCheck size={20} /><b>{lists.today.length}</b><small>Today</small></div>
          <div><CalendarDays size={20} /><b>{week}</b><small>Next 7 days</small></div>
          <div><Check size={20} /><b>{data.appointments.filter((x) => x.status === "booked").length}</b><small>Waiting to confirm</small></div>
          <div><Star size={20} /><b>{data.rating ? data.rating.avg.toFixed(1) : "–"}</b><small>{data.rating ? `${data.rating.count} reviews` : "No reviews yet"}</small></div>
        </div>
        {err && <p className="fd-err" role="alert">{err}</p>}
        <div className="fd-tabs" role="tablist">
          {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label} <small>{lists[id].length}</small></button>)}
        </div>
        <div className="fd-appts" data-find="practice-list">
          {!rows.length ? <p className="fd-none">No appointments here.</p> : rows.map((a) => (
            <article key={a.id} className={`fd-appt ${a.status}`} data-appt={a.id}>
              <div className="when"><b>{time12(a.time)}</b><small>{dateLabel(a.date)}</small></div>
              <div className="who">
                <b>{a.patient.name}{a.patient.age != null ? `, ${a.patient.age} y` : ""}</b>
                <span><Phone size={13} /> <a href={`tel:+91${a.patient.phone}`}>{a.patient.phone}</a>{a.patient.email ? ` · ${a.patient.email}` : ""}</span>
                {a.reason && <span className="mu">{a.reason}</span>}
                {a.mode === "video" && (
                  <span className="vid"><Video size={13} /> Video consult{a.link ? <> · <a href={a.link} target="_blank" rel="noopener noreferrer">meeting link</a></> : ""}</span>
                )}
                {a.note && <span className="mu">{a.note}</span>}
              </div>
              <div className="st"><span className={`pill ${a.status}`}>{LABEL[a.status]}</span></div>
              <div className="do">
                {a.mode === "video" && ["booked", "confirmed"].includes(a.status) && (
                  <input className="lnk" placeholder="https:// meeting link" value={links[a.id] ?? a.link ?? ""} onChange={(e) => setLinks({ ...links, [a.id]: e.target.value })} aria-label="Video meeting link" />
                )}
                {a.status === "booked" && <button type="button" className="fd-btn sm" disabled={busy === a.id} onClick={() => void act(a.id, { status: "confirmed", ...(links[a.id] !== undefined ? { link: links[a.id] } : {}) })}><Check size={14} /> Confirm</button>}
                {a.status === "confirmed" && links[a.id] !== undefined && links[a.id] !== (a.link ?? "") && <button type="button" className="fd-btn sm ghost" disabled={busy === a.id} onClick={() => void act(a.id, { link: links[a.id] })}>Save link</button>}
                {["booked", "confirmed"].includes(a.status) && a.date <= data.today && <button type="button" className="fd-btn sm ghost" disabled={busy === a.id} onClick={() => void act(a.id, { status: "completed" })}><CheckCheck size={14} /> Completed</button>}
                {["booked", "confirmed"].includes(a.status) && a.date <= data.today && <button type="button" className="fd-btn sm ghost" disabled={busy === a.id} onClick={() => void act(a.id, { status: "no-show" })}><UserX size={14} /> No-show</button>}
                {["booked", "confirmed"].includes(a.status) && <button type="button" className="fd-btn sm danger" disabled={busy === a.id} onClick={() => { if (window.confirm(`Cancel ${a.patient.name}'s appointment?`)) void act(a.id, { status: "cancelled", note: "Cancelled by the doctor" }); }}><X size={14} /> Cancel</button>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
