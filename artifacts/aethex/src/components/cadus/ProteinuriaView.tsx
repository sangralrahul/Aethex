/**
 * Proteinuria Work-up: ACR bands (mg/g or mg/mmol), transient and orthostatic causes, nephrotic
 * syndrome, ACE inhibitor/ARB and SGLT2 inhibitor, and when to refer.
 */
import { useState } from "react";
import { Droplet, TriangleAlert } from "lucide-react";
import { proteinuriaPlan, type ProtUnit } from "@/lib/cadus/clinic49";

export default function ProteinuriaView() {
  const [unit, setUnit] = useState<ProtUnit>("mg/g");
  const [v, setV] = useState({ acr: "", egfr: "", albumin: "", age: "" });
  const [f, setF] = useState({ diabetes: false, hypertension: false, haematuria: false, oedema: false, transient: false, confirmed: false });
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const r = proteinuriaPlan({ unit, acr: num("acr"), egfr: num("egfr"), albumin: num("albumin"), age: num("age"), ...f });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-prt={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-prt={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-prt">
      <header className="cx-page-h"><div><h1>Proteinuria Work-up</h1><p>Urine albumin:creatinine ratio (ACR) bands, what to repeat, what to start, and when to send to nephrology.</p></div></header>
      <div className="cx-c23-row">
        {n("acr", "Urine ACR", "250")}
        <label className="cx-field"><span>Unit</span><select className="cx-select" value={unit} onChange={(e) => setUnit(e.target.value as ProtUnit)} data-prt="unit"><option value="mg/g">mg/g</option><option value="mg/mmol">mg/mmol</option></select></label>
        {n("egfr", "eGFR", "60")}{n("albumin", "Serum albumin (g/dL)", "3.8")}{n("age", "Age", "50")}
      </div>
      <div className="cx-imaging-ticks">{cb("confirmed", "Raised on repeat samples")}{cb("transient", "Fever, exercise, UTI or periods at the time")}{cb("diabetes", "Diabetes")}{cb("hypertension", "Hypertension")}{cb("haematuria", "Blood in the urine")}{cb("oedema", "Oedema")}</div>
      <div className={`cx-cmp-out ${r.nephrotic ? "cx-st-out" : r.refer ? "cx-ac-high" : "cx-ac-in"}`} data-prt="out" data-refer={String(r.refer)} data-nephrotic={String(r.nephrotic)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Droplet size={13} /> KDIGO CKD 2024, NICE NG203. <TriangleAlert size={13} /> A urine dipstick is a screen only: quantify with ACR.</p>
    </section>
  );
}
