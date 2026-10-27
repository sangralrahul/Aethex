/**
 * Splenomegaly: causes by size with an Indian focus (malaria, kala-azar, portal hypertension,
 * thalassaemia, CML), first tests and advice.
 */
import { useState } from "react";
import { TriangleAlert, Activity } from "lucide-react";
import { splenoPlan, type SplenoInput } from "@/lib/cadus/clinic49";

export default function SplenomegalyView() {
  const [x, setX] = useState<SplenoInput>({ size: "moderate", fever: false, kalaAzarArea: false, highWbc: false, cytopenias: false, liverDisease: false, haemolysis: false, nodes: false, weightLoss: false, childhoodAnaemia: false });
  const cb = (k: Exclude<keyof SplenoInput, "size">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-spl={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-spl">
      <header className="cx-page-h"><div><h1>Splenomegaly</h1><p>How big is it, and what else is there? Size narrows the list; the blood film and an ultrasound with Doppler do most of the work.</p></div></header>
      <div className="cx-seg" role="tablist">{([["mild", "Just palpable"], ["moderate", "Moderate"], ["massive", "Massive"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={x.size === k} className={x.size === k ? "on" : ""} onClick={() => setX({ ...x, size: k })} data-spl-size={k}>{l}</button>)}</div>
      <div className="cx-imaging-ticks">{cb("fever", "Fever")}{cb("kalaAzarArea", "From a kala-azar area")}{cb("highWbc", "High white count")}{cb("cytopenias", "Low blood counts")}{cb("liverDisease", "Liver disease or varices")}{cb("haemolysis", "Jaundice and anaemia")}{cb("childhoodAnaemia", "Child with anaemia since infancy")}{cb("nodes", "Swollen lymph nodes")}{cb("weightLoss", "Weight loss, night sweats")}</div>
      <ol className="cx-c23-steps" data-spl="plan">{splenoPlan(x).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Activity size={13} /> API textbook of medicine, NVBDCP kala-azar guidance. <TriangleAlert size={13} /> Left upper quadrant pain after a blow in someone with a big spleen: rupture until proved otherwise.</p>
    </section>
  );
}
