/**
 * Back Pain & Cauda Equina: cauda equina symptoms, other red flags (including spinal TB), and the
 * plan for each level of urgency.
 */
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { BACK_CES, BACK_RED, backPlan } from "@/lib/cadus/clinic34";

export default function BackPainView() {
  const [ces, setCes] = useState<string[]>([]);
  const [red, setRed] = useState<string[]>([]);
  const [sciatica, setSciatica] = useState(false);
  const p = backPlan(ces.length, red.length, sciatica);
  const tg = (list: string[], set: (l: string[]) => void, x: string) => set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

  return (
    <section className="cx-page cx-lab cx-back">
      <header className="cx-page-h"><div><h1>Back Pain &amp; Cauda Equina</h1><p>Spot cauda equina syndrome and the other red flags (including spinal TB), and the plan for emergency, urgent and simple back pain.</p></div></header>
      <div className="cx-c23-two">
        <div><h4>Cauda equina symptoms</h4><div className="cx-imaging-ticks">{BACK_CES.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ces.includes(x)} onChange={() => tg(ces, setCes, x)} data-bp-ces={i} /> {x}</label>)}</div></div>
        <div><h4>Other red flags</h4><div className="cx-imaging-ticks">{BACK_RED.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={red.includes(x)} onChange={() => tg(red, setRed, x)} data-bp-red={i} /> {x}</label>)}</div></div>
      </div>
      <label className="cx-pa-mine"><input type="checkbox" checked={sciatica} onChange={(e) => setSciatica(e.target.checked)} data-bp="sciatica" /> Leg pain below the knee (sciatica)</label>
      <div className={`cx-cmp-out ${p.level === "emergency" ? "cx-st-out" : p.level === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-bp="out" data-level={p.level}>
        <h3 className="cx-lab-h3">{p.level === "emergency" ? "Emergency" : p.level === "urgent" ? "Urgent assessment" : "Non-specific back pain"}</h3>
        <ul>{p.steps.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      <p className="cx-set-hint">Give every patient with sciatica written advice to come back at once with any bladder, bowel, saddle numbness or both-leg symptoms.</p>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> NICE NG59, GIRFT cauda equina pathway (2023). Cauda equina is a clinical diagnosis: a normal-looking patient can still need an emergency MRI.</p>
    </section>
  );
}
