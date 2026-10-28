/** Rheumatoid arthritis: ACR/EULAR 2010 classification, DAS28-ESR and treat-to-target. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { raPlan, type RaInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

const JOINTS: [RaInput["joints"], string][] = [[0, "1 large joint (0)"], [1, "2–10 large joints (1)"], [2, "1–3 small joints (2)"], [3, "4–10 small joints (3)"], [5, "Over 10 joints, at least 1 small (5)"]];
const SERO: [RaInput["serology"], string][] = [[0, "RF and anti-CCP negative (0)"], [2, "Low positive (2)"], [3, "High positive, over 3× upper limit (3)"]];

export default function RheumatoidView() {
  const [x, setX] = useState<RaInput>({ joints: 0, serology: 0, acutePhase: 0, sixWeeks: false, tender: 0, swollen: 0, esr: 0, gh: 0, onMtx: false, pregnant: false, liver: false, ckd: false, lung: false, weeksOnCurrent: 0 });
  const r = raPlan(x);
  return (
    <section className="cx-page cx-lab cx-ra">
      <header className="cx-page-h"><div><h1>Rheumatoid Arthritis</h1><p>Classify with the ACR/EULAR 2010 score, measure activity with DAS28, and start methotrexate to a target.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Joints involved</span><select className="cx-select" value={x.joints} onChange={(e) => setX({ ...x, joints: Number(e.target.value) as RaInput["joints"] })} data-t="ra-joints">{JOINTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="cx-field"><span>Serology</span><select className="cx-select" value={x.serology} onChange={(e) => setX({ ...x, serology: Number(e.target.value) as RaInput["serology"] })} data-t="ra-sero">{SERO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      <div className="cx-imaging-ticks"><Tick on={x.acutePhase === 1} set={(v) => setX({ ...x, acutePhase: v ? 1 : 0 })} label="Raised CRP or ESR (1)" data="ra-apr" /><Tick on={x.sixWeeks} set={(v) => setX({ ...x, sixWeeks: v })} label="Symptoms 6 weeks or more (1)" data="ra-6w" /></div>
      <div className="cx-c50-grid">
        <NumField label="Tender joints (of 28)" value={x.tender} set={(n) => setX({ ...x, tender: n })} placeholder="6" data="ra-tjc" max={28} />
        <NumField label="Swollen joints (of 28)" value={x.swollen} set={(n) => setX({ ...x, swollen: n })} placeholder="4" data="ra-sjc" max={28} />
        <NumField label="ESR (mm/h)" value={x.esr} set={(n) => setX({ ...x, esr: n })} placeholder="40" data="ra-esr" max={200} />
        <NumField label="Patient global (0–100)" value={x.gh} set={(n) => setX({ ...x, gh: n })} placeholder="50" data="ra-gh" max={100} />
        <NumField label="Weeks on current treatment" value={x.weeksOnCurrent} set={(n) => setX({ ...x, weeksOnCurrent: n })} placeholder="12" data="ra-weeks" max={520} />
      </div>
      <div className="cx-imaging-ticks"><Tick on={x.onMtx} set={(v) => setX({ ...x, onMtx: v })} label="Already on methotrexate" data="ra-mtx" /><Tick on={x.pregnant} set={(v) => setX({ ...x, pregnant: v })} label="Pregnant or planning" data="ra-preg" /><Tick on={x.liver} set={(v) => setX({ ...x, liver: v })} label="Liver disease or heavy alcohol" data="ra-liver" /><Tick on={x.ckd} set={(v) => setX({ ...x, ckd: v })} label="Kidney impairment" data="ra-ckd" /><Tick on={x.lung} set={(v) => setX({ ...x, lung: v })} label="Lung disease" data="ra-lung" /></div>
      <PlanOut urgency="routine" steps={r.steps} data="ra-out"><p className="cx-c50-score" data-t="ra-score" data-score={r.score} data-das={r.das?.das ?? ""}><b>{r.score}/10</b> · {r.ra ? "classifies as RA" : "not classified yet"}{r.das ? ` · DAS28 ${r.das.das} (${r.das.band})` : ""}</p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> 2010 ACR/EULAR RA classification; EULAR 2022 RA management; DAS28-ESR (Prevoo 1995).</p>
    </section>
  );
}
