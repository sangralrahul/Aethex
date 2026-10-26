/**
 * Pressure Injuries: the Braden risk score with a prevention plan, and care by injury stage.
 */
import { useState } from "react";
import { Bed, TriangleAlert } from "lucide-react";
import { BRADEN, braden, PI_STAGES } from "@/lib/cadus/clinic40";

export default function PressureView() {
  const [sc, setSc] = useState<number[]>(BRADEN.map((b) => b.max));
  const [stage, setStage] = useState(0);
  const b = braden(sc);
  return (
    <section className="cx-page cx-lab cx-pressure">
      <header className="cx-page-h"><div><h1>Pressure Injuries</h1><p>Score the risk with Braden and set a prevention plan; stage an injury and see how to care for it.</p></div></header>
      <div className="cx-nihss">{BRADEN.map((it, i) => <label key={it.label} className="cx-field"><span>{it.label}</span><select className="cx-select" value={sc[i]} onChange={(e) => setSc(sc.map((v, j) => (j === i ? Number(e.target.value) : v)))} data-pi={i}>{it.options.map((o, k) => <option key={o} value={k + 1}>{o}</option>)}</select></label>)}</div>
      <div className={`cx-cmp-out ${b.total <= 12 ? "cx-st-out" : b.total <= 18 ? "cx-ac-high" : "cx-ac-in"}`} data-pi="out"><h3 className="cx-lab-h3">Braden {b.total}/23: {b.risk}</h3><ul>{b.plan.map((s) => <li key={s}>{s}</li>)}</ul></div>
      <h4>Staging an injury</h4>
      <div className="cx-c23-row"><label className="cx-field"><span>Stage</span><select className="cx-select" value={stage} onChange={(e) => setStage(Number(e.target.value))} data-pi="stage">{PI_STAGES.map((s, i) => <option key={s.stage} value={i}>{s.stage}: {s.desc}</option>)}</select></label></div>
      <div className="cx-cmp-out" data-pi="care"><p><b>{PI_STAGES[stage].stage}:</b> {PI_STAGES[stage].care}</p></div>
      <p className="cx-rs-foot"><Bed size={13} /> Braden scale, NPIAP/EPUAP 2019 international guideline. <TriangleAlert size={13} /> Reassess on admission, every shift in ICU, and with any change in condition.</p>
    </section>
  );
}
