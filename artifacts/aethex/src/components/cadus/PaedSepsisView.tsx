/**
 * Paediatric Sepsis & Shock: the Phoenix sepsis score (2024) by age, and the first-hour plan with
 * antibiotics, fluid boluses and inotropes by weight.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { paedSepsisPlan, phoenix, PHOENIX_RESP } from "@/lib/cadus/clinic37";

export default function PaedSepsisView() {
  const [v, setV] = useState({ age: "", kg: "", lactate: "", map: "", plt: "", inr: "", dd: "", fib: "", gcs: "" });
  const [resp, setResp] = useState<0 | 1 | 2 | 3>(0);
  const [vaso, setVaso] = useState(0);
  const [pupils, setPupils] = useState(false);
  const [icu, setIcu] = useState(true);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-ps={k} /></label>;
  const num = (s: string) => (s ? Number(s) : null);
  const age = Number(v.age) || 3;
  const p = phoenix({ ageYears: age, resp, vasoactives: vaso, lactate: num(v.lactate), map: num(v.map), platelets: num(v.plt), inr: num(v.inr), ddimer: num(v.dd), fibrinogen: num(v.fib), gcs: num(v.gcs), fixedPupils: pupils });
  const plan = paedSepsisPlan(Number(v.kg) || 0, age, p.shock, icu);

  return (
    <section className="cx-page cx-lab cx-paedsepsis">
      <header className="cx-page-h"><div><h1>Paediatric Sepsis &amp; Shock</h1><p>The Phoenix sepsis score for children with suspected infection, and the first-hour plan with doses for the weight.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age (years; 0.5 = 6 months)", "3")}{n("kg", "Weight (kg)", "14")}</div>
      <label className="cx-field"><span>Respiratory</span><select className="cx-select" value={resp} onChange={(e) => setResp(Number(e.target.value) as 0 | 1 | 2 | 3)} data-ps="resp">{PHOENIX_RESP.map((r, i) => <option key={r} value={i}>{r}</option>)}</select></label>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Vasoactive drugs running</span><select className="cx-select" value={vaso} onChange={(e) => setVaso(Number(e.target.value))} data-ps="vaso"><option value={0}>None</option><option value={1}>One</option><option value={2}>Two or more</option></select></label>
        {n("lactate", "Lactate (mmol/L)", "3")}{n("map", "Mean arterial pressure (mmHg)", "50")}
      </div>
      <div className="cx-c23-row">{n("plt", "Platelets (×1000)", "150")}{n("inr", "INR", "1.1")}{n("dd", "D-dimer (mg/L FEU)", "")}{n("fib", "Fibrinogen (mg/dL)", "")}{n("gcs", "GCS", "15")}
        <label className="cx-pa-mine"><input type="checkbox" checked={pupils} onChange={(e) => setPupils(e.target.checked)} data-ps="pupils" /> Both pupils fixed</label>
      </div>
      <div className={`cx-cmp-out ${p.shock ? "cx-st-out" : p.sepsis ? "cx-ac-high" : "cx-ac-in"}`} data-ps="out" data-state={p.shock ? "shock" : p.sepsis ? "sepsis" : "none"}>
        <h3 className="cx-lab-h3">Phoenix score {p.total}: {p.shock ? "septic shock" : p.sepsis ? "sepsis" : "does not meet sepsis criteria"}</h3>
        <p>Respiratory {p.resp}, cardiovascular {p.cvs}, coagulation {p.coag}, neurological {p.neuro}. Sepsis: 2 or more in a child with suspected infection; septic shock: sepsis with at least 1 cardiovascular point.</p>
      </div>
      <div className="cx-c23-row"><label className="cx-pa-mine"><input type="checkbox" checked={icu} onChange={(e) => setIcu(e.target.checked)} data-ps="icu" /> Intensive care available</label></div>
      <ol className="cx-c23-steps" data-ps="plan">{plan.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Baby size={13} /> Phoenix criteria (JAMA 2024), Surviving Sepsis Campaign paediatric guidelines 2020. <TriangleAlert size={13} /> Not a screening tool: a child who looks unwell needs treatment whatever the score.</p>
    </section>
  );
}
