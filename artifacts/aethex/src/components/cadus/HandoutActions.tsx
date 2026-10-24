/**
 * Print a patient handout, or translate it into the patient's language first (numbers and doses
 * are checked to be unchanged) and print both, or send it on WhatsApp.
 */
import { useState } from "react";
import { Languages, Loader2, MessageCircle, Printer, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { LANGUAGES } from "@/lib/cadus/leaflets";

export default function HandoutActions({ md, title, generate, friendlyError, toast, onPrint, defaultLanguage }: {
  md: string; title: string;
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  defaultLanguage: string;
}) {
  const [lang, setLang] = useState(defaultLanguage && defaultLanguage !== "English" && LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "Hindi");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ text: string; missingNumbers: string[]; for: string } | null>(null);
  const fresh = out && out.for === `${lang}\n${md}` ? out : null;
  const translate = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "translate-doc", text: md, language: lang });
      if (!r?.result) throw new Error("Nothing came back");
      setOut({ ...r.result, for: `${lang}\n${md}` });
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  return (
    <div className="cx-handout" data-handout="box">
      <div className="cx-sc-acts">
        <button className="cx-btn" onClick={() => onPrint(title, md)} data-handout="print"><Printer size={14} /> Print in English</button>
        <select className="cx-select sm" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Patient's language" data-handout="lang">{LANGUAGES.filter((l) => l !== "English").map((l) => <option key={l}>{l}</option>)}</select>
        <button className="cx-btn" onClick={() => void translate()} disabled={busy} data-handout="translate">{busy ? <Loader2 size={14} className="cx-rot" /> : <Languages size={14} />} Translate</button>
      </div>
      {fresh && (
        <div className="cx-c23-local" data-handout="local">
          {fresh.missingNumbers.length > 0 && <p className="cx-bk-err" role="alert"><TriangleAlert size={13} /> Check these numbers in the translation: {fresh.missingNumbers.join(", ")}</p>}
          <MdBlock text={fresh.text} />
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => onPrint(title, `${fresh.text}\n\n---\n\n${md}`)} data-handout="print-both"><Printer size={14} /> Print {lang} and English</button>
            <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(fresh.text.slice(0, 3500))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
          </div>
        </div>
      )}
    </div>
  );
}
