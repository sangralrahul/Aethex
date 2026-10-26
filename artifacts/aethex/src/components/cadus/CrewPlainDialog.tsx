/**
 * Patient-Friendly Rewrite: turn an answer into plain language at a chosen reading level and
 * language, with a reading-ease score and a check that no number or dose was lost.
 */
import { useState } from "react";
import { Copy, Loader2, SpellCheck, TriangleAlert, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { CREW_LANGS, easeLabel, missingNumbers, PLAIN_LEVELS, plainPrompt, readingEase } from "@/lib/cadus/crew";

export default function CrewPlainDialog({ text, rewrite, canAsk, friendlyError, toast, onClose }: {
  text: string;
  rewrite: (prompt: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onClose: () => void;
}) {
  const [level, setLevel] = useState<"simple" | "very-simple" | "child">("simple");
  const [lang, setLang] = useState("English");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState("");
  const run = async () => {
    if (!canAsk(1)) return;
    setBusy(true); setOut("");
    try { setOut(await rewrite(plainPrompt(text, level, lang))); }
    catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const before = readingEase(text);
  const after = out && lang === "English" ? readingEase(out) : null;
  const missing = out ? missingNumbers(text, out) : [];
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset cx-tr-dialog" role="dialog" aria-modal="true" aria-labelledby="cx-plw-t" onMouseDown={(e) => e.stopPropagation()} data-crew="plain">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh"><span className="cx-fc-ic"><SpellCheck size={22} /></span><div><h3 id="cx-plw-t">Patient-friendly version</h3><p>Rewrite this answer in plain words for a patient or family.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-c23-row">
            <label className="cx-field"><span>Reading level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as typeof level)} data-plw="level">{PLAIN_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select></label>
            <label className="cx-field"><span>Language</span><select className="cx-select" value={lang} onChange={(e) => setLang(e.target.value)} data-plw="lang">{CREW_LANGS.map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
            <button className="cx-btn primary" onClick={() => void run()} disabled={busy} data-plw="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <SpellCheck size={14} />} Rewrite</button>
          </div>
          {before !== null && <p className="cx-set-hint" data-plw="ease">Original reading ease {before} ({easeLabel(before)}){after !== null ? <> · rewrite <b data-plw="after">{after} ({easeLabel(after)})</b></> : null}. 60 or more is plain English.</p>}
          {out && (
            <>
              {missing.length > 0 && <p className="cx-set-hint cx-bk-err" data-plw="missing"><TriangleAlert size={13} /> These numbers from the original are missing in the rewrite: {missing.join(", ")}. Check before sharing.</p>}
              <div className="cx-cmp-out" data-plw="out"><MdBlock text={out} /></div>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out); toast("Copied"); }} data-plw="copy"><Copy size={14} /> Copy</button></div>
            </>
          )}
          <p className="cx-set-hint">Check the rewrite before giving it to a patient; remove anything identifying.</p>
        </div>
      </div>
    </div>
  );
}
