/**
 * Peripheral Neuropathy: typical vs atypical pattern, GBS warning, high-yield tests (glucose, B12,
 * SPEP), leprosy and drugs in India, and neuropathic pain treatment.
 */
import { useState } from "react";
import { Zap, TriangleAlert } from "lucide-react";
import { neuropathyAssess, type NeuroInput } from "@/lib/cadus/clinic46";

export default function NeuropathyView() {
  const [x, setX] = useState<NeuroInput>({ weeks: 0, asymmetric: false, motor: false, proximal: false, autonomic: false, thickNerves: false, diabetes: false, alcohol: false, drugs: false, age: 0 });
  const r = neuropathyAssess(x);
  const n = (k: "weeks" | "age", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 4)) || 0 })} placeholder={ph} data-neu={k} /></label>;
  const cb = (k: Exclude<keyof NeuroInput, "weeks" | "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-neu={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-neu">
      <header className="cx-page-h"><div><h1>Peripheral Neuropathy</h1><p>Most is slow, symmetric and sensory (glove and stocking). Fast, motor, asymmetric or autonomic neuropathy needs urgent work-up.</p></div></header>
      <div className="cx-c23-row">{n("weeks", "Weeks since it started", "52")}{n("age", "Age", "58")}</div>
      <h4>Pattern</h4>
      <div className="cx-imaging-ticks">{cb("motor", "Weakness")}{cb("proximal", "Proximal (hips, shoulders)")}{cb("asymmetric", "Asymmetric or one nerve")}{cb("autonomic", "Autonomic (postural drop, bladder, sweating)")}{cb("thickNerves", "Thickened nerves or numb skin patches")}</div>
      <h4>Risks</h4>
      <div className="cx-imaging-ticks">{cb("diabetes", "Diabetes or prediabetes")}{cb("alcohol", "Alcohol")}{cb("drugs", "Neurotoxic medicines (isoniazid, chemotherapy…)")}</div>
      <div className={`cx-cmp-out ${r.level === "emergency" ? "cx-st-out" : r.level === "atypical" ? "cx-ac-high" : "cx-ac-in"}`} data-neu="out" data-level={r.level}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Zap size={13} /> AAN evidence review (2009, reaffirmed), NICE CG173 neuropathic pain, ADA 2024. <TriangleAlert size={13} /> Ascending weakness with lost reflexes: check vital capacity — GBS can stop breathing.</p>
    </section>
  );
}
