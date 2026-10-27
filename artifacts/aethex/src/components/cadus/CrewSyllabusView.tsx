/**
 * Syllabus Tracker: a high-yield checklist for each NEET-PG subject (built by an assistant or added
 * by hand); tick topics off, see progress, and revise any topic in one tap. Kept on this device.
 */
import { useEffect, useState } from "react";
import { ListChecks, Loader2, Play, Plus, RotateCcw } from "lucide-react";
import { EXAM_SUBJECTS, EXAMS, findCrew, parseSyllabus, readExam, readSyllabus, saveSyllabus, syllabusProgress, syllabusPrompt, syllabusRevisePrompt, type CrewMember, type Syllabus } from "@/lib/cadus/crew";

export default function CrewSyllabusView({ mine, ask, canAsk, friendlyError, toast, onRevise }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onRevise: (c: CrewMember, prompt: string) => void;
}) {
  const [syl, setSyl] = useState<Syllabus>(readSyllabus);
  const [subject, setSubject] = useState(EXAM_SUBJECTS[0][0]);
  const [busy, setBusy] = useState(false);
  const [add, setAdd] = useState("");
  useEffect(() => saveSyllabus(syl), [syl]);
  const ex = readExam();
  const examName = ex ? (ex.exam === "custom" ? ex.name : EXAMS.find((e) => e.id === ex.exam)?.name) || "NEET-PG" : "NEET-PG";
  const crewFor = (s: string) => findCrew(EXAM_SUBJECTS.find((x) => x[0] === s)?.[1], mine) ?? findCrew("crew-neetpg", mine);
  const build = async () => {
    const c = crewFor(subject);
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const t = parseSyllabus(await ask(c, syllabusPrompt(subject, examName)));
      if (!t.length) { toast("The checklist didn't come back in a usable form. Try again."); return; }
      setSyl((s) => ({ ...s, [subject]: { at: Date.now(), topics: t } }));
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const cur = syl[subject];
  const all = syllabusProgress(syl);
  const pct = (s: string) => { const t = syl[s]?.topics ?? []; return t.length ? Math.round((100 * t.filter((x) => x.done).length) / t.length) : -1; };
  return (
    <section className="cx-page cx-lab cx-syl">
      <header className="cx-page-h"><div><h1>Syllabus Tracker</h1><p>A high-yield checklist for every {examName} subject. Tick topics off as you finish them, and revise any topic with the right assistant in one tap.</p></div></header>
      <div className="cx-sim-stats"><div><b data-syl="pct">{all.pct}%</b><small>overall</small></div><div><b>{all.done}/{all.total}</b><small>topics done</small></div><div><b>{all.subjects}/{EXAM_SUBJECTS.length}</b><small>subjects started</small></div></div>
      <div className="cx-syl-grid" data-syl="subjects">{EXAM_SUBJECTS.map(([s]) => { const p = pct(s); return <button key={s} className={`cx-syl-sub ${subject === s ? "on" : ""}`} onClick={() => setSubject(s)} data-syl-sub={s}><b>{s}</b><span className="cx-goal-bar sm"><span style={{ width: `${Math.max(0, p)}%` }} /></span><small>{p < 0 ? "Not started" : `${p}%`}</small></button>; })}</div>
      <h3 className="cx-lab-h3">{subject}</h3>
      {!cur ? (
        <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void build()} disabled={busy} data-syl="build">{busy ? <Loader2 size={14} className="cx-rot" /> : <ListChecks size={14} />} {busy ? "Building…" : `Build the ${subject} checklist`}</button></div>
      ) : (
        <>
          <ul className="cx-syl-list" data-syl="list">{cur.topics.map((t, i) => (
            <li key={`${t.t}-${i}`} className={t.done ? "done" : ""}>
              <label className={`cx-pa-mine ${t.done ? "done" : ""}`}><input type="checkbox" checked={t.done} onChange={() => setSyl((s) => ({ ...s, [subject]: { ...s[subject], topics: s[subject].topics.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) } }))} data-syl-t={t.t} /> {t.t}</label>
              <button className="cx-ib" onClick={() => { const c = crewFor(subject); if (c) onRevise(c, syllabusRevisePrompt(subject, t.t)); }} aria-label={`Revise ${t.t}`} data-syl-rev={t.t}><Play size={13} /></button>
            </li>
          ))}</ul>
          <div className="cx-gs-row"><input className="cx-input" value={add} onChange={(e) => setAdd(e.target.value.slice(0, 160))} placeholder="Add your own topic" data-syl="add" /><button className="cx-btn" onClick={() => { if (!add.trim()) return; setSyl((s) => ({ ...s, [subject]: { ...s[subject], topics: [...s[subject].topics, { t: add.trim(), done: false }] } })); setAdd(""); }} data-syl="add-btn"><Plus size={14} /> Add</button><button className="cx-btn" onClick={() => void build()} disabled={busy} data-syl="rebuild"><RotateCcw size={14} /> Rebuild</button></div>
        </>
      )}
    </section>
  );
}
