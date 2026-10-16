/**
 * Cadus practice hub: exam-style MCQs by subject with instant explanations,
 * accuracy and streak tracking, revision of mistakes, and launchers for the
 * viva and OSCE simulators (which run as Cadus chats).
 */
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpenCheck, CalendarClock, Check, CircleCheck, CircleX, Flame, Lightbulb,
  MessageCircleQuestion, MessageSquare, Play, RotateCcw, Target, Trophy, UserRound, X,
} from "lucide-react";
import {
  accuracy, avoidList, recordAnswer, removeMistake, streak, SUBJECTS, totals, weakest,
  type PracticeQuestion, type PracticeState,
} from "@/lib/cadus/practice";
import { daysToExam, practiceExam, type MedicalProfile } from "@/lib/cadus/profile";

type Item = PracticeQuestion & { subject: string; mistakeId?: string };

interface Quiz {
  kind: "new" | "revise";
  subject: string;
  topic: string;
  status: "loading" | "ready" | "error";
  error?: string;
  items: Item[];
  index: number;
  picks: (number | null)[];
}

const LETTERS = ["A", "B", "C", "D"];
const OSCE_STATIONS = ["Any station", "Chest pain", "Shortness of breath", "Fever", "Abdominal pain", "Headache", "Antenatal visit", "A sick child", "Low mood", "Joint pain"];

