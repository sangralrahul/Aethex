/**
 * Voice Chat with Assistants: speak to an assistant (where the browser supports speech
 * recognition) or type, and hear the reply read aloud in the chosen language and voice.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Mic, MicOff, Send, Square, Volume2 } from "lucide-react";
import { allCrew, findCrew, speakable, speechChunks, VOICE_LANGS, voiceMessage, type CrewMember } from "@/lib/cadus/crew";

type Rec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

export default function CrewVoiceView({ mine, badge, ask, canAsk, friendlyError, toast }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [crewId, setCrewId] = useState("crew-patient");
  const [lang, setLang] = useState("en-IN");
  const [voice, setVoice] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakOn, setSpeakOn] = useState(true);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<{ role: "user" | "crew"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef<Rec | null>(null);
  const c = findCrew(crewId, mine);
  const tts = typeof window !== "undefined" && "speechSynthesis" in window;
  const SR = typeof window !== "undefined" ? ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Rec) | undefined : undefined;
  const langLabel = VOICE_LANGS.find((l) => l.code === lang)?.label ?? "English";

  useEffect(() => {
    if (!tts) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => { window.speechSynthesis.removeEventListener?.("voiceschanged", load); window.speechSynthesis.cancel(); };
  }, [tts]);
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));

  const speak = (md: string) => {
    if (!tts || !speakOn) return;
    window.speechSynthesis.cancel();
    const chunks = speechChunks(speakable(md));
    const v = voices.find((x) => x.name === voice) ?? langVoices[0];
    chunks.forEach((ch, i) => {
      const u = new SpeechSynthesisUtterance(ch);
      u.lang = lang;
      if (v) u.voice = v;
      if (i === chunks.length - 1) u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    });
    setSpeaking(chunks.length > 0);
  };
  const send = async (said?: string) => {
    const t = (said ?? text).trim();
    if (!t || !c || busy) return;
    if (!canAsk(1)) return;
    setText(""); setBusy(true);
    const before = turns;
    setTurns([...before, { role: "user", text: t }]);
    try {
      const reply = await ask(c, voiceMessage(before, t, langLabel));
      setTurns((l) => [...l, { role: "crew", text: reply }]);
      speak(reply);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const listen = () => {
    if (!SR) { toast("Speech input isn't available in this browser: type instead"); return; }
    if (listening) { recRef.current?.stop(); return; }
    const r = new SR();
    r.lang = lang; r.interimResults = false; r.continuous = false;
    r.onresult = (e) => { const said = Array.from(e.results).map((x) => x[0].transcript).join(" "); if (said.trim()) void send(said); };
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast("Couldn't hear that: check microphone permission"); };
    recRef.current = r; setListening(true); r.start();
  };

  return (
    <section className="cx-page cx-lab cx-crewvoice">
      <header className="cx-page-h"><div><h1>Voice Chat</h1><p>Talk to an assistant and hear the reply. Useful for patients who prefer listening, or for hands-free questions. Replies are short and spoken in the language you choose.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-cv="crew">{allCrew(mine).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label className="cx-field"><span>Language</span><select className="cx-select" value={lang} onChange={(e) => { setLang(e.target.value); setVoice(""); }} data-cv="lang">{VOICE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
        <label className="cx-field"><span>Voice</span><select className="cx-select" value={voice} onChange={(e) => setVoice(e.target.value)} data-cv="voice"><option value="">Default for the language</option>{langVoices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}</select></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={speakOn} onChange={(e) => setSpeakOn(e.target.checked)} data-cv="speak" /> Read replies aloud</label>
      </div>
      {!tts && <p className="cx-set-hint">This browser cannot read aloud; replies will show as text.</p>}
      <div className="cx-rm-log" data-cv="log">
        {turns.length === 0 && <p className="cx-set-hint">{SR ? "Press the microphone and speak, or type below." : "Type your question below (speech input needs Chrome or Edge)."}</p>}
        {turns.map((t, i) => <div key={i} className={`cx-rm-msg ${t.role}`} data-cv-turn={t.role}>{t.role === "crew" && c && <div className="cx-rm-who">{badge(c, 20)}<b>{c.name}</b><button className="cx-ib" aria-label="Read aloud" onClick={() => speak(t.text)}><Volume2 size={14} /></button></div>}<p>{t.role === "crew" ? speakable(t.text) : t.text}</p></div>)}
        {busy && <p className="cx-set-hint"><Loader2 size={13} className="cx-rot" /> Thinking…</p>}
      </div>
      <div className="cx-rm-compose">
        <button className={`cx-btn ${listening ? "primary" : ""}`} onClick={listen} aria-label={listening ? "Stop listening" : "Speak"} data-cv="mic">{listening ? <MicOff size={16} /> : <Mic size={16} />}</button>
        <textarea className="cx-input" rows={2} value={text} onChange={(e) => setText(e.target.value.slice(0, 1500))} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Or type here" data-cv="text" />
        <button className="cx-btn primary" onClick={() => void send()} disabled={!text.trim() || busy} data-cv="send"><Send size={14} /></button>
        {speaking && <button className="cx-btn" onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); }} data-cv="stop"><Square size={14} /> Stop</button>}
      </div>
    </section>
  );
}
