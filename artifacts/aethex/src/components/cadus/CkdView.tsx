/**
 * CKD Care: eGFR (CKD-EPI 2021), the KDIGO stage and risk with how often to monitor, treatment
 * (ACE inhibitor/ARB, SGLT2 inhibitor, finerenone, statin, BP target), checks and referral.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { ckdEpi2021, ckdPlan, kdigoRisk } from "@/lib/cadus/clinic31";

export default function CkdView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ creat: "", age: "", egfr: "", acr: "", k: "", sbp: "", hb: "", bicarb: "" });
  const [female, setFemale] = useState(false);
  const [dm, setDm] = useState(false);
  const [fast, setFast] = useState(false);
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const calc = ckdEpi2021(Number(v.creat), Number(v.age), female);
  const e = v.egfr ? Number(v.egfr) : calc;
  const acr = Number(v.acr) || 0;
  const risk = e !== null && e > 0 ? kdigoRisk(e, acr) : null;
  const plan = e !== null && e > 0 ? ckdPlan({ egfr: e, acr, diabetes: dm, k: v.k ? Number(v.k) : undefined, sbp: v.sbp ? Number(v.sbp) : undefined, age: Number(v.age) || 50, hb: v.hb ? Number(v.hb) : undefined, bicarb: v.bicarb ? Number(v.bicarb) : undefined, declineFast: fast }) : null;
  const f = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(ev) => setV({ ...v, [k]: n(ev.target.value) })} placeholder={ph} data-ckd={k} /></label>;
  const md = () => plan && risk ? ["# CKD plan", "", `- eGFR ${e} (${risk.g}), ACR ${acr} mg/g (${risk.a}): ${risk.risk} risk; monitor ${risk.perYear.toLowerCase()}`, "", "## Treatment", ...plan.treat.map((t) => `- ${t}`), "", "## Checks", ...plan.checks.map((c) => `- ${c}`), ...(plan.refer.length ? ["", "## Refer to nephrology", ...plan.refer.map((r) => `- ${r}`)] : [])].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-ckd">
      <header className="cx-page-h"><div><h1>CKD Care</h1><p>eGFR by CKD-EPI 2021, the KDIGO stage and risk with how often to check, the treatments that slow CKD, the checks to do and when to refer.</p></div></header>
      <div className="cx-c23-row">
        {f("creat", "Creatinine (mg/dL)", "1.4")}{f("age", "Age", "60")}
        <label className="cx-pa-mine"><input type="checkbox" checked={female} onChange={(ev) => setFemale(ev.target.checked)} data-ckd="female" /> Female</label>
        {f("egfr", "or eGFR directly", "")}{f("acr", "Urine ACR (mg/g)", "120")}
      </div>
      <div className="cx-c23-row">
        {f("k", "Potassium", "4.8")}{f("sbp", "Systolic BP", "138")}{f("hb", "Hb (g/dL)", "")}{f("bicarb", "Bicarbonate", "")}
        <label className="cx-pa-mine"><input type="checkbox" checked={dm} onChange={(ev) => setDm(ev.target.checked)} data-ckd="dm" /> Diabetes</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={fast} onChange={(ev) => setFast(ev.target.checked)} /> Falling fast</label>
      </div>
      {risk && plan ? (
        <>
          <div className={`cx-cmp-out ${risk.risk === "very high" ? "cx-st-out" : risk.risk === "low" ? "cx-ac-in" : "cx-ac-high"}`} data-ckd="out" data-risk={risk.risk}>
            <div className="cx-sim-stats">
              <div><b data-ckd="egfr-out">{e}</b><small>eGFR ml/min/1.73 m² {v.egfr ? "" : "(CKD-EPI 2021)"}</small></div>
              <div><b data-ckd="stage">{risk.g} {risk.a}</b><small>{risk.risk} risk</small></div>
              <div><b>{risk.perYear}</b><small>eGFR and ACR checks</small></div>
            </div>
            <p className="cx-set-hint">CKD needs eGFR under 60 or kidney damage (ACR 30 or more, haematuria, structural) for over 3 months; repeat an isolated result first.</p>
          </div>
          <div className="cx-c23-two">
            <div><h4>Treatment</h4><ul data-ckd="treat">{plan.treat.map((t) => <li key={t}>{t}</li>)}</ul></div>
            <div><h4>Checks</h4><ul>{plan.checks.map((c) => <li key={c}>{c}</li>)}</ul>{plan.refer.length > 0 && <><h4>Refer to nephrology</h4><ul data-ckd="refer">{plan.refer.map((r) => <li key={r}>{r}</li>)}</ul></>}</div>
          </div>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("CKD plan", md())}><Printer size={14} /> Print plan</button></div>
        </>
      ) : <p className="cx-set-hint">Enter creatinine and age (or eGFR) and the urine ACR.</p>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> KDIGO 2024 CKD guideline; CKD-EPI 2021 equation without race. Acute kidney injury looks like CKD on one reading: compare with earlier values.</p>
    </section>
  );
}
