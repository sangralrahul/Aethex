/**
 * Rhabdomyolysis & CK: the McMahon score for dialysis or death, causes, and the fluid and
 * monitoring plan.
 */
import { useState } from "react";
import { Bone, TriangleAlert } from "lucide-react";
import { mcmahon, RHABDO_CAUSES, rhabdoPlan } from "@/lib/cadus/clinic37";

export default function RhabdoView() {
  const [v, setV] = useState({ age: "", cr: "", ca: "", ck: "", p: "", hco3: "", kg: "" });
  const [female, setFemale] = useState(false);
  const [benign, setBenign] = useState(false);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 7) })} placeholder={ph} data-rb={k} /></label>;
  const ready = v.age && v.cr && v.ck;
  const m = mcmahon({ age: Number(v.age), female, creatinine: Number(v.cr), calcium: Number(v.ca) || 9, ck: Number(v.ck), phosphate: Number(v.p) || 3.5, bicarbonate: Number(v.hco3) || 24, benignCause: benign });

  return (
    <section className="cx-page cx-lab cx-rhabdo">
      <header className="cx-page-h"><div><h1>Rhabdomyolysis &amp; CK</h1><p>Risk of dialysis or death with the McMahon score, the common causes in India, and fluids and monitoring.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age", "45")}{n("cr", "Creatinine (mg/dL)", "1.8")}{n("ck", "CK (U/L)", "25000")}{n("ca", "Calcium (mg/dL)", "8.5")}{n("p", "Phosphate (mg/dL)", "4.5")}{n("hco3", "Bicarbonate (mmol/L)", "20")}{n("kg", "Weight (kg)", "70")}</div>
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} data-rb="female" /> Female</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={benign} onChange={(e) => setBenign(e.target.checked)} data-rb="benign" /> Cause is seizures, syncope, exercise, statins or myositis</label>
      </div>
      {ready && (
        <div className={`cx-cmp-out ${m.high ? "cx-st-out" : "cx-ac-in"}`} data-rb="out" data-high={String(m.high)}>
          <h3 className="cx-lab-h3">McMahon score {m.score}: {m.high ? "high risk of dialysis or death" : "lower risk"}</h3>
          <ol className="cx-c23-steps">{rhabdoPlan(Number(v.kg) || 0, m.high).map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      )}
      <h4>Causes to look for</h4>
      <ul>{RHABDO_CAUSES.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="cx-rs-foot"><Bone size={13} /> McMahon et al. JAMA Intern Med 2013; KDIGO. <TriangleAlert size={13} /> Dark urine with a positive dipstick for blood but no red cells suggests myoglobin.</p>
    </section>
  );
}
