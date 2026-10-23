/**
 * Case Simulator: a live patient for practice. Cadus writes a hidden case; the learner
 * asks, examines, orders tests, treats or calls a senior; the patient, nurse and lab
 * answer and the vitals change with time and treatment. Finishing (or the patient
 * dying) gives a scored debrief with the diagnosis, what was missed and teaching points.
 */
import { useEffect, useRef, useState } from "react";
import { Activity, AudioLines, Check, Clock, Flag, HeartPulse, MessageCircle, RotateCcw, Send, Sparkles, Stethoscope, Trophy, TriangleAlert, UserRound, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import VoiceMode, { voiceSupported } from "./VoiceMode";
import { pickVoice, preloadVoices } from "@/lib/cadus/voice";
import {
  readSims, saveSims, SIM_ACTION_DEFS, SIM_DIFFICULTIES, SIM_LEVELS, SIM_SPECIALTIES, simKindFromSpeech, uid, vitalFlag,
  type SimAction, type SimCase, type SimDebrief, type SimEntry, type SimRecord, type SimStatus, type SimVitals,
} from "@/lib/cadus/labs";

const STATUS_LABEL: Record<SimStatus, string> = { stable: "Stable", improving: "Improving", worsening: "Worsening", critical: "Critical", recovered: "Recovered", died: "Died" };
const VITALS: { key: keyof SimVitals; label: string; unit: string }[] = [
  { key: "hr", label: "HR", unit: "/min" },
  { key: "sbp", label: "BP", unit: "mmHg" },
  { key: "rr", label: "RR", unit: "/min" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "temp", label: "Temp", unit: "°C" },
];

export default function CaseSimView({ generate, friendlyError, toast, onAsk }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onAsk: (q: string) => void;
}) {
  const [specialty, setSpecialty] = useState("Any");
  const [level, setLevel] = useState<SimCase["level"]>("mbbs");
  const [difficulty, setDifficulty] = useState<SimCase["difficulty"]>("medium");
  const [seed, setSeed] = useState("");
  const [sim, setSim] = useState<SimCase | null>(null);
  const [vitals, setVitals] = useState<SimVitals | null>(null);
  const [log, setLog] = useState<SimEntry[]>([]);
  const [minute, setMinute] = useState(0);
  const [status, setStatus] = useState<SimStatus>("stable");
  const [kind, setKind] = useState<SimAction>("history");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"" | "start" | "act" | "debrief">("");
  const [finishing, setFinishing] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [debrief, setDebrief] = useState<(SimDebrief & { diagnosis: string }) | null>(null);
  const [records, setRecords] = useState<SimRecord[]>(readSims);
  const [talking, setTalking] = useState<{ voice: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => saveSims(records), [records]);
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: "end", behavior: "smooth" }); }, [log.length, finishing]);

  const over = status === "died" || status === "recovered";
  const def = SIM_ACTION_DEFS.find((a) => a.id === kind)!;

  const start = async () => {
    setBusy("start");
    try {
      const r = await generate({ action: "case-sim", step: "start", specialty: specialty === "Any" ? "" : specialty, level, difficulty, seed: seed.trim() });
      if (!r?.case) throw new Error("No case came back");
      setSim(r.case); setVitals(r.case.vitals); setLog([]); setMinute(0); setStatus("stable");
      setDebrief(null); setFinishing(false); setDiagnosis(""); setPlan(""); setKind("history"); setInput("");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(""); }
  };

  /** Does it, and resolves with the reply ("" if nothing happened). */
  const act = async (k: SimAction, text: string): Promise<string> => {
    if (!sim || busy || over) return "";
    const what = text.trim();
    if (!what && k !== "wait") { toast(`Type what you want to ${def.label.toLowerCase()}`); return ""; }
    setBusy("act");
    try {
      const r = await generate({ action: "case-sim", step: "act", case: sim, log: log.map(({ kind: kk, text: t, reply, minute: m }) => ({ kind: kk, text: t, reply, minute: m })), minute, kind: k, text: what, vitals });
      const t = r?.turn;
      if (!t?.reply) throw new Error("The patient didn't respond");
      const at = minute + (k === "wait" ? Math.max(15, t.minutes) : t.minutes);
      setLog((l) => [...l, { id: uid(), kind: k, text: k === "wait" ? "Waited and observed" : what, reply: t.reply, minute: at, event: t.event || undefined, status: t.status }]);
      setVitals(t.vitals); setMinute(at); setStatus(t.status); setInput("");
      if (t.status === "died") { toast("The patient has died. Finish the case for your debrief."); setFinishing(true); }
      return String(t.reply);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
      return "";
    } finally { setBusy(""); }
  };
  const actRef = useRef(act);
  actRef.current = act;

  /** Talk to the patient by voice: what you say is sorted into ask, examine, test, treat or call; the patient answers in a voice that fits their age and sex. */
  const startTalking = async () => {
    if (!sim) return;
    if (!voiceSupported()) { toast("Talking needs a microphone and speech recognition"); return; }
    const voices = await preloadVoices();
    setTalking({ voice: pickVoice(voices, sim.sex, sim.age) });
  };

  const finish = async () => {
    if (!sim) return;
    setBusy("debrief");
    try {
      const r = await generate({ action: "case-sim", step: "debrief", case: sim, log: log.map(({ kind: kk, text: t, reply, minute: m }) => ({ kind: kk, text: t, reply, minute: m })), minute, diagnosis: diagnosis.trim(), plan: plan.trim() });
      if (!r?.debrief) throw new Error("No debrief came back");
      setDebrief({ ...r.debrief, diagnosis: r.diagnosis || sim.diagnosis });
      setRecords((l) => [{ id: uid(), title: sim.title, specialty: sim.specialty, diagnosis: r.diagnosis || sim.diagnosis, score: r.debrief.score, correct: !!r.debrief.diagnosisCorrect, minutes: minute, at: Date.now() }, ...l]);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(""); }
  };

  const quit = () => { setSim(null); setDebrief(null); setLog([]); setFinishing(false); };

  /* ---------------------------------------------------------------- set-up */
  if (!sim) {
    const avg = records.length ? Math.round(records.reduce((n, r) => n + r.score, 0) / records.length) : 0;
    return (
      <section className="cx-page cx-lab cx-sim">
        <header className="cx-page-h">
          <div><h1>Case Simulator</h1><p>A live patient to practise on. Take the history, examine, order tests and treat; the patient responds, the vitals change, and at the end you get a scored debrief.</p></div>
        </header>
        <div className="cx-lab-grid">
          <div className="cx-lab-form">
            <label className="cx-field"><span>Specialty</span><select className="cx-select" value={specialty} onChange={(e) => setSpecialty(e.target.value)} aria-label="Specialty">{SIM_SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="cx-field"><span>Your level</span><div className="cx-seg">{SIM_LEVELS.map((l) => <button key={l.id} className={level === l.id ? "on" : ""} onClick={() => setLevel(l.id)}>{l.label}</button>)}</div></label>
            <label className="cx-field"><span>Case</span><div className="cx-seg">{SIM_DIFFICULTIES.map((d) => <button key={d.id} className={difficulty === d.id ? "on" : ""} onClick={() => setDifficulty(d.id)}>{d.label}</button>)}</div></label>
            <label className="cx-field"><span>A theme (optional)</span><input className="cx-input" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g. night shift at a PHC, a child with fever" maxLength={160} /></label>
            <button className="cx-btn primary" onClick={start} disabled={!!busy} data-sim="start"><Sparkles size={14} /> {busy === "start" ? "Preparing the patient…" : "Start a case"}</button>
            <p className="cx-rs-foot"><TriangleAlert size={13} /> For training only. Cases are written by Cadus; check doses against your local guidelines.</p>
          </div>
          <div className="cx-lab-out">
            {records.length ? (
              <>
                <div className="cx-sim-stats">
                  <div><b>{records.length}</b><small>cases</small></div>
                  <div><b>{avg}</b><small>average score</small></div>
                  <div><b>{records.filter((r) => r.correct).length}</b><small>diagnoses right</small></div>
                </div>
                <p className="cx-gl"><span>Your cases</span></p>
                <div className="cx-lab-list">
                  {records.slice(0, 12).map((r) => (
                    <div key={r.id} className="cx-sc-row static"><b>{r.title}</b><small>{r.diagnosis} · {r.score}/100{r.correct ? " · diagnosed" : ""} · {new Date(r.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></div>
                  ))}
                </div>
              </>
            ) : (
              <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Stethoscope size={20} /></span><h3>No cases yet</h3><p>Pick a specialty and start. Each case is new, written for your level.</p></div>
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------- debrief */
  if (debrief) {
    const tone = debrief.score >= 75 ? "good" : debrief.score >= 50 ? "mid" : "low";
    return (
      <section className="cx-page cx-lab cx-sim">
        <header className="cx-page-h"><div><h1>Debrief</h1><p>{sim.title} · {minute} minutes · {log.length} actions</p></div></header>
        <div className="cx-sim-debrief" data-sim="debrief">
          <div className={`cx-sim-score ${tone}`}><Trophy size={20} /><b>{debrief.score}</b><small>out of 100</small></div>
          <div className="cx-sim-dx">
            <p className="cx-gl"><span>Diagnosis</span></p>
            <h2>{debrief.diagnosis}</h2>
            <p className={debrief.diagnosisCorrect ? "ok" : "no"}>{debrief.diagnosisCorrect ? <><Check size={14} /> You got it{diagnosis ? `: ${diagnosis}` : ""}</> : <><X size={14} /> {diagnosis ? `You said: ${diagnosis}` : "You didn't give a diagnosis"}</>}</p>
            <p>{debrief.verdict}</p>
          </div>
        </div>
        <div className="cx-sim-cols">
          {debrief.strengths.length > 0 && <div className="cx-sim-card ok"><h3>What went well</h3><ul>{debrief.strengths.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {debrief.missed.length > 0 && <div className="cx-sim-card warn"><h3>Missed or late</h3><ul>{debrief.missed.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {debrief.unsafe.length > 0 && <div className="cx-sim-card bad"><h3>Unsafe</h3><ul>{debrief.unsafe.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {debrief.teaching.length > 0 && <div className="cx-sim-card"><h3>Teaching points</h3><ul>{debrief.teaching.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        </div>
        {debrief.idealApproach && <div className="cx-sc-note"><h3 className="cx-lab-h3">The ideal approach</h3><MdBlock text={debrief.idealApproach} /></div>}
        <div className="cx-sc-acts">
          <button className="cx-btn primary" onClick={() => { quit(); void start(); }} disabled={!!busy}><RotateCcw size={14} /> Another case</button>
          <button className="cx-btn" onClick={() => onAsk(`Teach me ${debrief.diagnosis}: how it presents, how to confirm it and how to manage it, with Indian guidelines and doses.`)}><MessageCircle size={14} /> Ask Cadus about {debrief.diagnosis}</button>
          <button className="cx-btn" onClick={quit}>Back to cases</button>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------- the live case */
  return (
    <section className="cx-page cx-lab cx-sim">
      <div className="cx-sim-head" data-sim="case">
        <div>
          <h1>{sim.title}</h1>
          <p>{sim.age !== null ? `${sim.age} y` : ""} {sim.sex === "F" ? "female" : "male"} · {sim.setting} · {sim.complaint}</p>
        </div>
        <div className="cx-sim-meta">
          <span className="cx-sim-clock"><Clock size={14} /> {minute} min</span>
          <span className={`cx-sim-status s-${status}`} data-status={status}><Activity size={14} /> {STATUS_LABEL[status]}</span>
          <button className="cx-ib" onClick={quit} aria-label="Leave this case" title="Leave this case"><X size={16} /></button>
        </div>
      </div>
      {vitals && (
        <div className="cx-sim-vitals" aria-label="Vital signs">
          {VITALS.map((v) => {
            const val = v.key === "sbp" ? (vitals.sbp !== null ? `${vitals.sbp}/${vitals.dbp ?? "?"}` : "—") : vitals[v.key] ?? "—";
            const flag = vitalFlag(v.key, vitals[v.key], sim.age) || (v.key === "sbp" ? vitalFlag("dbp", vitals.dbp, sim.age) : "");
            return <div key={v.key} className={`cx-sim-vital ${flag}`}><small>{v.label}</small><b>{val}</b><small>{v.unit}</small></div>;
          })}
        </div>
      )}
      <div className="cx-sim-log">
        <div className="cx-sim-entry open"><span className="cx-sim-who"><UserRound size={14} /> On arrival</span><MdBlock text={sim.opening} /></div>
        {log.map((e) => (
          <div key={e.id} className="cx-sim-entry">
            <p className="cx-sim-you"><span className={`cx-sim-kind k-${e.kind}`}>{SIM_ACTION_DEFS.find((a) => a.id === e.kind)?.label}</span> {e.text}<small>min {e.minute}</small></p>
            <MdBlock text={e.reply} />
            {e.event && <p className="cx-sim-event"><HeartPulse size={14} /> {e.event}</p>}
          </div>
        ))}
        {busy === "act" && <div className="cx-sim-entry pending"><span className="cx-sim-dots"><i /><i /><i /></span></div>}
        <div ref={endRef} />
      </div>
      {finishing || over ? (
        <div className="cx-sim-finish" data-sim="finish">
          <h3><Flag size={15} /> {status === "died" ? "The patient has died" : "Finish the case"}</h3>
          <label className="cx-field"><span>Your diagnosis</span><input className="cx-input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Most likely diagnosis" maxLength={200} /></label>
          <label className="cx-field"><span>Your plan (optional)</span><textarea className="cx-input" rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Disposition, further treatment, follow-up" maxLength={1200} /></label>
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={finish} disabled={!!busy} data-sim="score"><Trophy size={14} /> {busy === "debrief" ? "Scoring…" : "Score my case"}</button>
            {!over && <button className="cx-btn" onClick={() => setFinishing(false)}>Keep going</button>}
          </div>
        </div>
      ) : (
        <div className="cx-sim-bar">
          <div className="cx-sim-kinds" role="radiogroup" aria-label="What to do">
            {SIM_ACTION_DEFS.map((a) => <button key={a.id} role="radio" aria-checked={kind === a.id} className={kind === a.id ? "on" : ""} onClick={() => (a.id === "wait" ? void act("wait", "") : setKind(a.id))} disabled={!!busy}>{a.label}</button>)}
          </div>
          {def.quick.length > 0 && <div className="cx-sim-quick">{def.quick.map((q) => <button key={q} onClick={() => void act(kind, q)} disabled={!!busy}>{q}</button>)}</div>}
          <form className="cx-sim-input" onSubmit={(e) => { e.preventDefault(); void act(kind, input); }}>
            <input className="cx-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={def.placeholder} maxLength={400} aria-label={def.label} disabled={!!busy} />
            <button className="cx-btn primary" type="submit" disabled={!!busy || !input.trim()} aria-label="Do it"><Send size={14} /></button>
            <button className="cx-btn" type="button" onClick={() => void startTalking()} disabled={!!busy} data-sim="talk" title="Talk to the patient by voice"><AudioLines size={14} /> Talk</button>
            <button className="cx-btn" type="button" onClick={() => setFinishing(true)} disabled={!!busy} data-sim="finish-btn"><Flag size={14} /> Finish</button>
          </form>
        </div>
      )}
      {talking && (
        <VoiceMode
          language="English"
          ask={(text) => actRef.current(simKindFromSpeech(text), text)}
          onClose={() => setTalking(null)}
          persona={{
            name: `${sim.age !== null ? `${sim.age} y ` : ""}${sim.sex === "F" ? "female" : "male"} patient`,
            voice: talking.voice || undefined,
            listenHint: "Talk to the patient. Say \"examine…\", \"order…\" or \"give…\" for other actions",
            note: "Everything you say is added to the case log. Close this to finish the case and get your score.",
          }}
        />
      )}
    </section>
  );
}
