/**
 * VTE Risk in Pregnancy (RCOG Green-top 37a): antenatal and postnatal scores, when to start LMWH and
 * for how long, and enoxaparin dose by booking weight.
 */
import { useState } from "react";
import { Syringe, TriangleAlert } from "lucide-react";
import { enoxaparinProphylaxis, PV_ITEMS, pregVte } from "@/lib/cadus/clinic42";

export default function PregVteView() {
  const [t, setT] = useState<boolean[]>(PV_ITEMS.map(() => false));
  const [prev, setPrev] = useState(false);
  const [kg, setKg] = useState("");
  const r = pregVte(t, prev);
  const enox = enoxaparinProphylaxis(Number(kg) || 0);
  return (
    <section className="cx-page cx-lab cx-pregvte">
      <header className="cx-page-h"><div><h1>VTE Risk in Pregnancy</h1><p>Score antenatal and postnatal risk factors (RCOG) to decide who needs LMWH, from when, and for how long.</p></div></header>
      <div className="cx-imaging-ticks"><label className="cx-pa-mine"><input type="checkbox" checked={prev} onChange={(e) => setPrev(e.target.checked)} data-pv="prev" /> <b>Previous VTE (not after major surgery)</b></label></div>
      <div className="cx-imaging-ticks">{PV_ITEMS.map((it, i) => <label key={it.label} className="cx-pa-mine"><input type="checkbox" checked={t[i]} onChange={(e) => setT(t.map((x, j) => (j === i ? e.target.checked : (i === 6 || i === 7) && (j === 6 || j === 7) && e.target.checked ? false : x)))} data-pv={i} /> {it.label} ({it.pts}){it.when === "post" ? " · postnatal" : it.when === "ante" ? " · antenatal" : ""}</label>)}</div>
      <div className={`cx-cmp-out ${prev || r.ante >= 3 ? "cx-st-out" : "cx-ac-in"}`} data-pv="ante" data-score={r.ante}><p><b>{r.anteText}</b></p></div>
      <div className={`cx-cmp-out ${prev || r.post >= 2 ? "cx-ac-high" : "cx-ac-in"}`} data-pv="post" data-score={r.post}><p><b>{r.postText}</b></p></div>
      <div className="cx-c23-row"><label className="cx-field"><span>Booking weight (kg)</span><input className="cx-input" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, "").slice(0, 3))} data-pv="kg" /></label></div>
      {enox && <p className="cx-set-hint" data-pv="enox"><b>{enox}</b> Stop at the onset of labour; no neuraxial block within 12 hours of a prophylactic dose.</p>}
      <p className="cx-rs-foot"><Syringe size={13} /> RCOG Green-top Guideline 37a (2015). <TriangleAlert size={13} /> Reassess at booking, on any admission, and after delivery.</p>
    </section>
  );
}
