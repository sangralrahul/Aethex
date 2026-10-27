/**
 * High Blood Counts: high haemoglobin, platelets, white cells or eosinophils: reactive or primary,
 * and what to do next.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { highCounts } from "@/lib/cadus/clinic45";

export default function HighCountsView() {
  const [v, setV] = useState({ hb: "", plt: "", wbc: "", eos: "", lymph: "", age: "" });
  const [male, setMale] = useState(true);
  const [blasts, setBlasts] = useState(false);
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const out = highCounts({ hb: num("hb"), male, plt: num("plt"), wbc: num("wbc"), eos: num("eos"), lymph: num("lymph"), age: num("age"), blasts });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-hbc={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-highcounts">
      <header className="cx-page-h"><div><h1>High Blood Counts</h1><p>Raised haemoglobin, platelets, white cells or eosinophils: most are reactive; find the cause, and know when it needs a haematologist today.</p></div></header>
      <div className="cx-c23-row">{n("hb", "Hb (g/dL)", "14")}{n("plt", "Platelets (×10⁹/L)", "300")}{n("wbc", "White cells (×10⁹/L)", "8")}</div>
      <div className="cx-c23-row">{n("eos", "Eosinophils (×10⁹/L)", "0.3")}{n("lymph", "Lymphocytes (×10⁹/L)", "2")}{n("age", "Age", "50")}
        <label className="cx-pa-mine"><input type="checkbox" checked={male} onChange={(e) => setMale(e.target.checked)} data-hbc="male" /> Male</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={blasts} onChange={(e) => setBlasts(e.target.checked)} data-hbc="blasts" /> Blasts on the film</label>
      </div>
      <ol className={`cx-c23-steps ${blasts || num("wbc") >= 50 ? "cx-st-out" : ""}`} data-hbc="out">{out.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Droplets size={13} /> WHO 2016/ICC 2022 myeloid neoplasm criteria, BSH guidance. <TriangleAlert size={13} /> Always look at the blood film before labelling a count as reactive.</p>
    </section>
  );
}
