/**
 * Acute Pancreatitis Plan: Ranson, revised Atlanta severity, goal-directed fluids, feeding,
 * antibiotics, imaging and when to call the surgeons.
 */
import { useState } from "react";
import { Stethoscope, TriangleAlert } from "lucide-react";
import { atlanta, PANC_PLAN, pancFluids, RANSON_48, RANSON_ADMIT, ranson } from "@/lib/cadus/clinic37";

export default function PancreatitisView() {
  const [ra, setRa] = useState<number[]>([]);
  const [r48, setR48] = useState<number[]>([]);
  const [ofh, setOfh] = useState("0");
  const [local, setLocal] = useState(false);
  const [kg, setKg] = useState("");
  const [hypo, setHypo] = useState(true);
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const a = atlanta(Number(ofh) || 0, local);

  return (
    <section className="cx-page cx-lab cx-panc">
      <header className="cx-page-h"><div><h1>Acute Pancreatitis Plan</h1><p>Predict and grade severity, give the right amount of fluid, feed early, and know when to image, give antibiotics or call the surgeons.</p></div></header>
      <div className="cx-c23-two">
        <div><h4>Ranson at admission</h4><div className="cx-imaging-ticks">{RANSON_ADMIT.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ra.includes(i)} onChange={() => tg(ra, setRa, i)} data-pc-ra={i} /> {x}</label>)}</div></div>
        <div><h4>Ranson at 48 hours</h4><div className="cx-imaging-ticks">{RANSON_48.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={r48.includes(i)} onChange={() => tg(r48, setR48, i)} data-pc-r48={i} /> {x}</label>)}</div></div>
      </div>
      <p className={`cx-set-hint ${ra.length + r48.length >= 3 ? "cx-bk-err" : ""}`} data-pc="ranson"><b>{ranson(ra.length + r48.length)}</b> (criteria for non-gallstone pancreatitis; BISAP is in the Acute Abdomen tool.)</p>
      <h4>Revised Atlanta grade</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Organ failure lasting (hours; 0 if none)</span><input className="cx-input" inputMode="numeric" value={ofh} onChange={(e) => setOfh(e.target.value.replace(/\D/g, "").slice(0, 3))} data-pc="ofh" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={local} onChange={(e) => setLocal(e.target.checked)} data-pc="local" /> Local complications (collections, necrosis) or flare of comorbidity</label>
      </div>
      <div className={`cx-cmp-out ${a.grade === "severe" ? "cx-st-out" : a.grade === "mild" ? "cx-ac-in" : "cx-ac-high"}`} data-pc="atlanta" data-grade={a.grade}><p><b>{a.text}</b></p><p>Organ failure: modified Marshall score 2 or more (PaO2/FiO2 300 or less, creatinine 1.9 mg/dL or more, or systolic BP under 90 not responding to fluid).</p></div>
      <h4>Fluids</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-pc="kg" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={hypo} onChange={(e) => setHypo(e.target.checked)} data-pc="hypo" /> Hypovolaemic</label>
      </div>
      <ul data-pc="fluids">{pancFluids(Number(kg) || 0, hypo).map((s) => <li key={s}>{s}</li>)}</ul>
      <h4>The rest of the plan</h4>
      <ol className="cx-c23-steps">{PANC_PLAN.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Stethoscope size={13} /> Revised Atlanta 2012, ACG 2024, WATERFALL trial 2022, IAP/APA. <TriangleAlert size={13} /> Scores guide triage; reassess clinically every few hours in the first 72 hours.</p>
    </section>
  );
}
