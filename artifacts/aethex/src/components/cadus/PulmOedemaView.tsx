/**
 * Acute Pulmonary Oedema: a plan by blood pressure (nitrates, furosemide, CPAP, cardiogenic shock).
 */
import { useState } from "react";
import { HeartPulse, TriangleAlert } from "lucide-react";
import { apoPlan } from "@/lib/cadus/clinic42";

export default function PulmOedemaView() {
  const [v, setV] = useState({ sbp: "", spo2: "", rr: "", oral: "" });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder={ph} data-po={k} /></label>;
  const p = apoPlan(Number(v.sbp) || 0, Number(v.spo2) || 0, Number(v.rr) || 0, Number(v.oral) || null);
  return (
    <section className="cx-page cx-lab cx-pulmoedema">
      <header className="cx-page-h"><div><h1>Acute Pulmonary Oedema</h1><p>The first hour by blood pressure: oxygen and CPAP, nitrates, IV furosemide and its dose, and what to do in cardiogenic shock.</p></div></header>
      <div className="cx-c23-row">{n("sbp", "Systolic BP", "170")}{n("spo2", "SpO2 (%)", "88")}{n("rr", "Respiratory rate", "30")}{n("oral", "Usual oral furosemide (mg/day)", "0")}</div>
      <div className={`cx-cmp-out ${p.band === "shock" ? "cx-st-out" : "cx-ac-high"}`} data-po="out" data-band={p.band}><h3 className="cx-lab-h3">{p.band === "shock" ? "Cardiogenic shock" : p.band === "hypertensive" ? "Hypertensive pulmonary oedema" : "Pulmonary oedema"}</h3><ol className="cx-c23-steps">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><HeartPulse size={13} /> ESC Heart Failure 2021 (and 2023 update). <TriangleAlert size={13} /> ST elevation: activate the STEMI pathway in parallel.</p>
    </section>
  );
}
