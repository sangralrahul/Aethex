/**
 * Neck Pain: red flags (trauma, dissection, myelopathy, infection, cancer, GCA), radiculopathy, and
 * the plan for mechanical neck pain.
 */
import { useState } from "react";
import { TriangleAlert, User } from "lucide-react";
import { neckPlan, type NeckInput } from "@/lib/cadus/clinic49";

export default function NeckPainView() {
  const [x, setX] = useState<NeckInput>({ trauma: false, fever: false, cancer: false, myelopathy: false, radicular: false, weakness: false, inflammatory: false, gca: false, suddenNeuro: false, weeks: 0 });
  const r = neckPlan(x);
  const cb = (k: Exclude<keyof NeckInput, "weeks">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-nck={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-nck">
      <header className="cx-page-h"><div><h1>Neck Pain</h1><p>Most neck pain is mechanical and settles in weeks. Screen for the few causes that need imaging or urgent care.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Weeks of pain</span><input className="cx-input" inputMode="numeric" value={x.weeks || ""} onChange={(e) => setX({ ...x, weeks: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="3" data-nck="weeks" /></label></div>
      <div className="cx-imaging-ticks">{cb("trauma", "After an injury or fall")}{cb("suddenNeuro", "Sudden, with headache, vertigo or visual loss")}{cb("myelopathy", "Clumsy hands, unsteady walking, bladder change")}{cb("radicular", "Arm pain, numbness or tingling")}{cb("weakness", "Arm weakness")}{cb("fever", "Fever or IV drug use")}{cb("cancer", "Cancer history, weight loss, night pain")}{cb("gca", "Over 50 with headache or jaw pain")}{cb("inflammatory", "Morning stiffness over 30 minutes")}</div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-nck="out" data-urgency={r.urgency}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><User size={13} /> NICE CKS neck pain, Canadian C-spine rule. <TriangleAlert size={13} /> Neck manipulation is not advised when dissection is possible.</p>
    </section>
  );
}
