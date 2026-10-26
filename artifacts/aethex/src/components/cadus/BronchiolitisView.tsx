/**
 * Bronchiolitis in Infants: admit, consider or home (NICE NG9 thresholds), what helps and what
 * does not, and advice for parents.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { BRONCH_DO, BRONCH_DONT, BRONCH_HOME, BRONCH_RISKS, bronchAssess, type BronchInput } from "@/lib/cadus/clinic41";

export default function BronchiolitisView() {
  const [v, setV] = useState({ age: "", rr: "", spo2: "", intake: "" });
  const [f, setF] = useState({ apnoea: false, grunting: false, dehydrated: false });
  const [rec, setRec] = useState<BronchInput["recession"]>("none");
  const [risks, setRisks] = useState<number[]>([]);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder={ph} data-bq={k} /></label>;
  const a = bronchAssess({ ageMonths: Number(v.age) || 0, rr: Number(v.rr) || 0, spo2: Number(v.spo2) || 0, intakePct: Number(v.intake) || 0, apnoea: f.apnoea, grunting: f.grunting, dehydrated: f.dehydrated, recession: rec, risk: risks.length > 0 });
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-bq={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-bronch">
      <header className="cx-page-h"><div><h1>Bronchiolitis in Infants</h1><p>Decide on admission using breathing, oxygen and feeding, give supportive care only, and send parents home with clear safety-net advice.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age (months)", "5")}{n("rr", "Respiratory rate", "50")}{n("spo2", "SpO2 on air (%)", "95")}{n("intake", "Feeding (% of usual)", "75")}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Chest recession</span><select className="cx-select" value={rec} onChange={(e) => setRec(e.target.value as typeof rec)} data-bq="rec"><option value="none">None</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Marked</option></select></label>
        {cb("apnoea", "Apnoea")}{cb("grunting", "Grunting")}{cb("dehydrated", "Clinically dehydrated")}
      </div>
      <div className="cx-imaging-ticks">{BRONCH_RISKS.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={risks.includes(i)} onChange={() => setRisks(risks.includes(i) ? risks.filter((y) => y !== i) : [...risks, i])} data-bq-risk={i} /> {x}</label>)}</div>
      <div className={`cx-cmp-out ${a.level === "admit" ? "cx-st-out" : a.level === "consider" ? "cx-ac-high" : "cx-ac-in"}`} data-bq="out" data-level={a.level}>
        <h3 className="cx-lab-h3">{a.level === "admit" ? "Admit" : a.level === "consider" ? "Consider admission (or a longer observation)" : "Can go home with advice"}</h3>
        {a.reasons.length > 0 && <ul>{a.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
      </div>
      <h4>Supportive care</h4><ul>{BRONCH_DO.map((s) => <li key={s}>{s}</li>)}</ul>
      <h4>Do not give</h4><ul data-bq="dont">{BRONCH_DONT.map((s) => <li key={s}>{s}</li>)}</ul>
      <h4>Advice for parents</h4><ul>{BRONCH_HOME.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Baby size={13} /> NICE NG9 (2021), AAP 2014. <TriangleAlert size={13} /> Fever over 39°C or a very unwell baby: think of another diagnosis (pneumonia, sepsis).</p>
    </section>
  );
}
