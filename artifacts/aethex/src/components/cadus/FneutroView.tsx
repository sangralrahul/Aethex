/**
 * Febrile Neutropenia: absolute neutrophil count, MASCC risk score, and the first-hour antibiotic
 * plan.
 */
import { useState } from "react";
import { ShieldPlus, TriangleAlert } from "lucide-react";
import { anc, fnPlan, mascc, type MasccInput } from "@/lib/cadus/clinic35";

export default function FneutroView() {
  const [c, setC] = useState({ wbc: "", neut: "", band: "" });
  const [m, setM] = useState<MasccInput>({ burden: "none", sbp90: true, copd: false, solidOrNoFungal: true, dehydrated: false, outpatient: true, age: 50 });
  const [x, setX] = useState({ shock: false, esbl: false, line: false, pneumonia: false, mrsa: false, penAllergy: false });
  const n = c.wbc && c.neut ? anc(Number(c.wbc), Number(c.neut), Number(c.band) || 0) : null;
  const s = mascc(m);
  const plan = fnPlan(s.low, x);
  const num = (k: keyof typeof c, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-fn={k} /></label>;
  const mb = (k: "sbp90" | "copd" | "solidOrNoFungal" | "dehydrated" | "outpatient", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.checked })} data-fn={k} /> {l}</label>;
  const xb = (k: keyof typeof x, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-fn={k} /> {l}</label>;

  return (
    <section className="cx-page cx-lab cx-fneutro">
      <header className="cx-page-h"><div><h1>Febrile Neutropenia</h1><p>Neutrophil count, MASCC risk, and antibiotics within the first hour: who can go home on oral treatment and who needs IV cover.</p></div></header>
      <div className="cx-c23-row">{num("wbc", "White cells (/mm³)", "1200")}{num("neut", "Neutrophils (%)", "30")}{num("band", "Bands (%)", "0")}</div>
      {n !== null && <p className={`cx-set-hint ${n < 500 ? "cx-bk-err" : ""}`} data-fn="anc"><b>ANC {n}/mm³{n < 500 ? ": neutropenic (under 500)" : n < 1000 ? ": neutropenic if expected to fall below 500 within 48 hours" : ""}</b></p>}
      <p className="cx-set-hint">Fever: a single temperature of 38.3 °C or over, or 38.0 °C sustained for an hour.</p>
      <h4>MASCC score</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Burden of illness</span><select className="cx-select" value={m.burden} onChange={(e) => setM({ ...m, burden: e.target.value as MasccInput["burden"] })} data-fn="burden"><option value="none">No or mild symptoms</option><option value="moderate">Moderate symptoms</option><option value="severe">Severe symptoms</option></select></label>
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={m.age} onChange={(e) => setM({ ...m, age: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} data-fn="age" /></label>
        {mb("sbp90", "Systolic BP over 90")}{mb("copd", "COPD")}{mb("solidOrNoFungal", "Solid tumour, or blood cancer with no previous fungal infection")}{mb("dehydrated", "Dehydration needing IV fluids")}{mb("outpatient", "Outpatient when the fever started")}
      </div>
      <div className={`cx-cmp-out ${s.low ? "cx-ac-in" : "cx-ac-high"}`} data-fn="mascc" data-low={String(s.low)}><h3 className="cx-lab-h3">MASCC {s.score}/26: {s.low ? "low risk" : "high risk"}</h3></div>
      <div className="cx-c23-row">{xb("shock", "Septic shock")}{xb("esbl", "Known ESBL or recent carbapenem-resistant organism")}{xb("line", "Central line infection suspected")}{xb("pneumonia", "Pneumonia")}{xb("mrsa", "MRSA colonised")}{xb("penAllergy", "Penicillin allergy")}</div>
      <div className={`cx-cmp-out ${x.shock ? "cx-st-out" : "cx-ac-high"}`} data-fn="plan"><ol className="cx-c23-steps">{plan.map((p) => <li key={p}>{p}</li>)}</ol></div>
      <p className="cx-rs-foot"><ShieldPlus size={13} /> IDSA/ASCO 2018, ESMO 2016, NCCN. <TriangleAlert size={13} /> Adjust doses for kidney function; follow your oncology unit's protocol and local resistance data.</p>
    </section>
  );
}
