// ElevenLabs for Cadus: natural voices (text to speech), and speech to text (Scribe) for voice
// typing and speaker-separated consultation recordings. The key never reaches the browser:
// the pages call these routes on the site's own Worker, which calls ElevenLabs.
//
//   GET  /api/voice/status      { enabled }: whether ELEVENLABS_API_KEY is set
//   GET  /api/voice/voices      the account's voices (id, name, gender, accent, preview)
//   POST /api/voice/speak       { text, voice?, lang?, quality? } -> audio/mpeg
//   POST /api/voice/scribe      multipart: audio (webm, ogg, mp4 or wav), language? -> speaker-separated transcript
//   speechToText()              used by POST /api/transcribe for voice typing (Whisper is the fallback)
//
// Secret: ELEVENLABS_API_KEY (npx wrangler secret put ELEVENLABS_API_KEY).
// Optional variables: ELEVENLABS_VOICE (default voice id), ELEVENLABS_FAST_MODEL, ELEVENLABS_MODEL,
// ELEVENLABS_V3_MODEL, ELEVENLABS_STT_MODEL, ELEVENLABS_DAILY_SPEAK, ELEVENLABS_DAILY_STT.
import { allow, clientIp, currentUser, type AuthEnv } from "./auth";

export interface VoiceEnv extends AuthEnv {
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE?: string;
  ELEVENLABS_FAST_MODEL?: string;
  ELEVENLABS_MODEL?: string;
  ELEVENLABS_V3_MODEL?: string;
  ELEVENLABS_STT_MODEL?: string;
  ELEVENLABS_DAILY_SPEAK?: string;
  ELEVENLABS_DAILY_STT?: string;
  [key: string]: unknown;
}

const API = "https://api.elevenlabs.io/v1";
/** A premade, multilingual voice that every account has (overridden by ELEVENLABS_VOICE or the user's choice). */
export const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";
/** Characters in one speak call; the page splits longer text at sentences. */
export const SPEAK_MAX = 2500;
/** Languages the fast and multilingual models speak well; other Indian languages use the v3 model. */
const CORE_LANGS = new Set(["en", "hi", "ta"]);
const LANGS = new Set(["en", "hi", "ta", "bn", "mr", "te", "gu", "kn", "ml", "pa", "ur", "as", "ne", "or"]);
const VOICE_ID = /^[A-Za-z0-9]{10,40}$/;

const json = (payload: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });
const num = (v: unknown, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };

export const voiceEnabled = (env: VoiceEnv) => typeof env.ELEVENLABS_API_KEY === "string" && env.ELEVENLABS_API_KEY.length > 10;

/** Daily allowance per signed-in account (or per network address when signed out): protects the credits. */
async function withinDaily(request: Request, env: VoiceEnv, kind: "speak" | "stt"): Promise<boolean> {
  if (!env.DB) return true;
  const user = await currentUser(request, env).catch(() => null);
  const base = kind === "speak" ? num(env.ELEVENLABS_DAILY_SPEAK, 400) : num(env.ELEVENLABS_DAILY_STT, 300);
  const limit = user ? base : Math.max(10, Math.round(base / 8));
  return allow(env as AuthEnv & { DB: NonNullable<AuthEnv["DB"]> }, `el:${kind}:${user ? `u:${user.id}` : `ip:${clientIp(request)}`}`, limit, 86400_000).catch(() => true);
}

/** Which model speaks this language at this quality. */
export function ttsModel(env: VoiceEnv, lang: string, quality: "fast" | "best"): { model: string; withLanguage: boolean } {
  if (!CORE_LANGS.has(lang) && lang) return { model: env.ELEVENLABS_V3_MODEL || "eleven_v3", withLanguage: true };
  if (quality === "fast") return { model: env.ELEVENLABS_FAST_MODEL || "eleven_flash_v2_5", withLanguage: !!lang };
  return { model: env.ELEVENLABS_MODEL || "eleven_multilingual_v2", withLanguage: false };
}

