/**
 * Abnormal Uterine Bleeding: PALM-COEIN causes, who needs endometrial sampling, and medical and
 * surgical treatment.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { aubPlan, PALM_COEIN, type AubInput } from "@/lib/cadus/clinic45";

export default function AubView() {
  const [x, setX] = useState<AubInput>({ age: 0, postmenopausal: false, unstable: false, risk: false, structural: false, contraception: false, fertility: false });
  const r = aubPlan(x);
  const cb = (k: Exclude<keyof AubInput, "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-aub={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-aub">
      <header className="cx-page-h"><div><h1>Abnormal Uterine Bleeding</h1><p>Heavy, irregular or intermenstrual bleeding: classify with PALM-COEIN, sample the endometrium when needed, and treat.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={x.age || ""} onChange={(e) => setX({ ...x, age: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="42" data-aub="age" /></label></div>
      <div className="cx-imaging-ticks">{cb("unstable", "Heavy bleeding with instability")}{cb("postmenopausal", "Postmenopausal")}{cb("risk", "Endometrial cancer risk factors")}{cb("structural", "Polyp, fibroid or adenomyosis on scan")}{cb("contraception", "Wants contraception")}{cb("fertility", "Wants pregnancy")}</div>
      <div className={`cx-cmp-out ${x.unstable || x.postmenopausal ? "cx-st-out" : r.sample ? "cx-ac-high" : "cx-ac-in"}`} data-aub="out" data-sample={String(r.sample)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <h4>PALM-COEIN</h4>
      <table className="cx-c23-table"><thead><tr><th>Cause</th><th>Group</th></tr></thead><tbody>{PALM_COEIN.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
      <p className="cx-rs-foot"><Venus size={13} /> FIGO 2018 AUB system, NICE NG88, FOGSI. <TriangleAlert size={13} /> Bleeding after sex or between periods: examine the cervix and check screening.</p>
    </section>
  );
}
