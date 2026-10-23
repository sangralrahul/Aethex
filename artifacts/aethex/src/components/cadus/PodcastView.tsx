/**
 * Revision Podcasts: a topic, an answer or a flashcard deck turned into a short two-voice audio
 * lesson (a teacher and a student) in natural voices, for revision on the go. The script is
 * written by Cadus, each line is voiced by its speaker, and the MP3 is kept on this device.
 */
import { useEffect, useRef, useState } from "react";
import { Download, Headphones, Loader2, Mic2, Pause, Play, Share2, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { deleteAudio, downloadMp3, fetchSpeech, listAudio, readVoicePrefs, saveAudio, shareMp3, type SavedAudio } from "@/lib/cadus/voice";
import { readDecks } from "@/lib/cadus/studio";
import { useNaturalVoices } from "./AudioParts";

interface Line { who: "teacher" | "student"; text: string }
const IDEAS = ["Nephrotic vs nephritic syndrome", "Antiepileptic drugs and their side effects", "Brachial plexus injuries", "National Immunization Schedule", "Heart failure: GDMT", "Thyroid function tests"];

export default function PodcastView({ generate, friendlyError, toast, initialTopic }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  initialTopic?: string;
}) {
  const available = useNaturalVoices();
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [deckId, setDeckId] = useState("");
  const [minutes, setMinutes] = useState(4);
  const [language, setLanguage] = useState<"English" | "Hinglish" | "Hindi">("English");
  const [exam, setExam] = useState("NEET-PG");
  const [stage, setStage] = useState<"idle" | "script" | "voice">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [list, setList] = useState<SavedAudio[]>([]);
  const [openId, setOpenId] = useState("");
  const [url, setUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const player = useRef<HTMLAudioElement | null>(null);
  const decks = readDecks();
  useEffect(() => { void listAudio("podcast").then(setList); }, []);
  const open = list.find((x) => x.id === openId) ?? null;
  useEffect(() => {
    if (!open) { setUrl(""); return; }
    const u = URL.createObjectURL(open.mp3);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [open]);

  const make = async () => {
    const deck = decks.find((d) => d.id === deckId);
    const source = deck ? deck.cards.slice(0, 60).map((c) => `Q: ${c.front}\nA: ${c.back}`).join("\n") : "";
    const t = topic.trim() || deck?.title || "";
    if (t.length < 3 && !source) { toast("Give a topic, or choose a flashcard deck"); return; }
    try {
      setStage("script");
      const r = await generate({ action: "podcast-script", topic: t, source, minutes, language, exam });
      const lines: Line[] = r?.result?.lines ?? [];
      if (lines.length < 4) throw new Error("No script came back");
      setStage("voice");
      setProgress({ done: 0, total: lines.length });
      const prefs = readVoicePrefs();
      const lang = language === "Hindi" ? "hi" : language === "English" ? "en" : "";
      // Voice each line with its speaker; a few at a time, kept in order.
      const blobs: Blob[] = new Array(lines.length);
      let next = 0, done = 0;
      const worker = async () => {
        while (next < lines.length) {
          const i = next++;
          const l = lines[i];
          blobs[i] = await fetchSpeech(l.text, { lang, quality: "best", voice: l.who === "student" ? prefs.second : prefs.voice });
          setProgress({ done: ++done, total: lines.length });
        }
      };
      await Promise.all([worker(), worker(), worker()]);
      const mp3 = new Blob(blobs, { type: "audio/mpeg" });
      const item: SavedAudio = { id: Math.random().toString(36).slice(2) + Date.now().toString(36), at: Date.now(), kind: "podcast", title: r.result.title || t, meta: { summary: r.result.summary ?? "", lines, minutes, language, exam }, mp3 };
      await saveAudio(item).catch(() => {});
      setList((l) => [item, ...l.filter((x) => x.id !== item.id)]);
      setOpenId(item.id);
      toast("Your podcast is ready");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setStage("idle"); }
  };

  if (available === false) {
    return (
      <section className="cx-page cx-pod">
        <header className="cx-page-h"><div><h1>Revision Podcasts</h1><p>Short two-voice audio lessons for revision on the go.</p></div></header>
        <div className="cx-empty-state" data-pod="off"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Headphones size={20} /></span><h3>Natural voices aren't set up yet</h3><p>Podcasts need the natural voices on the Cadus server. Until then, answers can still be read aloud with this computer's voice.</p></div>
      </section>
    );
  }

  const lines = (open?.meta.lines ?? []) as Line[];
  return (
    <section className="cx-page cx-pod">
      <header className="cx-page-h"><div><h1>Revision Podcasts</h1><p>Turn a topic or a flashcard deck into a short audio lesson: a teacher and a student talk it through, traps and mnemonics included. Listen on the bus, at the gym or between duties.</p></div></header>
      <div className="cx-hd-ask">
        <input className="cx-input" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 200))} placeholder="Topic, e.g. Nephrotic vs nephritic syndrome" aria-label="Topic" data-pod="topic" />
        {!topic && <div className="cx-cb-ideas">{IDEAS.map((i) => <button key={i} onClick={() => setTopic(i)}>{i}</button>)}</div>}
        <div className="cx-pod-opts">
          {decks.length > 0 && <label className="cx-field"><span>Or from a deck</span><select className="cx-select" value={deckId} onChange={(e) => setDeckId(e.target.value)} data-pod="deck"><option value="">None</option>{decks.map((d) => <option key={d.id} value={d.id}>{d.title} ({d.cards.length})</option>)}</select></label>}
          <div className="cx-field"><span>Length</span><div className="cx-seg">{[3, 5, 8].map((m) => <button key={m} className={minutes === m ? "on" : ""} onClick={() => setMinutes(m)} data-pod-min={m}>{m} min</button>)}</div></div>
          <div className="cx-field"><span>Language</span><div className="cx-seg">{(["English", "Hinglish", "Hindi"] as const).map((l) => <button key={l} className={language === l ? "on" : ""} onClick={() => setLanguage(l)} data-pod-lang={l}>{l}</button>)}</div></div>
          <label className="cx-field"><span>Exam</span><select className="cx-select" value={exam} onChange={(e) => setExam(e.target.value)}>{["NEET-PG", "INI-CET", "FMGE", "University exam", "NExT"].map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <div className="cx-sc-acts">
          <button className="cx-btn primary" onClick={() => void make()} disabled={stage !== "idle" || (topic.trim().length < 3 && !deckId)} data-pod="go">
            {stage === "idle" ? <><Mic2 size={15} /> Make podcast</> : <><Loader2 size={15} className="cx-rot" /> {stage === "script" ? "Writing the script…" : `Recording voices ${progress.done}/${progress.total}…`}</>}
          </button>
          <small className="cx-pc-words">Two voices: change them in Settings › General</small>
        </div>
      </div>

      {open ? (
        <div className="cx-pod-out" data-pod="out">
          <div className="cx-pod-player">
            <button className="cx-pod-play" onClick={() => { const p = player.current; if (!p) return; if (p.paused) void p.play(); else p.pause(); }} aria-label={playing ? "Pause" : "Play"} data-pod="play">{playing ? <Pause size={22} /> : <Play size={22} />}</button>
            <div><b>{open.title}</b><small>{String(open.meta.summary ?? "")} · {String(open.meta.language)} · {String(open.meta.minutes)} min</small></div>
          </div>
          <audio ref={player} controls src={url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} data-pod="audio" />
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => downloadMp3(open.mp3, open.title)} data-pod="download"><Download size={14} /> MP3</button>
            <button className="cx-btn" onClick={async () => { if (!(await shareMp3(open.mp3, open.title, `Revision podcast: ${open.title}`))) { downloadMp3(open.mp3, open.title); toast("Saved the MP3"); } }}><Share2 size={14} /> Share</button>
            <button className="cx-ib" onClick={async () => { await deleteAudio(open.id); setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete podcast"><Trash2 size={15} /></button>
          </div>
          <ol className="cx-pod-script" data-pod="script">{lines.map((l, i) => <li key={i} className={`w-${l.who}`}><b>{l.who === "teacher" ? "Teacher" : "Student"}</b> {l.text}</li>)}</ol>
        </div>
      ) : list.length === 0 && (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Your first podcast</h3><p>Pick a topic above. A 5-minute podcast takes about a minute to make.</p></div>
      )}
      {list.length > 0 && (
        <div className="cx-hd-recent">
          <p className="cx-gl"><span>Your podcasts</span></p>
          {list.map((x) => <button key={x.id} className={`cx-sc-row ${x.id === openId ? "on" : ""}`} onClick={() => setOpenId(x.id)}><b><Headphones size={13} /> {x.title}</b><small>{String(x.meta.language)} · {String(x.meta.minutes)} min · {new Date(x.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Written by Cadus for revision; check anything you will rely on against your textbook. Podcasts are kept on this device.</p>
    </section>
  );
}
