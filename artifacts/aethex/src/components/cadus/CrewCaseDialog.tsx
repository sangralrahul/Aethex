/**
 * Make a Case from This: turn an answer into a clinical case vignette with questions and model
 * answers; reveal answers one by one, save it, or practise it with an assistant.
 */
import { useState } from "react";
import { ClipboardPlus, Copy, Eye, Loader2, Play, Save, X } from "lucide-react";
import { caseMarkdown, casePractisePrompt, casePrompt, parseCase, type CaseVignette } from "@/lib/cadus/crew";

export default function CrewCaseDialog({ text, run, canAsk, friendlyError, toast, onSave, onPractise, onClose }: {
  text: string;
  run: (prompt: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onSave: (md: string, title: string) => void;
  onPractise: (prompt: string) => void;
  onClose: () => void;
}) {
  const [level, setLevel] = useState<"student" | "pg">("pg");
  const [busy, setBusy] = useState(false);
  const [c, setC] = useState<CaseVignette | null>(null);
  const [shown, setShown] = useState<number[]>([]);
  const go = async () => {
    if (!canAsk(1)) return;
    setBusy(true); setShown([]);
    try {
      const v = parseCase(await run(casePrompt(text, level)));
      if (!v) toast("The case didn't come back in a usable form. Try again.");
      setC(v);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset cx-tr-dialog" role="dialog" aria-modal="true" aria-labelledby="cx-case-t" onMouseDown={(e) => e.stopPropagation()} data-crew="case">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh"><span className="cx-fc-ic"><ClipboardPlus size={22} /></span><div><h3 id="cx-case-t">Make a case from this</h3><p>A realistic case vignette built from this answer, with questions to test yourself.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-seg" role="tablist">{([["pg", "NEET-PG level"], ["student", "MBBS level"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={level === k} className={level === k ? "on" : ""} onClick={() => setLevel(k)} data-case-level={k}>{l}</button>)}</div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-case="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <ClipboardPlus size={14} />} {busy ? "Writing the case…" : c ? "Another case" : "Make the case"}</button></div>
          {c && (
            <div className="cx-case" data-case="out">
              <h4 data-case="title">{c.title}</h4>
              <p className="cx-case-v" data-case="vignette">{c.vignette}</p>
              <ol className="cx-case-qs">{c.questions.map((q, i) => (
                <li key={i}>
                  <b>{q.q}</b>
                  {shown.includes(i) ? <p className="cx-case-a" data-case-a={i}>{q.a}</p> : <button className="cx-btn sm" onClick={() => setShown((s) => [...s, i])} data-case-show={i}><Eye size={12} /> Show answer</button>}
                </li>
              ))}</ol>
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => onPractise(casePractisePrompt(c))} data-case="practise"><Play size={14} /> Practise in a chat</button>
                <button className="cx-btn" onClick={() => { onSave(caseMarkdown(c), `Case: ${c.title}`); toast("Case saved to Crew notes"); }} data-case="save"><Save size={14} /> Save to notes</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(caseMarkdown(c)); toast("Case copied"); }} data-case="copy"><Copy size={14} /> Copy</button>
              </div>
            </div>
          )}
          <p className="cx-set-hint">Made-up patient for practice. Check doses and facts against the answer it came from.</p>
        </div>
      </div>
    </div>
  );
}
