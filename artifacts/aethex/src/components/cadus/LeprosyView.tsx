/**
 * Leprosy (MDT): PB or MB classification, WHO 3-drug MDT by age and weight, reactions, and
 * single-dose rifampicin for contacts.
 */
import { useState } from "react";
import { Fingerprint, TriangleAlert } from "lucide-react";
import { LEPROSY_REACTIONS, leprosyClass, mdt, sdrPep } from "@/lib/cadus/clinic43";

export default function LeprosyView() {
  const [v, setV] = useState({ lesions: "", nerves: "", age: "", kg: "", cage: "", ckg: "" });
  const [smear, setSmear] = useState(false);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder={ph} data-lpr={k} /></label>;
  const c = leprosyClass(Number(v.lesions) || 0, Number(v.nerves) || 0, smear);
  return (
    <section className="cx-page cx-lab cx-leprosy">
      <header className="cx-page-h"><div><h1>Leprosy (MDT)</h1><p>Classify as paucibacillary or multibacillary, give WHO multidrug therapy by age and weight, manage reactions early, and protect contacts.</p></div></header>
      <div className="cx-c23-row">{n("lesions", "Skin lesions (number)", "3")}{n("nerves", "Nerves thickened or affected", "0")}<label className="cx-pa-mine"><input type="checkbox" checked={smear} onChange={(e) => setSmear(e.target.checked)} data-lpr="smear" /> Slit-skin smear positive</label></div>
      <div className="cx-c23-row">{n("age", "Age (years)", "30")}{n("kg", "Weight (kg)", "50")}</div>
      <div className={`cx-cmp-out ${c.type === "MB" ? "cx-ac-high" : "cx-ac-in"}`} data-lpr="out" data-type={c.type}><h3 className="cx-lab-h3">{c.type === "MB" ? "Multibacillary" : "Paucibacillary"}: {c.why}</h3><ul>{mdt(c.type, Number(v.age) || 30, Number(v.kg) || 0).map((s) => <li key={s}>{s}</li>)}</ul></div>
      <h4>Reactions and nerve damage</h4><ol className="cx-c23-steps">{LEPROSY_REACTIONS.map((s) => <li key={s}>{s}</li>)}</ol>
      <h4>Contacts: single-dose rifampicin (SDR-PEP)</h4>
      <div className="cx-c23-row">{n("cage", "Contact's age", "8")}{n("ckg", "Contact's weight (kg)", "25")}</div>
      <p className="cx-set-hint" data-lpr="pep"><b>{sdrPep(Number(v.cage) || 0, Number(v.ckg) || 0)}</b></p>
      <p className="cx-rs-foot"><Fingerprint size={13} /> WHO guidelines for leprosy 2018, NLEP India. <TriangleAlert size={13} /> Any patch with loss of sensation is leprosy until proved otherwise; examine nerves and eyes.</p>
    </section>
  );
}
