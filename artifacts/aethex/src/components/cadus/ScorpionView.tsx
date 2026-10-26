/**
 * Scorpion Sting: grade the envenomation (Indian red scorpion) and treat with prazosin, antivenom and
 * supportive care.
 */
import { useState } from "react";
import { Bug, TriangleAlert } from "lucide-react";
import { SCORPION_GRADES, scorpionPlan } from "@/lib/cadus/clinic42";

export default function ScorpionView() {
  const [g, setG] = useState<1 | 2 | 3 | 4>(1);
  const [kg, setKg] = useState("");
  const [adult, setAdult] = useState(false);
  return (
    <section className="cx-page cx-lab cx-scorpion">
      <header className="cx-page-h"><div><h1>Scorpion Sting</h1><p>Grade the sting, then treat the adrenergic storm early with prazosin (and antivenom where available); watch children closely.</p></div></header>
      <div className="cx-rm-list" data-scp="grades">{SCORPION_GRADES.map((x) => (
        <label key={x.grade} className={`cx-rm-card ${g === x.grade ? "on" : ""}`}><input type="radio" name="scp-grade" checked={g === x.grade} onChange={() => setG(x.grade)} data-scp-g={x.grade} /><span className="cx-rm-open"><b>Grade {x.grade}: {x.name}</b><small>{x.signs}</small></span></label>
      ))}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-scp="kg" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} data-scp="adult" /> Adult</label>
      </div>
      <div className={`cx-cmp-out ${g >= 3 ? "cx-st-out" : g === 2 ? "cx-ac-high" : "cx-ac-in"}`} data-scp="plan"><ol className="cx-c23-steps">{scorpionPlan(g, Number(kg) || 0, adult).map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Bug size={13} /> Bawaskar and Bawaskar (BMJ 2011, prazosin with antivenom), IAP, national guidance. <TriangleAlert size={13} /> Children under 5 deteriorate fastest: refer early to a unit that can give HDU care.</p>
    </section>
  );
}
