/**
 * Psoriasis: severity by body surface area, special sites and DLQI, and topical, phototherapy and
 * systemic treatment.
 */
import { useState } from "react";
import { TriangleAlert, CircleDot } from "lucide-react";
import { psoriasisPlan, psoriasisSeverity } from "@/lib/cadus/clinic43";

export default function PsoriasisView() {
  const [v, setV] = useState({ bsa: "", dlqi: "", kg: "" });
  const [special, setSpecial] = useState(false);
  const [female, setFemale] = useState(false);
  const s = psoriasisSeverity(Number(v.bsa) || 0, special, Number(v.dlqi) || 0);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder={ph} data-pso={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-psoriasis">
      <header className="cx-page-h"><div><h1>Psoriasis</h1><p>Grade severity (the patient's palm is about 1% of body surface), then choose topical treatment, phototherapy or systemic therapy.</p></div></header>
      <div className="cx-c23-row">{n("bsa", "Body surface area (%)", "5")}{n("dlqi", "DLQI (0–30)", "6")}{n("kg", "Weight (kg)", "70")}</div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} data-pso="special" /> Face, scalp, genitals, palms/soles or nails</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} data-pso="female" /> Woman who could become pregnant</label>
      </div>
      <div className={`cx-cmp-out ${s.band === "severe" ? "cx-st-out" : s.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-pso="out" data-band={s.band}><h3 className="cx-lab-h3">{s.text}</h3><ol className="cx-c23-steps">{psoriasisPlan(s.band, Number(v.kg) || 0, female).map((x) => <li key={x}>{x}</li>)}</ol></div>
      <p className="cx-rs-foot"><CircleDot size={13} /> NICE CG153, IADVL psoriasis guideline, AAD–NPF 2020. <TriangleAlert size={13} /> Generalised pustular or erythrodermic psoriasis is an emergency: admit.</p>
    </section>
  );
}
