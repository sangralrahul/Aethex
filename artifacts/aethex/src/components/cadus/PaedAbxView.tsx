/**
 * Children's Antibiotics by Weight: first-line oral antibiotics for common childhood infections,
 * dose per dose and syrup volume, alternatives, and danger signs that need admission.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { PAED_ABX, PAED_DANGER, paedAbxDose } from "@/lib/cadus/clinic38";

export default function PaedAbxView() {
  const [id, setId] = useState("aom");
  const [kg, setKg] = useState("");
  const a = PAED_ABX.find((x) => x.id === id)!;
  const w = Number(kg) || 0;
  const d = w ? paedAbxDose(a, w) : null;
  return (
    <section className="cx-page cx-lab cx-paedabx">
      <header className="cx-page-h"><div><h1>Children's Antibiotics by Weight</h1><p>First-line antibiotics for common childhood infections: the dose per dose, syrup volume, duration and alternatives.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Infection</span><select className="cx-select" value={id} onChange={(e) => setId(e.target.value)} data-pa="cond">{PAED_ABX.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="12" data-pa="kg" /></label>
      </div>
      {d && <div className="cx-cmp-out cx-ac-in" data-pa="out"><h3 className="cx-lab-h3">{d.text}</h3><p>{a.mgPerKgDay} mg/kg/day in {a.doses} dose{a.doses === 1 ? "" : "s"} (max {a.maxPerDose} mg per dose).</p><p>{a.alt}</p>{a.note && <p>{a.note}</p>}</div>}
      <h4>Admit or refer if any danger sign</h4>
      <div className="cx-anc-flags">{PAED_DANGER.map((s) => <p key={s} className="high">{s}</p>)}</div>
      <p className="cx-rs-foot"><Baby size={13} /> IAP, WHO IMNCI and NICE guidance; check syrup strength on the bottle. <TriangleAlert size={13} /> Use local antibiograms; many fevers in children are viral and need no antibiotic.</p>
    </section>
  );
}
