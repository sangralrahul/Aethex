/**
 * Urinary Incontinence in Women: ICIQ-UI SF score, stress vs urge vs mixed, red flags, and the NICE
 * treatment ladder.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { iciqScore, incontinencePlan, incontinenceType } from "@/lib/cadus/clinic46";

export default function IncontinenceView() {
  const [s, setS] = useState({ stress: false, urge: false, frail: false });
  const [q, setQ] = useState({ freq: 0, amount: 0, impact: 0 });
  const [bmi, setBmi] = useState("");
  const [fl, setFl] = useState({ haematuria: false, recurrentUti: false, voiding: false, mass: false, continuous: false });
  const type = incontinenceType(s.stress, s.urge);
  const ic = iciqScore(q.freq, q.amount, q.impact);
  const r = incontinencePlan(type, fl, Number(bmi) || 0, s.frail);
  const sel = (k: keyof typeof q, l: string, opts: [number, string][]) => <label className="cx-field"><span>{l}</span><select className="cx-select" value={q[k]} onChange={(e) => setQ({ ...q, [k]: Number(e.target.value) })} data-inc={k}>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>;
  const cb = (k: keyof typeof fl, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={fl[k]} onChange={(e) => setFl({ ...fl, [k]: e.target.checked })} data-inc={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-inc">
      <header className="cx-page-h"><div><h1>Urinary Incontinence (Women)</h1><p>Work out the type, score how much it affects her, check red flags, then pelvic floor training, bladder training and medicines.</p></div></header>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={s.stress} onChange={(e) => setS({ ...s, stress: e.target.checked })} data-inc="stress" /> Leaks with cough, sneeze, laughing or exercise</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={s.urge} onChange={(e) => setS({ ...s, urge: e.target.checked })} data-inc="urge" /> Sudden urge, leaks before reaching the toilet</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={s.frail} onChange={(e) => setS({ ...s, frail: e.target.checked })} data-inc="frail" /> Frail or older, or memory problems</label>
      </div>
      <p className="cx-set-hint" data-inc="type" data-type={type}><b>Type: {type === "unclear" ? "not clear yet" : `${type} incontinence`}</b></p>
      <h4>ICIQ-UI short form</h4>
      <div className="cx-c23-row">
        {sel("freq", "How often do you leak?", [[0, "Never"], [1, "About once a week or less"], [2, "Two or three times a week"], [3, "About once a day"], [4, "Several times a day"], [5, "All the time"]])}
        {sel("amount", "How much leaks?", [[0, "None"], [2, "A small amount"], [4, "A moderate amount"], [6, "A large amount"]])}
        <label className="cx-field"><span>Effect on daily life (0–10)</span><input className="cx-input" inputMode="numeric" value={q.impact || ""} onChange={(e) => setQ({ ...q, impact: Math.min(10, Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 0) })} placeholder="6" data-inc="impact" /></label>
      </div>
      <p className="cx-set-hint" data-inc="iciq" data-score={ic.score}><b>ICIQ score {ic.score}/21: {ic.band}</b></p>
      <h4>Refer if</h4>
      <div className="cx-imaging-ticks">{cb("haematuria", "Blood in the urine")}{cb("recurrentUti", "Recurrent UTIs")}{cb("voiding", "Difficulty emptying, poor stream")}{cb("mass", "Pelvic mass or prolapse at or beyond the introitus")}{cb("continuous", "Continuous leakage")}</div>
      <div className="cx-c23-row"><label className="cx-field"><span>BMI</span><input className="cx-input" inputMode="decimal" value={bmi} onChange={(e) => setBmi(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="27" data-inc="bmi" /></label></div>
      <div className={`cx-cmp-out ${r.refer ? "cx-st-out" : "cx-ac-in"}`} data-inc="out" data-refer={String(r.refer)}><ol className="cx-c23-steps">{r.steps.map((x) => <li key={x}>{x}</li>)}</ol></div>
      <p className="cx-rs-foot"><Droplets size={13} /> NICE NG123 (2019), ICIQ-UI SF. <TriangleAlert size={13} /> Anticholinergics add up: check the total anticholinergic burden in older women.</p>
    </section>
  );
}
