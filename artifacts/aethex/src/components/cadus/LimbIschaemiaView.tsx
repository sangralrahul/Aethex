/**
 * Acute Limb Ischaemia: Rutherford class from sensory, motor and Doppler findings, heparin, and the
 * steps before and after revascularisation.
 */
import { useState } from "react";
import { Footprints, TriangleAlert } from "lucide-react";
import { ALI_STEPS, aliHeparin, rutherford, type AliInput } from "@/lib/cadus/clinic41";

export default function LimbIschaemiaView() {
  const [x, setX] = useState<AliInput>({ sensory: "none", motor: "none", arterial: true, venous: true });
  const [kg, setKg] = useState("");
  const r = rutherford(x);
  return (
    <section className="cx-page cx-lab cx-limb">
      <header className="cx-page-h"><div><h1>Acute Limb Ischaemia</h1><p>Classify the threatened limb (Rutherford), start heparin and get it to a vascular surgeon in time.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Sensory loss</span><select className="cx-select" value={x.sensory} onChange={(e) => setX({ ...x, sensory: e.target.value as AliInput["sensory"] })} data-li="sensory"><option value="none">None</option><option value="toes">Minimal (toes)</option><option value="more">More than toes, rest pain</option><option value="profound">Profound, anaesthetic</option></select></label>
        <label className="cx-field"><span>Muscle weakness</span><select className="cx-select" value={x.motor} onChange={(e) => setX({ ...x, motor: e.target.value as AliInput["motor"] })} data-li="motor"><option value="none">None</option><option value="mild">Mild or moderate</option><option value="paralysis">Paralysis or rigor</option></select></label>
      </div>
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={x.arterial} onChange={(e) => setX({ ...x, arterial: e.target.checked })} data-li="arterial" /> Arterial Doppler signal heard</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={x.venous} onChange={(e) => setX({ ...x, venous: e.target.checked })} data-li="venous" /> Venous Doppler signal heard</label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, "").slice(0, 3))} data-li="kg" /></label>
      </div>
      <div className={`cx-cmp-out ${r.cls === "I" ? "cx-ac-high" : "cx-st-out"}`} data-li="out" data-cls={r.cls}><h3 className="cx-lab-h3">Rutherford {r.cls}: {r.name}</h3><p><b>{r.action}</b></p></div>
      <p className="cx-set-hint" data-li="heparin"><b>{aliHeparin(Number(kg) || 0)}</b></p>
      <ol className="cx-c23-steps">{ALI_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Footprints size={13} /> ESVS 2020 acute limb ischaemia guideline, Rutherford classification. <TriangleAlert size={13} /> Muscle has about 6 hours: call vascular surgery on suspicion.</p>
    </section>
  );
}
