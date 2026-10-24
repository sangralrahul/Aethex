/**
 * Gestational Diabetes: diagnosis by DIPSI or IADPSG, targets and when to start metformin or insulin
 * (with starting doses), and delivery and postpartum care.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { GDM_DELIVERY, gdmDiagnose, gdmPlan, type GdmCriteria } from "@/lib/cadus/clinic30";

export default function GdmView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [crit, setCrit] = useState<GdmCriteria>("dipsi");
  const [o, setO] = useState({ fasting: "", h1: "", h2: "" });
  const [p, setP] = useState({ fasting: "", pp: "", weeks: "2", kg: "", met: false, ins: false });
  const n = (s: string) => s.replace(/\D/g, "").slice(0, 3);
  const dx = gdmDiagnose(crit, { fasting: Number(o.fasting) || undefined, h1: Number(o.h1) || undefined, h2: Number(o.h2) || undefined });
  const plan = p.fasting || p.pp ? gdmPlan({ fastingAvg: Number(p.fasting) || undefined, ppAvg: Number(p.pp) || undefined, weeksOnDiet: Number(p.weeks) || 0, kg: Number(p.kg) || 60, onMetformin: p.met, onInsulin: p.ins }) : null;
  const md = () => ["# Gestational diabetes plan", "", dx ? `- ${dx.text}` : "", "- Targets: fasting 95 mg/dL or less; 2 hours after meals 120 mg/dL or less", ...(plan?.steps ?? []).map((s) => `- ${s}`), "", "## Delivery and after", ...GDM_DELIVERY.map((d) => `- ${d}`)].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-gdm">
      <header className="cx-page-h"><div><h1>Gestational Diabetes</h1><p>Diagnosis by the Indian (DIPSI) or IADPSG test, glucose targets, when to start metformin or insulin and at what dose, and delivery and postpartum testing.</p></div></header>
      <h4>Diagnosis</h4>
      <div className="cx-seg" role="radiogroup" aria-label="Criteria">{([["dipsi", "DIPSI (India): 75 g, 2-hour, fasting or not"], ["iadpsg", "IADPSG: fasting 75 g OGTT"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={crit === v} className={crit === v ? "on" : ""} onClick={() => setCrit(v)} data-gdm-c={v}>{l}</button>)}</div>
      <div className="cx-c23-row">
        {crit === "iadpsg" && <label className="cx-field"><span>Fasting (mg/dL)</span><input className="cx-input" inputMode="numeric" value={o.fasting} onChange={(e) => setO({ ...o, fasting: n(e.target.value) })} data-gdm="f" /></label>}
        {crit === "iadpsg" && <label className="cx-field"><span>1 hour</span><input className="cx-input" inputMode="numeric" value={o.h1} onChange={(e) => setO({ ...o, h1: n(e.target.value) })} data-gdm="h1" /></label>}
        <label className="cx-field"><span>2 hours (mg/dL)</span><input className="cx-input" inputMode="numeric" value={o.h2} onChange={(e) => setO({ ...o, h2: n(e.target.value) })} data-gdm="h2" /></label>
      </div>
      {dx && <div className={`cx-cmp-out ${dx.gdm ? "cx-ac-high" : "cx-ac-in"}`} data-gdm="dx" data-gdm-pos={String(dx.gdm)}><p><b>{dx.text}</b></p></div>}
      <p className="cx-set-hint">India (MoHFW 2018): test at the first antenatal visit and again at 24–28 weeks if negative; 75 g glucose in 300 ml water, plasma glucose at 2 hours.</p>
      <h4>Treatment</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Average fasting (mg/dL)</span><input className="cx-input" inputMode="numeric" value={p.fasting} onChange={(e) => setP({ ...p, fasting: n(e.target.value) })} data-gdm="pf" /></label>
        <label className="cx-field"><span>Average 2 h after meals</span><input className="cx-input" inputMode="numeric" value={p.pp} onChange={(e) => setP({ ...p, pp: n(e.target.value) })} data-gdm="pp" /></label>
        <label className="cx-field"><span>Weeks on diet</span><input className="cx-input" inputMode="numeric" value={p.weeks} onChange={(e) => setP({ ...p, weeks: e.target.value.replace(/\D/g, "").slice(0, 2) })} data-gdm="weeks" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={p.kg} onChange={(e) => setP({ ...p, kg: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} data-gdm="kg" /></label>
      </div>
      <div className="cx-c23-row"><label className="cx-pa-mine"><input type="checkbox" checked={p.met} onChange={(e) => setP({ ...p, met: e.target.checked })} /> On metformin</label><label className="cx-pa-mine"><input type="checkbox" checked={p.ins} onChange={(e) => setP({ ...p, ins: e.target.checked })} /> On insulin</label></div>
      {plan && <div className={`cx-cmp-out ${plan.onTarget ? "cx-ac-in" : "cx-ac-high"}`} data-gdm="plan"><ul>{plan.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>}
      <h4>Delivery and after</h4><ul>{GDM_DELIVERY.map((d) => <li key={d}>{d}</li>)}</ul>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Gestational diabetes plan", md())}><Printer size={14} /> Print plan</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> MoHFW 2018 national GDM guidelines (DIPSI), IADPSG and ACOG delivery timing. Glucose values are plasma, venous where possible.</p>
    </section>
  );
}
