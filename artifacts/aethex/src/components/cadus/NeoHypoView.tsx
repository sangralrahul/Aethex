/**
 * Neonatal Hypoglycaemia: who to screen, what to do at each glucose level (feed, dextrose gel,
 * IV dextrose), glucose infusion rate and when to investigate.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { gir, NEO_HYPO_RISK, neoHypo } from "@/lib/cadus/clinic39";

export default function NeoHypoView() {
  const [g, setG] = useState("");
  const [kg, setKg] = useState("");
  const [signs, setSigns] = useState(false);
  const [risk, setRisk] = useState<number[]>([]);
  const [rate, setRate] = useState({ pct: "10", ml: "60" });
  const r = g ? neoHypo(Number(g), signs, Number(kg) || 0) : null;
  return (
    <section className="cx-page cx-lab cx-neohypo">
      <header className="cx-page-h"><div><h1>Neonatal Hypoglycaemia</h1><p>Screen at-risk babies, act on each glucose level (feed, dextrose gel or IV dextrose), and calculate the glucose infusion rate.</p></div></header>
      <h4>Screen if any risk factor (first check before the 2nd feed, 2–4 hours after birth)</h4>
      <div className="cx-imaging-ticks">{NEO_HYPO_RISK.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={risk.includes(i)} onChange={() => setRisk(risk.includes(i) ? risk.filter((y) => y !== i) : [...risk, i])} data-nh-risk={i} /> {x}</label>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Blood glucose (mg/dL)</span><input className="cx-input" inputMode="numeric" value={g} onChange={(e) => setG(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="32" data-nh="g" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="2.6" data-nh="kg" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={signs} onChange={(e) => setSigns(e.target.checked)} data-nh="signs" /> Abnormal signs (jittery, poor feeding, lethargy, seizures, apnoea)</label>
      </div>
      {r && <div className={`cx-cmp-out ${r.level === "iv" ? "cx-st-out" : r.level === "gel" ? "cx-ac-high" : "cx-ac-in"}`} data-nh="out" data-level={r.level}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>}
      <h4>Glucose infusion rate</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Dextrose (%)</span><select className="cx-select" value={rate.pct} onChange={(e) => setRate({ ...rate, pct: e.target.value })} data-nh="pct"><option value="10">10%</option><option value="12.5">12.5%</option><option value="15">15% (central line)</option><option value="20">20% (central line)</option></select></label>
        <label className="cx-field"><span>Total fluid (ml/kg/day)</span><input className="cx-input" inputMode="numeric" value={rate.ml} onChange={(e) => setRate({ ...rate, ml: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-nh="ml" /></label>
      </div>
      <p className="cx-set-hint" data-nh="gir"><b>GIR {gir(Number(rate.pct), Number(rate.ml) || 0)} mg/kg/minute</b> (normal need 4–6; over 8 suggests hyperinsulinism).</p>
      <p className="cx-rs-foot"><Baby size={13} /> BAPM 2017 framework, AAP 2011, Sugar Babies trial (dextrose gel). <TriangleAlert size={13} /> Over 12.5% dextrose needs a central line.</p>
    </section>
  );
}
