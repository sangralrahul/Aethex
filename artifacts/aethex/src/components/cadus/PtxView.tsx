/**
 * Pneumothorax & Chest Drain: the BTS 2023 pathway (conservative, aspiration, ambulatory device or
 * drain), tension, and a step-by-step chest drain guide.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import { DRAIN_STEPS, PTX_HIGH_RISK, ptxPlan } from "@/lib/cadus/clinic34";

export default function PtxView() {
  const [tab, setTab] = useState<"path" | "drain">("path");
  const [secondary, setSecondary] = useState(false);
  const [symptomatic, setSymptomatic] = useState(true);
  const [tension, setTension] = useState(false);
  const [size, setSize] = useState("");
  const [hr, setHr] = useState<string[]>([]);
  const p = ptxPlan({ secondary, symptomatic, size: size === "" ? null : Number(size), highRisk: hr, tension });

  return (
    <section className="cx-page cx-lab cx-ptx">
      <header className="cx-page-h"><div><h1>Pneumothorax &amp; Chest Drain</h1><p>The BTS 2023 pathway (conservative care, aspiration, ambulatory device or drain), tension pneumothorax, and inserting and managing a chest drain.</p></div></header>
      <div className="cx-seg" role="tablist">{([["path", "Management"], ["drain", "Chest drain"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-px-tab={k}>{l}</button>)}</div>
      {tab === "path" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={tension} onChange={(e) => setTension(e.target.checked)} data-px="tension" /> Signs of tension (hypotension, tracheal shift, rising pressures)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={secondary} onChange={(e) => setSecondary(e.target.checked)} data-px="secondary" /> Secondary (underlying lung disease, or 50+ and smoker)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={symptomatic} onChange={(e) => setSymptomatic(e.target.checked)} data-px="symptomatic" /> Breathless or in significant pain</label>
            <label className="cx-field"><span>Rim at the hilum (cm)</span><input className="cx-input" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-px="size" /></label>
          </div>
          <h4>High-risk features</h4>
          <div className="cx-c23-row">{PTX_HIGH_RISK.map((r, i) => <label key={r} className="cx-pa-mine"><input type="checkbox" checked={hr.includes(r)} onChange={() => setHr(hr.includes(r) ? hr.filter((x) => x !== r) : [...hr, r])} data-px-hr={i} /> {r}</label>)}</div>
          <div className={`cx-cmp-out ${tension ? "cx-st-out" : p.action === "Chest drain" ? "cx-ac-high" : "cx-ac-in"}`} data-px="out"><h3 className="cx-lab-h3" data-px="action">{p.action}</h3><ul>{p.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>
          <p className="cx-set-hint">After recovery: stop smoking (it greatly increases recurrence); no flying for a week after X-ray resolution; no diving unless after surgical pleurodesis; recurrence or persistent leak: thoracic surgery.</p>
        </>
      ) : <ol className="cx-c23-steps" data-px="drain">{DRAIN_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>}
      <p className="cx-rs-foot"><Wind size={13} /> BTS 2023 pleural disease guideline and ATLS 10th edition. <TriangleAlert size={13} /> Do not insert a drain without image guidance for an effusion; never clamp a bubbling drain.</p>
    </section>
  );
}
