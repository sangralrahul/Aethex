/**
 * Pancytopenia: emergencies (neutropenic fever, bleeding, blasts), the commonest Indian cause
 * (megaloblastic anaemia), drugs, hypersplenism, and when to do a bone marrow.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { pancytoPlan } from "@/lib/cadus/clinic49";

export default function PancytopeniaView() {
  const [v, setV] = useState({ hb: "", wbc: "", anc: "", plt: "", mcv: "", age: "" });
  const [f, setF] = useState({ fever: false, bleeding: false, blasts: false, spleen: false, drugs: false, alcohol: false, vegetarian: false });
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const r = pancytoPlan({ hb: num("hb"), wbc: num("wbc"), anc: num("anc"), plt: num("plt"), mcv: num("mcv"), age: num("age"), ...f });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-pcy={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-pcy={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-pcy">
      <header className="cx-page-h"><div><h1>Pancytopenia</h1><p>Low Hb, white cells and platelets together. Act first on fever with neutropenia, bleeding or blasts; then find the cause.</p></div></header>
      <div className="cx-c23-row">{n("hb", "Hb (g/dL)", "7")}{n("wbc", "WBC (×10⁹/L)", "2.5")}{n("anc", "Neutrophils (×10⁹/L)", "1.0")}{n("plt", "Platelets (×10⁹/L)", "60")}{n("mcv", "MCV (fL)", "110")}{n("age", "Age", "40")}</div>
      <div className="cx-imaging-ticks">{cb("fever", "Fever")}{cb("bleeding", "Bleeding")}{cb("blasts", "Blasts on the film")}{cb("spleen", "Big spleen")}{cb("vegetarian", "Vegetarian diet")}{cb("drugs", "Methotrexate, azathioprine, linezolid…")}{cb("alcohol", "Alcohol")}</div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-pcy="out" data-urgency={r.urgency} data-pancytopenia={String(r.pancytopenia)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Droplets size={13} /> BSH aplastic anaemia guideline, BNF. <TriangleAlert size={13} /> Never give folate alone before checking B12 (it can precipitate subacute combined degeneration).</p>
    </section>
  );
}
