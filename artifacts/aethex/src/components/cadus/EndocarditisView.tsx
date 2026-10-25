/**
 * Infective Endocarditis: modified Duke criteria, empirical antibiotics by valve type, echo and
 * surgery indications.
 */
import { useState } from "react";
import { HeartPulse, TriangleAlert } from "lucide-react";
import { duke, DUKE_MAJOR, DUKE_MINOR, ieEmpiric } from "@/lib/cadus/clinic38";

export default function EndocarditisView() {
  const [maj, setMaj] = useState<number[]>([]);
  const [min, setMin] = useState<number[]>([]);
  const [kind, setKind] = useState<"native" | "early-prosthetic" | "late-prosthetic">("native");
  const [pen, setPen] = useState(false);
  const [kg, setKg] = useState("");
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const d = duke(maj.length, min.length);
  return (
    <section className="cx-page cx-lab cx-endocarditis">
      <header className="cx-page-h"><div><h1>Infective Endocarditis</h1><p>The modified Duke criteria, empirical antibiotics for native or prosthetic valves, and when to call the cardiac surgeons.</p></div></header>
      <div className="cx-c23-two">
        <div><h4>Major criteria</h4><div className="cx-imaging-ticks">{DUKE_MAJOR.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={maj.includes(i)} onChange={() => tg(maj, setMaj, i)} data-ie-maj={i} /> {x}</label>)}</div></div>
        <div><h4>Minor criteria</h4><div className="cx-imaging-ticks">{DUKE_MINOR.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={min.includes(i)} onChange={() => tg(min, setMin, i)} data-ie-min={i} /> {x}</label>)}</div></div>
      </div>
      <div className={`cx-cmp-out ${d === "definite" ? "cx-st-out" : d === "possible" ? "cx-ac-high" : "cx-ac-in"}`} data-ie="duke" data-result={d}><h3 className="cx-lab-h3">{d === "definite" ? "Definite endocarditis" : d === "possible" ? "Possible endocarditis" : "Rejected on current criteria"}</h3><p>Definite: 2 major, 1 major + 3 minor, or 5 minor. Possible: 1 major + 1 minor, or 3 minor.</p></div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Valve</span><select className="cx-select" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} data-ie="kind"><option value="native">Native valve</option><option value="early-prosthetic">Prosthetic, under 12 months</option><option value="late-prosthetic">Prosthetic, over 12 months</option></select></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-ie="kg" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={pen} onChange={(e) => setPen(e.target.checked)} data-ie="pen" /> Penicillin allergy</label>
      </div>
      <ol className="cx-c23-steps" data-ie="plan">{ieEmpiric(kind, pen, Number(kg) || 0).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><HeartPulse size={13} /> Modified Duke criteria (Li 2000; ISCVID 2023 update), ESC 2023 endocarditis guideline. <TriangleAlert size={13} /> Adjust gentamicin and vancomycin to levels and kidney function.</p>
    </section>
  );
}
