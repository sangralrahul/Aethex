/**
 * Kawasaki Disease: complete and incomplete criteria (AHA 2017), supplementary labs, IVIG and
 * aspirin by weight, and follow-up.
 */
import { useState } from "react";
import { Baby, Printer, TriangleAlert } from "lucide-react";
import { KD_CRITERIA, KD_LABS, kawasaki, kdTreatment } from "@/lib/cadus/clinic38";

export default function KawasakiView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [days, setDays] = useState("");
  const [crit, setCrit] = useState<number[]>([]);
  const [labs, setLabs] = useState<number[]>([]);
  const [crp, setCrp] = useState("");
  const [esr, setEsr] = useState("");
  const [echo, setEcho] = useState(false);
  const [kg, setKg] = useState("");
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const r = kawasaki(Number(days) || 0, crit.length, crp ? Number(crp) : null, esr ? Number(esr) : null, labs.length, echo);
  const treat = r.result === "complete" || r.result === "incomplete-treat";
  return (
    <section className="cx-page cx-lab cx-kawasaki">
      <header className="cx-page-h"><div><h1>Kawasaki Disease</h1><p>Complete and incomplete Kawasaki disease from the AHA criteria, and IVIG and aspirin by weight with echo follow-up.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Days of fever</span><input className="cx-input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="5" data-kd="days" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="15" data-kd="kg" /></label>
        <label className="cx-field"><span>CRP (mg/dL)</span><input className="cx-input" inputMode="decimal" value={crp} onChange={(e) => setCrp(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="6" data-kd="crp" /></label>
        <label className="cx-field"><span>ESR (mm/h)</span><input className="cx-input" inputMode="numeric" value={esr} onChange={(e) => setEsr(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="50" data-kd="esr" /></label>
      </div>
      <div className="cx-c23-two">
        <div><h4>Principal features</h4><div className="cx-imaging-ticks">{KD_CRITERIA.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={crit.includes(i)} onChange={() => tg(crit, setCrit, i)} data-kd-c={i} /> {x}</label>)}</div></div>
        <div><h4>Supplementary labs</h4><div className="cx-imaging-ticks">{KD_LABS.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={labs.includes(i)} onChange={() => tg(labs, setLabs, i)} data-kd-l={i} /> {x}</label>)}</div>
          <label className="cx-pa-mine"><input type="checkbox" checked={echo} onChange={(e) => setEcho(e.target.checked)} data-kd="echo" /> Echo shows coronary changes</label></div>
      </div>
      <div className={`cx-cmp-out ${treat ? "cx-st-out" : r.result === "evaluate" ? "cx-ac-high" : "cx-ac-in"}`} data-kd="out" data-result={r.result}>
        <h3 className="cx-lab-h3">{r.text}</h3>
        {treat && <><ol className="cx-c23-steps">{kdTreatment(Number(kg) || 0).map((s) => <li key={s}>{s}</li>)}</ol><div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Kawasaki treatment", ["# Kawasaki disease", "", ...kdTreatment(Number(kg) || 0).map((s) => `- ${s}`)].join("\n"))} data-kd="print"><Printer size={14} /> Print</button></div></>}
      </div>
      <p className="cx-rs-foot"><Baby size={13} /> AHA 2017 Kawasaki disease statement, IAP. <TriangleAlert size={13} /> Infants under 6 months often have incomplete features: have a low threshold for echo.</p>
    </section>
  );
}
