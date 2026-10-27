/**
 * Vitiligo: extent and activity, topical treatment, phototherapy, oral mini-pulse for active
 * disease, surgery for stable patches, and myths.
 */
import { useState } from "react";
import { Palette, TriangleAlert } from "lucide-react";
import { vitiligoPlan, type VitiligoInput } from "@/lib/cadus/clinic45";

export default function VitiligoView() {
  const [x, setX] = useState<VitiligoInput>({ bsa: 0, face: false, active: false, segmental: false, stableMonths: 0, child: false });
  const cb = (k: "face" | "active" | "segmental" | "child", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-vit={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-vitiligo">
      <header className="cx-page-h"><div><h1>Vitiligo</h1><p>Stop spread in active disease, repigment with topicals and phototherapy, consider surgery for stable patches, and support the person.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Body surface area (%)</span><input className="cx-input" inputMode="numeric" value={x.bsa || ""} onChange={(e) => setX({ ...x, bsa: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="5" data-vit="bsa" /></label>
        <label className="cx-field"><span>Months without new patches</span><input className="cx-input" inputMode="numeric" value={x.stableMonths || ""} onChange={(e) => setX({ ...x, stableMonths: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} data-vit="stable" /></label>
      </div>
      <div className="cx-imaging-ticks">{cb("face", "Face, neck or folds")}{cb("active", "Active (new or enlarging patches)")}{cb("segmental", "Segmental (one side)")}{cb("child", "Child")}</div>
      <ol className="cx-c23-steps" data-vit="plan">{vitiligoPlan(x).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Palette size={13} /> International vitiligo consensus (VETF), IADVL, BAD 2021. <TriangleAlert size={13} /> Long-term potent steroids on the face cause thinning: prefer tacrolimus there.</p>
    </section>
  );
}
