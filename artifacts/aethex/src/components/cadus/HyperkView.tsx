/**
 * Hyperkalaemia & ECG: severity, ECG changes, and the protect–shift–remove plan with doses for
 * adults and children.
 */
import { useState } from "react";
import { HeartPulse, TriangleAlert } from "lucide-react";
import { HYPERK_ECG, hyperkLevel, hyperkPlan } from "@/lib/cadus/clinic37";

export default function HyperkView() {
  const [v, setV] = useState({ k: "", kg: "", glu: "" });
  const [ecg, setEcg] = useState<number[]>([]);
  const [child, setChild] = useState(false);
  const [acid, setAcid] = useState(false);
  const n = (key: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-hk={key} /></label>;
  const k = Number(v.k) || 0;
  const lvl = hyperkLevel(k);
  const plan = k ? hyperkPlan(k, ecg.length > 0, Number(v.kg) || 0, child, v.glu ? Number(v.glu) : null, acid) : [];

  return (
    <section className="cx-page cx-lab cx-hyperk">
      <header className="cx-page-h"><div><h1>Hyperkalaemia &amp; ECG</h1><p>Grade the potassium, look for ECG changes, then protect the heart, shift potassium into cells and remove it, with doses for adults and children.</p></div></header>
      <div className="cx-c23-row">{n("k", "Potassium (mmol/L)", "6.8")}{n("kg", "Weight (kg)", "70")}{n("glu", "Glucose (mg/dL)", "110")}
        <label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-hk="child" /> Child</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={acid} onChange={(e) => setAcid(e.target.checked)} data-hk="acid" /> Metabolic acidosis</label>
      </div>
      <h4>ECG changes</h4>
      <div className="cx-imaging-ticks">{HYPERK_ECG.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ecg.includes(i)} onChange={() => setEcg(ecg.includes(i) ? ecg.filter((y) => y !== i) : [...ecg, i])} data-hk-ecg={i} /> {x}</label>)}</div>
      {k > 0 && (
        <div className={`cx-cmp-out ${lvl === "severe" || ecg.length ? "cx-st-out" : lvl === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-hk="out" data-level={lvl}>
          <h3 className="cx-lab-h3">{lvl === "normal" ? "Not raised" : `${lvl[0].toUpperCase() + lvl.slice(1)} hyperkalaemia${ecg.length ? " with ECG changes: emergency" : ""}`}</h3>
          <ol className="cx-c23-steps">{plan.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      )}
      <p className="cx-rs-foot"><HeartPulse size={13} /> UK Kidney Association 2023 hyperkalaemia guideline, Resuscitation Council UK. <TriangleAlert size={13} /> Calcium does not lower potassium; insulin–glucose lasts only 4–6 hours, so plan removal.</p>
    </section>
  );
}
