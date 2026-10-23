/**
 * Voice mode: a hands-free conversation with Cadus, like ChatGPT's voice mode.
 * Cadus listens, sends what you said when you pause, reads the (short) answer
 * aloud and listens again. Uses the browser's speech recognition and voices.
 * With a persona it becomes a spoken role-play: a viva examiner or a patient with
 * their own voice, an opening line, a "Finish and score" button and an end state.
 */
import { speak, stopSpeaking } from "@/lib/cadus/voice";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, Mic, MicOff, X } from "lucide-react";
import { markdownToText } from "@/lib/cadus-markdown";
import { canDictate, speechRecognition } from "@/lib/cadus/speech";

type Phase = "listening" | "thinking" | "speaking" | "paused" | "error" | "done";

/** A spoken role-play: who is talking, in which voice, how it opens and how it ends. */
export interface VoicePersona {
  /** "Viva examiner", "Patient"… */
  name: string;
  /** A voice id, or one chosen from each reply (a patient whose age and sex appear in the first turn). */
  voice?: string | ((reply: string) => string | undefined);
  /** Said first, before listening. */
  intro?: string;
  /** What "Finish and score" sends. */
  finishText?: string;
  /** The reply that ends it (the scorecard). */
  isFinal?: (reply: string) => boolean;
  /** What to say aloud from a reply (default: the whole reply, made speakable). */
  spoken?: (reply: string) => string;
  /** Status line while listening. */
  listenHint?: string;
  note?: string;
}

