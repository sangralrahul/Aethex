/**
 * Restless Legs Syndrome: IRLSSG criteria, iron (ferritin target over 75), triggers, and AASM 2024
 * first-line treatment (alpha-2-delta ligands, not dopamine agonists).
 */
import { useState } from "react";
import { Footprints, TriangleAlert } from "lucide-react";
import { RLS_CRITERIA, rlsPlan } from "@/lib/cadus/clinic46";

export default function RestlessLegsView() {
  const [c, setC] = useState(RLS_CRITERIA.map(() => false));
  const [v, setV] = useState({ ferritin: "", tsat: "" });
  const [f, setF] = useState({ pregnant: false, ckd: false, daily: false, elderly: false });
  const r = rlsPlan({ criteria: c, ferritin: Number(v.ferritin) || 0, tsat: Number(v.tsat) || 0, ...f });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder={ph} data-rls={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-rls={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-rls">
      <header className="cx-page-h"><div><h1>Restless Legs Syndrome</h1><p>Confirm all five criteria, correct iron, remove triggers, then treat daily symptoms with gabapentin or pregabalin.</p></div></header>
      <div className="cx-imaging-ticks">{RLS_CRITERIA.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={c[i]} onChange={(e) => setC(c.map((y, j) => (j === i ? e.target.checked : y)))} data-rls-c={i} /> {t}</label>)}</div>
      <p className="cx-set-hint" data-rls="dx" data-meets={String(r.meets)}><b>{r.meets ? "Meets the IRLSSG criteria for restless legs syndrome." : `${c.filter(Boolean).length} of 5 criteria.`}</b></p>
      <div className="cx-c23-row">{n("ferritin", "Ferritin (µg/L)", "40")}{n("tsat", "Transferrin saturation (%)", "18")}</div>
      <div className="cx-imaging-ticks">{cb("daily", "Symptoms most days")}{cb("elderly", "Older adult")}{cb("ckd", "Kidney disease or dialysis")}{cb("pregnant", "Pregnant")}</div>
      <ol className="cx-c23-steps" data-rls="plan">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Footprints size={13} /> AASM clinical practice guideline 2024, IRLSSG 2014 criteria. <TriangleAlert size={13} /> Already on a dopamine agonist with worsening symptoms: suspect augmentation, do not just raise the dose.</p>
    </section>
  );
}
