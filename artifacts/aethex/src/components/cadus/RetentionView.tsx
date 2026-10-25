/**
 * Acute Urinary Retention: catheter choice, residual volume, post-obstructive diuresis, tamsulosin
 * and trial without catheter, causes and red flags.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { retentionPlan } from "@/lib/cadus/clinic37";

export default function RetentionView() {
  const [res, setRes] = useState("");
  const [male, setMale] = useState(true);
  const [clots, setClots] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <section className="cx-page cx-lab cx-retention">
      <header className="cx-page-h"><div><h1>Acute Urinary Retention</h1><p>Catheterise safely, read the residual volume, watch for post-obstructive diuresis, plan the trial without catheter, and find the cause.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Residual volume drained (ml)</span><input className="cx-input" inputMode="numeric" value={res} onChange={(e) => setRes(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="900" data-ur="res" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={male} onChange={(e) => setMale(e.target.checked)} data-ur="male" /> Male</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={clots} onChange={(e) => setClots(e.target.checked)} data-ur="clots" /> Haematuria with clots</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={failed} onChange={(e) => setFailed(e.target.checked)} data-ur="failed" /> Catheter won't pass</label>
      </div>
      <div className="cx-cmp-out cx-ac-high" data-ur="out"><ol className="cx-c23-steps">{retentionPlan(res ? Number(res) : null, male, clots, failed).map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Droplets size={13} /> EAU and BAUS guidance. <TriangleAlert size={13} /> Never force a catheter; urethral trauma makes the next attempt harder.</p>
    </section>
  );
}
