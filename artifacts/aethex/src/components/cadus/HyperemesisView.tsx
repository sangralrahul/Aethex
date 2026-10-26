/**
 * Hyperemesis Gravidarum: the PUQE-24 score, antiemetics by line, fluids with thiamine, steroids
 * for refractory cases, and when to admit.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { hgPlan, PUQE, puqe } from "@/lib/cadus/clinic40";

export default function HyperemesisView() {
  const [a, setA] = useState([1, 1, 1]);
  const [ket, setKet] = useState(false);
  const [wl, setWl] = useState("");
  const p = puqe(a[0], a[1], a[2]);
  const h = hgPlan(p.band, ket, Number(wl) || 0);
  return (
    <section className="cx-page cx-lab cx-hyperemesis">
      <header className="cx-page-h"><div><h1>Hyperemesis Gravidarum</h1><p>Score nausea and vomiting with PUQE-24, then treat by severity: antiemetics, fluids with thiamine, and when to admit.</p></div></header>
      <div className="cx-nihss">{PUQE.map((q, i) => <label key={q.label} className="cx-field"><span>{q.label}</span><select className="cx-select" value={a[i]} onChange={(e) => setA(a.map((v, j) => (j === i ? Number(e.target.value) : v)))} data-hg={i}>{q.options.map((o, k) => <option key={o} value={k + 1}>{o}</option>)}</select></label>)}</div>
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={ket} onChange={(e) => setKet(e.target.checked)} data-hg="ket" /> Ketones in urine</label>
        <label className="cx-field"><span>Weight loss (% of pre-pregnancy)</span><input className="cx-input" inputMode="decimal" value={wl} onChange={(e) => setWl(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-hg="wl" /></label>
      </div>
      <div className={`cx-cmp-out ${p.band === "severe" ? "cx-st-out" : p.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-hg="out" data-band={p.band}><h3 className="cx-lab-h3">PUQE {p.score}/15: {p.band}{h.admit ? ": admit" : ""}</h3><ol className="cx-c23-steps">{h.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Baby size={13} /> RCOG Green-top 69 (2024), FOGSI. <TriangleAlert size={13} /> Vomiting starting after 10 weeks, pain or fever: look for another cause (UTI, gastritis, hepatitis, thyroid, molar pregnancy).</p>
    </section>
  );
}
