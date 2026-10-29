/** /articles, /articles/:slug and /practice/write: health articles written by checked doctors. */
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useParams, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Clock, Newspaper, PenLine, Search, ShieldAlert } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { SPECIALTIES, ago, displayName, findApi, signInHere, useArticle, useArticles, useMyProfile, type FindError } from "@/lib/find";
import { Avatar, FindNav } from "./FindParts";

/** Plain text to paragraphs: "## " starts a heading, "- " a bullet. */
function Body({ text }: { text: string }) {
  const out: ReactNode[] = [];
  text.split(/\n{2,}/).forEach((block, i) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) out.push(<ul key={i}>{lines.map((l, j) => <li key={j}>{l.replace(/^\s*[-•]\s+/, "")}</li>)}</ul>);
    else if (/^##\s+/.test(block)) out.push(<h2 key={i}>{block.replace(/^##\s+/, "")}</h2>);
    else out.push(<p key={i}>{block}</p>);
  });
  return <div className="fd-prose">{out}</div>;
}

export function ArticlesPage() {
  useSeo({ title: "Health articles by doctors | Aethex Doctors", description: "Health articles written by doctors whose registration has been checked, by specialty.", path: "/articles" });
  const [specialty, setSpecialty] = useState(""), [q, setQ] = useState(""), [qIn, setQIn] = useState("");
  const { data, isLoading, error } = useArticles(specialty, q);
  const { data: me } = useMyProfile();
  return (
    <div className="fd-page" data-find="articles">
      <FindNav />
      <div className="ax-wrap fd-narrow wide">
        <header className="fd-pagehead"><h1><Newspaper size={26} /> Health articles</h1><p>Written by doctors whose registration we've checked.{me?.doctor?.status === "live" ? <> <Link href="/practice/write">Write an article</Link></> : null}</p></header>
        <div className="fd-askbar">
          <form className="fd-mini" onSubmit={(e) => { e.preventDefault(); setQ(qIn.trim()); }}><Search size={15} /><input value={qIn} onChange={(e) => setQIn(e.target.value)} placeholder="Search articles" aria-label="Search articles" /></form>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} aria-label="Specialty"><option value="">All specialties</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        {isLoading ? <div className="fd-card sk" />
          : error ? <div className="fd-empty"><b>Couldn't load articles</b><p>{(error as Error).message}</p></div>
          : !data?.articles.length ? <div className="fd-empty" data-find="no-articles"><b>No articles yet</b><p>Doctors on Aethex publish articles here. Check back soon.</p></div>
          : <div className="fd-arts">{data.articles.map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="fd-art" data-article={a.slug}>
              <small className="fd-kick">{a.specialty}</small>
              <b>{a.title}</b>
              {a.summary && <p>{a.summary}</p>}
              <span className="by"><Avatar name={a.doctor.name} size={30} /> {displayName(a.doctor.name)} · {ago(a.at)} · <Clock size={12} /> {a.minutes} min</span>
            </Link>
          ))}</div>}
      </div>
    </div>
  );
}

export function ArticlePage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useArticle(slug);
  const a = data?.article;
  useSeo({ title: a ? `${a.title} | Aethex Doctors` : "Article | Aethex Doctors", description: a ? (a.summary || a.body.slice(0, 150)) : "A health article.", path: `/articles/${slug}`, type: "article" });
  return (
    <div className="fd-page" data-find="article">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <Link href="/articles" className="fd-back"><ArrowLeft size={15} /> All articles</Link>
        {isLoading ? <div className="fd-card sk" />
          : error || !a ? <div className="fd-empty"><b>Article not found</b><Link href="/articles" className="fd-btn">See articles</Link></div>
          : <article className="fd-box fd-article">
            <small className="fd-kick">{a.specialty} · {a.minutes} min read</small>
            <h1>{a.title}</h1>
            {a.summary && <p className="lead">{a.summary}</p>}
            <Link href={`/doctor/${a.doctor.slug}`} className="who"><Avatar name={a.doctor.name} size={44} /><span><b>{displayName(a.doctor.name)}</b><small>{a.doctor.qualifications} · {a.doctor.experience} years</small><small className="ok"><BadgeCheck size={12} /> Registration checked · {new Date(a.at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</small></span></Link>
            <Body text={a.body} />
            <p className="fd-note warn"><ShieldAlert size={16} /> General information, not personal medical advice. <Link href={`/doctor/${a.doctor.slug}`}>Book {displayName(a.doctor.name)}</Link> or <Link href="/ask">ask a doctor</Link>.</p>
          </article>}
      </div>
    </div>
  );
}

export function WriteArticle() {
  useSeo({ title: "Write an article | Aethex Doctors", description: "Publish a health article on Aethex Doctors.", path: "/practice/write" });
  const qc = useQueryClient();
  const [, go] = useLocation();
  const edit = new URLSearchParams(useSearch()).get("edit") || "";
  const { data: me, isLoading, error } = useMyProfile();
  const { data: existing } = useArticle(edit, !!edit);
  const [f, setF] = useState({ title: "", summary: "", body: "", specialty: "" });
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  useEffect(() => { if (edit && existing?.article) setF({ title: existing.article.title, summary: existing.article.summary ?? "", body: existing.article.body, specialty: existing.article.specialty }); }, [edit, existing]);
  useEffect(() => { if (me?.doctor && !f.specialty) setF((x) => ({ ...x, specialty: me.doctor!.specialty })); }, [me, f.specialty]);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await findApi<{ slug: string }>("/articles", { ...f, slug: edit || undefined }); await qc.invalidateQueries({ queryKey: ["find"] }); go(`/articles/${r.slug}`); }
    catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };
  const fe = error as FindError | null;
  return (
    <div className="fd-page" data-find="write">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <header className="fd-pagehead"><h1><PenLine size={26} /> {edit ? "Edit your article" : "Write a health article"}</h1><p>Articles appear on your profile and in Health articles. Write for patients: plain words, short paragraphs.</p></header>
        {isLoading ? <div className="fd-card sk" />
          : fe?.status === 401 ? <div className="fd-empty"><b>Sign in to write</b><a className="fd-btn" href={signInHere()}>Sign in</a></div>
          : me?.doctor?.status !== "live" ? <div className="fd-empty"><b>Only approved doctors can publish</b><p>Once your profile is approved, you can write articles here.</p><Link href="/list-your-practice" className="fd-btn">Your profile</Link></div>
          : <form className="fd-pform" onSubmit={save}>
            <fieldset>
              <label>Title<input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={140} placeholder="e.g. Fever in children: when to worry" /></label>
              <div className="two">
                <label>Specialty<select value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })}>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label>One-line summary<input value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} maxLength={300} /></label>
              </div>
              <label>Article<textarea required rows={16} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder={"Start a heading with ## and a bullet with - . Leave a blank line between paragraphs."} /></label>
              <p className="tiny">{f.body.length.toLocaleString("en-IN")} characters (at least 300)</p>
            </fieldset>
            {err && <p className="fd-err">{err}</p>}
            <div className="fd-pform-foot"><Link href="/practice" className="fd-btn ghost">Cancel</Link><button type="submit" className="fd-btn lg" disabled={busy}>{busy ? "Publishing…" : edit ? "Save changes" : "Publish"}</button></div>
          </form>}
      </div>
    </div>
  );
}
