/**
 * Arrhythmias (ACLS): bradycardia and tachycardia algorithms by rate, QRS width, regularity and
 * stability, with drug doses and cardioversion energies.
 */
import { useState } from "react";
import { TriangleAlert, Zap } from "lucide-react";
import { acls, type ArrInput } from "@/lib/cadus/clinic42";

export default function AclsView() {
  const [rate, setRate] = useState("");
  const [x, setX] = useState<Omit<ArrInput, "rate">>({ qrs: "narrow", rhythm: "regular", unstable: false, preexcited: false, polymorphic: false });
  const r = acls({ ...x, rate: Number(rate) || 0 });
  const cb = (k: "unstable" | "preexcited" | "polymorphic", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-ar={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-acls">
      <header className="cx-page-h"><div><h1>Arrhythmias (ACLS)</h1><p>Bradycardia and tachycardia with a pulse: stable or unstable, narrow or broad, regular or irregular, and what to give.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Heart rate</span><input className="cx-input" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="180" data-ar="rate" /></label>
        <label className="cx-field"><span>QRS</span><select className="cx-select" value={x.qrs} onChange={(e) => setX({ ...x, qrs: e.target.value as ArrInput["qrs"] })} data-ar="qrs"><option value="narrow">Narrow (under 120 ms)</option><option value="broad">Broad (120 ms or more)</option></select></label>
        <label className="cx-field"><span>Rhythm</span><select className="cx-select" value={x.rhythm} onChange={(e) => setX({ ...x, rhythm: e.target.value as ArrInput["rhythm"] })} data-ar="rhythm"><option value="regular">Regular</option><option value="irregular">Irregular</option></select></label>
      </div>
      <div className="cx-imaging-ticks">{cb("unstable", "Adverse features (shock, syncope, ischaemia, heart failure)")}{x.qrs === "broad" && x.rhythm === "irregular" && <>{cb("preexcited", "Known WPW / pre-excitation")}{cb("polymorphic", "Polymorphic (torsades)")}</>}</div>
      <div className={`cx-cmp-out ${x.unstable ? "cx-st-out" : r.kind === "none" ? "cx-ac-in" : "cx-ac-high"}`} data-ar="out" data-kind={r.kind}><h3 className="cx-lab-h3">{r.title}</h3><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-set-hint">Pulseless: start CPR and follow the cardiac arrest algorithm (Emergencies).</p>
      <p className="cx-rs-foot"><Zap size={13} /> AHA ACLS 2020 and ERC 2021 algorithms. <TriangleAlert size={13} /> Get expert help early; record a 12-lead ECG before and after treatment.</p>
    </section>
  );
}
