/**
 * Antenatal Steroids & Tocolysis: who gets steroids and when (including rescue courses and
 * diabetes), tocolytic regimens and contraindications, and magnesium for neuroprotection.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { mgNeuro, steroidPlan, TOCO_CI, tocolysis } from "@/lib/cadus/clinic40";

export default function AntenatalSteroidView() {
  const [ga, setGa] = useState("30");
  const [since, setSince] = useState("");
  const [dm, setDm] = useState(false);
  const [drug, setDrug] = useState<"nifedipine" | "atosiban" | "indomethacin">("nifedipine");
  const [ci, setCi] = useState<number[]>([]);
  const g = Number(ga) || 0;
  const sp = steroidPlan(g, since ? Number(since) : null, dm);
  return (
    <section className="cx-page cx-lab cx-ansteroid">
      <header className="cx-page-h"><div><h1>Antenatal Steroids &amp; Tocolysis</h1><p>Steroids by gestation (including rescue courses and diabetes), tocolysis regimens and when not to use them, and magnesium for fetal neuroprotection.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Gestation (completed weeks)</span><input className="cx-input" inputMode="numeric" value={ga} onChange={(e) => setGa(e.target.value.replace(/\D/g, "").slice(0, 2))} data-as2="ga" /></label>
        <label className="cx-field"><span>Days since a previous course (if any)</span><input className="cx-input" inputMode="numeric" value={since} onChange={(e) => setSince(e.target.value.replace(/\D/g, "").slice(0, 3))} data-as2="since" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={dm} onChange={(e) => setDm(e.target.checked)} data-as2="dm" /> Diabetes</label>
      </div>
      <div className={`cx-cmp-out ${sp.give ? "cx-ac-high" : "cx-ac-in"}`} data-as2="steroids" data-give={String(sp.give)}><h3 className="cx-lab-h3">Steroids: {sp.give ? "give" : "not routinely"}</h3><ul>{sp.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>
      <div className="cx-cmp-out" data-as2="mg"><p><b>{mgNeuro(g)}</b></p></div>
      <h4>Tocolysis</h4>
      <div className="cx-imaging-ticks">{TOCO_CI.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ci.includes(i)} onChange={() => setCi(ci.includes(i) ? ci.filter((y) => y !== i) : [...ci, i])} data-as2-ci={i} /> {x}</label>)}</div>
      {ci.length ? <div className="cx-cmp-out cx-st-out" data-as2="toco"><p><b>Do not give tocolysis: {TOCO_CI.filter((_, i) => ci.includes(i)).join(", ").toLowerCase()}.</b></p></div> : (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>Drug</span><select className="cx-select" value={drug} onChange={(e) => setDrug(e.target.value as typeof drug)} data-as2="drug"><option value="nifedipine">Nifedipine</option><option value="atosiban">Atosiban</option><option value="indomethacin">Indomethacin</option></select></label></div>
          <div className="cx-cmp-out cx-ac-high" data-as2="toco"><ul>{tocolysis(drug, g).map((s) => <li key={s}>{s}</li>)}</ul></div>
        </>
      )}
      <p className="cx-set-hint">PPROM: erythromycin 250 mg four times daily for 10 days; intrapartum GBS prophylaxis per policy. More on the whole pathway in the Preterm Labour tool.</p>
      <p className="cx-rs-foot"><Baby size={13} /> WHO 2022 antenatal corticosteroids, RCOG/NICE NG25, FOGSI. <TriangleAlert size={13} /> Arrange birth where there is a neonatal unit able to care for the baby.</p>
    </section>
  );
}
