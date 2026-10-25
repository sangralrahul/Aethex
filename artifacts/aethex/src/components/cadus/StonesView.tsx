/**
 * Kidney Stones & Colic: who needs emergency decompression, analgesia, medical expulsive therapy and
 * intervention by size and site, and prevention.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { STONE_PREVENT, stonePlan, type StoneIn } from "@/lib/cadus/clinic38";

export default function StonesView() {
  const [x, setX] = useState<StoneIn>({ sizeMm: 6, site: "distal", infected: false, aki: false, solitary: false, intractable: false, pregnant: false });
  const [size, setSize] = useState("6");
  const p = stonePlan({ ...x, sizeMm: Number(size) || 0 });
  const box = (k: "infected" | "aki" | "solitary" | "intractable" | "pregnant", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-ks={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-stones">
      <header className="cx-page-h"><div><h1>Kidney Stones &amp; Colic</h1><p>Spot the obstructed infected kidney, treat the pain, and plan by stone size and site: wait, tamsulosin, or intervention. Then prevent the next one.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Stone size (mm)</span><input className="cx-input" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-ks="size" /></label>
        <label className="cx-field"><span>Site</span><select className="cx-select" value={x.site} onChange={(e) => setX({ ...x, site: e.target.value as StoneIn["site"] })} data-ks="site"><option value="distal">Distal ureter</option><option value="proximal">Proximal ureter</option><option value="renal">Kidney</option></select></label>
      </div>
      <div className="cx-c23-row">{box("infected", "Fever or signs of infection")}{box("aki", "Rising creatinine / AKI")}{box("solitary", "Single kidney or both sides blocked")}{box("intractable", "Pain or vomiting not controlled")}{box("pregnant", "Pregnant")}</div>
      <div className={`cx-cmp-out ${p.urgent ? "cx-st-out" : "cx-ac-high"}`} data-ks="out" data-urgent={String(p.urgent)}><h3 className="cx-lab-h3">{p.urgent ? "Emergency: decompress the kidney" : "Plan"}</h3><ol className="cx-c23-steps">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <h4>Prevention</h4><ul>{STONE_PREVENT.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Droplets size={13} /> EAU urolithiasis guideline 2024, NICE NG118. <TriangleAlert size={13} /> An infected obstructed kidney is a urological emergency: antibiotics alone are not enough.</p>
    </section>
  );
}
