/**
 * Long Answer Writer (update 50): model answers for university theory papers — 5, 10 or 15 marks —
 * in the structure examiners reward, with the diagrams to draw. Save, copy or print.
 */
import { useState } from "react";
import { Copy, Loader2, PenLine, Printer, Save } from "lucide-react";
import { allCrew, cleanLongAnswer, findCrew, LONG_MARKS, longAnswerPrompt, type CrewMember } from "@/lib/cadus/crew";
import SubjectSelect from "./SubjectSelect";
import { printMarkdown } from "@/lib/cadus/printdoc";
import { readLetterhead } from "@/lib/cadus/letterhead";
import { MdBlock } from "./LiveAnswer";

export default function CrewLongAnswerView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [q, setQ] = useState("");
  const [marks, setMarks] = useState<number>(10);
  const [subject, setSubject] = useState("");
  const [uni, setUni] = useState("");
  const [crewId, setCrewId] = useState("crew-neetpg");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ q: string; marks: number; md: string } | null>(null);
  const go = async () => {
    const c = findCrew(crewId, mine);
    if (q.trim().length < 6) { toast("Type the exam question"); return; }
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const md = cleanLongAnswer(await ask(c, longAnswerPrompt(q, marks, subject, uni)));
      if (md.length < 80) { toast("The answer came back too short. Try again."); return; }
      setOut({ q: q.trim(), marks, md });
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const words = out ? out.md.split(/\s+/).filter(Boolean).length : 0;
  return (
    <section className="cx-page cx-lab cx-la">
      <header className="cx-page-h"><div><h1>Long Answer Writer</h1><p>Model answers for MBBS university theory papers: the headings examiners look for, bullet points, a comparison table, and the diagrams worth drawing.</p></div></header>
      <label className="cx-field"><span>Question</span><textarea className="cx-input" rows={2} value={q} onChange={(e) => setQ(e.target.value.slice(0, 400))} placeholder="e.g. Describe the aetiology, clinical features and management of acute pancreatitis." data-la="q" /></label>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Marks</span><select className="cx-select" value={marks} onChange={(e) => setMarks(Number(e.target.value))} data-la="marks">{LONG_MARKS.map((m) => <option key={m} value={m}>{m} marks</option>)}</select></label>
        <label className="cx-field"><span>Subject</span><SubjectSelect value={subject} onChange={setSubject} data="la" anyLabel="Any" /></label>
        <label className="cx-field"><span>University (optional)</span><input className="cx-input" value={uni} onChange={(e) => setUni(e.target.value.slice(0, 80))} placeholder="e.g. RGUHS" data-la="uni" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-la="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-la="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <PenLine size={14} />} {busy ? "Writing…" : "Write the answer"}</button></div>
      {out && (
        <div className="cx-la-out" data-la="out">
          <p className="cx-la-meta"><b>{out.marks} marks</b> · about {words} words</p>
          <div className="cx-cht-page" data-la="text"><MdBlock text={out.md} /></div>
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { onNote(crewId, `## ${out.q} (${out.marks} marks)\n\n${out.md}`, out.q.slice(0, 80)); toast("Saved to Crew notes"); }} data-la="save"><Save size={14} /> Save to notes</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out.md); toast("Copied"); }} data-la="copy"><Copy size={14} /> Copy</button>
            <button className="cx-btn" onClick={() => void printMarkdown({ title: `${out.q} (${out.marks} marks)`, md: out.md, letterhead: readLetterhead(), footer: "Model answer made with Cadus Crew by Aethex. Check facts against your textbook and university pattern." })} data-la="print"><Printer size={14} /> Print / PDF</button>
          </div>
        </div>
      )}
    </section>
  );
}
