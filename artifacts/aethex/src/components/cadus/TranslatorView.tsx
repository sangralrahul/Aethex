/**
 * Consult Translator: a two-way interpreter between the doctor (English) and the patient
 * (an Indian language). Each side types or speaks; Cadus translates, shows a translation
 * back for checking, explains medical words, flags anything worrying, and reads the
 * translation aloud. The consultation can then be written up as a clinical note.
 */
import { speak as speakAloud, stopSpeaking } from "@/lib/cadus/voice";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Copy, FileText, Languages, Mic, MicOff, Plus, Stethoscope, Trash2, TriangleAlert, UserRound, Volume2 } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { englishOf, readTrSessions, saveTrSessions, sid, TR_LANGUAGES, TR_PHRASES, type TrSession, type TrTurn } from "@/lib/cadus/studio";
import { canDictate, dictationError, NO_DICTATION, speechRecognition } from "@/lib/cadus/speech";

const canListen = canDictate();
const canSpeak = typeof window !== "undefined" && ("speechSynthesis" in window || "Audio" in window);

export default function TranslatorView({ generate, friendlyError, toast, onPrint, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  defaultLanguage: string;
}) {
  const [sessions, setSessions] = useState<TrSession[]>(readTrSessions);
  const [language, setLanguage] = useState(TR_LANGUAGES.some((l) => l.name === defaultLanguage) ? defaultLanguage : "Hindi");
  const [current, setCurrent] = useState<TrSession>(() => ({ id: sid(), language, turns: [], at: Date.now() }));
  const [who, setWho] = useState<"doctor" | "patient">("doctor");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [noting, setNoting] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => saveTrSessions(sessions), [sessions]);
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: "end", behavior: "smooth" }); }, [current.turns.length]);
  useEffect(() => () => { try { recRef.current?.abort?.(); } catch { /* ignore */ } stopSpeaking(); }, []);
  const lang = TR_LANGUAGES.find((l) => l.name === current.language) ?? TR_LANGUAGES[0];

  const persist = (s: TrSession) => {
    setCurrent(s);
    if (s.turns.length) setSessions((l) => [s, ...l.filter((x) => x.id !== s.id)]);
  };

  const speak = (text: string, code: string) => {
    if (!text) return;
    speakAloud(text.replace(/[*#_`]/g, ""), { lang: code, quality: "fast" });
  };

  const send = async (raw: string, side = who) => {
    const said = raw.trim();
    if (!said || busy) return;
    // The doctor's side is cleaned of identifiers; the patient's own words are kept as spoken.
    const clean = side === "doctor" ? deidentify(said).text : said;
    setBusy(true);
    try {
      const r = await generate({ action: "translate", text: clean, from: side, language: current.language, recent: current.turns.slice(-6).map((t) => ({ who: t.who, english: englishOf(t) })) });
      const t = r?.turn;
      if (!t?.translation) throw new Error("No translation came back");
      const turn: TrTurn = { id: sid(), who: side, said: clean, translation: t.translation, back: t.back || "", terms: t.terms || [], flag: t.flag || "", at: Date.now() };
      persist({ ...current, turns: [...current.turns, turn], at: Date.now() });
      setInput("");
      if (autoSpeak && side === "doctor") speak(turn.translation, lang.speech);
      // After the doctor speaks, it's usually the patient's turn, and the other way round.
      setWho(side === "doctor" ? "patient" : "doctor");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const listen = () => {
    if (!canListen) { toast(NO_DICTATION); return; }
    if (listening) { try { recRef.current?.stop(); } catch { /* ignore */ } return; }
    const R = speechRecognition();
    const rec = new R();
    rec.lang = who === "doctor" ? "en-IN" : lang.speech;
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = (e: any) => { setListening(false); const m = dictationError(e?.error); if (m) toast(m); };
    rec.onend = () => { setListening(false); if (finalText.trim()) void send(finalText, who); };
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const makeNote = async () => {
    if (!current.turns.length) return;
    setNoting(true);
    try {
      const r = await generate({ action: "translate", step: "note", language: current.language, turns: current.turns.map((t) => ({ who: t.who, english: englishOf(t) })) });
      if (!r?.note) throw new Error("The note came back empty");
      persist({ ...current, note: r.note });
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setNoting(false); }
  };

  const fresh = () => { setCurrent({ id: sid(), language, turns: [], at: Date.now() }); setWho("doctor"); setInput(""); };
  const transcript = current.turns.map((t) => `${t.who === "doctor" ? "Doctor" : "Patient"}: ${t.said}\n→ ${t.translation}`).join("\n\n");

  return (
    <section className="cx-page cx-tr">
      <header className="cx-page-h">
        <div><h1>Consult Translator</h1><p>Talk with patients in their own language. Speak or type; Cadus translates both ways, shows a translation back so you can check it, and explains medical words.</p></div>
      </header>
      <div className="cx-tr-bar">
        <label className="cx-field"><span><Languages size={13} /> Patient speaks</span>
          <select className="cx-select" value={current.language} onChange={(e) => { setLanguage(e.target.value); setCurrent((c) => ({ ...c, language: e.target.value })); }} aria-label="Patient's language" data-tr="lang">
            {TR_LANGUAGES.map((l) => <option key={l.name} value={l.name}>{l.name} · {l.native}</option>)}
          </select>
        </label>
        {canSpeak && <label className="cx-lab-toggle"><input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} /> Read translations aloud to the patient</label>}
        <div className="cx-tr-acts">
          <button className="cx-btn" onClick={fresh} disabled={!current.turns.length}><Plus size={14} /> New consultation</button>
          <button className="cx-btn" onClick={() => void makeNote()} disabled={!current.turns.length || noting} data-tr="note"><FileText size={14} /> {noting ? "Writing…" : "Make a note"}</button>
        </div>
      </div>

      <div className="cx-tr-log" data-tr="log">
        {current.turns.length === 0 && (
          <div className="cx-tr-start">
            <p className="cx-gl"><span>Common phrases</span></p>
            <div className="cx-tr-phrases">{TR_PHRASES.map((p) => <button key={p} onClick={() => void send(p, "doctor")} disabled={busy}>{p}</button>)}</div>
          </div>
        )}
        {current.turns.map((t) => (
          <div key={t.id} className={`cx-tr-turn ${t.who}`} data-tr-turn={t.who}>
            <p className="cx-tr-who">{t.who === "doctor" ? <><Stethoscope size={13} /> Doctor</> : <><UserRound size={13} /> Patient · {current.language}</>}</p>
            <p className="cx-tr-said">{t.said}</p>
            <div className="cx-tr-trans" lang={t.who === "doctor" ? lang.speech : "en"}>
              <b>{t.translation}</b>
              {t.who === "doctor" && canSpeak && <button className="cx-ib" onClick={() => speak(t.translation, lang.speech)} aria-label="Read aloud"><Volume2 size={15} /></button>}
            </div>
            {t.back && <p className="cx-tr-back" title="Translated back, to check the meaning"><ArrowLeftRight size={12} /> {t.back}</p>}
            {t.terms.length > 0 && <p className="cx-tr-terms">{t.terms.map((x) => <span key={x.term}><b>{x.term}</b>: {x.plain}</span>)}</p>}
            {t.flag && <p className="cx-tr-flag"><TriangleAlert size={13} /> {t.flag}</p>}
          </div>
        ))}
        {busy && <div className="cx-tr-turn pending"><span className="cx-sim-dots"><i /><i /><i /></span></div>}
        <div ref={endRef} />
      </div>

      <form className="cx-tr-input" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <div className="cx-seg" role="radiogroup" aria-label="Who is speaking">
          <button type="button" role="radio" aria-checked={who === "doctor"} className={who === "doctor" ? "on" : ""} onClick={() => setWho("doctor")} data-tr="doctor"><Stethoscope size={14} /> Doctor</button>
          <button type="button" role="radio" aria-checked={who === "patient"} className={who === "patient" ? "on" : ""} onClick={() => setWho("patient")} data-tr="patient"><UserRound size={14} /> Patient</button>
        </div>
        <input className="cx-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={who === "doctor" ? "Type in English, or tap the mic" : `The patient types or speaks in ${current.language}`} maxLength={3000} aria-label="What was said" data-tr="input" lang={who === "doctor" ? "en" : lang.speech} />
        {canListen && <button type="button" className={`cx-btn ${listening ? "rec" : ""}`} onClick={listen} aria-label={listening ? "Stop listening" : "Speak"} disabled={busy}>{listening ? <MicOff size={15} /> : <Mic size={15} />}</button>}
        <button className="cx-btn primary" type="submit" disabled={busy || !input.trim()} data-tr="send">Translate</button>
      </form>

      {current.note && (
        <div className="cx-sc-note" data-tr="note-out">
          <MdBlock text={current.note} />
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => onPrint(`Consultation (${current.language} interpreter)`, `${current.note}\n\n## Transcript\n\n${transcript.replace(/\n/g, "  \n")}`)}><FileText size={14} /> Print with transcript</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(current.note ?? ""); toast("Copied"); }}><Copy size={14} /> Copy note</button>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Recent consultations, on this device</span></p>
          {sessions.slice(0, 8).map((s) => (
            <div key={s.id} className={`cx-sc-row ${s.id === current.id ? "on" : ""}`}>
              <button onClick={() => { setCurrent(s); setLanguage(s.language); }}><b>{s.turns[0] ? englishOf(s.turns[0]).slice(0, 70) : "Consultation"}</b><small>{s.language} · {s.turns.length} turns · {new Date(s.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>
              <button className="cx-ib" onClick={() => { setSessions((l) => l.filter((x) => x.id !== s.id)); if (s.id === current.id) fresh(); }} aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> For everyday consultations. For consent, bad news or legal matters, use a qualified interpreter where you can. Check the translation back before acting on it.</p>
    </section>
  );
}
