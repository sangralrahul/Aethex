/**
 * Acute Asthma in Children: the PRAM severity score and a plan by severity and weight (salbutamol,
 * ipratropium, steroids, magnesium), with admission and discharge criteria.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { PAED_ASTHMA_HOME, paedAsthmaPlan, pram, PRAM_ITEMS } from "@/lib/cadus/clinic40";

export default function PaedAsthmaView() {
  const [sc, setSc] = useState<number[]>(PRAM_ITEMS.map(() => 0));
  const [kg, setKg] = useState("");
  const p = pram(sc);
  return (
    <section className="cx-page cx-lab cx-paedasthma">
      <header className="cx-page-h"><div><h1>Acute Asthma in Children</h1><p>Score severity with PRAM, then treat by severity and weight; reassess and decide on admission or home.</p></div></header>
      <div className="cx-nihss">{PRAM_ITEMS.map((it, i) => <label key={it.label} className="cx-field"><span>{it.label}</span><select className="cx-select" value={sc[i]} onChange={(e) => setSc(sc.map((v, j) => (j === i ? Number(e.target.value) : v)))} data-pr={i}>{it.options.map(([v, l]) => <option key={l} value={v}>{l} ({v})</option>)}</select></label>)}
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="15" data-pr="kg" /></label>
      </div>
      <div className={`cx-cmp-out ${p.band === "severe" ? "cx-st-out" : p.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-pr="out" data-band={p.band}>
        <h3 className="cx-lab-h3">PRAM {p.total}/12: {p.band}</h3>
        <ol className="cx-c23-steps">{paedAsthmaPlan(p.band, Number(kg) || 0).map((s) => <li key={s}>{s}</li>)}</ol>
      </div>
      <h4>Going home</h4><ul>{PAED_ASTHMA_HOME.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Baby size={13} /> PRAM (Ducharme 2008), Canadian Paediatric Society, BTS/SIGN, GINA 2024. <TriangleAlert size={13} /> Adult attacks: see Asthma & COPD Attack.</p>
    </section>
  );
}
