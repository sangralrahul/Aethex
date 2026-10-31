/**
 * Update 77: /custom-test, build your own test. Choose where the questions come from (the NEET-PG question bank by
 * subject and difficulty, your bookmarked questions, your revision deck, or fresh questions on any Knowledge Hub topic
 * written by Cadus), how many, the timer and the mode (exam: answers at the end; practice: an answer and explanation
 * after each). Then a score report with subjects to work on; wrong answers go to the revision deck.
 * Styles: src/shop.css (.st-*).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Bookmark, BookOpen, ClipboardList, Loader2, RotateCcw, Sparkles, Timer } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { PageHero } from "@/components/PageHero";
import { QUESTIONS } from "@/data/neetpgQuestions";
import { medicalSubjects } from "@/data/medicalSubjects";
import { invokeAi } from "@/lib/ai-functions";
import { liveBookmarks, openWrong, useStudy, type QSnap } from "@/lib/study/progress";
import { fromBank, fromGenerated, parseArray } from "@/lib/study/questions";
import { hubSubject } from "@/lib/study/topics";
import { Report, Runner, TodayCard, useStudySync, type RunMode, type RunResult } from "@/components/study/StudyBits";

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; };

type Source = "bank" | "bookmarks" | "revision" | "cadus";
const BANK_SUBJECTS = [...new Set(QUESTIONS.map((q) => q.subject))];

export default function CustomTest() {
  useSeo({ title: "Custom test builder | Aethex Study", description: "Build your own NEET-PG test: choose subjects, how many questions and the timer, then see your score and the subjects to work on.", path: "/custom-test" });
  useStudySync();
  const s = useStudy();
  // update 90: /custom-test?subject=<hub slug>[&topic=<topic slug>] (from the topic mastery map)
  const [preset] = useState(() => {
    const p = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
    const slug = p?.get("subject") ?? "", topic = p?.get("topic") ?? "";
    const sub = medicalSubjects.find((x) => x.slug === slug);
    if (!sub) return null;
    const bankSub = BANK_SUBJECTS.find((b) => hubSubject(b)?.slug === sub.slug);
    return topic || !bankSub ? { source: "cadus" as Source, slug: sub.slug, topic: sub.topics.some((t) => t.slug === topic) ? topic : "", subjects: [] as string[] } : { source: "bank" as Source, slug: sub.slug, topic: "", subjects: [bankSub] };
  });
  const [source, setSource] = useState<Source>(preset?.source ?? "bank");
  const [subjects, setSubjects] = useState<string[]>(preset?.subjects ?? []);
  const [diff, setDiff] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [count, setCount] = useState(10);
  const [timer, setTimer] = useState<"none" | "auto" | "custom">("auto");
  const [mins, setMins] = useState(15);
  const [mode, setMode] = useState<RunMode>("exam");
  const [aiSubject, setAiSubject] = useState(preset?.source === "cadus" ? preset.slug : medicalSubjects[0]!.slug);
  const [aiTopic, setAiTopic] = useState(preset?.topic ?? "");
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const [run, setRun] = useState<{ qs: QSnap[]; minutes: number | null; title: string } | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  const bookmarked = useMemo(() => liveBookmarks(s).filter((b) => b.q).map((b) => b.q!), [s]);
  const revision = useMemo(() => openWrong(s).map((w) => w.q), [s]);
  const pool = useMemo(() => {
    if (source === "bookmarks") return bookmarked;
    if (source === "revision") return revision;
    if (source === "cadus") return [];
    return QUESTIONS.filter((q) => (!subjects.length || subjects.includes(q.subject)) && (diff === "All" || q.difficulty === diff)).map(fromBank);
  }, [source, subjects, diff, bookmarked, revision]);
  const n = source === "cadus" ? count : Math.min(count, pool.length);
  const subj = medicalSubjects.find((x) => x.slug === aiSubject)!;

  const start = async () => {
    setErr("");
    let qs: QSnap[] = [];
    let title = "Custom test";
    if (source === "cadus") {
      const topic = subj.topics.find((t) => t.slug === aiTopic) ?? subj.topics[0]!;
      setBusy(true);
      try {
        const { data, error } = await invokeAi<{ content?: string }>("cadus", { body: { action: "med-knowledge", section: "mcq", topic: topic.name, subject: subj.name, mcqCount: String(count) } });
        if (error || !data?.content) throw new Error(error?.message || "no questions");
        qs = (parseArray(data.content) ?? []).map((x) => fromGenerated(x, subj.name, topic.name)).filter((x): x is QSnap => !!x).slice(0, count);
        if (!qs.length) throw new Error("no questions");
        title = `${topic.name} · ${subj.name}`;
      } catch { setErr("Cadus couldn't write questions just now. Try again, or use the question bank."); setBusy(false); return; }
      setBusy(false);
    } else {
      qs = shuffle(pool).slice(0, n);
      title = source === "bookmarks" ? "Bookmarked questions" : source === "revision" ? "Revision" : subjects.length ? subjects.join(", ") : "All subjects";
    }
    if (!qs.length) { setErr("No questions match. Choose other subjects or another source."); return; }
    const minutes = timer === "none" ? null : timer === "auto" ? Math.max(1, Math.round(qs.length * 1.05)) : mins;
    setResult(null);
    setRun({ qs, minutes, title });
  };

  if (run && !result) return <div className="st-page"><div className="ax-wrap"><Runner questions={run.qs} mode={mode} minutes={run.minutes} title={run.title} onDone={setResult} onQuit={() => setRun(null)} /></div></div>;
  if (result) return <div className="st-page"><div className="ax-wrap"><Report r={result} onAgain={() => { setResult(null); setRun(null); }} /></div></div>;

  const SRC: [Source, string, typeof BookOpen, string][] = [
    ["bank", "Question bank", ClipboardList, `${QUESTIONS.length} NEET-PG questions`],
    ["cadus", "Fresh questions by Cadus", Sparkles, "On any Knowledge Hub topic"],
    ["bookmarks", "My bookmarked questions", Bookmark, `${bookmarked.length} saved`],
    ["revision", "My revision deck", RotateCcw, `${revision.length} to revise`],
  ];
  return (
    <div className="st-page" data-study="builder">
      <PageHero tag="Custom test" title="Build your own test" subtitle="Pick the subjects, the number of questions and the timer. You'll get your score, the subjects to work on, and every wrong answer goes to your revision deck." icon={<ClipboardList className="w-7 h-7" />} />
      <div className="ax-wrap st-build">
        <div className="st-build-main">
          <section className="st-card">
            <h2>1. Where the questions come from</h2>
            <div className="st-src" role="radiogroup">
              {SRC.map(([k, l, I, d]) => <button key={k} type="button" role="radio" aria-checked={source === k} className={source === k ? "on" : ""} onClick={() => setSource(k)} data-source={k}><I size={20} /><b>{l}</b><small>{d}</small></button>)}
            </div>
          </section>
          {source === "bank" && (
            <section className="st-card">
              <h2>2. Subjects <small>{subjects.length ? `${subjects.length} chosen` : "All subjects"}</small></h2>
              <div className="st-chips">{BANK_SUBJECTS.map((x) => { const on = subjects.includes(x); const c = QUESTIONS.filter((q) => q.subject === x).length; return <button key={x} type="button" aria-pressed={on} className={on ? "on" : ""} onClick={() => setSubjects(on ? subjects.filter((y) => y !== x) : [...subjects, x])} data-subject={x}>{x} <em>{c}</em></button>; })}</div>
              <h2>Difficulty</h2>
              <div className="kh-tabs" role="tablist">{(["All", "Easy", "Medium", "Hard"] as const).map((d) => <button key={d} type="button" role="tab" aria-selected={diff === d} className={diff === d ? "on" : ""} onClick={() => setDiff(d)}>{d}</button>)}</div>
            </section>
          )}
          {source === "cadus" && (
            <section className="st-card">
              <h2>2. Topic</h2>
              <div className="st-two">
                <label>Subject<select value={aiSubject} onChange={(e) => { setAiSubject(e.target.value); setAiTopic(""); }}>{medicalSubjects.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select></label>
                <label>Topic<select value={aiTopic || subj.topics[0]?.slug} onChange={(e) => setAiTopic(e.target.value)}>{subj.topics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></label>
              </div>
              <p className="fine"><Sparkles size={13} /> Cadus writes new questions each time. Check anything surprising against your textbook.</p>
            </section>
          )}
          <section className="st-card">
            <h2>3. Number of questions <small>{source === "cadus" ? count : `${n} of ${pool.length} available`}</small></h2>
            <input type="range" min={1} max={source === "cadus" ? 20 : Math.max(1, Math.min(100, pool.length))} value={source === "cadus" ? count : n} onChange={(e) => setCount(Number(e.target.value))} aria-label="Number of questions" data-study="count" />
            <h2>Timer</h2>
            <div className="kh-tabs" role="tablist">
              {([["auto", "About 1 minute a question"], ["custom", "Set minutes"], ["none", "No timer"]] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={timer === k} className={timer === k ? "on" : ""} onClick={() => setTimer(k)}>{l}</button>)}
            </div>
            {timer === "custom" && <label className="st-mins"><Timer size={15} /><input type="number" min={1} max={300} value={mins} onChange={(e) => setMins(Math.max(1, Math.min(300, Number(e.target.value) || 1)))} /> minutes</label>}
            <h2>Mode</h2>
            <div className="st-src two" role="radiogroup">
              <button type="button" role="radio" aria-checked={mode === "exam"} className={mode === "exam" ? "on" : ""} onClick={() => setMode("exam")} data-mode="exam"><b>Exam</b><small>Answers and explanations at the end, like the real paper</small></button>
              <button type="button" role="radio" aria-checked={mode === "practice"} className={mode === "practice" ? "on" : ""} onClick={() => setMode("practice")} data-mode="practice"><b>Practice</b><small>See the answer and explanation after each question</small></button>
            </div>
          </section>
          {err && <p className="ax-form-err" role="alert">{err}</p>}
          <button type="button" className="st-btn lg" disabled={busy || (source !== "cadus" && !pool.length)} onClick={() => void start()} data-study="start">{busy ? <><Loader2 size={18} className="spin" /> Cadus is writing your questions…</> : `Start ${source === "cadus" ? count : n}-question test`}</button>
          {source !== "cadus" && !pool.length && <p className="mu">{source === "bookmarks" ? <>No bookmarked questions yet: tap the bookmark on any question.</> : source === "revision" ? "Your revision deck is empty. Questions you get wrong come here." : "No questions match these choices."}</p>}
        </div>
        <aside className="st-build-side">
          <TodayCard compact />
          <Link href="/my-library" className="st-side-link"><Bookmark size={16} /> My library: bookmarks, notes and revision</Link>
          <Link href="/neet-pg" className="st-side-link"><BookOpen size={16} /> NEET-PG practice</Link>
        </aside>
      </div>
    </div>
  );
}
