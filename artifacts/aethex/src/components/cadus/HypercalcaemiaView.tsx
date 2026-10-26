/**
 * Hypercalcaemia: albumin-corrected calcium, severity, treatment (fluids, bisphosphonate,
 * calcitonin, steroids) and the PTH-led work-up.
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { correctedCa, hcSeverity, hcTreat, hcWorkup } from "@/lib/cadus/clinic41";

export default function HypercalcaemiaView() {
  const [v, setV] = useState({ ca: "", alb: "", kg: "", egfr: "" });
  const [pth, setPth] = useState<"high" | "normal" | "low">("low");
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-hc={k} /></label>;
  const ca = Number(v.ca) || 0;
  const c = ca > 0 ? (Number(v.alb) > 0 ? correctedCa(ca, Number(v.alb)) : ca) : null;
  const s = c !== null ? hcSeverity(c) : null;
  return (
    <section className="cx-page cx-lab cx-hypercal">
      <header className="cx-page-h"><div><h1>Hypercalcaemia</h1><p>Correct calcium for albumin, grade it, treat by severity and find the cause starting with PTH.</p></div></header>
      <div className="cx-c23-row">{n("ca", "Calcium (mg/dL)", "12")}{n("alb", "Albumin (g/dL)", "3.5")}{n("kg", "Weight (kg)", "60")}{n("egfr", "eGFR", "60")}</div>
      {s && <div className={`cx-cmp-out ${s.band === "severe" ? "cx-st-out" : s.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-hc="out" data-band={s.band}><h3 className="cx-lab-h3">{s.text}</h3><ol className="cx-c23-steps">{hcTreat(s.band, Number(v.kg) || 0, v.egfr ? Number(v.egfr) : null).map((x) => <li key={x}>{x}</li>)}</ol></div>}
      <h4>Find the cause</h4>
      <div className="cx-c23-row"><label className="cx-field"><span>PTH</span><select className="cx-select" value={pth} onChange={(e) => setPth(e.target.value as typeof pth)} data-hc="pth"><option value="low">Low (suppressed)</option><option value="normal">Normal</option><option value="high">High</option></select></label></div>
      <ul data-hc="workup">{hcWorkup(pth).map((x) => <li key={x}>{x}</li>)}</ul>
      <p className="cx-rs-foot"><FlaskConical size={13} /> Society for Endocrinology emergency guidance, Endocrine Society 2023 (hypercalcaemia of malignancy). <TriangleAlert size={13} /> Confusion, arrhythmia or calcium over 14: treat as an emergency.</p>
    </section>
  );
}
