/**
 * Red Eye & Acute Glaucoma: red-flag triage, first aid for acute angle closure, and a table of the
 * common red eyes.
 */
import { useState } from "react";
import { Eye, TriangleAlert } from "lucide-react";
import { GLAUCOMA_FIRST_AID, RED_EYE_FLAGS, RED_EYE_TABLE, redEyeTriage } from "@/lib/cadus/clinic42";

export default function RedEyeView() {
  const [f, setF] = useState<boolean[]>(RED_EYE_FLAGS.map(() => false));
  const r = redEyeTriage(f);
  return (
    <section className="cx-page cx-lab cx-redeye">
      <header className="cx-page-h"><div><h1>Red Eye &amp; Acute Glaucoma</h1><p>Spot the red eye that threatens sight, start first aid for acute angle-closure glaucoma, and manage the common ones.</p></div></header>
      <div className="cx-imaging-ticks">{RED_EYE_FLAGS.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={f[i]} onChange={(e) => setF(f.map((y, j) => (j === i ? e.target.checked : y)))} data-re={i} /> {x}</label>)}</div>
      <div className={`cx-cmp-out ${r.level === "emergency" ? "cx-st-out" : r.level === "same-day" ? "cx-ac-high" : "cx-ac-in"}`} data-re="out" data-level={r.level}><p><b>{r.text}</b></p></div>
      <h4>Acute angle-closure glaucoma: while you call ophthalmology</h4><ol className="cx-c23-steps" data-re="glaucoma">{GLAUCOMA_FIRST_AID.map((s) => <li key={s}>{s}</li>)}</ol>
      <h4>Common red eyes</h4>
      <table className="cx-c23-table"><thead><tr><th>Condition</th><th>Clues</th><th>Management</th></tr></thead><tbody>{RED_EYE_TABLE.map(([a, b, c]) => <tr key={a}><td><b>{a}</b></td><td>{b}</td><td>{c}</td></tr>)}</tbody></table>
      <p className="cx-rs-foot"><Eye size={13} /> Royal College of Ophthalmologists, AAO Preferred Practice Patterns, NICE CKS. <TriangleAlert size={13} /> Never give steroid or anaesthetic eye drops to take home.</p>
    </section>
  );
}
