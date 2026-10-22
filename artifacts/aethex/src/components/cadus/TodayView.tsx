/**
 * Today: one screen for the day. Ward jobs still open, flashcards and Learn revision due,
 * pathways left unfinished, whether Guideline Watch needs a check, active cases and the
 * last chats, with quick starts for the tools used most. Everything is read from this device.
 */
import type { ReactNode } from "react";
import { ArrowRight, BedDouble, BellRing, CalendarCheck, CalendarClock, CalendarDays, CheckSquare, ClipboardList, Flame, GitFork, GraduationCap, Layers, Languages, MessageSquare, Pill, Presentation, ShieldPlus, Square } from "lucide-react";
import { dueCards, readDecks, readRuns } from "@/lib/cadus/studio";
import { readWatch } from "@/lib/cadus/labs";
import { KIND_LABEL, progress, readPlan } from "@/lib/cadus/studyplan";
import { followUpGroups, readFollowUps } from "@/lib/cadus/records";

export interface TodayWardPatient { id: string; bed: string; label: string; diagnosis: string; jobs: { id: string; text: string; done: boolean }[] }

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); if (m < 60) return `${Math.max(1, m)} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const d = Math.round(h / 24); return `${d} day${d === 1 ? "" : "s"} ago`; };

function Card({ icon, title, count, empty, children, action, testId }: { icon: ReactNode; title: string; count?: number | string; empty?: string; children?: ReactNode; action?: { label: string; go: () => void }; testId: string }) {
  return (
    <article className="cx-td-card" data-today={testId}>
      <div className="cx-td-h">{icon}<b>{title}</b>{count !== undefined && <em>{count}</em>}</div>
      {children ?? <p className="cx-td-empty">{empty}</p>}
      {action && <button className="cx-link" onClick={action.go}>{action.label} <ArrowRight size={13} /></button>}
    </article>
  );
}

export default function TodayView({ name, ward, toggleJob, learn, activeCases, chats, questionsLeft, go }: {
  name: string;
  ward: TodayWardPatient[];
  toggleJob: (patientId: string, jobId: string) => void;
  learn: { streak: number; due: number; toRevise: number };
  activeCases: number;
  chats: { id: string; title: string; updatedAt: number }[];
  questionsLeft: number | null;
  go: (where: string, id?: string) => void;
}) {
  const decks = readDecks();
  const cardsDue = decks.reduce((n, d) => n + dueCards(d).length, 0);
  const runs = readRuns().filter((r) => !r.steps.some((s) => s.step.kind === "end")).slice(0, 3);
  const watch = readWatch();
  const followed = watch.topics.filter((t) => t.on);
  const lastWatch = Math.max(0, ...followed.map((t) => watch.runs[t.id]?.at ?? 0));
  const watchStale = followed.length > 0 && Date.now() - lastWatch > 7 * 86400000;
  const fresh = followed.reduce((n, t) => n + (watch.runs[t.id]?.fresh.length ?? 0), 0);
  const plan = readPlan();
  const fu = followUpGroups(readFollowUps());
  const fuDue = [...fu.overdue, ...fu.today];
  const planPr = plan ? progress(plan) : null;
  const openJobs = ward.flatMap((p) => p.jobs.filter((j) => !j.done).map((j) => ({ ...j, patient: p })));
  const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const quick: { label: string; icon: ReactNode; where: string }[] = [
    { label: "Rx Safety Check", icon: <ShieldPlus size={16} />, where: "rxcheck" },
    { label: "Med Reconciliation", icon: <Pill size={16} />, where: "medrec" },
    { label: "Clinical Pathways", icon: <GitFork size={16} />, where: "pathways" },
    { label: "Consult Translator", icon: <Languages size={16} />, where: "translate" },
    { label: "Presentation Coach", icon: <Presentation size={16} />, where: "present" },
    { label: "Flashcards", icon: <Layers size={16} />, where: "flashcards" },
  ];

  return (
    <section className="cx-page cx-today">
      <header className="cx-page-h">
        <div>
          <p className="cx-crew-eyebrow"><CalendarDays size={14} /> {date}</p>
          <h1>{greeting()}{name ? `, ${name}` : ""}</h1>
          <p>{[openJobs.length ? `${openJobs.length} ward job${openJobs.length === 1 ? "" : "s"} open` : "", cardsDue + learn.due ? `${cardsDue + learn.due} card${cardsDue + learn.due === 1 ? "" : "s"} to review` : "", runs.length ? `${runs.length} pathway${runs.length === 1 ? "" : "s"} unfinished` : ""].filter(Boolean).join(" · ") || "Nothing waiting. A good day to learn something new."}</p>
        </div>
        {questionsLeft !== null && <span className="cx-td-left">{questionsLeft} questions left today</span>}
      </header>

      <div className="cx-td-quick">
        {quick.map((q) => <button key={q.where} onClick={() => go(q.where)} data-today-go={q.where}>{q.icon}<span>{q.label}</span></button>)}
      </div>

      <div className="cx-td-grid">
        <Card icon={<BedDouble size={16} />} title="Ward jobs" count={openJobs.length} empty={ward.length ? "All jobs done." : "No patients on your ward list."} action={{ label: "Open ward round", go: () => go("ward") }} testId="ward">
          {openJobs.length > 0 ? (
            <ul className="cx-td-jobs">
              {openJobs.slice(0, 8).map((j) => (
                <li key={j.id}>
                  <button onClick={() => toggleJob(j.patient.id, j.id)} aria-label={`Mark done: ${j.text}`} data-today-job={j.id}><Square size={15} /></button>
                  <span><b>Bed {j.patient.bed}</b> {j.text}<small>{[j.patient.label, j.patient.diagnosis].filter(Boolean).join(" · ")}</small></span>
                </li>
              ))}
              {openJobs.length > 8 && <li className="more">and {openJobs.length - 8} more</li>}
            </ul>
          ) : undefined}
        </Card>

        <Card icon={<GraduationCap size={16} />} title="Revision" count={cardsDue + learn.due} testId="revision">
          <ul className="cx-td-list">
            <li><Layers size={14} /> <span>{cardsDue ? <><b>{cardsDue}</b> flashcard{cardsDue === 1 ? "" : "s"} due</> : "No flashcards due"}</span>{cardsDue > 0 && <button className="cx-link" onClick={() => go("flashcards")}>Review</button>}</li>
            <li><GraduationCap size={14} /> <span>{learn.due ? <><b>{learn.due}</b> Learn question{learn.due === 1 ? "" : "s"} to revise</> : "Learn: nothing to revise"}</span><button className="cx-link" onClick={() => go("practice")}>{learn.due ? "Revise" : "Daily set"}</button></li>
            {learn.streak > 0 && <li><Flame size={14} /> <span><b>{learn.streak}-day</b> streak</span></li>}
          </ul>
        </Card>

        <Card icon={<CalendarCheck size={16} />} title="Study plan" count={planPr ? `${planPr.daysLeft} days left` : undefined} testId="studyplan"
          empty="No plan yet. Make a day-by-day plan to your exam."
          action={{ label: plan ? "Open plan" : "Make a plan", go: () => go("studyplan") }}>
          {plan && planPr ? (
            <ul className="cx-td-list">
              <li><CalendarCheck size={14} /> <span>{planPr.today ? <><b>{planPr.today.done ? "Done today" : KIND_LABEL[planPr.today.kind]}</b>{planPr.today.items.length > 0 && planPr.today.kind !== "mock" ? `: ${planPr.today.items.map((i) => i.topic || i.subject).slice(0, 3).join(", ")}${planPr.today.items.length > 3 ? "…" : ""}` : ""}</> : `${plan.exam} is today`}</span></li>
              <li><Flame size={14} /> <span><b>{planPr.pct}%</b> of the plan done{planPr.behind ? ` · ${planPr.behind} behind` : ""}</span></li>
            </ul>
          ) : undefined}
        </Card>

        <Card icon={<CalendarClock size={16} />} title="Follow-ups due" count={fuDue.length || undefined} testId="followups"
          empty={fu.week.length ? `None today; ${fu.week.length} this week.` : "No follow-ups due."}
          action={{ label: fuDue.length ? "Open follow-ups" : "Add a follow-up", go: () => go("followups") }}>
          {fuDue.length > 0 ? <ul className="cx-td-list">{fuDue.slice(0, 5).map((f) => <li key={f.id}><CalendarClock size={14} /> <span><b>{f.label}</b> {f.reason}<small>{f.due < new Date().toISOString().slice(0, 10) ? "Overdue" : "Today"}{f.review ? ` · check ${f.review}` : ""}</small></span></li>)}</ul> : undefined}
        </Card>

        <Card icon={<GitFork size={16} />} title="Unfinished pathways" count={runs.length} empty="None. Start one when a patient needs it." action={{ label: "All pathways", go: () => go("pathways") }} testId="pathways">
          {runs.length > 0 ? <ul className="cx-td-list">{runs.map((r) => <li key={r.id}><GitFork size={14} /> <span><b>{r.pathway}</b>{r.context ? ` · ${r.context}` : ""}<small>{r.steps.length} step{r.steps.length === 1 ? "" : "s"} · {ago(r.at)}</small></span></li>)}</ul> : undefined}
        </Card>

        <Card icon={<BellRing size={16} />} title="Guideline Watch" count={fresh || undefined} testId="watch"
          empty={!followed.length ? "Follow your specialties to see new guidelines and trials." : watchStale || !lastWatch ? `Not checked ${lastWatch ? `for ${ago(lastWatch).replace(" ago", "")}` : "yet"}.` : `Checked ${ago(lastWatch)}${fresh ? `, ${fresh} new paper${fresh === 1 ? "" : "s"}` : ""}.`}
          action={{ label: followed.length ? (watchStale || !lastWatch ? "Check now" : "Open") : "Choose topics", go: () => go("watch") }} />

        <Card icon={<MessageSquare size={16} />} title="Recent chats" testId="chats" empty="No chats yet." action={{ label: "New chat", go: () => go("chat") }}>
          {chats.length > 0 ? <ul className="cx-td-list">{chats.slice(0, 5).map((c) => <li key={c.id}><button className="cx-td-chat" onClick={() => go("open-chat", c.id)}><span><b>{c.title}</b><small>{ago(c.updatedAt)}</small></span></button></li>)}</ul> : undefined}
        </Card>

        <Card icon={<ClipboardList size={16} />} title="Patient cases" count={activeCases} empty={activeCases ? `${activeCases} active case${activeCases === 1 ? "" : "s"}.` : "No active cases."} action={{ label: "Open cases", go: () => go("cases") }} testId="cases" />
      </div>
      <p className="cx-rs-foot"><CheckSquare size={13} /> Everything here stays on this device.</p>
    </section>
  );
}
