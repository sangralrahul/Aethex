/**
 * IV Fluids Planner (adults): resuscitation bolus, daily maintenance water, electrolytes and glucose
 * by weight, with lower volumes for the frail and heart failure (NICE CG174 style).
 */
import { useState } from "react";
import { Droplet, TriangleAlert } from "lucide-react";
import { ivFluids } from "@/lib/cadus/clinic27";

export default function IvFluidsView() {
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [frail, setFrail] = useState(false);
  const [hf, setHf] = useState(false);
  const [obese, setObese] = useState(false);
  const f = ivFluids(Number(w), { frail, heartFailure: hf, obese, heightCm: Number(h) || undefined });

  return (
    <section className="cx-page cx-lab cx-ivf">
      <header className="cx-page-h"><div><h1>IV Fluids Planner</h1><p>For adults: the resuscitation bolus, and daily maintenance water, sodium, potassium and glucose by weight, with less for the frail and heart failure.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-ivf="weight" /></label>
        {obese && <label className="cx-field"><span>Height (cm)</span><input className="cx-input" inputMode="decimal" value={h} onChange={(e) => setH(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="165" /></label>}
        <label className="cx-pa-mine"><input type="checkbox" checked={frail} onChange={(e) => setFrail(e.target.checked)} /> Older or frail</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={hf} onChange={(e) => setHf(e.target.checked)} data-ivf="hf" /> Heart failure or kidney failure</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={obese} onChange={(e) => setObese(e.target.checked)} /> Obese (use ideal weight)</label>
      </div>
      {f ? (
        <div className="cx-cmp-out" data-ivf="out">
          <div className="cx-sc-gaps" data-ivf="bolus"><b>{f.bolus}</b></div>
          <table className="cx-c23-table"><tbody>
            <tr><th>Water</th><td data-ivf="water">{f.water}</td></tr>
            <tr><th>Electrolytes</th><td>{f.electrolytes}</td></tr>
            <tr><th>Glucose</th><td>{f.glucose}</td></tr>
            <tr><th>Example</th><td>{f.example}</td></tr>
          </tbody></table>
          {f.weightUsed !== Number(w) && <p className="cx-set-hint">Calculated on an adjusted weight of {f.weightUsed} kg.</p>}
          <ul><li>Reassess every day: fluid balance, weight, urine output, electrolytes; stop IV fluids as soon as the patient can drink.</li><li>Replace ongoing losses (vomiting, drains, diarrhoea) on top of maintenance.</li><li>Children need different fluids: see the Dose Card by Weight (4-2-1 rule).</li></ul>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Droplet size={20} /></span><h3>Enter the weight</h3><p>Adults only.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> NICE CG174 principles. Check sodium and potassium before adding potassium; never give potassium as a bolus.</p>
    </section>
  );
}
