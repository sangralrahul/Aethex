/**
 * Spirometry Interpreter: FEV1/FVC ratio, obstruction, restriction or mixed pattern, GOLD grade and
 * bronchodilator reversibility.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import { spirometry } from "@/lib/cadus/clinic36";

export default function SpirometryView() {
  const [v, setV] = useState({ fev1: "", fvc: "", fev1Pct: "", fvcPct: "", post: "" });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-sp={k} /></label>;
  const ready = v.fev1 && v.fvc && v.fev1Pct && v.fvcPct;
  const r = ready ? spirometry({ fev1: Number(v.fev1), fvc: Number(v.fvc), fev1Pct: Number(v.fev1Pct), fvcPct: Number(v.fvcPct), postFev1: v.post ? Number(v.post) : null }) : null;

  return (
    <section className="cx-page cx-lab cx-spiro">
      <header className="cx-page-h"><div><h1>Spirometry Interpreter</h1><p>Enter the values from the report: the FEV1/FVC ratio, the pattern, the GOLD grade and whether it reverses with a bronchodilator.</p></div></header>
      <div className="cx-c23-row">{n("fev1", "FEV1 (L, before bronchodilator)", "1.5")}{n("fvc", "FVC (L)", "3.0")}{n("fev1Pct", "FEV1 % predicted", "55")}{n("fvcPct", "FVC % predicted", "85")}{n("post", "FEV1 after bronchodilator (L, optional)", "1.8")}</div>
      {r && (
        <div className={`cx-cmp-out ${r.pattern === "Normal" ? "cx-ac-in" : "cx-ac-high"}`} data-sp="out" data-pattern={r.pattern}>
          <h3 className="cx-lab-h3">{r.pattern}{r.severity ? `: ${r.severity}` : ""}</h3>
          <p>FEV1/FVC {r.ratio}{r.ratio < 0.7 ? " (under 0.70)" : ""}.</p>
          {r.reversible && <p data-sp="rev"><b>{r.reversible}</b></p>}
          <ul>{r.notes.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
      <p className="cx-set-hint">Check quality first: at least 3 acceptable blows, FEV1 and FVC repeatable within 150 ml, exhalation 6 seconds or more. Withhold short-acting bronchodilators for 4–6 hours before the test.</p>
      <p className="cx-rs-foot"><Wind size={13} /> ATS/ERS 2019 and 2022 interpretation, GOLD 2025. <TriangleAlert size={13} /> Interpret with symptoms and imaging; a normal test does not exclude asthma.</p>
    </section>
  );
}
