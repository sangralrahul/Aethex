/**
 * Natural-voice pieces: the voice settings (choose the voices, hear a preview, switch natural
 * voices off), and "Audio for the patient": written instructions turned into a spoken script in
 * the patient's language and an MP3 to play, download or send on WhatsApp.
 */
import { useEffect, useRef, useState } from "react";
import { AudioLines, Download, Loader2, Pause, Play, RefreshCw, Share2, Volume2 } from "lucide-react";
import { downloadMp3, langCode, listVoices, readVoicePrefs, saveAudio, saveVoicePrefs, serverHasVoices, shareMp3, synthesize, type VoiceInfo, type VoicePrefs } from "@/lib/cadus/voice";

export function useNaturalVoices(): boolean | null {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => { let alive = true; void serverHasVoices().then((v) => { if (alive) setOn(v); }); return () => { alive = false; }; }, []);
  return on;
}

export function VoiceSettings({ toast }: { toast: (t: string) => void }) {
  const available = useNaturalVoices();
  const [prefs, setPrefs] = useState<VoicePrefs>(readVoicePrefs);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [def, setDef] = useState("");
  const [playing, setPlaying] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => saveVoicePrefs(prefs), [prefs]);
  useEffect(() => {
    if (!available) return;
    listVoices().then((r) => { setVoices(r.voices); setDef(r.default); }).catch(() => toast("Couldn't load the voices"));
  }, [available, toast]);
  useEffect(() => () => audio.current?.pause(), []);
  const preview = (v: VoiceInfo) => {
    audio.current?.pause();
    if (playing === v.id || !v.preview) { setPlaying(""); return; }
    audio.current = new Audio(v.preview);
    audio.current.onended = () => setPlaying("");
    void audio.current.play().catch(() => setPlaying(""));
    setPlaying(v.id);
  };
  if (available === null) return null;
  if (!available) return <p className="cx-set-hint" data-voice="off">Answers are read aloud with this computer's voice. Natural voices appear here once they're set up on the server.</p>;
  const main = prefs.voice || def;
  const label = (v: VoiceInfo) => [v.name, [v.gender, v.accent].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  return (
    <div className="cx-vs" data-voice="settings">
      <label className="cx-vs-row"><input type="checkbox" checked={prefs.natural} onChange={(e) => setPrefs({ ...prefs, natural: e.target.checked })} data-voice="natural" /> <span><b>Natural voices</b><small>Answers, voice mode, the Translator, patient audio and podcasts. Powered by ElevenLabs.</small></span></label>
      {prefs.natural && (
        <>
          <div className="cx-vs-pick">
            <label className="cx-field"><span>Main voice</span><select className="cx-select" value={main} onChange={(e) => setPrefs({ ...prefs, voice: e.target.value })} data-voice="main">{voices.map((v) => <option key={v.id} value={v.id}>{label(v)}</option>)}</select></label>
            <label className="cx-field"><span>Second voice (podcast student)</span><select className="cx-select" value={prefs.second} onChange={(e) => setPrefs({ ...prefs, second: e.target.value })} data-voice="second">{voices.map((v) => <option key={v.id} value={v.id}>{label(v)}</option>)}</select></label>
          </div>
          <div className="cx-vs-list">{voices.slice(0, 24).map((v) => (
            <button key={v.id} className={`cx-vs-v ${v.id === main ? "on" : ""}`} onClick={() => preview(v)} disabled={!v.preview} title={v.description || v.name}>
              {playing === v.id ? <Pause size={13} /> : <Play size={13} />} {v.name}<small>{[v.gender, v.accent].filter(Boolean).join(", ")}</small>
            </button>
          ))}</div>
        </>
      )}
    </div>
  );
}

