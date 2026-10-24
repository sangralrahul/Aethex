/**
 * Obstetric Emergencies: eclampsia (magnesium sulphate, Pritchard and Zuspan), severe hypertension
 * in pregnancy, postpartum haemorrhage, cord prolapse and shoulder dystocia, step by step, with a
 * magnesium dose timer.
 */
import { useEffect, useState } from "react";
import { Printer, Siren, Timer } from "lucide-react";
import { OBS_EMERGENCIES } from "@/lib/cadus/clinic26";

export default function ObsEmergencyView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [id, setId] = useState(OBS_EMERGENCIES[0].id);
  const [done, setDone] = useState<Record<string, number[]>>({});
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!started) return; const t = window.setInterval(() => setNow(Date.now()), 15000); return () => window.clearInterval(t); }, [started]);
  const e = OBS_EMERGENCIES.find((x) => x.id === id)!;
  const ticks = done[id] ?? [];
  const next = started ? started + 4 * 3600000 : 0;
  const mins = started ? Math.round((next - now) / 60000) : 0;

  return (
    <section className="cx-page cx-lab cx-obs">
      <header className="cx-page-h"><div><h1>Obstetric Emergencies</h1><p>Eclampsia, severe hypertension in pregnancy, postpartum haemorrhage, cord prolapse and shoulder dystocia: the steps in order, ticked off as you go.</p></div></header>
      <div className="cx-oncall-calls" role="tablist">{OBS_EMERGENCIES.map((x) => <button key={x.id} role="tab" aria-selected={id === x.id} className={id === x.id ? "on" : ""} onClick={() => setId(x.id)} data-obs={x.id}>{x.title.split(":")[0]}</button>)}</div>
      <div className="cx-cmp-out" data-obs="steps">
        <h3 className="cx-lab-h3"><Siren size={15} /> {e.title}</h3>
        <ol className="cx-obs-steps">{e.steps.map((s, i) => <li key={s} className={ticks.includes(i) ? "done" : ""}><label><input type="checkbox" checked={ticks.includes(i)} onChange={() => setDone({ ...done, [id]: ticks.includes(i) ? ticks.filter((x) => x !== i) : [...ticks, i] })} aria-label={`Step ${i + 1} done`} data-obs-step={i} /> {s}</label></li>)}</ol>
        {id === "eclampsia" && (
          <div className="cx-obs-timer" data-obs="timer">
            {started ? <p><Timer size={14} /> Loading dose given at {new Date(started).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}. Next IM maintenance dose {mins > 0 ? `in ${Math.floor(mins / 60)} h ${mins % 60} min` : "now"} ({new Date(next).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}), after checking knee jerks, breathing and urine output.</p> : <p>Start the timer when the loading dose is given.</p>}
            <button className="cx-btn" onClick={() => { setStarted(Date.now()); setNow(Date.now()); }} data-obs="start"><Timer size={14} /> {started ? "Dose given now: restart" : "Loading dose given"}</button>
          </div>
        )}
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint(e.title, `# ${e.title}\n\n${e.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`)} data-obs="print"><Printer size={14} /> Print for the labour room</button></div>
      </div>
      <p className="cx-rs-foot"><Siren size={13} /> From WHO, FOGSI and national (MoHFW) maternal health guidance. Call for senior help early; these steps run alongside, not instead of, the team.</p>
    </section>
  );
}
