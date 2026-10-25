/**
 * Septic Arthritis & Hot Joint: Kocher criteria in children, aspiration first, empirical
 * antibiotics by age and risk, and washout.
 */
import { useState } from "react";
import { Bone, TriangleAlert } from "lucide-react";
import { KOCHER, kocher, septicArthritisPlan } from "@/lib/cadus/clinic39";

export default function SepticJointView() {
  const [child, setChild] = useState(true);
  const [k, setK] = useState<number[]>([]);
  const [crp, setCrp] = useState(false);
  const [kg, setKg] = useState("");
  const [gono, setGono] = useState(false);
  const [mrsa, setMrsa] = useState(false);
  const [pros, setPros] = useState(false);
  const r = kocher(k.length, crp);
  return (
    <section className="cx-page cx-lab cx-septicjoint">
      <header className="cx-page-h"><div><h1>Septic Arthritis &amp; Hot Joint</h1><p>Kocher criteria for a child with a painful hip, aspirate before antibiotics, empirical treatment by age and risk, and urgent washout.</p></div></header>
      <div className="cx-seg" role="tablist">{([[true, "Child"], [false, "Adult"]] as const).map(([c, l]) => <button key={l} role="tab" aria-selected={child === c} className={child === c ? "on" : ""} onClick={() => setChild(c)} data-sj-tab={l}>{l}</button>)}</div>
      {child && (
        <>
          <h4>Kocher criteria</h4>
          <div className="cx-imaging-ticks">{KOCHER.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={k.includes(i)} onChange={() => setK(k.includes(i) ? k.filter((y) => y !== i) : [...k, i])} data-sj-k={i} /> {x}</label>)}<label className="cx-pa-mine"><input type="checkbox" checked={crp} onChange={(e) => setCrp(e.target.checked)} data-sj="crp" /> CRP over 20 mg/L (Caird)</label></div>
          <div className={`cx-cmp-out ${r.advice.startsWith("High") ? "cx-st-out" : r.advice.startsWith("Intermediate") ? "cx-ac-high" : "cx-ac-in"}`} data-sj="kocher"><h3 className="cx-lab-h3">{k.length} of 4: probability {r.pct}</h3><p>{r.advice}</p></div>
        </>
      )}
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder={child ? "20" : "70"} data-sj="kg" /></label>
        {!child && <label className="cx-pa-mine"><input type="checkbox" checked={gono} onChange={(e) => setGono(e.target.checked)} data-sj="gono" /> Sexually active, rash or tenosynovitis (gonococcal?)</label>}
        <label className="cx-pa-mine"><input type="checkbox" checked={mrsa} onChange={(e) => setMrsa(e.target.checked)} data-sj="mrsa" /> MRSA risk</label>
        {!child && <label className="cx-pa-mine"><input type="checkbox" checked={pros} onChange={(e) => setPros(e.target.checked)} data-sj="pros" /> Prosthetic joint</label>}
      </div>
      <ol className="cx-c23-steps" data-sj="plan">{septicArthritisPlan(child, Number(kg) || 0, gono, mrsa, pros).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Bone size={13} /> Kocher 1999, BSR/BOA septic arthritis guidance, IDSA. <TriangleAlert size={13} /> A hot swollen joint is septic until proven otherwise, even with gout or a fever-free patient.</p>
    </section>
  );
}
