/**
 * Antibiotic Renal Dosing: Cockcroft–Gault creatinine clearance, then the dose of common
 * antibiotics for that clearance or haemodialysis, with loading doses.
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { cockcroftGault, RENAL_ABX, renalAbx } from "@/lib/cadus/clinic39";

export default function RenalAbxView() {
  const [v, setV] = useState({ age: "", kg: "", cr: "", crcl: "" });
  const [female, setFemale] = useState(false);
  const [hd, setHd] = useState(false);
  const [drug, setDrug] = useState("meropenem");
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-ra={k} /></label>;
  const cg = cockcroftGault(Number(v.age), Number(v.kg), Number(v.cr), female);
  const crcl = v.crcl ? Number(v.crcl) : cg;
  const r = crcl || hd ? renalAbx(drug, crcl, hd) : null;
  return (
    <section className="cx-page cx-lab cx-renalabx">
      <header className="cx-page-h"><div><h1>Antibiotic Renal Dosing</h1><p>Creatinine clearance by Cockcroft–Gault, then the dose of common antibiotics for that clearance or on haemodialysis.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age", "70")}{n("kg", "Weight (kg)", "60")}{n("cr", "Creatinine (mg/dL)", "1.5")}
        <label className="cx-pa-mine"><input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} data-ra="female" /> Female</label>
        {n("crcl", "Or enter CrCl (ml/min)", "")}
        <label className="cx-pa-mine"><input type="checkbox" checked={hd} onChange={(e) => setHd(e.target.checked)} data-ra="hd" /> On haemodialysis</label>
      </div>
      {cg > 0 && !v.crcl && <p className="cx-set-hint" data-ra="cg"><b>CrCl {cg} ml/min</b> (Cockcroft–Gault; use ideal or adjusted body weight in obesity).</p>}
      <div className="cx-c23-row"><label className="cx-field"><span>Antibiotic</span><select className="cx-select" value={drug} onChange={(e) => setDrug(e.target.value)} data-ra="drug">{RENAL_ABX.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label></div>
      {r && <div className="cx-cmp-out cx-ac-high" data-ra="out"><h3 className="cx-lab-h3">{r.name}: {r.dose}</h3>{r.load && <p><b>{r.load}.</b></p>}{r.note && <p>{r.note}</p>}<p className="cx-set-hint">Usual dose with normal kidneys: {RENAL_ABX.find((d) => d.id === drug)?.normal}. In sepsis, give the full first dose whatever the kidney function.</p></div>}
      {(crcl > 0 || hd) && <table className="cx-c23-table" data-ra="all"><thead><tr><th>Antibiotic</th><th>{hd ? "Haemodialysis" : `CrCl ${crcl}`}</th></tr></thead><tbody>{RENAL_ABX.map((d) => <tr key={d.id}><td>{d.name}</td><td>{renalAbx(d.id, crcl, hd)?.dose}</td></tr>)}</tbody></table>}
      <p className="cx-rs-foot"><FlaskConical size={13} /> Sanford Guide, BNF and The Renal Drug Handbook approximations. <TriangleAlert size={13} /> Check your formulary and drug levels; AKI changes quickly, so re-dose daily.</p>
    </section>
  );
}
