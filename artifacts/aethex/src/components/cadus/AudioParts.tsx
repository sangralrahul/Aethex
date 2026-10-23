/**
 * Natural-voice pieces: the voice settings (choose the voices, hear a preview, switch natural
 * voices off), and "Audio for the patient": written instructions turned into a spoken script in
 * the patient's language and an MP3 to play, download or send on WhatsApp.
 */
import { useEffect, useRef, useState } from "react";
import { AudioLines, Check, Download, Loader2, Mic, Pause, Play, RefreshCw, Share2, Square, Trash2, Upload, UserRound, Volume2 } from "lucide-react";
import { cloneVoice, deleteClonedVoice, downloadMp3, langCode, listVoices, readVoicePrefs, saveAudio, saveVoicePrefs, serverHasVoices, shareMp3, speak, stopSpeaking, synthesize, toWav, type VoiceInfo, type VoicePrefs } from "@/lib/cadus/voice";

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
  const [signedIn, setSignedIn] = useState(false);
  const [playing, setPlaying] = useState("");
  const [loaded, setLoaded] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => saveVoicePrefs(prefs), [prefs]);
  useEffect(() => {
    if (!available) return;
    listVoices(loaded > 0).then((r) => {
      setVoices(r.voices); setDef(r.default); setSignedIn(!!r.signedIn);
      // An own voice that's no longer there (deleted, or another account): forget it.
      setPrefs((p) => (p.own && r.signedIn && !r.voices.some((v) => v.id === p.own!.id) ? { ...p, own: null, voice: p.voice === p.own.id ? "" : p.voice } : p));
    }).catch(() => toast("Couldn't load the voices"));
  }, [available, toast, loaded]);
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
  const label = (v: VoiceInfo) => v.own ? `${v.name.replace(/ · Cadus$/, "")} (your voice)` : [v.name, [v.gender, v.accent].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  return (
    <div className="cx-vs" data-voice="settings">
      <label className="cx-vs-row"><input type="checkbox" checked={prefs.natural} onChange={(e) => setPrefs({ ...prefs, natural: e.target.checked })} data-voice="natural" /> <span><b>Natural voices</b><small>Answers, voice mode, the Translator, patient audio and podcasts. Powered by ElevenLabs.</small></span></label>
      {prefs.natural && (
        <>
          <div className="cx-vs-pick">
            <label className="cx-field"><span>Main voice</span><select className="cx-select" value={main} onChange={(e) => setPrefs({ ...prefs, voice: e.target.value })} data-voice="main">{voices.map((v) => <option key={v.id} value={v.id}>{label(v)}</option>)}</select></label>
            <label className="cx-field"><span>Second voice (podcast student)</span><select className="cx-select" value={prefs.second} onChange={(e) => setPrefs({ ...prefs, second: e.target.value })} data-voice="second">{voices.map((v) => <option key={v.id} value={v.id}>{label(v)}</option>)}</select></label>
          </div>
          <OwnVoice prefs={prefs} setPrefs={setPrefs} signedIn={signedIn} toast={toast} onChanged={() => setLoaded((n) => n + 1)} />
          <div className="cx-vs-list">{voices.filter((v) => !v.own).slice(0, 24).map((v) => (
            <button key={v.id} className={`cx-vs-v ${v.id === main ? "on" : ""}`} onClick={() => preview(v)} disabled={!v.preview} title={v.description || v.name}>
              {playing === v.id ? <Pause size={13} /> : <Play size={13} />} {v.name}<small>{[v.gender, v.accent].filter(Boolean).join(", ")}</small>
            </button>
          ))}</div>
        </>
      )}
    </div>
  );
}

const PASSAGES: Record<string, string> = {
  English: "Good morning. I am your doctor, and I would like to take a few minutes to explain your treatment. Please listen carefully, and stop me if anything is unclear. Take your tablets at the same time every day, with water, after food unless I have told you otherwise. Do not stop a medicine on your own, even if you feel better; finish the full course. Drink enough water, eat home-cooked food, and rest well. If you notice a high fever, difficulty in breathing, chest pain, fainting or bleeding, or if you simply feel much worse, come back to the hospital at once, day or night. Bring all your reports and this prescription when you come for your follow-up visit. Your health matters to us, and we are here to help you get better.",
  Hindi: "नमस्ते। मैं आपका डॉक्टर हूँ, और मैं आपको आपका इलाज आसान शब्दों में समझाना चाहता हूँ। कृपया ध्यान से सुनिए, और कोई बात समझ न आए तो मुझे रोकिए। अपनी दवाइयाँ रोज़ एक ही समय पर, पानी के साथ, खाना खाने के बाद लीजिए। अच्छा महसूस होने पर भी दवा अपने आप बंद मत कीजिए; पूरा कोर्स कीजिए। भरपूर पानी पीजिए, घर का बना खाना खाइए और आराम कीजिए। अगर तेज़ बुखार हो, साँस लेने में तकलीफ़ हो, सीने में दर्द हो, बेहोशी हो या खून आए, या तबीयत ज़्यादा बिगड़ जाए, तो दिन हो या रात, तुरंत अस्पताल आइए। अगली बार आते समय अपनी सारी रिपोर्ट और यह पर्चा साथ लाइए। हम आपकी मदद के लिए यहाँ हैं।",
};
const MIN_SECS = 30, MAX_SECS = 120;

