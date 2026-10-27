/**
 * Chat Recap: key points, doses and numbers, to-dos and topics to revise from the current chat, to
 * copy or save to Crew notes.
 */
import { useEffect, useState } from "react";
import { Copy, ListChecks, Loader2, StickyNote, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";

export default function CrewRecapDialog({ run, canSave, onSave, toast, onClose }: {
  run: () => Promise<string>;
  canSave: boolean;
  onSave: (text: string) => void;
  toast: (t: string) => void;
  onClose: () => void;
}) {
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let live = true;
    run().then((t) => { if (live) setOut(t); }).catch((e) => { if (live) setErr(e instanceof Error ? e.message : String(e)); }).finally(() => { if (live) setBusy(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset cx-tr-dialog" role="dialog" aria-modal="true" aria-labelledby="cx-rc-t" onMouseDown={(e) => e.stopPropagation()} data-crew="recap-dialog">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh"><span className="cx-fc-ic"><ListChecks size={22} /></span><div><h3 id="cx-rc-t">Chat recap</h3><p>Key points, doses, to-dos and what to revise from this chat.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          {busy && <p className="cx-set-hint" data-rc="busy"><Loader2 size={14} className="cx-rot" /> Reading the chat…</p>}
          {err && <p className="cx-set-hint cx-bk-err" data-rc="err">{err}</p>}
          {out && (
            <>
              <div className="cx-cmp-out" data-rc="out"><MdBlock text={out} /></div>
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out); toast("Recap copied"); }} data-rc="copy"><Copy size={14} /> Copy</button>
                {canSave && <button className="cx-btn primary" onClick={() => { onSave(out); }} data-rc="save"><StickyNote size={14} /> Save to Crew notes</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
