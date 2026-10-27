/**
 * Vaginal Discharge & STI: likely cause from clinical features and pH, treatment, and the NACO
 * colour-coded syndromic kits.
 */
import { useState } from "react";
import { Microscope, TriangleAlert } from "lucide-react";
import { dischargeDx, NACO_KITS, type DischargeInput } from "@/lib/cadus/clinic45";

export default function VagDischargeView() {
  const [x, setX] = useState<DischargeInput>({ itch: false, curdy: false, fishy: false, frothy: false, ph: 0, cervicitis: false, pain: false, pregnant: false });
  const r = dischargeDx(x);
  const cb = (k: Exclude<keyof DischargeInput, "ph">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-vd={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-vd">
      <header className="cx-page-h"><div><h1>Vaginal Discharge &amp; STI</h1><p>Work out the likely cause from the discharge and pH, treat it (and partners when needed), or use the NACO syndromic kits.</p></div></header>
      <div className="cx-imaging-ticks">{cb("itch", "Itching or soreness")}{cb("curdy", "Thick white curdy discharge")}{cb("fishy", "Thin grey, fishy smell")}{cb("frothy", "Frothy green-yellow")}{cb("cervicitis", "Mucopus or bleeding cervix")}{cb("pain", "Lower abdominal pain or cervical motion tenderness")}{cb("pregnant", "Pregnant")}</div>
      <div className="cx-c23-row"><label className="cx-field"><span>Vaginal pH (if measured)</span><input className="cx-input" inputMode="decimal" value={x.ph || ""} onChange={(e) => setX({ ...x, ph: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 3)) || 0 })} placeholder="4.5" data-vd="ph" /></label></div>
      <div className="cx-cmp-out cx-ac-high" data-vd="out"><h3 className="cx-lab-h3">{r.likely.length ? `Likely: ${r.likely.join(", ")}` : "Syndromic management"}</h3><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <h4>NACO colour-coded STI/RTI kits</h4>
      <table className="cx-c23-table" data-vd="kits"><thead><tr><th>Kit</th><th>Syndrome</th><th>Contents</th></tr></thead><tbody>{NACO_KITS.map((k) => <tr key={k.kit}><td><span className={`cx-kit k${k.kit}`} />{k.kit} {k.colour}</td><td>{k.syndrome}</td><td>{k.drugs}</td></tr>)}</tbody></table>
      <p className="cx-rs-foot"><Microscope size={13} /> NACO STI/RTI technical guidelines, CDC STI 2021, WHO. <TriangleAlert size={13} /> Check the current national kit contents and local resistance patterns.</p>
    </section>
  );
}
