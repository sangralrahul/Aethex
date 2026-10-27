/**
 * Abnormal LFTs: hepatocellular vs cholestatic pattern (R factor), next tests, and FIB-4 for fatty
 * liver.
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { fib4, lftNext, rFactor } from "@/lib/cadus/clinic45";

export default function LftView() {
  const [v, setV] = useState({ alt: "", altUln: "40", alp: "", alpUln: "120", ast: "", age: "", plt: "" });
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const r = rFactor(num("alt"), num("altUln"), num("alp"), num("alpUln"));
  const f = fib4(num("age"), num("ast"), num("alt"), num("plt"));
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-lft={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-lft">
      <header className="cx-page-h"><div><h1>Abnormal LFTs</h1><p>Work out the pattern with the R factor, order the right next tests, and use FIB-4 to stage fatty liver disease.</p></div></header>
      <div className="cx-c23-row">{n("alt", "ALT (U/L)", "120")}{n("altUln", "ALT upper limit", "40")}{n("alp", "ALP (U/L)", "150")}{n("alpUln", "ALP upper limit", "120")}</div>
      {r && <div className="cx-cmp-out cx-ac-high" data-lft="pattern" data-pattern={r.pattern}><h3 className="cx-lab-h3">R factor {r.r}: {r.pattern} pattern</h3><ul>{lftNext(r.pattern, num("alt") > 1000, num("age") > 0 && num("age") < 40).map((s) => <li key={s}>{s}</li>)}</ul></div>}
      <h4>Fatty liver: FIB-4</h4>
      <div className="cx-c23-row">{n("age", "Age", "50")}{n("ast", "AST (U/L)", "40")}{n("plt", "Platelets (×10⁹/L)", "200")}</div>
      {f && <div className={`cx-cmp-out ${f.band === "high" ? "cx-st-out" : f.band === "indeterminate" ? "cx-ac-high" : "cx-ac-in"}`} data-lft="fib4" data-band={f.band}><p><b>{f.text}</b></p></div>}
      <p className="cx-set-hint">Isolated raised bilirubin (unconjugated) with otherwise normal tests: usually Gilbert's syndrome; check for haemolysis.</p>
      <p className="cx-rs-foot"><FlaskConical size={13} /> BSG abnormal liver blood tests guideline 2018, ACG 2017, AASLD MASLD guidance 2023. <TriangleAlert size={13} /> Raised INR, jaundice with confusion, or ALT over 1,000: same-day assessment.</p>
    </section>
  );
}
