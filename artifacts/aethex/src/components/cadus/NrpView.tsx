/**
 * Newborn Resuscitation: a running clock from birth with the NRP steps, the SpO2 target for the
 * minute, and tube size and drug doses by weight; an event log to copy into the notes.
 */
import { useEffect, useState } from "react";
import { Baby, ClipboardCopy, RotateCcw, Timer, TriangleAlert } from "lucide-react";
import { NRP_STEPS, nrpDoses, spo2Target, type NrpPhase } from "@/lib/cadus/clinic32";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function NrpView() {
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [kg, setKg] = useState("");
  const [ga, setGa] = useState("39");
  const [log, setLog] = useState<{ at: number; what: string }[]>([]);
  const [phase, setPhase] = useState<NrpPhase>("birth");
  useEffect(() => { if (!t0) return; const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, [t0]);
  const secs = t0 ? Math.max(0, Math.floor((now - t0) / 1000)) : 0;
  const d = nrpDoses(Number(kg), Number(ga) || 39);
  const mark = (id: NrpPhase, what: string) => { setPhase(id); if (t0) setLog([...log, { at: secs, what }]); };
  const copy = () => { void navigator.clipboard?.writeText(log.map((l) => `${mmss(l.at)}  ${l.what}`).join("\n")); };

  return (
    <section className="cx-page cx-lab cx-nrp">
      <header className="cx-page-h"><div><h1>Newborn Resuscitation</h1><p>A clock from birth with the resuscitation steps, the oxygen saturation target for each minute, and tube size and drug doses by weight; every step is time-stamped for the notes.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Estimated weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="3" data-nrp="kg" /></label>
        <label className="cx-field"><span>Gestation (weeks)</span><input className="cx-input" inputMode="numeric" value={ga} onChange={(e) => setGa(e.target.value.replace(/\D/g, "").slice(0, 2))} data-nrp="ga" /></label>
        {t0 ? <button className="cx-btn" onClick={() => { setT0(null); setLog([]); setPhase("birth"); }}><RotateCcw size={14} /> Reset</button> : <button className="cx-btn primary" onClick={() => { const n = Date.now(); setT0(n); setNow(n); setLog([{ at: 0, what: "Birth" }]); }} data-nrp="start"><Timer size={14} /> Start clock at birth</button>}
      </div>
      {t0 && <div className="cx-sp-clock" data-nrp="clock"><b>{mmss(secs)}</b> since birth · SpO2 target (pre-ductal, right hand): <b data-nrp="spo2">{spo2Target(secs)}</b></div>}
      <div className="cx-nrp-steps" data-nrp="steps">{NRP_STEPS.map((s) => (
        <button key={s.id} className={`cx-nrp-s ${phase === s.id ? "on" : ""}`} onClick={() => mark(s.id, s.title)} data-nrp-step={s.id} aria-pressed={phase === s.id}><b>{s.title}</b><small>{s.detail}</small></button>
      ))}</div>
      {d && (
        <div className="cx-cmp-out" data-nrp="doses">
          <p>{d.o2}. ET tube <b data-nrp="ett">{d.ett}</b>, depth {d.depth}.</p>
          <ul><li data-nrp="adr">{d.adrIv}</li><li>{d.adrEtt}</li><li>{d.volume}</li><li>{d.glucose}</li></ul>
        </div>
      )}
      {log.length > 1 && <div className="cx-cmp-out"><h4>Event log</h4><ol className="cx-c23-steps" data-nrp="log">{log.map((l, i) => <li key={i}>{mmss(l.at)}: {l.what}</li>)}</ol><div className="cx-sc-acts"><button className="cx-btn" onClick={copy}><ClipboardCopy size={14} /> Copy log</button></div></div>}
      <p className="cx-set-hint">Compressions 3:1 (90 compressions and 30 breaths a minute) in the lower third of the sternum, one-third of the chest depth. If there is no heart rate after 20 minutes of full resuscitation, discuss stopping with the senior and the family.</p>
      <p className="cx-rs-foot"><Baby size={13} /> AAP/AHA NRP 8th edition (2020) and the IAP-NNF Navjaat Shishu Suraksha Karyakram (NSSK). <TriangleAlert size={13} /> Ventilation is the key: most babies recover with effective breaths alone.</p>
    </section>
  );
}
