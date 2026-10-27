/**
 * Haematuria Work-up: visible vs non-visible, AUA risk group for microscopic haematuria, and
 * urology vs nephrology.
 */
import { useState } from "react";
import { Droplet, TriangleAlert } from "lucide-react";
import { haematuria, microRisk } from "@/lib/cadus/clinic45";

export default function HaematuriaView() {
  const [visible, setVisible] = useState(false);
  const [sex, setSex] = useState<"m" | "f">("m");
  const [v, setV] = useState({ age: "", py: "", rbc: "" });
  const [f, setF] = useState({ uti: false, nephro: false });
  const risk = !visible && v.age ? microRisk(sex, Number(v.age) || 0, Number(v.py) || 0, Number(v.rbc) || 0) : null;
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder={ph} data-hmt={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-haematuria">
      <header className="cx-page-h"><div><h1>Haematuria Work-up</h1><p>Blood in the urine: confirm it, look for infection, then decide on cystoscopy and imaging by risk, or nephrology if it looks glomerular.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Type</span><select className="cx-select" value={visible ? "v" : "m"} onChange={(e) => setVisible(e.target.value === "v")} data-hmt="type"><option value="m">Non-visible (microscopic)</option><option value="v">Visible</option></select></label>
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={sex} onChange={(e) => setSex(e.target.value as "m" | "f")} data-hmt="sex"><option value="m">Male</option><option value="f">Female</option></select></label>
        {n("age", "Age", "55")}{!visible && n("py", "Pack-years smoked", "0")}{!visible && n("rbc", "Red cells per HPF", "8")}
      </div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={f.uti} onChange={(e) => setF({ ...f, uti: e.target.checked })} data-hmt="uti" /> Urine infection present</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={f.nephro} onChange={(e) => setF({ ...f, nephro: e.target.checked })} data-hmt="nephro" /> Proteinuria, casts, raised creatinine or hypertension</label>
      </div>
      {risk && <div className={`cx-cmp-out ${risk.level === "high" ? "cx-st-out" : risk.level === "intermediate" ? "cx-ac-high" : "cx-ac-in"}`} data-hmt="risk" data-level={risk.level}><p><b>{risk.plan}</b></p></div>}
      <ol className="cx-c23-steps" data-hmt="plan">{haematuria(visible, Number(v.age) || 0, f.uti, f.nephro).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Droplet size={13} /> AUA/SUFU microhematuria guideline 2020, NICE NG12. <TriangleAlert size={13} /> Anticoagulants do not explain haematuria: still investigate.</p>
    </section>
  );
}
