/**
 * Recurrent Miscarriage: when to investigate (ESHRE 2022, RCOG 2023), the tests, antiphospholipid
 * syndrome treatment, progesterone for bleeding, and what not to use.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { rmPlan, type RmInput } from "@/lib/cadus/clinic47";

export default function MiscarriageView() {
  const [x, setX] = useState<RmInput>({ losses: 0, secondTrimester: false, age: 0, bleedingNow: false, aps: false, tshHigh: false, uterineAnomaly: false, smoker: false, bmi: 0 });
  const r = rmPlan(x);
  const n = (k: "losses" | "age" | "bmi", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)) || 0 })} placeholder={ph} data-rpl={k} /></label>;
  const cb = (k: "secondTrimester" | "bleedingNow" | "aps" | "tshHigh" | "uterineAnomaly" | "smoker", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-rpl={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-rpl">
      <header className="cx-page-h"><div><h1>Recurrent Miscarriage</h1><p>Two or more pregnancy losses: investigate kindly and focus on the treatments that work.</p></div></header>
      <div className="cx-c23-row">{n("losses", "Number of losses", "3")}{n("age", "Age", "32")}{n("bmi", "BMI", "24")}</div>
      <div className="cx-imaging-ticks">{cb("secondTrimester", "A loss after 12 weeks")}{cb("bleedingNow", "Pregnant now and bleeding")}{cb("aps", "Antiphospholipid antibodies positive twice")}{cb("tshHigh", "TSH over 4 with TPO antibodies")}{cb("uterineAnomaly", "Septum or fibroid in the cavity")}{cb("smoker", "Smoker")}</div>
      <div className={`cx-cmp-out ${r.recurrent ? "cx-ac-high" : "cx-ac-in"}`} data-rpl="out" data-recurrent={String(r.recurrent)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Venus size={13} /> ESHRE recurrent pregnancy loss 2022, RCOG green-top 17 (2023), PRISM trial. <TriangleAlert size={13} /> Pain with bleeding in early pregnancy: exclude ectopic pregnancy first.</p>
    </section>
  );
}
