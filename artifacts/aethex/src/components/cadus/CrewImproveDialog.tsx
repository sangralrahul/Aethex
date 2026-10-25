/**
 * Rate & Improve: the thumbs you gave an assistant's answers, and better instructions written from
 * them, to apply to your own assistant or to save as your own version of a Cadus one.
 */
import { useState, type ReactNode } from "react";
import { Loader2, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { cleanImproved, improvePrompt, ratingSummary, type CrewMember, type CrewRating } from "@/lib/cadus/crew";

export default function CrewImproveDialog({ c, ratings, badge, improve, canAsk, friendlyError, toast, onApply, onClose, onClear }: {
  c: CrewMember;
  ratings: CrewRating[];
  badge: ReactNode;
  improve: (message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onApply: (instructions: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState("");
  const s = ratingSummary(ratings);
  const run = async () => {
    if (!ratings.length) { toast("Rate a few of its answers first (thumbs under each answer)"); return; }
    if (!canAsk(1)) return;
    setBusy(true);
    try { const t = cleanImproved(await improve(improvePrompt(c, ratings))); if (t) setOut(t); else toast("No suggestion came back"); }
    catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset" role="dialog" aria-modal="true" aria-labelledby="cx-imp-t" onMouseDown={(e) => e.stopPropagation()} data-crew="improve">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh">{badge}<div><h3 id="cx-imp-t">Rate &amp; improve {c.name}</h3><p>Your thumbs on its answers, turned into better instructions.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-sim-stats" data-imp="summary">
            <div><b><ThumbsUp size={16} /> {s.up}</b><small>helpful</small></div>
            <div><b><ThumbsDown size={16} /> {s.down}</b><small>not helpful</small></div>
            <div><b>{s.pct === null ? "–" : `${s.pct}%`}</b><small>rated helpful</small></div>
          </div>
          {ratings.length ? <ul className="cx-imp-list" data-imp="list">{ratings.slice(0, 8).map((r) => <li key={r.msgId}>{r.vote === "up" ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />} <b>{r.q.slice(0, 90) || "(question)"}</b>{r.why ? <small> — {r.why}</small> : null}</li>)}</ul> : <p className="cx-set-hint">No ratings yet. Use the thumbs under its answers in a chat; a thumbs-down lets you say what was wrong.</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ratings.length} data-imp="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} Suggest better instructions</button>
            {ratings.length > 0 && <button className="cx-btn" onClick={onClear} data-imp="clear">Clear ratings</button>}
          </div>
          {out && (
            <>
              <label className="cx-field"><span>Suggested instructions (edit before saving)</span><textarea className="cx-input" rows={9} value={out} onChange={(e) => setOut(e.target.value.slice(0, 4000))} data-imp="out" /></label>
              <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onApply(out)} data-imp="apply">{c.builtIn ? "Save as my own version" : "Apply to this assistant"}</button></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
