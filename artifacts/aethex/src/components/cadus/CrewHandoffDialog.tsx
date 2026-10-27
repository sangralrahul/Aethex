/**
 * Assistant Handoff: pass the current chat to another assistant with a short brief of the
 * conversation so far; the brief opens in a new chat with that assistant, ready to send.
 */
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRightLeft, Loader2, Sparkles, X } from "lucide-react";
import { allCrew, bestCrewFor, handoffAiPrompt, handoffBrief, suggestCrew, type CrewMember } from "@/lib/cadus/crew";

export default function CrewHandoffDialog({ from, mine, messages, badge, onConfirm, onClose, summarise, canAsk, onError }: {
  from: CrewMember;
  mine: CrewMember[];
  messages: { role: string; content: string }[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  onConfirm: (to: CrewMember, brief: string) => void;
  onClose: () => void;
  /** Update 46: write the brief with AI. */
  summarise?: (prompt: string) => Promise<string>;
  canAsk?: (n: number) => boolean;
  onError?: (e: unknown) => void;
}) {
  const lastQ = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const sug = useMemo(() => {
    // Update 46: the topic rules' best match leads, then the older keyword suggestions.
    const best = bestCrewFor(lastQ, mine)?.c;
    const rest = suggestCrew(lastQ, mine, 5);
    return [...(best ? [best] : []), ...rest].filter((c, i, a) => c.id !== from.id && a.findIndex((x) => x.id === c.id) === i).slice(0, 4);
  }, [lastQ, mine, from.id]);
  const [to, setTo] = useState(sug[0]?.id ?? "crew-rounds");
  const [note, setNote] = useState("");
  const target = allCrew(mine).find((c) => c.id === to);
  const [edited, setEdited] = useState<string | null>(null);
  const brief = edited ?? (target ? handoffBrief(from.name, target.name, messages, note) : "");
  const [aiBusy, setAiBusy] = useState(false);
  const writeAi = async () => {
    if (!summarise || !target || (canAsk && !canAsk(1))) return;
    setAiBusy(true);
    try { const t = (await summarise(handoffAiPrompt(from.name, target.name, messages, note))).trim(); if (t) setEdited(t.slice(0, 6000)); }
    catch (e) { onError?.(e); }
    finally { setAiBusy(false); }
  };

  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset" role="dialog" aria-modal="true" aria-labelledby="cx-ho-t" onMouseDown={(e) => e.stopPropagation()} data-crew="handoff">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh">{badge(from, 44)}<div><h3 id="cx-ho-t">Hand off from {from.name}</h3><p>Start a new chat with another assistant, carrying a brief of this conversation.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          {sug.length > 0 && <div className="cx-crew-chips" data-ho="suggest"><span className="cx-set-hint">Suggested:</span>{sug.map((c) => <button key={c.id} className={`cx-chip ${to === c.id ? "on" : ""}`} onClick={() => { setTo(c.id); setEdited(null); }} data-ho-sug={c.id}>{badge(c, 18)} {c.name}</button>)}</div>}
          <div className="cx-c23-row">
            <label className="cx-field"><span>Hand off to</span><select className="cx-select" value={to} onChange={(e) => { setTo(e.target.value); setEdited(null); }} data-ho="to">{allCrew(mine).filter((c) => c.id !== from.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="cx-field"><span>What should they do? (optional)</span><input className="cx-input" value={note} onChange={(e) => { setNote(e.target.value.slice(0, 500)); setEdited(null); }} placeholder="e.g. Plan the management and doses" data-ho="note" /></label>
          </div>
          <label className="cx-field"><span>Brief (you can edit it; it is sent only when you press send)</span><textarea className="cx-input" rows={8} value={brief} onChange={(e) => setEdited(e.target.value.slice(0, 6000))} data-ho="brief" /></label>
          <div className="cx-sc-acts">{summarise && <button className="cx-btn" disabled={!target || aiBusy} onClick={() => void writeAi()} data-ho="ai">{aiBusy ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} {aiBusy ? "Writing…" : "Write the brief with AI"}</button>}<button className="cx-btn primary" disabled={!target} onClick={() => target && onConfirm(target, brief)} data-ho="go"><ArrowRightLeft size={14} /> Hand off to {target?.name ?? "…"}</button><button className="cx-btn" onClick={onClose}>Cancel</button></div>
        </div>
      </div>
    </div>
  );
}
