/**
 * Testicular Torsion & Scrotal Pain: TWIST score, time since onset, and treatment for epididymitis.
 */
import { useState } from "react";
import { Siren, TriangleAlert } from "lucide-react";
import { epididymitisRx, salvageNote, twist, TWIST_ITEMS } from "@/lib/cadus/clinic41";

export default function TorsionView() {
  const [t, setT] = useState<boolean[]>(TWIST_ITEMS.map(() => false));
  const [hrs, setHrs] = useState("");
  const [age, setAge] = useState("");
  const [enteric, setEnteric] = useState(false);
  const s = twist(t);
  return (
    <section className="cx-page cx-lab cx-torsion">
      <header className="cx-page-h"><div><h1>Testicular Torsion &amp; Scrotal Pain</h1><p>Score the risk of torsion with TWIST, see how time affects salvage, and treat epididymitis when torsion is unlikely.</p></div></header>
      <div className="cx-imaging-ticks">{TWIST_ITEMS.map((it, i) => <label key={it.label} className="cx-pa-mine"><input type="checkbox" checked={t[i]} onChange={(e) => setT(t.map((x, j) => (j === i ? e.target.checked : x)))} data-tt={i} /> {it.label} ({it.pts})</label>)}</div>
      <div className={`cx-cmp-out ${s.band === "high" ? "cx-st-out" : s.band === "intermediate" ? "cx-ac-high" : "cx-ac-in"}`} data-tt="out" data-band={s.band}><h3 className="cx-lab-h3">TWIST {s.score}/7</h3><p><b>{s.action}</b></p></div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Hours since pain began</span><input className="cx-input" inputMode="decimal" value={hrs} onChange={(e) => setHrs(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-tt="hrs" /></label>
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} data-tt="age" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={enteric} onChange={(e) => setEnteric(e.target.checked)} data-tt="enteric" /> Enteric organisms likely</label>
      </div>
      <p className="cx-set-hint" data-tt="salvage"><b>{salvageNote(Number(hrs) || 0)}</b> Manual detorsion (rotate outwards, "open the book") only as a bridge to theatre.</p>
      <h4>Epididymitis (torsion excluded)</h4><ul data-tt="epi">{epididymitisRx(Number(age) || 0, enteric).map((x) => <li key={x}>{x}</li>)}</ul>
      <p className="cx-set-hint">Torsion of the appendix testis: a tender nodule at the upper pole, sometimes a "blue dot"; rest and analgesia.</p>
      <p className="cx-rs-foot"><Siren size={13} /> TWIST (Barbosa 2013), EAU paediatric urology, CDC STI 2021. <TriangleAlert size={13} /> A normal Doppler does not fully exclude torsion; if in doubt, explore.</p>
    </section>
  );
}
