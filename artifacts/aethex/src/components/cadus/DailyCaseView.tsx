/**
 * Daily Clinical Case: one case a day with five questions, answered one at a time with the
 * explanation after each, a streak for days in a row, and a score to share with your batch.
 */
import { useEffect, useState } from "react";
import { CalendarDays, Check, Flame, Lightbulb, Loader2, MessageCircle, Share2, Sparkles, Stethoscope, Trophy, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { dayDone, dayScore, readDaily, saveDaily, shareText, streak, todayKey, type DailyDay } from "@/lib/cadus/clinic20";

const LEVELS = [{ id: "mbbs", label: "MBBS" }, { id: "intern", label: "Intern" }, { id: "pg", label: "PG / NEET-PG" }];
const SPECIALTIES = ["Any", "Medicine", "Surgery", "Paediatrics", "Obstetrics and gynaecology", "Emergency", "Cardiology", "Neurology", "Infectious diseases", "Pharmacology", "Pathology", "Radiology", "Dermatology", "Psychiatry", "Orthopaedics", "ENT", "Ophthalmology", "Community medicine", "Forensic medicine"];

export default function DailyCaseView({ generate, friendlyError, toast, onAsk, defaultLevel }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onAsk: (q: string) => void;
  defaultLevel: string;
}) {
  const today = todayKey();
  const [days, setDays] = useState<DailyDay[]>(readDaily);
  const [level, setLevel] = useState(LEVELS.some((l) => l.id === defaultLevel) ? defaultLevel : "mbbs");
  const [specialty, setSpecialty] = useState("Any");
  const [busy, setBusy] = useState(false);
  const [viewDate, setViewDate] = useState(today);
  useEffect(() => saveDaily(days), [days]);
  const day = days.find((d) => d.date === viewDate) ?? null;
  const n = streak(days, today);
  const done = days.filter(dayDone);
  const avg = done.length ? Math.round((done.reduce((s, d) => s + dayScore(d) / d.c.questions.length, 0) / done.length) * 100) : 0;

  const load = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "daily-case", date: today, level, specialty: specialty === "Any" ? "" : specialty, avoid: days.slice(0, 14).map((d) => d.c.title) });
      if (!r?.result) throw new Error("No case came back");
      const d: DailyDay = { date: today, level, c: r.result, answers: r.result.questions.map(() => null) };
      setDays((l) => [d, ...l.filter((x) => x.date !== today)]);
      setViewDate(today);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const answer = (qi: number, oi: number) => {
    if (!day || day.answers[qi] !== null) return;
    setDays((l) => l.map((d) => (d.date === day.date ? { ...d, answers: d.answers.map((a, i) => (i === qi ? oi : a)) } : d)));
  };
  const share = async () => {
    if (!day) return;
    const t = shareText(day, n);
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) { try { await nav.share({ text: t }); return; } catch { /* closed */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, "_blank", "noopener");
  };

  const next = day ? day.answers.findIndex((a) => a === null) : -1;
  const finished = day ? dayDone(day) : false;
  return (
    <section className="cx-page cx-lab cx-daily">
      <header className="cx-page-h"><div><h1>Daily Clinical Case</h1><p>One new case every day with five questions: diagnosis, investigation, interpretation, management and what comes next. Keep your streak going and share your score with your batch.</p></div></header>
      <div className="cx-sim-stats" data-daily="stats">
        <div><b><Flame size={16} /> {n}</b><small>day streak</small></div>
        <div><b>{done.length}</b><small>cases done</small></div>
        <div><b>{avg}%</b><small>average</small></div>
      </div>

      {!day ? (
        viewDate === today && (
          <div className="cx-daily-start">
            <div className="cx-mr-pt">
              <div className="cx-field"><span>Your level</span><div className="cx-seg">{LEVELS.map((l) => <button key={l.id} className={level === l.id ? "on" : ""} onClick={() => setLevel(l.id)}>{l.label}</button>)}</div></div>
              <label className="cx-field"><span>Specialty</span><select className="cx-select" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></label>
            </div>
            <button className="cx-btn primary" onClick={() => void load()} disabled={busy} data-daily="start">{busy ? <><Loader2 size={15} className="cx-rot" /> Preparing today's case…</> : <><Stethoscope size={15} /> Today's case</>}</button>
          </div>
        )
      ) : (
        <div className="cx-daily-case" data-daily="case">
          <div className="cx-daily-h"><span><CalendarDays size={14} /> {new Date(`${day.date}T00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>{day.c.specialty && <span>{day.c.specialty}</span>}</div>
          <h2>{day.c.title}</h2>
          <div className="cx-sc-note"><MdBlock text={day.c.stem} /></div>
          <ol className="cx-daily-qs">
            {day.c.questions.map((q, qi) => {
              const a = day.answers[qi];
              if (qi > next && next !== -1) return null;
              return (
                <li key={qi} data-daily-q={qi}>
                  <p className="cx-daily-q"><b>Q{qi + 1}.</b> {q.q}</p>
                  <div className="cx-daily-opts">
                    {q.options.map((o, oi) => {
                      const cls = a === null ? "" : oi === q.answer ? "right" : oi === a ? "wrong" : "dim";
                      return <button key={oi} className={cls} onClick={() => answer(qi, oi)} disabled={a !== null} data-daily-opt={oi}><span>{"ABCD"[oi]}</span>{o}{a !== null && oi === q.answer && <Check size={14} />}{a === oi && oi !== q.answer && <X size={14} />}</button>;
                    })}
                  </div>
                  {a !== null && <p className={`cx-daily-ex ${a === q.answer ? "ok" : "no"}`}>{a === q.answer ? "Right. " : `The answer is ${"ABCD"[q.answer]}. `}{q.explain}</p>}
                </li>
              );
            })}
          </ol>
          {finished && (
            <div className="cx-daily-done" data-daily="done">
              <Trophy size={20} /><div><b>{dayScore(day)} / {day.c.questions.length}</b><small>{n > 1 ? `${n}-day streak. See you tomorrow.` : "Come back tomorrow to start a streak."}</small></div>
              {day.c.pearl && <p className="cx-daily-pearl"><Lightbulb size={14} /> {day.c.pearl}</p>}
              <div className="cx-sc-acts">
                <button className="cx-btn primary" onClick={() => void share()} data-daily="share"><Share2 size={14} /> Share with your batch</button>
                <button className="cx-btn" onClick={() => onAsk(`Teach me the topic of this case in depth for exams: ${day.c.title}. The case: ${day.c.stem.slice(0, 1500)}`)}><MessageCircle size={14} /> Learn more about this</button>
              </div>
            </div>
          )}
        </div>
      )}

      {days.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Past cases</span></p>
          {days.slice(0, 30).map((d) => (
            <button key={d.date} className={`cx-sc-row ${d.date === viewDate ? "on" : ""}`} onClick={() => setViewDate(d.date)}>
              <b>{d.date === today ? "Today: " : ""}{d.c.title}</b><small>{d.date} · {dayDone(d) ? `${dayScore(d)}/${d.c.questions.length}` : "not finished"}{d.c.specialty ? ` · ${d.c.specialty}` : ""}</small>
            </button>
          ))}
          {viewDate !== today && !days.some((d) => d.date === today) && <button className="cx-btn" onClick={() => setViewDate(today)}><Sparkles size={14} /> Today's case</button>}
        </div>
      )}
    </section>
  );
}
