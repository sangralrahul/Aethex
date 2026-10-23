/**
 * Natural voices (ElevenLabs, through the site's own Worker) for everything Cadus reads aloud:
 * answers, voice mode, the Consult Translator, patient audio and revision podcasts. When they
 * aren't set up, are switched off in Settings, or a request fails, the computer's own voice
 * (speech synthesis) is used instead, so reading aloud always works.
 */

export const VOICE_PREF_KEY = "cadus3.voice";
export interface VoicePrefs {
  /** Use natural voices when the server has them. */
  natural: boolean;
  /** The main voice (answers, patient audio, the podcast teacher). "" for the server's default. */
  voice: string;
  /** The second voice (the podcast student). */
  second: string;
}
const DEFAULTS: VoicePrefs = { natural: true, voice: "", second: "EXAVITQu4vr4xnSDxMaL" };
export function readVoicePrefs(): VoicePrefs {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(VOICE_PREF_KEY) || "{}") as Partial<VoicePrefs>) }; } catch { return { ...DEFAULTS }; }
}
export function saveVoicePrefs(p: VoicePrefs) { try { localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(p)); } catch { /* blocked */ } }

let status: Promise<boolean> | null = null;
/** Whether the server has natural voices (asked once per page load). */
export function serverHasVoices(): Promise<boolean> {
  if (!status) status = fetch("/api/voice/status").then((r) => (r.ok ? r.json() : { enabled: false })).then((j) => !!j?.enabled).catch(() => false);
  return status;
}
/** Natural voices are on for this user. */
export async function naturalVoices(): Promise<boolean> { return readVoicePrefs().natural && (await serverHasVoices()); }

export interface VoiceInfo { id: string; name: string; gender: string; accent: string; age: string; description: string; category: string; preview: string }
export async function listVoices(): Promise<{ voices: VoiceInfo[]; default: string }> {
  const r = await fetch("/api/voice/voices");
  if (!r.ok) throw new Error("Couldn't load the voices");
  return r.json();
}

const NAME_TO_CODE: Record<string, string> = { english: "en", hindi: "hi", hinglish: "", bengali: "bn", marathi: "mr", telugu: "te", tamil: "ta", gujarati: "gu", kannada: "kn", malayalam: "ml", punjabi: "pa", odia: "or", urdu: "ur", assamese: "as", nepali: "ne" };
/** "Hindi", "hi-IN" or "hi" to "hi"; "" when unknown (the voice works it out). */
export function langCode(lang: string): string {
  const l = String(lang || "").trim().toLowerCase();
  if (l in NAME_TO_CODE) return NAME_TO_CODE[l];
  const c = l.split(/[-_]/)[0];
  return Object.values(NAME_TO_CODE).includes(c) ? c : "";
}
const BCP47: Record<string, string> = { en: "en-IN", hi: "hi-IN", bn: "bn-IN", mr: "mr-IN", te: "te-IN", ta: "ta-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN", or: "or-IN", ur: "ur-IN", as: "as-IN", ne: "ne-NP" };

