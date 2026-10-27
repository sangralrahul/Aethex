/**
 * Limping Child: Kocher criteria for septic arthritis, and the causes by age (toddler's fracture, DDH,
 * transient synovitis, Perthes, SUFE), with red flags for leukaemia and non-accidental injury.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { kocher, limpPlan, type LimpInput } from "@/lib/cadus/clinic47";

export default function LimpView() {
  const [x, setX] = useState<LimpInput>({ ageYears: 0, fever: false, nwb: false, esr: 0, wbc: 0, crp: 0, nightPain: false, obese: false, bruising: false, weeks: 0 });
  const r = limpPlan(x);
  const k = kocher(x.nwb, x.fever, x.esr, x.wbc);
  const n = (key: "ageYears" | "esr" | "wbc" | "crp" | "weeks", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={x[key] || ""} onChange={(e) => setX({ ...x, [key]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 5)) || 0 })} placeholder={ph} data-lmp={key} /></label>;
  const cb = (key: "fever" | "nwb" | "nightPain" | "obese" | "bruising", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[key]} onChange={(e) => setX({ ...x, [key]: e.target.checked })} data-lmp={key} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-lmp">
      <header className="cx-page-h"><div><h1>Limping Child</h1><p>Rule out septic arthritis first (Kocher criteria), then think by age. Hip problems often present as knee pain.</p></div></header>
      <div className="cx-c23-row">{n("ageYears", "Age (years)", "5")}{n("weeks", "Weeks of limp", "1")}</div>
      <div className="cx-imaging-ticks">{cb("nwb", "Will not bear weight")}{cb("fever", "Temperature over 38.5 °C")}{cb("nightPain", "Night pain or bone pain")}{cb("bruising", "Unexplained bruising, pallor")}{cb("obese", "Overweight")}</div>
      <div className="cx-c23-row">{n("esr", "ESR (mm/h)", "45")}{n("wbc", "WBC (×10⁹/L)", "13")}{n("crp", "CRP (mg/L)", "25")}</div>
      <p className="cx-set-hint" data-lmp="kocher" data-count={k.count}><b>Kocher {k.count}/4: septic arthritis {k.pct}</b></p>
      <div className={`cx-cmp-out ${r.urgent ? "cx-st-out" : "cx-ac-in"}`} data-lmp="out" data-urgent={String(r.urgent)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Baby size={13} /> Kocher 1999, Caird 2006, RCEM/BSCOS guidance. <TriangleAlert size={13} /> Never send home a febrile child who will not bear weight without a hip assessment.</p>
    </section>
  );
}
