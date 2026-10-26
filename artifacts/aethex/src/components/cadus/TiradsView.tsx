/**
 * Thyroid Nodule (ACR TI-RADS): points by ultrasound features, the TR level, and FNA or follow-up
 * by size.
 */
import { useState } from "react";
import { ScanLine, TriangleAlert } from "lucide-react";
import { tirads, TIRADS } from "@/lib/cadus/clinic42";

export default function TiradsView() {
  const [sel, setSel] = useState({ composition: 3, echo: 1, shape: 0, margin: 0 });
  const [foci, setFoci] = useState<number[]>([]);
  const [size, setSize] = useState("");
  const pts = (k: keyof typeof sel) => TIRADS[k][sel[k]][0];
  const r = tirads(pts("composition"), pts("echo"), pts("shape"), pts("margin"), foci.map((i) => TIRADS.foci[i][0]), Number(size) || 0);
  const select = (k: keyof typeof sel, l: string) => <label className="cx-field"><span>{l}</span><select className="cx-select" value={sel[k]} onChange={(e) => setSel({ ...sel, [k]: Number(e.target.value) })} data-ti={k}>{TIRADS[k].map(([p, t], i) => <option key={t} value={i}>{t} ({p})</option>)}</select></label>;
  return (
    <section className="cx-page cx-lab cx-tirads">
      <header className="cx-page-h"><div><h1>Thyroid Nodule (TI-RADS)</h1><p>Score a thyroid nodule from its ultrasound features (ACR TI-RADS) and see whether it needs FNA or follow-up.</p></div></header>
      <div className="cx-nihss">{select("composition", "Composition")}{select("echo", "Echogenicity")}{select("shape", "Shape")}{select("margin", "Margin")}</div>
      <h4>Echogenic foci (all that apply)</h4>
      <div className="cx-imaging-ticks">{TIRADS.foci.map(([p, t], i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={foci.includes(i)} onChange={() => setFoci(foci.includes(i) ? foci.filter((x) => x !== i) : [...foci, i])} data-ti-f={i} /> {t} ({p})</label>)}</div>
      <div className="cx-c23-row"><label className="cx-field"><span>Largest diameter (cm)</span><input className="cx-input" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-ti="size" /></label></div>
      <div className={`cx-cmp-out ${r.tr >= 5 ? "cx-st-out" : r.tr >= 3 ? "cx-ac-high" : "cx-ac-in"}`} data-ti="out" data-tr={r.tr}><h3 className="cx-lab-h3">{r.points} points: {r.label}</h3><p><b>{r.action}</b></p></div>
      <p className="cx-set-hint">Also check TSH first: a low TSH needs a thyroid scan (a hot nodule rarely needs FNA). Suspicious nodes or extra-thyroidal extension: FNA regardless of size.</p>
      <p className="cx-rs-foot"><ScanLine size={13} /> ACR TI-RADS (Tessler 2017). <TriangleAlert size={13} /> Spongiform nodules are benign; up to 2 nodules with the highest scores are sampled.</p>
    </section>
  );
}
