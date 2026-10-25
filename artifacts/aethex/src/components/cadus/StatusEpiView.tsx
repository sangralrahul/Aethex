/**
 * Status Epilepticus: a running clock from seizure onset that highlights the current step, with
 * benzodiazepine, second-line and refractory doses for this patient's weight.
 */
import { useEffect, useState } from "react";
import { Play, RotateCcw, Timer, TriangleAlert, Zap } from "lucide-react";
import { SE_CAUSES, sePathway, seStepAt } from "@/lib/cadus/clinic36";

export default function StatusEpiView() {
  const [kg, setKg] = useState("");
  const [age, setAge] = useState("");
  const [iv, setIv] = useState(true);
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [log, setLog] = useState<{ at: number; what: string }[]>([]);
  useEffect(() => { if (start === null) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [start]);
  const a = Number(age) || 30;
  const steps = sePathway(Number(kg) || 0, a, iv);
  const mins = start === null ? -1 : (now - start) / 60000;
  const cur = start === null ? -1 : seStepAt(mins, steps);
  const clock = start === null ? "0:00" : `${Math.floor(mins)}:${String(Math.floor((now - start) / 1000) % 60).padStart(2, "0")}`;
  const mark = (what: string) => start !== null && setLog((l) => [...l, { at: Date.now() - start, what }]);

  return (
    <section className="cx-page cx-lab cx-statusepi">
      <header className="cx-page-h"><div><h1>Status Epilepticus</h1><p>Start the clock when the seizure began: it shows what to give now, with doses for the weight, from first benzodiazepine to refractory status.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-se="kg" /></label>
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="30" data-se="age" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={iv} onChange={(e) => setIv(e.target.checked)} data-se="iv" /> IV access available</label>
      </div>
      <div className="cx-se-clock" data-se="clock">
        <span className="t"><Timer size={18} /> {clock}</span>
        {start === null
          ? <button className="cx-btn primary" onClick={() => { setStart(Date.now()); setNow(Date.now()); setLog([]); }} data-se="start"><Play size={14} /> Seizure started now</button>
          : <>
              <button className="cx-btn" onClick={() => mark("Benzodiazepine given")} data-se="benzo">Benzodiazepine given</button>
              <button className="cx-btn" onClick={() => mark("Second-line drug given")} data-se="second">Second-line given</button>
              <button className="cx-btn" onClick={() => mark("Seizure stopped")} data-se="stopped">Seizure stopped</button>
              <button className="cx-btn" onClick={() => { setStart(null); setLog([]); }} data-se="reset"><RotateCcw size={14} /> Reset</button>
            </>}
        {start === null && <label className="cx-field"><span>Or it started this many minutes ago</span><input className="cx-input" inputMode="numeric" placeholder="10" onKeyDown={(e) => { if (e.key === "Enter") { const m = Number((e.target as HTMLInputElement).value) || 0; setStart(Date.now() - m * 60000); setNow(Date.now()); } }} data-se="ago" /></label>}
      </div>
      {log.length > 0 && <ul className="cx-se-log" data-se="log">{log.map((l, i) => <li key={i}><b>{Math.floor(l.at / 60000)}:{String(Math.floor(l.at / 1000) % 60).padStart(2, "0")}</b> {l.what}</li>)}</ul>}
      <ol className="cx-se-steps">{steps.map((s, i) => (
        <li key={s.title} className={i === cur ? "now" : i < cur ? "past" : ""} data-se-step={i} data-now={String(i === cur)}>
          <h4>{s.title}</h4><ul>{s.items.map((x) => <li key={x}>{x}</li>)}</ul>
        </li>
      ))}</ol>
      <h4>Find and treat the cause</h4>
      <ul>{SE_CAUSES.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="cx-rs-foot"><Zap size={13} /> ESETT trial, NICE NG217 (2022), APLS, Neurocritical Care Society. <TriangleAlert size={13} /> Seizures lasting 5 minutes or more, or repeated without recovery, are status: treat, don't wait.</p>
    </section>
  );
}
