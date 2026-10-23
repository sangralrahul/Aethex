/**
 * Patient Audio Library: ready spoken explainers on the topics doctors explain every day (diabetes
 * diet, ORS, TB treatment, insulin, danger signs in pregnancy…) in 13 Indian languages, in a natural
 * voice or the doctor's own. Each is made once, kept on this device, and played in clinic or sent
 * on WhatsApp.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Download, Library, Loader2, Pause, Play, Share2, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { deleteAudio, downloadMp3, langCode, listAudio, readVoicePrefs, saveAudio, shareMp3, synthesize, type SavedAudio } from "@/lib/cadus/voice";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { useNaturalVoices } from "./AudioParts";

export interface AudioTopic { id: string; group: string; title: string; listener?: string }
export const AUDIO_TOPICS: AudioTopic[] = [
  { id: "dm-diet", group: "Diabetes and BP", title: "Diabetes: food, walking and daily care" },
  { id: "insulin", group: "Diabetes and BP", title: "Using insulin at home: storage, injection sites and low sugar" },
  { id: "hypo", group: "Diabetes and BP", title: "Low blood sugar: the signs and what to do at once" },
  { id: "bp", group: "Diabetes and BP", title: "High blood pressure: daily medicines and less salt" },
  { id: "ors", group: "Children", title: "Diarrhoea in children: ORS and zinc at home", listener: "Parent of a young child" },
  { id: "fever-child", group: "Children", title: "Fever in children: care at home and danger signs", listener: "Parent of a young child" },
  { id: "breastfeeding", group: "Children", title: "Breastfeeding in the first six months", listener: "New mother and family" },
  { id: "vaccines", group: "Children", title: "Why every vaccination visit matters", listener: "Parent of a young child" },
  { id: "preg-danger", group: "Pregnancy", title: "Danger signs in pregnancy: go to hospital at once", listener: "Pregnant woman and family" },
  { id: "ifa", group: "Pregnancy", title: "Iron and folic acid tablets in pregnancy", listener: "Pregnant woman" },
  { id: "postnatal", group: "Pregnancy", title: "After delivery: care of the mother and the newborn", listener: "New mother and family" },
  { id: "tb", group: "Infections", title: "TB treatment: taking every dose until the end" },
  { id: "dengue", group: "Infections", title: "Dengue: fluids, rest and warning signs" },
  { id: "malaria", group: "Infections", title: "Malaria: finishing the treatment and preventing bites" },
  { id: "antibiotics", group: "Infections", title: "Antibiotics: take them only as prescribed and finish the course" },
  { id: "inhaler", group: "Heart and lungs", title: "Asthma and COPD inhalers: how to use them right" },
  { id: "heart-attack", group: "Heart and lungs", title: "Heart attack warning signs: what to do" },
  { id: "stroke", group: "Heart and lungs", title: "Stroke: recognise it fast and reach hospital" },
  { id: "wound", group: "Everyday care", title: "After an operation: wound care at home" },
  { id: "snakebite", group: "Everyday care", title: "Snakebite: first aid and what not to do" },
  { id: "ckd", group: "Everyday care", title: "Kidney disease: food, fluids and medicines to avoid" },
  { id: "anaemia", group: "Everyday care", title: "Anaemia: iron-rich food and tablets" },
  { id: "tobacco", group: "Everyday care", title: "Quitting tobacco and smoking: how to start" },
];
const GROUPS = [...new Set(AUDIO_TOPICS.map((t) => t.group))];
const LISTENERS = ["", "Adult patient", "Elderly patient and family", "Parent of a young child", "Pregnant woman and family", "Teenager"];

export default function AudioLibraryView({ generate, friendlyError, toast, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  defaultLanguage: string;
}) {
  const available = useNaturalVoices();
  const own = readVoicePrefs().own ?? null;
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "Hindi");
  const [group, setGroup] = useState(GROUPS[0]);
  const [custom, setCustom] = useState("");
  const [notes, setNotes] = useState("");
  const [listener, setListener] = useState("");
  const [mine, setMine] = useState(false);
  const [busy, setBusy] = useState<{ title: string; stage: string } | null>(null);
  const [list, setList] = useState<SavedAudio[]>([]);
  const [openId, setOpenId] = useState("");
  const [url, setUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const player = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { void listAudio("library").then(setList); }, []);
  const open = list.find((x) => x.id === openId) ?? null;
  useEffect(() => {
    if (!open) { setUrl(""); return; }
    const u = URL.createObjectURL(open.mp3);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [open]);
  /** Saved explainers by topic and language, so a topic made once plays at once next time. */
  const saved = useMemo(() => new Map(list.map((x) => [`${x.meta.topic}|${x.meta.language}|${x.meta.mine ? 1 : 0}`, x])), [list]);

  const make = async (topic: string, preset?: AudioTopic) => {
    const t = topic.trim();
    if (t.length < 3) { toast("Choose or type a topic"); return; }
    const useMine = mine && !!own;
    const have = !notes.trim() && saved.get(`${t}|${language}|${useMine ? 1 : 0}`);
    if (have) { setOpenId(have.id); setTimeout(() => void player.current?.play().catch(() => {}), 50); return; }
    setBusy({ title: t, stage: "Writing it in " + language + "…" });
    try {
      const r = await generate({ action: "audio-topic", topic: t, language, notes: notes.trim(), audience: listener || preset?.listener || "" });
      if (!r?.script) throw new Error("Couldn't write the explainer");
      setBusy({ title: t, stage: "Recording the voice…" });
      const mp3 = await synthesize(r.script, { lang: langCode(language), quality: "best", ...(useMine ? { voice: own!.id } : {}) }, (d, n) => setBusy({ title: t, stage: n > 1 ? `Recording the voice ${d}/${n}…` : "Recording the voice…" }));
      const item: SavedAudio = { id: Math.random().toString(36).slice(2) + Date.now().toString(36), at: Date.now(), kind: "library", title: t, meta: { topic: t, language, mine: useMine, script: r.script, notes: notes.trim() }, mp3 };
      await saveAudio(item).catch(() => {});
      setList((l) => [item, ...l.filter((x) => x.id !== item.id)]);
      setOpenId(item.id);
      toast("Ready to play or send");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(null); }
  };

  if (available === false) {
    return (
      <section className="cx-page cx-alib">
        <header className="cx-page-h"><div><h1>Patient Audio Library</h1><p>Spoken explainers for patients in their language.</p></div></header>
        <div className="cx-empty-state" data-alib="off"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Library size={20} /></span><h3>Natural voices aren't set up yet</h3><p>The audio library needs the natural voices on the Cadus server. Printed leaflets still work in Patient leaflets.</p></div>
      </section>
    );
  }

  const share = async (x: SavedAudio) => {
    if (!(await shareMp3(x.mp3, x.title, `${x.title} (${String(x.meta.language)})`))) { downloadMp3(x.mp3, `${x.title} - ${String(x.meta.language)}`); toast("Saved the MP3: send it on WhatsApp from your files"); }
  };
  return (
    <section className="cx-page cx-alib">
      <header className="cx-page-h"><div><h1>Patient Audio Library</h1><p>Short spoken explainers on what you explain every day, in the patient's language. Play one in clinic or send it on WhatsApp, for patients and families who find reading hard.</p></div></header>
      <div className="cx-alib-bar">
        <label className="cx-field"><span>Language</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} data-alib="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
        <label className="cx-field"><span>Listener</span><select className="cx-select" value={listener} onChange={(e) => setListener(e.target.value)}>{LISTENERS.map((l) => <option key={l} value={l}>{l || "Suited to the topic"}</option>)}</select></label>
        {own && <label className="cx-pa-mine"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} data-alib="mine" /> In my voice</label>}
      </div>
      <details className="cx-alib-notes">
        <summary>Add your own instructions (clinic name, follow-up day, your advice)</summary>
        <textarea className="cx-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 1500))} placeholder="e.g. Dr Mehta's clinic. Come back on Monday with your sugar chart. Walk 30 minutes every evening." data-alib="notes" />
        <small className="cx-set-hint">Followed exactly, and they take priority over general advice. Don't add patient names.</small>
      </details>
      <div className="cx-seg cx-alib-groups" role="tablist">{GROUPS.map((g) => <button key={g} role="tab" aria-selected={group === g} className={group === g ? "on" : ""} onClick={() => setGroup(g)}>{g}</button>)}</div>
      <div className="cx-alib-grid" data-alib="topics">
        {AUDIO_TOPICS.filter((t) => t.group === group).map((t) => {
          const have = saved.get(`${t.title}|${language}|${mine && own ? 1 : 0}`);
          const making = busy?.title === t.title;
          return (
            <button key={t.id} className={`cx-alib-topic ${have ? "have" : ""}`} onClick={() => void make(t.title, t)} disabled={!!busy} data-alib-topic={t.id}>
              {making ? <Loader2 size={15} className="cx-rot" /> : have ? <Play size={15} /> : <AudioLines size={15} />}
              <span><b>{t.title}</b><small>{making ? busy!.stage : have ? `Saved · ${language}` : `Make in ${language}`}</small></span>
            </button>
          );
        })}
      </div>
      <form className="cx-alib-custom" onSubmit={(e) => { e.preventDefault(); void make(custom); }}>
        <input className="cx-input" value={custom} onChange={(e) => setCustom(e.target.value.slice(0, 160))} placeholder="Any other topic, e.g. Care after cataract surgery" aria-label="Other topic" data-alib="custom" />
        <button className="cx-btn primary" type="submit" disabled={!!busy || custom.trim().length < 3} data-alib="make"><Sparkles size={14} /> Make</button>
      </form>
      {busy && busy.title === custom.trim() && <p className="cx-set-hint"><Loader2 size={13} className="cx-rot" /> {busy.stage}</p>}

      {open && (
        <div className="cx-pod-out" data-alib="out">
          <div className="cx-pod-player">
            <button className="cx-pod-play" onClick={() => { const p = player.current; if (!p) return; if (p.paused) void p.play(); else p.pause(); }} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={22} /> : <Play size={22} />}</button>
            <div><b>{open.title}</b><small>{String(open.meta.language)}{open.meta.mine ? " · in your voice" : ""}</small></div>
          </div>
          <audio ref={player} controls src={url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} data-alib="audio" />
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => void share(open)} data-alib="share"><Share2 size={14} /> WhatsApp or share</button>
            <button className="cx-btn" onClick={() => downloadMp3(open.mp3, `${open.title} - ${String(open.meta.language)}`)} data-alib="download"><Download size={14} /> MP3</button>
            <button className="cx-ib" onClick={async () => { await deleteAudio(open.id); setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
          <details className="cx-pa-script"><summary>What it says</summary><p>{String(open.meta.script ?? "")}</p></details>
        </div>
      )}
      {list.length > 0 ? (
        <div className="cx-hd-recent">
          <p className="cx-gl"><span>Your library ({list.length})</span></p>
          {list.map((x) => <button key={x.id} className={`cx-sc-row ${x.id === openId ? "on" : ""}`} onClick={() => setOpenId(x.id)}><b><AudioLines size={13} /> {x.title}</b><small>{String(x.meta.language)}{x.meta.mine ? " · your voice" : ""}{x.meta.notes ? " · with your instructions" : ""} · {new Date(x.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
        </div>
      ) : !busy && (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Library size={20} /></span><h3>Build your library</h3><p>Tap a topic to make it in {language}. It takes about half a minute and is kept on this device to play again.</p></div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Written by Cadus from general guidance: listen to each one before you share it, and add your own instructions where your advice differs.</p>
    </section>
  );
}
