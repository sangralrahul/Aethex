/** /doctor/:slug: the doctor's profile and the booking panel (clinic visit or video consult). */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Award, BadgeCheck, Building2, CalendarCheck, CalendarX2, CheckCircle2, Clock, GraduationCap, Languages, MapPin, ShieldAlert, ThumbsUp, Users, Video } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { formatINR } from "@/lib/utils";
import { addDays, clinicKey, dateLabel, displayName, findApi, freeSlots, hoursText, signInHere, time12, useDoctor, useFamily, type Appointment, type FindError } from "@/lib/find";
import { CalendarButtons, CompareBar, MemberForm, SaveCompare } from "./DoctorTools";
import { Avatar, FindNav, Stars } from "./FindParts";

export default function DoctorPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const search = useSearch();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useDoctor(slug);
  const { user } = useUserAuth();
  const d = data?.doctor;
  useSeo({ title: d ? `${displayName(d.name)}, ${d.specialty} in ${d.city}: book an appointment | Aethex Doctors` : "Doctor | Aethex Doctors", description: d ? `${displayName(d.name)}, ${d.qualifications}. ${d.experience} years experience. ${d.clinic}, ${d.city}. Book online on Aethex Doctors.` : "Book a doctor on Aethex Doctors.", path: `/doctor/${slug}` });

  const [tab, setTab] = useState<"info" | "stories" | "consult" | "articles">("info");
  const [mode, setMode] = useState<"clinic" | "video">(new URLSearchParams(search).get("mode") === "video" ? "video" : "clinic");
  const [date, setDate] = useState(""), [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", age: "", reason: "" });
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState<Appointment | null>(null);
  useEffect(() => { if (user) setForm((f) => ({ ...f, name: f.name || user.name || "", email: f.email || user.email || "" })); }, [user]);
  // update 75: who the appointment is for
  const fam = useFamily(!!user);
  const [who, setWho] = useState(""), [adding, setAdding] = useState(false);
  const pickWho = (id: string) => {
    setWho(id); setAdding(false);
    const m = fam.data?.members.find((x) => x.id === id);
    setForm((f) => (m ? { ...f, name: m.name, age: m.age == null ? "" : String(m.age), phone: m.phone ?? f.phone } : { ...f, name: user?.name || "", age: "" }));
  };

  const days = useMemo(() => {
    if (!data?.doctor.hours) return [];
    const taken = new Set(data.taken);
    return Array.from({ length: 14 }, (_, i) => addDays(data.today, i)).map((day) => ({ day, slots: freeSlots(data.doctor.hours!, day, taken, data.today, data.now, data.doctor.timeOff) }));
  }, [data]);
  useEffect(() => { if (!date && days.length) { const first = days.find((x) => x.slots.length); if (first) setDate(first.day); } }, [days, date]);
  const slots = days.find((x) => x.day === date)?.slots ?? [];
  const groups = [["Morning", (t: string) => t < "12:00"], ["Afternoon", (t: string) => t >= "12:00" && t < "17:00"], ["Evening", (t: string) => t >= "17:00"]] as const;

  const book = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !time) { setErr("Choose a date and a time."); return; }
    setBusy(true); setErr("");
    try {
      const r = await findApi<{ appointment: Appointment }>("/appointments", { slug, date, time, mode, ...form, familyId: who || undefined });
      setDone(r.appointment);
      void qc.invalidateQueries({ queryKey: ["find"] });
    } catch (x) {
      const fe = x as FindError;
      setErr(fe.message);
      if ((fe as unknown as { taken?: boolean }).taken) { setTime(""); void refetch(); }
    } finally { setBusy(false); }
  };

  if (isLoading) return <div className="fd-page"><FindNav /><div className="ax-wrap fd-prof"><div className="fd-card sk" style={{ height: 320 }} /></div></div>;
  if (error || !d) return (
    <div className="fd-page"><FindNav /><div className="ax-wrap fd-prof"><div className="fd-empty"><b>Doctor not found</b><p>This doctor isn't listed, or their profile is paused.</p><Link href="/doctors" className="fd-btn">Find other doctors</Link></div></div></div>
  );
  const fee = mode === "video" ? d.videoFee ?? d.fee : d.fee;

  return (
    <div className="fd-page" data-find="doctor">
      <FindNav />
      <div className="ax-wrap fd-prof">
        <Link href="/doctors" className="fd-back"><ArrowLeft size={15} /> All doctors</Link>
        {data.preview && <div className="fd-note warn"><ShieldAlert size={16} /> This is a preview of your profile. Patients will see it once it has been approved.</div>}
        <div className="fd-prof-grid">
          <div className="fd-prof-main">
            <section className="fd-box fd-who">
              <Avatar name={d.name} size={112} />
              <div>
                <h1>{displayName(d.name)}</h1>
                <p className="sp">{d.specialty}</p>
                <p className="mu">{d.qualifications}</p>
                <p className="mu">{d.experience} years experience overall</p>
                <SaveCompare slug={d.slug} name={d.name} />
                <div className="tags">
                  <span className="ok"><BadgeCheck size={14} /> Medical registration checked</span>
                  {d.video && <span><Video size={14} /> Video consult</span>}
                </div>
                {d.rating && <p className="rt"><Stars value={d.rating.avg} /> <b>{d.rating.avg.toFixed(1)}</b> · {d.rating.count} patient review{d.rating.count === 1 ? "" : "s"}</p>}
                <div className="fd-pstats">
                  <span><b>{d.experience}</b><small>Years of experience</small></span>
                  {data.recommendPct != null && <span><b>{data.recommendPct}%</b><small>Recommend</small></span>}
                  <span><b>{data.reviews.length}</b><small>Patient stories</small></span>
                  <span><b>{data.stats.answers}</b><small>Answers</small></span>
                </div>
              </div>
            </section>
            <div className="fd-ptabs" role="tablist">
              {([["info", "Info"], ["stories", `Patient stories (${data.reviews.length})`], ["consult", `Consult Q&A (${data.stats.answers})`], ["articles", `Articles (${data.articles.length})`]] as const).map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-tab={k}>{l}</button>
              ))}
            </div>
            {tab === "info" && <>
              {d.about && <section className="fd-box"><h2>About</h2><p className="about">{d.about}</p></section>}
              <section className="fd-box fd-facts">
                <h2>Clinic</h2>
                <p><Building2 size={17} /> <span><Link href={`/clinic/${clinicKey(d.clinic, d.city)}`}><b>{d.clinic}</b></Link><br />{d.address}{d.locality ? `, ${d.locality}` : ""}, {d.city} {d.pincode}</span></p>
                <p><Clock size={17} /> <span>{hoursText(d.hours)}</span></p>
                {d.timeOff.length > 0 && <p><CalendarX2 size={17} /> <span>On leave: {d.timeOff.slice(0, 6).map((x) => dateLabel(x)).join(", ")}</span></p>}
                <p><MapPin size={17} /> <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.clinic}, ${d.address}, ${d.city} ${d.pincode}`)}`} target="_blank" rel="noopener noreferrer">Get directions</a></p>
                {d.languages.length > 0 && <p><Languages size={17} /> <span>Speaks {d.languages.join(", ")}</span></p>}
              </section>
              {d.services.length > 0 && <section className="fd-box"><h2>Services</h2><div className="fd-chips">{d.services.map((s) => <span key={s}>{s}</span>)}</div></section>}
              {d.education.length > 0 && <section className="fd-box" data-find="education"><h2>Education</h2><ul className="fd-list">{d.education.map((e, i) => <li key={i}><GraduationCap size={16} /> <span><b>{e.degree}</b> · {e.college}{e.year ? `, ${e.year}` : ""}</span></li>)}</ul></section>}
              {d.awards.length > 0 && <section className="fd-box"><h2>Awards and recognitions</h2><ul className="fd-list">{d.awards.map((x) => <li key={x}><Award size={16} /> <span>{x}</span></li>)}</ul></section>}
              {d.memberships.length > 0 && <section className="fd-box"><h2>Memberships</h2><ul className="fd-list">{d.memberships.map((x) => <li key={x}><Users size={16} /> <span>{x}</span></li>)}</ul></section>}
              <section className="fd-box">
                <h2>Registration</h2>
                <p className="mu">{d.regCouncil} · Registration no. {d.regNo}</p>
                <p className="tiny">You can confirm it on the National Medical Commission's Indian Medical Register.</p>
              </section>
            </>}
            {tab === "stories" && (
              <section className="fd-box" data-find="reviews">
                <h2>Patient stories</h2>
                {data.recommendPct != null && <p className="fd-recpct"><ThumbsUp size={18} /> <b>{data.recommendPct}%</b> of patients who reviewed would recommend {displayName(d.name)}</p>}
                {data.reviews.length ? data.reviews.map((r, i) => (
                  <div key={i} className="fd-review">
                    <div className="top"><Stars value={r.rating} size={13} />{r.recommend != null && <span className={`pill ${r.recommend ? "completed" : "cancelled"}`}>{r.recommend ? "Recommends the doctor" : "Doesn't recommend"}</span>}</div>
                    {r.visited && <small className="mu">Visited for {r.visited}</small>}
                    <p>{r.text || "No comment."}</p>
                    {r.wait && <small className="mu"><Clock size={12} /> Waited {r.wait.toLowerCase()}</small>}
                    {r.reply && <div className="fd-reply"><b>Reply from {displayName(d.name)}</b><p>{r.reply}</p></div>}
                    <small>{r.name} · {new Date(r.at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} · Verified visit</small>
                  </div>
                )) : <p className="mu">No stories yet. Only patients whose visit was completed can share one.</p>}
              </section>
            )}
            {tab === "consult" && (
              <section className="fd-box" data-find="consult">
                <h2>Answers by {displayName(d.name)}</h2>
                {data.answers.length ? data.answers.map((a) => <Link key={a.questionId} href={`/ask/${a.questionId}`} className="fd-ans-mini"><b>{a.title}</b><p>{a.body.slice(0, 220)}{a.body.length > 220 ? "…" : ""}</p><small>{a.helpful} found it helpful</small></Link>)
                  : <p className="mu">No answers yet. <Link href="/ask">Ask a doctor</Link></p>}
              </section>
            )}
            {tab === "articles" && (
              <section className="fd-box" data-find="doc-articles">
                <h2>Articles by {displayName(d.name)}</h2>
                {data.articles.length ? data.articles.map((a) => <Link key={a.slug} href={`/articles/${a.slug}`} className="fd-ans-mini"><b>{a.title}</b>{a.summary && <p>{a.summary}</p>}</Link>)
                  : <p className="mu">No articles yet.</p>}
              </section>
            )}
          </div>

          <aside className="fd-book" id="book" data-find="book">
            {done ? (
              <div className="fd-done" data-find="booked">
                <CheckCircle2 size={44} />
                <h2>Appointment booked</h2>
                <p><b>{displayName(d.name)}</b><br />{dateLabel(done.date, { weekday: "long", day: "numeric", month: "long" })}, {time12(done.time)}<br />{done.mode === "video" ? "Video consultation" : `${d.clinic}, ${d.city}`}</p>
                <p className="mu">The doctor will confirm it, and we've emailed you the details. We'll also email a reminder the day before.</p>
                <CalendarButtons a={done} />
                <Link href="/appointments" className="fd-btn">My appointments</Link>
              </div>
            ) : (
              <form onSubmit={book}>
                <div className="fd-modes" role="tablist">
                  <button type="button" role="tab" aria-selected={mode === "clinic"} className={mode === "clinic" ? "on" : ""} onClick={() => setMode("clinic")}><Building2 size={16} /> Clinic visit<small>{d.fee ? formatINR(d.fee) : "Free"}</small></button>
                  {d.video && <button type="button" role="tab" aria-selected={mode === "video"} className={mode === "video" ? "on" : ""} onClick={() => setMode("video")}><Video size={16} /> Video consult<small>{(d.videoFee ?? d.fee) ? formatINR(d.videoFee ?? d.fee) : "Free"}</small></button>}
                </div>
                <h3><CalendarCheck size={17} /> Choose a date</h3>
                <div className="fd-days">
                  {days.map(({ day, slots: s }) => (
                    <button key={day} type="button" disabled={!s.length} className={day === date ? "on" : ""} onClick={() => { setDate(day); setTime(""); }}>
                      <b>{day === data.today ? "Today" : day === addDays(data.today, 1) ? "Tomorrow" : dateLabel(day, { weekday: "short" })}</b>
                      <span>{dateLabel(day, { day: "numeric", month: "short" })}</span>
                      <small>{s.length ? `${s.length} slots` : "No slots"}</small>
                    </button>
                  ))}
                </div>
                {date && (
                  <div className="fd-slots">
                    {!slots.length ? <p className="mu">No free slots this day.</p> : groups.map(([label, test]) => {
                      const list = slots.filter(test);
                      return list.length ? <div key={label}><h4>{label} <small>{list.length} slots</small></h4><div className="grid">{list.map((t) => <button key={t} type="button" className={t === time ? "on" : ""} onClick={() => setTime(t)}>{time12(t)}</button>)}</div></div> : null;
                    })}
                  </div>
                )}
                {time && (
                  user ? (
                    <div className="fd-form" data-find="patient">
                      <h3>Who is this appointment for?</h3>
                      <div className="fd-who-pick" role="radiogroup" aria-label="Patient" data-find="who">
                        <button type="button" role="radio" aria-checked={!who} className={!who ? "on" : ""} onClick={() => pickWho("")}>Myself</button>
                        {fam.data?.members.map((m) => <button key={m.id} type="button" role="radio" aria-checked={who === m.id} className={who === m.id ? "on" : ""} onClick={() => pickWho(m.id)}>{m.name}<small>{m.relation}</small></button>)}
                        {fam.data && fam.data.members.length < 12 && <button type="button" className="add" onClick={() => setAdding(!adding)} aria-expanded={adding}>+ Family member</button>}
                      </div>
                      {adding && fam.data && <MemberForm relations={fam.data.relations} onDone={(m) => { void fam.refetch().then(() => pickWho(m.id)); setWho(m.id); setForm((f) => ({ ...f, name: m.name, age: m.age == null ? "" : String(m.age), phone: m.phone ?? f.phone })); setAdding(false); }} onCancel={() => setAdding(false)} />}
                      <h3>Patient details</h3>
                      <label>Patient's name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
                      <div className="two">
                        <label>Mobile number<input required inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel-national" placeholder="10 digits" /></label>
                        <label>Age<input inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
                      </div>
                      <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
                      <label>Reason for visit (optional)<textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
                      <div className="sum"><span>{dateLabel(date)}, {time12(time)} · {mode === "video" ? "Video" : "Clinic"}</span><b>{fee ? formatINR(fee) : "Free"}</b></div>
                      <p className="tiny">Pay the doctor at the clinic{mode === "video" ? " or as they ask" : ""}. Not for emergencies: call 112.</p>
                      {err && <p className="fd-err" role="alert">{err}</p>}
                      <button type="submit" className="fd-btn lg full" disabled={busy}>{busy ? "Booking…" : "Confirm booking"}</button>
                    </div>
                  ) : (
                    <div className="fd-form"><p className="mu">Sign in to book {dateLabel(date)}, {time12(time)}. It takes a minute, and your bookings stay in one place.</p><a className="fd-btn lg full" href={signInHere()}>Sign in to book</a></div>
                  )
                )}
                {err && !time && <p className="fd-err" role="alert">{err}</p>}
              </form>
            )}
          </aside>
        </div>
      </div>
      <CompareBar />
    </div>
  );
}
