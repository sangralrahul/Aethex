/**
 * Peripheral Arterial Disease (ABPI): ankle-brachial pressure index for each leg, and management.
 */
import { useState } from "react";
import { Footprints, TriangleAlert } from "lucide-react";
import { abpi, PAD_CARE } from "@/lib/cadus/clinic45";

export default function PadView() {
  const [v, setV] = useState({ arm: "", right: "", left: "" });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder={ph} data-pad={k} /></label>;
  const arm = Number(v.arm) || 0;
  const legs: [string, ReturnType<typeof abpi>][] = [["Right", abpi(Number(v.right) || 0, arm)], ["Left", abpi(Number(v.left) || 0, arm)]];
  return (
    <section className="cx-page cx-lab cx-pad">
      <header className="cx-page-h"><div><h1>Peripheral Arterial Disease (ABPI)</h1><p>Measure the ankle-brachial pressure index with a Doppler: divide each leg's higher ankle pressure (DP or PT) by the higher arm pressure.</p></div></header>
      <div className="cx-c23-row">{n("arm", "Higher arm systolic", "130")}{n("right", "Right ankle (higher of DP/PT)", "110")}{n("left", "Left ankle (higher of DP/PT)", "120")}</div>
      {legs.map(([side, r]) => r && <div key={side} className={`cx-cmp-out ${r.band === "severe" ? "cx-st-out" : r.band === "pad" || r.band === "noncompressible" ? "cx-ac-high" : "cx-ac-in"}`} data-pad={`out-${side.toLowerCase()}`} data-band={r.band}><p><b>{side} leg:</b> {r.text}</p></div>)}
      <h4>Management</h4><ol className="cx-c23-steps">{PAD_CARE.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Footprints size={13} /> ESC 2024 peripheral arterial and aortic disease guideline, NICE CG147. <TriangleAlert size={13} /> A cold, painful, pulseless leg is acute limb ischaemia (see that tool).</p>
    </section>
  );
}
