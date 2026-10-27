/**
 * Epistaxis: first aid, cautery and packing, posterior bleeds, anticoagulants, aftercare, and red
 * flags (angiofibroma, HHT).
 */
import { useState } from "react";
import { Droplet, TriangleAlert } from "lucide-react";
import { epistaxisPlan, type EpistaxisInput } from "@/lib/cadus/clinic47";

export default function EpistaxisView() {
  const [x, setX] = useState<EpistaxisInput>({ active: true, minutesPressure: 0, posterior: false, unstable: false, anticoag: false, recurrent: false, adolescentMale: false, telangiectasia: false, child: false });
  const r = epistaxisPlan(x);
  const cb = (k: Exclude<keyof EpistaxisInput, "minutesPressure">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-epx={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-epx">
      <header className="cx-page-h"><div><h1>Epistaxis (Nosebleed)</h1><p>Most are anterior (Little's area) and stop with 10–15 minutes of firm pressure. Escalate step by step.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Minutes of firm pressure so far</span><input className="cx-input" inputMode="numeric" value={x.minutesPressure || ""} onChange={(e) => setX({ ...x, minutesPressure: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="15" data-epx="minutes" /></label></div>
      <div className="cx-imaging-ticks">{cb("active", "Still bleeding")}{cb("child", "Child")}{cb("unstable", "Pale, faint, fast pulse, low BP")}{cb("posterior", "Bleeding into the throat, both sides")}{cb("anticoag", "On anticoagulants or antiplatelets")}{cb("recurrent", "Recurrent nosebleeds")}{cb("adolescentMale", "Teenage boy, one side, nose blocked")}{cb("telangiectasia", "Red spots on lips, tongue, fingers")}</div>
      <div className={`cx-cmp-out ${r.level === "admit" ? "cx-st-out" : r.level === "treat" ? "cx-ac-high" : "cx-ac-in"}`} data-epx="out" data-level={r.level}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Droplet size={13} /> ENT UK epistaxis guideline, AAO-HNS 2020. <TriangleAlert size={13} /> Never cauterise both sides of the septum at the same visit (perforation).</p>
    </section>
  );
}
