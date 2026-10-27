/**
 * Dysphagia: oropharyngeal vs oesophageal, food bolus emergencies, endoscopy first with biopsies,
 * and the motility work-up.
 */
import { useState } from "react";
import { TriangleAlert, Utensils } from "lucide-react";
import { dysphagiaPlan, type DysphagiaInput } from "@/lib/cadus/clinic48";

export default function DysphagiaView() {
  const [x, setX] = useState<DysphagiaInput>({ oropharyngeal: false, solidsProgressive: false, solidsAndLiquids: false, intermittent: false, weightLoss: false, odynophagia: false, impaction: false, heartburn: false, atopy: false, age: 0 });
  const r = dysphagiaPlan(x);
  const cb = (k: Exclude<keyof DysphagiaInput, "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-dph={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-dph">
      <header className="cx-page-h"><div><h1>Dysphagia</h1><p>Difficulty swallowing is never normal. Separate mouth-and-throat problems from oesophageal ones; most need an endoscopy.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={x.age || ""} onChange={(e) => setX({ ...x, age: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="58" data-dph="age" /></label></div>
      <div className="cx-imaging-ticks">
        {cb("impaction", "Food stuck now, can't swallow saliva")}{cb("oropharyngeal", "Coughing or choking on swallowing, nasal regurgitation")}{cb("solidsProgressive", "Solids first, getting worse")}{cb("solidsAndLiquids", "Solids and liquids from the start")}{cb("intermittent", "Food sticks now and then")}
        {cb("weightLoss", "Weight loss")}{cb("odynophagia", "Painful swallowing")}{cb("heartburn", "Long-standing heartburn")}{cb("atopy", "Asthma, eczema or allergies")}
      </div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-dph="out" data-urgency={r.urgency}><h3 className="cx-lab-h3" data-dph="likely">{r.likely}</h3><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Utensils size={13} /> NICE NG12, BSG dysphagia and EoE guidelines, ACG 2020 achalasia. <TriangleAlert size={13} /> Do not do a barium swallow first for suspected cancer: endoscopy with biopsy.</p>
    </section>
  );
}
