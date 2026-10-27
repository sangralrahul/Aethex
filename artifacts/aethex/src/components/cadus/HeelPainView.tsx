/**
 * Heel Pain: plantar fasciitis, Achilles problems, stress fracture, nerve entrapment and
 * spondyloarthritis, with a stepwise treatment plan.
 */
import { useState } from "react";
import { Footprints, TriangleAlert } from "lucide-react";
import { heelPlan, type HeelInput } from "@/lib/cadus/clinic47";

export default function HeelPainView() {
  const [x, setX] = useState<HeelInput>({ firstStep: false, posterior: false, nightPain: false, inflammatory: false, numbness: false, squeeze: false, months: 0, bmi: 0 });
  const r = heelPlan(x);
  const n = (k: "months" | "bmi", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)) || 0 })} placeholder={ph} data-heel={k} /></label>;
  const cb = (k: Exclude<keyof HeelInput, "months" | "bmi">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-heel={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-heel">
      <header className="cx-page-h"><div><h1>Heel Pain (Plantar Fasciitis)</h1><p>Worst with the first steps in the morning, tender on the inside of the heel: plantar fasciitis. Check for the less common causes first.</p></div></header>
      <div className="cx-c23-row">{n("months", "Months of pain", "3")}{n("bmi", "BMI", "28")}</div>
      <div className="cx-imaging-ticks">{cb("firstStep", "Worst on first steps in the morning")}{cb("posterior", "Pain at the back of the heel (Achilles)")}{cb("squeeze", "Pain on squeezing the heel from the sides")}{cb("nightPain", "Pain at night or at rest")}{cb("numbness", "Burning or numbness in the sole")}{cb("inflammatory", "Both heels, back stiffness or other joints")}</div>
      <div className={`cx-cmp-out ${r.refer ? "cx-ac-high" : "cx-ac-in"}`} data-heel="out" data-refer={String(r.refer)}><h3 className="cx-lab-h3" data-heel="dx">{r.dx}</h3><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Footprints size={13} /> APTA heel pain guideline 2023, NICE CKS. <TriangleAlert size={13} /> Avoid steroid injections near the Achilles tendon.</p>
    </section>
  );
}
