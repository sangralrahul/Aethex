/**
 * Bell's Palsy & Facial Weakness: red flags for other causes, steroids and antivirals, eye care,
 * House–Brackmann grade and follow-up.
 */
import { useState } from "react";
import { Smile, TriangleAlert } from "lucide-react";
import { BELL_RED, bellPlan, HOUSE_BRACKMANN } from "@/lib/cadus/clinic38";

export default function BellView() {
  const [hours, setHours] = useState("24");
  const [red, setRed] = useState<number[]>([]);
  const [child, setChild] = useState(false);
  const [kg, setKg] = useState("");
  const [hb, setHb] = useState(3);
  const ramsay = red.includes(2);
  const plan = bellPlan(Number(hours) || 0, red.filter((i) => i !== 2).length, ramsay, child, Number(kg) || 0);
  return (
    <section className="cx-page cx-lab cx-bell">
      <header className="cx-page-h"><div><h1>Bell's Palsy &amp; Facial Weakness</h1><p>Rule out a stroke or other cause, give steroids within 72 hours, protect the eye, and follow up.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Hours since onset</span><input className="cx-input" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, "").slice(0, 4))} data-bl="hours" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-bl="child" /> Child</label>
        {child && <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} data-bl="kg" /></label>}
        <label className="cx-field"><span>House–Brackmann grade</span><select className="cx-select" value={hb} onChange={(e) => setHb(Number(e.target.value))} data-bl="hb">{HOUSE_BRACKMANN.map((g, i) => <option key={g} value={i + 1}>{g}</option>)}</select></label>
      </div>
      <h4>Red flags</h4>
      <div className="cx-imaging-ticks">{BELL_RED.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={red.includes(i)} onChange={() => setRed(red.includes(i) ? red.filter((y) => y !== i) : [...red, i])} data-bl-red={i} /> {x}</label>)}</div>
      <div className={`cx-cmp-out ${plan[0].startsWith("Red flag") ? "cx-st-out" : "cx-ac-in"}`} data-bl="out"><ol className="cx-c23-steps">{plan.map((s) => <li key={s}>{s}</li>)}</ol>{hb >= 5 && !plan[0].startsWith("Red flag") && <p><b>Grade {hb === 5 ? "V" : "VI"}: severe; recovery is less likely to be complete: early ENT review.</b></p>}</div>
      <p className="cx-rs-foot"><Smile size={13} /> AAO-HNS 2013 Bell's palsy guideline, NICE CKS. <TriangleAlert size={13} /> A weak face with a moving forehead is a stroke until proven otherwise.</p>
    </section>
  );
}
