/**
 * Hypertensive Emergency: urgency versus emergency, the BP target and speed for each condition
 * (dissection, stroke, ICH, ACS, pulmonary oedema, eclampsia), and IV and oral drug doses.
 */
import { useState } from "react";
import { Gauge, Printer, TriangleAlert } from "lucide-react";
import { HTN_CONDITIONS, htnPlan, mapOf, type HtnCondition } from "@/lib/cadus/clinic31";

export default function HtnEmergencyView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const [c, setC] = useState<HtnCondition>("general");
  const s = Number(sbp), d = Number(dbp);
  const p = htnPlan(c, s, d);
  const n = (v: string) => v.replace(/\D/g, "").slice(0, 3);
  const label = HTN_CONDITIONS.find(([v]) => v === c)![1];
  const md = () => [`# ${label}`, "", `BP ${sbp}/${dbp}${s && d ? ` (MAP ${mapOf(s, d)})` : ""}`, "", `**Target:** ${p.target}`, "", ...p.drugs.map((x) => `- ${x}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-htnem">
      <header className="cx-page-h"><div><h1>Hypertensive Emergency</h1><p>Whether severe BP is an urgency or an emergency, how far and how fast to lower it for each condition, and the IV and oral drugs with doses.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Systolic</span><input className="cx-input" inputMode="numeric" value={sbp} onChange={(e) => setSbp(n(e.target.value))} placeholder="220" data-ht2="sbp" /></label>
        <label className="cx-field"><span>Diastolic</span><input className="cx-input" inputMode="numeric" value={dbp} onChange={(e) => setDbp(n(e.target.value))} placeholder="130" data-ht2="dbp" /></label>
        <label className="cx-field"><span>Situation</span><select className="cx-select" value={c} onChange={(e) => setC(e.target.value as HtnCondition)} data-ht2="cond">{HTN_CONDITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      {s >= 180 || d >= 120 ? <p className="cx-set-hint">Severe hypertension (180/120 or more). Look for acute organ damage: headache with confusion or seizures, chest pain, breathlessness, focal weakness, reduced urine, fundal haemorrhages or papilloedema, and pregnancy.</p> : null}
      <div className={`cx-cmp-out ${c === "urgency" ? "cx-ac-high" : "cx-st-out"}`} data-ht2="out">
        {s > 0 && d > 0 && <p className="cx-set-hint">MAP {mapOf(s, d)} mmHg</p>}
        <h3 className="cx-lab-h3" data-ht2="target">{p.target}</h3>
        <ul data-ht2="drugs">{p.drugs.map((x) => <li key={x}>{x}</li>)}</ul>
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Hypertensive emergency", md())}><Printer size={14} /> Print</button></div>
      </div>
      <h4>Work-up</h4>
      <ul><li>ECG, troponin, creatinine and electrolytes, urine for blood and protein, CBC with smear (thrombotic microangiopathy), fundoscopy.</li><li>CT brain for neurological signs; CT angiography for chest or back pain (dissection); chest X-ray for breathlessness.</li><li>Pregnancy test in women of childbearing age; ask about cocaine, amphetamines, and stopped clonidine or beta-blockers.</li></ul>
      <p className="cx-rs-foot"><Gauge size={13} /> ESC 2018/2024 and ACC/AHA 2017 hypertension guidance; AHA stroke and ICH guidelines; ACOG for pre-eclampsia. <TriangleAlert size={13} /> IV infusions need continuous monitoring, ideally an arterial line in HDU or ICU.</p>
    </section>
  );
}
