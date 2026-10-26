/**
 * Nephrotic Syndrome in Children: prednisolone doses by body surface area for the first episode and
 * relapses, the steroid-response category, and supportive care.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { NS_CARE, nsClassify, nsDoses, nsPlan } from "@/lib/cadus/clinic42";

export default function NephroticView() {
  const [v, setV] = useState({ ht: "", kg: "", r6: "0", r12: "0" });
  const [phase, setPhase] = useState<"first" | "relapse">("first");
  const [f, setF] = useState({ noRemission4w: false, relapseOnSteroids: false });
  const d = nsDoses(Number(v.ht) || 0, Number(v.kg) || 0);
  const c = nsClassify({ ...f, relapses6m: Number(v.r6) || 0, relapses12m: Number(v.r12) || 0 });
  const n = (k: keyof typeof v, l: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} data-nk={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-nephrotic">
      <header className="cx-page-h"><div><h1>Nephrotic Syndrome in Children</h1><p>Prednisolone for the first episode and relapses, how the child responds to steroids, and care for oedema and infection.</p></div></header>
      <div className="cx-c23-row">{n("ht", "Height (cm)")}{n("kg", "Weight (kg)")}<label className="cx-field"><span>Episode</span><select className="cx-select" value={phase} onChange={(e) => setPhase(e.target.value as typeof phase)} data-nk="phase"><option value="first">First episode</option><option value="relapse">Relapse</option></select></label></div>
      {d && <p className="cx-set-hint" data-nk="bsa">Body surface area {d.bsa} m².</p>}
      <ol className="cx-c23-steps" data-nk="plan">{nsPlan(phase, d).map((s) => <li key={s}>{s}</li>)}</ol>
      <h4>Steroid response</h4>
      <div className="cx-c23-row">{n("r6", "Relapses in 6 months after first response")}{n("r12", "Relapses in 12 months")}</div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={f.noRemission4w} onChange={(e) => setF({ ...f, noRemission4w: e.target.checked })} data-nk="resist" /> No remission after 4 weeks of daily prednisolone</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={f.relapseOnSteroids} onChange={(e) => setF({ ...f, relapseOnSteroids: e.target.checked })} data-nk="dep" /> Two relapses in a row on steroids or within 14 days of stopping</label>
      </div>
      <div className={`cx-cmp-out ${c.label === "Steroid-sensitive" ? "cx-ac-in" : "cx-ac-high"}`} data-nk="class"><h3 className="cx-lab-h3">{c.label}</h3><p>{c.text}</p></div>
      <h4>Supportive care</h4><ul>{NS_CARE.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Droplets size={13} /> Indian Society of Pediatric Nephrology 2021, IPNA 2023 (steroid-sensitive) and 2020 (steroid-resistant). <TriangleAlert size={13} /> A child with nephrotic syndrome and abdominal pain: think peritonitis or hypovolaemia.</p>
    </section>
  );
}