/** Text cut into pieces of at most `max` characters, at sentence ends where possible. */
export function splitForSpeech(text: string, max = 2400): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?।॥]+[.!?।॥]+["')\]]*\s*|[^.!?।॥]+$/g) ?? [clean];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (s.length > max) { if (cur) { out.push(cur.trim()); cur = ""; } for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim()); continue; }
    if ((cur + s).length > max) { out.push(cur.trim()); cur = ""; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

export interface SpeakOpts { lang?: string; quality?: "fast" | "best"; voice?: string; onEnd?: () => void }

/** One piece of speech as MP3 from the Worker. Throws with the server's message. */
export async function fetchSpeech(text: string, o: SpeakOpts = {}): Promise<Blob> {
  const r = await fetch("/api/voice/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang: langCode(o.lang ?? ""), quality: o.quality ?? "fast", voice: o.voice || readVoicePrefs().voice || undefined }) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j?.error || `Voice failed (${r.status})`); }
  return r.blob();
}
/** Any length of text as one MP3 (pieces joined; MP3 frames play back to back). */
export async function synthesize(text: string, o: SpeakOpts = {}, onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const parts = splitForSpeech(text);
  const blobs: Blob[] = [];
  for (let i = 0; i < parts.length; i++) { blobs.push(await fetchSpeech(parts[i], o)); onProgress?.(i + 1, parts.length); }
  return new Blob(blobs, { type: "audio/mpeg" });
}

/* ------------------------------------------------------------------ speaking now */

export interface Speaker { stop: () => void }
let current: { stop: () => void } | null = null;
export function stopSpeaking() { try { current?.stop(); } catch { /* gone */ } current = null; try { window.speechSynthesis?.cancel(); } catch { /* none */ } }

/** The computer's own voice, from `text`. */
function systemSpeak(text: string, lang: string, onEnd?: () => void): Speaker {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) { setTimeout(() => onEnd?.(), 0); return { stop: () => {} }; }
  let stopped = false;
  const u = new SpeechSynthesisUtterance(text.slice(0, 8000));
  const code = BCP47[langCode(lang)] ?? "en-IN";
  u.lang = code;
  const v = synth.getVoices().find((x) => x.lang?.toLowerCase().startsWith(code.slice(0, 2)));
  if (v) u.voice = v;
  u.rate = 0.97;
  const end = () => { if (!stopped) { stopped = true; onEnd?.(); } };
  u.onend = end; u.onerror = end;
  synth.cancel();
  synth.speak(u);
  return { stop: () => { stopped = true; synth.cancel(); } };
}

/** Reads text aloud with the natural voice (or the computer's), then calls onEnd. Stops anything already speaking. */
export function speak(text: string, o: SpeakOpts = {}): Speaker {
  stopSpeaking();
  let stopped = false;
  let audio: HTMLAudioElement | null = null;
  let fallback: Speaker | null = null;
  const urls: string[] = [];
  const finish = () => { if (stopped) return; stopped = true; urls.forEach((u) => URL.revokeObjectURL(u)); if (current === me) current = null; o.onEnd?.(); };
  const me: Speaker = {
    stop: () => { if (stopped) return; stopped = true; try { audio?.pause(); } catch { /* gone */ } fallback?.stop(); urls.forEach((u) => URL.revokeObjectURL(u)); },
  };
  current = me;
  void (async () => {
    const parts = splitForSpeech(text);
    if (!parts.length) { finish(); return; }
    if (!(await naturalVoices())) { if (!stopped) fallback = systemSpeak(text, o.lang ?? "", finish); return; }
    // Fetch the next piece while this one plays.
    let next: Promise<Blob> | null = fetchSpeech(parts[0], o);
    for (let i = 0; i < parts.length && !stopped; i++) {
      let blob: Blob;
      try { blob = await next!; } catch {
        if (!stopped) fallback = systemSpeak(parts.slice(i).join(" "), o.lang ?? "", finish);
        return;
      }
      next = i + 1 < parts.length ? fetchSpeech(parts[i + 1], o) : null;
      if (stopped) return;
      const url = URL.createObjectURL(blob);
      urls.push(url);
      audio = new Audio(url);
      const ended = new Promise<void>((res) => { audio!.onended = () => res(); audio!.onerror = () => res(); });
      try { await audio.play(); } catch {
        if (!stopped) fallback = systemSpeak(parts.slice(i).join(" "), o.lang ?? "", finish);
        return;
      }
      await ended;
    }
    finish();
  })();
  return me;
}

/* ------------------------------------------------------------------ saved audio (IndexedDB) */

export interface SavedAudio { id: string; at: number; kind: "podcast" | "patient"; title: string; meta: Record<string, unknown>; mp3: Blob }
const DB_NAME = "cadus-audio";
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("audio", { keyPath: "id" }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function saveAudio(a: SavedAudio) {
  const d = await db();
  await new Promise<void>((res, rej) => { const t = d.transaction("audio", "readwrite"); t.objectStore("audio").put(a); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
  // Keep the newest 20.
  const all = await listAudio(a.kind);
  for (const old of all.slice(20)) await deleteAudio(old.id);
}
export async function listAudio(kind?: SavedAudio["kind"]): Promise<SavedAudio[]> {
  try {
    const d = await db();
    const all = await new Promise<SavedAudio[]>((res, rej) => { const r = d.transaction("audio").objectStore("audio").getAll(); r.onsuccess = () => res(r.result as SavedAudio[]); r.onerror = () => rej(r.error); });
    return all.filter((x) => !kind || x.kind === kind).sort((a, b) => b.at - a.at);
  } catch { return []; }
}
export async function deleteAudio(id: string) {
  const d = await db();
  await new Promise<void>((res) => { const t = d.transaction("audio", "readwrite"); t.objectStore("audio").delete(id); t.oncomplete = () => res(); t.onerror = () => res(); });
}
/** Saves an MP3 through the browser's download (the desktop app shows its Save dialog). */
export function downloadMp3(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 80) || "Cadus audio"}.mp3`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
/** Shares an MP3 to WhatsApp and other apps where the device allows sharing files. */
export async function shareMp3(blob: Blob, name: string, text: string): Promise<boolean> {
  const file = new File([blob], `${name.slice(0, 60) || "Cadus audio"}.mp3`, { type: "audio/mpeg" });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: name, text }); return true; } catch { return false; }
  }
  return false;
}
