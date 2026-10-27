/**
 * Shoulder Pain: frozen shoulder vs rotator cuff tendinopathy vs tear, with red flags and treatment.
 */
import { useState } from "react";
import { Hand, TriangleAlert } from "lucide-react";
import { shoulder, type ShoulderInput } from "@/lib/cadus/clinic44";

export default function ShoulderView() {
  const [x, setX] = useState<ShoulderInput>({ age: 0, painfulArc: false, erLoss: false, weakness: false, trauma: false, diabetes: false, redFlag: false });
  const r = shoulder(x);
  const cb = (k: Exclude<keyof ShoulderInput, "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-sh={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-shoulder">
      <header className="cx-page-h"><div><h1>Shoulder Pain</h1><p>Use a few examination findings to separate frozen shoulder, rotator cuff tendinopathy and an acute tear, and pick the right next step.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={x.age || ""} onChange={(e) => setX({ ...x, age: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="55" data-sh="age" /></label></div>
      <div className="cx-imaging-ticks">{cb("painfulArc", "Painful arc (60–120° abduction)")}{cb("erLoss", "Loss of passive external rotation")}{cb("weakness", "Weakness lifting or rotating")}{cb("trauma", "Recent injury or fall")}{cb("diabetes", "Diabetes")}{cb("redFlag", "Red flags (fever, mass, deformity, referred pain, unreduced dislocation)")}</div>
      <div className={`cx-cmp-out ${x.redFlag || (x.trauma && x.weakness) ? "cx-st-out" : "cx-ac-in"}`} data-sh="out"><h3 className="cx-lab-h3" data-sh="dx">{r.dx}</h3><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Hand size={13} /> BESS/BOA shoulder guidance, NICE CKS shoulder pain. <TriangleAlert size={13} /> Left shoulder pain with exertion or breathlessness: think of the heart.</p>
    </section>
  );
}
