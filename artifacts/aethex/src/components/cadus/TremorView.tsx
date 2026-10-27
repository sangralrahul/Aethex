/**
 * Tremor: rest vs action vs intention, essential tremor vs Parkinson's vs cerebellar vs
 * physiological, tests and treatment.
 */
import { useState } from "react";
import { Hand, TriangleAlert } from "lucide-react";
import { tremorAssess, type TremorInput } from "@/lib/cadus/clinic47";

export default function TremorView() {
  const [x, setX] = useState<TremorInput>({ type: "action", asymmetric: false, bradykinesia: false, familyHistory: false, alcoholHelps: false, headVoice: false, ataxia: false, age: 0, drugs: false, thyroid: false, disabling: false });
  const r = tremorAssess(x);
  const cb = (k: Exclude<keyof TremorInput, "type" | "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-trm={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-trm">
      <header className="cx-page-h"><div><h1>Tremor</h1><p>When does it happen — at rest, holding a posture or moving, or worse near a target? That one question sorts most tremors.</p></div></header>
      <div className="cx-seg" role="tablist">{([["rest", "At rest"], ["action", "Posture or action"], ["intention", "Worse near a target"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={x.type === k} className={x.type === k ? "on" : ""} onClick={() => setX({ ...x, type: k })} data-trm-type={k}>{l}</button>)}</div>
      <div className="cx-c23-row"><label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={x.age || ""} onChange={(e) => setX({ ...x, age: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="60" data-trm="age" /></label></div>
      <div className="cx-imaging-ticks">{cb("bradykinesia", "Slowness or stiffness")}{cb("asymmetric", "One side more")}{cb("familyHistory", "Family history of tremor")}{cb("alcoholHelps", "Better after a little alcohol")}{cb("headVoice", "Head or voice tremor")}{cb("ataxia", "Unsteady gait or clumsiness")}{cb("thyroid", "Weight loss, heat intolerance")}{cb("disabling", "Affects writing, eating or work")}</div>
      <div className="cx-cmp-out cx-ac-high" data-trm="out" data-likely={r.likely}><h3 className="cx-lab-h3">Likely: {r.likely}</h3><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Hand size={13} /> MDS tremor consensus 2018, AAN essential tremor guideline. <TriangleAlert size={13} /> New tremor with confusion, sweating and agitation: think alcohol withdrawal or hypoglycaemia now.</p>
    </section>
  );
}
