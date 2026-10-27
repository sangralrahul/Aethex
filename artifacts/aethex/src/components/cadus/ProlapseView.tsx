/**
 * Pelvic Organ Prolapse: POP-Q stage from the leading edge, pelvic floor training, pessary, surgery
 * options and complications.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { popStage, prolapsePlan, type ProlapseInput } from "@/lib/cadus/clinic48";

export default function ProlapseView() {
  const [edge, setEdge] = useState("");
  const [complete, setComplete] = useState(false);
  const [f, setF] = useState({ symptomatic: false, wantsSurgery: false, frail: false, sexuallyActive: true, retention: false, ulcer: false, futurePregnancy: false, atrophy: false });
  const e = edge.trim() === "" || edge.trim() === "-" ? null : Number(edge);
  const stage = popStage(e !== null && Number.isFinite(e) ? e : null, complete);
  const plan = prolapsePlan({ stage, ...f } as ProlapseInput);
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(ev) => setF({ ...f, [k]: ev.target.checked })} data-pop={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-pop">
      <header className="cx-page-h"><div><h1>Pelvic Organ Prolapse</h1><p>Stage it by how far the leading edge comes relative to the hymen on straining, then match treatment to symptoms and wishes.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Leading edge on straining (cm; minus = above hymen)</span><input className="cx-input" inputMode="decimal" value={edge} onChange={(ev) => setEdge(ev.target.value.replace(/[^\d.-]/g, "").slice(0, 5))} placeholder="-3, 0 or +2" data-pop="edge" /></label></div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={complete} onChange={(ev) => setComplete(ev.target.checked)} data-pop="complete" /> Complete eversion (procidentia)</label>
        {cb("symptomatic", "Bulge, dragging or bothersome symptoms")}{cb("wantsSurgery", "Wants surgery")}{cb("futurePregnancy", "Plans a future pregnancy")}{cb("frail", "Frail or high surgical risk")}{cb("sexuallyActive", "Sexually active")}{cb("atrophy", "Vaginal atrophy")}{cb("retention", "Difficulty emptying the bladder")}{cb("ulcer", "Ulcer on the prolapse")}
      </div>
      <div className={`cx-cmp-out ${stage >= 3 ? "cx-ac-high" : "cx-ac-in"}`} data-pop="out" data-stage={stage}><ol className="cx-c23-steps">{plan.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Venus size={13} /> NICE NG123 (2019), ICS POP-Q. <TriangleAlert size={13} /> A forgotten pessary can erode or cause a fistula: arrange follow-up every 3–6 months.</p>
    </section>
  );
}
