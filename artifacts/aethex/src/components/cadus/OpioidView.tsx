/**
 * Opioid Conversion & Palliative Infusions: oral morphine equivalents, switching between opioids
 * and patches with a cross-tolerance reduction, breakthrough doses, and a 24-hour syringe driver.
 */
import { useState } from "react";
import { Printer, Syringe, TriangleAlert } from "lucide-react";
import { convertOpioid, OPIOIDS, syringeDriver, toOme } from "@/lib/cadus/clinic38";

const ADDS: [string, string][] = [["agitation", "Agitation"], ["nausea", "Nausea"], ["secretions", "Secretions"], ["breathlessness", "Breathlessness"], ["cyclizine", "Cyclizine instead of haloperidol"]];

export default function OpioidView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [from, setFrom] = useState("oxycodone-po");
  const [dose, setDose] = useState("");
  const [to, setTo] = useState("morphine-po");
  const [red, setRed] = useState("25");
  const [adds, setAdds] = useState<string[]>([]);
  const fromO = OPIOIDS.find((o) => o.id === from)!;
  const c = dose ? convertOpioid(from, Number(dose), to, Number(red)) : null;
  const sd = syringeDriver(dose ? toOme(from, Number(dose)) : 0, adds);

  return (
    <section className="cx-page cx-lab cx-opioid">
      <header className="cx-page-h"><div><h1>Opioid Conversion &amp; Palliative Infusions</h1><p>Convert between opioids and patches using oral morphine equivalents, set breakthrough doses, and build a 24-hour syringe driver.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Current opioid</span><select className="cx-select" value={from} onChange={(e) => setFrom(e.target.value)} data-op="from">{OPIOIDS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
        <label className="cx-field"><span>Total dose ({fromO.unit})</span><input className="cx-input" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value.replace(/[^\d.]/g, "").slice(0, 6))} placeholder="40" data-op="dose" /></label>
        <label className="cx-field"><span>Switch to</span><select className="cx-select" value={to} onChange={(e) => setTo(e.target.value)} data-op="to">{OPIOIDS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
        <label className="cx-field"><span>Reduce for cross-tolerance</span><select className="cx-select" value={red} onChange={(e) => setRed(e.target.value)} data-op="red"><option value="0">0%</option><option value="25">25%</option><option value="33">33%</option><option value="50">50%</option></select></label>
      </div>
      {c && (
        <div className="cx-cmp-out cx-ac-high" data-op="out">
          <h3 className="cx-lab-h3">{OPIOIDS.find((o) => o.id === to)!.label}: {c.target} {c.unit}</h3>
          <p>Oral morphine equivalent {c.ome} mg/24 h.</p><p><b>{c.breakthrough}</b></p>
          <ul>{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      )}
      <h4>Syringe driver (24 hours, subcutaneous)</h4>
      <div className="cx-c23-row">{ADDS.map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={adds.includes(k)} onChange={() => setAdds(adds.includes(k) ? adds.filter((x) => x !== k) : [...adds, k])} data-op-add={k} /> {l}</label>)}</div>
      <div className="cx-cmp-out" data-op="driver"><ul>{sd.lines.map((l) => <li key={l}>{l}</li>)}</ul><p>{sd.diluent}</p></div>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Opioid plan", ["# Opioid plan", "", ...(c ? [`- Switch: ${c.target} ${c.unit} (OME ${c.ome} mg/24 h)`, `- ${c.breakthrough}`, ...c.notes.map((n) => `- ${n}`)] : []), "", "## Syringe driver", ...sd.lines.map((l) => `- ${l}`), `- ${sd.diluent}`].join("\n"))} data-op="print"><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><Syringe size={13} /> Palliative Care Formulary (PCF) conversion ratios. <TriangleAlert size={13} /> Ratios are approximate: reduce in frail, kidney or liver failure; review within 24 hours. Morphine prescriptions follow the NDPS Act rules.</p>
    </section>
  );
}
