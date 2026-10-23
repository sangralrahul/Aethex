// POST /api/transcribe: voice typing for the Cadus desktop app and browsers without their own
// speech service. The page sends a short 16 kHz WAV (a piece of speech cut at a pause, base64);
// Cloudflare Workers AI (Whisper) transcribes it. Nothing is stored.
// Needs the Workers AI binding "AI" (wrangler.jsonc); without it this answers 503 and the app
// says voice typing isn't set up yet.

export interface AiBinding { run: (model: string, input: Record<string, unknown>) => Promise<any> }

export const TRANSCRIBE_MODEL = "@cf/openai/whisper-large-v3-turbo";
/** About 4 minutes of 16 kHz mono WAV, as base64. */
export const MAX_AUDIO_B64 = 10_500_000;
const LANGS = new Set(["en", "hi", "bn", "mr", "te", "ta", "gu", "kn", "ml", "pa", "ur", "as", "ne"]);
// Steers spelling of clinical words in English dictation.
const MEDICAL_PROMPT = "Clinical dictation by a doctor in India. Tab. paracetamol 650 mg BD, inj. ceftriaxone 1 g IV OD, HbA1c, eGFR, CBC, LFT, KFT, ECG, SpO2, BP 130/80, NEET-PG, MBBS.";
// Whisper sometimes "hears" these in near-silence; a piece that is only this is dropped.
const PHANTOMS = /^(?:thank you\.?|thanks for watching\.?|thank you for watching\.?|you\.?|bye\.?|\.+|subtitles by .*)$/i;

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function handleTranscribe(request: Request, ai: AiBinding | undefined): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Use POST" }, 405);
  if (!ai || typeof ai.run !== "function") return json({ error: "Voice typing isn't set up on the server yet" }, 503);
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_AUDIO_B64 + 2000) return json({ error: "Too long to transcribe in one go" }, 413);
  let body: any;
  try { body = await request.json(); } catch { return json({ error: "Send JSON" }, 400); }
  const audio = typeof body?.audio === "string" ? body.audio : "";
  if (!audio) return json({ error: "No audio" }, 400);
  if (audio.length > MAX_AUDIO_B64) return json({ error: "Too long to transcribe in one go" }, 413);
  // Only WAV from the page's recorder: the first bytes must read "RIFF....WAVE".
  let head = "";
  try { head = atob(audio.slice(0, 16)); } catch { return json({ error: "Audio must be base64" }, 400); }
  if (!head.startsWith("RIFF") || head.slice(8, 12) !== "WAVE") return json({ error: "Audio must be a WAV file" }, 400);
  const language = LANGS.has(String(body?.language)) ? String(body.language) : "";
  try {
    const r = await ai.run(TRANSCRIBE_MODEL, {
      audio,
      task: "transcribe",
      vad_filter: true,
      ...(language ? { language } : {}),
      ...(language === "en" || !language ? { initial_prompt: MEDICAL_PROMPT } : {}),
    });
    let text = typeof r?.text === "string" ? r.text.replace(/\s+/g, " ").trim() : "";
    if (PHANTOMS.test(text)) text = "";
    return json({ text: text.slice(0, 8000) });
  } catch (e) {
    console.error("transcribe failed", e);
    return json({ error: "Couldn't transcribe that. Please try again." }, 502);
  }
}
