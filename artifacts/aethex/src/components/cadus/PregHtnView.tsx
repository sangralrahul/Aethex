/**
 * Hypertension in Pregnancy & Postpartum: acute severe BP regimens, oral drugs, magnesium sulphate
 * (Zuspan and Pritchard) with toxicity checks, and postpartum care.
 */
import { useState } from "react";
import { Baby, Printer, TriangleAlert } from "lucide-react";
import { mgso4, mgToxicity, ORAL_HTN, postpartumHtn, SEVERE_HTN } from "@/lib/cadus/clinic38";

export default function PregHtnView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"severe" | "mg" | "post">("severe");
  const [drug, setDrug] = useState<keyof typeof SEVERE_HTN>("labetalol");
  const [reg, setReg] = useState<"zuspan" | "pritchard">("pritchard");
  const [reflex, setReflex] = useState(true);
  const [rr, setRr] = useState("");
  const [uo, setUo] = useState("");
  const [bf, setBf] = useState(true);
  const [md, setMd] = useState(false);
  const tox = mgToxicity(reflex, Number(rr) || 0, Number(uo) || 0);

  return (
    <section className="cx-page cx-lab cx-preghtn">
      <header className="cx-page-h"><div><h1>Hypertension in Pregnancy &amp; Postpartum</h1><p>Treat severe BP (160/110 or more) within 30–60 minutes, give magnesium sulphate safely, and plan postpartum BP care.</p></div></header>
      <div className="cx-seg" role="tablist">{([["severe", "Severe BP"], ["mg", "Magnesium sulphate"], ["post", "Postpartum"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ph-tab={k}>{l}</button>)}</div>
      {tab === "severe" && (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>First drug</span><select className="cx-select" value={drug} onChange={(e) => setDrug(e.target.value as typeof drug)} data-ph="drug"><option value="labetalol">IV labetalol</option><option value="nifedipine">Oral nifedipine</option><option value="hydralazine">IV hydralazine</option></select></label></div>
          <div className="cx-cmp-out cx-st-out" data-ph="severe"><ol className="cx-c23-steps">{SEVERE_HTN[drug].map((s) => <li key={s}>{s}</li>)}</ol></div>
          <p className="cx-set-hint">Aim for 140–150/90–100 rather than a sudden fall; continuous fetal monitoring; start magnesium if severe features (headache, visual change, epigastric pain, low platelets, high liver enzymes).</p>
          <h4>Oral treatment</h4><ul>{ORAL_HTN.map((s) => <li key={s}>{s}</li>)}</ul>
        </>
      )}
      {tab === "mg" && (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>Regimen</span><select className="cx-select" value={reg} onChange={(e) => setReg(e.target.value as typeof reg)} data-ph="reg"><option value="pritchard">Pritchard (IV + IM)</option><option value="zuspan">Zuspan (IV infusion)</option></select></label></div>
          <ol className="cx-c23-steps" data-ph="mg">{mgso4(reg).map((s) => <li key={s}>{s}</li>)}</ol>
          <h4>Before each dose / every hour</h4>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={reflex} onChange={(e) => setReflex(e.target.checked)} data-ph="reflex" /> Knee reflex present</label>
            <label className="cx-field"><span>Breaths per minute</span><input className="cx-input" inputMode="numeric" value={rr} onChange={(e) => setRr(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="18" data-ph="rr" /></label>
            <label className="cx-field"><span>Urine (ml/hour)</span><input className="cx-input" inputMode="numeric" value={uo} onChange={(e) => setUo(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="40" data-ph="uo" /></label>
          </div>
          <div className={`cx-cmp-out ${tox.level === "toxic" ? "cx-st-out" : tox.level === "withhold" ? "cx-ac-high" : "cx-ac-in"}`} data-ph="tox" data-level={tox.level}><ul>{tox.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Magnesium sulphate", ["# Magnesium sulphate", "", ...mgso4(reg).map((s) => `- ${s}`), "", "Antidote: calcium gluconate 10% 10 ml IV over 10 minutes."].join("\n"))} data-ph="print"><Printer size={14} /> Print regimen</button></div>
        </>
      )}
      {tab === "post" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={bf} onChange={(e) => setBf(e.target.checked)} data-ph="bf" /> Breastfeeding</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={md} onChange={(e) => setMd(e.target.checked)} data-ph="md" /> On methyldopa</label>
          </div>
          <ol className="cx-c23-steps" data-ph="post">{postpartumHtn(bf, md).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><Baby size={13} /> NICE NG133, ACOG 2020, FOGSI and WHO guidance. <TriangleAlert size={13} /> Follow your labour ward protocol; delivery is the definitive treatment of pre-eclampsia.</p>
    </section>
  );
}
