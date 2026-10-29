/** /practice: the doctor's dashboard: today's and upcoming appointments, confirm, complete, video links. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarCheck, CalendarDays, CalendarX2, Check, CheckCheck, Eye, FileText, LayoutDashboard, MessageCircleQuestionMark, Newspaper, Pause, PenLine, Pencil, Phone, Play, Plus, Printer, Reply, Star, Trash2, Users, UserX, Video, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { addDays, ago, dateLabel, displayName, findApi, signInHere, time12, usePractice, type Appointment, type FindError, type RxItem } from "@/lib/find";
import { FindNav, SignInCard } from "./FindParts";
import { STATUS_TEXT } from "./ListPractice";

const TABS = [["today", "Today"], ["upcoming", "Upcoming"], ["past", "Past"], ["cancelled", "Cancelled"]] as const;
const LABEL: Record<Appointment["status"], string> = { booked: "New", confirmed: "Confirmed", completed: "Completed", "no-show": "No-show", cancelled: "Cancelled" };

/** The prescription for one visit: diagnosis, medicines, tests, advice and follow-up. Saving marks the visit completed. */
function RxEditor({ id, onDone }: { id: string; onDone: () => void }) {
  const blank: RxItem = { name: "", dose: "", frequency: "", duration: "", notes: "" };
  const [f, setF] = useState({ diagnosis: "", tests: "", advice: "", followUp: "" }), [items, setItems] = useState<RxItem[]>([{ ...blank }]);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  useEffect(() => {
    void findApi<{ prescription: { diagnosis: string | null; advice: string | null; tests: string | null; followUp: string | null; items: RxItem[] } | null }>(`/practice/appointments/${id}/prescription`).then((r) => {
      if (r.prescription) { const p = r.prescription; setF({ diagnosis: p.diagnosis ?? "", tests: p.tests ?? "", advice: p.advice ?? "", followUp: p.followUp ?? "" }); setItems(p.items.length ? p.items : [{ ...blank }]); }
    }).catch(() => undefined);
  }, [id]);
  const setItem = (i: number, k: keyof RxItem, v: string) => setItems(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="fd-rxedit" data-find="rx-editor">
      <label>Diagnosis<input value={f.diagnosis} onChange={(e) => setF({ ...f, diagnosis: e.target.value })} placeholder="e.g. Acute viral upper respiratory infection" /></label>
      <div className="fd-rxrows">
        <div className="hd"><span>Medicine</span><span>Dose</span><span>How often</span><span>For</span><span>Notes</span><span /></div>
        {items.map((it, i) => (
          <div key={i} className="row">
            <input aria-label="Medicine" value={it.name} onChange={(e) => setItem(i, "name", e.target.value)} placeholder="Tab Paracetamol 500 mg" />
            <input aria-label="Dose" value={it.dose} onChange={(e) => setItem(i, "dose", e.target.value)} placeholder="1 tablet" />
            <input aria-label="How often" value={it.frequency} onChange={(e) => setItem(i, "frequency", e.target.value)} placeholder="1-0-1 after food" />
            <input aria-label="For" value={it.duration} onChange={(e) => setItem(i, "duration", e.target.value)} placeholder="5 days" />
            <input aria-label="Notes" value={it.notes} onChange={(e) => setItem(i, "notes", e.target.value)} placeholder="If fever > 100°F" />
            <button type="button" className="fd-icon" onClick={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : [{ ...blank }])} aria-label="Remove medicine"><Trash2 size={14} /></button>
          </div>
        ))}
        {items.length < 20 && <button type="button" className="fd-link" onClick={() => setItems([...items, { ...blank }])}><Plus size={14} /> Add medicine</button>}
      </div>
      <div className="two">
        <label>Tests<input value={f.tests} onChange={(e) => setF({ ...f, tests: e.target.value })} placeholder="CBC, CRP" /></label>
        <label>Follow-up<input type="date" value={f.followUp} onChange={(e) => setF({ ...f, followUp: e.target.value })} /></label>
      </div>
      <label>Advice<textarea rows={2} value={f.advice} onChange={(e) => setF({ ...f, advice: e.target.value })} placeholder="Fluids, rest; come back if breathless or fever beyond 3 days." /></label>
      {err && <p className="fd-err">{err}</p>}
      <div className="row-end"><button type="button" className="fd-btn sm" disabled={busy} onClick={async () => {
        setBusy(true); setErr("");
        try { await findApi(`/practice/appointments/${id}/prescription`, { ...f, items: items.filter((x) => x.name.trim()) }); onDone(); } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
      }}><FileText size={14} /> {busy ? "Saving…" : "Save and send to the patient"}</button></div>
    </div>
  );
}

