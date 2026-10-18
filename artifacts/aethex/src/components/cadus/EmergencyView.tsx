/**
 * Emergencies: timed protocol checklists you tick as you go (the timer runs
 * from the moment you start), a handover text at the end, and the crash-cart
 * drug card by weight. All of it works offline.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ClipboardCopy, Play, RotateCcw, ShieldCheck, Siren, Square, Syringe } from "lucide-react";
import { CRASH_DRUGS, PROTOCOLS, childDose, estimatedWeight, readRun, runSummary, saveRun, type ProtocolRun } from "@/lib/cadus/emergency";

const mmss = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

export default function EmergencyView({ toast, onAsk, initialTab = "protocols" }: { toast: (t: string) => void; onAsk: (text: string) => void; initialTab?: "protocols" | "drugs" }) {
  const [tab, setTab] = useState<"protocols" | "drugs">(initialTab);
  const [run, setRunState] = useState<ProtocolRun | null>(readRun);
  const [picked, setPicked] = useState<string>(run?.protocolId ?? PROTOCOLS[0].id);
  const [now, setNow] = useState(Date.now());
  const [kg, setKg] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const setRun = (r: ProtocolRun | null) => { setRunState(r); saveRun(r); };
  useEffect(() => { if (!run) return; const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, [run]);
  const protocol = PROTOCOLS.find((p) => p.id === (run?.protocolId ?? picked))!;
  const elapsed = run ? now - run.startedAt : 0;
  const weight = useMemo(() => { const w = Number(kg); if (w > 0) return w; const a = Number(age); return a >= 0 && age !== "" ? estimatedWeight(a) : 0; }, [kg, age]);
  const done = run ? Object.keys(run.done).length : 0;

  return (
    <section className="cx-page cx-em">
      <header className="cx-page-h">
        <div><h1>Emergencies</h1><p>Protocol checklists with a running clock and the crash-cart card by weight. Reference content on this device; it works without a connection. Confirm every dose against the patient.</p></div>
        <nav className="cx-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "protocols"} className={tab === "protocols" ? "on" : ""} onClick={() => setTab("protocols")}>Protocols</button>
          <button role="tab" aria-selected={tab === "drugs"} className={tab === "drugs" ? "on" : ""} onClick={() => setTab("drugs")}>Crash-cart drugs</button>
        </nav>
      </header>

      {tab === "protocols" && (
        <div className="cx-em-grid">
          <aside className="cx-em-list" aria-label="Protocols">
            {PROTOCOLS.map((p) => (
              <button key={p.id} className={`cx-em-row ${protocol.id === p.id ? "on" : ""} ${run?.protocolId === p.id ? "live" : ""}`} onClick={() => { if (run && run.protocolId !== p.id) { toast(`${PROTOCOLS.find((x) => x.id === run.protocolId)!.name} is running; stop it first`); return; } setPicked(p.id); }}>
                <b>{p.name}</b><small>{p.tagline}</small>
              </button>
            ))}
          </aside>
          <div className="cx-em-main">
            <div className="cx-em-head">
              <div><h2><Siren size={18} /> {protocol.name}</h2><p>{protocol.trigger}</p></div>
              {run ? (
                <div className="cx-em-clock"><b>{mmss(elapsed)}</b><small>{done} of {protocol.steps.length} done</small><button className="cx-btn danger" onClick={() => { setRun(null); }}><Square size={14} /> Stop</button></div>
              ) : (
                <button className="cx-btn primary" onClick={() => setRun({ protocolId: protocol.id, startedAt: Date.now(), done: {}, notes: "" })}><Play size={14} /> Start the clock</button>
              )}
            </div>
            <ol className="cx-em-steps">
              {protocol.steps.map((s) => {
                const at = run?.done[s.id];
                const late = run && !at && s.by !== undefined && elapsed > s.by * 60000;
                return (
                  <li key={s.id} className={`${at ? "done" : ""} ${late ? "late" : ""} ${s.critical ? "critical" : ""}`}>
                    <button className="cx-em-tick" disabled={!run} onClick={() => setRun({ ...run!, done: at ? Object.fromEntries(Object.entries(run!.done).filter(([k]) => k !== s.id)) : { ...run!.done, [s.id]: Date.now() } })} aria-label={at ? "Undo" : "Done"}>{at ? <Check size={14} /> : null}</button>
                    <div>
                      <p>{s.text}</p>
                      {s.detail && <small>{s.detail}</small>}
                      <span className="cx-em-by">{s.by === undefined ? "" : s.by === 0 ? "At once" : s.by >= 60 ? `By ${Math.round(s.by / 60)} h` : `By ${s.by} min`}{at ? ` · done at ${mmss(at - run!.startedAt)}` : late ? " · overdue" : ""}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
            {run && (
              <>
                <label className="cx-field"><span>Notes during the run (times, doses, responses)</span><textarea className="cx-input" rows={2} value={run.notes} onChange={(e) => setRun({ ...run, notes: e.target.value })} maxLength={1500} /></label>
                <div className="cx-em-acts">
                  <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(runSummary(run)); toast("Handover copied"); }}><ClipboardCopy size={14} /> Copy handover</button>
                  <button className="cx-btn" onClick={() => onAsk(`I am managing this emergency. Here is the protocol run so far; what should I check or do next, and what am I missing?\n\n${runSummary(run)}`)}>Ask Cadus what's next</button>
                  <button className="cx-btn" onClick={() => setRun({ ...run, done: {}, startedAt: Date.now(), notes: "" })}><RotateCcw size={14} /> Restart</button>
                </div>
              </>
            )}
            <p className="cx-em-src"><ShieldCheck size={13} /> Source: {protocol.source}. Handover: {protocol.handover.join("; ")}.</p>
          </div>
        </div>
      )}

      {tab === "drugs" && (
        <div className="cx-em-drugs">
          <div className="cx-em-weight">
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" type="number" inputMode="decimal" min={0.5} max={250} step={0.5} value={kg} onChange={(e) => setKg(e.target.value)} placeholder="e.g. 18" aria-label="Weight in kg" /></label>
            <span className="cx-em-or">or</span>
            <label className="cx-field"><span>Age (years) to estimate</span><input className="cx-input" type="number" inputMode="decimal" min={0} max={17} step={0.5} value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 5" aria-label="Age in years" /></label>
            {weight > 0 && <p className="cx-em-est"><Syringe size={14} /> Doses below are for <b>{weight} kg</b>{!Number(kg) && age !== "" ? " (estimated from age: APLS formula)" : ""}.</p>}
          </div>
          <table className="cx-em-table">
            <thead><tr><th>Drug</th><th>For</th><th>Adult</th><th>{weight > 0 ? `Child, ${weight} kg` : "Child (enter weight)"}</th></tr></thead>
            <tbody>
              {CRASH_DRUGS.map((d) => (
                <tr key={d.name}><th scope="row">{d.name}</th><td>{d.indication}</td><td>{d.adult}</td><td className="cx-em-child">{weight > 0 ? childDose(d, weight) : d.child ? `${d.child.perKg ? `${d.child.perKg} ${d.child.unit}/kg` : ""}${d.child.max ? ` (max ${d.child.max} ${d.child.unit})` : ""}${d.child.note ? ` ${d.child.note}` : ""}` : "Adult only"}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="cx-em-src"><AlertTriangle size={13} /> Usual resuscitation doses from AHA/ERC/APLS references, rounded. Check the concentration in your hand before drawing up.</p>
        </div>
      )}
    </section>
  );
}
