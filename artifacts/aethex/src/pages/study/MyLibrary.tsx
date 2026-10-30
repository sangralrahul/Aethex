/**
 * Update 77: /my-library, the student's own corner of Aethex Study.
 * - Progress: today's goal and the streak, the daily goal setting, six months of study as a heat-map, accuracy by
 *   subject from every answered question.
 * - Revision: every question answered wrong, to retake until it is right (then it leaves the deck).
 * - Bookmarks and notes: saved questions, topics, conditions and subjects, each with the student's own note.
 * Kept in this browser, and in the account when signed in. Styles: src/shop.css (.st-*).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Bookmark, BookOpen, Cloud, CloudOff, Library, NotebookPen, RotateCcw, Search, Trash2, TrendingUp } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { PageHero } from "@/components/PageHero";
import { loginUrl } from "@/lib/host";
import { bySubject, liveBookmarks, openWrong, study, useStudy, type Bookmark as BM } from "@/lib/study/progress";
import { BookmarkButton, GoalPicker, Heatmap, NoteButton, Report, Runner, TodayCard, useStudySync, type RunResult } from "@/components/study/StudyBits";

type Tab = "progress" | "revision" | "bookmarks";

function Progress() {
  const s = useStudy();
  const subs = useMemo(() => bySubject(s), [s]);
  const total = s.attempts.length, right = s.attempts.filter((a) => a.correct).length;
  return (
    <div className="st-prog" data-study="progress">
      <TodayCard />
      <section className="st-card">
        <div className="st-row"><h2>Your study days</h2><GoalPicker /></div>
        <Heatmap s={s} />
      </section>
      <section className="st-card">
        <h2>Accuracy by subject <small>{total ? `${right} of ${total} answers right (${Math.round((right / total) * 100)}%)` : "Answer some questions to see this"}</small></h2>
        {subs.length ? <ul className="st-acc">{subs.map((x) => (
          <li key={x.subject} data-subject={x.subject}><span>{x.subject}</span><span className="b"><i style={{ width: `${x.pct}%` }} className={x.pct >= 70 ? "good" : x.pct >= 50 ? "mid" : "low"} /></span><em>{x.pct}%</em><small>{x.correct}/{x.attempted}</small></li>
        ))}</ul> : <p className="mu">Practise on <Link href="/neet-pg">NEET-PG</Link>, take a <Link href="/custom-test">custom test</Link> or try a topic quiz in the <Link href="/study-hub/medical-knowledge-hub">Knowledge Hub</Link>.</p>}
        {subs.some((x) => x.pct < 60 && x.attempted >= 3) && <p className="weak">Weakest: <b>{subs.filter((x) => x.pct < 60 && x.attempted >= 3).map((x) => x.subject).join(", ")}</b>. <Link href="/custom-test">Build a test on them</Link>.</p>}
      </section>
    </div>
  );
}

function Revision() {
  const s = useStudy();
  const deck = useMemo(() => openWrong(s), [s]);
  const mastered = Object.values(s.wrong).filter((w) => w.mastered).length;
  const [run, setRun] = useState<ReturnType<typeof openWrong> | null>(null);
  const [res, setRes] = useState<RunResult | null>(null);
  if (res) return <Report r={res} onAgain={() => { setRes(null); setRun(null); }} again="Back to the deck" />;
  if (run) return <Runner questions={run.map((w) => w.q)} mode="revision" title="Revision" onDone={setRes} onQuit={() => setRun(null)} />;
  return (
    <div data-study="revision">
      <section className="st-card st-rev-head">
        <div><h2>{deck.length} question{deck.length === 1 ? "" : "s"} to revise</h2><p className="mu">Every question you answer wrong comes here. Get it right in revision and it leaves the deck.{mastered ? ` ${mastered} mastered so far.` : ""}</p></div>
        <div className="acts">
          {deck.length > 0 && <button type="button" className="st-btn" onClick={() => setRun(deck.slice(0, 20))} data-study="revise">Revise {Math.min(20, deck.length)} now</button>}
          {mastered > 0 && <button type="button" className="st-btn ghost" onClick={() => study.clearMastered()}>Clear mastered</button>}
        </div>
      </section>
      {deck.length ? <ul className="st-list">{deck.map((w) => (
        <li key={w.q.key} data-wrong={w.q.key}>
          <div><small>{w.q.subject}{w.q.topic ? ` · ${w.q.topic}` : ""} · wrong {w.tries}×</small><b>{w.q.question}</b></div>
          <BookmarkButton item={{ key: w.q.key, kind: "question", title: w.q.question.slice(0, 140), subject: w.q.subject, q: w.q }} label={false} />
        </li>
      ))}</ul> : <div className="st-empty"><RotateCcw size={26} /><b>Nothing to revise</b><p>Questions you get wrong will appear here.</p><Link href="/custom-test" className="st-btn">Take a test</Link></div>}
    </div>
  );
}

function Bookmarks() {
  const s = useStudy();
  const [kind, setKind] = useState<"all" | "question" | "topic" | "notes">("all");
  const [q, setQ] = useState("");
  const all = useMemo(() => liveBookmarks(s), [s]);
  const list = all.filter((b) => (kind === "all" || (kind === "notes" ? !!b.note : kind === "topic" ? b.kind !== "question" : b.kind === kind)) && (!q.trim() || `${b.title} ${b.note ?? ""} ${b.subject ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())));
  const count = (k: typeof kind) => all.filter((b) => k === "all" || (k === "notes" ? !!b.note : k === "topic" ? b.kind !== "question" : b.kind === k)).length;
  const item = (b: BM) => ({ key: b.key, kind: b.kind, title: b.title, href: b.href, subject: b.subject, q: b.q });
  return (
    <div data-study="bookmarks">
      <div className="st-row">
        <div className="kh-tabs" role="tablist">
          {([["all", "All"], ["question", "Questions"], ["topic", "Topics"], ["notes", "With notes"]] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{l} ({count(k)})</button>)}
        </div>
        <label className="st-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bookmarks and notes" aria-label="Search bookmarks and notes" /></label>
      </div>
      {list.length ? <ul className="st-list bm">{list.map((b) => (
        <li key={b.key} data-bm={b.key}>
          <div className="t">
            <small>{b.kind === "question" ? "Question" : b.kind === "topic" ? "Topic" : b.kind === "condition" ? "Condition" : "Subject"}{b.subject ? ` · ${b.subject}` : ""}</small>
            {b.href ? <Link href={b.href}><b>{b.title}</b></Link> : <b>{b.title}</b>}
            {b.q && <details><summary>Show answer</summary><p className="ok">{b.q.options[b.q.correct]}</p><p className="mu">{b.q.explanation}</p></details>}
            {b.note && <p className="note" data-study="note-text"><NotebookPen size={13} /> {b.note}</p>}
          </div>
          <div className="a"><NoteButton item={item(b)} /><button type="button" className="st-icon" onClick={() => study.toggleBookmark(item(b))} aria-label="Remove bookmark"><Trash2 size={15} /></button></div>
        </li>
      ))}</ul> : <div className="st-empty"><Bookmark size={26} /><b>{all.length ? "Nothing matches" : "No bookmarks yet"}</b><p>Bookmark questions while you practise, and topics or conditions in the Knowledge Hub. Add your own notes to any of them.</p><Link href="/study-hub/medical-knowledge-hub" className="st-btn"><BookOpen size={16} /> Open the Knowledge Hub</Link></div>}
    </div>
  );
}

export default function MyLibrary() {
  useSeo({ title: "My library: progress, revision, bookmarks and notes | Aethex Study", description: "Your daily goal and streak, the questions to revise, and your bookmarks and notes on Aethex Study.", path: "/my-library" });
  useStudySync();
  const { isLoggedIn } = useUserAuth();
  const s = useStudy();
  const [tab, setTab] = useState<Tab>(() => { const t = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("tab"); return t === "revision" || t === "bookmarks" ? t : "progress"; });
  const nWrong = openWrong(s).length, nBm = liveBookmarks(s).length;
  return (
    <div className="st-page" data-study="library">
      <PageHero tag="My library" title="Your study, in one place" subtitle="Your daily goal and streak, the questions to revise, and everything you bookmarked, with your own notes." icon={<Library className="w-7 h-7" />} />
      <div className="ax-wrap st-lib">
        <p className={`st-sync${isLoggedIn ? " on" : ""}`}>{isLoggedIn ? <><Cloud size={15} /> Saved to your account: it follows you to every device.</> : <><CloudOff size={15} /> Saved in this browser. <a href={loginUrl("/", { next: "/my-library" })}>Sign in</a> to keep it in your account.</>}</p>
        <div className="st-tabs" role="tablist">
          {([["progress", "Progress", TrendingUp, ""], ["revision", "Revision", RotateCcw, nWrong ? String(nWrong) : ""], ["bookmarks", "Bookmarks and notes", Bookmark, nBm ? String(nBm) : ""]] as const).map(([k, l, I, n]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-tab={k}><I size={16} /> {l}{n && <em>{n}</em>}</button>
          ))}
        </div>
        {tab === "progress" && <Progress />}
        {tab === "revision" && <Revision />}
        {tab === "bookmarks" && <Bookmarks />}
      </div>
    </div>
  );
}