/** The spoken summary of a scorecard: the first paragraph after its heading. */
export function scoreSummary(md: string): string {
  const after = md.split(/^##\s*(?:Scorecard|Examiner feedback)\s*$/im)[1] ?? md;
  const para = after.trim().split(/\n\s*\n/)[0] ?? "";
  return speakable(para).slice(0, 500);
}

const LANG_CODE: Record<string, string> = {
  English: "en-IN", Hindi: "hi-IN", Hinglish: "en-IN", Bengali: "bn-IN", Tamil: "ta-IN", Telugu: "te-IN", Marathi: "mr-IN",
  Gujarati: "gu-IN", Kannada: "kn-IN", Malayalam: "ml-IN", Punjabi: "pa-IN", Urdu: "ur-IN",
};

export const voiceSupported = () =>
  typeof window !== "undefined" && canDictate() && ("speechSynthesis" in window || "Audio" in window);

/** Text for speaking: no markdown, no citation markers, no tables. */
export function speakable(md: string): string {
  return markdownToText(md.replace(/^\|.*\|\s*$/gm, "").replace(/\[\d{1,2}\]/g, ""))
    .replace(/^\s*Bottom line:\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 2400);
}

export default function VoiceMode({ language, ask, onClose, persona }: {
  language: string;
  /** Sends what the user said and resolves with the answer text (empty if it failed). */
  ask: (text: string) => Promise<string>;
  onClose: () => void;
  persona?: VoicePersona;
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
  const voiceRef = useRef<string | undefined>(typeof persona?.voice === "string" ? persona.voice : undefined);
  const say = (reply: string, onEnd: () => void) => {
    if (typeof persona?.voice === "function" && !voiceRef.current) voiceRef.current = persona.voice(reply);
    const text = persona?.spoken ? persona.spoken(reply) : speakable(reply);
    speak(text || speakable(reply), { lang, quality: "fast", voice: voiceRef.current, onEnd });
  };
  const listenRef = useRef<() => void>(() => {});
  /** Sends what was said, speaks the reply, then listens again (or ends on the scorecard). */
  const respond = async (text: string) => {
    go("thinking");
    setAnswer("");
    const reply = await ask(text);
    if (!alive.current) return;
    if (!reply) { setError("Cadus couldn't answer that. Tap the microphone to try again."); go("paused"); return; }
    setAnswer(reply);
    if (persona?.isFinal?.(reply)) {
      go("done");
      speak(scoreSummary(reply) || "Your scorecard is ready.", { lang, quality: "fast", voice: voiceRef.current });
      return;
    }
    const next = () => { if (alive.current && phaseRef.current === "speaking") { setHeard(""); go("listening"); listenRef.current(); } };
    go("speaking");
    say(reply, next);
  };
  const respondRef = useRef(respond);
  respondRef.current = respond;

  const listen = useCallback(() => {
    if (!alive.current) return;
    const SR = speechRecognition();
    if (!SR) { setError("Voice mode needs a browser with speech recognition, such as Chrome, Edge or Safari."); go("error"); return; }
    stopSpeaking();
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
      await respondRef.current(text);
    };
    recRef.current = rec;
    setError("");
    go("listening");
    try { rec.start(); } catch { go("paused"); }
  }, [lang]);
  listenRef.current = listen;

  useEffect(() => {
    alive.current = true;
    if (persona?.intro) {
      setAnswer(persona.intro);
      go("speaking");
      say(persona.intro, () => { if (alive.current && phaseRef.current === "speaking") listen(); });
    } else listen();
    return () => {
      alive.current = false;
      try { recRef.current?.abort?.(); } catch { /* ignore */ }
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const finish = () => {
    if (!persona?.finishText || phase === "thinking" || phase === "done") return;
    go("thinking");
    try { recRef.current?.abort?.(); } catch { /* ignore */ }
    stopSpeaking();
    setHeard(persona.finishText);
    void respond(persona.finishText);
  };

  const toggleMic = () => {
    if (phase === "done") return;
    if (phase === "listening") {
      go("paused");
      try { recRef.current?.stop?.(); } catch { /* ignore */ }
    } else if (phase === "speaking") {
      stopSpeaking();
      setHeard("");
      listen();
    } else if (phase !== "thinking") {
      setHeard("");
      listen();
    }
  };

  const who = persona?.name ?? "Cadus";
  const status =
    phase === "listening" ? (heard ? "Listening…" : persona?.listenHint ?? "Listening. Ask your question")
    : phase === "thinking" ? (persona ? `${who} is thinking` : "Cadus is thinking")
    : phase === "speaking" ? `${who} is speaking. Tap to interrupt`
    : phase === "error" ? "Voice mode can't start"
    : phase === "done" ? "Finished. Your scorecard is in the chat"
    : "Paused. Tap the microphone to talk";

  return (
    <div className={`cx-voice ${persona ? "persona" : ""}`} role="dialog" aria-modal="true" aria-label={persona ? `Voice ${who}` : "Voice mode"} data-voice-persona={persona ? who : undefined}>
      <button className="cx-voice-x cx-ib" onClick={onClose} aria-label="End voice mode"><X size={20} /></button>
      {persona && <p className="cx-voice-who">{who}</p>}
      <div className="cx-voice-mid">
        <div className={`cx-orb ${phase}`} aria-hidden><i /><i /><i /></div>
        <p className="cx-voice-status" aria-live="polite">{status}</p>
        {error ? <p className="cx-voice-err">{error}</p> : (
          <>
            {heard && <p className="cx-voice-heard">“{heard}”</p>}
            {answer && phase !== "listening" && <p className="cx-voice-ans" data-voice="answer">{phase === "done" ? scoreSummary(answer) : speakable(answer)}</p>}
          </>
        )}
      </div>
      <div className="cx-voice-ctrl">
        {phase !== "done" && (
          <button className={`cx-voice-mic ${phase === "listening" ? "on" : ""}`} onClick={toggleMic} disabled={phase === "thinking"} aria-label={phase === "listening" ? "Pause listening" : "Talk"}>
            {phase === "listening" ? <Mic size={26} /> : <MicOff size={26} />}
          </button>
        )}
        {persona?.finishText && phase !== "done" && <button className="cx-voice-end fin" onClick={finish} disabled={phase === "thinking"} data-voice="finish"><Flag size={14} /> Finish and score</button>}
        <button className="cx-voice-end" onClick={onClose}>{phase === "done" ? "See the scorecard" : "End"}</button>
      </div>
      <p className="cx-voice-note">{persona?.note ?? `Voice answers are short and appear in the chat too. Language: ${language}.`}</p>
    </div>
  );
}
