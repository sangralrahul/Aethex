/**
 * Tumour Lysis Syndrome: risk by cancer type, Cairo–Bishop laboratory and clinical TLS, and
 * prophylaxis or treatment (fluids, allopurinol, rasburicase).
 */
import { useState } from "react";
import { Biohazard, TriangleAlert } from "lucide-react";
import { cairoBishop, tlsPlan, tlsRisk } from "@/lib/cadus/clinic43";

export default function TlsView() {
  const [cancer, setCancer] = useState<"burkitt" | "all" | "aml" | "dlbcl" | "cll" | "solid" | "myeloma">("all");
  const [v, setV] = useState({ wbc: "", kg: "", urate: "", k: "", phos: "", ca: "" });
  const [f, setF] = useState({ ldh: false, kidney: false, child: false, creat: false, arrhythmia: false, seizure: false });
  const num = (s: string) => Number(s) || 0;
  const risk = tlsRisk(cancer, num(v.wbc), f.ldh, f.kidney);
  const cb = cairoBishop({ urate: num(v.urate), k: num(v.k), phos: num(v.phos), ca: num(v.ca), child: f.child }, f.creat, f.arrhythmia, f.seizure);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-tls={k} /></label>;
  const tick = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-tls={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-tls">
      <header className="cx-page-h"><div><h1>Tumour Lysis Syndrome</h1><p>Assess the risk before chemotherapy, recognise laboratory and clinical TLS, and choose fluids, allopurinol or rasburicase.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Cancer</span><select className="cx-select" value={cancer} onChange={(e) => setCancer(e.target.value as typeof cancer)} data-tls="cancer"><option value="burkitt">Burkitt lymphoma / leukaemia</option><option value="all">Acute lymphoblastic leukaemia</option><option value="aml">Acute myeloid leukaemia</option><option value="dlbcl">Diffuse large B-cell lymphoma</option><option value="cll">CLL</option><option value="myeloma">Myeloma</option><option value="solid">Solid tumour</option></select></label>
        {n("wbc", "White cells (×10³/µL)", "120")}{n("kg", "Weight (kg)", "60")}
      </div>
      <div className="cx-imaging-ticks">{tick("ldh", "LDH over 2 × normal or bulky disease")}{tick("kidney", "Kidney impairment before treatment")}{tick("child", "Child")}</div>
      <div className={`cx-cmp-out ${risk === "high" ? "cx-st-out" : risk === "intermediate" ? "cx-ac-high" : "cx-ac-in"}`} data-tls="risk" data-risk={risk}><h3 className="cx-lab-h3">{risk[0].toUpperCase() + risk.slice(1)} risk of TLS</h3><ol className="cx-c23-steps">{tlsPlan(risk, num(v.kg), f.child).map((s) => <li key={s}>{s}</li>)}</ol></div>
      <h4>Cairo–Bishop: is it TLS?</h4>
      <div className="cx-c23-row">{n("urate", "Uric acid (mg/dL)", "9")}{n("k", "Potassium", "6.2")}{n("phos", "Phosphate (mg/dL)", "5")}{n("ca", "Calcium (mg/dL)", "8.5")}</div>
      <div className="cx-imaging-ticks">{tick("creat", "Creatinine 1.5 × normal or more")}{tick("arrhythmia", "Arrhythmia")}{tick("seizure", "Seizure")}</div>
      <div className={`cx-cmp-out ${cb.clinical ? "cx-st-out" : cb.lab ? "cx-ac-high" : "cx-ac-in"}`} data-tls="cb" data-lab={String(cb.lab)} data-clinical={String(cb.clinical)}><h3 className="cx-lab-h3">{cb.clinical ? "Clinical TLS" : cb.lab ? "Laboratory TLS" : `${cb.labCount} of 4 laboratory criteria (2 needed)`}</h3>{cb.items.length > 0 && <ul>{cb.items.map((s) => <li key={s}>{s}</li>)}</ul>}{cb.lab && <p>Treat as high risk: rasburicase (if G6PD normal), fluids, cardiac monitoring, nephrology early.</p>}</div>
      <p className="cx-rs-foot"><Biohazard size={13} /> Cairo and Bishop 2004, Cairo et al. 2010 risk model, BSH 2015. <TriangleAlert size={13} /> Criteria apply from 3 days before to 7 days after starting treatment (or a 25% change from baseline).</p>
    </section>
  );
}
