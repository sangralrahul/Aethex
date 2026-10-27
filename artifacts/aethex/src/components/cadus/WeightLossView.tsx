/**
 * Unexplained Weight Loss: is it significant (5% in 6–12 months), first tests, and clue-led work-up.
 */
import { useState } from "react";
import { Scale, TriangleAlert } from "lucide-react";
import { weightLossPct, weightLossPlan } from "@/lib/cadus/clinic46";

export default function WeightLossView() {
  const [v, setV] = useState({ before: "", now: "", months: "", age: "" });
  const [f, setF] = useState({ cough: false, dysphagia: false, bowel: false, fever: false, polyuria: false, mood: false, heat: false });
  const pct = weightLossPct(Number(v.before) || 0, Number(v.now) || 0);
  const r = weightLossPlan({ pct, months: Number(v.months) || 0, age: Number(v.age) || 0, ...f });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-wtl={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-wtl={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-wtl">
      <header className="cx-page-h"><div><h1>Unexplained Weight Loss</h1><p>5% or more of body weight in 6–12 months without trying needs a work-up. Start broad, then follow the clues.</p></div></header>
      <div className="cx-c23-row">{n("before", "Usual weight (kg)", "70")}{n("now", "Weight now (kg)", "64")}{n("months", "Over how many months", "6")}{n("age", "Age", "55")}</div>
      <h4>Clues</h4>
      <div className="cx-imaging-ticks">{cb("cough", "Cough")}{cb("fever", "Fever or night sweats")}{cb("dysphagia", "Difficulty swallowing")}{cb("bowel", "Change in bowel habit or bleeding")}{cb("polyuria", "Thirst, passing a lot of urine")}{cb("heat", "Heat intolerance, tremor, palpitations")}{cb("mood", "Low mood or memory problems")}</div>
      <div className={`cx-cmp-out ${r.significant ? "cx-ac-high" : "cx-ac-in"}`} data-wtl="out" data-significant={String(r.significant)} data-pct={pct}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Scale size={13} /> AAFP 2021, NICE NG12 suspected cancer. <TriangleAlert size={13} /> Weight loss with dysphagia, a mass, haemoptysis or rectal bleeding: urgent referral.</p>
    </section>
  );
}
