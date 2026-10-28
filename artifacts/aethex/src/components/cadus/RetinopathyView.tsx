/** Diabetic retinopathy screening: grade, referral urgency and the next screen. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { drPlan, type DrInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

const GRADES: [DrInput["grade"], string][] = [["none", "No retinopathy"], ["mild", "Mild NPDR (microaneurysms only)"], ["moderate", "Moderate NPDR"], ["severe", "Severe NPDR (4-2-1)"], ["proliferative", "Proliferative (new vessels, haemorrhage)"]];

export default function RetinopathyView() {
  const [x, setX] = useState<DrInput>({ grade: "none", dme: "none", suddenLoss: false, type: 2, yearsSince: 0, pregnant: false, hba1c: 0, sbp: 0, ungradable: false });
  const r = drPlan(x);
  return (
    <section className="cx-page cx-lab cx-dr">
      <header className="cx-page-h"><div><h1>Diabetic Retinopathy Screening</h1><p>Grade the retina, decide how fast to refer, and when to screen again.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Retinopathy</span><select className="cx-select" value={x.grade} onChange={(e) => setX({ ...x, grade: e.target.value as DrInput["grade"] })} data-t="dr-grade">{GRADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="cx-field"><span>Macular oedema</span><select className="cx-select" value={x.dme} onChange={(e) => setX({ ...x, dme: e.target.value as DrInput["dme"] })} data-t="dr-dme"><option value="none">None</option><option value="non-central">Not involving the centre</option><option value="central">Centre-involving</option></select></label>
        <label className="cx-field"><span>Diabetes</span><select className="cx-select" value={x.type} onChange={(e) => setX({ ...x, type: Number(e.target.value) as 1 | 2 })} data-t="dr-type"><option value={2}>Type 2</option><option value={1}>Type 1</option></select></label>
      </div>
      <div className="cx-c50-grid">
        <NumField label="Years since diagnosis" value={x.yearsSince} set={(n) => setX({ ...x, yearsSince: n })} placeholder="6" data="dr-years" max={80} />
        <NumField label="HbA1c (%)" value={x.hba1c} set={(n) => setX({ ...x, hba1c: n })} placeholder="8.2" data="dr-a1c" decimals max={20} />
        <NumField label="Systolic BP" value={x.sbp} set={(n) => setX({ ...x, sbp: n })} placeholder="140" data="dr-sbp" max={300} />
      </div>
      <div className="cx-imaging-ticks"><Tick on={x.suddenLoss} set={(v) => setX({ ...x, suddenLoss: v })} label="Sudden loss of vision or floaters" data="dr-sudden" /><Tick on={x.pregnant} set={(v) => setX({ ...x, pregnant: v })} label="Pregnant" data="dr-preg" /><Tick on={x.ungradable} set={(v) => setX({ ...x, ungradable: v })} label="Photographs ungradable" data="dr-ungradable" /></div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="dr-out"><p className="cx-c50-score"><b data-t="dr-next">{r.next ? `Next: ${r.next}` : ""}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> ICO 2017 diabetic eye care guidelines; AAO Preferred Practice Pattern 2019; NHS DESP grading.</p>
    </section>
  );
}