async function speak(request: Request, env: VoiceEnv): Promise<Response> {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Send JSON" }, 400); }
  const text = typeof body?.text === "string" ? body.text.replace(/\s+/g, " ").trim() : "";
  if (!text) return json({ error: "No text" }, 400);
  if (text.length > SPEAK_MAX) return json({ error: `At most ${SPEAK_MAX} characters at a time` }, 413);
  const voice = VOICE_ID.test(String(body?.voice)) ? String(body.voice) : VOICE_ID.test(String(env.ELEVENLABS_VOICE)) ? String(env.ELEVENLABS_VOICE) : DEFAULT_VOICE;
  const lang = LANGS.has(String(body?.lang)) ? String(body.lang) : "";
  const quality = body?.quality === "best" ? "best" : "fast";
  if (!(await withinDaily(request, env, "speak"))) return json({ error: "Today's natural-voice allowance is used up. The computer's own voice is used until tomorrow." }, 429);
  const pick = ttsModel(env, lang, quality);
  const fallbackVoice = VOICE_ID.test(String(env.ELEVENLABS_VOICE)) ? String(env.ELEVENLABS_VOICE) : DEFAULT_VOICE;
  const attempt = (model: string, withLanguage: boolean, v = voice) => fetch(`${API}/text-to-speech/${v}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": String(env.ELEVENLABS_API_KEY), "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model, ...(withLanguage && lang ? { language_code: lang } : {}), voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true } }),
  });
  let r = await attempt(pick.model, pick.withLanguage);
  // A voice that isn't in this account (deleted, or a default it lacks): use the default voice.
  if (r.status === 404 && voice !== fallbackVoice) r = await attempt(pick.model, pick.withLanguage, fallbackVoice);
  // A model or language the account can't use: fall back to the multilingual model without a language code.
  if (!r.ok && (r.status === 400 || r.status === 404 || r.status === 422) && pick.model !== (env.ELEVENLABS_MODEL || "eleven_multilingual_v2")) r = await attempt(env.ELEVENLABS_MODEL || "eleven_multilingual_v2", false);
  if (!r.ok || !r.body) {
    const detail = await r.text().catch(() => "");
    console.error("elevenlabs speak failed", r.status, detail.slice(0, 300));
    return json({ error: r.status === 401 ? "The ElevenLabs key isn't valid" : r.status === 429 ? "ElevenLabs is busy; try again in a moment" : "Couldn't make the voice this time" }, r.status === 401 ? 503 : 502);
  }
  return new Response(r.body, { status: 200, headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=3600" } });
}

async function voices(env: VoiceEnv): Promise<Response> {
  const r = await fetch(`${API}/voices`, { headers: { "xi-api-key": String(env.ELEVENLABS_API_KEY) } });
  if (!r.ok) return json({ error: "Couldn't list the voices" }, 502);
  const j: any = await r.json().catch(() => ({}));
  const list = (Array.isArray(j?.voices) ? j.voices : []).slice(0, 120).map((v: any) => ({
    id: String(v?.voice_id ?? ""), name: String(v?.name ?? "").slice(0, 60),
    gender: String(v?.labels?.gender ?? "").slice(0, 20), accent: String(v?.labels?.accent ?? "").slice(0, 40), age: String(v?.labels?.age ?? "").slice(0, 20),
    description: String(v?.labels?.description ?? v?.description ?? "").slice(0, 80), category: String(v?.category ?? "").slice(0, 20),
    preview: typeof v?.preview_url === "string" && v.preview_url.startsWith("https://") ? v.preview_url : "",
  })).filter((v: { id: string }) => VOICE_ID.test(v.id));
  return json({ voices: list, default: VOICE_ID.test(String(env.ELEVENLABS_VOICE)) ? env.ELEVENLABS_VOICE : DEFAULT_VOICE }, 200, { "cache-control": "private, max-age=600" });
}

export interface SttWord { text: string; start?: number; end?: number; type?: string; speaker_id?: string }
/** ElevenLabs speech to text. Tries the configured model, then scribe_v2, then scribe_v1. Throws on failure. */
export async function speechToText(env: VoiceEnv, audio: Blob, filename: string, opts: { language?: string; diarize?: boolean; speakers?: number } = {}): Promise<{ text: string; words: SttWord[]; language: string }> {
  const models = [...new Set([env.ELEVENLABS_STT_MODEL, "scribe_v2", "scribe_v1"].filter(Boolean) as string[])];
  let last = 0;
  for (const model of models) {
    const fd = new FormData();
    fd.append("model_id", model);
    fd.append("file", audio, filename);
    if (opts.language && LANGS.has(opts.language)) fd.append("language_code", opts.language);
    fd.append("tag_audio_events", "false");
    if (opts.diarize) { fd.append("diarize", "true"); if (opts.speakers) fd.append("num_speakers", String(opts.speakers)); }
    const r = await fetch(`${API}/speech-to-text`, { method: "POST", headers: { "xi-api-key": String(env.ELEVENLABS_API_KEY) }, body: fd });
    if (r.ok) {
      const j: any = await r.json();
      return { text: typeof j?.text === "string" ? j.text : "", words: Array.isArray(j?.words) ? j.words : [], language: String(j?.language_code ?? "") };
    }
    last = r.status;
    if (r.status !== 400 && r.status !== 404 && r.status !== 422) break;
  }
  throw new Error(`elevenlabs stt ${last}`);
}

/** Words to turns: consecutive words by the same speaker joined. */
export function turnsFromWords(words: SttWord[]): { speaker: string; text: string; start: number; end: number }[] {
  const turns: { speaker: string; text: string; start: number; end: number }[] = [];
  for (const w of words) {
    if (w.type === "audio_event") continue;
    const sp = String(w.speaker_id ?? "speaker_0");
    const t = turns.at(-1);
    if (t && t.speaker === sp) { t.text += w.text; t.end = Number(w.end ?? t.end); }
    else turns.push({ speaker: sp, text: w.text, start: Number(w.start ?? 0), end: Number(w.end ?? 0) });
  }
  return turns.map((t) => ({ ...t, text: t.text.replace(/\s+/g, " ").trim() })).filter((t) => t.text);
}

const AUDIO_TYPES = /^audio\/(?:webm|ogg|mp4|mpeg|wav|x-wav|wave|aac|x-m4a)(?:;|$)/;
async function scribe(request: Request, env: VoiceEnv): Promise<Response> {
  if (Number(request.headers.get("content-length") || 0) > 60_000_000) return json({ error: "That recording is too long. Record up to about an hour." }, 413);
  let form: FormData;
  try { form = await request.formData(); } catch { return json({ error: "Send the recording as a form" }, 400); }
  const file = form.get("audio");
  if (!file || typeof file === "string") return json({ error: "No recording" }, 400);
  const blob = file as Blob;
  if (!AUDIO_TYPES.test(blob.type || "")) return json({ error: "Send audio (webm, ogg, mp4 or wav)" }, 400);
  if (blob.size < 2000) return json({ error: "That recording is empty" }, 400);
  if (!(await withinDaily(request, env, "stt"))) return json({ error: "Today's transcription allowance is used up. Try again tomorrow." }, 429);
  const language = String(form.get("language") || "");
  const speakers = Math.min(4, Math.max(0, Number(form.get("speakers")) || 0));
  try {
    const r = await speechToText(env, blob, `consultation.${(blob.type.split("/")[1] || "webm").split(";")[0]}`, { language: LANGS.has(language) ? language : undefined, diarize: true, speakers: speakers || undefined });
    const turns = turnsFromWords(r.words);
    return json({ text: r.text.trim(), language: r.language, turns: turns.length ? turns : r.text.trim() ? [{ speaker: "speaker_0", text: r.text.trim(), start: 0, end: 0 }] : [] });
  } catch (e) {
    console.error("elevenlabs scribe failed", e);
    return json({ error: "Couldn't transcribe the recording this time. Please try again." }, 502);
  }
}

/** /api/voice/*: null when the path isn't one of these. */
export async function handleVoice(request: Request, env: VoiceEnv): Promise<Response | null> {
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  if (!path.startsWith("/api/voice")) return null;
  if (path === "/api/voice/status") return json({ enabled: voiceEnabled(env) });
  if (!voiceEnabled(env)) return json({ error: "Natural voices aren't set up on the server" }, 503);
  if (path === "/api/voice/voices") return request.method === "GET" ? voices(env) : json({ error: "Use GET" }, 405);
  if (request.method !== "POST") return json({ error: "Use POST" }, 405);
  if (path === "/api/voice/speak") return speak(request, env);
  if (path === "/api/voice/scribe") return scribe(request, env);
  return json({ error: "Unknown voice route" }, 404);
}
