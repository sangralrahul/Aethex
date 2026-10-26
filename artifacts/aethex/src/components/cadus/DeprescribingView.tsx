/**
 * Deprescribing (STOPP/START): tick the medicines and conditions; see what to stop or reduce, what
 * may be missing, and the anticholinergic burden.
 */
import { useState } from "react";
import { Pill, TriangleAlert } from "lucide-react";
import { deprescribe, DP_CONDS, DP_DRUGS } from "@/lib/cadus/clinic41";

export default function DeprescribingView() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const r = deprescribe(drugs, conds);
  const tog = (l: string[], set: (x: string[]) => void, id: string) => set(l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
  const shown = DP_DRUGS.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="cx-page cx-lab cx-deprescribe">
      <header className="cx-page-h"><div><h1>Deprescribing (STOPP/START)</h1><p>For older adults: tick the medicines and conditions to see risky prescriptions, how to taper them, missing treatments and the anticholinergic burden.</p></div></header>
      <h4>Conditions</h4>
      <div className="cx-imaging-ticks">{DP_CONDS.map((c) => <label key={c.id} className="cx-pa-mine"><input type="checkbox" checked={conds.includes(c.id)} onChange={() => tog(conds, setConds, c.id)} data-dp-c={c.id} /> {c.name}</label>)}</div>
      <h4>Medicines</h4>
      <input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter medicines" data-dp="find" />
      <div className="cx-imaging-ticks">{shown.map((d) => <label key={d.id} className="cx-pa-mine"><input type="checkbox" checked={drugs.includes(d.id)} onChange={() => tog(drugs, setDrugs, d.id)} data-dp-d={d.id} /> {d.name}{d.acb ? <small> · ACB {d.acb}</small> : null}</label>)}</div>
      <div className={`cx-cmp-out ${r.stop.length ? "cx-st-out" : "cx-ac-in"}`} data-dp="stop"><h3 className="cx-lab-h3">Stop or reduce ({r.stop.length})</h3>{r.stop.length ? <ul>{r.stop.map((s) => <li key={s}>{s}</li>)}</ul> : <p>Nothing flagged from what is ticked.</p>}</div>
      {r.start.length > 0 && <div className="cx-cmp-out cx-ac-high" data-dp="start"><h3 className="cx-lab-h3">Consider starting ({r.start.length})</h3><ul>{r.start.map((s) => <li key={s}>{s}</li>)}</ul></div>}
      <p className={`cx-set-hint ${r.acb >= 3 ? "cx-bk-err" : ""}`} data-dp="acb"><b>{r.acbText}</b></p>
      <p className="cx-set-hint">Change one medicine at a time, agree it with the patient, and review in 2–4 weeks.</p>
      <p className="cx-rs-foot"><Pill size={13} /> STOPP/START v3 (2023), AGS Beers 2023, ACB scale. <TriangleAlert size={13} /> A checklist, not a decision: weigh each change with the patient's goals.</p>
    </section>
  );
}
