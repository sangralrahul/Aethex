/** Answer Grader (update 53): paste a written exam answer, get it marked like a university examiner. */
import { useState } from "react";
import { Copy, GraduationCap, Loader2, Save } from "lucide-react";
import { allCrew, findCrew, gradeMarkdown, gradePrompt, LONG_MARKS, parseGrade, type CrewMember, type Graded } from "@/lib/cadus/crew";
import SubjectSelect from "./SubjectSelect";
import { MdBlock } from "./LiveAnswer";

export default function CrewGraderView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [marks, setMarks] = useState(10);
  const [subject, setSubject] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [busy, setBusy] = useState(false);
  const [g, setG] = useState<Graded | null>(null);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const go = async () => {
    const c = findCrew(crewId, mine);
    if (q.trim().length < 6 || answer.trim().length < 20) { toast("Add the question and your answer"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const r = parseGrade(await ask(c, gradePrompt(q, marks, subject, answer)), marks);
      if (!r) { toast("The marks didn't come back in a usable form. Try again."); return; }
      setG(r);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const list = (title: string, items: string[], k: string) => items.length ? <div className={`cx-gr-sec ${k}`} data-gr={k}><h4>{title}</h4><ul>{items.map((x) => <li key={x}>{x}</li>)}</ul></div> : null;
  return (
    <section className="cx-page cx-lab cx-gr">
      <header className="cx-page-h"><div><h1>Answer Grader</h1><p>Paste your written answer and get it marked like a university examiner: the score, what you missed, errors, and how to present it better.</p></div></header>
      <label className="cx-field"><span>Question</span><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 500))} placeholder="e.g. Describe the management of diabetic ketoacidosis." data-gr="q" /></label>
      <label className="cx-field"><span>Your answer ({words} words)</span><textarea className="cx-input" rows={8} value={answer} onChange={(e) => setAnswer(e.target.value.slice(0, 12000))} placeholder="Type or paste your answer…" data-gr="answer" /></label>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Marks</span><select className="cx-select" value={marks} onChange={(e) => setMarks(Number(e.target.value))} data-gr="marks">{[2, 3, ...LONG_MARKS, 20].map((m) => <option key={m} value={m}>{m} marks</option>)}</select></label>
        <label className="cx-field"><span>Subject</span><SubjectSelect value={subject} onChange={setSubject} data="gr" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-gr="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-gr="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <GraduationCap size={14} />} {busy ? "Marking…" : "Mark my answer"}</button></div>
      {g && (
        <div className="cx-gr-out" data-gr="out">
          <div className="cx-gr-score"><span className="cx-gr-ring" style={{ ["--p" as string]: `${Math.round((100 * g.score) / g.outOf)}` }}><b data-gr="score" data-score={g.score}>{g.score}</b><small>/{g.outOf}</small></span><p>{g.verdict}</p></div>
          {list("Strengths", g.strengths, "good")}{list("Missing points", g.missing, "miss")}{list("Errors", g.errors, "err")}{list("Presentation", g.structure, "pres")}
          {g.outline && <details className="cx-gr-model" open><summary>Model outline</summary><div className="cx-cht-page"><MdBlock text={g.outline} /></div></details>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { onNote(crewId, gradeMarkdown(q, g), `Graded: ${q.slice(0, 60)}`); toast("Saved to Crew notes"); }} data-gr="save"><Save size={14} /> Save to notes</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(gradeMarkdown(q, g)); toast("Copied"); }} data-gr="copy"><Copy size={14} /> Copy</button>
          </div>
        </div>
      )}
    </section>
  );
}