/** Written instructions to an MP3 in the patient's language. */
export function PatientAudio({ text, language, title, generate, toast }: {
  text: string;
  language: string;
  title: string;
  generate: (body: Record<string, unknown>) => Promise<any>;
  toast: (t: string) => void;
}) {
  const available = useNaturalVoices();
  const [state, setState] = useState<"idle" | "script" | "voice" | "ready">("idle");
  const [progress, setProgress] = useState("");
  const [mp3, setMp3] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [script, setScript] = useState("");
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { setState("idle"); setMp3(null); setScript(""); setUrl(""); }, [text, language]);
  if (!available) return null;
  const make = async () => {
    try {
      setState("script");
      const r = await generate({ action: "audio-script", text, language });
      if (!r?.script) throw new Error("Couldn't write the spoken version");
      setScript(r.script);
      setState("voice");
      const blob = await synthesize(r.script, { lang: langCode(language), quality: "best" }, (d, t) => setProgress(t > 1 ? ` ${d}/${t}` : ""));
      setMp3(blob);
      setUrl(URL.createObjectURL(blob));
      setState("ready");
      void saveAudio({ id: Math.random().toString(36).slice(2), at: Date.now(), kind: "patient", title, meta: { language }, mp3: blob }).catch(() => {});
    } catch (e) {
      setState("idle");
      toast(e instanceof Error ? e.message : "Couldn't make the audio");
    }
  };
  return (
    <div className="cx-pa" data-audio="patient">
      {state === "ready" && mp3 ? (
        <>
          <div className="cx-pa-h"><Volume2 size={16} /><b>Audio for the patient</b><small>{language}</small></div>
          <audio controls src={url} data-audio="player" />
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => downloadMp3(mp3, title)} data-audio="download"><Download size={14} /> MP3</button>
            <button className="cx-btn" onClick={async () => { if (!(await shareMp3(mp3, title, title))) { downloadMp3(mp3, title); toast("Saved the MP3: send it on WhatsApp from your files"); } }} data-audio="share"><Share2 size={14} /> WhatsApp or share</button>
            <button className="cx-btn" onClick={() => void make()}><RefreshCw size={14} /> Make again</button>
          </div>
          <details className="cx-pa-script"><summary>What it says</summary><p>{script}</p></details>
        </>
      ) : (
        <button className="cx-btn" onClick={() => void make()} disabled={state !== "idle"} data-audio="make">
          {state === "idle" ? <><AudioLines size={14} /> Audio for the patient ({language})</> : <><Loader2 size={14} className="cx-rot" /> {state === "script" ? "Writing what to say…" : `Recording the voice…${progress}`}</>}
        </button>
      )}
    </div>
  );
}

/** Records a whole consultation and gets it back as a transcript by speaker (Doctor / Patient). */
export function ConsultRecorder({ language, onTranscript, toast, disabled }: {
  language: string;
  onTranscript: (text: string) => void;
  toast: (t: string) => void;
  disabled?: boolean;
}) {
  const available = useNaturalVoices();
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const [secs, setSecs] = useState(0);
  const [turns, setTurns] = useState<{ speaker: string; text: string }[] | null>(null);
  const [swap, setSwap] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number>(0);
  useEffect(() => () => { window.clearInterval(timer.current); try { rec.current?.state === "recording" && rec.current.stop(); } catch { /* gone */ } stream.current?.getTracks().forEach((t) => t.stop()); }, []);
  if (!available || typeof MediaRecorder === "undefined") return null;

  const label = (sp: string, sw: boolean) => { const n = Number(sp.replace(/\D/g, "")) || 0; const order = sw ? ["Patient", "Doctor"] : ["Doctor", "Patient"]; return order[n] ?? `Speaker ${n + 1}`; };
  const render = (t: { speaker: string; text: string }[], sw: boolean) => t.map((x) => `${label(x.speaker, sw)}: ${x.text}`).join("\n");

  const start = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch { toast("Allow the microphone to record the consultation"); return; }
    const type = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
    const r = new MediaRecorder(stream.current, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    r.onstop = () => void upload(new Blob(chunks.current, { type: (r.mimeType || "audio/webm").split(";")[0] }));
    r.start(5000);
    rec.current = r;
    setSecs(0); setTurns(null); setState("rec");
    const t0 = Date.now();
    timer.current = window.setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); setSecs(s); if (s >= 3600) stop(); }, 1000);
  };
  const stop = () => {
    window.clearInterval(timer.current);
    try { rec.current?.stop(); } catch { /* gone */ }
    stream.current?.getTracks().forEach((t) => t.stop());
    setState("busy");
  };
  const upload = async (blob: Blob) => {
    try {
      if (blob.size < 2000) throw new Error("The recording is empty");
      const fd = new FormData();
      fd.append("audio", blob, `consultation.${blob.type.split("/")[1] || "webm"}`);
      fd.append("language", langCode(language) || "");
      fd.append("speakers", "2");
      const r = await fetch("/api/voice/scribe", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Couldn't transcribe the recording");
      const t = (Array.isArray(j.turns) ? j.turns : []) as { speaker: string; text: string }[];
      if (!t.length) throw new Error("Nothing was heard in the recording");
      setTurns(t); setSwap(false);
      onTranscript(render(t, false));
      toast(`Transcribed: ${t.length} turn${t.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't transcribe the recording");
    } finally { setState("idle"); }
  };
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <span className="cx-cr" data-scribe="consult">
      {state === "rec" ? (
        <><button className="cx-btn danger" onClick={stop} data-scribe="stop"><Pause size={14} /> Stop · {mmss}</button><small className="cx-set-hint">Recording. With the patient's permission; sent to be transcribed, not kept.</small></>
      ) : (
        <button className="cx-btn" onClick={() => void start()} disabled={disabled || state === "busy"} data-scribe="record" title="Record the whole consultation; Cadus separates the doctor and the patient">
          {state === "busy" ? <><Loader2 size={14} className="cx-rot" /> Transcribing…</> : <><AudioLines size={14} /> Record consultation</>}
        </button>
      )}
      {turns && state === "idle" && <button className="cx-link" onClick={() => { const sw = !swap; setSwap(sw); onTranscript(render(turns, sw)); }} data-scribe="swap">Swap doctor and patient</button>}
    </span>
  );
}