export default function PracticeView({ profile, practice, setPractice, generate, onChat, onEditProfile, friendlyError }: {
  profile: MedicalProfile | null;
  practice: PracticeState;
  setPractice: (fn: (s: PracticeState) => PracticeState) => void;
  generate: (body: Record<string, unknown>) => Promise<{ questions?: PracticeQuestion[] }>;
  onChat: (text: string, mode: "viva" | "osce" | "general", title?: string) => void;
  onEditProfile: () => void;
  friendlyError: (raw: string) => string;
}) {
  const weak = weakest(practice, 1)[0];
  const [subject, setSubject] = useState<string>(weak ?? "Pharmacology");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [vivaSubject, setVivaSubject] = useState("Medicine");
  const [vivaTopic, setVivaTopic] = useState("");
  const [station, setStation] = useState(OSCE_STATIONS[0]);

  const exam = practiceExam(profile);
  const days = daysToExam(profile);
  const tot = totals(practice);
  const acc = accuracy(tot);
  const run = streak(practice.days);

  const start = async (subj = subject, top = topic) => {
    setQuiz({ kind: "new", subject: subj, topic: top, status: "loading", items: [], index: 0, picks: [] });
    try {
      const data = await generate({
        action: "practice-mcqs", subject: subj, topic: top.trim() || undefined, count, exam, avoid: avoidList(practice, subj),
      });
      const items = (data?.questions ?? []).map((q) => ({ ...q, subject: subj }));
      if (!items.length) throw new Error("Could not write questions this time, please try again.");
      setQuiz({ kind: "new", subject: subj, topic: top, status: "ready", items, index: 0, picks: items.map(() => null) });
    } catch (e) {
      setQuiz({ kind: "new", subject: subj, topic: top, status: "error", error: friendlyError(e instanceof Error ? e.message : String(e)), items: [], index: 0, picks: [] });
    }
  };

  const revise = () => {
    const items = practice.mistakes.slice(0, 10).map((m) => ({ ...m.q, subject: m.subject, mistakeId: m.id }));
    if (!items.length) return;
    setQuiz({ kind: "revise", subject: "Mistakes", topic: "", status: "ready", items, index: 0, picks: items.map(() => null) });
  };

  const pick = (i: number) => {
    if (!quiz || quiz.picks[quiz.index] !== null) return;
    const item = quiz.items[quiz.index];
    setQuiz({ ...quiz, picks: quiz.picks.map((p, k) => (k === quiz.index ? i : p)) });
    setPractice((s) => {
      const next = recordAnswer(s, item.subject, item, i);
      // A revised mistake answered correctly is cleared by recordAnswer; one answered wrong again is refreshed.
      return item.mistakeId && i === item.answer ? removeMistake(next, item.mistakeId) : next;
    });
  };

  /* ---------------------------------------------------------------- quiz */
  if (quiz) {
    const back = <button className="cx-back" onClick={() => setQuiz(null)}><ArrowLeft size={15} /> Practice</button>;
    if (quiz.status === "loading") {
      return (
        <section className="cx-page cx-pr">
          {back}
          <div className="cx-qz-card loading">
            <div className="cx-step on"><i className="cx-spin" /> Writing {count} {quiz.subject} questions{quiz.topic ? ` on ${quiz.topic}` : ""} at {exam} level…</div>
            <i className="cx-sk" style={{ width: "92%" }} /><i className="cx-sk" style={{ width: "76%" }} /><i className="cx-sk" style={{ width: "84%" }} /><i className="cx-sk" style={{ width: "58%" }} />
          </div>
        </section>
      );
    }
    if (quiz.status === "error") {
      return (
        <section className="cx-page cx-pr">
          {back}
          <div className="cx-err"><X size={16} /><span>{quiz.error}</span><button onClick={() => void start(quiz.subject, quiz.topic)}><RotateCcw size={13} /> Try again</button></div>
        </section>
      );
    }
    const done = quiz.index >= quiz.items.length;
    if (done) {
      const right = quiz.items.filter((q, i) => quiz.picks[i] === q.answer).length;
      const pct = Math.round((right / quiz.items.length) * 100);
      const missed = quiz.items.filter((q, i) => quiz.picks[i] !== q.answer);
      return (
        <section className="cx-page cx-pr">
          {back}
          <div className="cx-qz-res">
            <div className={`cx-qz-score ${pct >= 80 ? "ok" : pct >= 50 ? "mid" : "low"}`}>
              <Trophy size={22} />
              <b>{right} / {quiz.items.length}</b>
              <span>{pct}% correct</span>
            </div>
            <div className="cx-qz-res-t">
              <h2>{pct >= 80 ? "Excellent work" : pct >= 50 ? "Good effort" : "Keep going"}</h2>
              <p>{quiz.kind === "revise" ? "Mistakes you answered correctly have been cleared from your revision list." : `${quiz.subject}${quiz.topic ? ` · ${quiz.topic}` : ""}. Your accuracy and streak are updated.`}</p>
              <div className="cx-qz-res-acts">
                {quiz.kind === "new" && <button className="cx-btn primary" onClick={() => void start(quiz.subject, quiz.topic)}><Play size={14} /> Another set</button>}
                {practice.mistakes.length > 0 && <button className="cx-btn" onClick={revise}><RotateCcw size={14} /> Revise mistakes ({practice.mistakes.length})</button>}
                {missed.length > 0 && (
                  <button className="cx-btn" onClick={() => onChat(`I got these ${quiz.kind === "new" ? `${quiz.subject} ` : ""}practice questions wrong. Teach me the concepts behind them and the traps to avoid:\n\n${missed.map((q, i) => `${i + 1}. ${q.question} (answer: ${q.options[q.answer]})`).join("\n")}`, "general", `Revise: ${quiz.kind === "new" ? quiz.subject : "my mistakes"}`)}>
                    <MessageSquare size={14} /> Teach me what I missed
                  </button>
                )}
              </div>
            </div>
          </div>
          <ol className="cx-qz-review">
            {quiz.items.map((q, i) => {
              const ok = quiz.picks[i] === q.answer;
              return (
                <li key={i} className={ok ? "ok" : "bad"}>
                  <details>
                    <summary>{ok ? <CircleCheck size={16} /> : <CircleX size={16} />}<span>{q.question}</span></summary>
                    <p><b>Answer: {LETTERS[q.answer]}. {q.options[q.answer]}</b>{!ok && quiz.picks[i] !== null ? ` · You chose ${LETTERS[quiz.picks[i] as number]}.` : ""}</p>
                    {q.explanation && <p>{q.explanation}</p>}
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      );
    }
    const item = quiz.items[quiz.index];
    const chosen = quiz.picks[quiz.index];
    const answered = chosen !== null;
    return (
      <section className="cx-page cx-pr">
        <div className="cx-qz-top">
          {back}
          <span className="cx-qz-meta">{quiz.kind === "revise" ? `Revision · ${item.subject}` : `${quiz.subject}${quiz.topic ? ` · ${quiz.topic}` : ""}`}</span>
          <span className="cx-qz-n">Question {quiz.index + 1} of {quiz.items.length}</span>
        </div>
        <div className="cx-meter cx-qz-bar"><i style={{ width: `${((quiz.index + (answered ? 1 : 0)) / quiz.items.length) * 100}%` }} /></div>
        <div className="cx-qz-card">
          {item.topic && <span className="cx-badge">{item.topic}</span>}
          <p className="cx-qz-q">{item.question}</p>
          <div className="cx-qz-opts" role="radiogroup" aria-label="Options">
            {item.options.map((o, i) => {
              const state = !answered ? "" : i === item.answer ? "right" : i === chosen ? "wrong" : "dim";
              return (
                <button key={i} role="radio" aria-checked={chosen === i} className={`cx-qz-opt ${state}`} onClick={() => pick(i)} disabled={answered}>
                  <span className="l">{LETTERS[i]}</span>
                  <span className="t">{o}</span>
                  {answered && i === item.answer && <Check size={16} className="ic" />}
                  {answered && i === chosen && i !== item.answer && <X size={16} className="ic" />}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className={`cx-qz-exp ${chosen === item.answer ? "ok" : "bad"}`}>
              <b>{chosen === item.answer ? <><CircleCheck size={15} /> Correct</> : <><CircleX size={15} /> Not quite: the answer is {LETTERS[item.answer]}</>}</b>
              {item.explanation && <p><Lightbulb size={14} /> {item.explanation}</p>}
            </div>
          )}
          <div className="cx-qz-f">
            <span>{answered ? "" : "Pick an answer to see the explanation"}</span>
            <button className="cx-btn primary" disabled={!answered} onClick={() => setQuiz({ ...quiz, index: quiz.index + 1 })}>
              {quiz.index + 1 === quiz.items.length ? "See results" : "Next question"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------- hub */
  return (
    <section className="cx-page cx-pr">
      <header className="cx-page-h">
        <div>
          <h1>Practice</h1>
          <p>{exam}-style questions written for you, with instant explanations. Cadus tracks your accuracy by subject and brings back the questions you got wrong.</p>
        </div>
        <button className="cx-pr-exam" onClick={onEditProfile} title="Change your exam in your profile">
          <CalendarClock size={15} />
          {days !== null ? <span><b>{days}</b> days to {exam}</span> : <span>{profile?.role === "aspirant" ? `${exam} · add your exam date` : `Practising for ${exam}`}</span>}
        </button>
      </header>

      <div className="cx-pr-stats">
        <div><span><Target size={15} /> Answered</span><b>{tot.attempted}</b></div>
        <div><span><Check size={15} /> Accuracy</span><b>{acc === null ? "–" : `${acc}%`}</b></div>
        <div><span><Flame size={15} /> Day streak</span><b>{run}</b></div>
        <div className="rev">
          <span><RotateCcw size={15} /> To revise</span>
          <b>{practice.mistakes.length}</b>
          {practice.mistakes.length > 0 && <button onClick={revise}>Revise now</button>}
        </div>
      </div>

      <div className="cx-pr-start">
        <div className="cx-pr-start-h">
          <h2>Start a set</h2>
          <p>Choose a subject{weak ? `. Your weakest so far is ${weak}` : ""}.</p>
        </div>
        <div className="cx-subjects" role="radiogroup" aria-label="Subject">
          {SUBJECTS.map((s) => {
            const a = accuracy(practice.stats[s]);
            return (
              <button key={s} role="radio" aria-checked={subject === s} className={`cx-subj ${subject === s ? "on" : ""}`} onClick={() => setSubject(s)}>
                <span>{s}</span>
                {a !== null && <em className={a >= 70 ? "ok" : a >= 50 ? "mid" : "low"}>{a}%</em>}
              </button>
            );
          })}
        </div>
        <div className="cx-pr-row">
          <label className="cx-search cx-pr-topic">
            <BookOpenCheck size={15} />
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={`Optional topic in ${subject}, e.g. ${subject === "Pharmacology" ? "antiepileptics" : subject === "Medicine" ? "heart failure" : "a high-yield chapter"}`} maxLength={120} aria-label="Topic" onKeyDown={(e) => { if (e.key === "Enter") void start(); }} />
          </label>
          <div className="cx-seg" role="radiogroup" aria-label="Number of questions">
            {[5, 10].map((n) => <button key={n} role="radio" aria-checked={count === n} className={count === n ? "on" : ""} onClick={() => setCount(n)}>{n} questions</button>)}
          </div>
          <button className="cx-btn primary" onClick={() => void start()}><Play size={14} /> Start practice</button>
        </div>
      </div>

      <div className="cx-pr-sims">
        <div className="cx-pr-sim">
          <span className="cx-pr-sim-ic"><MessageCircleQuestion size={18} /></span>
          <h3>Viva voce</h3>
          <p>An examiner asks one question at a time, tells you what you missed and gives a scorecard at the end.</p>
          <div className="cx-pr-sim-f">
            <select className="cx-select" value={vivaSubject} onChange={(e) => setVivaSubject(e.target.value)} aria-label="Viva subject">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className="cx-input" value={vivaTopic} onChange={(e) => setVivaTopic(e.target.value)} placeholder="Topic (optional)" maxLength={100} aria-label="Viva topic" />
            <button className="cx-btn primary" onClick={() => onChat(`${vivaTopic.trim() ? `${vivaTopic.trim()} (${vivaSubject})` : `${vivaSubject}: pick a high-yield topic`}. Start my viva.`, "viva", `Viva: ${vivaTopic.trim() || vivaSubject}`)}><Play size={14} /> Start viva</button>
          </div>
        </div>
        <div className="cx-pr-sim">
          <span className="cx-pr-sim-ic"><UserRound size={18} /></span>
          <h3>OSCE history station</h3>
          <p>Take a history from a simulated patient who answers only what you ask. Say “Finish and score” for examiner feedback out of 20.</p>
          <div className="cx-pr-sim-f">
            <select className="cx-select" value={station} onChange={(e) => setStation(e.target.value)} aria-label="OSCE station">
              {OSCE_STATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="cx-btn primary" onClick={() => onChat(station === OSCE_STATIONS[0] ? "Any station: choose a common presentation. Please start." : `${station} station. Please start.`, "osce", `OSCE: ${station === OSCE_STATIONS[0] ? "history station" : station.toLowerCase()}`)}><Play size={14} /> Start station</button>
          </div>
        </div>
      </div>
    </section>
  );
}
