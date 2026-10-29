/**
 * /ask and /ask/:id: Ask a doctor. Patients post a health question (shown publicly without their name);
 * doctors whose profile has been checked answer; readers mark answers helpful.
 */
import { useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, CheckCircle2, MessageCircleQuestionMark, Search, ShieldAlert, ThumbsUp } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { SPECIALTIES, ago, displayName, findApi, signInHere, useMyProfile, useQuestion, useQuestions, type FindError } from "@/lib/find";
import { Avatar, FindNav } from "./FindParts";

export function AskPage() {
  useSeo({ title: "Ask a doctor free: health questions answered by checked doctors | Aethex Doctors", description: "Ask a health question and get answers from doctors whose registration has been checked. Browse answered questions by specialty.", path: "/ask" });
  const qc = useQueryClient();
  const [, go] = useLocation();
  const { user } = useUserAuth();
  const [specialty, setSpecialty] = useState(""), [q, setQ] = useState(""), [qIn, setQIn] = useState(""), [tab, setTab] = useState<"all" | "mine">("all");
  const { data, isLoading, error } = useQuestions({ specialty, q, mine: tab === "mine" });
  const [f, setF] = useState({ specialty: "General Physician", title: "", body: "", age: "", gender: "" });
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [open, setOpen] = useState(false);

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await findApi<{ id: string }>("/questions", f);
      await qc.invalidateQueries({ queryKey: ["find", "questions"] });
      go(`/ask/${r.id}`);
    } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };

  return (
    <div className="fd-page" data-find="ask">
      <FindNav />
      <section className="fd-hero sm">
        <div className="ax-wrap">
          <h1>Ask a doctor. Free.</h1>
          <p className="sub">Post your health question. Doctors whose registration we've checked answer it, usually within a day. Your name is never shown.</p>
          <button type="button" className="fd-btn white lg" onClick={() => setOpen(true)} data-find="ask-open"><MessageCircleQuestionMark size={18} /> Ask a question</button>
        </div>
      </section>
      <div className="ax-wrap fd-narrow wide">
        {open && (
          <section className="fd-box fd-askform" data-find="ask-form">
            <h2>Your question</h2>
            {!user ? <div className="fd-form"><p className="mu">Sign in to ask, so we can tell you when a doctor answers.</p><a className="fd-btn" href={signInHere()}>Sign in to ask</a></div> : (
              <form className="fd-pform" onSubmit={ask}>
                <div className="two">
                  <label>Kind of doctor<select value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })}>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></label>
                  <div className="two"><label>Age<input inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value.replace(/\D/g, "") })} /></label>
                    <label>Gender<select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label></div>
                </div>
                <label>Your question<input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Is a dry cough for 3 weeks after a cold normal?" maxLength={140} /></label>
                <label>Details<textarea required rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Symptoms, how long, medicines you take, tests done. Don't include your name, phone or email." /></label>
                <p className="fd-note warn"><ShieldAlert size={16} /> Not for emergencies. If it's urgent, call 112 or go to the nearest hospital. Answers are general advice, not a diagnosis.</p>
                {err && <p className="fd-err" role="alert">{err}</p>}
                <div className="fd-pform-foot"><button type="button" className="fd-btn ghost" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="fd-btn" disabled={busy}>{busy ? "Posting…" : "Post question"}</button></div>
              </form>
            )}
          </section>
        )}
        <div className="fd-askbar">
          <div className="fd-tabs">
            <button type="button" className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All questions</button>
            <button type="button" className={tab === "mine" ? "on" : ""} onClick={() => setTab("mine")}>My questions</button>
          </div>
          <form className="fd-mini" onSubmit={(e) => { e.preventDefault(); setQ(qIn.trim()); }}><Search size={15} /><input value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder="Search questions" aria-label="Search questions" /></form>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} aria-label="Specialty"><option value="">All specialties</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        {isLoading ? <div className="fd-card sk" />
          : (error as FindError | null)?.status === 401 ? <div className="fd-empty"><b>Sign in to see your questions</b><a className="fd-btn" href={signInHere()}>Sign in</a></div>
          : error ? <div className="fd-empty"><b>Couldn't load questions</b><p>{(error as Error).message}</p></div>
          : !data?.questions.length ? <div className="fd-empty" data-find="no-questions"><b>No questions yet</b><p>Be the first to ask. A checked doctor will answer.</p><button type="button" className="fd-btn" onClick={() => setOpen(true)}>Ask a question</button></div>
          : <div className="fd-qlist">{data.questions.map((x) => (
            <Link key={x.id} href={`/ask/${x.id}`} className="fd-q" data-question={x.id}>
              <span className={`pill ${x.status === "answered" ? "completed" : "booked"}`}>{x.status === "answered" ? `${x.answers} answer${x.answers === 1 ? "" : "s"}` : "Waiting for a doctor"}</span>
              <b>{x.title}</b>
              <p>{x.body}</p>
              <small>{x.specialty} · {ago(x.at)}</small>
            </Link>
          ))}</div>}
      </div>
    </div>
  );
}

