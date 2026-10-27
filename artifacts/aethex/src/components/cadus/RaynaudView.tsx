/**
 * Raynaud's Phenomenon: primary vs secondary, tests for connective tissue disease, warming
 * measures and vasodilators.
 */
import { useState } from "react";
import { Snowflake, TriangleAlert } from "lucide-react";
import { RAYNAUD_FLAGS, raynaudPlan } from "@/lib/cadus/clinic46";

export default function RaynaudView() {
  const [flags, setFlags] = useState(RAYNAUD_FLAGS.map(() => false));
  const [ulcer, setUlcer] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const r = raynaudPlan(flags, ulcer, smoker);
  return (
    <section className="cx-page cx-lab cx-ray">
      <header className="cx-page-h"><div><h1>Raynaud's Phenomenon</h1><p>White, then blue, then red fingers in the cold. Most is primary; look for features of an underlying connective tissue disease.</p></div></header>
      <h4>Features of secondary Raynaud's</h4>
      <div className="cx-imaging-ticks">{RAYNAUD_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={flags[i]} onChange={(e) => setFlags(flags.map((y, j) => (j === i ? e.target.checked : y)))} data-ray-f={i} /> {t}</label>)}</div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={ulcer} onChange={(e) => setUlcer(e.target.checked)} data-ray="ulcer" /> Active digital ulcer or a finger that stays white or blue</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} data-ray="smoker" /> Smoker</label>
      </div>
      <div className={`cx-cmp-out ${ulcer ? "cx-st-out" : r.secondary ? "cx-ac-high" : "cx-ac-in"}`} data-ray="out" data-secondary={String(r.secondary)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Snowflake size={13} /> EULAR systemic sclerosis recommendations 2023, BSR. <TriangleAlert size={13} /> A single cold, painful, pale finger that does not recover is an emergency.</p>
    </section>
  );
}
