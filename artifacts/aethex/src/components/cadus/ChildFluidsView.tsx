/**
 * Child Fluids & Dehydration: WHO dehydration assessment with plans A, B and C, maintenance fluids
 * (Holliday–Segar), deficit replacement and the shock bolus.
 */
import { useState } from "react";
import { GlassWater, Printer, TriangleAlert } from "lucide-react";
import { bolus, deficit, DEHYD_SEVERE, DEHYD_SOME, maintenance, planA, planB, planC, whoDehydration } from "@/lib/cadus/clinic35";

export default function ChildFluidsView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [kg, setKg] = useState("");
  const [age, setAge] = useState("");
  const [sev, setSev] = useState<string[]>([]);
  const [some, setSome] = useState<string[]>([]);
  const [pct, setPct] = useState("5");
  const [hyperNa, setHyperNa] = useState(false);
  const w = Number(kg) || 0, ay = Number(age) || 0;
  const level = whoDehydration(sev.length, some.length);
  const m = maintenance(w);
  const d = deficit(w, Number(pct) || 0, hyperNa);
  const c = planC(w, ay);
  const tg = (list: string[], set: (l: string[]) => void, x: string) => set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const plan = level === "severe" ? [`Plan C: ${c.first}, ${c.second} (total ${c.total} ml).`, "Reassess every 15–30 minutes; give ORS (5 ml/kg/hour) as soon as the child can drink.", "Reclassify after 6 hours (infants) or 3 hours (older children)."] : level === "some" ? [`Plan B: ${planB(w).text}`, ...planA(ay).slice(1)] : planA(ay);
  const md = () => ["# Fluid plan", "", `- Weight ${w} kg, age ${ay} years`, `- Dehydration: **${level}**`, ...plan.map((p) => `- ${p}`), "", `- Maintenance: ${m.perDay} ml/day (${m.perHour} ml/hour)`].join("\n");

  return (
    <section className="cx-page cx-lab cx-childfluids">
      <header className="cx-page-h"><div><h1>Child Fluids &amp; Dehydration</h1><p>WHO dehydration assessment with plans A, B and C, maintenance fluids, deficit replacement and the shock bolus, by weight.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="12" data-cf="kg" /></label>
        <label className="cx-field"><span>Age (years; 0.5 for 6 months)</span><input className="cx-input" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="2" data-cf="age" /></label>
      </div>
      <div className="cx-c23-two">
        <div><h4>Severe dehydration signs</h4><div className="cx-imaging-ticks">{DEHYD_SEVERE.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={sev.includes(x)} onChange={() => tg(sev, setSev, x)} data-cf-sev={i} /> {x}</label>)}</div></div>
        <div><h4>Some dehydration signs</h4><div className="cx-imaging-ticks">{DEHYD_SOME.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={some.includes(x)} onChange={() => tg(some, setSome, x)} data-cf-some={i} /> {x}</label>)}</div></div>
      </div>
      {w > 0 && (
        <div className={`cx-cmp-out ${level === "severe" ? "cx-st-out" : level === "some" ? "cx-ac-high" : "cx-ac-in"}`} data-cf="out" data-level={level}>
          <h3 className="cx-lab-h3">{level === "severe" ? "Severe dehydration" : level === "some" ? "Some dehydration" : "No dehydration"}</h3>
          <ul>{plan.map((p) => <li key={p}>{p}</li>)}</ul>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Fluid plan", md())}><Printer size={14} /> Print</button></div>
        </div>
      )}
      {w > 0 && (
        <>
          <h4>Maintenance (Holliday–Segar)</h4>
          <p className="cx-set-hint" data-cf="maint"><b>{m.perDay} ml a day = {m.perHour} ml/hour</b> of 0.9% saline with 5% dextrose (isotonic). Restrict to two-thirds in meningitis, pneumonia or raised ADH risk; check sodium and glucose daily.</p>
          <h4>Deficit replacement (IV, if not on plan C)</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Estimated deficit (%)</span><select className="cx-select" value={pct} onChange={(e) => setPct(e.target.value)} data-cf="pct"><option value="3">3%</option><option value="5">5%</option><option value="7">7%</option><option value="10">10%</option></select></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={hyperNa} onChange={(e) => setHyperNa(e.target.checked)} data-cf="na" /> Sodium over 150 (replace over 48 hours)</label>
          </div>
          <p className="cx-set-hint" data-cf="deficit"><b>Deficit {d.ml} ml over {d.hours} hours = {d.perHour} ml/hour, plus maintenance {m.perHour} ml/hour = {d.perHour + m.perHour} ml/hour.</b>{hyperNa ? " Lower sodium by no more than 10–12 mmol/L a day." : ""}</p>
          <div className="cx-cmp-out cx-st-out" data-cf="bolus"><p>{bolus(w)}</p></div>
        </>
      )}
      <p className="cx-set-hint">Severe acute malnutrition: do not use these plans; use ReSoMal and slow IV fluids only for shock (see the SAM tool).</p>
      <p className="cx-rs-foot"><GlassWater size={13} /> WHO/IMNCI diarrhoea plans, NICE NG29 IV fluids in children. <TriangleAlert size={13} /> Weigh the child; reassess often; stop IV fluids once they can drink.</p>
    </section>
  );
}
