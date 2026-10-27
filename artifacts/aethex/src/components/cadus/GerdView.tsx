/**
 * GERD: alarm features needing endoscopy, the 8-week PPI trial, stepping down, and H. pylori.
 */
import { useState } from "react";
import { Flame, TriangleAlert } from "lucide-react";
import { GERD_ALARM, gerdPlan } from "@/lib/cadus/clinic44";

export default function GerdView() {
  const [alarm, setAlarm] = useState<boolean[]>(GERD_ALARM.map(() => false));
  const [weeks, setWeeks] = useState("0");
  const [resp, setResp] = useState<"none" | "partial" | "full">("none");
  return (
    <section className="cx-page cx-lab cx-gerd">
      <header className="cx-page-h"><div><h1>GERD &amp; Heartburn</h1><p>Check for alarm features, then an 8-week PPI trial taken correctly, stepping down to the lowest dose that works.</p></div></header>
      <h4>Alarm features</h4>
      <div className="cx-imaging-ticks">{GERD_ALARM.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={alarm[i]} onChange={(e) => setAlarm(alarm.map((y, j) => (j === i ? e.target.checked : y)))} data-gerd-a={i} /> {t}</label>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weeks on PPI so far</span><input className="cx-input" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/\D/g, "").slice(0, 3))} data-gerd="weeks" /></label>
        <label className="cx-field"><span>Response</span><select className="cx-select" value={resp} onChange={(e) => setResp(e.target.value as typeof resp)} data-gerd="resp"><option value="none">None / not started</option><option value="partial">Partial</option><option value="full">Good</option></select></label>
      </div>
      <ol className={`cx-c23-steps ${alarm.some(Boolean) ? "cx-st-out" : ""}`} data-gerd="plan">{gerdPlan(alarm, Number(weeks) || 0, resp).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Flame size={13} /> ACG GERD guideline 2022, ACG/CAG dyspepsia 2017, Indian consensus on H. pylori. <TriangleAlert size={13} /> Chest pain with exertion, sweating or breathlessness: rule out cardiac causes first.</p>
    </section>
  );
}
