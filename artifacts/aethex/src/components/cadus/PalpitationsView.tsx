/**
 * Palpitations: red flags, ECG and QTc, which monitor for how often, and common triggers.
 */
import { useState } from "react";
import { HeartPulse, TriangleAlert } from "lucide-react";
import { PALP_FLAGS, palpPlan, qtcFlag } from "@/lib/cadus/clinic47";

export default function PalpitationsView() {
  const [flags, setFlags] = useState(PALP_FLAGS.map(() => false));
  const [freq, setFreq] = useState<"daily" | "weekly" | "monthly" | "rare">("weekly");
  const [triggers, setTriggers] = useState(true);
  const [qtc, setQtc] = useState("");
  const [female, setFemale] = useState(false);
  const r = palpPlan(flags, freq, triggers);
  const q = qtcFlag(Number(qtc) || 0, female);
  return (
    <section className="cx-page cx-lab cx-plp">
      <header className="cx-page-h"><div><h1>Palpitations</h1><p>Most are harmless ectopics or sinus tachycardia. Find the red flags, get an ECG, and match the monitor to how often they happen.</p></div></header>
      <h4>Red flags</h4>
      <div className="cx-imaging-ticks">{PALP_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={flags[i]} onChange={(e) => setFlags(flags.map((y, j) => (j === i ? e.target.checked : y)))} data-plp-f={i} /> {t}</label>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>How often</span><select className="cx-select" value={freq} onChange={(e) => setFreq(e.target.value as typeof freq)} data-plp="freq"><option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option><option value="rare">Rarely</option></select></label>
        <label className="cx-field"><span>QTc on ECG (ms)</span><input className="cx-input" inputMode="numeric" value={qtc} onChange={(e) => setQtc(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="430" data-plp="qtc" /></label>
      </div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} data-plp="female" /> Female</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={triggers} onChange={(e) => setTriggers(e.target.checked)} data-plp="triggers" /> Show common triggers</label>
      </div>
      {q && <p className={`cx-cmp-out ${Number(qtc) >= 500 ? "cx-st-out" : q.includes("normal") ? "cx-ac-in" : "cx-ac-high"}`} data-plp="qtc-out">{q}</p>}
      <div className={`cx-cmp-out ${r.urgent ? "cx-st-out" : "cx-ac-in"}`} data-plp="out" data-urgent={String(r.urgent)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><HeartPulse size={13} /> EHRA palpitations consensus 2011, NICE CKS. <TriangleAlert size={13} /> Palpitations with fainting during exercise: no driving or sport until assessed.</p>
    </section>
  );
}
