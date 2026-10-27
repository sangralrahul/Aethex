/**
 * Chronic Cough: red flags, TB testing under NTEP, and a cause-by-cause plan.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import { COUGH_FLAGS, coughPlan, type CoughInput } from "@/lib/cadus/clinic45";

export default function ChronicCoughView() {
  const [x, setX] = useState<CoughInput>({ weeks: 0, child: false, flags: COUGH_FLAGS.map(() => false), ace: false, smoker: false, sputum: false, wheeze: false, heartburn: false, postnasal: false });
  const r = coughPlan(x);
  const cb = (k: "child" | "ace" | "smoker" | "sputum" | "wheeze" | "heartburn" | "postnasal", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-cgh={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-cough">
      <header className="cx-page-h"><div><h1>Chronic Cough</h1><p>Cough for 8 weeks or more in adults (4 in children): exclude TB and cancer, then work through the common causes one at a time.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Weeks of cough</span><input className="cx-input" inputMode="numeric" value={x.weeks || ""} onChange={(e) => setX({ ...x, weeks: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="10" data-cgh="weeks" /></label>{cb("child", "Child")}</div>
      <h4>Red flags</h4>
      <div className="cx-imaging-ticks">{COUGH_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={x.flags[i]} onChange={(e) => setX({ ...x, flags: x.flags.map((y, j) => (j === i ? e.target.checked : y)) })} data-cgh-f={i} /> {t}</label>)}</div>
      <h4>Clues</h4>
      <div className="cx-imaging-ticks">{cb("ace", "On an ACE inhibitor")}{cb("smoker", "Smoker")}{cb("wheeze", "Wheeze or worse at night/exercise")}{cb("postnasal", "Post-nasal drip, throat clearing")}{cb("heartburn", "Heartburn or regurgitation")}{cb("sputum", "Daily sputum")}</div>
      <div className={`cx-cmp-out ${r.urgent ? "cx-st-out" : "cx-ac-in"}`} data-cgh="out" data-urgent={String(r.urgent)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Wind size={13} /> ERS chronic cough guideline 2020, BTS, NTEP (India). <TriangleAlert size={13} /> Every cough over 2 weeks in India deserves a TB test.</p>
    </section>
  );
}
