/**
 * VTE Prophylaxis: the Padua score for medical inpatients, bleeding contraindications, and
 * enoxaparin prophylactic and treatment doses by weight and kidney function.
 */
import { useState } from "react";
import { ShieldPlus, TriangleAlert } from "lucide-react";
import { crcl } from "@/lib/cadus/clinic29";
import { enoxaparin, PADUA, paduaScore, VTE_BLEED } from "@/lib/cadus/clinic30";

export default function VteView() {
  const [sel, setSel] = useState<string[]>([]);
  const [bleed, setBleed] = useState<string[]>([]);
  const [p, setP] = useState({ age: "", kg: "", creat: "", female: false });
  const [purpose, setPurpose] = useState<"prophylaxis" | "treatment">("prophylaxis");
  const score = paduaScore(sel);
  const c = crcl(Number(p.age), Number(p.kg), Number(p.creat), p.female);
  const doses = enoxaparin(Number(p.kg), c, purpose);
  const t = (list: string[], set: (l: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const num = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);

  return (
    <section className="cx-page cx-lab cx-vte">
      <header className="cx-page-h"><div><h1>VTE Prophylaxis</h1><p>Clot risk in medical inpatients (Padua), bleeding contraindications, and enoxaparin doses by weight and kidney function.</p></div></header>
      <div className="cx-c23-two">
        <div><h4>Padua risk factors</h4><div className="cx-imaging-ticks" data-vte="padua">{PADUA.map((r) => <label key={r.id} className="cx-pa-mine"><input type="checkbox" checked={sel.includes(r.id)} onChange={() => t(sel, setSel, r.id)} data-vte-p={r.id} /> {r.label} <small>(+{r.pts})</small></label>)}</div></div>
        <div><h4>Bleeding contraindications</h4><div className="cx-imaging-ticks">{VTE_BLEED.map((b) => <label key={b} className="cx-pa-mine"><input type="checkbox" checked={bleed.includes(b)} onChange={() => t(bleed, setBleed, b)} data-vte-b /> {b}</label>)}</div></div>
      </div>
      <div className={`cx-cmp-out ${score >= 4 ? "cx-ac-high" : "cx-ac-in"}`} data-vte="out">
        <h3 className="cx-lab-h3" data-vte="score">Padua {score}: {score >= 4 ? "high risk of VTE" : "low risk"}</h3>
        <p>{score < 4 ? "No pharmacological prophylaxis needed; keep mobile and hydrated; reassess if the condition changes." : bleed.length ? "High clot risk but a bleeding contraindication: mechanical prophylaxis (IPC or stockings) now; start a heparin when the bleeding risk falls." : "Start pharmacological prophylaxis (below) unless already anticoagulated."}</p>
      </div>
      <h4>Enoxaparin dose</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={p.age} onChange={(e) => setP({ ...p, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-vte="age" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={p.kg} onChange={(e) => setP({ ...p, kg: num(e.target.value) })} data-vte="kg" /></label>
        <label className="cx-field"><span>Creatinine (mg/dL)</span><input className="cx-input" inputMode="decimal" value={p.creat} onChange={(e) => setP({ ...p, creat: num(e.target.value) })} data-vte="creat" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={p.female} onChange={(e) => setP({ ...p, female: e.target.checked })} /> Female</label>
        <div className="cx-seg" role="radiogroup" aria-label="Purpose">{([["prophylaxis", "Prophylaxis"], ["treatment", "Treatment"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={purpose === v} className={purpose === v ? "on" : ""} onClick={() => setPurpose(v)} data-vte-purpose={v}>{l}</button>)}</div>
      </div>
      {doses.length > 0 && <div className="cx-cmp-out" data-vte="doses">{c !== null && <p className="cx-set-hint">CrCl {c} ml/min (Cockcroft–Gault)</p>}<ul>{doses.map((d) => <li key={d}>{d}</li>)}</ul></div>}
      <p className="cx-set-hint">Surgical patients: assess by the procedure (Caprini or NICE NG89); hip and knee replacement need extended prophylaxis (aspirin, LMWH or a DOAC for 14–35 days).</p>
      <p className="cx-rs-foot"><ShieldPlus size={13} /> Padua Prediction Score; ACCP and NICE NG89; enoxaparin product label. <TriangleAlert size={13} /> Check platelets and kidney function; timing with spinal or epidural anaesthesia needs 12 hours after a prophylactic dose.</p>
    </section>
  );
}
