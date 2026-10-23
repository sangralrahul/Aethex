/**
 * Voice typing where the browser has no speech service of its own: the Cadus desktop app
 * (Electron) and browsers such as Firefox. The microphone is recorded in the page, cut into
 * pieces at pauses, and each piece is sent as a small 16 kHz WAV to the site's own Worker
 * (POST /api/transcribe), which transcribes it. Silence is never sent.
 *
 * ServerRecognition behaves like the browser's SpeechRecognition for the parts Cadus uses
 * (lang, continuous, interimResults, onresult, onerror, onend, start, stop, abort), so every
 * place that takes dictation works unchanged.
 */

/** Whisper's code for a BCP-47 speech language, or "" to let it detect the language. */
const WHISPER: Record<string, string> = { en: "en", hi: "hi", bn: "bn", mr: "mr", te: "te", ta: "ta", gu: "gu", kn: "kn", ml: "ml", pa: "pa", ur: "ur", as: "as", ne: "ne" };
export const whisperLanguage = (lang: string) => WHISPER[String(lang || "").toLowerCase().split("-")[0]] ?? "";

export const canRecord = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && !!((window as any).AudioContext || (window as any).webkitAudioContext);

/** Mono float samples at any rate to a 16 kHz, 16-bit mono WAV. */
export function encodeWav16k(chunks: Float32Array[], rate: number): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const ratio = rate / 16000;
  const out = Math.max(0, Math.floor(total / ratio));
  const pcm = new Int16Array(out);
  // Average the samples that fall into each output sample (a simple low-pass for downsampling).
  let ci = 0, pos = 0;
  const flat = (i: number) => { while (ci < chunks.length && i - pos >= chunks[ci].length) { pos += chunks[ci].length; ci++; } return ci < chunks.length ? chunks[ci][i - pos] : 0; };
  for (let o = 0; o < out; o++) {
    const a = Math.floor(o * ratio), b = Math.max(a + 1, Math.floor((o + 1) * ratio));
    let s = 0;
    for (let i = a; i < b; i++) s += flat(i);
    const v = Math.max(-1, Math.min(1, s / (b - a)));
    pcm[o] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const dv = new DataView(buf);
  const str = (p: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(p + i, s.charCodeAt(i)); };
  str(0, "RIFF"); dv.setUint32(4, 36 + pcm.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 16000, true);
  dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, "data"); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  return new Uint8Array(buf);
}

const b64 = (bytes: Uint8Array) => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };

/** Sends one WAV to the Worker; resolves with the text ("" for nothing heard). Throws an error code. */
export async function transcribeWav(wav: Uint8Array, lang: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/transcribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio: b64(wav), language: whisperLanguage(lang) }) });
  } catch { throw new Error("network"); }
  const j = await res.json().catch(() => ({}));
  if (res.status === 503) throw new Error("server-unavailable");
  if (!res.ok) throw new Error(res.status === 413 ? "too-long" : "network");
  return typeof j.text === "string" ? j.text.trim() : "";
}

type Ev = { resultIndex: number; results: any[] };

export class ServerRecognition {
  lang = "en-IN";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: Ev) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private rate = 48000;
  private chunkMs = 0;
  private speechMs = 0;
  private silenceMs = 0;
  private totalMs = 0;
  private heard = false;
  private noise = 0.004;
  private ended = false;
  private stopping = false;
  private results: any[] = [];
  private queue: Promise<void> = Promise.resolve();

  async start() {
    if (!canRecord()) { this.fail("audio-capture"); return; }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e: any) {
      this.fail(e?.name === "NotAllowedError" || e?.name === "SecurityError" ? "not-allowed" : "audio-capture");
      return;
    }
    if (this.stopping || this.ended) { this.teardown(); this.finish(); return; }
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC() as AudioContext;
    this.rate = this.ctx.sampleRate;
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (e) => this.frame(e.inputBuffer.getChannelData(0));
    src.connect(this.node);
    this.node.connect(this.ctx.destination);
    this.onstart?.();
  }

  /** Stop listening; whatever was said is still transcribed, then onend. */
  stop() {
    if (this.stopping || this.ended) return;
    this.stopping = true;
    this.flush();
    this.teardown();
    void this.queue.then(() => this.finish());
  }

  /** Stop at once and drop what was said. */
  abort() {
    this.stopping = true;
    this.chunks = [];
    this.teardown();
    this.finish();
  }

  private frame(data: Float32Array) {
    if (this.stopping) return;
    this.chunks.push(new Float32Array(data));
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    const ms = (data.length / this.rate) * 1000;
    this.totalMs += ms; this.chunkMs += ms;
    // Learn the room's noise in quiet moments; speech is clearly above it.
    if (rms < this.noise * 2) this.noise = this.noise * 0.95 + rms * 0.05;
    const speaking = rms > Math.max(0.012, this.noise * 3.5);
    if (speaking) { this.speechMs += ms; this.silenceMs = 0; this.heard = true; } else this.silenceMs += ms;
    if (this.continuous) {
      if ((this.speechMs > 400 && this.silenceMs > 900) || this.chunkMs > 25000) this.flush();
    } else if (this.heard && this.speechMs > 300 && this.silenceMs > 1400) this.stop();
    else if (!this.heard && this.totalMs > 8000) { this.fail("no-speech"); }
    else if (this.totalMs > 60000) this.stop();
  }

  /** Transcribe what was recorded since the last piece, in order. */
  private flush() {
    const chunks = this.chunks, speech = this.speechMs, rate = this.rate;
    this.chunks = []; this.chunkMs = 0; this.speechMs = 0; this.silenceMs = 0;
    if (speech < 250 || !chunks.length) return;
    const wav = encodeWav16k(chunks, rate);
    const lang = this.lang;
    this.queue = this.queue.then(async () => {
      if (this.ended) return;
      try {
        const text = await transcribeWav(wav, lang);
        if (!text || this.ended) return;
        const r: any = [{ transcript: (this.results.length ? " " : "") + text, confidence: 1 }];
        r.isFinal = true;
        this.results.push(r);
        this.onresult?.({ resultIndex: this.results.length - 1, results: this.results });
      } catch (e) {
        this.onerror?.({ error: e instanceof Error ? e.message : "network" });
      }
    });
  }

  private fail(code: string) {
    this.stopping = true;
    this.teardown();
    this.onerror?.({ error: code });
    this.finish();
  }

  private teardown() {
    try { this.node?.disconnect(); } catch { /* gone */ }
    if (this.node) this.node.onaudioprocess = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => {});
    this.node = null; this.stream = null; this.ctx = null;
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    this.onend?.();
  }
}