export function QuestionPage() {
  const { id = "" } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuestion(id);
  const { data: me } = useMyProfile();
  const [text, setText] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const q = data?.question;
  useSeo({ title: q ? `${q.title} | Ask a doctor | Aethex Doctors` : "Ask a doctor | Aethex Doctors", description: q ? q.body.slice(0, 150) : "A health question answered by doctors.", path: `/ask/${id}` });
  const canAnswer = me?.doctor?.status === "live";
  const answer = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await findApi(`/questions/${id}/answers`, { body: text }); setText(""); await qc.invalidateQueries({ queryKey: ["find"] }); }
    catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };
  const helpful = async (aid: string) => { try { await findApi(`/answers/${aid}/helpful`, {}); await qc.invalidateQueries({ queryKey: ["find", "question", id] }); } catch (x) { if ((x as FindError).status === 401) window.location.href = signInHere(); } };
  return (
    <div className="fd-page" data-find="question">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <Link href="/ask" className="fd-back"><ArrowLeft size={15} /> All questions</Link>
        {isLoading ? <div className="fd-card sk" />
          : error || !q ? <div className="fd-empty"><b>Question not found</b><Link href="/ask" className="fd-btn">See questions</Link></div>
          : <>
            <section className="fd-box">
              <small className="fd-kick">{q.specialty} · {ago(q.at)}{q.age != null ? ` · ${q.age} y` : ""}{q.gender ? ` · ${q.gender}` : ""}</small>
              <h1 className="fd-qtitle">{q.title}</h1>
              <p className="about">{q.body}</p>
            </section>
            <h2 className="fd-h2">{data.answers.length ? `${data.answers.length} doctor${data.answers.length === 1 ? "" : "s"} answered` : "Waiting for a doctor to answer"}</h2>
            {data.answers.map((a) => (
              <article key={a.id} className="fd-box fd-answer" data-answer={a.id}>
                <Link href={`/doctor/${a.doctor.slug}`} className="who"><Avatar name={a.doctor.name} size={46} /><span><b>{displayName(a.doctor.name)}</b><small>{a.doctor.specialty} · {a.doctor.experience} years · {a.doctor.city}</small><small className="ok"><BadgeCheck size={12} /> Registration checked</small></span></Link>
                <p className="about">{a.body}</p>
                <div className="foot"><small>{ago(a.at)}</small><button type="button" className="fd-btn sm ghost" onClick={() => void helpful(a.id)}><ThumbsUp size={14} /> Helpful{a.helpful ? ` (${a.helpful})` : ""}</button></div>
              </article>
            ))}
            {canAnswer && (
              <form className="fd-box fd-pform" onSubmit={answer} data-find="answer-form">
                <h2>Your answer, {displayName(me!.doctor!.name)}</h2>
                <label>Answer<textarea required rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Explain likely causes, what to do now, and when to see a doctor in person." /></label>
                {err && <p className="fd-err">{err}</p>}
                <div className="fd-pform-foot"><span className="tiny"><CheckCircle2 size={14} /> Shown with your name and specialty.</span><button type="submit" className="fd-btn" disabled={busy}>{busy ? "Posting…" : "Post answer"}</button></div>
              </form>
            )}
            <p className="fd-note warn"><ShieldAlert size={16} /> Answers are general information from doctors and not a diagnosis. For an exam and treatment, <Link href="/doctors">book a doctor</Link>.</p>
          </>}
      </div>
    </div>
  );
}
