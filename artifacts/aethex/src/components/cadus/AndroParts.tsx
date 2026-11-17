/**
 * Cadus Andro (update 108): the three parts that connect the work-up into one journey.
 *   AndroAsk       Cadus AI inside Andro. It is given his own record (intake, results judged by the rules, the plan,
 *                  the referral status and his progress), so it never asks for case details. Every answer shows what
 *                  it used from the record. The ready questions still work from the rules when the AI is off.
 *   AndroJourney   Referral, booking, specialist visit, repeat test and close, tracked to completion.
 *   AndroProgress  Repeat reports side by side, with what he changed in between, in a table and in plain words.
 * Rules: lib/cadus/andro.ts. Nothing here stores or sends a name.
 */
import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, CalendarPlus, Check, CircleDashed, ClipboardCopy, Clock, Download, Eye, FileText, Loader2, Lock, MessageCircleQuestion, Plus, Send, ShieldCheck, Siren, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import {
  CHANGES, isoDay, niceDate, progressLines, referralLetter, SAME_BAND, STARTERS, urgentIn,
  type AndroCase, type AskAnswer, type ChangeKey, type Journey, type JourneyStatus, type Progress, type Qa, type Report, type Result, type SemenValues, type StarterKind, type Trend,
} from "@/lib/cadus/andro";