/**
 * Your own voice: read a short passage aloud (or upload a clean recording), agree, and Cadus makes a
 * natural voice that sounds like you, for patient audio and leaflets. Only for the signed-in owner;
 * it can be deleted at any time.
 */
export function OwnVoice({ prefs, setPrefs, signedIn, toast, onChanged }: {
  prefs: VoicePrefs;
  setPrefs: (f: (p: VoicePrefs) => VoicePrefs) => void;
  signedIn: boolean;
  toast: (t: string) => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"English" | "Hindi">("English");
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const [secs, setSecs] = useState(0);
  const [samples, setSamples] = useState<{ blob: Blob; secs: number; name: string }[]>([]);
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState("My voice");
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { window.clearInterval(timer.current); stream.current?.getTracks().forEach((t) => t.stop()); }, []);
  const total = samples.reduce((n, s) => n + s.secs, 0);

  if (prefs.own) {
    const own = prefs.own;
    return (
      <div className="cx-ov" data-ownvoice="ready">
        <span className="cx-ov-ic"><UserRound size={16} /></span>
        <div><b>Your voice: {own.name}</b><small>Used for patient audio when you tick "In my voice". Only you can use it.</small></div>
        <div className="cx-ov-acts">
          <button className="cx-btn sm" onClick={() => { stopSpeaking(); speak(lang === "Hindi" ? "नमस्ते, यह मेरी आवाज़ है।" : "Hello, this is my voice in Cadus. Please take your medicines on time.", { voice: own.id, quality: "best", lang: lang === "Hindi" ? "hi" : "en" }); }} data-ownvoice="hear"><Play size={13} /> Hear it</button>
          <button className={`cx-btn sm ${prefs.voice === own.id ? "on" : ""}`} onClick={() => setPrefs((p) => ({ ...p, voice: p.voice === own.id ? "" : own.id }))} data-ownvoice="main">{prefs.voice === own.id ? <><Check size={13} /> Main voice</> : "Make it the main voice"}</button>
          <button className="cx-ib" aria-label="Delete your voice" data-ownvoice="delete" onClick={async () => {
            if (!window.confirm("Delete your voice? It is removed from ElevenLabs and can't be used again.")) return;
            try { await deleteClonedVoice(own.id); setPrefs((p) => ({ ...p, own: null, voice: p.voice === own.id ? "" : p.voice })); toast("Your voice is deleted"); onChanged(); }
            catch (e) { toast(e instanceof Error ? e.message : "Couldn't delete the voice"); }
          }}><Trash2 size={15} /></button>
        </div>
      </div>
    );
  }
  if (!open) {
    return (
      <button className="cx-ov cx-ov-start" onClick={() => setOpen(true)} data-ownvoice="open">
        <span className="cx-ov-ic"><Mic size={16} /></span>
        <div><b>Your own voice</b><small>Read a passage for about a minute and patient audio can speak in your voice.</small></div>
      </button>
    );
  }
  if (!signedIn) return <p className="cx-set-hint" data-ownvoice="signin">Sign in to make your own voice. It's kept with your account so only you can use it.</p>;

  const start = async () => {
    try { stream.current = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: true } }); }
    catch { toast("Allow the microphone to record your voice"); return; }
    const type = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
    const r = new MediaRecorder(stream.current, type ? { mimeType: type, audioBitsPerSecond: 128000 } : undefined);
    const chunks: Blob[] = [];
    const t0 = Date.now();
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = async () => {
      const s = Math.round((Date.now() - t0) / 1000);
      stream.current?.getTracks().forEach((t) => t.stop());
      if (s < 8) { toast("That was too short. Read the whole passage."); setState("idle"); return; }
      try {
        const raw = new Blob(chunks, { type: (r.mimeType || "audio/webm").split(";")[0] });
        const wav = await toWav(raw).catch(() => raw);
        setSamples((l) => [...l, { blob: wav, secs: s, name: `Recording ${l.length + 1}` }].slice(0, 3));
      } finally { setState("idle"); }
    };
    r.start(1000);
    rec.current = r;
    setSecs(0); setState("rec");
    timer.current = window.setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); setSecs(s); if (s >= MAX_SECS) stop(); }, 500);
  };
  const stop = () => { window.clearInterval(timer.current); try { rec.current?.stop(); } catch { /* gone */ } setState("busy"); };
  const addFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("audio/")) { toast("Choose an audio file"); return; }
    if (f.size > 10_000_000) { toast("Each recording can be up to 10 MB"); return; }
    const secs = await new Promise<number>((res) => { const a = new Audio(URL.createObjectURL(f)); a.onloadedmetadata = () => { res(Math.round(a.duration || 0)); URL.revokeObjectURL(a.src); }; a.onerror = () => res(60); });
    setSamples((l) => [...l, { blob: f, secs: Number.isFinite(secs) ? secs : 60, name: f.name }].slice(0, 3));
    if (fileRef.current) fileRef.current.value = "";
  };
  const make = async () => {
    setState("busy");
    try {
      const v = await cloneVoice(samples.map((s) => s.blob), name.trim() || "My voice");
      setPrefs((p) => ({ ...p, own: v }));
      setSamples([]); setOpen(false);
      toast("Your voice is ready");
      onChanged();
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't make your voice"); }
    finally { setState("idle"); }
  };
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="cx-ov-make" data-ownvoice="make">
      <div className="cx-ov-h"><b>Your own voice</b><button className="cx-link" onClick={() => setOpen(false)}>Close</button></div>
      <p className="cx-set-hint">In a quiet room, about a hand's width from the microphone, read the passage below in your normal speaking voice. One to two minutes in total works best; you can record up to three takes.</p>
      <div className="cx-seg">{(["English", "Hindi"] as const).map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l}</button>)}</div>
      <blockquote className="cx-ov-passage" lang={lang === "Hindi" ? "hi" : "en"} data-ownvoice="passage">{PASSAGES[lang]}</blockquote>
      <div className="cx-sc-acts">
        {state === "rec"
          ? <button className="cx-btn danger" onClick={stop} data-ownvoice="stop"><Square size={13} /> Stop · {mmss(secs)}</button>
          : <button className="cx-btn" onClick={() => void start()} disabled={state === "busy" || samples.length >= 3} data-ownvoice="record"><Mic size={14} /> {samples.length ? "Record another take" : "Start reading"}</button>}
        <input ref={fileRef} type="file" hidden accept="audio/*" onChange={(e) => void addFile(e.target.files?.[0])} />
        <button className="cx-btn" onClick={() => fileRef.current?.click()} disabled={state !== "idle" || samples.length >= 3}><Upload size={14} /> Upload a recording</button>
      </div>
      {samples.length > 0 && (
        <ul className="cx-ov-takes" data-ownvoice="takes">{samples.map((s, i) => (
          <li key={i}><Volume2 size={13} /> {s.name} <small>{mmss(s.secs)}</small><button className="cx-link" onClick={() => setSamples((l) => l.filter((_, j) => j !== i))}>Remove</button></li>
        ))}<li className="cx-ov-total"><small>{total < MIN_SECS ? `Record at least ${MIN_SECS} seconds in total (${mmss(total)} so far)` : `${mmss(total)} in total`}</small></li></ul>
      )}
      <label className="cx-field"><span>Name</span><input className="cx-input" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} maxLength={40} /></label>
      <label className="cx-vs-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-ownvoice="consent" /> <span><b>This is my own voice, and I agree to it being cloned</b><small>The recordings are sent to ElevenLabs to make a voice that sounds like you. Only you can use it in Cadus, and you can delete it here at any time. Never record someone else.</small></span></label>
      <button className="cx-btn primary" onClick={() => void make()} disabled={!consent || total < MIN_SECS || state !== "idle"} data-ownvoice="go">
        {state === "busy" ? <><Loader2 size={14} className="cx-rot" /> Working…</> : <><Mic size={14} /> Make my voice</>}
      </button>
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
  const own = readVoicePrefs().own ?? null;
  const [mine, setMine] = useState(false);
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
      const blob = await synthesize(r.script, { lang: langCode(language), quality: "best", ...(mine && own ? { voice: own.id } : {}) }, (d, t) => setProgress(t > 1 ? ` ${d}/${t}` : ""));
      setMp3(blob);
      setUrl(URL.createObjectURL(blob));
      setState("ready");
      void saveAudio({ id: Math.random().toString(36).slice(2), at: Date.now(), kind: "patient", title, meta: { language, mine: mine && !!own }, mp3: blob }).catch(() => {});
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
        <span className="cx-pa-go">
          <button className="cx-btn" onClick={() => void make()} disabled={state !== "idle"} data-audio="make">
            {state === "idle" ? <><AudioLines size={14} /> Audio for the patient ({language})</> : <><Loader2 size={14} className="cx-rot" /> {state === "script" ? "Writing what to say…" : `Recording the voice…${progress}`}</>}
          </button>
          {own && state === "idle" && <label className="cx-pa-mine"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} data-audio="mine" /> In my voice</label>}
        </span>
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
