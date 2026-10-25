/**
 * Agitation & Rapid Tranquillisation: the Behavioural Activity Rating Scale, de-escalation, oral
 * and IM options adjusted for age and risks, and monitoring after sedation.
 */
import { useState } from "react";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { BARS, RT_MONITOR, rtPlan } from "@/lib/cadus/clinic35";

export default function AgitationView() {
  const [bars, setBars] = useState(6);
  const [f, setF] = useState({ elderly: false, naive: false, cardiac: false, parkinson: false, alcohol: false, onBenzo: false });
  const p = rtPlan({ bars, ...f });
  const box = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-ag={k} /> {l}</label>;

  return (
    <section className="cx-page cx-lab cx-agitation">
      <header className="cx-page-h"><div><h1>Agitation &amp; Rapid Tranquillisation</h1><p>Rate the agitation, de-escalate, choose oral or IM medicines safely for the person in front of you, and monitor afterwards.</p></div></header>
      <label className="cx-field"><span>Behavioural Activity Rating Scale</span><select className="cx-select" value={bars} onChange={(e) => setBars(Number(e.target.value))} data-ag="bars">{BARS.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}</select></label>
      <div className="cx-c23-row">
        {box("elderly", "Older or frail (halve doses)")}
        {box("naive", "Never had antipsychotics")}
        {box("cardiac", "Heart disease, long QT or no ECG")}
        {box("parkinson", "Parkinson's or Lewy body dementia")}
        {box("alcohol", "Alcohol withdrawal or intoxication")}
        {box("onBenzo", "Already given a benzodiazepine")}
      </div>
      <div className={`cx-cmp-out ${p.level === "im" ? "cx-st-out" : p.level === "oral" ? "cx-ac-high" : "cx-ac-in"}`} data-ag="out" data-level={p.level}>
        <h3 className="cx-lab-h3">{p.level === "im" ? "Rapid tranquillisation (IM)" : p.level === "oral" ? "De-escalate and offer oral medicine" : "No sedation needed"}</h3>
        <ol className="cx-c23-steps">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </div>
      <h4>After sedation</h4>
      <ul>{RT_MONITOR.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><ShieldAlert size={13} /> NICE NG10, Maudsley guidelines, TREC trials. <TriangleAlert size={13} /> Follow the Mental Healthcare Act 2017 on restraint and consent; use the least restrictive option.</p>
    </section>
  );
}
