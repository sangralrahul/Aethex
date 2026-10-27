/**
 * Polyuria & Diabetes Insipidus: confirm polyuria, glucose vs solute vs water diuresis, and read the
 * water deprivation test.
 */
import { useState } from "react";
import { Droplet, TriangleAlert } from "lucide-react";
import { polyuria, waterDeprivation } from "@/lib/cadus/clinic46";

export default function PolyuriaView() {
  const [v, setV] = useState({ urineL: "", kg: "", uOsm: "", sNa: "", after: "", ddavp: "" });
  const [glu, setGlu] = useState(false);
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const r = v.urineL ? polyuria({ urineL: num("urineL"), kg: num("kg"), glucoseHigh: glu, uOsm: num("uOsm"), sNa: num("sNa") }) : null;
  const w = v.after && v.ddavp ? waterDeprivation(num("after"), num("ddavp")) : v.after && num("after") > 800 ? waterDeprivation(num("after"), num("after")) : null;
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-pol={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-pol">
      <header className="cx-page-h"><div><h1>Polyuria &amp; Diabetes Insipidus</h1><p>Over 3 L of urine a day: sort glucose, solute and water diuresis, then separate central DI, nephrogenic DI and primary polydipsia.</p></div></header>
      <div className="cx-c23-row">{n("urineL", "24-hour urine (L)", "5")}{n("kg", "Weight (kg)", "60")}{n("uOsm", "Urine osmolality (mOsm/kg)", "150")}{n("sNa", "Serum sodium (mmol/L)", "146")}</div>
      <label className="cx-pa-mine"><input type="checkbox" checked={glu} onChange={(e) => setGlu(e.target.checked)} data-pol="glucose" /> Blood glucose high</label>
      {r && <div className={`cx-cmp-out ${r.kind === "water" ? "cx-ac-high" : "cx-ac-in"}`} data-pol="out" data-kind={r.kind}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>}
      <h4>Water deprivation test</h4>
      <div className="cx-c23-row">{n("after", "Urine osmolality after deprivation", "250")}{n("ddavp", "Urine osmolality after desmopressin", "500")}</div>
      {w && <div className="cx-cmp-out cx-ac-high" data-pol="wdt" data-rise={w.rise}><p>{w.dx}</p></div>}
      <p className="cx-rs-foot"><Droplet size={13} /> Society for Endocrinology, Fenske et al. NEJM 2018 (copeptin). <TriangleAlert size={13} /> Stop the deprivation test if weight falls over 3% or sodium rises above 145.</p>
    </section>
  );
}
