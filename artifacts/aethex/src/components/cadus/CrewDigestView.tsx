/**
 * Crew Summary Digest: your Crew activity over the last week or month (most-used assistants,
 * questions, quiz and drill accuracy, topics to revise, notes, check-ins), to copy or print.
 */
import { useState } from "react";
import { Copy, FileText, Printer } from "lucide-react";
import { digestMd, type Digest } from "@/lib/cadus/crew";

export default function CrewDigestView({ build, onPrint, toast }: { build: (days: number) => Digest; onPrint: (title: string, md: string) => void; toast: (t: string) => void }) {
  const [days, setDays] = useState(7);
  const d = build(days);
  const md = digestMd(d);
  return (
    <section className="cx-page cx-lab cx-digest">
      <header className="cx-page-h"><div><h1>Crew Digest</h1><p>A summary of what you did with Crew: who you asked most, what you asked, how your quizzes and drills went, and what to revise next.</p></div></header>
      <div className="cx-seg" role="tablist">{([[7, "Last 7 days"], [30, "Last 30 days"]] as const).map(([n, l]) => <button key={n} role="tab" aria-selected={days === n} className={days === n ? "on" : ""} onClick={() => setDays(n)} data-dg-days={n}>{l}</button>)}</div>
      <div className="cx-sim-stats cx-cs2-tiles" data-dg="tiles">
        <div><b data-dg="chats">{d.chats}</b><small>chats with assistants</small></div>
        <div><b>{d.quizzes}</b><small>quiz battles{d.quizAccuracy !== null ? ` (${d.quizAccuracy}%)` : ""}</small></div>
        <div><b>{d.drillDays}</b><small>daily drills{d.drillAccuracy !== null ? ` (${d.drillAccuracy}%)` : ""}</small></div>
        <div><b>{d.rounds}</b><small>case rounds</small></div>
        <div><b>{d.checkins}</b><small>check-ins</small></div>
        <div><b>{d.notes.length}</b><small>notes saved</small></div>
      </div>
      {d.topCrew.length > 0 && <><h4>Most-used assistants</h4><ol className="cx-c23-steps" data-dg="top">{d.topCrew.map((t) => <li key={t.name}>{t.name}: {t.n} chat{t.n === 1 ? "" : "s"}</li>)}</ol></>}
      {d.weak.length > 0 && <><h4>Topics to revise</h4><ul data-dg="weak">{d.weak.map((w) => <li key={w.topic}>{w.topic}: {w.pct}% right</li>)}</ul></>}
      {d.questions.length > 0 && <><h4>Recent questions</h4><ul data-dg="questions">{d.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></>}
      {!d.chats && !d.quizzes && !d.drillDays && <p className="cx-set-hint"><FileText size={13} /> Nothing yet in this period: chat with an assistant, play a quiz or do a daily drill.</p>}
      <div className="cx-sc-acts">
        <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md); toast("Digest copied"); }} data-dg="copy"><Copy size={14} /> Copy</button>
        <button className="cx-btn" onClick={() => onPrint("Crew digest", md)} data-dg="print"><Printer size={14} /> Print or PDF</button>
      </div>
    </section>
  );
}
