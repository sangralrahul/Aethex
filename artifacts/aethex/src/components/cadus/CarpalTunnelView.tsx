/**
 * Carpal Tunnel Syndrome: typical features, severity and treatment from splint to surgery.
 */
import { useState } from "react";
import { Hand, TriangleAlert } from "lucide-react";
import { CTS_SIGNS, ctsPlan } from "@/lib/cadus/clinic44";

export default function CarpalTunnelView() {
  const [signs, setSigns] = useState<boolean[]>(CTS_SIGNS.map(() => false));
  const [sev, setSev] = useState<"mild" | "moderate" | "severe">("mild");
  const [preg, setPreg] = useState(false);
  const [months, setMonths] = useState("");
  const count = signs.slice(0, 4).filter(Boolean).length;
  const auto = signs[5] || signs[4] ? "severe" : sev;
  return (
    <section className="cx-page cx-lab cx-carpal">
      <header className="cx-page-h"><div><h1>Carpal Tunnel Syndrome</h1><p>Recognise median nerve compression at the wrist, look for a cause, and treat by severity.</p></div></header>
      <div className="cx-imaging-ticks">{CTS_SIGNS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={signs[i]} onChange={(e) => setSigns(signs.map((y, j) => (j === i ? e.target.checked : y)))} data-cts-s={i} /> {t}</label>)}</div>
      <p className="cx-set-hint" data-cts="likely">{count >= 3 ? "Typical carpal tunnel syndrome." : count >= 1 ? "Possible carpal tunnel syndrome: consider nerve conduction studies if unsure." : "Tick the features present."}</p>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Severity</span><select className="cx-select" value={auto} onChange={(e) => setSev(e.target.value as typeof sev)} data-cts="sev" disabled={signs[5] || signs[4]}><option value="mild">Mild (intermittent tingling)</option><option value="moderate">Moderate (constant numbness)</option><option value="severe">Severe (weakness or wasting)</option></select></label>
        <label className="cx-field"><span>Months of symptoms</span><input className="cx-input" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, "").slice(0, 3))} data-cts="months" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={preg} onChange={(e) => setPreg(e.target.checked)} data-cts="preg" /> Pregnant</label>
      </div>
      <ol className="cx-c23-steps" data-cts="plan">{ctsPlan(auto, preg, Number(months) || 0).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Hand size={13} /> AAOS carpal tunnel guideline 2024, NICE CKS. <TriangleAlert size={13} /> Sudden severe symptoms after a wrist injury: acute carpal tunnel syndrome needs urgent surgical review.</p>
    </section>
  );
}
