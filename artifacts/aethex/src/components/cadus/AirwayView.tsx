/**
 * Upper Airway & Stridor: likely causes from the features, what to do for each, the choking
 * algorithm and tracheostomy emergencies.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import { AIRWAY_FEATURES, AIRWAY_GENERAL, airwayCauses } from "@/lib/cadus/clinic37";

export default function AirwayView() {
  const [f, setF] = useState<number[]>([]);
  const causes = airwayCauses(f);
  return (
    <section className="cx-page cx-lab cx-airway">
      <header className="cx-page-h"><div><h1>Upper Airway &amp; Stridor</h1><p>Tick what you see to get the likely causes and the steps for each: foreign body, epiglottitis, croup, anaphylaxis, angio-oedema, deep neck infection, tracheostomy and post-extubation stridor.</p></div></header>
      <div className="cx-cmp-out cx-st-out" data-aw="general"><ol className="cx-c23-steps">{AIRWAY_GENERAL.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <h4>What do you see?</h4>
      <div className="cx-imaging-ticks">{AIRWAY_FEATURES.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={f.includes(i)} onChange={() => setF(f.includes(i) ? f.filter((y) => y !== i) : [...f, i])} data-aw-f={i} /> {x}</label>)}</div>
      {causes.map((c, i) => <div key={c.label} className={`cx-cmp-out ${i === 0 ? "cx-ac-high" : ""}`} data-aw-cause={i}><h3 className="cx-lab-h3">{c.label}</h3><ul>{c.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>)}
      {!causes.length && <p className="cx-set-hint">Tick at least one feature to see likely causes.</p>}
      <p className="cx-rs-foot"><Wind size={13} /> DAS 2015, National Tracheostomy Safety Project, Resuscitation Council UK choking algorithm. <TriangleAlert size={13} /> A quiet child with stridor and drooling is in danger: do not upset them.</p>
    </section>
  );
}
