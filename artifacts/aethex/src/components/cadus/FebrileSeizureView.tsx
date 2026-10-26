/**
 * Febrile Seizures: simple vs complex, when to do a lumbar puncture or more tests, rescue doses by
 * weight, and what to tell parents.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { febSeizure, rescueDoses } from "@/lib/cadus/clinic41";

export default function FebrileSeizureView() {
  const [v, setV] = useState({ age: "18", dur: "3", kg: "" });
  const [f, setF] = useState({ focal: false, recur24: false, recovered: true, meningism: false, immunisedHibPneumo: true, onAntibiotics: false, ongoing: false });
  const r = febSeizure({ ...f, ageMonths: Number(v.age) || 0, durationMin: Number(v.dur) || 0 });
  const n = (k: keyof typeof v, l: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} data-fs={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-fs={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-febseizure">
      <header className="cx-page-h"><div><h1>Febrile Seizures</h1><p>Classify the seizure, decide who needs a lumbar puncture or admission, rescue medicine doses, and advice for worried parents.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age (months)")}{n("dur", "Seizure length (minutes)")}{n("kg", "Weight (kg)")}</div>
      <div className="cx-imaging-ticks">{cb("ongoing", "Still seizing")}{cb("focal", "Focal features")}{cb("recur24", "Another seizure within 24 hours")}{cb("recovered", "Fully recovered within 1 hour")}{cb("meningism", "Neck stiffness, bulging fontanelle or petechiae")}{cb("immunisedHibPneumo", "Hib and pneumococcal vaccines up to date")}{cb("onAntibiotics", "Already on antibiotics")}</div>
      <div className={`cx-cmp-out ${r.type === "status" ? "cx-st-out" : r.type === "simple" ? "cx-ac-in" : "cx-ac-high"}`} data-fs="out" data-type={r.type}>
        <h3 className="cx-lab-h3">{r.type === "simple" ? "Simple febrile seizure" : r.type === "complex" ? "Complex febrile seizure" : r.type === "status" ? "Febrile status epilepticus" : "Seizure with fever outside the usual age"}</h3>
        <ul>{r.steps.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      <h4>Rescue doses (seizure 5 minutes or more)</h4><ul data-fs="doses">{rescueDoses(Number(v.kg) || 0).map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Baby size={13} /> AAP 2011 febrile seizure guideline, NICE CKS, IAP. <TriangleAlert size={13} /> Prolonged seizures: use the Status Epilepticus tool.</p>
    </section>
  );
}
