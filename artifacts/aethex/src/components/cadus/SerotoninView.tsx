/**
 * Serotonin Syndrome vs NMS: Hunter criteria, NMS features, telling them apart, and treatment of
 * each.
 */
import { useState } from "react";
import { Thermometer, TriangleAlert } from "lucide-react";
import { HUNTER, NMS_FEATURES, NMS_PLAN, serotoninVsNms, SS_PLAN } from "@/lib/cadus/clinic39";

export default function SerotoninView() {
  const [sero, setSero] = useState(true);
  const [h, setH] = useState<number[]>([]);
  const [n, setN] = useState<number[]>([]);
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const r = serotoninVsNms(sero, h.length, n.length);
  return (
    <section className="cx-page cx-lab cx-serotonin">
      <header className="cx-page-h"><div><h1>Serotonin Syndrome vs NMS</h1><p>Tell serotonin syndrome (hours, clonus) from neuroleptic malignant syndrome (days, rigidity) and treat each.</p></div></header>
      <label className="cx-pa-mine"><input type="checkbox" checked={sero} onChange={(e) => setSero(e.target.checked)} data-ss="sero" /> Taking a serotonergic drug (SSRI, SNRI, tramadol, linezolid, ondansetron, MAOI, triptan, MDMA)</label>
      <div className="cx-c23-two">
        <div><h4>Hunter criteria (any one)</h4><div className="cx-imaging-ticks">{HUNTER.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={h.includes(i)} onChange={() => tg(h, setH, i)} data-ss-h={i} /> {x}</label>)}</div></div>
        <div><h4>NMS features</h4><div className="cx-imaging-ticks">{NMS_FEATURES.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={n.includes(i)} onChange={() => tg(n, setN, i)} data-ss-n={i} /> {x}</label>)}</div></div>
      </div>
      <div className={`cx-cmp-out ${r.dx === "neither" ? "cx-ac-in" : "cx-st-out"}`} data-ss="out" data-dx={r.dx}><h3 className="cx-lab-h3">{r.text}</h3>
        {(r.dx === "serotonin" || r.dx === "both") && <><h4>Serotonin syndrome</h4><ol className="cx-c23-steps">{SS_PLAN.map((s) => <li key={s}>{s}</li>)}</ol></>}
        {(r.dx === "nms" || r.dx === "both") && <><h4>Neuroleptic malignant syndrome</h4><ol className="cx-c23-steps">{NMS_PLAN.map((s) => <li key={s}>{s}</li>)}</ol></>}
      </div>
      <p className="cx-rs-foot"><Thermometer size={13} /> Hunter criteria (Dunkley 2003), Boyer & Shannon NEJM 2005, NMS consensus 2011. <TriangleAlert size={13} /> Both can kill through hyperthermia: cool early and involve ICU.</p>
    </section>
  );
}