/** Leave days: no bookings can be made on them. */
function TimeOff({ off, onSaved }: { off: string[]; onSaved: () => void }) {
  const [dates, setDates] = useState<string[]>(off), [pick, setPick] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => setDates(off), [off.join()]);
  const save = async (next: string[]) => {
    setBusy(true); setMsg("");
    try { const r = await findApi<{ dates: string[]; clashes: number }>("/me/timeoff", { dates: next }); setDates(r.dates); setMsg(r.clashes ? `${r.clashes} booking${r.clashes === 1 ? "" : "s"} already on these days: cancel or keep them below.` : "Saved."); onSaved(); }
    catch (x) { setMsg((x as FindError).message); } finally { setBusy(false); }
  };
  return (
    <section className="fd-box" data-find="timeoff">
      <h2><CalendarX2 size={18} /> Leave days</h2>
      <p className="mu">Patients can't book these days.</p>
      <div className="fd-chips">{dates.length ? dates.map((x) => <span key={x}>{dateLabel(x)} <button type="button" onClick={() => void save(dates.filter((y) => y !== x))} aria-label={`Remove ${x}`}>×</button></span>) : <span className="none">No leave planned</span>}</div>
      <div className="fd-replyform"><input type="date" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Leave date" /><button type="button" className="fd-btn sm" disabled={!pick || busy} onClick={() => { void save([...dates, pick]); setPick(""); }}><Plus size={14} /> Add</button></div>
      {msg && <p className="tiny">{msg}</p>}
    </section>
  );
}

export default function Practice() {
  useSeo({ title: "Practice dashboard | Aethex Doctors", description: "Manage your Aethex Doctors appointments.", path: "/practice" });
  const qc = useQueryClient();
  const { data, isLoading, error } = usePractice();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("today");
  const [busy, setBusy] = useState(""), [err, setErr] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [rxFor, setRxFor] = useState(""), [replies, setReplies] = useState<Record<string, string>>({});

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
          <div><Users size={20} /><b>{data.patients}</b><small>Patients seen</small></div>
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
                {a.status !== "cancelled" && a.date <= data.today && <button type="button" className="fd-btn sm ghost" onClick={() => setRxFor(rxFor === a.id ? "" : a.id)} data-rx={a.id}><FileText size={14} /> {a.prescription ? "Edit prescription" : "Write prescription"}</button>}
                {a.prescription && <Link href={`/prescription/${a.prescription}`} className="fd-btn sm ghost"><Printer size={14} /> View</Link>}
              </div>
              {rxFor === a.id && <RxEditor id={a.id} onDone={() => { setRxFor(""); void qc.invalidateQueries({ queryKey: ["find", "practice"] }); }} />}
            </article>
          ))}
        </div>

        <div className="fd-dash-grid">
          <TimeOff off={d.timeOff} onSaved={() => void qc.invalidateQueries({ queryKey: ["find"] })} />
          <section className="fd-box" data-find="open-questions">
            <h2><MessageCircleQuestionMark size={18} /> Questions for {d.specialty}s</h2>
            {data.openQuestions.length ? <ul className="fd-mini-list">{data.openQuestions.map((q) => <li key={q.id}><Link href={`/ask/${q.id}`}>{q.title}</Link><small>{ago(q.at)}</small></li>)}</ul> : <p className="mu">No questions waiting for you.</p>}
            <Link href="/ask" className="fd-link">All questions <ArrowRight size={14} /></Link>
          </section>
          <section className="fd-box" data-find="my-articles">
            <h2><Newspaper size={18} /> Your articles</h2>
            {data.articles.length ? <ul className="fd-mini-list">{data.articles.map((x) => <li key={x.slug}><Link href={`/articles/${x.slug}`}>{x.title}</Link><Link href={`/practice/write?edit=${x.slug}`} className="fd-link">Edit</Link></li>)}</ul> : <p className="mu">Share what you tell patients every day.</p>}
            {d.status === "live" ? <Link href="/practice/write" className="fd-btn sm"><PenLine size={14} /> Write an article</Link> : <p className="tiny">You can publish once your profile is approved.</p>}
          </section>
        </div>

        <section className="fd-box" data-find="practice-reviews">
          <h2><Star size={18} /> Patient stories</h2>
          {!data.reviews.length ? <p className="mu">Patients can share a story after you mark their visit completed.</p> : data.reviews.map((r) => (
            <div key={r.id} className="fd-review">
              <div className="top"><b>{r.name}</b> · {r.rating}★{r.recommend != null && <span className={`pill ${r.recommend ? "completed" : "cancelled"}`}>{r.recommend ? "Recommends" : "Doesn't recommend"}</span>}</div>
              <p>{r.text || "No comment."}</p>
              {r.reply ? <div className="fd-reply"><b>Your reply</b><p>{r.reply}</p></div>
                : <div className="fd-replyform"><input placeholder="Reply publicly (optional)" value={replies[r.id!] ?? ""} onChange={(e) => setReplies({ ...replies, [r.id!]: e.target.value })} /><button type="button" className="fd-btn sm" disabled={!(replies[r.id!] ?? "").trim()} onClick={async () => { try { await findApi(`/practice/reviews/${r.id}`, { reply: replies[r.id!] }); void qc.invalidateQueries({ queryKey: ["find"] }); } catch (x) { setErr((x as FindError).message); } }}><Reply size={14} /> Reply</button></div>}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
