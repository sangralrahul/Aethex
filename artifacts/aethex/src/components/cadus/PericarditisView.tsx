/**
 * Pericarditis & Myocarditis: diagnostic criteria, high-risk features that need admission,
 * NSAID/aspirin and colchicine doses, and exercise advice.
 */
import { useState } from "react";
import { HeartPulse, TriangleAlert } from "lucide-react";
import { PERI_CRITERIA, PERI_HIGH_RISK, pericarditis, periPlan } from "@/lib/cadus/clinic42";

export default function PericarditisView() {
  const [c, setC] = useState<boolean[]>(PERI_CRITERIA.map(() => false));
  const [h, setH] = useState<boolean[]>(PERI_HIGH_RISK.map(() => false));
  const [trop, setTrop] = useState(false);
  const [rec, setRec] = useState(false);
  const [kg, setKg] = useState("");
  const r = pericarditis(c, h, trop);
  return (
    <section className="cx-page cx-lab cx-pericarditis">
      <header className="cx-page-h"><div><h1>Pericarditis &amp; Myocarditis</h1><p>Make the diagnosis (2 of 4 criteria), decide on admission, and treat with an NSAID or aspirin plus colchicine.</p></div></header>
      <div className="cx-imaging-ticks">{PERI_CRITERIA.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={c[i]} onChange={(e) => setC(c.map((y, j) => (j === i ? e.target.checked : y)))} data-pcd-c={i} /> {x}</label>)}</div>
      <h4>High-risk features</h4>
      <div className="cx-imaging-ticks">{PERI_HIGH_RISK.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={h[i]} onChange={(e) => setH(h.map((y, j) => (j === i ? e.target.checked : y)))} data-pcd-h={i} /> {x}</label>)}
        <label className="cx-pa-mine"><input type="checkbox" checked={trop} onChange={(e) => setTrop(e.target.checked)} data-pcd="trop" /> Raised troponin</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={rec} onChange={(e) => setRec(e.target.checked)} data-pcd="rec" /> Recurrent pericarditis</label>
      </div>
      <div className="cx-c23-row"><label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, "").slice(0, 3))} data-pcd="kg" /></label></div>
      <div className={`cx-cmp-out ${r.admit ? "cx-st-out" : r.diagnosis ? "cx-ac-high" : "cx-ac-in"}`} data-pcd="out" data-dx={String(r.diagnosis)} data-admit={String(r.admit)}>
        <h3 className="cx-lab-h3">{r.criteria} of 4 criteria: {r.diagnosis ? (r.myo ? "myopericarditis" : "acute pericarditis") : "criteria not met"}{r.admit ? " · admit" : r.diagnosis ? " · outpatient care is reasonable" : ""}</h3>
        {r.diagnosis && <ul>{periPlan(Number(kg) || 0, r.myo, rec).map((s) => <li key={s}>{s}</li>)}</ul>}
      </div>
      <p className="cx-rs-foot"><HeartPulse size={13} /> ESC pericardial diseases guideline 2015 and 2025 myocarditis/pericarditis guideline. <TriangleAlert size={13} /> Hypotension, raised JVP, pulsus paradoxus: tamponade; urgent echo and pericardiocentesis.</p>
    </section>
  );
}
