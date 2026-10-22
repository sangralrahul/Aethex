/**
 * Voice mode: a hands-free conversation with Cadus, like ChatGPT's voice mode.
 * Cadus listens, sends what you said when you pause, reads the (short) answer
 * aloud and listens again. Uses the browser's speech recognition and voices.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { markdownToText } from "@/lib/cadus-markdown";
import { canDictate, speechRecognition } from "@/lib/cadus/speech";

type Phase = "listening" | "thinking" | "speaking" | "paused" | "error";

const LANG_CODE: Record<string, string> = {
  English: "en-IN", Hindi: "hi-IN", Hinglish: "en-IN", Bengali: "bn-IN", Tamil: "ta-IN", Telugu: "te-IN", Marathi: "mr-IN",
  Gujarati: "gu-IN", Kannada: "kn-IN", Malayalam: "ml-IN", Punjabi: "pa-IN", Urdu: "ur-IN",
};

export const voiceSupported = () =>
  typeof window !== "undefined" && canDictate() && "speechSynthesis" in window;

/** Text for speaking: no markdown, no citation markers, no tables. */
export function speakable(md: string): string {
  return markdownToText(md.replace(/^\|.*\|\s*$/gm, "").replace(/\[\d{1,2}\]/g, ""))
    .replace(/^\s*Bottom line:\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 2400);
}

export default function VoiceMode({ language, ask, onClose }: {
  language: string;
  /** Sends what the user said and resolves with the answer text (empty if it failed). */
  ask: (text: string) => Promise<string>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("listening");
  const [heard, setHeard] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<any>(null);
  const alive = useRef(true);
  const phaseRef = useRef<Phase>("listening");
  const lang = LANG_CODE[language] ?? "en-IN";

  const go = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  const listen = useCallback(() => {
    if (!alive.current) return;
    const SR = speechRecognition();
    if (!SR) { setError("Voice mode needs a browser with speech recognition, such as Chrome, Edge or Safari."); go("error"); return; }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setHeard((finalText + interim).trim());
    };
    rec.onerror = (e: any) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setError("Cadus needs permission to use the microphone. Allow it in your browser and try again.");
        go("error");
      }
    };
    rec.onend = async () => {
      recRef.current = null;
      if (!alive.current || phaseRef.current !== "listening") return;
      const text = finalText.trim();
      if (!text) { go("paused"); return; }
      setHeard(text);
      go("thinking");
      setAnswer("");
      const reply = await ask(text);
      if (!alive.current) return;
      if (!reply) { setError("Cadus couldn't answer that. Tap the microphone to try again."); go("paused"); return; }
      setAnswer(reply);
      const synth = window.speechSynthesis;
      const u = new SpeechSynthesisUtterance(speakable(reply));
      u.lang = lang;
      const next = () => { if (alive.current && phaseRef.current === "speaking") { setHeard(""); go("listening"); listen(); } };
      u.onend = next;
      u.onerror = next;
      go("speaking");
      synth.cancel();
      synth.speak(u);
    };
    recRef.current = rec;
    setError("");
    go("listening");
    try { rec.start(); } catch { go("paused"); }
  }, [ask, lang]);

  useEffect(() => {
    alive.current = true;
    listen();
    return () => {
      alive.current = false;
      try { recRef.current?.abort?.(); } catch { /* ignore */ }
      try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const toggleMic = () => {
    if (phase === "listening") {
      go("paused");
      try { recRef.current?.stop?.(); } catch { /* ignore */ }
    } else if (phase === "speaking") {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      setHeard("");
      listen();
    } else if (phase !== "thinking") {
      setHeard("");
      listen();
    }
  };

  const status =
    phase === "listening" ? (heard ? "Listening…" : "Listening. Ask your question")
    : phase === "thinking" ? "Cadus is thinking"
    : phase === "speaking" ? "Cadus is speaking. Tap to interrupt"
    : phase === "error" ? "Voice mode can't start"
    : "Paused. Tap the microphone to talk";

  return (
    <div className="cx-voice" role="dialog" aria-modal="true" aria-label="Voice mode">
      <button className="cx-voice-x cx-ib" onClick={onClose} aria-label="End voice mode"><X size={20} /></button>
      <div className="cx-voice-mid">
        <div className={`cx-orb ${phase}`} aria-hidden><i /><i /><i /></div>
        <p className="cx-voice-status" aria-live="polite">{status}</p>
        {error ? <p className="cx-voice-err">{error}</p> : (
          <>
            {heard && <p className="cx-voice-heard">“{heard}”</p>}
            {answer && phase !== "listening" && <p className="cx-voice-ans">{speakable(answer)}</p>}
          </>
        )}
      </div>
      <div className="cx-voice-ctrl">
        <button className={`cx-voice-mic ${phase === "listening" ? "on" : ""}`} onClick={toggleMic} disabled={phase === "thinking"} aria-label={phase === "listening" ? "Pause listening" : "Talk"}>
          {phase === "listening" ? <Mic size={26} /> : <MicOff size={26} />}
        </button>
        <button className="cx-voice-end" onClick={onClose}>End</button>
      </div>
      <p className="cx-voice-note">Voice answers are short and appear in the chat too. Language: {language}.</p>
    </div>
  );
}
