/**
 * DKA & HHS Hour by Hour: a clock-based adult DKA timetable (fluids, fixed-rate insulin, potassium,
 * glucose switch, progress checks, resolution) and the HHS protocol.
 */
import { useEffect, useState } from "react";
import { Droplet, Play, Timer, TriangleAlert } from "lucide-react";
import { DKA_GLUCOSE, DKA_RESOLVED, dkaFluidSchedule, dkaProgress, fixedInsulin, hhsPlan, kclFor } from "@/lib/cadus/clinic40";

export default function DkaHhsView() {
  const [tab, setTab] = useState<"dka" | "hhs">("dka");
  const [v, setV] = useState({ kg: "", sbp: "", k: "", k1: "", b1: "", g1: "", k2: "", b2: "", g2: "", hrs: "2", hk: "" });
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (start === null) return; const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, [start]);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-dh={k} /></label>;
  const kg = Number(v.kg) || 0;
  const sched = dkaFluidSchedule(Number(v.sbp) || 0);
  const hours = start === null ? -1 : (now - start) / 3600000;
  const at = (h: number) => (start === null ? `hour ${h}` : new Date(start + h * 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const prog = v.k1 && v.k2 ? dkaProgress({ ketones: Number(v.k1), bicarb: Number(v.b1) || 0, glucose: Number(v.g1) || 0 }, { ketones: Number(v.k2), bicarb: Number(v.b2) || 0, glucose: Number(v.g2) || 0 }, Number(v.hrs) || 1) : null;
  return (
    <section className="cx-page cx-lab cx-dkahhs">
      <header className="cx-page-h"><div><h1>DKA &amp; HHS Adult Timer</h1><p>An adult DKA timetable from the time you start (fluids, fixed-rate insulin, potassium, when to add glucose, whether you're on track), and the HHS protocol.</p></div></header>
      <div className="cx-seg" role="tablist">{([["dka", "DKA"], ["hhs", "HHS"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-dh-tab={k}>{l}</button>)}</div>
      {tab === "dka" ? (
        <>
          <div className="cx-c23-row">{n("kg", "Weight (kg)", "70")}{n("sbp", "Systolic BP", "110")}{n("k", "Potassium", "4.5")}</div>
          <div className="cx-se-clock"><span className="t"><Timer size={18} /> {start === null ? "Not started" : `${Math.floor(hours)} h ${Math.floor((hours % 1) * 60)} min`}</span>{start === null ? <button className="cx-btn primary" onClick={() => { setStart(Date.now()); setNow(Date.now()); }} data-dh="start"><Play size={14} /> Start the clock now</button> : <button className="cx-btn" onClick={() => setStart(null)}>Reset</button>}</div>
          <div className="cx-cmp-out cx-ac-high" data-dh="insulin"><p><b>Fixed-rate insulin {kg ? `${fixedInsulin(kg)} units/hour` : "0.1 units/kg/hour"}</b> (50 units soluble insulin in 50 ml saline = 1 unit/ml); no bolus; continue the usual long-acting insulin.</p><p>{kclFor(v.k ? Number(v.k) : null)}</p><p>{DKA_GLUCOSE}</p></div>
          <table className="cx-c23-table" data-dh="sched"><thead><tr><th>When</th><th>Fluid</th></tr></thead><tbody>{sched.map((r, i) => <tr key={i} className={start !== null && hours >= r.at && (i === sched.length - 1 || hours < sched[i + 1].at) ? "cx-dh-now" : ""}><td>{at(r.at)}</td><td>{r.what}</td></tr>)}</tbody></table>
          <h4>Are we on track?</h4>
          <div className="cx-c23-row">{n("k1", "Ketones before", "5")}{n("b1", "Bicarbonate before", "8")}{n("g1", "Glucose before (mg/dL)", "450")}{n("hrs", "Hours between", "2")}</div>
          <div className="cx-c23-row">{n("k2", "Ketones now", "3.8")}{n("b2", "Bicarbonate now", "12")}{n("g2", "Glucose now", "350")}</div>
          {prog && <p className={`cx-set-hint ${prog.onTrack ? "" : "cx-bk-err"}`} data-dh="progress"><b>{prog.text}</b></p>}
          <div className="cx-cmp-out cx-ac-in"><p>{DKA_RESOLVED}</p></div>
        </>
      ) : (
        <>
          <div className="cx-c23-row">{n("kg", "Weight (kg)", "80")}{n("hk", "Blood ketones (mmol/L)", "0.5")}</div>
          <ol className="cx-c23-steps" data-dh="hhs">{hhsPlan(kg, v.hk ? Number(v.hk) : null).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><Droplet size={13} /> JBDS-IP DKA (2023) and HHS (2022) guidelines. <TriangleAlert size={13} /> Children: use the Paediatric DKA tool. Elderly, pregnant, heart or kidney failure: slower fluids and HDU.</p>
    </section>
  );
}
