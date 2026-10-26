/**
 * Contrast Safety: kidney risk and IV fluids, metformin, premedication after a previous reaction,
 * managing reactions, gadolinium, and pregnancy.
 */
import { useState } from "react";
import { ScanLine, TriangleAlert } from "lucide-react";
import { contrastKidney, CONTRAST_REACTIONS, premedication } from "@/lib/cadus/clinic40";

export default function ContrastView() {
  const [egfr, setEgfr] = useState("");
  const [aki, setAki] = useState(false);
  const [dial, setDial] = useState(false);
  const [met, setMet] = useState(false);
  const [prior, setPrior] = useState<"none" | "mild" | "severe">("none");
  const [urgent, setUrgent] = useState(false);
  return (
    <section className="cx-page cx-lab cx-contrast">
      <header className="cx-page-h"><div><h1>Contrast Safety</h1><p>Before a contrast scan: kidney risk and fluids, metformin, premedication after a previous reaction, and how to treat a reaction.</p></div></header>
      <h4>Kidneys</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>eGFR</span><input className="cx-input" inputMode="numeric" value={egfr} onChange={(e) => setEgfr(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="55" data-ct="egfr" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={aki} onChange={(e) => setAki(e.target.checked)} data-ct="aki" /> Acute kidney injury</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={dial} onChange={(e) => setDial(e.target.checked)} data-ct="dial" /> On dialysis</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={met} onChange={(e) => setMet(e.target.checked)} data-ct="met" /> On metformin</label>
      </div>
      <ul data-ct="kidney">{contrastKidney(egfr ? Number(egfr) : null, aki, dial, met).map((s) => <li key={s}>{s}</li>)}</ul>
      <h4>Previous reaction to contrast</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Previous reaction</span><select className="cx-select" value={prior} onChange={(e) => setPrior(e.target.value as typeof prior)} data-ct="prior"><option value="none">None</option><option value="mild">Mild or moderate (rash, wheeze)</option><option value="severe">Severe (anaphylaxis)</option></select></label>
        {prior !== "none" && <label className="cx-pa-mine"><input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} data-ct="urgent" /> Scan needed urgently</label>}
      </div>
      {prior === "none" ? <p className="cx-set-hint">No premedication needed (shellfish or iodine 'allergy' is not a reason).</p> : <div className={`cx-cmp-out ${prior === "severe" ? "cx-st-out" : "cx-ac-high"}`} data-ct="premed"><ul>{premedication(urgent, prior === "severe").map((s) => <li key={s}>{s}</li>)}</ul></div>}
      <h4>If a reaction happens</h4><ul>{CONTRAST_REACTIONS.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><ScanLine size={13} /> ACR Manual on Contrast Media 2024, ESUR 2018, RCR. <TriangleAlert size={13} /> Never withhold a life-saving scan because of contrast risk.</p>
    </section>
  );
}
