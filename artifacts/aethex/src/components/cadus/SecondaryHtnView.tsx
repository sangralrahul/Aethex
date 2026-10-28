/** Secondary hypertension: the clues and the targeted tests. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { secHtnPlan, type SecHtnInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof SecHtnInput, "age">;
const T: [B, string][] = [["resistant", "Resistant (3 drugs incl. a diuretic)"], ["hypoK", "Low potassium"], ["episodes", "Episodic headache, palpitations, sweating"], ["snoring", "Snoring or daytime sleepiness"], ["renalBruit", "Abdominal bruit"], ["flashOedema", "Flash pulmonary oedema"], ["creatRise", "Creatinine up over 30% on ACEi/ARB"], ["ckd", "Kidney disease"], ["radialFemoralDelay", "Radio-femoral delay"], ["cushingoid", "Cushingoid features"], ["thyroid", "Thyroid symptoms"], ["drugs", "NSAIDs, OCP, steroids, decongestants"], ["suddenOnset", "Sudden onset or rapid worsening"], ["organDamage", "Organ damage out of proportion"]];

export default function SecondaryHtnView() {
  const [x, setX] = useState<SecHtnInput>({ age: 0, resistant: false, hypoK: false, episodes: false, snoring: false, renalBruit: false, flashOedema: false, creatRise: false, ckd: false, radialFemoralDelay: false, cushingoid: false, drugs: false, thyroid: false, suddenOnset: false, organDamage: false });
  const r = secHtnPlan(x);
  return (
    <section className="cx-page cx-lab cx-sht">
      <header className="cx-page-h"><div><h1>Secondary Hypertension</h1><p>Young, resistant or unusual hypertension: the clues to a curable cause, and which test to order.</p></div></header>
      <div className="cx-c23-row"><NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="26" data="sht-age" max={110} /></div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`sht-${k}`} />)}</div>
      <PlanOut urgency="routine" steps={r.steps} data="sht-out"><p className="cx-c50-score"><b data-t="sht-count" data-count={r.suspicion}>{r.suspicion ? `${r.suspicion} pointer${r.suspicion === 1 ? "" : "s"} to a secondary cause` : "No pointers yet"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> ESH 2023 hypertension guideline; Endocrine Society 2016 primary aldosteronism; ISH 2020.</p>
    </section>
  );
}
