/**
 * Second Opinion: paste a question or case and an answer or plan (from a colleague, a textbook, or
 * another chat), pick a Crew assistant, and get a structured review: verdict, what is right,
 * what is wrong or unsafe, what is missing, and a final recommendation.
 */
import { useState, type ReactNode } from "react";
import { Copy, Loader2, MessagesSquare, Scale, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { allCrew, findCrew, secondOpinionMessage, suggestCrew, type CrewMember } from "@/lib/cadus/crew";

export default function CrewSecondOpinionView({ mine, initial, badge, ask, canAsk, friendlyError, toast, onContinue }: {
  mine: CrewMember[];
  initial?: string;
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onContinue: (c: CrewMember, question: string, answer: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [pick, setPick] = useState(initial || "crew-pharmacist");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ by: string; text: string } | null>(null);
  const suggested = suggestCrew(question, mine, 3);
  const c = findCrew(pick, mine);

  const run = async () => {
    if (!c) return;
    const q = deidentify(question.trim()).text, a = deidentify(answer.trim()).text;
    if (!q || !a) { toast("Add both the question and the answer or plan to review"); return; }
    if (!canAsk(1)) return;
    setBusy(true); setOut(null);
    try { setOut({ by: c.id, text: await ask(c, secondOpinionMessage(q, a)) }); }
    catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const by = out ? findCrew(out.by, mine) : undefined;

  return (
    <section className="cx-page cx-lab cx-second">
      <header className="cx-page-h"><div><h1>Second Opinion</h1><p>Paste a question or case and an answer or plan, choose an assistant, and get a structured review: what is right, what is wrong or unsafe, what is missing, and what to do.</p></div></header>
      <label className="cx-field"><span>Question or case (no names or identifying details)</span><textarea className="cx-input" rows={4} value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 4000))} placeholder="e.g. 68-year-old with AF, CKD (eGFR 35), on aspirin; which anticoagulant and dose?" data-so="q" /></label>
      <label className="cx-field"><span>Answer or plan to review</span><textarea className="cx-input" rows={5} value={answer} onChange={(e) => setAnswer(e.target.value.slice(0, 6000))} placeholder="Paste the plan, the answer from another chat, or a colleague's advice" data-so="a" /></label>
      {suggested.length > 0 && <p className="cx-set-hint" data-so="suggest">Suggested for this question: {suggested.map((s) => <button key={s.id} type="button" className={`cx-chip ${pick === s.id ? "on" : ""}`} onClick={() => setPick(s.id)}>{s.name}</button>)}</p>}
      <div className="cx-c23-row">
        <label className="cx-field"><span>Reviewer</span><select className="cx-select" value={pick} onChange={(e) => setPick(e.target.value)} data-so="who">{allCrew(mine).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <button className="cx-btn primary" onClick={() => void run()} disabled={busy} data-so="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <Scale size={14} />} Get a second opinion</button>
      </div>
      {out && by && (
        <div className="cx-cmp-out" data-so="out">
          <div className="cx-so-h">{badge(by, 32)}<b>{by.name}</b></div>
          <MdBlock text={out.text} />
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out.text); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-btn" onClick={() => onContinue(by, question, out.text)}><MessagesSquare size={14} /> Continue in a chat</button>
          </div>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> A second opinion supports, not replaces, clinical judgement and the senior responsible for the patient. Names and numbers that look like identifiers are removed before sending.</p>
    </section>
  );
}
