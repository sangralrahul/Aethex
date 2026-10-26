/**
 * Answer Translations: translate an answer into an Indian language and read both side by side, with
 * a check that every number and dose made it into the translation.
 */
import { useState } from "react";
import { Copy, Languages, Loader2, TriangleAlert, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { CREW_LANGS, missingNumbers, translatePrompt } from "@/lib/cadus/crew";

export default function CrewTranslateDialog({ text, translate, canAsk, friendlyError, toast, onClose }: {
  text: string;
  translate: (prompt: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onClose: () => void;
}) {
  const [lang, setLang] = useState("Hindi");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState("");
  const run = async () => {
    if (!canAsk(1)) return;
    setBusy(true); setOut("");
    try { setOut(await translate(translatePrompt(text, lang))); }
    catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const missing = out ? missingNumbers(text, out) : [];
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset cx-tr-dialog" role="dialog" aria-modal="true" aria-labelledby="cx-tr-t" onMouseDown={(e) => e.stopPropagation()} data-crew="translate">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh"><span className="cx-fc-ic"><Languages size={22} /></span><div><h3 id="cx-tr-t">Translate this answer</h3><p>Read it side by side in an Indian language.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-c23-row">
            <label className="cx-field"><span>Language</span><select className="cx-select" value={lang} onChange={(e) => setLang(e.target.value)} data-tr="lang">{CREW_LANGS.filter((l) => l !== "English").map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
            <button className="cx-btn primary" onClick={() => void run()} disabled={busy} data-tr="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <Languages size={14} />} Translate</button>
          </div>
          {out && (
            <>
              {missing.length > 0 && <p className="cx-set-hint cx-bk-err" data-tr="missing"><TriangleAlert size={13} /> These numbers from the original are not in the translation: {missing.join(", ")}. Check doses before sharing.</p>}
              <div className="cx-cc-cols" style={{ ["--n" as string]: 2 }} data-tr="cols">
                <div className="cx-cmp-out"><h4>English</h4><MdBlock text={text} /></div>
                <div className="cx-cmp-out" data-tr="out"><h4>{lang}</h4><MdBlock text={out} /></div>
              </div>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out); toast("Translation copied"); }} data-tr="copy"><Copy size={14} /> Copy translation</button></div>
            </>
          )}
          <p className="cx-set-hint">Machine translation can miss nuance: have a fluent speaker check anything important before giving it to a patient.</p>
        </div>
      </div>
    </div>
  );
}
