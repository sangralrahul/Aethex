/**
 * Answer Fact-Check: a second assistant checks the doses, numbers and claims in an answer and
 * returns a pass / flag / unsure list.
 */
import { useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, CircleQuestionMark, Copy, Loader2, SearchCheck, X } from "lucide-react";
import { allCrew, factCheckPrompt, findCrew, parseFactCheck, type CrewMember, type FactItem } from "@/lib/cadus/crew";

export default function CrewFactCheckDialog({ question, answer, mine, badge, ask, canAsk, friendlyError, toast, onClose }: {
  question: string;
  answer: string;
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onClose: () => void;
}) {
  const [who, setWho] = useState("crew-pharmacist");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ summary: string; items: FactItem[] } | null>(null);
  const c = findCrew(who, mine);
  const run = async () => {
    if (!c || !canAsk(1)) return;
    setBusy(true); setRes(null);
    try { const r = parseFactCheck(await ask(c, factCheckPrompt(question, answer))); if (r) setRes(r); else toast("The check didn't come back in a usable form. Try again."); }
    catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const flags = res?.items.filter((i) => i.verdict === "flag").length ?? 0;
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset" role="dialog" aria-modal="true" aria-labelledby="cx-fc-t" onMouseDown={(e) => e.stopPropagation()} data-crew="factcheck">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh"><span className="cx-fc-ic"><SearchCheck size={22} /></span><div><h3 id="cx-fc-t">Fact-check this answer</h3><p>A second assistant checks doses, numbers and claims.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-c23-row">
            <label className="cx-field"><span>Checker</span><select className="cx-select" value={who} onChange={(e) => setWho(e.target.value)} data-fc="who">{allCrew(mine).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
            <button className="cx-btn primary" onClick={() => void run()} disabled={busy} data-fc="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <SearchCheck size={14} />} Check</button>
          </div>
          {res && (
            <div data-fc="out">
              <div className={`cx-cmp-out ${flags ? "cx-ac-high" : "cx-ac-in"}`}><div className="cx-so-h">{c && badge(c, 24)}<b>{flags ? `${flags} point${flags === 1 ? "" : "s"} flagged` : "No problems found"}</b></div>{res.summary && <p>{res.summary}</p>}</div>
              <ul className="cx-fc-list">{res.items.map((i, k) => <li key={k} className={`v-${i.verdict}`} data-fc-item={i.verdict}>{i.verdict === "ok" ? <CircleCheck size={15} /> : i.verdict === "flag" ? <CircleAlert size={15} /> : <CircleQuestionMark size={15} />}<span><b>{i.claim}</b>{i.note ? <small>{i.note}</small> : null}</span></li>)}</ul>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText([`Fact-check by ${c?.name}: ${res.summary}`, ...res.items.map((i) => `- [${i.verdict}] ${i.claim}${i.note ? ` — ${i.note}` : ""}`)].join("\n")); toast("Copied"); }}><Copy size={14} /> Copy report</button></div>
            </div>
          )}
          <p className="cx-set-hint">A check by another AI reduces but does not remove errors: verify flagged points in a formulary or guideline.</p>
        </div>
      </div>
    </div>
  );
}
