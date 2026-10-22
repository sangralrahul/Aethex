/**
 * Presentation Coach: present a case out loud (or type it) the way you would on a ward
 * round, in an exam or on a referral call. A timer runs while you speak; Cadus scores it
 * against the format's rubric, lists what was missing, asks the questions a consultant
 * would ask next, and shows the same case presented well.
 */
import { useEffect, useRef, useState } from "react";
import { Clock, Copy, Mic, MicOff, Presentation, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { PRESENT_FORMATS, readPresents, savePresents, sid, type PresentRecord } from "@/lib/cadus/studio";

const W = typeof window !== "undefined" ? (window as any) : {};
const canListen = !!(W.SpeechRecognition || W.webkitSpeechRecognition);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function PresentCoachView({ generate, friendlyError, toast, onAsk }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onAsk: (q: string) => void;
}) {
  const [format, setFormat] = useState("rounds");
  const [level, setLevel] = useState<"mbbs" | "intern" | "pg">("mbbs");
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [started, setStarted] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<PresentRecord[]>(readPresents);
  const [openId, setOpenId] = useState("");
  const recRef = useRef<any>(null);
  const baseRef = useRef("");
  useEffect(() => savePresents(list), [list]);
  useEffect(() => {
    if (!started) return;
    const t = window.setInterval(() => setElapsed((Date.now() - started) / 1000), 500);
    return () => window.clearInterval(t);
  }, [started]);
  useEffect(() => () => { try { recRef.current?.abort?.(); } catch { /* ignore */ } }, []);
  const fmt = PRESENT_FORMATS.find((f) => f.id === format)!;
  const open = list.find((x) => x.id === openId) ?? null;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const listen = () => {
    if (!canListen) { toast("Voice isn't available in this browser; type the presentation, or use Chrome or Edge"); return; }
    if (listening) { try { recRef.current?.stop(); } catch { /* ignore */ } return; }
    const R = W.SpeechRecognition || W.webkitSpeechRecognition;
    const rec = new R();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = true;
    baseRef.current = text ? `${text.trim()} ` : "";
    let finals = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals += `${r[0].transcript} `; else interim += r[0].transcript;
      }
      setText(`${baseRef.current}${finals}${interim}`.replace(/\s{2,}/g, " "));
    };
    rec.onerror = (e: any) => { if (e?.error === "not-allowed") toast("Allow the microphone to present by voice"); };
    rec.onend = () => { setListening(false); setStarted(0); };
    recRef.current = rec;
    setSpoken(true);
    setListening(true);
    setElapsed(0);
    setStarted(Date.now());
    try { rec.start(); } catch { setListening(false); setStarted(0); }
  };

  const score = async () => {
    if (listening) { try { recRef.current?.stop(); } catch { /* ignore */ } }
    const clean = deidentify(text.trim()).text;
    if (clean.split(/\s+/).length < 15) { toast("Present the case in a few sentences at least"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "present-coach", text: clean, format, level, spoken });
      if (!r?.result) throw new Error("No score came back");
      const secs = spoken && elapsed ? Math.round(elapsed) : Math.round((clean.split(/\s+/).length / 150) * 60);
      const rec: PresentRecord = { id: sid(), at: Date.now(), format, seconds: secs, words: clean.split(/\s+/).length, text: clean, result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  if (open) {
    const r = open.result;
    const f = PRESENT_FORMATS.find((x) => x.id === open.format) ?? fmt;
    const over = open.seconds > f.seconds * 1.25;
    const tone = r.score >= 75 ? "good" : r.score >= 50 ? "mid" : "low";
    return (
      <section className="cx-page cx-pc">
        <header className="cx-page-h"><div><h1>Presentation feedback</h1><p>{f.label} · {open.words} words · {mmss(open.seconds)}{open.seconds ? "" : ""}</p></div></header>
        <div className="cx-sim-debrief" data-pc="result">
          <div className={`cx-sim-score ${tone}`}><Trophy size={20} /><b>{r.score}</b><small>out of 100</small></div>
          <div className="cx-sim-dx">
            <p className={`cx-pc-time ${over ? "over" : ""}`}><Clock size={14} /> {mmss(open.seconds)} {over ? `· aim for under ${mmss(f.seconds)}` : `· within ${mmss(f.seconds)}`}</p>
            <div className="cx-pc-rubric">
              {r.rubric.map((x) => <div key={x.item} className="cx-pc-row"><span>{x.item}</span><span className="cx-pc-bar"><i style={{ width: `${x.score * 10}%` }} className={x.score >= 7 ? "g" : x.score >= 4 ? "m" : "l"} /></span><b>{x.score}/10</b>{x.note && <small>{x.note}</small>}</div>)}
            </div>
          </div>
        </div>
        <div className="cx-sim-cols">
          {r.strengths.length > 0 && <div className="cx-sim-card ok"><h3>What went well</h3><ul>{r.strengths.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {r.improve.length > 0 && <div className="cx-sim-card warn"><h3>Do better</h3><ul>{r.improve.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {r.missing.length > 0 && <div className="cx-sim-card bad"><h3>Missing</h3><ul>{r.missing.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {r.questions.length > 0 && <div className="cx-sim-card"><h3>They'll now ask</h3><ul>{r.questions.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        </div>
        <div className="cx-sc-note" data-pc="model"><h3 className="cx-lab-h3">The same case, presented well</h3><MdBlock text={r.model} /></div>
        <div className="cx-sc-acts">
          <button className="cx-btn primary" onClick={() => { setOpenId(""); setText(""); setSpoken(false); setElapsed(0); }}><RotateCcw size={14} /> Present again</button>
          <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(r.model); toast("Copied"); }}><Copy size={14} /> Copy the model</button>
          {r.questions[0] && <button className="cx-btn" onClick={() => onAsk(`Answer this as I would to an examiner, then teach me: ${r.questions[0]}`)}>Practise the first question</button>}
        </div>
      </section>
    );
  }

  return (
    <section className="cx-page cx-pc">
      <header className="cx-page-h"><div><h1>Presentation Coach</h1><p>Present a case as you would on rounds, in an exam or on a call. Speak or type; Cadus scores it, shows what was missing and how a consultant would present it.</p></div></header>
      <div className="cx-sc-kinds" role="radiogroup" aria-label="Format">
        {PRESENT_FORMATS.map((f) => <button key={f.id} role="radio" aria-checked={format === f.id} className={format === f.id ? "on" : ""} onClick={() => setFormat(f.id)} data-pc-format={f.id}><b>{f.label}</b><small>{f.hint}</small></button>)}
      </div>
      <div className="cx-pc-opts">
        <div className="cx-seg" aria-label="Your level">{(["mbbs", "intern", "pg"] as const).map((l) => <button key={l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>{l === "mbbs" ? "MBBS" : l === "intern" ? "Intern" : "PG"}</button>)}</div>
        <span className={`cx-pc-timer ${elapsed > fmt.seconds ? "over" : ""}`} data-pc="timer"><Clock size={14} /> {mmss(elapsed)} / {mmss(fmt.seconds)}</span>
      </div>
      <textarea className="cx-input cx-pc-text" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={format === "sbar" ? "S: I'm calling about… B: … A: … R: I'd like you to…" : "e.g. This is Mr X, a 58-year-old man, day 3 of admission with community-acquired pneumonia…"} maxLength={12000} aria-label="Your presentation" data-pc="text" />
      <div className="cx-sc-acts">
        {canListen && <button className={`cx-btn ${listening ? "rec" : ""}`} onClick={listen} data-pc="mic">{listening ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Present by voice</>}</button>}
        <button className="cx-btn primary" onClick={() => void score()} disabled={busy || words < 15} data-pc="go"><Presentation size={14} /> {busy ? "Listening back…" : "Score my presentation"}</button>
        <small className="cx-pc-words">{words} words</small>
      </div>
      <p className="cx-rs-foot">Use initials or "the patient", not names; names and numbers are hidden before scoring.</p>
      {list.length > 0 ? (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Your presentations</span></p>
          {list.slice(0, 10).map((x) => <button key={x.id} className="cx-sc-row" onClick={() => setOpenId(x.id)}><b>{PRESENT_FORMATS.find((f) => f.id === x.format)?.label} · {x.result.score}/100</b><small>{x.text.slice(0, 80)}… · {new Date(x.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
        </div>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Your first presentation</h3><p>Pick a format, then speak or type the case as you would present it.</p></div>
      )}
    </section>
  );
}