export function saveText(name: string, text: string, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function icsEvent(iso: string, summary: string, description: string): string {
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cadus//Andro//EN", "BEGIN:VEVENT", `UID:andro-${Date.now()}@cadus.aethex.in`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${iso.replace(/-/g, "")}`, `SUMMARY:${esc(summary)}`, `DESCRIPTION:${esc(description)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

const DOCTOR_STARTERS = ["Which causes fit this pattern and history?", "What is missing from this work-up?", "What should I check before the repeat test?"];
const strings = (v: unknown, n: number) => (Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, n) : []);

export function AndroAsk({ audience, lang, record, locked, ai, setAi, items, onAdd, generate, friendlyError, toast, fallback }: {
  audience: "patient" | "doctor";
  lang: "en" | "hi";
  /** His record as text (no name). Shown to the user on request, and the only case data sent with a question. */
  record: string;
  /** Patient view before the doctor has signed off. */
  locked: boolean;
  ai: boolean;
  setAi: (v: boolean) => void;
  items: Qa[];
  onAdd: (q: Qa) => void;
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  fallback: (kind: StarterKind) => AskAnswer;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const patient = audience === "patient";
  const L = (en: string, hi: string) => (patient && lang === "hi" ? hi : en);

  const ask = async (q: string, kind?: StarterKind) => {
    const question = q.trim().slice(0, 500);
    if (!question || busy) return;
    const add = (a: AskAnswer, by: Qa["by"]) => onAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now(), q: question, lang, a, by, reviewed: false });
    if (!ai) {
      if (kind) add(fallback(kind), "rules");
      else toast(L("Turn on Cadus AI above to ask your own question. The ready questions work without it.", "Apna sawaal poochhne ke liye upar Cadus AI chaalu karein. Taiyaar sawaal iske bina bhi chalte hain."));
      return;
    }
    setBusy(true);
    try {
      const res = await generate({ action: "andro-ask", audience, language: patient && lang === "hi" ? "Hinglish" : "English", record, question, history: items.slice(-4).map((x) => ({ q: x.q, a: x.a.answer })) });
      const a = res?.result;
      if (!a || typeof a.answer !== "string" || !a.answer.trim()) throw new Error("Couldn't answer that this time. Please try again.");
      add({ answer: a.answer.trim(), basis: a.basis === "general" ? "general" : "record", used: strings(a.used, 4), nextSteps: strings(a.nextSteps, 3), askDoctor: String(a.askDoctor ?? "").trim(), urgent: a.urgent === true }, "ai");
      setText("");
    } catch (e) {
      const msg = friendlyError(e instanceof Error ? e.message : String(e));
      if (kind) { add(fallback(kind), "rules"); toast(`${msg} ${L("Answered from the rules instead.", "Jawab rules se diya gaya hai.")}`); }
      else toast(msg);
    } finally { setBusy(false); }
  };

  if (locked) {
    return (
      <div className="cx-andro-locked" data-andro="ask-locked"><Lock size={18} /><div><b>{L("Questions open after the doctor signs off", "Doctor ke sign-off ke baad sawaal poochh sakte hain")}</b><p>{L("Cadus answers from the plan your doctor has reviewed, so it waits for the sign-off.", "Cadus wahi plan samjhata hai jo doctor ne dekh liya ho, isliye sign-off ka intezaar hai.")}</p></div></div>
    );
  }

  return (
    <div className={`cx-andro-ask ${audience}`} data-andro={`ask-${audience}`}>
      <div className="cx-andro-ask-h">
        <MessageCircleQuestion size={18} />
        <div>
          <b>{patient ? L("Ask Cadus about your report", "Apni report ke baare mein Cadus se poochhein") : "Ask Cadus about this case"}</b>
          <p>{patient ? L("Cadus already has your answers and your results. You don't need to type them again.", "Cadus ke paas aapke jawab aur report pehle se hain. Dobara likhne ki zaroorat nahi.") : "Cadus is given this intake, the judged values, the plan, the referral status and his reports. It will not ask for them."}</p>
        </div>
      </div>

      <div className="cx-andro-consent">
        <label className="cx-pa-mine"><input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} data-andro="ai-consent" /> {L("Let Cadus AI read this case to answer (no name is sent)", "Jawab dene ke liye Cadus AI ko yeh case padhne dein (naam nahi bheja jata)")}</label>
        <details>
          <summary><Eye size={13} /> {L("See exactly what is sent", "Dekhein ki kya bheja jata hai")}</summary>
          <pre data-andro="record">{record}</pre>
          <p>{L("Only this text and your question are sent, and only when you ask. It is not kept after the answer. Turn the switch off and nothing is sent.", "Sirf yeh text aur aapka sawaal bheja jata hai, aur tabhi jab aap poochhein. Jawab ke baad ise rakha nahi jata. Switch band karne par kuch nahi bheja jata.")}</p>
        </details>
      </div>

      <div className="cx-andro-chips">
        {patient
          ? STARTERS.map((s) => <button key={s.kind} disabled={busy} onClick={() => ask(lang === "hi" ? s.hi : s.en, s.kind)} data-andro-q={s.kind}>{lang === "hi" ? s.hi : s.en}</button>)
          : DOCTOR_STARTERS.map((s) => <button key={s} disabled={busy} onClick={() => ask(s)}>{s}</button>)}
      </div>

      {items.length > 0 && (
        <ol className="cx-andro-thread" data-andro="thread">
          {items.map((x) => {
            const warn = urgentIn(x.q, x.lang);
            const hi = patient && x.lang === "hi";
            return (
              <li key={x.id}>
                <p className="q">{x.q}</p>
                <div className="a">
                  {(warn || x.a.urgent) && <p className="urgent"><Siren size={15} /> {warn || (hi ? "Yeh zaroori ho sakta hai. Aaj hi doctor se milein." : "This may be urgent. See a doctor today.")}</p>}
                  <p className="tags">
                    <span className={x.a.basis}>{x.a.basis === "record" ? (patient ? (hi ? "Aapki report se" : "From your report") : "From this record") : (hi ? "Aam jaankari" : "General information")}</span>
                    <span>{x.by === "ai" ? "Cadus AI" : (hi ? "Rules se, bina AI" : "From the rules, no AI")}</span>
                    {x.reviewed && <span className="ok"><Check size={11} /> {hi ? "Doctor ne dekha" : "Seen by the doctor"}</span>}
                  </p>
                  {x.a.answer.split(/\n+/).filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
                  {x.a.used.length > 0 && <div className="used"><small>{patient ? (hi ? "Aapki report se liya gaya" : "Taken from your report") : "Taken from the record"}</small><ul>{x.a.used.map((u) => <li key={u}>{u}</li>)}</ul></div>}
                  {x.a.nextSteps.length > 0 && <div className="next"><small>{hi ? "Agle surakshit kadam" : "Safe next steps"}</small><ul>{x.a.nextSteps.map((u) => <li key={u}>{u}</li>)}</ul></div>}
                  {x.a.askDoctor && <p className="doc"><b>{patient ? (hi ? "Doctor se poochhein:" : "Ask your doctor:") : "Decide:"}</b> {x.a.askDoctor}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <form className="cx-andro-askbar" onSubmit={(e) => { e.preventDefault(); void ask(text); }}>
        <input className="cx-input" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={patient ? L("Type your question, for example: can this improve?", "Apna sawaal likhein, jaise: kya yeh theek ho sakta hai?") : "Ask about this case"} data-andro="ask-input" />
        <button className="cx-btn primary" type="submit" disabled={busy || !text.trim()} data-andro="ask-send">{busy ? <Loader2 size={14} className="cx-rot" /> : <Send size={14} />} {busy ? L("Reading your report…", "Report padh raha hai…") : L("Ask", "Poochhein")}</button>
      </form>
      <p className="cx-andro-fine"><ShieldCheck size={12} /> {patient
        ? L("Cadus explains the plan your doctor signed. It does not change a result, give a diagnosis or start a medicine. Your doctor can see these questions.", "Cadus wahi plan samjhata hai jo doctor ne sign kiya hai. Yeh result nahi badalta, diagnosis nahi deta aur dawa shuru nahi karta. Aapke doctor yeh sawaal dekh sakte hain.")
        : "Decision support. It cannot change a value, a limit or the pattern; those come from the rules."}</p>
    </div>
  );
}

const STATE_ICON = { done: Check, now: ArrowRight, late: TriangleAlert, todo: CircleDashed, skip: CircleDashed } as const;
const STATE_WORD = { done: "Done", now: "Due now", late: "Overdue", todo: "Later", skip: "Not needed" } as const;

export function AndroJourney({ j, setJ, status, c, r, note, signed, toast, onOpenProgress }: {
  j: Journey;
  setJ: (next: Journey) => void;
  status: JourneyStatus;
  c: AndroCase;
  r: Result;
  note: string;
  signed: boolean;
  toast: (t: string) => void;
  onOpenProgress: () => void;
}) {
  const today = isoDay();
  const set = (patch: Partial<Journey>) => setJ({ ...j, ...patch });
  const needRef = status.stages[0].state !== "skip";
  const letter = () => referralLetter(c, r, j, note, today);
  const copyLetter = async () => { try { await navigator.clipboard.writeText(letter()); toast("Referral letter copied (no name in it)"); } catch { toast("Couldn't copy"); } };
  const pct = status.total ? Math.round((status.done / status.total) * 100) : 0;

  const controls = (key: string) => {
    if (key === "referral" && needRef) return (
      <div className="cx-andro-jrow">
        <label className="cx-field"><span>Refer to</span><select className="cx-input" value={j.specialist} onChange={(e) => set({ specialist: e.target.value as Journey["specialist"] })}><option value="urologist">Urologist</option><option value="andrologist">Andrologist</option></select></label>
        <label className="cx-field"><span>Referred on</span><input className="cx-input" type="date" max={today} value={j.referredOn} onChange={(e) => set({ referredOn: e.target.value })} data-andro="referred-on" /></label>
        {!j.referredOn && <button className="cx-btn primary" onClick={() => set({ referredOn: today })} data-andro="refer-today">Mark referred today</button>}
        <button className="cx-btn" disabled={!signed} onClick={copyLetter} data-andro="letter-copy"><ClipboardCopy size={14} /> Copy letter</button>
        <button className="cx-btn" disabled={!signed} onClick={() => saveText("referral-letter.txt", letter())} data-andro="letter-save"><FileText size={14} /> Download letter</button>
        {!signed && <small>Sign off the doctor summary to release the referral letter.</small>}
      </div>
    );
    if (key === "booked" && needRef) return (
      <div className="cx-andro-jrow">
        <label className="cx-field"><span>Appointment date</span><input className="cx-input" type="date" value={j.bookedFor} onChange={(e) => set({ bookedFor: e.target.value })} data-andro="booked-for" /></label>
        <label className="cx-field grow"><span>Clinic or hospital (optional)</span><input className="cx-input" value={j.clinic} maxLength={80} onChange={(e) => set({ clinic: e.target.value })} placeholder="For example: Urology OPD" /></label>
        {j.bookedFor && <button className="cx-btn" onClick={() => saveText("specialist-appointment.ics", icsEvent(j.bookedFor, `${j.specialist === "andrologist" ? "Andrologist" : "Urologist"} appointment`, `Bring your semen reports and the referral letter.${j.clinic.trim() ? ` ${j.clinic.trim()}.` : ""} Reminder from Cadus Andro.`), "text/calendar")} data-andro="booked-ics"><CalendarPlus size={14} /> Add to calendar</button>}
      </div>
    );
    if (key === "seen" && needRef) return (
      <div className="cx-andro-jrow">
        <label className="cx-field"><span>Seen on</span><input className="cx-input" type="date" max={today} value={j.seenOn} onChange={(e) => set({ seenOn: e.target.value })} data-andro="seen-on" /></label>
        <label className="cx-field grow"><span>What the specialist found and decided</span><input className="cx-input" value={j.outcome} maxLength={300} onChange={(e) => set({ outcome: e.target.value })} placeholder="Findings, tests ordered, treatment started, next review" data-andro="outcome" /></label>
      </div>
    );
    if (key === "repeat" && status.stages[3].state !== "skip") return (
      <div className="cx-andro-jrow">
        <button className="cx-btn" onClick={onOpenProgress} data-andro="open-progress"><Plus size={14} /> {status.stages[3].state === "done" ? "See progress" : "Add the repeat report"}</button>
        {status.repeatDue && status.stages[3].state !== "done" && <button className="cx-btn" onClick={() => saveText("repeat-semen-analysis.ics", icsEvent(status.repeatDue, "Repeat semen analysis", "Repeat semen analysis (after 2 to 7 days without ejaculation). Reminder from Cadus Andro."), "text/calendar")}><CalendarPlus size={14} /> Add to calendar</button>}
      </div>
    );
    if (key === "closed") return (
      <div className="cx-andro-jrow">
        <label className="cx-field grow"><span>Closing note</span><input className="cx-input" value={j.closeNote} maxLength={200} onChange={(e) => set({ closeNote: e.target.value })} placeholder="For example: improved, under urologist care, or moved to a fertility centre" data-andro="close-note" /></label>
        {j.closedOn
          ? <button className="cx-btn" onClick={() => set({ closedOn: "" })}>Reopen</button>
          : <button className="cx-btn primary" onClick={() => { set({ closedOn: today }); toast("Follow-up closed"); }} data-andro="close">Close the follow-up</button>}
      </div>
    );
    return null;
  };

  return (
    <div className="cx-andro-card" data-andro="journey">
      <div className="cx-andro-jhead">
        <div>
          <b data-andro="journey-count">{status.complete ? "Follow-up closed" : `${status.done} of ${status.total} steps done`}</b>
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ width: `${pct}%` }} /></div>
        </div>
        {status.next && <p className={status.stages.some((s) => s.state === "late") ? "late" : ""} data-andro="journey-next"><Clock size={14} /> <span><b>Next:</b> {status.next}</span></p>}
      </div>
      {status.reasons.length > 0 && <p className="cx-andro-why"><b>Why refer:</b> {status.reasons.join("; ")}.</p>}
      <ol className="cx-andro-stages">
        {status.stages.map((s) => {
          const Icon = STATE_ICON[s.state];
          return (
            <li key={s.key} className={s.state} data-andro-stage={s.key} data-state={s.state}>
              <span className="dot"><Icon size={14} /></span>
              <div>
                <p className="t"><b>{s.title}</b><em>{STATE_WORD[s.state]}</em></p>
                <p className="d">{s.detail}</p>
                {controls(s.key)}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="cx-andro-fine"><Lock size={12} /> Dates and the clinic name stay on this device. The referral letter has no name in it: add it by hand when you send it.</p>
    </div>
  );
}

const FORM_KEYS: { key: keyof SemenValues; label: string }[] = [
  { key: "volume", label: "Volume (mL)" }, { key: "concentration", label: "Concentration (million/mL)" }, { key: "motility", label: "Total motility (%)" },
  { key: "progressive", label: "Progressive (%)" }, { key: "morphology", label: "Normal forms (%)" }, { key: "total", label: "Total number (million, optional)" },
];
const blank = (): SemenValues => ({ volume: "", concentration: "", total: "", motility: "", progressive: "", morphology: "", vitality: "", ph: "" });

function Spark({ t }: { t: Trend }) {
  const pts = t.points.map((p, i) => ({ i, v: p.value })).filter((p) => p.v !== null) as { i: number; v: number }[];
  if (pts.length < 2) return <span className="cx-andro-nospark">–</span>;
  const W = 108, H = 34, pad = 5;
  const top = Math.max(t.low, ...pts.map((p) => p.v)) * 1.15 || 1;
  const n = t.points.length - 1 || 1;
  const x = (i: number) => pad + (i / n) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / top) * (H - pad * 2);
  const last = pts[pts.length - 1];
  return (
    <svg className="cx-andro-spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`${t.label}: ${pts.map((p) => p.v).join(", ")}. WHO limit ${t.low}.`}>
      <line x1={pad} x2={W - pad} y1={y(t.low)} y2={y(t.low)} className="lim" />
      <polyline points={pts.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")} className="ln" />
      {pts.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={p === last ? 3.4 : 2.4} className={p.v < t.low ? "lo" : "ok"} />)}
    </svg>
  );
}

export function AndroProgress({ reports, p, current, currentEntered, onAdd, onRemove, lang, setLang, signed, toast }: {
  reports: Report[];
  p: Progress;
  current: SemenValues;
  currentEntered: boolean;
  onAdd: (rep: Report) => void;
  onRemove: (id: string) => void;
  lang: "en" | "hi";
  setLang: (l: "en" | "hi") => void;
  signed: boolean;
  toast: (t: string) => void;
}) {
  const [date, setDate] = useState(isoDay());
  const [vals, setVals] = useState<SemenValues>(blank());
  const [changes, setChanges] = useState<ChangeKey[]>([]);
  const [medicine, setMedicine] = useState("");
  const first = reports.length === 0;
  const setV = (k: keyof SemenValues, v: string) => setVals((x) => ({ ...x, [k]: v.replace(/[^\d.,]/g, "").slice(0, 6) }));
  const add = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast("Add the report date"); return; }
    if (!FORM_KEYS.some((f) => vals[f.key].trim())) { toast("Add at least one value from the report"); return; }
    if (reports.some((x) => x.date === date)) { toast("There is already a report for that date. Remove it first to replace it."); return; }
    onAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date, semen: vals, changes: first ? [] : changes, medicine: first ? "" : medicine.trim().slice(0, 120) });
    setVals(blank()); setChanges([]); setMedicine(""); setDate(isoDay());
  };
  const lines = progressLines(p, lang);

  return (
    <div className="cx-andro-card" data-andro="progress">
      {p.reports.length > 0 && (
        <div className="cx-andro-scroll">
          <table className="cx-andro-table cx-andro-ptable" data-andro="progress-table">
            <thead><tr><th>Parameter</th>{p.reports.map((x, i) => <th key={x.id}>{niceDate(x.date)}<small>{i === 0 ? "First report" : i === p.reports.length - 1 ? "Latest" : "Repeat"}</small></th>)}<th>Change</th><th>Trend</th></tr></thead>
            <tbody>
              {p.trends.map((t) => (
                <tr key={t.key} data-andro-trend={t.key} data-direction={t.direction ?? ""}>
                  <td>{t.label}{t.unit ? <small> {t.unit}</small> : null}<small className="lim">WHO limit {t.low}</small></td>
                  {t.points.map((pt, i) => <td key={i} className={pt.value !== null && pt.value < t.low ? "lo" : ""}>{pt.value ?? "–"}</td>)}
                  <td>{t.direction === null ? "–" : (
                    <span className={`chg ${t.direction}${t.crossed ? ` ${t.crossed}` : ""}`}>
                      {t.direction === "up" ? <ArrowUpRight size={13} /> : t.direction === "down" ? <ArrowDownRight size={13} /> : <ArrowRight size={13} />}
                      {t.direction === "same" ? "About the same" : `${t.pct !== null ? `${t.pct > 0 ? "+" : ""}${t.pct}%` : t.direction === "up" ? "Up" : "Down"}${t.crossed === "into" ? ", now within range" : t.crossed === "out" ? ", now below range" : ""}`}
                    </span>
                  )}</td>
                  <td><Spark t={t} /></td>
                </tr>
              ))}
              <tr className="acts"><td>What changed before it</td>{p.reports.map((x, i) => (
                <td key={x.id}>
                  {i === 0 ? <small>Starting point</small> : <small>{[...CHANGES.filter((k) => x.changes.includes(k.key)).map((k) => k.label), x.medicine.trim() && `Medicine: ${x.medicine.trim()}`].filter(Boolean).join("; ") || "Nothing recorded"}</small>}
                  <button className="cx-btn ghost" onClick={() => onRemove(x.id)} aria-label={`Remove the report of ${niceDate(x.date)}`}><Trash2 size={12} /> Remove</button>
                </td>
              ))}<td colSpan={2} /></tr>
            </tbody>
          </table>
        </div>
      )}

      {p.reports.length > 0 && (
        <div className="cx-andro-plain" data-andro="progress-plain">
          <div className="h">
            <b><Sparkles size={14} /> In plain words</b>
            <div className="cx-andro-lang" role="group" aria-label="Language"><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button><button className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")}>Hinglish</button></div>
          </div>
          {lines.map((l) => <p key={l}>{l}</p>)}
          <p className="cx-andro-fine">{signed ? <><BadgeCheck size={12} /> Shown to him on the Patient explainer step, because the current report is signed off.</> : <><Lock size={12} /> Shown to him only after the doctor signs off the current report.</>} Changes under {Math.round(SAME_BAND * 100)}% are shown as "about the same" because results vary between samples (a display rule).</p>
        </div>
      )}

      <h4>{first ? "Save the first report" : "Add a repeat report"}</h4>
      <div className="cx-andro-jrow">
        <label className="cx-field"><span>Report date</span><input className="cx-input" type="date" max={isoDay()} value={date} onChange={(e) => setDate(e.target.value)} data-andro="report-date" /></label>
        <button className="cx-btn" disabled={!currentEntered} onClick={() => setVals({ ...blank(), ...current })} data-andro="fill-current">Fill from the Reports step</button>
      </div>
      <div className="cx-andro-grid">
        {FORM_KEYS.map((f) => <label key={f.key} className="cx-field"><span>{f.label}</span><input className="cx-input" inputMode="decimal" value={vals[f.key]} onChange={(e) => setV(f.key, e.target.value)} data-andro-new={f.key} /></label>)}
      </div>
      {!first && (
        <>
          <h4>What changed before this report <small>(habits, medicine, a procedure)</small></h4>
          <div className="cx-andro-ticks">{CHANGES.map((k) => <label key={k.key} className={`cx-pa-mine ${changes.includes(k.key) ? "on" : ""}`}><input type="checkbox" checked={changes.includes(k.key)} onChange={(e) => setChanges((x) => (e.target.checked ? [...x, k.key] : x.filter((y) => y !== k.key)))} data-andro-change={k.key} /> {k.label}</label>)}</div>
          {changes.includes("medicine") && <label className="cx-field"><span>Medicine (as prescribed by the doctor)</span><input className="cx-input" value={medicine} maxLength={120} onChange={(e) => setMedicine(e.target.value)} placeholder="Name and how long" data-andro="medicine" /></label>}
        </>
      )}
      <div className="cx-andro-next"><button className="cx-btn primary" onClick={add} data-andro="add-report"><Plus size={14} /> {first ? "Save as the first report" : "Add this report"}</button></div>
      <p className="cx-andro-fine"><Download size={12} /> The newest report becomes the current one: the doctor summary is worked out again and needs a new sign-off before he sees it.</p>
    </div>
  );
}

export const PARTS_CSS = `
.cx-andro-ask{display:flex;flex-direction:column;gap:10px;margin-top:14px;padding:14px 16px;border:1px solid #cfe6e1;border-radius:14px;background:#f5faf9}
.cx-andro-ask.doctor{background:var(--surface);border-color:var(--line)}
.cx-andro-ask-h{display:flex;gap:10px;align-items:flex-start;color:#1f5e57}
.cx-andro-ask-h b{color:var(--text);font-size:15px}.cx-andro-ask-h p{margin:2px 0 0;color:var(--t2);font-size:13px}
.cx-andro-consent{display:flex;flex-direction:column;gap:6px;font-size:13px}
.cx-andro-consent details summary{display:inline-flex;align-items:center;gap:5px;color:#1f5e57;font-weight:600;cursor:pointer}
.cx-andro-consent pre{max-height:220px;overflow:auto;margin:8px 0 4px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap}
.cx-andro-consent details p{margin:0;color:var(--t2);font-size:12.5px}
.cx-andro-chips{display:flex;flex-wrap:wrap;gap:6px}
.cx-andro-chips button{padding:7px 12px;border:1px solid #bcdcd6;border-radius:999px;background:var(--surface);color:#1f5e57;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.cx-andro-chips button:hover{background:#e6f2ef}.cx-andro-chips button:disabled{opacity:.55;cursor:default}
.cx-andro-thread{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.cx-andro-thread .q{align-self:flex-end;max-width:85%;margin:0 0 6px auto;padding:8px 12px;border-radius:12px 12px 2px 12px;background:#1f5e57;color:#fff;font-size:14px;width:fit-content}
.cx-andro-thread .a{padding:12px 14px;border:1px solid var(--line);border-radius:2px 12px 12px 12px;background:var(--surface);font-size:14.5px;line-height:1.55}
.cx-andro-thread .a p{margin:0 0 8px}.cx-andro-thread .a p:last-child{margin-bottom:0}
.cx-andro-thread .tags{display:flex;flex-wrap:wrap;gap:6px}
.cx-andro-thread .tags span{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:6px;background:var(--line);color:var(--t2);font-size:11.5px;font-weight:700}
.cx-andro-thread .tags .record{background:#dcf2e7;color:#166534}.cx-andro-thread .tags .general{background:#e7ecf5;color:#334a7d}.cx-andro-thread .tags .ok{background:#e6f2ef;color:#1f5e57}
.cx-andro-thread .urgent{display:flex;gap:6px;align-items:flex-start;padding:8px 10px;border-radius:8px;background:#fff1f1;color:#b91c1c;font-weight:700}
.cx-andro-thread .used,.cx-andro-thread .next{margin:8px 0;padding:8px 10px;border-radius:8px;background:var(--bg,#f7f8f8)}
.cx-andro-thread .next{background:#eef6f4}
.cx-andro-thread small{display:block;margin-bottom:3px;color:var(--t3);font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.cx-andro-thread ul{margin:0;padding-left:18px;font-size:13.5px}
.cx-andro-thread .doc{padding-top:6px;border-top:1px dashed var(--line);color:var(--t2);font-size:13.5px}
.cx-andro-askbar{display:flex;gap:8px}.cx-andro-askbar .cx-input{flex:1;min-width:0}
.cx-andro-ask .cx-andro-fine,.cx-andro-card>.cx-andro-fine{display:flex;gap:5px;align-items:flex-start}
.cx-andro-ask .cx-andro-fine svg,.cx-andro-card .cx-andro-fine svg{flex:none;margin-top:2px}
.cx-andro-jhead{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.cx-andro-jhead>div{flex:1;min-width:200px}.cx-andro-jhead b{font-size:15px}
.cx-andro-jhead .bar{height:8px;margin-top:6px;border-radius:999px;background:var(--line);overflow:hidden}
.cx-andro-jhead .bar i{display:block;height:100%;border-radius:999px;background:#1f5e57;transition:width .25s}
.cx-andro-jhead p{flex:1.4;min-width:240px;display:flex;gap:6px;align-items:flex-start;margin:0;padding:9px 12px;border-radius:10px;background:#eef6f4;color:#1f5e57;font-size:13.5px}
.cx-andro-jhead p svg{flex:none;margin-top:2px}
.cx-andro-jhead p.late{background:#fff4ec;color:#9a3412}
.cx-andro-why{margin:8px 0 0;font-size:13.5px;color:var(--t2)}
.cx-andro-stages{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column}
.cx-andro-stages li{position:relative;display:flex;gap:12px;padding:0 0 16px}
.cx-andro-stages li:not(:last-child)::before{content:"";position:absolute;left:12px;top:26px;bottom:0;width:2px;background:var(--line)}
.cx-andro-stages li.done:not(:last-child)::before{background:#9fd0c6}
.cx-andro-stages .dot{display:grid;place-items:center;flex:none;width:26px;height:26px;border-radius:50%;background:var(--line);color:var(--t2)}
.cx-andro-stages li.done .dot{background:#1f5e57;color:#fff}.cx-andro-stages li.now .dot{background:#e6f2ef;color:#1f5e57;box-shadow:0 0 0 2px #1f5e57}
.cx-andro-stages li.late .dot{background:#ffedd5;color:#c2410c;box-shadow:0 0 0 2px #c2410c}
.cx-andro-stages li.skip{opacity:.6}
.cx-andro-stages li>div{flex:1;min-width:0}
.cx-andro-stages .t{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:2px 0 0;font-size:14.5px}
.cx-andro-stages .t em{font-style:normal;font-size:11.5px;font-weight:700;padding:1px 8px;border-radius:6px;background:var(--line);color:var(--t2)}
.cx-andro-stages li.done .t em{background:#dcf2e7;color:#166534}.cx-andro-stages li.now .t em{background:#e6f2ef;color:#1f5e57}.cx-andro-stages li.late .t em{background:#ffedd5;color:#9a3412}
.cx-andro-stages .d{margin:3px 0 0;color:var(--t2);font-size:13.5px;line-height:1.5}
.cx-andro-jrow{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-top:8px}
.cx-andro-jrow .cx-field{min-width:150px}.cx-andro-jrow .cx-field.grow{flex:1;min-width:220px}
.cx-andro-jrow small{flex-basis:100%;color:var(--t3);font-size:12px}
.cx-andro-scroll{overflow-x:auto}
.cx-andro-ptable{margin-top:0}
.cx-andro-ptable th small{display:block;font-weight:400;opacity:.8;font-size:11px}
.cx-andro-ptable td small{color:var(--t3);font-size:11.5px}.cx-andro-ptable td small.lim{display:block}
.cx-andro-ptable td.lo{color:#b91c1c;font-weight:700;background:#fff6f6}
.cx-andro-ptable .chg{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:6px;font-size:12.5px;font-weight:700;background:var(--line);color:var(--t2);white-space:nowrap}
.cx-andro-ptable .chg.up{background:#dcf2e7;color:#166534}.cx-andro-ptable .chg.down{background:#fde2e2;color:#b91c1c}
.cx-andro-ptable tr.acts td{vertical-align:top;border-bottom:0}.cx-andro-ptable tr.acts small{display:block;margin-bottom:4px}
.cx-andro-ptable tr.acts .cx-btn{padding:2px 8px;font-size:12px}
.cx-andro-spark .lim{stroke:#9aa7a5;stroke-width:1;stroke-dasharray:3 3}
.cx-andro-spark .ln{fill:none;stroke:#1f5e57;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}
.cx-andro-spark circle{stroke:var(--surface,#fff);stroke-width:1.2}.cx-andro-spark .ok{fill:#15803d}.cx-andro-spark .lo{fill:#dc2626}
.cx-andro-nospark{color:var(--t3)}
.cx-andro-plain{margin-top:12px;padding:12px 14px;border:1px solid #cfe6e1;border-radius:12px;background:#f5faf9;font-size:14.5px;line-height:1.55}
.cx-andro-plain .h{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:6px}
.cx-andro-plain .h b{display:inline-flex;gap:6px;align-items:center;color:#1f5e57}
.cx-andro-plain p{margin:0 0 6px}
.cx-andro-review{margin-top:14px;padding:12px 14px;border:1px solid var(--line);border-radius:12px}
.cx-andro-review h4{margin-top:0}
.cx-andro-review article{padding:8px 0;border-top:1px solid var(--line);font-size:13.5px;line-height:1.5}
.cx-andro-review article p{margin:0 0 4px}
.cx-andro-review article div{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--t3);font-size:12px}
.cx-andro-review article .cx-btn{padding:2px 9px;font-size:12px}
.cx-andro-done{color:#15803d;font-weight:600}
.cx-andro-steps button i{margin-left:auto;font-style:normal;font-size:11.5px;font-weight:700;padding:1px 7px;border-radius:999px;background:#e6f2ef;color:#1f5e57}
.cx-andro-steps button i.late{background:#ffedd5;color:#9a3412}
.cx-andro-explain .cx-andro-sub{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.25)}
.cx-andro-explain .cx-andro-sub small{display:block;margin-bottom:4px;font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;opacity:.85}
.cx-andro-explain .cx-andro-sub p{font-size:15px}
@media (max-width:760px){.cx-andro-askbar{flex-direction:column}.cx-andro-thread .q{max-width:100%}}
`;
