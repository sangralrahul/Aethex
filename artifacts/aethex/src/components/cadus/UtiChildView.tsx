/**
 * UTI in Children: antibiotics by age, site and weight, and imaging after the infection.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { utiChildImaging, utiChildRx } from "@/lib/cadus/clinic45";

export default function UtiChildView() {
  const [v, setV] = useState({ age: "", kg: "" });
  const [f, setF] = useState({ upper: true, unwell: false, atypical: false, recurrent: false });
  const age = Number(v.age) || 0;
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder={ph} data-utc={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-utc={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-utichild">
      <header className="cx-page-h"><div><h1>UTI in Children</h1><p>Collect urine properly, treat by age and whether the kidney is involved, and image only the children who need it.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age (months)", "18")}{n("kg", "Weight (kg)", "10")}</div>
      <div className="cx-imaging-ticks">{cb("upper", "Upper UTI (fever 38°C or more, loin pain)")}{cb("unwell", "Seriously unwell or vomiting")}{cb("atypical", "Atypical features")}{cb("recurrent", "Recurrent UTI")}</div>
      <div className={`cx-cmp-out ${age > 0 && age < 3 || f.unwell ? "cx-st-out" : "cx-ac-high"}`} data-utc="rx"><h3 className="cx-lab-h3">Treatment</h3><ul>{utiChildRx(age, f.upper, f.unwell, Number(v.kg) || 0).map((s) => <li key={s}>{s}</li>)}</ul></div>
      <div className="cx-cmp-out" data-utc="imaging"><h3 className="cx-lab-h3">Imaging</h3><ul>{utiChildImaging(age, f.atypical, f.recurrent).map((s) => <li key={s}>{s}</li>)}</ul></div>
      <p className="cx-set-hint">Urine: clean catch (or catheter or suprapubic aspirate in infants); dipstick nitrites and leucocytes guide treatment over 3 years; culture all under 3 years and all upper UTIs.</p>
      <p className="cx-rs-foot"><Baby size={13} /> NICE NG224 (2022) and CG54, AAP 2016, IAP. <TriangleAlert size={13} /> Prevent recurrences: treat constipation, encourage regular voiding and fluids.</p>
    </section>
  );
}
