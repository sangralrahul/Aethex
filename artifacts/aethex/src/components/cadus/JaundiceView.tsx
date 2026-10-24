/**
 * Neonatal Jaundice: a bilirubin against the NICE thresholds for the baby's age in hours and
 * gestation, the rate of rise from an earlier level, and what to do (recheck, phototherapy,
 * intensive phototherapy or exchange).
 */
import { useState } from "react";
import { Lightbulb, TriangleAlert } from "lucide-react";
import { JAUNDICE_RISK, jaundiceAssess, NICE_TERM, toMgdl, toUmol } from "@/lib/cadus/clinic28";

export default function JaundiceView() {
  const [hours, setHours] = useState("");
  const [ga, setGa] = useState("39");
  const [sbr, setSbr] = useState("");
  const [unit, setUnit] = useState<"umol" | "mgdl">("mgdl");
  const [prev, setPrev] = useState("");
  const [prevH, setPrevH] = useState("");
  const [risk, setRisk] = useState<string[]>([]);
  const num = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const u = toUmol(Number(sbr), unit);
  const out = jaundiceAssess(Number(hours), u, Number(ga), { riskFactors: risk.length > 0 || Number(ga) < 38, prevUmol: prev ? toUmol(Number(prev), unit) : undefined, prevHours: prevH ? Number(prevH) : undefined });
  const both = (v: number | null) => (v === null ? "–" : `${v} µmol/L (${toMgdl(v)} mg/dL)`);

  return (
    <section className="cx-page cx-lab cx-nnj">
      <header className="cx-page-h"><div><h1>Neonatal Jaundice</h1><p>Plot a bilirubin against the NICE thresholds for the baby's age in hours and gestation, with the rate of rise and what to do next.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age (hours)</span><input className="cx-input" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="48" data-nj="hours" /></label>
        <label className="cx-field"><span>Gestation (weeks)</span><input className="cx-input" inputMode="numeric" value={ga} onChange={(e) => setGa(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="39" data-nj="ga" /></label>
        <label className="cx-field"><span>Serum bilirubin</span><input className="cx-input" inputMode="decimal" value={sbr} onChange={(e) => setSbr(num(e.target.value))} placeholder={unit === "mgdl" ? "15.2" : "260"} data-nj="sbr" /></label>
        <div className="cx-field"><span>Unit</span><div className="cx-seg" role="radiogroup" aria-label="Unit">{([["mgdl", "mg/dL"], ["umol", "µmol/L"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={unit === v} className={unit === v ? "on" : ""} onClick={() => setUnit(v)} data-nj-unit={v}>{l}</button>)}</div></div>
      </div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Earlier bilirubin (optional)</span><input className="cx-input" inputMode="decimal" value={prev} onChange={(e) => setPrev(num(e.target.value))} data-nj="prev" /></label>
        <label className="cx-field"><span>at age (hours)</span><input className="cx-input" inputMode="numeric" value={prevH} onChange={(e) => setPrevH(e.target.value.replace(/\D/g, "").slice(0, 3))} data-nj="prevh" /></label>
      </div>
      <div className="cx-c23-row">{JAUNDICE_RISK.map((r) => <label key={r} className="cx-pa-mine"><input type="checkbox" checked={risk.includes(r)} onChange={() => setRisk(risk.includes(r) ? risk.filter((x) => x !== r) : [...risk, r])} /> {r}</label>)}</div>
      {out ? (
        <div className={`cx-cmp-out cx-nnj-${out.level}`} data-nj="out" data-level={out.level}>
          <h3 className="cx-lab-h3" data-nj="text">{out.text}</h3>
          <div className="cx-sim-stats">
            <div><b>{Math.round(u)} µmol/L</b><small>{toMgdl(u)} mg/dL</small></div>
            <div><b data-nj="photo">{both(out.photo)}</b><small>phototherapy threshold</small></div>
            <div><b>{both(out.exchange)}</b><small>exchange threshold</small></div>
          </div>
          <ul>{out.actions.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Lightbulb size={20} /></span><h3>Enter the age, gestation and bilirubin</h3><p>Use a serum (or transcutaneous under 250 µmol/L) value.</p></div>}
      <details className="cx-c23-scroll"><summary>NICE thresholds, 38 weeks or more</summary>
        <table className="cx-c23-table"><thead><tr><th>Age (h)</th><th>Phototherapy (µmol/L)</th><th>Exchange (µmol/L)</th></tr></thead><tbody>{NICE_TERM.map(([h, p, e]) => <tr key={h}><td>{h}{h === 96 ? "+" : ""}</td><td>{p} <small>({toMgdl(p)})</small></td><td>{e} <small>({toMgdl(e)})</small></td></tr>)}</tbody></table>
      </details>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> NICE CG98 thresholds. Do not use visual inspection alone; for babies under 38 weeks use the gestation-specific chart before 72 hours. Under 35 weeks or unwell babies: follow the neonatal unit.</p>
    </section>
  );
}
