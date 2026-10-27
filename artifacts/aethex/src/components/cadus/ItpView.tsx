/**
 * ITP (Immune Thrombocytopenia): exclude other causes, decide observation vs treatment by bleeding
 * and count (children and adults), and doses.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { ITP_EXCLUDE, itpPlan, type Bleed } from "@/lib/cadus/clinic44";

export default function ItpView() {
  const [child, setChild] = useState(false);
  const [plt, setPlt] = useState("");
  const [kg, setKg] = useState("");
  const [bleed, setBleed] = useState<Bleed>("none");
  const p = itpPlan(child, Number(plt) || 0, bleed, Number(kg) || 0);
  return (
    <section className="cx-page cx-lab cx-itp">
      <header className="cx-page-h"><div><h1>ITP (Immune Thrombocytopenia)</h1><p>A diagnosis of exclusion: rule out other causes, then treat the bleeding, not just the number.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Platelets (×10³/µL)</span><input className="cx-input" inputMode="numeric" value={plt} onChange={(e) => setPlt(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="20" data-itp="plt" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, "").slice(0, 3))} data-itp="kg" /></label>
        <label className="cx-field"><span>Bleeding</span><select className="cx-select" value={bleed} onChange={(e) => setBleed(e.target.value as Bleed)} data-itp="bleed"><option value="none">None</option><option value="skin">Skin only (petechiae, bruises)</option><option value="mucosal">Mucosal (nose, gums, heavy periods)</option><option value="severe">Severe (GI, intracranial)</option></select></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-itp="child" /> Child</label>
      </div>
      <div className={`cx-cmp-out ${p.action === "emergency" ? "cx-st-out" : p.action === "treat" ? "cx-ac-high" : "cx-ac-in"}`} data-itp="out" data-action={p.action}><h3 className="cx-lab-h3">{p.action === "emergency" ? "Emergency" : p.action === "treat" ? "Treat" : "Observe"}</h3><ul>{p.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>
      <h4>Exclude before calling it ITP</h4><ul>{ITP_EXCLUDE.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Droplets size={13} /> ASH ITP guideline 2019, International Consensus Report 2019. <TriangleAlert size={13} /> Platelets below 20 in dengue are managed by the dengue pathway, not as ITP.</p>
    </section>
  );
}
