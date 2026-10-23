/**
 * A text box with a microphone: dictation adds to what's typed (the browser's recogniser, or the
 * server's in the desktop app). Shared by Ward Rounds by Voice and Patient Records.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { dictationError, NO_DICTATION, speechRecognition } from "@/lib/cadus/speech";

export default function DictateBox({ value, onChange, placeholder, rows = 5, lang = "en-IN", toast, label, autoStart = false }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  lang?: string;
  toast: (t: string) => void;
  label: string;
  autoStart?: boolean;
}) {
  const [on, setOn] = useState(false);
  const rec = useRef<any>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => () => { try { rec.current?.stop?.(); } catch { /* gone */ } }, []);
  const toggle = () => {
    const SR = speechRecognition();
    if (!SR) { toast(NO_DICTATION); return; }
    if (on) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = true;
    const base = valueRef.current.trim();
    r.onresult = (e: any) => {
      let fin = "", interim = "";
      for (let i = 0; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t + " "; else interim += t; }
      onChange(`${base ? base + " " : ""}${fin}${interim}`.trim());
    };
    r.onend = () => setOn(false);
    r.onerror = (e: any) => { setOn(false); const m = dictationError(e?.error); if (m) toast(m); };
    rec.current = r;
    setOn(true);
    try { r.start(); } catch { setOn(false); }
  };
  useEffect(() => { if (autoStart) toggle(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`cx-dict ${on ? "on" : ""}`}>
      <textarea className="cx-input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} data-dict="text" />
      <button type="button" className={`cx-btn ${on ? "danger" : ""}`} onClick={toggle} data-dict="mic">{on ? <><Square size={13} /> Stop</> : <><Mic size={14} /> Dictate</>}</button>
    </div>
  );
}
