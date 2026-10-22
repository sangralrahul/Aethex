/**
 * Exam Study Planner: choose the exam, the date, hours a day and (for a university exam)
 * the subjects; Cadus lays out every day to the exam from the Learn syllabus. Today's topics
 * come first, with "Quiz me" and links to Learn; ticking a day off ticks its topics in
 * Learn too. Missed days can be re-planned from today. Export to any calendar (.ics).
 */
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, CalendarPlus, CheckCircle2, Circle, Flag, GraduationCap, RefreshCw, Target, Trash2 } from "lucide-react";
import { SUBJECTS, type PracticeState } from "@/lib/cadus/practice";
import type { LearnState } from "@/lib/cadus/learn";
import { addDays, dayTask, KIND_LABEL, makePlan, PLAN_EXAMS, planIcs, progress, readPlan, replan, savePlan, todayIso, type StudyDay, type StudyPlan } from "@/lib/cadus/studyplan";
import { sid } from "@/lib/cadus/studio";

const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", opts);

export default function StudyPlanView({ learn, setLearn, practice, defaultExam, defaultExamDate, onAsk, onPractice, toast }: {
  learn: LearnState;
  setLearn: (fn: (s: LearnState) => LearnState) => void;
  practice: PracticeState;
  defaultExam: string;
  defaultExamDate: string;
  onAsk: (q: string) => void;
  onPractice: () => void;
  toast: (t: string) => void;
}) {
  const [plan, setPlan] = useState<StudyPlan | null>(readPlan);
  const [exam, setExam] = useState<string>(PLAN_EXAMS.includes(defaultExam as (typeof PLAN_EXAMS)[number]) ? defaultExam : "NEET-PG");
  const [examDate, setExamDate] = useState(() => (/^\d{4}-\d{2}-\d{2}$/.test(defaultExamDate) && defaultExamDate > todayIso() ? defaultExamDate : addDays(todayIso(), 90)));
  const [hours, setHours] = useState(6);
  const [subjects, setSubjects] = useState<string[]>(SUBJECTS);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => savePlan(plan), [plan]);
  const accuracy = useMemo(() => Object.fromEntries(SUBJECTS.map((s) => { const st = practice.stats[s]; return [s, st && st.attempted >= 5 ? Math.round((100 * st.correct) / st.attempted) : null]; })), [practice]);
  const doneFor = (ex: string) => learn.done[ex] ?? [];

  const create = () => {
    try {
      const p = makePlan({ exam, examDate, hours, subjects: exam === "University exam" ? subjects : SUBJECTS, done: doneFor(exam), accuracy }, sid());
      setPlan(p);
      toast(`Plan ready: ${p.days.length} days to ${exam}`);
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't make the plan"); }
  };

  if (!plan) {
    return (
      <section className="cx-page cx-stp">
        <header className="cx-page-h"><div><h1>Exam Study Planner</h1><p>A day-by-day plan to your exam from the Learn syllabus: bigger and weaker subjects first, a revision block, weekly mock tests and a light day before the exam.</p></div></header>
        <div className="cx-stp-form">
          <div className="cx-field"><span>Exam</span><div className="cx-seg">{PLAN_EXAMS.map((e) => <button key={e} className={exam === e ? "on" : ""} onClick={() => setExam(e)} data-sp-exam={e}>{e}</button>)}</div></div>
          <label className="cx-field"><span>Exam date</span><input className="cx-input" type="date" value={examDate} min={addDays(todayIso(), 1)} onChange={(e) => setExamDate(e.target.value)} data-sp="date" /></label>
          <label className="cx-field"><span>Hours a day: {hours}</span><input type="range" min={1} max={14} value={hours} onChange={(e) => setHours(Number(e.target.value))} data-sp="hours" /></label>
        </div>
        {exam === "University exam" && (
          <div className="cx-stp-subjects" data-sp="subjects">
            <p className="cx-gl"><span>Subjects in this exam</span><button className="cx-link" onClick={() => setSubjects(subjects.length ? [] : SUBJECTS)}>{subjects.length ? "None" : "All"}</button></p>
            <div className="cx-stp-chips">{SUBJECTS.map((s) => <button key={s} className={subjects.includes(s) ? "on" : ""} onClick={() => setSubjects((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))} aria-pressed={subjects.includes(s)}>{s}</button>)}</div>
          </div>
        )}
        <div className="cx-sc-acts"><button className="cx-btn primary" onClick={create} data-sp="go"><CalendarCheck size={15} /> Make my plan</button></div>
        <p className="cx-rs-foot">Topics you've already ticked in Learn are left out; weak subjects from your practice come earlier. Everything stays on this device.</p>
      </section>
    );
  }

  const pr = progress(plan);
  const today = pr.today;
  const toggleDay = (d: StudyDay) => {
    const done = !d.done;
    setPlan((p) => (p ? { ...p, days: p.days.map((x) => (x.date === d.date ? { ...x, done } : x)) } : p));
    // Learning or revising a day's topics ticks them in Learn; un-ticking a learning day un-ticks them.
    const keys = d.items.filter((i) => i.topic).map((i) => `${i.subject} › ${i.topic}`);
    if (keys.length && (d.kind === "learn" || (d.kind === "revise" && done))) {
      setLearn((s) => {
        const cur = new Set(s.done[plan.exam] ?? []);
        for (const k of keys) { if (done) cur.add(k); else if (d.kind === "learn") cur.delete(k); }
        return { ...s, done: { ...s.done, [plan.exam]: [...cur] } };
      });
    }
    if (done) toast(d.kind === "rest" ? "Rest well" : "Day done");
  };
  const quiz = (d: StudyDay) => onAsk(`Quiz me with 10 ${plan.exam}-style MCQs, one at a time, on: ${d.items.map((i) => (i.topic ? `${i.subject} (${i.topic})` : i.subject)).join("; ")}. After each answer, tell me if I was right and explain briefly, then ask the next.`);
  const exportIcs = () => {
    const blob = new Blob([planIcs(plan)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Cadus study plan ${plan.exam}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const upcoming = plan.days.filter((d) => d.date >= todayIso());
  const shown = showAll ? plan.days : upcoming.slice(0, 14);

  const DayCard = ({ d, big }: { d: StudyDay; big?: boolean }) => (
    <article className={`cx-stp-day k-${d.kind} ${d.done ? "done" : ""} ${big ? "big" : ""}`} data-sp-day={d.date}>
      <div className="cx-stp-dh">
        <button className={`cx-stp-tick ${d.done ? "on" : ""}`} onClick={() => toggleDay(d)} aria-pressed={d.done} aria-label={d.done ? "Mark not done" : "Mark done"} data-sp-tick={d.date}>{d.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button>
        <b>{big ? "Today" : fmtDay(d.date)}</b><em className={`cx-stp-kind k-${d.kind}`}>{KIND_LABEL[d.kind]}</em>
      </div>
      <p className="cx-stp-task">{dayTask(d, plan.hours)}</p>
      {d.items.length > 0 && <ul className="cx-stp-items">{d.items.map((i) => <li key={i.subject + i.topic}><span>{i.subject}</span>{i.topic && ` ${i.topic}`}</li>)}</ul>}
      {big && d.kind !== "rest" && (
        <div className="cx-sc-acts">
          {d.kind === "mock" ? <button className="cx-btn primary" onClick={onPractice}><Target size={14} /> Take a mock in Learn</button> : <button className="cx-btn primary" onClick={() => quiz(d)} data-sp="quiz"><GraduationCap size={14} /> Quiz me</button>}
          <button className="cx-btn" onClick={onPractice}>Open Learn</button>
        </div>
      )}
    </article>
  );

  return (
    <section className="cx-page cx-stp">
      <header className="cx-page-h">
        <div><h1>{plan.exam} plan</h1><p><Flag size={13} /> {fmtDay(plan.examDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · <b data-sp="left">{pr.daysLeft} day{pr.daysLeft === 1 ? "" : "s"} left</b> · {plan.hours} h a day</p></div>
      </header>
      <div className="cx-stp-prog" data-sp="progress">
        <div className="cx-stp-bar"><i style={{ width: `${pr.pct}%` }} /></div>
        <span><b>{pr.pct}%</b> · {pr.done + plan.doneBefore} days done · {pr.topicsLeft} topics to learn</span>
      </div>
      {pr.behind > 0 && (
        <div className="cx-rxc-verdict v-review" data-sp="behind"><RefreshCw size={20} /><div><b>{pr.behind} day{pr.behind === 1 ? "" : "s"} behind</b><p>Re-plan from today: what's left is spread over the days you have.</p></div>
          <button className="cx-btn" onClick={() => { setPlan(replan(plan, doneFor(plan.exam), accuracy)); toast("Re-planned from today"); }} data-sp="replan">Re-plan</button></div>
      )}
      {today ? <DayCard d={today} big /> : pr.daysLeft === 0 ? <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Flag size={20} /></span><h3>Exam day. All the best.</h3><p>Eat, hydrate, and read each question twice.</p></div> : null}
      <p className="cx-gl"><span><CalendarDays size={13} /> {showAll ? "Whole plan" : "Next two weeks"}</span><button className="cx-link" onClick={() => setShowAll(!showAll)} data-sp="all">{showAll ? "Next two weeks" : `All ${plan.days.length} days`}</button></p>
      <div className="cx-stp-days">{shown.filter((d) => d !== today).map((d) => <DayCard key={d.date} d={d} />)}</div>
      <div className="cx-sc-acts">
        <button className="cx-btn" onClick={exportIcs} data-sp="ics"><CalendarPlus size={14} /> Add to calendar</button>
        <button className="cx-btn" onClick={() => { setPlan(replan(plan, doneFor(plan.exam), accuracy)); toast("Re-planned from today"); }}><RefreshCw size={14} /> Re-plan from today</button>
        <button className="cx-ib" onClick={() => { if (window.confirm("Delete this plan? Topics ticked in Learn stay ticked.")) setPlan(null); }} aria-label="Delete plan" data-sp="delete"><Trash2 size={15} /></button>
      </div>
    </section>
  );
}
