/**
 * Varicose Veins: CEAP class, bleeding and ulcers, superficial thrombophlebitis, ablation first, and
 * compression with an ABPI check.
 */
import { useState } from "react";
import { Footprints, TriangleAlert } from "lucide-react";
import { CEAP, varicosePlan, type VaricoseInput } from "@/lib/cadus/clinic49";

export default function VaricoseView() {
  const [x, setX] = useState<VaricoseInput>({ ceap: 2, symptomatic: false, bleeding: false, thrombophlebitis: false, nearJunction: false, abpi: 0, pregnant: false });
  const [abpi, setAbpi] = useState("");
  const r = varicosePlan({ ...x, abpi: Number(abpi) || 0 });
  const cb = (k: "symptomatic" | "bleeding" | "thrombophlebitis" | "nearJunction" | "pregnant", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-var={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-var">
      <header className="cx-page-h"><div><h1>Varicose Veins</h1><p>Most need only reassurance and lifestyle advice. Bleeding, ulcers, skin changes and symptoms need a vascular referral and duplex scan.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>CEAP clinical class</span><select className="cx-select" value={x.ceap} onChange={(e) => setX({ ...x, ceap: Number(e.target.value) })} data-var="ceap">{CEAP.map((c, i) => <option key={c} value={i}>{c}</option>)}</select></label>
        <label className="cx-field"><span>ABPI (if measured)</span><input className="cx-input" inputMode="decimal" value={abpi} onChange={(e) => setAbpi(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="0.95" data-var="abpi" /></label>
      </div>
      <div className="cx-imaging-ticks">{cb("symptomatic", "Aching, heaviness, itching or swelling")}{cb("bleeding", "Bleeding from a vein")}{cb("thrombophlebitis", "Hard, red, tender vein")}{x.thrombophlebitis && cb("nearJunction", "Near the groin or knee crease")}{cb("pregnant", "Pregnant")}</div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-var="out" data-urgency={r.urgency}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Footprints size={13} /> NICE CG168, ESVS 2022 chronic venous disease. <TriangleAlert size={13} /> Check ABPI before any compression.</p>
    </section>
  );
}
