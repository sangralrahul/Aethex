/**
 * Recurrent Abdominal Pain in Children: alarm features, a short list of tests, Rome IV functional
 * pain, constipation, and how to explain it to families.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { RAP_FLAGS, rapPlan } from "@/lib/cadus/clinic47";

export default function RecurrentAbdoPainView() {
  const [flags, setFlags] = useState(RAP_FLAGS.map(() => false));
  const [v, setV] = useState({ months: "", perMonth: "" });
  const [con, setCon] = useState(false);
  const r = rapPlan(flags, Number(v.months) || 0, Number(v.perMonth) || 0, con);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder={ph} data-rap={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-rap">
      <header className="cx-page-h"><div><h1>Recurrent Abdominal Pain (Children)</h1><p>Most children with recurring tummy pain have a functional cause. Look for alarm features, test a little, treat constipation, and reassure well.</p></div></header>
      <div className="cx-c23-row">{n("months", "Months of pain", "3")}{n("perMonth", "Episodes a month", "6")}</div>
      <h4>Alarm features</h4>
      <div className="cx-imaging-ticks">{RAP_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={flags[i]} onChange={(e) => setFlags(flags.map((y, j) => (j === i ? e.target.checked : y)))} data-rap-f={i} /> {t}</label>)}</div>
      <label className="cx-pa-mine"><input type="checkbox" checked={con} onChange={(e) => setCon(e.target.checked)} data-rap="constipation" /> Hard or infrequent stools</label>
      <div className={`cx-cmp-out ${flags.some(Boolean) ? "cx-st-out" : "cx-ac-in"}`} data-rap="out" data-functional={String(r.functional)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Baby size={13} /> Rome IV paediatric criteria, NASPGHAN/ESPGHAN. <TriangleAlert size={13} /> Acute severe pain is a different problem: think appendicitis, intussusception, torsion.</p>
    </section>
  );
}
