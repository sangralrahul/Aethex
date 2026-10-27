/**
 * Haemoptysis: life-threatening vs not, resuscitation and tranexamic acid, embolisation, and the TB
 * and cancer work-up.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import { haemoptysisPlan, type HaemoptysisInput } from "@/lib/cadus/clinic47";

export default function HaemoptysisView() {
  const [x, setX] = useState<HaemoptysisInput>({ mlPerDay: 0, unstable: false, anticoag: false, age: 0, smoker: false, tbHistory: false, fever: false, weightLoss: false, dvtSigns: false });
  const r = haemoptysisPlan(x);
  const n = (k: "mlPerDay" | "age", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 4)) || 0 })} placeholder={ph} data-hmp={k} /></label>;
  const cb = (k: Exclude<keyof HaemoptysisInput, "mlPerDay" | "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-hmp={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-hmp">
      <header className="cx-page-h"><div><h1>Haemoptysis</h1><p>Coughing blood: first decide if it is life-threatening, then find the cause — TB, bronchiectasis, cancer, PE or vasculitis.</p></div></header>
      <div className="cx-c23-row">{n("mlPerDay", "Blood in 24 hours (mL, estimate)", "20")}{n("age", "Age", "45")}</div>
      <p className="cx-set-hint">A teaspoon is 5 mL, a tablespoon 15 mL, a teacup about 150 mL.</p>
      <div className="cx-imaging-ticks">{cb("unstable", "Low oxygen, breathing difficulty or low BP")}{cb("anticoag", "On anticoagulants or antiplatelets")}{cb("smoker", "Smoker or ex-smoker")}{cb("tbHistory", "Past TB")}{cb("fever", "Fever, purulent sputum")}{cb("weightLoss", "Weight loss")}{cb("dvtSigns", "Leg swelling, pleuritic pain or fast heart rate")}</div>
      <div className={`cx-cmp-out ${r.level === "massive" ? "cx-st-out" : r.level === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-hmp="out" data-level={r.level}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Wind size={13} /> BTS, ERS, NTEP guidance; NICE NG12 (age 40 and over). <TriangleAlert size={13} /> Patients die from asphyxia, not blood loss: protect the airway.</p>
    </section>
  );
}
