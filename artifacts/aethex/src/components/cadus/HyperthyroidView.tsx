/** Hyperthyroidism and Graves': cause, beta-blocker, carbimazole or PTU, warnings and definitive options. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { hyperPlan, type HyperInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof HyperInput, "trimester" | "age" | "hr">;
const T: [B, string][] = [["tshLow", "TSH suppressed"], ["ft4High", "Free T4 high"], ["t3Only", "Only T3 high (T3 toxicosis)"], ["diffuseGoitre", "Diffuse goitre or bruit"], ["eyeSigns", "Eye signs (proptosis, lid retraction)"], ["nodular", "Nodular goitre"], ["painful", "Painful, tender thyroid"], ["postpartum", "Within a year of childbirth"], ["amiodarone", "On amiodarone"], ["af", "Atrial fibrillation"], ["heartFailure", "Heart failure"], ["asthma", "Asthma"], ["stormSigns", "Fever, confusion or vomiting (storm?)"]];

export default function HyperthyroidView() {
  const [x, setX] = useState<HyperInput>({ tshLow: true, ft4High: false, t3Only: false, diffuseGoitre: false, eyeSigns: false, nodular: false, painful: false, postpartum: false, amiodarone: false, trimester: 0, age: 0, hr: 0, af: false, stormSigns: false, heartFailure: false, asthma: false });
  const r = hyperPlan(x);
  return (
    <section className="cx-page cx-lab cx-thy">
      <header className="cx-page-h"><div><h1>Hyperthyroidism & Graves'</h1><p>Find the cause, control symptoms, start carbimazole or PTU safely, and plan radioiodine or surgery.</p></div></header>
      <div className="cx-c23-row">
        <NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="34" data="thy-age" max={110} />
        <NumField label="Heart rate" value={x.hr} set={(n) => setX({ ...x, hr: n })} placeholder="110" data="thy-hr" max={250} />
        <label className="cx-field"><span>Pregnancy</span><select className="cx-select" value={x.trimester} onChange={(e) => setX({ ...x, trimester: Number(e.target.value) as HyperInput["trimester"] })} data-t="thy-tri"><option value={0}>Not pregnant</option><option value={1}>First trimester</option><option value={2}>Second trimester</option><option value={3}>Third trimester</option></select></label>
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`thy-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="thy-out"><p className="cx-c50-score"><b data-t="thy-cause" data-cause={r.cause}>{({ none: "Not hyperthyroid", subclinical: "Subclinical hyperthyroidism", graves: "Graves' disease likely", "toxic nodular": "Toxic nodular goitre likely", thyroiditis: "Thyroiditis likely", amiodarone: "Amiodarone-induced", unclear: "Cause unclear" } as Record<string, string>)[r.cause]}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> ATA 2016 hyperthyroidism guideline; ETA 2018 Graves' guideline; ATA 2017 thyroid in pregnancy.</p>
    </section>
  );
}
