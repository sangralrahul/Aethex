/**
 * Hyponatraemia & Sodium: corrected sodium, osmolality, the cause from urine tests and volume
 * status, the expected change from each fluid (Adrogué–Madias), safe limits and fluid restriction.
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { calcOsm, correctedNa, furst, hypoNaCause, INFUSATES, NA_OVERCORRECT, naChangePerLitre, naLimit, tbw } from "@/lib/cadus/clinic36";

export default function SodiumView() {
  const [v, setV] = useState({ na: "", glu: "", urea: "", sosm: "", uosm: "", una: "", uk: "", kg: "", age: "" });
  const [sex, setSex] = useState<"m" | "f">("m");
  const [vol, setVol] = useState<"low" | "normal" | "high">("normal");
  const [risk, setRisk] = useState(false);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-na={k} /></label>;
  const na = Number(v.na), glu = Number(v.glu) || 100;
  const cna = na ? correctedNa(na, glu) : 0;
  const osm = v.sosm ? Number(v.sosm) : na ? calcOsm(na, glu, Number(v.urea) || 30) : 0;
  const cause = na && osm ? hypoNaCause({ serumOsm: osm, urineOsm: v.uosm ? Number(v.uosm) : undefined, urineNa: v.una ? Number(v.una) : undefined, volume: vol }) : null;
  const water = Number(v.kg) ? tbw(Number(v.kg), sex, Number(v.age) || 40) : 0;
  const fr = v.una && v.uk && na ? furst(Number(v.una), Number(v.uk), na) : null;

  return (
    <section className="cx-page cx-lab cx-sodium">
      <header className="cx-page-h"><div><h1>Hyponatraemia &amp; Sodium</h1><p>Find the cause from osmolality, urine tests and volume status, see how much each fluid will move the sodium, and correct it safely.</p></div></header>
      <div className="cx-c23-row">{n("na", "Serum sodium (mmol/L)", "118")}{n("glu", "Glucose (mg/dL)", "100")}{n("urea", "Urea (mg/dL)", "30")}{n("sosm", "Measured serum osmolality (optional)", "250")}</div>
      {na > 0 && <p className="cx-set-hint" data-na="calc"><b>{glu > 100 ? `Corrected sodium ${cna} mmol/L. ` : ""}Serum osmolality {osm} mOsm/kg{v.sosm ? " (measured)" : " (calculated)"}.</b></p>}
      <div className="cx-c23-row">{n("uosm", "Urine osmolality", "450")}{n("una", "Urine sodium", "60")}{n("uk", "Urine potassium", "30")}
        <label className="cx-field"><span>Volume status</span><select className="cx-select" value={vol} onChange={(e) => setVol(e.target.value as typeof vol)} data-na="vol"><option value="low">Dry (hypovolaemic)</option><option value="normal">Normal (euvolaemic)</option><option value="high">Overloaded (oedema, ascites)</option></select></label>
      </div>
      {cause && <div className="cx-cmp-out cx-ac-high" data-na="cause"><h3 className="cx-lab-h3">{cause.label}</h3><ul>{cause.causes.map((c) => <li key={c}>{c}</li>)}</ul></div>}
      {fr && <p className="cx-set-hint" data-na="furst"><b>Furst ratio {fr.ratio}:</b> {fr.advice}</p>}
      <h4>How much will each fluid change it?</h4>
      <div className="cx-c23-row">{n("kg", "Weight (kg)", "60")}{n("age", "Age", "65")}
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={sex} onChange={(e) => setSex(e.target.value as "m" | "f")} data-na="sex"><option value="m">Male</option><option value="f">Female</option></select></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={risk} onChange={(e) => setRisk(e.target.checked)} data-na="risk" /> High risk of osmotic demyelination</label>
      </div>
      {water > 0 && na > 0 && (
        <table className="cx-c23-table" data-na="fluids"><thead><tr><th>1 litre of</th><th>Expected change</th></tr></thead><tbody>
          {INFUSATES.map((f) => { const d = naChangePerLitre(na, f.na, f.k, water); return <tr key={f.id}><td>{f.label}</td><td>{d > 0 ? "+" : ""}{d} mmol/L</td></tr>; })}
        </tbody></table>
      )}
      {water > 0 && <p className="cx-set-hint">Total body water {water} L. The formula ignores ongoing urine losses: recheck sodium every 2–4 hours.</p>}
      <div className="cx-cmp-out cx-st-out" data-na="limits">
        <p><b>Severe symptoms (seizures, coma, vomiting, confusion):</b> 3% saline 150 ml IV over 20 minutes; recheck and repeat up to twice until symptoms improve or sodium rises by 5 mmol/L.</p>
        <p>{naLimit(risk)}</p><p>{NA_OVERCORRECT}</p>
      </div>
      <p className="cx-rs-foot"><FlaskConical size={13} /> European hyponatraemia guideline (2014), US expert panel (2013), Adrogué–Madias. <TriangleAlert size={13} /> Over-rapid correction can cause permanent brain injury; involve seniors early.</p>
    </section>
  );
}
